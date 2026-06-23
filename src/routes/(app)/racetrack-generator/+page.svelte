<script lang="ts">
	import { onMount, tick } from "svelte";
	import * as THREE from "three";
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

	// State
	let viewMode = $state<"split" | "2d-only" | "3d-only">("split");
	let trackType = $state<"dirt" | "turf">("dirt");

	// Default track points (a simple oval)
	let points = $state([
		{ x: 100, y: 100 },
		{ x: 400, y: 100 },
		{ x: 450, y: 250 },
		{ x: 400, y: 400 },
		{ x: 100, y: 400 },
		{ x: 50, y: 250 },
	]);

	// 2D Editor State
	let draggingIndex = $state<number | null>(null);
	let selectedPointIndex = $state<number | null>(null);
	let trackCurvePoints2D = $state<{ x: number; y: number }[]>([]);
	let svgElement: SVGSVGElement;

	let svgPath = $derived(
		points.length > 0
			? `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")} Z`
			: "",
	);

	let trackCurvePath = $derived(
		trackCurvePoints2D.length > 0
			? `M ${trackCurvePoints2D.map((p) => `${p.x},${p.y}`).join(" L ")} Z`
			: "",
	);

	// Zoom and Pan State
	let zoom = $state(1.0);
	let panX = $state(0);
	let panY = $state(0);
	let isPanning = $state(false);
	let startPointerPos = { x: 0, y: 0 };
	let startPan = { x: 0, y: 0 };

	// Schematic Card Zoom and Pan State
	let schematicZoom = $state(1.0);
	let schematicPanX = $state(0);
	let schematicPanY = $state(0);
	let schematicIsPanning = $state(false);
	let schematicStartPointerPos = { x: 0, y: 0 };
	let schematicStartPan = { x: 0, y: 0 };
	let schematicSvgElement = $state<SVGSVGElement>();
	let schematicCardContainer = $state<HTMLDivElement>();

	let schematicViewBox = $derived.by(() => {
		const vbWidth = 500 / schematicZoom;
		const vbHeight = 500 / schematicZoom;
		const minX = 250 + schematicPanX - vbWidth / 2;
		const minY = 250 + schematicPanY - vbHeight / 2;
		return `${minX} ${minY} ${vbWidth} ${vbHeight}`;
	});

	function handleSchematicSvgPointerDown(e: PointerEvent) {
		schematicIsPanning = true;
		schematicStartPointerPos = { x: e.clientX, y: e.clientY };
		schematicStartPan = { x: schematicPanX, y: schematicPanY };
		if (schematicSvgElement) {
			schematicSvgElement.setPointerCapture(e.pointerId);
		}
	}

	function handleSchematicPointerMove(e: PointerEvent) {
		if (schematicIsPanning && schematicSvgElement) {
			const dx = e.clientX - schematicStartPointerPos.x;
			const dy = e.clientY - schematicStartPointerPos.y;
			const scale =
				500 / (schematicSvgElement.clientWidth * schematicZoom);
			schematicPanX = Math.max(
				-300,
				Math.min(300, schematicStartPan.x - dx * scale),
			);
			schematicPanY = Math.max(
				-300,
				Math.min(300, schematicStartPan.y - dy * scale),
			);
		}
	}

	function handleSchematicPointerUp(e: PointerEvent) {
		schematicIsPanning = false;
		if (schematicSvgElement) {
			try {
				schematicSvgElement.releasePointerCapture(e.pointerId);
			} catch (err) {}
		}
	}

	let isDownloading = $state(false);

	async function downloadSchematicCard() {
		if (!schematicCardContainer || isDownloading) return;
		isDownloading = true;

		const originalTab = activeLapTab;
		const originalZoom = schematicZoom;
		const originalPanX = schematicPanX;
		const originalPanY = schematicPanY;

		try {
			const htmlToImage = await import("html-to-image");

			const filter = (node: HTMLElement | Node) => {
				if (
					node &&
					"hasAttribute" in node &&
					typeof node.hasAttribute === "function"
				) {
					if (node.hasAttribute("data-html2canvas-ignore")) {
						return false;
					}
				}
				return true;
			};

			const captureOptions = {
				pixelRatio: 2,
				filter: filter,
				skipFonts: true,
				fontEmbedCSS: "",
				backgroundColor: "#f3f4f6",
			};

			// Reset zoom/pan for capture
			schematicZoom = 0.95;
			schematicPanX = 0;
			schematicPanY = 0;

			const dataUrls: string[] = [];
			const tabsToCapture: ("all" | "lap1" | "lap2" | "lap3")[] = [];

			if (lapsCount === 1) {
				tabsToCapture.push("all");
			} else {
				tabsToCapture.push("lap1");
				if (lapsCount > 1) tabsToCapture.push("lap2");
				if (lapsCount > 2) tabsToCapture.push("lap3");
			}

			for (const tab of tabsToCapture) {
				activeLapTab = tab;
				await tick();
				await new Promise((r) => setTimeout(r, 200)); // wait for DOM & CSS transitions

				const dataUrl = await htmlToImage.toPng(
					schematicCardContainer,
					captureOptions,
				);
				dataUrls.push(dataUrl);
			}

			// Combine images
			const images = await Promise.all(
				dataUrls.map((url) => {
					return new Promise<HTMLImageElement>((resolve, reject) => {
						const img = new Image();
						img.onload = () => resolve(img);
						img.onerror = reject;
						img.src = url;
					});
				}),
			);

			const canvas = document.createElement("canvas");
			const gap = 30; // 30px vertical gap between lap cards
			const width = Math.max(...images.map((img) => img.width));
			const height =
				images.reduce((acc, img) => acc + img.height, 0) +
				(images.length - 1) * gap;

			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.fillStyle = "#ffffff"; // White background for the grid container
				ctx.fillRect(0, 0, width, height);

				let currentY = 0;
				for (const img of images) {
					const x = (width - img.width) / 2;
					ctx.drawImage(img, x, currentY);
					currentY += img.height + gap;
				}

				const combinedDataUrl = canvas.toDataURL("image/png");
				const link = document.createElement("a");
				link.href = combinedDataUrl;
				link.download = `racetrack_schematic_all_laps_${trackLength}m_${Date.now()}.png`;
				link.click();
			}
		} catch (err) {
			console.error("Failed to generate image:", err);
		} finally {
			// Restore state
			activeLapTab = originalTab;
			schematicZoom = originalZoom;
			schematicPanX = originalPanX;
			schematicPanY = originalPanY;
			isDownloading = false;
		}
	}

	// ─── JSON Export / Import ────────────────────────────────────────────────────
	function exportJSON() {
		const data = {
			version: 1,
			meta: {
				exportedAt: new Date().toISOString(),
				app: "Hashire Racetrack Generator",
			},
			track: {
				points,
				trackType,
				trackLength,
				lapsCount,
				trackDirection,
				startLineDist,
				finishLineDist,
				positionKeepEnds,
				spurtStarts,
				segments: segments.map((s) => ({
					id: s.id,
					type: s.type,
					name: s.name,
					startDist: s.startDist,
					endDist: s.endDist,
				})),
			},
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `racetrack_${trackLength}m_${Date.now()}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	let importFileInput: HTMLInputElement;
	let importError = $state("");

	function triggerImport() {
		importError = "";
		importFileInput?.click();
	}

	async function handleImportFile(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input?.files?.[0];
		if (!file) return;
		try {
			const text = await file.text();
			const data = JSON.parse(text);
			if (!data?.track) throw new Error("Invalid racetrack JSON format.");
			const t = data.track;
			// Validate required fields
			if (!Array.isArray(t.points) || t.points.length < 3)
				throw new Error("Missing or invalid points array.");
			// Restore state
			points = t.points;
			trackType = t.trackType ?? trackType;
			trackLength = t.trackLength ?? trackLength;
			lapsCount = t.lapsCount ?? lapsCount;
			trackDirection = t.trackDirection ?? trackDirection;
			startLineDist = t.startLineDist ?? startLineDist;
			finishLineDist = t.finishLineDist ?? finishLineDist;
			positionKeepEnds = t.positionKeepEnds ?? positionKeepEnds;
			spurtStarts = t.spurtStarts ?? spurtStarts;
			if (Array.isArray(t.segments)) segments = t.segments;
			// Rebuild 3D
			await tick();
			if (scene) update3DTrack();
			importError = "";
		} catch (err: unknown) {
			importError =
				err instanceof Error ? err.message : "Failed to read file.";
		} finally {
			input.value = "";
		}
	}

	// ─── Random Track Layout Generator ───────────────────────────────────────────
	function randomizeTrack() {
		// Step 1: Generate a randomised set of control points forming a closed loop.
		// Strategy: place N evenly-spaced points on an ellipse, perturb each one
		// radially so the shape is irregular but still convex-ish.
		const cx = 250,
			cy = 250;
		const numPts = 5 + Math.floor(Math.random() * 5); // 5 – 9 points
		const baseRx = 130 + Math.random() * 60; // 130–190
		const baseRy = 100 + Math.random() * 70; // 100–170

		const newPoints: { x: number; y: number }[] = [];
		for (let i = 0; i < numPts; i++) {
			const angle = (i / numPts) * Math.PI * 2 - Math.PI / 2;
			// Radial perturbation ±30% of radius
			const perturbX = 0.7 + Math.random() * 0.6;
			const perturbY = 0.7 + Math.random() * 0.6;
			newPoints.push({
				x: Math.round(cx + Math.cos(angle) * baseRx * perturbX),
				y: Math.round(cy + Math.sin(angle) * baseRy * perturbY),
			});
		}

		// Step 2: Compute a rough arc-length based on the polygon perimeter.
		let polyPerimeter = 0;
		for (let i = 0; i < newPoints.length; i++) {
			const a = newPoints[i];
			const b = newPoints[(i + 1) % newPoints.length];
			polyPerimeter += Math.hypot(b.x - a.x, b.y - a.y);
		}
		// SVG canvas ≈ 500px → scale poly perimeter to real-world meters.
		// A typical oval might be 1600–2400m; we target ~1600–2400m range.
		const metersPerPixel = (1600 + Math.random() * 800) / polyPerimeter;
		const newTrackLength =
			Math.round((polyPerimeter * metersPerPixel) / 100) * 100;

		// Step 3: Approximate the CatmullRom curve for curvature analysis.
		// We build a lightweight sample of the spline (100 points).
		const sampleCount = 100;
		const splinePts: { x: number; y: number }[] = [];
		for (let si = 0; si < sampleCount; si++) {
			const u = si / sampleCount;
			const idx = Math.floor(u * numPts);
			const t = u * numPts - idx;
			const p0 = newPoints[(idx - 1 + numPts) % numPts];
			const p1 = newPoints[idx];
			const p2 = newPoints[(idx + 1) % numPts];
			const p3 = newPoints[(idx + 2) % numPts];
			// Catmull-Rom formula
			const t2 = t * t,
				t3 = t2 * t;
			splinePts.push({
				x:
					0.5 *
					(2 * p1.x +
						(-p0.x + p2.x) * t +
						(2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
						(-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
				y:
					0.5 *
					(2 * p1.y +
						(-p0.y + p2.y) * t +
						(2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
						(-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
			});
		}

		// Step 4: Compute signed curvature at each sample using a 3-point formula.
		// high abs(curvature) → corner; low → straight.
		const curvatures: number[] = splinePts.map((_, i) => {
			const prev = splinePts[(i - 1 + sampleCount) % sampleCount];
			const curr = splinePts[i];
			const next = splinePts[(i + 1) % sampleCount];
			const dx1 = curr.x - prev.x,
				dy1 = curr.y - prev.y;
			const dx2 = next.x - curr.x,
				dy2 = next.y - curr.y;
			const cross = dx1 * dy2 - dy1 * dx2;
			const len = Math.hypot(dx1, dy1) + Math.hypot(dx2, dy2) || 1;
			return Math.abs(cross) / (len * len);
		});

		// Step 5: Smooth curvatures (moving average window=5) to avoid noisy segments.
		const smoothed = curvatures.map((_, i) => {
			let sum = 0;
			for (let w = -2; w <= 2; w++)
				sum += curvatures[(i + w + sampleCount) % sampleCount];
			return sum / 5;
		});

		// Step 6: Threshold to classify each sample. Then run-length-encode.
		const maxCurv = Math.max(...smoothed);
		const threshold = maxCurv * 0.3; // bottom 30% of max → straight
		const isCorner = smoothed.map((v) => v > threshold);

		// Run-length encode into segment runs
		const runs: {
			type: "corner" | "straight";
			start: number;
			end: number;
		}[] = [];
		let current = isCorner[0] ? "corner" : "straight";
		let runStart = 0;
		for (let i = 1; i <= sampleCount; i++) {
			const kind =
				i < sampleCount ? (isCorner[i] ? "corner" : "straight") : "";
			if (kind !== current || i === sampleCount) {
				const minLen = (newTrackLength / sampleCount) * 3; // merge tiny runs (<3 samples)
				const segLen = ((i - runStart) / sampleCount) * newTrackLength;
				if (segLen >= minLen || runs.length === 0) {
					runs.push({
						type: current as "corner" | "straight",
						start: Math.round(
							(runStart / sampleCount) * newTrackLength,
						),
						end: Math.min(
							Math.round((i / sampleCount) * newTrackLength),
							newTrackLength,
						),
					});
				} else if (runs.length > 0) {
					// Merge short run into previous
					runs[runs.length - 1].end = Math.min(
						Math.round((i / sampleCount) * newTrackLength),
						newTrackLength,
					);
				}
				current = kind as "corner" | "straight";
				runStart = i;
			}
		}
		// Merge last run into first if they're the same type (closed loop)
		if (runs.length > 1 && runs[0].type === runs[runs.length - 1].type) {
			runs[0].start = runs[runs.length - 1].start;
			runs.pop();
		}

		// Step 7: Build named segments
		let straightCount = 1,
			cornerCount = 1;
		const straightNames = [
			"Home Straight",
			"Backstretch",
			"Far Straight",
			"Inner Straight",
		];
		const newSegments = runs.map((r, idx) => ({
			id: `seg_r${idx}`,
			type: r.type,
			name:
				r.type === "straight"
					? (straightNames[straightCount - 1] ??
						`Straight ${straightCount++}`)
					: `Corner ${cornerCount++}`,
			startDist: r.start,
			endDist: r.end,
		}));
		// Fix names with correct counts
		straightCount = 1;
		cornerCount = 1;
		newSegments.forEach((s) => {
			if (s.type === "straight")
				s.name =
					straightNames[straightCount - 1] ??
					`Straight ${straightCount}`;
			straightCount++;
			// corner names already assigned
		});

		// Step 8: Choose random race settings
		const newDirection: "clockwise" | "anticlockwise" =
			Math.random() > 0.5 ? "clockwise" : "anticlockwise";
		const newTrackType: "dirt" | "turf" =
			Math.random() > 0.5 ? "dirt" : "turf";
		const newLaps = Math.random() > 0.6 ? (Math.random() > 0.5 ? 2 : 3) : 1;
		const newStart = 0;
		const newFinish = newTrackLength;
		const newPkEnds = Math.round((newTrackLength * 0.24) / 50) * 50;
		const newSpurt = Math.round((newTrackLength * (2 / 3)) / 50) * 50;

		// Step 9: Commit all state
		points = newPoints;
		trackType = newTrackType;
		trackLength = newTrackLength;
		lapsCount = newLaps;
		trackDirection = newDirection;
		startLineDist = newStart;
		finishLineDist = newFinish;
		positionKeepEnds = newPkEnds;
		spurtStarts = newSpurt;
		segments = newSegments;

		// Rebuild 3D immediately
		if (scene) update3DTrack();
	}

	// Detailed Track Information Editor State
	let trackLength = $state(1800); // meters
	let lapsCount = $state(1); // default 1 lap
	let trackDirection = $state<"clockwise" | "anticlockwise">("clockwise");
	let startLineDist = $state(0); // meters
	let finishLineDist = $state(1800); // meters
	let positionKeepEnds = $state(432); // meters (24% of 1800)
	let spurtStarts = $state(1200); // meters (2/3 of 1800)
	let activeLapTab = $state<"all" | "lap1" | "lap2" | "lap3">("all");
	let totalMeters = $derived(
		activeLapTab === "all" ? trackLength * lapsCount : trackLength,
	);
	let lapOffset = $derived(
		activeLapTab === "all"
			? 0
			: activeLapTab === "lap1"
				? 0
				: activeLapTab === "lap2"
					? trackLength
					: trackLength * 2,
	);

	// Absolute Race Range & Spurt Distance Calculations
	let raceStartAbs = $derived(startLineDist);
	let raceEndAbs = $derived.by(() => {
		let end = (lapsCount - 1) * trackLength + finishLineDist;
		if (end < startLineDist) {
			end += trackLength;
		}
		return end;
	});

	let spurtAbs = $derived(
		Math.max(
			raceStartAbs + (2 * (raceEndAbs - raceStartAbs)) / 3,
			Math.min(raceEndAbs, (lapsCount - 1) * trackLength + spurtStarts),
		),
	);

	// Derived Timeline Pin properties for clean layout mapping
	let timelineStartPin = $derived.by(() => {
		if (activeLapTab === "all") {
			return {
				visible: true,
				percent: (raceStartAbs / trackLength) * 100,
				label: `${raceStartAbs}m`,
			};
		}
		const visible =
			raceStartAbs >= lapOffset &&
			raceStartAbs <= lapOffset + trackLength;
		const percent = ((raceStartAbs - lapOffset) / trackLength) * 100;
		return { visible, percent, label: `${raceStartAbs}m` };
	});

	let timelineFinishPin = $derived.by(() => {
		if (activeLapTab === "all") {
			return {
				visible: true,
				percent: ((raceEndAbs % trackLength) / trackLength) * 100,
				label: `${raceEndAbs}m`,
			};
		}
		const visible =
			raceEndAbs >= lapOffset && raceEndAbs <= lapOffset + trackLength;
		const percent = ((raceEndAbs - lapOffset) / trackLength) * 100;
		return { visible, percent, label: `${raceEndAbs}m` };
	});

	let timelinePkPin = $derived.by(() => {
		if (activeLapTab === "all") {
			return {
				visible: true,
				percent: ((positionKeepEnds % trackLength) / trackLength) * 100,
				label: `${positionKeepEnds}m`,
			};
		}
		const visible =
			positionKeepEnds >= lapOffset &&
			positionKeepEnds <= lapOffset + trackLength;
		const percent = ((positionKeepEnds - lapOffset) / trackLength) * 100;
		return { visible, percent, label: `${positionKeepEnds}m` };
	});

	let timelineSpurtPin = $derived.by(() => {
		if (activeLapTab === "all") {
			return {
				visible: true,
				percent: ((spurtAbs % trackLength) / trackLength) * 100,
				label: `${spurtAbs}m`,
			};
		}
		const visible =
			spurtAbs >= lapOffset && spurtAbs <= lapOffset + trackLength;
		const percent = ((spurtAbs - lapOffset) / trackLength) * 100;
		return { visible, percent, label: `${spurtAbs}m` };
	});

	// Dynamic base track path for schematic card
	let activeTrackPaths = $derived.by(() => {
		if (activeLapTab === "all") {
			return [trackCurvePath];
		}
		const lapIndex =
			activeLapTab === "lap1" ? 0 : activeLapTab === "lap2" ? 1 : 2;
		const offset = lapIndex * trackLength;
		const start = Math.max(raceStartAbs, offset);
		const end = Math.min(raceEndAbs, offset + trackLength);
		if (start < end) {
			return [getSubPath(start - offset, end - offset)];
		}
		return [];
	});

	// Helper for checking if a marker distance is within the active lap run window
	function isMarkerVisible(absDist: number) {
		if (activeLapTab === "all") return true;
		const lapIndex =
			activeLapTab === "lap1" ? 0 : activeLapTab === "lap2" ? 1 : 2;
		const offset = lapIndex * trackLength;
		const startAbs = Math.max(raceStartAbs, offset);
		const endAbs = Math.min(raceEndAbs, offset + trackLength);
		return absDist >= startAbs && absDist <= endAbs;
	}

	// Helper for checking if a relative loop distance (e.g. segment midpoint) is run
	function isLoopDistActive(midDist: number) {
		if (activeLapTab === "all") return true;
		const lapIndex =
			activeLapTab === "lap1" ? 0 : activeLapTab === "lap2" ? 1 : 2;
		const offset = lapIndex * trackLength;
		const startAbs = Math.max(raceStartAbs, offset);
		const endAbs = Math.min(raceEndAbs, offset + trackLength);
		if (startAbs >= endAbs) return false;
		const relStart = startAbs - offset;
		const relEnd = endAbs - offset;
		return midDist >= relStart && midDist <= relEnd;
	}

	// Segments: corners and straights
	interface TrackSegment {
		id: string;
		type: "straight" | "corner";
		name: string;
		startDist: number; // meters
		endDist: number; // meters
	}

	let segments = $state<TrackSegment[]>([
		{
			id: "seg1",
			type: "straight",
			name: "Home Straight",
			startDist: 0,
			endDist: 300,
		},
		{
			id: "seg2",
			type: "corner",
			name: "Corner 1",
			startDist: 300,
			endDist: 600,
		},
		{
			id: "seg3",
			type: "straight",
			name: "Backstretch",
			startDist: 600,
			endDist: 1100,
		},
		{
			id: "seg4",
			type: "corner",
			name: "Corner 2",
			startDist: 1100,
			endDist: 1400,
		},
		{
			id: "seg5",
			type: "straight",
			name: "Final Stretch",
			startDist: 1400,
			endDist: 1800,
		},
	]);

	// Hover states for visual highlighting
	let hoveredSegmentId = $state<string | null>(null);
	let hoveredPhase = $state<"early" | "mid" | "late" | "spurt" | null>(null);

	// Temp segment form state
	let newSegType = $state<"straight" | "corner">("straight");
	let newSegName = $state("");
	let newSegStart = $state(0);
	let newSegEnd = $state(200);

	// Helper to get 2D point and outward normal along the track curve
	function getPointAndNormalAtDistance(dist: number) {
		if (trackCurvePoints2D.length === 0) {
			return {
				point: { x: 250, y: 250 },
				normal: { x: 0, y: -1 },
				tangent: { x: 1, y: 0 },
			};
		}
		// Map distance (0 to trackLength) to u (0 to 1)
		const u = Math.max(0, Math.min(1, dist / trackLength));
		const len = trackCurvePoints2D.length;
		const index = Math.round(u * (len - 1));
		const point = trackCurvePoints2D[index];

		// Calculate tangent using neighbors in trackCurvePoints2D
		const idxPrev = (index - 1 + len) % len;
		const idxNext = (index + 1) % len;
		const ptPrev = trackCurvePoints2D[idxPrev];
		const ptNext = trackCurvePoints2D[idxNext];
		const tx = ptNext.x - ptPrev.x;
		const ty = ptNext.y - ptPrev.y;
		const tLen = Math.sqrt(tx * tx + ty * ty) || 1;
		const tangent = { x: tx / tLen, y: ty / tLen };

		// Perpendicular normal choices
		const n1 = { x: -tangent.y, y: tangent.x };
		const n2 = { x: tangent.y, y: -tangent.x };

		// Calculate centroid of points to determine "center"
		let sumX = 0;
		let sumY = 0;
		for (const p of points) {
			sumX += p.x;
			sumY += p.y;
		}
		const cx = points.length > 0 ? sumX / points.length : 250;
		const cy = points.length > 0 ? sumY / points.length : 250;

		// Direction from center to point
		const dx = point.x - cx;
		const dy = point.y - cy;

		// Choose the normal that points away from center (dot product > 0)
		const dot1 = n1.x * dx + n1.y * dy;
		const normal = dot1 > 0 ? n1 : n2;

		return { point, normal, tangent };
	}

	// Helper to get SVG path representation of a sub-segment
	function getSubPath(startDist: number, endDist: number) {
		if (trackCurvePoints2D.length === 0) return "";
		const uStart = Math.max(0, Math.min(1, startDist / trackLength));
		const uEnd = Math.max(0, Math.min(1, endDist / trackLength));

		const len = trackCurvePoints2D.length;
		const startIndex = Math.round(uStart * (len - 1));
		const endIndex = Math.round(uEnd * (len - 1));

		let subPoints: { x: number; y: number }[] = [];
		if (startIndex <= endIndex) {
			subPoints = trackCurvePoints2D.slice(startIndex, endIndex + 1);
		} else {
			// Wraps around the end of the loop
			subPoints = [
				...trackCurvePoints2D.slice(startIndex),
				...trackCurvePoints2D.slice(0, endIndex + 1),
			];
		}

		if (subPoints.length === 0) return "";
		return `M ${subPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`;
	}

	function getPerpendicularLine(dist: number, width: number) {
		const info = getPointAndNormalAtDistance(dist);
		if (!info.point) return { x1: 250, y1: 250, x2: 250, y2: 250 };
		const pt = info.point;
		const norm = info.normal;
		const halfWidth = width / 2;
		return {
			x1: pt.x - norm.x * halfWidth,
			y1: pt.y - norm.y * halfWidth,
			x2: pt.x + norm.x * halfWidth,
			y2: pt.y + norm.y * halfWidth,
		};
	}

	function getPhaseSubPaths(phase: "early" | "mid" | "late" | "spurt") {
		const totalRaceLength = raceEndAbs - raceStartAbs;
		let phaseStart = 0;
		let phaseEnd = 0;

		if (phase === "early") {
			phaseStart = raceStartAbs;
			phaseEnd = raceStartAbs + totalRaceLength / 6;
		} else if (phase === "mid") {
			phaseStart = raceStartAbs + totalRaceLength / 6;
			phaseEnd = raceStartAbs + (2 * totalRaceLength) / 3;
		} else if (phase === "late") {
			phaseStart = raceStartAbs + (2 * totalRaceLength) / 3;
			phaseEnd = spurtAbs;
		} else if (phase === "spurt") {
			phaseStart = spurtAbs;
			phaseEnd = raceEndAbs;
		}

		const paths: string[] = [];
		if (activeLapTab === "all") {
			// Loop through each lap and find intersections
			for (let l = 0; l < lapsCount; l++) {
				const offset = l * trackLength;
				const start = Math.max(phaseStart, offset);
				const end = Math.min(phaseEnd, offset + trackLength);
				if (start < end) {
					paths.push(getSubPath(start - offset, end - offset));
				}
			}
		} else {
			// Find offset for active lap tab
			const currentLapIndex =
				activeLapTab === "lap1" ? 0 : activeLapTab === "lap2" ? 1 : 2;
			const offset = currentLapIndex * trackLength;
			const start = Math.max(phaseStart, offset);
			const end = Math.min(phaseEnd, offset + trackLength);
			if (start < end) {
				paths.push(getSubPath(start - offset, end - offset));
			}
		}
		return paths;
	}

	function addSegment() {
		const id = "seg_" + Date.now();
		const name =
			newSegName.trim() ||
			`${newSegType === "straight" ? "Straight" : "Corner"} ${segments.length + 1}`;

		// Clamp input distances
		const start = Math.max(0, Math.min(trackLength, newSegStart));
		const end = Math.max(0, Math.min(trackLength, newSegEnd));

		segments.push({
			id,
			type: newSegType,
			name,
			startDist: start,
			endDist: end,
		});
		segments = [...segments];

		// Reset form
		newSegName = "";
	}

	function deleteSegment(id: string) {
		segments = segments.filter((s) => s.id !== id);
	}

	function autoGenerateSegments() {
		// Divide track into standard: Straight 1, Corner 1, Straight 2, Corner 2
		const l1 = Math.round(trackLength * 0.2); // 20%
		const l2 = Math.round(trackLength * 0.4); // 40%
		const l3 = Math.round(trackLength * 0.7); // 70%
		const l4 = Math.round(trackLength * 0.9); // 90%

		segments = [
			{
				id: "seg_a1",
				type: "straight",
				name: "Home Straight",
				startDist: 0,
				endDist: l1,
			},
			{
				id: "seg_a2",
				type: "corner",
				name: "Corner 1 & 2",
				startDist: l1,
				endDist: l2,
			},
			{
				id: "seg_a3",
				type: "straight",
				name: "Backstretch",
				startDist: l2,
				endDist: l3,
			},
			{
				id: "seg_a4",
				type: "corner",
				name: "Corner 3 & 4",
				startDist: l3,
				endDist: l4,
			},
			{
				id: "seg_a5",
				type: "straight",
				name: "Final Stretch",
				startDist: l4,
				endDist: trackLength,
			},
		];
	}

	let viewBox = $derived.by(() => {
		const vbWidth = 500 / zoom;
		const vbHeight = 500 / zoom;
		const minX = 250 + panX - vbWidth / 2;
		const minY = 250 + panY - vbHeight / 2;
		return `${minX} ${minY} ${vbWidth} ${vbHeight}`;
	});

	function handlePointerDown(e: PointerEvent, index: number) {
		e.stopPropagation();
		selectedPointIndex = index;
		draggingIndex = index;
		e.target?.setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (draggingIndex !== null) {
			const pt = svgElement.createSVGPoint();
			pt.x = e.clientX;
			pt.y = e.clientY;
			const svgP = pt.matrixTransform(
				svgElement.getScreenCTM()?.inverse(),
			);

			points[draggingIndex] = {
				x: svgP.x,
				y: svgP.y,
			};
			// Trigger reactivity
			points = [...points];
			update3DTrack();
		} else if (isPanning) {
			const dx = e.clientX - startPointerPos.x;
			const dy = e.clientY - startPointerPos.y;
			const scale = 500 / (svgElement.clientWidth * zoom);
			panX = Math.max(-300, Math.min(300, startPan.x - dx * scale));
			panY = Math.max(-300, Math.min(300, startPan.y - dy * scale));
		}
	}

	function handlePointerUp(e: PointerEvent) {
		draggingIndex = null;
		isPanning = false;
		e.target?.releasePointerCapture(e.pointerId);
	}

	function handleSvgPointerDown(e: PointerEvent) {
		selectedPointIndex = null;
		isPanning = true;
		startPointerPos = { x: e.clientX, y: e.clientY };
		startPan = { x: panX, y: panY };
		svgElement.setPointerCapture(e.pointerId);
	}

	function insertPoint(index: number, newPoint: { x: number; y: number }) {
		points.splice(index, 0, newPoint);
		points = [...points];
		update3DTrack();
	}

	function removePoint(index: number) {
		if (points.length <= 3) return; // Minimum 3 points
		points.splice(index, 1);
		selectedPointIndex = null;
		points = [...points];
		update3DTrack();
	}

	// 3D Scene Setup
	let container3d: HTMLDivElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let trackMesh: THREE.Mesh;
	let markersGroup: THREE.Group;
	let trackMaterial = $state<THREE.MeshStandardMaterial | null>(null);
	let dirtTexture = $state<THREE.Texture | null>(null);
	let turfTexture = $state<THREE.Texture | null>(null);

	function init3D() {
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x87ceeb); // Sky blue
		// Fog for depth
		scene.fog = new THREE.FogExp2(0x87ceeb, 0.002);

		camera = new THREE.PerspectiveCamera(
			60,
			container3d.clientWidth / container3d.clientHeight,
			0.1,
			1000,
		);
		camera.position.set(0, 150, 300);
		camera.lookAt(0, 0, 0);

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(container3d.clientWidth, container3d.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.shadowMap.enabled = true;
		container3d.appendChild(renderer.domElement);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground

		// Lighting
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
		dirLight.position.set(100, 200, 50);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.width = 2048;
		dirLight.shadow.mapSize.height = 2048;
		dirLight.shadow.camera.near = 0.5;
		dirLight.shadow.camera.far = 500;
		dirLight.shadow.camera.left = -200;
		dirLight.shadow.camera.right = 200;
		dirLight.shadow.camera.top = 200;
		dirLight.shadow.camera.bottom = -200;
		scene.add(dirLight);

		const textureLoader = new THREE.TextureLoader();

		// Ground Plane with texture
		const grassTexture = textureLoader.load("/images/racetrack/grass.png");
		grassTexture.wrapS = THREE.RepeatWrapping;
		grassTexture.wrapT = THREE.RepeatWrapping;
		grassTexture.repeat.set(80, 80);

		const groundGeo = new THREE.PlaneGeometry(1000, 1000);
		const groundMat = new THREE.MeshStandardMaterial({
			map: grassTexture,
			roughness: 0.9,
		});
		const ground = new THREE.Mesh(groundGeo, groundMat);
		ground.rotation.x = -Math.PI / 2;
		ground.receiveShadow = true;
		scene.add(ground);

		// Load track textures
		dirtTexture = textureLoader.load("/images/racetrack/dirt.png");
		dirtTexture.wrapS = THREE.RepeatWrapping;
		dirtTexture.wrapT = THREE.RepeatWrapping;

		turfTexture = textureLoader.load("/images/racetrack/turf.png");
		turfTexture.wrapS = THREE.RepeatWrapping;
		turfTexture.wrapT = THREE.RepeatWrapping;

		// Material for track
		trackMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			map: trackType === "dirt" ? dirtTexture : turfTexture,
			roughness: 0.8,
			side: THREE.DoubleSide,
		});

		update3DTrack();

		// Animation Loop
		function animate() {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		}
		animate();

		// Handle resize
		const resizeObserver = new ResizeObserver(() => {
			if (!container3d) return;
			camera.aspect = container3d.clientWidth / container3d.clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(container3d.clientWidth, container3d.clientHeight);
		});
		resizeObserver.observe(container3d);

		return () => {
			resizeObserver.disconnect();
			renderer.dispose();
		};
	}

	function getTrackColor(type: "dirt" | "turf") {
		// Dirt is brownish, Turf is a brighter green than the ground
		return type === "dirt" ? 0x8b5a2b : 0x5cb85c;
	}

	$effect(() => {
		if (trackMaterial) {
			if (trackType === "dirt" && dirtTexture) {
				trackMaterial.map = dirtTexture;
				trackMaterial.color.setHex(0xffffff);
			} else if (trackType === "turf" && turfTexture) {
				trackMaterial.map = turfTexture;
				trackMaterial.color.setHex(0xffffff);
			} else {
				trackMaterial.map = null;
				trackMaterial.color.setHex(getTrackColor(trackType));
			}
			trackMaterial.needsUpdate = true;
		}
	});

	$effect(() => {
		// Trigger 3D update when marker distances change
		startLineDist;
		finishLineDist;
		if (scene) {
			update3DTrack();
		}
	});

	function update3DTrack() {
		if (!scene) return;

		if (trackMesh) {
			scene.remove(trackMesh);
			trackMesh.geometry.dispose();
		}

		// Convert 2D SVG points to 3D points
		const scale = 0.5;
		const cx = 250;
		const cy = 250;

		const vectorPoints = points.map((p) => {
			return new THREE.Vector3(
				(p.x - cx) * scale,
				1.0,
				(p.y - cy) * scale,
			); // Raised slightly to avoid Z-fighting
		});

		const curve = new THREE.CatmullRomCurve3(
			vectorPoints,
			true,
			"centripetal",
		);
		const curvePoints = curve.getSpacedPoints(200);

		trackCurvePoints2D = curvePoints.map((p) => ({
			x: p.x / scale + cx,
			y: p.z / scale + cy,
		}));

		// Calculate total track length to repeat textures nicely
		let totalLength = 0;
		for (let i = 0; i < curvePoints.length - 1; i++) {
			totalLength += curvePoints[i].distanceTo(curvePoints[i + 1]);
		}
		const repeatV = Math.max(1, Math.round(totalLength / 8)); // Repeat texture every 8 units along the track
		if (dirtTexture) dirtTexture.repeat.set(1, repeatV);
		if (turfTexture) turfTexture.repeat.set(1, repeatV);

		const trackWidth = 12;
		const vertices = [];
		const indices = [];
		const uvs = [];
		const normals = [];

		const up = new THREE.Vector3(0, 1, 0);
		let prevNormal: THREE.Vector3 | null = null;

		// Generate vertices up to curvePoints.length - 1 to avoid evaluating u=1.0 (which is exactly u=0.0 but tangents might flip)
		const numPoints = curvePoints.length - 1;
		for (let i = 0; i < numPoints; i++) {
			const p = curvePoints[i];

			// Compute tangent using neighbors (central difference)
			const nextIdx = (i + 1) % numPoints;
			const prevIdx = (i - 1 + numPoints) % numPoints;
			const nextP = curvePoints[nextIdx];
			const prevP = curvePoints[prevIdx];
			const t = new THREE.Vector3().subVectors(nextP, prevP).normalize();

			// normal points sideways
			const normal = new THREE.Vector3().crossVectors(up, t).normalize();

			// Prevent sudden normal flips at cusps
			if (prevNormal && normal.dot(prevNormal) < 0) {
				normal.negate();
			}
			prevNormal = normal.clone();

			const p1 = new THREE.Vector3()
				.copy(p)
				.add(normal.clone().multiplyScalar(trackWidth / 2));
			const p2 = new THREE.Vector3()
				.copy(p)
				.add(normal.clone().multiplyScalar(-trackWidth / 2));

			vertices.push(p1.x, p1.y, p1.z);
			vertices.push(p2.x, p2.y, p2.z);

			normals.push(0, 1, 0);
			normals.push(0, 1, 0);

			uvs.push(0, i / numPoints);
			uvs.push(1, i / numPoints);
		}

		for (let i = 0; i < numPoints; i++) {
			const curr = i * 2;
			const next = ((i + 1) % numPoints) * 2;

			indices.push(curr, next, curr + 1);
			indices.push(curr + 1, next, next + 1);
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(vertices, 3),
		);
		geometry.setAttribute(
			"normal",
			new THREE.Float32BufferAttribute(normals, 3),
		);
		geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
		geometry.setIndex(indices);
		geometry.computeBoundingSphere();
		geometry.computeBoundingBox();

		trackMesh = new THREE.Mesh(geometry, trackMaterial);
		trackMesh.receiveShadow = true;
		scene.add(trackMesh);

		// Remove existing markers group
		if (markersGroup) {
			scene.remove(markersGroup);
			markersGroup.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose();
					if (Array.isArray(child.material)) {
						child.material.forEach((m) => m.dispose());
					} else {
						child.material.dispose();
					}
				}
			});
		}
		markersGroup = new THREE.Group();
		scene.add(markersGroup);

		// Helper to get 3D point, tangent, and normal from curve
		const get3DPointAndNormal = (dist: number) => {
			const u = Math.max(0, Math.min(1, dist / trackLength));
			const p = curve.getPointAt(u);
			const t = curve.getTangentAt(u);
			const n = new THREE.Vector3()
				.crossVectors(new THREE.Vector3(0, 1, 0), t)
				.normalize();
			return { p, n, t };
		};

		// ─── Helper: Build a premium wavy flag with pole ─────────────────────────
		const createFlag = (
			polePos: THREE.Vector3,
			facingAngle: number,
			tangentVec: THREE.Vector3,
			flagColor: number | null,
			checkered: boolean,
		) => {
			// ── Pole ──────────────────────────────────────────────────────────────
			const pole = new THREE.Mesh(
				new THREE.CylinderGeometry(0.09, 0.12, 10, 10),
				new THREE.MeshStandardMaterial({
					color: 0xd4d4d4,
					metalness: 0.8,
					roughness: 0.2,
				}),
			);
			pole.position.copy(polePos);
			pole.position.y += 5;
			pole.castShadow = true;
			markersGroup.add(pole);

			// Pole finial (small golden ball on top)
			const finial = new THREE.Mesh(
				new THREE.SphereGeometry(0.22, 12, 12),
				new THREE.MeshStandardMaterial({
					color: 0xffd700,
					metalness: 0.9,
					roughness: 0.1,
				}),
			);
			finial.position.copy(polePos);
			finial.position.y += 10.25;
			finial.castShadow = true;
			markersGroup.add(finial);

			// ── Wavy flag cloth ───────────────────────────────────────────────────
			const flagW = 3.6;
			const flagH = 2.2;
			const segsW = 20;
			const segsH = 12;

			const flagGeo = new THREE.PlaneGeometry(flagW, flagH, segsW, segsH);
			const pos = flagGeo.attributes.position;

			// Apply sine wave deformation so flag looks like it's waving
			for (let i = 0; i <= segsW; i++) {
				const uNorm = i / segsW; // 0 (attached) → 1 (free end)
				for (let j = 0; j <= segsH; j++) {
					const idx = j * (segsW + 1) + i;
					const waveAmp = uNorm * uNorm * 0.55; // grows toward free end
					const waveZ = Math.sin(uNorm * Math.PI * 1.8) * waveAmp;
					const waveY =
						Math.sin(uNorm * Math.PI * 1.2) * waveAmp * 0.35;
					pos.setZ(idx, pos.getZ(idx) + waveZ);
					pos.setY(idx, pos.getY(idx) + waveY);
				}
			}
			flagGeo.computeVertexNormals();

			// ── Flag material ─────────────────────────────────────────────────────
			let flagMat: THREE.MeshStandardMaterial;
			if (checkered) {
				// Crisp 8×5 checkered pattern via canvas
				const cvs = document.createElement("canvas");
				cvs.width = 128;
				cvs.height = 80;
				const cx2 = cvs.getContext("2d")!;
				const cols = 8;
				const rows = 5;
				const cw = cvs.width / cols;
				const ch = cvs.height / rows;
				for (let row = 0; row < rows; row++) {
					for (let col = 0; col < cols; col++) {
						cx2.fillStyle =
							(row + col) % 2 === 0 ? "#000000" : "#ffffff";
						cx2.fillRect(col * cw, row * ch, cw, ch);
					}
				}
				const tex = new THREE.CanvasTexture(cvs);
				flagMat = new THREE.MeshStandardMaterial({
					map: tex,
					side: THREE.DoubleSide,
					roughness: 0.55,
				});
			} else {
				flagMat = new THREE.MeshStandardMaterial({
					color: flagColor ?? 0xff0000,
					side: THREE.DoubleSide,
					roughness: 0.6,
				});
			}

			const flagMesh = new THREE.Mesh(flagGeo, flagMat);

			// ── Positioning: attach left edge of flag to pole top ──────────────
			// After rotation.y = facingAngle - PI/2:
			//   local +X  → track tangent direction (flag extends outward along track)
			//   local +Z  → outward normal (flag face visible from trackside)
			// So: center = poleTop + tangent * (flagW/2) puts left edge at pole top.
			const poleTopY = polePos.y + 10; // pole is height 10, base at polePos.y
			flagMesh.position.set(
				polePos.x + tangentVec.x * (flagW / 2),
				poleTopY - flagH * 0.5, // flag hangs slightly below the finial
				polePos.z + tangentVec.z * (flagW / 2),
			);
			// Rotate so local X is along tangent (flag extends away from pole along track)
			flagMesh.rotation.y = facingAngle - Math.PI / 2;
			flagMesh.castShadow = true;
			markersGroup.add(flagMesh);
		};

		// ─── Checkered canvas texture (8x4 grid) for finish line marking ─────
		const checkerCanvas = document.createElement("canvas");
		checkerCanvas.width = 128;
		checkerCanvas.height = 64;
		const checkerCtx = checkerCanvas.getContext("2d")!;
		for (let row = 0; row < 4; row++) {
			for (let col = 0; col < 8; col++) {
				checkerCtx.fillStyle =
					(row + col) % 2 === 0 ? "#000000" : "#ffffff";
				checkerCtx.fillRect(col * 16, row * 16, 16, 16);
			}
		}
		const finishLineTex = new THREE.CanvasTexture(checkerCanvas);
		finishLineTex.wrapS = THREE.RepeatWrapping;
		finishLineTex.wrapT = THREE.RepeatWrapping;

		// ─── 1. START LINE & FLAG (red swallowtail / pennant) ────────────────
		const startInfo = get3DPointAndNormal(startLineDist);
		const startAngle = Math.atan2(startInfo.t.x, startInfo.t.z);

		// White start line stripe
		const startLineMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(trackWidth, 0.8),
			new THREE.MeshStandardMaterial({
				color: 0xffffff,
				side: THREE.DoubleSide,
				roughness: 0.85,
			}),
		);
		startLineMesh.position.copy(startInfo.p);
		startLineMesh.position.y += 0.06;
		startLineMesh.rotation.set(-Math.PI / 2, 0, startAngle);
		startLineMesh.receiveShadow = true;
		markersGroup.add(startLineMesh);

		// START label (thin slab)
		const startLabelGeo = new THREE.BoxGeometry(1.8, 0.4, 0.04);
		const startLabelCvs = document.createElement("canvas");
		startLabelCvs.width = 256;
		startLabelCvs.height = 64;
		const slCtx = startLabelCvs.getContext("2d")!;
		slCtx.fillStyle = "#1e3a5f";
		slCtx.fillRect(0, 0, 256, 64);
		slCtx.font = "bold 38px Arial";
		slCtx.fillStyle = "#ffffff";
		slCtx.textAlign = "center";
		slCtx.fillText("START", 128, 46);
		const startLabelTex = new THREE.CanvasTexture(startLabelCvs);
		const startLabel = new THREE.Mesh(startLabelGeo, [
			new THREE.MeshStandardMaterial({ color: 0x1e3a5f }),
			new THREE.MeshStandardMaterial({ color: 0x1e3a5f }),
			new THREE.MeshStandardMaterial({ color: 0x1e3a5f }),
			new THREE.MeshStandardMaterial({ color: 0x1e3a5f }),
			new THREE.MeshStandardMaterial({ map: startLabelTex }),
			new THREE.MeshStandardMaterial({ color: 0x1e3a5f }),
		]);
		const startPoleBase = new THREE.Vector3()
			.copy(startInfo.p)
			.add(startInfo.n.clone().multiplyScalar(trackWidth / 2 + 0.5));
		startLabel.position.copy(startPoleBase);
		startLabel.position.y += 0.8;
		startLabel.rotation.y = startAngle;
		markersGroup.add(startLabel);

		// Pole + RED start flag
		createFlag(startPoleBase, startAngle, startInfo.t, 0xef4444, false);

		// ─── 2. FINISH LINE & FLAG (iconic checkered) ─────────────────────────
		const finishInfo = get3DPointAndNormal(finishLineDist);
		const finishAngle = Math.atan2(finishInfo.t.x, finishInfo.t.z);

		// Checkered finish line stripe
		const finishLineMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(trackWidth, 1.0),
			new THREE.MeshStandardMaterial({
				map: finishLineTex,
				side: THREE.DoubleSide,
				roughness: 0.7,
			}),
		);
		finishLineMesh.position.copy(finishInfo.p);
		finishLineMesh.position.y += 0.07;
		finishLineMesh.rotation.set(-Math.PI / 2, 0, finishAngle);
		finishLineMesh.receiveShadow = true;
		markersGroup.add(finishLineMesh);

		// FINISH label
		const finishLabelCvs = document.createElement("canvas");
		finishLabelCvs.width = 256;
		finishLabelCvs.height = 64;
		const flCtx = finishLabelCvs.getContext("2d")!;
		flCtx.fillStyle = "#1a1a1a";
		flCtx.fillRect(0, 0, 256, 64);
		flCtx.font = "bold 36px Arial";
		flCtx.fillStyle = "#f5f5f5";
		flCtx.textAlign = "center";
		flCtx.fillText("FINISH", 128, 46);
		const finishLabelTex = new THREE.CanvasTexture(finishLabelCvs);
		const finishLabel = new THREE.Mesh(
			new THREE.BoxGeometry(1.8, 0.4, 0.04),
			[
				new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
				new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
				new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
				new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
				new THREE.MeshStandardMaterial({ map: finishLabelTex }),
				new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
			],
		);
		const finishPoleBase = new THREE.Vector3()
			.copy(finishInfo.p)
			.add(finishInfo.n.clone().multiplyScalar(trackWidth / 2 + 0.5));
		finishLabel.position.copy(finishPoleBase);
		finishLabel.position.y += 0.8;
		finishLabel.rotation.y = finishAngle;
		markersGroup.add(finishLabel);

		// Pole + CHECKERED finish flag
		createFlag(finishPoleBase, finishAngle, finishInfo.t, null, true);
	}

	onMount(() => {
		const cleanup = init3D();

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			const zoomFactor = 1.15;
			if (e.deltaY < 0) {
				zoom = Math.min(5.0, zoom * zoomFactor);
			} else {
				zoom = Math.max(0.5, zoom / zoomFactor);
			}
		};

		const handleSchematicWheel = (e: WheelEvent) => {
			e.preventDefault();
			const zoomFactor = 1.15;
			if (e.deltaY < 0) {
				schematicZoom = Math.min(5.0, schematicZoom * zoomFactor);
			} else {
				schematicZoom = Math.max(0.5, schematicZoom / zoomFactor);
			}
		};

		if (svgElement) {
			svgElement.addEventListener("wheel", handleWheel, {
				passive: false,
			});
		}

		if (schematicSvgElement) {
			schematicSvgElement.addEventListener(
				"wheel",
				handleSchematicWheel,
				{ passive: false },
			);
		}

		return () => {
			cleanup();
			if (svgElement) {
				svgElement.removeEventListener("wheel", handleWheel);
			}
			if (schematicSvgElement) {
				schematicSvgElement.removeEventListener(
					"wheel",
					handleSchematicWheel,
				);
			}
		};
	});
</script>

<svelte:head>
	<title>Racetrack Generator | Hashire!</title>
</svelte:head>

<div class="container mx-auto px-4 py-24 relative min-h-[90vh]">
	<!-- Title and Toolbar Container -->
	<div
		class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
	>
		<div class="title-banner text-lg md:text-2xl ml-0 md:-ml-4 shadow-md">
			Racetrack Generator
		</div>

		<!-- Controls / Toolbar -->
		<div
			class="flex flex-wrap items-center gap-4 bg-[#FFF6FA] border-4 border-purple-400 rounded-2xl p-3 shadow-md z-10"
		>
			<!-- Track Type Toggle -->
			<div class="flex items-center gap-2">
				<span class="text-purple-900 font-bold text-sm">Track:</span>
				<div
					class="flex bg-purple-100 rounded-xl p-0.5 border border-purple-200"
				>
					<button
						class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {trackType ===
						'dirt'
							? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow border-b-2 border-amber-800'
							: 'text-purple-700 hover:text-purple-950'}"
						onclick={() => (trackType = "dirt")}
					>
						Dirt
					</button>
					<button
						class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {trackType ===
						'turf'
							? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow border-b-2 border-emerald-800'
							: 'text-purple-700 hover:text-purple-950'}"
						onclick={() => (trackType = "turf")}
					>
						Turf
					</button>
				</div>
			</div>

			<div class="w-px h-6 bg-purple-200"></div>

			<!-- View Mode Toggle -->
			<div class="flex items-center gap-2">
				<span class="text-purple-900 font-bold text-sm">View:</span>
				<div
					class="flex bg-purple-100 rounded-xl p-0.5 border border-purple-200"
				>
					<button
						class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {viewMode ===
						'2d-only'
							? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow border-b-2 border-purple-800'
							: 'text-purple-700 hover:text-purple-950'}"
						onclick={() => (viewMode = "2d-only")}
					>
						2D Editor
					</button>
					<button
						class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {viewMode ===
						'split'
							? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow border-b-2 border-purple-800'
							: 'text-purple-700 hover:text-purple-950'}"
						onclick={() => (viewMode = "split")}
					>
						Split
					</button>
					<button
						class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {viewMode ===
						'3d-only'
							? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow border-b-2 border-purple-800'
							: 'text-purple-700 hover:text-purple-950'}"
						onclick={() => (viewMode = "3d-only")}
					>
						3D Preview
					</button>
				</div>
			</div>

			<div class="w-px h-6 bg-purple-200"></div>

			<!-- Random Layout button -->
			<button
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow border-b-2 border-emerald-700 hover:from-emerald-600 hover:to-teal-700 transition-all cursor-pointer"
				onclick={randomizeTrack}
				title="Generate a random racetrack layout with auto-detected segments"
			>
				🎲 Random Layout
			</button>

			<div class="w-px h-6 bg-purple-200"></div>

			<!-- JSON Export / Import buttons -->
			<div class="flex items-center gap-2 flex-wrap">
				<span class="text-purple-900 font-bold text-sm">Data:</span>
				<button
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow border-b-2 border-violet-800 hover:from-violet-600 hover:to-violet-800 transition-all cursor-pointer"
					onclick={exportJSON}
					title="Export racetrack data as JSON"
				>
					Export JSON
				</button>
				<button
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-white shadow border-b-2 border-fuchsia-800 hover:from-fuchsia-600 hover:to-fuchsia-800 transition-all cursor-pointer"
					onclick={triggerImport}
					title="Import racetrack data from JSON"
				>
					Import JSON
				</button>
				<!-- Hidden file input for import -->
				<input
					bind:this={importFileInput}
					type="file"
					accept=".json,application/json"
					class="hidden"
					onchange={handleImportFile}
				/>
			</div>
			{#if importError}
				<div
					class="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5"
				>
					⚠️ {importError}
				</div>
			{/if}
		</div>
	</div>

	<!-- Workspace Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
		<!-- 2D Editor Pane -->
		<div
			class="lg:col-span-6 border-4 border-purple-400 rounded-3xl bg-[#FFF6FA] shadow-lg flex flex-col p-6 relative"
			style="display: {viewMode === '3d-only'
				? 'none'
				: 'flex'}; grid-column: {viewMode === '2d-only'
				? 'span 12'
				: ''}"
		>
			<div
				class="absolute -top-4 left-6 bg-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md z-10"
			>
				Top-down 2D Map (Drag points to edit)
			</div>

			<div
				class="flex-1 w-full min-h-[400px] md:min-h-[480px] flex items-center justify-center mt-2"
			>
				<div
					class="w-full max-w-[480px] aspect-square bg-white rounded-2xl border-2 border-purple-200 shadow-inner overflow-hidden relative"
				>
					<!-- Grid Background -->
					<div
						class="absolute inset-0 opacity-15 pointer-events-none"
						style="background-image: radial-gradient(circle, #8a2be2 1.5px, transparent 1.5px); background-size: 20px 20px;"
					></div>

					<!-- Zoom Controls Overlay -->
					<div
						class="absolute bottom-3 right-3 flex flex-col gap-1 z-10 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-lg p-1 shadow-sm"
					>
						<button
							class="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm text-purple-700 hover:bg-purple-100 transition-colors border border-purple-100 cursor-pointer shadow-sm"
							onclick={() => (zoom = Math.min(5.0, zoom * 1.2))}
							title="Zoom In"
						>
							＋
						</button>
						<button
							class="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm text-purple-700 hover:bg-purple-100 transition-colors border border-purple-100 cursor-pointer shadow-sm"
							onclick={() => {
								zoom = 1.0;
								panX = 0;
								panY = 0;
							}}
							title="Reset View"
						>
							⟲
						</button>
						<button
							class="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm text-purple-700 hover:bg-purple-100 transition-colors border border-purple-100 cursor-pointer shadow-sm"
							onclick={() => (zoom = Math.max(0.5, zoom / 1.2))}
							title="Zoom Out"
						>
							－
						</button>
					</div>

					<svg
						bind:this={svgElement}
						{viewBox}
						class="w-full h-full touch-none"
						onpointerdown={handleSvgPointerDown}
						onpointermove={handlePointerMove}
						onpointerup={handlePointerUp}
						onpointerleave={handlePointerUp}
					>
						<!-- Smooth Track Path -->
						<path
							d={trackCurvePath}
							fill="none"
							stroke={trackType === "dirt"
								? "#8b5a2b"
								: "#5cb85c"}
							stroke-width="24"
							stroke-linecap="round"
							stroke-linejoin="round"
							opacity="0.85"
						/>

						<!-- Highlight Overlay for Hovered Segment -->
						{#if hoveredSegmentId}
							{@const seg = segments.find(
								(s) => s.id === hoveredSegmentId,
							)}
							{#if seg}
								<path
									d={getSubPath(seg.startDist, seg.endDist)}
									fill="none"
									stroke="#ea580c"
									stroke-width="28"
									stroke-linecap="round"
									stroke-linejoin="round"
									opacity="0.75"
									class="pointer-events-none animate-pulse"
								/>
							{/if}
						{/if}

						<!-- Highlight Overlay for Hovered Phase -->
						{#if hoveredPhase}
							{@const phaseRange =
								hoveredPhase === "early"
									? { start: 0, end: trackLength / 6 }
									: hoveredPhase === "mid"
										? {
												start: trackLength / 6,
												end: (2 * trackLength) / 3,
											}
										: hoveredPhase === "late"
											? {
													start:
														(2 * trackLength) / 3,
													end: trackLength,
												}
											: hoveredPhase === "spurt"
												? {
														start:
															(2 * trackLength) /
															3,
														end: trackLength,
													}
												: null}
							{#if phaseRange}
								<path
									d={getSubPath(
										phaseRange.start,
										phaseRange.end,
									)}
									fill="none"
									stroke={hoveredPhase === "early"
										? "#f1db82"
										: hoveredPhase === "mid"
											? "#c084fc"
											: hoveredPhase === "late"
												? "#67e8f9"
												: "#f472b6"}
									stroke-width="28"
									stroke-linecap="round"
									stroke-linejoin="round"
									opacity="0.75"
									class="pointer-events-none animate-pulse"
								/>
							{/if}
						{/if}

						<!-- SVG Markers: Start Line Flag -->
						{#if getPointAndNormalAtDistance(startLineDist).point}
							{@const startInfo =
								getPointAndNormalAtDistance(startLineDist)}
							{@const pt = startInfo.point}
							{@const norm = startInfo.normal}
							{@const offsetDist = 24}
							{@const ox = pt.x + norm.x * offsetDist}
							{@const oy = pt.y + norm.y * offsetDist}
							{@const angleDeg =
								(Math.atan2(norm.y, norm.x) * 180) / Math.PI}
							<g class="pointer-events-none">
								<line
									x1={pt.x}
									y1={pt.y}
									x2={ox}
									y2={oy}
									stroke="#333"
									stroke-width="1.5"
									stroke-dasharray="2 2"
								/>
								<g
									transform="translate({ox}, {oy}) rotate({angleDeg})"
								>
									<line
										x1="0"
										y1="0"
										x2="18"
										y2="0"
										stroke="#333"
										stroke-width="1.5"
									/>
									<g transform="translate(18, 0)">
										<rect
											x="0"
											y="-12"
											width="12"
											height="12"
											fill="#fff"
											stroke="#333"
											stroke-width="0.75"
										/>
										<rect
											x="0"
											y="-12"
											width="6"
											height="4"
											fill="#000"
										/>
										<rect
											x="6"
											y="-8"
											width="6"
											height="4"
											fill="#000"
										/>
										<rect
											x="0"
											y="6"
											width="6"
											height="4"
											fill="#000"
										/>
									</g>
								</g>
								<!-- Label placed dynamically along normal to avoid overlaps -->
								<text
									x={ox + norm.x * 34}
									y={oy + norm.y * 34 + 2.5}
									text-anchor={Math.abs(norm.x) > 0.5
										? norm.x > 0
											? "start"
											: "end"
										: "middle"}
									font-size="8"
									font-weight="bold"
									fill="#333"
									class="bg-white/80 font-fredoka"
								>
									START
								</text>
							</g>
						{/if}

						<!-- SVG Markers: Finish Line Flag -->
						{#if getPointAndNormalAtDistance(finishLineDist).point}
							{@const finishInfo =
								getPointAndNormalAtDistance(finishLineDist)}
							{@const pt = finishInfo.point}
							{@const norm = finishInfo.normal}
							{@const offsetDist = 24}
							{@const ox = pt.x + norm.x * offsetDist}
							{@const oy = pt.y + norm.y * offsetDist}
							{@const angleDeg =
								(Math.atan2(norm.y, norm.x) * 180) / Math.PI}
							<g class="pointer-events-none">
								<line
									x1={pt.x}
									y1={pt.y}
									x2={ox}
									y2={oy}
									stroke="#ef4444"
									stroke-width="1.5"
									stroke-dasharray="2 2"
								/>
								<g
									transform="translate({ox}, {oy}) rotate({angleDeg})"
								>
									<line
										x1="0"
										y1="0"
										x2="18"
										y2="0"
										stroke="#333"
										stroke-width="1.5"
									/>
									<g transform="translate(18, 0)">
										<path
											d="M 0,0 L 0,-12 L 12,-12 L 9,-6 L 12,0 Z"
											fill="#ef4444"
											stroke="#b91c1c"
											stroke-width="1"
											stroke-linejoin="round"
										/>
									</g>
								</g>
								<!-- Label placed dynamically along normal to avoid overlaps -->
								<text
									x={ox + norm.x * 34}
									y={oy + norm.y * 34 + 2.5}
									text-anchor={Math.abs(norm.x) > 0.5
										? norm.x > 0
											? "start"
											: "end"
										: "middle"}
									font-size="8"
									font-weight="bold"
									fill="#ef4444"
									class="bg-white/80 font-fredoka"
								>
									FINISH
								</text>
							</g>
						{/if}

						<!-- SVG Markers: Position Keep Ends -->
						{#if getPointAndNormalAtDistance(positionKeepEnds).point}
							{@const pkInfo =
								getPointAndNormalAtDistance(positionKeepEnds)}
							{@const pt = pkInfo.point}
							{@const norm = pkInfo.normal}
							{@const tangent = pkInfo.tangent}
							{@const offsetDist = 22}
							{@const ox = pt.x + norm.x * offsetDist}
							{@const oy = pt.y + norm.y * offsetDist}
							{@const tAngle =
								(Math.atan2(tangent.y, tangent.x) * 180) /
								Math.PI}
							<g class="pointer-events-none">
								<line
									x1={pt.x}
									y1={pt.y}
									x2={ox}
									y2={oy}
									stroke="#7c3aed"
									stroke-width="1"
									stroke-dasharray="2 2"
								/>
								<g
									transform="translate({ox}, {oy}) rotate({tAngle})"
								>
									<polygon
										points="-4,-4 0,0 -4,4"
										fill="#7c3aed"
									/>
									<polygon
										points="0,-4 4,0 0,4"
										fill="#7c3aed"
									/>
								</g>
								<text
									x={ox + norm.x * 12}
									y={oy + norm.y * 12 + 3}
									text-anchor="middle"
									font-size="7"
									font-weight="bold"
									fill="#7c3aed"
									class="font-fredoka">P.K. END</text
								>
							</g>
						{/if}

						<!-- SVG Markers: Spurt Starts -->
						{#if getPointAndNormalAtDistance(spurtStarts).point}
							{@const spurtInfo =
								getPointAndNormalAtDistance(spurtStarts)}
							{@const pt = spurtInfo.point}
							{@const norm = spurtInfo.normal}
							{@const tangent = spurtInfo.tangent}
							{@const offsetDist = 22}
							{@const ox = pt.x + norm.x * offsetDist}
							{@const oy = pt.y + norm.y * offsetDist}
							{@const tAngle =
								(Math.atan2(tangent.y, tangent.x) * 180) /
								Math.PI}
							<g class="pointer-events-none">
								<line
									x1={pt.x}
									y1={pt.y}
									x2={ox}
									y2={oy}
									stroke="#0284c7"
									stroke-width="1"
									stroke-dasharray="2 2"
								/>
								<g
									transform="translate({ox}, {oy}) rotate({tAngle})"
								>
									<polygon
										points="-7,-5 -2,0 -7,5"
										fill="#0284c7"
									/>
									<polygon
										points="-2,-5 3,0 -2,5"
										fill="#0284c7"
									/>
									<polygon
										points="3,-5 8,0 3,5"
										fill="#0284c7"
									/>
								</g>
								<text
									x={ox + norm.x * 14}
									y={oy + norm.y * 14 + 3}
									text-anchor="middle"
									font-size="7"
									font-weight="bold"
									fill="#0284c7"
									class="font-fredoka">SPURT</text
								>
							</g>
						{/if}

						<!-- Per-Segment Border Lines (melintang jalan) -->
						{#each segments as seg}
							{@const lineStart = getPerpendicularLine(
								seg.startDist,
								24,
							)}
							<line
								x1={lineStart.x1}
								y1={lineStart.y1}
								x2={lineStart.x2}
								y2={lineStart.y2}
								stroke="#ffffff"
								stroke-width="3"
								stroke-linecap="round"
								opacity="0.9"
								class="pointer-events-none"
							/>
							{@const lineEnd = getPerpendicularLine(
								seg.endDist,
								24,
							)}
							<line
								x1={lineEnd.x1}
								y1={lineEnd.y1}
								x2={lineEnd.x2}
								y2={lineEnd.y2}
								stroke="#ffffff"
								stroke-width="3"
								stroke-linecap="round"
								opacity="0.9"
								class="pointer-events-none"
							/>
						{/each}

						<!-- SVG Markers: Segments (Corners & Straights) -->
						{#each segments as seg}
							{@const midDist = (seg.startDist + seg.endDist) / 2}
							{@const midInfo =
								getPointAndNormalAtDistance(midDist)}
							{#if midInfo.point}
								{@const pt = midInfo.point}
								{@const norm = midInfo.normal}
								{@const offsetDist = 26}
								{@const ox = pt.x + norm.x * offsetDist}
								{@const oy = pt.y + norm.y * offsetDist}
								<g
									class="pointer-events-none opacity-80 hover:opacity-100 transition-opacity"
								>
									<line
										x1={pt.x}
										y1={pt.y}
										x2={ox}
										y2={oy}
										stroke="#ea580c"
										stroke-width="1"
										stroke-dasharray="2 2"
									/>
									<g transform="translate({ox}, {oy})">
										<circle
											cx="0"
											cy="0"
											r="8"
											fill="#f97316"
											stroke="#ea580c"
											stroke-width="1"
										/>
										{#if seg.type === "corner"}
											<path
												d="M -3,2 A 3,3 0 0,1 2,-3"
												fill="none"
												stroke="white"
												stroke-width="1.5"
												stroke-linecap="round"
											/>
											<polygon
												points="2,-5 4,-3 2,-1"
												fill="white"
											/>
										{:else}
											<line
												x1="-3"
												y1="0"
												x2="3"
												y2="0"
												stroke="white"
												stroke-width="1.5"
												stroke-linecap="round"
											/>
											<polygon
												points="-3,-2 -5,0 -3,2"
												fill="white"
											/>
											<polygon
												points="3,-2 5,0 3,2"
												fill="white"
											/>
										{/if}
										<text
											x={norm.x * 15}
											y={norm.y * 15 + 2.5}
											text-anchor={Math.abs(norm.x) > 0.5
												? norm.x > 0
													? "start"
													: "end"
												: "middle"}
											font-size="7"
											font-weight="bold"
											fill="#ea580c"
											class="font-fredoka"
										>
											{seg.name}
										</text>
									</g>
								</g>
							{/if}
						{/each}

						<!-- Helper Path (straight lines) -->
						<path
							d={svgPath}
							fill="none"
							stroke="#c084fc"
							stroke-width="2"
							stroke-dasharray="4 4"
						/>

						<!-- Points -->
						{#each points as point, i}
							{@const nextIdx = (i + 1) % points.length}
							{@const nextPoint = points[nextIdx]}
							{@const midX = (point.x + nextPoint.x) / 2}
							{@const midY = (point.y + nextPoint.y) / 2}

							<!-- Connector lines to visualize order -->
							{#if i > 0}
								<line
									x1={points[i - 1].x}
									y1={points[i - 1].y}
									x2={point.x}
									y2={point.y}
									stroke="#e9d5ff"
									stroke-width="2"
								/>
							{/if}
							<!-- Close loop -->
							{#if i === points.length - 1}
								<line
									x1={point.x}
									y1={point.y}
									x2={points[0].x}
									y2={points[0].y}
									stroke="#e9d5ff"
									stroke-width="2"
								/>
							{/if}

							<!-- Midpoint Add Buttons (Visible on hover) -->
							<g
								class="cursor-pointer group"
								onclick={(e) => {
									e.stopPropagation();
									insertPoint(nextIdx, { x: midX, y: midY });
								}}
								onpointerdown={(e) => e.stopPropagation()}
							>
								<circle
									cx={midX}
									cy={midY}
									r="14"
									fill="transparent"
								/>
								<circle
									cx={midX}
									cy={midY}
									r="10"
									fill="#a855f7"
									stroke="#ffffff"
									stroke-width="2"
									class="opacity-0 group-hover:opacity-100 transition-opacity"
								/>
								<text
									x={midX}
									y={midY}
									text-anchor="middle"
									dominant-baseline="central"
									fill="white"
									font-size="12"
									font-weight="bold"
									class="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
									>+</text
								>
							</g>

							<!-- Interaction Area -->
							<circle
								cx={point.x}
								cy={point.y}
								r="18"
								fill="transparent"
								class="cursor-grab hover:cursor-grabbing"
								onpointerdown={(e) => handlePointerDown(e, i)}
							/>
							<!-- Visible Dot -->
							<circle
								cx={point.x}
								cy={point.y}
								r="7"
								fill={draggingIndex === i
									? "#ec4899"
									: selectedPointIndex === i
										? "#eab308"
										: "#a855f7"}
								stroke="#ffffff"
								stroke-width="2"
								class="pointer-events-none transition-colors"
							/>
						{/each}

						<!-- Selected Point Action (Delete) -->
						{#if selectedPointIndex !== null && points[selectedPointIndex]}
							{@const p = points[selectedPointIndex]}
							{#if points.length > 3}
								<g
									class="cursor-pointer"
									onclick={(e) => {
										e.stopPropagation();
										removePoint(selectedPointIndex!);
									}}
									onpointerdown={(e) => e.stopPropagation()}
								>
									<circle
										cx={p.x + 16}
										cy={p.y - 16}
										r="11"
										fill="#ef4444"
										stroke="#ffffff"
										stroke-width="2"
									/>
									<text
										x={p.x + 16}
										y={p.y - 16}
										text-anchor="middle"
										dominant-baseline="central"
										fill="white"
										font-size="11"
										font-weight="bold"
										class="pointer-events-none">X</text
									>
								</g>
							{/if}
						{/if}
					</svg>
				</div>
			</div>
		</div>

		<!-- 3D Preview Pane -->
		<div
			class="lg:col-span-6 border-4 border-blue-400 rounded-3xl bg-[#FFF6FA] shadow-lg flex flex-col p-6 relative"
			style="display: {viewMode === '2d-only'
				? 'none'
				: 'flex'}; grid-column: {viewMode === '3d-only'
				? 'span 12'
				: ''}"
		>
			<div
				class="absolute -top-4 left-6 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md z-10"
			>
				3D Preview (Scroll to zoom, drag to rotate)
			</div>

			<div
				class="flex-1 w-full min-h-[400px] md:min-h-[480px] rounded-2xl border-2 border-blue-200 overflow-hidden relative mt-2 bg-sky-200"
			>
				<div
					bind:this={container3d}
					class="w-full h-full outline-none"
				></div>
			</div>
		</div>

		<!-- Detailed Racetrack Segment & Marker Editor Panel -->
		<div
			class="lg:col-span-12 border-4 border-indigo-400 rounded-3xl bg-[#FFF6FA] shadow-lg flex flex-col p-6 relative mt-8 z-10 font-fredoka"
		>
			<div
				class="absolute -top-4 left-6 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md z-10"
			>
				Detailed Racetrack Segment & Marker Editor
			</div>

			<!-- Header Stats & Laps Tab -->
			<div
				class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100 pb-4 mb-6 mt-2"
			>
				<!-- Large Stat display -->
				<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<span class="text-3xl font-extrabold text-indigo-950"
						>{trackLength} m</span
					>
					<span class="text-lg font-bold text-indigo-700 capitalize"
						>· {trackType}</span
					>
					<span
						class="text-xs font-semibold text-purple-600 bg-purple-100 px-2.5 py-0.5 rounded-full capitalize"
					>
						{trackDirection === "clockwise"
							? "Clockwise"
							: "Counter-Clockwise"}
					</span>
				</div>

				<!-- Laps filter tabs -->
				<div
					class="flex items-center gap-1.5 bg-indigo-50 p-1 border border-indigo-100 rounded-xl"
				>
					<button
						class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {activeLapTab ===
						'all'
							? 'bg-indigo-600 text-white shadow-sm'
							: 'text-indigo-700 hover:bg-indigo-100'}"
						onclick={() => (activeLapTab = "all")}
					>
						All Laps
					</button>
					<button
						class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {activeLapTab ===
						'lap1'
							? 'bg-indigo-600 text-white shadow-sm'
							: 'text-indigo-700 hover:bg-indigo-100'}"
						onclick={() => (activeLapTab = "lap1")}
					>
						Lap 1
					</button>
					{#if lapsCount > 1}
						<button
							class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {activeLapTab ===
							'lap2'
								? 'bg-indigo-600 text-white shadow-sm'
								: 'text-indigo-700 hover:bg-indigo-100'}"
							onclick={() => (activeLapTab = "lap2")}
						>
							Lap 2
						</button>
					{/if}
					{#if lapsCount > 2}
						<button
							class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {activeLapTab ===
							'lap3'
								? 'bg-indigo-600 text-white shadow-sm'
								: 'text-indigo-700 hover:bg-indigo-100'}"
							onclick={() => (activeLapTab = "lap3")}
						>
							Lap 3
						</button>
					{/if}
				</div>
			</div>

			<!-- Main Layout split -->
			<div class="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
				<!-- LEFT COLUMN: Forms and Sliders (5 cols) -->
				<div
					class="xl:col-span-5 flex flex-col gap-6 bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm"
				>
					<!-- Track metadata controls -->
					<div>
						<h3
							class="text-sm font-extrabold text-indigo-900 border-b border-indigo-50 pb-1.5 mb-3 flex items-center gap-1.5"
						>
							General Settings
						</h3>
						<div class="grid grid-cols-2 gap-4">
							<div class="flex flex-col gap-1">
								<label
									class="text-xs font-bold text-slate-600"
									for="track-length">Track Length (m)</label
								>
								<input
									type="number"
									id="track-length"
									class="bg-indigo-50/50 border border-indigo-100 rounded-lg px-2 py-1.5 text-sm font-bold text-indigo-950 focus:outline-indigo-400"
									bind:value={trackLength}
									min="400"
									max="10000"
								/>
							</div>
							<div class="flex flex-col gap-1">
								<label
									class="text-xs font-bold text-slate-600"
									for="track-direction">Direction</label
								>
								<select
									id="track-direction"
									class="bg-indigo-50/50 border border-indigo-100 rounded-lg px-2 py-1.5 text-sm font-bold text-indigo-950 focus:outline-indigo-400 cursor-pointer"
									bind:value={trackDirection}
								>
									<option value="clockwise">Clockwise</option>
									<option value="anticlockwise"
										>Counter-Clockwise</option
									>
								</select>
							</div>
							<div class="flex flex-col gap-1">
								<label
									class="text-xs font-bold text-slate-600"
									for="laps-count">Laps</label
								>
								<select
									id="laps-count"
									class="bg-indigo-50/50 border border-indigo-100 rounded-lg px-2 py-1.5 text-sm font-bold text-indigo-950 focus:outline-indigo-400 cursor-pointer"
									bind:value={lapsCount}
								>
									<option value={1}>1 Lap</option>
									<option value={2}>2 Laps</option>
									<option value={3}>3 Laps</option>
								</select>
							</div>
							<div class="flex flex-col gap-1 justify-end pb-0.5">
								<button
									class="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-extrabold py-2 px-3 rounded-lg border border-indigo-200 cursor-pointer transition-colors shadow-sm"
									onclick={autoGenerateSegments}
								>
									Auto-Gen Segments
								</button>
							</div>
						</div>
					</div>

					<!-- Markers Sliders -->
					<div>
						<h3
							class="text-sm font-extrabold text-indigo-900 border-b border-indigo-50 pb-1.5 mb-3 flex items-center gap-1.5"
						>
							🚩 Key Markers & Distances
						</h3>

						<div class="flex flex-col gap-4">
							<!-- Start Line Slider -->
							<div
								class="flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
							>
								<div
									class="flex justify-between items-center text-xs font-bold text-slate-700"
								>
									<span class="flex items-center gap-1"
										>🏁 Start Line Position</span
									>
									<span
										class="text-indigo-700 font-extrabold bg-indigo-50 px-2 py-0.5 rounded"
										>{startLineDist} m</span
									>
								</div>
								<input
									type="range"
									min="0"
									max={trackLength}
									step="10"
									class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-1"
									bind:value={startLineDist}
								/>
							</div>

							<!-- Finish Line Slider -->
							<div
								class="flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
							>
								<div
									class="flex justify-between items-center text-xs font-bold text-slate-700"
								>
									<span class="flex items-center gap-1"
										>🚩 Finish Line Position</span
									>
									<span
										class="text-rose-700 font-extrabold bg-rose-50 px-2 py-0.5 rounded"
										>{finishLineDist} m</span
									>
								</div>
								<input
									type="range"
									min="0"
									max={trackLength}
									step="10"
									class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600 mt-1"
									bind:value={finishLineDist}
								/>
							</div>

							<!-- Position Keep Ends Slider -->
							<div
								class="flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
							>
								<div
									class="flex justify-between items-center text-xs font-bold text-slate-700"
								>
									<span class="flex items-center gap-1"
										>🟣 Position Keep Ends</span
									>
									<span
										class="text-purple-700 font-extrabold bg-purple-50 px-2 py-0.5 rounded"
										>{positionKeepEnds} m</span
									>
								</div>
								<input
									type="range"
									min="0"
									max={trackLength}
									step="10"
									class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 mt-1"
									bind:value={positionKeepEnds}
								/>
							</div>

							<!-- Spurt Starts Slider -->
							<div
								class="flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
							>
								<div
									class="flex justify-between items-center text-xs font-bold text-slate-700"
								>
									<span class="flex items-center gap-1"
										>🔵 Spurt Starts</span
									>
									<span
										class="text-sky-700 font-extrabold bg-sky-50 px-2 py-0.5 rounded"
										>{spurtStarts} m</span
									>
								</div>
								<input
									type="range"
									min="0"
									max={trackLength}
									step="10"
									class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 mt-1"
									bind:value={spurtStarts}
								/>
							</div>
						</div>
					</div>

					<!-- Add New Segment Form -->
					<div>
						<h3
							class="text-sm font-extrabold text-indigo-900 border-b border-indigo-50 pb-1.5 mb-3 flex items-center gap-1.5"
						>
							➕ Add New Segment
						</h3>
						<div
							class="flex flex-col gap-3 bg-indigo-50/20 p-3.5 rounded-xl border border-indigo-100"
						>
							<div class="grid grid-cols-2 gap-3">
								<div class="flex flex-col gap-1">
									<span
										class="text-xs font-bold text-slate-600"
										>Segment Type</span
									>
									<div
										class="flex rounded-lg overflow-hidden border border-indigo-200 p-0.5 bg-white"
									>
										<button
											class="flex-1 py-1 text-[11px] font-bold cursor-pointer transition-colors rounded {newSegType ===
											'straight'
												? 'bg-amber-500 text-white'
												: 'text-slate-600 hover:bg-slate-50'}"
											onclick={() =>
												(newSegType = "straight")}
										>
											Straight
										</button>
										<button
											class="flex-1 py-1 text-[11px] font-bold cursor-pointer transition-colors rounded {newSegType ===
											'corner'
												? 'bg-orange-500 text-white'
												: 'text-slate-600 hover:bg-slate-50'}"
											onclick={() =>
												(newSegType = "corner")}
										>
											Corner
										</button>
									</div>
								</div>
								<div class="flex flex-col gap-1">
									<label
										class="text-xs font-bold text-slate-600"
										for="new-seg-name">Name</label
									>
									<input
										type="text"
										id="new-seg-name"
										placeholder="e.g. Corner 1"
										class="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-950 focus:outline-indigo-400"
										bind:value={newSegName}
									/>
								</div>
							</div>

							<div class="grid grid-cols-2 gap-3">
								<div class="flex flex-col gap-1">
									<label
										class="text-xs font-bold text-slate-600"
										for="new-seg-start">Start (m)</label
									>
									<input
										type="number"
										id="new-seg-start"
										class="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-950 focus:outline-indigo-400"
										bind:value={newSegStart}
										min="0"
										max={trackLength}
									/>
								</div>
								<div class="flex flex-col gap-1">
									<label
										class="text-xs font-bold text-slate-600"
										for="new-seg-end">End (m)</label
									>
									<input
										type="number"
										id="new-seg-end"
										class="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-950 focus:outline-indigo-400"
										bind:value={newSegEnd}
										min="0"
										max={trackLength}
									/>
								</div>
							</div>

							<button
								class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-extrabold py-2 px-4 rounded-lg shadow-sm border border-indigo-600 cursor-pointer transition-all mt-1"
								onclick={addSegment}
							>
								Add Segment to Track
							</button>
						</div>
					</div>
				</div>

				<!-- RIGHT COLUMN: Timeline & Segment List (7 cols) -->
				<div class="xl:col-span-7 flex flex-col gap-6">
					<!-- Interactive Timeline Panel -->
					<div
						class="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col gap-4"
					>
						<h3
							class="text-sm font-extrabold text-indigo-900 border-b border-indigo-50 pb-1.5 mb-1 flex items-center gap-1.5"
						>
							Visual Track Timeline
						</h3>

						<!-- Scale & Timeline Box -->
						<div class="relative w-full py-8 px-2 select-none">
							<!-- Timeline Bar -->
							<div
								class="relative h-7 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex shadow-inner"
							>
								<!-- 1. Render Race Phases -->
								<!-- Early-Race (yellow): 0 to 1/6 -->
								<div
									class="h-full bg-yellow-100 border-r border-yellow-200 transition-all flex items-center justify-center text-[10px] font-extrabold text-yellow-800 cursor-help"
									style="width: {100 / 6}%"
									onmouseenter={() =>
										(hoveredPhase = "early")}
									onmouseleave={() => (hoveredPhase = null)}
									title="Early-Race Phase: 0 to 1/6 of distance"
								>
									Early
								</div>

								<!-- Mid-Race (purple): 1/6 to 2/3 -->
								<div
									class="h-full bg-purple-100 border-r border-purple-200 transition-all flex items-center justify-center text-[10px] font-extrabold text-purple-800 cursor-help"
									style="width: {50}%"
									onmouseenter={() => (hoveredPhase = "mid")}
									onmouseleave={() => (hoveredPhase = null)}
									title="Mid-Race Phase: 1/6 to 2/3 of distance"
								>
									Mid
								</div>

								<!-- Late-Race (cyan): 2/3 to 100% -->
								<div
									class="h-full bg-cyan-100 transition-all flex items-center justify-center text-[10px] font-extrabold text-cyan-800 cursor-help"
									style="width: {33.33}%"
									onmouseenter={() => (hoveredPhase = "late")}
									onmouseleave={() => (hoveredPhase = null)}
									title="Late-Race Phase: 2/3 to end of distance"
								>
									Late
								</div>
							</div>

							<!-- Overlapping Last Spurt bar below timeline -->
							<div
								class="w-full flex mt-1.5 h-3.5 rounded overflow-hidden"
							>
								<div
									class="h-full bg-transparent"
									style="width: {66.67}%"
								></div>
								<div
									class="h-full bg-rose-200 border border-rose-300 rounded flex items-center justify-center text-[8px] font-bold text-rose-800 cursor-help"
									style="width: {33.33}%"
									onmouseenter={() =>
										(hoveredPhase = "spurt")}
									onmouseleave={() => (hoveredPhase = null)}
									title="Last Spurt: Last 1/3 of race"
								>
									Last Spurt
								</div>
							</div>

							<!-- Timeline Segments row (Straights & Corners) -->
							<div
								class="relative w-full h-8 mt-3 flex items-center"
							>
								<!-- Display segments on timeline -->
								{#each segments as seg}
									{@const startPercent =
										(seg.startDist / trackLength) * 100}
									{@const endPercent =
										(seg.endDist / trackLength) * 100}
									{@const widthPercent =
										endPercent - startPercent}
									{#if widthPercent > 0}
										<div
											class="absolute h-6 rounded-md border flex items-center justify-center text-[9px] font-extrabold shadow-sm transition-all cursor-pointer {seg.type ===
											'corner'
												? 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200'
												: 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'} {hoveredSegmentId ===
											seg.id
												? 'scale-105 shadow ring-2 ring-indigo-400'
												: ''}"
											style="left: {startPercent}%; width: {widthPercent}%"
											onmouseenter={() =>
												(hoveredSegmentId = seg.id)}
											onmouseleave={() =>
												(hoveredSegmentId = null)}
										>
											<span class="truncate px-1"
												>{seg.name}</span
											>
										</div>
									{/if}
								{/each}
							</div>

							<!-- Floating Pins for Markers (Start, Finish, PK, Spurt) -->
							<!-- Start Line Pin -->
							{#if timelineStartPin.visible}
								<div
									class="absolute top-2 w-0.5 h-20 bg-slate-800 group z-20 cursor-help transition-all"
									style="left: {timelineStartPin.percent}%"
									title="Start Line: {timelineStartPin.label}"
								>
									<div
										class="absolute -top-5 -left-3 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded font-black border border-white shadow-md flex items-center gap-0.5"
									>
										🏁 <span>Start</span>
									</div>
								</div>
							{/if}

							<!-- Finish Line Pin -->
							{#if timelineFinishPin.visible}
								<div
									class="absolute top-2 w-0.5 h-20 bg-rose-500 group z-20 cursor-help transition-all"
									style="left: {timelineFinishPin.percent}%"
									title="Finish Line: {timelineFinishPin.label}"
								>
									<div
										class="absolute -top-5 -left-3.5 bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black border border-white shadow-md flex items-center gap-0.5"
									>
										🚩 <span>Finish</span>
									</div>
								</div>
							{/if}

							<!-- Position Keep Ends Pin -->
							{#if timelinePkPin.visible}
								<div
									class="absolute top-3 w-0.5 h-18 bg-purple-500 group z-20 cursor-help transition-all"
									style="left: {timelinePkPin.percent}%"
									title="Position Keep Ends: {timelinePkPin.label}"
								>
									<div
										class="absolute -top-4 -left-4 bg-purple-600 text-white text-[8px] px-1 py-0.5 rounded font-black shadow border border-white"
									>
										🟣 PK
									</div>
								</div>
							{/if}

							<!-- Spurt Starts Pin -->
							{#if timelineSpurtPin.visible}
								<div
									class="absolute top-3 w-0.5 h-18 bg-sky-500 group z-20 cursor-help transition-all"
									style="left: {timelineSpurtPin.percent}%"
									title="Spurt Starts: {timelineSpurtPin.label}"
								>
									<div
										class="absolute -top-4 -left-5 bg-sky-600 text-white text-[8px] px-1 py-0.5 rounded font-black shadow border border-white"
									>
										🔵 Spurt
									</div>
								</div>
							{/if}

							<!-- Timeline ruler/ticks -->
							<div
								class="relative w-full border-t border-slate-300 mt-8 flex justify-between text-[9px] font-bold text-slate-400"
							>
								<span>0m</span>
								<span>{Math.round(trackLength * 0.25)}m</span>
								<span>{Math.round(trackLength * 0.5)}m</span>
								<span>{Math.round(trackLength * 0.75)}m</span>
								<span>{trackLength}m</span>
							</div>
						</div>
					</div>

					<!-- Track Segments Table -->
					<div
						class="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col gap-3"
					>
						<h3
							class="text-sm font-extrabold text-indigo-900 border-b border-indigo-50 pb-1.5 mb-1 flex items-center gap-1.5"
						>
							Segments List
						</h3>

						<div class="overflow-x-auto">
							<table
								class="w-full text-left text-xs border-collapse"
							>
								<thead>
									<tr
										class="border-b border-indigo-50 text-slate-600 uppercase tracking-wider text-[10px] font-black"
									>
										<th class="py-2 px-3">Type</th>
										<th class="py-2 px-3">Name</th>
										<th class="py-2 px-3">Range</th>
										<th class="py-2 px-3">Length</th>
										<th class="py-2 px-3 text-right"
											>Actions</th
										>
									</tr>
								</thead>
								<tbody>
									{#each segments as seg}
										<tr
											class="border-b border-slate-50 transition-colors hover:bg-indigo-50/30 cursor-pointer {hoveredSegmentId ===
											seg.id
												? 'bg-indigo-50/50 font-bold'
												: ''}"
											onmouseenter={() =>
												(hoveredSegmentId = seg.id)}
											onmouseleave={() =>
												(hoveredSegmentId = null)}
										>
											<td class="py-2.5 px-3">
												{#if seg.type === "corner"}
													<span
														class="px-2 py-0.5 bg-orange-100 text-orange-800 border border-orange-200 rounded-md font-bold text-[10px]"
													>
														🔄 Corner
													</span>
												{:else}
													<span
														class="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-bold text-[10px]"
													>
														➡️ Straight
													</span>
												{/if}
											</td>
											<td
												class="py-2.5 px-3 font-bold text-slate-800"
												>{seg.name}</td
											>
											<td
												class="py-2.5 px-3 font-semibold text-slate-600"
												>{seg.startDist}m - {seg.endDist}m</td
											>
											<td
												class="py-2.5 px-3 font-bold text-indigo-700"
												>{seg.endDist -
													seg.startDist}m</td
											>
											<td class="py-2.5 px-3 text-right">
												<button
													class="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md p-1 border border-rose-100 font-extrabold cursor-pointer transition-colors shadow-sm text-[10px] px-2 py-0.5"
													onclick={(e) => {
														e.stopPropagation();
														deleteSegment(seg.id);
													}}
												>
													Delete
												</button>
											</td>
										</tr>
									{/each}
									{#if segments.length === 0}
										<tr>
											<td
												colspan="5"
												class="py-6 text-center font-bold text-slate-400"
											>
												No segments added yet. Click
												"Auto-Gen" or use the form above
												to add segments!
											</td>
										</tr>
									{/if}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Schematic Racetrack Card (Viewer Baru) -->
		<div
			bind:this={schematicCardContainer}
			class="lg:col-span-12 border-4 border-slate-300 rounded-3xl bg-[#f3f4f6] shadow-lg flex flex-col p-6 relative mt-8 z-10 font-fredoka"
		>
			<div
				class="absolute -top-4 left-6 bg-slate-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md z-10"
				data-html2canvas-ignore
			>
				Schematic Racetrack Card (Final View)
			</div>

			<!-- Header section -->
			<div
				class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 mt-2"
			>
				<div>
					<div
						class="text-3xl font-extrabold text-slate-900 leading-none"
					>
						{trackLength} m · {trackType === "dirt"
							? "Dirt"
							: "Turf"}
					</div>
					<div class="text-xs font-semibold text-slate-500 mt-1">
						Schematic track representation with legend details
					</div>
				</div>

				<div class="flex items-center gap-4">
					<!-- Rounded White Pill Tabs -->
					<div
						class="flex bg-slate-200 rounded-full p-1 border border-slate-300"
					>
						<button
							class="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer {activeLapTab ===
							'all'
								? 'bg-white text-slate-900 border border-slate-300 shadow-sm'
								: 'text-slate-600 hover:text-slate-900'}"
							onclick={() => (activeLapTab = "all")}
						>
							All Laps
						</button>
						<button
							class="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer {activeLapTab ===
							'lap1'
								? 'bg-white text-slate-900 border border-slate-300 shadow-sm'
								: 'text-slate-600 hover:text-slate-900'}"
							onclick={() => (activeLapTab = "lap1")}
						>
							Lap 1
						</button>
						{#if lapsCount > 1}
							<button
								class="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer {activeLapTab ===
								'lap2'
									? 'bg-white text-slate-900 border border-slate-300 shadow-sm'
									: 'text-slate-600 hover:text-slate-900'}"
								onclick={() => (activeLapTab = "lap2")}
							>
								Lap 2
							</button>
						{/if}
						{#if lapsCount > 2}
							<button
								class="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer {activeLapTab ===
								'lap3'
									? 'bg-white text-slate-900 border border-slate-300 shadow-sm'
									: 'text-slate-600 hover:text-slate-900'}"
								onclick={() => (activeLapTab = "lap3")}
							>
								Lap 3
							</button>
						{/if}
					</div>
					<button
						class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer {isDownloading
							? 'opacity-50 cursor-not-allowed'
							: ''}"
						onclick={downloadSchematicCard}
						disabled={isDownloading}
						data-html2canvas-ignore
					>
						{isDownloading
							? "⏳ Generating Laps..."
							: "⬇️ Download Image"}
					</button>
				</div>
			</div>

			<!-- Card body content -->
			<div
				class="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch bg-slate-200/40 p-5 rounded-2xl border border-slate-200"
			>
				<!-- LEFT COLUMN: The Legend (3 cols) -->
				<div
					class="md:col-span-3 flex flex-col gap-5 text-xs font-bold text-slate-800 md:border-r border-slate-300 md:pr-6"
				>
					<!-- Terrain -->
					<div>
						<div
							class="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2"
						>
							Terrain
						</div>
						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-2">
								<span
									class="w-3.5 h-3.5 bg-[#5cb85c] rounded border border-emerald-600"
								></span>
								<span class="text-slate-700 whitespace-nowrap"
									>Turf</span
								>
							</div>
							<div class="flex items-center gap-2">
								<span
									class="w-3.5 h-3.5 bg-[#8b5a2b] rounded border border-amber-800"
								></span>
								<span class="text-slate-700 whitespace-nowrap"
									>Dirt</span
								>
							</div>
						</div>
					</div>

					<!-- Phases -->
					<div>
						<div
							class="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2"
						>
							Phases
						</div>
						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-2">
								<span
									class="w-3.5 h-3.5 bg-[#f1db82] rounded border border-yellow-400"
								></span>
								<span class="text-slate-700 whitespace-nowrap"
									>Early-Race</span
								>
							</div>
							<div class="flex items-center gap-2">
								<span
									class="w-3.5 h-3.5 bg-[#c084fc] rounded border border-purple-400"
								></span>
								<span class="text-slate-700 whitespace-nowrap"
									>Mid-Race</span
								>
							</div>
							<div class="flex items-center gap-2">
								<span
									class="w-3.5 h-3.5 bg-[#67e8f9] rounded border border-cyan-400"
								></span>
								<span class="text-slate-700 whitespace-nowrap"
									>Late-Race</span
								>
							</div>
							<div class="flex items-center gap-2">
								<span
									class="w-3.5 h-3.5 bg-[#ff9898] rounded border border-rose-400"
								></span>
								<span class="text-slate-700 whitespace-nowrap"
									>Last Spurt</span
								>
							</div>
						</div>
					</div>

					<!-- Overlaps -->
					<div>
						<div
							class="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2"
						>
							Overlaps
						</div>
						<div class="flex items-center gap-2">
							<span
								class="w-3.5 h-3.5 bg-orange-400 rounded border border-orange-500"
							></span>
							<span class="text-slate-700 whitespace-nowrap"
								>Ear/Spurt</span
							>
						</div>
					</div>

					<!-- Segments -->
					<div>
						<div
							class="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2"
						>
							Segments
						</div>
						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-2.5">
								<span
									class="w-5.5 h-5.5 flex items-center justify-center bg-orange-100 border border-orange-300 text-orange-600 rounded-full font-black text-[10px]"
									>↔️</span
								>
								<span class="text-slate-700 whitespace-nowrap"
									>Straight</span
								>
							</div>
							<div class="flex items-center gap-2.5">
								<span
									class="w-5.5 h-5.5 flex items-center justify-center bg-orange-100 border border-orange-300 text-orange-600 rounded-full font-black text-[10px]"
									>↪️</span
								>
								<span class="text-slate-700 whitespace-nowrap"
									>Corner</span
								>
							</div>
						</div>
					</div>

					<!-- Other -->
					<div>
						<div
							class="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2"
						>
							Other
						</div>
						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-2.5">
								<span
									class="w-5.5 h-5.5 flex items-center justify-center bg-purple-100 border border-purple-300 text-purple-600 rounded-full font-black text-[10px]"
									>⏩</span
								>
								<span class="text-slate-700 whitespace-nowrap"
									>Position Keep Ends</span
								>
							</div>
							<div class="flex items-center gap-2.5">
								<span
									class="w-5.5 h-5.5 flex items-center justify-center bg-sky-100 border border-sky-300 text-sky-600 rounded-full font-black text-[10px]"
									>⏭️</span
								>
								<span class="text-slate-700 whitespace-nowrap"
									>Spurt Starts</span
								>
							</div>
						</div>
					</div>
				</div>

				<!-- RIGHT COLUMN: Schematic Track Diagram (9 cols) -->
				<div
					class="md:col-span-9 bg-slate-200 rounded-2xl border border-slate-300 shadow-inner p-4 relative flex items-center justify-center overflow-hidden min-h-[360px] md:min-h-[420px]"
				>
					<!-- Base Grid Pattern -->
					<div
						class="absolute inset-0 opacity-5 pointer-events-none"
						style="background-image: radial-gradient(circle, #000000 1.5px, transparent 1.5px); background-size: 20px 20px;"
					></div>

					<svg
						bind:this={schematicSvgElement}
						viewBox={schematicViewBox}
						class="w-full h-full min-h-[400px] touch-none cursor-grab active:cursor-grabbing"
						onpointerdown={handleSchematicSvgPointerDown}
						onpointermove={handleSchematicPointerMove}
						onpointerup={handleSchematicPointerUp}
						onpointerleave={handleSchematicPointerUp}
					>
						<!-- Faint reference loop outline -->
						<path
							d={trackCurvePath}
							fill="none"
							stroke="#cbd5e1"
							stroke-width="26"
							stroke-dasharray="4 4"
							opacity="0.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>

						<!-- 1. Smooth Base Track (Terrain) - Clipped dynamically per lap -->
						{#each activeTrackPaths as pathD}
							<path
								d={pathD}
								fill="none"
								stroke={trackType === "dirt"
									? "#8b5a2b"
									: "#5cb85c"}
								stroke-width="26"
								stroke-linecap="round"
								stroke-linejoin="round"
								opacity="0.95"
							/>
						{/each}

						<!-- 2. Phase overlays (color coded) -->
						<!-- Early-Race (yellow) -->
						{#each getPhaseSubPaths("early") as pathD}
							<path
								d={pathD}
								fill="none"
								stroke="#f1db82"
								stroke-width="12"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						{/each}

						<!-- Mid-Race (purple) -->
						{#each getPhaseSubPaths("mid") as pathD}
							<path
								d={pathD}
								fill="none"
								stroke="#c084fc"
								stroke-width="12"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						{/each}

						<!-- Late-Race (cyan) -->
						{#each getPhaseSubPaths("late") as pathD}
							<path
								d={pathD}
								fill="none"
								stroke="#67e8f9"
								stroke-width="12"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						{/each}

						<!-- Last Spurt (red) -->
						{#each getPhaseSubPaths("spurt") as pathD}
							<path
								d={pathD}
								fill="none"
								stroke="#ff9898"
								stroke-width="12"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						{/each}

						<!-- 3. Per-Segment Border Lines (melintang jalan) -->
						{#each segments as seg}
							{#if isLoopDistActive(seg.startDist)}
								{@const lineStart = getPerpendicularLine(
									seg.startDist,
									26,
								)}
								<line
									x1={lineStart.x1}
									y1={lineStart.y1}
									x2={lineStart.x2}
									y2={lineStart.y2}
									stroke="#ffffff"
									stroke-width="3"
									stroke-linecap="round"
								/>
							{/if}
							{#if isLoopDistActive(seg.endDist)}
								{@const lineEnd = getPerpendicularLine(
									seg.endDist,
									26,
								)}
								<line
									x1={lineEnd.x1}
									y1={lineEnd.y1}
									x2={lineEnd.x2}
									y2={lineEnd.y2}
									stroke="#ffffff"
									stroke-width="3"
									stroke-linecap="round"
								/>
							{/if}
						{/each}

						<!-- SVG Markers: Start Line Flag -->
						{#if isMarkerVisible(raceStartAbs) && getPointAndNormalAtDistance(raceStartAbs % trackLength).point}
							{@const startInfo = getPointAndNormalAtDistance(
								raceStartAbs % trackLength,
							)}
							{@const pt = startInfo.point}
							{@const norm = startInfo.normal}
							{@const offsetDist = 24}
							{@const ox = pt.x + norm.x * offsetDist}
							{@const oy = pt.y + norm.y * offsetDist}
							{@const angleDeg =
								(Math.atan2(norm.y, norm.x) * 180) / Math.PI}
							<g>
								<line
									x1={pt.x}
									y1={pt.y}
									x2={ox}
									y2={oy}
									stroke="#333"
									stroke-width="1.5"
									stroke-dasharray="2 2"
								/>
								<g
									transform="translate({ox}, {oy}) rotate({angleDeg})"
								>
									<line
										x1="0"
										y1="0"
										x2="18"
										y2="0"
										stroke="#333"
										stroke-width="1.5"
									/>
									<g transform="translate(18, 0)">
										<rect
											x="0"
											y="-12"
											width="12"
											height="12"
											fill="#fff"
											stroke="#333"
											stroke-width="0.75"
										/>
										<rect
											x="0"
											y="-12"
											width="6"
											height="4"
											fill="#000"
										/>
										<rect
											x="6"
											y="-8"
											width="6"
											height="4"
											fill="#000"
										/>
										<rect
											x="0"
											y="-4"
											width="6"
											height="4"
											fill="#000"
										/>
									</g>
								</g>
								<!-- Label placed dynamically along normal to avoid overlaps -->
								<text
									x={ox + norm.x * 34}
									y={oy + norm.y * 34 + 2.5}
									text-anchor={Math.abs(norm.x) > 0.5
										? norm.x > 0
											? "start"
											: "end"
										: "middle"}
									font-size="8"
									font-weight="bold"
									fill="#333"
									class="bg-white/80 font-fredoka"
								>
									START
								</text>
							</g>
						{/if}

						<!-- SVG Markers: Finish Line Flag -->
						{#if isMarkerVisible(raceEndAbs) && getPointAndNormalAtDistance(raceEndAbs % trackLength).point}
							{@const finishInfo = getPointAndNormalAtDistance(
								raceEndAbs % trackLength,
							)}
							{@const pt = finishInfo.point}
							{@const norm = finishInfo.normal}
							{@const offsetDist = 24}
							{@const ox = pt.x + norm.x * offsetDist}
							{@const oy = pt.y + norm.y * offsetDist}
							{@const angleDeg =
								(Math.atan2(norm.y, norm.x) * 180) / Math.PI}
							<g>
								<line
									x1={pt.x}
									y1={pt.y}
									x2={ox}
									y2={oy}
									stroke="#ef4444"
									stroke-width="1.5"
									stroke-dasharray="2 2"
								/>
								<g
									transform="translate({ox}, {oy}) rotate({angleDeg})"
								>
									<line
										x1="0"
										y1="0"
										x2="18"
										y2="0"
										stroke="#333"
										stroke-width="1.5"
									/>
									<g transform="translate(18, 0)">
										<path
											d="M 0,0 L 0,-12 L 12,-12 L 9,-6 L 12,0 Z"
											fill="#ef4444"
											stroke="#b91c1c"
											stroke-width="1"
											stroke-linejoin="round"
										/>
									</g>
								</g>
								<!-- Label placed dynamically along normal to avoid overlaps -->
								<text
									x={ox + norm.x * 34}
									y={oy + norm.y * 34 + 2.5}
									text-anchor={Math.abs(norm.x) > 0.5
										? norm.x > 0
											? "start"
											: "end"
										: "middle"}
									font-size="8"
									font-weight="bold"
									fill="#ef4444"
									class="bg-white/80 font-fredoka"
								>
									FINISH
								</text>
							</g>
						{/if}

						<!-- SVG Markers: Position Keep Ends -->
						{#if isMarkerVisible(positionKeepEnds) && getPointAndNormalAtDistance(positionKeepEnds % trackLength).point}
							{@const pkInfo = getPointAndNormalAtDistance(
								positionKeepEnds % trackLength,
							)}
							{@const pt = pkInfo.point}
							{@const norm = pkInfo.normal}
							{@const tangent = pkInfo.tangent}
							{@const offsetDist = 22}
							{@const ox = pt.x + norm.x * offsetDist}
							{@const oy = pt.y + norm.y * offsetDist}
							{@const tAngle =
								(Math.atan2(tangent.y, tangent.x) * 180) /
								Math.PI}
							<g>
								<line
									x1={pt.x}
									y1={pt.y}
									x2={ox}
									y2={oy}
									stroke="#7c3aed"
									stroke-width="1"
									stroke-dasharray="2 2"
								/>
								<g
									transform="translate({ox}, {oy}) rotate({tAngle})"
								>
									<polygon
										points="-4,-4 0,0 -4,4"
										fill="#7c3aed"
									/>
									<polygon
										points="0,-4 4,0 0,4"
										fill="#7c3aed"
									/>
								</g>
								<text
									x={ox + norm.x * 12}
									y={oy + norm.y * 12 + 3}
									text-anchor="middle"
									font-size="7"
									font-weight="bold"
									fill="#7c3aed"
									class="font-fredoka">P.K. END</text
								>
							</g>
						{/if}

						<!-- SVG Markers: Spurt Starts -->
						{#if isMarkerVisible(spurtAbs) && getPointAndNormalAtDistance(spurtAbs % trackLength).point}
							{@const spurtInfo = getPointAndNormalAtDistance(
								spurtAbs % trackLength,
							)}
							{@const pt = spurtInfo.point}
							{@const norm = spurtInfo.normal}
							{@const tangent = spurtInfo.tangent}
							{@const offsetDist = 22}
							{@const ox = pt.x + norm.x * offsetDist}
							{@const oy = pt.y + norm.y * offsetDist}
							{@const tAngle =
								(Math.atan2(tangent.y, tangent.x) * 180) /
								Math.PI}
							<g>
								<line
									x1={pt.x}
									y1={pt.y}
									x2={ox}
									y2={oy}
									stroke="#0284c7"
									stroke-width="1"
									stroke-dasharray="2 2"
								/>
								<g
									transform="translate({ox}, {oy}) rotate({tAngle})"
								>
									<polygon
										points="-7,-5 -2,0 -7,5"
										fill="#0284c7"
									/>
									<polygon
										points="-2,-5 3,0 -2,5"
										fill="#0284c7"
									/>
									<polygon
										points="3,-5 8,0 3,5"
										fill="#0284c7"
									/>
								</g>
								<text
									x={ox + norm.x * 14}
									y={oy + norm.y * 14 + 3}
									text-anchor="middle"
									font-size="7"
									font-weight="bold"
									fill="#0284c7"
									class="font-fredoka">SPURT</text
								>
							</g>
						{/if}

						<!-- SVG Markers: Segments (Corners & Straights) -->
						{#each segments as seg, sIdx}
							{@const midDist = (seg.startDist + seg.endDist) / 2}
							{#if isLoopDistActive(midDist)}
								{@const midInfo =
									getPointAndNormalAtDistance(midDist)}
								{#if midInfo.point}
									{@const pt = midInfo.point}
									{@const norm = midInfo.normal}
									{@const offsetDist = 26}
									{@const ox = pt.x + norm.x * offsetDist}
									{@const oy = pt.y + norm.y * offsetDist}
									<g class="opacity-95">
										<line
											x1={pt.x}
											y1={pt.y}
											x2={ox}
											y2={oy}
											stroke="#ea580c"
											stroke-width="1"
											stroke-dasharray="2 2"
										/>
										<g transform="translate({ox}, {oy})">
											<circle
												cx="0"
												cy="0"
												r="8"
												fill="#f97316"
												stroke="#ea580c"
												stroke-width="1"
											/>
											{#if seg.type === "corner"}
												<path
													d="M -3,2 A 3,3 0 0,1 2,-3"
													fill="none"
													stroke="white"
													stroke-width="1.5"
													stroke-linecap="round"
												/>
												<polygon
													points="2,-5 4,-3 2,-1"
													fill="white"
												/>
											{:else}
												<line
													x1="-3"
													y1="0"
													x2="3"
													y2="0"
													stroke="white"
													stroke-width="1.5"
													stroke-linecap="round"
												/>
												<polygon
													points="-3,-2 -5,0 -3,2"
													fill="white"
												/>
												<polygon
													points="3,-2 5,0 3,2"
													fill="white"
												/>
											{/if}
											<text
												x={norm.x * 15}
												y={norm.y * 15 + 2.5}
												text-anchor={Math.abs(norm.x) >
												0.5
													? norm.x > 0
														? "start"
														: "end"
													: "middle"}
												font-size="7"
												font-weight="bold"
												fill="#ea580c"
												class="font-fredoka"
											>
												{seg.type === "corner"
													? "C"
													: "S"}{sIdx + 1}
											</text>
										</g>
									</g>
								{/if}
							{/if}
						{/each}
					</svg>

					<!-- Zoom Controls Overlay (Schematic Card) -->
					<div
						class="absolute bottom-3 right-3 flex flex-col gap-1 z-10 bg-white/80 backdrop-blur-sm border border-slate-300 rounded-lg p-1 shadow-sm font-fredoka"
						data-html2canvas-ignore
					>
						<button
							class="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer shadow-sm"
							onclick={() =>
								(schematicZoom = Math.min(
									5.0,
									schematicZoom * 1.2,
								))}
							title="Zoom In"
						>
							＋
						</button>
						<button
							class="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer shadow-sm"
							onclick={() => {
								schematicZoom = 1.0;
								schematicPanX = 0;
								schematicPanY = 0;
							}}
							title="Reset View"
						>
							⟲
						</button>
						<button
							class="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer shadow-sm"
							onclick={() =>
								(schematicZoom = Math.max(
									0.5,
									schematicZoom / 1.2,
								))}
							title="Zoom Out"
						>
							－
						</button>
					</div>

					<!-- Race Direction Arrow overlay -->
					<div
						class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-300 shadow-sm z-10"
					>
						<span
							class="text-[10px] uppercase font-black tracking-widest text-slate-500 whitespace-nowrap"
							>Race Direction</span
						>
						<span
							class="text-rose-600 font-extrabold text-sm flex items-center animate-pulse whitespace-nowrap"
						>
							{#if trackDirection === "clockwise"}
								➡️ Clockwise
							{:else}
								⬅️ Counter-Clockwise
							{/if}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

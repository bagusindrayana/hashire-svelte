<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

	// State
	let viewMode = $state<'split' | '2d-only' | '3d-only'>('split');
	let trackType = $state<'dirt' | 'turf'>('dirt');
	
	// Default track points (a simple oval)
	let points = $state([
		{ x: 100, y: 100 },
		{ x: 400, y: 100 },
		{ x: 450, y: 250 },
		{ x: 400, y: 400 },
		{ x: 100, y: 400 },
		{ x: 50,  y: 250 }
	]);

	// 2D Editor State
	let draggingIndex = $state<number | null>(null);
	let selectedPointIndex = $state<number | null>(null);
	let trackCurvePoints2D = $state<{x: number, y: number}[]>([]);
	let svgElement: SVGSVGElement;

	function handlePointerDown(e: PointerEvent, index: number) {
		e.stopPropagation();
		selectedPointIndex = index;
		draggingIndex = index;
		e.target?.setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (draggingIndex === null) return;
		
		const pt = svgElement.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		const svgP = pt.matrixTransform(svgElement.getScreenCTM()?.inverse());

		points[draggingIndex] = {
			x: svgP.x,
			y: svgP.y
		};
		// Trigger reactivity
		points = [...points];
		update3DTrack();
	}

	function handlePointerUp(e: PointerEvent) {
		draggingIndex = null;
		e.target?.releasePointerCapture(e.pointerId);
	}

	function handleSvgPointerDown(e: PointerEvent) {
		if ((e.target as Element).tagName === 'svg') {
			selectedPointIndex = null;
		}
	}

	function insertPoint(index: number, newPoint: {x: number, y: number}) {
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
	let trackMaterial = $state<THREE.MeshStandardMaterial | null>(null);
	let dirtTexture = $state<THREE.Texture | null>(null);
	let turfTexture = $state<THREE.Texture | null>(null);

	function init3D() {
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x87ceeb); // Sky blue
		// Fog for depth
		scene.fog = new THREE.FogExp2(0x87ceeb, 0.002);

		camera = new THREE.PerspectiveCamera(60, container3d.clientWidth / container3d.clientHeight, 0.1, 1000);
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
		const grassTexture = textureLoader.load('/images/racetrack/grass.png');
		grassTexture.wrapS = THREE.RepeatWrapping;
		grassTexture.wrapT = THREE.RepeatWrapping;
		grassTexture.repeat.set(80, 80);

		const groundGeo = new THREE.PlaneGeometry(1000, 1000);
		const groundMat = new THREE.MeshStandardMaterial({ 
			map: grassTexture,
			roughness: 0.9 
		});
		const ground = new THREE.Mesh(groundGeo, groundMat);
		ground.rotation.x = -Math.PI / 2;
		ground.receiveShadow = true;
		scene.add(ground);

		// Load track textures
		dirtTexture = textureLoader.load('/images/racetrack/dirt.png');
		dirtTexture.wrapS = THREE.RepeatWrapping;
		dirtTexture.wrapT = THREE.RepeatWrapping;

		turfTexture = textureLoader.load('/images/racetrack/turf.png');
		turfTexture.wrapS = THREE.RepeatWrapping;
		turfTexture.wrapT = THREE.RepeatWrapping;

		// Material for track
		trackMaterial = new THREE.MeshStandardMaterial({ 
			color: 0xffffff, 
			map: trackType === 'dirt' ? dirtTexture : turfTexture,
			roughness: 0.8,
			side: THREE.DoubleSide
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

	function getTrackColor(type: 'dirt' | 'turf') {
		// Dirt is brownish, Turf is a brighter green than the ground
		return type === 'dirt' ? 0x8b5a2b : 0x5cb85c;
	}

	$effect(() => {
		if (trackMaterial) {
			if (trackType === 'dirt' && dirtTexture) {
				trackMaterial.map = dirtTexture;
				trackMaterial.color.setHex(0xffffff);
			} else if (trackType === 'turf' && turfTexture) {
				trackMaterial.map = turfTexture;
				trackMaterial.color.setHex(0xffffff);
			} else {
				trackMaterial.map = null;
				trackMaterial.color.setHex(getTrackColor(trackType));
			}
			trackMaterial.needsUpdate = true;
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

		const vectorPoints = points.map(p => {
			return new THREE.Vector3((p.x - cx) * scale, 1.0, (p.y - cy) * scale); // Raised slightly to avoid Z-fighting
		});

		const curve = new THREE.CatmullRomCurve3(vectorPoints, true, 'centripetal');
		const curvePoints = curve.getSpacedPoints(200);
		
		trackCurvePoints2D = curvePoints.map(p => ({
			x: p.x / scale + cx,
			y: p.z / scale + cy
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
			
			const p1 = new THREE.Vector3().copy(p).add(normal.clone().multiplyScalar(trackWidth / 2));
			const p2 = new THREE.Vector3().copy(p).add(normal.clone().multiplyScalar(-trackWidth / 2));
			
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
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
		geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
		geometry.setIndex(indices);
		geometry.computeBoundingSphere();
		geometry.computeBoundingBox();

		trackMesh = new THREE.Mesh(geometry, trackMaterial);
		trackMesh.receiveShadow = true;
		scene.add(trackMesh);
	}

	onMount(() => {
		const cleanup = init3D();
		return cleanup;
	});


	
	let svgPath = $derived(
		points.length > 0
			? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`
			: ''
	);

	let trackCurvePath = $derived(
		trackCurvePoints2D.length > 0
			? `M ${trackCurvePoints2D.map(p => `${p.x},${p.y}`).join(' L ')} Z`
			: ''
	);

</script>

<svelte:head>
	<title>Racetrack Generator | 3D Horse Racing</title>
</svelte:head>

<div class="flex flex-col h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-hidden">
	
	<!-- Header / Toolbar -->
	<div class="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 shadow-md z-10">
		<h1 class="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
			Racetrack Generator
		</h1>
		
		<div class="flex gap-6 items-center">
			<!-- Track Type Toggle -->
			<div class="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
				<button 
					class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors {trackType === 'dirt' ? 'bg-amber-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}"
					onclick={() => trackType = 'dirt'}
				>
					Dirt
				</button>
				<button 
					class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors {trackType === 'turf' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}"
					onclick={() => trackType = 'turf'}
				>
					Turf
				</button>
			</div>

			<div class="w-px h-6 bg-slate-700"></div>

			<!-- View Mode Toggle -->
			<div class="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
				<button 
					class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors {viewMode === '2d-only' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}"
					onclick={() => viewMode = '2d-only'}
					title="2D Editor Only"
				>
					2D Editor
				</button>
				<button 
					class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors {viewMode === 'split' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}"
					onclick={() => viewMode = 'split'}
					title="Split Screen"
				>
					Split
				</button>
				<button 
					class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors {viewMode === '3d-only' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}"
					onclick={() => viewMode = '3d-only'}
					title="3D Preview Only"
				>
					3D Preview
				</button>
			</div>
		</div>
	</div>

	<!-- Main Workspace -->
	<div class="flex-1 flex overflow-hidden">
		
		<!-- 2D Editor Pane -->
		<div 
			class="relative bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col"
			style="width: {viewMode === 'split' ? '50%' : viewMode === '2d-only' ? '100%' : '0%'}; display: {viewMode === '3d-only' ? 'none' : 'flex'}"
		>
			<div class="absolute top-4 left-4 pointer-events-none z-10 text-slate-500 text-sm font-medium bg-slate-900/50 px-3 py-1 rounded-full backdrop-blur-sm">
				Top-down 2D Map (Drag points to edit)
			</div>
			
			<div class="flex-1 w-full h-full p-4 flex items-center justify-center">
				<div class="w-full max-w-[600px] aspect-square bg-slate-900 rounded-xl border border-slate-800 shadow-inner overflow-hidden relative">
					<!-- Grid Background -->
					<div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(circle, #ffffff 1px, transparent 1px); background-size: 20px 20px;"></div>
					
					<svg 
						bind:this={svgElement}
						viewBox="0 0 500 500" 
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
							stroke={trackType === 'dirt' ? '#8b5a2b' : '#5cb85c'} 
							stroke-width="24" 
							stroke-linecap="round"
							stroke-linejoin="round"
							opacity="0.8"
						/>

						<!-- Helper Path (straight lines) -->
						<path 
							d={svgPath} 
							fill="none" 
							stroke="#334155" 
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
									x1={points[i-1].x} y1={points[i-1].y} 
									x2={point.x} y2={point.y} 
									stroke="#475569" stroke-width="2" 
								/>
							{/if}
							<!-- Close loop -->
							{#if i === points.length - 1}
								<line 
									x1={point.x} y1={point.y} 
									x2={points[0].x} y2={points[0].y} 
									stroke="#475569" stroke-width="2" 
								/>
							{/if}

							<!-- Midpoint Add Buttons (Visible on hover) -->
							<g 
								class="cursor-pointer group"
								onclick={(e) => { e.stopPropagation(); insertPoint(nextIdx, {x: midX, y: midY}); }}
							>
								<circle cx={midX} cy={midY} r="14" fill="transparent" />
								<circle cx={midX} cy={midY} r="10" fill="#1e293b" stroke="#475569" stroke-width="2" class="opacity-0 group-hover:opacity-100 transition-opacity" />
								<text x={midX} y={midY} text-anchor="middle" dominant-baseline="central" fill="#94a3b8" font-size="14" font-weight="bold" class="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">+</text>
							</g>

							<!-- Interaction Area -->
							<circle 
								cx={point.x} cy={point.y} 
								r="16" 
								fill="transparent" 
								class="cursor-grab hover:cursor-grabbing"
								onpointerdown={(e) => handlePointerDown(e, i)}
							/>
							<!-- Visible Dot -->
							<circle 
								cx={point.x} cy={point.y} 
								r="6" 
								fill={draggingIndex === i ? '#38bdf8' : selectedPointIndex === i ? '#facc15' : '#e2e8f0'} 
								stroke="#0f172a"
								stroke-width="2"
								class="pointer-events-none transition-colors"
							/>
						{/each}

						<!-- Selected Point Action (Delete) -->
						{#if selectedPointIndex !== null && points[selectedPointIndex]}
							{@const p = points[selectedPointIndex]}
							{#if points.length > 3}
								<g class="cursor-pointer" onclick={(e) => { e.stopPropagation(); removePoint(selectedPointIndex!); }}>
									<circle cx={p.x + 15} cy={p.y - 15} r="10" fill="#ef4444" stroke="#7f1d1d" stroke-width="1" />
									<text x={p.x + 15} y={p.y - 15} text-anchor="middle" dominant-baseline="central" fill="white" font-size="10" font-weight="bold" class="pointer-events-none">X</text>
								</g>
							{/if}
						{/if}
					</svg>
				</div>
			</div>
		</div>

		<!-- 3D Preview Pane -->
		<div 
			class="relative bg-black transition-all duration-300 ease-in-out"
			style="width: {viewMode === 'split' ? '50%' : viewMode === '3d-only' ? '100%' : '0%'}; display: {viewMode === '2d-only' ? 'none' : 'block'}"
		>
			<div class="absolute top-4 right-4 pointer-events-none z-10 text-white/70 text-sm font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
				3D Preview (Scroll to zoom, drag to rotate)
			</div>
			
			<div bind:this={container3d} class="w-full h-full outline-none"></div>
		</div>
	</div>
</div>

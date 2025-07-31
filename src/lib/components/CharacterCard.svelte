<script>
	import { viewport } from "$lib/actions/viewport.js";

	/** @type { { name: string; va: string; color: string; } } */
	export let kuda;
	/** @type {number} */
	export let index;

	const div = document.createElement("div");
	div.innerHTML = kuda.name;
	const textName = div.textContent;

	const colors = {
		Pink: "ec4899",
		Hijau: "10b981",
		Biru: "3b82f6",
		Merah: "ef4444",
		gray: "6b7280",
		Kuning: "eab308",
		teal: "14b8a6",
		purple: "a855f7",
		Hitam: "242424",
		Napas: "888056",
		Jragem: "000000",
		Bopong: "8B4513",
		Kelabu: "bbb286",
	};
	const hexColor = colors[kuda.color_name] || "cccccc";
	const placeholderUrl = `https://placehold.co/300x400/{hexColor}/white?text={textName.split(" ")[0]}`;

	const tailwindBreakpoints = {
		sm: 640,
		md: 768,
		lg: 1024,
		xl: 1280,
		"2xl": 1536,
	};

	const getBreakpoint = (width) => {
		if (width >= tailwindBreakpoints["2xl"]) return 5;
		if (width >= tailwindBreakpoints.xl) return 5;
		if (width >= tailwindBreakpoints.lg) return 5;
		if (width >= tailwindBreakpoints.md) return 4;
		if (width >= tailwindBreakpoints.sm) return 3;
		return 2; // anything smaller than sm
	};

	let currentBreakpoint = getBreakpoint(window.innerWidth);

	const handleResize = () => {
		const newBreakpoint = getBreakpoint(window.innerWidth);
		if (newBreakpoint !== currentBreakpoint) {
			console.log(
				`Breakpoint changed: {currentBreakpoint} → {newBreakpoint}`,
			);
			currentBreakpoint = newBreakpoint;
			// You can trigger your logic here
		}
	};

	window.addEventListener("resize", handleResize);
</script>

<div
	class="kuda-card bg-white shadow-lg overflow-hidden card-border-{kuda.color_name}"
	style="transition-delay: {(index % currentBreakpoint) * 100}ms;"
	use:viewport
>
	<!-- <img
		src={placeholderUrl}
		alt="[Gambar {textName}]"
		class="w-full h-48 object-cover"
		on:error={() => {
			this.onerror = null;
			this.src =
				"https://placehold.co/300x400/cccccc/ffffff?text=Not+Found";
		}}
	/>
	<div class="p-4 text-center">
		<h3 class="font-bold text-lg text-gray-800">{textName}</h3>
		<p class="text-sm text-gray-500">OW: {kuda.owner}</p>
	</div> -->
	<div class="p-1 flex-grow">
		<h3
			class="font-extrabold text-xl text-center text-gray-100 mb-2 md:mb-4 py-1 md:py-2 border-b"
			style="background-color:  #{hexColor};"
		>
			{textName}
		</h3>
		<div class="text-sm text-gray-700 space-y-1 md:space-y-2 p-1 md:p-3">
			<div class="flex justify-between items-center">
				<span class="font-semibold text-gray-500"
					>Trah / Lahir / Tinggi:</span
				>
				<span class="font-bold"
					>{kuda.generation_name} / {kuda.birth_year} / {kuda.height}</span
				>
			</div>
			<hr class="my-2" />
			<div class="flex justify-between">
				<span class="font-semibold text-gray-500">Pejantan:</span>
				<span class="text-right font-medium">{kuda.father_name}</span>
			</div>
			<div class="flex justify-between">
				<span class="font-semibold text-gray-500">Induk:</span>
				<span class="text-right font-medium">{kuda.mother_name}</span>
			</div>
			<hr class="my-2" />
			<div class="flex justify-between">
				<span class="font-semibold text-gray-500">Pelatih:</span>
				<span class="text-right font-medium">{kuda.trainer}</span>
			</div>
			<div class="flex justify-between">
				<span class="font-semibold text-gray-500">Pemilik:</span>
				<span class="text-right font-medium">{kuda.owner}</span>
			</div>
		</div>
	</div>
</div>

<style>
	/* Semua style spesifik untuk kartu ada di sini dan otomatis di-scope oleh Svelte */
	.card-border-Hitam {
		border-left: 8px solid #474747;
	}
	.card-border-Pink {
		border-left: 8px solid #f472b6;
	}
	.card-border-Hijau {
		border-left: 8px solid #34d399;
	}
	.card-border-Biru {
		border-left: 8px solid #60a5fa;
	}
	.card-border-Merah {
		border-left: 8px solid #f87171;
	}
	.card-border-gray {
		border-left: 8px solid #9ca3af;
	}
	.card-border-Kuning {
		border-left: 8px solid #facc15;
	}
	.card-border-Napas {
		border-left: 8px solid #faf0be;
	}
	.card-border-Jragem {
		border-left: 8px solid #242424;
	}
	.card-border-Bopong {
		border-left: 8px solid #af591c;
	}

	.card-border-Kelabu {
		border-left: 8px solid #d3d3d3;
	}

	.kuda-card {
		opacity: 0;
		transform: translateY(50px);
		transition:
			opacity 0.6s ease-out,
			transform 0.6s ease-out;
	}

	.kuda-card.is-visible {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 0.6s ease-out,
			transform 0.3s ease-out;
	}

	.kuda-card.is-visible:hover {
		transform: translateY(-8px);
	}
</style>

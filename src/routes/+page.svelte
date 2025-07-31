<script>
	import Header from "$lib/components/Header.svelte";
	import CharacterCard from "$lib/components/CharacterCard.svelte";
	import * as AOS from "aos";
	import { onMount } from "svelte";

	import * as THREE from "three";
	import { OrbitControls } from "three/addons/controls/OrbitControls.js";
	import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

	let dataKuda = null;

	let selectKuda = null;

	function selectCard(kuda) {
		const overlay = document.getElementById("overlay");
		selectKuda = kuda;
		// overlay.classList.remove('hidden');
		setTimeout(() => {
			overlay.classList.remove("reveal");
		}, 100);
	}

	function closeCard(){
		const overlay = document.getElementById("overlay");
		overlay.classList.add("reveal");
		setTimeout(() => {
			
			selectKuda = null;
		}, 1100);
	}

	onMount(async () => {
		const res = await fetch("/api/horse");
		dataKuda = await res.json();

	});
</script>

<svelte:head>
	<title>Home</title>
	<style>
		body {
			font-family: "Inter", sans-serif;
		}
	</style>
</svelte:head>

<Header />

<main class="container mx-auto px-6 py-12 relative">
	<div class="title-banner">Kuda Aktif</div>

	<div class="mt-8">
		<div
			class="flex flex-col md:flex-row items-start md:items-center justify-between"
		>
			<h2 class="text-4xl font-bold text-gray-800 mb-4 md:mb-0">
				Database Kuda Aktif
			</h2>
			<div class="flex items-center space-x-4">
				<div class="relative">
					<select
						class="appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
					>
						<option>Sort By: Default</option>
						<option>Sort By: Name</option>
						<option>Sort By: Rarity</option>
					</select>
					<div
						class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
					>
						<svg class="fill-current h-4 w-4" viewBox="0 0 20 20"
							><path
								d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
							/></svg
						>
					</div>
				</div>
				<button
					class="search-button text-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-300"
				>
					<svg
						class="w-5 h-5 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						></path></svg
					>
					Search
				</button>
			</div>
		</div>
	</div>

	<div
		class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8"
	>
		{#if dataKuda}
			{#each dataKuda.data as kuda, index}
				<CharacterCard
					{kuda}
					{index}
					onClick={() => {
						selectCard(kuda);
					}}
				/>
			{/each}
		{/if}
	</div>

	<div
		id="overlay"
		class={`fixed inset-0 z-10 top-[50px] overflow-hidden reveal ${selectKuda == null ? "hidden" : ""}`}
	>
		<div
			class={`panel-top-left absolute inset-0 transition-transform duration-1000 ${selectKuda !== null ? `bg-2-${selectKuda.color_name}` : ""}`}
			style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);"
		></div>
		<div
			class={`panel-bottom-right absolute inset-0 transition-transform duration-1000 ${selectKuda !== null ? `bg-1-${selectKuda.color_name}` : ""}`}
			style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);"
		></div>
		<div
			class="absolute w-1/2 bottom-0 top-0 right-0 bg-white side-panel transition-transform duration-1000"
			style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);"
		>
			<button class="absolute top-10 right-10 hover:scale-125" onclick={closeCard}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					x="0px"
					y="0px"
					width="50"
					height="50"
					viewBox="0 0 128 128"
				>
					<path
						fill="#fff"
						d="M64 9A55 55 0 1 0 64 119A55 55 0 1 0 64 9Z"
						transform="rotate(-45.001 64 64.001)"
					></path><path
						fill="#ff5576"
						d="M64 24A40 40 0 1 0 64 104A40 40 0 1 0 64 24Z"
						transform="rotate(-45.001 64 64.001)"
					></path><path
						fill="#444b54"
						d="M64,122c-15.5,0-30.1-6-41-17C12,94.1,6,79.5,6,64s6-30.1,17-41c11-11,25.5-17,41-17s30.1,6,41,17l0,0l0,0 c11,11,17,25.5,17,41s-6,30.1-17,41C94.1,116,79.5,122,64,122z M64,12c-13.9,0-26.9,5.4-36.8,15.2S12,50.1,12,64 s5.4,26.9,15.2,36.8S50.1,116,64,116s26.9-5.4,36.8-15.2S116,77.9,116,64s-5.4-26.9-15.2-36.8l0,0C90.9,17.4,77.9,12,64,12z"
					></path><path
						fill="#fff"
						d="M68.2,64l11.3-11.3c1.2-1.2,1.2-3.1,0-4.2c-1.2-1.2-3.1-1.2-4.2,0L64,59.8L52.7,48.4c-1.2-1.2-3.1-1.2-4.2,0 c-1.2,1.2-1.2,3.1,0,4.2L59.8,64L48.4,75.3c-1.2,1.2-1.2,3.1,0,4.2c0.6,0.6,1.4,0.9,2.1,0.9s1.5-0.3,2.1-0.9L64,68.2l11.3,11.3 c0.6,0.6,1.4,0.9,2.1,0.9s1.5-0.3,2.1-0.9c1.2-1.2,1.2-3.1,0-4.2L68.2,64z"
					></path>
				</svg>
			</button>
		</div>
	</div>
</main>

<style>
	/* Style global yang tidak terkait komponen ditaruh di sini */
	.title-banner {
		position: relative;
		color: white;
		padding: 0.75rem 2rem;
		display: inline-block;
		font-weight: 800;
		font-size: 2.25rem;
		margin-left: -20px;
		clip-path: polygon(0 0, 100% 0, 95% 100%, 0% 100%);
		background: linear-gradient(to right, #8a2be2, #a966f7);
	}

	.search-button {
		background-color: #4a5568;
	}
	.search-button:hover {
		background-color: #2d3748;
	}
</style>

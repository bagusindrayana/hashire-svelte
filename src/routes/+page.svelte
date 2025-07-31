<script>
	import Header from '$lib/components/Header.svelte';
	import CharacterCard from '$lib/components/CharacterCard.svelte';
    import * as AOS from "aos";
    import { onMount } from 'svelte';

    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


    let dataKuda = null;


    onMount(async ()=>{
        const res = await fetch('/api/horse');
        dataKuda = await res.json();
        AOS.init();
    });
</script>

<svelte:head>
    <title>Home</title>
	<style>
		body {
			font-family: 'Inter', sans-serif;
		}
	</style>
</svelte:head>

<Header />

<main class="container mx-auto px-6 py-12">
	<div class="title-banner">Kuda Aktif</div>

	<div class="mt-8">
		<div class="flex flex-col md:flex-row items-start md:items-center justify-between">
			<h2 class="text-4xl font-bold text-gray-800 mb-4 md:mb-0">Database Kuda Aktif</h2>
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
							><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg
						>
					</div>
				</div>
				<button
					class="search-button text-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-300"
				>
					<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"
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

	<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8">
        {#if dataKuda}
            {#each dataKuda.data as kuda, index}
                <CharacterCard {kuda} {index} />
            {/each}
        {/if}
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
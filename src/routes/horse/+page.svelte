<script>
	import CharacterCard from "$lib/components/CharacterCard.svelte";
	import { onMount } from "svelte";
	import { quintOut } from "svelte/easing";
	import { slide } from "svelte/transition";

	import * as THREE from "three";
	import { OrbitControls } from "three/addons/controls/OrbitControls.js";
	import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
	import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

	import { loadMixamoAnimation } from "$lib/utils/loadMixamoAnimation.js";
	import { cleanName } from "$lib/utils/cleanName.js";
	import { randomChar } from "$lib/utils/randomChar.js";

	import {
		generateWarnaDenganSeed,
		createSeededDarkColorGenerator,
		generateWarnaKuda,
		mulberry32,
	} from "$lib/utils/generatorWarna";
	import CharacterDetail from "$lib/components/CharacterDetail.svelte";
	import SilsilahTable from "$lib/components/SilsilahTable.svelte";
	import UmazingButton from "$lib/components/UmazingButton.svelte";

	import { replaceState, pushState } from "$app/navigation";

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	let dataKuda = $state([]);
	let sortedKuda = $state([]);
	let loadingKuda = $state(true);

	let selectKuda = $state(null);
	let detailKuda = $state(null);
	let loadingDetail = $state(false);

	let sortBy = $state("name");

	let isExpanded = $state(false);
	let inputElement = $state();
	let searchText = $state("");

	let sortedKudaDebounced = $derived.by(() => {
		const searchResults = dataKuda.filter((kuda) => {
			return kuda.name.toLowerCase().includes(searchText.toLowerCase());
		});

		return [...searchResults].sort((a, b) => {
			if (sortBy === "name") {
				return a.name.localeCompare(b.name);
			} else if (sortBy === "height") {
				return `${a.height}`.localeCompare(`${b.height}`);
			} else if (sortBy === "birth_year") {
				return `${a.birth_year}`.localeCompare(b.birth_year);
			} else {
				return true;
			}
		});
	});

	// For the debounced effect, use $effect with a timer
	$effect(() => {
		sortedKuda = [];
		const timer = setTimeout(() => {
			sortedKuda = sortedKudaDebounced;
		}, 200);
		sortBy;
		searchText;
		return () => clearTimeout(timer);
	});

	// Fungsi untuk toggle search bar
	function toggleSearch() {
		isExpanded = !isExpanded;

		// Fokus otomatis pada input saat muncul
		if (isExpanded) {
			// Timeout kecil diperlukan agar elemen sempat dirender sebelum difokuskan
			setTimeout(() => {
				inputElement?.focus();
			}, 50);
		}
	}

	// Fungsi untuk menutup search bar saat menekan tombol Escape
	function handleKeydown(event) {
		if (event.key === "Escape") {
			isExpanded = false;
		}
	}

	let canvas,
		scene,
		helperRoot,
		camera,
		renderer,
		animationId = null;
	const listIdleAnimation = [
		"/animation/Standing Idle.fbx",
		"/animation/Dwarf Idle.fbx",
		"/animation/Dwarf Idle (1).fbx",
		"/animation/Catwalk Idle Twist L.fbx",
		"/animation/Arm Stretching.fbx",
		"/animation/Catwalk Idle 01.fbx",
		"/animation/Shoulder Rubbing.fbx",
		"/animation/Blow A Kiss.fbx",
		"/animation/Crazy Gesture.fbx",

		"/animation/Being Cocky.fbx",
		"/animation/Excited.fbx",
		"/animation/Fist Pump.fbx",
		"/animation/Happy Idle (1).fbx",
		"/animation/Happy Idle.fbx",
		"/animation/Happy.fbx",
		"/animation/Listening To Music.fbx",
		"/animation/Offensive Idle.fbx",
		"/animation/Warrior Idle.fbx",
	];

	const defaultModelUrl = "/combine_vrm_007.vrm";

	let currentVrm = undefined;
	let currentAnimationUrl = undefined;

	let currentMixer = undefined;
	let currentAction = undefined;

	let selectKudaIndex = 0;

	let blinkMesh;
	let blinkIndex;

	let blinkCooldown = 0;
	let blinkTimer = 0;
	let isBlinking = false;
	let blinkProgress = 0;
	let faceType = 0;

	function selectCard(kuda, index) {
		disposeThreeJS();
		const overlay = document.getElementById("overlay");
		selectKuda = kuda;
		selectKudaIndex = index;

		if (data.openHorse) {
			const url = new URL(window.location.toString());
			url.searchParams.delete("id");
			replaceState(url.pathname, {});
			data.openHorse = null;
			data.idHorse = null;
		}

		if (data.idHorse == null) {
			pushState(`/horse?id=${selectKuda.id ?? selectKuda.name}`);
			data.idHorse = selectKuda.id ?? selectKuda.name;
			data.openHorse = {
				profil: {
					id: selectKuda.id,
					nama: selectKuda.name,
				},
			};
		}

		getDetail(selectKuda.id ?? selectKuda.name);

		setTimeout(async () => {
			overlay.classList.remove("reveal");
			initThreeJS();
			await randomKuda(kuda);
			setTimeout(() => {
				document.getElementById("tombol").classList.remove("hidden");
				canvas.classList.remove("opacity-0");
			}, 500);
		}, 100);
	}

	function closeCard() {
		const overlay = document.getElementById("overlay");
		overlay.classList.add("reveal");
		canvas.classList.add("opacity-0");
		document.getElementById("tombol").classList.add("hidden");

		const url = new URL(window.location.toString());
		url.searchParams.delete("id");
		replaceState(url.pathname, {});
		data.openHorse = null;
		data.idHorse = null;

		setTimeout(() => {
			selectKuda = null;
			detailKuda = null;
			disposeThreeJS();
		}, 1100);
	}

	function stringToSeed(str) {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	}

	function seededRandom(seed) {
		return function () {
			let t = (seed += 0x6d2b79f5);
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	function loadVRM(modelUrl) {
		document.getElementById("full-loading").classList.remove("hidden");
		const loader = new GLTFLoader();
		loader.crossOrigin = "anonymous";

		if (helperRoot) {
			helperRoot.clear();
		}

		loader.register((parser) => {
			return new VRMLoaderPlugin(parser, {
				// helperRoot: helperRoot,
				autoUpdateHumanBones: true,
			});
		});

		loader.load(
			// URL of the VRM you want to load
			modelUrl,

			// called when the resource is loaded
			(gltf) => {
				const vrm = gltf.userData.vrm;

				// calling this function greatly improves the performance
				VRMUtils.removeUnnecessaryVertices(gltf.scene);
				VRMUtils.combineSkeletons(gltf.scene);
				VRMUtils.combineMorphs(vrm);

				// rotate if the VRM is VRM0.0
				VRMUtils.rotateVRM0(vrm);

				// put the model to the scene
				currentVrm = vrm;
				document.getElementById("full-loading").classList.add("hidden");

				if (data != null && data.idHorse != null) {
					for (let i = 0; i < dataKuda.length; i++) {
						const k = dataKuda[i];
						if (
							(data.openHorse.profil != null &&
								k.name.toLowerCase() ==
									data.openHorse.profil.nama.toLowerCase()) ||
							k.id == data.idHorse
						) {
							selectCard(k);
							break;
						}
					}
				}
			},

			// called while loading is progressing
			(progress) =>
				console.log(
					"Loading model...",
					100.0 * (progress.loaded / progress.total),
					"%",
				),

			// called when loading has errors
			(error) => {
				alert(error);
				document.getElementById("full-loading").classList.add("hidden");
				console.error(error);
			},
		);
	}

	async function randomKuda(kuda) {
		if (currentVrm) {
			if (scene) {
				scene.remove(currentVrm.scene);
			}
			VRMUtils.deepDispose(currentVrm.scene);
		}

		const rc = randomChar(kuda, currentVrm);
		currentVrm = rc.vrm;

		if (scene) {
			scene.add(currentVrm.scene);
		}
		const randomAnimationIndex = Math.floor(
			rc.random() * listIdleAnimation.length,
		);
		currentAnimationUrl = listIdleAnimation[randomAnimationIndex];

		blinkMesh = null;
		blinkIndex = null;
		blinkCooldown = 0;
		blinkTimer = 0;
		isBlinking = false;
		blinkProgress = 0;

		faceType = rc.randomFace;

		// currentVrm.scene.traverse((child) => {
		// 	if (child.isMesh && child.morphTargetDictionary && child.name.includes("Face_" + String(rc.randomFace).padStart(3, "0"))) {
		// 		// Find the index of the "Blink" shape key
		// 		if ("Fcl_EYE_Close" in child.morphTargetDictionary) {
		// 			blinkMesh = child;
		// 			blinkIndex = child.morphTargetDictionary["Fcl_EYE_Close"];
		// 		}
		// 	}
		// });

		if (randomAnimationIndex == 7) {
			currentVrm.scene.traverse((obj) => {
				if (obj.isMesh && obj.morphTargetInfluences) {
					const i1 = obj.morphTargetDictionary["Fcl_MTH_Small"];
					if (i1 !== undefined) {
						obj.morphTargetInfluences[i1] = 0.7;
					}

					const i2 = obj.morphTargetDictionary["Fcl_MTH_U"];
					if (i2 !== undefined) {
						obj.morphTargetInfluences[i2] = 0.5;
					}
				}
			});
		} else {
			currentVrm.scene.traverse((obj) => {
				if (obj.isMesh && obj.morphTargetInfluences) {
					const i1 = obj.morphTargetDictionary["Fcl_MTH_Small"];
					if (i1 !== undefined) {
						obj.morphTargetInfluences[i1] = 0;
					}

					const i2 = obj.morphTargetDictionary["Fcl_MTH_U"];
					if (i2 !== undefined) {
						obj.morphTargetInfluences[i2] = 0;
					}
				}
			});
		}
		currentMixer = new THREE.AnimationMixer(currentVrm.scene);

		

		if (currentAnimationUrl) {
			await loadFBX(currentAnimationUrl);
		}

		if (rc.cameraLookAtPos != null && rc.cameraLookAtPos != undefined) {
			camera.lookAt(rc.cameraLookAtPos);
		}
	}

	// mixamo animation
	async function loadFBX(animationUrl) {
		currentAnimationUrl = animationUrl;

		if (currentMixer) {
			// Load animation
			const clip = await loadMixamoAnimation(animationUrl, currentVrm);

			const newAction = currentMixer.clipAction(clip);
			newAction.reset().play();

			if (currentAction && currentAction !== newAction) {
				currentAction.crossFadeTo(newAction, 0.5, false);
			}

			currentAction = newAction;
		}
	}

	function initThreeJS() {
		// renderer
		renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		renderer.setSize(canvas.clientWidth, canvas.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		// renderer.setClearColor(0x000000, 0);
		canvas.appendChild(renderer.domElement);

		// camera
		camera = new THREE.PerspectiveCamera(
			30.0,
			canvas.clientWidth / canvas.clientHeight,
			0.1,
			20.0,
		);
		camera.position.set(0, 1, 3);

		// scene
		scene = new THREE.Scene();

		// light
		const light = new THREE.DirectionalLight(0xffffff, Math.PI);
		light.position.set(1.0, 1.0, 1.0).normalize();
		scene.add(light);

		helperRoot = new THREE.Group();
		helperRoot.renderOrder = 10000;
		scene.add(helperRoot);

		const clock = new THREE.Clock();

		function animate() {
			animationId = requestAnimationFrame(animate);

			const deltaTime = clock.getDelta();

			// if animation is loaded
			if (currentMixer) {
				// update the animation
				currentMixer.update(deltaTime);
			}

			if (currentVrm) {
				currentVrm.update(deltaTime);
			}

			if(faceType > 0 && currentVrm != null){
				updateBlink(deltaTime);
			}

			renderer.render(scene, camera);
		}

		animate();
	}

	function disposeThreeJS() {
		if (scene) {
			// Cancel animation
			cancelAnimationFrame(animationId);

			// Dispose scene
			scene.traverse((object) => {
				if (object.geometry) object.geometry.dispose();
				if (object.material) {
					if (Array.isArray(object.material)) {
						object.material.forEach((mat) => mat.dispose());
					} else {
						object.material.dispose();
					}
				}
			});

			// Remove renderer canvas
			renderer.domElement.remove();
			renderer.dispose();
		}
	}

	function updateBlink(deltaTime) {
		if (!currentVrm) return;

		// Countdown until next blink
		blinkCooldown -= deltaTime;

		if (!isBlinking && blinkCooldown <= 0) {
			isBlinking = true;
			blinkProgress = 0;
		}

		if (isBlinking) {
			blinkProgress += deltaTime;

			const blinkDuration = 0.2; // seconds
			const half = blinkDuration / 2;

			let value = 0;
			if (blinkProgress < half) {
				// Closing eyes
				value = blinkProgress / half;
			} else if (blinkProgress < blinkDuration) {
				// Opening eyes
				value = 1 - (blinkProgress - half) / half;
			} else {
				// End of blink
				value = 0;
				isBlinking = false;
				blinkCooldown = 3 + Math.random() * 4; // next blink in 3–7 sec
			}

			// blinkMesh.morphTargetInfluences[blinkIndex] = value;

			currentVrm.scene.traverse((child) => {
				if (child.isMesh && child.morphTargetDictionary && child.name.includes("Face_" + String(faceType).padStart(3, "0"))) {
					// Find the index of the "Blink" shape key
					if ("Fcl_EYE_Close" in child.morphTargetDictionary) {
						child.morphTargetInfluences[child.morphTargetDictionary["Fcl_EYE_Close"]] = value;
					}
				}
			});
		}
	}

	async function getDetail(id) {
		loadingDetail = true;
		try {
			const res = await fetch(`/api/horse?id=${id}`);
			const json = await res.json();
			detailKuda = json;
		} catch (error) {
			alert(error);
		}
		loadingDetail = false;
	}

	onMount(async () => {
		loadingKuda = true;
		loadVRM(defaultModelUrl);

		try {
			const res = await fetch("/api/horse");
			const json = await res.json();
			dataKuda = json.data;
			sortedKuda = dataKuda;
		} catch (error) {
			alert(error);
		}
		loadingKuda = false;

		canvas = document.getElementById("myCanvasContainer");
	});
</script>

<svelte:head>
	{#if data.openHorse != null}
		<title>{cleanName(data.openHorse.profil.nama)}</title>
	{:else if selectKuda != null}
		<title>{cleanName(selectKuda.name)}</title>
	{:else}
		<title>Database Kuda Pacu</title>
	{/if}
	<meta name="description" content="Database Kuda Pacu">
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<main class="container mx-auto px-6 py-20 relative min-h-[90vh]">
	<div class="title-banner text-lg md:text-2xl ml-0 md:-ml-4">Kuda Pacu</div>

	<div class="mt-4 md:mt-8">
		<div
			class="flex flex-col md:flex-row items-start md:items-center justify-between"
		>
			<h2
				class="text-xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-0 relative"
			>
				Database Kuda Pacu <small class="px-2 py-1 bg-purple-400 rounded-full text-xs absolute -top-1 text-white">{ sortedKuda.length }</small>
			</h2>
			<div class="flex items-center space-x-4">
				<div class="relative">
					<select
						bind:value={sortBy}
						class="appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
					>
						<option value="name">Sort By: Name</option>
						<option value="height">Sort By: Height</option>
						<option value="birth_year">Sort By: Birth Year</option>
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

				<div
					class="flex items-center bg-purple-700 rounded-full transition-all duration-300"
				>
					<button
						onclick={toggleSearch}
						class="search-button text-white p-3 rounded-full flex-shrink-0 z-10
						hover:bg-purple-600 focus:outline-none transition-colors duration-200"
						aria-label="Toggle Search"
					>
						<svg
							class="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							></path>
						</svg>
					</button>

					{#if isExpanded}
						<div class="input-wrapper overflow-hidden">
							<input
								bind:this={inputElement}
								bind:value={searchText}
								type="text"
								placeholder="Search..."
								transition:slide={{
									duration: 300,
									easing: quintOut,
									axis: "x",
								}}
								class="w-48 bg-transparent text-white placeholder-gray-200 outline-none pr-4"
							/>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div
		class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 mt-8"
	>
		{#each sortedKuda as kuda, index}
			<CharacterCard
				{kuda}
				{index}
				onClick={() => {
					selectCard(kuda, index);
				}}
			/>
		{/each}

		{#if loadingKuda}
			<div class="loader w-24 absolute m-auto text-center">
				<img src="images/Logo_Hashire.png" alt="Loading..." />
				<small>Loading...</small>
			</div>
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
			id="myCanvasContainer"
			class="absolute w-full md:w-1/2 bottom-0 top-0 left-0 right-0 md:right-auto h-screen z-50 opacity-0 transition-all duration-500"
		></div>

		<div
			id="tombol"
			class="relative w-full md:w-1/2 bottom-0 -top-6 left-0 right-0 md:right-auto h-screen hidden"
		>
			<button
				class="absolute left-10 top-0 bottom-0 h-12 z-50 w-12 text-gray-100 cursor-pointer m-auto"
				onclick={() => {
					if (selectKudaIndex == 0) {
						selectKudaIndex = sortedKuda.length - 1;
					} else {
						selectKudaIndex -= 1;
					}
					selectCard(sortedKuda[selectKudaIndex], selectKudaIndex);
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="ionicon"
					viewBox="0 0 512 512"
					><path
						fill="currentColor"
						d="M321.94 98L158.82 237.78a24 24 0 000 36.44L321.94 414c15.57 13.34 39.62 2.28 39.62-18.22v-279.6c0-20.5-24.05-31.56-39.62-18.18z"
					/></svg
				>
			</button>
			{#if selectKuda}
				<div
					class="absolute h-8 w-auto top-0 md:top-auto bottom-0 md:bottom-20 left-20 right-20 m-auto bg-white/75 transition-transform duration-1000 p-1 md:p-4 text-center rounded-full shadow-md flex justify-center items-center"
					style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);z-index:60;"
				>
					<h2 class="text-sm md:text-lg font-bold text-yellow-900">
						{cleanName(selectKuda.name)}
					</h2>
				</div>
			{/if}
			<button
				class="absolute right-10 top-0 bottom-0 h-12 z-50 w-12 text-gray-100 cursor-pointer m-auto"
				onclick={() => {
					if (selectKudaIndex == sortedKuda.length - 1) {
						selectKudaIndex = 0;
					} else {
						selectKudaIndex += 1;
					}
					selectCard(sortedKuda[selectKudaIndex], selectKudaIndex);
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="ionicon"
					viewBox="0 0 512 512"
					><path
						fill="currentColor"
						d="M190.06 414l163.12-139.78a24 24 0 000-36.44L190.06 98c-15.57-13.34-39.62-2.28-39.62 18.22v279.6c0 20.5 24.05 31.56 39.62 18.18z"
					/></svg
				>
			</button>
		</div>
		{#if selectKuda}
			
			<div class="absolute right-2 top-6 md:right-2" style="z-index: 70;">
				<UmazingButton type="red" text="X" onClick={closeCard} />
			</div>

		{/if}
		<div
			class="absolute w-full md:w-1/2 bottom-0 left-0 md:left-auto top-auto md:top-0 right-0 bg-white side-panel transition-transform duration-1000 p-4 md:p-10"
			style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);z-index:60;"
		>
			{#if selectKuda}
				<div
					class="w-full mx-auto overflow-y-auto h-[35vh] md:h-[90vh] relative"
				>
					<h2 class="text-2xl md:text-5xl font-bold text-gray-800">
						{cleanName(selectKuda.name)}
					</h2>

					<div class="mt-1 flex items-center space-x-3 text-gray-600">
						<span class="text-md md:text-lg"
							>Owner: {selectKuda.owner ?? "-"}</span
						>
					</div>

					<div class="my-2 md:my-4">
						<div class="flex items-center w-full">
							<div
								class="flex-grow border-t border-gray-300"
							></div>
							<span
								class="mx-4 text-gray-300 text-2xl font-light"
							>
								<img
									src="horseshoe_1.svg"
									alt="horseshoe_1.svg"
									class="w-5 h-5"
								/>
							</span>
							<div
								class="flex-grow border-t border-gray-300"
							></div>
						</div>
					</div>

					<!-- Character Details -->
					<CharacterDetail kuda={selectKuda} />
					<div
						class="w-full border-t border-pink-200 my-3 md:my-6"
					></div>

					<div class="relative w-full">
						<h3 class="text-md md:text-xl text-gray-600">
							Silsilah
						</h3>
						{#if detailKuda != null}
							<SilsilahTable
								induk={detailKuda.silsilah.induk}
								pejantan={detailKuda.silsilah.pejantan}
							/>
						{/if}
						{#if loadingDetail}
							<div
								class="loader w-24 h-12 absolute m-auto text-center top-0 left-0 right-0 bottom-0"
							>
								<img
									src="images/Logo_Hashire.png"
									alt="Loading..."
								/>
								<small>Loading...</small>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</main>

<style>
	.panel-top-left {
		clip-path: polygon(0 0, 100% 0, 0 100%);
	}

	.panel-bottom-right {
		clip-path: polygon(100% 0, 100% 100%, 0 100%);
	}

	.reveal .panel-top-left {
		transform: translate(-100%, -100%);
	}

	.reveal .panel-bottom-right {
		transform: translate(100%, 100%);
	}

	.reveal .side-panel {
		transform: translate(100%, 0%);
	}

	/* Menghilangkan panah pada input type search di beberapa browser */
	input[type="search"]::-webkit-search-decoration,
	input[type="search"]::-webkit-search-cancel-button,
	input[type="search"]::-webkit-search-results-button,
	input[type="search"]::-webkit-search-results-decoration {
		-webkit-appearance: none;
	}
</style>

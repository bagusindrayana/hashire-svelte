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

	import {generateWarnaDenganSeed,createSeededDarkColorGenerator,mulberry32} from "$lib/utils/generatorWarna";

	let dataKuda = [];
	let sortedKuda = [];

	let selectKuda = null;

	let sortBy = "name";

	// State untuk mengontrol visibilitas input
	let isExpanded = false;
	let inputElement;
	let searchText = "";

	$: {
		sortedKuda = [];

		setTimeout(() => {
			const searchResults = dataKuda.filter((kuda) => {
				return kuda.name
					.toLowerCase()
					.includes(searchText.toLowerCase());
			});
			sortedKuda = [...searchResults].sort((a, b) => {
				if (sortBy === "name") {
					return a.name.localeCompare(b.name);
				} else if (sortBy === "height") {
					return `${a.height}`.localeCompare(`${b.height}`);
				} else if (sortBy === "birth_year") {
					return a.birth_year.localeCompare(b.birth_year);
				}
			});
		}, 200);
	}

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
	];

	const defaultModelUrl = "/combine_vrm_007.vrm";

	let currentVrm = undefined;
	let currentAnimationUrl = undefined;

	let currentMixer = undefined;
	let currentAction = undefined;

	function selectCard(kuda) {
		const overlay = document.getElementById("overlay");
		selectKuda = kuda;

		setTimeout(() => {
			overlay.classList.remove("reveal");
			initThreeJS();
			randomChar(kuda);
			setTimeout(() => {
				canvas.classList.remove("opacity-0");
			}, 500);
		}, 100);
	}

	function closeCard() {
		const overlay = document.getElementById("overlay");
		overlay.classList.add("reveal");
		canvas.classList.add("opacity-0");

		setTimeout(() => {
			selectKuda = null;
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
			},

			// called while loading is progressing
			(progress) =>
				console.log(
					"Loading model...",
					100.0 * (progress.loaded / progress.total),
					"%",
				),

			// called when loading has errors
			(error) => console.error(error),
		);
	}

	function randomChar(kuda) {
		if (currentVrm) {
			if (scene) {
				scene.remove(currentVrm.scene);
			}
			VRMUtils.deepDispose(currentVrm.scene);
		}

		if (scene) {
			scene.add(currentVrm.scene);
		}
		const seed = stringToSeed(kuda.name);
		var random = mulberry32(seed);
		currentAnimationUrl =
			listIdleAnimation[Math.floor(random() * listIdleAnimation.length)];
		// create AnimationMixer for VRM
		currentMixer = new THREE.AnimationMixer(currentVrm.scene);

		const randomSame = Math.floor(random() * 2);
		const hex = generateWarnaDenganSeed(
			kuda.color_name,
			Math.floor(random() * 1000),
		);

		var hairHex = hex;

		// scene.background = new THREE.Color(getBrightColor(Math.floor(random() * 100)))

		// Generate a random integer from 1 to 10
		const randomFrontHair = Math.floor(random() * 6) + 1;
		const randomBackHair = Math.floor(random() * 6) + 1;
		const randomFace = Math.floor(random() * 6) + 1;
		let randomBody = 1;
		if (kuda.gender_name == "Colt") {
			randomBody = 1;
		} else if (kuda.gender_name == "Filly") {
			randomBody = 2;
		} else {
			randomBody = Math.floor(random() * 2) + 1;
		}

		currentVrm.scene.traverse((obj) => {
			obj.frustumCulled = false;

			// console.log(obj.name);
			obj.frustumCulled = false;
			if (
				obj.isMesh &&
				(obj.name.includes("Face") ||
					obj.name.includes("Hair") ||
					obj.name.includes("Body"))
			) {
				obj.visible = false;
			}

			if (
				obj.isMesh &&
				(obj.name.includes(
					"Hair_Front_" + String(randomFrontHair).padStart(3, "0"),
				) ||
					obj.name.includes(
						"Hair_Back_" + String(randomBackHair).padStart(3, "0"),
					) ||
					obj.name.includes(
						"Face_" + String(randomFace).padStart(3, "0"),
					) ||
					obj.name.includes(
						"Body_" + String(randomBody).padStart(3, "0"),
					))
			) {
				obj.visible = true;
			}

			if (obj.isMesh && obj.material.uniforms != undefined) {
				if (obj.name.includes("Ribbon_R")) {
					const ribbonColor = generateWarnaDenganSeed(
						kuda.color_name,
						Math.floor(random() * 100),
					);
					obj.material.uniforms.litFactor.value.setHex(
						`${ribbonColor}`,
					);
					obj.material.uniforms.shadeColorFactor.value.setHex(
						`${ribbonColor}`,
					);
				}
				if (randomBody == 2) {
					if (obj.name == "Ribbon_R") {
						obj.visible = false;
					} else if (obj.name == "Ribbon_L") {
						obj.visible = true;
					}
				} else if (randomBody == 1) {
					if (obj.name == "Ribbon_R") {
						obj.visible = true;
					} else if (obj.name == "Ribbon_L") {
						obj.visible = false;
					}
				}

				if (obj.material.name.includes("EyeIris")) {
					if (randomSame == 1) {
						const eyeHex = createSeededDarkColorGenerator(
							Math.floor(random() * 100),
							100,
						)();
						obj.material.uniforms.litFactor.value.setHex(
							`${eyeHex}`,
						);
						obj.material.uniforms.shadeColorFactor.value.setHex(
							`${hex}`,
						);
					} else {
						obj.material.uniforms.litFactor.value.setHex(`${hex}`);
						obj.material.uniforms.shadeColorFactor.value.setHex(
							`${hex}`,
						);
					}
				}

				if (obj.material.name.includes("Hair")) {
					//obj.material.color.setHex(`${hairHex}`)
					obj.material.uniforms.litFactor.value.setHex(`${hairHex}`);
					obj.material.uniforms.shadeColorFactor.value.setHex(
						`${hairHex}`,
					);
				}

				if (obj.material.name.includes("Tail")) {
					//obj.material.color.setHex(`${hairHex}`)
					obj.material.uniforms.litFactor.value.setHex(`${hairHex}`);
					obj.material.uniforms.shadeColorFactor.value.setHex(
						`${hairHex}`,
					);
				}

				if (obj.material.name.includes("FaceBrow")) {
					obj.material.uniforms.litFactor.value.setHex(`${hairHex}`);
					obj.material.uniforms.shadeColorFactor.value.setHex(
						`${hairHex}`,
					);
				}

				if (obj.material.name.includes("FaceEyeline")) {
					obj.material.uniforms.litFactor.value.setHex(`${hairHex}`);
					obj.material.uniforms.shadeColorFactor.value.setHex(
						`${hairHex}`,
					);
				}
			}

			if (obj.isSkinnedMesh) {
				const skinnedMesh = obj;

				if (obj.name.includes("Face")) {
					// Get the bone by name
					const targetBone =
						skinnedMesh.skeleton.getBoneByName("J_Bip_C_Head");

					if (targetBone) {
						if (randomFace == 2) {
							targetBone.scale.set(0.9, 0.9, 0.9);
						} else {
							targetBone.scale.set(1, 1, 1);
						}
						if (randomFace == 2 || randomFace == 5) {
							targetBone.position.y =
								random() * 0.02 + 0.07374341040849686;
						} else {
							targetBone.position.y =
								random() * 0.01 + 0.07374341040849686;
						}
					}

					// const focusBone =
					// 	skinnedMesh.skeleton.getBoneByName("J_Bip_C_Spine");

					// if (focusBone) {
					// 	const headWorldPos = new THREE.Vector3();
					// 	focusBone.getWorldPosition(headWorldPos);
					// 	camera.lookAt(headWorldPos);
					// }
				}

				if (obj.name.includes("Body")) {
					const targetBone =
						skinnedMesh.skeleton.getBoneByName("J_Bip_C_Spine"); // or any bone name

					if (targetBone) {
						if (kuda.height != "" && kuda.height != undefined) {
							let cleanedStr = kuda.height
								.replace(",", ".")
								.replace(" cm", "");
							let value = parseFloat(cleanedStr);
							targetBone.position.y = value * 0.0003331;
						} else {
							if (randomFace == 2 || randomFace == 5) {
								targetBone.position.y =
									random() * 0.1 + 0.05323030799627304;
							} else {
								targetBone.position.y =
									random() * 0.1 - 0.05 + 0.05323030799627304;
							}
						}

						const headWorldPos = new THREE.Vector3();
						targetBone.getWorldPosition(headWorldPos);
						camera.lookAt(headWorldPos);
					}

					const J_Bip_L_UpperArm =
						skinnedMesh.skeleton.getBoneByName("J_Bip_L_UpperArm"); // or any bone name

					if (J_Bip_L_UpperArm) {
						if (randomFace == 2 || randomFace == 5) {
							J_Bip_L_UpperArm.scale.x = random() * 0.2 + 1;
						}
					}

					const J_Bip_R_UpperArm =
						skinnedMesh.skeleton.getBoneByName("J_Bip_R_UpperArm"); // or any bone name

					if (J_Bip_R_UpperArm) {
						if (randomFace == 2 || randomFace == 5) {
							J_Bip_R_UpperArm.scale.x = random() * 0.2 + 1;
						}
					}
				}

				if (obj.name.includes("Ear")) {
					const randomScale = random() * 0.1 - 0.05 + 1;
					const targetBone1 =
						skinnedMesh.skeleton.getBoneByName("Ear_L"); // or any bone name

					if (targetBone1) {
						targetBone1.scale.set(
							randomScale,
							randomScale,
							randomScale,
						);
						targetBone1.rotation.z = random() * -1;
					}

					const targetBone2 =
						skinnedMesh.skeleton.getBoneByName("Ear_R"); // or any bone name

					if (targetBone2) {
						targetBone2.scale.set(
							randomScale,
							randomScale,
							randomScale,
						);
						targetBone2.rotation.z = random() * 1;
					}
				}
			}
		});

		if (currentAnimationUrl) {
			loadFBX(currentAnimationUrl);
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

			renderer.render(scene, camera);
		}

		animate();
	}

	function disposeThreeJS() {
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

	function decodeHTMLEntities(str) {
		const div = document.createElement("div");
		div.innerHTML = str;
		const textName = div.textContent;
		return textName;
	}

	onMount(async () => {
		const res = await fetch("/api/horse");
		const json = await res.json();
		dataKuda = json.data;

		canvas = document.getElementById("myCanvasContainer");

		loadVRM(defaultModelUrl);
	});
</script>

<svelte:head>
	<title>Kuda Aktif</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<main class="container mx-auto px-6 py-20 relative">
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
				<!-- <button
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
				</button> -->
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
		class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8"
	>
		{#each sortedKuda as kuda, index}
			<CharacterCard
				{kuda}
				{index}
				onClick={() => {
					selectCard(kuda);
				}}
			/>
		{/each}
	</div>

	<div
		id="overlay"
		class={`fixed inset-0 z-10 top-[50px] overflow-hidden reveal ${selectKuda == null ? "hidden" : ""}`}
	>
		<div
			class={`panel-top-left absolute inset-0 transition-transform duration-1000 ${selectKuda !== null ? `bg-1-${selectKuda.color_name}` : ""}`}
			style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);"
		></div>
		<div
			class={`panel-bottom-right absolute inset-0 transition-transform duration-1000 ${selectKuda !== null ? `bg-2-${selectKuda.color_name}` : ""}`}
			style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);"
		></div>
		<div
			id="myCanvasContainer"
			class="absolute w-full md:w-1/2 bottom-0 top-0 left-0 right-0 md:right-auto h-screen z-50 opacity-0 transition-all duration-500"
		></div>
		<div
			class="absolute w-full md:w-1/2 h-[40vh] md:h-screen bottom-0 left-0 md:left-auto top-auto md:top-0 right-0 bg-white side-panel transition-transform duration-1000 p-4 md:p-10"
			style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);z-index:60;"
		>
			<button
				class="absolute right-4 md:right-10 hover:scale-125 transition duration-300 cursor-pointer"
				onclick={closeCard}
			>
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

			{#if selectKuda}
				<div class="w-full max-w-2xl mx-auto">
					<!-- Character Name -->
					<h2 class="text-2xl md:text-5xl font-bold text-gray-800">
						{decodeHTMLEntities(selectKuda.name)}
					</h2>
					<!-- Voice Actor -->
					<div class="mt-2 flex items-center space-x-3 text-gray-600">
						<span class="text-md md:text-lg"
							>Owner: {selectKuda.owner ?? "-"}</span
						>
					</div>

					<!-- Quote -->
					<div class="my-4 md:my-10">
						<div class="mt-2 md:mt-6 flex items-center w-full">
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
					<div
						class="space-y-3 text-sm grid grid-cols-2 md:grid-cols-1"
					>
						<div class="flex items-center">
							<span
								class={`text-white font-bold py-1 px-3 rounded-md w-24 text-center ${selectKuda !== null ? `bg-2-${selectKuda.color_name}` : ""}`}
								>Trainer</span
							>
							<span class="ml-4 text-gray-700"
								>{selectKuda.trainer ?? "-"}</span
							>
						</div>
						<div class="flex items-center">
							<span
								class={`text-white font-bold py-1 px-3 rounded-md w-24 text-center ${selectKuda !== null ? `bg-2-${selectKuda.color_name}` : ""}`}
								>Discipline</span
							>
							<span class="ml-4 text-gray-700"
								>{selectKuda.discipline ?? "-"}</span
							>
						</div>
						<div class="flex items-center">
							<span
								class={`text-white font-bold py-1 px-3 rounded-md w-24 text-center ${selectKuda !== null ? `bg-2-${selectKuda.color_name}` : ""}`}
								>Birthday</span
							>
							<span class="ml-4 text-gray-700"
								>{selectKuda.birth_year ?? "-"}</span
							>
						</div>
						<div class="flex items-center">
							<span
								class={`text-white font-bold py-1 px-3 rounded-md w-24 text-center ${selectKuda !== null ? `bg-2-${selectKuda.color_name}` : ""}`}
								>Height</span
							>
							<span class="ml-4 text-gray-700"
								>{selectKuda.height ?? "-"}</span
							>
						</div>
						<div class="flex items-center">
							<span
								class={`text-white font-bold py-1 px-3 rounded-md w-24 text-center ${selectKuda !== null ? `bg-2-${selectKuda.color_name}` : ""}`}
								>Color</span
							>
							<span class="ml-4 text-gray-700"
								>{selectKuda.color_name ?? "-"}</span
							>
						</div>
						<div class="flex items-center">
							<span
								class={`text-white font-bold py-1 px-3 rounded-md w-24 text-center ${selectKuda !== null ? `bg-2-${selectKuda.color_name}` : ""}`}
								>Trah</span
							>
							<span class="ml-4 text-gray-700"
								>{selectKuda.generation_name ?? "-"}</span
							>
						</div>
						<div class="flex items-center">
							<span
								class={`text-white font-bold py-1 px-3 rounded-md w-24 text-center ${selectKuda !== null ? `bg-2-${selectKuda.color_name}` : ""}`}
								>Sire</span
							>
							<span class="ml-4 text-gray-700"
								>{decodeHTMLEntities(
									selectKuda.father_name ?? "-",
								)}</span
							>
						</div>
						<div class="flex items-center">
							<span
								class={`text-white font-bold py-1 px-3 rounded-md w-24 text-center ${selectKuda !== null ? `bg-2-${selectKuda.color_name}` : ""}`}
								>Dam</span
							>
							<span class="ml-4 text-gray-700"
								>{decodeHTMLEntities(
									selectKuda.mother_name ?? "-",
								)}</span
							>
						</div>
					</div>
					<div class="w-full border-t border-pink-200 my-8"></div>
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

	.bg-1-Hitam {
		background: #808080;
	}

	.bg-1-Pink {
		background: #fd98cd;
	}

	.bg-1-Hijau {
		background: #70f1c2;
	}

	.bg-1-Biru {
		background: #7eb8ff;
	}

	.bg-1-Merah {
		background: #ff9898;
	}

	.bg-1-Kuning {
		background: #f1db82;
	}

	.bg-1-Napas {
		background: #e9e3c3;
	}

	.bg-1-Jragem {
		background: #686868;
	}

	.bg-1-Bopong {
		background: #f5a770;
	}

	.bg-1-Kelabu {
		background: #e4e4e4;
	}

	.bg-2-Hitam {
		background: #242424;
	}

	.bg-2-Pink {
		background: #ec4899;
	}

	.bg-2-Hijau {
		background: #10b981;
	}

	.bg-2-Biru {
		background: #3b82f6;
	}

	.bg-2-Merah {
		background: #ef4444;
	}

	.bg-2-Kuning {
		background: #eab308;
	}

	.bg-2-Napas {
		background: #888056;
	}

	.bg-2-Jragem {
		background: #000000;
	}

	.bg-2-Bopong {
		background: #8b4513;
	}

	.bg-2-Kelabu {
		background: #bbb286;
	}

	/* Menghilangkan panah pada input type search di beberapa browser */
	input[type="search"]::-webkit-search-decoration,
	input[type="search"]::-webkit-search-cancel-button,
	input[type="search"]::-webkit-search-results-button,
	input[type="search"]::-webkit-search-results-decoration {
		-webkit-appearance: none;
	}
</style>

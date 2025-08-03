<script>
    import { onMount } from "svelte";
    import { quintOut } from "svelte/easing";
    import { slide } from "svelte/transition";

    import * as THREE from "three";
    import { OrbitControls } from "three/addons/controls/OrbitControls.js";
    import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
    import { VRMLoaderPlugin, VRMUtils, VRM } from "@pixiv/three-vrm";

    import { loadMixamoAnimation } from "$lib/utils/loadMixamoAnimation.js";
    import { cloneVRM } from "$lib/utils/cloneVRM.js"; // Import the function

    import {
        generateWarnaDenganSeed,
        createSeededDarkColorGenerator,
        generateWarnaKuda,
        mulberry32,
    } from "$lib/utils/generatorWarna";
    import UmazingButton from "$lib/components/UmazingButton.svelte";

    import { replaceState,pushState } from "$app/navigation";

    /** @type {import('./$types').PageProps} */
    let { data } = $props();

    let dataEvent = $state([]);
    let selectEvent = $state(null);
    let selectKuda = $state(null);
    let loadingEvent = $state(true);

    let canvas,
        scene,
        helperRoot,
        camera,
        renderer,
        animationId = null;

    const listRunAnimation = [
        "/animation/run/Fast Run.fbx",
        "/animation/run/Run Forward (1).fbx",
        "/animation/run/Run Forward.fbx",
        "/animation/run/Running.fbx",
        "/animation/run/Two Cycle Sprint (1).fbx",
    ];

    const defaultModelUrl = "/combine_vrm_007.vrm";

    let currentVrm = undefined;
    let currentAnimationUrl = undefined;

    let currentMixer = undefined;
    let currentAction = undefined;

    let loader = null;

    let closeLabel = ["Umazing!","Kudashyat!","Umantap!"];
	let modalCloseLabel = $state("Umazing!");

    function selectCard(event) {
        
        
        selectEvent = event;

        if(selectEvent.upcoming){
            modalCloseLabel = closeLabel[Math.floor(Math.random() * closeLabel.length)];
            return;
        }

        const overlay = document.getElementById("overlay");

        if(data.openEvent == null){
            // const url = new URL(window.location.toString());
            // url.searchParams.set("id",selectEvent.id);
            // url.searchParams.set("type",selectEvent.type);
            pushState(`/event?id=${selectEvent.id}&type=${selectEvent.type}`);
            data.openEvent = selectEvent;

        }

        setTimeout(() => {
            overlay.classList.remove("reveal");
            initThreeJS();
            // if (event.id) {
            //     randomRace(event.id);
            // }

            getEventDetail(event);
            setTimeout(() => {
                canvas.classList.remove("opacity-0");
            }, 500);
        }, 100);
    }

    function konversiKeRomawi(num) {
        // Angka Romawi dari terbesar ke terkecil
        const romanMap = {
            M: 1000,
            CM: 900,
            D: 500,
            CD: 400,
            C: 100,
            XC: 90,
            L: 50,
            XL: 40,
            X: 10,
            IX: 9,
            V: 5,
            IV: 4,
            I: 1,
        };

        let roman = "";
        for (let key in romanMap) {
            while (num >= romanMap[key]) {
                roman += key;
                num -= romanMap[key];
            }
        }

        return roman;
    }

    async function getEventDetail(event) {
        const res = await fetch("/dummy-data/" + event.id);
        const json = await res.json();
        selectEvent = {
            title: event.title,
            races: json,
        };

        if (
            selectEvent.races.length > 0 &&
            selectEvent.races[0].horses.length > 0
        ) {
            selectEvent.races[0].horses[0].selected = true;
            selectKuda = selectEvent.races[0].horses[0];
            randomChar(selectKuda);
        }

        setTimeout(() => {
            const wrapper = document.getElementById("slider-wrapper");
            if (wrapper) {
                const slides = Array.from(wrapper.children);
                const nextButton = document.getElementById("next-slide");
                const prevButton = document.getElementById("prev-slide");
                const paginationContainer =
                    document.getElementById("pagination-dots");
                const slideCount = slides.length;
                let currentIndex = 0;

                if (slideCount === 0) return;

                // --- Create Pagination Dots ---
                slides.forEach((_, index) => {
                    const dot = document.createElement("button");
                    dot.classList.add(
                        "w-3",
                        "h-3",
                        "rounded-full",
                        "transition-colors",
                        "cursor-pointer",
                    );
                    dot.addEventListener("click", () => goToSlide(index));
                    paginationContainer.appendChild(dot);
                });
                const dots = Array.from(paginationContainer.children);

                // --- Function to update slider position and pagination ---
                function goToSlide(index) {
                    // Calculate the translation based on the current index
                    wrapper.style.transform = `translateX(-${index * 100}%)`;
                    currentIndex = index;
                    console.log(currentIndex);
                    document.getElementById("race-label").innerHTML =
                        `RACE ${konversiKeRomawi(currentIndex + 1)}`;
                    updateControls();
                }

                // --- Function to update button and dot states ---
                function updateControls() {
                    // Update button disabled states
                    prevButton.disabled = currentIndex === 0;
                    nextButton.disabled = currentIndex === slideCount - 1;

                    // Update pagination dot styles
                    dots.forEach((dot, index) => {
                        if (index === currentIndex) {
                            dot.classList.add("bg-pink-400");
                            dot.classList.remove("bg-gray-300");
                        } else {
                            dot.classList.add("bg-gray-300");
                            dot.classList.remove("bg-pink-400");
                        }
                    });
                }

                // --- Event Listeners ---
                nextButton.addEventListener("click", () => {
                    if (currentIndex < slideCount - 1) {
                        goToSlide(currentIndex + 1);
                    }
                });

                prevButton.addEventListener("click", () => {
                    if (currentIndex > 0) {
                        goToSlide(currentIndex - 1);
                    }
                });

                // --- Initialize Slider ---
                goToSlide(0);
            }
        }, 200);
    }

    function closeCard() {
        const overlay = document.getElementById("overlay");
        overlay.classList.add("reveal");
        canvas.classList.add("opacity-0");
       
        if (data.openEvent) {
            const url = new URL(window.location.toString());
            url.searchParams.delete("id");
            url.searchParams.delete("type");
            replaceState(url.pathname,{});
            data.openEvent = null;
        }
        setTimeout(() => {
            selectEvent = null;
            selectKuda = null;
            disposeThreeJS();
        }, 1100);
    }

    function selectTableRow(indexRow, indexHorse) {
        if (selectEvent) {
            for (
                let ir = 0;
                ir < selectEvent.races[indexRow].horses.length;
                ir++
            ) {
                const horse = selectEvent.races[indexRow].horses[ir];
                if (ir == indexHorse) {
                    selectEvent.races[indexRow].horses[ir].selected = true;
                } else {
                    selectEvent.races[indexRow].horses[ir].selected = false;
                }
            }
            selectKuda = selectEvent.races[indexRow].horses[indexHorse];
            randomChar(selectKuda);
            selectEvent = selectEvent;
        }
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

    function randomBrightColor(seed) {
        const rand = mulberry32(seed);

        // Ensure each channel is in the bright range: 128–255
        const r = Math.floor(128 + rand() * 127);
        const g = Math.floor(128 + rand() * 127);
        const b = Math.floor(128 + rand() * 127);

        // Convert to 0xRRGGBB format
        const hex = (r << 16) | (g << 8) | b;
        return `0x${hex.toString(16).padStart(6, "0").toUpperCase()}`;
    }

    function seededRandom(seed) {
        return function () {
            let t = (seed += 0x6d2b79f5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    let baseGltf = null;

    function loadVRM(modelUrl) {
        document.getElementById("full-loading").classList.remove("hidden");
        loader = new GLTFLoader();
        loader.crossOrigin = "anonymous";

        if (helperRoot) {
            helperRoot.clear();
        }

        loader.register((parser) => {
            return new VRMLoaderPlugin(parser, {
                autoUpdateHumanBones: true,
            });
        });

        loader.load(
            modelUrl,
            (gltf) => {
                const vrm = gltf.userData.vrm;
                baseGltf = gltf;

                // calling this function greatly improves the performance
                VRMUtils.removeUnnecessaryVertices(gltf.scene);
                VRMUtils.combineSkeletons(gltf.scene);
                VRMUtils.combineMorphs(vrm);

                // rotate if the VRM is VRM0.0
                VRMUtils.rotateVRM0(vrm);

                // put the model to the scene
                currentVrm = vrm;
                document.getElementById("full-loading").classList.add("hidden");

                if (data != null && data.openEvent != null) {
                    selectCard(data.openEvent);
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
                console.error(error);
                alert(error);
                document.getElementById("full-loading").classList.add("hidden");
            },
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
            listRunAnimation[Math.floor(random() * listRunAnimation.length)];
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
                if (obj.name.includes("Ribbon")) {
                    const ribbonColor = generateWarnaKuda(kuda.color_name, {
                        seed: Math.floor(random() * 100),
                        versi: "terang",
                    });
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
        camera.position.set(2, 1, 3);

        // const controls = new OrbitControls(camera, renderer.domElement);
        // controls.screenSpacePanning = true;
        // controls.target.set(0.0, 1.0, 0.0);
        // controls.update();

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
        loadVRM(defaultModelUrl);
        loadingEvent = true;

        try {
            const res = await fetch("/api/event");
            const json = await res.json();
            dataEvent = json;
        } catch (error) {
            alert(error);
        }

        loadingEvent = false;

        canvas = document.getElementById("myCanvasContainer");
    });
</script>

<svelte:head>
    {#if data.openEvent != null || selectEvent != null}
        <title>{(data.openEvent ?? selectEvent).title}</title>
    {:else}
        <title>Event</title>
    {/if}
</svelte:head>

{#if selectEvent != null && selectEvent.upcoming}
    <div
        class="fixed top-0 left-0 bottom-0 right-0 p-2 md:p-12 flex justify-center items-center z-50 m-auto"
    >
        <div
            class="absolute top-0 left-0 bottom-0 right-0 m-auto bg-gray-400 opacity-75"
        ></div>
        <div
            class="w-full max-w-4xl bg-[#FFF6FA] border-4 border-[#F472B6] rounded-2xl shadow-lg relative p-3 md:p-6 pt-8 md:pt-12 "
        >
            <div class=" -mt-16 -ml-10">
                <div
                    class="bg-[#F472B6] text-white py-2 px-10 transform -skew-x-12 shadow-md"
                >
                    <h1 class="transform skew-x-12 text-3xl font-extrabold">
                        {selectEvent.title}
                    </h1>
                </div>
            </div>
            <div class="min-h-[60vh] py-4">
                <p class="md:text-2xl">
                    {selectEvent.subtitle}
                </p>
                
            </div>
            <div class="w-full flex justify-center items-center">
                <UmazingButton
                    onClick={() => {
						selectEvent = null;
                    }}
                    icon="👍"
                    text={modalCloseLabel}
                />
            </div>
        </div>
    </div>
{/if}

<main class="container mx-auto px-6 py-20 relative min-h-[90vh]">
    <div class="title-banner text-lg md:text-2xl ml-0 md:-ml-4">Event</div>

    <div
        class="w-full bg-[#f1ffb3] border-4 border-[#7d9900] rounded-2xl shadow-lg relative p-3 py-6 md:p-6 md:py-12 m-auto mt-12"
    >
        <div class="absolute -top-6 -left-4">
            <div
                class="bg-[#7d9900] text-white py-2 px-10 transform -skew-x-12 shadow-md"
            >
                <h1
                    class="transform skew-x-12 text-xl md:text-3xl font-extrabold"
                >
                    Upcoming Event
                </h1>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {#each dataEvent as event, index}
                {#if event.upcoming}
                    <div class="bg-white p-4 rounded-xl shadow-md">
                        <div onclick={() => {
                                selectCard(event);
                            }}  class="cursor-pointer">
                            <img
                                src={event.image}
                                alt={`Gambar ${event.title}`}
                                class="rounded-lg mb-3 w-full object-cover"
                                onerror={() => {
                                    this.onerror = null;
                                    this.src =
                                        "https://placehold.co/800x400/EAB3F4/4A235A?text=Image+Not+Found";
                                }}
                            />
                            </div>
                        <div
                           onclick={() => {
                                selectCard(event);
                            }}
                            class="flex justify-between items-center w-full group cursor-pointer"
                        >
                            <div>
                                <div class="flex items-center mb-1">
                                    <span
                                        class="bg-lime-200 text-lime-800 text-xs font-bold mr-2 px-2.5 py-0.5 rounded-full"
                                        >Race</span
                                    >
                                    <span class="text-sm text-gray-500"
                                        >{event.date}</span
                                    >
                                </div>
                                <p
                                    class="font-semibold text-gray-800 group-hover:text-pink-600 transition-colors"
                                >
                                    {event.title}
                                </p>
                            </div>
                        </div>
                    </div>
                {/if}
            {/each}
            {#if loadingEvent}
                <div class="loader w-24 absolute m-auto text-center">
                    <img src="images/Logo_Hashire.png" alt="Loading..." />
                    <small>Loading...</small>
                </div>
            {/if}
        </div>
    </div>

    <div
        class="w-full bg-[#FFF6FA] border-4 border-[#F472B6] rounded-2xl shadow-lg relative p-3 py-6 md:p-6 md:py-12 m-auto mt-12"
    >
        <div class="absolute -top-6 -left-4">
            <div
                class="bg-[#F472B6] text-white py-2 px-10 transform -skew-x-12 shadow-md"
            >
                <h1
                    class="transform skew-x-12 text-xl md:text-3xl font-extrabold"
                >
                    Past Event
                </h1>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {#each dataEvent as event, index}
                {#if !event.upcoming}
                    <div class="bg-white p-4 rounded-xl shadow-md">
                        <div
                            class="cursor-pointer"
                            onclick={() => {
                                selectCard(event);
                            }}
                        >
                            <img
                                src={event.image}
                                alt={`Gambar ${event.title}`}
                                class="rounded-lg mb-3 w-full object-cover"
                                onerror={() => {
                                    this.onerror = null;
                                    this.src =
                                        "https://placehold.co/800x400/EAB3F4/4A235A?text=Image+Not+Found";
                                }}
                            />
                        </div>
                        <div
                            class="flex justify-between items-center w-full group cursor-pointer"
                        >
                            <div>
                                <div class="flex items-center mb-1">
                                    <span
                                        class="bg-lime-200 text-lime-800 text-xs font-bold mr-2 px-2.5 py-0.5 rounded-full"
                                        >Race</span
                                    >
                                    <span class="text-sm text-gray-500"
                                        >{event.date}</span
                                    >
                                </div>
                                <p
                                    class="font-semibold text-gray-800 group-hover:text-pink-600 transition-colors"
                                >
                                    {event.title}
                                </p>
                            </div>
                        </div>
                    </div>
                {/if}
            {/each}
            {#if loadingEvent}
                <div class="loader w-24 absolute m-auto text-center">
                    <img src="images/Logo_Hashire.png" alt="Loading..." />
                    <small>Loading...</small>
                </div>
            {/if}
        </div>
    </div>

    <div
        id="overlay"
        class={`fixed inset-0 z-10 top-[50px] overflow-hidden reveal ${selectEvent == null ? "hidden" : ""}`}
    >
        <div
            class={`panel-top-left absolute inset-0 transition-transform duration-1000 ${selectEvent !== null ? `bg-pink-100` : ""}`}
            style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);"
        ></div>
        <div
            class={`panel-bottom-right absolute inset-0 transition-transform duration-1000 ${selectEvent !== null ? `bg-pink-300` : ""}`}
            style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);"
        ></div>
        <div
            id="myCanvasContainer"
            class="absolute w-full md:w-1/2 bottom-0 top-0 left-0 right-0 md:left-auto h-screen z-50 opacity-0 transition-all duration-500"
        >
            {#if selectKuda}
                <div
                    class="absolute h-8 w-auto top-0 md:top-auto bottom-6 md:bottom-20 left-20 right-20 m-auto bg-white/75 transition-transform duration-1000 p-1 md:p-4 text-center rounded-full shadow-md flex justify-center items-center"
                    style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);z-index:60;"
                >
                    <h2 class="text-sm md:text-lg font-bold text-yellow-900">
                        {decodeHTMLEntities(selectKuda.name)}
                    </h2>
                </div>
            {/if}
        </div>

        {#if selectEvent && !selectEvent.upcoming}
            <div
                class="absolute right-2 top-6 md:top-6 md:right-2"
                style="z-index: 70;"
            >
                <UmazingButton type="red" text="X" onClick={closeCard} />
            </div>

            <!-- <button
                class="absolute right-2 top-6 md:top-6 md:right-0 hover:scale-125 transition duration-300 cursor-pointer"
                style="z-index: 70;"
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
            </button> -->
            <div
                class="panel-top-center absolute w-full block md:hidden top-3 left-0 right-auto bg-white transition-transform duration-1000 p-2 md:p-10 pr-10 md:pr-auto"
                style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);z-index:50;"
            >
                <h2 class="text-lg md:text-5xl font-bold text-gray-800">
                    {decodeHTMLEntities(selectEvent.title)}
                </h2>
            </div>
        {/if}
        <div
            class="absolute w-full md:w-1/2 h-[40vh] md:h-screen bottom-0 left-0 top-auto md:top-0 bg-white side-panel transition-transform duration-1000 p-4 md:p-10"
            style="transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);z-index:60;"
        >
            {#if selectEvent && !selectEvent.upcoming}
                <div class="w-full mx-auto mt-0">
                    <h2
                        class="text-xl md:text-3xl font-bold text-gray-800 hidden md:block"
                    >
                        {decodeHTMLEntities(selectEvent.title)}
                    </h2>
                    <div class="mt-2 md:mt-6">
                        <div class="flex justify-between items-center mb-2">
                            <h3
                                class="text-xl font-bold text-gray-800"
                                id="race-label"
                            >
                                Race
                            </h3>
                            <div class="flex items-center space-x-2">
                                <button
                                    id="prev-slide"
                                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M15 19l-7-7 7-7"
                                        /></svg
                                    >
                                </button>
                                <button
                                    id="next-slide"
                                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 5l7 7-7 7"
                                        /></svg
                                    >
                                </button>
                            </div>
                        </div>

                        <div
                            id="slider-container"
                            class="relative overflow-x-hidden overflow-y-auto max-h-[30vh] md:max-h-[60vh]"
                        >
                            <div
                                id="slider-wrapper"
                                class="flex slider-wrapper"
                            >
                                {#each selectEvent.races as race, indexRace}
                                    <div class="w-full flex-shrink-0 p-2">
                                        <div
                                            class="rounded-lg overflow-hidden shadow-lg"
                                        >
                                            <table
                                                class="w-full text-left text-sm"
                                            >
                                                <thead
                                                    class="bg-pink-400 text-white uppercase tracking-wider font-bold"
                                                >
                                                    <tr
                                                        ><th
                                                            colspan="2"
                                                            class="p-2 text-center"
                                                        >
                                                            {race.race}
                                                            <br />
                                                            <small
                                                                >{race.distance}
                                                                M - Prize : {race.prize.toLocaleString(
                                                                    "id-ID",
                                                                )}</small
                                                            >
                                                        </th></tr
                                                    >
                                                    <tr
                                                        ><th
                                                            scope="col"
                                                            class="p-2"
                                                            >Nama Kuda</th
                                                        ><th
                                                            scope="col"
                                                            class="p-2">Gate</th
                                                        ></tr
                                                    >
                                                </thead>
                                                <tbody class="bg-white">
                                                    {#each race.horses as horse, indexHorse}
                                                        <tr
                                                            class={` ${indexHorse % 2 == 0 ? "bg-pink-50" : ""} font-medium text-yellow-800 hover:text-pink-600 cursor-pointer ${horse.selected ? "border border-pink-600" : ""}`}
                                                            class:bg-yellow-200={horse.place ==
                                                                1}
                                                            onclick={() => {
                                                                selectTableRow(
                                                                    indexRace,
                                                                    indexHorse,
                                                                );
                                                            }}
                                                            ><td class="p-2">
                                                                {#if horse.place}
                                                                    {#if horse.place == 1}
                                                                        <span
                                                                            class="text-yellow-600 text-shadow-xs text-shadow-yellow-900 text-xl font-bold"
                                                                            >1<small
                                                                                >st</small
                                                                            ></span
                                                                        >
                                                                    {/if}
                                                                    {#if horse.place == 2}
                                                                        <span
                                                                            class="text-slate-300 text-shadow-xs text-shadow-slate-600 text-xl font-bold"
                                                                            >2<small
                                                                                >nd</small
                                                                            ></span
                                                                        >
                                                                    {/if}
                                                                    {#if horse.place == 3}
                                                                        <span
                                                                            class="text-amber-700 text-shadow-xs text-shadow-amber-900 text-xl font-bold"
                                                                            >3<small
                                                                                >rd</small
                                                                            ></span
                                                                        >
                                                                    {/if}
                                                                {/if}
                                                                {horse.name}
                                                            </td><td class="p-2"
                                                                >{horse.gate}</td
                                                            ></tr
                                                        >
                                                    {/each}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                        <!-- Pagination dots -->
                        <div
                            id="pagination-dots"
                            class="flex justify-center space-x-2 mt-4"
                        ></div>
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
        transform: translate(-100%, 0%);
    }

    .reveal .panel-top-center {
        transform: translate(0%, -100%);
    }

    .reveal .amazing-button {
        opacity: 0;
    }

    .slider-wrapper {
        transition: transform 0.5s ease-in-out;
    }
</style>

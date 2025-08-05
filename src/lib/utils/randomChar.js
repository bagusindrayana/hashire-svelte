import { Vector3, Color, AnimationMixer } from "three";
import { VRMLoaderPlugin, VRMUtils, VRM } from "@pixiv/three-vrm";
import { cleanName } from "$lib/utils/cleanName.js";
import {
    generateWarnaDenganSeed,
    createSeededDarkColorGenerator,
    generateWarnaKuda,
    mulberry32,
    generateSkinTone
} from "$lib/utils/generatorWarna";

function stringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}



export function randomChar(kuda, currentVrm) {

    const seed = stringToSeed(cleanName(kuda.name));
    var random = mulberry32(seed);


    const randomSame = Math.floor(random() * 2);
    const hex = generateWarnaDenganSeed(
        kuda.color_name,
        random() * 1000,
    );

    var hairHex = hex;

    const skinHex = generateSkinTone(random() * 10)


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

    let cameraLookAtPos;

    currentVrm.scene.traverse((obj) => {
        if (randomFace == 2 || randomFace == 5) {
            // currentVrm.expressionManager.setValue( 'Fcl_ALL_Angry', random() * 1 );
            // currentVrm.expressionManager.setValue( 'angry',  random() * 1 );

            if (obj.isMesh && obj.morphTargetInfluences) {
                const index1 = obj.morphTargetDictionary["Fcl_BRW_Fun"];
                if (index1 !== undefined) {
                    obj.morphTargetInfluences[index1] = 0;
                }

                const index2 = obj.morphTargetDictionary["Fcl_BRW_Angry"];
                if (index2 !== undefined) {
                    obj.morphTargetInfluences[index2] = (random() * 0.5) + 0.3;
                }
            }
        } else {
            // currentVrm.expressionManager.setValue( 'Fcl_ALL_Fun', random() * 1 );
            // currentVrm.expressionManager.setValue( 'fun', random() * 1 );
            if (obj.isMesh && obj.morphTargetInfluences) {
                const index1 = obj.morphTargetDictionary["Fcl_BRW_Fun"];
                if (index1 !== undefined) {
                    obj.morphTargetInfluences[index1] = (random() * 0.5) + 0.3;
                }

                const index2 = obj.morphTargetDictionary["Fcl_BRW_Angry"];
                if (index2 !== undefined) {
                    obj.morphTargetInfluences[index2] = 0;
                }
            }


        }

        if (obj.isMesh && obj.morphTargetInfluences) {
            const index = obj.morphTargetDictionary["Fcl_MTH_Fun"];
            if (index !== undefined) {
                obj.morphTargetInfluences[index] = (random() * 0.5) + 0.3;
            }


        }


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
                    seed: random() * 100,
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
                        random() * 100,
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

        if ((obj.name.includes("Body") || obj.name.includes("Face")) && obj.material != undefined && obj.material.length > 0) {

            for (let im = 0; im < obj.material.length; im++) {
                const material = obj.material[im];
                if (material.name.includes("SKIN")) {

                    //obj.material[im].uniforms.litFactor.value.setHex(`${skinHex}`);
                    // obj.material[im].uniforms.shadeColorFactor.value.setHex(
                    //     `${skinHex}`,
                    // );
                }

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





            }

            if (obj.name.includes("Body")) {
                const J_Bip_L_Hand =
                    skinnedMesh.skeleton.getBoneByName("J_Bip_L_Hand");
                if (J_Bip_L_Hand) {
                    J_Bip_L_Hand.scale.set(1 - (random() * 0.1), 1 - (random() * 0.1), 1 - (random() * 0.1));
                }

                const J_Bip_R_Hand =
                    skinnedMesh.skeleton.getBoneByName("J_Bip_R_Hand");
                if (J_Bip_R_Hand) {
                    J_Bip_R_Hand.scale.set(1 - (random() * 0.1), 1 - (random() * 0.1), 1 - (random() * 0.1));
                }

                const spineBone =
                    skinnedMesh.skeleton.getBoneByName("J_Bip_C_Spine"); // or any bone name

                if (spineBone) {
                    if (kuda.height != "" && kuda.height != undefined) {
                        let cleanedStr = kuda.height
                            .replace(",", ".")
                            .replace(" cm", "");
                        let value = parseFloat(cleanedStr);
                        spineBone.position.y = value * 0.0003331;
                    } else {
                        if (randomFace == 2 || randomFace == 5) {
                            spineBone.position.y =
                                random() * 0.1 + 0.05323030799627304;
                        } else {
                            spineBone.position.y =
                                random() * 0.1 - 0.05 + 0.05323030799627304;
                        }
                    }

                    const headWorldPos = new Vector3();
                    spineBone.getWorldPosition(headWorldPos);
                    cameraLookAtPos = headWorldPos;

                }

                let randomArmScale = random() * 0.1;
                if (randomFace == 2 || randomFace == 5) {
                    randomArmScale = random() * 0.3;

                }


                const J_Bip_L_UpperArm =
                    skinnedMesh.skeleton.getBoneByName("J_Bip_L_UpperArm"); // or any bone name

                if (J_Bip_L_UpperArm) {
                    J_Bip_L_UpperArm.scale.x = randomArmScale + 1;
                }

                const J_Bip_R_UpperArm =
                    skinnedMesh.skeleton.getBoneByName("J_Bip_R_UpperArm"); // or any bone name

                if (J_Bip_R_UpperArm) {
                    J_Bip_R_UpperArm.scale.x = randomArmScale + 1;
                }


                const J_Bip_L_LowerArm =
                    skinnedMesh.skeleton.getBoneByName("J_Bip_L_LowerArm");
                if (J_Bip_L_LowerArm) {
                    J_Bip_L_LowerArm.scale.x = randomArmScale + 1;
                }

                const J_Bip_R_LowerArm =
                    skinnedMesh.skeleton.getBoneByName("J_Bip_R_LowerArm");
                if (J_Bip_R_LowerArm) {
                    J_Bip_R_LowerArm.scale.x = randomArmScale + 1;
                }

                const randomBustScale = random() * 0.2;
                const bustBoneL =
                    skinnedMesh.skeleton.getBoneByName("J_Sec_L_Bust1");
                if (bustBoneL) {
                    bustBoneL.scale.set(randomBustScale + 0.8, randomBustScale + 0.8, randomBustScale + 0.8)
                }

                const bustBoneR =
                    skinnedMesh.skeleton.getBoneByName("J_Sec_R_Bust1");
                if (bustBoneR) {
                    bustBoneR.scale.set(randomBustScale + 0.8, randomBustScale + 0.8, randomBustScale + 0.8)
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

            if (obj.name.includes("Tail")) {
                const randomTailScale = random() * 0.5;
                const J_Opt_C_FoxTail2_01 =
                    skinnedMesh.skeleton.getBoneByName("J_Opt_C_FoxTail2_01");

                if (J_Opt_C_FoxTail2_01) {
                    J_Opt_C_FoxTail2_01.scale.set(0.8 + randomTailScale, 0.8 + randomTailScale, 0.8 + randomTailScale);
                }





            }
        }
    });

    return {
        vrm: currentVrm,
        random: random,
        cameraLookAtPos
    }
}
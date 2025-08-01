import * as THREE from 'three';
import { clone as skeletonUtilsClone } from 'three/examples/jsm/utils/SkeletonUtils';
import {
  VRM,
  VRMExpressionManager,
  VRMFirstPerson,
  VRMHumanoid,
  VRMLookAt,
  VRMSpringBoneManager,
  MToonMaterial
} from '@pixiv/three-vrm';

/**
 * Performs a deep clone of a VRM model.
 * The cloned model is completely independent, with its own scene, skeleton, and physics.
 *
 * @param {import('three/examples/jsm/loaders/GLTFLoader').GLTF} gltf The original GLTF object loaded by GLTFLoader.
 * @param {import('@pixiv/three-vrm').VRM} vrm The original VRM instance.
 * @returns {{gltf: import('three/examples/jsm/loaders/GLTFLoader').GLTF, vrm: import('@pixiv/three-vrm').VRM}} An object containing the new cloned gltf and vrm instances.
 */
export function cloneVRM(gltf, vrm) {

    const materialMap = new Map();
  const newMaterials = vrm.materials?.map((material) => {
    const newMaterial = material.clone();
    materialMap.set(material, newMaterial);
    return newMaterial;
  }) || [];
  const newScene = skeletonUtilsClone(vrm.scene);
  newScene.traverse((obj) => {
    // Set the material on the meshes to the new cloned material
    if (obj.isMesh && obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material = obj.material.map((mat) => materialMap.get(mat) || mat);
      } else {
        obj.material = materialMap.get(obj.material) || obj.material;
      }
    }
  });

  const newHumanoid = vrm.humanoid.clone();
  // First Person
  let newFirstPerson;
  if (vrm.firstPerson) {
    newFirstPerson = vrm.firstPerson.clone();
  }

  // LookAt
  const newLookAt = vrm.lookAt != null && vrm.lookAt != undefined ? vrm.lookAt.clone() : undefined;

  // Expressions - Also needs to be robust
  const newExpressions = [];
  let newExpressionManager = new VRMExpressionManager(newExpressions);
  if (vrm.expressionManager) {
    newExpressionManager = vrm.expressionManager.clone();
  }
  
  // Meta
  const newMeta = { ...vrm.meta };

  // --- 3. Create the new VRM instance ---
  const newVrm = new VRM({
    scene: newScene,
    humanoid: newHumanoid,
    firstPerson: newFirstPerson,
    lookAt: newLookAt,
    expressionManager: newExpressionManager,
    meta: newMeta,
    materials: newMaterials,
  });

  // Spring Bones
  if (vrm.springBoneManager) {
    const newSpringBoneManager = new VRMSpringBoneManager();
    // Use the correct property name: springBones
    vrm.springBoneManager.joints.forEach((joint) => {
        newSpringBoneManager.addJoint(joint);
    });
    newVrm.springBoneManager = newSpringBoneManager;
  }

  // --- 4. Create a new GLTF object ---
  const newGltf = {
    ...gltf,
    scene: newScene,
    scenes: [newScene],
    userData: {
      ...gltf.userData,
      vrm: newVrm,
    },
  };

  return { gltf: newGltf, vrm: newVrm };
}
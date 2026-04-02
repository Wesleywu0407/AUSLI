import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  getHeroDom,
  createHeroState,
  clamp,
  damp,
  easeOutCubic,
  easeInOutCubic,
  easeOutQuint
} from "./state.js";
import {
  createHeroScene,
  createAmbientSystems,
  createShowcaseSystems,
  createFragmentSystems
} from "./scene.js";
import { createScrollController } from "./scroll.js";
import { createAnimationController } from "./animation.js";

window.__AUSLI_USE_DEDICATED_HERO__ = true;
window.__AUSLI_DEBUG_GLB__ = false;

async function createMinimalGlbDebugScene({ dom }) {
  dom.heroScene.innerHTML = "";
  dom.heroScene.style.opacity = "1";
  dom.heroScene.style.filter = "none";
  dom.heroContent.style.opacity = "1";
  dom.heroContent.style.transform = "translateY(0)";

  console.log("[AUSLI HERO DEBUG] Imported module THREE + GLTFLoader successfully");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);

  const camera = new THREE.PerspectiveCamera(
    45,
    dom.heroScene.clientWidth / dom.heroScene.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 6);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(dom.heroScene.clientWidth, dom.heroScene.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  dom.heroScene.appendChild(renderer.domElement);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environment = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environment = environment;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.65);
  directionalLight.position.set(2.4, 2.8, 3.6);
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0xb9c3ff, 0.65);
  fillLight.position.set(-2.2, 1.1, 2.4);
  scene.add(fillLight);

  const loader = new GLTFLoader();
  const path = "/heart.glb";
  console.log("Attempting to load heart.glb from:", path);

  let modelRoot = null;
  let mixer = null;
  const clock = new THREE.Clock();

  loader.load(
    path,
    (gltf) => {
      console.log("heart.glb loaded successfully", gltf);
      console.log("heart.glb animations", gltf.animations);

      const model = gltf.scene || gltf.scenes?.[0];
      if (!model) {
        console.error("Failed to load heart.glb", new Error("GLTF contained no scene"));
        return;
      }

      model.traverse((child) => {
        if (child.isMesh) {
          child.visible = true;
          child.frustumCulled = false;
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => {
              if ("envMapIntensity" in material) {
                material.envMapIntensity = 1.1;
              }
              material.needsUpdate = true;
            });
          } else if (child.material) {
            if ("envMapIntensity" in child.material) {
              child.material.envMapIntensity = 1.1;
            }
            child.material.needsUpdate = true;
          }
        }
      });

      scene.add(model);
      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      model.visible = true;

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      const fitScale = 2.4 / maxDim;

      model.position.sub(center);
      model.scale.setScalar(fitScale);

      const finalBox = new THREE.Box3().setFromObject(model);
      const finalSize = finalBox.getSize(new THREE.Vector3());
      const finalCenter = finalBox.getCenter(new THREE.Vector3());
      model.position.sub(finalCenter);
      model.visible = true;

      modelRoot = model;

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        console.log("[AUSLI HERO DEBUG] Playing first animation clip", {
          clipName: gltf.animations[0].name,
          duration: gltf.animations[0].duration
        });
      } else {
        console.warn("[AUSLI HERO DEBUG] No animations found in heart.glb");
      }

      console.log("[AUSLI HERO DEBUG] Final model state", {
        position: { x: model.position.x, y: model.position.y, z: model.position.z },
        scale: { x: model.scale.x, y: model.scale.y, z: model.scale.z },
        visible: model.visible,
        size: { x: finalSize.x, y: finalSize.y, z: finalSize.z },
        camera: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
          near: camera.near,
          far: camera.far
        }
      });
    },
    (event) => {
      if (event.total) {
        console.log("heart.glb loading progress", {
          loaded: event.loaded,
          total: event.total,
          percent: Math.round((event.loaded / event.total) * 100)
        });
      } else {
        console.log("heart.glb loading progress", { loaded: event.loaded });
      }
    },
    (error) => {
      console.error("Failed to load heart.glb", error);
    }
  );

  function handleResize() {
    if (!dom.heroScene.clientWidth || !dom.heroScene.clientHeight) {
      return;
    }
    camera.aspect = dom.heroScene.clientWidth / dom.heroScene.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(dom.heroScene.clientWidth, dom.heroScene.clientHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    if (mixer) {
      mixer.update(deltaTime);
    }
    if (modelRoot) {
      modelRoot.rotation.y += 0.005;
    }
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", handleResize);
  animate();
}

(() => {
  const dom = getHeroDom();

  if (!dom.heroScene || !dom.hero || !dom.heroContent) {
    return;
  }

  if (window.__AUSLI_DEBUG_GLB__ === true) {
    createMinimalGlbDebugScene({ dom });
    return;
  }

  const heroState = createHeroState();
  const sceneContext = createHeroScene({ THREE, heroScene: dom.heroScene });
  const ambientContext = createAmbientSystems({
    THREE,
    scene: sceneContext.scene,
    heroGroup: sceneContext.heroGroup
  });
  const fragmentContext = createFragmentSystems({
    THREE,
    scene: sceneContext.scene
  });
  const showcaseContext = createShowcaseSystems({
    THREE,
    scene: sceneContext.scene
  });

  const scrollController = createScrollController({
    dom,
    heroState,
    clamp,
    easeOutCubic,
    easeInOutCubic,
    easeOutQuint
  });

  const animationController = createAnimationController({
    THREE,
    heroState,
    dom,
    sceneContext,
    ambientContext,
    fragmentContext,
    showcaseContext,
    damp,
    clamp,
    easeOutCubic,
    easeInOutCubic,
    easeOutQuint,
    applyHeroUiState: scrollController.applyHeroUiState
  });

  window.addEventListener("pointermove", animationController.handlePointerMove);
  window.addEventListener("resize", animationController.handleResize);
  window.addEventListener("scroll", scrollController.updateHeroScroll, { passive: true });
  window.addEventListener(
    "scroll",
    () => {
      scrollController.updateStoryFlow();
    },
    { passive: true }
  );
  window.addEventListener("resize", scrollController.updateStoryFlow);

  scrollController.updateHeroScroll();
  scrollController.updateStoryFlow();
  animationController.animate();
})();

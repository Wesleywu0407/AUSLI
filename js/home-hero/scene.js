// scene.js — AUSLI hero
// Minimal Scene 01 background only.
// Keeps the dedicated Three.js renderer, but removes the old showroom cards
// and walking character so the 3D wordmark hero reads cleanly.

export function createHeroScene({ THREE, heroScene }) {
  const W = window.innerWidth;
  const H = window.innerHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050506);
  scene.fog = new THREE.Fog(0x050506, 10, 24);

  const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 100);
  camera.position.set(0, 0.45, 7.2);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;

  renderer.domElement.style.display = "block";
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.inset = "0";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.opacity = "0";
  renderer.domElement.style.transition = "opacity 1.2s ease-out";

  heroScene.innerHTML = "";
  heroScene.appendChild(renderer.domElement);

  setTimeout(() => {
    renderer.domElement.style.opacity = "1";
  }, 200);

  setTimeout(() => {
    const kicker = document.querySelector(".hero-kicker");
    if (kicker) {
      kicker.style.opacity = "1";
    }
  }, 1000);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xf5f0e8, 1.9);
  keyLight.position.set(0, 5.5, 4.5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x99a4b5, 0.3);
  fillLight.position.set(-3, 0.8, 2);
  scene.add(fillLight);

  const floorGroup = new THREE.Group();
  floorGroup.position.y = -1.9;
  scene.add(floorGroup);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 36),
    new THREE.MeshStandardMaterial({
      color: 0x040404,
      roughness: 0.92,
      metalness: 0.05
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floorGroup.add(floor);

  const gridHelper = new THREE.GridHelper(28, 28, 0x111111, 0x0a0a0a);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.38;
  floorGroup.add(gridHelper);

  const heroGroup = new THREE.Group();
  scene.add(heroGroup);

  const stubGeometry = new THREE.BufferGeometry();
  stubGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(3), 1)
  );
  const fabric = new THREE.Mesh(stubGeometry, new THREE.MeshBasicMaterial({ visible: false }));
  const flatPositions = new Float32Array(0);

  const zeroPoint = new THREE.PointLight(0xffffff, 0, 0);
  const noop = {
    material: { opacity: 0 },
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    visible: false
  };

  return {
    scene,
    camera,
    renderer,
    ambientLight,
    keyLight,
    fillLight,
    rimLight: zeroPoint,
    glowLight: zeroPoint,
    softAccentLight: zeroPoint,
    softTopLight: zeroPoint,
    specularLight: zeroPoint,
    coreLight: zeroPoint,
    heroGroup,
    geometry: stubGeometry,
    fabric,
    flatPositions,
    object: fabric,
    productObjects: [],
    updateCharacter: null,
    backGlow: { ...noop, material: { opacity: 0 } },
    shell: { material: { opacity: 0 } },
    atmosphereShell: { material: { opacity: 0 } },
    innerCore: { visible: false, position: new THREE.Vector3() },
    innerCoreAura: { visible: false },
    fresnelMaterial: { opacity: 0 },
    fresnelMesh: { scale: new THREE.Vector3(1, 1, 1) },
    shellStressA: { material: { opacity: 0 } },
    shellStressB: { material: { opacity: 0 } },
    halo: { ...noop },
    haloGlow: { ...noop },
    haloSecondary: { ...noop },
    haloSecondaryGlow: { ...noop },
    haloSigil: { ...noop },
    stressSeams: [],
    pressureLights: [
      new THREE.PointLight(0xffffff, 0, 0),
      new THREE.PointLight(0xffffff, 0, 0)
    ]
  };
}

export function createAmbientSystems({ THREE, scene }) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
  const ghost = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ transparent: true, opacity: 0, size: 0.001 })
  );
  scene.add(ghost);
  return {
    microShardBase: [],
    microShards: ghost,
    particles: ghost,
    particleCount: 0,
    particleBase: new Float32Array(0),
    particleOffsets: []
  };
}

export function createShowcaseSystems({ THREE, scene }) {
  const showcaseGroup = new THREE.Group();
  scene.add(showcaseGroup);
  return { showcaseGroup, showcases: [] };
}

export function createFragmentSystems({ THREE, scene }) {
  const fragmentGroup = new THREE.Group();
  scene.add(fragmentGroup);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
  const energyDust = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ transparent: true, opacity: 0 })
  );
  fragmentGroup.add(energyDust);

  const fragmentMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
  const fragments = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.001, 0.001, 0.001),
    fragmentMaterial,
    1
  );
  fragments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  fragments.frustumCulled = false;
  fragmentGroup.add(fragments);

  return {
    fragmentGroup,
    energyDust,
    fragments,
    fragmentMaterial,
    fragmentCount: 0,
    fragmentTargets: [],
    fragmentOrigins: []
  };
}

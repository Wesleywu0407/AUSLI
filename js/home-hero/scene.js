// scene.js — AUSLI hero
// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 → solid grey plane, no texture, no alpha — confirms Three.js renders.
// STEP 4 → added wave animation (topFactor gravity model).
// STEP 5 → added dark silk canvas texture with AUSLI jacquard mark.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Canvas texture — built in Steps 4→5, only called once the plane is confirmed.
// Deep black silk base + woven grain + centred AUSLI jacquard mark.
// ─────────────────────────────────────────────────────────────────────────────
function createFabricTexture(THREE) {
  const SIZE   = 1024;
  const canvas = document.createElement("canvas");
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");

  // Base — dark charcoal (NOT pure black — gives lighting something to work with)
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Grain — tiny random rects simulate close-woven fabric structure
  for (let i = 0; i < 12000; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const w = Math.random() * 2   + 0.5;
    const h = Math.random() * 1.5 + 0.3;
    ctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.06 + 0.01).toFixed(4)})`;
    ctx.fillRect(x, y, w, h);
  }

  // Horizontal thread lines — very subtle weave structure
  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth   = 0.5;
  for (let y = 2; y < SIZE; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SIZE, y);
    ctx.stroke();
  }

  // AUSLI jacquard text — woven-in mark, mid opacity
  ctx.save();
  ctx.fillStyle     = "rgba(255,255,255,0.35)";
  ctx.font          = '600 140px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.letterSpacing = "0.3em";
  ctx.textAlign     = "center";
  ctx.textBaseline  = "middle";
  ctx.fillText("AUSLI", SIZE / 2 - 18, SIZE / 2);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─────────────────────────────────────────────────────────────────────────────
// createHeroScene
// ─────────────────────────────────────────────────────────────────────────────
export function createHeroScene({ THREE, heroScene }) {

  // ── Dimensions ────────────────────────────────────────────────────────────
  // window.innerWidth/Height are always valid, even before first layout pass.
  const W = window.innerWidth;
  const H = window.innerHeight;

  console.log("[AUSLI] createHeroScene — W:", W, "H:", H, "container:", heroScene);

  // ── Scene ─────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();

  // ── Camera ────────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);

  // ── Renderer ──────────────────────────────────────────────────────────────
  // NO alpha:true — solid background eliminates the "transparent fabric on
  // dark page = invisible" problem. The dark background is painted by the
  // renderer itself via setClearColor.
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x0a0a0f, 1);          // deep navy-black
  renderer.outputColorSpace   = THREE.SRGBColorSpace;
  renderer.toneMapping        = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  // Position the canvas so it fills the container
  renderer.domElement.style.display  = "block";
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.inset    = "0";
  renderer.domElement.style.width    = "100%";
  renderer.domElement.style.height   = "100%";

  // ── Cinematic entrance — canvas starts invisible ──────────────────────────
  // Opacity starts at 0 so the page opens to pure black.
  // The transition fires once opacity is set to '1' in the setTimeout below.
  renderer.domElement.style.opacity    = "0";
  renderer.domElement.style.transition = "opacity 1.2s ease-out";

  // Clear any old canvas from hot-reloads / previous mounts
  heroScene.innerHTML = "";
  heroScene.style.position = "relative";        // ensure absolute child works
  heroScene.appendChild(renderer.domElement);

  console.log("[AUSLI] renderer canvas appended:", renderer.domElement);

  // ── Entrance sequence timers ──────────────────────────────────────────────
  // 0.2s — fabric curtain begins rising (1.2s fade duration → fully visible ~1.4s)
  setTimeout(() => {
    renderer.domElement.style.opacity = "1";
  }, 200);

  // 1.0s — "Edition 01" kicker fades in (0.8s duration → fully visible ~1.8s)
  setTimeout(() => {
    const kicker = document.querySelector(".hero-kicker");
    if (kicker) kicker.style.opacity = "1";
  }, 1000);

  // ── Lighting ──────────────────────────────────────────────────────────────
  // Bright enough to illuminate a mid-grey (#1a1a1a) fabric clearly.
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 6.0);
  keyLight.position.set(-3, 5, 4);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xfff5e0, 2.0);
  fillLight.position.set(4, -2, 2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xddeeff, 3.0);
  rimLight.position.set(2, -1, -4);
  scene.add(rimLight);

  // ── Geometry ──────────────────────────────────────────────────────────────
  // PlaneGeometry(width, height, widthSegments, heightSegments)
  // Y ranges from +H/2 (top) to -H/2 (bottom) in local space.
  const geometry = new THREE.PlaneGeometry(6, 5, 80, 100);

  // Snapshot flat rest positions — animation.js reads x/y, writes only Z
  const flatPositions = geometry.attributes.position.array.slice();

  // ── Material ──────────────────────────────────────────────────────────────
  const material = new THREE.MeshStandardMaterial({
    map:       createFabricTexture(THREE),
    roughness: 0.35,   // silk sheen — low enough for bright highlights
    metalness: 0.3,    // slight mirror quality on fold peaks
    side:      THREE.DoubleSide
  });

  const fabric = new THREE.Mesh(geometry, material);
  fabric.frustumCulled = false;

  const heroGroup = new THREE.Group();
  heroGroup.add(fabric);
  scene.add(heroGroup);

  console.log("[AUSLI] fabric mesh added. vertices:", geometry.attributes.position.count);

  // ── Stubs — keep index.js crash-free ─────────────────────────────────────
  const _zeroPoint = new THREE.PointLight(0xffffff, 0, 0);
  const _noop      = {
    material: { opacity: 0 },
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    visible:  false
  };

  return {
    scene,
    camera,
    renderer,
    ambientLight,
    keyLight,
    fillLight,
    rimLight,
    glowLight:        _zeroPoint,
    softAccentLight:  _zeroPoint,
    softTopLight:     _zeroPoint,
    specularLight:    _zeroPoint,
    coreLight:        _zeroPoint,
    heroGroup,
    geometry,
    fabric,
    flatPositions,
    object: fabric,
    backGlow:          { ..._noop, material: { opacity: 0 } },
    shell:             { material: { opacity: 0 } },
    atmosphereShell:   { material: { opacity: 0 } },
    innerCore:         { visible: false, position: new THREE.Vector3() },
    innerCoreAura:     { visible: false },
    fresnelMaterial:   { opacity: 0 },
    fresnelMesh:       { scale: new THREE.Vector3(1, 1, 1) },
    shellStressA:      { material: { opacity: 0 } },
    shellStressB:      { material: { opacity: 0 } },
    halo:              { ..._noop },
    haloGlow:          { ..._noop },
    haloSecondary:     { ..._noop },
    haloSecondaryGlow: { ..._noop },
    haloSigil:         { ..._noop },
    stressSeams:       [],
    pressureLights:    [
      new THREE.PointLight(0xffffff, 0, 0),
      new THREE.PointLight(0xffffff, 0, 0)
    ]
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stubs — all four exports index.js imports must exist
// ─────────────────────────────────────────────────────────────────────────────

export function createAmbientSystems({ THREE, scene }) {
  const geo   = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
  const ghost = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ transparent: true, opacity: 0, size: 0.001 })
  );
  scene.add(ghost);
  return {
    microShardBase:  [],
    microShards:     ghost,
    particles:       ghost,
    particleCount:   0,
    particleBase:    new Float32Array(0),
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
    fragmentMaterial,
    fragments,
    fragmentData:          [],
    energyDust,
    energyDustBase:        [],
    tempExplosionPosition: new THREE.Vector3(),
    tempFieldPosition:     new THREE.Vector3(),
    dummy:                 new THREE.Object3D()
  };
}

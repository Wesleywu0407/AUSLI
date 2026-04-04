const heroScene = document.getElementById("hero-scene");
const hero = document.getElementById("hero");
const heroContent = document.getElementById("hero-content");
const heroTitle = document.getElementById("hero-title");
const heroTagline = document.querySelector(".hero-tagline");
const heroKicker = document.querySelector(".hero-kicker");
const productCards = [...document.querySelectorAll(".product-card")];
const detailOverlay = document.getElementById("detail-overlay");
const detailImage = document.getElementById("detail-image");
const detailName = document.getElementById("detail-name");
const detailPrice = document.getElementById("detail-price");
const detailDescription = document.getElementById("detail-description");
const closeButton = document.querySelector(".overlay-close");
const openFirstButton = document.querySelector("[data-open-first]");
const featureButtons = [...document.querySelectorAll("[data-open-product]")];
const cursor = document.querySelector(".cursor");
const interactiveElements = document.querySelectorAll("a, button, .product-card");
const revealSections = [...document.querySelectorAll(".reveal-section")];
const aiSentinel = document.getElementById("ai-sentinel");
const aiNodeAura = document.querySelector(".ai-node-aura");
const aiNodeRings = [...document.querySelectorAll(".ai-node-ring")];
const aiNodeBody = document.querySelector(".ai-node-body");
const aiNodeCoreWrap = document.querySelector(".ai-node-core-wrap");
const aiNodeCores = [...document.querySelectorAll(".ai-node-core")];
const aiNodeRipples = [...document.querySelectorAll(".ai-node-ripple")];
const curatorPanel = document.getElementById("curator-panel");
const curatorClose = document.getElementById("curator-close");
const curatorForm = document.getElementById("curator-form");
const curatorInput = document.getElementById("curator-input");
const curatorSubmit = document.getElementById("curator-submit");
const curatorStatus = document.getElementById("curator-status");
const curatorResponse = document.getElementById("curator-response");
const curatorChips = [...document.querySelectorAll(".curator-chip")];
const collectionGrid = document.getElementById("collection-grid");
const collectionCount = document.getElementById("collection-count");
const filterChips = [...document.querySelectorAll(".filter-chip")];
const sortSelect = document.getElementById("collection-sort");

function usingDedicatedHero() {
  return (
    window.__AUSLI_USE_DEDICATED_HERO__ === true ||
    document.body?.dataset.dedicatedHero === "true"
  );
}

let activeCard = null;
const heroState = {
  progress: 0,
  pointerX: 0,
  pointerY: 0
};

function safeRun(label, callback) {
  try {
    callback();
  } catch (error) {
    console.error(`[AUSLI] ${label} failed`, error);
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function formatCuratorError(message) {
  const normalized = String(message || "").toLowerCase();

  if (
    normalized.includes("quota") ||
    normalized.includes("billing") ||
    normalized.includes("rate limit") ||
    normalized.includes("insufficient")
  ) {
    return "AUSLI is unavailable right now. The channel is closed.";
  }

  if (
    normalized.includes("api key") ||
    normalized.includes("unauthorized") ||
    normalized.includes("authentication")
  ) {
    return "AUSLI is unavailable right now. The key is not accepted.";
  }

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network") ||
    normalized.includes("offline")
  ) {
    return "AUSLI is unavailable right now. The channel is not reaching the network.";
  }

  return "AUSLI is unavailable right now. The signal is unstable.";
}

function getCuratorApiUrl() {
  const currentOrigin = window.location.origin;

  if (currentOrigin === "http://localhost:3000" || currentOrigin === "http://127.0.0.1:3000") {
    return "/api/chat";
  }

  return "http://localhost:3000/api/chat";
}

function initHeroScene() {
  if (!heroScene || !window.THREE) {
    return;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 7, 14);

  const camera = new THREE.PerspectiveCamera(
    45,
    heroScene.clientWidth / heroScene.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.08, 6.2);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(heroScene.clientWidth, heroScene.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  heroScene.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.24);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xf5f7fb, 1.9);
  keyLight.position.set(2.4, 2.9, 5.2);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xb7c0cd, 0.42);
  fillLight.position.set(-3.2, 0.9, 2.4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xf0f4fa, 0.76);
  rimLight.position.set(0.7, 0.7, -4.7);
  scene.add(rimLight);

  const glowLight = new THREE.PointLight(0xe8eef8, 1.2, 24, 2);
  glowLight.position.set(0.2, 0.4, 3.1);
  scene.add(glowLight);

  const heroGroup = new THREE.Group();
  scene.add(heroGroup);

  const geometry = new THREE.IcosahedronGeometry(1.35, 4);
  const positionAttribute = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < positionAttribute.count; i += 1) {
    vertex.fromBufferAttribute(positionAttribute, i);
    const normal = vertex.clone().normalize();
    const waveA = Math.sin(normal.y * 3.2) * 0.08;
    const waveB = Math.cos(normal.x * 4.6) * 0.05;
    const waveC = Math.sin((normal.z + normal.x) * 5.4) * 0.035;
    const radius = 1 + waveA + waveB + waveC;
    vertex.copy(normal.multiplyScalar(1.35 * radius));
    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xb6beca,
    metalness: 0.72,
    roughness: 0.24,
    transparent: true,
    opacity: 0.99,
    clearcoat: 0.52,
    clearcoatRoughness: 0.38,
    sheen: 0.28,
    sheenColor: new THREE.Color(0xd4dbe5),
    sheenRoughness: 0.48,
    envMapIntensity: 1,
    reflectivity: 0.78
  });

  const object = new THREE.Mesh(geometry, material);
  heroGroup.add(object);

  const shellGeometry = geometry.clone();
  const fresnelGeometry = geometry.clone();

  const shell = new THREE.Mesh(
    shellGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 0x101215,
      transparent: true,
      opacity: 0.1,
      roughness: 0.34,
      metalness: 0.3,
      side: THREE.DoubleSide
    })
  );
  shell.scale.setScalar(1.14);
  heroGroup.add(shell);

  const fresnelMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      glowColor: { value: new THREE.Color(0xd7dee8) },
      c: { value: 0.85 },
      p: { value: 2.6 },
      opacity: { value: 0.16 }
    },
    vertexShader: `
      uniform float c;
      uniform float p;
      varying float intensity;
      void main() {
        vec3 worldNormal = normalize(normalMatrix * normal);
        vec3 viewDir = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
        intensity = pow(c - abs(dot(worldNormal, viewDir)), p);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float opacity;
      varying float intensity;
      void main() {
        gl_FragColor = vec4(glowColor, intensity * opacity);
      }
    `
  });

  const fresnelMesh = new THREE.Mesh(fresnelGeometry, fresnelMaterial);
  fresnelMesh.scale.setScalar(1.06);
  heroGroup.add(fresnelMesh);

  const specularLight = new THREE.PointLight(0xfafcff, 1.6, 20, 2);
  specularLight.position.set(0.45, 0.72, 2.9);
  heroGroup.add(specularLight);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(2.06, 0.006, 16, 180),
    new THREE.MeshBasicMaterial({
      color: 0xd9e0ea,
      transparent: true,
      opacity: 0.13
    })
  );
  halo.rotation.set(Math.PI / 2.35, 0.1, 0.24);
  heroGroup.add(halo);

  const haloSecondary = new THREE.Mesh(
    new THREE.TorusGeometry(2.16, 0.004, 16, 180),
    new THREE.MeshBasicMaterial({
      color: 0xcfd6e0,
      transparent: true,
      opacity: 0.055
    })
  );
  haloSecondary.rotation.set(Math.PI / 2.05, -0.18, -0.28);
  heroGroup.add(haloSecondary);

  const particleCount = 22;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleBase = new Float32Array(particleCount * 3);
  const particleOffsets = [];

  for (let i = 0; i < particleCount; i += 1) {
    const i3 = i * 3;
    particleBase[i3] = (Math.random() - 0.5) * 10;
    particleBase[i3 + 1] = (Math.random() - 0.5) * 5;
    particleBase[i3 + 2] = -1.5 - Math.random() * 5.5;
    particlePositions[i3] = particleBase[i3];
    particlePositions[i3 + 1] = particleBase[i3 + 1];
    particlePositions[i3 + 2] = particleBase[i3 + 2];
    particleOffsets.push(Math.random() * Math.PI * 2);
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3)
  );

  const particlesMaterial = new THREE.PointsMaterial({
    color: 0xd2d8e0,
    size: 0.032,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    sizeAttenuation: true
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  const pointer = { x: 0, y: 0 };
  const parallax = { x: 0, y: 0 };
  const objectTilt = { x: 0, y: 0 };
  const ringTilt = { x: 0, y: 0 };

  function handlePointerMove(event) {
    const { innerWidth, innerHeight } = window;
    heroState.pointerX = (event.clientX / innerWidth - 0.5) * 2;
    heroState.pointerY = (event.clientY / innerHeight - 0.5) * 2;
    pointer.x = heroState.pointerX;
    pointer.y = heroState.pointerY;
  }

  function handleResize() {
    if (!heroScene.clientWidth || !heroScene.clientHeight) {
      return;
    }

    camera.aspect = heroScene.clientWidth / heroScene.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(heroScene.clientWidth, heroScene.clientHeight);
  }

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("resize", handleResize);

  const clock = new THREE.Clock();

  function animate() {
    const elapsed = clock.getElapsedTime();
    const scrollProgress = heroState.progress;

    parallax.x += (pointer.x - parallax.x) * 0.03;
    parallax.y += (pointer.y - parallax.y) * 0.03;
    objectTilt.x += (pointer.y - objectTilt.x) * 0.06;
    objectTilt.y += (pointer.x - objectTilt.y) * 0.06;
    ringTilt.x += (pointer.y - ringTilt.x) * 0.035;
    ringTilt.y += (pointer.x - ringTilt.y) * 0.035;

    camera.position.x = parallax.x * 0.14;
    camera.position.y = 0.08 + parallax.y * 0.1 - scrollProgress * 0.14;
    camera.position.z = 6.2 - scrollProgress * 1.15;
    camera.lookAt(parallax.x * 0.2, parallax.y * 0.12, 0);

    heroGroup.position.x = parallax.x * 0.06;
    heroGroup.position.y =
      Math.sin(elapsed * 0.42) * 0.12 + parallax.y * 0.04 - scrollProgress * 0.08;

    const scale = 1.04 + scrollProgress * 0.14;
    heroGroup.scale.setScalar(scale);

    object.rotation.y = elapsed * 0.18 + objectTilt.y * 0.2;
    object.rotation.x = Math.sin(elapsed * 0.32) * 0.07 + objectTilt.x * 0.12;
    object.rotation.z = Math.cos(elapsed * 0.18) * 0.035;

    shell.rotation.copy(object.rotation);
    shell.rotation.y += 0.035;
    shell.rotation.x += 0.012;
    shell.scale.setScalar(1.015 + scrollProgress * 0.035);
    shell.material.opacity = 0.1 - scrollProgress * 0.03;

    fresnelMesh.rotation.copy(object.rotation);
    fresnelMaterial.uniforms.opacity.value = 0.16 - scrollProgress * 0.05;

    halo.position.y = scrollProgress * 0.08;
    halo.rotation.x = Math.PI / 2.35 + ringTilt.x * 0.03;
    halo.rotation.y = 0.1 + ringTilt.y * 0.04;
    halo.rotation.z = 0.24 + elapsed * 0.05 + ringTilt.y * 0.025 + scrollProgress * 0.08;

    haloSecondary.position.y = -scrollProgress * 0.06;
    haloSecondary.rotation.x = Math.PI / 2.05 + ringTilt.x * 0.018;
    haloSecondary.rotation.y = -0.18 + ringTilt.y * 0.022;
    haloSecondary.rotation.z =
      -0.28 - elapsed * 0.036 + ringTilt.x * 0.014 - scrollProgress * 0.06;

    particles.material.opacity = 0.32 - scrollProgress * 0.1;

    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      positions[i3] = particleBase[i3] + Math.sin(elapsed * 0.18 + particleOffsets[i]) * 0.04;
      positions[i3 + 1] =
        particleBase[i3 + 1] + Math.cos(elapsed * 0.16 + particleOffsets[i]) * 0.035;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    specularLight.position.x = 0.4 + parallax.x * 0.18;
    specularLight.position.y = 0.6 + Math.sin(elapsed * 0.6) * 0.08;
    glowLight.position.x = 0.2 + parallax.x * 0.24;
    glowLight.position.y = 0.4 + Math.cos(elapsed * 0.4) * 0.12;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

function updateHeroScroll() {
  window.__AUSLI_MAIN_HERO_SCROLL_RUNS__ = (window.__AUSLI_MAIN_HERO_SCROLL_RUNS__ || 0) + 1;
  if (!hero || !heroContent) {
    return;
  }

  const rect = hero.getBoundingClientRect();
  const maxScroll = Math.max(hero.offsetHeight - window.innerHeight, 1);
  const scrolled = clamp(-rect.top, 0, maxScroll);
  const progress = clamp(scrolled / maxScroll, 0, 1);
  heroState.progress = progress;

  if (heroTitle) {
    heroTitle.style.opacity = `${1 - progress * 1.18}`;
    heroTitle.style.transform = `translateY(${progress * -36}px) scale(${1 - progress * 0.05})`;
  }

  if (heroKicker) {
    const kickerFade = clamp(1 - progress * 1.05, 0, 1);
    heroKicker.style.opacity = `${kickerFade}`;
    heroKicker.style.transform = `translateY(${progress * -18}px)`;
  }

  if (heroTagline) {
    const delayed = clamp((progress - 0.12) / 0.88, 0, 1);
    heroTagline.style.opacity = `${1 - delayed * 1.08}`;
    heroTagline.style.transform = `translateY(${delayed * -24}px)`;
  }

  heroContent.style.opacity = `${1 - progress * 0.28}`;

  if (
    window.__AUSLI_DEBUG_UPDATE_CONNECTIONS__ === true &&
    window.__AUSLI_MAIN_HERO_SCROLL_RUNS__ % 10 === 0
  ) {
    console.log("[AUSLI UPDATE] main.updateHeroScroll", {
      runs: window.__AUSLI_MAIN_HERO_SCROLL_RUNS__,
      progress: Number(progress.toFixed(3)),
      dedicatedHero: usingDedicatedHero()
    });
  }
}

function initOverlay() {
  if (!detailOverlay || !detailImage || !detailName || !detailPrice || !detailDescription) {
    return;
  }

  function openOverlay(card) {
    activeCard = card;
    detailImage.src = card.dataset.image;
    detailImage.alt = card.dataset.name;
    detailName.textContent = card.dataset.name;
    detailPrice.textContent = card.dataset.price;
    detailDescription.textContent = card.dataset.description;
    detailOverlay.classList.add("is-open");
    detailOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("overlay-open");

    if (window.gsap) {
      gsap.fromTo(
        ".detail-panel",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
    }
  }

  function closeOverlay() {
    const trigger = activeCard;
    detailOverlay.classList.remove("is-open");
    detailOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overlay-open");
    activeCard = null;
    return trigger;
  }

  productCards.forEach((card) => {
    card.addEventListener("click", () => openOverlay(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openOverlay(card);
      }
    });
  });

  featureButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.openProduct);
      if (productCards[index]) {
        openOverlay(productCards[index]);
      }
    });
  });

  openFirstButton?.addEventListener("click", () => {
    if (productCards[0]) {
      openOverlay(productCards[0]);
    }
  });

  closeButton?.addEventListener("click", closeOverlay);

  detailOverlay?.addEventListener("click", (event) => {
    if (event.target === detailOverlay) {
      closeOverlay();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && detailOverlay.classList.contains("is-open")) {
      const trigger = closeOverlay();
      trigger?.focus();
    }
  });
}

function initCollectionControls() {
  if (!collectionGrid || !productCards.length || !filterChips.length || !sortSelect) {
    return;
  }

  const originalOrder = new Map(productCards.map((card, index) => [card, index]));
  let activeFilter = "all";

  function updateCount(visibleCards) {
    if (!collectionCount) {
      return;
    }

    const label = visibleCards === 1 ? "PIECE" : "PIECES";
    collectionCount.textContent = `${visibleCards} ${label}`;
  }

  function sortCards(cards, mode) {
    const sorted = [...cards];

    sorted.sort((cardA, cardB) => {
      if (mode === "price-asc") {
        return Number(cardA.dataset.sortPrice) - Number(cardB.dataset.sortPrice);
      }

      if (mode === "price-desc") {
        return Number(cardB.dataset.sortPrice) - Number(cardA.dataset.sortPrice);
      }

      if (mode === "name-asc") {
        return cardA.dataset.name.localeCompare(cardB.dataset.name);
      }

      return originalOrder.get(cardA) - originalOrder.get(cardB);
    });

    return sorted;
  }

  function render() {
    const visibleCards = productCards.filter((card) => (
      activeFilter === "all" || card.dataset.category === activeFilter
    ));

    const sortedCards = sortCards(visibleCards, sortSelect.value);

    productCards.forEach((card) => {
      const isVisible = visibleCards.includes(card);
      card.classList.toggle("is-hidden", !isVisible);
      card.setAttribute("aria-hidden", String(!isVisible));
      card.tabIndex = isVisible ? 0 : -1;
    });

    sortedCards.forEach((card) => {
      collectionGrid.appendChild(card);
    });

    updateCount(visibleCards.length);
  }

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filter || "all";

      filterChips.forEach((button) => {
        const isActive = button === chip;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      render();
    });
  });

  sortSelect.addEventListener("change", render);
  render();
}

function initCursor() {
  if (!cursor || window.matchMedia("(max-width: 720px)").matches) {
    return;
  }

  document.body.classList.add("has-custom-cursor");

  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const target = { ...pos };

  window.addEventListener("pointermove", (event) => {
    target.x = event.clientX;
    target.y = event.clientY;
  });

  interactiveElements.forEach((element) => {
    element.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
    element.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  });

  function tick() {
    pos.x += (target.x - pos.x) * 0.18;
    pos.y += (target.y - pos.y) * 0.18;
    cursor.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }

  tick();
}

function initCurator() {
  if (!aiSentinel || !curatorPanel) {
    return;
  }

  const sentinelState = {
    pointerX: window.innerWidth * 0.78,
    pointerY: window.innerHeight * 0.82,
    near: false,
    clickPulse: 0,
    scrollInfluence: 0,
    scrollVelocity: 0,
    energyPulse: 0,
    isSending: false,
    visible: false
  };
  let requestCount = 0;
  const history = [];

  function openPanel() {
    curatorPanel.classList.add("is-open");
    curatorPanel.setAttribute("aria-hidden", "false");
    document.body.classList.add("curator-open");
    aiSentinel.classList.add("is-open");

    if (window.gsap) {
      gsap.fromTo(
        ".curator-panel-inner",
        { x: 24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
      );
    }

    setStatus("AUSLI SENTINEL is attentive.");
    setTimeout(() => curatorInput?.focus(), 220);
  }

  function closePanel() {
    curatorPanel.classList.remove("is-open");
    curatorPanel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("curator-open");
    aiSentinel.classList.remove("is-open");
    setStatus("AUSLI SENTINEL is present.");
  }

  function setStatus(text) {
    if (!curatorStatus) {
      return;
    }

    curatorStatus.textContent = text;
  }

  function setResponse(text, options = {}) {
    if (!curatorResponse) {
      return;
    }

    const { loading = false } = options;
    curatorResponse.classList.toggle("is-loading", loading);
    curatorResponse.innerHTML = `<p>${escapeHtml(text)}</p>`;
  }

  function setPendingState(isPending) {
    curatorInput?.toggleAttribute("disabled", isPending);
    curatorSubmit?.toggleAttribute("disabled", isPending);
  }

  async function sendMessage(message) {
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    const requestId = requestCount + 1;
    requestCount = requestId;
    sentinelState.isSending = true;
    setPendingState(true);
    setStatus("AUSLI SENTINEL is listening.");
    setResponse("Gathering mood, object, and silhouette signals.", { loading: true });

    try {
      const response = await fetch(getCuratorApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmed,
          history: history.slice(-6),
          mood: aiSentinel?.dataset.mood || "active"
        })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "The sentinel could not answer right now.");
      }

      if (requestId !== requestCount) {
        return;
      }

      history.push(
        { role: "user", content: trimmed },
        { role: "assistant", content: payload.reply }
      );
      setResponse(payload.reply || "The sentinel returned only silence.");
      setStatus("AUSLI SENTINEL is present.");
    } catch (error) {
      if (requestId !== requestCount) {
        return;
      }

      setResponse(formatCuratorError(error.message));
      setStatus("AUSLI SENTINEL is quiet.");
    } finally {
      if (requestId === requestCount) {
        sentinelState.isSending = false;
        setPendingState(false);
        curatorInput?.focus();
      }
    }
  }

  aiSentinel.addEventListener("click", () => {
    if (window.gsap) {
      gsap.fromTo(
        sentinelState,
        { clickPulse: 0 },
        { clickPulse: 1, duration: 0.24, yoyo: true, repeat: 1, ease: "power2.out" }
      );
      gsap.fromTo(
        sentinelState,
        { energyPulse: 0.3 },
        { energyPulse: 1, duration: 0.7, ease: "power2.out" }
      );
    } else {
      sentinelState.clickPulse = 1;
      sentinelState.energyPulse = 1;
    }
    openPanel();
  });

  curatorClose?.addEventListener("click", closePanel);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && curatorPanel.classList.contains("is-open")) {
      closePanel();
    }
  });

  curatorChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const prompt = chip.textContent.trim();

      if (curatorInput) {
        curatorInput.value = prompt;
      }

      sendMessage(prompt);
    });
  });

  curatorForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(curatorInput?.value || "");
  });

  window.addEventListener("pointermove", (event) => {
    sentinelState.pointerX = event.clientX;
    sentinelState.pointerY = event.clientY;

    const rect = aiSentinel.getBoundingClientRect();
    const nodeX = rect.left + rect.width / 2;
    const nodeY = rect.top + rect.height / 2;
    const distance = Math.hypot(event.clientX - nodeX, event.clientY - nodeY);
    const isNear = distance < 160;

    if (isNear !== sentinelState.near) {
      sentinelState.near = isNear;
      aiSentinel.classList.toggle("is-near", isNear);
    }
  });

  let lastScrollY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const currentScrollY = window.scrollY;
      sentinelState.scrollInfluence = currentScrollY / maxScroll;
      sentinelState.scrollVelocity = clamp(
        Math.abs(currentScrollY - lastScrollY) / Math.max(window.innerHeight, 1),
        0,
        1
      );
      sentinelState.energyPulse = Math.max(
        sentinelState.energyPulse,
        0.5 + sentinelState.scrollVelocity * 0.35
      );
      lastScrollY = currentScrollY;
    },
    { passive: true }
  );

  let t = 0;
  const proximity = { value: 0, target: 0 };
  const awareness = { x: 0, y: 0 };
  const ringDrift = { x: 0, y: 0 };
  const mood = { calm: 1, focus: 0, active: 0 };
  const appearance = { value: 0 };
  const coreAware = [
    { x: 0, y: 0 },
    { x: 0, y: 0 }
  ];

  function animateNode() {
    t += 0.016;
    const panelOpen = curatorPanel.classList.contains("is-open");
    const revealThreshold = Math.min(window.innerHeight * 0.18, 160);
    sentinelState.visible = window.scrollY > revealThreshold || panelOpen;
    appearance.value += ((sentinelState.visible ? 1 : 0) - appearance.value) * 0.075;
    aiSentinel.classList.toggle("is-visible", appearance.value > 0.02);
    aiSentinel.style.pointerEvents = appearance.value > 0.72 ? "auto" : "none";
    aiSentinel.style.opacity = `${appearance.value}`;
    aiSentinel.style.visibility = appearance.value > 0.02 ? "visible" : "hidden";

    proximity.target = sentinelState.near || panelOpen ? 1 : 0;
    proximity.value += (proximity.target - proximity.value) * 0.04;
    sentinelState.scrollVelocity += (0 - sentinelState.scrollVelocity) * 0.04;
    sentinelState.energyPulse += (0 - sentinelState.energyPulse) * 0.03;

    const nextMood = sentinelState.isSending || panelOpen || sentinelState.clickPulse > 0.04
      ? "active"
      : sentinelState.near
        ? "focus"
        : "calm";

    mood.calm += ((nextMood === "calm" ? 1 : 0) - mood.calm) * 0.032;
    mood.focus += ((nextMood === "focus" ? 1 : 0) - mood.focus) * 0.042;
    mood.active += ((nextMood === "active" ? 1 : 0) - mood.active) * 0.05;
    aiSentinel.dataset.mood = nextMood;

    const presence = proximity.value * 0.55 + mood.focus * 0.5 + mood.active * 0.9;
    const ambientEnergy = sentinelState.scrollInfluence * 0.18 + sentinelState.scrollVelocity * 0.22;
    const heartbeatLeft =
      Math.pow(Math.max(0, Math.sin(t * 1.12 + 0.3)), 8) * 0.44 +
      Math.pow(Math.max(0, Math.sin(t * 0.48 + 1.15)), 10) * 0.14;
    const heartbeatRight =
      Math.pow(Math.max(0, Math.sin(t * 0.98 + 0.88)), 8) * 0.38 +
      Math.pow(Math.max(0, Math.sin(t * 0.61 + 0.22)), 10) * 0.18;
    const heartbeat = Math.max(heartbeatLeft, heartbeatRight);
    const breathingRate = 0.82 + mood.focus * 0.18 + mood.active * 0.38;
    const breathingAmplitude = 0.012 + mood.focus * 0.008 + mood.active * 0.014;
    const breath =
      1 +
      Math.sin(t * breathingRate) * (breathingAmplitude + presence * 0.008) +
      heartbeat * (0.016 + mood.active * 0.018) +
      sentinelState.clickPulse * 0.05;
    const glowPulse =
      0.18 +
      mood.focus * 0.12 +
      mood.active * 0.22 +
      Math.sin(t * (0.9 + mood.focus * 0.12 + mood.active * 0.22)) * 0.04 +
      heartbeat * (0.26 + mood.active * 0.28) +
      presence * 0.12 +
      ambientEnergy +
      sentinelState.energyPulse * 0.16;
    const rippleOpacity =
      0.018 +
      mood.focus * 0.038 +
      mood.active * 0.11 +
      heartbeat * 0.16 +
      ambientEnergy * 0.24 +
      sentinelState.energyPulse * 0.08;
    const cursorStrength = 1 + mood.focus * 0.24 + mood.active * 0.42;
    const awarenessEase = 0.03 + mood.focus * 0.018 + mood.active * 0.024;
    const ringEase = 0.018 + mood.focus * 0.014 + mood.active * 0.02;

    const rect = aiSentinel.getBoundingClientRect();
    const nodeX = rect.left + rect.width / 2;
    const nodeY = rect.top + rect.height / 2;
    const targetAwareX = clamp((sentinelState.pointerX - nodeX) / 220, -1, 1);
    const targetAwareY = clamp((sentinelState.pointerY - nodeY) / 220, -1, 1);
    awareness.x += ((targetAwareX * cursorStrength) - awareness.x) * awarenessEase;
    awareness.y += ((targetAwareY * cursorStrength) - awareness.y) * awarenessEase;
    ringDrift.x += ((targetAwareX * cursorStrength) - ringDrift.x) * ringEase;
    ringDrift.y += ((targetAwareY * cursorStrength) - ringDrift.y) * ringEase;
    coreAware[0].x += ((targetAwareX * cursorStrength) - coreAware[0].x) * (0.022 + mood.focus * 0.014 + mood.active * 0.02);
    coreAware[0].y += ((targetAwareY * cursorStrength) - coreAware[0].y) * (0.02 + mood.focus * 0.014 + mood.active * 0.018);
    coreAware[1].x += ((targetAwareX * cursorStrength) - coreAware[1].x) * (0.018 + mood.focus * 0.016 + mood.active * 0.018);
    coreAware[1].y += ((targetAwareY * cursorStrength) - coreAware[1].y) * (0.024 + mood.focus * 0.014 + mood.active * 0.02);

    const entranceOffset = (1 - appearance.value) * 22;
    const entranceScale = 0.92 + appearance.value * 0.08;
    aiSentinel.style.transform =
      `translate3d(0, ${entranceOffset}px, 0) scale(${breath * entranceScale})`;

    if (aiNodeAura) {
      aiNodeAura.style.transform = `scale(${1 + mood.focus * 0.04 + mood.active * 0.08 + heartbeat * 0.06 + sentinelState.clickPulse * 0.1})`;
      aiNodeAura.style.opacity = `${clamp(0.12 + glowPulse * 0.38, 0.12, 0.78)}`;
      aiNodeAura.style.filter = `blur(${20 + mood.focus * 3 + mood.active * 7 + sentinelState.energyPulse * 4}px)`;
    }

    if (aiNodeBody) {
      aiNodeBody.style.transform =
        `translate(${awareness.x * 1.8}px, ${awareness.y * 1.8}px) ` +
        `scale(${1 + mood.focus * 0.018 + mood.active * 0.034 + heartbeat * 0.03})`;
      aiNodeBody.style.borderColor = `rgba(198, 176, 235, ${0.08 + mood.focus * 0.06 + mood.active * 0.08 + heartbeat * 0.08})`;
    }

    aiNodeRings.forEach((ring, index) => {
      const direction = index === 0 ? 1 : -1;
      const rotateSpeed = (index === 0 ? 6.2 : 4.1) + mood.focus * 1.2 + mood.active * 2.4;
      const rotate = t * rotateSpeed * direction + ringDrift.x * (index === 0 ? 8 : 5);
      const scale = 1 + mood.focus * 0.012 + mood.active * 0.028 + heartbeat * 0.022 + sentinelState.clickPulse * 0.045;
      ring.style.transform =
        `translate(${ringDrift.x * (index === 0 ? 1.8 : 1.1)}px, ${ringDrift.y * (index === 0 ? 1.1 : 0.7)}px) ` +
        `rotate(${rotate}deg) scale(${scale})`;
      ring.style.opacity = `${clamp(0.46 + mood.focus * 0.16 + mood.active * 0.22 + ambientEnergy * 0.2, 0.32, 0.96)}`;
      ring.style.filter = `brightness(${0.96 + mood.focus * 0.14 + mood.active * 0.24 + heartbeat * 0.12 + sentinelState.energyPulse * 0.1})`;
    });

    if (aiNodeCoreWrap) {
      const mergePull = clamp(mood.focus * 0.16 + mood.active * 0.28 + sentinelState.clickPulse * 0.95, 0, 0.98);
      aiNodeCoreWrap.style.transform =
        `translate(${awareness.x * 2.2}px, ${awareness.y * 2.2}px) ` +
        `scale(${1 + mood.focus * 0.02 + mood.active * 0.04 + heartbeat * 0.02})`;
      aiNodeCoreWrap.style.borderColor = `rgba(189, 170, 224, ${0.06 + mood.focus * 0.06 + mood.active * 0.1 + ambientEnergy * 0.05 + heartbeat * 0.08})`;
      aiNodeCoreWrap.style.boxShadow = `inset 0 0 ${14 + mood.focus * 8 + mood.active * 16 + heartbeat * 18}px rgba(86, 56, 142, ${0.06 + mood.focus * 0.05 + mood.active * 0.08})`;

      aiNodeCores.forEach((core, index) => {
        const isLeft = index === 0;
        const heartbeatValue = isLeft ? heartbeatLeft : heartbeatRight;
        const baseX = isLeft ? -6.8 : 8.1;
        const xAware = (isLeft ? coreAware[0].x : coreAware[1].x) * (isLeft ? 3.1 : 4.2);
        const yAware = (isLeft ? coreAware[0].y : coreAware[1].y) * (isLeft ? 2.6 : 3.4);
        const driftX = Math.sin(t * (isLeft ? 0.72 : 0.66) + (isLeft ? 0.2 : 1.3)) * (isLeft ? 0.55 : 0.8);
        const driftY = Math.cos(t * (isLeft ? 0.63 : 0.84) + (isLeft ? 0.4 : 0.9)) * (isLeft ? 0.5 : 0.72);
        const mergeX = baseX * (1 - mergePull);
        const scale = 1 + mood.focus * 0.08 + mood.active * 0.12 + heartbeatValue * 0.18 + sentinelState.clickPulse * 0.16;
        const blurGlow = 12 + mood.focus * 8 + mood.active * 14 + heartbeatValue * 18 + sentinelState.energyPulse * 7;
        const glowAlpha = 0.18 + mood.focus * 0.12 + mood.active * 0.18 + heartbeatValue * 0.18 + ambientEnergy * 0.1;

        core.style.transform =
          `translate(calc(-50% + ${mergeX + xAware + driftX}px), calc(-50% + ${yAware + driftY}px)) ` +
          `scale(${scale})`;
        core.style.boxShadow =
          `0 0 ${blurGlow}px rgba(168, 122, 255, ${glowAlpha}), ` +
          `0 0 ${blurGlow + 10}px rgba(90, 53, 160, ${0.1 + heartbeatValue * 0.08})`;
        core.style.opacity = `${clamp(0.8 + heartbeatValue * 0.18 + presence * 0.12 + ambientEnergy * 0.08, 0.74, 1)}`;
      });
    }

    aiNodeRipples.forEach((ripple, index) => {
      ripple.style.opacity = `${clamp(rippleOpacity - index * 0.012, 0.02, 0.3)}`;
      ripple.style.animationDuration = `${clamp(6.8 - mood.focus * 1.1 - mood.active * 2.1 - ambientEnergy * 1.2 + index * 0.3, 3.1, 7.4)}s`;
    });

    requestAnimationFrame(animateNode);
  }

  animateNode();
}

function initAnimations() {
  document.documentElement.classList.add("has-reveal");

  if (!window.gsap) {
    revealSections.forEach((section) => section.classList.add("is-visible"));
    return;
  }

  gsap.set([".hero-kicker", ".hero h1", ".hero-tagline"], {
    opacity: 0,
    y: 28
  });

  gsap.to(".hero-kicker", {
    opacity: 1,
    y: 0,
    duration: 1.2,
    ease: "power3.out",
    delay: 0.15
  });

  gsap.to(".hero h1", {
    opacity: 1,
    y: 0,
    duration: 1.5,
    ease: "power3.out",
    delay: 0.3
  });

  gsap.to(".hero-tagline", {
    opacity: 1,
    y: 0,
    duration: 1.25,
    ease: "power3.out",
    delay: 0.55
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        gsap.to(entry.target, {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power3.out"
        });
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.05 }
  );

  revealSections.forEach((section) => {
    // If already in viewport on load, show immediately
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      section.classList.add("is-visible");
    } else {
      observer.observe(section);
    }
  });
}

if (!usingDedicatedHero()) {
  safeRun("hero scene", initHeroScene);
}
safeRun("overlay", initOverlay);
safeRun("collection controls", initCollectionControls);
safeRun("cursor", initCursor);
safeRun("curator", initCurator);
safeRun("animations", initAnimations);
if (!usingDedicatedHero()) {
  safeRun("hero scroll", updateHeroScroll);
}

if (hero && heroContent && !usingDedicatedHero()) {
  window.addEventListener(
    "scroll",
    () => {
      safeRun("hero scroll update", updateHeroScroll);
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    safeRun("hero resize update", updateHeroScroll);
  });
}

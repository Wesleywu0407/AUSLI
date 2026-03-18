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
const aiOrb = document.getElementById("ai-orb");
const aiOrbShell = document.querySelector(".ai-orb-shell");
const aiOrbBody = document.querySelector(".ai-orb-body");
const aiOrbEnergy = document.querySelector(".ai-orb-energy");
const aiOrbPresence = document.querySelector(".ai-orb-presence");
const aiOrbRipples = [...document.querySelectorAll(".ai-orb-ripple")];
const curatorPanel = document.getElementById("curator-panel");
const curatorClose = document.getElementById("curator-close");
const curatorInput = document.getElementById("curator-input");
const curatorResponse = document.getElementById("curator-response");
const curatorChips = [...document.querySelectorAll(".curator-chip")];

let activeCard = null;
const heroState = {
  progress: 0,
  pointerX: 0,
  pointerY: 0
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.16);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xf3f4f7, 1.45);
  keyLight.position.set(2.1, 2.8, 4.8);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xaab3c0, 0.25);
  fillLight.position.set(-2.8, 0.6, 2.2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xe6ecf3, 0.48);
  rimLight.position.set(0.5, 0.55, -4.5);
  scene.add(rimLight);

  const heroGroup = new THREE.Group();
  scene.add(heroGroup);

  const geometry = new THREE.IcosahedronGeometry(1.35, 24);
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
    color: 0x9aa3af,
    metalness: 0.82,
    roughness: 0.34,
    transparent: true,
    opacity: 0.98,
    clearcoat: 0.38,
    clearcoatRoughness: 0.62,
    sheen: 0.2,
    sheenColor: new THREE.Color(0xc8d0da),
    sheenRoughness: 0.7,
    envMapIntensity: 0.75,
    reflectivity: 0.65
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
      opacity: 0.07,
      roughness: 0.56,
      metalness: 0.22,
      side: THREE.DoubleSide
    })
  );
  shell.scale.setScalar(1.18);
  heroGroup.add(shell);

  const fresnelMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      glowColor: { value: new THREE.Color(0xd7dee8) },
      c: { value: 0.85 },
      p: { value: 2.6 },
      opacity: { value: 0.1 }
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
  fresnelMesh.scale.setScalar(1.045);
  heroGroup.add(fresnelMesh);

  const specularLight = new THREE.PointLight(0xf5f8ff, 0.9, 20, 2);
  specularLight.position.set(0.4, 0.6, 2.8);
  heroGroup.add(specularLight);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(2.06, 0.006, 16, 180),
    new THREE.MeshBasicMaterial({
      color: 0xd9e0ea,
      transparent: true,
      opacity: 0.09
    })
  );
  halo.rotation.set(Math.PI / 2.35, 0.1, 0.24);
  heroGroup.add(halo);

  const haloSecondary = new THREE.Mesh(
    new THREE.TorusGeometry(2.16, 0.004, 16, 180),
    new THREE.MeshBasicMaterial({
      color: 0xcfd6e0,
      transparent: true,
      opacity: 0.035
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
    size: 0.028,
    transparent: true,
    opacity: 0.24,
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

    const scale = 1 + scrollProgress * 0.16;
    heroGroup.scale.setScalar(scale);

    object.rotation.y = elapsed * 0.18 + objectTilt.y * 0.2;
    object.rotation.x = Math.sin(elapsed * 0.32) * 0.07 + objectTilt.x * 0.12;
    object.rotation.z = Math.cos(elapsed * 0.18) * 0.035;

    shell.rotation.copy(object.rotation);
    shell.rotation.y += 0.035;
    shell.rotation.x += 0.012;
    shell.scale.setScalar(1.015 + scrollProgress * 0.035);
    shell.material.opacity = 0.07 - scrollProgress * 0.025;

    fresnelMesh.rotation.copy(object.rotation);
    fresnelMaterial.uniforms.opacity.value = 0.1 - scrollProgress * 0.03;

    halo.position.y = scrollProgress * 0.08;
    halo.rotation.x = Math.PI / 2.35 + ringTilt.x * 0.03;
    halo.rotation.y = 0.1 + ringTilt.y * 0.04;
    halo.rotation.z = 0.24 + elapsed * 0.05 + ringTilt.y * 0.025 + scrollProgress * 0.08;

    haloSecondary.position.y = -scrollProgress * 0.06;
    haloSecondary.rotation.x = Math.PI / 2.05 + ringTilt.x * 0.018;
    haloSecondary.rotation.y = -0.18 + ringTilt.y * 0.022;
    haloSecondary.rotation.z =
      -0.28 - elapsed * 0.036 + ringTilt.x * 0.014 - scrollProgress * 0.06;

    particles.material.opacity = 0.24 - scrollProgress * 0.08;

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

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

function updateHeroScroll() {
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
}

function initOverlay() {
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

function initCursor() {
  if (!cursor || window.matchMedia("(max-width: 720px)").matches) {
    return;
  }

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
  if (!aiOrb || !curatorPanel) {
    return;
  }

  const orbState = {
    pointerX: window.innerWidth * 0.78,
    pointerY: window.innerHeight * 0.82,
    near: false,
    clickPulse: 0
  };

  function openPanel() {
    curatorPanel.classList.add("is-open");
    curatorPanel.setAttribute("aria-hidden", "false");
    document.body.classList.add("curator-open");
    aiOrb.classList.add("is-open");

    if (window.gsap) {
      gsap.fromTo(
        ".curator-panel-inner",
        { x: 24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
      );
    }

    setTimeout(() => curatorInput?.focus(), 220);
  }

  function closePanel() {
    curatorPanel.classList.remove("is-open");
    curatorPanel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("curator-open");
    aiOrb.classList.remove("is-open");
  }

  function setResponse(text) {
    if (!curatorResponse) {
      return;
    }

    curatorResponse.innerHTML = `<p>${text}</p>`;
  }

  const curatedResponses = {
    "Show me silver objects":
      "A cooler edit: Slate Frame Bag, Glass Heel, and the sculptural silver hero object language. Look for cleaner surfaces, metallic restraint, and sharper silhouette contrast.",
    "I want something minimal":
      "The quietest line sits in Noir Drape Coat, Veil Column Dress, and Static Trousers. These pieces stay close to line, proportion, and softened monochrome texture.",
    "Find a statement piece":
      "For a stronger presence, start with Noir Drape Coat or Slate Frame Bag. Each holds shape with more attitude while keeping the palette controlled and editorial."
  };

  aiOrb.addEventListener("click", () => {
    if (window.gsap) {
      gsap.fromTo(
        orbState,
        { clickPulse: 0 },
        { clickPulse: 1, duration: 0.24, yoyo: true, repeat: 1, ease: "power2.out" }
      );
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
      if (curatorInput) {
        curatorInput.value = chip.textContent.trim();
      }
      setResponse(curatedResponses[chip.textContent.trim()] || "A restrained edit is ready.");
    });
  });

  curatorInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    const value = curatorInput.value.trim();
    if (!value) {
      return;
    }

    const lower = value.toLowerCase();
    if (lower.includes("silver")) {
      setResponse(curatedResponses["Show me silver objects"]);
    } else if (lower.includes("minimal")) {
      setResponse(curatedResponses["I want something minimal"]);
    } else if (lower.includes("statement")) {
      setResponse(curatedResponses["Find a statement piece"]);
    } else {
      setResponse(
        "The curator suggests beginning with the pieces that hold the cleanest silhouette and strongest material contrast, then narrowing by mood, texture, or object scale."
      );
    }
  });

  window.addEventListener("pointermove", (event) => {
    orbState.pointerX = event.clientX;
    orbState.pointerY = event.clientY;

    const rect = aiOrb.getBoundingClientRect();
    const orbX = rect.left + rect.width / 2;
    const orbY = rect.top + rect.height / 2;
    const distance = Math.hypot(event.clientX - orbX, event.clientY - orbY);
    const isNear = distance < 160;

    if (isNear !== orbState.near) {
      orbState.near = isNear;
      aiOrb.classList.toggle("is-near", isNear);
    }
  });

  let t = 0;
  const proximity = { value: 0, target: 0 };
  const awareness = { x: 0, y: 0 };

  function animateOrb() {
    t += 0.016;
    proximity.target = orbState.near || curatorPanel.classList.contains("is-open") ? 1 : 0;
    proximity.value += (proximity.target - proximity.value) * 0.04;

    const breath = 1 + Math.sin(t * 1.1) * (0.015 + proximity.value * 0.012) + orbState.clickPulse * 0.035;
    const floatY = Math.sin(t * 0.72) * (5 + proximity.value * 1.5);
    const shellRotate = t * 4.4;
    const bodyRotate = t * 7.5;
    const energyDriftX = Math.sin(t * 0.62) * 2.2 + Math.cos(t * 0.31) * 1.2;
    const energyDriftY = Math.cos(t * 0.54) * 1.8;
    const coreDriftX = Math.sin(t * 0.9) * 2.2;
    const coreDriftY = Math.cos(t * 0.76) * 1.8;

    const rect = aiOrb.getBoundingClientRect();
    const orbX = rect.left + rect.width / 2;
    const orbY = rect.top + rect.height / 2;
    const targetAwareX = clamp((orbState.pointerX - orbX) / 120, -1, 1);
    const targetAwareY = clamp((orbState.pointerY - orbY) / 120, -1, 1);
    awareness.x += (targetAwareX - awareness.x) * 0.025;
    awareness.y += (targetAwareY - awareness.y) * 0.025;

    aiOrb.style.transform = `translate3d(0, ${floatY}px, 0) scale(${breath})`;

    if (aiOrbShell) {
      aiOrbShell.style.transform = `rotate(${shellRotate}deg) scale(${1 + proximity.value * 0.02})`;
      aiOrbShell.style.opacity = `${0.62 + proximity.value * 0.08}`;
    }

    if (aiOrbBody) {
      aiOrbBody.style.transform = `rotate(${bodyRotate}deg) scale(${1 + proximity.value * 0.018})`;
    }

    if (aiOrbEnergy) {
      aiOrbEnergy.style.transform = `translate(${energyDriftX + awareness.x * 2.4}px, ${energyDriftY + awareness.y * 2}px) scale(${1 + proximity.value * 0.04})`;
      aiOrbEnergy.style.opacity = `${0.82 + proximity.value * 0.12}`;
    }

    if (aiOrbPresence) {
      aiOrbPresence.style.transform = `translate(${coreDriftX + awareness.x * 3.6}px, ${coreDriftY + awareness.y * 3}px) scale(${1 + proximity.value * 0.12})`;
      aiOrbPresence.style.opacity = `${0.72 + proximity.value * 0.16}`;
    }

    aiOrbRipples.forEach((ripple, index) => {
      ripple.style.opacity = `${0.02 + proximity.value * (0.025 + index * 0.01)}`;
    });

    requestAnimationFrame(animateOrb);
  }

  animateOrb();
}

function initAnimations() {
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
    { threshold: 0.18 }
  );

  revealSections.forEach((section) => observer.observe(section));
}

initHeroScene();
initOverlay();
initCursor();
initCurator();
initAnimations();
updateHeroScroll();

window.addEventListener("scroll", updateHeroScroll, { passive: true });
window.addEventListener("resize", updateHeroScroll);

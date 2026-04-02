// animation.js — AUSLI hero motion
//
// Keeps the scene subtle: camera parallax only, with no showroom cards
// or character animation competing with the 3D wordmark overlay.

export function createAnimationController({
  THREE,
  heroState,
  dom,
  sceneContext,
  applyHeroUiState
}) {
  const {
    camera,
    renderer,
    scene
  } = sceneContext;

  // ── Mouse state ────────────────────────────────────────────────────────────
  let mouseX = 0;
  let mouseY = 0;

  // ── Camera parallax targets ────────────────────────────────────────────────
  let camTargetX = 0;
  let camTargetY = 0;
  let wordmarkRotateX = 0;
  let wordmarkRotateY = -10;

  // ── Time ──────────────────────────────────────────────────────────────────
  let time = 0;

  // ── Resize ────────────────────────────────────────────────────────────────
  function handleResize() {
    if (!dom.heroScene.clientWidth || !dom.heroScene.clientHeight) return;
    camera.aspect = dom.heroScene.clientWidth / dom.heroScene.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(dom.heroScene.clientWidth, dom.heroScene.clientHeight);
  }

  // ── Pointer ───────────────────────────────────────────────────────────────
  function handlePointerMove(event) {
    mouseX = (event.clientX / window.innerWidth)  * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    // Keep heroState in sync so scroll.js can read pointer if needed
    heroState.pointerX = mouseX;
    heroState.pointerY = mouseY;
    dom.hero?.style.setProperty("--hero-pointer-x", mouseX.toFixed(4));
    dom.hero?.style.setProperty("--hero-pointer-y", (-mouseY).toFixed(4));
  }

  // ── Animate ───────────────────────────────────────────────────────────────
  function animate() {
    time += 0.005;

    // Scroll-driven hero UI — scroll.js owns opacity, text fade, etc.
    applyHeroUiState();
    dom.hero?.style.setProperty("--hero-pointer-x", mouseX.toFixed(4));
    dom.hero?.style.setProperty("--hero-pointer-y", (-mouseY).toFixed(4));

    // ── Wordmark motion — restrained luxury rotation, not a game spin ──────
    const autoYaw = -12 + Math.sin(time * 0.82) * 14;
    const autoPitch = Math.cos(time * 0.5) * 3.2;
    const targetRotateY = autoYaw + mouseX * 8.5;
    const targetRotateX = autoPitch + mouseY * -4.2;

    wordmarkRotateY += (targetRotateY - wordmarkRotateY) * 0.05;
    wordmarkRotateX += (targetRotateX - wordmarkRotateX) * 0.055;

    dom.hero?.style.setProperty("--hero-rotate-y", `${wordmarkRotateY.toFixed(3)}deg`);
    dom.hero?.style.setProperty("--hero-rotate-x", `${wordmarkRotateX.toFixed(3)}deg`);

    // ── Camera parallax — subtle depth sensation ───────────────────────────
    camTargetX += (mouseX * 0.3  - camTargetX) * 0.05;
    camTargetY += (mouseY * 0.15 - camTargetY) * 0.05;
    camera.position.x = camTargetX;
    camera.position.y = camTargetY;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  return {
    handlePointerMove,
    handleResize,
    animate,
  };
}

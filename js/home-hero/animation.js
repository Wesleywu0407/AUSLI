// animation.js — AUSLI dark silk fabric animation
//
// Design intent: a piece of fabric hanging in space, breathing slowly.
// Top edge is almost anchored — bottom edge sways freely like gravity.
// Feeling: sculptural, editorial, museum display.
//
// scroll.js is completely untouched.
// applyHeroUiState() manages all hero text fade / transform behaviour.

export function createAnimationController({
  THREE,
  heroState,
  dom,
  sceneContext,
  // ambientContext / fragmentContext / showcaseContext unused for fabric —
  // accepted so index.js requires zero changes
  applyHeroUiState
}) {
  const { camera, renderer, scene, heroGroup, fabric, flatPositions } = sceneContext;

  const pointer  = { x: 0, y: 0 };
  const parallax = { x: 0, y: 0 };

  // ── Time ─────────────────────────────────────────────────────────────────
  // 0.005 per frame → at 60 fps: 0.3 rad/s → one full sine cycle ≈ 21 seconds.
  // This is the "breathing" cadence — barely perceptible as motion.
  let time = 0;

  // ── Resize ────────────────────────────────────────────────────────────────
  function handleResize() {
    if (!dom.heroScene.clientWidth || !dom.heroScene.clientHeight) {
      return;
    }
    camera.aspect = dom.heroScene.clientWidth / dom.heroScene.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(dom.heroScene.clientWidth, dom.heroScene.clientHeight);
  }

  // ── Pointer ───────────────────────────────────────────────────────────────
  function handlePointerMove(event) {
    const { innerWidth, innerHeight } = window;
    heroState.pointerX = (event.clientX / innerWidth  - 0.5) * 2;
    heroState.pointerY = (event.clientY / innerHeight - 0.5) * 2;
    pointer.x = heroState.pointerX;
    pointer.y = heroState.pointerY;
  }

  // ── Animate ───────────────────────────────────────────────────────────────
  function animate() {
    time += 0.005;

    // Scroll-driven hero UI (text fade, scene opacity) — scroll.js owns this
    applyHeroUiState();

    // ── Parallax tilt — fabric responds to pointer like a heavy draped cloth
    // Very slow lag so it feels weighted, not reactive
    parallax.x += (pointer.x - parallax.x) * 0.014;
    parallax.y += (pointer.y - parallax.y) * 0.014;

    heroGroup.rotation.y =  parallax.x * 0.045;
    heroGroup.rotation.x =  parallax.y * 0.028;

    // ── Vertex displacement ────────────────────────────────────────────────
    //
    // Gravity model: the top edge is almost anchored, the bottom is free.
    //
    // In Three.js PlaneGeometry(3, 4), Y ranges from +2 (top) to -2 (bottom).
    // topFactor: 0 at y = +2 (top = fixed)
    //            1 at y = -2 (bottom = freely moving)
    //
    //   topFactor = clamp((2 − y) / 4, 0, 1)
    //
    // Three wave layers are summed. Each layer is scaled by topFactor so
    // the top barely moves and the bottom sways with full amplitude.

    const livePos = fabric.geometry.attributes.position.array;
    const count   = livePos.length / 3;

    // ── Scan Y extents once so topFactor works for any geometry size ─────────
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < count; i++) {
      const y = flatPositions[i * 3 + 1];
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const yRange = maxY - minY || 1; // guard divide-by-zero

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      const x  = flatPositions[i3];
      const y  = flatPositions[i3 + 1];

      // topFactor: 0 at top edge (anchored, barely moves)
      //            1 at bottom edge (free, full wave amplitude)
      const topFactor = Math.max(0, Math.min(1, (y - maxY) / (minY - maxY)));

      // Wave 1 — broad horizontal undulation, main body drape
      const wave1 = Math.sin(x * 1.5 + time * 0.6) * 0.35 * topFactor;
      // Wave 2 — vertical fold counter-rhythm
      const wave2 = Math.sin(y * 0.8 + time * 0.4) * 0.28 * topFactor;
      // Wave 3 — diagonal micro-crease, breaks visual symmetry
      const wave3 = Math.sin((x + y) * 0.6 + time * 0.5) * 0.20 * topFactor;
      // Wave 4 — fine flutter along bottom hem
      const wave4 = Math.sin(x * 3.2 + time * 0.9) * 0.15 * topFactor;

      livePos[i3 + 2] = wave1 + wave2 + wave3 + wave4;
    }

    // Gentle side-to-side sway of the whole mesh — fabric held at top
    fabric.rotation.z = Math.sin(time * 0.2) * 0.04;

    // Tell Three.js the buffer has changed this frame
    fabric.geometry.attributes.position.needsUpdate = true;
    // Recompute normals so the key light reads the new fold shapes correctly
    fabric.geometry.computeVertexNormals();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  return {
    handlePointerMove,
    handleResize,
    animate
  };
}

export function createScrollController({
  dom,
  heroState,
  clamp,
  easeOutCubic,
  easeInOutCubic,
  easeOutQuint
}) {
  const debugGlb = window.__AUSLI_DEBUG_GLB__ === true;
  const {
    hero,
    heroScene,
    heroContent,
    heroTitle,
    heroTagline,
    heroKicker,
    storyFlow,
    threshold,
    storySections
  } = dom;
  const debugExplosion = window.__AUSLI_DEBUG_EXPLOSION__ === true;
  const debugUpdates = window.__AUSLI_DEBUG_UPDATE_CONNECTIONS__ === true;
  let lastLoggedPhase = "";
  let heroScrollRuns = 0;
  let storyFlowRuns = 0;

  function getPhaseLabel(progress) {
    if (progress < 0.2) return "fracture-start";
    if (progress < 0.4) return "structure-break";
    if (progress < 0.6) return "main-explosion";
    if (progress < 0.8) return "expansion";
    return "settle";
  }

  function updateHeroScroll() {
    if (debugGlb) {
      heroState.targetProgress = 0;
      heroState.targetCharge = 0;
      heroState.targetStress = 0;
      heroState.targetBurst = 0;
      heroState.targetWorld = 0;
      return;
    }

    heroScrollRuns += 1;
    const rect = hero.getBoundingClientRect();
    const maxScroll = Math.max(hero.offsetHeight - window.innerHeight, 1);
    const scrolled = clamp(-rect.top, 0, maxScroll);
    const progress = clamp(scrolled / maxScroll, 0, 1);
    heroState.targetProgress = progress;

    heroState.targetCharge = clamp((progress - 0.15) / 0.55, 0, 1);
    heroState.targetStress = clamp((progress - 0.32) / 0.36, 0, 1);
    heroState.targetBurst = clamp((progress - 0.18) / 0.42, 0, 1);
    heroState.targetWorld = clamp((progress - 0.6) / 0.4, 0, 1);

    if (debugExplosion) {
      const phase = getPhaseLabel(progress);
      if (phase !== lastLoggedPhase) {
        lastLoggedPhase = phase;
        console.log("[AUSLI HERO SCROLL]", {
          progress: Number(progress.toFixed(3)),
          targetCharge: Number(heroState.targetCharge.toFixed(3)),
          targetStress: Number(heroState.targetStress.toFixed(3)),
          targetBurst: Number(heroState.targetBurst.toFixed(3)),
          targetWorld: Number(heroState.targetWorld.toFixed(3)),
          phase
        });
      }
    }

    if (debugUpdates && heroScrollRuns % 10 === 0) {
      console.log("[AUSLI UPDATE] home-hero/scroll.updateHeroScroll", {
        runs: heroScrollRuns,
        progress: Number(progress.toFixed(3)),
        maxScroll: Number(maxScroll.toFixed(3)),
        scrolled: Number(scrolled.toFixed(3)),
        heroTop: Number(rect.top.toFixed(3)),
        heroHeight: Number(hero.offsetHeight.toFixed(3)),
        viewportHeight: Number(window.innerHeight.toFixed(3))
      });
    }
  }

  function applyHeroUiState() {
    if (debugGlb) {
      hero.style.setProperty("--hero-charge", "0");
      if (storyFlow) {
        storyFlow.style.setProperty("--hero-charge", "0");
      }
      heroContent.style.opacity = "1";
      heroContent.style.transform = "translateY(0)";
      heroScene.style.opacity = "1";
      heroScene.style.filter = "none";
      if (heroTitle) {
        heroTitle.style.opacity = "1";
        heroTitle.style.transform = "translateY(0) scale(1)";
      }
      if (heroKicker) {
        heroKicker.style.opacity = "1";
        heroKicker.style.transform = "translateY(0)";
      }
      if (heroTagline) {
        heroTagline.style.opacity = "1";
        heroTagline.style.transform = "translateY(0)";
      }
      if (threshold) {
        threshold.style.opacity = "1";
        threshold.style.transform = "translateY(0)";
      }
      return;
    }

    const progress = heroState.progress;
    const charge = heroState.charge;
    const uiProgress = easeOutCubic(progress);
    const taglineProgress = easeInOutCubic(clamp((progress - 0.12) / 0.88, 0, 1));
    // Let the content emerge after the fragment field has started to settle,
    // so the next chapter feels born from the same space instead of fading on top.
    const thresholdBridge = easeOutQuint(clamp((progress - 0.2) / 0.62, 0, 1));

    hero.style.setProperty("--hero-charge", charge.toFixed(4));
    if (storyFlow) {
      storyFlow.style.setProperty("--hero-charge", charge.toFixed(4));
    }

    if (heroTitle) {
      heroTitle.style.opacity = `${clamp(1 - uiProgress * 1.16, 0, 1)}`;
      heroTitle.style.transform = `translateY(${uiProgress * -34}px) scale(${1 - uiProgress * 0.045})`;
    }

    if (heroKicker) {
      heroKicker.style.opacity = `${clamp(1 - uiProgress * 1.02, 0, 1)}`;
      heroKicker.style.transform = `translateY(${uiProgress * -16}px)`;
    }

    if (heroTagline) {
      heroTagline.style.opacity = `${clamp(1 - taglineProgress * 1.04, 0, 1)}`;
      heroTagline.style.transform = `translateY(${taglineProgress * -22}px)`;
    }

    heroContent.style.opacity = `${1 - uiProgress * 0.26}`;
    heroContent.style.transform = `translateY(${uiProgress * -22}px)`;

    const sceneOpacity = 0.96 - uiProgress * 0.06 - charge * 0.035;
    heroScene.style.opacity = `${sceneOpacity}`;
    heroScene.style.filter = "none";

    if (threshold) {
      threshold.style.opacity = `${0.32 + thresholdBridge * 0.68}`;
      threshold.style.transform = `translateY(${(1 - thresholdBridge) * 76}px)`;
    }
  }

  function updateStoryFlow() {
    if (debugGlb) {
      return;
    }

    storyFlowRuns += 1;
    if (!storyFlow) {
      return;
    }

    const viewport = window.innerHeight;
    const totalScrollable = Math.max(document.documentElement.scrollHeight - viewport, 1);
    const globalProgress = clamp(window.scrollY / totalScrollable, 0, 1);
    const afterHeroStart = Math.max(hero.offsetHeight - viewport * 0.7, 0);
    const descent = clamp((window.scrollY - afterHeroStart) / (viewport * 3.8), 0, 1);

    storyFlow.style.setProperty("--story-progress", globalProgress.toFixed(4));
    storyFlow.style.setProperty("--story-descent", descent.toFixed(4));

    // Each chapter receives a continuous reveal value so sections enter with
    // one shared cinematic rhythm instead of isolated on/off animations.
    storySections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const distanceFromCenter = Math.abs(midpoint - viewport / 2);
      const progress = clamp(1 - distanceFromCenter / (viewport * 0.78), 0, 1);
      const reveal = clamp((viewport * 0.92 - rect.top) / (rect.height + viewport * 0.25), 0, 1);

      section.style.setProperty("--section-progress", progress.toFixed(4));
      section.style.setProperty("--section-reveal", reveal.toFixed(4));
    });

    if (debugUpdates && storyFlowRuns % 10 === 0) {
      console.log("[AUSLI UPDATE] home-hero/scroll.updateStoryFlow", {
        runs: storyFlowRuns,
        globalProgress: Number(globalProgress.toFixed(3)),
        descent: Number(descent.toFixed(3))
      });
    }
  }

  return {
    updateHeroScroll,
    applyHeroUiState,
    updateStoryFlow
  };
}

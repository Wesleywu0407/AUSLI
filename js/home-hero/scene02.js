function mapRange(value, inStart, inEnd) {
  if (inEnd === inStart) {
    return value >= inEnd ? 1 : 0;
  }

  return (value - inStart) / (inEnd - inStart);
}

export function initScene02({
  clamp = (value, min, max) => Math.min(Math.max(value, min), max),
  easeInOutCubic = (value) =>
    value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2,
  easeOutCubic = (value) => 1 - Math.pow(1 - value, 3)
} = {}) {
  const section = document.getElementById("scene-02");

  if (!section) {
    return null;
  }

  const leftPanel = section.querySelector(".scene-02__split-left");
  const rightPanel = section.querySelector(".scene-02__split-right");
  const product = section.querySelector(".scene-02__product");
  const fabricBase = section.querySelector(".scene-02__fabric-base");
  const seam = section.querySelector(".scene-02__seam");

  if (!leftPanel || !rightPanel || !product || !fabricBase || !seam) {
    return null;
  }

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    viewportWidth: window.innerWidth || 0,
    viewportHeight: window.innerHeight || 0
  };

  function getProgress() {
    const rect = section.getBoundingClientRect();
    const maxScroll = Math.max(section.offsetHeight - state.viewportHeight, 1);
    const scrolled = clamp(-rect.top, 0, maxScroll);
    return clamp(scrolled / maxScroll, 0, 1);
  }

  function update() {
    state.viewportWidth = window.innerWidth || state.viewportWidth;
    state.viewportHeight = window.innerHeight || state.viewportHeight;

    const progress = getProgress();
    const reducedMotion = mediaQuery.matches;
    const seamIntro = clamp(mapRange(progress, 0.12, 0.32), 0, 1);
    const seamFade = clamp(mapRange(progress, 0.42, 0.72), 0, 1);
    const opening = clamp(mapRange(progress, 0.34, 0.88), 0, 1);
    const reveal = reducedMotion ? opening : easeInOutCubic(opening);
    const productReveal = easeOutCubic(clamp(mapRange(progress, 0.08, 0.82), 0, 1));
    const splitTravel = reducedMotion ? state.viewportWidth * 0.46 : state.viewportWidth * 0.58;
    const splitOffset = splitTravel * reveal;
    const seamOpacity = reducedMotion
      ? clamp(0.14 + (1 - opening) * 0.42, 0, 0.56)
      : clamp(0.08 + seamIntro * (1 - seamFade) * 0.82, 0, 0.78);

    leftPanel.style.transform = `translate3d(${-splitOffset}px, 0, 0)`;
    rightPanel.style.transform = `translate3d(${splitOffset}px, 0, 0)`;
    leftPanel.style.opacity = `${0.94 - reveal * 0.24}`;
    rightPanel.style.opacity = `${0.94 - reveal * 0.24}`;

    seam.style.opacity = `${seamOpacity}`;
    seam.style.transform = `translateX(-50%) scaleY(${0.2 + seamOpacity * 0.8})`;

    product.style.opacity = `${0.34 + productReveal * 0.66}`;
    product.style.transform = `scale(${1.03 - productReveal * 0.03})`;

    fabricBase.style.opacity = `${0.82 - reveal * 0.72}`;
    fabricBase.style.transform = `scale(${1.01 - reveal * 0.01})`;

    section.style.setProperty("--scene-02-progress", progress.toFixed(4));
  }

  function handleResize() {
    state.viewportWidth = window.innerWidth || 0;
    state.viewportHeight = window.innerHeight || 0;
    update();
  }

  update();

  return {
    update,
    handleResize
  };
}

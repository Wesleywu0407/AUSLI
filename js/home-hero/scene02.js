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
    const seamIntro = clamp(mapRange(progress, 0.18, 0.42), 0, 1);
    const seamFade = clamp(mapRange(progress, 0.52, 0.82), 0, 1);
    const opening = clamp(mapRange(progress, 0.45, 1), 0, 1);
    const reveal = reducedMotion ? opening : easeInOutCubic(opening);
    const productReveal = easeOutCubic(clamp(mapRange(progress, 0.16, 1), 0, 1));
    const splitTravel = reducedMotion ? state.viewportWidth * 0.42 : state.viewportWidth * 0.56;
    const splitOffset = splitTravel * reveal;
    const seamOpacity = reducedMotion
      ? clamp(1 - opening * 1.3, 0, 0.45)
      : clamp(seamIntro * (1 - seamFade), 0, 0.7);

    leftPanel.style.transform = `translate3d(${-splitOffset}px, 0, 0)`;
    rightPanel.style.transform = `translate3d(${splitOffset}px, 0, 0)`;
    leftPanel.style.opacity = `${1 - reveal * 0.22}`;
    rightPanel.style.opacity = `${1 - reveal * 0.22}`;

    seam.style.opacity = `${seamOpacity}`;
    seam.style.transform = `translateX(-50%) scaleY(${0.12 + seamOpacity * 0.88})`;

    product.style.opacity = `${0.22 + productReveal * 0.78}`;
    product.style.transform = `scale(${1.04 - productReveal * 0.04})`;

    fabricBase.style.opacity = `${0.96 - reveal * 0.92}`;
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

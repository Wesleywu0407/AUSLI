export function getHeroDom() {
  return {
    heroScene: document.getElementById("hero-scene"),
    hero: document.getElementById("hero"),
    heroContent: document.getElementById("hero-content"),
    heroTitle: document.getElementById("hero-title"),
    heroTagline: document.querySelector(".hero-tagline"),
    heroKicker: document.querySelector(".hero-kicker"),
    storyFlow: document.getElementById("storyflow"),
    threshold: document.getElementById("scene-02"),
    storySections: [...document.querySelectorAll("[data-story-section]")]
  };
}

export function createHeroState() {
  return {
    progress: 0,
    targetProgress: 0,
    charge: 0,
    targetCharge: 0,
    stress: 0,
    targetStress: 0,
    burst: 0,
    targetBurst: 0,
    world: 0,
    targetWorld: 0,
    pointerX: 0,
    pointerY: 0
  };
}

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
export const damp = (current, target, factor) => current + (target - current) * factor;
export const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
export const easeInOutCubic = (value) =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
export const easeOutQuint = (value) => 1 - Math.pow(1 - value, 5);

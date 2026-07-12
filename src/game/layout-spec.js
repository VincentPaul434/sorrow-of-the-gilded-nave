export const VIEWPORT = Object.freeze({
  width: 1280,
  height: 720,
});

export const ENVIRONMENT_SPEC = Object.freeze({
  worldWidth: 5408,
  worldHeight: 720,
  grid: 32,
  moduleWidth: 64,
  surfaceOriginY: 8,
  backgroundLayers: Object.freeze({
    far: Object.freeze({ depth: -30, scrollFactor: 0.86 }),
    mid: Object.freeze({ depth: -20, scrollFactor: 0.93 }),
    near: Object.freeze({ depth: -10, scrollFactor: 0.98 }),
  }),
  ladder: Object.freeze({
    width: 32,
    height: 64,
    interactionWidth: 20,
    interactionHeight: 80,
    interactionTopPadding: 8,
    climbSpeed: 120,
  }),
});

const HUD_SAFE_MARGIN = 24;
const RESOURCE_WIDTH = 216;

export const HUD_SPEC = Object.freeze({
  safeMargin: HUD_SAFE_MARGIN,
  status: Object.freeze({
    x: 24,
    y: 24,
    width: 320,
    height: 96,
    crest: Object.freeze({ x: 0, y: 8, width: 80, height: 80 }),
    healthRail: Object.freeze({ x: 88, y: 18, width: 216, height: 14 }),
    healthPips: Object.freeze({ x: 91, y: 21, width: 38, height: 8, stride: 42, count: 5 }),
    fervourRail: Object.freeze({ x: 88, y: 42, width: 192, height: 10 }),
    fervourFill: Object.freeze({ x: 90, y: 44, width: 188, height: 6 }),
    itemSlots: Object.freeze({ startX: 88, y: 64, size: 24, stride: 32, count: 3 }),
  }),
  resource: Object.freeze({
    x: VIEWPORT.width - HUD_SAFE_MARGIN - RESOURCE_WIDTH,
    y: 24,
    width: RESOURCE_WIDTH,
    height: 64,
    sigil: Object.freeze({ x: 12, y: 16, width: 32, height: 32 }),
    digitField: Object.freeze({
      right: 192,
      y: 22,
      glyphWidth: 15,
      glyphHeight: 21,
      advance: 18,
      maxDigits: 6,
      max: 999999,
    }),
  }),
});

export function assertGridAligned(value, label, offset = 0) {
  if (!Number.isInteger(value) || !Number.isInteger(offset)) {
    throw new Error(`${label} must use integer pixel coordinates.`);
  }
  if ((value - offset) % ENVIRONMENT_SPEC.grid !== 0) {
    throw new Error(`${label} must align to the ${ENVIRONMENT_SPEC.grid}px grid at offset ${offset}.`);
  }
  return value;
}

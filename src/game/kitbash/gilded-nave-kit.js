export function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

export const GILDED_NAVE_KIT = deepFreeze({
  schemaVersion: 1,
  id: "gilded-nave",
  units: {
    grid: 32,
    interactionGrid: 8,
    surfaceYOrigin: 8,
    moduleWidth: 64,
    topHeight: 32,
    elevatedFaceHeight: 64,
  },
  depths: {
    far: -30,
    mid: -20,
    near: -10,
    void: 0,
    surface: 1,
    underhang: 2,
    decoration: 3,
    interactionArt: 4,
  },
  assets: {
    plateProcessional: { texture: "processional-nave", size: [1280, 941], origin: [0, 0] },
    plateAscent: { texture: "penitent-ascent", size: [1280, 941], origin: [0, 0] },
    plateBridge: { texture: "bridge-of-relics", size: [1280, 941], origin: [0, 0] },
    plateReliquary: { texture: "reliquary-chamber", size: [1280, 941], origin: [0, 0] },
    masonry: { texture: "far-masonry", size: [128, 64], origin: [0, 0] },
    window: { texture: "far-window", size: [128, 256], origin: [0, 0] },
    pillar: { texture: "near-pillar", size: [96, 560], origin: [0, 1] },
    censer: { texture: "decorative-censer", size: [32, 52], origin: [0, 0] },
    chainLink: { texture: "chain-link", size: [8, 8], origin: [0, 0] },
    ladder: { texture: "ladder", size: [32, 64], origin: [0, 0] },
    spikes: { texture: "spike", size: [64, 32], origin: [0.5, 1] },
    checkpoint: { texture: "reliquary", size: [96, 128], origin: [0.5, 1] },
    gate: { texture: "gate", size: [58, 170], origin: [0.5, 0.5] },
    rubble1: { texture: "rubble-cluster-1", size: [64, 32], origin: [0, 1] },
    rubble2: { texture: "rubble-cluster-2", size: [64, 32], origin: [0, 1] },
    rubble3: { texture: "rubble-cluster-3", size: [64, 32], origin: [0, 1] },
    bones: { texture: "ledge-bone-pile", size: [32, 16], origin: [0, 1] },
    candelabrum: { texture: "ledge-candelabrum", size: [32, 48], origin: [0, 1] },
    flame: { texture: "candle-flame-1", size: [6, 10], origin: [0.5, 1], animation: "candle-flame" },
    surfaceFill: { texture: "platform-fill", size: [64, 32], origin: [0, 0] },
  },
  recipes: {
    gildedSurface: {
      moduleWidth: 64,
      topHeight: 32,
      elevatedFaceHeight: 64,
      variants: [
        { top: "platform-top", fill: "platform-fill", underhang: "platform-underhang-1" },
        { top: "platform-top-2", fill: "platform-fill-2", underhang: "platform-underhang-2" },
        { top: "platform-top-3", fill: "platform-fill-3", underhang: "platform-underhang-3" },
      ],
      caps: {
        brokenLeft: { outer: "platform-broken-left", inner: "platform-top-half-right" },
        brokenRight: { inner: "platform-top-half-left", outer: "platform-broken-right" },
      },
      underhangRule: { modulus: 3, excludedRemainder: 1, excludeBroken: true },
      depths: { face: 1, underhang: 2, cap: 3 },
      collision: "toWorldBottom",
    },
    ironLadder: {
      asset: "ladder",
      sensor: { width: 20, height: 80, offsetX: 16, offsetY: -8, origin: [0.5, 0] },
      climbSpeed: 120,
    },
    spikeBed: {
      asset: "spikes",
      moduleWidth: 64,
      sensor: { width: 56, height: 24, offsetX: 4, offsetY: 8 },
      damage: 2,
    },
    reliquaryCheckpoint: {
      asset: "checkpoint",
      sensor: { width: 44, height: 72, offsetX: 0, offsetY: -38 },
    },
    hangingCenser: {
      linkAsset: "chainLink",
      linkStrideY: 8,
      terminalAsset: "censer",
      terminalOffset: [-16, 0],
    },
    candelabrum: {
      rootAsset: "candelabrum",
      flameAsset: "flame",
      flameOffsets: [[16, -48], [6, -40], [26, -40]],
    },
  },
});

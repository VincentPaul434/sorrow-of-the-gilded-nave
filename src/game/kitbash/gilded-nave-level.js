import { ENVIRONMENT_SPEC, VIEWPORT } from "../layout-spec.js";
import { deepFreeze } from "./gilded-nave-kit.js";

const worldWidth = ENVIRONMENT_SPEC.worldWidth;
const worldHeight = ENVIRONMENT_SPEC.worldHeight;

export const GILDED_NAVE_LEVEL = deepFreeze({
  schemaVersion: 1,
  id: "sorrow-of-the-gilded-nave",
  kit: "gilded-nave",
  resources: {
    images: [
      { key: "concept", url: "/assets/gilded-nave-concept.png" },
      { key: "processional-nave", url: "/assets/processional-nave.png" },
      { key: "penitent-ascent", url: "/assets/penitent-ascent.png" },
      { key: "bridge-of-relics", url: "/assets/bridge-of-relics.png" },
      { key: "reliquary-chamber", url: "/assets/reliquary-chamber-runtime.png" },
      { key: "gilded-nave-tileset-source", url: "/assets/gilded-nave-modular-tileset-atlas.png" },
    ],
  },
  world: {
    width: worldWidth,
    height: worldHeight,
    viewport: { width: VIEWPORT.width, height: VIEWPORT.height },
    baseFloorTop: 616,
    killY: 710,
    playerSpawn: { x: 150, y: 616 },
    initialCheckpoint: { x: 150, y: 616 },
    cameraBackground: "#090807",
  },
  background: {
    layers: [
      {
        id: "far",
        depth: ENVIRONMENT_SPEC.backgroundLayers.far.depth,
        scrollFactor: ENVIRONMENT_SPEC.backgroundLayers.far.scrollFactor,
        placements: [
          { id: "far-base", kind: "solid", rect: { x: 0, y: 0, width: worldWidth, height: worldHeight }, color: 0x070706, alpha: 1 },
          { id: "far-masonry", kind: "tile", asset: "masonry", rect: { x: 0, y: 0, width: worldWidth, height: worldHeight }, alpha: 0.82, tint: 0x777067 },
          { id: "far-windows", kind: "repeat", asset: "window", at: { x: 64, y: 88 }, count: 13, step: { x: 448, y: 0 }, alpha: 0.62, alternatingTints: [0x8c785f, 0x6e6258] },
          {
            id: "far-veil",
            kind: "rects",
            rects: [
              { x: 0, y: 0, width: worldWidth, height: 260, color: 0x080706, alpha: 0.30 },
              { x: 0, y: 260, width: worldWidth, height: 150, color: 0x080706, alpha: 0.42 },
              { x: 0, y: 410, width: worldWidth, height: 115, color: 0x080706, alpha: 0.62 },
              { x: 0, y: 525, width: worldWidth, height: 195, color: 0x080706, alpha: 0.82 },
            ],
          },
          {
            id: "light-shafts",
            kind: "triangles",
            blendMode: "ADD",
            triangles: [
              { points: [[990, 0], [1080, 0], [1270, 500]], color: 0xe3d0a0, alpha: 0.045 },
              { points: [[2960, 0], [3060, 0], [3220, 345]], color: 0xf0d89d, alpha: 0.06 },
              { points: [[4310, 0], [4410, 0], [4470, 285]], color: 0xf1d89d, alpha: 0.075 },
            ],
          },
        ],
      },
      {
        id: "mid",
        depth: ENVIRONMENT_SPEC.backgroundLayers.mid.depth,
        scrollFactor: ENVIRONMENT_SPEC.backgroundLayers.mid.scrollFactor,
        placements: [
          { id: "processional-plate", kind: "image", asset: "plateProcessional", at: { x: 0, y: -96 } },
          { id: "ascent-plate", kind: "image", asset: "plateAscent", at: { x: 1280, y: -192 } },
          { id: "bridge-plate", kind: "image", asset: "plateBridge", at: { x: 2560, y: -280 } },
          { id: "reliquary-plate", kind: "image", asset: "plateReliquary", at: { x: 3840, y: -304 } },
          { id: "seam-pillar-1", kind: "image", asset: "pillar", at: { x: 1216, y: 616 } },
          { id: "seam-pillar-2", kind: "image", asset: "pillar", at: { x: 2496, y: 424 } },
          { id: "seam-pillar-3", kind: "image", asset: "pillar", at: { x: 3776, y: 296 } },
          { id: "terminal-pillar", kind: "image", asset: "pillar", at: { x: 5056, y: 360 } },
        ],
      },
      {
        id: "near",
        depth: ENVIRONMENT_SPEC.backgroundLayers.near.depth,
        scrollFactor: ENVIRONMENT_SPEC.backgroundLayers.near.scrollFactor,
        placements: [
          { id: "hanging-censer-1", kind: "recipe", recipe: "hangingCenser", at: { x: 704, y: 0 }, length: 128 },
          { id: "hanging-censer-2", kind: "recipe", recipe: "hangingCenser", at: { x: 1984, y: 0 }, length: 176 },
          { id: "hanging-censer-3", kind: "recipe", recipe: "hangingCenser", at: { x: 3264, y: 0 }, length: 112 },
          { id: "hanging-censer-4", kind: "recipe", recipe: "hangingCenser", at: { x: 4544, y: 0 }, length: 152 },
        ],
      },
    ],
  },
  traversal: {
    surfaces: [
      { id: "processional-floor", recipe: "gildedSurface", start: 0, end: 1600, top: 616, variantSeed: 2, underhangSeed: 0, fillToBottom: true },
      { id: "ascent-step-1", recipe: "gildedSurface", start: 1600, end: 1920, top: 552, variantSeed: 2, underhangSeed: 0 },
      { id: "ascent-step-2", recipe: "gildedSurface", start: 1920, end: 2240, top: 488, variantSeed: 1, underhangSeed: 2 },
      { id: "ascent-step-3", recipe: "gildedSurface", start: 2240, end: 2560, top: 424, variantSeed: 0, underhangSeed: 1 },
      { id: "reliquary-walk", recipe: "gildedSurface", start: 2560, end: 3456, top: 360, variantSeed: 2, underhangSeed: 0, brokenRight: true },
      { id: "upper-bridge", recipe: "gildedSurface", start: 3552, end: 3808, top: 296, variantSeed: 1, underhangSeed: 1, brokenLeft: true, brokenRight: true },
      { id: "lower-bridge", recipe: "gildedSurface", start: 3872, end: 4192, top: 360, variantSeed: 0, underhangSeed: 0, brokenLeft: true },
      { id: "apse-floor", recipe: "gildedSurface", start: 4192, end: worldWidth, top: 360, variantSeed: 1, underhangSeed: 0 },
    ],
    pits: [
      { id: "bridge-gap-a", x: 3456, y: 360, width: 96, height: 360, color: 0x030303, alpha: 0.97, depth: 0 },
      { id: "bridge-gap-b", x: 3808, y: 296, width: 64, height: 424, color: 0x030303, alpha: 0.97, depth: 0 },
    ],
    ladders: [
      { id: "ascent-ladder-a", recipe: "ironLadder", x: 1888, y: 488, upperExit: { x: 1952, y: 488 }, lowerExit: { x: 1872, y: 552 } },
      { id: "ascent-ladder-b", recipe: "ironLadder", x: 2528, y: 360, upperExit: { x: 2592, y: 360 }, lowerExit: { x: 2512, y: 424 } },
    ],
    hazards: [
      { id: "bridge-spikes", recipe: "spikeBed", start: 3808, end: 3872, baseY: 360 },
    ],
    checkpoint: {
      id: "reliquary-checkpoint",
      recipe: "reliquaryCheckpoint",
      x: 3136,
      y: 360,
      respawn: { x: 3136, y: 360 },
      announcement: { x: 3136, y: 256, text: "THE RELIQUARY REMEMBERS" },
      activeTint: 0xffd679,
      floatOffsetY: -6,
    },
    boundaries: [
      { id: "entrance-wall", asset: "surfaceFill", rect: { x: 0, y: 0, width: 64, height: 616 } },
      { id: "terminal-wall", asset: "surfaceFill", rect: { x: 5344, y: 0, width: 64, height: 360 } },
    ],
  },
  dressing: {
    placements: [
      { id: "rubble-1", kind: "image", asset: "rubble1", at: { x: 384, y: 617 } },
      { id: "rubble-2", kind: "image", asset: "rubble2", at: { x: 1664, y: 553 } },
      { id: "rubble-3", kind: "image", asset: "rubble3", at: { x: 2880, y: 361 } },
      { id: "rubble-4", kind: "image", asset: "rubble1", at: { x: 3584, y: 297 } },
      { id: "rubble-5", kind: "image", asset: "rubble2", at: { x: 4736, y: 361 } },
      { id: "bones-1", kind: "image", asset: "bones", at: { x: 864, y: 616 } },
      { id: "bones-2", kind: "image", asset: "bones", at: { x: 2144, y: 488 } },
      { id: "bones-3", kind: "image", asset: "bones", at: { x: 3200, y: 360 } },
      { id: "bones-4", kind: "image", asset: "bones", at: { x: 4416, y: 360 } },
      { id: "candles-1", kind: "recipe", recipe: "candelabrum", at: { x: 1120, y: 616 } },
      { id: "candles-2", kind: "recipe", recipe: "candelabrum", at: { x: 2368, y: 424 } },
      { id: "candles-3", kind: "recipe", recipe: "candelabrum", at: { x: 3680, y: 296 } },
      { id: "candles-4", kind: "recipe", recipe: "candelabrum", at: { x: 5216, y: 360 } },
    ],
  },
  apse: {
    architecture: {
      fills: [
        { x: 3984, y: 48, width: 160, height: 312, color: 0x060504, alpha: 0.96 },
        { x: 4000, y: 32, width: 128, height: 16, color: 0x060504, alpha: 0.96 },
        { x: 4016, y: 16, width: 96, height: 16, color: 0x060504, alpha: 0.96 },
      ],
      strokes: [
        { x: 3984, y: 48, width: 160, height: 312, lineWidth: 6, color: 0x2f251c, alpha: 1 },
        { x: 3996, y: 60, width: 136, height: 288, lineWidth: 2, color: 0x8b6228, alpha: 0.86 },
        { x: 4004, y: 68, width: 120, height: 272, lineWidth: 1, color: 0xc0923f, alpha: 0.5 },
      ],
    },
    light: { x: 4064, y: 190, width: 10, height: 316, color: 0xe0d4b8, alpha: 0.24, pulseAlpha: 0.12, duration: 900 },
    gate: { id: "apse-gate", asset: "gate", x: 4064, openY: 80, closedY: 275, triggerX: 4280, closeDuration: 520, openDuration: 900 },
    encounter: {
      checkpoint: { x: 4260, y: 360 },
      bossSpawn: { x: 5060, y: 360 },
      patrol: { minX: 4500, maxX: 5260 },
      hp: 14,
      firstAttackDelay: 1400,
      cameraScrollX: 4100,
    },
  },
  camera: {
    phaseThree: { enterX: 3264, retreatX: 3168, cameraLeft: 2880, exitX: 4144, panTarget: { x: 4740, y: 360 }, panDuration: 520 },
    reviewViews: {
      start: { playerX: 150, playerY: 616, scrollX: 0, cameraMode: "review" },
      ascent: { playerX: 2304, playerY: 424, scrollX: 1792, cameraMode: "review" },
      bridge: { playerX: 3264, playerY: 360, scrollX: 2880, cameraMode: "review" },
      relic: { playerX: 3136, playerY: 360, scrollX: 2880, cameraMode: "review" },
      apse: { playerX: 4208, playerY: 360, scrollX: 4128, cameraMode: "boss" },
    },
  },
  atmosphere: {
    dust: {
      x: { min: 0, max: worldWidth },
      y: { min: 20, max: 610 },
      lifespan: { min: 5000, max: 9000 },
      speedY: { min: 2, max: 9 },
      speedX: { min: -4, max: 4 },
      scale: { min: 0.4, max: 1.25 },
      alpha: { start: 0.02, end: 0.22 },
      frequency: 115,
      quantity: 1,
      tint: 0xd9c58f,
      depth: -5,
    },
    hazeRects: [
      { x: 0, y: 0, width: 1280, height: 44, color: 0x090807, alpha: 0.08 },
      { x: 0, y: 0, width: 18, height: 720, color: 0x090807, alpha: 0.08 },
      { x: 1262, y: 0, width: 18, height: 720, color: 0x090807, alpha: 0.08 },
    ],
    vignetteRects: [
      { x: 0, y: 0, width: 1280, height: 26, color: 0x000000, alpha: 0.4 },
      { x: 0, y: 26, width: 1280, height: 30, color: 0x000000, alpha: 0.24 },
      { x: 0, y: 687, width: 1280, height: 33, color: 0x000000, alpha: 0.38 },
      { x: 0, y: 658, width: 1280, height: 29, color: 0x000000, alpha: 0.21 },
      { x: 0, y: 0, width: 22, height: 720, color: 0x000000, alpha: 0.29 },
      { x: 1258, y: 0, width: 22, height: 720, color: 0x000000, alpha: 0.29 },
      { x: 22, y: 0, width: 20, height: 720, color: 0x000000, alpha: 0.14 },
      { x: 1238, y: 0, width: 20, height: 720, color: 0x000000, alpha: 0.14 },
    ],
  },
});

export const NAVE_REVIEW_VIEWS = GILDED_NAVE_LEVEL.camera.reviewViews;

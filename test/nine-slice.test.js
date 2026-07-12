import assert from "node:assert/strict";
import test from "node:test";
import { drawNineSlice, drawNineSliceTilemap } from "../src/game/rendering/nine-slice.js";
import { createNineSliceTexture } from "../src/game/rendering/phaser-nine-slice.js";

function createRecordingContext() {
  return {
    calls: [],
    imageSmoothingEnabled: true,
    savedSmoothing: [],
    clearRect() {},
    drawImage(...args) {
      this.calls.push(args);
    },
    save() {
      this.savedSmoothing.push(this.imageSmoothingEnabled);
    },
    restore() {
      this.imageSmoothingEnabled = this.savedSmoothing.pop();
    },
  };
}

test("drawNineSlice renders all nine regions of a 24px sprite", () => {
  const image = { width: 24, height: 24 };
  const ctx = createRecordingContext();

  const count = drawNineSlice(ctx, image, 10, 20, 96, 40, { sourceInsets: 8 });

  assert.equal(count, 9);
  assert.equal(ctx.calls.length, 9);
  assert.deepEqual(ctx.calls[0], [image, 0, 0, 8, 8, 10, 20, 8, 8]);
  assert.deepEqual(ctx.calls[4], [image, 8, 8, 8, 8, 18, 28, 80, 24]);
  assert.deepEqual(ctx.calls[8], [image, 16, 16, 8, 8, 98, 52, 8, 8]);
  assert.equal(ctx.imageSmoothingEnabled, true, "canvas state should be restored");
});

test("drawNineSlice uses integer 8px cuts for a 32px sprite", () => {
  const image = { width: 32, height: 32 };
  const ctx = createRecordingContext();

  drawNineSlice(ctx, image, 0, 0, 128, 64, { sourceInsets: 8 });

  assert.deepEqual(ctx.calls[4], [image, 8, 8, 16, 16, 8, 8, 112, 48]);
});

test("drawNineSlice shrinks borders proportionally for undersized destinations", () => {
  const image = { width: 24, height: 24 };
  const ctx = createRecordingContext();

  const count = drawNineSlice(ctx, image, 0, 0, 10, 6, { sourceInsets: 8 });

  assert.equal(count, 4);
  assert.deepEqual(ctx.calls[0], [image, 0, 0, 8, 8, 0, 0, 5, 3]);
  assert.deepEqual(ctx.calls[1], [image, 16, 0, 8, 8, 5, 0, 5, 3]);
  assert.deepEqual(ctx.calls[2], [image, 0, 16, 8, 8, 0, 3, 5, 3]);
  assert.deepEqual(ctx.calls[3], [image, 16, 16, 8, 8, 5, 3, 5, 3]);
});

test("drawNineSlice supports asymmetric atlas slices", () => {
  const image = { width: 64, height: 64 };
  const ctx = createRecordingContext();

  drawNineSlice(ctx, image, 4, 6, 40, 30, {
    source: { x: 10, y: 12, width: 30, height: 24 },
    sourceInsets: { top: 4, right: 6, bottom: 8, left: 5 },
  });

  assert.deepEqual(ctx.calls[0], [image, 10, 12, 5, 4, 4, 6, 5, 4]);
  assert.deepEqual(ctx.calls[4], [image, 15, 16, 19, 12, 9, 10, 29, 18]);
  assert.deepEqual(ctx.calls[8], [image, 34, 28, 6, 8, 38, 28, 6, 8]);
});

test("drawNineSlice validates image and source dimensions", () => {
  const ctx = createRecordingContext();

  assert.throws(
    () => drawNineSlice(ctx, { width: 0, height: 0 }, 0, 0, 32, 32),
    /not loaded|no dimensions/,
  );
  assert.throws(
    () => drawNineSlice(ctx, { width: 24, height: 24 }, 0, 0, 32, 32, { sourceInsets: 13 }),
    /positive center/,
  );
  assert.throws(
    () => drawNineSlice(ctx, { width: 24, height: 24 }, 0, 0, 32, 32, { sourceInsets: 12 }),
    /positive center/,
  );
  assert.equal(drawNineSlice(ctx, { width: 24, height: 24 }, 0, 0, 0, 32), 0);
});

test("drawNineSliceTilemap merges rectangular solid areas before drawing", () => {
  const image = { width: 24, height: 24 };
  const ctx = createRecordingContext();
  const map = [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [1, 1, 1, 0],
  ];

  const rectangles = drawNineSliceTilemap(ctx, image, map, {
    x: 16,
    y: 32,
    tileWidth: 32,
    tileHeight: 32,
  });

  assert.equal(rectangles, 2);
  assert.equal(ctx.calls.length, 18);
  assert.deepEqual(ctx.calls[4].slice(5), [56, 40, 48, 48]);
  assert.deepEqual(ctx.calls[13].slice(5), [24, 136, 80, 16]);
});

test("createNineSliceTexture bakes and caches a Phaser CanvasTexture", () => {
  const image = { width: 32, height: 32 };
  const ctx = createRecordingContext();
  let refreshed = 0;
  const keys = new Set(["gothic-border"]);
  const scene = {
    textures: {
      exists: (key) => keys.has(key),
      get: () => ({ getSourceImage: () => image }),
      createCanvas: (key) => {
        keys.add(key);
        return { context: ctx, refresh: () => { refreshed += 1; } };
      },
      remove: (key) => keys.delete(key),
    },
  };

  const key = createNineSliceTexture(scene, "gothic-block-160x64", "gothic-border", 160, 64);
  const cachedKey = createNineSliceTexture(scene, "gothic-block-160x64", "gothic-border", 160, 64);

  assert.equal(key, "gothic-block-160x64");
  assert.equal(cachedKey, key);
  assert.equal(ctx.calls.length, 9);
  assert.equal(refreshed, 1);
  assert.throws(
    () => createNineSliceTexture(scene, "gothic-block-160x64", "gothic-border", 192, 64),
    /already exists with a different/,
  );
});

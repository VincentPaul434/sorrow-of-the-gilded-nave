import { drawNineSlice } from "./nine-slice.js";

const cacheSignatures = new WeakMap();

function signatureInsets(value) {
  if (typeof value === "number") return value;
  return {
    top: value.top,
    right: value.right,
    bottom: value.bottom,
    left: value.left,
  };
}

function textureSignature(sourceKey, width, height, options) {
  const sourceInsets = signatureInsets(options.sourceInsets ?? 8);
  return JSON.stringify({
    sourceKey,
    width,
    height,
    source: options.source
      ? {
          x: options.source.x ?? 0,
          y: options.source.y ?? 0,
          width: options.source.width ?? null,
          height: options.source.height ?? null,
        }
      : null,
    sourceInsets,
    destinationInsets: signatureInsets(options.destinationInsets ?? sourceInsets),
    smoothing: options.smoothing ?? false,
    snap: options.snap ?? true,
  });
}

/**
 * Bake a nine-sliced image into a cached Phaser CanvasTexture.
 *
 * The game currently renders through Phaser rather than directly through the
 * browser's 2D context. This adapter keeps the generic renderer usable by
 * pre-rendering a native-size texture that `scene.add.image` can consume.
 *
 * @param {Phaser.Scene} scene
 * @param {string} key Unique cache key, usually including the destination size.
 * @param {string} sourceKey Phaser texture key for the 24x24 or 32x32 border.
 * @param {number} width
 * @param {number} height
 * @param {import("./nine-slice.js").NineSliceOptions} [options]
 * @returns {string} The cached Phaser texture key.
 */
export function createNineSliceTexture(scene, key, sourceKey, width, height, options = {}) {
  if (!scene?.textures) throw new TypeError("scene must provide a Phaser TextureManager.");
  if (typeof key !== "string" || key.length === 0) throw new TypeError("key must be a non-empty string.");
  if (typeof sourceKey !== "string" || sourceKey.length === 0) {
    throw new TypeError("sourceKey must be a non-empty string.");
  }
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError("Phaser nine-slice texture dimensions must be positive integers.");
  }

  const signature = textureSignature(sourceKey, width, height, options);
  let signatures = cacheSignatures.get(scene.textures);
  if (!signatures) {
    signatures = new Map();
    cacheSignatures.set(scene.textures, signatures);
  }

  if (scene.textures.exists(key)) {
    if (signatures.get(key) === signature) return key;
    throw new Error(
      `Texture key \"${key}\" already exists with a different source, size, or nine-slice configuration.`,
    );
  }
  if (!scene.textures.exists(sourceKey)) {
    throw new Error(`Nine-slice source texture \"${sourceKey}\" is not registered.`);
  }

  const image = scene.textures.get(sourceKey).getSourceImage();
  const texture = scene.textures.createCanvas(key, width, height);
  const ctx = texture.context;
  ctx.clearRect(0, 0, width, height);

  try {
    drawNineSlice(ctx, image, 0, 0, width, height, options);
    texture.refresh();
    signatures.set(key, signature);
  } catch (error) {
    scene.textures.remove(key);
    signatures.delete(key);
    throw error;
  }

  return key;
}

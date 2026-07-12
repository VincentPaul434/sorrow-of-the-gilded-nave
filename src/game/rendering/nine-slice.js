/**
 * @typedef {object} SliceInsets
 * @property {number} top
 * @property {number} right
 * @property {number} bottom
 * @property {number} left
 */

/**
 * @typedef {object} NineSliceOptions
 * @property {{ x?: number, y?: number, width?: number, height?: number }} [source]
 *   Optional source rectangle when the border lives in an atlas.
 * @property {number | SliceInsets} [sourceInsets=8]
 *   Cuts measured inward from the source rectangle.
 * @property {number | SliceInsets} [destinationInsets]
 *   Rendered border thickness. Defaults to `sourceInsets`.
 * @property {boolean} [smoothing=false]
 * @property {boolean} [snap=true]
 */

const DEFAULT_INSETS = 8;

function assertContext(ctx) {
  if (
    !ctx
    || typeof ctx.drawImage !== "function"
    || typeof ctx.save !== "function"
    || typeof ctx.restore !== "function"
  ) {
    throw new TypeError("ctx must be a CanvasRenderingContext2D-like object.");
  }
}

function normalizeInsets(value, label) {
  const insets = typeof value === "number"
    ? { top: value, right: value, bottom: value, left: value }
    : value;
  const parts = insets && [insets.top, insets.right, insets.bottom, insets.left];

  if (!parts || !parts.every(Number.isFinite)) {
    throw new TypeError(`${label} must be a finite number or { top, right, bottom, left }.`);
  }
  if (parts.some((part) => part < 0)) {
    throw new RangeError(`${label} cannot contain negative values.`);
  }

  return {
    top: parts[0],
    right: parts[1],
    bottom: parts[2],
    left: parts[3],
  };
}

function getImageSize(image) {
  if (!image) throw new TypeError("image must be a loaded CanvasImageSource.");
  if ("complete" in image && image.complete === false) {
    throw new Error("Nine-slice image has not finished loading.");
  }

  const width = image.naturalWidth || image.videoWidth || image.width;
  const height = image.naturalHeight || image.videoHeight || image.height;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Nine-slice image is not loaded or has no dimensions.");
  }
  return { width, height };
}

function destinationCuts(origin, length, leading, trailing, snap) {
  const totalInsets = leading + trailing;
  const fit = totalInsets > length && totalInsets > 0 ? length / totalInsets : 1;
  const cuts = [
    origin,
    origin + leading * fit,
    origin + length - trailing * fit,
    origin + length,
  ];

  if (snap) {
    for (let index = 0; index < cuts.length; index += 1) {
      cuts[index] = Math.round(cuts[index]);
    }
  }

  // Rounding very small destinations can collapse cuts. Keep every boundary
  // monotonic so no drawImage call receives a negative destination size.
  cuts[1] = Math.max(cuts[0], Math.min(cuts[1], cuts[3]));
  cuts[2] = Math.max(cuts[1], Math.min(cuts[2], cuts[3]));
  return cuts;
}

/**
 * Draw a scalable rectangle from the nine regions of one border image.
 *
 * A 24x24 sprite commonly uses 8px insets (8 | 8 | 8). A 32x32 sprite can
 * also use 8px insets (8 | 16 | 8), which avoids fractional source pixels.
 * When a destination is smaller than its borders, the borders shrink
 * proportionally and the center collapses instead of overlapping.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} image
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {NineSliceOptions} [options]
 * @returns {number} Number of `drawImage` calls made.
 */
export function drawNineSlice(ctx, image, x, y, width, height, options = {}) {
  assertContext(ctx);
  if (![x, y, width, height].every(Number.isFinite)) {
    throw new TypeError("Nine-slice destination values must be finite numbers.");
  }
  if (width <= 0 || height <= 0) return 0;

  const imageSize = getImageSize(image);
  const source = options.source ?? {};
  const sourceX = source.x ?? 0;
  const sourceY = source.y ?? 0;
  const sourceWidth = source.width ?? imageSize.width - sourceX;
  const sourceHeight = source.height ?? imageSize.height - sourceY;

  if (
    ![sourceX, sourceY, sourceWidth, sourceHeight].every(Number.isFinite)
    || sourceX < 0
    || sourceY < 0
    || sourceWidth <= 0
    || sourceHeight <= 0
    || sourceX + sourceWidth > imageSize.width
    || sourceY + sourceHeight > imageSize.height
  ) {
    throw new RangeError("Nine-slice source rectangle must be inside the image.");
  }

  const sourceInsets = normalizeInsets(options.sourceInsets ?? DEFAULT_INSETS, "sourceInsets");
  if (
    sourceInsets.left + sourceInsets.right >= sourceWidth
    || sourceInsets.top + sourceInsets.bottom >= sourceHeight
  ) {
    throw new RangeError("sourceInsets must leave a positive center region.");
  }
  const destinationInsets = normalizeInsets(
    options.destinationInsets ?? sourceInsets,
    "destinationInsets",
  );

  const sourceCutsX = [
    sourceX,
    sourceX + sourceInsets.left,
    sourceX + sourceWidth - sourceInsets.right,
    sourceX + sourceWidth,
  ];
  const sourceCutsY = [
    sourceY,
    sourceY + sourceInsets.top,
    sourceY + sourceHeight - sourceInsets.bottom,
    sourceY + sourceHeight,
  ];
  const destinationCutsX = destinationCuts(
    x,
    width,
    destinationInsets.left,
    destinationInsets.right,
    options.snap ?? true,
  );
  const destinationCutsY = destinationCuts(
    y,
    height,
    destinationInsets.top,
    destinationInsets.bottom,
    options.snap ?? true,
  );

  let drawCount = 0;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = options.smoothing ?? false;
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const sliceSourceWidth = sourceCutsX[column + 1] - sourceCutsX[column];
        const sliceSourceHeight = sourceCutsY[row + 1] - sourceCutsY[row];
        const sliceDestinationWidth = destinationCutsX[column + 1] - destinationCutsX[column];
        const sliceDestinationHeight = destinationCutsY[row + 1] - destinationCutsY[row];

        if (
          sliceSourceWidth <= 0
          || sliceSourceHeight <= 0
          || sliceDestinationWidth <= 0
          || sliceDestinationHeight <= 0
        ) {
          continue;
        }

        ctx.drawImage(
          image,
          sourceCutsX[column],
          sourceCutsY[row],
          sliceSourceWidth,
          sliceSourceHeight,
          destinationCutsX[column],
          destinationCutsY[row],
          sliceDestinationWidth,
          sliceDestinationHeight,
        );
        drawCount += 1;
      }
    }
  } finally {
    ctx.restore();
  }

  return drawCount;
}

/**
 * Render solid areas in a 2D tilemap with one nine-slice per rectangular area.
 * Adjacent cells are merged before drawing, avoiding doubled borders between
 * cells that belong to the same rectangular platform.
 *
 * A connected non-rectangular shape must be decomposed and will have borders
 * where its rectangles meet. Use neighbor-aware autotiles for concave terrain;
 * this helper is seamless only when each connected platform is rectangular.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} image
 * @param {unknown[][]} tilemap
 * @param {object} [options]
 * @param {number} [options.x=0]
 * @param {number} [options.y=0]
 * @param {number} [options.tileWidth=32]
 * @param {number} [options.tileHeight=32]
 * @param {(cell: unknown, row: number, column: number) => boolean} [options.isSolid]
 * @param {NineSliceOptions} [options.nineSlice]
 * @returns {number} Number of merged rectangles rendered.
 *
 * @example
 * const map = [
 *   [0, 0, 0, 0, 0, 0],
 *   [0, 1, 1, 1, 1, 0],
 *   [0, 1, 1, 1, 1, 0],
 *   [0, 0, 0, 0, 0, 0],
 *   [1, 1, 1, 0, 1, 1],
 * ];
 * drawNineSliceTilemap(ctx, gothicBorder, map, {
 *   x: 64,
 *   y: 96,
 *   tileWidth: 32,
 *   tileHeight: 32,
 *   nineSlice: { sourceInsets: 8 },
 * });
 */
export function drawNineSliceTilemap(ctx, image, tilemap, options = {}) {
  if (!Array.isArray(tilemap) || !tilemap.every(Array.isArray)) {
    throw new TypeError("tilemap must be a two-dimensional array.");
  }

  const originX = options.x ?? 0;
  const originY = options.y ?? 0;
  const tileWidth = options.tileWidth ?? 32;
  const tileHeight = options.tileHeight ?? 32;
  if (![originX, originY, tileWidth, tileHeight].every(Number.isFinite)) {
    throw new TypeError("Tilemap origin and tile dimensions must be finite numbers.");
  }
  if (tileWidth <= 0 || tileHeight <= 0) {
    throw new RangeError("Tilemap tile dimensions must be greater than zero.");
  }

  const isSolid = options.isSolid ?? ((cell) => cell !== 0 && cell != null && cell !== false);
  if (typeof isSolid !== "function") throw new TypeError("isSolid must be a function.");

  const visited = tilemap.map((row) => row.map(() => false));
  let rectangleCount = 0;

  for (let row = 0; row < tilemap.length; row += 1) {
    for (let column = 0; column < tilemap[row].length; column += 1) {
      if (visited[row][column] || !isSolid(tilemap[row][column], row, column)) continue;

      let widthInTiles = 0;
      while (
        column + widthInTiles < tilemap[row].length
        && !visited[row][column + widthInTiles]
        && isSolid(tilemap[row][column + widthInTiles], row, column + widthInTiles)
      ) {
        widthInTiles += 1;
      }

      let heightInTiles = 1;
      while (row + heightInTiles < tilemap.length) {
        const nextRow = tilemap[row + heightInTiles];
        let canExtend = true;
        for (let offset = 0; offset < widthInTiles; offset += 1) {
          const nextColumn = column + offset;
          if (
            nextColumn >= nextRow.length
            || visited[row + heightInTiles][nextColumn]
            || !isSolid(nextRow[nextColumn], row + heightInTiles, nextColumn)
          ) {
            canExtend = false;
            break;
          }
        }
        if (!canExtend) break;
        heightInTiles += 1;
      }

      for (let rectangleRow = row; rectangleRow < row + heightInTiles; rectangleRow += 1) {
        for (
          let rectangleColumn = column;
          rectangleColumn < column + widthInTiles;
          rectangleColumn += 1
        ) {
          visited[rectangleRow][rectangleColumn] = true;
        }
      }

      drawNineSlice(
        ctx,
        image,
        originX + column * tileWidth,
        originY + row * tileHeight,
        widthInTiles * tileWidth,
        heightInTiles * tileHeight,
        options.nineSlice,
      );
      rectangleCount += 1;
    }
  }

  return rectangleCount;
}

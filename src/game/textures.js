const PALETTE = {
  ink: "#070706",
  void: "#0e0d0c",
  soot: "#171615",
  stone0: "#242321",
  stone1: "#3a3835",
  stone2: "#54504a",
  ash: "#77736b",
  silver: "#a7a398",
  bone: "#c4bca8",
  light: "#e0d4b8",
  gold0: "#503414",
  gold1: "#8b6228",
  gold2: "#c0923f",
  blood0: "#420d0e",
  blood1: "#711719",
  blood2: "#9b2b22",
  rust: "#6e3d27",
  wax: "#d3c49e",
};

function canvasTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, width, height);
  const ctx = texture.context;
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  texture.refresh();
}

function atlasCanvasTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return;
  const atlas = scene.textures.get("gilded-nave-tileset-source").getSourceImage();
  if (!atlas) throw new Error("gilded-nave-tileset-source must be preloaded before texture registration.");
  const texture = scene.textures.createCanvas(key, width, height);
  const ctx = texture.context;
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;
  draw(ctx, atlas);
  const imageData = ctx.getImageData(0, 0, width, height);
  for (let index = 3; index < imageData.data.length; index += 4) {
    imageData.data[index] = imageData.data[index] >= 128 ? 255 : 0;
  }
  ctx.putImageData(imageData, 0, 0);
  texture.refresh();
}

function atlasFrameTexture(scene, key, targetWidth, targetHeight, source) {
  atlasCanvasTexture(scene, key, targetWidth, targetHeight, (ctx, atlas) => {
    ctx.drawImage(
      atlas,
      source.x,
      source.y,
      source.width,
      source.height,
      0,
      0,
      targetWidth,
      targetHeight,
    );
  });
}

function gildedNaveAtlasTextures(scene) {
  const frames = {
    reliquary: { x: 502, y: 18, width: 249, height: 352 },
    platform1: { x: 177, y: 418, width: 285, height: 89 },
    platform2: { x: 491, y: 418, width: 271, height: 89 },
    platform3: { x: 790, y: 418, width: 286, height: 89 },
    capLeft: { x: 52, y: 418, width: 93, height: 89 },
    capRight: { x: 1109, y: 418, width: 93, height: 89 },
    support1: { x: 306, y: 600, width: 212, height: 106 },
    support2: { x: 728, y: 600, width: 212, height: 106 },
    wall1: { x: 88, y: 805, width: 238, height: 227 },
    wall2: { x: 361, y: 805, width: 242, height: 226 },
    wall3: { x: 632, y: 805, width: 248, height: 226 },
    wall4: { x: 912, y: 805, width: 239, height: 226 },
    spikeTrap: { x: 470, y: 1064, width: 312, height: 156 },
  };

  atlasCanvasTexture(scene, "reliquary", 96, 128, (ctx, atlas) => {
    ctx.drawImage(atlas, frames.reliquary.x, frames.reliquary.y, frames.reliquary.width, frames.reliquary.height, 3, 0, 90, 128);
  });

  const platformCells = (key, frame, firstCell) => {
    const cellWidths = [Math.floor(frame.width / 3), Math.floor(frame.width / 3), frame.width - Math.floor(frame.width / 3) * 2];
    const cellStarts = [frame.x, frame.x + cellWidths[0], frame.x + cellWidths[0] + cellWidths[1]];
    atlasCanvasTexture(scene, key, 64, 32, (ctx, atlas) => {
      for (let outputCell = 0; outputCell < 2; outputCell += 1) {
        const sourceCell = (firstCell + outputCell) % 3;
        ctx.drawImage(
          atlas,
          cellStarts[sourceCell],
          frame.y,
          cellWidths[sourceCell],
          frame.height,
          outputCell * 32,
          0,
          32,
          32,
        );
      }
    });
  };

  platformCells("platform-top", frames.platform1, 0);
  platformCells("platform-top-2", frames.platform2, 1);
  platformCells("platform-top-3", frames.platform3, 2);
  atlasFrameTexture(scene, "platform-top-half-left", 32, 32, { x: frames.platform1.x, y: frames.platform1.y, width: 95, height: 89 });
  atlasFrameTexture(scene, "platform-top-half-right", 32, 32, { x: frames.platform1.x + 95, y: frames.platform1.y, width: 95, height: 89 });
  atlasFrameTexture(scene, "platform-broken-left", 32, 32, frames.capLeft);
  atlasFrameTexture(scene, "platform-broken-right", 32, 32, frames.capRight);
  atlasFrameTexture(scene, "platform-fill", 64, 32, frames.support1);
  atlasFrameTexture(scene, "platform-fill-2", 64, 32, frames.support2);
  atlasFrameTexture(scene, "platform-fill-3", 64, 32, { x: 369, y: 858, width: 226, height: 113 });
  atlasFrameTexture(scene, "platform-underhang-1", 64, 16, { x: 177, y: 482, width: 285, height: 24 });
  atlasFrameTexture(scene, "platform-underhang-2", 64, 16, { x: 491, y: 482, width: 271, height: 24 });
  atlasFrameTexture(scene, "platform-underhang-3", 64, 16, { x: 790, y: 482, width: 286, height: 24 });
  atlasFrameTexture(scene, "far-masonry", 128, 64, { x: 369, y: 858, width: 226, height: 113 });
  atlasFrameTexture(scene, "spike", 64, 32, frames.spikeTrap);

  atlasCanvasTexture(scene, "far-window", 128, 256, (ctx, atlas) => {
    ctx.drawImage(atlas, frames.wall1.x, frames.wall1.y, frames.wall1.width, frames.wall1.height, 0, 0, 128, 128);
    ctx.drawImage(atlas, frames.wall4.x, frames.wall4.y, frames.wall4.width, frames.wall4.height, 0, 128, 128, 128);
  });

  atlasCanvasTexture(scene, "near-pillar", 96, 560, (ctx, atlas) => {
    for (let y = 0; y < 560; y += 96) {
      const frame = (y / 96) % 2 === 0 ? frames.wall2 : frames.wall3;
      ctx.drawImage(atlas, frame.x, frame.y, frame.width, frame.height, 0, y, 96, 96);
    }
  });
}

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function pixels(ctx, color, points) {
  ctx.fillStyle = color;
  points.forEach(([x, y, w = 1, h = 1]) => ctx.fillRect(x, y, w, h));
}

function scatter(ctx, colors, x, y, width, height, count, seed = 1) {
  let value = seed >>> 0;
  for (let i = 0; i < count; i += 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const px = x + (value % width);
    value = (value * 1664525 + 1013904223) >>> 0;
    const py = y + (value % height);
    rect(ctx, colors[i % colors.length], px, py, i % 5 === 0 ? 2 : 1, 1);
  }
}

function playerFrame(scene, key, pose, phase = 0) {
  canvasTexture(scene, key, 64, 84, (ctx) => {
    const bob = pose === "run" && phase ? 1 : 0;
    const air = pose === "air" ? 2 : 0;

    // Severe stepped helmet with a needle-like devotional crest.
    rect(ctx, PALETTE.ink, 27, 0 + bob, 4, 3);
    rect(ctx, PALETTE.gold2, 28, 0 + bob, 2, 2);
    rect(ctx, PALETTE.ink, 25, 3 + bob, 8, 5);
    rect(ctx, PALETTE.gold0, 27, 3 + bob, 4, 4);
    rect(ctx, PALETTE.ink, 23, 8 + bob, 12, 6);
    rect(ctx, PALETTE.stone1, 25, 7 + bob, 7, 6);
    rect(ctx, PALETTE.ink, 21, 14 + bob, 16, 8);
    rect(ctx, PALETTE.stone2, 23, 12 + bob, 10, 10);
    rect(ctx, PALETTE.silver, 25, 12 + bob, 3, 8);
    rect(ctx, PALETTE.ink, 19, 22 + bob, 20, 13);
    rect(ctx, PALETTE.stone1, 21, 20 + bob, 15, 13);
    rect(ctx, PALETTE.ash, 23, 21 + bob, 10, 3);
    rect(ctx, PALETTE.ink, 20, 27 + bob, 17, 4);
    rect(ctx, PALETTE.bone, 23, 28 + bob, 11, 2);
    rect(ctx, PALETTE.gold1, 19, 33 + bob, 20, 4);
    pixels(ctx, PALETTE.gold2, [[18, 18 + bob], [38, 20 + bob], [17, 27 + bob], [39, 29 + bob], [22, 10 + bob], [34, 13 + bob]]);

    // Layered cuirass, chain, and oxidized gold trim.
    rect(ctx, PALETTE.ink, 15, 37 + bob, 29, 9);
    rect(ctx, PALETTE.stone1, 18, 36 + bob, 23, 18);
    rect(ctx, PALETTE.stone2, 21, 38 + bob, 17, 13);
    rect(ctx, PALETTE.silver, 23, 38 + bob, 3, 11);
    rect(ctx, PALETTE.gold0, 17, 43 + bob, 25, 4);
    rect(ctx, PALETTE.gold2, 21, 44 + bob, 16, 2);
    pixels(ctx, PALETTE.ash, [[18, 38 + bob], [39, 39 + bob], [20, 51 + bob], [34, 50 + bob], [27, 40 + bob]]);

    // Arms and gauntlets.
    rect(ctx, PALETTE.ink, 11, 39 + bob, 8, 20);
    rect(ctx, PALETTE.stone2, 13, 41 + bob, 5, 15);
    rect(ctx, PALETTE.gold1, 12, 47 + bob, 7, 3);
    rect(ctx, PALETTE.bone, 12, 56 + bob, 6, 4);
    rect(ctx, PALETTE.ink, 40, 39 + bob, 8, 22);
    rect(ctx, PALETTE.stone1, 41, 41 + bob, 5, 16);
    rect(ctx, PALETTE.gold1, 40, 49 + bob, 7, 3);

    // Ragged, blood-dark penitential cloth over the legs.
    rect(ctx, PALETTE.ink, 14, 53 + bob, 31, 22);
    rect(ctx, PALETTE.blood0, 16, 52 + bob, 27, 22);
    rect(ctx, PALETTE.blood1, 19, 54 + bob, 20, 18);
    rect(ctx, PALETTE.blood2, 21, 54 + bob, 4, 13);
    rect(ctx, PALETTE.gold0, 17, 52 + bob, 25, 3);
    pixels(ctx, PALETTE.ink, [[16, 70 + bob, 5, 7], [25, 72 + bob, 5, 5], [35, 69 + bob, 7, 8]]);
    rect(ctx, PALETTE.stone0, 19, 70 + air, 8, 10 - air);
    rect(ctx, PALETTE.rust, 21, 72 + air, 5, 8 - air);
    rect(ctx, PALETTE.stone0, 33, 70 - air, 8, 10 + air);
    rect(ctx, PALETTE.rust, 34, 72 - air, 5, 8 + air);
    rect(ctx, PALETTE.ink, pose === "run" && phase ? 13 : 17, 79, 13, 4);
    rect(ctx, PALETTE.ink, pose === "run" && phase ? 35 : 32, 79, 13, 4);
    pixels(ctx, PALETTE.silver, [[22, 73], [36, 73], [19, 80], [35, 80]]);

    if (pose === "attack") {
      rect(ctx, PALETTE.bone, 43, 42, 8, 5);
      rect(ctx, PALETTE.gold2, 49, 40, 4, 10);
      rect(ctx, PALETTE.ink, 52, 42, 12, 5);
      rect(ctx, PALETTE.silver, 52, 43, 12, 2);
      rect(ctx, PALETTE.light, 56, 42, 8, 1);
    } else if (pose === "parry") {
      rect(ctx, PALETTE.gold2, 47, 24, 3, 42);
      rect(ctx, PALETTE.ink, 50, 23, 5, 44);
      rect(ctx, PALETTE.silver, 50, 24, 2, 42);
      rect(ctx, PALETTE.light, 51, 25, 1, 30);
    } else {
      rect(ctx, PALETTE.ink, 46, 46 + bob, 6, 32);
      rect(ctx, PALETTE.gold1, 43, 50 + bob, 12, 4);
      rect(ctx, PALETTE.silver, 48, 52 + bob, 3, 25);
      rect(ctx, PALETTE.light, 49, 54 + bob, 1, 16);
    }
    scatter(ctx, [PALETTE.ink, PALETTE.ash, PALETTE.gold0], 15, 37 + bob, 30, 38, 18, 7 + phase);
  });
}

function mournerFrame(scene, key, phase) {
  canvasTexture(scene, key, 56, 70, (ctx) => {
    const bob = phase ? 1 : 0;
    rect(ctx, PALETTE.ink, 14, 3 + bob, 28, 18);
    rect(ctx, PALETTE.stone0, 17, 5 + bob, 22, 14);
    rect(ctx, PALETTE.wax, 19, 8 + bob, 17, 15);
    rect(ctx, PALETTE.bone, 21, 8 + bob, 5, 10);
    rect(ctx, PALETTE.ink, 22, 13 + bob, 4, 4);
    rect(ctx, PALETTE.ink, 31, 13 + bob, 3, 3);
    rect(ctx, PALETTE.blood2, 34, 13 + bob, 2, 15);
    rect(ctx, PALETTE.ink, 10, 23 + bob, 36, 34);
    rect(ctx, PALETTE.stone0, 13, 24 + bob, 30, 31);
    rect(ctx, PALETTE.stone1, 17, 26 + bob, 22, 27);
    rect(ctx, PALETTE.ash, 19, 27 + bob, 4, 20);
    rect(ctx, PALETTE.gold0, 12, 33 + bob, 32, 4);
    rect(ctx, PALETTE.blood0, 8, 52 + bob, 40, 12);
    rect(ctx, PALETTE.blood1, 14, 54 + bob, 29, 8);
    rect(ctx, PALETTE.ink, 5, 63, 46, 6);
    pixels(ctx, PALETTE.gold1, [[12, 25], [43, 27], [9, 46], [46, 48], [18, 57], [37, 56]]);
    rect(ctx, PALETTE.ink, phase ? 0 : 41, 34, 15, 8);
    rect(ctx, PALETTE.rust, phase ? 2 : 43, 35, 12, 4);
    rect(ctx, PALETTE.gold2, phase ? 3 : 44, 31, 5, 12);
    scatter(ctx, [PALETTE.ink, PALETTE.stone2, PALETTE.gold0], 10, 23, 36, 40, 16, 21 + phase);
  });
}

function censerFrame(scene, key, phase) {
  canvasTexture(scene, key, 52, 60, (ctx) => {
    const swing = phase ? 3 : -3;
    rect(ctx, PALETTE.ink, 24 + swing, 0, 4, 26);
    rect(ctx, PALETTE.gold1, 25 + swing, 0, 2, 26);
    pixels(ctx, PALETTE.gold2, [[23 + swing, 5, 2, 2], [27 + swing, 11, 2, 2], [23 + swing, 18, 2, 2]]);
    rect(ctx, PALETTE.gold0, 17 + swing, 22, 18, 5);
    rect(ctx, PALETTE.gold2, 20 + swing, 23, 12, 2);
    rect(ctx, PALETTE.ink, 12 + swing, 27, 28, 20);
    rect(ctx, PALETTE.rust, 14 + swing, 28, 24, 17);
    rect(ctx, PALETTE.gold1, 17 + swing, 29, 18, 5);
    rect(ctx, PALETTE.ink, 18 + swing, 36, 16, 4);
    pixels(ctx, PALETTE.gold2, [[15 + swing, 35], [37 + swing, 35], [19 + swing, 43, 14, 2]]);
    rect(ctx, PALETTE.gold0, 22 + swing, 46, 9, 6);
    rect(ctx, "#5f5a53", 10 + swing, 51, 32, 3);
    rect(ctx, "#34312e", 6 + swing, 56, 40, 2);
    rect(ctx, "#201f1d", 14 + swing, 59, 29, 1);
  });
}

function decorativeCenser(scene) {
  canvasTexture(scene, "decorative-censer", 32, 52, (ctx) => {
    // A small, sealed votive vessel: static, symmetrical, and deliberately
    // duller than the wide, swinging hostile censer silhouette.
    rect(ctx, PALETTE.ink, 14, 0, 4, 23);
    rect(ctx, PALETTE.stone1, 15, 0, 2, 22);
    pixels(ctx, PALETTE.rust, [[12, 6, 3, 2], [17, 12, 3, 2], [12, 18, 3, 2]]);
    rect(ctx, PALETTE.ink, 10, 21, 12, 4);
    rect(ctx, PALETTE.stone2, 12, 22, 8, 2);
    rect(ctx, PALETTE.ink, 7, 25, 18, 12);
    rect(ctx, PALETTE.stone0, 9, 26, 14, 10);
    rect(ctx, PALETTE.stone1, 11, 27, 10, 7);
    rect(ctx, PALETTE.gold0, 13, 29, 6, 3);
    pixels(ctx, PALETTE.rust, [[8, 28, 2, 2], [22, 28, 2, 2], [10, 35, 3, 2], [19, 35, 3, 2]]);
    rect(ctx, PALETTE.ink, 10, 37, 12, 5);
    rect(ctx, PALETTE.stone0, 12, 38, 8, 3);
    rect(ctx, PALETTE.ink, 14, 42, 4, 7);
    rect(ctx, PALETTE.rust, 15, 43, 2, 5);
    rect(ctx, PALETTE.ink, 12, 49, 8, 3);
  });
}

function chainLink(scene) {
  canvasTexture(scene, "chain-link", 8, 8, (ctx) => {
    rect(ctx, PALETTE.ink, 2, 0, 4, 2);
    rect(ctx, PALETTE.ink, 1, 2, 2, 4);
    rect(ctx, PALETTE.ink, 5, 2, 2, 4);
    rect(ctx, PALETTE.ink, 2, 6, 4, 2);
    rect(ctx, PALETTE.gold0, 3, 1, 2, 1);
    rect(ctx, PALETTE.rust, 5, 3, 1, 2);
    rect(ctx, PALETTE.stone1, 3, 6, 2, 1);
  });
}

function bishopFrame(scene, key, phase) {
  canvasTexture(scene, key, 108, 132, (ctx) => {
    const bob = phase ? 2 : 0;
    rect(ctx, PALETTE.ink, 39, 0 + bob, 30, 8);
    rect(ctx, PALETTE.gold0, 43, 1 + bob, 22, 5);
    rect(ctx, PALETTE.ink, 36, 7 + bob, 36, 23);
    rect(ctx, PALETTE.bone, 41, 5 + bob, 26, 23);
    rect(ctx, PALETTE.light, 45, 6 + bob, 7, 16);
    pixels(ctx, PALETTE.gold2, [[40, 2 + bob], [68, 4 + bob], [37, 13 + bob], [71, 17 + bob]]);
    rect(ctx, PALETTE.ink, 35, 27 + bob, 38, 13);
    rect(ctx, PALETTE.wax, 40, 29 + bob, 28, 22);
    rect(ctx, PALETTE.ink, 44, 35 + bob, 5, 5);
    rect(ctx, PALETTE.ink, 61, 35 + bob, 4, 5);
    rect(ctx, PALETTE.blood2, 65, 35 + bob, 3, 21);
    rect(ctx, PALETTE.gold1, 28, 49 + bob, 51, 9);
    rect(ctx, PALETTE.gold2, 34, 50 + bob, 39, 3);
    rect(ctx, PALETTE.ink, 18, 57 + bob, 72, 60);
    rect(ctx, PALETTE.blood0, 22, 56 + bob, 64, 59);
    rect(ctx, PALETTE.blood1, 29, 61 + bob, 50, 50);
    rect(ctx, PALETTE.gold0, 35, 60 + bob, 9, 48);
    rect(ctx, PALETTE.gold2, 65, 61 + bob, 6, 47);
    rect(ctx, PALETTE.stone0, 8, 105, 92, 14);
    rect(ctx, PALETTE.blood0, 4, 117, 100, 10);
    rect(ctx, PALETTE.ink, 1, 126, 106, 5);
    rect(ctx, PALETTE.gold2, 86, 39 + bob, 4, 72);
    rect(ctx, PALETTE.ink, 82, 36 + bob, 13, 7);
    rect(ctx, PALETTE.gold1, 82, 38 + bob, 13, 4);
    rect(ctx, PALETTE.gold2, 87, 30 + bob, 3, 9);
    rect(ctx, PALETTE.bone, 88, 86 + bob, 16, 6);
    scatter(ctx, [PALETTE.ink, PALETTE.blood2, PALETTE.gold0], 18, 55, 72, 66, 42, 33 + phase);
  });
}

function environmentTextures(scene) {
  canvasTexture(scene, "stone", 64, 32, (ctx) => {
    rect(ctx, PALETTE.ink, 0, 0, 64, 32);
    rect(ctx, PALETTE.stone1, 0, 2, 64, 30);
    rect(ctx, PALETTE.ash, 0, 0, 64, 3);
    rect(ctx, PALETTE.bone, 3, 1, 22, 1);
    rect(ctx, PALETTE.stone2, 2, 5, 27, 9);
    rect(ctx, PALETTE.stone0, 31, 5, 31, 9);
    rect(ctx, PALETTE.soot, 0, 14, 64, 3);
    rect(ctx, PALETTE.stone0, 2, 17, 18, 13);
    rect(ctx, PALETTE.stone2, 22, 17, 26, 13);
    rect(ctx, PALETTE.stone0, 50, 17, 13, 13);
    rect(ctx, PALETTE.ink, 18, 22, 3, 10);
    rect(ctx, PALETTE.ink, 47, 17, 3, 15);
    pixels(ctx, PALETTE.ash, [[5, 7, 8], [34, 7, 12], [25, 19, 9], [53, 20, 6], [4, 27, 5]]);
    pixels(ctx, PALETTE.rust, [[43, 5, 3, 6], [11, 19, 2, 4], [56, 25, 3, 2]]);
    scatter(ctx, [PALETTE.ink, PALETTE.stone2, PALETTE.ash], 0, 3, 64, 28, 34, 14);
  });

  canvasTexture(scene, "spike", 32, 46, (ctx) => {
    rect(ctx, PALETTE.ink, 0, 39, 32, 7);
    rect(ctx, PALETTE.rust, 0, 40, 32, 4);
    for (let x = 1; x < 32; x += 8) {
      rect(ctx, PALETTE.ink, x, 21, 7, 20);
      rect(ctx, PALETTE.rust, x + 1, 23, 5, 17);
      rect(ctx, PALETTE.stone2, x + 2, 11, 3, 14);
      rect(ctx, PALETTE.silver, x + 3, 4, 1, 12);
      rect(ctx, PALETTE.light, x + 3, 2, 1, 4);
    }
  });

  canvasTexture(scene, "iron-fence", 64, 58, (ctx) => {
    rect(ctx, PALETTE.ink, 0, 50, 64, 8);
    rect(ctx, PALETTE.rust, 0, 52, 64, 3);
    for (let x = 3; x < 64; x += 12) {
      rect(ctx, PALETTE.ink, x, 8, 5, 45);
      rect(ctx, PALETTE.rust, x + 1, 13, 2, 38);
      rect(ctx, PALETTE.gold0, x + 3, 18, 1, 23);
      rect(ctx, PALETTE.ink, x + 1, 1, 3, 11);
      rect(ctx, PALETTE.gold1, x + 2, 0, 1, 8);
    }
    rect(ctx, PALETTE.ink, 0, 32, 64, 5);
    rect(ctx, PALETTE.rust, 0, 33, 64, 2);
  });

  canvasTexture(scene, "background-railing", 64, 48, (ctx) => {
    // Blunt stepped caps and low-value metal keep this readable as scenery,
    // never as the pointed silhouette of the gameplay spike texture.
    rect(ctx, PALETTE.ink, 0, 40, 64, 8);
    rect(ctx, PALETTE.stone0, 0, 42, 64, 3);
    for (let x = 3; x < 64; x += 12) {
      rect(ctx, PALETTE.ink, x, 10, 7, 34);
      rect(ctx, PALETTE.stone0, x + 2, 13, 3, 28);
      rect(ctx, PALETTE.rust, x + 4, 16, 1, 21);
      rect(ctx, PALETTE.ink, x - 2, 8, 11, 5);
      rect(ctx, PALETTE.stone1, x, 9, 7, 2);
      rect(ctx, PALETTE.ink, x, 5, 7, 4);
      rect(ctx, PALETTE.stone0, x + 1, 6, 5, 2);
    }
    rect(ctx, PALETTE.ink, 0, 24, 64, 6);
    rect(ctx, PALETTE.stone0, 0, 26, 64, 2);
  });

  canvasTexture(scene, "wax-edge", 64, 24, (ctx) => {
    rect(ctx, PALETTE.blood0, 0, 0, 64, 6);
    rect(ctx, PALETTE.blood1, 0, 2, 64, 4);
    rect(ctx, PALETTE.blood2, 5, 3, 12, 3);
    rect(ctx, PALETTE.blood0, 8, 6, 5, 13);
    rect(ctx, PALETTE.blood1, 10, 6, 2, 8);
    rect(ctx, PALETTE.blood0, 27, 5, 7, 19);
    rect(ctx, PALETTE.blood1, 29, 5, 3, 13);
    rect(ctx, PALETTE.blood0, 49, 5, 5, 11);
    rect(ctx, PALETTE.blood2, 50, 5, 2, 7);
  });

  canvasTexture(scene, "weeping-statue", 92, 138, (ctx) => {
    rect(ctx, PALETTE.ink, 34, 3, 28, 12);
    rect(ctx, PALETTE.stone1, 36, 2, 24, 27);
    rect(ctx, PALETTE.ash, 39, 4, 10, 19);
    rect(ctx, PALETTE.bone, 42, 5, 5, 13);
    rect(ctx, PALETTE.ink, 40, 13, 4, 4);
    rect(ctx, PALETTE.blood1, 56, 13, 2, 22);
    rect(ctx, PALETTE.ink, 24, 28, 48, 75);
    rect(ctx, PALETTE.stone1, 28, 27, 41, 73);
    rect(ctx, PALETTE.stone2, 32, 31, 31, 66);
    rect(ctx, PALETTE.ash, 36, 33, 8, 52);
    rect(ctx, PALETTE.ink, 10, 48, 24, 13);
    rect(ctx, PALETTE.stone2, 12, 49, 21, 9);
    rect(ctx, PALETTE.ink, 63, 42, 23, 14);
    rect(ctx, PALETTE.stone1, 64, 44, 19, 9);
    rect(ctx, PALETTE.stone0, 18, 97, 61, 21);
    rect(ctx, PALETTE.ink, 10, 117, 77, 8);
    rect(ctx, PALETTE.stone1, 4, 125, 84, 12);
    pixels(ctx, PALETTE.bone, [[38, 37, 4, 13], [17, 50, 8, 2], [66, 45, 9, 2], [31, 103, 14, 2]]);
    scatter(ctx, [PALETTE.ink, PALETTE.ash, PALETTE.stone0], 24, 27, 48, 91, 38, 54);
  });

  canvasTexture(scene, "reliquary", 52, 82, (ctx) => {
    rect(ctx, PALETTE.ink, 21, 0, 10, 15);
    rect(ctx, PALETTE.gold2, 24, 0, 4, 14);
    rect(ctx, PALETTE.gold0, 14, 12, 25, 7);
    rect(ctx, PALETTE.gold2, 18, 13, 17, 3);
    rect(ctx, PALETTE.ink, 8, 19, 37, 47);
    rect(ctx, PALETTE.stone0, 11, 21, 31, 42);
    rect(ctx, PALETTE.gold1, 14, 23, 25, 35);
    rect(ctx, PALETTE.blood0, 18, 27, 17, 27);
    rect(ctx, PALETTE.wax, 23, 29, 7, 19);
    rect(ctx, PALETTE.light, 25, 30, 2, 13);
    rect(ctx, PALETTE.gold2, 4, 63, 44, 6);
    rect(ctx, PALETTE.ink, 0, 69, 52, 5);
    rect(ctx, PALETTE.stone1, 3, 74, 46, 8);
    scatter(ctx, [PALETTE.gold0, PALETTE.ink], 10, 20, 34, 43, 18, 72);
  });

  canvasTexture(scene, "gate", 58, 170, (ctx) => {
    rect(ctx, PALETTE.ink, 0, 0, 58, 170);
    rect(ctx, PALETTE.rust, 3, 0, 6, 170);
    rect(ctx, PALETTE.gold0, 5, 0, 2, 145);
    rect(ctx, PALETTE.rust, 49, 0, 6, 170);
    for (let x = 11; x < 49; x += 10) {
      rect(ctx, PALETTE.ink, x, 0, 6, 160);
      rect(ctx, PALETTE.gold0, x + 1, 7, 2, 146);
      rect(ctx, PALETTE.gold1, x - 1, 23, 8, 5);
      rect(ctx, PALETTE.rust, x - 1, 94, 8, 5);
      rect(ctx, PALETTE.gold2, x + 2, 0, 1, 12);
    }
    rect(ctx, PALETTE.rust, 0, 151, 58, 10);
    rect(ctx, PALETTE.gold0, 0, 154, 58, 3);
  });

  canvasTexture(scene, "projectile", 20, 12, (ctx) => {
    rect(ctx, PALETTE.ink, 0, 3, 19, 7);
    rect(ctx, PALETTE.gold0, 1, 4, 15, 5);
    rect(ctx, PALETTE.gold2, 5, 3, 15, 2);
    rect(ctx, PALETTE.light, 10, 3, 8, 1);
    rect(ctx, PALETTE.blood2, 13, 9, 5, 3);
  });

  canvasTexture(scene, "white", 2, 2, (ctx) => rect(ctx, "#ffffff", 0, 0, 2, 2));
}

function modularEnvironmentTextures(scene) {
  canvasTexture(scene, "far-masonry", 128, 64, (ctx) => {
    // The four canvas corners remain transparent so repeated plates break into
    // the void instead of producing a rectangular silhouette.
    rect(ctx, PALETTE.ink, 0, 4, 128, 56);
    rect(ctx, PALETTE.soot, 2, 6, 59, 24);
    rect(ctx, PALETTE.stone0, 64, 6, 62, 24);
    rect(ctx, PALETTE.stone0, 2, 33, 28, 25);
    rect(ctx, PALETTE.soot, 33, 33, 60, 25);
    rect(ctx, PALETTE.stone0, 96, 33, 30, 25);
    rect(ctx, PALETTE.void, 0, 30, 128, 3);
    rect(ctx, PALETTE.void, 61, 4, 3, 28);
    rect(ctx, PALETTE.void, 30, 32, 3, 28);
    rect(ctx, PALETTE.void, 93, 32, 3, 28);
    pixels(ctx, PALETTE.stone1, [
      [7, 9, 18, 2], [35, 24, 14, 2], [72, 10, 27, 2], [103, 23, 16, 2],
      [7, 39, 12, 2], [39, 37, 21, 2], [68, 51, 18, 2], [103, 40, 15, 2],
    ]);
    pixels(ctx, PALETTE.ink, [
      [18, 15, 3, 8], [48, 7, 2, 5], [82, 19, 5, 3], [113, 8, 2, 8],
      [12, 47, 2, 7], [51, 43, 4, 3], [77, 34, 2, 8], [112, 51, 5, 2],
    ]);
  });

  canvasTexture(scene, "far-window", 128, 256, (ctx) => {
    // Stepped lancet silhouette; no curves or fractional transforms are needed.
    rect(ctx, PALETTE.ink, 56, 0, 16, 8);
    rect(ctx, PALETTE.ink, 44, 8, 40, 8);
    rect(ctx, PALETTE.ink, 32, 16, 64, 8);
    rect(ctx, PALETTE.ink, 24, 24, 80, 16);
    rect(ctx, PALETTE.ink, 16, 40, 96, 216);
    rect(ctx, PALETTE.stone0, 58, 4, 12, 7);
    rect(ctx, PALETTE.stone0, 46, 12, 36, 7);
    rect(ctx, PALETTE.stone1, 34, 20, 60, 7);
    rect(ctx, PALETTE.stone0, 27, 29, 74, 14);
    rect(ctx, PALETTE.stone0, 20, 43, 88, 209);

    rect(ctx, PALETTE.void, 58, 16, 12, 8);
    rect(ctx, PALETTE.void, 48, 24, 32, 8);
    rect(ctx, PALETTE.void, 40, 32, 48, 12);
    rect(ctx, PALETTE.void, 32, 44, 64, 196);
    rect(ctx, PALETTE.blood0, 36, 56, 24, 172);
    rect(ctx, PALETTE.gold0, 64, 56, 28, 172);
    rect(ctx, PALETTE.void, 60, 48, 4, 188);
    rect(ctx, PALETTE.void, 32, 92, 64, 4);
    rect(ctx, PALETTE.void, 32, 140, 64, 4);
    rect(ctx, PALETTE.void, 32, 188, 64, 4);
    rect(ctx, PALETTE.stone1, 20, 240, 88, 12);
    rect(ctx, PALETTE.ink, 12, 252, 104, 4);
    pixels(ctx, PALETTE.gold1, [
      [39, 61, 4, 23], [48, 101, 7, 3], [70, 63, 3, 25], [79, 102, 8, 3],
      [40, 150, 3, 28], [49, 199, 6, 3], [69, 150, 4, 26], [80, 199, 7, 3],
    ]);
    pixels(ctx, PALETTE.ash, [
      [22, 65, 3, 18], [101, 74, 3, 22], [23, 155, 2, 26], [101, 205, 3, 20],
    ]);
  });

  canvasTexture(scene, "mid-arch", 320, 416, (ctx) => {
    // Outer arch mass.
    rect(ctx, PALETTE.ink, 128, 0, 64, 8);
    rect(ctx, PALETTE.ink, 96, 8, 128, 8);
    rect(ctx, PALETTE.ink, 64, 16, 192, 8);
    rect(ctx, PALETTE.ink, 40, 24, 240, 16);
    rect(ctx, PALETTE.ink, 24, 40, 272, 24);
    rect(ctx, PALETTE.ink, 16, 64, 288, 32);
    rect(ctx, PALETTE.ink, 8, 96, 304, 320);

    // Ash-stone courses retain the same stepped silhouette.
    rect(ctx, PALETTE.stone0, 132, 5, 56, 6);
    rect(ctx, PALETTE.stone0, 100, 13, 120, 7);
    rect(ctx, PALETTE.stone1, 68, 21, 184, 7);
    rect(ctx, PALETTE.stone0, 44, 29, 232, 15);
    rect(ctx, PALETTE.stone1, 28, 45, 264, 23);
    rect(ctx, PALETTE.stone0, 20, 68, 280, 32);
    rect(ctx, PALETTE.stone0, 12, 100, 296, 316);

    // Recessed opening is built from nested rectangles rather than a curve.
    rect(ctx, PALETTE.void, 140, 24, 40, 8);
    rect(ctx, PALETTE.void, 112, 32, 96, 8);
    rect(ctx, PALETTE.void, 88, 40, 144, 16);
    rect(ctx, PALETTE.void, 72, 56, 176, 24);
    rect(ctx, PALETTE.void, 64, 80, 192, 336);
    rect(ctx, PALETTE.ink, 76, 96, 168, 320);
    rect(ctx, PALETTE.soot, 84, 112, 152, 304);

    // Blocked piers and broken trim establish the midground cadence.
    for (let y = 112; y < 400; y += 32) {
      const offset = ((y / 32) % 2) * 8;
      rect(ctx, PALETTE.stone1, 16 + offset, y, 38 - offset, 24);
      rect(ctx, PALETTE.stone0, 266, y, 38 - offset, 24);
      rect(ctx, PALETTE.ink, 12, y + 24, 48, 4);
      rect(ctx, PALETTE.ink, 260, y + 24, 48, 4);
    }
    rect(ctx, PALETTE.gold0, 58, 88, 4, 296);
    rect(ctx, PALETTE.gold1, 258, 88, 3, 296);
    rect(ctx, PALETTE.stone1, 104, 176, 112, 8);
    rect(ctx, PALETTE.gold0, 112, 184, 96, 4);
    rect(ctx, PALETTE.stone0, 128, 208, 64, 128);
    rect(ctx, PALETTE.ink, 136, 216, 48, 112);
    rect(ctx, PALETTE.blood0, 148, 232, 24, 80);
    rect(ctx, PALETTE.gold1, 158, 220, 4, 104);
    pixels(ctx, PALETTE.ash, [
      [35, 116, 12, 2], [22, 199, 18, 2], [38, 276, 10, 2], [20, 356, 16, 2],
      [275, 132, 15, 2], [281, 213, 11, 2], [268, 292, 18, 2], [282, 372, 9, 2],
      [82, 63, 19, 2], [219, 52, 14, 2],
    ]);
  });

  canvasTexture(scene, "near-pillar", 96, 560, (ctx) => {
    rect(ctx, PALETTE.ink, 20, 0, 56, 8);
    rect(ctx, PALETTE.ink, 12, 8, 72, 8);
    rect(ctx, PALETTE.ink, 4, 16, 88, 16);
    rect(ctx, PALETTE.ink, 0, 32, 96, 16);
    rect(ctx, PALETTE.ink, 12, 48, 72, 464);
    rect(ctx, PALETTE.ink, 4, 512, 88, 16);
    rect(ctx, PALETTE.ink, 0, 528, 96, 16);
    rect(ctx, PALETTE.ink, 8, 544, 80, 8);
    rect(ctx, PALETTE.ink, 16, 552, 64, 8);

    rect(ctx, PALETTE.stone1, 22, 4, 52, 7);
    rect(ctx, PALETTE.stone2, 14, 12, 68, 7);
    rect(ctx, PALETTE.stone0, 7, 20, 82, 15);
    rect(ctx, PALETTE.stone1, 4, 35, 88, 10);
    rect(ctx, PALETTE.stone0, 18, 48, 60, 464);
    rect(ctx, PALETTE.stone1, 22, 56, 18, 448);
    rect(ctx, PALETTE.soot, 43, 56, 14, 448);
    rect(ctx, PALETTE.stone1, 61, 56, 12, 448);
    rect(ctx, PALETTE.ash, 24, 62, 4, 430);
    rect(ctx, PALETTE.gold0, 66, 72, 3, 408);
    rect(ctx, PALETTE.stone0, 8, 516, 80, 11);
    rect(ctx, PALETTE.stone1, 4, 531, 88, 10);
    rect(ctx, PALETTE.stone2, 12, 545, 72, 6);
    rect(ctx, PALETTE.stone0, 20, 553, 56, 6);
    for (let y = 82; y < 490; y += 48) {
      rect(ctx, PALETTE.ink, 18, y, 60, 3);
      rect(ctx, PALETTE.ash, 29 + ((y / 48) % 3) * 8, y + 6, 12, 2);
      rect(ctx, PALETTE.rust, 61, y + 18, 3, 8);
    }
  });

  canvasTexture(scene, "platform-top", 64, 32, (ctx) => {
    rect(ctx, PALETTE.ink, 0, 0, 64, 32);
    rect(ctx, PALETTE.ash, 0, 0, 64, 3);
    rect(ctx, PALETTE.bone, 3, 0, 20, 1);
    rect(ctx, PALETTE.stone2, 0, 3, 30, 12);
    rect(ctx, PALETTE.stone1, 32, 3, 32, 12);
    rect(ctx, PALETTE.soot, 0, 15, 64, 3);
    rect(ctx, PALETTE.stone0, 0, 18, 20, 14);
    rect(ctx, PALETTE.stone1, 23, 18, 25, 14);
    rect(ctx, PALETTE.stone0, 51, 18, 13, 14);
    rect(ctx, PALETTE.ink, 20, 20, 3, 12);
    rect(ctx, PALETTE.ink, 48, 18, 3, 14);
    pixels(ctx, PALETTE.ash, [[5, 6, 9, 2], [36, 7, 13, 2], [27, 21, 8, 2], [54, 22, 6, 2]]);
    pixels(ctx, PALETTE.rust, [[43, 4, 3, 7], [10, 20, 2, 5], [57, 27, 3, 2]]);
  });

  canvasTexture(scene, "platform-top-half-left", 32, 32, (ctx) => {
    // Exact opaque x=0..31 companion half of platform-top.
    rect(ctx, PALETTE.ink, 0, 0, 32, 32);
    rect(ctx, PALETTE.ash, 0, 0, 32, 3);
    rect(ctx, PALETTE.bone, 3, 0, 20, 1);
    rect(ctx, PALETTE.stone2, 0, 3, 30, 12);
    rect(ctx, PALETTE.soot, 0, 15, 32, 3);
    rect(ctx, PALETTE.stone0, 0, 18, 20, 14);
    rect(ctx, PALETTE.stone1, 23, 18, 9, 14);
    rect(ctx, PALETTE.ink, 20, 20, 3, 12);
    rect(ctx, PALETTE.ash, 5, 6, 9, 2);
    rect(ctx, PALETTE.ash, 27, 21, 5, 2);
    rect(ctx, PALETTE.rust, 10, 20, 2, 5);
  });

  canvasTexture(scene, "platform-top-half-right", 32, 32, (ctx) => {
    // Exact opaque x=32..63 companion half of platform-top.
    rect(ctx, PALETTE.ink, 0, 0, 32, 32);
    rect(ctx, PALETTE.ash, 0, 0, 32, 3);
    rect(ctx, PALETTE.stone1, 0, 3, 32, 12);
    rect(ctx, PALETTE.soot, 0, 15, 32, 3);
    rect(ctx, PALETTE.stone1, 0, 18, 16, 14);
    rect(ctx, PALETTE.stone0, 19, 18, 13, 14);
    rect(ctx, PALETTE.ink, 16, 18, 3, 14);
    rect(ctx, PALETTE.ash, 4, 7, 13, 2);
    rect(ctx, PALETTE.ash, 0, 21, 3, 2);
    rect(ctx, PALETTE.ash, 22, 22, 6, 2);
    rect(ctx, PALETTE.rust, 11, 4, 3, 7);
    rect(ctx, PALETTE.rust, 25, 27, 3, 2);
  });

  canvasTexture(scene, "platform-fill", 64, 32, (ctx) => {
    rect(ctx, PALETTE.ink, 0, 0, 64, 32);
    rect(ctx, PALETTE.stone0, 0, 1, 28, 14);
    rect(ctx, PALETTE.stone1, 31, 1, 33, 14);
    rect(ctx, PALETTE.ink, 28, 0, 3, 17);
    rect(ctx, PALETTE.soot, 0, 15, 64, 3);
    rect(ctx, PALETTE.stone1, 0, 18, 18, 14);
    rect(ctx, PALETTE.stone0, 21, 18, 27, 14);
    rect(ctx, PALETTE.stone1, 51, 18, 13, 14);
    rect(ctx, PALETTE.ink, 18, 18, 3, 14);
    rect(ctx, PALETTE.ink, 48, 18, 3, 14);
    pixels(ctx, PALETTE.stone2, [[4, 5, 12, 2], [37, 10, 18, 2], [26, 21, 10, 2], [54, 25, 7, 2]]);
    pixels(ctx, PALETTE.rust, [[13, 11, 3, 3], [44, 3, 2, 6], [8, 23, 2, 5]]);
  });

  canvasTexture(scene, "platform-broken-left", 32, 32, (ctx) => {
    // The missing left edge is irregular by row; this is not a flipped asset.
    rect(ctx, PALETTE.ash, 8, 0, 24, 3);
    rect(ctx, PALETTE.stone2, 5, 3, 27, 6);
    rect(ctx, PALETTE.stone1, 2, 9, 30, 6);
    rect(ctx, PALETTE.stone0, 7, 15, 25, 6);
    rect(ctx, PALETTE.stone1, 4, 21, 28, 6);
    rect(ctx, PALETTE.stone0, 9, 27, 23, 5);
    rect(ctx, PALETTE.bone, 11, 0, 13, 1);
    rect(ctx, PALETTE.ink, 5, 7, 8, 3);
    rect(ctx, PALETTE.ink, 7, 15, 3, 11);
    rect(ctx, PALETTE.ink, 12, 25, 8, 3);
    pixels(ctx, PALETTE.rust, [[3, 10, 4, 2], [10, 18, 3, 5], [5, 23, 3, 3], [23, 9, 2, 7]]);
  });

  canvasTexture(scene, "platform-broken-right", 32, 32, (ctx) => {
    // Independent chips keep the global upper-left light direction intact.
    rect(ctx, PALETTE.ash, 0, 0, 25, 3);
    rect(ctx, PALETTE.stone1, 0, 3, 28, 5);
    rect(ctx, PALETTE.stone2, 0, 8, 31, 7);
    rect(ctx, PALETTE.stone0, 0, 15, 26, 5);
    rect(ctx, PALETTE.stone1, 0, 20, 29, 7);
    rect(ctx, PALETTE.stone0, 0, 27, 22, 5);
    rect(ctx, PALETTE.bone, 2, 0, 16, 1);
    rect(ctx, PALETTE.ink, 20, 5, 8, 3);
    rect(ctx, PALETTE.ink, 17, 8, 3, 10);
    rect(ctx, PALETTE.ink, 21, 18, 6, 3);
    rect(ctx, PALETTE.ink, 14, 25, 8, 3);
    pixels(ctx, PALETTE.rust, [[27, 9, 3, 2], [20, 12, 3, 5], [25, 22, 3, 3], [8, 7, 2, 6]]);
  });

  canvasTexture(scene, "ladder", 32, 64, (ctx) => {
    rect(ctx, PALETTE.ink, 3, 0, 7, 64);
    rect(ctx, PALETTE.ink, 22, 0, 7, 64);
    rect(ctx, PALETTE.rust, 5, 0, 3, 64);
    rect(ctx, PALETTE.rust, 24, 0, 3, 64);
    rect(ctx, PALETTE.gold0, 6, 2, 1, 58);
    rect(ctx, PALETTE.stone1, 25, 4, 1, 56);
    for (let y = 7; y < 64; y += 12) {
      rect(ctx, PALETTE.ink, 7, y, 18, 5);
      rect(ctx, PALETTE.rust, 8, y + 1, 16, 3);
      rect(ctx, PALETTE.gold0, 9, y + 1, 13, 1);
    }
    pixels(ctx, PALETTE.ash, [[4, 13, 2, 2], [25, 24, 2, 3], [5, 49, 2, 2], [24, 58, 2, 2]]);
  });
}

function expandedLevelTextures(scene) {
  canvasTexture(scene, "platform-top-2", 64, 32, (ctx) => {
    // Edge pixels keep the same horizontal courses as every platform-top variant.
    rect(ctx, PALETTE.ink, 0, 0, 64, 32);
    rect(ctx, PALETTE.ash, 0, 0, 64, 3);
    rect(ctx, PALETTE.stone1, 0, 3, 64, 12);
    rect(ctx, PALETTE.soot, 0, 15, 64, 3);
    rect(ctx, PALETTE.stone0, 0, 18, 64, 14);
    rect(ctx, PALETTE.stone2, 0, 3, 2, 12);

    rect(ctx, PALETTE.bone, 7, 0, 15, 1);
    rect(ctx, PALETTE.stone2, 2, 4, 24, 9);
    rect(ctx, PALETTE.stone0, 29, 4, 33, 9);
    rect(ctx, PALETTE.ink, 26, 3, 3, 12);
    rect(ctx, PALETTE.stone1, 3, 19, 17, 12);
    rect(ctx, PALETTE.stone2, 23, 19, 21, 12);
    rect(ctx, PALETTE.stone1, 47, 19, 15, 12);
    rect(ctx, PALETTE.ink, 20, 18, 3, 14);
    rect(ctx, PALETTE.ink, 44, 18, 3, 14);
    rect(ctx, PALETTE.blood0, 38, 11, 5, 11);
    rect(ctx, PALETTE.blood1, 39, 12, 3, 7);
    rect(ctx, PALETTE.blood2, 40, 12, 1, 5);
    pixels(ctx, PALETTE.ash, [[5, 6, 8, 2], [31, 7, 11, 2], [25, 22, 9, 2], [51, 24, 7, 2]]);
    pixels(ctx, PALETTE.rust, [[17, 4, 3, 5], [8, 22, 2, 5], [55, 8, 3, 3], [35, 27, 2, 4]]);
  });

  canvasTexture(scene, "platform-top-3", 64, 32, (ctx) => {
    rect(ctx, PALETTE.ink, 0, 0, 64, 32);
    rect(ctx, PALETTE.ash, 0, 0, 64, 3);
    rect(ctx, PALETTE.stone1, 0, 3, 64, 12);
    rect(ctx, PALETTE.soot, 0, 15, 64, 3);
    rect(ctx, PALETTE.stone0, 0, 18, 64, 14);
    rect(ctx, PALETTE.stone2, 0, 3, 2, 12);

    rect(ctx, PALETTE.bone, 35, 0, 18, 1);
    rect(ctx, PALETTE.stone0, 2, 4, 18, 9);
    rect(ctx, PALETTE.stone2, 23, 4, 26, 9);
    rect(ctx, PALETTE.stone0, 52, 4, 10, 9);
    rect(ctx, PALETTE.ink, 20, 3, 3, 12);
    rect(ctx, PALETTE.ink, 49, 3, 3, 12);
    rect(ctx, PALETTE.stone2, 3, 19, 24, 12);
    rect(ctx, PALETTE.stone1, 30, 19, 15, 12);
    rect(ctx, PALETTE.stone2, 48, 19, 14, 12);
    rect(ctx, PALETTE.ink, 27, 18, 3, 14);
    rect(ctx, PALETTE.ink, 45, 18, 3, 14);
    rect(ctx, PALETTE.wax, 11, 12, 6, 8);
    rect(ctx, PALETTE.gold0, 12, 12, 4, 6);
    rect(ctx, PALETTE.wax, 15, 15, 3, 10);
    rect(ctx, PALETTE.gold1, 16, 16, 1, 7);
    pixels(ctx, PALETTE.ash, [[6, 8, 7, 2], [27, 5, 10, 2], [34, 23, 8, 2], [52, 27, 6, 2]]);
    pixels(ctx, PALETTE.rust, [[42, 4, 2, 6], [7, 24, 3, 3], [38, 28, 3, 2], [57, 20, 2, 5]]);
  });

  canvasTexture(scene, "platform-fill-2", 64, 32, (ctx) => {
    // Full-width base courses guarantee a sealed seam between fill variants.
    rect(ctx, PALETTE.ink, 0, 0, 64, 32);
    rect(ctx, PALETTE.stone0, 0, 1, 64, 14);
    rect(ctx, PALETTE.soot, 0, 15, 64, 3);
    rect(ctx, PALETTE.stone1, 0, 18, 64, 14);
    rect(ctx, PALETTE.stone1, 62, 1, 2, 14);

    rect(ctx, PALETTE.stone1, 2, 1, 20, 14);
    rect(ctx, PALETTE.stone2, 25, 1, 24, 14);
    rect(ctx, PALETTE.stone0, 52, 1, 10, 14);
    rect(ctx, PALETTE.ink, 22, 0, 3, 17);
    rect(ctx, PALETTE.ink, 49, 0, 3, 17);
    rect(ctx, PALETTE.stone0, 2, 18, 14, 14);
    rect(ctx, PALETTE.stone2, 19, 18, 29, 14);
    rect(ctx, PALETTE.stone0, 51, 18, 11, 14);
    rect(ctx, PALETTE.ink, 16, 18, 3, 14);
    rect(ctx, PALETTE.ink, 48, 18, 3, 14);
    pixels(ctx, PALETTE.ash, [[5, 5, 10, 2], [31, 9, 12, 2], [23, 21, 11, 2], [53, 25, 6, 2]]);
    pixels(ctx, PALETTE.rust, [[11, 11, 2, 4], [39, 3, 3, 4], [7, 23, 3, 5], [43, 27, 2, 3]]);
  });

  canvasTexture(scene, "platform-fill-3", 64, 32, (ctx) => {
    rect(ctx, PALETTE.ink, 0, 0, 64, 32);
    rect(ctx, PALETTE.stone0, 0, 1, 64, 14);
    rect(ctx, PALETTE.soot, 0, 15, 64, 3);
    rect(ctx, PALETTE.stone1, 0, 18, 64, 14);
    rect(ctx, PALETTE.stone1, 62, 1, 2, 14);

    rect(ctx, PALETTE.stone2, 2, 1, 29, 14);
    rect(ctx, PALETTE.stone1, 34, 1, 16, 14);
    rect(ctx, PALETTE.stone2, 53, 1, 9, 14);
    rect(ctx, PALETTE.ink, 31, 0, 3, 17);
    rect(ctx, PALETTE.ink, 50, 0, 3, 17);
    rect(ctx, PALETTE.stone0, 2, 18, 22, 14);
    rect(ctx, PALETTE.stone2, 27, 18, 18, 14);
    rect(ctx, PALETTE.stone0, 48, 18, 14, 14);
    rect(ctx, PALETTE.ink, 24, 18, 3, 14);
    rect(ctx, PALETTE.ink, 45, 18, 3, 14);
    rect(ctx, PALETTE.blood0, 36, 12, 4, 12);
    rect(ctx, PALETTE.blood1, 37, 13, 2, 8);
    rect(ctx, PALETTE.blood2, 38, 14, 1, 5);
    pixels(ctx, PALETTE.ash, [[7, 4, 12, 2], [38, 7, 8, 2], [5, 24, 9, 2], [30, 21, 10, 2], [52, 27, 7, 2]]);
    pixels(ctx, PALETTE.rust, [[18, 9, 3, 3], [42, 2, 2, 5], [16, 20, 2, 6], [56, 21, 3, 4]]);
  });

  canvasTexture(scene, "platform-underhang-1", 64, 16, (ctx) => {
    // Disconnected sockets and downward teeth avoid a false walkable silhouette.
    rect(ctx, PALETTE.ink, 2, 0, 14, 4);
    rect(ctx, PALETTE.stone0, 4, 1, 9, 5);
    rect(ctx, PALETTE.ink, 7, 6, 5, 6);
    rect(ctx, PALETTE.stone1, 8, 5, 3, 5);
    rect(ctx, PALETTE.ink, 22, 0, 18, 3);
    rect(ctx, PALETTE.stone1, 25, 1, 11, 6);
    rect(ctx, PALETTE.ink, 29, 7, 5, 8);
    rect(ctx, PALETTE.stone0, 30, 6, 3, 6);
    rect(ctx, PALETTE.ink, 48, 0, 13, 4);
    rect(ctx, PALETTE.stone0, 51, 1, 7, 5);
    rect(ctx, PALETTE.ink, 53, 6, 4, 5);
    pixels(ctx, PALETTE.rust, [[3, 2, 3, 2], [26, 3, 4, 2], [50, 2, 2, 3]]);
  });

  canvasTexture(scene, "platform-underhang-2", 64, 16, (ctx) => {
    rect(ctx, PALETTE.ink, 1, 0, 17, 3);
    rect(ctx, PALETTE.blood0, 4, 1, 10, 4);
    rect(ctx, PALETTE.blood1, 7, 4, 4, 8);
    rect(ctx, PALETTE.blood2, 8, 4, 2, 5);
    rect(ctx, PALETTE.ink, 24, 0, 12, 4);
    rect(ctx, PALETTE.stone0, 27, 1, 6, 5);
    rect(ctx, PALETTE.ink, 28, 6, 4, 5);
    rect(ctx, PALETTE.ink, 43, 0, 19, 3);
    rect(ctx, PALETTE.wax, 46, 1, 12, 4);
    rect(ctx, PALETTE.gold0, 48, 2, 7, 3);
    rect(ctx, PALETTE.wax, 51, 5, 4, 10);
    rect(ctx, PALETTE.gold1, 52, 5, 2, 7);
    pixels(ctx, PALETTE.rust, [[16, 1, 2, 3], [25, 2, 3, 2], [59, 1, 2, 2]]);
  });

  canvasTexture(scene, "platform-underhang-3", 64, 16, (ctx) => {
    rect(ctx, PALETTE.ink, 3, 0, 11, 4);
    rect(ctx, PALETTE.stone1, 5, 1, 7, 4);
    rect(ctx, PALETTE.ink, 7, 5, 4, 5);
    rect(ctx, PALETTE.ink, 19, 0, 22, 3);
    rect(ctx, PALETTE.gold0, 22, 1, 16, 3);
    rect(ctx, PALETTE.rust, 25, 4, 10, 3);
    rect(ctx, PALETTE.ink, 28, 7, 5, 8);
    rect(ctx, PALETTE.gold1, 29, 6, 3, 6);
    rect(ctx, PALETTE.ink, 48, 0, 14, 4);
    rect(ctx, PALETTE.stone0, 51, 1, 8, 5);
    rect(ctx, PALETTE.ink, 54, 6, 4, 6);
    pixels(ctx, PALETTE.ash, [[5, 2, 3, 1], [36, 1, 3, 1], [52, 2, 4, 1]]);
  });

  canvasTexture(scene, "rubble-cluster-1", 64, 32, (ctx) => {
    rect(ctx, PALETTE.ink, 2, 24, 15, 7);
    rect(ctx, PALETTE.stone0, 4, 20, 11, 10);
    rect(ctx, PALETTE.stone2, 7, 17, 6, 5);
    rect(ctx, PALETTE.ash, 8, 18, 3, 2);
    rect(ctx, PALETTE.ink, 21, 22, 18, 9);
    rect(ctx, PALETTE.stone1, 23, 17, 14, 13);
    rect(ctx, PALETTE.stone2, 27, 14, 7, 5);
    rect(ctx, PALETTE.ink, 45, 25, 16, 6);
    rect(ctx, PALETTE.stone0, 47, 20, 12, 10);
    rect(ctx, PALETTE.stone1, 51, 17, 6, 5);
    pixels(ctx, PALETTE.rust, [[5, 25, 3, 2], [30, 18, 2, 4], [53, 22, 3, 3]]);
  });

  canvasTexture(scene, "rubble-cluster-2", 64, 32, (ctx) => {
    rect(ctx, PALETTE.ink, 4, 25, 12, 6);
    rect(ctx, PALETTE.stone1, 6, 21, 8, 9);
    rect(ctx, PALETTE.ink, 19, 23, 20, 8);
    rect(ctx, PALETTE.stone0, 21, 18, 16, 12);
    rect(ctx, PALETTE.stone2, 25, 15, 9, 5);
    rect(ctx, PALETTE.ash, 28, 16, 4, 2);
    rect(ctx, PALETTE.ink, 43, 26, 17, 5);
    rect(ctx, PALETTE.stone1, 46, 21, 11, 9);
    rect(ctx, PALETTE.blood0, 14, 27, 10, 4);
    rect(ctx, PALETTE.blood1, 17, 25, 8, 3);
    rect(ctx, PALETTE.blood2, 20, 24, 4, 2);
    pixels(ctx, PALETTE.rust, [[8, 23, 2, 3], [32, 23, 3, 2], [49, 25, 2, 3]]);
  });

  canvasTexture(scene, "rubble-cluster-3", 64, 32, (ctx) => {
    rect(ctx, PALETTE.ink, 3, 26, 16, 5);
    rect(ctx, PALETTE.stone0, 6, 22, 10, 8);
    rect(ctx, PALETTE.ink, 24, 24, 14, 7);
    rect(ctx, PALETTE.stone2, 26, 19, 10, 11);
    rect(ctx, PALETTE.ash, 29, 17, 5, 4);
    rect(ctx, PALETTE.ink, 44, 23, 17, 8);
    rect(ctx, PALETTE.stone1, 46, 18, 13, 12);
    rect(ctx, PALETTE.stone2, 51, 15, 6, 5);
    rect(ctx, PALETTE.wax, 17, 25, 10, 6);
    rect(ctx, PALETTE.gold0, 19, 24, 6, 5);
    rect(ctx, PALETTE.bone, 38, 27, 9, 2);
    rect(ctx, PALETTE.silver, 40, 25, 5, 2);
    pixels(ctx, PALETTE.rust, [[9, 25, 3, 2], [31, 22, 2, 4], [53, 21, 3, 3]]);
  });

  canvasTexture(scene, "ledge-bone-pile", 32, 16, (ctx) => {
    rect(ctx, PALETTE.ink, 2, 13, 28, 3);
    rect(ctx, PALETTE.bone, 4, 10, 14, 3);
    rect(ctx, PALETTE.bone, 15, 7, 3, 7);
    rect(ctx, PALETTE.silver, 6, 9, 3, 2);
    rect(ctx, PALETTE.bone, 18, 11, 10, 2);
    rect(ctx, PALETTE.bone, 22, 6, 3, 7);
    rect(ctx, PALETTE.ash, 20, 10, 3, 2);
    rect(ctx, PALETTE.ink, 9, 6, 6, 4);
    rect(ctx, PALETTE.bone, 10, 4, 4, 4);
    pixels(ctx, PALETTE.ink, [[10, 5], [13, 5], [11, 7, 2, 1]]);
    pixels(ctx, PALETTE.rust, [[5, 13, 4, 1], [24, 13, 3, 1]]);
  });

  canvasTexture(scene, "ledge-candelabrum", 32, 48, (ctx) => {
    // Wicks are exposed for separate candle-flame sprite placement.
    rect(ctx, PALETTE.ink, 15, 0, 2, 4);
    rect(ctx, PALETTE.wax, 13, 4, 6, 14);
    rect(ctx, PALETTE.bone, 14, 5, 2, 9);
    rect(ctx, PALETTE.gold0, 12, 17, 8, 3);
    rect(ctx, PALETTE.ink, 5, 8, 2, 4);
    rect(ctx, PALETTE.wax, 3, 12, 6, 11);
    rect(ctx, PALETTE.bone, 4, 13, 2, 7);
    rect(ctx, PALETTE.ink, 25, 8, 2, 4);
    rect(ctx, PALETTE.wax, 23, 12, 6, 11);
    rect(ctx, PALETTE.bone, 24, 13, 2, 7);
    rect(ctx, PALETTE.ink, 4, 21, 24, 4);
    rect(ctx, PALETTE.gold0, 6, 22, 20, 2);
    rect(ctx, PALETTE.gold1, 14, 20, 4, 23);
    rect(ctx, PALETTE.ink, 13, 24, 6, 19);
    rect(ctx, PALETTE.gold0, 15, 25, 2, 16);
    rect(ctx, PALETTE.ink, 8, 41, 16, 4);
    rect(ctx, PALETTE.gold1, 10, 42, 12, 2);
    rect(ctx, PALETTE.ink, 4, 45, 24, 3);
    rect(ctx, PALETTE.rust, 9, 46, 14, 2);
  });

  canvasTexture(scene, "candle-flame-1", 6, 10, (ctx) => {
    rect(ctx, PALETTE.gold1, 2, 0, 2, 2);
    rect(ctx, PALETTE.gold2, 1, 2, 4, 5);
    rect(ctx, PALETTE.light, 2, 3, 2, 4);
    rect(ctx, PALETTE.gold0, 2, 7, 2, 3);
  });

  canvasTexture(scene, "candle-flame-2", 6, 10, (ctx) => {
    rect(ctx, PALETTE.gold1, 1, 0, 2, 3);
    rect(ctx, PALETTE.gold2, 1, 2, 4, 5);
    rect(ctx, PALETTE.light, 2, 3, 2, 3);
    rect(ctx, PALETTE.gold0, 3, 6, 2, 4);
  });

  canvasTexture(scene, "candle-flame-3", 6, 10, (ctx) => {
    rect(ctx, PALETTE.gold1, 3, 0, 2, 3);
    rect(ctx, PALETTE.gold2, 1, 3, 4, 4);
    rect(ctx, PALETTE.light, 2, 3, 2, 4);
    rect(ctx, PALETTE.gold0, 1, 7, 3, 3);
  });
}

function hudTextures(scene) {
  canvasTexture(scene, "hud-status-frame", 320, 96, (ctx) => {
    // All outer canvas corners remain clear for a hard, stepped silhouette.
    rect(ctx, PALETTE.ink, 24, 0, 40, 4);
    rect(ctx, PALETTE.ink, 12, 4, 64, 4);
    rect(ctx, PALETTE.ink, 4, 8, 76, 8);
    rect(ctx, PALETTE.ink, 0, 16, 84, 64);
    rect(ctx, PALETTE.ink, 4, 80, 76, 8);
    rect(ctx, PALETTE.ink, 12, 88, 64, 4);
    rect(ctx, PALETTE.ink, 24, 92, 40, 4);

    rect(ctx, PALETTE.ink, 72, 8, 240, 80);
    rect(ctx, PALETTE.gold0, 76, 11, 232, 74);
    rect(ctx, PALETTE.soot, 80, 15, 224, 66);
    rect(ctx, PALETTE.void, 84, 19, 216, 58);
    rect(ctx, PALETTE.stone0, 82, 23, 2, 50);
    rect(ctx, PALETTE.gold1, 300, 23, 2, 50);

    rect(ctx, PALETTE.gold0, 76, 4, 4, 12);
    rect(ctx, PALETTE.gold1, 84, 2, 3, 12);
    rect(ctx, PALETTE.gold0, 304, 4, 4, 12);
    rect(ctx, PALETTE.gold1, 296, 2, 3, 12);
    rect(ctx, PALETTE.gold0, 76, 80, 4, 12);
    rect(ctx, PALETTE.gold1, 84, 82, 3, 12);
    rect(ctx, PALETTE.gold0, 304, 80, 4, 12);
    rect(ctx, PALETTE.gold1, 296, 82, 3, 12);
    rect(ctx, PALETTE.ink, 64, 29, 24, 38);
    rect(ctx, PALETTE.gold0, 68, 33, 20, 30);
    rect(ctx, PALETTE.soot, 72, 37, 16, 22);
    pixels(ctx, PALETTE.gold2, [
      [8, 22, 4, 4], [2, 36, 4, 4], [4, 58, 4, 4], [12, 76, 4, 4],
      [90, 9, 2, 4], [102, 9, 2, 4], [282, 9, 2, 4], [294, 9, 2, 4],
      [90, 83, 2, 4], [102, 83, 2, 4], [282, 83, 2, 4], [294, 83, 2, 4],
    ]);
  });

  canvasTexture(scene, "hud-crest", 80, 80, (ctx) => {
    rect(ctx, PALETTE.ink, 24, 0, 32, 4);
    rect(ctx, PALETTE.ink, 16, 4, 48, 4);
    rect(ctx, PALETTE.ink, 8, 8, 64, 8);
    rect(ctx, PALETTE.ink, 4, 16, 72, 48);
    rect(ctx, PALETTE.ink, 8, 64, 64, 8);
    rect(ctx, PALETTE.ink, 16, 72, 48, 4);
    rect(ctx, PALETTE.ink, 24, 76, 32, 4);
    rect(ctx, PALETTE.gold0, 24, 4, 32, 4);
    rect(ctx, PALETTE.gold1, 16, 8, 48, 4);
    rect(ctx, PALETTE.gold0, 10, 16, 60, 48);
    rect(ctx, PALETTE.blood0, 14, 16, 52, 48);
    rect(ctx, PALETTE.soot, 18, 20, 44, 40);
    rect(ctx, PALETTE.gold1, 12, 36, 56, 8);
    rect(ctx, PALETTE.ink, 16, 38, 48, 4);

    // Severe devotional mask and needle crest.
    rect(ctx, PALETTE.gold2, 38, 8, 4, 12);
    rect(ctx, PALETTE.ink, 34, 16, 12, 8);
    rect(ctx, PALETTE.bone, 36, 18, 8, 22);
    rect(ctx, PALETTE.light, 37, 20, 2, 13);
    rect(ctx, PALETTE.stone1, 32, 24, 16, 22);
    rect(ctx, PALETTE.ash, 35, 26, 4, 15);
    rect(ctx, PALETTE.ink, 34, 31, 3, 4);
    rect(ctx, PALETTE.ink, 43, 31, 3, 4);
    rect(ctx, PALETTE.gold0, 30, 44, 20, 5);
    rect(ctx, PALETTE.blood1, 34, 49, 12, 17);
    rect(ctx, PALETTE.ink, 30, 64, 8, 4);
    rect(ctx, PALETTE.ink, 42, 64, 8, 4);
    pixels(ctx, PALETTE.gold2, [[18, 18, 3, 3], [59, 18, 3, 3], [12, 38, 3, 3], [65, 38, 3, 3], [18, 59, 3, 3], [59, 59, 3, 3]]);
  });

  canvasTexture(scene, "hud-health-rail", 216, 14, (ctx) => {
    rect(ctx, PALETTE.ink, 2, 0, 212, 14);
    rect(ctx, PALETTE.gold0, 4, 2, 208, 10);
    rect(ctx, PALETTE.soot, 6, 4, 204, 6);
    rect(ctx, PALETTE.stone0, 8, 5, 200, 1);
    pixels(ctx, PALETTE.gold2, [[0, 5, 4, 4], [212, 5, 4, 4], [14, 1, 2, 2], [200, 11, 2, 2]]);
  });

  canvasTexture(scene, "hud-health-pip-full", 38, 8, (ctx) => {
    rect(ctx, PALETTE.ink, 1, 0, 36, 8);
    rect(ctx, PALETTE.blood0, 2, 1, 34, 6);
    rect(ctx, PALETTE.blood1, 3, 2, 32, 4);
    rect(ctx, PALETTE.blood2, 4, 2, 24, 2);
    rect(ctx, PALETTE.bone, 5, 2, 9, 1);
  });

  canvasTexture(scene, "hud-health-pip-empty", 38, 8, (ctx) => {
    rect(ctx, PALETTE.ink, 1, 0, 36, 8);
    rect(ctx, PALETTE.stone0, 2, 1, 34, 6);
    rect(ctx, PALETTE.soot, 3, 2, 32, 4);
    rect(ctx, PALETTE.stone1, 4, 2, 18, 1);
    rect(ctx, PALETTE.blood0, 31, 3, 3, 2);
  });

  canvasTexture(scene, "hud-fervour-rail", 192, 10, (ctx) => {
    rect(ctx, PALETTE.ink, 1, 0, 190, 10);
    rect(ctx, PALETTE.gold0, 3, 2, 186, 6);
    rect(ctx, PALETTE.soot, 5, 3, 182, 4);
    pixels(ctx, PALETTE.gold2, [[0, 3, 3, 4], [189, 3, 3, 4]]);
  });

  canvasTexture(scene, "hud-fervour-fill", 188, 6, (ctx) => {
    rect(ctx, PALETTE.gold0, 1, 0, 186, 6);
    rect(ctx, PALETTE.gold1, 2, 1, 184, 4);
    rect(ctx, PALETTE.gold2, 3, 1, 181, 2);
    rect(ctx, PALETTE.light, 4, 1, 56, 1);
  });

  const drawVial = (ctx, filled) => {
    rect(ctx, PALETTE.ink, 9, 2, 6, 3);
    rect(ctx, PALETTE.gold0, 8, 5, 8, 3);
    rect(ctx, PALETTE.ink, 6, 8, 12, 2);
    rect(ctx, PALETTE.ink, 4, 10, 16, 9);
    rect(ctx, PALETTE.ink, 7, 19, 10, 3);
    rect(ctx, PALETTE.stone1, 8, 9, 8, 2);
    rect(ctx, filled ? PALETTE.blood0 : PALETTE.soot, 6, 11, 12, 7);
    rect(ctx, filled ? PALETTE.blood1 : PALETTE.stone0, 7, 13, 10, 5);
    if (filled) {
      rect(ctx, PALETTE.blood2, 8, 13, 4, 4);
      rect(ctx, PALETTE.bone, 8, 10, 2, 4);
    } else {
      rect(ctx, PALETTE.stone1, 8, 12, 2, 4);
    }
    rect(ctx, PALETTE.gold0, 8, 19, 8, 2);
  };

  canvasTexture(scene, "hud-vial-full", 24, 24, (ctx) => drawVial(ctx, true));
  canvasTexture(scene, "hud-vial-empty", 24, 24, (ctx) => drawVial(ctx, false));

  canvasTexture(scene, "hud-resource-frame", 216, 64, (ctx) => {
    rect(ctx, PALETTE.ink, 16, 0, 184, 4);
    rect(ctx, PALETTE.ink, 8, 4, 200, 8);
    rect(ctx, PALETTE.ink, 4, 12, 208, 40);
    rect(ctx, PALETTE.ink, 8, 52, 200, 8);
    rect(ctx, PALETTE.ink, 16, 60, 184, 4);
    rect(ctx, PALETTE.gold0, 16, 4, 184, 4);
    rect(ctx, PALETTE.gold1, 10, 8, 196, 4);
    rect(ctx, PALETTE.gold0, 8, 14, 200, 36);
    rect(ctx, PALETTE.soot, 12, 16, 192, 32);
    rect(ctx, PALETTE.void, 16, 20, 184, 24);
    rect(ctx, PALETTE.gold0, 58, 16, 3, 32);
    rect(ctx, PALETTE.stone0, 63, 20, 2, 24);
    rect(ctx, PALETTE.gold1, 198, 22, 2, 20);
    pixels(ctx, PALETTE.gold2, [
      [2, 27, 6, 4], [208, 27, 6, 4], [20, 2, 3, 4], [193, 2, 3, 4],
      [20, 58, 3, 4], [193, 58, 3, 4], [74, 12, 2, 3], [184, 49, 2, 3],
    ]);
  });

  canvasTexture(scene, "hud-resource-sigil", 32, 32, (ctx) => {
    rect(ctx, PALETTE.ink, 14, 0, 4, 4);
    rect(ctx, PALETTE.ink, 10, 4, 12, 4);
    rect(ctx, PALETTE.ink, 6, 8, 20, 4);
    rect(ctx, PALETTE.ink, 2, 12, 28, 8);
    rect(ctx, PALETTE.ink, 6, 20, 20, 4);
    rect(ctx, PALETTE.ink, 10, 24, 12, 4);
    rect(ctx, PALETTE.ink, 14, 28, 4, 4);
    rect(ctx, PALETTE.gold0, 14, 4, 4, 24);
    rect(ctx, PALETTE.gold1, 6, 14, 20, 4);
    rect(ctx, PALETTE.gold2, 12, 10, 8, 12);
    rect(ctx, PALETTE.soot, 14, 12, 4, 8);
    pixels(ctx, PALETTE.light, [[15, 5, 1, 6], [7, 15, 6, 1], [19, 11, 1, 4]]);
  });

  const digitPatterns = {
    0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
    1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
    2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
    3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
    4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
    5: ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
    6: ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
    7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
    9: ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  };

  Object.entries(digitPatterns).forEach(([digit, rows]) => {
    canvasTexture(scene, `hud-digit-${digit}`, 15, 21, (ctx) => {
      rows.forEach((row, rowIndex) => {
        [...row].forEach((cell, columnIndex) => {
          if (cell === "1") rect(ctx, PALETTE.gold2, columnIndex * 3, rowIndex * 3, 3, 3);
        });
      });
    });
  });
  canvasTexture(scene, "hud-digit-blank", 15, 21, () => {});
}

export function createTextures(scene) {
  gildedNaveAtlasTextures(scene);
  censerFrame(scene, "censer-1", 0);
  censerFrame(scene, "censer-2", 1);
  decorativeCenser(scene);
  chainLink(scene);
  environmentTextures(scene);
  modularEnvironmentTextures(scene);
  expandedLevelTextures(scene);
  hudTextures(scene);

  scene.anims.create({ key: "censer", frames: [{ key: "censer-1" }, { key: "censer-2" }], frameRate: 2, repeat: -1 });
  scene.anims.create({
    key: "candle-flame",
    frames: [{ key: "candle-flame-1" }, { key: "candle-flame-2" }, { key: "candle-flame-3" }, { key: "candle-flame-2" }],
    frameRate: 7,
    repeat: -1,
  });
}

export { PALETTE };

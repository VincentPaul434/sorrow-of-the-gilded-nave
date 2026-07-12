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

export function createTextures(scene) {
  censerFrame(scene, "censer-1", 0);
  censerFrame(scene, "censer-2", 1);
  decorativeCenser(scene);
  environmentTextures(scene);

  scene.anims.create({ key: "censer", frames: [{ key: "censer-1" }, { key: "censer-2" }], frameRate: 2, repeat: -1 });
}

export { PALETTE };

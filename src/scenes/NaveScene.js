import Phaser from "phaser";
import { createTextures, PALETTE } from "../game/textures.js";

const WORLD_WIDTH = 5400;
const FLOOR_Y = 650;

export class NaveScene extends Phaser.Scene {
  constructor() {
    super("nave");
  }

  preload() {
    this.load.image("concept", "/assets/gilded-nave-concept.png");
    this.load.spritesheet("penitent-idle-animation", "/assets/characters/penitent-idle-animation.png", { frameWidth: 360, frameHeight: 320 });
    this.load.spritesheet("penitent-run-animation", "/assets/characters/penitent-run-animation.png", { frameWidth: 360, frameHeight: 320 });
    this.load.spritesheet("penitent-attack-animation", "/assets/characters/penitent-attack-animation.png", { frameWidth: 360, frameHeight: 320 });
    this.load.spritesheet("mourner-model", "/assets/characters/mourner-sheet.png", { frameWidth: 362, frameHeight: 250 });
    this.load.spritesheet("bishop-model", "/assets/characters/bishop-sheet.png", { frameWidth: 362, frameHeight: 320 });
  }

  create() {
    createTextures(this);
    this.createCharacterAnimations();
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, 720);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 720);
    this.cameras.main.setBackgroundColor("#090807");

    this.gameState = {
      health: 5,
      maxHealth: 5,
      fervour: 0,
      checkpointX: 150,
      bossAwake: false,
      bossDead: false,
      won: false,
      deaths: 0,
    };
    this.attackSerial = 0;
    this.lastGroundedAt = 0;
    this.jumpQueuedAt = -999;
    this.attackingUntil = 0;
    this.parryingUntil = 0;
    this.invulnerableUntil = 0;
    this.nextStepAt = 0;
    this.touchState = { left: false, right: false, jump: false, attack: false };

    this.drawCathedral();
    this.createLevel();
    this.createPlayer();
    this.createEnemies();
    this.createInput();
    this.createHud();
    this.createAtmosphere();
    this.createIntro();

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.projectiles, this.solids, (projectile) => projectile.destroy());
    this.physics.add.overlap(this.player, this.spikes, () => this.hurtPlayer(2, this.player.x > 0 ? -1 : 1));
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => this.touchEnemy(enemy));
    this.physics.add.overlap(this.player, this.projectiles, (player, projectile) => this.hitByProjectile(projectile));
    this.physics.add.overlap(this.attackZone, this.enemies, (zone, enemy) => this.hitEnemy(enemy));
    this.physics.add.overlap(this.player, this.relic, () => this.activateCheckpoint());

    this.cameras.main.startFollow(this.player, true, 0.09, 0.08, -220, 50);
    this.cameras.main.setDeadzone(170, 90);
    this.cameras.main.fadeIn(500, 7, 5, 4);
  }

  createCharacterAnimations() {
    this.anims.create({ key: "idle", frames: this.anims.generateFrameNumbers("penitent-idle-animation", { start: 0, end: 6 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: "run", frames: this.anims.generateFrameNumbers("penitent-run-animation", { start: 0, end: 7 }), frameRate: 13, repeat: -1 });
    this.anims.create({ key: "attack", frames: this.anims.generateFrameNumbers("penitent-attack-animation", { start: 0, end: 6 }), frameRate: 11, repeat: 0 });
    this.anims.create({ key: "mourner", frames: [{ key: "mourner-model", frame: 1 }], frameRate: 1, repeat: -1 });
    this.anims.create({ key: "bishop", frames: [{ key: "bishop-model", frame: 0 }, { key: "bishop-model", frame: 1 }], frameRate: 1.5, repeat: -1 });
  }

  drawCathedral() {
    const base = this.add.graphics().setDepth(-40);
    base.fillStyle(0x070706, 1).fillRect(0, 0, WORLD_WIDTH, 720);

    // Use the ornament-rich, character-free right side of the reference as a
    // repeating architectural plate. Each plate is veiled and interrupted by
    // nearer columns so repetition reads as a continuous cathedral nave.
    const crop = { x: 610, y: 0, width: 1062, height: 800 };
    const artScaleX = 1380 / crop.width;
    for (let panel = 0; panel < 5; panel += 1) {
      const art = this.add.image(panel * 1320 - crop.x * artScaleX, 0, "concept")
        .setOrigin(0, 0)
        .setCrop(crop.x, crop.y, crop.width, crop.height)
        .setScale(artScaleX, 720 / crop.height)
        .setAlpha(panel % 2 === 0 ? 0.72 : 0.6)
        .setTint(panel % 2 === 0 ? 0xc5bba7 : 0x9f9382)
        .setDepth(-36);
      art.setScrollFactor(0.975, 1);
    }

    const veil = this.add.graphics().setDepth(-34);
    veil.fillStyle(0x080706, 0.17).fillRect(0, 0, WORLD_WIDTH, 260);
    veil.fillStyle(0x080706, 0.28).fillRect(0, 260, WORLD_WIDTH, 150);
    veil.fillStyle(0x080706, 0.48).fillRect(0, 410, WORLD_WIDTH, 115);
    veil.fillStyle(0x080706, 0.72).fillRect(0, 525, WORLD_WIDTH, 195);

    const architecture = this.add.graphics().setDepth(-20);
    for (let x = 280; x < WORLD_WIDTH; x += 680) {
      architecture.fillStyle(0x0a0908, 0.95).fillRect(x - 40, 0, 116, 620);
      architecture.fillStyle(0x201d1a, 1).fillRect(x - 24, 38, 84, 570);
      architecture.fillStyle(0x443d35, 0.8).fillRect(x - 18, 62, 8, 515);
      architecture.fillStyle(0x151210, 1).fillRect(x + 39, 62, 15, 515);
      architecture.fillStyle(0x66533b, 0.75).fillRect(x - 7, 86, 3, 470);
      architecture.fillStyle(0x100e0d, 1).fillRect(x - 52, 0, 140, 42);
      architecture.fillStyle(0x39332d, 1).fillRect(x - 62, 37, 160, 18);
      architecture.fillStyle(0x151311, 1).fillRect(x - 72, 574, 180, 42);
      architecture.fillStyle(0x443b32, 1).fillRect(x - 82, 574, 200, 10);
      architecture.fillStyle(0x8b6228, 0.75).fillRect(x - 43, 112, 119, 3);
      architecture.fillStyle(0xb58738, 0.45).fillRect(x - 32, 123, 97, 2);
      for (let chip = 0; chip < 18; chip += 1) {
        const px = x - 28 + ((chip * 37) % 82);
        const py = 150 + ((chip * 71) % 390);
        architecture.fillStyle(chip % 3 === 0 ? 0x756e63 : 0x161412, 0.8).fillRect(px, py, chip % 4 === 0 ? 4 : 2, 2);
      }
    }

    // Recessed devotional bays keep the lower gameplay plane detailed without
    // competing with silhouettes and hazards.
    const bays = this.add.graphics().setDepth(-17);
    for (let x = 80; x < WORLD_WIDTH; x += 430) {
      bays.fillStyle(0x080706, 0.68).fillRoundedRect(x, 330, 250, 285, 80);
      bays.lineStyle(5, 0x302a25, 0.82).strokeRoundedRect(x, 330, 250, 285, 80);
      bays.lineStyle(2, 0x765023, 0.68).strokeRoundedRect(x + 12, 342, 226, 259, 69);
      bays.lineStyle(1, 0xb18843, 0.32).strokeRoundedRect(x + 20, 350, 210, 242, 62);
      bays.fillStyle(0x4b1011, 0.5).fillRect(x + 85, 392, 80, 175);
      bays.fillStyle(0xa67a34, 0.55).fillCircle(x + 125, 426, 23);
      bays.fillStyle(0x151210, 0.96).fillRect(x + 116, 447, 18, 82);
      bays.fillTriangle(x + 125, 492, x + 88, 556, x + 162, 556);
      for (let bead = 0; bead < 16; bead += 1) {
        const bx = x + 27 + ((bead * 43) % 196);
        const by = 362 + ((bead * 67) % 210);
        bays.fillStyle(bead % 3 === 0 ? 0xb78b3c : 0x6f4d23, bead % 3 === 0 ? 0.65 : 0.4).fillRect(bx, by, bead % 4 === 0 ? 3 : 2, 2);
      }
    }

    const shrinePositions = [1130, 2440, 3760, 5050];
    shrinePositions.forEach((x, index) => {
      const statue = this.add.image(x, 495, "weeping-statue")
        .setOrigin(0.5, 1)
        .setScale(index % 2 === 0 ? 1.15 : 1.32)
        .setAlpha(0.65)
        .setTint(index % 2 === 0 ? 0xaaa49a : 0x7c7770)
        .setDepth(-10);
      if (index % 2) statue.setFlipX(true);
    });

    const iron = this.add.graphics().setDepth(-8);
    for (let x = 40; x < WORLD_WIDTH; x += 92) {
      iron.lineStyle(4, 0x100e0d, 1).lineBetween(x, 540, x, 617);
      iron.lineStyle(2, 0x77462b, 0.8).lineBetween(x + 2, 547, x + 2, 612);
      iron.fillStyle(0x97703a, 0.8).fillTriangle(x - 3, 543, x + 7, 543, x + 2, 530);
    }
    iron.lineStyle(5, 0x0a0908, 1).lineBetween(0, 575, WORLD_WIDTH, 575);
    iron.lineStyle(2, 0x6b4228, 0.8).lineBetween(0, 578, WORLD_WIDTH, 578);

    const chains = this.add.graphics().setDepth(-6);
    [520, 1710, 3100, 4260].forEach((x, index) => {
      const length = index % 2 === 0 ? 175 : 245;
      chains.lineStyle(3, 0x090807, 1).lineBetween(x, 0, x, length);
      chains.lineStyle(1, 0x80603a, 0.8).lineBetween(x + 2, 0, x + 2, length);
      this.add.image(x, length + 18, "censer-1").setScale(0.75).setAlpha(0.8).setDepth(-5);
    });

    const shafts = this.add.graphics().setDepth(-4).setBlendMode(Phaser.BlendModes.ADD);
    shafts.fillStyle(0xe3d0a0, 0.075).fillTriangle(820, 0, 960, 0, 1390, 650);
    shafts.fillStyle(0xf0d89d, 0.055).fillTriangle(2670, 0, 2805, 0, 3260, 650);
    shafts.fillStyle(0xf1d89d, 0.085).fillTriangle(4480, 0, 4620, 0, 5000, 650);
    shafts.fillStyle(0xd8be82, 0.035).fillTriangle(4700, 0, 4780, 0, 5250, 650);
  }

  createLevel() {
    this.solids = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.gates = this.physics.add.staticGroup();
    let platformIndex = 0;

    const platform = (x, y, width, height = 32) => {
      this.add.tileSprite(x, y, width, height, "stone").setDepth(1);
      const ledge = this.add.rectangle(x, y - height / 2 + 2, width, 3, 0xc0b8a5, 0.58).setDepth(2);
      this.add.rectangle(x, y - height / 2 + 6, width, 2, 0x151311, 0.9).setDepth(2);
      if (platformIndex % 2 === 0 && width > 150) {
        const stainWidth = Math.min(150, Math.round(width * 0.22));
        const stainX = x + width * (platformIndex % 4 === 0 ? 0.24 : -0.23);
        this.add.tileSprite(stainX, y - height / 2 + 14, stainWidth, 24, "wax-edge").setDepth(2).setAlpha(0.86);
      }
      platformIndex += 1;
      const body = this.solids.create(x, y, "white").setVisible(false);
      body.displayWidth = width;
      body.displayHeight = height;
      body.refreshBody();
      return { body, ledge };
    };

    platform(430, FLOOR_Y, 860, 68);
    platform(1120, FLOOR_Y, 360, 68);
    platform(1580, FLOOR_Y, 420, 68);
    platform(2080, FLOOR_Y, 400, 68);
    platform(2600, FLOOR_Y, 520, 68);
    platform(3250, FLOOR_Y, 600, 68);
    platform(3850, FLOOR_Y, 440, 68);
    platform(4700, FLOOR_Y, 1200, 68);

    platform(865, 530, 170, 28);
    platform(1340, 485, 180, 28);
    platform(1800, 510, 190, 28);
    platform(2280, 455, 180, 28);
    platform(2835, 515, 170, 28);
    platform(3485, 470, 170, 28);
    platform(3925, 505, 150, 28);

    const addSpikes = (x, y, count) => {
      for (let i = 0; i < count; i += 1) {
        const spike = this.spikes.create(x + i * 30, y, "spike");
        spike.body.setSize(24, 24).setOffset(4, 20);
        spike.refreshBody();
        spike.setDepth(2);
      }
    };
    addSpikes(878, 620, 5);
    addSpikes(1295, 620, 7);
    addSpikes(1805, 620, 4);
    addSpikes(2290, 620, 6);
    addSpikes(2925, 620, 5);
    addSpikes(3580, 620, 5);
    addSpikes(4070, 620, 5);

    this.relic = this.physics.add.staticImage(2680, 568, "reliquary").setDepth(4);
    this.relic.body.setSize(54, 88).setOffset(-1, -3);

    this.bossGate = this.gates.create(4190, 525, "gate").setDepth(3).setVisible(false);
    this.bossGate.body.enable = false;

    [90, 220, 505, 735, 1080, 1600, 2110, 2480, 2740, 3290, 3870, 4510, 4930, 5190].forEach((x, bank) => {
      const count = bank % 3 === 0 ? 5 : 3;
      for (let i = 0; i < count; i += 1) {
        const candleX = x + i * 8;
        const candleHeight = 9 + ((bank * 7 + i * 11) % 18);
        const candle = this.add.rectangle(candleX, 615 - candleHeight / 2, 3, candleHeight, 0xcabc98, 0.72).setDepth(3);
        this.add.rectangle(candleX + 1, candle.y - 1, 1, candleHeight - 3, 0x746c5f, 0.72).setDepth(3);
        const flame = this.add.rectangle(candleX, candle.y - candle.height / 2 - 4, 2, 5, 0xe7ae4b, 0.82).setDepth(3);
        this.tweens.add({ targets: flame, alpha: 0.3, scaleY: 1.45, duration: 310 + ((bank * 43 + i * 61) % 290), yoyo: true, repeat: -1 });
      }
    });

    [420, 1670, 2550, 3380, 4740].forEach((x, index) => {
      this.add.tileSprite(x, 586, index === 4 ? 260 : 190, 58, "iron-fence").setDepth(0).setAlpha(0.9);
    });
  }

  createPlayer() {
    this.player = this.physics.add.sprite(150, 616, "penitent-idle-animation", 0)
      .setOrigin(0.5, 286 / 320)
      .setScale(0.43)
      .setDepth(6);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(56, 140).setOffset(152, 146);
    this.player.setMaxVelocity(330, 820);
    this.player.setDragX(1450);
    this.player.play("idle");

    this.attackZone = this.add.zone(this.player.x + 45, this.player.y, 60, 55);
    this.physics.add.existing(this.attackZone);
    this.attackZone.body.allowGravity = false;
    this.attackZone.body.enable = false;

    this.playerShadow = this.add.ellipse(this.player.x, FLOOR_Y - 33, 46, 9, 0x000000, 0.58).setDepth(4);
  }

  createEnemies() {
    this.enemies = this.physics.add.group({ allowGravity: true });
    this.projectiles = this.physics.add.group({ allowGravity: false });
    this.spawnEnemy("mourner", 640, 616, 3, 520, 760);
    this.spawnEnemy("censer", 1460, 420, 2, 1330, 1690);
    this.spawnEnemy("mourner", 1950, 616, 3, 1850, 2190);
    this.spawnEnemy("censer", 3020, 470, 2, 2880, 3400);
    this.spawnEnemy("mourner", 3660, 616, 4, 3500, 3980);
  }

  spawnEnemy(kind, x, y, hp, minX, maxX) {
    const key = kind === "censer" ? "censer-1" : kind === "boss" ? "bishop-model" : "mourner-model";
    const enemy = this.enemies.create(x, y, key).setDepth(5);
    enemy.kind = kind;
    enemy.hp = hp;
    enemy.minX = minX;
    enemy.maxX = maxX;
    enemy.direction = -1;
    enemy.nextAttackAt = Phaser.Math.Between(600, 1500);
    enemy.lastHitSerial = -1;
    enemy.setBounce(0);
    if (kind === "censer") {
      enemy.body.setSize(32, 39).setOffset(10, 15);
      enemy.body.allowGravity = false;
      enemy.baseY = y;
      enemy.play("censer");
    } else if (kind === "boss") {
      enemy.setOrigin(0.5, 300 / 320).setScale(0.45);
      enemy.body.setSize(120, 247).setOffset(121, 53);
      enemy.play("bishop");
    } else {
      enemy.setOrigin(0.5, 1).setScale(0.36);
      enemy.body.setSize(78, 167).setOffset(142, 83);
      enemy.play("mourner");
    }
    return enemy;
  }

  createInput() {
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      leftAlt: Phaser.Input.Keyboard.KeyCodes.LEFT,
      rightAlt: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      jumpAlt: Phaser.Input.Keyboard.KeyCodes.W,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      attackAlt: Phaser.Input.Keyboard.KeyCodes.X,
      parry: Phaser.Input.Keyboard.KeyCodes.K,
      parryAlt: Phaser.Input.Keyboard.KeyCodes.C,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
    });

    this.input.keyboard.on("keydown", () => this.startAudio(), this);
    this.input.on("pointerdown", () => this.startAudio(), this);
    this.createTouchControls();
  }

  createTouchControls() {
    if (!this.sys.game.device.input.touch) return;
    const makeButton = (x, y, symbol, field) => {
      const circle = this.add.circle(x, y, 35, 0x181411, 0.65).setStrokeStyle(2, 0xa67a36, 0.65).setScrollFactor(0).setDepth(50).setInteractive();
      this.add.text(x, y, symbol, { fontFamily: "Georgia", fontSize: "24px", color: "#d2ae5b" }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
      circle.on("pointerdown", () => { this.touchState[field] = true; });
      circle.on("pointerup", () => { this.touchState[field] = false; });
      circle.on("pointerout", () => { this.touchState[field] = false; });
    };
    makeButton(70, 640, "<", "left");
    makeButton(150, 640, ">", "right");
    makeButton(1120, 640, "^", "jump");
    makeButton(1200, 640, "+", "attack");
  }

  createHud() {
    this.hud = this.add.container(32, 30).setScrollFactor(0).setDepth(40);
    const crest = this.add.graphics();
    crest.fillStyle(0x080706, 0.94).fillRect(0, 0, 263, 62);
    crest.lineStyle(4, 0x171412, 1).strokeRect(0, 0, 263, 62);
    crest.lineStyle(1, 0x8c632a, 0.95).strokeRect(3, 3, 257, 56);
    crest.fillStyle(0x2a2018, 1).fillCircle(31, 31, 23);
    crest.lineStyle(3, 0x4b1011, 1).strokeCircle(31, 31, 20);
    crest.fillStyle(0x7e1d1b, 1).fillCircle(31, 31, 15);
    crest.lineStyle(2, 0xc0923f, 0.95).strokeCircle(31, 31, 19);
    crest.lineStyle(3, 0xd0aa55, 0.9).lineBetween(31, 11, 31, 51);
    crest.lineStyle(3, 0xd0aa55, 0.9).lineBetween(18, 31, 44, 31);
    crest.fillStyle(0xc0923f, 0.8).fillTriangle(31, 4, 27, 11, 35, 11);
    crest.fillStyle(0x503414, 1).fillRect(60, 9, 187, 2);
    crest.fillStyle(0x503414, 1).fillRect(60, 51, 187, 2);
    for (let x = 68; x < 246; x += 16) crest.fillStyle(0x8b6228, 0.8).fillRect(x, 7, 2, 6);
    this.hud.add(crest);

    this.healthPips = [];
    for (let i = 0; i < this.gameState.maxHealth; i += 1) {
      const pip = this.add.rectangle(66 + i * 33, 21, 26, 9, 0x8b201d, 1).setOrigin(0, 0.5).setStrokeStyle(1, 0x3f1111, 1);
      this.hud.add(pip);
      this.healthPips.push(pip);
    }
    this.fervourBack = this.add.rectangle(66, 42, 159, 6, 0x211d19, 1).setOrigin(0, 0.5).setStrokeStyle(1, 0x503c24, 1);
    this.fervourBar = this.add.rectangle(68, 42, 0, 4, 0xc0923f, 1).setOrigin(0, 0.5);
    this.hud.add([this.fervourBack, this.fervourBar]);

    this.areaTitle = this.add.text(640, 105, "THE GILDED NAVE", {
      fontFamily: "Georgia",
      fontSize: "25px",
      color: "#d2c19c",
      stroke: "#100d0b",
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41).setAlpha(0);
    this.tweens.add({ targets: this.areaTitle, alpha: 1, duration: 1200, hold: 1700, yoyo: true, delay: 1300 });

    this.bossHud = this.add.container(320, 654).setScrollFactor(0).setDepth(42).setVisible(false);
    this.bossName = this.add.text(320, 0, "THE BISHOP OF EMPTY MERCY", { fontFamily: "Georgia", fontSize: "15px", color: "#cabb9c" }).setOrigin(0.5, 1);
    this.bossBarBack = this.add.rectangle(0, 12, 640, 10, 0x171311, 0.95).setOrigin(0, 0.5).setStrokeStyle(1, 0x745325, 1);
    this.bossBar = this.add.rectangle(2, 12, 636, 6, 0x821f1d, 1).setOrigin(0, 0.5);
    this.bossHud.add([this.bossName, this.bossBarBack, this.bossBar]);
  }

  createAtmosphere() {
    this.dust = this.add.particles(0, 0, "white", {
      x: { min: 0, max: WORLD_WIDTH },
      y: { min: 20, max: 610 },
      lifespan: { min: 5000, max: 9000 },
      speedY: { min: 2, max: 9 },
      speedX: { min: -4, max: 4 },
      scale: { min: 0.4, max: 1.25 },
      alpha: { start: 0.02, end: 0.22 },
      frequency: 115,
      quantity: 1,
      tint: 0xd9c58f,
    }).setDepth(-5);

    const foregroundHaze = this.add.graphics().setScrollFactor(0).setDepth(30);
    foregroundHaze.fillStyle(0x090807, 0.14).fillRect(0, 610, 1280, 110);
    foregroundHaze.fillStyle(0x5b3b21, 0.025).fillRect(0, 0, 1280, 720);

    const vignette = this.add.graphics().setScrollFactor(0).setDepth(35);
    vignette.fillStyle(0x000000, 0.4).fillRect(0, 0, 1280, 26);
    vignette.fillStyle(0x000000, 0.24).fillRect(0, 26, 1280, 30);
    vignette.fillStyle(0x000000, 0.38).fillRect(0, 687, 1280, 33);
    vignette.fillStyle(0x000000, 0.21).fillRect(0, 658, 1280, 29);
    vignette.fillStyle(0x000000, 0.29).fillRect(0, 0, 22, 720);
    vignette.fillRect(1258, 0, 22, 720);
    vignette.fillStyle(0x000000, 0.14).fillRect(22, 0, 20, 720);
    vignette.fillRect(1238, 0, 20, 720);
  }

  createIntro() {
    const intro = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    const image = this.add.image(640, 360, "concept").setDisplaySize(1280, 720);
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x050404, 0.42);
    const title = this.add.text(640, 312, "SORROW OF THE\nGILDED NAVE", {
      align: "center",
      fontFamily: "Georgia",
      fontSize: "46px",
      color: "#dccba4",
      stroke: "#090706",
      strokeThickness: 8,
    }).setOrigin(0.5);
    const sigil = this.add.text(640, 430, "+", { fontFamily: "Georgia", fontSize: "34px", color: "#a97831" }).setOrigin(0.5);
    intro.add([image, shade, title, sigil]);
    this.tweens.add({ targets: intro, alpha: 0, duration: 1200, delay: 900, ease: "Sine.easeInOut", onComplete: () => intro.destroy(true) });
  }

  startAudio() {
    if (this.audioStarted) return;
    this.audioStarted = true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.audioContext = new AudioContext();
    const master = this.audioContext.createGain();
    master.gain.value = 0.09;
    master.connect(this.audioContext.destination);
    this.audioMaster = master;
    [55, 82.4, 110].forEach((frequency, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.15 : 0.035;
      oscillator.connect(gain).connect(master);
      oscillator.start();
    });
  }

  tone(frequency, duration = 0.08, volume = 0.2, type = "square") {
    if (!this.audioContext || !this.audioMaster) return;
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, frequency * 0.7), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(this.audioMaster);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  update(time) {
    if (!this.player?.active || this.gameState.won) return;
    const left = this.keys.left.isDown || this.keys.leftAlt.isDown || this.touchState.left;
    const right = this.keys.right.isDown || this.keys.rightAlt.isDown || this.touchState.right;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.jump) || Phaser.Input.Keyboard.JustDown(this.keys.jumpAlt) || this.consumeTouch("jump");
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.keys.attack) || Phaser.Input.Keyboard.JustDown(this.keys.attackAlt) || this.consumeTouch("attack");
    const parryPressed = Phaser.Input.Keyboard.JustDown(this.keys.parry) || Phaser.Input.Keyboard.JustDown(this.keys.parryAlt);

    if (jumpPressed) this.jumpQueuedAt = time;
    if (this.player.body.blocked.down) this.lastGroundedAt = time;

    if (time > this.attackingUntil && time > this.parryingUntil) {
      if (left === right) {
        this.player.setAccelerationX(0);
      } else {
        const direction = left ? -1 : 1;
        this.player.setAccelerationX(direction * 1150);
        this.player.setFlipX(direction < 0);
      }
    } else {
      this.player.setAccelerationX(0);
    }

    if (time - this.jumpQueuedAt < 120 && time - this.lastGroundedAt < 115 && time > this.attackingUntil) {
      this.player.setVelocityY(-550);
      this.jumpQueuedAt = -999;
      this.lastGroundedAt = -999;
      this.tone(150, 0.08, 0.18, "triangle");
    }

    if (attackPressed && time > this.attackingUntil && time > this.parryingUntil) this.attack(time);
    if (parryPressed && time > this.parryingUntil && time > this.attackingUntil) this.parry(time);
    if (Phaser.Input.Keyboard.JustDown(this.keys.restart) && (this.gameState.health <= 0 || this.gameState.won)) this.scene.restart();

    this.updatePlayerAnimation(time);
    this.updateAttackZone();
    this.updateEnemies(time);
    this.checkBossTrigger();

    this.playerShadow.setPosition(this.player.x, Math.min(FLOOR_Y - 34, this.player.y + 4));
    this.playerShadow.setScale(Phaser.Math.Clamp(1 - Math.abs(this.player.y - 616) / 500, 0.4, 1), 1);
    if (this.player.y > 710) this.killPlayer();
  }

  consumeTouch(field) {
    if (!this.touchState[field]) return false;
    this.touchState[field] = false;
    return true;
  }

  updatePlayerAnimation(time) {
    if (time < this.attackingUntil) {
      return;
    }
    if (time < this.parryingUntil) {
      this.player.anims.stop();
      this.player.setTexture("penitent-attack-animation", 1);
      return;
    }
    if (!this.player.body.blocked.down) {
      this.player.anims.stop();
      this.player.setTexture("penitent-attack-animation", 1);
    } else if (Math.abs(this.player.body.velocity.x) > 35) {
      if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== "run") this.player.play("run");
    } else if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== "idle") {
      this.player.play("idle");
    }
  }

  attack(time) {
    this.attackSerial += 1;
    this.attackingUntil = time + 650;
    this.player.setVelocityX(this.player.flipX ? -55 : 55);
    this.player.play("attack", true);
    this.attackZone.body.enable = false;
    this.time.delayedCall(240, () => { if (this.attackZone.body) this.attackZone.body.enable = true; });
    this.time.delayedCall(430, () => { if (this.attackZone.body) this.attackZone.body.enable = false; });
    this.cameras.main.shake(60, 0.0012);
    this.tone(230, 0.09, 0.24, "sawtooth");
  }

  parry(time) {
    this.parryingUntil = time + 360;
    this.player.setVelocityX(0);
    this.tone(480, 0.08, 0.16, "triangle");
  }

  updateAttackZone() {
    const direction = this.player.flipX ? -1 : 1;
    this.attackZone.setPosition(this.player.x + direction * 42, this.player.y + 2);
  }

  updateEnemies(time) {
    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      const distance = this.player.x - enemy.x;

      if (enemy.kind === "boss") {
        this.updateBoss(enemy, time, distance);
        return;
      }

      if (enemy.kind === "censer") {
        enemy.y = enemy.baseY + Math.sin(time / 500 + enemy.x) * 18;
        enemy.body.updateFromGameObject();
        if (Math.abs(distance) < 420 && time > enemy.nextAttackAt) {
          this.fireProjectile(enemy, distance > 0 ? 1 : -1, 240);
          enemy.nextAttackAt = time + Phaser.Math.Between(1500, 2300);
        }
      } else {
        if (time < (enemy.attackingUntil || 0)) {
          enemy.setVelocityX(0);
          return;
        }
        if (Math.abs(distance) < 86 && time > enemy.nextAttackAt) {
          enemy.attackingUntil = time + 360;
          enemy.nextAttackAt = time + 1250;
          enemy.anims.stop();
          enemy.setTexture("mourner-model", 2);
          enemy.setVelocityX(0);
          this.time.delayedCall(370, () => { if (enemy.active) enemy.play("mourner"); });
          return;
        }
        if (Math.abs(distance) < 280) enemy.direction = Math.sign(distance) || enemy.direction;
        if (enemy.x < enemy.minX) enemy.direction = 1;
        if (enemy.x > enemy.maxX) enemy.direction = -1;
        enemy.setVelocityX(enemy.direction * (Math.abs(distance) < 280 ? 72 : 38));
        enemy.setFlipX(enemy.direction < 0);
      }
    });
  }

  updateBoss(boss, time, distance) {
    if (!this.gameState.bossAwake) return;
    boss.setFlipX(distance < 0);
    if (Math.abs(distance) > 130) boss.setVelocityX(Math.sign(distance) * 48);
    else boss.setVelocityX(0);
    if (time > boss.nextAttackAt) {
      const direction = distance > 0 ? 1 : -1;
      boss.anims.stop();
      boss.setTexture("bishop-model", 2);
      this.fireProjectile(boss, direction, 300);
      this.time.delayedCall(220, () => { if (boss.active) this.fireProjectile(boss, direction, 255); });
      this.time.delayedCall(520, () => { if (boss.active) boss.play("bishop"); });
      boss.nextAttackAt = time + (boss.hp < 7 ? 1050 : 1550);
      this.cameras.main.shake(120, 0.002);
    }
  }

  fireProjectile(source, direction, speed) {
    const projectile = this.projectiles.create(source.x + direction * 25, source.y - 10, "projectile").setDepth(6);
    projectile.setVelocityX(direction * speed);
    projectile.setFlipX(direction < 0);
    projectile.body.setSize(16, 8);
    projectile.setData("damage", source.kind === "boss" ? 2 : 1);
    this.time.delayedCall(3500, () => projectile.active && projectile.destroy());
    this.tone(115, 0.16, 0.12, "sawtooth");
  }

  hitByProjectile(projectile) {
    if (!projectile.active) return;
    if (this.time.now < this.parryingUntil) {
      projectile.destroy();
      this.gameState.fervour = Math.min(100, this.gameState.fervour + 18);
      this.flash(0xd3b15d, 90);
      this.tone(720, 0.12, 0.32, "square");
      this.updateHud();
      return;
    }
    const direction = projectile.body.velocity.x > 0 ? 1 : -1;
    const damage = projectile.getData("damage") || 1;
    projectile.destroy();
    this.hurtPlayer(damage, direction);
  }

  touchEnemy(enemy) {
    if (!enemy.active || this.time.now < this.invulnerableUntil) return;
    if (this.time.now < this.parryingUntil) {
      enemy.setVelocityX(this.player.flipX ? -280 : 280);
      enemy.tint = 0xf4d279;
      this.time.delayedCall(100, () => enemy.active && enemy.clearTint());
      this.gameState.fervour = Math.min(100, this.gameState.fervour + 12);
      this.tone(640, 0.1, 0.28, "square");
      this.updateHud();
      return;
    }
    this.hurtPlayer(enemy.kind === "boss" ? 2 : 1, Math.sign(this.player.x - enemy.x));
  }

  hitEnemy(enemy) {
    if (!enemy.active || enemy.lastHitSerial === this.attackSerial || this.time.now > this.attackingUntil) return;
    enemy.lastHitSerial = this.attackSerial;
    enemy.hp -= 1;
    enemy.setVelocity(this.player.flipX ? -210 : 210, -100);
    if (enemy.kind === "mourner") {
      enemy.anims.stop();
      enemy.setTexture("mourner-model", 3);
      this.time.delayedCall(260, () => { if (enemy.active) enemy.play("mourner"); });
    } else if (enemy.kind === "boss") {
      enemy.anims.stop();
      enemy.setTexture("bishop-model", 3);
      this.time.delayedCall(320, () => { if (enemy.active) enemy.play("bishop"); });
    }
    enemy.setTintFill(0xe0cfad);
    this.time.delayedCall(75, () => enemy.active && enemy.clearTint());
    this.gameState.fervour = Math.min(100, this.gameState.fervour + 9);
    this.tone(95, 0.1, 0.32, "square");
    this.cameras.main.shake(80, 0.0028);
    this.bloodBurst(enemy.x, enemy.y);

    if (enemy.kind === "boss") {
      this.bossBar.displayWidth = 636 * Math.max(0, enemy.hp / enemy.maxHp);
    }
    if (enemy.hp <= 0) this.defeatEnemy(enemy);
    this.updateHud();
  }

  defeatEnemy(enemy) {
    const isBoss = enemy.kind === "boss";
    enemy.body.enable = false;
    this.tweens.add({ targets: enemy, alpha: 0, y: enemy.y + 20, duration: isBoss ? 1100 : 380, onComplete: () => enemy.destroy() });
    if (isBoss) this.defeatBoss();
  }

  hurtPlayer(amount, direction) {
    if (this.time.now < this.invulnerableUntil || this.gameState.health <= 0) return;
    this.gameState.health = Math.max(0, this.gameState.health - amount);
    this.invulnerableUntil = this.time.now + 900;
    this.player.setVelocity(direction * 260, -260);
    this.player.setTintFill(0xd8c6a5);
    this.time.delayedCall(110, () => this.player.active && this.player.clearTint());
    this.tweens.add({ targets: this.player, alpha: 0.28, duration: 70, yoyo: true, repeat: 5 });
    this.cameras.main.shake(180, 0.006);
    this.flash(0x651314, 130);
    this.tone(70, 0.24, 0.36, "sawtooth");
    this.updateHud();
    if (this.gameState.health <= 0) this.killPlayer();
  }

  killPlayer() {
    if (!this.player.active || this.dying) return;
    this.dying = true;
    this.player.setAccelerationX(0).setVelocity(0, 0);
    this.player.body.enable = false;
    this.cameras.main.fadeOut(700, 45, 7, 8);
    const epitaph = this.add.text(640, 330, "PENANCE UNFULFILLED", { fontFamily: "Georgia", fontSize: "30px", color: "#aa2b27", stroke: "#080706", strokeThickness: 7 }).setOrigin(0.5).setScrollFactor(0).setDepth(80).setAlpha(0);
    this.tweens.add({ targets: epitaph, alpha: 1, duration: 500 });
    this.time.delayedCall(1300, () => this.respawn(epitaph));
  }

  respawn(epitaph) {
    this.gameState.deaths += 1;
    this.gameState.health = this.gameState.maxHealth;
    this.gameState.fervour = Math.max(0, this.gameState.fervour - 25);
    this.player.setPosition(this.gameState.checkpointX, 616).setAlpha(1).clearTint();
    this.player.body.enable = true;
    this.dying = false;
    epitaph.destroy();
    this.cameras.main.fadeIn(500, 8, 5, 4);
    this.updateHud();
  }

  activateCheckpoint() {
    if (this.gameState.checkpointX === 2680) return;
    this.gameState.checkpointX = 2680;
    this.gameState.health = this.gameState.maxHealth;
    this.relic.setTint(0xffd679);
    this.tweens.add({ targets: this.relic, y: this.relic.y - 6, duration: 700, yoyo: true, repeat: -1 });
    this.flash(0xd0a54e, 250);
    this.tone(420, 0.7, 0.18, "sine");
    const text = this.add.text(2680, 485, "THE RELIQUARY REMEMBERS", { fontFamily: "Georgia", fontSize: "17px", color: "#d8c69f", stroke: "#080706", strokeThickness: 4 }).setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: text, alpha: 0, y: 470, duration: 1600, delay: 800, onComplete: () => text.destroy() });
    this.updateHud();
  }

  checkBossTrigger() {
    if (this.gameState.bossAwake || this.player.x < 4330) return;
    this.gameState.bossAwake = true;
    this.bossGate.setVisible(true);
    this.bossGate.body.enable = true;
    this.bossGate.refreshBody();
    const boss = this.spawnEnemy("boss", 4850, 616, 14, 4350, 5150);
    boss.maxHp = 14;
    this.boss = boss;
    this.bossHud.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.bossHud, alpha: 1, duration: 800 });
    this.cameras.main.shake(700, 0.004);
    this.tone(58, 1.2, 0.28, "sawtooth");
  }

  defeatBoss() {
    this.gameState.bossDead = true;
    this.gameState.won = true;
    this.bossBar.displayWidth = 0;
    this.cameras.main.shake(1000, 0.009);
    this.flash(0xd4b15c, 600);
    this.tone(110, 1.4, 0.25, "triangle");
    this.time.delayedCall(900, () => {
      this.bossGate.body.enable = false;
      this.tweens.add({ targets: this.bossGate, y: 330, alpha: 0, duration: 900 });
      this.tweens.add({ targets: this.bossHud, alpha: 0, duration: 500 });
      const ending = this.add.container(640, 270).setScrollFactor(0).setDepth(90).setAlpha(0);
      const veil = this.add.rectangle(0, 75, 620, 215, 0x090706, 0.86).setStrokeStyle(2, 0x9b6e2d, 0.75);
      const title = this.add.text(0, 30, "MERCY, AT LAST, IS SILENT", { fontFamily: "Georgia", fontSize: "28px", color: "#d8c7a0" }).setOrigin(0.5);
      const sub = this.add.text(0, 82, "THE GILDED NAVE HAS YIELDED", { fontFamily: "Georgia", fontSize: "14px", color: "#a77d43" }).setOrigin(0.5);
      const mark = this.add.text(0, 132, "+", { fontFamily: "Georgia", fontSize: "30px", color: "#8f2421" }).setOrigin(0.5);
      ending.add([veil, title, sub, mark]);
      this.tweens.add({ targets: ending, alpha: 1, duration: 1100 });
    });
  }

  updateHud() {
    this.healthPips.forEach((pip, index) => {
      pip.setFillStyle(index < this.gameState.health ? 0x9d2923 : 0x332522, index < this.gameState.health ? 1 : 0.6);
    });
    this.fervourBar.displayWidth = 155 * (this.gameState.fervour / 100);
  }

  bloodBurst(x, y) {
    for (let i = 0; i < 8; i += 1) {
      const drop = this.add.rectangle(x, y, Phaser.Math.Between(2, 4), Phaser.Math.Between(2, 6), 0x781d1b, 1).setDepth(7);
      this.tweens.add({ targets: drop, x: x + Phaser.Math.Between(-38, 38), y: y + Phaser.Math.Between(-24, 28), alpha: 0, duration: Phaser.Math.Between(260, 520), onComplete: () => drop.destroy() });
    }
  }

  flash(color, duration) {
    const flash = this.add.rectangle(640, 360, 1280, 720, color, 0.16).setScrollFactor(0).setDepth(70);
    this.tweens.add({ targets: flash, alpha: 0, duration, onComplete: () => flash.destroy() });
  }
}

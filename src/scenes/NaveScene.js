import Phaser from "phaser";
import { createTextures } from "../game/textures.js";

const WORLD_WIDTH = 5400;
const WORLD_HEIGHT = 720;
const BASE_FLOOR_TOP = 616;
const CHECKPOINT_POSITION = { x: 3136, y: 360 };
const PHASE_THREE = {
  enterX: 3264,
  cameraLeft: 2880,
  exitX: 4144,
};
const APSE_GATE = {
  x: 4064,
  openY: 80,
  closedY: 275,
  triggerX: 4280,
};

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
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor("#090807");

    this.gameState = {
      health: 5,
      maxHealth: 5,
      fervour: 0,
      checkpoint: { x: 150, y: BASE_FLOOR_TOP },
      relicActivated: false,
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
    this.cameraMode = "follow";

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
    this.physics.add.collider(this.player, this.gates);
    this.physics.add.collider(this.enemies, this.gates);
    this.physics.add.collider(this.projectiles, this.solids, (projectile) => projectile.destroy());
    this.physics.add.collider(this.projectiles, this.gates, (projectile) => projectile.destroy());
    this.physics.add.overlap(this.player, this.spikes, (player, spike) => {
      const direction = Math.sign(player.x - spike.x) || -1;
      this.hurtPlayer(2, direction);
    });
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

    // Use the character-free side of the concept only as a distant value plate.
    // Heavy tinting and slower parallax prevent its ledges from reading as play.
    const crop = { x: 610, y: 0, width: 1062, height: 800 };
    const artScaleX = 1380 / crop.width;
    for (let panel = 0; panel < 5; panel += 1) {
      const art = this.add.image(panel * 1320 - crop.x * artScaleX, 0, "concept")
        .setOrigin(0, 0)
        .setCrop(crop.x, crop.y, crop.width, crop.height)
        .setScale(artScaleX, 720 / crop.height)
        .setAlpha(panel % 2 === 0 ? 0.3 : 0.22)
        .setTint(panel % 2 === 0 ? 0x777067 : 0x5e5953)
        .setDepth(-36);
      art.setScrollFactor(0.92, 1);
    }

    const veil = this.add.graphics().setDepth(-34);
    veil.fillStyle(0x080706, 0.3).fillRect(0, 0, WORLD_WIDTH, 260);
    veil.fillStyle(0x080706, 0.42).fillRect(0, 260, WORLD_WIDTH, 150);
    veil.fillStyle(0x080706, 0.62).fillRect(0, 410, WORLD_WIDTH, 115);
    veil.fillStyle(0x080706, 0.82).fillRect(0, 525, WORLD_WIDTH, 195);
    veil.setScrollFactor(0.94, 1);

    const architecture = this.add.graphics().setDepth(-20).setScrollFactor(0.965, 1);
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
    const bays = this.add.graphics().setDepth(-17).setScrollFactor(0.955, 1);
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
        .setAlpha(0.38)
        .setTint(index % 2 === 0 ? 0xaaa49a : 0x7c7770)
        .setDepth(-10)
        .setScrollFactor(0.97, 1);
      if (index % 2) statue.setFlipX(true);
    });

    [620, 2150, 4890].forEach((x, index) => {
      this.add.tileSprite(x, 238 + index * 8, 360, 48, "background-railing")
        .setAlpha(0.42)
        .setTint(0x625a50)
        .setDepth(-8)
        .setScrollFactor(0.975, 1);
    });

    const chains = this.add.graphics().setDepth(-6).setScrollFactor(0.95, 1);
    [520, 1710, 3100, 4260].forEach((x, index) => {
      const length = index % 2 === 0 ? 175 : 245;
      chains.lineStyle(3, 0x090807, 1).lineBetween(x, 0, x, length);
      chains.lineStyle(1, 0x80603a, 0.8).lineBetween(x + 2, 0, x + 2, length);
      this.add.image(x, length + 12, "decorative-censer")
        .setScale(0.78)
        .setAlpha(0.55)
        .setDepth(-5)
        .setScrollFactor(0.95, 1);
    });

    const shafts = this.add.graphics().setDepth(-4).setBlendMode(Phaser.BlendModes.ADD).setScrollFactor(0.98, 1);
    shafts.fillStyle(0xe3d0a0, 0.045).fillTriangle(990, 0, 1080, 0, 1270, 500);
    shafts.fillStyle(0xf0d89d, 0.06).fillTriangle(2960, 0, 3060, 0, 3220, 345);
    shafts.fillStyle(0xf1d89d, 0.075).fillTriangle(4310, 0, 4410, 0, 4470, 285);
  }

  createLevel() {
    this.solids = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.gates = this.physics.add.staticGroup();
    this.levelSurfaces = [
      // Phase 1 and the Phase 2 approach share one uninterrupted safety floor.
      { start: 0, end: 1600, top: 616, phase: 1 },
      // Phase 2: four supported 64 px steps, with no alternate lower route.
      { start: 1600, end: 1920, top: 552, phase: 2 },
      { start: 1920, end: 2240, top: 488, phase: 2 },
      { start: 2240, end: 2560, top: 424, phase: 2 },
      { start: 2560, end: 3456, top: 360, phase: 2 },
      // Phase 3: one upward jump and one wide, forgiving downward landing.
      { start: 3552, end: 3808, top: 296, phase: 3 },
      { start: 3872, end: 4192, top: 360, phase: 3 },
      // The boss floor is continuous and terminates in visible architecture.
      { start: 4192, end: WORLD_WIDTH, top: 360, phase: 4 },
    ];

    const supportedSurface = ({ start, end, top }) => {
      const width = end - start;
      const height = WORLD_HEIGHT - top;
      const x = start + width / 2;
      const y = top + height / 2;

      this.add.tileSprite(x, y, width, height, "stone").setDepth(1);
      this.add.rectangle(x, top + 2, width, 4, 0xc4bca8, 0.9).setDepth(2);
      this.add.rectangle(x, top + 7, width, 3, 0x12110f, 0.95).setDepth(2);

      const body = this.solids.create(x, y, "white").setVisible(false);
      body.displayWidth = width;
      body.displayHeight = height;
      body.refreshBody();
    };

    this.levelSurfaces.forEach(supportedSurface);

    const pits = this.add.graphics().setDepth(0);
    pits.fillStyle(0x030303, 0.97);
    pits.fillRect(3456, 360, 96, WORLD_HEIGHT - 360);
    pits.fillRect(3808, 296, 64, WORLD_HEIGHT - 296);

    const addSpikeBed = (start, end, baseY, count) => {
      const width = end - start;
      this.add.rectangle(start + width / 2, baseY - 3, width, 6, 0x4c281c, 1)
        .setStrokeStyle(1, 0x8b5c2e, 0.8)
        .setDepth(1);

      for (let i = 0; i < count; i += 1) {
        const spike = this.spikes.create(start + 16 + i * 32, baseY, "spike")
          .setOrigin(0.5, 1)
          .setDepth(3);
        spike.refreshBody();
        spike.body.setSize(24, 32).setOffset(4, 4);
      }
    };

    addSpikeBed(3808, 3872, 360, 2);

    this.relic = this.physics.add.staticImage(CHECKPOINT_POSITION.x, CHECKPOINT_POSITION.y, "reliquary")
      .setOrigin(0.5, 1)
      .setDepth(4);
    this.relic.refreshBody();
    this.relic.body.setSize(44, 72).setOffset(4, 8);

    const apse = this.add.graphics().setDepth(0);
    apse.fillStyle(0x060504, 0.96).fillRoundedRect(APSE_GATE.x - 82, 18, 164, 342, 72);
    apse.lineStyle(7, 0x2f251c, 1).strokeRoundedRect(APSE_GATE.x - 82, 18, 164, 342, 72);
    apse.lineStyle(2, 0x8b6228, 0.86).strokeRoundedRect(APSE_GATE.x - 70, 30, 140, 318, 62);
    apse.lineStyle(1, 0xc0923f, 0.5).strokeRoundedRect(APSE_GATE.x - 62, 38, 124, 302, 56);
    this.apseLight = this.add.rectangle(APSE_GATE.x, 190, 10, 316, 0xe0d4b8, 0.24)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(0);
    this.tweens.add({ targets: this.apseLight, alpha: 0.12, duration: 900, yoyo: true, repeat: -1 });

    this.bossGate = this.gates.create(APSE_GATE.x, APSE_GATE.openY, "gate")
      .setDepth(3)
      .setVisible(true);
    this.bossGate.body.enable = false;

    const entranceWallWidth = 64;
    const entranceWallHeight = BASE_FLOOR_TOP;
    this.add.tileSprite(entranceWallWidth / 2, entranceWallHeight / 2, entranceWallWidth, entranceWallHeight, "stone").setDepth(1);
    this.add.rectangle(entranceWallWidth - 2, entranceWallHeight / 2, 4, entranceWallHeight, 0xa7a398, 0.5).setDepth(2);
    const entranceBody = this.solids.create(entranceWallWidth / 2, entranceWallHeight / 2, "white").setVisible(false);
    entranceBody.displayWidth = entranceWallWidth;
    entranceBody.displayHeight = entranceWallHeight;
    entranceBody.refreshBody();

    const terminalWallWidth = 80;
    const terminalWallHeight = 360;
    const terminalWallX = WORLD_WIDTH - terminalWallWidth / 2;
    this.add.tileSprite(terminalWallX, terminalWallHeight / 2, terminalWallWidth, terminalWallHeight, "stone").setDepth(1);
    this.add.rectangle(terminalWallX - terminalWallWidth / 2 + 2, terminalWallHeight / 2, 4, terminalWallHeight, 0xa7a398, 0.62).setDepth(2);
    const terminalBody = this.solids.create(terminalWallX, terminalWallHeight / 2, "white").setVisible(false);
    terminalBody.displayWidth = terminalWallWidth;
    terminalBody.displayHeight = terminalWallHeight;
    terminalBody.refreshBody();

    const candleBank = (x, surfaceY, count, seed) => {
      for (let i = 0; i < count; i += 1) {
        const candleX = x + i * 8;
        const candleHeight = 10 + ((seed * 7 + i * 11) % 14);
        const candle = this.add.rectangle(candleX, surfaceY - candleHeight / 2, 3, candleHeight, 0xbeb49d, 0.58).setDepth(0);
        const flame = this.add.rectangle(candleX, candle.y - candle.height / 2 - 4, 2, 5, 0xd39b40, 0.7).setDepth(0);
        this.tweens.add({ targets: flame, alpha: 0.25, scaleY: 1.35, duration: 420 + i * 70, yoyo: true, repeat: -1 });
      }
    };

    candleBank(300, 616, 3, 1);
    candleBank(1110, 616, 3, 2);
    candleBank(3050, 360, 3, 3);
    candleBank(5150, 360, 3, 5);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(150, BASE_FLOOR_TOP, "penitent-idle-animation", 0)
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

    this.playerShadow = this.add.ellipse(this.player.x, BASE_FLOOR_TOP + 2, 46, 9, 0x000000, 0.58).setDepth(4);
  }

  createEnemies() {
    this.enemies = this.physics.add.group({ allowGravity: true });
    this.projectiles = this.physics.add.group({ allowGravity: false });
  }

  spawnEnemy(kind, x, y, hp, minX, maxX) {
    const key = kind === "censer" ? "censer-1" : kind === "boss" ? "bishop-model" : "mourner-model";
    const enemy = this.enemies.create(x, y, key).setDepth(5);
    enemy.kind = kind;
    enemy.hp = hp;
    enemy.minX = minX;
    enemy.maxX = maxX;
    enemy.direction = -1;
    enemy.nextAttackAt = this.time.now + Phaser.Math.Between(600, 1500);
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
    foregroundHaze.fillStyle(0x090807, 0.08).fillRect(0, 0, 1280, 44);
    foregroundHaze.fillStyle(0x090807, 0.08).fillRect(0, 0, 18, 720);
    foregroundHaze.fillRect(1262, 0, 18, 720);

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
    if (!this.player?.active) return;
    if (this.gameState.won) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) this.scene.restart();
      return;
    }
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
    if (Phaser.Input.Keyboard.JustDown(this.keys.restart) && this.gameState.health <= 0) this.scene.restart();

    this.updatePlayerAnimation(time);
    this.updateAttackZone();
    this.updateEnemies(time);
    this.updateTutorialCamera();
    this.checkBossTrigger();

    const grounded = this.player.body.blocked.down;
    this.playerShadow.setVisible(grounded);
    if (grounded) this.playerShadow.setPosition(this.player.x, this.player.y + 2).setScale(1, 1);
    if (this.player.y > 710) this.killPlayer();
  }

  updateTutorialCamera() {
    const camera = this.cameras.main;

    if (this.cameraMode === "follow" && this.player.x >= PHASE_THREE.enterX && !this.gameState.bossAwake) {
      this.cameraMode = "phase-three";
      camera.stopFollow();
      camera.setScroll(PHASE_THREE.cameraLeft, 0);
      return;
    }

    if (this.cameraMode === "phase-three" && this.player.x < PHASE_THREE.enterX - 96) {
      this.cameraMode = "follow";
      camera.startFollow(this.player, true, 0.09, 0.08, -220, 50);
      camera.setDeadzone(170, 90);
      return;
    }

    if (this.cameraMode === "phase-three" && this.player.x >= PHASE_THREE.exitX) {
      this.cameraMode = "boss";
      camera.pan(4740, 360, 520, "Sine.easeInOut", true);
    }
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
    if (boss.x < boss.minX) boss.body.reset(boss.minX, boss.y);
    if (boss.x > boss.maxX) boss.body.reset(boss.maxX, boss.y);
    boss.setFlipX(distance < 0);
    let movement = Math.abs(distance) > 130 ? Math.sign(distance) * 48 : 0;
    if ((movement < 0 && boss.x <= boss.minX) || (movement > 0 && boss.x >= boss.maxX)) movement = 0;
    boss.setVelocityX(movement);
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
    const checkpoint = this.gameState.checkpoint;
    this.projectiles.clear(true, true);
    this.player.body.enable = true;
    this.player.body.reset(checkpoint.x, checkpoint.y);
    this.player.setAlpha(1).clearTint();
    this.player.setAccelerationX(0).setVelocity(0, 0);
    this.attackZone.body.enable = false;
    this.jumpQueuedAt = -999;
    this.lastGroundedAt = this.time.now;
    this.attackingUntil = 0;
    this.parryingUntil = 0;
    this.invulnerableUntil = this.time.now + 1200;

    if (this.gameState.bossAwake && this.boss?.active) {
      this.boss.body.reset(4860, 360);
      this.boss.setVelocity(0, 0).setAlpha(1).clearTint();
      this.boss.attackingUntil = 0;
      this.boss.nextAttackAt = this.time.now + 1400;
      this.boss.play("bishop", true);
      this.cameraMode = "boss";
      this.cameras.main.stopFollow();
      this.cameras.main.setScroll(4100, 0);
    } else {
      this.cameraMode = "follow";
      this.cameras.main.startFollow(this.player, true, 0.09, 0.08, -220, 50);
      this.cameras.main.setDeadzone(170, 90);
    }

    this.dying = false;
    epitaph.destroy();
    this.cameras.main.fadeIn(500, 8, 5, 4);
    this.updateHud();
  }

  activateCheckpoint() {
    if (this.gameState.relicActivated) return;
    this.gameState.relicActivated = true;
    this.gameState.checkpoint = { ...CHECKPOINT_POSITION };
    this.gameState.health = this.gameState.maxHealth;
    this.relic.body.enable = false;
    this.relic.setTint(0xffd679);
    this.tweens.add({ targets: this.relic, y: this.relic.y - 6, duration: 700, yoyo: true, repeat: -1 });
    this.flash(0xd0a54e, 250);
    this.tone(420, 0.7, 0.18, "sine");
    const text = this.add.text(CHECKPOINT_POSITION.x, 256, "THE RELIQUARY REMEMBERS", { fontFamily: "Georgia", fontSize: "17px", color: "#d8c69f", stroke: "#080706", strokeThickness: 4 }).setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: text, alpha: 0, y: 240, duration: 1600, delay: 800, onComplete: () => text.destroy() });
    this.updateHud();
  }

  checkBossTrigger() {
    if (this.gameState.bossAwake || this.player.x < APSE_GATE.triggerX) return;
    this.gameState.bossAwake = true;
    this.gameState.checkpoint = { x: 4260, y: 360 };
    this.tweens.add({
      targets: this.bossGate,
      y: APSE_GATE.closedY,
      duration: 520,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.bossGate.refreshBody();
        this.bossGate.body.enable = true;
      },
    });
    const boss = this.spawnEnemy("boss", 4860, 360, 14, 4500, 5260);
    boss.maxHp = 14;
    boss.nextAttackAt = this.time.now + 1400;
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
      this.tweens.add({ targets: this.bossGate, y: APSE_GATE.openY, alpha: 1, duration: 900 });
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

import Phaser from "phaser";
import { NaveAudio } from "../game/audio.js";
import { createTextures } from "../game/textures.js";
import { ENVIRONMENT_SPEC, HUD_SPEC, assertGridAligned } from "../game/layout-spec.js";
import { GILDED_NAVE_KIT } from "../game/kitbash/gilded-nave-kit.js";
import { GILDED_NAVE_LEVEL, NAVE_REVIEW_VIEWS } from "../game/kitbash/gilded-nave-level.js";
import { validateNaveLevelManifest, validateNaveLevelTextures } from "../game/kitbash/validate-level-manifest.js";

const WORLD_WIDTH = GILDED_NAVE_LEVEL.world.width;
const WORLD_HEIGHT = GILDED_NAVE_LEVEL.world.height;
const BASE_FLOOR_TOP = GILDED_NAVE_LEVEL.world.baseFloorTop;
const CHECKPOINT_POSITION = GILDED_NAVE_LEVEL.traversal.checkpoint.respawn;
const PHASE_THREE = GILDED_NAVE_LEVEL.camera.phaseThree;
const APSE_GATE = GILDED_NAVE_LEVEL.apse.gate;
const REVIEW_VIEWS = NAVE_REVIEW_VIEWS;

export class NaveScene extends Phaser.Scene {
  constructor() {
    super("nave");
  }

  preload() {
    GILDED_NAVE_LEVEL.resources.images.forEach(({ key, url }) => this.load.image(key, url));
    this.load.spritesheet("penitent-idle-animation", "/assets/characters/penitent-idle-animation.png", { frameWidth: 360, frameHeight: 320 });
    this.load.spritesheet("penitent-run-animation", "/assets/characters/penitent-run-animation.png", { frameWidth: 360, frameHeight: 320 });
    this.load.spritesheet("penitent-attack-animation", "/assets/characters/penitent-attack-animation.png", { frameWidth: 360, frameHeight: 320 });
    this.load.spritesheet("mourner-model", "/assets/characters/mourner-sheet.png", { frameWidth: 362, frameHeight: 250 });
    this.load.spritesheet("bishop-model", "/assets/characters/bishop-sheet.png", { frameWidth: 362, frameHeight: 320 });
  }

  create() {
    validateNaveLevelManifest(GILDED_NAVE_LEVEL, GILDED_NAVE_KIT);
    createTextures(this);
    validateNaveLevelTextures(this, GILDED_NAVE_KIT);
    this.createCharacterAnimations();
    this.audioDirector = new NaveAudio(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.audioDirector?.stop());
    if (this.sound.context?.state === "running") this.audioDirector.start();
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor(GILDED_NAVE_LEVEL.world.cameraBackground);
    const requestedReviewView = import.meta.env.DEV
      ? new URLSearchParams(globalThis.location.search).get("view")
      : null;
    this.reviewView = requestedReviewView && REVIEW_VIEWS[requestedReviewView]
      ? requestedReviewView
      : null;

    this.gameState = {
      health: 5,
      maxHealth: 5,
      fervour: 0,
      checkpoint: { ...GILDED_NAVE_LEVEL.world.initialCheckpoint },
      relicActivated: false,
      bossAwake: false,
      bossDead: false,
      won: false,
      deaths: 0,
      resourceCount: 0,
      itemCharges: 3,
      maxItemCharges: 3,
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
    this.isClimbing = false;
    this.activeLadder = null;

    this.drawCathedral();
    this.createLevel();
    this.createPlayer();
    this.createEnemies();
    this.createInput();
    this.createHud();
    this.createAtmosphere();
    if (!this.reviewView) this.createIntro();

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
    this.physics.add.overlap(this.player, this.relicTrigger, () => this.activateCheckpoint());

    this.cameras.main.startFollow(this.player, true, 0.09, 0.08, -220, 50);
    this.cameras.main.setDeadzone(170, 90);
    const review = REVIEW_VIEWS[this.reviewView];
    if (review) {
      this.player.body.reset(review.playerX, review.playerY);
      this.player.setAcceleration(0, 0).setVelocity(0, 0);
      this.cameraMode = review.cameraMode;
      this.cameras.main.stopFollow();
      this.cameras.main.setScroll(review.scrollX, 0);
      this.areaTitle.setVisible(false);
    }
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
    this.backgroundLayers = { far: [], mid: [], near: [] };
    const resolveAsset = (assetId) => GILDED_NAVE_KIT.assets[assetId];
    const register = (layer, object) => {
      object.setDepth(layer.depth).setScrollFactor(layer.scrollFactor, 1);
      this.backgroundLayers[layer.id].push(object);
      return object;
    };

    GILDED_NAVE_LEVEL.background.layers.forEach((layer) => {
      layer.placements.forEach((placement) => {
        if (placement.kind === "solid") {
          const graphics = register(layer, this.add.graphics());
          graphics.fillStyle(placement.color, placement.alpha).fillRect(
            placement.rect.x,
            placement.rect.y,
            placement.rect.width,
            placement.rect.height,
          );
          return;
        }

        if (placement.kind === "tile") {
          const asset = resolveAsset(placement.asset);
          const tile = this.add.tileSprite(
            placement.rect.x,
            placement.rect.y,
            placement.rect.width,
            placement.rect.height,
            asset.texture,
          ).setOrigin(...asset.origin).setAlpha(placement.alpha ?? 1);
          if (placement.tint !== undefined) tile.setTint(placement.tint);
          register(layer, tile);
          return;
        }

        if (placement.kind === "image") {
          const asset = resolveAsset(placement.asset);
          const image = this.add.image(placement.at.x, placement.at.y, asset.texture)
            .setOrigin(...asset.origin)
            .setAlpha(placement.alpha ?? 1);
          if (placement.tint !== undefined) image.setTint(placement.tint);
          register(layer, image);
          return;
        }

        if (placement.kind === "repeat") {
          const asset = resolveAsset(placement.asset);
          for (let index = 0; index < placement.count; index += 1) {
            const image = this.add.image(
              placement.at.x + placement.step.x * index,
              placement.at.y + placement.step.y * index,
              asset.texture,
            ).setOrigin(...asset.origin).setAlpha(placement.alpha ?? 1);
            const tints = placement.alternatingTints;
            if (tints?.length) image.setTint(tints[index % tints.length]);
            register(layer, image);
          }
          return;
        }

        if (placement.kind === "rects") {
          const graphics = register(layer, this.add.graphics());
          placement.rects.forEach((rect) => {
            graphics.fillStyle(rect.color, rect.alpha).fillRect(rect.x, rect.y, rect.width, rect.height);
          });
          return;
        }

        if (placement.kind === "triangles") {
          const graphics = this.add.graphics();
          if (placement.blendMode === "ADD") graphics.setBlendMode(Phaser.BlendModes.ADD);
          register(layer, graphics);
          placement.triangles.forEach(({ points, color, alpha }) => {
            graphics.fillStyle(color, alpha).fillTriangle(...points.flat());
          });
          return;
        }

        if (placement.kind === "recipe" && placement.recipe === "hangingCenser") {
          const recipe = GILDED_NAVE_KIT.recipes.hangingCenser;
          const link = resolveAsset(recipe.linkAsset);
          const terminal = resolveAsset(recipe.terminalAsset);
          for (let offsetY = 0; offsetY < placement.length; offsetY += recipe.linkStrideY) {
            register(layer, this.add.image(
              placement.at.x - link.size[0] / 2 + ((offsetY / recipe.linkStrideY) % 2),
              placement.at.y + offsetY,
              link.texture,
            ).setOrigin(...link.origin));
          }
          register(layer, this.add.image(
            placement.at.x + recipe.terminalOffset[0],
            placement.at.y + placement.length + recipe.terminalOffset[1],
            terminal.texture,
          ).setOrigin(...terminal.origin));
        }
      });
    });
  }

  createLevel() {
    this.solids = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.gates = this.physics.add.staticGroup();
    this.ladders = this.physics.add.staticGroup();
    this.levelSurfaces = GILDED_NAVE_LEVEL.traversal.surfaces;
    const surfaceRecipe = GILDED_NAVE_KIT.recipes.gildedSurface;
    const supportedSurface = ({
      id,
      start,
      end,
      top,
      variantSeed,
      underhangSeed,
      fillToBottom = false,
      brokenLeft = false,
      brokenRight = false,
    }) => {
      assertGridAligned(start, "surface start");
      assertGridAligned(end, "surface end");
      assertGridAligned(top, "surface top", ENVIRONMENT_SPEC.surfaceOriginY);
      const width = end - start;
      if (width % surfaceRecipe.moduleWidth !== 0) {
        throw new Error(`${id} width ${width} must use ${surfaceRecipe.moduleWidth}px modules.`);
      }
      const height = WORLD_HEIGHT - top;
      const visualHeight = fillToBottom ? height : Math.min(height, surfaceRecipe.elevatedFaceHeight);
      const x = start + width / 2;
      const y = top + height / 2;

      for (let moduleX = start; moduleX < end; moduleX += surfaceRecipe.moduleWidth) {
        const localModuleIndex = (moduleX - start) / surfaceRecipe.moduleWidth;
        const variantIndex = (localModuleIndex + variantSeed) % surfaceRecipe.variants.length;
        const variant = surfaceRecipe.variants[variantIndex];
        const isFirst = moduleX === start;
        const isLast = moduleX === end - surfaceRecipe.moduleWidth;

        if (brokenLeft && isFirst) {
          this.add.image(moduleX, top, surfaceRecipe.caps.brokenLeft.outer).setOrigin(0, 0).setDepth(surfaceRecipe.depths.cap);
          this.add.image(moduleX + 32, top, surfaceRecipe.caps.brokenLeft.inner).setOrigin(0, 0).setDepth(surfaceRecipe.depths.face);
        } else if (brokenRight && isLast) {
          this.add.image(moduleX, top, surfaceRecipe.caps.brokenRight.inner).setOrigin(0, 0).setDepth(surfaceRecipe.depths.face);
          this.add.image(moduleX + 32, top, surfaceRecipe.caps.brokenRight.outer).setOrigin(0, 0).setDepth(surfaceRecipe.depths.cap);
        } else {
          this.add.image(moduleX, top, variant.top).setOrigin(0, 0).setDepth(surfaceRecipe.depths.face);
        }

        if (visualHeight > 32) {
          this.add.tileSprite(moduleX, top + 32, surfaceRecipe.moduleWidth, visualHeight - 32, variant.fill)
            .setOrigin(0, 0)
            .setDepth(surfaceRecipe.depths.face);
        }
        const isBrokenModule = (brokenLeft && isFirst) || (brokenRight && isLast);
        const underhangRule = surfaceRecipe.underhangRule;
        const excluded = (localModuleIndex + underhangSeed) % underhangRule.modulus === underhangRule.excludedRemainder;
        if (!fillToBottom && !(underhangRule.excludeBroken && isBrokenModule) && !excluded) {
          this.add.image(moduleX, top + visualHeight, variant.underhang)
            .setOrigin(0, 0)
            .setDepth(surfaceRecipe.depths.underhang);
        }
      }

      const body = this.solids.create(x, y, "white").setVisible(false);
      body.displayWidth = width;
      body.displayHeight = height;
      body.refreshBody();
    };

    this.levelSurfaces.forEach(supportedSurface);

    const pits = this.add.graphics().setDepth(GILDED_NAVE_KIT.depths.void);
    GILDED_NAVE_LEVEL.traversal.pits.forEach((pit) => {
      pits.fillStyle(pit.color, pit.alpha).fillRect(pit.x, pit.y, pit.width, pit.height);
    });

    this.ladderArt = [];
    GILDED_NAVE_LEVEL.traversal.ladders.forEach((placement) => {
      const recipe = GILDED_NAVE_KIT.recipes[placement.recipe];
      const asset = GILDED_NAVE_KIT.assets[recipe.asset];
      const centerX = placement.x + recipe.sensor.offsetX;
      assertGridAligned(placement.x, "ladder x");
      assertGridAligned(placement.y, "ladder y", ENVIRONMENT_SPEC.surfaceOriginY);
      this.ladderArt.push(this.add.image(placement.x, placement.y, asset.texture)
        .setOrigin(...asset.origin)
        .setDepth(GILDED_NAVE_KIT.depths.interactionArt));
      const ladder = this.ladders.create(
        centerX,
        placement.y + recipe.sensor.offsetY,
        "white",
      )
        .setOrigin(...recipe.sensor.origin)
        .setVisible(false);
      ladder.displayWidth = recipe.sensor.width;
      ladder.displayHeight = recipe.sensor.height;
      ladder.refreshBody();
      ladder.setData({
        id: placement.id,
        centerX,
        upperX: placement.upperExit.x,
        upperY: placement.upperExit.y,
        lowerX: placement.lowerExit.x,
        lowerY: placement.lowerExit.y,
      });
    });

    GILDED_NAVE_LEVEL.traversal.hazards.forEach((hazard) => {
      const recipe = GILDED_NAVE_KIT.recipes[hazard.recipe];
      const asset = GILDED_NAVE_KIT.assets[recipe.asset];
      for (let trapX = hazard.start; trapX < hazard.end; trapX += recipe.moduleWidth) {
        const spike = this.spikes.create(trapX + recipe.moduleWidth / 2, hazard.baseY, asset.texture)
          .setOrigin(...asset.origin)
          .setDepth(GILDED_NAVE_KIT.depths.decoration);
        spike.refreshBody();
        spike.body.setSize(recipe.sensor.width, recipe.sensor.height)
          .setOffset(recipe.sensor.offsetX, recipe.sensor.offsetY);
      }
    });

    const checkpoint = GILDED_NAVE_LEVEL.traversal.checkpoint;
    const checkpointRecipe = GILDED_NAVE_KIT.recipes[checkpoint.recipe];
    const checkpointAsset = GILDED_NAVE_KIT.assets[checkpointRecipe.asset];
    this.relic = this.add.image(checkpoint.x, checkpoint.y, checkpointAsset.texture)
      .setOrigin(...checkpointAsset.origin)
      .setDepth(GILDED_NAVE_KIT.depths.interactionArt);
    this.relicTrigger = this.physics.add.staticImage(
      checkpoint.x + checkpointRecipe.sensor.offsetX,
      checkpoint.y + checkpointRecipe.sensor.offsetY,
      "white",
    )
      .setVisible(false);
    this.relicTrigger.displayWidth = checkpointRecipe.sensor.width;
    this.relicTrigger.displayHeight = checkpointRecipe.sensor.height;
    this.relicTrigger.refreshBody();

    const apseSpec = GILDED_NAVE_LEVEL.apse;
    const apse = this.add.graphics().setDepth(GILDED_NAVE_KIT.depths.void);
    apseSpec.architecture.fills.forEach((fill) => {
      apse.fillStyle(fill.color, fill.alpha).fillRect(fill.x, fill.y, fill.width, fill.height);
    });
    apseSpec.architecture.strokes.forEach((stroke) => {
      apse.lineStyle(stroke.lineWidth, stroke.color, stroke.alpha)
        .strokeRect(stroke.x, stroke.y, stroke.width, stroke.height);
    });
    const light = apseSpec.light;
    this.apseLight = this.add.rectangle(light.x, light.y, light.width, light.height, light.color, light.alpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(GILDED_NAVE_KIT.depths.void);
    this.tweens.add({ targets: this.apseLight, alpha: light.pulseAlpha, duration: light.duration, yoyo: true, repeat: -1 });

    const gateAsset = GILDED_NAVE_KIT.assets[APSE_GATE.asset];
    this.bossGate = this.gates.create(APSE_GATE.x, APSE_GATE.openY, gateAsset.texture)
      .setDepth(GILDED_NAVE_KIT.depths.decoration)
      .setVisible(true);
    this.bossGate.body.enable = false;

    GILDED_NAVE_LEVEL.traversal.boundaries.forEach((boundary) => {
      const asset = GILDED_NAVE_KIT.assets[boundary.asset];
      const { x, y, width, height } = boundary.rect;
      this.add.tileSprite(x, y, width, height, asset.texture)
        .setOrigin(...asset.origin)
        .setDepth(GILDED_NAVE_KIT.depths.surface);
      const body = this.solids.create(x + width / 2, y + height / 2, "white").setVisible(false);
      body.displayWidth = width;
      body.displayHeight = height;
      body.refreshBody();
    });

    GILDED_NAVE_LEVEL.dressing.placements.forEach((placement) => {
      if (placement.kind === "image") {
        const asset = GILDED_NAVE_KIT.assets[placement.asset];
        this.add.image(placement.at.x, placement.at.y, asset.texture)
          .setOrigin(...asset.origin)
          .setDepth(GILDED_NAVE_KIT.depths.decoration);
        return;
      }
      if (placement.kind === "recipe" && placement.recipe === "candelabrum") {
        const recipe = GILDED_NAVE_KIT.recipes.candelabrum;
        const root = GILDED_NAVE_KIT.assets[recipe.rootAsset];
        const flame = GILDED_NAVE_KIT.assets[recipe.flameAsset];
        this.add.image(placement.at.x, placement.at.y, root.texture)
          .setOrigin(...root.origin)
          .setDepth(GILDED_NAVE_KIT.depths.decoration);
        recipe.flameOffsets.forEach(([offsetX, offsetY]) => {
          this.add.sprite(placement.at.x + offsetX, placement.at.y + offsetY, flame.texture)
            .setOrigin(...flame.origin)
            .setDepth(GILDED_NAVE_KIT.depths.interactionArt)
            .play(flame.animation);
        });
      }
    });
  }

  createPlayer() {
    const spawn = GILDED_NAVE_LEVEL.world.playerSpawn;
    this.player = this.physics.add.sprite(spawn.x, spawn.y, "penitent-idle-animation", 0)
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

    this.playerShadow = this.add.ellipse(this.player.x, spawn.y + 2, 46, 9, 0x000000, 0.58).setDepth(4);
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
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      upAlt: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      downAlt: Phaser.Input.Keyboard.KeyCodes.S,
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
    const status = HUD_SPEC.status;
    this.hud = this.add.container(status.x, status.y).setScrollFactor(0).setDepth(40);
    const statusFrame = this.add.image(0, 0, "hud-status-frame").setOrigin(0, 0);
    const crest = this.add.image(status.crest.x, status.crest.y, "hud-crest").setOrigin(0, 0);
    const healthRail = this.add.image(status.healthRail.x, status.healthRail.y, "hud-health-rail").setOrigin(0, 0);
    const fervourRail = this.add.image(status.fervourRail.x, status.fervourRail.y, "hud-fervour-rail").setOrigin(0, 0);
    this.fervourBar = this.add.image(status.fervourFill.x, status.fervourFill.y, "hud-fervour-fill").setOrigin(0, 0);
    this.hud.add([statusFrame, crest, healthRail, fervourRail, this.fervourBar]);

    this.healthPips = [];
    for (let i = 0; i < status.healthPips.count; i += 1) {
      const pip = this.add.image(
        status.healthPips.x + i * status.healthPips.stride,
        status.healthPips.y,
        "hud-health-pip-full",
      ).setOrigin(0, 0);
      this.hud.add(pip);
      this.healthPips.push(pip);
    }

    this.itemSlots = [];
    for (let i = 0; i < status.itemSlots.count; i += 1) {
      const slot = this.add.image(
        status.itemSlots.startX + i * status.itemSlots.stride,
        status.itemSlots.y,
        "hud-vial-full",
      ).setOrigin(0, 0);
      this.hud.add(slot);
      this.itemSlots.push(slot);
    }

    const resource = HUD_SPEC.resource;
    this.resourceHud = this.add.container(resource.x, resource.y).setScrollFactor(0).setDepth(40);
    const resourceFrame = this.add.image(0, 0, "hud-resource-frame").setOrigin(0, 0);
    const resourceSigil = this.add.image(resource.sigil.x, resource.sigil.y, "hud-resource-sigil").setOrigin(0, 0);
    this.resourceHud.add([resourceFrame, resourceSigil]);
    this.resourceDigits = [];
    for (let i = 0; i < resource.digitField.maxDigits; i += 1) {
      const digit = this.add.image(0, resource.digitField.y, "hud-digit-blank").setOrigin(0, 0).setVisible(false);
      this.resourceHud.add(digit);
      this.resourceDigits.push(digit);
    }
    this.lastRenderedResourceCount = null;

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
    this.updateHud();
  }

  createAtmosphere() {
    const atmosphere = GILDED_NAVE_LEVEL.atmosphere;
    const { depth: dustDepth, ...dustConfig } = atmosphere.dust;
    this.dust = this.add.particles(0, 0, "white", dustConfig).setDepth(dustDepth);

    const foregroundHaze = this.add.graphics().setScrollFactor(0).setDepth(30);
    atmosphere.hazeRects.forEach((rect) => {
      foregroundHaze.fillStyle(rect.color, rect.alpha).fillRect(rect.x, rect.y, rect.width, rect.height);
    });

    const vignette = this.add.graphics().setScrollFactor(0).setDepth(35);
    atmosphere.vignetteRects.forEach((rect) => {
      vignette.fillStyle(rect.color, rect.alpha).fillRect(rect.x, rect.y, rect.width, rect.height);
    });
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
    this.audioDirector?.start();
  }

  tone(frequency, duration = 0.08, volume = 0.2, type = "sine") {
    this.audioDirector?.tone(frequency, duration, volume, type);
  }

  update(time) {
    if (!this.player?.active) return;
    if (this.gameState.won) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) this.scene.restart();
      return;
    }
    const left = this.keys.left.isDown || this.keys.leftAlt.isDown || this.touchState.left;
    const right = this.keys.right.isDown || this.keys.rightAlt.isDown || this.touchState.right;
    const up = this.keys.up.isDown || this.keys.upAlt.isDown;
    const down = this.keys.down.isDown || this.keys.downAlt.isDown;
    const jumpOffPressed = Phaser.Input.Keyboard.JustDown(this.keys.jump);
    const jumpPressed = jumpOffPressed || Phaser.Input.Keyboard.JustDown(this.keys.jumpAlt) || this.consumeTouch("jump");
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.keys.attack) || Phaser.Input.Keyboard.JustDown(this.keys.attackAlt) || this.consumeTouch("attack");
    const parryPressed = Phaser.Input.Keyboard.JustDown(this.keys.parry) || Phaser.Input.Keyboard.JustDown(this.keys.parryAlt);
    const ladder = this.isClimbing ? this.activeLadder : this.findOverlappingLadder();

    if (!this.isClimbing && ladder && (up || down)) this.startClimbing(ladder);
    if (this.isClimbing) {
      this.updateLadderMovement({ up, down, left, right, jumpOffPressed });
    } else {
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
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.restart) && this.gameState.health <= 0) this.scene.restart();

    this.updatePlayerAnimation(time);
    this.updateAttackZone();
    this.updateEnemies(time);
    this.updateTutorialCamera();
    this.checkBossTrigger();

    const grounded = this.player.body.blocked.down;
    this.playerShadow.setVisible(grounded && !this.isClimbing);
    if (grounded) this.playerShadow.setPosition(this.player.x, this.player.y + 2).setScale(1, 1);
    if (this.player.y > 710) this.killPlayer();
  }

  findOverlappingLadder() {
    let found = null;
    this.physics.overlap(this.player, this.ladders, (_player, ladder) => {
      if (!found) found = ladder;
    });
    return found;
  }

  startClimbing(ladder) {
    this.isClimbing = true;
    this.activeLadder = ladder;
    this.player.body.allowGravity = false;
    this.player.setAcceleration(0, 0).setVelocity(0, 0).setX(ladder.getData("centerX"));
    this.jumpQueuedAt = -999;
  }

  stopClimbing() {
    this.isClimbing = false;
    this.activeLadder = null;
    this.player.body.allowGravity = true;
  }

  updateLadderMovement({ up, down, left, right, jumpOffPressed }) {
    const ladder = this.activeLadder;
    if (!ladder?.active) {
      this.stopClimbing();
      return;
    }

    if (jumpOffPressed) {
      const direction = left === right ? (this.player.flipX ? -1 : 1) : (left ? -1 : 1);
      this.stopClimbing();
      this.player.setVelocity(direction * 180, -360);
      return;
    }

    const upperY = ladder.getData("upperY");
    const lowerY = ladder.getData("lowerY");
    if (up && this.player.y <= upperY + 8) {
      const upperX = ladder.getData("upperX");
      this.stopClimbing();
      this.player.body.reset(upperX, upperY - 1);
      this.player.setVelocity(0, 0);
      return;
    }
    if (down && this.player.y >= lowerY - 2) {
      const lowerX = ladder.getData("lowerX");
      this.stopClimbing();
      this.player.body.reset(lowerX, lowerY - 1);
      this.player.setVelocity(0, 0);
      return;
    }

    const vertical = (down ? 1 : 0) - (up ? 1 : 0);
    this.player.setX(ladder.getData("centerX"));
    this.player.setAcceleration(0, 0);
    this.player.setVelocity(0, vertical * ENVIRONMENT_SPEC.ladder.climbSpeed);
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
    if (this.isClimbing) {
      this.player.anims.stop();
      this.player.setTexture("penitent-idle-animation", 0);
      return;
    }
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
    this.audioDirector?.slash(this.player.flipX ? -1 : 1, this.attackSerial);
  }

  parry(time) {
    this.parryingUntil = time + 360;
    this.player.setVelocityX(0);
    this.audioDirector?.guardRaise(this.player.flipX ? -1 : 1);
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
          this.audioDirector?.enemyWindup(enemy.kind, enemy.x);
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
      this.audioDirector?.enemyWindup("boss", boss.x);
      this.fireProjectile(boss, direction, 300, 0);
      this.time.delayedCall(220, () => { if (boss.active) this.fireProjectile(boss, direction, 255, 1); });
      this.time.delayedCall(520, () => { if (boss.active) boss.play("bishop"); });
      boss.nextAttackAt = time + (boss.hp < 7 ? 1050 : 1550);
      this.cameras.main.shake(120, 0.002);
    }
  }

  fireProjectile(source, direction, speed, shotIndex = 0) {
    const projectile = this.projectiles.create(source.x + direction * 25, source.y - 10, "projectile").setDepth(6);
    projectile.setVelocityX(direction * speed);
    projectile.setFlipX(direction < 0);
    projectile.body.setSize(16, 8);
    projectile.setData("damage", source.kind === "boss" ? 2 : 1);
    this.time.delayedCall(3500, () => projectile.active && projectile.destroy());
    this.audioDirector?.projectileLaunch(source.kind, source.x, shotIndex);
  }

  hitByProjectile(projectile) {
    if (!projectile.active) return;
    if (this.time.now < this.parryingUntil) {
      projectile.destroy();
      this.gameState.fervour = Math.min(100, this.gameState.fervour + 18);
      this.flash(0xd3b15d, 90);
      this.audioDirector?.parrySuccess("projectile");
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
      this.audioDirector?.parrySuccess("melee");
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
    this.audioDirector?.weaponHit(enemy.kind);
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
    const reward = { mourner: 35, censer: 50, boss: 500 }[enemy.kind] ?? 0;
    this.gameState.resourceCount = Math.min(
      HUD_SPEC.resource.digitField.max,
      this.gameState.resourceCount + reward,
    );
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
    this.audioDirector?.playerHurt(amount);
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
    this.stopClimbing();
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
      this.boss.body.reset(5060, 360);
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
    this.relicTrigger.body.enable = false;
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
    const boss = this.spawnEnemy("boss", 5060, 360, 14, 4500, 5260);
    boss.maxHp = 14;
    boss.nextAttackAt = this.time.now + 1400;
    this.boss = boss;
    this.audioDirector?.setBossActive(true);
    this.bossHud.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.bossHud, alpha: 1, duration: 800 });
    this.cameras.main.shake(700, 0.004);
    this.tone(58, 1.2, 0.28, "sawtooth");
  }

  defeatBoss() {
    this.gameState.bossDead = true;
    this.gameState.won = true;
    this.audioDirector?.setBossActive(false);
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
      pip.setTexture(index < this.gameState.health ? "hud-health-pip-full" : "hud-health-pip-empty");
    });
    const fervourWidth = Math.floor(
      HUD_SPEC.status.fervourFill.width * Phaser.Math.Clamp(this.gameState.fervour, 0, 100) / 100,
    );
    this.fervourBar.setVisible(fervourWidth > 0);
    if (fervourWidth > 0) this.fervourBar.setCrop(0, 0, fervourWidth, HUD_SPEC.status.fervourFill.height);

    const charges = Phaser.Math.Clamp(this.gameState.itemCharges, 0, this.gameState.maxItemCharges);
    this.itemSlots.forEach((slot, index) => {
      slot.setTexture(index < charges ? "hud-vial-full" : "hud-vial-empty");
    });

    const field = HUD_SPEC.resource.digitField;
    const resourceValue = Math.floor(Phaser.Math.Clamp(this.gameState.resourceCount, 0, field.max));
    if (resourceValue !== this.lastRenderedResourceCount) {
      const glyphs = String(resourceValue);
      this.resourceDigits.forEach((digit) => digit.setVisible(false).setTexture("hud-digit-blank"));
      const startX = field.right - field.glyphWidth - (glyphs.length - 1) * field.advance;
      glyphs.split("").forEach((glyph, index) => {
        this.resourceDigits[index]
          .setPosition(startX + index * field.advance, field.y)
          .setTexture(`hud-digit-${glyph}`)
          .setVisible(true);
      });
      this.lastRenderedResourceCount = resourceValue;
    }
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

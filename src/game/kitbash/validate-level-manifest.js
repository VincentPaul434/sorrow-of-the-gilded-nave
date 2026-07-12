import { ENVIRONMENT_SPEC, VIEWPORT, assertGridAligned } from "../layout-spec.js";

function invariant(condition, message) {
  if (!condition) throw new Error(`Invalid level manifest: ${message}`);
}

function integer(value, label) {
  invariant(Number.isInteger(value), `${label} must be an integer.`);
}

function collectIds(value, ids = new Set()) {
  if (!value || typeof value !== "object") return ids;
  if (typeof value.id === "string") {
    invariant(value.id.length > 0, "IDs cannot be empty.");
    invariant(!ids.has(value.id), `duplicate id "${value.id}".`);
    ids.add(value.id);
  }
  Object.values(value).forEach((child) => collectIds(child, ids));
  return ids;
}

function surfaceSupports(level, x, y) {
  return level.traversal.surfaces.some((surface) => (
    x >= surface.start && x < surface.end && y === surface.top
  ));
}

function validatePlacementReference(placement, kit, label) {
  if (placement.asset) invariant(Boolean(kit.assets[placement.asset]), `${label} references unknown asset "${placement.asset}".`);
  if (placement.recipe) invariant(Boolean(kit.recipes[placement.recipe]), `${label} references unknown recipe "${placement.recipe}".`);
}

export function validateNaveLevelManifest(level, kit) {
  invariant(level.kit === kit.id, `level kit "${level.kit}" does not match "${kit.id}".`);
  invariant(level.world.width === ENVIRONMENT_SPEC.worldWidth, "world width does not match ENVIRONMENT_SPEC.");
  invariant(level.world.height === ENVIRONMENT_SPEC.worldHeight, "world height does not match ENVIRONMENT_SPEC.");
  invariant(level.world.viewport.width === VIEWPORT.width && level.world.viewport.height === VIEWPORT.height, "viewport does not match VIEWPORT.");
  invariant(JSON.stringify(level).length > 0 && JSON.stringify(kit).length > 0, "kit and level must be serializable data.");
  collectIds(level);

  const surfaceRecipe = kit.recipes.gildedSurface;
  invariant(surfaceRecipe.variants.length > 0, "surface recipe requires variants.");
  invariant(surfaceRecipe.variants.every((variant) => variant.top && variant.fill && variant.underhang), "each surface variant needs top, fill, and underhang keys.");

  level.traversal.surfaces.forEach((surface, index) => {
    validatePlacementReference(surface, kit, `surface ${surface.id}`);
    assertGridAligned(surface.start, `${surface.id} start`);
    assertGridAligned(surface.end, `${surface.id} end`);
    assertGridAligned(surface.top, `${surface.id} top`, ENVIRONMENT_SPEC.surfaceOriginY);
    invariant(surface.end > surface.start, `${surface.id} must have positive width.`);
    invariant((surface.end - surface.start) % surfaceRecipe.moduleWidth === 0, `${surface.id} width must use ${surfaceRecipe.moduleWidth}px modules.`);
    integer(surface.variantSeed, `${surface.id} variantSeed`);
    integer(surface.underhangSeed, `${surface.id} underhangSeed`);
    invariant(surface.variantSeed >= 0 && surface.underhangSeed >= 0, `${surface.id} seeds must be non-negative.`);
    invariant(surface.start >= 0 && surface.end <= level.world.width, `${surface.id} exceeds world bounds.`);
    for (let otherIndex = index + 1; otherIndex < level.traversal.surfaces.length; otherIndex += 1) {
      const other = level.traversal.surfaces[otherIndex];
      const horizontalOverlap = Math.min(surface.end, other.end) - Math.max(surface.start, other.start);
      invariant(horizontalOverlap <= 0, `${surface.id} overlaps ${other.id}.`);
    }
  });

  level.traversal.pits.forEach((pit) => {
    [pit.x, pit.y, pit.width, pit.height].forEach((value, index) => integer(value, `${pit.id} rect[${index}]`));
    invariant(pit.width > 0 && pit.height > 0, `${pit.id} must have positive size.`);
    invariant(pit.y + pit.height === level.world.height, `${pit.id} must reach the world bottom.`);
  });

  const ladderRecipe = kit.recipes.ironLadder;
  invariant(ladderRecipe.sensor.width === ENVIRONMENT_SPEC.ladder.interactionWidth, "ladder sensor width differs from ENVIRONMENT_SPEC.");
  invariant(ladderRecipe.sensor.height === ENVIRONMENT_SPEC.ladder.interactionHeight, "ladder sensor height differs from ENVIRONMENT_SPEC.");
  level.traversal.ladders.forEach((ladder) => {
    validatePlacementReference(ladder, kit, `ladder ${ladder.id}`);
    assertGridAligned(ladder.x, `${ladder.id} x`);
    assertGridAligned(ladder.y, `${ladder.id} y`, ENVIRONMENT_SPEC.surfaceOriginY);
    invariant(surfaceSupports(level, ladder.upperExit.x, ladder.upperExit.y), `${ladder.id} upper exit is unsupported.`);
    invariant(surfaceSupports(level, ladder.lowerExit.x, ladder.lowerExit.y), `${ladder.id} lower exit is unsupported.`);
  });

  level.traversal.hazards.forEach((hazard) => {
    validatePlacementReference(hazard, kit, `hazard ${hazard.id}`);
    assertGridAligned(hazard.start, `${hazard.id} start`);
    assertGridAligned(hazard.end, `${hazard.id} end`);
    assertGridAligned(hazard.baseY, `${hazard.id} baseY`, ENVIRONMENT_SPEC.surfaceOriginY);
    invariant(hazard.end > hazard.start && (hazard.end - hazard.start) % kit.recipes.spikeBed.moduleWidth === 0, `${hazard.id} span must use spike modules.`);
  });

  const checkpoint = level.traversal.checkpoint;
  validatePlacementReference(checkpoint, kit, `checkpoint ${checkpoint.id}`);
  invariant(surfaceSupports(level, checkpoint.x, checkpoint.y), `${checkpoint.id} is unsupported.`);
  invariant(surfaceSupports(level, checkpoint.respawn.x, checkpoint.respawn.y), `${checkpoint.id} respawn is unsupported.`);

  level.traversal.boundaries.forEach((boundary) => {
    validatePlacementReference(boundary, kit, `boundary ${boundary.id}`);
    const { x, y, width, height } = boundary.rect;
    [x, y, width, height].forEach((value, index) => integer(value, `${boundary.id} rect[${index}]`));
    invariant(x === 0 || x + width === level.world.width, `${boundary.id} must touch a world edge.`);
  });

  const layerFactors = level.background.layers.map((layer) => layer.scrollFactor);
  invariant(layerFactors.every((factor) => factor > 0 && factor <= 1), "parallax factors must be in (0,1].");
  invariant(layerFactors.every((factor, index) => index === 0 || factor >= layerFactors[index - 1]), "parallax factors must increase from far to near.");
  level.background.layers.forEach((layer) => {
    integer(layer.depth, `${layer.id} depth`);
    layer.placements.forEach((placement) => {
      validatePlacementReference(placement, kit, `background placement ${placement.id}`);
      if (placement.at) {
        integer(placement.at.x, `${placement.id} x`);
        integer(placement.at.y, `${placement.id} y`);
      }
      if (placement.kind === "recipe" && placement.recipe === "hangingCenser") {
        invariant(placement.length > 0 && placement.length % kit.recipes.hangingCenser.linkStrideY === 0, `${placement.id} length must match the chain stride.`);
      }
    });
  });

  level.dressing.placements.forEach((placement) => {
    validatePlacementReference(placement, kit, `decoration ${placement.id}`);
    integer(placement.at.x, `${placement.id} x`);
    integer(placement.at.y, `${placement.id} y`);
  });

  const maxScrollX = level.world.width - level.world.viewport.width;
  Object.entries(level.camera.reviewViews).forEach(([name, view]) => {
    integer(view.playerX, `${name} playerX`);
    integer(view.playerY, `${name} playerY`);
    integer(view.scrollX, `${name} scrollX`);
    invariant(view.playerX >= 0 && view.playerX <= level.world.width, `${name} playerX is outside the world.`);
    invariant(view.scrollX >= 0 && view.scrollX <= maxScrollX, `${name} scrollX is outside camera bounds.`);
    invariant(["follow", "review", "phase-three", "boss"].includes(view.cameraMode), `${name} has an unknown camera mode.`);
  });

  return level;
}

export function validateNaveLevelTextures(scene, kit) {
  const checked = new Set();
  Object.entries(kit.assets).forEach(([assetId, asset]) => {
    if (checked.has(asset.texture)) return;
    invariant(scene.textures.exists(asset.texture), `asset ${assetId} texture "${asset.texture}" is missing.`);
    const source = scene.textures.get(asset.texture).getSourceImage();
    invariant(source?.width === asset.size[0] && source?.height === asset.size[1], `asset ${assetId} expected ${asset.size[0]}x${asset.size[1]}, got ${source?.width}x${source?.height}.`);
    checked.add(asset.texture);
  });

  Object.values(kit.recipes.gildedSurface.variants).forEach((variant) => {
    [variant.top, variant.fill, variant.underhang].forEach((key) => {
      invariant(scene.textures.exists(key), `surface texture "${key}" is missing.`);
    });
  });
  Object.values(kit.recipes.gildedSurface.caps).forEach((cap) => {
    Object.values(cap).forEach((key) => invariant(scene.textures.exists(key), `surface cap "${key}" is missing.`));
  });
  return true;
}

# Gilded Nave Modular Tileset Prompt Record

Built-in image generation was used for all three prompt stages.

## Initial sheet generation

Use case: stylized-concept
Asset type: production-ready modular pixel-art sprite sheet for a side-scrolling precision platformer, authored for an invisible 32 x 32 px logical tile grid
Primary request: create one cohesive asset sheet for "Sorrow of the Gilded Nave" containing only four asset families: one ornate golden reliquary object, highly polished gilded-marble platform modules, dark gothic stone-wall modules with restrained gold filigree, and a decorative spiked hazard trap.
Scene/backdrop: perfectly flat, solid, seamless pure white #FFFFFF background across the entire canvas. No floor plane, environment, vignette, shadow, gradient, texture, border, or lighting variation in the background.
Subject and bounding boxes:
- One isolated ornate reliquary occupying a 4 x 5 logical-cell box, frontal orthographic elevation, symmetrical stepped silhouette, closed devotional cabinet, tarnished-gold frame, dark red inset, hard bone-white highlights.
- One organized row of platform modules: three 64 x 32 px straight-top variants, one 32 x 32 px left cap, one 32 x 32 px right cap, and two 64 x 64 px support-face variants. Polished black-and-slate marble with crisp horizontal gilded trim and hard rectangular specular clusters.
- One organized block of wall modules: four distinct 64 x 64 px gothic stone tiles, compatible edge courses, obsidian and slate masonry, recessed arches, cracks, and restrained tarnished-gold filigree confined inside each tile.
- One isolated decorative spike trap occupying a 64 x 32 px box, frontal side elevation, four evenly spaced hard triangular spikes fixed into a gilded gothic base.
Style/medium: detailed dark-fantasy pixel art with a true 32 x 32 retro tile vocabulary; square pixel clusters, stepped contours, crisp one-pixel-style outlines, flat 2D orthographic projection, no perspective distortion.
Composition/framing: single square template sheet. Arrange every asset in clean horizontal rows on an invisible 32 px grid with at least one empty logical cell between unrelated assets. Keep every object fully visible, isolated, non-overlapping, upright, and aligned to its stated rectangular bounding box. No labels or grid lines.
Lighting/mood: melancholic, gothic, and opulent. Internal upper-left highlights only; no cast shadows on the background.
Color palette: deep obsidian black, near-black brown, dark slate gray, weathered gray, bone-white accents, dark dried-blood red, brilliant tarnished gold, muted antique gold.
Materials/textures: marble polish is communicated with hard rectangular highlight clusters and clean banding; gold uses chipped, tarnished pixel clusters; stone uses discrete mortar joints and cracks.
Constraints: pure white background must remain completely uniform; no text, labels, numbers, logos, characters, enemies, HUD, watermark, scenery, environmental rendering, 3D angles, isometric view, perspective, rotation, blur, glow, bloom, gradients, soft edges, antialiasing, smooth vector curves, painted brushwork, or photorealism. Do not crop any asset. Do not merge assets into a scene.

## White-background correction

Use case: precise-object-edit
Asset type: production-ready modular pixel-art sprite sheet
Input images: Image 1 is the edit target.
Primary request: change only the background of Image 1 to one perfectly uniform, seamless pure white #FFFFFF field.
Constraints: preserve every sprite exactly as shown in Image 1: identical asset count, shapes, pixel clusters, scale, spacing, alignment, colors, outlines, and sheet composition. Do not redraw, resize, move, crop, rotate, soften, relight, or add anything. The entire background, including every margin and gap between isolated sprites, must be a single flat #FFFFFF color with no off-white pixels, gray cast, texture, gradient, shadow, glow, vignette, floor plane, or lighting variation. Keep all assets fully isolated. No text, labels, grid lines, logos, or watermark.

## Runtime chroma-key derivative

Use case: background-extraction
Asset type: production-ready modular pixel-art sprite sheet for local chroma-key removal
Input images: Image 1 is the edit target.
Primary request: replace only the white background and all white gaps between sprites with one perfectly flat solid #00FF00 chroma-key color.
Scene/backdrop: a single uniform #00FF00 field with no shadows, gradients, texture, reflections, floor plane, vignette, lighting variation, or off-color border pixels.
Constraints: preserve every sprite from Image 1 exactly: same count, shapes, hard pixel clusters, scale, spacing, alignment, palette, crisp outlines, and composition. Do not redraw, resize, move, crop, rotate, blur, soften, relight, or add anything. Keep every asset fully isolated with generous green separation. Do not use #00FF00 inside any sprite. No text, labels, grid lines, logos, or watermark.

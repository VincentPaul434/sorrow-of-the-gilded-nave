# Technical Layout GDD

## Environment Architecture

**Runtime coordinate system**

| Constraint | Required value |
| --- | ---: |
| Logical viewport | `1280 x 720 px` |
| World bounds | `x=0, y=0, width=5408, height=720 px` |
| Collision grid | `32 x 32 px` |
| Foreground visual module | `64 x 32 px` |
| Horizontal module width | `64 px` |
| Surface Y origin | `8 px` |

- Use integer logical pixels for every source pixel, transform, crop rectangle, body rectangle, camera offset, and parallax object position.
- Snap foreground X coordinates with `x % 32 === 0`. Snap walkable surface Y coordinates with `(y - 8) % 32 === 0`.
- Start each `64 px` visual module on an X coordinate divisible by `64`. A `32 px` half-module is permitted only for an explicitly specified ledge cap, broken edge, ladder, hazard, or terminal world boundary.
- Do not use fractional scale, fractional origin, rotation, smoothing, antialiasing, blur, gradient fills, vector curves, or alpha-feathered edges on environment assets.
- Keep `imageSmoothingEnabled=false`, Phaser pixel-art rendering enabled, rounded camera pixels enabled, and runtime image scale at `1`.

**Runtime environment asset inventory**

| Texture key | Source bounds | Placement contract |
| --- | ---: | --- |
| `gilded-nave-tileset-source` | `1254 x 1254 px` | Preloaded transparent source atlas; never rendered directly |
| `far-masonry` | `128 x 64 px` | Atlas-derived wall course; repeat in both axes inside the far band |
| `far-window` | `128 x 256 px` | Atlas-derived two-panel composite; top-left origin on a `64 px` X module |
| `near-pillar` | `96 x 560 px` | Atlas-derived wall-panel composite used as a mid-band seam mask |
| `decorative-censer` | `32 x 52 px` | Near-band chain terminal; top-left origin on integer coordinates |
| `processional-nave.png` | `1280 x 941 px` | Mid-band region plate at world `(0,-96)`, depth `-20`, scroll `0.93` |
| `penitent-ascent.png` | `1280 x 941 px` | Mid-band region plate at world `(1280,-192)`, depth `-20`, scroll `0.93` |
| `bridge-of-relics.png` | `1280 x 941 px` | Mid-band region plate at world `(2560,-280)`, depth `-20`, scroll `0.93` |
| `reliquary-chamber-runtime.png` | `1280 x 941 px` | Mid-band region plate at world `(3840,-304)`, depth `-20`, scroll `0.93` |
| `platform-top`, `platform-top-2`, `platform-top-3` | `64 x 32 px` each | Select by deterministic module index; no random selection at runtime |
| `platform-top-half-left`, `platform-top-half-right` | `32 x 32 px` each | Opaque companion half used beside a broken cap; never place a full top below the cap |
| `platform-fill`, `platform-fill-2`, `platform-fill-3` | `64 x 32 px` each | Match the selected top-course family and repeat below it |
| `platform-underhang-1` through `platform-underhang-3` | `64 x 16 px` each | Optional transparent fringe below an elevated `64 px` support face; decorative only |
| `platform-broken-left` | `32 x 32 px` | Left termination cap; authored lighting, never runtime-flipped |
| `platform-broken-right` | `32 x 32 px` | Right termination cap; authored lighting, never runtime-flipped |
| `rubble-cluster-1` through `rubble-cluster-3` | `64 x 32 px` each | Sparse surface decoration; anchor on a `64 px` module and add no body |
| `ledge-bone-pile` | `32 x 16 px` | Bottom-align to a walkable surface; add no body |
| `ledge-candelabrum` | `32 x 48 px` | Bottom-align to a walkable surface; add no body |
| `candle-flame-1` through `candle-flame-3` | `6 x 10 px` each | Discrete animation frames positioned on integer wick coordinates |
| `ladder` | `32 x 64 px` | One cell wide by two cells high; scale `1` |
| `reliquary` | `96 x 128 px` | Atlas-derived checkpoint art; visual only, separate interaction body |
| `spike` | `64 x 32 px` | Atlas-derived four-spike trap; visual and hazard body remain separate contracts |

**Modular tileset atlas contract**

- Keep `gilded-nave-modular-tileset-v2.png` as the isolated white-background art master. Keep `gilded-nave-modular-tileset-key.png` as the chroma-key derivation input. Phaser preloads only `gilded-nave-modular-tileset-atlas.png` as texture key `gilded-nave-tileset-source`.
- Register atlas-derived runtime textures before procedural fallback texture functions. A fallback function must exit when the atlas-backed key already exists; it must never overwrite an atlas-backed environment texture.
- Use nearest-neighbor sampling for every crop. After normalization, set alpha values `>=128` to `255` and values `<128` to `0`. Do not retain fractional edge alpha in a runtime grid texture.
- Normalize to the listed runtime bounds once during scene creation. Render the resulting textures at scale `1`; do not render the irregular `1254 x 1254 px` source directly and do not treat it as a uniform sprite sheet.

| Asset family | Source rectangle `(x,y,width,height)` | Runtime normalization |
| --- | --- | --- |
| Reliquary | `(502,18,249,352)` | Aspect-fit at `(3,0,90,128)` inside `96 x 128 px` |
| Platform family 1 | `(177,418,285,89)` | Split into three source cells; compose `64 x 32 px` from two native `32 x 32 px` cells |
| Platform family 2 | `(491,418,271,89)` | Split into three source cells; compose `64 x 32 px` from two native `32 x 32 px` cells |
| Platform family 3 | `(790,418,286,89)` | Split into three source cells; compose `64 x 32 px` from two native `32 x 32 px` cells |
| Left cap | `(52,418,93,89)` | `32 x 32 px` |
| Right cap | `(1109,418,93,89)` | `32 x 32 px` |
| Support family 1 | `(306,600,212,106)` | `64 x 32 px` |
| Support family 2 | `(728,600,212,106)` | `64 x 32 px` |
| Wall families 1-4 | `(88,805,238,227)`, `(361,805,242,226)`, `(632,805,248,226)`, `(912,805,239,226)` | Fixed wall composites for the far and mid bands |
| Spike trap | `(470,1064,312,156)` | `64 x 32 px`; four visible spikes inside the `64 px` hazard span |

- The checkpoint reliquary is a normal image at `(3136,360)` with bottom origin. Its invisible interaction rectangle remains `44 x 72 px`, centered at `(3136,322)`. Activation disables only the interaction body and animates only the visual image.
- The spike trap is one `64 x 32 px` image per `64 px` hazard module. Its body is `56 x 24 px`, inset `4 px` horizontally and `8 px` vertically. Do not derive the hazard rectangle from alpha.

**Processed regional plate contract**

- Use only the four `1280 x 941 px` runtime plate files in the table above. The retained high-color inputs are `processional-nave-source.png`, `penitent-ascent-source.png`, `bridge-of-relics-source.png`, and `reliquary-chamber.png`; none is a runtime texture. Do not crop, scale, rotate, mirror, or filter a runtime plate in Phaser.
- Plates occupy four consecutive authored regions with `1280 px` world-X starts. Keep the exact Y offsets in the table; those offsets align the plate architecture to the region-specific traversal elevation while keeping the code-driven platform course in front.
- Process source plates with `scripts/process_environment_plate.py <source> <destination>`. The script center-crops to `1280 px`, preserves the `941 px` source height, maps every RGB pixel to the nearest allowed color, applies no dithering, and rejects any output that is not exactly `1280 x 941 px` or contains an out-of-palette color.
- The fixed 18-color palette is `#070706`, `#0e0d0c`, `#171615`, `#242321`, `#3a3835`, `#54504a`, `#77736b`, `#a7a398`, `#c4bca8`, `#e0d4b8`, `#503414`, `#8b6228`, `#c0923f`, `#420d0e`, `#711719`, `#9b2b22`, `#6e3d27`, and `#d3c49e`.
- Store the generation prompt beside each environment source or runtime plate as a `.prompt.md` record. Prompt records are documentation inputs only and are never loaded by the game.

**Three-layer parallax contract**

| Layer | Runtime bounds | Base composite span | Depth | Horizontal scroll factor |
| --- | --- | --- | ---: | ---: |
| Far | `(0,0,5408,720)` | `(0,0,1280,720)` | `-30` | `0.86` |
| Mid | `(0,-304,5120,941)` | Four fixed `1280 x 941 px` plates | `-20` | `0.93` |
| Near | `(0,0,5408,720)` | Four chain-and-censer occluders | `-10` | `0.98` |

- Repeat the far masonry span until it covers `x=0..5408`. Clip only at the world boundary; do not stretch a texture to fit the final span.
- Place the four mid plates exactly once at `(0,-96)`, `(1280,-192)`, `(2560,-280)`, and `(3840,-304)`. They cover the authored level from `x=0..5120`; terminal masonry owns the remaining `288 px`. Do not restore legacy repeated arch or devotional-bay overlays on top of the plates.
- Place mid-layer seam pillars with bottom origins at `(1216,616)`, `(2496,424)`, `(3776,296)`, and `(5056,360)`. The pillars use the same `0.93` horizontal factor as the plates, so their `96 px` widths remain locked over each regional boundary and terminal transition.
- Place near-layer chain-and-censer occluders at X coordinates `704`, `1984`, `3264`, and `4544`, with chain lengths `128`, `176`, `112`, and `152 px`. Each chain uses integer `4 x 5 px` link clusters on an `8 px` vertical stride and terminates in one native `32 x 52 px` censer.
- Place every repeated texture origin on the `64 px` module grid. Source widths are fixed multiples of `32 px`; repeated span seams and architectural anchors must use the `64 px` grid.
- Use vertical scroll factor `1.0` for all three layers. Parallax changes horizontal displacement only.
- Far-layer assets contain blocked masonry values. Mid-layer plates and seam masks contain the region-specific columns, window bays, recesses, statuary, and distant traversal silhouettes. Near-layer assets contain sparse chains, censers, and occluding structural trims. None of these layers may create physics bodies.
- Reserve depths `0` and above for gameplay surfaces, collision-linked edge art, hazards, actors, effects, and foreground occluders. Background art must remain at its assigned depth.
- The code-driven foreground course occludes each plate's authored floor line. A plate never owns collision, never repeats, and never communicates a safe landing, ladder interaction, or hazard boundary.

**Foreground tileset and collision separation**

- Author the stone top and fill families at exactly `64 x 32 px`. Keep all three variants course-compatible at their left and right boundaries. Do not resize variants at runtime.
- Build a platform's rendered top from `64 x 32 px` modules selected deterministically from the three top variants. Use explicit `32 x 32 px` edge caps where the platform terminates on a half-module.
- At a broken end, replace the affected half of the `64 px` top module with `platform-broken-left` or `platform-broken-right` and render only the named opaque companion half beside it. Never place a full opaque `platform-top*` module underneath a transparent broken cap.
- Store rendering and collision in separate structures. Rendered tile sprites provide stone, mortar, chips, and edge damage. Static Arcade Physics bodies provide traversal geometry.
- Limit the visible face of an elevated supported surface to `64 px` from its top. The base floor at `y=616` may continue to the world bottom. The merged static body may continue deeper than its art; the additional body depth is invisible and must not be inferred from the art.
- Anchor optional underhang art at `surfaceY + 64`. Anchor rubble at `surfaceY - 32`, bone piles at `surfaceY - 16`, and candelabra at `surfaceY - 48`. All decoration remains inside its source bounds, uses depth `2` or `3`, and creates no collider.
- Animate a candelabrum flame by replacing the fixed `6 x 10 px` frames. Use integer frame positions and durations; do not interpolate scale, rotation, alpha, or color.
- Build collision from whole `32 x 32 px` cells or merged rectangles whose edges remain on the `32 px` grid. Decorative chips, missing corner pixels, cracks, highlights, and hanging fragments never change the body boundary.
- Merge adjacent solid cells into the smallest set of rectangular static bodies. Do not derive bodies from alpha masks or visible sprite bounds.
- Keep all walkable body tops on the `8 px` surface origin. A surface at `y=360`, `424`, `488`, `552`, or `616` is valid because subtracting `8` produces a multiple of `32`.

**Micro-traversal placement**

| Element | Bounds `(x,y,width,height)` | Runtime rule |
| --- | --- | --- |
| Ladder A | `(1888,488,32,64)` | Separate interaction zone `(1894,480,20,80)`; center axis `x=1904`; exits `(1952,488)` / `(1872,552)`; `120 px/s` |
| Ladder B | `(2528,360,32,64)` | Separate interaction zone `(2534,352,20,80)`; center axis `x=2544`; exits `(2592,360)` / `(2512,424)`; `120 px/s` |

- Treat ladder bounds as top-left asset rectangles. Each ladder occupies one grid cell in width and two grid cells in height.
- Render ladder art as a normal image without a physics body. Create a separate invisible `20 x 80 px` static interaction zone centered on the art and extending `8 px` above it. The zone uses local horizontal bounds `x=6..26` relative to the art and top-left `y=assetY-8`.
- The `8 px` top padding must overlap a player standing on the upper course. The zone detects climb eligibility only; it is not solid and cannot block actor movement.
- Lock climbing velocity to `120 px/s`. Do not scale climb speed with frame rate, render scale, or parallax.
- Snap the climb axis to the ladder center. Dismount only at the listed integer coordinates on the adjacent upper or lower platform.

| Broken edge | Bounds `(x,y,width,height)` |
| --- | --- |
| Edge 1 | `(3424,360,32,32)` |
| Edge 2 | `(3552,296,32,32)` |
| Edge 3 | `(3776,296,32,32)` |
| Edge 4 | `(3872,360,32,32)` |

- Treat each broken edge as a fixed `32 x 32 px` visual cap at the listed top-left coordinate.
- Broken-edge sprites are visual traversal markers. They do not add a protruding collider or modify the adjacent platform body's rectangular top.
- Confine cracks, missing stone, rubble, and hanging fragments to the `32 x 32 px` source bounds. Do not render pixels into the neighboring landing or gap cell.

## HUD Asset Specification

**Screen-space contract**

- This contract applies to the fixed top-left status module and top-right resource counter. The separate area-title and boss-name text overlays are outside these two module bounds.
- Author and position the HUD in the fixed `1280 x 720 px` logical viewport. Use a `24 px` safe margin on all screen edges.
- Attach all HUD containers to the camera with scroll factor `0`. Use depth `40`, above the depth-`35` vignette and below flashes, death overlays, and ending overlays at depth `70` or higher.
- Keep every HUD transform, child coordinate, crop width, glyph advance, and asset bound integer-valued. Use native-size textures at scale `1`.
- Within the two fixed modules, use one-pixel hard outlines, stepped corners, rectangular clusters, and the existing ink, stone, bone, dried-blood, rust, and tarnished-gold palette. Do not use gradients, blur, glow, antialiased strokes, smooth circles, or runtime vector text.

**Runtime HUD asset inventory**

| Texture key | Source bounds |
| --- | ---: |
| `hud-status-frame` | `320 x 96 px` |
| `hud-crest` | `80 x 80 px` |
| `hud-health-rail` | `216 x 14 px` |
| `hud-health-pip-full`, `hud-health-pip-empty` | `38 x 8 px` each |
| `hud-fervour-rail` | `192 x 10 px` |
| `hud-fervour-fill` | `188 x 6 px` |
| `hud-vial-full`, `hud-vial-empty` | `24 x 24 px` canvases; `16 x 20 px` vial silhouette at local `(4,2)` |
| `hud-resource-frame` | `216 x 64 px` |
| `hud-resource-sigil` | `32 x 32 px` |
| `hud-digit-0` through `hud-digit-9`, `hud-digit-blank` | `15 x 21 px` each |

**Top-left status module**

The status container is anchored from its top-left corner at absolute bounds `(24,24,320,96)`.

| Child | Local bounds `(x,y,width,height)` | Absolute bounds `(x,y,width,height)` |
| --- | --- | --- |
| Crest | `(0,8,80,80)` | `(24,32,80,80)` |
| Health rail | `(88,18,216,14)` | `(112,42,216,14)` |
| Health pip 0 | `(91,21,38,8)` | `(115,45,38,8)` |
| Health pip 1 | `(133,21,38,8)` | `(157,45,38,8)` |
| Health pip 2 | `(175,21,38,8)` | `(199,45,38,8)` |
| Health pip 3 | `(217,21,38,8)` | `(241,45,38,8)` |
| Health pip 4 | `(259,21,38,8)` | `(283,45,38,8)` |
| Fervour rail | `(88,42,192,10)` | `(112,66,192,10)` |
| Fervour fill maximum | `(90,44,188,6)` | `(114,68,188,6)` |
| Item slot 0 | `(88,64,24,24)` | `(112,88,24,24)` |
| Item slot 1 | `(120,64,24,24)` | `(144,88,24,24)` |
| Item slot 2 | `(152,64,24,24)` | `(176,88,24,24)` |

- Draw the crest as a stepped pixel silhouette inside its `80 x 80 px` bounds. Any medallion ring must be an authored stepped outline, not a runtime circle primitive.
- Health is an integer state in the inclusive range `0..5`. Each of the five `38 x 8 px` pips maps to one health unit. Pip origins advance exactly `42 px`, leaving a fixed `4 px` separator. A pip is full when `index < health`; otherwise render its empty-state texture or empty-state palette.
- Do not resize health pips to show partial units. Damage and healing replace a full/empty texture or color state.
- Fervour is an integer state in the inclusive range `0..100`. Compute the visible fill width as `floor(188 * fervour / 100)`. Apply that integer as a left-origin crop inside `(90,44,188,6)`. Do not scale the fill sprite.
- Keep the fervour rail visible at zero. Crop width `0` hides only the fill texture.
- The item display has exactly three `24 x 24 px` slots. Slot origins advance `32 px`, leaving an `8 px` separation.
- Author full and empty vial graphics at `16 x 20 px`. Place each vial at local offset `(4,2)` inside its slot. Map vial state with `index < itemCharges`, where `itemCharges` is an integer clamped to `0..3`.
- Replace full and empty vial textures discretely. Do not communicate charge state with fractional fill, opacity interpolation, animation scale, or color gradients.

**Top-right resource counter**

The resource container has fixed size `216 x 64 px`. Anchor it with `x = 1280 - 24 - 216 = 1040` and `y = 24`, producing absolute bounds `(1040,24,216,64)`.

| Child | Local bounds | Absolute bounds |
| --- | --- | --- |
| Resource sigil | `(12,16,32,32)` | `(1052,40,32,32)` |
| Digit field right edge | `x=192` | `x=1232` |
| Digit field top | `y=22` | `y=46` |
| Digit glyph | `15 x 21 px` | Native size, scale `1` |
| Digit advance | `18 px` | `3 px` fixed gap |
| Maximum digits | `6` | No separators |
| Maximum value | `999999` | Clamp before rendering |

- Store the displayed resource as an integer `resourceCount` clamped to `0..999999`. Render `0` as one glyph. Do not render leading zeroes, decimal points, thousands separators, abbreviations, or animated rolling digits.
- Initialize `resourceCount` to `0`. Add `35` for a defeated mourner, `50` for a defeated censer, and `500` for the boss. Preserve the value through player respawn; clamp immediately after the award.
- Right-align the glyph run to local `x=192`. For `n` digits, place the first glyph at `x = 192 - 15 - ((n - 1) * 18)`. Place every following glyph at an `18 px` advance.
- Use a prebuilt bitmap digit atlas or ten individual `15 x 21 px` digit textures. Each glyph uses a fixed pixel matrix and nearest-neighbor sampling. Phaser `Text`, browser fonts, CSS text, and runtime antialiased canvas text are not permitted for the counter.
- Update digit sprites only when `resourceCount` changes. Reuse a six-sprite pool, hide unused leading sprites, and replace visible frames without changing scale or origin.
- The sigil occupies exactly `(12,16,32,32)` and remains separate from the numeric state. It may switch between fixed authored frames for explicit resource events; it must not pulse through fractional scale.

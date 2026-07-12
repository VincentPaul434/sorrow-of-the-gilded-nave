# Art Direction: The Gilded Nave

## Value Structure

- Keep roughly 65-70% of the frame near black or deep charcoal.
- Use ash-stone midtones to describe playable forms and monumental structure.
- Reserve the brightest bone and warm-white pixels for blade edges, faces, wax,
  marble fractures, and shafts of sacred light.
- Gameplay silhouettes must remain readable when the background is viewed in
  grayscale.

## Restricted Palette

| Role | Core colors |
| --- | --- |
| Void and outline | `#070706`, `#0e0d0c`, `#171615` |
| Weathered stone | `#242321`, `#3a3835`, `#54504a`, `#77736b` |
| Bone and light | `#a7a398`, `#c4bca8`, `#e0d4b8` |
| Tarnished gold | `#503414`, `#8b6228`, `#c0923f` |
| Dried blood | `#420d0e`, `#711719`, `#9b2b22` |
| Rust | `#6e3d27` |

## Pixel Language

- Build surfaces from clustered 1-4 pixel interruptions instead of smooth fills.
- Keep edges stepped, chipped, and irregular; avoid vector-clean contours.
- Metal uses a dark body, broken gray edge, and rare one-pixel bone highlight.
- Gold is mostly brown and ochre. Bright gold appears only on exposed filigree.
- Stone receives horizontal chips, black mortar cuts, and sparse ash highlights.
- Blood and wax should hang vertically to reinforce weight and age.

## Composition

- Use flat side-view platforms with strong horizontal top edges.
- Let architecture stack vertically behind play: ironwork, devotional bays,
  columns, altarpieces, statues, then windows and light.
- Break repeated background plates with nearer columns, chains, censers, and
  statues so the nave reads as continuous space.
- Light shafts may cross architecture, but never erase the player silhouette or
  conceal spike tips and landing edges.

## Character Silhouettes

- The penitent is narrow and tall, with a needle-like helmet and a long blade.
- Crimson cloth forms the lower silhouette; steel and gold define the upper body.
- Enemies use broader, heavier shapes so they are identifiable before detail is
  visible.
- Animation should shift only a few pixels per frame to preserve dense clusters.

## Character Production Standard

- Humanoids use mature 7.5-8 head proportions, a small head, articulated shoulders,
  elbows, hips, and knees, and a visible line of weight through the planted foot.
- Avoid constructing anatomy from stacked rectangles. Armor follows the underlying
  body and cloth extends the action line without replacing it.
- Side-view frames face right by default and share one costume, scale, palette,
  ground line, and lighting direction across every state.
- Idle, locomotion, airborne, attack, and recoil silhouettes must remain distinct
  when viewed as solid black shapes.
- Runtime pivots sit on the shared ground line. Physics bodies cover torso and legs;
  helmets, weapons, robes, and effects do not enlarge collision envelopes.
- Generated source atlases are chroma-cleaned and sliced reproducibly with
  `scripts/slice_character_atlas.py` before being loaded as Phaser sprite sheets.
- Idle loops keep both feet planted and use restrained breathing and cloth motion.
- Run cycles include contact, compression, passing, and lift for both legs rather
  than translating one repeated pose.
- Attacks communicate anticipation, acceleration, impact, follow-through, and
  recovery. Damage windows align with impact frames, never anticipation.

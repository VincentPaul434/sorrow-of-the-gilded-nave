# Sorrow of the Gilded Nave

A playable dark-fantasy action-platformer prototype built with Phaser 3 and Vite.

## Controls

- Move: `A` / `D` or arrow keys
- Jump: `Space` or `W`
- Ladder: climb with `W` / `S` or `Up` / `Down`; press `Space` to jump off
- Attack: `J` or `X`
- Parry: `K` or `C`
- Restart after an ending: `R`

## Run locally

```bash
npm install
npm run dev
```

The level includes a checkpoint reliquary, melee and ranged enemies, spike hazards,
procedural ambient audio, and a boss encounter in the cathedral apse.

### Technical art specification

See [`TECHNICAL_LAYOUT_GDD.md`](TECHNICAL_LAYOUT_GDD.md) for the environment architecture,
modular asset constraints, and HUD layout specification.
The level uses four processed native-pixel midground plates:

- `public/assets/processional-nave.png`
- `public/assets/penitent-ascent.png`
- `public/assets/bridge-of-relics.png`
- `public/assets/reliquary-chamber-runtime.png`

All four runtime plates are `1280 x 941 px`, use the fixed 18-color environment palette,
and remain collision-free. Traversal collision is defined only by the modular foreground
geometry. The higher-color `public/assets/reliquary-chamber.png` file is retained as a
source asset and is not loaded by the runtime. The other built-in generator outputs are
retained as `processional-nave-source.png`, `penitent-ascent-source.png`, and
`bridge-of-relics-source.png`; only their processed counterparts are preloaded by Phaser.

Prepare a generated source plate for the native-pixel pipeline with:

```bash
python scripts/process_environment_plate.py path/to/source.png public/assets/output.png
```

The processor center-crops to `1280 px`, preserves the required `941 px` height,
quantizes without dithering, and validates dimensions and palette membership. The exact
generation prompts are stored beside their plates as `public/assets/*.prompt.md`.

Foreground architecture is asset-driven from the generated modular sheet:

- `public/assets/gilded-nave-modular-tileset-v2.png`: isolated white-background master
- `public/assets/gilded-nave-modular-tileset-key.png`: retained chroma-key source
- `public/assets/gilded-nave-modular-tileset-atlas.png`: transparent runtime atlas
- `public/assets/gilded-nave-modular-tileset.prompt.md`: exact generation and edit prompts

`src/game/textures.js` registers fixed source rectangles from the runtime atlas and
normalizes them to native `32 px` and `64 px` grid textures with nearest-neighbor sampling
and binary alpha. Platforms, support faces, boundary walls, seam architecture, the
checkpoint reliquary, and the bridge spike trap all consume these bitmap-derived textures;
their physics bodies remain separate and grid-authored.

Character artwork is loaded from normalized production sprite sheets in
`public/assets/characters`. Rebuild those sheets from the cleaned source atlas with:

```bash
python scripts/slice_character_atlas.py
```

The player animation sheets and transparent GIF previews are generated from
`penitent-animation-atlas.png` with:

```bash
python scripts/build_character_gifs.py
```

Generated loops:

- `penitent-idle.gif`: seven-frame breathing loop
- `penitent-run.gif`: eight-frame run cycle
- `penitent-attack.gif`: seven-frame attack sequence

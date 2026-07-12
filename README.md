# Sorrow of the Gilded Nave

A playable dark-fantasy action-platformer prototype built with Phaser 3 and Vite.

## Controls

- Move: `A` / `D` or arrow keys
- Jump: `Space` or `W`
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

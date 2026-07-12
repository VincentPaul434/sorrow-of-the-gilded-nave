from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "assets" / "characters" / "character-atlas.png"
OUTPUT = SOURCE.parent
CELL = 362


def make_row(name: str, source_y: int, height: int) -> None:
    atlas = Image.open(SOURCE).convert("RGBA")
    sheet = Image.new("RGBA", (CELL * 4, height), (0, 0, 0, 0))
    boxes = []

    for column in range(4):
        frame = atlas.crop((column * CELL, source_y, (column + 1) * CELL, source_y + height))
        sheet.paste(frame, (column * CELL, 0))
        alpha_box = frame.getchannel("A").getbbox()
        boxes.append(alpha_box)

    output = OUTPUT / f"{name}-sheet.png"
    sheet.save(output, optimize=True)
    print(f"{output.name}: {sheet.width}x{sheet.height}, alpha boxes={boxes}")


if __name__ == "__main__":
    make_row("penitent", 0, 310)
    make_row("mourner", CELL, 250)
    make_row("bishop", CELL * 2, 320)

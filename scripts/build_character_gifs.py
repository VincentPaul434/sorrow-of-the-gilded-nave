from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "assets" / "characters" / "penitent-animation-atlas.png"
OUTPUT = SOURCE.parent
CANVAS_SIZE = (360, 320)
CANVAS_GROUND = 286

ANIMATIONS = {
    "idle": {
        "row": (0, 300),
        "count": 7,
        "source_ground": 263,
        "duration": [150, 150, 160, 170, 160, 150, 150],
    },
    "run": {
        "row": (300, 590),
        "count": 8,
        "source_ground": 546,
        "duration": [76] * 8,
    },
    "attack": {
        "row": (590, 900),
        "count": 7,
        "source_ground": 826,
        "order": [0, 1, 2, 5, 3, 4, 6],
        "duration": [105, 90, 75, 62, 85, 100, 130],
    },
}


def connected_components(alpha: Image.Image, top: int, bottom: int):
    width, _ = alpha.size
    height = bottom - top
    values = alpha.crop((0, top, width, bottom)).tobytes()
    visited = bytearray(width * height)
    components = []

    for index, value in enumerate(values):
        if value < 24 or visited[index]:
            continue

        queue = deque([index])
        visited[index] = 1
        pixels = []
        min_x = width
        min_y = height
        max_x = 0
        max_y = 0

        while queue:
            current = queue.popleft()
            y, x = divmod(current, width)
            pixels.append((x, y + top))
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)

            for ny in range(max(0, y - 1), min(height, y + 2)):
                row_offset = ny * width
                for nx in range(max(0, x - 1), min(width, x + 2)):
                    neighbor = row_offset + nx
                    if not visited[neighbor] and values[neighbor] >= 24:
                        visited[neighbor] = 1
                        queue.append(neighbor)

        if len(pixels) >= 12:
            components.append({
                "pixels": pixels,
                "area": len(pixels),
                "bbox": (min_x, min_y + top, max_x + 1, max_y + top + 1),
            })

    return components


def group_frames(image: Image.Image, top: int, bottom: int, expected: int):
    components = connected_components(image.getchannel("A"), top, bottom)
    primary = sorted(
        (component for component in components if component["area"] >= 450),
        key=lambda component: component["bbox"][0],
    )

    if len(primary) == expected - 1:
        merged = max(primary, key=lambda component: component["bbox"][2] - component["bbox"][0])
        x0, _, x1, _ = merged["bbox"]
        split_x = round(x0 + (x1 - x0) * 0.58)
        left_pixels = []
        right_pixels = []
        source_pixels = image.load()
        for x, y in merged["pixels"]:
            red, green, blue, _ = source_pixels[x, y]
            is_arc = x < split_x + 105 and y > top + 90 and red + green + blue > 430
            if x < split_x or is_arc:
                left_pixels.append((x, y))
            else:
                right_pixels.append((x, y))

        def component_from_pixels(pixels):
            xs = [pixel[0] for pixel in pixels]
            ys = [pixel[1] for pixel in pixels]
            return {
                "pixels": pixels,
                "area": len(pixels),
                "bbox": (min(xs), min(ys), max(xs) + 1, max(ys) + 1),
            }

        primary.remove(merged)
        primary.extend([component_from_pixels(left_pixels), component_from_pixels(right_pixels)])
        primary.sort(key=lambda component: component["bbox"][0])

    if len(primary) != expected:
        details = [(item["area"], item["bbox"]) for item in primary]
        raise RuntimeError(f"Expected {expected} figures, found {len(primary)}: {details}")

    groups = [{"components": [item], "anchor": item} for item in primary]
    secondary = [component for component in components if component["area"] < 450]
    for component in secondary:
        x0, y0, x1, y1 = component["bbox"]
        cx = (x0 + x1) / 2
        cy = (y0 + y1) / 2
        nearest = min(
            groups,
            key=lambda group: (
                cx - (group["anchor"]["bbox"][0] + group["anchor"]["bbox"][2]) / 2
            ) ** 2 + (
                cy - (group["anchor"]["bbox"][1] + group["anchor"]["bbox"][3]) / 2
            ) ** 2,
        )
        nearest["components"].append(component)

    return groups


def render_frame(source: Image.Image, group, source_ground: int) -> Image.Image:
    all_pixels = [pixel for component in group["components"] for pixel in component["pixels"]]
    xs = [pixel[0] for pixel in all_pixels]
    ys = [pixel[1] for pixel in all_pixels]
    x0, y0, x1, y1 = min(xs), min(ys), max(xs) + 1, max(ys) + 1

    isolated = Image.new("RGBA", source.size, (0, 0, 0, 0))
    source_pixels = source.load()
    isolated_pixels = isolated.load()
    for x, y in all_pixels:
        isolated_pixels[x, y] = source_pixels[x, y]

    crop = isolated.crop((x0, y0, x1, y1))
    alpha = crop.getchannel("A")
    weighted = []
    for y in range(crop.height):
        for x in range(crop.width):
            value = alpha.getpixel((x, y))
            if value >= 48:
                weighted.append((x, value))
    centroid_x = sum(x * value for x, value in weighted) / sum(value for _, value in weighted)

    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    paste_x = round(CANVAS_SIZE[0] / 2 - centroid_x)
    paste_y = CANVAS_GROUND - source_ground + y0
    canvas.alpha_composite(crop, (paste_x, paste_y))
    return canvas


def gif_frame(frame: Image.Image) -> Image.Image:
    alpha = frame.getchannel("A")
    paletted = frame.convert("RGB").quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    transparent = alpha.point(lambda value: 255 if value < 96 else 0)
    paletted.paste(255, mask=transparent)
    paletted.info["transparency"] = 255
    return paletted


def save_animation(name: str, frames, durations) -> None:
    sheet = Image.new("RGBA", (CANVAS_SIZE[0] * len(frames), CANVAS_SIZE[1]), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * CANVAS_SIZE[0], 0))
    sheet_path = OUTPUT / f"penitent-{name}-animation.png"
    sheet.save(sheet_path, optimize=True)

    gif_frames = [gif_frame(frame) for frame in frames]
    gif_path = OUTPUT / f"penitent-{name}.gif"
    gif_frames[0].save(
        gif_path,
        save_all=True,
        append_images=gif_frames[1:],
        duration=durations,
        loop=0,
        disposal=2,
        transparency=255,
        optimize=False,
    )
    print(f"{name}: {len(frames)} frames -> {sheet_path.name}, {gif_path.name}")


if __name__ == "__main__":
    atlas = Image.open(SOURCE).convert("RGBA")
    for animation_name, spec in ANIMATIONS.items():
        groups = group_frames(atlas, *spec["row"], spec["count"])
        frames = [render_frame(atlas, group, spec["source_ground"]) for group in groups]
        if "order" in spec:
            frames = [frames[index] for index in spec["order"]]
        save_animation(animation_name, frames, spec["duration"])

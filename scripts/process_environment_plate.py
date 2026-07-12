"""Prepare generated environment plates for the native Phaser pixel pipeline."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


PALETTE_HEX = (
    "070706",
    "0e0d0c",
    "171615",
    "242321",
    "3a3835",
    "54504a",
    "77736b",
    "a7a398",
    "c4bca8",
    "e0d4b8",
    "503414",
    "8b6228",
    "c0923f",
    "420d0e",
    "711719",
    "9b2b22",
    "6e3d27",
    "d3c49e",
)

TARGET_WIDTH = 1280


def rgb(hex_color: str) -> tuple[int, int, int]:
    return tuple(int(hex_color[index : index + 2], 16) for index in (0, 2, 4))


def quantize_to_palette(image: Image.Image) -> Image.Image:
    source = np.asarray(image, dtype=np.int32)
    palette = np.asarray([rgb(color) for color in PALETTE_HEX], dtype=np.int32)
    output = np.empty(source.shape, dtype=np.uint8)

    for row in range(0, source.shape[0], 64):
        block = source[row : row + 64]
        delta = block[:, :, None, :] - palette[None, None, :, :]
        distance = np.sum(delta * delta, axis=3)
        nearest = np.argmin(distance, axis=2)
        output[row : row + block.shape[0]] = palette[nearest]

    return Image.fromarray(output, mode="RGB")


def process(source: Path, destination: Path) -> None:
    with Image.open(source) as image:
        source_rgb = image.convert("RGB")
        if source_rgb.width < TARGET_WIDTH:
            raise ValueError(f"{source} is narrower than {TARGET_WIDTH}px")

        left = (source_rgb.width - TARGET_WIDTH) // 2
        cropped = source_rgb.crop((left, 0, left + TARGET_WIDTH, source_rgb.height))
        quantized = quantize_to_palette(cropped)

    destination.parent.mkdir(parents=True, exist_ok=True)
    quantized.save(destination, format="PNG", optimize=True)

    allowed = {rgb(color) for color in PALETTE_HEX}
    color_rows = np.unique(np.asarray(quantized).reshape(-1, 3), axis=0)
    colors = {tuple(int(channel) for channel in color) for color in color_rows}
    if quantized.size != (TARGET_WIDTH, 941):
        raise ValueError(f"unexpected output dimensions: {quantized.size}")
    if not colors.issubset(allowed):
        raise ValueError("output contains colors outside the runtime palette")

    print(
        f"{destination}: {quantized.width}x{quantized.height}, "
        f"{len(colors)} palette colors"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    process(args.source, args.destination)

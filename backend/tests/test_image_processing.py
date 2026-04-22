"""Test per app/utils/image_processing.py (Pillow resize + WebP)."""

from __future__ import annotations

import io

import pytest
from PIL import Image, UnidentifiedImageError

from app.utils.image_processing import (
    DEFAULT_MAX_WIDTH,
    process_image,
)


def _make_png(width: int, height: int, color=(200, 100, 50)) -> bytes:
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _make_animated_gif(frames: int = 3, size: int = 50) -> bytes:
    imgs = [Image.new("RGB", (size, size), color=(i * 40, 100, 100)) for i in range(frames)]
    buf = io.BytesIO()
    imgs[0].save(buf, format="GIF", save_all=True, append_images=imgs[1:], duration=100, loop=0)
    return buf.getvalue()


def test_resize_large_image_to_max_width():
    raw = _make_png(3000, 1500)
    processed = process_image(raw, max_width=1600)

    assert processed.extension == "webp"
    assert processed.width == 1600
    # Proporzionale: 3000:1500 == 1600:800
    assert processed.height == 800


def test_no_resize_if_under_max_width():
    raw = _make_png(800, 600)
    processed = process_image(raw, max_width=1600)

    assert processed.width == 800
    assert processed.height == 600
    assert processed.extension == "webp"


def test_output_is_webp_smaller_than_input_png():
    # PNG 1000x1000 bianco e nero piatto -> WebP qualita' 85 deve essere
    # significativamente piu' piccolo.
    raw = _make_png(1000, 1000)
    processed = process_image(raw)

    assert processed.extension == "webp"
    assert processed.size_bytes < len(raw)


def test_animated_gif_passthrough():
    raw = _make_animated_gif()
    processed = process_image(raw)

    assert processed.extension == "gif"
    # Passthrough: bytes identici
    assert processed.data == raw


def test_invalid_bytes_raise():
    with pytest.raises(UnidentifiedImageError):
        process_image(b"not an image at all")


def test_default_max_width_is_1600():
    # Sanity check sul default
    assert DEFAULT_MAX_WIDTH == 1600


def test_small_image_stays_small_and_webp():
    raw = _make_png(100, 50)
    processed = process_image(raw)

    assert processed.width == 100
    assert processed.height == 50
    assert processed.extension == "webp"
    # Roundtrip: dovremmo essere in grado di rileggere il WebP
    reread = Image.open(io.BytesIO(processed.data))
    assert reread.size == (100, 50)

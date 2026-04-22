"""Image processing: resize + compressione WebP con Pillow.

Standardizza tutte le immagini caricate in GSI a WebP (peso inferiore del 25-35%
rispetto a JPEG di qualità equivalente) con max-width configurabile. I GIF
animati restano GIF (Pillow supporta l'animazione ma la perdiamo con WebP
single-frame — scelta di scope).
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass

from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

# Default conservativi — un'immagine featured di un post editoriale
# standard pesa 400-800 KB dopo compressione.
DEFAULT_MAX_WIDTH = 1600
DEFAULT_QUALITY = 85


@dataclass
class ProcessedImage:
    data: bytes
    extension: str  # "webp" o "gif" (fallback)
    width: int
    height: int
    size_bytes: int


def process_image(
    raw: bytes,
    max_width: int = DEFAULT_MAX_WIDTH,
    quality: int = DEFAULT_QUALITY,
) -> ProcessedImage:
    """Ridimensiona se necessario e converte a WebP.

    - EXIF orientation applicata (evita immagini ruotate male in mobile).
    - Se l'immagine è già <= max_width, salta il resize.
    - GIF animati → passthrough (conservati come GIF).
    - Qualsiasi altro formato → WebP qualità `quality`.

    Raises:
        PIL.UnidentifiedImageError se i bytes non sono un'immagine valida.
    """
    img = Image.open(io.BytesIO(raw))

    # Passthrough per GIF animati — non li convertiamo per non perdere i frame.
    if getattr(img, "is_animated", False):
        return ProcessedImage(
            data=raw,
            extension="gif",
            width=img.width,
            height=img.height,
            size_bytes=len(raw),
        )

    img = ImageOps.exif_transpose(img)  # fix rotation mobile
    assert img is not None  # exif_transpose ritorna None solo se input None

    # Converti RGBA → RGB se serve (WebP supporta RGBA, ma il resize potrebbe
    # avere artefatti su PNG trasparenti pesanti).
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.mode else "RGB")

    # Resize proporzionale se oltre il limite.
    if img.width > max_width:
        ratio = max_width / img.width
        new_size = (max_width, int(img.height * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        logger.info(
            "image resized %dx%d -> %dx%d",
            img.width // (new_size[0] // img.width) if new_size[0] else img.width,
            img.height,
            new_size[0],
            new_size[1],
        )

    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=quality, method=6)
    data = buf.getvalue()

    return ProcessedImage(
        data=data,
        extension="webp",
        width=img.width,
        height=img.height,
        size_bytes=len(data),
    )

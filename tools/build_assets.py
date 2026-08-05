"""Готовит веб-ассеты: фотографии в WebP и знак ЯКатолик с прозрачным фоном."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = {
    "background.jpg": ("background", 1920),
    "church.jpg": ("church", 1800),
    "art_one.jpg": ("art-one", 1200),
    "art_two.jpg": ("art-two", 1200),
    "art_four.jpg": ("art-four", 1200),
}
QUALITY = 72
# Знак занимает верхнюю часть макета, ниже идёт словесная часть — она нам не нужна.
MARK_BOTTOM = 0.66


def convert_photo(source: Path, stem: str, max_width: int) -> None:
    with Image.open(source) as image:
        image = image.convert("RGB")
        if image.width > max_width:
            height = round(image.height * max_width / image.width)
            image = image.resize((max_width, height), Image.LANCZOS)
        image.save(ROOT / f"{stem}.webp", "WEBP", quality=QUALITY, method=6)


def build_alpha(source: Path, invert: bool) -> Image.Image:
    """Маска знака: фон подложки убирается, сглаженные края сохраняются."""
    with Image.open(source) as image:
        gray = image.convert("L").crop((0, 0, image.width, round(image.height * MARK_BOTTOM)))

    if invert:
        gray = Image.eval(gray, lambda value: 255 - value)
    # Отсекаем шум JPEG на подложке и растягиваем полутона до чистой маски.
    low, high = 45, 205
    return Image.eval(gray, lambda v: 0 if v <= low else 255 if v >= high else round((v - low) * 255 / (high - low)))


def save_mark(alpha: Image.Image, stem: str, ink: tuple[int, int, int], box: tuple[int, int, int, int]) -> None:
    mark = Image.new("RGBA", alpha.size, (*ink, 0))
    mark.putalpha(alpha)
    mark.crop(box).save(ROOT / f"{stem}.webp", "WEBP", quality=95, method=6, lossless=True)


for name, (stem, width) in PHOTOS.items():
    convert_photo(ROOT / name, stem, width)

black_alpha = build_alpha(ROOT / "logo_black.jpg", invert=True)
white_alpha = build_alpha(ROOT / "logo_white.jpg", invert=False)
# Общая рамка держит оба варианта в одинаковых пропорциях — знак не «прыгает» при смене шапки.
box = tuple(
    min(a, b) if index < 2 else max(a, b)
    for index, (a, b) in enumerate(zip(black_alpha.getbbox(), white_alpha.getbbox()))
)
save_mark(black_alpha, "logo-black", ink=(16, 11, 7), box=box)
save_mark(white_alpha, "logo-white", ink=(255, 255, 255), box=box)

for path in sorted(ROOT.glob("*.webp")):
    with Image.open(path) as image:
        print(f"{path.name:20} {image.width}x{image.height}  {path.stat().st_size // 1024} KB")

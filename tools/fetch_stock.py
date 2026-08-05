"""Скачивает стоковые кадры и конвертирует в WebP."""

from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
STOCK = ROOT / "stock"
STOCK.mkdir(exist_ok=True)

# Люди / молитва / свечи / репортаж / детали / свет
SOURCES = {
    "people-prayer": "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1400&q=85",
    "people-hands": "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=1400&q=85",
    "detail-candle": "https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=1400&q=85",
    "people-crowd": "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=1400&q=85",
    "reportage-street": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1400&q=85",
    "detail-music": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1400&q=85",
    "light-sky": "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1400&q=85",
    "people-portrait": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1400&q=85",
    "detail-book": "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=1400&q=85",
    "reportage-steps": "https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1400&q=85",
}


def download(name: str, url: str) -> Path:
    dest = STOCK / f"{name}.jpg"
    if dest.exists() and dest.stat().st_size > 20_000:
        return dest
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=40) as response:
        dest.write_bytes(response.read())
    return dest


def to_webp(source: Path, stem: str, max_side: int = 1400) -> None:
    with Image.open(source) as image:
        image = image.convert("RGB")
        ratio = max_side / max(image.size)
        if ratio < 1:
            image = image.resize(
                (round(image.width * ratio), round(image.height * ratio)),
                Image.LANCZOS,
            )
        out = ROOT / f"{stem}.webp"
        image.save(out, "WEBP", quality=74, method=6)
        print(f"{out.name:24} {image.width}x{image.height}  {out.stat().st_size // 1024} KB")


for name, url in SOURCES.items():
    try:
        path = download(name, url)
        to_webp(path, name)
    except Exception as error:
        print(f"FAIL {name}: {error}")

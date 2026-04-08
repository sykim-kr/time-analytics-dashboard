from __future__ import annotations

import logging
from pathlib import Path

import yaml
from pydantic import BaseModel

logger = logging.getLogger(__name__)

DEFAULT_THEME_PATH = Path(__file__).parent.parent / "themes" / "default.yaml"


class ThemeMeta(BaseModel):
    name: str = "Clean Structure"
    slide_width: float = 13.333
    slide_height: float = 7.5


class ThemeColors(BaseModel):
    primary: str = "#3B5998"
    secondary: str = "#4A5568"
    accent: str = "#FF6B6B"
    accent_yellow: str = "#FFD93D"
    accent_purple: str = "#6C5CE7"
    background: str = "#F8F9FA"
    section_bg: str = "#3B5998"
    section_text: str = "#FFFFFF"
    placeholder_bg: str = "#E8ECF1"

    def hex_to_rgb(self, color_name: str) -> tuple[int, int, int]:
        hex_str = getattr(self, color_name).lstrip("#")
        return (int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16))

    def hex_to_rgb_raw(self, hex_str: str) -> tuple[int, int, int]:
        hex_str = hex_str.lstrip("#")
        return (int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16))


class FontConfig(BaseModel):
    name: str = "Arial"
    fallback: list[str] = ["Arial", "Helvetica"]
    size: int = 14
    bold: bool = False


class ThemeFonts(BaseModel):
    title: FontConfig = FontConfig(name="맑은 고딕", size=28, bold=True)
    subtitle: FontConfig = FontConfig(name="맑은 고딕", size=18)
    body: FontConfig = FontConfig(name="맑은 고딕", size=14)
    note: FontConfig = FontConfig(name="맑은 고딕", size=11)


class ThemeMargin(BaseModel):
    top: float = 0.8
    bottom: float = 0.5
    left: float = 0.8
    right: float = 0.8


class ThemeLayout(BaseModel):
    margin: ThemeMargin = ThemeMargin()
    title_top: float = 0.8
    body_top: float = 1.8
    bullet_indent: float = 0.3
    line_spacing: float = 1.2


class Theme(BaseModel):
    meta: ThemeMeta = ThemeMeta()
    colors: ThemeColors = ThemeColors()
    fonts: ThemeFonts = ThemeFonts()
    layout: ThemeLayout = ThemeLayout()


def load_theme(path: Path | None = None) -> Theme:
    target = path or DEFAULT_THEME_PATH

    if not target.exists():
        logger.warning("Theme file not found: %s — using default", target)
        target = DEFAULT_THEME_PATH

    try:
        raw = target.read_text(encoding="utf-8")
        data = yaml.safe_load(raw)
        return Theme.model_validate(data)
    except Exception:
        logger.warning("Failed to load theme: %s — using defaults", target, exc_info=True)
        return Theme()

from pathlib import Path

from src.theme import Theme, load_theme

THEMES_DIR = Path(__file__).parent.parent / "themes"


def test_load_default_theme():
    theme = load_theme(THEMES_DIR / "default.yaml")
    assert theme.meta.name == "Memphis Corporate"
    assert theme.meta.slide_width == 13.333


def test_theme_colors():
    theme = load_theme(THEMES_DIR / "default.yaml")
    assert theme.colors.primary == "#3B5998"
    assert theme.colors.accent == "#FF6B6B"
    assert theme.colors.accent_yellow == "#FFD93D"
    assert theme.colors.accent_purple == "#6C5CE7"


def test_theme_fonts():
    theme = load_theme(THEMES_DIR / "default.yaml")
    assert theme.fonts.title.name == "맑은 고딕"
    assert theme.fonts.title.size == 26
    assert theme.fonts.title.bold is True
    assert "Segoe UI" in theme.fonts.title.fallback


def test_theme_layout():
    theme = load_theme(THEMES_DIR / "default.yaml")
    assert theme.layout.margin.top == 0.7
    assert theme.layout.body_top == 1.5


def test_load_nonexistent_falls_back(tmp_path):
    theme = load_theme(tmp_path / "nope.yaml")
    assert theme.meta.name == "Memphis Corporate"


def test_hex_to_rgb():
    theme = load_theme(THEMES_DIR / "default.yaml")
    r, g, b = theme.colors.hex_to_rgb("primary")
    assert (r, g, b) == (0x3B, 0x59, 0x98)

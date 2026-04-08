from __future__ import annotations

import logging
import re

from pydantic import BaseModel

from src.models import (
    Metadata,
    Presentation,
    Slide,
    SlideType,
    TableData,
)

logger = logging.getLogger(__name__)


class ParserConfig(BaseModel):
    slide_delimiters: list[str] = [
        r"^## Slide \d+",
        r"^## Page \d+",
        r"^---$",
        r"^# ",
    ]
    section_marker: str = r"^\d+\.\s+"
    image_markers: list[str] = [
        "(이미지 예시 슬라이드)",
        "(이미지",
        "(차트",
    ]
    appendix_marker: str = r"^Appendix\s+[A-Z]"
    encoding: str = "utf-8"


class MarkdownParser:
    def __init__(self, config: ParserConfig | None = None):
        self.config = config or ParserConfig()

    def _split_into_blocks(self, text: str) -> list[str]:
        """1st pass: split markdown into per-slide text blocks."""
        if not text.strip():
            return []

        pattern = "|".join(f"({d})" for d in self.config.slide_delimiters)
        compiled = re.compile(pattern, re.MULTILINE)

        splits: list[int] = [m.start() for m in compiled.finditer(text)]

        if not splits:
            return [text.strip()]

        blocks: list[str] = []
        for i, start in enumerate(splits):
            end = splits[i + 1] if i + 1 < len(splits) else len(text)
            block = text[start:end].strip()
            if block:
                blocks.append(block)

        return blocks

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
    TYPE_HINTS: dict[SlideType, list[str]] = {
        SlideType.TITLE: ["title", "타이틀"],
        SlideType.OVERVIEW: ["overview", "목차", "agenda"],
        SlideType.CONCEPT: ["concept", "개념"],
        SlideType.EXAMPLE: [
            "\U0001f4cc",  # 📌
            "\U0001f4a1",  # 💡
            "사례",
            "example",
        ],
        SlideType.FRAMEWORK: ["framework", "프레임워크", "모델"],
        SlideType.DATA_REPORT: [
            "\U0001f4ca",  # 📊
            "data",
            "report",
            "리포트",
        ],
        SlideType.CRM_EXPERIMENT: [
            "\U0001f5b1",  # 🖱
            "\U0001f680",  # 🚀
            "crm",
            "experiment",
        ],
        SlideType.EXERCISE: [
            "\U0001f9ea",  # 🧪
            "\U0001f3af",  # 🎯
            "exercise",
            "과제",
            "실습",
        ],
        SlideType.SUMMARY: ["summary", "정리", "요약", "wrap"],
    }

    TYPE_TAG_RE = re.compile(r"^-\s*Type:\s*(.+)$", re.MULTILINE)
    OBJECTIVE_RE = re.compile(r"^-\s*Objective:\s*(.+)$", re.MULTILINE)
    SLIDE_TITLE_RE = re.compile(r"^##\s+Slide\s+\d+\.\s*(.+)$", re.MULTILINE)
    PAGE_TITLE_RE = re.compile(r"^##\s+Page\s+\d+\s*$", re.MULTILINE)
    SECTION_HEADER_RE = re.compile(
        r"^###\s+(Key Message|Body|Visual Suggestion|Speaker Note)\s*$",
        re.MULTILINE,
    )

    def __init__(self, config: ParserConfig | None = None):
        self.config = config or ParserConfig()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def parse(
        self, text: str, *, source_file: str = ""
    ) -> Presentation:
        """Full parse: 1st pass (split) + 2nd pass (extract fields)."""
        blocks = self._split_into_blocks(text)
        slides: list[Slide] = []
        current_section = ""
        for idx, block in enumerate(blocks, start=1):
            slide, current_section = self._extract_slide(
                block, idx, current_section
            )
            slides.append(slide)

        pres_title = slides[0].title if slides else ""
        metadata = Metadata(
            source_file=source_file,
            page_count=len(slides),
        )
        return Presentation(title=pres_title, slides=slides, metadata=metadata)

    # ------------------------------------------------------------------
    # 2nd-pass helpers
    # ------------------------------------------------------------------

    def _extract_slide(
        self, block: str, number: int, prev_section: str
    ) -> tuple[Slide, str]:
        title = self._extract_title(block)
        section = self._detect_section(block) or prev_section
        objective = ""
        key_message: list[str] = []
        body: list[str | TableData] = []
        visual_suggestion: str | None = None
        speaker_note: str | None = None
        image_placeholder = False

        obj_m = self.OBJECTIVE_RE.search(block)
        if obj_m:
            objective = obj_m.group(1).strip()

        # Check for image markers
        for marker in self.config.image_markers:
            if marker in block:
                image_placeholder = True
                break

        # Check for appendix
        is_appendix = bool(re.search(self.config.appendix_marker, block, re.MULTILINE))

        # Structured format (### sections)
        sections = self._split_sections(block)
        if sections:
            key_message = self._bullets_from(sections.get("Key Message", ""))
            body = self._parse_body(sections.get("Body", ""))
            vs = sections.get("Visual Suggestion", "")
            visual_suggestion = vs.strip() or None
            if visual_suggestion:
                # Remove leading "- "
                visual_suggestion = re.sub(r"^-\s*", "", visual_suggestion).strip()
            sn = sections.get("Speaker Note", "")
            speaker_note = sn.strip() or None
            if speaker_note:
                speaker_note = re.sub(r"^-\s*", "", speaker_note).strip()
        else:
            # Page format — treat all non-header lines as body
            body = self._fallback_body(block)

        # Type detection
        slide_type = self._detect_type(block, image_placeholder, is_appendix)

        return Slide(
            number=number,
            title=title,
            type=slide_type,
            objective=objective,
            key_message=key_message,
            body=body,
            visual_suggestion=visual_suggestion,
            speaker_note=speaker_note,
            section=section,
            image_placeholder=image_placeholder,
        ), section

    def _extract_title(self, block: str) -> str:
        # Structured: ## Slide N. Title
        m = self.SLIDE_TITLE_RE.search(block)
        if m:
            return m.group(1).strip()
        # Page: ## Page N  →  next non-empty line
        m = self.PAGE_TITLE_RE.search(block)
        if m:
            rest = block[m.end():]
            for line in rest.splitlines():
                line = line.strip()
                if line and not line.startswith("-"):
                    # skip metadata lines like "- Type:"
                    return line
        return ""

    def _detect_section(self, block: str) -> str:
        pattern = re.compile(r"^\d+\.\s+(.+)$", re.MULTILINE)
        m = pattern.search(block)
        if m:
            return m.group(1).strip()
        return ""

    def _detect_type(
        self, block: str, image_placeholder: bool, is_appendix: bool
    ) -> SlideType:
        if image_placeholder:
            return SlideType.IMAGE_REFERENCE
        if is_appendix:
            return SlideType.APPENDIX

        # Explicit type tag
        tag_m = self.TYPE_TAG_RE.search(block)
        if tag_m:
            tag = tag_m.group(1).strip().lower()
            for stype, keywords in self.TYPE_HINTS.items():
                for kw in keywords:
                    if kw in tag:
                        return stype

        # Heuristic from full block text
        lower = block.lower()
        for stype, keywords in self.TYPE_HINTS.items():
            for kw in keywords:
                if kw in lower:
                    return stype

        return SlideType.CONCEPT

    def _split_sections(self, block: str) -> dict[str, str]:
        """Split a structured slide block into named sections."""
        parts: dict[str, str] = {}
        headers = list(self.SECTION_HEADER_RE.finditer(block))
        if not headers:
            return parts
        for i, m in enumerate(headers):
            name = m.group(1)
            start = m.end()
            end = headers[i + 1].start() if i + 1 < len(headers) else len(block)
            parts[name] = block[start:end].strip()
        return parts

    def _fallback_body(self, block: str) -> list[str | TableData]:
        """Extract body from a Page-format block (no ### sections)."""
        items: list[str | TableData] = []
        for line in block.splitlines():
            line = line.strip()
            if not line:
                continue
            if line.startswith("## "):
                continue
            if line.startswith("- Type:") or line.startswith("- Objective:"):
                continue
            items.append(line)
        return items

    def _bullets_from(self, text: str) -> list[str]:
        items: list[str] = []
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            line = re.sub(r"^[-●]\s*", "", line)
            if line:
                items.append(line)
        return items

    def _parse_body(self, text: str) -> list[str | TableData]:
        items: list[str | TableData] = []
        table_lines: list[str] = []

        def flush_table() -> None:
            if table_lines:
                tbl = self._build_table(table_lines)
                if tbl:
                    items.append(tbl)
                table_lines.clear()

        for line in text.splitlines():
            stripped = line.strip()
            if not stripped:
                flush_table()
                continue
            # Detect table line: contains | but is not a bullet
            if "|" in stripped and not stripped.startswith("●") and not stripped.startswith("-"):
                table_lines.append(stripped)
            else:
                flush_table()
                cleaned = re.sub(r"^[-●]\s*", "", stripped)
                if cleaned:
                    items.append(cleaned)

        flush_table()
        return items

    def _build_table(self, lines: list[str]) -> TableData | None:
        if not lines:
            return None
        # First line is headers
        headers = [c.strip() for c in lines[0].split("|") if c.strip()]
        rows: list[list[str]] = []
        for row_line in lines[1:]:
            # skip separator lines (e.g. |---|---|)
            if re.match(r"^[\s|:-]+$", row_line):
                continue
            cells = [c.strip() for c in row_line.split("|") if c.strip()]
            if cells:
                rows.append(cells)
        return TableData(headers=headers, rows=rows)

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

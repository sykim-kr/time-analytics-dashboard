# Slide Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated pipeline that converts markdown files into PowerPoint presentations, with optional Claude API enhancement.

**Architecture:** 3-stage pipeline (Parse → Enhance → Render) with Pydantic data models as the intermediate format. Rule-based markdown parser handles structure extraction, optional Claude API enhancer improves content quality, and python-pptx renderer produces the final .pptx with theme support.

**Tech Stack:** Python 3.11+, Pydantic v2, python-pptx, PyYAML, anthropic SDK (optional), pytest

**Spec:** `docs/superpowers/specs/2026-04-07-slide-generator-design.md`

---

## File Structure

```
slide-generator/
├── src/
│   ├── __init__.py
│   ├── models.py          # Pydantic models: SlideType, TableData, Slide, Metadata, Presentation
│   ├── parser.py          # MarkdownParser: 2-pass parsing (split → extract)
│   ├── theme.py           # ThemeLoader: YAML → Theme dataclass
│   ├── renderer.py        # PptxRenderer: SlideData + Theme → .pptx
│   ├── enhancer.py        # ClaudeEnhancer: optional AI enhancement
│   └── cli.py             # CLI entry point (argparse)
├── themes/
│   └── default.yaml
├── tests/
│   ├── __init__.py
│   ├── conftest.py        # shared fixtures
│   ├── test_models.py
│   ├── test_parser.py
│   ├── test_theme.py
│   ├── test_renderer.py
│   ├── test_enhancer.py
│   ├── test_cli.py
│   └── fixtures/
│       ├── sample_simple.md
│       └── sample_structured.md
├── requirements.txt
└── pyproject.toml
```

---

## Task 1: Project Setup & Models

**Files:**
- Create: `slide-generator/requirements.txt`
- Create: `slide-generator/pyproject.toml`
- Create: `slide-generator/src/__init__.py`
- Create: `slide-generator/src/models.py`
- Create: `slide-generator/tests/__init__.py`
- Create: `slide-generator/tests/test_models.py`

- [ ] **Step 1: Create project skeleton**

```bash
cd "c:/Users/ottug/Downloads/11_개발_테스트/time analytics framework"
mkdir -p slide-generator/src slide-generator/tests/fixtures slide-generator/themes
```

- [ ] **Step 2: Write requirements.txt**

Create `slide-generator/requirements.txt`:
```
python-pptx>=0.6.23
pydantic>=2.0
pyyaml>=6.0
anthropic>=0.40.0
pytest>=8.0
```

- [ ] **Step 3: Write pyproject.toml**

Create `slide-generator/pyproject.toml`:
```toml
[project]
name = "slide-generator"
version = "0.1.0"
requires-python = ">=3.11"

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 4: Write the failing test for models**

Create `slide-generator/tests/test_models.py`:
```python
from src.models import SlideType, TableData, Slide, Metadata, Presentation


def test_slide_type_enum_has_all_types():
    expected = {
        "title", "overview", "concept", "example", "framework",
        "data_report", "crm_experiment", "exercise", "summary",
        "appendix", "image_reference",
    }
    actual = {t.value for t in SlideType}
    assert actual == expected


def test_table_data_creation():
    td = TableData(headers=["A", "B"], rows=[["1", "2"], ["3", "4"]])
    assert td.headers == ["A", "B"]
    assert len(td.rows) == 2


def test_slide_defaults():
    s = Slide(number=1, title="Test", type=SlideType.CONCEPT)
    assert s.objective == ""
    assert s.key_message == []
    assert s.body == []
    assert s.visual_suggestion is None
    assert s.speaker_note is None
    assert s.section == ""
    assert s.image_placeholder is False


def test_slide_with_table_in_body():
    td = TableData(headers=["Col1"], rows=[["Val1"]])
    s = Slide(number=1, title="T", type=SlideType.CONCEPT, body=["bullet", td])
    assert isinstance(s.body[0], str)
    assert isinstance(s.body[1], TableData)


def test_metadata_defaults():
    m = Metadata()
    assert m.source_file == ""
    assert m.page_count == 0


def test_presentation_creation():
    slide = Slide(number=1, title="Title", type=SlideType.TITLE)
    p = Presentation(title="Test Deck", slides=[slide])
    assert p.title == "Test Deck"
    assert len(p.slides) == 1
    assert p.metadata.source_file == ""


def test_presentation_serialization_roundtrip():
    slide = Slide(
        number=1,
        title="Hello",
        type=SlideType.EXAMPLE,
        body=["bullet1", TableData(headers=["H"], rows=[["R"]])],
    )
    p = Presentation(title="Deck", slides=[slide])
    json_str = p.model_dump_json()
    p2 = Presentation.model_validate_json(json_str)
    assert p2.slides[0].title == "Hello"
    assert isinstance(p2.slides[0].body[1], TableData)
```

- [ ] **Step 5: Run test to verify it fails**

```bash
cd "c:/Users/ottug/Downloads/11_개발_테스트/time analytics framework/slide-generator"
python -m pytest tests/test_models.py -v
```
Expected: FAIL — `ModuleNotFoundError: No module named 'src.models'`

- [ ] **Step 6: Write models.py**

Create `slide-generator/src/__init__.py` (empty) and `slide-generator/tests/__init__.py` (empty).

Create `slide-generator/src/models.py`:
```python
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class SlideType(str, Enum):
    TITLE = "title"
    OVERVIEW = "overview"
    CONCEPT = "concept"
    EXAMPLE = "example"
    FRAMEWORK = "framework"
    DATA_REPORT = "data_report"
    CRM_EXPERIMENT = "crm_experiment"
    EXERCISE = "exercise"
    SUMMARY = "summary"
    APPENDIX = "appendix"
    IMAGE_REFERENCE = "image_reference"


class TableData(BaseModel):
    headers: list[str]
    rows: list[list[str]]


class Slide(BaseModel):
    number: int
    title: str
    type: SlideType
    objective: str = ""
    key_message: list[str] = []
    body: list[str | TableData] = []
    visual_suggestion: str | None = None
    speaker_note: str | None = None
    section: str = ""
    image_placeholder: bool = False


class Metadata(BaseModel):
    source_file: str = ""
    created_at: str = ""
    version: str = ""
    page_count: int = 0


class Presentation(BaseModel):
    title: str
    slides: list[Slide]
    metadata: Metadata = Metadata()
```

- [ ] **Step 7: Run tests and verify they pass**

```bash
cd "c:/Users/ottug/Downloads/11_개발_테스트/time analytics framework/slide-generator"
python -m pytest tests/test_models.py -v
```
Expected: All 7 tests PASS

- [ ] **Step 8: Commit**

```bash
git add requirements.txt pyproject.toml src/ tests/test_models.py tests/__init__.py
git commit -m "feat: add project skeleton and Pydantic data models"
```

---

## Task 2: Test Fixtures

**Files:**
- Create: `slide-generator/tests/fixtures/sample_simple.md`
- Create: `slide-generator/tests/fixtures/sample_structured.md`
- Create: `slide-generator/tests/conftest.py`

- [ ] **Step 1: Create sample_simple.md (Page-based format, 3 slides)**

Create `slide-generator/tests/fixtures/sample_simple.md`:
```markdown
## Page 1
2026-04-08 v1.0
시간 기반 분석 프레임워크

## Page 2
1. Calendar Time 분석
💡 핵심 분석 사례
📌 사례 1: 월초 vs 월말 소비 패턴
질문
● "월말 매출 상승은 프로모션 때문인가, 급여 때문인가?"
인사이트
● 월급일 이후 구매 집중
● 월말 budget 소진 행동

## Page 3
1. Calendar Time 분석
🧪 과제 1: Golden Time 찾기
질문
● 언제 구매가 가장 많이 발생하는가?
분석
● hour_of_day breakdown
```

- [ ] **Step 2: Create sample_structured.md (Slide-format output, 3 slides)**

Create `slide-generator/tests/fixtures/sample_structured.md`:
```markdown
## Slide 1. 시간 기반 분석 프레임워크
- Type: Title Slide
- Objective: 프레임워크 소개

### Key Message
- 시간을 분석의 핵심 축으로

### Body
- 2026-04-08 v1.0

### Visual Suggestion
- 타이틀 이미지

### Speaker Note
- 인사 후 프레임워크 소개로 시작

## Slide 2. Calendar Time 개념
- Type: Concept Slide
- Objective: Calendar Time 구조 이해

### Key Message
- 시간을 쪼개고 패턴을 읽는 능력

### Body
- 연 / 분기 / 월 / 주 / 일 / 시간 / 분
- 월초 - 월중 - 월말
- 요일 (월~일)
분석 기준 | 설명
얼리버드 vs 나이트 아울 | 새벽 활동자와 자정 이후 활동자 비교
점심시간 반짝 쇼핑 | 12:00~13:30 모바일 집중도 분석

### Speaker Note
- Calendar Time의 4가지 레이어를 설명합니다

## Slide 3. 팀 실습
- Type: Exercise Slide
- Objective: Golden Time 찾기 실습

### Body
- 🧪 과제 1: hour_of_day breakdown
- 🧪 과제 2: 월초 vs 월말 비교
```

- [ ] **Step 3: Create conftest.py with shared fixtures**

Create `slide-generator/tests/conftest.py`:
```python
from pathlib import Path

import pytest

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def sample_simple_path():
    return FIXTURES_DIR / "sample_simple.md"


@pytest.fixture
def sample_structured_path():
    return FIXTURES_DIR / "sample_structured.md"


@pytest.fixture
def sample_simple_text(sample_simple_path):
    return sample_simple_path.read_text(encoding="utf-8")


@pytest.fixture
def sample_structured_text(sample_structured_path):
    return sample_structured_path.read_text(encoding="utf-8")
```

- [ ] **Step 4: Commit**

```bash
git add tests/conftest.py tests/fixtures/
git commit -m "feat: add test fixtures and conftest"
```

---

## Task 3: Parser — 1st Pass (Slide Splitting)

**Files:**
- Create: `slide-generator/src/parser.py`
- Create: `slide-generator/tests/test_parser.py`

- [ ] **Step 1: Write failing tests for 1st pass**

Create `slide-generator/tests/test_parser.py`:
```python
from src.parser import MarkdownParser, ParserConfig


class TestFirstPass:
    """Tests for slide boundary splitting."""

    def test_split_page_delimiters(self, sample_simple_text):
        parser = MarkdownParser()
        blocks = parser._split_into_blocks(sample_simple_text)
        assert len(blocks) == 3

    def test_split_slide_delimiters(self, sample_structured_text):
        parser = MarkdownParser()
        blocks = parser._split_into_blocks(sample_structured_text)
        assert len(blocks) == 3

    def test_split_preserves_content(self, sample_simple_text):
        parser = MarkdownParser()
        blocks = parser._split_into_blocks(sample_simple_text)
        # First block should contain the title info
        assert "v1.0" in blocks[0]

    def test_split_no_delimiters_returns_single_block(self):
        text = "Just some text\nwith no delimiters\n"
        parser = MarkdownParser()
        blocks = parser._split_into_blocks(text)
        assert len(blocks) == 1

    def test_split_empty_input(self):
        parser = MarkdownParser()
        blocks = parser._split_into_blocks("")
        assert len(blocks) == 0

    def test_split_custom_delimiter(self):
        text = "--- SLIDE ---\nContent 1\n--- SLIDE ---\nContent 2\n"
        config = ParserConfig(slide_delimiters=[r"^--- SLIDE ---$"])
        parser = MarkdownParser(config=config)
        blocks = parser._split_into_blocks(text)
        assert len(blocks) == 2
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "c:/Users/ottug/Downloads/11_개발_테스트/time analytics framework/slide-generator"
python -m pytest tests/test_parser.py::TestFirstPass -v
```
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement parser 1st pass**

Create `slide-generator/src/parser.py`:
```python
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
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
python -m pytest tests/test_parser.py::TestFirstPass -v
```
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/parser.py tests/test_parser.py
git commit -m "feat: add parser 1st pass — slide boundary splitting"
```

---

## Task 4: Parser — 2nd Pass (Field Extraction)

**Files:**
- Modify: `slide-generator/src/parser.py`
- Modify: `slide-generator/tests/test_parser.py`

- [ ] **Step 1: Write failing tests for 2nd pass**

Append to `slide-generator/tests/test_parser.py`:
```python
from src.models import SlideType, TableData


class TestSecondPass:
    """Tests for field extraction from slide blocks."""

    def test_extract_structured_slide_title(self, sample_structured_text):
        parser = MarkdownParser()
        slides = parser.parse(sample_structured_text)
        assert slides.slides[0].title == "시간 기반 분석 프레임워크"

    def test_extract_structured_slide_type(self, sample_structured_text):
        parser = MarkdownParser()
        slides = parser.parse(sample_structured_text)
        assert slides.slides[0].type == SlideType.TITLE

    def test_extract_structured_slide_objective(self, sample_structured_text):
        parser = MarkdownParser()
        slides = parser.parse(sample_structured_text)
        assert slides.slides[0].objective == "프레임워크 소개"

    def test_extract_key_message(self, sample_structured_text):
        parser = MarkdownParser()
        slides = parser.parse(sample_structured_text)
        assert "시간을 분석의 핵심 축으로" in slides.slides[0].key_message[0]

    def test_extract_speaker_note(self, sample_structured_text):
        parser = MarkdownParser()
        slides = parser.parse(sample_structured_text)
        assert slides.slides[0].speaker_note is not None
        assert "인사" in slides.slides[0].speaker_note

    def test_extract_visual_suggestion(self, sample_structured_text):
        parser = MarkdownParser()
        slides = parser.parse(sample_structured_text)
        assert slides.slides[0].visual_suggestion is not None

    def test_extract_body_bullets(self, sample_structured_text):
        parser = MarkdownParser()
        slides = parser.parse(sample_structured_text)
        concept_slide = slides.slides[1]  # Slide 2: Concept
        str_items = [b for b in concept_slide.body if isinstance(b, str)]
        assert len(str_items) >= 3

    def test_extract_table_from_body(self, sample_structured_text):
        parser = MarkdownParser()
        slides = parser.parse(sample_structured_text)
        concept_slide = slides.slides[1]
        tables = [b for b in concept_slide.body if isinstance(b, TableData)]
        assert len(tables) == 1
        assert "얼리버드" in tables[0].rows[0][0]

    def test_page_format_section_detection(self, sample_simple_text):
        parser = MarkdownParser()
        slides = parser.parse(sample_simple_text)
        assert slides.slides[1].section == "Calendar Time 분석"

    def test_page_format_type_heuristic(self, sample_simple_text):
        parser = MarkdownParser()
        slides = parser.parse(sample_simple_text)
        # Page 2 has "사례" and "📌" → EXAMPLE
        assert slides.slides[1].type == SlideType.EXAMPLE
        # Page 3 has "과제" and "🧪" → EXERCISE
        assert slides.slides[2].type == SlideType.EXERCISE

    def test_slide_numbering(self, sample_simple_text):
        parser = MarkdownParser()
        slides = parser.parse(sample_simple_text)
        numbers = [s.number for s in slides.slides]
        assert numbers == [1, 2, 3]

    def test_presentation_metadata(self, sample_simple_path):
        parser = MarkdownParser()
        text = sample_simple_path.read_text(encoding="utf-8")
        slides = parser.parse(text, source_file=str(sample_simple_path))
        assert slides.metadata.source_file == str(sample_simple_path)
        assert slides.metadata.page_count == 3


class TestImageAndAppendix:
    """Tests for image placeholder and appendix detection."""

    def test_image_marker_detection(self):
        text = "## Page 1\n(이미지 예시 슬라이드)\nSome description"
        parser = MarkdownParser()
        slides = parser.parse(text)
        assert slides.slides[0].image_placeholder is True
        assert slides.slides[0].type == SlideType.IMAGE_REFERENCE

    def test_appendix_detection(self):
        text = "## Page 1\nAppendix A. Mixpanel 리포트 목록\n● Item 1"
        parser = MarkdownParser()
        slides = parser.parse(text)
        assert slides.slides[0].type == SlideType.APPENDIX
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
python -m pytest tests/test_parser.py::TestSecondPass tests/test_parser.py::TestImageAndAppendix -v
```
Expected: FAIL — `AttributeError: 'MarkdownParser' object has no attribute 'parse'`

- [ ] **Step 3: Implement 2nd pass and parse method**

Add to `slide-generator/src/parser.py` inside `MarkdownParser` class:

```python
    # --- Type hint mapping ---
    TYPE_HINTS: dict[SlideType, list[str]] = {
        SlideType.EXERCISE: ["과제", "\U0001f9ea", "실습", "Quiz", "Think"],
        SlideType.EXAMPLE: ["사례", "\U0001f4cc", "예시"],
        SlideType.CRM_EXPERIMENT: ["CRM", "실험 설계", "Experiment", "\U0001f680"],
        SlideType.DATA_REPORT: ["\U0001f4ca", "Report", "Mixpanel", "\U0001f5b1"],
        SlideType.FRAMEWORK: ["프레임워크", "핵심 정의", "구조"],
        SlideType.SUMMARY: ["정리", "핵심 인사이트", "\U0001f4a1", "최종"],
        SlideType.TITLE: ["v1.0", "Title"],
        SlideType.OVERVIEW: ["커리큘럼", "주제", "\U0001f3af 주제"],
        SlideType.APPENDIX: ["Appendix", "부록"],
    }

    # --- Structured field patterns ---
    TYPE_TAG_RE = re.compile(r"^- Type:\s*(.+)", re.MULTILINE)
    OBJECTIVE_RE = re.compile(r"^- Objective:\s*(.+)", re.MULTILINE)
    SLIDE_TITLE_RE = re.compile(r"^## Slide \d+\.\s*(.+)")
    PAGE_TITLE_RE = re.compile(r"^## Page \d+")
    SECTION_HEADER_RE = re.compile(r"### (Key Message|Body|Visual Suggestion|Speaker Note)")

    def parse(self, text: str, source_file: str = "") -> Presentation:
        """Full 2-pass parse: split then extract."""
        blocks = self._split_into_blocks(text)
        slides: list[Slide] = []
        current_section = ""

        for i, block in enumerate(blocks):
            slide, current_section = self._extract_slide(
                block, i + 1, current_section
            )
            slides.append(slide)

        title = slides[0].title if slides else "Untitled"
        return Presentation(
            title=title,
            slides=slides,
            metadata=Metadata(
                source_file=source_file,
                page_count=len(slides),
            ),
        )

    def _extract_slide(
        self, block: str, number: int, prev_section: str
    ) -> tuple[Slide, str]:
        """2nd pass: extract all fields from a single slide block."""
        lines = block.split("\n")

        # --- Title ---
        title = self._extract_title(lines)

        # --- Section ---
        section = self._detect_section(block, prev_section)

        # --- Image placeholder ---
        is_image = any(m in block for m in self.config.image_markers)

        # --- Appendix ---
        is_appendix = bool(re.search(self.config.appendix_marker, block, re.MULTILINE))

        # --- Type ---
        slide_type = self._detect_type(block, is_image, is_appendix)

        # --- Structured fields (### sections) ---
        objective = self._extract_tag(self.OBJECTIVE_RE, block)
        sections = self._split_sections(block)

        key_message = self._bullets_from(sections.get("Key Message", ""))
        body_raw = sections.get("Body", "")
        visual = sections.get("Visual Suggestion", "")
        note = sections.get("Speaker Note", "")

        # If no ### sections found, treat remaining lines as body
        if not sections:
            body_raw = self._fallback_body(lines)

        body = self._parse_body(body_raw)

        return Slide(
            number=number,
            title=title,
            type=slide_type,
            objective=objective,
            key_message=key_message,
            body=body,
            visual_suggestion=visual.strip() or None,
            speaker_note=note.strip() or None,
            section=section,
            image_placeholder=is_image,
        ), section

    def _extract_title(self, lines: list[str]) -> str:
        first = lines[0] if lines else ""
        m = self.SLIDE_TITLE_RE.match(first)
        if m:
            return m.group(1).strip()
        m = self.PAGE_TITLE_RE.match(first)
        if m:
            # Use first non-empty content line after ## Page N as title
            for line in lines[1:]:
                stripped = line.strip()
                if stripped and not stripped.startswith("- Type") and not stripped.startswith("- Objective"):
                    return stripped
        return first.lstrip("#").strip()

    def _detect_section(self, block: str, prev_section: str) -> str:
        m = re.search(self.config.section_marker, block, re.MULTILINE)
        if m:
            # Extract the rest of the line
            line_start = m.start()
            line_end = block.find("\n", line_start)
            if line_end == -1:
                line_end = len(block)
            section_line = block[line_start:line_end]
            # Remove leading number pattern
            return re.sub(r"^\d+\.\s*", "", section_line).strip()
        return prev_section

    def _detect_type(
        self, block: str, is_image: bool, is_appendix: bool
    ) -> SlideType:
        if is_image:
            return SlideType.IMAGE_REFERENCE
        if is_appendix:
            return SlideType.APPENDIX

        # Explicit tag
        m = self.TYPE_TAG_RE.search(block)
        if m:
            raw = m.group(1).strip().lower().replace(" slide", "")
            for st in SlideType:
                if st.value == raw:
                    return st

        # Heuristic
        for slide_type, hints in self.TYPE_HINTS.items():
            if any(h in block for h in hints):
                return slide_type

        return SlideType.CONCEPT

    def _extract_tag(self, pattern: re.Pattern, block: str) -> str:
        m = pattern.search(block)
        return m.group(1).strip() if m else ""

    def _split_sections(self, block: str) -> dict[str, str]:
        """Split block by ### headers, return {header: content}."""
        parts: dict[str, str] = {}
        current_key: str | None = None
        current_lines: list[str] = []

        for line in block.split("\n"):
            m = self.SECTION_HEADER_RE.match(line)
            if m:
                if current_key is not None:
                    parts[current_key] = "\n".join(current_lines)
                current_key = m.group(1)
                current_lines = []
            elif current_key is not None:
                current_lines.append(line)

        if current_key is not None:
            parts[current_key] = "\n".join(current_lines)

        return parts

    def _fallback_body(self, lines: list[str]) -> str:
        """When no ### sections, use lines after header/type/objective as body."""
        body_lines: list[str] = []
        skip = True
        for line in lines:
            if skip:
                # Skip header, type tag, objective tag
                if (
                    line.startswith("## ")
                    or line.startswith("# ")
                    or line.startswith("- Type:")
                    or line.startswith("- Objective:")
                    or not line.strip()
                ):
                    continue
                skip = False
            body_lines.append(line)
        return "\n".join(body_lines)

    def _bullets_from(self, text: str) -> list[str]:
        """Extract bullet items from text."""
        items: list[str] = []
        for line in text.split("\n"):
            stripped = line.strip()
            if stripped.startswith("- ") or stripped.startswith("● ") or stripped.startswith("○ "):
                items.append(stripped.lstrip("-●○ ").strip())
            elif stripped:
                items.append(stripped)
        return [i for i in items if i]

    def _parse_body(self, raw: str) -> list[str | TableData]:
        """Parse body text into bullets and tables."""
        if not raw.strip():
            return []

        result: list[str | TableData] = []
        table_lines: list[str] = []
        in_table = False

        for line in raw.split("\n"):
            stripped = line.strip()
            is_table_line = "|" in stripped and not stripped.startswith("●") and not stripped.startswith("-")

            if is_table_line:
                # Skip separator rows like "--- | ---"
                if re.match(r"^[\s|:-]+$", stripped):
                    continue
                table_lines.append(stripped)
                in_table = True
            else:
                if in_table and table_lines:
                    result.append(self._build_table(table_lines))
                    table_lines = []
                    in_table = False
                if stripped:
                    result.append(stripped)

        if table_lines:
            result.append(self._build_table(table_lines))

        return result

    def _build_table(self, lines: list[str]) -> TableData:
        """Build TableData from pipe-delimited lines."""
        rows = [
            [cell.strip() for cell in line.strip("|").split("|")]
            for line in lines
        ]
        if len(rows) >= 2:
            return TableData(headers=rows[0], rows=rows[1:])
        return TableData(headers=rows[0] if rows else [], rows=[])
```

- [ ] **Step 4: Run all parser tests**

```bash
python -m pytest tests/test_parser.py -v
```
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/parser.py tests/test_parser.py
git commit -m "feat: add parser 2nd pass — field extraction, type heuristics, table/image/appendix handling"
```

---

## Task 5: Theme Loader

**Files:**
- Create: `slide-generator/themes/default.yaml`
- Create: `slide-generator/src/theme.py`
- Create: `slide-generator/tests/test_theme.py`

- [ ] **Step 1: Create default.yaml**

Create `slide-generator/themes/default.yaml`:
```yaml
meta:
  name: "Clean Structure"
  slide_width: 13.333
  slide_height: 7.5

colors:
  primary: "#2D3748"
  secondary: "#4A5568"
  accent: "#3182CE"
  background: "#FFFFFF"
  section_bg: "#2D3748"
  section_text: "#FFFFFF"
  placeholder_bg: "#E2E8F0"

fonts:
  title:
    name: "맑은 고딕"
    fallback: ["Arial", "Helvetica"]
    size: 28
    bold: true
  subtitle:
    name: "맑은 고딕"
    fallback: ["Arial", "Helvetica"]
    size: 18
    bold: false
  body:
    name: "맑은 고딕"
    fallback: ["Arial", "Helvetica"]
    size: 14
    bold: false
  note:
    name: "맑은 고딕"
    fallback: ["Arial", "Helvetica"]
    size: 11
    bold: false

layout:
  margin:
    top: 0.8
    bottom: 0.5
    left: 0.8
    right: 0.8
  title_top: 0.8
  body_top: 1.8
  bullet_indent: 0.3
  line_spacing: 1.2
```

- [ ] **Step 2: Write failing tests**

Create `slide-generator/tests/test_theme.py`:
```python
from pathlib import Path

from src.theme import Theme, load_theme

THEMES_DIR = Path(__file__).parent.parent / "themes"


def test_load_default_theme():
    theme = load_theme(THEMES_DIR / "default.yaml")
    assert theme.meta.name == "Clean Structure"
    assert theme.meta.slide_width == 13.333


def test_theme_colors():
    theme = load_theme(THEMES_DIR / "default.yaml")
    assert theme.colors.primary == "#2D3748"
    assert theme.colors.accent == "#3182CE"


def test_theme_fonts():
    theme = load_theme(THEMES_DIR / "default.yaml")
    assert theme.fonts.title.name == "맑은 고딕"
    assert theme.fonts.title.size == 28
    assert theme.fonts.title.bold is True
    assert "Arial" in theme.fonts.title.fallback


def test_theme_layout():
    theme = load_theme(THEMES_DIR / "default.yaml")
    assert theme.layout.margin.top == 0.8
    assert theme.layout.body_top == 1.8


def test_load_nonexistent_falls_back(tmp_path):
    theme = load_theme(tmp_path / "nope.yaml")
    # Should return default theme without error
    assert theme.meta.name == "Clean Structure"


def test_hex_to_rgb():
    theme = load_theme(THEMES_DIR / "default.yaml")
    r, g, b = theme.colors.hex_to_rgb("primary")
    assert (r, g, b) == (0x2D, 0x37, 0x48)
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
python -m pytest tests/test_theme.py -v
```
Expected: FAIL

- [ ] **Step 4: Implement theme.py**

Create `slide-generator/src/theme.py`:
```python
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
    primary: str = "#2D3748"
    secondary: str = "#4A5568"
    accent: str = "#3182CE"
    background: str = "#FFFFFF"
    section_bg: str = "#2D3748"
    section_text: str = "#FFFFFF"
    placeholder_bg: str = "#E2E8F0"

    def hex_to_rgb(self, color_name: str) -> tuple[int, int, int]:
        """Convert a named color to (r, g, b) tuple."""
        hex_str = getattr(self, color_name).lstrip("#")
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
    """Load theme from YAML. Falls back to default on error."""
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
```

- [ ] **Step 5: Run tests and verify they pass**

```bash
python -m pytest tests/test_theme.py -v
```
Expected: All 6 tests PASS

- [ ] **Step 6: Commit**

```bash
git add themes/default.yaml src/theme.py tests/test_theme.py
git commit -m "feat: add theme loader with YAML support and fallback"
```

---

## Task 6: Renderer — Core Layout Engine

**Files:**
- Create: `slide-generator/src/renderer.py`
- Create: `slide-generator/tests/test_renderer.py`

- [ ] **Step 1: Write failing tests**

Create `slide-generator/tests/test_renderer.py`:
```python
from pathlib import Path

from pptx import Presentation as PptxPresentation

from src.models import Presentation, Slide, SlideType, TableData, Metadata
from src.renderer import PptxRenderer
from src.theme import load_theme


def _make_presentation(*slides: Slide) -> Presentation:
    return Presentation(
        title="Test",
        slides=list(slides),
        metadata=Metadata(page_count=len(slides)),
    )


def test_render_creates_valid_pptx(tmp_path):
    slide = Slide(number=1, title="Hello", type=SlideType.TITLE)
    pres = _make_presentation(slide)
    renderer = PptxRenderer()
    out = tmp_path / "test.pptx"
    renderer.render(pres, out)
    assert out.exists()
    # Verify it's a valid pptx by reloading
    pptx = PptxPresentation(str(out))
    assert len(pptx.slides) >= 1


def test_render_title_slide(tmp_path):
    slide = Slide(number=1, title="My Title", type=SlideType.TITLE, body=["v1.0"])
    pres = _make_presentation(slide)
    out = tmp_path / "title.pptx"
    PptxRenderer().render(pres, out)
    pptx = PptxPresentation(str(out))
    # Title slide should exist
    assert len(pptx.slides) >= 1


def test_render_concept_with_bullets(tmp_path):
    slide = Slide(
        number=1,
        title="Concept",
        type=SlideType.CONCEPT,
        body=["● Point 1", "  ○ Sub point", "● Point 2"],
    )
    pres = _make_presentation(slide)
    out = tmp_path / "concept.pptx"
    PptxRenderer().render(pres, out)
    pptx = PptxPresentation(str(out))
    assert len(pptx.slides) >= 1


def test_render_table_in_body(tmp_path):
    table = TableData(headers=["Name", "Value"], rows=[["A", "1"], ["B", "2"]])
    slide = Slide(
        number=1,
        title="Data",
        type=SlideType.CONCEPT,
        body=["Intro text", table],
    )
    pres = _make_presentation(slide)
    out = tmp_path / "table.pptx"
    PptxRenderer().render(pres, out)
    pptx = PptxPresentation(str(out))
    assert len(pptx.slides) >= 1


def test_render_speaker_notes(tmp_path):
    slide = Slide(
        number=1,
        title="Notes Test",
        type=SlideType.CONCEPT,
        speaker_note="This is a speaker note",
    )
    pres = _make_presentation(slide)
    out = tmp_path / "notes.pptx"
    PptxRenderer().render(pres, out)
    pptx = PptxPresentation(str(out))
    notes = pptx.slides[0].notes_slide.notes_text_frame.text
    assert "speaker note" in notes


def test_section_divider_inserted(tmp_path):
    s1 = Slide(number=1, title="A", type=SlideType.CONCEPT, section="Sec1")
    s2 = Slide(number=2, title="B", type=SlideType.CONCEPT, section="Sec2")
    pres = _make_presentation(s1, s2)
    out = tmp_path / "sections.pptx"
    PptxRenderer().render(pres, out)
    pptx = PptxPresentation(str(out))
    # Should have 3 slides: s1 + divider + s2
    assert len(pptx.slides) == 3


def test_image_placeholder_slide(tmp_path):
    slide = Slide(
        number=1,
        title="Chart",
        type=SlideType.IMAGE_REFERENCE,
        image_placeholder=True,
        body=["Session/PV 비교 차트"],
    )
    pres = _make_presentation(slide)
    out = tmp_path / "image.pptx"
    PptxRenderer().render(pres, out)
    pptx = PptxPresentation(str(out))
    assert len(pptx.slides) >= 1
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
python -m pytest tests/test_renderer.py -v
```
Expected: FAIL

- [ ] **Step 3: Implement renderer.py**

Create `slide-generator/src/renderer.py`:
```python
from __future__ import annotations

import logging
import re
from pathlib import Path

from pptx import Presentation as PptxPresentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

from src.models import Presentation, Slide, SlideType, TableData
from src.theme import Theme, load_theme

logger = logging.getLogger(__name__)


class PptxRenderer:
    def __init__(self, theme: Theme | None = None):
        self.theme = theme or load_theme()

    def render(self, presentation: Presentation, output_path: Path) -> Path:
        pptx = PptxPresentation()
        pptx.slide_width = Inches(self.theme.meta.slide_width)
        pptx.slide_height = Inches(self.theme.meta.slide_height)

        prev_section: str | None = None

        for slide_data in presentation.slides:
            # Insert section divider if section changed
            if slide_data.section and slide_data.section != prev_section and prev_section is not None:
                self._add_section_divider(pptx, slide_data.section)
            prev_section = slide_data.section

            self._add_slide(pptx, slide_data)

        pptx.save(str(output_path))
        logger.info("Saved %d slides to %s", len(pptx.slides), output_path)
        return output_path

    def _add_slide(self, pptx: PptxPresentation, slide: Slide) -> None:
        layout = pptx.slide_layouts[6]  # Blank layout
        pptx_slide = pptx.slides.add_slide(layout)

        # Warn on overloaded slides
        if len(slide.body) > 20:
            logger.warning("Slide %d has %d body items (>20) — may be overloaded", slide.number, len(slide.body))

        # Type-specific rendering
        type_renderers = {
            SlideType.TITLE: self._render_title_slide,
            SlideType.SUMMARY: self._render_summary_slide,
            SlideType.EXERCISE: self._render_exercise_slide,
            SlideType.EXAMPLE: self._render_example_slide,
            SlideType.CRM_EXPERIMENT: self._render_two_column_slide,
            SlideType.IMAGE_REFERENCE: self._render_image_placeholder,
        }
        renderer = type_renderers.get(slide.type)
        if slide.image_placeholder:
            renderer = self._render_image_placeholder
        if renderer:
            renderer(pptx_slide, slide)
        else:
            # concept, overview, framework, data_report, appendix
            self._render_content_slide(pptx_slide, slide)

        # Speaker notes
        if slide.speaker_note:
            notes = pptx_slide.notes_slide.notes_text_frame
            notes.text = slide.speaker_note

    def _render_title_slide(self, pptx_slide, slide: Slide) -> None:
        t = self.theme
        w = Inches(t.meta.slide_width)
        h = Inches(t.meta.slide_height)

        # Title centered
        title_box = pptx_slide.shapes.add_textbox(
            Inches(t.layout.margin.left),
            Inches(t.meta.slide_height * 0.35),
            w - Inches(t.layout.margin.left + t.layout.margin.right),
            Inches(1.5),
        )
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = slide.title
        p.font.size = Pt(t.fonts.title.size)
        p.font.bold = t.fonts.title.bold
        p.font.name = t.fonts.title.name
        r, g, b = t.colors.hex_to_rgb("primary")
        p.font.color.rgb = RGBColor(r, g, b)
        p.alignment = PP_ALIGN.CENTER

        # Subtitle (first body item or version)
        if slide.body:
            sub_box = pptx_slide.shapes.add_textbox(
                Inches(t.layout.margin.left),
                Inches(t.meta.slide_height * 0.55),
                w - Inches(t.layout.margin.left + t.layout.margin.right),
                Inches(0.8),
            )
            stf = sub_box.text_frame
            stf.word_wrap = True
            sp = stf.paragraphs[0]
            sp.text = slide.body[0] if isinstance(slide.body[0], str) else ""
            sp.font.size = Pt(t.fonts.subtitle.size)
            sp.font.name = t.fonts.subtitle.name
            r, g, b = t.colors.hex_to_rgb("secondary")
            sp.font.color.rgb = RGBColor(r, g, b)
            sp.alignment = PP_ALIGN.CENTER

    def _render_content_slide(self, pptx_slide, slide: Slide) -> None:
        t = self.theme
        usable_w = Inches(t.meta.slide_width - t.layout.margin.left - t.layout.margin.right)

        # Title
        title_box = pptx_slide.shapes.add_textbox(
            Inches(t.layout.margin.left),
            Inches(t.layout.title_top),
            usable_w,
            Inches(0.8),
        )
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = slide.title
        p.font.size = Pt(t.fonts.title.size)
        p.font.bold = t.fonts.title.bold
        p.font.name = t.fonts.title.name
        r, g, b = t.colors.hex_to_rgb("primary")
        p.font.color.rgb = RGBColor(r, g, b)

        # Body
        current_top = t.layout.body_top
        for item in slide.body:
            if isinstance(item, TableData):
                current_top = self._render_table(
                    pptx_slide, item, current_top, t
                )
            else:
                current_top = self._render_bullet(
                    pptx_slide, item, current_top, t
                )

    def _render_summary_slide(self, pptx_slide, slide: Slide) -> None:
        """Summary: accent background + centered key messages."""
        t = self.theme
        bg = pptx_slide.background.fill
        bg.solid()
        r, g, b = t.colors.hex_to_rgb("accent")
        bg.fore_color.rgb = RGBColor(r, g, b)

        usable_w = t.meta.slide_width - t.layout.margin.left - t.layout.margin.right
        # Title in white
        title_box = pptx_slide.shapes.add_textbox(
            Inches(t.layout.margin.left), Inches(t.layout.title_top),
            Inches(usable_w), Inches(0.8),
        )
        p = title_box.text_frame.paragraphs[0]
        p.text = slide.title
        p.font.size = Pt(t.fonts.title.size)
        p.font.bold = True
        p.font.name = t.fonts.title.name
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER

        # Key messages centered
        current_top = t.layout.body_top
        for item in (slide.key_message or []) + [b for b in slide.body if isinstance(b, str)]:
            box = pptx_slide.shapes.add_textbox(
                Inches(t.layout.margin.left), Inches(current_top),
                Inches(usable_w), Inches(0.4),
            )
            box.text_frame.word_wrap = True
            bp = box.text_frame.paragraphs[0]
            bp.text = item if isinstance(item, str) else str(item)
            bp.font.size = Pt(t.fonts.body.size + 2)
            bp.font.name = t.fonts.body.name
            bp.font.color.rgb = RGBColor(255, 255, 255)
            bp.alignment = PP_ALIGN.CENTER
            current_top += 0.45

    def _render_exercise_slide(self, pptx_slide, slide: Slide) -> None:
        """Exercise: title + checklist-style body."""
        t = self.theme
        usable_w = t.meta.slide_width - t.layout.margin.left - t.layout.margin.right
        # Title
        title_box = pptx_slide.shapes.add_textbox(
            Inches(t.layout.margin.left), Inches(t.layout.title_top),
            Inches(usable_w), Inches(0.8),
        )
        p = title_box.text_frame.paragraphs[0]
        p.text = slide.title
        p.font.size = Pt(t.fonts.title.size)
        p.font.bold = True
        p.font.name = t.fonts.title.name
        r, g, b = t.colors.hex_to_rgb("primary")
        p.font.color.rgb = RGBColor(r, g, b)

        # Checklist items
        current_top = t.layout.body_top
        for item in slide.body:
            if isinstance(item, str):
                clean = re.sub(r"^[\s●○\-🧪]+", "", item).strip()
                if not clean:
                    continue
                box = pptx_slide.shapes.add_textbox(
                    Inches(t.layout.margin.left + 0.2), Inches(current_top),
                    Inches(usable_w - 0.2), Inches(0.35),
                )
                box.text_frame.word_wrap = True
                bp = box.text_frame.paragraphs[0]
                bp.text = f"\u2610  {clean}"  # checkbox character
                bp.font.size = Pt(t.fonts.body.size)
                bp.font.name = t.fonts.body.name
                r2, g2, b2 = t.colors.hex_to_rgb("secondary")
                bp.font.color.rgb = RGBColor(r2, g2, b2)
                current_top += 0.38

    def _render_example_slide(self, pptx_slide, slide: Slide) -> None:
        """Example: title + 2-column (question left / insight right)."""
        t = self.theme
        usable_w = t.meta.slide_width - t.layout.margin.left - t.layout.margin.right
        col_w = usable_w / 2 - 0.2

        # Title
        title_box = pptx_slide.shapes.add_textbox(
            Inches(t.layout.margin.left), Inches(t.layout.title_top),
            Inches(usable_w), Inches(0.8),
        )
        p = title_box.text_frame.paragraphs[0]
        p.text = slide.title
        p.font.size = Pt(t.fonts.title.size)
        p.font.bold = True
        p.font.name = t.fonts.title.name
        r, g, b = t.colors.hex_to_rgb("primary")
        p.font.color.rgb = RGBColor(r, g, b)

        # Split body into question/insight halves
        left_items, right_items = [], []
        target = left_items
        for item in slide.body:
            if isinstance(item, str):
                low = item.lower()
                if "인사이트" in low or "insight" in low or "액션" in low:
                    target = right_items
                elif "질문" in low or "question" in low or "상황" in low:
                    target = left_items
            target.append(item)

        current_top = t.layout.body_top
        # Left column
        for item in left_items:
            if isinstance(item, str):
                self._render_bullet(pptx_slide, item, current_top, t,
                                     left=t.layout.margin.left, width=col_w)
                current_top += 0.35
        # Right column
        current_top = t.layout.body_top
        for item in right_items:
            if isinstance(item, str):
                self._render_bullet(pptx_slide, item, current_top, t,
                                     left=t.layout.margin.left + col_w + 0.4, width=col_w)
                current_top += 0.35

    def _render_two_column_slide(self, pptx_slide, slide: Slide) -> None:
        """CRM/Experiment: title + 2-column (CRM left / experiment right)."""
        t = self.theme
        usable_w = t.meta.slide_width - t.layout.margin.left - t.layout.margin.right
        col_w = usable_w / 2 - 0.2

        # Title
        title_box = pptx_slide.shapes.add_textbox(
            Inches(t.layout.margin.left), Inches(t.layout.title_top),
            Inches(usable_w), Inches(0.8),
        )
        p = title_box.text_frame.paragraphs[0]
        p.text = slide.title
        p.font.size = Pt(t.fonts.title.size)
        p.font.bold = True
        p.font.name = t.fonts.title.name
        r, g, b = t.colors.hex_to_rgb("primary")
        p.font.color.rgb = RGBColor(r, g, b)

        # Split by CRM/Experiment markers
        left_items, right_items = [], []
        target = left_items
        for item in slide.body:
            if isinstance(item, str):
                if "실험" in item or "Experiment" in item:
                    target = right_items
                elif "CRM" in item or "🚀" in item:
                    target = left_items
            target.append(item)

        current_top = t.layout.body_top
        for item in left_items:
            if isinstance(item, str):
                self._render_bullet(pptx_slide, item, current_top, t,
                                     left=t.layout.margin.left, width=col_w)
                current_top += 0.35
        current_top = t.layout.body_top
        for item in right_items:
            if isinstance(item, str):
                self._render_bullet(pptx_slide, item, current_top, t,
                                     left=t.layout.margin.left + col_w + 0.4, width=col_w)
                current_top += 0.35

    def _render_bullet(
        self, pptx_slide, text: str, top: float, t: Theme,
        left: float | None = None, width: float | None = None,
    ) -> float:
        # Detect indent level
        level = 0
        clean = text
        if text.strip().startswith("○") or text.startswith("  "):
            level = 1
        if text.startswith("    ") or text.strip().startswith("- "):
            if level == 0:
                level = 1

        clean = re.sub(r"^[\s●○\-]+", "", text).strip()
        if not clean:
            return top

        base_left = left if left is not None else t.layout.margin.left
        indent = base_left + (level * t.layout.bullet_indent)
        usable_w = width if width is not None else (t.meta.slide_width - indent - t.layout.margin.right)

        box = pptx_slide.shapes.add_textbox(
            Inches(indent),
            Inches(top),
            Inches(usable_w),
            Inches(0.35),
        )
        tf = box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]

        # Bullet prefix
        prefix = "  " * level + ("- " if level > 0 else "")
        p.text = prefix + clean
        p.font.size = Pt(t.fonts.body.size)
        p.font.name = t.fonts.body.name
        r, g, b = t.colors.hex_to_rgb("secondary")
        p.font.color.rgb = RGBColor(r, g, b)

        # Bold for arrow lines
        if "→" in clean:
            r2, g2, b2 = t.colors.hex_to_rgb("accent")
            p.font.color.rgb = RGBColor(r2, g2, b2)
            p.font.bold = True

        return top + 0.35

    def _render_table(
        self, pptx_slide, table: TableData, top: float, t: Theme
    ) -> float:
        rows = len(table.rows) + 1  # +1 for header
        cols = len(table.headers)
        if cols == 0:
            return top

        table_w = Inches(t.meta.slide_width - t.layout.margin.left - t.layout.margin.right)
        row_h = Inches(0.35)
        table_h = row_h * rows

        tbl = pptx_slide.shapes.add_table(
            rows, cols,
            Inches(t.layout.margin.left),
            Inches(top),
            table_w,
            table_h,
        ).table

        # Header row
        for ci, header in enumerate(table.headers):
            cell = tbl.cell(0, ci)
            cell.text = header
            for paragraph in cell.text_frame.paragraphs:
                paragraph.font.size = Pt(t.fonts.body.size - 1)
                paragraph.font.bold = True
                paragraph.font.name = t.fonts.body.name

        # Data rows
        for ri, row in enumerate(table.rows):
            for ci, val in enumerate(row):
                if ci < cols:
                    cell = tbl.cell(ri + 1, ci)
                    cell.text = val
                    for paragraph in cell.text_frame.paragraphs:
                        paragraph.font.size = Pt(t.fonts.body.size - 1)
                        paragraph.font.name = t.fonts.body.name

        return top + (rows * 0.35) + 0.2

    def _render_image_placeholder(self, pptx_slide, slide: Slide) -> None:
        t = self.theme
        usable_w = t.meta.slide_width - t.layout.margin.left - t.layout.margin.right

        # Title
        title_box = pptx_slide.shapes.add_textbox(
            Inches(t.layout.margin.left),
            Inches(t.layout.title_top),
            Inches(usable_w),
            Inches(0.8),
        )
        tf = title_box.text_frame
        p = tf.paragraphs[0]
        p.text = slide.title
        p.font.size = Pt(t.fonts.title.size)
        p.font.bold = True
        p.font.name = t.fonts.title.name
        r, g, b = t.colors.hex_to_rgb("primary")
        p.font.color.rgb = RGBColor(r, g, b)

        # Gray placeholder box
        box_w = Inches(usable_w * 0.8)
        box_h = Inches(t.meta.slide_height * 0.6)
        box_left = Inches(t.layout.margin.left + usable_w * 0.1)
        box_top = Inches(t.layout.body_top + 0.2)

        shape = pptx_slide.shapes.add_shape(
            1,  # MSO_SHAPE.RECTANGLE
            box_left, box_top, box_w, box_h,
        )
        r, g, b = t.colors.hex_to_rgb("placeholder_bg")
        shape.fill.solid()
        shape.fill.fore_color.rgb = RGBColor(r, g, b)
        shape.line.fill.background()

        # Description text inside
        tf = shape.text_frame
        tf.word_wrap = True
        desc = slide.visual_suggestion or (
            slide.body[0] if slide.body and isinstance(slide.body[0], str) else "이미지"
        )
        p = tf.paragraphs[0]
        p.text = desc
        p.alignment = PP_ALIGN.CENTER
        p.font.size = Pt(t.fonts.body.size)
        p.font.name = t.fonts.body.name
        r2, g2, b2 = t.colors.hex_to_rgb("secondary")
        p.font.color.rgb = RGBColor(r2, g2, b2)

        # Caption
        from pptx.oxml.ns import qn
        p2 = tf.add_paragraph()
        p2.text = "\n이미지 수동 삽입 필요"
        p2.alignment = PP_ALIGN.CENTER
        p2.font.size = Pt(t.fonts.note.size)
        p2.font.italic = True
        p2.font.name = t.fonts.note.name

    def _add_section_divider(self, pptx: PptxPresentation, section: str) -> None:
        t = self.theme
        layout = pptx.slide_layouts[6]  # Blank
        div_slide = pptx.slides.add_slide(layout)

        # Background color
        background = div_slide.background
        fill = background.fill
        fill.solid()
        r, g, b = t.colors.hex_to_rgb("section_bg")
        fill.fore_color.rgb = RGBColor(r, g, b)

        # Section title centered
        usable_w = t.meta.slide_width - t.layout.margin.left - t.layout.margin.right
        box = div_slide.shapes.add_textbox(
            Inches(t.layout.margin.left),
            Inches(t.meta.slide_height * 0.4),
            Inches(usable_w),
            Inches(1.2),
        )
        tf = box.text_frame
        p = tf.paragraphs[0]
        p.text = section
        p.alignment = PP_ALIGN.CENTER
        p.font.size = Pt(36)
        p.font.bold = True
        p.font.name = t.fonts.title.name
        r, g, b = t.colors.hex_to_rgb("section_text")
        p.font.color.rgb = RGBColor(r, g, b)
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
python -m pytest tests/test_renderer.py -v
```
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer.py tests/test_renderer.py
git commit -m "feat: add PPTX renderer with type-specific layouts, tables, section dividers, image placeholders"
```

---

## Task 7: Enhancer (Claude API)

**Files:**
- Create: `slide-generator/src/enhancer.py`
- Create: `slide-generator/tests/test_enhancer.py`

- [ ] **Step 1: Write failing tests (mocked API)**

Create `slide-generator/tests/test_enhancer.py`:
```python
import json
from unittest.mock import MagicMock, patch

from src.enhancer import ClaudeEnhancer, EnhancerConfig
from src.models import Presentation, Slide, SlideType, Metadata


def _make_presentation() -> Presentation:
    return Presentation(
        title="Test",
        slides=[
            Slide(number=1, title="Intro", type=SlideType.CONCEPT, section="Sec1",
                  body=["Point A", "Point B"]),
            Slide(number=2, title="Detail", type=SlideType.CONCEPT, section="Sec1",
                  body=["Point C"]),
            Slide(number=3, title="Other", type=SlideType.CONCEPT, section="Sec2",
                  body=["Point D"]),
        ],
    )


def test_section_aware_batching():
    enhancer = ClaudeEnhancer(config=EnhancerConfig(batch_size=5))
    pres = _make_presentation()
    batches = enhancer._create_batches(pres.slides)
    # Should be 2 batches: Sec1 (2 slides) and Sec2 (1 slide)
    assert len(batches) == 2
    assert len(batches[0]) == 2
    assert len(batches[1]) == 1


def test_positional_batching():
    enhancer = ClaudeEnhancer(
        config=EnhancerConfig(batch_size=2, section_aware_batching=False)
    )
    pres = _make_presentation()
    batches = enhancer._create_batches(pres.slides)
    # 3 slides, batch_size=2: [2, 1]
    assert len(batches) == 2


def test_enhance_skipped_without_api_key():
    enhancer = ClaudeEnhancer(config=EnhancerConfig())
    pres = _make_presentation()
    result = enhancer.enhance(pres)
    # Without API key, should return original unchanged
    assert result.slides[0].body == ["Point A", "Point B"]


@patch("src.enhancer.Anthropic")
def test_enhance_preserves_on_api_failure(mock_anthropic_cls):
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client
    mock_client.messages.create.side_effect = Exception("API Error")

    enhancer = ClaudeEnhancer(
        config=EnhancerConfig(), api_key="test-key"
    )
    pres = _make_presentation()
    result = enhancer.enhance(pres)
    # Should fallback to original
    assert result.slides[0].body == ["Point A", "Point B"]


@patch("src.enhancer.Anthropic")
def test_enhance_applies_speaker_notes(mock_anthropic_cls):
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client

    # Mock API response
    response_slides = [
        {"number": 1, "speaker_note": "Generated note for slide 1"},
        {"number": 2, "speaker_note": "Generated note for slide 2"},
    ]
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text=json.dumps(response_slides))]
    mock_client.messages.create.return_value = mock_response

    enhancer = ClaudeEnhancer(
        config=EnhancerConfig(enhance_modes=["notes"]),
        api_key="test-key",
    )
    pres = Presentation(
        title="Test",
        slides=[
            Slide(number=1, title="A", type=SlideType.CONCEPT, section="S1", body=["X"]),
            Slide(number=2, title="B", type=SlideType.CONCEPT, section="S1", body=["Y"]),
        ],
    )
    result = enhancer.enhance(pres)
    assert result.slides[0].speaker_note == "Generated note for slide 1"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
python -m pytest tests/test_enhancer.py -v
```
Expected: FAIL

- [ ] **Step 3: Implement enhancer.py**

Create `slide-generator/src/enhancer.py`:
```python
from __future__ import annotations

import json
import logging
import os

from pydantic import BaseModel

from src.models import Presentation, Slide

logger = logging.getLogger(__name__)


class EnhancerConfig(BaseModel):
    model: str = "claude-sonnet-4-20250514"
    enhance_modes: list[str] = ["notes", "cleanup", "type"]
    batch_size: int = 5
    section_aware_batching: bool = True


class ClaudeEnhancer:
    def __init__(
        self,
        config: EnhancerConfig | None = None,
        api_key: str | None = None,
    ):
        self.config = config or EnhancerConfig()
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")

    def enhance(self, presentation: Presentation) -> Presentation:
        """Enhance slides using Claude API. Returns original on failure."""
        if not self.api_key:
            logger.warning("No ANTHROPIC_API_KEY — skipping enhancement")
            return presentation

        try:
            from anthropic import Anthropic
        except ImportError:
            logger.warning("anthropic package not installed — skipping enhancement")
            return presentation

        client = Anthropic(api_key=self.api_key)
        slides = list(presentation.slides)
        batches = self._create_batches(slides)

        enhanced_slides: list[Slide] = []
        for batch in batches:
            try:
                result = self._enhance_batch(client, batch)
                enhanced_slides.extend(result)
            except Exception:
                logger.warning(
                    "Enhancement failed for batch (slides %d-%d) — keeping originals",
                    batch[0].number, batch[-1].number,
                    exc_info=True,
                )
                enhanced_slides.extend(batch)

        return presentation.model_copy(update={"slides": enhanced_slides})

    def _create_batches(self, slides: list[Slide]) -> list[list[Slide]]:
        """Split slides into batches, optionally respecting section boundaries."""
        if not self.config.section_aware_batching:
            return [
                slides[i : i + self.config.batch_size]
                for i in range(0, len(slides), self.config.batch_size)
            ]

        # Section-aware batching
        batches: list[list[Slide]] = []
        current_batch: list[Slide] = []
        current_section: str | None = None

        for slide in slides:
            if slide.section != current_section and current_batch:
                batches.append(current_batch)
                current_batch = []
            current_section = slide.section
            current_batch.append(slide)

            if len(current_batch) >= self.config.batch_size:
                batches.append(current_batch)
                current_batch = []

        if current_batch:
            batches.append(current_batch)

        return batches

    def _enhance_batch(
        self, client, batch: list[Slide]
    ) -> list[Slide]:
        """Send a batch to Claude API and merge results."""
        from anthropic import Anthropic

        modes = self.config.enhance_modes
        slides_data = [
            {
                "number": s.number,
                "title": s.title,
                "type": s.type.value,
                "body": [
                    item if isinstance(item, str) else item.model_dump()
                    for item in s.body
                ],
                "key_message": s.key_message,
                "speaker_note": s.speaker_note,
            }
            for s in batch
        ]

        system_prompt = (
            "You are a presentation editor. Improve slide clarity "
            "while preserving all original content. "
            "Return a JSON array of objects with 'number' and the enhanced fields only."
        )

        rules = [
            "Do not add claims not present in the original",
            "Rephrasing, merging, dedup, reordering are allowed",
        ]
        if "notes" in modes:
            rules.append("Generate speaker_note (2-3 sentences) for each slide")
        if "cleanup" in modes:
            rules.append("Clean up body bullets: dedup, merge, reorder for logic flow")
        if "type" in modes:
            rules.append("Verify and correct the slide type if needed")

        user_msg = json.dumps(
            {
                "section": batch[0].section,
                "slides": slides_data,
                "enhance_modes": modes,
                "rules": rules,
            },
            ensure_ascii=False,
        )

        response = client.messages.create(
            model=self.config.model,
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_msg}],
        )

        result_text = response.content[0].text
        enhanced_data = json.loads(result_text)

        # Merge enhanced fields back into original slides
        enhanced_map = {item["number"]: item for item in enhanced_data}
        result: list[Slide] = []
        for slide in batch:
            if slide.number in enhanced_map:
                updates = enhanced_map[slide.number]
                update_dict = {}
                if "speaker_note" in updates and "notes" in modes:
                    update_dict["speaker_note"] = updates["speaker_note"]
                if "body" in updates and "cleanup" in modes:
                    new_body = updates["body"]
                    # Content preservation check
                    if self._content_preserved(slide.body, new_body):
                        update_dict["body"] = new_body
                    else:
                        logger.warning(
                            "Content loss detected in slide %d — keeping original body",
                            slide.number,
                        )
                if "type" in updates and "type" in modes:
                    update_dict["type"] = updates["type"]
                result.append(slide.model_copy(update=update_dict))
            else:
                result.append(slide)

        return result

    @staticmethod
    def _content_preserved(
        original_body: list, enhanced_body: list
    ) -> bool:
        """Check that key content from original is preserved in enhanced version."""
        import re

        def extract_keywords(items: list) -> set[str]:
            text = " ".join(
                str(item) if isinstance(item, str) else str(getattr(item, "rows", ""))
                for item in items
            )
            # Extract Korean/English words 2+ chars
            words = set(re.findall(r"[가-힣a-zA-Z]{2,}", text))
            return words

        orig_kw = extract_keywords(original_body)
        if not orig_kw:
            return True
        enhanced_kw = extract_keywords(enhanced_body)
        # At least 70% of original keywords should be preserved
        overlap = len(orig_kw & enhanced_kw) / len(orig_kw)
        return overlap >= 0.7
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
python -m pytest tests/test_enhancer.py -v
```
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/enhancer.py tests/test_enhancer.py
git commit -m "feat: add Claude API enhancer with section-aware batching and fallback"
```

---

## Task 8: CLI Entry Point

**Files:**
- Create: `slide-generator/src/cli.py`
- Create: `slide-generator/tests/test_cli.py`

- [ ] **Step 1: Write failing tests**

Create `slide-generator/tests/test_cli.py`:
```python
import subprocess
import sys
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent / "fixtures"
CLI_PATH = Path(__file__).parent.parent / "src" / "cli.py"


def test_cli_basic_run(tmp_path):
    input_file = FIXTURES_DIR / "sample_simple.md"
    output_file = tmp_path / "output.pptx"
    result = subprocess.run(
        [sys.executable, str(CLI_PATH), str(input_file), "-o", str(output_file)],
        capture_output=True, text=True, cwd=str(CLI_PATH.parent.parent),
    )
    assert result.returncode == 0, f"stderr: {result.stderr}"
    assert output_file.exists()


def test_cli_dry_run(tmp_path):
    input_file = FIXTURES_DIR / "sample_structured.md"
    result = subprocess.run(
        [sys.executable, str(CLI_PATH), str(input_file), "--dry-run"],
        capture_output=True, text=True, cwd=str(CLI_PATH.parent.parent),
    )
    assert result.returncode == 0
    # Should output JSON to stdout
    assert '"slides"' in result.stdout


def test_cli_save_json(tmp_path):
    input_file = FIXTURES_DIR / "sample_simple.md"
    json_file = tmp_path / "slides.json"
    output_file = tmp_path / "output.pptx"
    result = subprocess.run(
        [
            sys.executable, str(CLI_PATH),
            str(input_file), "-o", str(output_file),
            "--save-json", str(json_file),
        ],
        capture_output=True, text=True, cwd=str(CLI_PATH.parent.parent),
    )
    assert result.returncode == 0
    assert json_file.exists()
    assert output_file.exists()


def test_cli_nonexistent_input():
    result = subprocess.run(
        [sys.executable, str(CLI_PATH), "nonexistent.md"],
        capture_output=True, text=True, cwd=str(CLI_PATH.parent.parent),
    )
    assert result.returncode != 0


def test_cli_verbose(tmp_path):
    input_file = FIXTURES_DIR / "sample_simple.md"
    output_file = tmp_path / "output.pptx"
    result = subprocess.run(
        [sys.executable, str(CLI_PATH), str(input_file), "-o", str(output_file), "--verbose"],
        capture_output=True, text=True, cwd=str(CLI_PATH.parent.parent),
    )
    assert result.returncode == 0
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
python -m pytest tests/test_cli.py -v
```
Expected: FAIL

- [ ] **Step 3: Implement cli.py**

Create `slide-generator/src/cli.py`:
```python
from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.models import Presentation
from src.parser import MarkdownParser
from src.enhancer import ClaudeEnhancer, EnhancerConfig
from src.renderer import PptxRenderer
from src.theme import load_theme

logger = logging.getLogger("slide-generator")


def main() -> int:
    args = parse_args()
    setup_logging(args.verbose)

    # Validate input
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        return 1

    # 1. Parse
    logger.info("Parsing %s", input_path)
    parser = MarkdownParser()
    text = input_path.read_text(encoding="utf-8")
    presentation = parser.parse(text, source_file=str(input_path))
    logger.info("Parsed %d slides", len(presentation.slides))

    # 2. Dry run without enhance — output parsed JSON and stop
    if args.dry_run and not args.enhance:
        output = presentation.model_dump_json(indent=2)
        print(output)
        return 0

    # 3. Enhance (optional)
    if args.enhance:
        import os
        if not os.environ.get("ANTHROPIC_API_KEY"):
            print("Warning: ANTHROPIC_API_KEY not set. Skipping enhancement.", file=sys.stderr)
            print("Set the environment variable or remove --enhance flag.", file=sys.stderr)
        else:
            logger.info("Enhancing with Claude API (modes: %s)", args.enhance_mode)
            config = EnhancerConfig(
                enhance_modes=args.enhance_mode.split(","),
            )
            enhancer = ClaudeEnhancer(config=config)
            if args.dry_run:
                # --enhance --dry-run: show diff without applying
                original = presentation.model_copy(deep=True)
                enhanced = enhancer.enhance(presentation)
                _print_enhance_diff(original, enhanced)
                return 0
            presentation = enhancer.enhance(presentation)

    # Save intermediate JSON if requested
    if args.save_json:
        json_path = Path(args.save_json)
        json_path.write_text(
            presentation.model_dump_json(indent=2), encoding="utf-8"
        )
        logger.info("Saved intermediate JSON to %s", json_path)

    # 4. Render
    output_path = Path(
        args.output or input_path.with_suffix(".pptx").name
    )
    theme_path = Path(args.theme) if args.theme else None
    theme = load_theme(theme_path)

    renderer = PptxRenderer(theme=theme)
    renderer.render(presentation, output_path)
    print(f"Generated {len(presentation.slides)} slides → {output_path}")

    return 0


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Convert markdown to PowerPoint slides"
    )
    p.add_argument("input", help="Input markdown file")
    p.add_argument("-o", "--output", help="Output .pptx file path")
    p.add_argument("--theme", help="Theme YAML file path")
    p.add_argument("--enhance", action="store_true", help="Enable Claude API enhancement")
    p.add_argument("--enhance-mode", default="notes,cleanup,type",
                    help="Enhancement modes (comma-separated)")
    p.add_argument("--dry-run", action="store_true",
                    help="Output SlideData JSON to stdout, skip rendering")
    p.add_argument("--save-json", help="Save intermediate JSON to file")
    p.add_argument("--verbose", action="store_true", help="Verbose logging")
    return p.parse_args()


def _print_enhance_diff(original: Presentation, enhanced: Presentation) -> None:
    """Print before/after diff for --enhance --dry-run."""
    import json as _json
    for orig, enh in zip(original.slides, enhanced.slides):
        changes = {}
        if orig.speaker_note != enh.speaker_note:
            changes["speaker_note"] = {"before": orig.speaker_note, "after": enh.speaker_note}
        if orig.body != enh.body:
            changes["body"] = {"before": [str(b) for b in orig.body], "after": [str(b) for b in enh.body]}
        if orig.type != enh.type:
            changes["type"] = {"before": orig.type.value, "after": enh.type.value}
        if changes:
            print(f"\n--- Slide {orig.number}: {orig.title} ---")
            print(_json.dumps(changes, ensure_ascii=False, indent=2))


def setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.WARNING
    logging.basicConfig(
        level=level,
        format="%(levelname)s: %(message)s",
        stream=sys.stderr,
    )


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
python -m pytest tests/test_cli.py -v
```
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/cli.py tests/test_cli.py
git commit -m "feat: add CLI entry point with all flags (enhance, dry-run, save-json, theme, verbose)"
```

---

## Task 9: End-to-End Integration Test

**Files:**
- Modify: `slide-generator/tests/test_cli.py`

- [ ] **Step 1: Write e2e test with the actual prompt file**

Append to `slide-generator/tests/test_cli.py`:
```python
PROMPT_FILE = Path(__file__).parent.parent.parent / "claude_code_slide_generation_prompt.md"


def test_e2e_full_document(tmp_path):
    """End-to-end test with the actual 56-page prompt file."""
    if not PROMPT_FILE.exists():
        pytest.skip("Full prompt file not available")
    output_file = tmp_path / "full_output.pptx"
    result = subprocess.run(
        [sys.executable, str(CLI_PATH), str(PROMPT_FILE), "-o", str(output_file)],
        capture_output=True, text=True, cwd=str(CLI_PATH.parent.parent),
    )
    assert result.returncode == 0, f"stderr: {result.stderr}"
    assert output_file.exists()
    # Verify slide count is reasonable (original has 56 pages + section dividers)
    from pptx import Presentation as PptxPresentation
    pptx = PptxPresentation(str(output_file))
    assert len(pptx.slides) >= 30  # At least 30 slides from 56 pages
```

Add `import pytest` to top of file.

- [ ] **Step 2: Run the e2e test**

```bash
python -m pytest tests/test_cli.py::test_e2e_full_document -v
```
Expected: PASS — generates a valid .pptx from the full 56-page document

- [ ] **Step 3: Fix any issues discovered**

If the e2e test reveals parser edge cases (unexpected delimiters, encoding issues, etc.), fix them and re-run.

- [ ] **Step 4: Commit**

```bash
git add tests/test_cli.py
git commit -m "test: add end-to-end integration test with full 56-page document"
```

---

## Task 10: Claude Code Skill

**Files:**
- Create: skill definition file (location depends on Claude Code skill setup)

- [ ] **Step 1: Create the generate-slides skill**

The skill will be created as a Claude Code skill file. The exact path depends on the user's skill configuration. Create the skill content:

```markdown
---
name: generate-slides
description: 마크다운 파일을 파워포인트(.pptx)로 자동 변환
---

## Instructions

1. User provides a markdown file path as the first argument
2. Ask: "Claude API로 발표자 노트 생성 등 보강을 할까요? (y/n)"
3. Construct the CLI command:

```bash
cd "c:/Users/ottug/Downloads/11_개발_테스트/time analytics framework/slide-generator"
python src/cli.py "{input_file}" -o "{output_file}" [--enhance] [--theme "{theme}"]
```

4. Run the command via Bash tool
5. Report: output path, slide count, any warnings

## Arguments

- First arg: input markdown file path (required)
- `--enhance`: include if user wants AI enhancement
- `--theme`: theme YAML path (optional)

## Example

User: `/generate-slides ../claude_code_slide_generation_prompt.md`

Response flow:
1. Confirm input file exists
2. Ask about enhancement
3. Run CLI
4. Report: "56개 슬라이드를 생성했습니다 → output.pptx"
```

- [ ] **Step 2: Test the skill manually**

Run `/generate-slides` with a test file to verify the skill works end-to-end.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Claude Code /generate-slides skill"
```

---

## Task 11: Run Full Test Suite

- [ ] **Step 1: Run all tests**

```bash
cd "c:/Users/ottug/Downloads/11_개발_테스트/time analytics framework/slide-generator"
python -m pytest tests/ -v --tb=short
```
Expected: All tests PASS

- [ ] **Step 2: Fix any failures**

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: all tests passing — slide generator v0.1.0 complete"
```

# Slide Generator Design Spec

**Date:** 2026-04-07
**Status:** Draft
**Summary:** 마크다운 파일을 파워포인트(.pptx)로 자동 변환하는 파이프라인. 룰 기반 파싱 + 선택적 Claude API 보강 하이브리드 구조. Python CLI 코어 + Claude Code 스킬 래퍼.

---

## 1. Architecture & Data Flow

### Project Structure

```
slide-generator/
├── src/
│   ├── parser.py          # 마크다운 → SlideData 파싱
│   ├── enhancer.py        # Claude API 보강 (선택적)
│   ├── renderer.py        # SlideData → .pptx 렌더링
│   ├── theme.py           # 테마 로딩 & 적용
│   ├── models.py          # SlideData 스키마 (Pydantic)
│   └── cli.py             # CLI 엔트리포인트
├── themes/
│   └── default.yaml       # 기본 테마 (색상/폰트/레이아웃)
├── tests/
│   ├── test_parser.py
│   ├── test_enhancer.py
│   ├── test_renderer.py
│   ├── test_theme.py
│   ├── test_cli.py
│   └── fixtures/
│       ├── sample_simple.md
│       ├── sample_full.md
│       └── expected_output.json
├── requirements.txt
└── README.md
```

### Data Flow

```
[1. Parse]          [2. Enhance]           [3. Render]
input.md  ──→  SlideData(JSON)  ──→  SlideData(enriched)  ──→  output.pptx
                                 ↑                         ↑
                          --enhance flag              theme.yaml
                          (skipped if absent)         (default if absent)
```

### SlideData Schema (Pydantic)

```python
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
    body: list[str | TableData] = []  # str = bullet, TableData = table
    visual_suggestion: str | None = None
    speaker_note: str | None = None
    section: str = ""                 # chapter name (e.g. "Calendar Time 분석")
    image_placeholder: bool = False   # True for image-reference slides

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

Design points:
- `body` accepts `str | TableData` — plain bullets are strings, tables are `TableData` objects with `headers` and `rows`
- `section` field enables auto-insertion of section divider slides at chapter boundaries
- `type` is inferred by parser heuristics, optionally corrected by enhancer
- `image_placeholder` flags slides that reference images/charts from the original PDF — renderer inserts a gray placeholder box with the description text
- `APPENDIX` type handles synthesized content (Appendix A/B/C)
- `IMAGE_REFERENCE` type for slides containing `(이미지 예시 슬라이드)` markers
- `Metadata` is a typed model (not bare dict) for type safety
- All file I/O uses explicit `encoding='utf-8'` to avoid Windows cp949 issues

---

## 2. Parser (Markdown → SlideData)

### Strategy: 2-Pass

**1st Pass — Structure Split:** Split markdown into per-slide blocks.
**2nd Pass — Field Extraction:** Extract fields from each block.

### 1st Pass: Slide Boundary Detection

Delimiter patterns (priority order):

| Pattern | Example | Behavior |
|---------|---------|----------|
| `## Slide {N}.` | `## Slide 1. 제목` | Structured prompt output format |
| `## Page {N}` | `## Page 2` | Original PDF page-based |
| `---` (horizontal rule) | `---` | Section separator |
| `# ` (H1) | `# 큰 주제` | Top-level section (chapter boundary) |

Configurable delimiter patterns:

```python
class ParserConfig(BaseModel):
    slide_delimiters: list[str] = [
        r"^## Slide \d+",
        r"^## Page \d+",
        r"^---$",
        r"^# ",                        # H1 top-level section boundary
    ]
    section_marker: str = r"^\d+\.\s+" # "1. Calendar Time" chapter detection
    image_markers: list[str] = [
        "(이미지 예시 슬라이드)",
        "(이미지",
        "(차트",
    ]
    appendix_marker: str = r"^Appendix\s+[A-Z]"
    encoding: str = "utf-8"            # explicit file encoding
```

### 2nd Pass: Field Extraction Rules

| Field | Detection Pattern | Fallback |
|-------|-------------------|----------|
| `title` | `## Slide N. {title}` or first H2/H3 | First text line |
| `type` | `- Type: {type}` or emoji/keyword heuristic | `concept` |
| `objective` | `- Objective: {text}` | Empty string |
| `key_message` | `### Key Message` sub-bullets | Empty list |
| `body` | `### Body` sub-bullets or main bullet list | All remaining text |
| `visual_suggestion` | `### Visual Suggestion` | `None` |
| `speaker_note` | `### Speaker Note` | `None` |
| `section` | Previous H1 or `N. topic` pattern | Inherited from previous slide |
| `image_placeholder` | `image_markers` pattern match in content | `False` |

**Table detection (at parse time):** Lines containing `|` delimiters are parsed into `TableData` objects during the 2nd pass, not at render time. The parser splits header row and data rows, producing `TableData(headers=[...], rows=[[...], ...])`.

**Image reference handling:** When a slide block contains an `image_markers` match (e.g., `(이미지 예시 슬라이드)`), the parser sets `image_placeholder=True` and `type=IMAGE_REFERENCE`. The surrounding text is preserved in `body`. The renderer will insert a gray placeholder box with the description.

**Appendix handling:** Slides matching `appendix_marker` get `type=APPENDIX`. The enhancer can optionally synthesize appendix content from the full presentation context.

### Slide Type Heuristic

Auto-inference when `- Type:` tag is absent:

```python
TYPE_HINTS: dict[SlideType, list[str]] = {
    SlideType.EXERCISE: ["과제", "🧪", "실습", "Quiz", "Think"],
    SlideType.EXAMPLE: ["사례", "📌", "예시"],
    SlideType.CRM_EXPERIMENT: ["CRM", "실험 설계", "Experiment", "🚀"],
    SlideType.DATA_REPORT: ["📊", "Report", "Mixpanel", "🖱"],
    SlideType.FRAMEWORK: ["프레임워크", "핵심 정의", "구조"],
    SlideType.SUMMARY: ["정리", "핵심 인사이트", "💡", "최종"],
    SlideType.TITLE: ["v1.0", "Title"],
    SlideType.OVERVIEW: ["커리큘럼", "주제", "🎯 주제"],
    SlideType.APPENDIX: ["Appendix", "부록"],
    # IMAGE_REFERENCE is detected via image_markers, not keyword hints
}
```

First match wins; no match defaults to `CONCEPT`.

---

## 3. Claude Enhancer (Optional AI Enhancement)

### Activation

- Only runs when `--enhance` flag is provided
- Without it, parser output passes directly to renderer (offline operation guaranteed)
- API key from `ANTHROPIC_API_KEY` environment variable

### Enhancement Scope

| Enhancement | Input | Output | Description |
|-------------|-------|--------|-------------|
| **Type correction** | Heuristic-inferred type | Confirmed/corrected type | Reclassify slides that fell back to `concept` |
| **Speaker notes** | body + key_message | speaker_note | Generate presentation script from content |
| **Body cleanup** | Raw body bullets | Cleaned body | Dedup, merge, reorder for logic flow |
| **TOC optimization** | Full slides array | Reordered slides | Flow check, section divider suggestions |

### API Call Strategy

```python
class EnhancerConfig(BaseModel):
    model: str = "claude-sonnet-4-20250514"
    enhance_modes: list[str] = ["notes", "cleanup", "type"]
    batch_size: int = 5  # slides per API call
    section_aware_batching: bool = True  # respect section boundaries
```

Batch processing rationale: 56 slides at batch_size=5 = ~12 API calls (vs 56 individual calls). Batching also provides surrounding context for better quality.

**Section-aware batching:** When `section_aware_batching=True` (default), batches never cross section boundaries. If a section has 3 slides and batch_size is 5, those 3 slides form their own batch. This preserves coherent context for the AI and improves enhancement quality.

### Prompt Structure (per batch)

```
System: "You are a presentation editor. Improve slide clarity 
        while preserving all original content."

User: {
  "section": "Calendar Time 분석",
  "slides": [slide_4, slide_5, slide_6, slide_7, slide_8],
  "enhance_modes": ["notes", "cleanup"],
  "rules": [
    "Do not add claims not present in the original",
    "Rephrasing, merging, dedup, reordering are allowed",
    "Speaker notes should be 2-3 sentences"
  ]
}
```

### Safety Mechanisms

- **Content preservation check:** Compare keyword sets before/after enhancement to detect content loss
- **Dry-run mode:** `--enhance --dry-run` outputs a before/after diff of enhanced fields to stdout without modifying SlideData or generating PPTX
- **Fallback:** On API failure, keep original slide content + emit warning log

---

## 4. Renderer & Theme

### Layout by Slide Type

| SlideType | Layout | Composition |
|-----------|--------|-------------|
| `title` | Center-aligned | Large title + subtitle (date/version) |
| `overview` | Left title + right bullets | Chapter intro, learning objectives |
| `concept` | Title + body bullets | General content slide |
| `example` | Title + 2-column (question/insight) | Case study slides |
| `framework` | Title + structured boxes | Definitions, key metrics |
| `data_report` | Title + numbered step list | Mixpanel click guides |
| `crm_experiment` | Title + 2-column (CRM/experiment) | Action + experiment slides |
| `exercise` | Title + checklist style | Task lists |
| `summary` | Accent background + key messages | Chapter wrap-up |
| `appendix` | Title + structured content | Appendix A/B/C |
| `image_reference` | Title + gray placeholder box | Image/chart reference slides |

**Section divider slides** auto-inserted when `section` value changes between consecutive slides.

### Body Rendering Rules

```python
# Bullet depth
"● text"      → level 0 bullet
"  ○ text"    → level 1 bullet
"    - text"  → level 2 bullet

# Tables: already parsed as TableData by parser — render using python-pptx table shapes
# "→"         → emphasized arrow text (bold + accent color)
# "📌 📊 🧪 🚀 💡" → preserved as title prefixes
```

### Image Placeholder Rendering

When `image_placeholder=True`, the renderer inserts:
- A gray rectangle (80% slide width, 60% slide height) centered below the title
- White text inside: the original image description from `visual_suggestion` or body
- Small italic caption: "이미지 수동 삽입 필요"

### Speaker Notes

When `speaker_note` is present, written to `slide.notes_slide.notes_text_frame` via python-pptx.

### Theme (YAML)

```yaml
# themes/default.yaml
meta:
  name: "Clean Structure"
  slide_width: 13.333   # inches (16:9)
  slide_height: 7.5

colors:
  primary: "#2D3748"      # title text
  secondary: "#4A5568"    # body text
  accent: "#3182CE"       # emphasis/links
  background: "#FFFFFF"
  section_bg: "#2D3748"   # section divider background
  section_text: "#FFFFFF"
  placeholder_bg: "#E2E8F0"  # image placeholder background

fonts:
  title:
    name: "맑은 고딕"
    fallback: ["Arial", "Helvetica"]  # cross-platform fallback
    size: 28
    bold: true
  subtitle:
    name: "맑은 고딕"
    fallback: ["Arial", "Helvetica"]
    size: 18
  body:
    name: "맑은 고딕"
    fallback: ["Arial", "Helvetica"]
    size: 14
  note:
    name: "맑은 고딕"
    fallback: ["Arial", "Helvetica"]
    size: 11

layout:
  margin: { top: 0.8, bottom: 0.5, left: 0.8, right: 0.8 }
  title_top: 0.8
  body_top: 1.8
  bullet_indent: 0.3
  line_spacing: 1.2
```

Theme selection via `--theme themes/dark.yaml`. Falls back to `default.yaml` when unspecified.

**Cross-platform fonts:** The default theme targets Windows (`맑은 고딕`). Each font slot includes a `fallback` list for macOS/Linux. The renderer tries fonts in order and uses the first available one. Users can override by providing their own theme YAML.

---

## 5. CLI & Claude Code Skill

### CLI (cli.py)

argparse-based entry point.

```bash
# Basic: markdown → PPT (rule-based only)
python src/cli.py input.md -o output.pptx

# With Claude API enhancement
python src/cli.py input.md -o output.pptx --enhance

# Selective enhancement
python src/cli.py input.md -o output.pptx --enhance --enhance-mode notes,cleanup

# Custom theme
python src/cli.py input.md -o output.pptx --theme themes/dark.yaml

# Dry run (output intermediate JSON only)
python src/cli.py input.md --dry-run

# Save intermediate JSON (for debugging)
python src/cli.py input.md -o output.pptx --save-json slides.json
```

**Full arguments:**

| Argument | Default | Description |
|----------|---------|-------------|
| `input` (positional) | Required | Input markdown file path |
| `-o, --output` | `{input_stem}.pptx` | Output PPT file path |
| `--theme` | `themes/default.yaml` | Theme file path |
| `--enhance` | `False` | Enable Claude API enhancement |
| `--enhance-mode` | `notes,cleanup,type` | Enhancement scope (comma-separated) |
| `--dry-run` | `False` | Skip rendering; output SlideData JSON to stdout. If combined with `--enhance`, shows enhancement diff without applying |
| `--save-json` | `None` | Save intermediate JSON to file |
| `--verbose` | `False` | Verbose logging |

### Claude Code Skill

Wraps CLI for in-conversation execution:

```
User: /generate-slides input.md
```

**Skill flow:**
1. Verify input file exists
2. Ask user about `--enhance` preference
3. Compose and execute `python src/cli.py` command
4. Report result: PPT path, slide count, summary

**Skill definition:**

```yaml
name: generate-slides
description: 마크다운 파일을 파워포인트로 자동 변환
trigger: /generate-slides
arguments:
  - name: input_file
    required: true
  - name: --enhance
    required: false
  - name: --theme
    required: false
```

Supports follow-up conversation for partial re-runs (e.g., "발표자 노트만 다시 생성해줘").

---

## 6. Testing & Error Handling

### Test Structure

```
tests/
├── test_parser.py
├── test_enhancer.py
├── test_renderer.py
├── test_theme.py
├── test_cli.py
└── fixtures/
    ├── sample_simple.md
    ├── sample_full.md
    └── expected_output.json
```

### Key Test Cases

**Parser:**
- `## Page N` pattern splits slides correctly
- Emoji/keyword type inference is accurate
- Bullet depth (●, ○, -) parsed correctly
- Table structures (`|` delimited) convert to dicts
- Graceful handling of empty sections and malformed markdown

**Renderer:**
- Type-specific layouts applied correctly
- Section divider slides inserted at chapter boundaries
- Speaker notes written to Notes area
- Generated `.pptx` is valid (verified by python-pptx reload)

**Enhancer:**
- Original content preserved on API failure
- `--dry-run` does not trigger actual API calls
- No keyword loss after enhancement

**CLI Integration:**
- `input.md → output.pptx` end-to-end execution
- `--save-json` intermediate result save/verify
- Clear error message for nonexistent input file

### Error Handling

| Situation | Behavior |
|-----------|----------|
| Input file not found | Exit immediately + clear error message |
| No slide boundaries in markdown | Treat entire content as single slide + warning |
| Theme file missing/invalid | Fall back to default theme + warning |
| `ANTHROPIC_API_KEY` unset + `--enhance` | Error message, ask whether to continue without enhance |
| API call failure (individual batch) | Keep original slides + warning log |
| Slide overloaded (body > 20 lines) | Warning log (no auto-split) |

---

## Dependencies

```
# requirements.txt
python-pptx>=0.6.23
pydantic>=2.0
pyyaml>=6.0
anthropic>=0.40.0    # optional, for --enhance
```

## Cross-Cutting Concerns

### Encoding
All file I/O (read markdown, write PPTX, load YAML) explicitly uses `encoding='utf-8'`. This avoids Windows default locale encoding (cp949 for Korean Windows) issues.

### Logging
Uses Python's built-in `logging` module. Default level: `WARNING`. `--verbose` sets level to `DEBUG`. Output goes to stderr to keep stdout clean for `--dry-run` JSON output.

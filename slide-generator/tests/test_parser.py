from src.parser import MarkdownParser, ParserConfig
from src.models import SlideType, TableData


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


class TestSecondPass:
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
        concept_slide = slides.slides[1]
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
        assert slides.slides[1].type == SlideType.EXAMPLE
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

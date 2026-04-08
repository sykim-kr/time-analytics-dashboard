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

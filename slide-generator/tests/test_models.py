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

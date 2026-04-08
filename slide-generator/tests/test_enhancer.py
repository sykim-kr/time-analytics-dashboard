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
    assert len(batches) == 2
    assert len(batches[0]) == 2
    assert len(batches[1]) == 1


def test_positional_batching():
    enhancer = ClaudeEnhancer(
        config=EnhancerConfig(batch_size=2, section_aware_batching=False)
    )
    pres = _make_presentation()
    batches = enhancer._create_batches(pres.slides)
    assert len(batches) == 2


def test_enhance_skipped_without_api_key():
    enhancer = ClaudeEnhancer(config=EnhancerConfig())
    pres = _make_presentation()
    result = enhancer.enhance(pres)
    assert result.slides[0].body == ["Point A", "Point B"]


@patch("src.enhancer.Anthropic")
def test_enhance_preserves_on_api_failure(mock_anthropic_cls):
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client
    mock_client.messages.create.side_effect = Exception("API Error")

    enhancer = ClaudeEnhancer(config=EnhancerConfig(), api_key="test-key")
    pres = _make_presentation()
    result = enhancer.enhance(pres)
    assert result.slides[0].body == ["Point A", "Point B"]


@patch("src.enhancer.Anthropic")
def test_enhance_applies_speaker_notes(mock_anthropic_cls):
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client

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

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

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

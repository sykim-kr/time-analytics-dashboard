from __future__ import annotations

import logging
from pathlib import Path
from typing import Union

from pptx import Presentation as PptxPresentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt, Emu

from src.models import Presentation, Slide, SlideType, TableData
from src.theme import Theme, load_theme

logger = logging.getLogger(__name__)

# Slide types that use generic content rendering
_CONTENT_TYPES = {
    SlideType.CONCEPT,
    SlideType.OVERVIEW,
    SlideType.FRAMEWORK,
    SlideType.DATA_REPORT,
    SlideType.APPENDIX,
}

MAX_BODY_ITEMS = 20


class PptxRenderer:
    """Renders a Presentation model to a .pptx file using python-pptx."""

    def __init__(self, theme: Theme | None = None) -> None:
        self.theme = theme or load_theme()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def render(self, presentation: Presentation, output_path: Path) -> Path:
        pptx = PptxPresentation()
        pptx.slide_width = Inches(self.theme.meta.slide_width)
        pptx.slide_height = Inches(self.theme.meta.slide_height)

        blank_layout = pptx.slide_layouts[6]
        prev_section: str = ""

        for slide_model in presentation.slides:
            # Auto-insert section divider when section changes (not for first slide)
            if (
                slide_model.section
                and prev_section
                and slide_model.section != prev_section
            ):
                self._add_section_divider(pptx, blank_layout, slide_model.section)

            pptx_slide = pptx.slides.add_slide(blank_layout)
            self._dispatch(pptx_slide, slide_model)

            if slide_model.speaker_note:
                notes_slide = pptx_slide.notes_slide
                notes_slide.notes_text_frame.text = slide_model.speaker_note

            prev_section = slide_model.section

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        pptx.save(str(output_path))
        return output_path

    # ------------------------------------------------------------------
    # Dispatcher
    # ------------------------------------------------------------------

    def _dispatch(self, pptx_slide, slide: Slide) -> None:
        if len(slide.body) > MAX_BODY_ITEMS:
            logger.warning(
                "Slide %d has %d body items (> %d) — content may overflow",
                slide.number,
                len(slide.body),
                MAX_BODY_ITEMS,
            )

        if slide.type == SlideType.TITLE:
            self._render_title_slide(pptx_slide, slide)
        elif slide.type == SlideType.SUMMARY:
            self._render_summary_slide(pptx_slide, slide)
        elif slide.type == SlideType.EXERCISE:
            self._render_exercise_slide(pptx_slide, slide)
        elif slide.type == SlideType.EXAMPLE:
            self._render_example_slide(pptx_slide, slide)
        elif slide.type == SlideType.CRM_EXPERIMENT:
            self._render_two_column_slide(pptx_slide, slide)
        elif slide.type == SlideType.IMAGE_REFERENCE:
            self._render_image_placeholder(pptx_slide, slide)
        elif slide.type in _CONTENT_TYPES:
            self._render_content_slide(pptx_slide, slide)
        else:
            # Fallback to content slide
            self._render_content_slide(pptx_slide, slide)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @property
    def _slide_w(self) -> float:
        return self.theme.meta.slide_width

    @property
    def _slide_h(self) -> float:
        return self.theme.meta.slide_height

    @property
    def _margin(self):
        return self.theme.layout.margin

    @property
    def _usable_width(self) -> float:
        return self._slide_w - self._margin.left - self._margin.right

    def _add_textbox(self, slide, left, top, width, height):
        return slide.shapes.add_textbox(
            Inches(left), Inches(top), Inches(width), Inches(height),
        )

    def _set_font(self, run, font_cfg, color_rgb: tuple[int, int, int] | None = None):
        run.font.name = font_cfg.name
        run.font.size = Pt(font_cfg.size)
        run.font.bold = font_cfg.bold
        if color_rgb:
            run.font.color.rgb = RGBColor(*color_rgb)

    def _add_title(self, slide, title: str, *, top: float | None = None, align=PP_ALIGN.LEFT):
        t = self.theme
        top = top if top is not None else t.layout.title_top
        txbox = self._add_textbox(
            slide,
            self._margin.left,
            top,
            self._usable_width,
            0.6,
        )
        tf = txbox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.alignment = align
        run = p.add_run()
        run.text = title
        self._set_font(run, t.fonts.title, t.colors.hex_to_rgb("primary"))
        return txbox

    def _render_bullet(
        self,
        slide,
        items: list[str | TableData],
        *,
        top: float | None = None,
        left: float | None = None,
        width: float | None = None,
    ):
        """Render body items (strings as bullets, TableData as tables)."""
        t = self.theme
        top = top if top is not None else t.layout.body_top
        left = left if left is not None else self._margin.left
        width = width if width is not None else self._usable_width

        current_top = top
        for item in items:
            if isinstance(item, TableData):
                current_top = self._render_table(slide, item, current_top, left, width)
            else:
                current_top = self._render_text_bullet(
                    slide, str(item), current_top, left, width,
                )

    def _render_text_bullet(self, slide, text: str, top: float, left: float, width: float) -> float:
        t = self.theme
        indent = t.layout.bullet_indent if text.startswith("  ") else 0
        text = text.lstrip()

        txbox = self._add_textbox(slide, left + indent, top, width - indent, 0.4)
        tf = txbox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = text
        self._set_font(run, t.fonts.body, t.colors.hex_to_rgb("secondary"))
        return top + 0.4

    def _render_table(self, slide, table: TableData, top: float, left: float, width: float) -> float:
        rows = len(table.rows) + 1  # +1 for header
        cols = len(table.headers)
        col_width = width / cols if cols else width

        tbl = slide.shapes.add_table(
            rows, cols,
            Inches(left), Inches(top),
            Inches(width), Inches(0.3 * rows),
        ).table

        # Header
        for ci, header in enumerate(table.headers):
            cell = tbl.cell(0, ci)
            cell.text = header
            for p in cell.text_frame.paragraphs:
                for run in p.runs:
                    run.font.bold = True
                    run.font.size = Pt(self.theme.fonts.body.size)

        # Data rows
        for ri, row in enumerate(table.rows, start=1):
            for ci, val in enumerate(row):
                cell = tbl.cell(ri, ci)
                cell.text = val
                for p in cell.text_frame.paragraphs:
                    for run in p.runs:
                        run.font.size = Pt(self.theme.fonts.body.size)

        return top + 0.3 * rows + 0.2

    def _fill_background(self, slide, color_name: str):
        bg = slide.background
        fill = bg.fill
        fill.solid()
        r, g, b = self.theme.colors.hex_to_rgb(color_name)
        fill.fore_color.rgb = RGBColor(r, g, b)

    # ------------------------------------------------------------------
    # Slide Type Renderers
    # ------------------------------------------------------------------

    def _render_title_slide(self, slide, model: Slide) -> None:
        """Center-aligned title + subtitle from body[0]."""
        t = self.theme
        center_top = self._slide_h / 2 - 0.8

        # Title
        txbox = self._add_textbox(
            slide,
            self._margin.left,
            center_top,
            self._usable_width,
            0.8,
        )
        tf = txbox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = model.title
        self._set_font(run, t.fonts.title, t.colors.hex_to_rgb("primary"))

        # Subtitle from body[0]
        if model.body:
            subtitle_text = str(model.body[0])
            sub_box = self._add_textbox(
                slide,
                self._margin.left,
                center_top + 0.9,
                self._usable_width,
                0.5,
            )
            sf = sub_box.text_frame
            sf.word_wrap = True
            sp = sf.paragraphs[0]
            sp.alignment = PP_ALIGN.CENTER
            srun = sp.add_run()
            srun.text = subtitle_text
            self._set_font(srun, t.fonts.subtitle, t.colors.hex_to_rgb("secondary"))

    def _render_content_slide(self, slide, model: Slide) -> None:
        """Generic content: title + body bullets + tables."""
        self._add_title(slide, model.title)
        if model.body:
            self._render_bullet(slide, model.body)

    def _render_summary_slide(self, slide, model: Slide) -> None:
        """Accent background + white centered text."""
        self._fill_background(slide, "accent")
        t = self.theme
        center_top = self._slide_h / 2 - 0.5

        txbox = self._add_textbox(
            slide, self._margin.left, center_top, self._usable_width, 1.0,
        )
        tf = txbox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = model.title
        run.font.name = t.fonts.title.name
        run.font.size = Pt(t.fonts.title.size)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)

        if model.body:
            for item in model.body:
                bp = tf.add_paragraph()
                bp.alignment = PP_ALIGN.CENTER
                br = bp.add_run()
                br.text = str(item)
                br.font.name = t.fonts.body.name
                br.font.size = Pt(t.fonts.body.size)
                br.font.color.rgb = RGBColor(255, 255, 255)

    def _render_exercise_slide(self, slide, model: Slide) -> None:
        """Title + checkbox-style items (checkbox prefix)."""
        self._add_title(slide, model.title)
        t = self.theme
        top = t.layout.body_top
        for item in model.body:
            text = str(item)
            if not text.startswith("\u2610"):
                text = f"\u2610 {text}"
            top = self._render_text_bullet(
                slide, text, top, self._margin.left, self._usable_width,
            )

    def _render_example_slide(self, slide, model: Slide) -> None:
        """2-column: question items left, insight items right."""
        self._add_title(slide, model.title)
        half = self._usable_width / 2 - 0.1
        left_items: list[str | TableData] = []
        right_items: list[str | TableData] = []

        current = left_items
        for item in model.body:
            text = str(item) if not isinstance(item, TableData) else item
            if isinstance(text, str) and ("insight" in text.lower() or "결과" in text.lower()):
                current = right_items
            current.append(text)

        if not right_items:
            mid = len(model.body) // 2
            left_items = list(model.body[:mid])
            right_items = list(model.body[mid:])

        self._render_bullet(
            slide, left_items,
            left=self._margin.left, width=half,
        )
        self._render_bullet(
            slide, right_items,
            left=self._margin.left + half + 0.2, width=half,
        )

    def _render_two_column_slide(self, slide, model: Slide) -> None:
        """2-column: CRM items left, experiment items right."""
        self._add_title(slide, model.title)
        half = self._usable_width / 2 - 0.1

        mid = len(model.body) // 2 if model.body else 0
        left_items = list(model.body[:mid]) if model.body else []
        right_items = list(model.body[mid:]) if model.body else []

        self._render_bullet(
            slide, left_items,
            left=self._margin.left, width=half,
        )
        self._render_bullet(
            slide, right_items,
            left=self._margin.left + half + 0.2, width=half,
        )

    def _render_image_placeholder(self, slide, model: Slide) -> None:
        """Gray box with description text + caption."""
        self._add_title(slide, model.title)
        t = self.theme

        # 80% usable width, 60% slide height
        box_w = self._usable_width * 0.8
        box_h = self._slide_h * 0.6
        box_left = self._margin.left + (self._usable_width - box_w) / 2
        box_top = t.layout.body_top

        # Gray placeholder rectangle
        from pptx.util import Emu as _Emu
        shape = slide.shapes.add_shape(
            1,  # MSO_SHAPE.RECTANGLE
            Inches(box_left), Inches(box_top),
            Inches(box_w), Inches(box_h),
        )
        fill = shape.fill
        fill.solid()
        r, g, b = t.colors.hex_to_rgb("placeholder_bg")
        fill.fore_color.rgb = RGBColor(r, g, b)
        shape.line.fill.background()

        # Description text inside box
        tf = shape.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        if model.body:
            run = p.add_run()
            run.text = str(model.body[0])
            self._set_font(run, t.fonts.body, t.colors.hex_to_rgb("secondary"))

        # Caption below
        cap_top = box_top + box_h + 0.15
        cap_box = self._add_textbox(
            slide, box_left, cap_top, box_w, 0.4,
        )
        cf = cap_box.text_frame
        cf.word_wrap = True
        cp = cf.paragraphs[0]
        cp.alignment = PP_ALIGN.CENTER
        cr = cp.add_run()
        cr.text = "이미지 수동 삽입 필요"
        self._set_font(cr, t.fonts.note, t.colors.hex_to_rgb("secondary"))

    def _add_section_divider(self, pptx, layout, section_title: str) -> None:
        """Dark background + white centered section title."""
        slide = pptx.slides.add_slide(layout)
        self._fill_background(slide, "section_bg")
        t = self.theme
        center_top = self._slide_h / 2 - 0.4

        txbox = self._add_textbox(
            slide,
            self._margin.left,
            center_top,
            self._usable_width,
            0.8,
        )
        tf = txbox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = section_title
        r, g, b = t.colors.hex_to_rgb("section_text")
        run.font.name = t.fonts.title.name
        run.font.size = Pt(t.fonts.title.size)
        run.font.bold = True
        run.font.color.rgb = RGBColor(r, g, b)

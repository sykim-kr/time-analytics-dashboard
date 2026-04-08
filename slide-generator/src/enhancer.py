from __future__ import annotations

import json
import logging
import os
import re
from typing import List, Optional

from pydantic import BaseModel

from src.models import Presentation, Slide

logger = logging.getLogger(__name__)

# Lazy import placeholder – the real Anthropic class is imported at module level
# only when an api_key is present, so tests can patch it via `src.enhancer.Anthropic`.
try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None  # type: ignore


class EnhancerConfig(BaseModel):
    model: str = "claude-opus-4-5"
    enhance_modes: List[str] = ["notes", "body"]
    batch_size: int = 10
    section_aware_batching: bool = True


class ClaudeEnhancer:
    def __init__(
        self,
        config: Optional[EnhancerConfig] = None,
        api_key: Optional[str] = None,
    ) -> None:
        self.config = config or EnhancerConfig()
        self._api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def enhance(self, presentation: Presentation) -> Presentation:
        """Enhance a presentation using the Claude API.

        Returns the original presentation unchanged if:
        - No API key is available
        - The `anthropic` package is not installed
        - Any API error occurs
        """
        if not self._api_key:
            logger.debug("No API key found; skipping enhancement.")
            return presentation

        if Anthropic is None:
            logger.warning("anthropic package not installed; skipping enhancement.")
            return presentation

        try:
            client = Anthropic(api_key=self._api_key)
            batches = self._create_batches(presentation.slides)
            enhanced_slides = list(presentation.slides)  # shallow copy of list

            for batch in batches:
                enhanced_batch = self._enhance_batch(client, batch)
                # Merge enhanced slides back by slide number
                enhanced_by_number = {s.number: s for s in enhanced_batch}
                for i, slide in enumerate(enhanced_slides):
                    if slide.number in enhanced_by_number:
                        enhanced_slides[i] = enhanced_by_number[slide.number]

            return presentation.model_copy(update={"slides": enhanced_slides})

        except Exception as exc:  # noqa: BLE001
            logger.warning("Enhancement failed (%s); returning original.", exc)
            return presentation

    # ------------------------------------------------------------------
    # Batching
    # ------------------------------------------------------------------

    def _create_batches(self, slides: List[Slide]) -> List[List[Slide]]:
        if self.config.section_aware_batching:
            return self._section_aware_batches(slides)
        return self._positional_batches(slides)

    def _section_aware_batches(self, slides: List[Slide]) -> List[List[Slide]]:
        """Group slides by section first, then split large sections by batch_size."""
        # Collect sections in order, preserving section sequence
        section_groups: dict[str, List[Slide]] = {}
        section_order: List[str] = []
        for slide in slides:
            key = slide.section
            if key not in section_groups:
                section_groups[key] = []
                section_order.append(key)
            section_groups[key].append(slide)

        batches: List[List[Slide]] = []
        for key in section_order:
            group = section_groups[key]
            # Split large sections into batch_size chunks
            for start in range(0, len(group), self.config.batch_size):
                batches.append(group[start : start + self.config.batch_size])
        return batches

    def _positional_batches(self, slides: List[Slide]) -> List[List[Slide]]:
        """Split slides into fixed-size batches ignoring section boundaries."""
        batches: List[List[Slide]] = []
        for start in range(0, len(slides), self.config.batch_size):
            batches.append(slides[start : start + self.config.batch_size])
        return batches

    # ------------------------------------------------------------------
    # API call
    # ------------------------------------------------------------------

    def _enhance_batch(self, client: "Anthropic", slides: List[Slide]) -> List[Slide]:  # type: ignore[name-defined]
        """Send a batch of slides to Claude and return enhanced versions."""
        slides_payload = [
            {
                "number": s.number,
                "title": s.title,
                "section": s.section,
                "body": [
                    item if isinstance(item, str) else item.model_dump()
                    for item in s.body
                ],
            }
            for s in slides
        ]

        mode_instructions = self._build_mode_instructions()
        prompt = (
            f"You are a presentation assistant. Enhance the following slides.\n"
            f"{mode_instructions}\n\n"
            f"Return a JSON array of objects with keys matching the requested enhancements "
            f"plus 'number' (the slide number). Only include fields you are enhancing.\n\n"
            f"Slides:\n{json.dumps(slides_payload, ensure_ascii=False, indent=2)}"
        )

        response = client.messages.create(
            model=self.config.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        raw_text = response.content[0].text
        # Strip markdown code fences if present
        raw_text = re.sub(r"```(?:json)?\s*", "", raw_text).strip().rstrip("```").strip()

        enhanced_data: List[dict] = json.loads(raw_text)
        enhanced_by_number = {item["number"]: item for item in enhanced_data}

        result: List[Slide] = []
        for slide in slides:
            data = enhanced_by_number.get(slide.number, {})
            updated = slide.model_copy()

            if "body" in data and "body" in self.config.enhance_modes:
                new_body = data["body"]
                if self._content_preserved(slide.body, new_body):
                    updated = updated.model_copy(update={"body": new_body})
                else:
                    logger.warning(
                        "Slide %d: content preservation check failed; keeping original body.",
                        slide.number,
                    )

            if "speaker_note" in data and "notes" in self.config.enhance_modes:
                updated = updated.model_copy(update={"speaker_note": data["speaker_note"]})

            result.append(updated)

        return result

    def _build_mode_instructions(self) -> str:
        parts = []
        if "notes" in self.config.enhance_modes:
            parts.append(
                "- Add a 'speaker_note' field with a concise speaker note (2-3 sentences)."
            )
        if "body" in self.config.enhance_modes:
            parts.append(
                "- Enhance the 'body' field to improve clarity and conciseness while preserving key content."
            )
        return "\n".join(parts)

    # ------------------------------------------------------------------
    # Content preservation
    # ------------------------------------------------------------------

    @staticmethod
    def _content_preserved(original_body: list, enhanced_body: list) -> bool:
        import re

        def extract_keywords(items):
            text = " ".join(
                str(item) if isinstance(item, str) else str(getattr(item, "rows", ""))
                for item in items
            )
            words = set(re.findall(r"[가-힣a-zA-Z]{2,}", text))
            return words

        orig_kw = extract_keywords(original_body)
        if not orig_kw:
            return True
        enhanced_kw = extract_keywords(enhanced_body)
        overlap = len(orig_kw & enhanced_kw) / len(orig_kw)
        return overlap >= 0.7

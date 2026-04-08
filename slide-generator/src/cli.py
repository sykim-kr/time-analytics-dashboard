from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

# Ensure stdout uses UTF-8 on all platforms (important on Windows with cp949 default)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

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

    # 2. Dry run without enhance
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
            config = EnhancerConfig(enhance_modes=args.enhance_mode.split(","))
            enhancer = ClaudeEnhancer(config=config)
            if args.dry_run:
                original = presentation.model_copy(deep=True)
                enhanced = enhancer.enhance(presentation)
                _print_enhance_diff(original, enhanced)
                return 0
            presentation = enhancer.enhance(presentation)

    # Save intermediate JSON
    if args.save_json:
        json_path = Path(args.save_json)
        json_path.write_text(presentation.model_dump_json(indent=2), encoding="utf-8")
        logger.info("Saved intermediate JSON to %s", json_path)

    # 4. Render
    output_path = Path(args.output or input_path.with_suffix(".pptx").name)
    theme_path = Path(args.theme) if args.theme else None
    theme = load_theme(theme_path)
    renderer = PptxRenderer(theme=theme)
    renderer.render(presentation, output_path)
    print(f"Generated {len(presentation.slides)} slides → {output_path}")
    return 0


def _print_enhance_diff(original: Presentation, enhanced: Presentation) -> None:
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


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Convert markdown to PowerPoint slides")
    p.add_argument("input", help="Input markdown file")
    p.add_argument("-o", "--output", help="Output .pptx file path")
    p.add_argument("--theme", help="Theme YAML file path")
    p.add_argument("--enhance", action="store_true", help="Enable Claude API enhancement")
    p.add_argument("--enhance-mode", default="notes,cleanup,type", help="Enhancement modes (comma-separated)")
    p.add_argument("--dry-run", action="store_true", help="Output SlideData JSON to stdout, skip rendering")
    p.add_argument("--save-json", help="Save intermediate JSON to file")
    p.add_argument("--verbose", action="store_true", help="Verbose logging")
    return p.parse_args()


def setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.WARNING
    logging.basicConfig(level=level, format="%(levelname)s: %(message)s", stream=sys.stderr)


if __name__ == "__main__":
    sys.exit(main())

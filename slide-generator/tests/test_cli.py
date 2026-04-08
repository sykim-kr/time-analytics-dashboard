import os
import subprocess
import sys
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent / "fixtures"
CLI_PATH = Path(__file__).parent.parent / "src" / "cli.py"

# Ensure subprocess stdout/stderr are read as UTF-8 on all platforms
_UTF8_ENV = {**os.environ, "PYTHONUTF8": "1"}


def test_cli_basic_run(tmp_path):
    input_file = FIXTURES_DIR / "sample_simple.md"
    output_file = tmp_path / "output.pptx"
    result = subprocess.run(
        [sys.executable, str(CLI_PATH), str(input_file), "-o", str(output_file)],
        capture_output=True, text=True, encoding="utf-8",
        cwd=str(CLI_PATH.parent.parent), env=_UTF8_ENV,
    )
    assert result.returncode == 0, f"stderr: {result.stderr}"
    assert output_file.exists()


def test_cli_dry_run(tmp_path):
    input_file = FIXTURES_DIR / "sample_structured.md"
    result = subprocess.run(
        [sys.executable, str(CLI_PATH), str(input_file), "--dry-run"],
        capture_output=True, text=True, encoding="utf-8",
        cwd=str(CLI_PATH.parent.parent), env=_UTF8_ENV,
    )
    assert result.returncode == 0
    assert '"slides"' in result.stdout


def test_cli_save_json(tmp_path):
    input_file = FIXTURES_DIR / "sample_simple.md"
    json_file = tmp_path / "slides.json"
    output_file = tmp_path / "output.pptx"
    result = subprocess.run(
        [sys.executable, str(CLI_PATH), str(input_file), "-o", str(output_file),
         "--save-json", str(json_file)],
        capture_output=True, text=True, encoding="utf-8",
        cwd=str(CLI_PATH.parent.parent), env=_UTF8_ENV,
    )
    assert result.returncode == 0
    assert json_file.exists()
    assert output_file.exists()


def test_cli_nonexistent_input():
    result = subprocess.run(
        [sys.executable, str(CLI_PATH), "nonexistent.md"],
        capture_output=True, text=True, encoding="utf-8",
        cwd=str(CLI_PATH.parent.parent), env=_UTF8_ENV,
    )
    assert result.returncode != 0


def test_cli_verbose(tmp_path):
    input_file = FIXTURES_DIR / "sample_simple.md"
    output_file = tmp_path / "output.pptx"
    result = subprocess.run(
        [sys.executable, str(CLI_PATH), str(input_file), "-o", str(output_file), "--verbose"],
        capture_output=True, text=True, encoding="utf-8",
        cwd=str(CLI_PATH.parent.parent), env=_UTF8_ENV,
    )
    assert result.returncode == 0

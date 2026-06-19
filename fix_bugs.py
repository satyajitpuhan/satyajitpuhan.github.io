#!/usr/bin/env python3
"""
Master orchestrator: fix bugs, fill missing data, and regenerate the portfolio.

Pipeline:
1. Remove redundant _index.en.md files where _index.md exists
2. Rename any remaining .en.md content pages to .md (default language)
3. Clean old generated portfolio files (keep _index.*)
4. Fix update scripts to reference .md instead of .en.md
5. Run build_portfolio.py  → creates fresh .md files with creative metadata
6. Run update_abstracts.py → injects real INSPIRE abstracts (replaces challenge field)
7. Run update_summaries.py → injects real summaries (replaces solution field)
8. Copy updated .md → .or.md for translation base
9. Run translate_to_or.py  → translates .or.md files to Odia (optional, needs internet)
"""

import os
import sys
import glob
import shutil
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def remove_redundant_index_en():
    """Remove _index.en.md if _index.md already exists."""
    removed = 0
    for root, _, files in os.walk(os.path.join(BASE_DIR, "content")):
        for f in files:
            if f == "_index.en.md":
                original = os.path.join(root, "_index.md")
                redundant = os.path.join(root, f)
                if os.path.exists(original):
                    os.remove(redundant)
                    print(f"REMOVED redundant: {redundant}")
                    removed += 1
    if removed:
        print(f"--- Removed {redundant} redundant _index.en.md files ---\n")
    return removed


def rename_en_md_pages():
    """Rename any .en.md pages (not index) to .md for default language."""
    renamed = 0
    for root, _, files in os.walk(os.path.join(BASE_DIR, "content")):
        for f in files:
            if f.endswith(".en.md") and not f.startswith("_index"):
                old_path = os.path.join(root, f)
                new_name = f.replace(".en.md", ".md")
                new_path = os.path.join(root, new_name)
                if os.path.exists(new_path):
                    print(f"SKIP (already exists): {new_path}")
                    continue
                shutil.move(old_path, new_path)
                print(f"RENAMED: {old_path} -> {new_path}")
                renamed += 1
    if renamed:
        print(f"--- Renamed {renamed} .en.md → .md ---\n")
    return renamed


def clean_portfolio():
    """Remove old generated portfolio files, keeping only _index.*."""
    portfolio_dir = os.path.join(BASE_DIR, "content", "portfolio")
    removed = 0
    for f in glob.glob(os.path.join(portfolio_dir, "*.md")):
        basename = os.path.basename(f)
        if basename.startswith("_index"):
            continue
        os.remove(f)
        removed += 1
        print(f"CLEAN: {f}")
    print(f"--- Cleaned {removed} old files ---\n")
    return removed


def run_script(name, args=None, timeout=60):
    """Run a Python script in the repo and return (ok, stdout)."""
    path = os.path.join(BASE_DIR, name)
    if not os.path.exists(path):
        print(f"SKIP: {name} not found")
        return False, ""

    cmd = [sys.executable, path]
    if args:
        cmd.extend(args)

    print(f"RUNNING: {name} ...")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=BASE_DIR, timeout=timeout)
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        if result.returncode != 0:
            return False, result.stdout + result.stderr
        return True, result.stdout
    except subprocess.TimeoutExpired:
        print(f"WARNING: {name} timed out after {timeout}s")
        return False, ""
    except subprocess.CalledProcessError as e:
        print(f"ERROR running {name}:")
        print(e.stdout)
        print(e.stderr)
        return False, e.stdout + e.stderr


def copy_md_to_or():
    """Copy updated English .md files to .or.md so translation has the best base."""
    portfolio_dir = os.path.join(BASE_DIR, "content", "portfolio")
    copied = 0
    for src in glob.glob(os.path.join(portfolio_dir, "*.md")):
        if os.path.basename(src).startswith("_index"):
            continue
        dst = src.replace(".md", ".or.md")
        shutil.copy2(src, dst)
        copied += 1
    print(f"--- Copied {copied} .md → .or.md ---\n")
    return copied


def fix_update_script_extensions():
    """Ensure update scripts reference .md files, not stale .en.md."""
    fixed = 0
    for script_name in ["update_abstracts.py", "update_summaries.py"]:
        path = os.path.join(BASE_DIR, script_name)
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        if ".en.md" in content:
            content = content.replace(".en.md", ".md")
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"FIXED: {script_name} (.en.md → .md)")
            fixed += 1
    if fixed:
        print(f"--- Fixed {fixed} update scripts ---\n")
    return fixed


def main():
    print("=" * 60)
    print("  PORTFOLIO BUG FIX & DATA ENRICHMENT ORCHESTRATOR")
    print("=" * 60 + "\n")

    # 1. Clean up stale .en.md files
    remove_redundant_index_en()
    rename_en_md_pages()

    # 2. Clean old portfolio files
    clean_portfolio()

    # 3. Fix update scripts first (so they work on .md files)
    fix_update_script_extensions()

    # 4. Rebuild portfolio with creative metadata
    ok, _ = run_script("build_portfolio.py")
    if not ok:
        print("FATAL: build_portfolio.py failed")
        return 1

    # 5. Inject real abstracts
    ok, _ = run_script("update_abstracts.py")
    if not ok:
        print("WARNING: update_abstracts.py failed (abstracts may be placeholders)")

    # 6. Inject real summaries
    ok, _ = run_script("update_summaries.py")
    if not ok:
        print("WARNING: update_summaries.py failed (summaries may be placeholders)")

    # 7. Copy updated English files to .or.md base
    copy_md_to_or()

    # 8. Translate .or.md files to Odia (optional, needs internet)
    print("RUNNING: translate_to_or.py ...")
    ok, out = run_script("translate_to_or.py", timeout=90)
    if not ok:
        print("WARNING: translate_to_or.py failed (Odia translations remain in English)")
        print("         Run it manually later with internet: python translate_to_or.py")

    # 9. Verify
    print("=" * 60)
    print("  VERIFICATION")
    print("=" * 60)
    portfolio_dir = os.path.join(BASE_DIR, "content", "portfolio")
    md_files = [f for f in glob.glob(os.path.join(portfolio_dir, "*.md")) if not os.path.basename(f).startswith("_index")]
    or_files = [f for f in glob.glob(os.path.join(portfolio_dir, "*.or.md")) if not os.path.basename(f).startswith("_index")]
    print(f"Portfolio .md files : {len(md_files)}")
    print(f"Portfolio .or.md files: {len(or_files)}")

    # Check for remaining .en.md files
    en_files = glob.glob(os.path.join(BASE_DIR, "content", "**", "*.en.md"), recursive=True)
    if en_files:
        print(f"\nWARNING: {len(en_files)} .en.md files still exist:")
        for f in en_files:
            print(f"  {f}")
    else:
        print("\nOK: No stale .en.md files found.")

    print("\n=== DONE ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())

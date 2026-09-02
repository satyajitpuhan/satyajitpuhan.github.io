#!/usr/bin/env python3
"""
sync_inspire.py — keep the website in step with INSPIRE-HEP, automatically.

Run daily from GitHub Actions (.github/workflows/sync-inspire.yml).

What it does, in order:

  1. Pulls every literature record attached to the author profile.
  2. Refreshes `static/data/inspire-stats.json` (papers / citations / h-index),
     which the hero stat strip and the assistant both read.
  3. For papers the site ALREADY has: updates only the metadata that changes
     over time — citation count, DOI, INSPIRE id, journal reference.
     The hand-written body of a page is never touched.
  4. For papers the site does NOT have yet: creates
     `content/portfolio/<slug>.md` and `<slug>.or.md`, renders the FIRST PAGE
     of the arXiv PDF into `static/images/portfolio/papers/`, and prepends a
     "New paper" entry to `static/sections/news/{en,or}.toml`.

Design rules:
  * Idempotent — running it twice changes nothing the second time.
  * Additive — it creates and updates, it never deletes a page.
  * Fail-soft — if the network, poppler or Pillow is unavailable, it skips
    that step and still writes whatever it could.

Usage:
    python3 tools/sync_inspire.py            # normal run
    python3 tools/sync_inspire.py --dry-run  # report only, write nothing
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

AUTHOR_BAI = "Satyajit.Puhan.1"
AUTHOR_URL = "https://inspirehep.net/authors/2706496"
# Records under this BAI that belong to a different "Puhan" (NOvA collaboration).
EXCLUDED_RECORDS = {3168377}

PORTFOLIO_DIR = os.path.join(ROOT, "content", "portfolio")
PAPER_IMG_DIR = os.path.join(ROOT, "static", "images", "portfolio", "papers")
STATS_PATH = os.path.join(ROOT, "static", "data", "inspire-stats.json")
NEWS_EN = os.path.join(ROOT, "static", "sections", "news", "en.toml")
NEWS_OR = os.path.join(ROOT, "static", "sections", "news", "or.toml")

API = ("https://inspirehep.net/api/literature"
       "?q=a%20{bai}&size=400&sort=mostrecent"
       "&fields=titles,abstracts,arxiv_eprints,publication_info,dois,authors,"
       "earliest_date,citation_count,control_number,document_type,keywords,"
       "collaborations,report_numbers")

UA = {"User-Agent": "satyajitpuhan.github.io site sync (+https://satyajitpuhan.github.io)"}

JOURNAL_NAMES = {
    "Phys.Rev.D": "Phys. Rev. D",
    "Phys.Rev.C": "Phys. Rev. C",
    "Phys.Lett.B": "Phys. Lett. B",
    "Nucl.Phys.A": "Nucl. Phys. A",
    "Nucl.Phys.B": "Nucl. Phys. B",
    "Eur.Phys.J.A": "Eur. Phys. J. A",
    "Eur.Phys.J.C": "Eur. Phys. J. C",
    "Eur.Phys.J.Plus": "Eur. Phys. J. Plus",
    "Chin.Phys.C": "Chin. Phys. C",
    "JHEP": "JHEP",
    "PTEP": "PTEP",
    "Springer Proc.Phys.": "Springer Proc. Phys.",
    "DAE Symp.Nucl.Phys.": "DAE Symp. Nucl. Phys.",
    "PoS": "PoS",
    "Mod.Phys.Lett.A": "Mod. Phys. Lett. A",
}

PROCEEDING_MARKERS = ("DAE Symp", "PoS", "Springer Proc", "Conf.Proc", "AIP Conf")


# ───────────────────────── helpers ──────────────────────────────────────────

def log(*a):
    print("[sync]", *a, flush=True)


def strip_math(text: str) -> str:
    """INSPIRE titles carry LaTeX and occasionally MathML. Make them readable."""
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", "", text)              # MathML / HTML tags
    text = text.replace("\\\\", " ")
    text = re.sub(r"\\(?:mathrm|mathbf|mathit|text|rm|bf|it)\s*\{([^{}]*)\}", r"\1", text)
    text = re.sub(r"\\(?:sqrt|frac)\s*", "", text)
    text = re.sub(r"\\[a-zA-Z]+", lambda m: {
        "\\pi": "pi", "\\rho": "rho", "\\psi": "psi", "\\eta": "eta",
        "\\chi": "chi", "\\Delta": "Delta", "\\gamma": "gamma",
        "\\alpha": "alpha", "\\mu": "mu", "\\nu": "nu", "\\perp": "perp",
        "\\to": "to", "\\times": "x", "\\sim": "~", "\\pm": "+/-",
    }.get(m.group(0), " "), text)
    text = text.replace("$", "").replace("{", "").replace("}", "")
    text = re.sub(r"\s+", " ", text)
    return text.strip(" .,")


def slugify(value: str, maxlen: int = 60) -> str:
    value = unicodedata.normalize("NFKD", strip_math(value))
    value = value.encode("ascii", "ignore").decode()
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    value = re.sub(r"-{2,}", "-", value)
    if len(value) > maxlen:
        value = value[:maxlen].rsplit("-", 1)[0]
    return value or "paper"


def norm_title(t: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", strip_math(t).lower())


def toml_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").strip()


def fetch_json(url: str, timeout: int = 60):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


# ───────────────────────── INSPIRE ──────────────────────────────────────────

def tidy_author(full_name: str) -> str:
    """INSPIRE gives "Puhan, Satyajit"; papers cite "S. Puhan"."""
    full_name = (full_name or "").strip()
    if not full_name:
        return ""
    if "," in full_name:
        last, first = [p.strip() for p in full_name.split(",", 1)]
    else:
        parts = full_name.split()
        last, first = parts[-1], " ".join(parts[:-1])
    initials = " ".join(f"{p[0]}." for p in first.replace(".", " ").split() if p)
    return f"{initials} {last}".strip()


def fetch_records(source: str | None = None):
    """Records from INSPIRE-HEP, or from a local JSON dump when `source` is set.

    The local-file path exists so the sync can be exercised (and re-run) in a
    sandbox with no outbound access to inspirehep.net.
    """
    if source:
        data = json.load(open(source, encoding="utf-8"))
    else:
        url = API.format(bai=urllib.parse.quote(AUTHOR_BAI))
        data = fetch_json(url)
    out = []
    for hit in data.get("hits", {}).get("hits", []):
        m = hit.get("metadata", {})
        cn = m.get("control_number")
        if cn in EXCLUDED_RECORDS:
            continue

        pub = (m.get("publication_info") or [{}])[0]
        raw_journal = pub.get("journal_title") or ""
        journal = JOURNAL_NAMES.get(raw_journal, raw_journal.replace(".", ". ").strip())
        volume = str(pub.get("journal_volume") or "")
        year = pub.get("year") or ""
        arxiv = ((m.get("arxiv_eprints") or [{}])[0] or {}).get("value", "")
        doi = ((m.get("dois") or [{}])[0] or {}).get("value", "")

        authors = [tidy_author(a.get("full_name", "")) for a in (m.get("authors") or [])]
        authors = [a for a in authors if a]

        abstracts = m.get("abstracts") or []
        abstract = ""
        for a in abstracts:
            if a.get("value"):
                abstract = strip_math(a["value"])
                break

        if journal:
            ref = journal + (" " + volume if volume else "") + (f" ({year})" if year else "")
        elif arxiv:
            ref = f"e-Print: {arxiv} [hep-ph]"
        else:
            ref = "Preprint"

        if any(mk in raw_journal for mk in PROCEEDING_MARKERS):
            category = "Conference Proceeding"
        elif journal:
            category = "Journal Article"
        else:
            category = "Preprint"

        out.append({
            "control_number": cn,
            "title": strip_math((m.get("titles") or [{}])[0].get("title", "")),
            "abstract": abstract,
            "arxiv": arxiv,
            "doi": doi,
            "journal": journal,
            "reference": ref,
            "date": m.get("earliest_date", "") or (str(year) if year else ""),
            "citations": m.get("citation_count", 0) or 0,
            "authors": authors,
            "category": category,
            "keywords": [k.get("value", "") for k in (m.get("keywords") or []) if k.get("value")],
        })
    out.sort(key=lambda r: r["date"], reverse=True)
    return out


def compute_stats(records):
    counts = sorted((r["citations"] for r in records), reverse=True)
    h = 0
    for i, c in enumerate(counts):
        if c >= i + 1:
            h = i + 1
        else:
            break
    return {
        "papers": len(records),
        "citations": sum(counts),
        "hindex": h,
        "journal_articles": sum(1 for r in records if r["category"] == "Journal Article"),
        "proceedings": sum(1 for r in records if r["category"] == "Conference Proceeding"),
        "preprints": sum(1 for r in records if r["category"] == "Preprint"),
        "updated": dt.date.today().isoformat(),
        "exclude": sorted(EXCLUDED_RECORDS),
    }


# ───────────────────────── existing pages ───────────────────────────────────

FM_RE = re.compile(r"^\+\+\+\s*\n(.*?)\n\+\+\+", re.S)


def read_page(path):
    text = open(path, encoding="utf-8").read()
    m = FM_RE.search(text)
    if not m:
        return None
    return {"path": path, "text": text, "front": m.group(1), "span": m.span(1)}


def fm_get(front, key):
    m = re.search(rf'^{key}\s*=\s*"(.*?)"\s*$', front, re.M)
    if m:
        return m.group(1)
    m = re.search(rf"^{key}\s*=\s*(\d+)\s*$", front, re.M)
    return m.group(1) if m else None


def fm_set(front, key, value, quoted=True):
    """Set a key inside the [extra] table, adding it if absent."""
    rendered = f'{key} = "{toml_escape(str(value))}"' if quoted else f"{key} = {value}"
    if re.search(rf"^{key}\s*=", front, re.M):
        return re.sub(rf"^{key}\s*=.*$", rendered, front, count=1, flags=re.M)
    # insert right after the [extra] header, else at the end
    if "[extra]" in front:
        return front.replace("[extra]\n", f"[extra]\n{rendered}\n", 1)
    return front + "\n" + rendered


def load_existing():
    pages = []
    if not os.path.isdir(PORTFOLIO_DIR):
        return pages
    for name in sorted(os.listdir(PORTFOLIO_DIR)):
        if not name.endswith(".md") or name.startswith("_index"):
            continue
        p = read_page(os.path.join(PORTFOLIO_DIR, name))
        if p:
            p["is_or"] = name.endswith(".or.md")
            p["slug"] = name[:-6] if p["is_or"] else name[:-3]
            pages.append(p)
    return pages


def match_record(rec, pages_by_key):
    for key in (("inspire", str(rec["control_number"])),
                ("arxiv", rec["arxiv"]),
                ("title", norm_title(rec["title"]))):
        if key[1] and key in pages_by_key:
            return pages_by_key[key]
    return None


# ───────────────────────── first-page thumbnails ────────────────────────────

def have(cmd):
    return shutil.which(cmd) is not None


def render_first_page(arxiv_id: str, slug: str, dry: bool) -> str | None:
    """Download the arXiv PDF and render page 1. Returns a site-relative path."""
    if not arxiv_id:
        return None
    webp = os.path.join(PAPER_IMG_DIR, f"{slug}-first-page.webp")
    png = os.path.join(PAPER_IMG_DIR, f"{slug}-first-page.png")
    for existing, rel in ((webp, "webp"), (png, "png")):
        if os.path.exists(existing):
            return f"images/portfolio/papers/{slug}-first-page.{rel}"
    if dry:
        return f"images/portfolio/papers/{slug}-first-page.webp"
    if not have("pdftoppm"):
        log("pdftoppm missing — cannot render a first page for", arxiv_id)
        return None

    os.makedirs(PAPER_IMG_DIR, exist_ok=True)
    tmp_pdf = f"/tmp/{slug}.pdf"
    try:
        req = urllib.request.Request(f"https://arxiv.org/pdf/{arxiv_id}", headers=UA)
        with urllib.request.urlopen(req, timeout=90) as r, open(tmp_pdf, "wb") as f:
            shutil.copyfileobj(r, f)
    except Exception as e:                                   # noqa: BLE001
        log("could not download arXiv PDF", arxiv_id, "-", e)
        return None

    stem = f"/tmp/{slug}-first-page"
    try:
        subprocess.run(["pdftoppm", "-png", "-r", "120", "-f", "1", "-l", "1",
                        "-singlefile", tmp_pdf, stem], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:                                   # noqa: BLE001
        log("pdftoppm failed for", arxiv_id, "-", e)
        return None
    finally:
        if os.path.exists(tmp_pdf):
            os.remove(tmp_pdf)

    produced = stem + ".png"
    if not os.path.exists(produced):
        return None

    if have("cwebp"):
        try:
            subprocess.run(["cwebp", "-quiet", "-q", "82", "-resize", "760", "0",
                            produced, "-o", webp], check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            os.remove(produced)
            log("rendered first page →", os.path.basename(webp))
            return f"images/portfolio/papers/{slug}-first-page.webp"
        except Exception:                                    # noqa: BLE001
            pass
    shutil.move(produced, png)
    log("rendered first page →", os.path.basename(png))
    return f"images/portfolio/papers/{slug}-first-page.png"


COVER_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 984" role="img" aria-label="{alt}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#101a2e"/><stop offset="1" stop-color="#070b14"/>
    </linearGradient>
  </defs>
  <rect width="760" height="984" fill="url(#g)"/>
  <rect x="1" y="1" width="758" height="982" fill="none" stroke="#1e2a44"/>
  <text x="56" y="120" fill="#e8a444" font-family="monospace" font-size="21" letter-spacing="4">{kicker}</text>
  <line x1="56" y1="150" x2="704" y2="150" stroke="#1e2a44" stroke-width="2"/>
{title_lines}
  <text x="56" y="880" fill="#8ea0c0" font-family="monospace" font-size="20">{authors}</text>
  <text x="56" y="920" fill="#5d6f90" font-family="monospace" font-size="18">{reference}</text>
</svg>
"""


def make_cover(rec, slug, dry):
    """A clean typographic cover, used when the arXiv PDF cannot be rendered."""
    rel = f"images/portfolio/papers/{slug}-cover.svg"
    dest = os.path.join(ROOT, "static", rel)
    if os.path.exists(dest):
        return rel
    if dry:
        return rel

    words, lines, line = strip_math(rec["title"]).split(), [], ""
    for w in words:
        if len(line) + len(w) + 1 > 26:
            lines.append(line)
            line = w
        else:
            line = (line + " " + w).strip()
    if line:
        lines.append(line)
    lines = lines[:9]
    title_lines = "\n".join(
        f'  <text x="56" y="{230 + i * 54}" fill="#eef2fb" font-family="Georgia, serif" '
        f'font-size="42">{esc_xml(t)}</text>' for i, t in enumerate(lines))

    kicker = (rec["arxiv"] and f"arXiv:{rec['arxiv']}") or rec["category"].upper()
    authors = ", ".join(a.split(",")[0] for a in rec["authors"][:4]) or "S. Puhan"
    if len(rec["authors"]) > 4:
        authors += " et al."

    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8", newline="\n").write(COVER_SVG.format(
        alt=esc_xml(rec["title"][:120]), kicker=esc_xml(kicker),
        title_lines=title_lines, authors=esc_xml(authors[:60]),
        reference=esc_xml(rec["reference"][:60])))
    log("generated cover →", os.path.basename(dest))
    return rel


def esc_xml(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


# ───────────────────────── page writers ─────────────────────────────────────

BODY_EN = """**Authors:** {authors}  
**Published in:** {reference}

{links}

### Abstract

{abstract}
"""

BODY_OR = """**ଲେଖକ:** {authors}  
**ପ୍ରକାଶିତ:** {reference}

{links}

### ସାରାଂଶ

{abstract}
"""


def link_line(rec):
    bits = []
    if rec["doi"]:
        bits.append(f'[DOI: {rec["doi"]}](https://doi.org/{rec["doi"]})')
    if rec["arxiv"]:
        bits.append(f'[arXiv:{rec["arxiv"]}](https://arxiv.org/abs/{rec["arxiv"]})')
    bits.append(f'[INSPIRE-HEP record](https://inspirehep.net/literature/{rec["control_number"]})')
    return " · ".join(bits)


def short_desc(rec):
    text = rec["abstract"] or rec["title"]
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > 210:
        cut = text[:210]
        stop = max(cut.rfind(". "), cut.rfind("; "))
        text = (cut[:stop + 1] if stop > 90 else cut.rsplit(" ", 1)[0] + "…")
    return text


def closing_line(rec):
    """The paper's own conclusion — the last sentences of the abstract."""
    text = re.sub(r"\s+", " ", rec["abstract"] or "").strip()
    if not text:
        return short_desc(rec)
    sentences = re.split(r"(?<=[.!?]) +", text)
    tail = " ".join(sentences[-2:]) if len(sentences) > 1 else sentences[-1]
    return tail[:400].strip()


def make_tags(rec):
    tags = []
    for k in rec["keywords"]:
        k = k.split(":")[-1].strip()
        if 2 < len(k) < 28 and k.lower() not in (t.lower() for t in tags):
            tags.append(k.title())
        if len(tags) >= 5:
            break
    if not tags:
        tags = ["Hadron Structure", "QCD", "Light-Front Dynamics"]
    return tags


def render_page(rec, slug, thumb, lang):
    body = (BODY_OR if lang == "or" else BODY_EN)
    authors = ", ".join(rec["authors"][:12]) or "S. Puhan et al."
    if len(rec["authors"]) > 12:
        authors += " et al."
    date = rec["date"][:10] if len(rec["date"]) >= 10 else (rec["date"] + "-01-01")[:10]

    front = ["+++",
             f'title = "{toml_escape(rec["title"])}"',
             f"date = {date}",
             "",
             "[extra]"]
    if thumb:
        front.append(f'thumbnail = "{thumb}"')
    front += [
        f'service = "{toml_escape(rec["reference"])}"',
        f'client = "{toml_escape(authors)}"',
        f'short_description = "{toml_escape(short_desc(rec))}"',
        f'solution = "{toml_escape(closing_line(rec))}"',
    ]
    if rec["arxiv"]:
        front.append(f'arxiv = "{rec["arxiv"]}"')
    if rec["doi"]:
        front.append(f'doi = "{toml_escape(rec["doi"])}"')
    front += [
        f'inspire = "{rec["control_number"]}"',
        f'citations = {rec["citations"]}',
        "tags = [" + ", ".join(f'"{toml_escape(t)}"' for t in make_tags(rec)) + "]",
        f'categories = ["{rec["category"]}"]',
        "auto_generated = true",
        "+++",
        "",
    ]
    return "\n".join(front) + body.format(
        authors=authors, reference=rec["reference"],
        links=link_line(rec),
        abstract=rec["abstract"] or "_Abstract not yet available from INSPIRE-HEP._")


NEWS_WINDOW_DAYS = 150   # only announce papers this recent


def is_newsworthy(rec) -> bool:
    if not rec["abstract"]:
        return False
    try:
        when = dt.date.fromisoformat(rec["date"][:10])
    except ValueError:
        return False
    return (dt.date.today() - when).days <= NEWS_WINDOW_DAYS


NEWS_ITEM = '''[[items]]
top_title = "{badge}"
image = "{image}"
title = "{title}"
date = "{date}"
description = "{description}"
details = """
**{badge}**

**Title:** {title}
**Authors:** {authors}
**Published in:** {reference}
{extra_links}

### {abstract_heading}

{abstract}

---

*{footer}*
"""

'''


def prepend_news(path, rec, thumb, lang, dry):
    if not os.path.exists(path):
        return False
    text = open(path, encoding="utf-8").read()
    marker = f'inspirehep.net/literature/{rec["control_number"]}'
    if marker in text or toml_escape(rec["title"]) in text:
        return False

    links = [f'**INSPIRE-HEP:** [record {rec["control_number"]}](https://inspirehep.net/literature/{rec["control_number"]})']
    if rec["arxiv"]:
        links.insert(0, f'**e-Print:** [{rec["arxiv"]} [hep-ph]](https://arxiv.org/abs/{rec["arxiv"]})')
    if rec["doi"]:
        links.append(f'**DOI:** [{rec["doi"]}](https://doi.org/{rec["doi"]})')

    if lang == "or":
        badge = "📄 ନୂଆ ଗବେଷଣା ପତ୍ର!" if rec["category"] == "Preprint" else "🎉 ନୂଆ ପ୍ରକାଶନ!"
        abstract_heading = "ସାରାଂଶ"
        footer = "INSPIRE-HEP ରୁ ସ୍ୱୟଂଚାଳିତ ଭାବେ ଯୋଡ଼ାଯାଇଛି"
    else:
        badge = "📄 New preprint!" if rec["category"] == "Preprint" else "🎉 New publication!"
        abstract_heading = "Abstract"
        footer = "Added automatically from INSPIRE-HEP"

    item = NEWS_ITEM.format(
        badge=badge,
        image=thumb or "images/portfolio/portfolio-1.webp",
        title=toml_escape(rec["title"]),
        date=rec["date"][:10] or dt.date.today().isoformat(),
        description=toml_escape(short_desc(rec)),
        authors=", ".join(rec["authors"][:10]) or "S. Puhan et al.",
        reference=rec["reference"],
        extra_links="\n".join(links),
        abstract_heading=abstract_heading,
        abstract=rec["abstract"] or rec["title"],
        footer=footer,
    )

    idx = text.find("[[items]]")
    new_text = (text[:idx] + item + text[idx:]) if idx != -1 else (text.rstrip() + "\n\n" + item)
    if not dry:
        open(path, "w", encoding="utf-8", newline="\n").write(new_text)
    return True


# ───────────────────────── main ─────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit-new", type=int, default=25,
                    help="max new pages to create in one run")
    ap.add_argument("--from-file", default=os.environ.get("INSPIRE_JSON"),
                    help="read the INSPIRE API response from this file instead "
                         "of the network (same shape as the live API)")
    ap.add_argument("--no-stats", action="store_true",
                    help="leave inspire-stats.json alone")
    args = ap.parse_args()
    dry = args.dry_run

    try:
        records = fetch_records(args.from_file)
    except Exception as e:                                    # noqa: BLE001
        log("FATAL: could not reach INSPIRE-HEP:", e)
        return 1
    log(f"fetched {len(records)} records")

    # 1 ── stats -------------------------------------------------------------
    stats = compute_stats(records)
    if not dry and not args.no_stats:
        os.makedirs(os.path.dirname(STATS_PATH), exist_ok=True)
        with open(STATS_PATH, "w", encoding="utf-8", newline="\n") as f:
            json.dump(stats, f, indent=2)
            f.write("\n")
    log("stats:", stats["papers"], "papers,", stats["citations"], "citations, h =", stats["hindex"])

    # 2 ── index existing pages ---------------------------------------------
    pages = load_existing()
    by_key = {}
    for p in pages:
        if p["is_or"]:
            continue
        for key, val in (("inspire", fm_get(p["front"], "inspire")),
                         ("arxiv", fm_get(p["front"], "arxiv")),
                         ("title", norm_title(fm_get(p["front"], "title") or ""))):
            if val:
                by_key.setdefault((key, val), p)

    updated, created = 0, 0
    news_queue = []

    for rec in records:
        page = match_record(rec, by_key)

        # 3 ── refresh metadata on a page we already have --------------------
        if page:
            for variant in (page["path"], page["path"][:-3] + ".or.md"):
                if not os.path.exists(variant):
                    continue
                pv = read_page(variant)
                if not pv:
                    continue
                front = pv["front"]
                before = front
                front = fm_set(front, "inspire", rec["control_number"])
                front = fm_set(front, "citations", rec["citations"], quoted=False)
                if rec["doi"]:
                    front = fm_set(front, "doi", rec["doi"])
                if rec["arxiv"]:
                    front = fm_set(front, "arxiv", rec["arxiv"])
                if rec["journal"] and "e-Print" in (fm_get(front, "service") or ""):
                    front = fm_set(front, "service", rec["reference"])
                thumb_rel = fm_get(front, "thumbnail")
                thumb_missing = (not thumb_rel) or thumb_rel.endswith("-cover.svg") or (
                    not os.path.exists(os.path.join(ROOT, "static", thumb_rel)))
                if thumb_missing and rec["arxiv"]:
                    new_thumb = render_first_page(rec["arxiv"], page["slug"], dry)
                    if new_thumb:
                        front = fm_set(front, "thumbnail", new_thumb)
                if front != before:
                    updated += 1
                    if not dry:
                        s, e = pv["span"]
                        open(variant, "w", encoding="utf-8", newline="\n").write(
                            pv["text"][:s] + front + pv["text"][e:])
            continue

        # 4 ── brand-new paper ----------------------------------------------
        if created >= args.limit_new:
            continue
        slug = slugify(rec["title"])
        if os.path.exists(os.path.join(PORTFOLIO_DIR, slug + ".md")):
            slug = f"{slug}-{rec['control_number']}"

        thumb = render_first_page(rec["arxiv"], slug, dry) or make_cover(rec, slug, dry)
        log("NEW:", slug, "|", rec["reference"], "|", thumb or "no image")

        if not dry:
            os.makedirs(PORTFOLIO_DIR, exist_ok=True)
            open(os.path.join(PORTFOLIO_DIR, slug + ".md"), "w",
                 encoding="utf-8", newline="\n").write(render_page(rec, slug, thumb, "en"))
            open(os.path.join(PORTFOLIO_DIR, slug + ".or.md"), "w",
                 encoding="utf-8", newline="\n").write(render_page(rec, slug, thumb, "or"))

        if is_newsworthy(rec):
            news_queue.append((rec, thumb))
        created += 1

    # Prepend oldest first so the most recent paper ends up at the very top.
    announced = 0
    for rec, thumb in reversed(news_queue):
        if prepend_news(NEWS_EN, rec, thumb, "en", dry):
            announced += 1
        prepend_news(NEWS_OR, rec, thumb, "or", dry)

    log(f"done — {created} new page(s), {announced} announcement(s), {updated} metadata update(s){' [dry run]' if dry else ''}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

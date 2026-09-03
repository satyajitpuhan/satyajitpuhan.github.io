# satyajitpuhan.github.io

The personal and academic website of **Satyajit Puhan** — postdoctoral
researcher in theoretical hadron physics at the Institute of Physics,
Academia Sinica, Taipei.

Built with [Zola](https://www.getzola.org/) (static site generator), deployed
to GitHub Pages, and kept up to date automatically from INSPIRE-HEP.

---

## Everyday use

**You normally do not have to do anything.** Every day at 03:15 UTC — and on
every deploy — a GitHub Action asks INSPIRE-HEP what is on your author record
and, for anything new:

* creates the publication page (English + Odia) under `content/portfolio/`,
* renders the **first page of the arXiv PDF** into
  `static/images/portfolio/papers/` and uses it as the card image,
* adds a "New preprint / New publication" entry at the top of
  **Latest news & talks** (`static/sections/news/{en,or}.toml`),
* refreshes citation counts, DOIs and journal references on papers that were
  already there,
* rewrites `static/data/inspire-stats.json`, which drives the paper /
  citation / h-index counters,

then commits, rebuilds and redeploys the site.

To run it on demand: **Actions → "Build, sync and deploy" → Run workflow.**

If a paper has no arXiv entry (conference proceedings, for example), the
script generates a clean typographic cover instead, and replaces it with the
real first page later if an arXiv version appears.

The sync never touches the body of a page you wrote by hand — it only fills in
metadata and adds pages that do not exist yet.

## Local development

```bash
# Zola 0.22 — note the config file is zola.toml, not config.toml
zola --config zola.toml serve      # http://127.0.0.1:1111
zola --config zola.toml build      # writes ./public
zola --config zola.toml check      # link + template check

# preview what the daily sync would do, without writing anything
python3 tools/sync_inspire.py --dry-run
```

`mise.toml` pins the Zola version if you use [mise](https://mise.jdx.dev/).

## Where things live

| Path | What it is |
|------|------------|
| `zola.toml` | site config, menus, socials, translations (EN + OR) |
| `content/portfolio/` | one page per publication (`.md` = English, `.or.md` = Odia) |
| `content/blog/` | talks, seminars and conference write-ups |
| `content/collaborators/` | co-author profiles |
| `static/sections/*/{en,or}.toml` | the editable text of each homepage section |
| `static/data/inspire-stats.json` | live paper / citation / h-index figures |
| `templates/sections/` | the homepage sections |
| `templates/partials/` | nav, footer, icons, search index, assistant |
| `static/css/site.css` | the entire design system — one hand-written file |
| `static/js/site.js` | all behaviour — theme, search, filters, lightbox, stats |
| `tools/sync_inspire.py` | the daily INSPIRE-HEP sync |
| `.github/workflows/site.yml` | build + sync + deploy |

There is **no CSS/JS build step**. Edit `static/css/site.css` or
`static/js/site.js` and the change is live on the next build.

## Editing content

* **Homepage text** — the TOML files under `static/sections/`. Each section
  has an `en.toml` and an `or.toml`.
* **A publication** — the matching file in `content/portfolio/`. Anything in
  `[extra]` (`thumbnail`, `service`, `client`, `short_description`,
  `challenge`, `solution`, `arxiv`, `doi`, `inspire`, `tags`, `categories`)
  feeds the card and the detail page.
* **A talk or news post** — add a file to `content/blog/`.
* **Menus, social links, contact details** — `zola.toml`.

## Accessibility and performance notes

* Dark and light themes both work with JavaScript disabled; an explicit choice
  is remembered and always wins over the OS preference.
* Every interactive control has a visible focus ring and an accessible name.
* `prefers-reduced-motion` disables all reveal, count-up and scroll animation.
* No framework, no jQuery, no Bootstrap — one stylesheet and one script.

## Licence

Code: MIT (see `LICENSE`). Text, images and research content: © Satyajit Puhan.

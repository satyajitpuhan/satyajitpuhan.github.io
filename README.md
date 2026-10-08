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
* rewrites `static/data/cited-by.json`, the **Recently cited by** list at the
  bottom of the Publications page (self-citations left out),

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
| `static/data/cited-by.json` | the newest papers by others citing your work ("Recently cited by" on the Publications page) |
| `templates/sections/` | the reusable sections (used by the homepage and the standalone pages) |
| `templates/pages/` | the standalone About / Research / CV / News pages |
| `templates/partials/` | nav, footer, icons, search index, assistant |
| `static/css/site.css` | the entire design system — one hand-written file |
| `static/js/site.js` | all behaviour — theme, search, filters, lightbox, stats |
| `tools/sync_inspire.py` | the daily INSPIRE-HEP sync |
| `.github/workflows/site.yml` | build + sync + deploy |

There is **no CSS/JS build step**. Edit `static/css/site.css` or
`static/js/site.js` and the change is live on the next build.

## Page structure

The homepage is deliberately short — a hero, then a handful of items per
section, each linking to the page that holds the rest:

| Homepage section | shows | links to |
|---|---|---|
| News | 3 newest | `/news/` |
| About | a short bio + 5 photos | `/about/` |
| Research | 4 areas, trimmed | `/research/` |
| Publications | 6 newest, as a list | `/portfolio/` |
| Resume | current post + 2 degrees | `/resume/` |
| Collaborators | 6 | `/collaborators/` |
| Talks | 3 newest | `/blog/` |

Every section partial takes a limit, so the same file renders the short version
on the homepage and the full version on its own page — there is no duplicated
markup to keep in sync.

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

## Things you can edit without touching templates (added 2026-09)

| File | What it controls |
|------|------------------|
| `static/sections/outlook/{en,or}.toml` | **Research outlook** roadmap (future plans). `featured = true` shows an item on the homepage; `difficulty` is 1–5. |
| `static/data/places.toml` | Pins on the **talks world map** (Talks page). Add a `[[place]]` with lat/lon after each new talk. |
| `static/data/visualizations.toml` | Cards on the **Visualizations** page. |
| `templates/social-service/list.html` (top) | Durga Seva counters — the strip appears once any number is above zero. |
| `static/images/hero/portrait.webp` | Homepage portrait. `static/images/og-card.jpg` is the preview shown when the site is shared. |

The daily INSPIRE sync now also stores **citations per year** and **papers per year** in
`static/data/inspire-stats.json`; the charts on the homepage and the Publications page read it.

## Site guard (tamper alerts)

`.github/workflows/site-guard.yml` runs `tools/site_guard.py` on every push and every 6 hours.
It opens a GitHub issue labelled `site-guard` — GitHub emails you about it — when

* someone changes the site's code (templates, JS, CSS, workflows, config),
* anything is pushed straight to `gh-pages` instead of through the deploy workflow,
* a live page loads scripts, frames or forms from an unexpected website, loses your name,
  or no longer matches what was deployed.

If an alert is you, just close the issue. If it is not: change your GitHub password, check
Settings → Sessions / Security log, revoke unknown tokens and keys, and revert the commit.
Make sure GitHub notifications for this repository reach your email (Settings → Notifications).

## The companions

A companion lives behind the content on every page. Visitors choose one from the 🐉/🐼/🌸/🍌/💔
button in the top bar (Dragon, Kung fu panda, Wishes, Minion mayhem, Journey, or Off); the choice is remembered.

* **Dragon** (`static/js/dragon.js`): an Eastern dragon that swims across the page, sometimes
  circles the mouse, and now and then opens its jaws.
* **Kung fu panda** (`static/js/panda.js`): a panda with a wooden staff, his master (a red panda),
  a hill with a blossoming peach tree, and a valley of misty mountains with a palace on one peak
  (moonlit, with lit lanterns, in the dark theme). The panda first peeks in from the side of the
  screen to check that nobody is watching. If the mouse moves or the page scrolls while he is
  looking, he ducks back out and tries again. Then he tiptoes in and goes about his day:
  he wanders with his staff, practises a staff form that ends in a burst of golden chi, knocks
  a peach out of the tree (it lands on his head) and eats it, trains with his master, duels him
  with chopsticks for a dumpling, and naps under the tree.

* **Wishes** (`static/js/garden.js`): a cartoon princess in a flower garden on the rim of a
  red-rock canyon that opens out to the sea (with a waterfall and a rainbow in its spray), next to a little café called Wishes. The world is
  drawn to look real (grass, flowers with real petals, trees, a rose arch, furry rabbits, the
  café with its awning and tables); she is drawn as a cartoon, with a yellow rose
  by her ear. Her story: she picks a rose and smells it, a butterfly lands on her face, and she
  takes the rose to the bench and sits looking out over the canyon. She also has coffee at the
  café, twirls, and gazes at the view. In the dark theme it is dawn and the café is lit.

* **Minion mayhem** (`static/js/field.js`): a gang of minions picks a fight with me in a field
  (a cartoon me: curly hair, beard, grey T-shirt, jeans). They burst out of the haystack, chase
  me round the field, clamp onto my leg and my arm (I hop about and fling them off), pile on
  and knock me flat (I burst out and they go flying), and dive on a banana in a dust-cloud brawl.
  Stunned minions see stars. The field is drawn real: grass, wildflowers, an oak, haystacks, a
  fence and rolling hills; in the dark theme it is evening, with fireflies.

* **Journey** (`static/js/journey.js`): a 2D cartoon of a broken man (a cartoon me). Four chapters
  of 16 s each. The first three happen on a stormy night drawn in code (storm clouds over a city
  skyline, street lamps, heavy rain with splashes, lightning): a crowd of shadows points and laughs
  at him and a rain cloud gathers over his head; he brings a rose to the girl he loves; she tells
  him "Who told you to help me?", "Be professional with me, not personal." and "You don't follow
  any ethics." (`HER_WORDS`) and walks away without looking back, and lightning strikes as his heart
  cracks in two; he sits alone under a street lamp in the storm until a stray puppy comes and sits
  with him. The last chapter is my own video of the sun rising over a field
  (`static/media/journey/dawn.webm`, with a `.webp` still shown until it loads): to the chant
  "Rise… rise… RISE!" he crouches and leaps for the light, the sun blazes, a swarm of bats bursts
  up out of the dark (a nod to *The Dark Knight Rises*), and he lands standing tall, his heart
  stitched back together, and walks on with the puppy. Captions are in English or Odia.
  The timings are at the top of the file (`CH`, `STRIKES`, `CAPTIONS`, `CROWD`, `HER_WORDS`),
  and each chapter is a function (`chapter1` … `chapter4`).
  In the light theme the night is drawn paler, so the page text stays readable.

The four 3D ones are built entirely in code (no model or image files); shared building blocks live in
`static/js/kit.js`. The only library is three.js,
self-hosted in `static/js/vendor/` (MIT licence alongside it), so the Site guard sees no outside
scripts.

* They never load before the page has finished loading. They stay off by default for visitors
  who ask for reduced motion or data saving, or whose computer has no graphics chip. If a device
  can't keep one smooth, it switches itself off.
* Each one carries on from where it was when you move to another page.
* To tune the dragon (size, speed, colours), the constants are at the top of `start()` in
  `dragon.js` (`LEN` is its length, `speed` in `step()` how fast it swims). For the panda,
  the poses are the table `P` in `panda.js`, and each behaviour is a short script further down
  (`kata`, `peachSnack`, `train`, `dumplingDuel`, `nap`). `ACTS` sets how often each one happens.


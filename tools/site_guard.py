#!/usr/bin/env python3
"""Site guard — tells the owner (by opening a GitHub issue, which GitHub emails) when the
website may have been tampered with.

Checks
  push     : a push that changes the site's code (templates, JS, CSS, workflows, config),
             and any push to the published gh-pages branch that did not come from the deploy
             workflow (the deploy pushes with GITHUB_TOKEN, which never triggers this job).
  schedule : the live pages load scripts, iframes or forms only from allowed places, still
             carry the owner's name, and the homepage matches what gh-pages says was deployed.

Nothing here touches visitors: it only reads the public site and the repository.
Run locally with:  python3 tools/site_guard.py --dry-run
"""
import hashlib, json, os, re, subprocess, sys, time, urllib.request

SITE = "https://satyajitpuhan.github.io/"
PAGES = ["", "portfolio/", "blog/", "resume/", "contact/", "or/"]
# hosts a page may load scripts / frames / form posts from (besides the site itself)
ALLOWED_HOSTS = {"satyajitpuhan.github.io", "formsubmit.co", "cdn.jsdelivr.net"}  # contact form, KaTeX
MUST_CONTAIN = "Satyajit Puhan"
SENSITIVE = re.compile(r"^(templates/|static/js/|static/css/|\.github/|zola\.toml|tools/site_guard\.py)")
TRUSTED_BOTS = {"github-actions[bot]", "inspire-sync[bot]"}
DRY = "--dry-run" in sys.argv


def gh_api(method, path, body=None):
    token = os.environ.get("GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPOSITORY")
    if not token or not repo:
        raise RuntimeError("GITHUB_TOKEN / GITHUB_REPOSITORY not set")
    req = urllib.request.Request(f"https://api.github.com/repos/{repo}{path}", method=method,
                                 data=json.dumps(body).encode() if body else None,
                                 headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
                                          "User-Agent": "site-guard"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read() or b"null")


def alert(title, body):
    title = "⚠️ Site guard: " + title
    print("ALERT:", title, "\n", body)
    if DRY:
        return
    open_issues = gh_api("GET", "/issues?state=open&labels=site-guard&per_page=50") or []
    if any(i["title"] == title for i in open_issues):
        print("an open issue with this title already exists — not duplicating")
        return
    gh_api("POST", "/issues", {"title": title, "labels": ["site-guard"], "body": body + (
        "\n\n---\nIf this was you, close the issue. If it was not: change your GitHub password, "
        "check Settings → Sessions and Settings → Security log, revoke unknown tokens and SSH keys, "
        "and revert the commit. (Opened automatically by `tools/site_guard.py`.)")})


def fetch(url):
    req = urllib.request.Request(url + ("&" if "?" in url else "?") + f"guard={int(time.time())}",
                                 headers={"User-Agent": "site-guard", "Cache-Control": "no-cache"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def host_of(u):
    m = re.match(r"^(?:https?:)?//([^/:?#]+)", u.strip())
    return m.group(1).lower() if m else None   # None → relative URL (same site)


def check_push():
    ev = json.load(open(os.environ["GITHUB_EVENT_PATH"]))
    actor = os.environ.get("GITHUB_ACTOR", "?")
    ref = os.environ.get("GITHUB_REF", "")
    commits = ev.get("commits") or []
    files = sorted({f for c in commits for k in ("added", "modified", "removed") for f in c.get(k, [])})
    lines = "\n".join(f"- `{c['id'][:7]}` {c['message'].splitlines()[0][:100]} — {c['author'].get('name')} <{c['author'].get('email')}>"
                      for c in commits[:20])
    if ref == "refs/heads/gh-pages":
        alert(f"published site changed directly by {actor}",
              f"Someone pushed straight to the **gh-pages** branch (the live website) instead of going through the "
              f"deploy workflow.\n\nPusher: **{actor}**\n\nCommits:\n{lines}\n\nFiles:\n" + "\n".join(f"- {f}" for f in files[:60]))
        return
    touched = [f for f in files if SENSITIVE.match(f)]
    if touched and actor not in TRUSTED_BOTS:
        alert(f"site code changed by {actor} on {ref.split('/')[-1]}",
              f"Code that controls what every visitor runs was changed.\n\nPusher: **{actor}**\n\nCommits:\n{lines}\n\n"
              "Sensitive files:\n" + "\n".join(f"- {f}" for f in touched[:60]))
    else:
        print(f"push by {actor}: {len(files)} file(s), none sensitive — ok")


def check_live():
    problems = []
    for p in PAGES:
        url = SITE + p
        try:
            html = fetch(url)
        except Exception as e:                                   # noqa: BLE001
            problems.append(f"- {url} could not be loaded: {e}")
            continue
        if MUST_CONTAIN not in html:
            problems.append(f"- {url} no longer contains “{MUST_CONTAIN}” (page replaced?)")
        for tag, attr in (("script", "src"), ("iframe", "src"), ("form", "action"), ("embed", "src"), ("object", "data")):
            for m in re.finditer(rf"<{tag}\b[^>]*\b{attr}\s*=\s*[\"']?([^\"' >]+)", html, re.I):
                h = host_of(m.group(1))
                if h and h not in ALLOWED_HOSTS and not h.endswith(".satyajitpuhan.github.io"):
                    problems.append(f"- {url} loads a `<{tag}>` from **{h}** (`{m.group(1)[:120]}`)")
        if re.search(r"<script[^>]*>[^<]*(eval\(|atob\(|document\.write\(|fromCharCode)", html, re.I):
            problems.append(f"- {url} contains an inline script with obfuscation-style calls (eval/atob/document.write)")
    # homepage must match what the deploy put on gh-pages (allow the previous deploy while Pages catches up)
    try:
        subprocess.run(["git", "fetch", "-q", "--depth=3", "origin", "gh-pages"], check=True)
        live = hashlib.sha256(fetch(SITE).encode()).hexdigest()
        ok = False
        for rev in ("FETCH_HEAD", "FETCH_HEAD~1"):
            r = subprocess.run(["git", "show", f"{rev}:index.html"], capture_output=True)
            if r.returncode == 0 and hashlib.sha256(r.stdout.decode("utf-8", "replace").encode()).hexdigest() == live:
                ok = True
        if not ok:
            problems.append("- the live homepage does not match the last two deploys on gh-pages")
    except Exception as e:                                       # noqa: BLE001
        print("could not compare with gh-pages:", e)
    if problems:
        alert("the live website looks different from what was deployed", "\n".join(problems))
    else:
        print("live site ok:", ", ".join(SITE + p for p in PAGES))


if __name__ == "__main__":
    if os.environ.get("GITHUB_EVENT_NAME") == "push":
        check_push()
    else:
        check_live()

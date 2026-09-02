# Legacy one-off scripts

These were used to bootstrap the site's content. They are kept for reference
only and are **not** part of the build.

`build_portfolio.py` in particular is superseded by `tools/sync_inspire.py`:
the last run of the old script rewrote every publication's `thumbnail` from
`.webp` to `.png`, which broke all 34 thumbnails, and re-wrote the files with
CRLF endings. Do not run it again.

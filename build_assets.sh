#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Bundles + minifies the site's CSS and JS into single files.
# Run this after editing anything in static/css or static/js,
# then commit the generated static/css/site.min.css and
# static/js/site.min.js. Requires: node, npx.
#   ./build_assets.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"
BIN="${TOOLS_BIN:-/tmp/tools/node_modules/.bin}"

echo "› building CSS bundle"
# 1. Purge only the two framework sheets (Bootstrap + LineIcons) - ~300 KB of
#    mostly-unused rules. Our own CSS is left alone; see purgecss.config.js.
cat static/css/bootstrap.min.css static/main.css > /tmp/_purgeable.css
sed -i 's|url("fonts/|url("../fonts/|g; s|url(fonts/|url(../fonts/|g' /tmp/_purgeable.css
"$BIN/purgecss" --config purgecss.config.js

# 2. Concatenate purged framework CSS with the site's own stylesheets.
cat /tmp/_purged.css \
    static/css/site-core.css \
    static/css/chatbot.css \
    static/css/light-theme.css \
    static/css/polish.css > /tmp/_bundle.css

"$BIN/cleancss" -O2 -o static/css/site.min.css /tmp/_bundle.css

echo "› building JS bundle"
"$BIN/esbuild" \
  static/js/main.js \
  static/js/advanced-v2.js \
  static/js/advanced-effects.js \
  static/js/interactions.js \
  static/js/theme-engine.js \
  static/js/chatbot-knowledge.js \
  static/js/chatbot.js \
  --bundle=false --minify --outdir=/tmp/_js --log-level=warning
cat /tmp/_js/main.js /tmp/_js/advanced-v2.js /tmp/_js/advanced-effects.js \
    /tmp/_js/interactions.js /tmp/_js/theme-engine.js \
    /tmp/_js/chatbot-knowledge.js /tmp/_js/chatbot.js > static/js/site.min.js

echo
echo "  CSS  $(du -h static/css/site.min.css | cut -f1)"
echo "  JS   $(du -h static/js/site.min.js  | cut -f1)"

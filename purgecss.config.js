// Used by build_assets.sh.
// Only Bootstrap and the LineIcons sheet are purged - those two are 300 KB of
// mostly-unused framework CSS. The site's own stylesheets are left intact,
// because much of that markup is injected at runtime by JS (chatbot, loading
// screen, reveal states) and is not visible to a static analyser.
module.exports = {
  css: ['/tmp/_purgeable.css'],
  content: ['public/**/*.html', 'static/js/*.js', 'templates/**/*.html'],
  output: '/tmp/_purged.css',
  safelist: {
    standard: ['html', 'body', 'show', 'showing', 'hiding', 'fade', 'active',
               'disabled', 'collapse', 'collapsing', 'collapsed', 'open',
               'visible', 'invisible', 'scrolled', 'revealed', 'in-view'],
    deep: [/modal/, /carousel/, /navbar/, /nav-/, /btn/, /form-/, /lni/, /collapse/],
    greedy: [/data-bs-/, /aria-/],
  },
  fontFace: false,   // @font-face is referenced from .lni, keep it
  keyframes: false,  // animation names are set from inline styles + JS
  variables: false,  // CSS custom properties are used in inline style attrs
};

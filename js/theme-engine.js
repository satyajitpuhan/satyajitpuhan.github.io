/**
 * theme-engine.js
 * Quantum Phase Transition toggle for Light/Dark mode.
 *
 * Fixed here:
 *  - applyTheme() called .style on getElementById() results without a null check,
 *    so any page without the navbar button threw a TypeError that killed every
 *    script bundled after this one.
 *  - The theme used to be applied by this deferred script, which meant light-mode
 *    users watched the site paint dark and then snap to light. The initial theme
 *    is now set by a tiny inline script in <head> (see base.html); this file only
 *    reads that decision and handles the toggle.
 *  - currentTheme was seeded from localStorage independently of the head script,
 *    so the two could disagree and the first click would be a no-op.
 */
(function () {
  'use strict';

  var root = document.documentElement;

  function readTheme() {
    if (window.__aeInitialTheme) return window.__aeInitialTheme;
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  var currentTheme = readTheme();

  var switchTimer = null;
  function markSwitching() {
    // Colour-transition CSS is scoped to this class so it costs nothing once the
    // swap has finished (it used to apply to every element, permanently).
    root.classList.add('ae-theme-switching');
    clearTimeout(switchTimer);
    switchTimer = setTimeout(function () { root.classList.remove('ae-theme-switching'); }, 450);
  }

  function applyTheme(theme) {
    var iconDark = document.getElementById('theme-icon-dark');
    var iconLight = document.getElementById('theme-icon-light');

    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }

    // Null-guarded: these only exist where the navbar toggle is rendered.
    if (iconDark) iconDark.style.display = theme === 'light' ? 'none' : 'block';
    if (iconLight) iconLight.style.display = theme === 'light' ? 'block' : 'none';

    var btn = document.getElementById('quantum-theme-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }

    try { localStorage.setItem('ae-theme', theme); } catch (e) { /* storage disabled */ }
    window.__aeInitialTheme = theme;
    window.dispatchEvent(new CustomEvent('ae:themechange', { detail: { theme: theme } }));
  }

  function toggleTheme(e) {
    var nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    markSwitching();

    var x = (e && typeof e.clientX === 'number' && e.clientX) || window.innerWidth / 2;
    var y = (e && typeof e.clientY === 'number' && e.clientY) || window.innerHeight / 2;
    var endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    var canAnimate = document.startViewTransition && !window.__aeReducedMotion;

    if (!canAnimate) {
      currentTheme = nextTheme;
      applyTheme(currentTheme);
      return;
    }

    var transition = document.startViewTransition(function () {
      currentTheme = nextTheme;
      applyTheme(currentTheme);
    });

    transition.ready.then(function () {
      root.animate(
        [
          { clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)' },
          { clipPath: 'circle(' + endRadius + 'px at ' + x + 'px ' + y + 'px)' }
        ],
        { duration: 500, easing: 'ease-out', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () { /* transition cancelled — theme already applied */ });
  }

  function init() {
    // Sync icons/aria with whatever the head script already decided.
    applyTheme(currentTheme);

    var toggleBtn = document.getElementById('quantum-theme-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);

    // Follow the OS only while the visitor has never made an explicit choice.
    var hasChoice = false;
    try { hasChoice = !!localStorage.getItem('ae-theme'); } catch (e) {}
    if (!hasChoice && window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: light)');
      var onChange = function (ev) {
        currentTheme = ev.matches ? 'light' : 'dark';
        applyTheme(currentTheme);
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

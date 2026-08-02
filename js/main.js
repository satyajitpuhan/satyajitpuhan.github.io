// main.js — Satyajit Puhan Portfolio
//
// Kept deliberately tiny. Two things used to live here that no longer do:
//
//  * animateProgress() — a setInterval-based progress-bar animation. Two OTHER
//    files (advanced-v2.js and advanced-effects.js) also animated the very same
//    `progress[data-max]` elements, so three timers fought over `value` and the
//    bars stuttered or settled on the wrong number. advanced-v2.js is now the
//    single owner of that animation.
//  * a raw `scroll` listener — everything now rides the shared scroll bus that
//    base.html installs (window.aeOnScroll), so the page reads layout once per
//    frame instead of once per handler per event.

(function () {
  'use strict';

  var navbar = document.querySelector('nav');
  if (!navbar) return;

  function apply(y) {
    navbar.classList.toggle('nav__color__change', y > 200);
  }

  if (window.aeOnScroll) {
    window.aeOnScroll(apply);
  } else {
    // Defensive fallback in case base.html's bus ever fails to install.
    window.addEventListener('scroll', function () { apply(window.scrollY); }, { passive: true });
    apply(window.scrollY);
  }
})();

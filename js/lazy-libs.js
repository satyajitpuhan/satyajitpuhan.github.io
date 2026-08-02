/**
 * lazy-libs.js
 * Heavy third-party libraries (three.js ~600 KB, globe.gl ~500 KB, Chart.js ~200 KB)
 * used to download on every homepage visit even though both widgets sit far below
 * the fold. This loads each one only when its container is about to enter view.
 */
(function () {
  'use strict';

  var cache = {};

  /** Load a script once; returns a Promise that resolves when it is ready. */
  function loadScriptOnce(src) {
    if (cache[src]) return cache[src];
    cache[src] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
    return cache[src];
  }

  /** Load scripts strictly in order (globe.gl depends on THREE being present). */
  function loadSequential(srcs) {
    return srcs.reduce(function (chain, src) {
      return chain.then(function () { return loadScriptOnce(src); });
    }, Promise.resolve());
  }

  /** Run `fn` the first time `el` gets within 300px of the viewport. */
  function whenNearViewport(el, fn) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { obs.disconnect(); fn(); }
    }, { rootMargin: '300px 0px' });
    obs.observe(el);
  }

  window.loadScriptOnce = loadScriptOnce;
  window.whenNearViewport = whenNearViewport;

  function init() {
    var base = document.documentElement.getAttribute('data-site-base') || '/';

    // ── 3D collaboration globe ──
    whenNearViewport(document.getElementById('globe-container'), function () {
      loadSequential([
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
        'https://unpkg.com/globe.gl',
        base + 'js/globe-collab.js'
      ]).catch(function (e) { console.warn('[lazy-libs] globe unavailable:', e.message); });
    });

    // ── Publication timeline chart ──
    // The inline chart code awaits window.chartJsReady before calling `new Chart`.
    var canvas = document.getElementById('pubTimelineChart');
    if (canvas) {
      window.chartJsReady = new Promise(function (resolve, reject) {
        whenNearViewport(canvas, function () {
          loadScriptOnce('https://cdn.jsdelivr.net/npm/chart.js').then(resolve, reject);
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

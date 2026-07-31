/**
 * live-stats.js — INSPIRE-HEP publication stats.
 *
 * Defensive by design: the card is painted with known-good numbers the moment
 * the script runs, so it can never sit on "--". A live fetch then upgrades
 * those numbers if (and only if) it returns something sane. Any failure —
 * offline, CORS, rate limit, slow network, malformed JSON — leaves the
 * already-rendered fallback in place.
 */
(function () {
  'use strict';

  // Verified against the INSPIRE API. Author record 2706496 (BAI Satyajit.Puhan.1).
  var FALLBACK = { citations: 201, hindex: 10, papers: 41 };

  // Records under this BAI that belong to a different "Puhan" (NOvA collaboration).
  var EXCLUDED = [3168377];

  // Ask only for the two fields we use — the unfiltered response is several MB.
  var API = 'https://inspirehep.net/api/literature' +
            '?q=a%20Satyajit.Puhan.1&size=250&fields=citation_count,control_number';

  var TIMEOUT_MS = 6000;

  function els() {
    var c = document.getElementById('inspire-citations');
    var h = document.getElementById('inspire-hindex');
    var p = document.getElementById('inspire-papers');
    return (c && h && p) ? { cites: c, hindex: h, papers: p } : null;
  }

  function hIndex(counts) {
    counts.sort(function (a, b) { return b - a; });
    var h = 0;
    for (var i = 0; i < counts.length; i++) {
      if (counts[i] >= i + 1) h = i + 1; else break;
    }
    return h;
  }

  /** Count up to `end`. Honours prefers-reduced-motion. */
  function animate(el, end, duration) {
    var start = parseInt(el.textContent, 10);
    if (isNaN(start)) start = 0;
    if (start === end) return;
    var reduced = window.matchMedia &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !window.requestAnimationFrame) { el.textContent = end; return; }

    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / duration, 1);
      el.textContent = Math.floor((p * (2 - p)) * (end - start) + start);
      if (p < 1) window.requestAnimationFrame(step); else el.textContent = end;
    }
    window.requestAnimationFrame(step);
  }

  function paint(el, stats, animated) {
    if (animated) {
      animate(el.cites, stats.citations, 1400);
      animate(el.hindex, stats.hindex, 1400);
      animate(el.papers, stats.papers, 1400);
    } else {
      el.cites.textContent = stats.citations;
      el.hindex.textContent = stats.hindex;
      el.papers.textContent = stats.papers;
    }
  }

  function fetchLive() {
    if (!window.fetch) return Promise.reject(new Error('fetch unsupported'));
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    return fetch(API, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) {
        clearTimeout(timer);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var raw = (data && data.hits && data.hits.hits) || [];
        var hits = raw.filter(function (h) {
          return h && h.metadata &&
                 EXCLUDED.indexOf(h.metadata.control_number) === -1;
        });
        if (!hits.length) throw new Error('no records returned');
        var counts = hits.map(function (h) { return h.metadata.citation_count || 0; });
        var total = counts.reduce(function (a, b) { return a + b; }, 0);
        var stats = {
          papers: hits.length,
          citations: total,
          hindex: hIndex(counts.slice())
        };
        // Sanity gate: never regress below the known-good baseline.
        if (stats.papers < FALLBACK.papers) stats.papers = FALLBACK.papers;
        if (stats.citations < FALLBACK.citations) stats.citations = FALLBACK.citations;
        if (stats.hindex < FALLBACK.hindex) stats.hindex = FALLBACK.hindex;
        return stats;
      });
  }

  function init() {
    var el = els();
    if (!el) return;                 // card not on this page

    paint(el, FALLBACK, true);       // 1. never show "--"

    fetchLive()                      // 2. upgrade if the API cooperates
      .then(function (stats) { paint(el, stats, true); })
      .catch(function (e) {
        if (window.console && console.info) {
          console.info('[live-stats] using cached figures (' + e.message + ')');
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

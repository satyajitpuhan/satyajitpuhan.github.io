/**
 * command-palette.js — site-wide search + quick navigation.
 *
 * Opens with ⌘K / Ctrl-K, "/" or the search button in the navbar. Searches the
 * JSON index emitted by templates/partials/search-index.html (publications,
 * talks, collaborators) plus a fixed list of jump targets.
 *
 * Zero dependencies. Fully keyboard driven, focus-trapped, and it restores
 * focus to whatever opened it — the site previously had no search at all, and
 * 35 publications spread across a paginated carousel were essentially
 * unfindable.
 */
(function () {
  'use strict';

  var KIND_META = {
    publication:  { label: 'Publication',  icon: '📄', color: '#8b5cf6' },
    talk:         { label: 'Talk',         icon: '🎤', color: '#06b6d4' },
    collaborator: { label: 'Collaborator', icon: '👤', color: '#10b981' },
    section:      { label: 'Jump to',      icon: '⟶',  color: '#e8a444' },
    action:       { label: 'Action',       icon: '⚡', color: '#f43f5e' }
  };

  var records = [];
  var overlay, input, list, empty, counter;
  var results = [];
  var cursor = 0;
  var open = false;
  var lastFocused = null;

  /* ── Index ───────────────────────────────────────────────── */

  function baseUrl() {
    return document.documentElement.getAttribute('data-site-base') || '/';
  }

  function loadIndex() {
    var node = document.getElementById('ae-search-index');
    if (node) {
      try {
        JSON.parse(node.textContent).forEach(function (r) {
          records.push({
            title: r.t, url: r.u, kind: r.k,
            meta: r.m || '', desc: r.d || '',
            year: r.y || 0, tags: r.g || []
          });
        });
      } catch (e) {
        if (window.console) console.warn('[palette] search index unreadable:', e.message);
      }
    }

    // Homepage anchors + standalone pages, always available.
    var b = baseUrl();
    [
      ['About',           b + '#about'],
      ['Research areas',  b + '#service'],
      ['Publications',    b + '#portfolio'],
      ['Resume',          b + '#resume'],
      ['Skills',          b + '#skill'],
      ['Collaborators',   b + '#collaborators'],
      ['Research network', b + '#research-network'],
      ['Talks & news',    b + '#blog'],
      ['Conferences',     b + '#conferences'],
      ['Contact',         b + '#contact'],
      ['Visualizations',  b + 'visualizations/'],
      ['Durga Seva',      b + 'social-service/']
    ].forEach(function (pair) {
      records.push({ title: pair[0], url: pair[1], kind: 'section', meta: '', desc: '', year: 0, tags: [] });
    });

    records.push({
      title: 'Toggle light / dark theme', url: '#', kind: 'action',
      meta: 'Switches the colour scheme', desc: '', year: 0, tags: [],
      run: function () {
        var btn = document.getElementById('quantum-theme-toggle');
        if (btn) btn.click();
      }
    });
    records.push({
      title: 'Copy link to this page', url: '#', kind: 'action',
      meta: location.href, desc: '', year: 0, tags: [],
      run: function () {
        if (navigator.clipboard) navigator.clipboard.writeText(location.href);
      }
    });
  }

  /* ── Scoring ─────────────────────────────────────────────────
     Subsequence match with a bonus for contiguous runs and for hits
     at word boundaries, so "pkff" finds "Pion & Kaon Form Factors".
  ───────────────────────────────────────────────────────────── */

  function score(needle, haystack) {
    if (!needle) return 0;
    var h = haystack.toLowerCase();
    var idx = h.indexOf(needle);
    if (idx === 0) return 1000;                 // prefix match
    if (idx > 0) return 700 - Math.min(idx, 60); // substring match

    var hi = 0, streak = 0, total = 0;
    for (var ni = 0; ni < needle.length; ni++) {
      var found = h.indexOf(needle[ni], hi);
      if (found === -1) return -1;              // not a subsequence at all
      streak = found === hi ? streak + 1 : 0;
      total += 10 + streak * 6;
      if (found === 0 || /[\s\-–—:,.()/]/.test(h[found - 1])) total += 14; // word start
      hi = found + 1;
    }
    return total;
  }

  function search(query) {
    var q = query.trim().toLowerCase();

    if (!q) {
      // Empty query: jump targets first, then the newest publications and talks.
      var sections = records.filter(function (r) { return r.kind === 'section' || r.kind === 'action'; });
      var recent = records
        .filter(function (r) { return r.kind === 'publication' || r.kind === 'talk'; })
        .sort(function (a, b) { return b.year - a.year; })
        .slice(0, 8);
      return sections.concat(recent);
    }

    return records
      .map(function (r) {
        var best = score(q, r.title) * 3;
        var m = score(q, r.meta);
        var d = score(q, r.desc);
        var t = r.tags.length ? score(q, r.tags.join(' ')) : -1;
        if (m > 0) best = Math.max(best, m);
        if (d > 0) best = Math.max(best, d * 0.6);
        if (t > 0) best = Math.max(best, t * 1.2);
        // Break ties towards recent work.
        if (best > 0 && r.year) best += Math.min(r.year - 2018, 8);
        return { rec: r, s: best };
      })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 40)
      .map(function (x) { return x.rec; });
  }

  /* ── UI ──────────────────────────────────────────────────── */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'ae-palette-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Search this site');
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="ae-palette">' +
        '<div class="ae-palette-inputrow">' +
          '<svg class="ae-palette-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
            '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
          '<input type="text" class="ae-palette-input" autocomplete="off" spellcheck="false" ' +
            'placeholder="Search publications, talks, collaborators…" ' +
            'aria-label="Search publications, talks and collaborators" ' +
            'role="combobox" aria-expanded="true" aria-controls="ae-palette-list" aria-autocomplete="list">' +
          '<kbd class="ae-palette-esc">Esc</kbd>' +
        '</div>' +
        '<ul class="ae-palette-list" id="ae-palette-list" role="listbox" aria-label="Search results"></ul>' +
        '<p class="ae-palette-empty" hidden>No matches. Try an author, a meson, or a year.</p>' +
        '<div class="ae-palette-foot">' +
          '<span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>' +
          '<span><kbd>↵</kbd> open</span>' +
          '<span class="ae-palette-count" aria-live="polite"></span>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    input = overlay.querySelector('.ae-palette-input');
    list = overlay.querySelector('.ae-palette-list');
    empty = overlay.querySelector('.ae-palette-empty');
    counter = overlay.querySelector('.ae-palette-count');

    overlay.addEventListener('mousedown', function (e) {
      if (e.target === overlay) close();
    });
    input.addEventListener('input', function () { render(search(input.value)); });
    input.addEventListener('keydown', onKeydown);
  }

  function render(items) {
    results = items;
    cursor = 0;
    list.innerHTML = items.map(function (r, i) {
      var meta = KIND_META[r.kind] || KIND_META.section;
      var sub = r.meta || r.desc || '';
      return '<li class="ae-palette-item' + (i === 0 ? ' is-active' : '') + '" role="option" ' +
             'id="ae-palette-opt-' + i + '" aria-selected="' + (i === 0) + '" data-i="' + i + '">' +
               '<span class="ae-palette-kind" style="--k:' + meta.color + '" aria-hidden="true">' + meta.icon + '</span>' +
               '<span class="ae-palette-text">' +
                 '<span class="ae-palette-title">' + esc(r.title) + '</span>' +
                 (sub ? '<span class="ae-palette-sub">' + esc(sub) + '</span>' : '') +
               '</span>' +
               '<span class="ae-palette-tag">' + meta.label + (r.year ? ' · ' + r.year : '') + '</span>' +
             '</li>';
    }).join('');

    empty.hidden = items.length > 0;
    counter.textContent = items.length ? items.length + ' result' + (items.length === 1 ? '' : 's') : '';
    if (items.length) input.setAttribute('aria-activedescendant', 'ae-palette-opt-0');
    else input.removeAttribute('aria-activedescendant');

    Array.prototype.forEach.call(list.children, function (li) {
      li.addEventListener('mouseenter', function () { move(+li.dataset.i, true); });
      li.addEventListener('click', function () { choose(+li.dataset.i); });
    });
  }

  function move(next, silent) {
    if (!results.length) return;
    var n = results.length;
    cursor = ((next % n) + n) % n;
    Array.prototype.forEach.call(list.children, function (li, i) {
      var on = i === cursor;
      li.classList.toggle('is-active', on);
      li.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) {
        input.setAttribute('aria-activedescendant', li.id);
        if (!silent && li.scrollIntoView) li.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function choose(i) {
    var r = results[i];
    if (!r) return;
    close();
    if (r.run) { r.run(); return; }
    window.location.href = r.url;
  }

  function onKeydown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(cursor + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(cursor - 1); }
    else if (e.key === 'Home') { e.preventDefault(); move(0); }
    else if (e.key === 'End') { e.preventDefault(); move(results.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(cursor); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') { e.preventDefault(); } // focus stays trapped in the dialog
  }

  function show() {
    if (open) return;
    open = true;
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
      input.value = '';
      render(search(''));
      input.focus();
    });
  }

  function close() {
    if (!open) return;
    open = false;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { overlay.hidden = true; }, 180);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /* ── Wiring ──────────────────────────────────────────────── */

  function isTypingTarget(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function init() {
    loadIndex();
    build();

    document.addEventListener('keydown', function (e) {
      var mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); open ? close() : show(); return; }
      // Bare "/" opens search, but not while the visitor is typing somewhere.
      if (e.key === '/' && !open && !isTypingTarget(e.target)) { e.preventDefault(); show(); }
    });

    document.querySelectorAll('[data-open-palette]').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.preventDefault(); show(); });
    });

    window.aeOpenPalette = show;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

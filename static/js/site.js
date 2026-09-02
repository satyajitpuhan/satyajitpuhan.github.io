/* =============================================================================
   site.js — all front-end behaviour for satyajitpuhan.github.io
   Vanilla, dependency-free, ~1 file. Loaded with `defer`.
   Every feature is independently guarded: a missing element never breaks
   the rest of the page.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var on = function (el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o); };

  /* ---- shared scroll bus: one listener, one rAF ------------------------- */
  var subs = [], ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    for (var i = 0; i < subs.length; i++) { try { subs[i](y); } catch (e) {} }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  function bus(fn) { subs.push(fn); fn(window.scrollY || 0); }

  /* ---- 1. theme -------------------------------------------------------- */
  (function theme() {
    var root = document.documentElement;
    function apply(t) {
      // Always stamp the attribute: `:root:not([data-theme="dark"])` inside the
      // prefers-color-scheme media query would otherwise override an explicit
      // "dark" choice made on a machine whose OS is set to light.
      root.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
      $$('[data-theme-toggle]').forEach(function (b) {
        b.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
        var s = b.querySelector('[data-theme-icon]');
        if (s) s.textContent = t === 'light' ? '🌙' : '☀️';
      });
    }
    var current = root.getAttribute('data-theme') === 'light' ? 'light'
                : root.getAttribute('data-theme') === 'dark' ? 'dark'
                : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    apply(current);
    $$('[data-theme-toggle]').forEach(function (b) {
      on(b, 'click', function () {
        current = current === 'light' ? 'dark' : 'light';
        apply(current);
        try { localStorage.setItem('sp-theme', current); } catch (e) {}
      });
    });
  })();

  /* ---- 2. nav: sticky, burger, scroll-spy ------------------------------ */
  (function nav() {
    var bar = $('.nav');
    if (bar) bus(function (y) { bar.classList.toggle('is-stuck', y > 24); });

    var burger = $('[data-nav-toggle]'), links = $('#nav-links');
    if (burger && links) {
      on(burger, 'click', function () {
        var open = links.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $$('a', links).forEach(function (a) {
        on(a, 'click', function () {
          links.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
        });
      });
      on(document, 'keydown', function (e) {
        if (e.key === 'Escape') { links.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
      });
    }

    var spy = $$('.nav__link[href*="#"]').filter(function (a) {
      var h = a.getAttribute('href') || '';
      return h.indexOf('#') > -1 && h.split('#')[1];
    });
    var targets = spy.map(function (a) { return document.getElementById(a.getAttribute('href').split('#')[1]); });
    if (targets.some(Boolean)) {
      bus(function (y) {
        var best = -1, bestTop = -Infinity, probe = y + (window.innerHeight * 0.28);
        targets.forEach(function (t, i) {
          if (!t) return;
          var top = t.offsetTop;
          if (top <= probe && top > bestTop) { bestTop = top; best = i; }
        });
        spy.forEach(function (a, i) { a.classList.toggle('is-active', i === best); });
      });
    }
  })();

  /* ---- 3. reading progress + to-top ------------------------------------ */
  (function progress() {
    var bar = $('#progress'), top = $('.to-top');
    bus(function (y) {
      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? Math.min(100, Math.max(0, y / h * 100)) : 0) + '%';
      }
      if (top) top.classList.toggle('is-on', y > 600);
    });
    on(top, 'click', function () { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });
  })();

  /* ---- 4. reveal on scroll --------------------------------------------- */
  (function reveal() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (i) { i.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (i) { io.observe(i); });
  })();

  /* ---- 5. count-up numbers + skill bars -------------------------------- */
  function countUp(el, end) {
    end = Number(end) || 0;
    if (reduced) { el.textContent = end; return; }
    var start = 0, t0 = null, dur = 1200;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = Math.floor((p * (2 - p)) * (end - start) + start);
      if (p < 1) requestAnimationFrame(step); else el.textContent = end;
    }
    requestAnimationFrame(step);
  }
  (function counters() {
    var nums = $$('[data-count]'), bars = $$('.skill__fill');
    var seen = new WeakSet();
    function run(el) {
      if (seen.has(el)) return; seen.add(el);
      if (el.hasAttribute('data-count')) countUp(el, el.getAttribute('data-count'));
      else el.style.width = (el.getAttribute('data-pct') || 0) + '%';
    }
    var all = nums.concat(bars);
    if (!all.length) return;
    if (!('IntersectionObserver' in window)) { all.forEach(run); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    all.forEach(function (e) { io.observe(e); });
  })();

  /* ---- 6. tabs (resume) ------------------------------------------------ */
  $$('[data-tabs]').forEach(function (group) {
    var tabs = $$('[role="tab"]', group);
    tabs.forEach(function (tab) {
      on(tab, 'click', function () {
        tabs.forEach(function (t) {
          var sel = t === tab;
          t.setAttribute('aria-selected', sel ? 'true' : 'false');
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !sel;
        });
      });
    });
  });

  /* ---- 7. publication filter + search ---------------------------------- */
  (function publications() {
    var list = $('#pub-list');
    if (!list) return;
    var cards = $$('[data-pub]', list);
    var input = $('#pub-search-input');
    var empty = $('#pub-empty');
    var countEl = $('#pub-count');
    var active = 'all';

    function apply() {
      var q = (input && input.value || '').trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var kind = c.getAttribute('data-kind') || '';
        var hay = (c.getAttribute('data-pub') || '').toLowerCase();
        var ok = (active === 'all' || kind === active) && (!q || hay.indexOf(q) > -1);
        c.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
      if (countEl) countEl.textContent = shown;
    }
    $$('[data-filter]').forEach(function (b) {
      on(b, 'click', function () {
        active = b.getAttribute('data-filter');
        $$('[data-filter]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        apply();
      });
    });
    on(input, 'input', apply);
    apply();
  })();

  /* ---- 8. gallery lightbox --------------------------------------------- */
  (function lightbox() {
    var items = $$('[data-lightbox]');
    if (!items.length) return;
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML =
      '<button class="lightbox__close" aria-label="Close">&times;</button>' +
      '<button class="lightbox__nav lightbox__nav--prev" aria-label="Previous">&#8249;</button>' +
      '<button class="lightbox__nav lightbox__nav--next" aria-label="Next">&#8250;</button>' +
      '<div><img alt=""><p class="lightbox__cap"></p></div>';
    document.body.appendChild(box);
    var img = $('img', box), cap = $('.lightbox__cap', box), idx = 0, opener = null;

    function show(i) {
      idx = (i + items.length) % items.length;
      var el = items[idx];
      img.src = el.getAttribute('data-lightbox');
      img.alt = el.getAttribute('data-caption') || '';
      cap.textContent = el.getAttribute('data-caption') || '';
    }
    function open(i, from) { opener = from; show(i); box.classList.add('is-open'); document.body.style.overflow = 'hidden'; $('.lightbox__close', box).focus(); }
    function close() { box.classList.remove('is-open'); document.body.style.overflow = ''; if (opener) opener.focus(); }

    items.forEach(function (el, i) {
      on(el, 'click', function (e) { e.preventDefault(); open(i, el); });
      on(el, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, el); } });
    });
    on($('.lightbox__close', box), 'click', close);
    on($('.lightbox__nav--prev', box), 'click', function () { show(idx - 1); });
    on($('.lightbox__nav--next', box), 'click', function () { show(idx + 1); });
    on(box, 'click', function (e) { if (e.target === box) close(); });
    on(document, 'keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  })();

  /* ---- 9. command palette (Ctrl/Cmd-K) --------------------------------- */
  (function palette() {
    var data = window.SITE_SEARCH_INDEX;
    var box = $('#palette');
    if (!box || !data || !data.length) return;
    var input = $('#palette-input'), results = $('#palette-results'), cursor = 0, view = [];

    function render(items) {
      view = items.slice(0, 12);
      cursor = 0;
      results.innerHTML = view.length
        ? view.map(function (r, i) {
            return '<a class="palette__item' + (i === 0 ? ' is-active' : '') + '" href="' + r.url + '">' +
                   '<b></b><span></span></a>';
          }).join('')
        : '<p class="palette__item dim">No matches.</p>';
      $$('.palette__item', results).forEach(function (node, i) {
        if (!view[i]) return;
        var b = node.querySelector('b'), s = node.querySelector('span');
        if (b) b.textContent = view[i].title;
        if (s) s.textContent = view[i].kind + (view[i].meta ? ' · ' + view[i].meta : '');
      });
    }
    function search(q) {
      q = q.trim().toLowerCase();
      if (!q) return render(data.slice(0, 12));
      var out = data.filter(function (r) { return (r.title + ' ' + (r.meta || '') + ' ' + (r.body || '')).toLowerCase().indexOf(q) > -1; });
      render(out);
    }
    function open() { box.classList.add('is-open'); input.value = ''; search(''); input.focus(); document.body.style.overflow = 'hidden'; }
    function close() { box.classList.remove('is-open'); document.body.style.overflow = ''; }

    $$('[data-palette-open]').forEach(function (b) { on(b, 'click', open); });
    on(box, 'click', function (e) { if (e.target === box) close(); });
    on(input, 'input', function () { search(input.value); });
    on(document, 'keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.classList.contains('is-open') ? close() : open(); return; }
      if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) { e.preventDefault(); open(); return; }
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      var nodes = $$('.palette__item', results);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        cursor = Math.max(0, Math.min(nodes.length - 1, cursor + (e.key === 'ArrowDown' ? 1 : -1)));
        nodes.forEach(function (n, i) { n.classList.toggle('is-active', i === cursor); });
        if (nodes[cursor]) nodes[cursor].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter' && nodes[cursor] && nodes[cursor].href) { window.location.href = nodes[cursor].href; }
    });
  })();

  /* ---- 10. INSPIRE live statistics ------------------------------------- */
  (function stats() {
    var slots = {
      papers:    $$('[data-stat="papers"]'),
      citations: $$('[data-stat="citations"]'),
      hindex:    $$('[data-stat="hindex"]')
    };
    if (!slots.papers.length && !slots.citations.length && !slots.hindex.length) return;

    var seed = window.INSPIRE_STATS || {};
    var note = $('#stats-note');

    function paint(s, live) {
      Object.keys(slots).forEach(function (k) {
        if (s[k] == null) return;
        slots[k].forEach(function (el) {
          el.setAttribute('data-count', s[k]);
          if (el.textContent.trim() !== '0' && el.textContent.trim() !== '') countUp(el, s[k]);
        });
      });
      if (note && live) note.textContent = 'Live from INSPIRE-HEP · updated just now';
    }
    paint(seed, false);

    if (!window.fetch) return;
    var url = 'https://inspirehep.net/api/literature?q=a%20Satyajit.Puhan.1&size=250&fields=citation_count,control_number';
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 7000);
    fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var excluded = (window.INSPIRE_EXCLUDE || []).map(Number);
        var hits = ((d.hits && d.hits.hits) || []).filter(function (h) {
          return h.metadata && excluded.indexOf(h.metadata.control_number) === -1;
        });
        if (!hits.length) throw new Error('empty');
        var counts = hits.map(function (h) { return h.metadata.citation_count || 0; }).sort(function (a, b) { return b - a; });
        var h = 0;
        for (var i = 0; i < counts.length; i++) { if (counts[i] >= i + 1) h = i + 1; else break; }
        var live = { papers: hits.length, citations: counts.reduce(function (a, b) { return a + b; }, 0), hindex: h };
        // never regress below the figures committed by the daily sync
        if (seed.papers    && live.papers    < seed.papers)    live.papers = seed.papers;
        if (seed.citations && live.citations < seed.citations) live.citations = seed.citations;
        if (seed.hindex    && live.hindex    < seed.hindex)    live.hindex = seed.hindex;
        paint(live, true);
      })
      .catch(function () { /* keep the synced figures */ });
  })();

  /* ---- 11. assistant --------------------------------------------------- */
  (function assistant() {
    var fab = $('#assistant-fab'), panel = $('#assistant');
    if (!fab || !panel) return;
    var log = $('#assistant-log'), form = $('#assistant-form'), input = $('#assistant-input');
    var kb = window.ASSISTANT_KB || { quick: [], entries: [] };
    var greeted = false;

    function bubble(html, who) {
      var d = document.createElement('div');
      d.className = 'bubble bubble--' + who;
      d.innerHTML = html;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    }
    function answer(q) {
      var s = q.toLowerCase(), best = null, score = 0;
      kb.entries.forEach(function (e) {
        var n = 0;
        e.k.forEach(function (kw) { if (s.indexOf(kw) > -1) n += kw.length; });
        if (n > score) { score = n; best = e; }
      });
      return best ? best.a : "I don't have that one yet — try <b>publications</b>, <b>research</b>, <b>education</b>, <b>contact</b>, or press <kbd>Ctrl</kbd>+<kbd>K</kbd> to search the whole site.";
    }
    function ask(q) {
      bubble(q.replace(/[<>]/g, ''), 'me');
      setTimeout(function () { bubble(answer(q), 'bot'); }, 220);
    }
    function open() {
      panel.classList.add('is-open');
      if (!greeted) {
        greeted = true;
        bubble(kb.greeting || 'Hi! Ask me anything about Satyajit’s research.', 'bot');
      }
      if (input) input.focus();
    }
    on(fab, 'click', function () { panel.classList.contains('is-open') ? panel.classList.remove('is-open') : open(); });
    on($('#assistant-close'), 'click', function () { panel.classList.remove('is-open'); });
    on(form, 'submit', function (e) {
      e.preventDefault();
      var v = (input.value || '').trim();
      if (!v) return;
      input.value = '';
      ask(v);
    });
    $$('#assistant-quick button').forEach(function (b) {
      on(b, 'click', function () { ask(b.getAttribute('data-q') || b.textContent); });
    });
    on(document, 'keydown', function (e) { if (e.key === 'Escape') panel.classList.remove('is-open'); });
  })();

  /* ---- 12. external links get rel + target ----------------------------- */
  $$('a[href^="http"]').forEach(function (a) {
    if (a.hostname && a.hostname !== window.location.hostname) {
      a.setAttribute('rel', 'noopener noreferrer');
      if (!a.hasAttribute('target')) a.setAttribute('target', '_blank');
    }
  });
})();

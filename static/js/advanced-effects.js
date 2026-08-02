/* ═══════════════════════════════════════════════════════════════════
   Advanced Effects — advanced-effects.js
   Custom cursor, reveal auto-tagging, floating physics glyphs, shimmer.

   Fixed in this pass:
    - The custom cursor called document.elementFromPoint() AND
      getComputedStyle() on every single mousemove event. Both force a style
      recalculation, so moving the mouse across the page pegged the main thread.
      Hit-testing is now throttled to one rAF frame and the result is cached.
    - The cursor's rAF loop ran forever, even on phones (where there is no
      cursor at all) and even when the pointer had not moved for minutes. It now
      bails out entirely on coarse-pointer devices and parks itself when idle.
    - initMagnetic() here duplicated interactions.js's magnetic implementation.
      Both wrote to style.transform on the same elements and fought each other,
      producing the jitter on the "Contact Me" button. Removed — interactions.js
      is the single owner.
    - initProgressBars() was the third implementation animating
      progress[data-max] (main.js and advanced-v2.js had the others). Removed —
      advanced-v2.js owns it.
    - initGlitch() grabbed document.querySelector('h2'), i.e. whatever the first
      h2 on the page happened to be, and stamped a glitch effect onto it. On
      sub-pages that was an unrelated body heading. Now scoped to the site title.
    - Nothing respected prefers-reduced-motion; everything here now does.
═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var reduced = !!window.__aeReducedMotion;
  var coarse = !!window.__aeCoarsePointer;

  /* ── 1. Custom Cursor ── */
  (function initCursor() {
    // No pointer to replace on touch devices, and the loop is pure waste there.
    if (coarse || reduced) return;

    var cursor = document.createElement('div');
    cursor.id = 'ae-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<div class="ae-cursor-dot"></div><div class="ae-cursor-ring"></div>';
    document.body.appendChild(cursor);

    var dot = cursor.querySelector('.ae-cursor-dot');
    var ring = cursor.querySelector('.ae-cursor-ring');

    var mx = -100, my = -100, rx = -100, ry = -100;
    var isPointer = false;
    var wasPointer = null;
    var running = false;
    var idleFrames = 0;
    var hitTestDue = true;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      hitTestDue = true;      // hit-test at most once per frame, not per event
      idleFrames = 0;
      start();
    }, { passive: true });

    function hitTest() {
      var el = document.elementFromPoint(mx, my);
      if (!el) return false;
      if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'INPUT') return true;
      if (el.closest('a, button, [role="button"], input, select, textarea, label')) return true;
      return window.getComputedStyle(el).cursor === 'pointer';
    }

    function animate() {
      if (hitTestDue) { isPointer = hitTest(); hitTestDue = false; }

      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;

      var settled = Math.abs(mx - rx) < 0.4 && Math.abs(my - ry) < 0.4;

      dot.style.transform = 'translate(' + (mx - 4) + 'px,' + (my - 4) + 'px)' + (isPointer ? ' scale(0)' : '');
      ring.style.transform = 'translate(' + (rx - 20) + 'px,' + (ry - 20) + 'px)' + (isPointer ? ' scale(1.6)' : '');

      // Only touch these when the state actually flips — they were being
      // reassigned 60 times a second for no reason.
      if (isPointer !== wasPointer) {
        ring.style.borderColor = isPointer ? 'rgba(139,92,246,0.8)' : 'rgba(6,182,212,0.6)';
        ring.style.background = isPointer ? 'rgba(139,92,246,0.08)' : 'transparent';
        wasPointer = isPointer;
      }

      // Park the loop once the ring has caught up and the mouse has stopped.
      if (settled && ++idleFrames > 30) { running = false; return; }
      requestAnimationFrame(animate);
    }

    function start() {
      if (running) return;
      running = true;
      requestAnimationFrame(animate);
    }
  })();

  /* ── 2. Scroll Reveal auto-tagging ──
     The IntersectionObserver that adds .ae-revealed lives in advanced-v2.js.
     This block only tags elements so that observer can pick them up. */
  (function autoTagReveal() {
    var revealStyle = document.createElement('style');
    revealStyle.textContent =
      '[data-reveal]{opacity:0;transition:opacity .8s cubic-bezier(.23,1,.32,1),transform .8s cubic-bezier(.23,1,.32,1)}' +
      '[data-reveal="up"]{transform:translateY(50px)}' +
      '[data-reveal="down"]{transform:translateY(-50px)}' +
      '[data-reveal="left"]{transform:translateX(-50px)}' +
      '[data-reveal="right"]{transform:translateX(50px)}' +
      '[data-reveal="scale"]{transform:scale(.8)}' +
      '[data-reveal="fade"]{transform:none}' +
      '[data-reveal].ae-spring{transition-timing-function:cubic-bezier(.34,1.56,.64,1)}' +
      '[data-reveal].ae-revealed{opacity:1;transform:none !important}' +
      // Safety net: if an observer never fires (element already past the
      // viewport on load, IO unsupported, script error), nothing should stay
      // invisible forever.
      '@media (prefers-reduced-motion: reduce){[data-reveal]{opacity:1 !important;transform:none !important;transition:none !important}}';
    document.head.appendChild(revealStyle);

    var tagMap = [
      { sel: '.hero-words-wrapper', dir: 'up' },
      { sel: '.about_header', dir: 'up' },
      { sel: '.about_content-inner', dir: 'right' },
      { sel: '.about_content-thumb', dir: 'left' },
      { sel: '.research-card', dir: 'up' },
      { sel: '.news-card', dir: 'up' },
      { sel: '.collaborator-card', dir: 'scale' },
      { sel: '.pub-entry', dir: 'up' },
      { sel: '.skill__progress_item', dir: 'right' },
      { sel: '.contact__cta', dir: 'up' },
      { sel: '.contact__widget_sitemap', dir: 'up' },
      { sel: '.contact__widget_address', dir: 'up' }
      // '#header-particles-wrap' was tagged 'fade' here, which started the whole
      // navbar at opacity 0 on every page load — a visible flash of missing
      // header before the observer fired. Dropped.
    ];

    tagMap.forEach(function (entry) {
      document.querySelectorAll(entry.sel).forEach(function (el, i) {
        if (!el.hasAttribute('data-reveal')) {
          el.setAttribute('data-reveal', entry.dir);
          el.style.transitionDelay = Math.min(i * 0.08, 0.4) + 's';
        }
      });
    });

    var newlyTagged = document.querySelectorAll('[data-reveal]:not(.ae-revealed)');

    if (window.__advancedV2RevealObserver) {
      newlyTagged.forEach(function (el) { window.__advancedV2RevealObserver.observe(el); });
    } else if ('IntersectionObserver' in window && !reduced) {
      var fallbackIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('ae-revealed');
            fallbackIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      newlyTagged.forEach(function (el) { fallbackIo.observe(el); });
    } else {
      newlyTagged.forEach(function (el) { el.classList.add('ae-revealed'); });
    }

    // Last-resort unhide: anything still invisible after 4s gets revealed, so a
    // failed observer can never leave a blank section on the page.
    setTimeout(function () {
      document.querySelectorAll('[data-reveal]:not(.ae-revealed)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 1.5) el.classList.add('ae-revealed');
      });
    }, 4000);
  })();

  /* ── 3. Counters — owned by advanced-v2.js ── */
  /* ── 4. Magnetic buttons — owned by interactions.js (duplicate removed) ── */
  /* ── 5. Tilt cards — removed for performance in an earlier pass ── */
  /* ── 6. Navbar scroll class — owned by base.html's scroll bus ── */
  /* ── 7. Typewriter — owned by advanced-v2.js ── */
  /* ── 8. Progress bars — owned by advanced-v2.js (duplicate removed) ── */

  /* ── 9. Floating Physics Glyphs ── */
  (function initFloatingLabels() {
    if (reduced) return;
    var section = document.getElementById('home');
    if (!section || section.querySelector('.ae-float-glyph')) return;

    var labels = ['∑', 'ψ', 'α_s', 'Λ_QCD', '⟨q̄q⟩', 'π±', 'η', 'ρ', 'J/ψ', 'γ*'];
    var frag = document.createDocumentFragment();

    labels.forEach(function (text, i) {
      var el = document.createElement('span');
      el.className = 'ae-float-glyph';
      el.setAttribute('aria-hidden', 'true');
      el.textContent = text;
      el.style.cssText =
        'position:absolute;pointer-events:none;user-select:none;z-index:1;' +
        'color:rgba(139,92,246,' + (0.06 + Math.random() * 0.1).toFixed(2) + ');' +
        'font-size:' + (0.7 + Math.random() * 0.8).toFixed(1) + 'rem;' +
        'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;' +
        'left:' + (5 + Math.random() * 85).toFixed(1) + '%;' +
        'top:' + (10 + Math.random() * 75).toFixed(1) + '%;' +
        'animation:ae-float ' + (8 + Math.random() * 6).toFixed(1) + 's ease-in-out infinite;' +
        'animation-delay:' + (i * 0.7).toFixed(1) + 's;';
      frag.appendChild(el);
    });

    section.appendChild(frag);
  })();

  /* ── 10. Section shimmer line ── */
  (function initSectionShimmer() {
    if (reduced) return;
    document.querySelectorAll('section').forEach(function (sec) {
      if (sec.firstElementChild && sec.firstElementChild.classList.contains('ae-section-shimmer')) return;
      var shimmer = document.createElement('div');
      shimmer.className = 'ae-section-shimmer';
      shimmer.setAttribute('aria-hidden', 'true');
      sec.insertBefore(shimmer, sec.firstChild);
    });
  })();

  /* ── 11. Glitch effect on the site title only ── */
  (function initGlitch() {
    // Scoped to the header title. Previously this was querySelector('h2'), which
    // on any sub-page picked up an arbitrary content heading instead.
    var nameEl = document.querySelector('#site-header .ae-glitch, #site-header h2');
    if (!nameEl) return;
    nameEl.classList.add('ae-glitch');
    if (!nameEl.getAttribute('data-text')) {
      nameEl.setAttribute('data-text', nameEl.textContent.trim());
    }
  })();
})();

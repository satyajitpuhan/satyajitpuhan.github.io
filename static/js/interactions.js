/**
 * interactions.js — Premium Micro-Interactions
 * Magnetic buttons, heading scramble reveal, ripple, section dots.
 * Pure vanilla JS — zero dependencies.
 *
 * Fixed in this pass:
 *  - initMagnetic() attached a separate document-level `mousemove` listener FOR
 *    EVERY button and called getBoundingClientRect() inside each one. With four
 *    magnetic buttons that was four forced layout reflows per mouse move. There
 *    is now a single listener, rects are cached, and writes happen in rAF.
 *  - advanced-effects.js had a second, conflicting magnetic implementation that
 *    fought this one over `style.transform`. It has been removed there.
 *  - scrambleText() replaced heading textContent with random characters, which
 *    destroyed any markup inside the heading and made screen readers announce
 *    gibberish mid-animation. It now clones into an aria-hidden layer.
 *  - Nothing honoured prefers-reduced-motion. Everything here does now.
 *  - `data-scramble`, used on nine templates, had no handler at all — those
 *    headings simply never animated. It is wired up here.
 */
(function () {
  'use strict';

  var reduced = !!window.__aeReducedMotion;
  var coarse = !!window.__aeCoarsePointer;
  var isMobile = coarse || window.matchMedia('(max-width: 768px)').matches;

  /* ══════════════════════════════════════════════
     1. MAGNETIC BUTTONS — one listener, rAF writes
  ══════════════════════════════════════════════ */
  function initMagnetic() {
    if (isMobile || reduced || window.__ultraEngineLoaded) return;

    var RADIUS = 90;
    var STRENGTH = 0.34;

    var btns = Array.prototype.slice.call(
      document.querySelectorAll('.hire_button, .btn-hero, #ae-back-to-top, .contact__cta_action a')
    );
    if (!btns.length) return;

    var items = btns.map(function (el) {
      return { el: el, rect: null, tx: 0, ty: 0, active: false };
    });

    // Rects are only re-read on resize/scroll, never inside mousemove.
    function measure() {
      for (var i = 0; i < items.length; i++) {
        items[i].rect = items[i].el.getBoundingClientRect();
      }
    }
    measure();
    if (window.aeOnScroll) window.aeOnScroll(measure);
    else window.addEventListener('resize', measure, { passive: true });

    var pending = false;
    var mx = 0, my = 0;

    function frame() {
      pending = false;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var r = it.rect;
        if (!r || (!r.width && !r.height)) continue;

        var dx = mx - (r.left + r.width / 2);
        var dy = my - (r.top + r.height / 2);
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < RADIUS) {
          var factor = (1 - dist / RADIUS) * STRENGTH;
          it.tx = dx * factor;
          it.ty = dy * factor;
          it.el.style.transition = 'transform 0.2s cubic-bezier(0.23,1,0.32,1)';
          it.el.style.transform = 'translate(' + it.tx + 'px,' + it.ty + 'px) scale(1.06)';
          it.active = true;
        } else if (it.active) {
          it.tx = it.ty = 0;
          it.active = false;
          it.el.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)';
          it.el.style.transform = '';
        }
      }
    }

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (!pending) { pending = true; requestAnimationFrame(frame); }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════
     2. TEXT SCRAMBLE REVEAL
     The real text stays in the DOM for assistive tech; only a visual
     aria-hidden clone gets scrambled.
  ══════════════════════════════════════════════ */
  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

  function scrambleText(el) {
    if (reduced || el._scrambled) return;
    el._scrambled = true;

    var original = el.textContent;
    if (!original || original.length > 90) return; // pointless on long strings

    // Visual layer that gets mangled, plus a real one the screen reader keeps.
    var visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.textContent = original;

    var sr = document.createElement('span');
    sr.className = 'ae-sr-only';
    sr.textContent = original;

    el.textContent = '';
    el.appendChild(sr);
    el.appendChild(visual);

    var iteration = 0;
    var total = original.length * 3;

    clearInterval(el._scrambleTimer);
    el._scrambleTimer = setInterval(function () {
      visual.textContent = original
        .split('')
        .map(function (ch, i) {
          if (ch === ' ') return ' ';
          if (i < Math.floor(iteration / 3)) return original[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join('');
      iteration++;
      if (iteration >= total) {
        clearInterval(el._scrambleTimer);
        visual.textContent = original;
      }
    }, 28);
  }

  function initScramble() {
    if (reduced || window.__ultraEngineLoaded) return;

    // `[data-scramble]` is used across nine templates and previously had no
    // handler whatsoever, so those headings never animated.
    var headings = document.querySelectorAll(
      '[data-scramble], #service h2, #skill h2, #portfolio h2, #resume h2, #research-network h2'
    );
    if (!headings.length || !('IntersectionObserver' in window)) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          scrambleText(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    Array.prototype.forEach.call(headings, function (h) { obs.observe(h); });
  }

  /* ══════════════════════════════════════════════
     3. RIPPLE CLICK EFFECT
  ══════════════════════════════════════════════ */
  function initRipple() {
    if (reduced) return;
    var targets = document.querySelectorAll('.hire_button, .btn-hero, .ae-resume-tab, .ae-back-to-top');
    Array.prototype.forEach.call(targets, function (btn) {
      btn.style.overflow = 'hidden';
      if (!btn.style.position) btn.style.position = 'relative';
      btn.addEventListener('click', function (e) {
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 2;
        // Keyboard activation reports clientX/Y of 0 — centre the ripple instead.
        var x = e.clientX ? e.clientX - rect.left : rect.width / 2;
        var y = e.clientY ? e.clientY - rect.top : rect.height / 2;
        var ripple = document.createElement('span');
        ripple.style.cssText =
          'position:absolute;border-radius:50%;background:rgba(255,255,255,0.28);' +
          'width:' + size + 'px;height:' + size + 'px;' +
          'left:' + (x - size / 2) + 'px;top:' + (y - size / 2) + 'px;' +
          'transform:scale(0);pointer-events:none;z-index:0;' +
          'animation:rippleAnim 0.55s ease-out forwards;';
        btn.appendChild(ripple);
        setTimeout(function () { ripple.remove(); }, 600);
      });
    });
  }

  /* ══════════════════════════════════════════════
     4. SECTION INDICATOR (side dots)
  ══════════════════════════════════════════════ */
  function initSectionIndicator() {
    if (isMobile || !('IntersectionObserver' in window)) return;

    var sectionIds = ['home', 'about', 'service', 'resume', 'portfolio', 'skill', 'collaborators', 'research-network', 'blog'];
    var dots = [];
    var container = document.createElement('nav');
    container.id = 'ae-section-dots';
    container.setAttribute('aria-label', 'Section navigation');
    container.style.cssText =
      'position:fixed;right:20px;top:50%;transform:translateY(-50%);' +
      'z-index:9000;display:flex;flex-direction:column;gap:10px;';

    sectionIds.forEach(function (id) {
      var sec = document.getElementById(id);
      if (!sec) return;
      var label = id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ');
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.title = label;
      dot.setAttribute('aria-label', 'Go to ' + label);
      dot.style.cssText =
        'width:8px;height:8px;border-radius:50%;border:none;background:rgba(255,255,255,0.2);' +
        'cursor:pointer;padding:0;transition:all 0.3s ease;display:block;';
      dot.addEventListener('click', function () {
        sec.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        // Move keyboard focus with the scroll, otherwise tab order jumps back to the dot.
        sec.setAttribute('tabindex', '-1');
        sec.focus({ preventScroll: true });
      });
      container.appendChild(dot);
      dots.push({ dot: dot, sec: sec });
    });

    if (dots.length < 2) return;
    document.body.appendChild(container);

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var found = dots.filter(function (d) { return d.sec === entry.target; })[0];
        if (!found) return;
        var on = entry.isIntersecting;
        found.dot.style.background = on ? 'linear-gradient(135deg,#8b5cf6,#06b6d4)' : 'rgba(255,255,255,0.2)';
        found.dot.style.width = on ? '10px' : '8px';
        found.dot.style.height = on ? '10px' : '8px';
        found.dot.style.boxShadow = on ? '0 0 10px rgba(139,92,246,0.6)' : 'none';
        found.dot.setAttribute('aria-current', on ? 'true' : 'false');
      });
    }, { threshold: 0.4 });

    dots.forEach(function (d) { obs.observe(d.sec); });
  }

  function boot() {
    initMagnetic();
    initScramble();
    initRipple();
    initSectionIndicator();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

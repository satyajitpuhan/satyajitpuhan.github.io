/**
 * advanced-v2.js — Satyajit Puhan Portfolio
 * Scroll reveals, counters, gauges, typewriter, nav highlighting, back-to-top.
 *
 * Fixed in this pass:
 *  - The scroll-progress bar was updated BOTH here and by an inline script in
 *    base.html, twice per scroll event, and this copy measured against
 *    document.body.scrollHeight (wrong element — it under-reports when body has
 *    margins, so the bar never quite reached 100%). base.html now owns it.
 *  - Four separate `scroll` listeners lived here, each reading layout. They now
 *    share the single rAF-batched bus (window.aeOnScroll).
 *  - Nav highlighting used offsetTop, which is relative to the nearest positioned
 *    ancestor. Every section on this site sits inside `position: relative`
 *    wrappers, so the offsets were wrong and the wrong link lit up. It now uses
 *    an IntersectionObserver.
 *  - animateCounter() overwrote textContent, discarding suffixes like "+" or "k".
 *    Suffixes are preserved via data-counter-suffix / trailing non-digits.
 *  - `data-spring-reveal`, used on eleven templates, had no handler at all. It is
 *    now an alias of the reveal system with a springier easing.
 *  - Nothing honoured prefers-reduced-motion; all animation here now does.
 */

(function () {
  'use strict';

  var reduced = !!window.__aeReducedMotion;
  var hasIO = 'IntersectionObserver' in window;

  function onScroll(fn) {
    if (window.aeOnScroll) window.aeOnScroll(fn);
    else {
      window.addEventListener('scroll', function () { fn(window.scrollY); }, { passive: true });
      fn(window.scrollY);
    }
  }

  /* ── 1. Scroll Reveal ───────────────────────────────── */
  // `data-spring-reveal` is treated as `data-reveal` so the eleven templates
  // using it finally animate instead of silently doing nothing.
  document.querySelectorAll('[data-spring-reveal]').forEach(function (el) {
    if (!el.hasAttribute('data-reveal')) {
      el.setAttribute('data-reveal', el.getAttribute('data-spring-reveal') || 'up');
    }
    el.classList.add('ae-spring');
  });

  var revealObserver = null;

  if (hasIO && !reduced) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var delay = entry.target.dataset.delay || (i * 80);
        setTimeout(function () { entry.target.classList.add('ae-revealed'); }, +delay);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(function (el) { revealObserver.observe(el); });
  } else {
    // No IO, or the visitor asked for less motion: show everything immediately.
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('ae-revealed'); });
  }

  // Exposed so advanced-effects.js can register elements it tags later.
  window.__advancedV2RevealObserver = revealObserver;

  /* ── 2. Animated Stat Counters ──────────────────────── */
  function animateCounter(el) {
    var target = parseInt(el.dataset.counter, 10);
    if (isNaN(target)) return;

    // Preserve a suffix such as "+", "k" or "%" that the old code silently ate.
    var suffix = el.dataset.counterSuffix;
    if (suffix === undefined) {
      var m = (el.textContent || '').match(/[^\d\s].*$/);
      suffix = m ? m[0] : '';
    }

    if (reduced) { el.textContent = target + suffix; return; }

    var duration = 1800;
    var start = performance.now();
    function update(now) {
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (t < 1) requestAnimationFrame(update);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(update);
  }

  if (hasIO) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-counter]').forEach(function (el) { counterObserver.observe(el); });
  } else {
    document.querySelectorAll('[data-counter]').forEach(animateCounter);
  }

  /* ── 3. Progress Bars (SOLE owner of this animation) ── */
  function animateProgressBar(el) {
    var target = parseInt(el.dataset.max || el.getAttribute('max'), 10) || 100;
    if (reduced) { el.value = target; return; }
    var duration = 1400;
    var start = performance.now();
    function update(now) {
      var t = Math.min((now - start) / duration, 1);
      el.value = (1 - Math.pow(1 - t, 3)) * target;
      if (t < 1) requestAnimationFrame(update);
      else el.value = target;
    }
    requestAnimationFrame(update);
  }

  if (hasIO) {
    var progressObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateProgressBar(entry.target);
          progressObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('progress[data-max]').forEach(function (el) { progressObserver.observe(el); });
  } else {
    document.querySelectorAll('progress[data-max]').forEach(animateProgressBar);
  }

  /* ── 4. Circular SVG Gauges ─────────────────────────── */
  function animateGauge(circle) {
    var target = parseFloat(circle.dataset.gaugeTarget || 0);
    var circumference = parseFloat(circle.dataset.circumference || 251.2);
    var full = circumference - (target / 100) * circumference;
    if (reduced) { circle.style.strokeDashoffset = full; return; }

    var duration = 1600;
    var start = performance.now();
    circle.style.strokeDashoffset = circumference;
    function update(now) {
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      circle.style.strokeDashoffset = circumference - (eased * target / 100) * circumference;
      if (t < 1) requestAnimationFrame(update);
      else circle.style.strokeDashoffset = full;
    }
    requestAnimationFrame(update);
  }

  if (hasIO) {
    var gaugeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateGauge(entry.target);
          gaugeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('.ae-gauge-fill').forEach(function (el) { gaugeObserver.observe(el); });
  } else {
    document.querySelectorAll('.ae-gauge-fill').forEach(animateGauge);
  }

  /* ── 5. Typewriter on Hero ──────────────────────────── */
  var typewriterEl = document.getElementById('ae-hero-typewriter');
  if (typewriterEl) {
    var phrases = [
      'QCD & Hadronic Physics',
      'Dyson–Schwinger Equations',
      'Light-Front Quark Models',
      'Meson Form Factors & GPDs',
      'Color Confinement',
      'Pion & Kaon Tomography'
    ];

    // Screen readers should get one stable string, not a character-by-character
    // stream — the element is announced from this label instead.
    typewriterEl.setAttribute('aria-label', phrases.join(', '));
    typewriterEl.setAttribute('role', 'text');

    if (reduced) {
      typewriterEl.textContent = phrases[0];
    } else {
      var phraseIdx = 0, charIdx = 0, deleting = false, pauseTicks = 0;
      var timer = null;
      var paused = false;

      function tick() {
        if (paused) { timer = setTimeout(tick, 400); return; }
        var phrase = phrases[phraseIdx];
        if (!deleting && charIdx <= phrase.length) {
          typewriterEl.textContent = phrase.slice(0, charIdx++);
        } else if (deleting && charIdx >= 0) {
          typewriterEl.textContent = phrase.slice(0, charIdx--);
        }
        if (!deleting && charIdx > phrase.length) {
          if (pauseTicks++ < 28) { timer = setTimeout(tick, 80); return; }
          deleting = true; pauseTicks = 0;
        }
        if (deleting && charIdx < 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          charIdx = 0;
          timer = setTimeout(tick, 400);
          return;
        }
        timer = setTimeout(tick, deleting ? 38 : 72);
      }

      // Stop burning timers while the tab is in the background.
      document.addEventListener('visibilitychange', function () { paused = document.hidden; });
      tick();
    }
  }

  /* ── 6. Active Nav Link (IntersectionObserver, not offsetTop) ── */
  (function initNavHighlight() {
    var navLinks = document.querySelectorAll('.main-navigation .nav-link[href*="#"]');
    var map = [];
    Array.prototype.forEach.call(navLinks, function (link) {
      var href = link.getAttribute('href') || '';
      var hash = href.indexOf('#') > -1 ? href.split('#')[1] : null;
      if (!hash) return;
      var sec = document.getElementById(hash);
      if (sec) map.push({ el: sec, link: link });
    });
    if (!map.length || !hasIO) return;

    var visible = new Set();
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
      });
      var active = null;
      for (var i = 0; i < map.length; i++) {
        if (visible.has(map[i].el)) { active = map[i]; break; }
      }
      map.forEach(function (m) {
        var on = m === active;
        if (m.link.parentElement) m.link.parentElement.classList.toggle('active', on);
        if (on) m.link.setAttribute('aria-current', 'true');
        else m.link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    map.forEach(function (m) { obs.observe(m.el); });
  })();

  /* ── 7. Back-to-Top Button ──────────────────────────── */
  if (!document.getElementById('ae-back-to-top')) {
    var btt = document.createElement('button');
    btt.id = 'ae-back-to-top';
    btt.type = 'button';
    btt.setAttribute('aria-label', 'Back to top');
    btt.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M18 15l-6-6-6 6"/></svg>';
    document.body.appendChild(btt);

    onScroll(function (y) { btt.classList.toggle('ae-btt-visible', y > 400); });

    btt.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      var skip = document.querySelector('.ae-skip-link');
      if (skip) skip.focus({ preventScroll: true });
    });
  }

  /* ── 8. Subtle Hero Parallax ────────────────────────── */
  var heroContent = document.querySelector('#home .hero-content-wrap');
  if (heroContent && !reduced) {
    onScroll(function (y) {
      var vh = window.innerHeight;
      if (y < vh) {
        heroContent.style.transform = 'translate3d(0,' + (y * 0.18) + 'px,0)';
        heroContent.style.opacity = Math.max(0, 1 - (y / (vh * 0.75)));
      } else if (heroContent.style.transform) {
        // Past the hero: park it rather than leaving a stale transform behind.
        heroContent.style.opacity = '0';
      }
    });
  }

  /* ── 9. Stagger children of .ae-stagger-children ────── */
  if (hasIO && !reduced) {
    document.querySelectorAll('.ae-stagger-children').forEach(function (parent) {
      var staggerObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          Array.prototype.forEach.call(parent.children, function (child, i) {
            child.style.transitionDelay = (i * 80) + 'ms';
            child.classList.add('ae-revealed');
          });
          staggerObs.unobserve(entry.target);
        });
      }, { threshold: 0.1 });
      // Observing the parent alone is enough — observing each child as well made
      // the callback fire N+1 times and re-apply the same delays repeatedly.
      staggerObs.observe(parent);
    });
  }
})();

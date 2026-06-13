/**
 * advanced-v2.js — Satyajit Puhan Portfolio
 * Lean, smart JS engine. Replaces wave-particles, header-particles,
 * creative-enhancements, premium-interactions.
 *
 * Features:
 *  1. Smooth scroll-progress bar
 *  2. IntersectionObserver scroll-reveal with stagger
 *  3. Animated stat counters (triggered on scroll)
 *  4. Animated progress bars / circular gauges (triggered on scroll)
 *  5. Typewriter effect on hero
 *  6. Active nav link highlighting
 *  7. Floating back-to-top button
 *  8. Parallax on hero section
 *  9. Sticky header scroll class (already handled in base.html)
 */

(function () {
  'use strict';

  /* ── 1. Scroll Progress Bar ─────────────────────────── */
  const progressBar = document.getElementById('ae-scroll-progress');
  if (!progressBar) {
    const bar = document.createElement('div');
    bar.id = 'ae-scroll-progress';
    document.body.prepend(bar);
  }
  window.addEventListener('scroll', () => {
    const el = document.getElementById('ae-scroll-progress');
    if (!el) return;
    const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    el.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });

  /* ── 2. Scroll Reveal ───────────────────────────────── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || (i * 80);
        setTimeout(() => {
          entry.target.classList.add('ae-revealed');
        }, +delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

  /* ── 3. Animated Stat Counters ──────────────────────── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.counter, 10);
    if (isNaN(target)) return;
    const duration = 1800;
    const start = performance.now();
    const update = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target);
      if (t < 1) requestAnimationFrame(update);
      else el.textContent = target;
    };
    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));

  /* ── 4. Animate Progress Bars ───────────────────────── */
  function animateProgressBar(el) {
    const target = parseInt(el.dataset.max || el.getAttribute('max'), 10) || 100;
    const duration = 1400;
    const start = performance.now();
    const update = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.value = eased * target;
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateProgressBar(entry.target);
        progressObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('progress[data-max]').forEach(el => progressObserver.observe(el));

  /* ── 4b. Animate Circular SVG Gauges ────────────────── */
  function animateGauge(circle) {
    const target = parseFloat(circle.dataset.gaugeTarget || 0);
    const circumference = parseFloat(circle.dataset.circumference || 251.2);
    const duration = 1600;
    const start = performance.now();
    circle.style.strokeDashoffset = circumference; // start empty
    const update = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const offset = circumference - (eased * target / 100) * circumference;
      circle.style.strokeDashoffset = offset;
      if (t < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const gaugeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateGauge(entry.target);
        gaugeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.ae-gauge-fill').forEach(el => gaugeObserver.observe(el));

  /* ── 5. Typewriter on Hero ──────────────────────────── */
  const typewriterEl = document.getElementById('ae-hero-typewriter');
  if (typewriterEl) {
    const phrases = [
      'QCD & Hadronic Physics',
      'Dyson–Schwinger Equations',
      'Light-Front Quark Models',
      'Meson Form Factors & GPDs',
      'Color Confinement',
      'Pion & Kaon Tomography',
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let pauseTicks = 0;

    function tick() {
      const phrase = phrases[phraseIdx];
      if (!deleting && charIdx <= phrase.length) {
        typewriterEl.textContent = phrase.slice(0, charIdx++);
      } else if (deleting && charIdx >= 0) {
        typewriterEl.textContent = phrase.slice(0, charIdx--);
      }

      if (!deleting && charIdx > phrase.length) {
        if (pauseTicks++ < 28) return setTimeout(tick, 80);
        deleting = true; pauseTicks = 0;
      }
      if (deleting && charIdx < 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        charIdx = 0;
        return setTimeout(tick, 400);
      }
      setTimeout(tick, deleting ? 38 : 72);
    }
    tick();
  }

  /* ── 6. Active Nav Link on Scroll ──────────────────── */
  const navLinks = document.querySelectorAll('.main-navigation .nav-link[href*="#"], .main-navigation .nav-link[href$="/"]');
  const sections = [];
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    const hash = href && href.includes('#') ? href.split('#')[1] : null;
    if (hash) {
      const sec = document.getElementById(hash);
      if (sec) sections.push({ el: sec, link });
    }
  });

  if (sections.length) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY + 120;
      let active = sections[0];
      sections.forEach(s => {
        if (s.el.offsetTop <= scrollY) active = s;
      });
      sections.forEach(s => s.link.parentElement.classList.remove('active'));
      if (active) active.link.parentElement.classList.add('active');
    }, { passive: true });
  }

  /* ── 7. Back-to-Top Button ──────────────────────────── */
  const btt = document.createElement('button');
  btt.id = 'ae-back-to-top';
  btt.setAttribute('aria-label', 'Back to top');
  btt.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 15l-6-6-6 6"/>
    </svg>`;
  document.body.appendChild(btt);

  window.addEventListener('scroll', () => {
    btt.classList.toggle('ae-btt-visible', window.scrollY > 400);
  }, { passive: true });

  btt.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ── 8. Subtle Hero Parallax ────────────────────────── */
  const heroContent = document.querySelector('#home .hero-content-wrap');
  if (heroContent) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        heroContent.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        heroContent.style.opacity = 1 - (y / (window.innerHeight * 0.75));
      }
    }, { passive: true });
  }

  /* ── 9. Stagger children of .ae-stagger-children ────── */
  document.querySelectorAll('.ae-stagger-children').forEach(parent => {
    const children = parent.children;
    const staggerObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          Array.from(children).forEach((child, i) => {
            child.style.transitionDelay = (i * 80) + 'ms';
            child.classList.add('ae-revealed');
          });
          staggerObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    parent.querySelectorAll('[data-reveal]').forEach(el => staggerObs.observe(el));
    staggerObs.observe(parent);
  });

})();

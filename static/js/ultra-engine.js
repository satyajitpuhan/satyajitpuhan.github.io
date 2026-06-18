/**
 * ═══════════════════════════════════════════════════════════════════════
 * ULTRA-ENGINE.JS  —  Satyajit Puhan Portfolio  —  Next-Level Interactions
 * Features:
 *   1. Smooth scroll (lightweight Lenis-like)
 *   2. Text scramble effect for headings
 *   3. Enhanced cursor with trail & color sampling
 *   4. Image mask reveal on scroll
 *   5. Spring physics magnetic buttons
 *   6. Depth parallax system
 *   7. Loading screen orchestration
 *   8. Auto-enhancement of existing elements
 *   9. Spotlight follow on cards
 *   10. Spring-based scroll reveals
 * ═══════════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ════════════════════════════════════════════
     0. LOADING SCREEN
  ════════════════════════════════════════════ */
  function initLoadingScreen() {
    if (prefersReducedMotion) return;
    const screen = document.getElementById('ae-loading-screen');
    if (!screen) return;

    window.addEventListener('load', () => {
      setTimeout(() => screen.classList.add('done'), 600);
    });
    // Fallback: hide after 4s max
    setTimeout(() => screen && screen.classList.add('done'), 4000);
  }

  /* ════════════════════════════════════════════
     1. SMOOTH SCROLL (Lightweight)
  ════════════════════════════════════════════ */
  function initSmoothScroll() {
    if (prefersReducedMotion || isMobile) return;

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let isScrolling = false;
    const ease = 0.08; // spring-like damping

    function smoothLoop() {
      const diff = targetY - currentY;
      if (Math.abs(diff) < 0.5) {
        currentY = targetY;
        isScrolling = false;
        return;
      }
      currentY += diff * ease;
      window.scrollTo(0, currentY);
      requestAnimationFrame(smoothLoop);
    }

    // Intercept anchor clicks
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const rect = target.getBoundingClientRect();
      targetY = window.scrollY + rect.top - 80; // offset for navbar
      if (!isScrolling) {
        isScrolling = true;
        smoothLoop();
      }
    });

    // Sync with native scroll
    window.addEventListener('scroll', () => {
      if (!isScrolling) {
        targetY = window.scrollY;
        currentY = window.scrollY;
      }
    }, { passive: true });
  }

  /* ════════════════════════════════════════════
     2. ENHANCED CURSOR v2 (Trail + Color)
  ════════════════════════════════════════════ */
  function initCursorV2() {
    if (isMobile) return;

    const cursor = document.getElementById('ae-cursor');
    if (!cursor) return;

    // Ensure cursor has trail elements
    const TRAIL_COUNT = 6;
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const t = document.createElement('div');
      t.className = 'ae-cursor-trail';
      t.style.opacity = (1 - i / TRAIL_COUNT) * 0.3;
      cursor.appendChild(t);
    }

    const dot = cursor.querySelector('.ae-cursor-dot');
    const ring = cursor.querySelector('.ae-cursor-ring');
    const trails = cursor.querySelectorAll('.ae-cursor-trail');

    let mx = -100, my = -100;
    let rx = -100, ry = -100;
    let trailPositions = [];

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;

      // Detect hover state
      const el = document.elementFromPoint(mx, my);
      const isLink = el && (el.closest('a, button, [role="button"], .btn, .hire_button') || el.tagName === 'A' || el.tagName === 'BUTTON');
      const isImage = el && (el.closest('img, .carousel-item, .hero-figure') || el.tagName === 'IMG');

      cursor.classList.toggle('hover-link', !!isLink);
      cursor.classList.toggle('hover-image', !!isImage);

      // Color sampling from hovered element
      if (el && ring) {
        const style = window.getComputedStyle(el);
        const color = style.color || style.borderColor;
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          // Only update if it's a "nice" color (not black/white)
          if (!color.includes('0, 0, 0') && !color.includes('255, 255, 255')) {
            ring.style.borderColor = color.replace(')', ', 0.6)').replace('rgb', 'rgba');
          }
        }
      }
    });

    function animate() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;

      if (dot) dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
      if (ring) ring.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`;

      // Trail
      trailPositions.unshift({ x: mx, y: my });
      if (trailPositions.length > TRAIL_COUNT) trailPositions.pop();

      trails.forEach((t, i) => {
        const pos = trailPositions[i * 2] || trailPositions[trailPositions.length - 1];
        if (pos) {
          t.style.transform = `translate(${pos.x - 2}px, ${pos.y - 2}px)`;
        }
      });

      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ════════════════════════════════════════════
     3. TEXT SCRAMBLE EFFECT
  ════════════════════════════════════════════ */
  class TextScramble {
    constructor(el) {
      this.el = el;
      this.chars = '!<>-_\\/[]{}—=+*^?#________';
      this.originalText = el.textContent;
      this.frame = 0;
      this.queue = [];
      this.update = this.update.bind(this);
    }

    setText(text) {
      const oldText = this.el.textContent;
      const length = Math.max(oldText.length, text.length);
      const promise = new Promise((resolve) => this.resolve = resolve);
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = text[i] || '';
        const start = Math.floor(Math.random() * 20);
        const end = start + Math.floor(Math.random() * 20);
        this.queue.push({ from, to, start, end });
      }
      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.update();
      return promise;
    }

    update() {
      let output = '';
      let complete = 0;
      for (let i = 0; i < this.queue.length; i++) {
        let { from, to, start, end } = this.queue[i];
        let char = this.queue[i].char;
        if (this.frame >= end) {
          complete++;
          output += to;
        } else if (this.frame >= start) {
          if (!char || Math.random() < 0.28) {
            char = this.randomChar();
            this.queue[i].char = char;
          }
          output += char;
        } else {
          output += from;
        }
      }
      this.el.textContent = output;
      if (complete === this.queue.length) {
        this.resolve();
      } else {
        this.frameRequest = requestAnimationFrame(this.update);
        this.frame++;
      }
    }

    randomChar() {
      return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
  }

  function initTextScramble() {
    if (prefersReducedMotion) return;

    const targets = document.querySelectorAll('[data-scramble]');
    targets.forEach(el => {
      const fx = new TextScramble(el);
      const finalText = el.textContent;
      let hasRun = false;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasRun) {
            hasRun = true;
            fx.setText(finalText);
            observer.unobserve(el);
          }
        });
      }, { threshold: 0.5 });
      observer.observe(el);
    });
  }

  /* ════════════════════════════════════════════
     4. IMAGE MASK REVEAL ON SCROLL
  ════════════════════════════════════════════ */
  function initImageReveal() {
    const images = document.querySelectorAll('.ae-img-reveal');
    if (!images.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ae-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

    images.forEach(img => observer.observe(img));
  }

  /* ════════════════════════════════════════════
     5. SPRING PHYSICS MAGNETIC BUTTONS
  ════════════════════════════════════════════ */
  function initSpringMagnetic() {
    if (isMobile) return;

    const RADIUS = 100;
    const STRENGTH = 0.45;
    const DAMPING = 0.15;

    const btns = document.querySelectorAll('.ae-magnetic, .hire_button, .btn-hero, #ae-back-to-top');

    btns.forEach(btn => {
      btn.classList.add('ae-magnetic');
      let tx = 0, ty = 0, vx = 0, vy = 0;
      let rafId = null;
      let isHovering = false;

      function springLoop() {
        // Spring physics: F = -k * x - c * v
        const ax = -0.08 * tx - 0.15 * vx;
        const ay = -0.08 * ty - 0.15 * vy;
        vx += ax;
        vy += ay;
        tx += vx;
        ty += vy;

        btn.style.transform = `translate(${tx}px, ${ty}px)`;

        if (Math.abs(tx) < 0.1 && Math.abs(ty) < 0.1 && Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01 && !isHovering) {
          btn.style.transform = '';
          return;
        }
        rafId = requestAnimationFrame(springLoop);
      }

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < RADIUS) {
          isHovering = true;
          const force = (1 - dist / RADIUS) * STRENGTH;
          tx = dx * force;
          ty = dy * force;
          vx += (tx - (btn.dataset.tx || 0)) * 0.2;
          vy += (ty - (btn.dataset.ty || 0)) * 0.2;
          btn.dataset.tx = tx;
          btn.dataset.ty = ty;
          if (!rafId) springLoop();
        }
      });

      btn.addEventListener('mouseleave', () => {
        isHovering = false;
        tx = 0; ty = 0;
        // Spring back to center
        vx = -btn.dataset.tx * 0.3 || 0;
        vy = -btn.dataset.ty * 0.3 || 0;
        if (!rafId) springLoop();
      });
    });
  }

  /* ════════════════════════════════════════════
     6. DEPTH PARALLAX SYSTEM
  ════════════════════════════════════════════ */
  function initParallax() {
    if (prefersReducedMotion || isMobile) return;

    const elements = document.querySelectorAll('[data-parallax]');
    if (!elements.length) return;

    let ticking = false;

    function updateParallax() {
      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;

      elements.forEach(el => {
        const depth = parseFloat(el.dataset.parallax) || 0.2;
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const viewportCenter = viewportH / 2;
        const offset = (elCenter - viewportCenter) * depth * 0.1;

        el.style.transform = `translateY(${offset}px)`;
      });

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });

    updateParallax();
  }

  /* ════════════════════════════════════════════
     7. SPOTLIGHT FOLLOW ON CARDS
  ════════════════════════════════════════════ */
  function initSpotlight() {
    if (isMobile) return;

    const cards = document.querySelectorAll('.ae-spotlight');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--spotlight-x', x + 'px');
        card.style.setProperty('--spotlight-y', y + 'px');
        const before = card.querySelector('::before');
        // Use CSS custom properties for position
        card.style.cssText += `--spotlight-x:${x}px; --spotlight-y:${y}px;`;
      });
    });
  }

  /* ════════════════════════════════════════════
     8. ENHANCED SCROLL REVEAL (Spring)
  ════════════════════════════════════════════ */
  function initSpringReveal() {
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay) || (i * 60);
          const type = el.dataset.springReveal || 'up';

          setTimeout(() => {
            el.classList.add('ae-spring-revealed');
            el.style.animation = 'none';
            el.style.opacity = '0';

            // Force reflow
            void el.offsetWidth;

            const animations = {
              up: 'ae-spring-in 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              scale: 'ae-spring-scale 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              fade: 'fadeIn 0.8s ease forwards'
            };

            el.style.animation = animations[type] || animations.up;
          }, delay);

          observer.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('[data-spring-reveal]').forEach(el => observer.observe(el));
  }

  /* ════════════════════════════════════════════
     9. AUTO-ENHANCE EXISTING ELEMENTS
  ════════════════════════════════════════════ */
  function autoEnhance() {
    // Add ae-img-reveal to images in sections
    document.querySelectorAll('section img:not(.carousel-item img):not(.navbar img)').forEach(img => {
      const parent = img.parentElement;
      if (!parent.classList.contains('ae-img-reveal') && parent.tagName !== 'A') {
        parent.classList.add('ae-img-reveal');
      }
    });

    // Add stagger to card grids
    document.querySelectorAll('.row').forEach(row => {
      const cards = row.querySelectorAll('.research-card, .collaborator-card, .ae-skill-gauge-card, .news-card');
      if (cards.length > 1) {
        row.classList.add('ae-stagger');
      }
    });

    // Add underline reveal to footer links
    document.querySelectorAll('footer a[href]').forEach(a => {
      if (!a.classList.contains('ae-underline-reveal')) {
        a.classList.add('ae-underline-reveal');
      }
    });

    // Add lift to cards
    document.querySelectorAll('.research-card, .collaborator-card, .news-card').forEach(card => {
      card.classList.add('ae-lift');
    });

    // Add glow pulse to CTA buttons
    document.querySelectorAll('.hire_button, .btn-hero').forEach(btn => {
      btn.classList.add('ae-glow-pulse');
    });

    // Add glass to nav on scroll (handled by CSS, but ensure class)
    // NOTE: Do NOT add ae-glass class here; initNavbarGlass handles it dynamically
    // const nav = document.getElementById('header-particles-wrap');
    // if (nav) { nav.classList.add('ae-glass'); }

    // Add data-spring-reveal to section headers
    document.querySelectorAll('.section .row:first-child h1, .section .row:first-child h2').forEach(h => {
      if (!h.closest('[data-spring-reveal]') && !h.dataset.springReveal) {
        h.dataset.springReveal = 'up';
      }
    });
  }

  /* ════════════════════════════════════════════
     10. SCROLL PROGRESS v2 (right side)
  ════════════════════════════════════════════ */
  function initScrollProgressV2() {
    const bar = document.getElementById('ae-scroll-progress-v2');
    if (!bar) return;

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.height = pct + '%';
    }, { passive: true });
  }

  /* ════════════════════════════════════════════
     11. NAVBAR GLASS ON SCROLL
  ════════════════════════════════════════════ */
  function initNavbarGlass() {
    const nav = document.getElementById('header-particles-wrap');
    if (!nav) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 60) {
        nav.style.background = 'rgba(5, 9, 17, 0.85)';
        nav.style.backdropFilter = 'blur(20px) saturate(1.2)';
        nav.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
      } else {
        nav.style.background = '#0a0a0f';
        nav.style.backdropFilter = 'none';
        nav.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  /* ════════════════════════════════════════════
     12. KEYBOARD NAVIGATION HELPERS
  ════════════════════════════════════════════ */
  function initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      // Escape closes any open modal/popup
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(m => {
          const close = m.querySelector('[data-bs-dismiss="modal"]');
          if (close) close.click();
        });
      }
    });
  }

  /* ════════════════════════════════════════════
     13. LAZY LOAD IMAGES (native + blur)
  ════════════════════════════════════════════ */
  function initLazyImages() {
    const images = document.querySelectorAll('img[data-src]');
    if (!images.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.addEventListener('load', () => img.classList.add('loaded'));
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => observer.observe(img));
  }

  /* ════════════════════════════════════════════
     14. SECTION COUNTER ANIMATION (Enhanced)
  ════════════════════════════════════════════ */
  function initEnhancedCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.counter, 10);
          const duration = 2000;
          const start = performance.now();
          const suffix = el.dataset.suffix || '';

          function update(now) {
            const t = Math.min((now - start) / duration, 1);
            // Elastic ease out
            const eased = 1 - Math.pow(1 - t, 3.5);
            el.textContent = Math.round(eased * target) + suffix;
            if (t < 1) requestAnimationFrame(update);
            else el.textContent = target + suffix;
          }
          requestAnimationFrame(update);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  /* ════════════════════════════════════════════
     15. SMOOTH PAGE TRANSITIONS (View Transition)
  ════════════════════════════════════════════ */
  function initPageTransitions() {
    if (!document.startViewTransition) return;

    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto:')) {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          document.startViewTransition(() => {
            window.location.href = href;
          });
        });
      }
    });
  }

  /* ════════════════════════════════════════════
     INITIALIZATION
  ════════════════════════════════════════════ */
  function init() {
    initLoadingScreen();
    autoEnhance();
    initSmoothScroll();
    initCursorV2();
    initTextScramble();
    initImageReveal();
    initSpringMagnetic();
    initParallax();
    initSpotlight();
    initSpringReveal();
    initScrollProgressV2();
    initNavbarGlass();
    initKeyboardNav();
    initLazyImages();
    initEnhancedCounters();
    initPageTransitions();
    window.__ultraEngineLoaded = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

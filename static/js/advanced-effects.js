/* ═══════════════════════════════════════════════════════════════════
   Advanced Effects — advanced-effects.js
   Custom cursor, scroll reveals, magnetic buttons, tilt cards,
   animated counters, smooth scroll, typewriter, glitch text
═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── 1. Custom Cursor ── */
  (function initCursor() {
    const cursor = document.createElement('div');
    cursor.id = 'ae-cursor';
    cursor.innerHTML = '<div class="ae-cursor-dot"></div><div class="ae-cursor-ring"></div>';
    document.body.appendChild(cursor);

    let mx = -100, my = -100, rx = -100, ry = -100;
    let isPointer = false;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      const el = document.elementFromPoint(mx, my);
      isPointer = el && (
        el.tagName === 'A' || el.tagName === 'BUTTON' ||
        window.getComputedStyle(el).cursor === 'pointer' ||
        el.closest('a, button, [role="button"]')
      );
    });

    const dot = cursor.querySelector('.ae-cursor-dot');
    const ring = cursor.querySelector('.ae-cursor-ring');

    let rafId;
    function animate() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;

      dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
      ring.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`;

      if (isPointer) {
        dot.style.transform += ' scale(0)';
        ring.style.transform += ' scale(1.6)';
        ring.style.borderColor = 'rgba(139,92,246,0.8)';
        ring.style.background = 'rgba(139,92,246,0.08)';
      } else {
        ring.style.borderColor = 'rgba(6,182,212,0.6)';
        ring.style.background = 'transparent';
      }

      rafId = requestAnimationFrame(animate);
    }
    animate();
  })();

  /* ── 2. Scroll Reveal (Intersection Observer) ── */
  (function initScrollReveal() {
    const revealStyle = document.createElement('style');
    revealStyle.textContent = `
      [data-reveal] {
        opacity: 0;
        transition: opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1),
                    transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);
      }
      [data-reveal="up"]    { transform: translateY(50px); }
      [data-reveal="down"]  { transform: translateY(-50px); }
      [data-reveal="left"]  { transform: translateX(-50px); }
      [data-reveal="right"] { transform: translateX(50px); }
      [data-reveal="scale"] { transform: scale(0.8); }
      [data-reveal="fade"]  { transform: none; }
      [data-reveal].ae-revealed {
        opacity: 1;
        transform: none !important;
      }
    `;
    document.head.appendChild(revealStyle);

    // Auto-tag sections
    const tagMap = [
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
      { sel: '.contact__widget_address', dir: 'up' },
      { sel: '#header-particles-wrap', dir: 'fade' },
    ];

    tagMap.forEach(({ sel, dir }) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        if (!el.hasAttribute('data-reveal')) {
          el.setAttribute('data-reveal', dir);
          el.style.transitionDelay = Math.min(i * 0.08, 0.4) + 's';
        }
      });
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ae-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
  })();

  /* ── 3. Animated Counters ── */
  (function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-counter'), 10);
        const duration = 1800;
        const start = performance.now();

        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 4);
          el.textContent = Math.round(ease * target);
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = target;
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => io.observe(el));
  })();

  /* ── 4. Magnetic Button Effect ── */
  (function initMagnetic() {
    const strength = 0.3;
    document.querySelectorAll('.hire_button, .btn-hero, .contact__cta_action a').forEach(el => {
      el.classList.add('ae-magnetic');

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * strength;
        const dy = (e.clientY - cy) * strength;
        el.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      });

      el.addEventListener('mouseenter', () => {
        el.style.transition = 'transform 0.1s linear';
      });
    });
  })();

  /* ── 5. Tilt Cards — handled by interactions.js (removed duplicate) ── */

  /* ── 6. Navbar Scroll Effect — handled by CSS sticky (removed JS conflict) ── */

  /* ── 7. Typewriter — handled by advanced-v2.js (removed duplicate) ── */

  /* ── 8. Progress bars animate on scroll ── */
  (function initProgressBars() {
    const bars = document.querySelectorAll('progress[data-max]');
    if (!bars.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const bar = entry.target;
        const max = parseInt(bar.getAttribute('data-max'), 10);
        let current = 0;
        const step = max / 60;

        function tick() {
          current = Math.min(current + step, max);
          bar.value = current;
          if (current < max) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io.unobserve(bar);
      });
    }, { threshold: 0.3 });

    bars.forEach(bar => io.observe(bar));
  })();

  /* ── 9. Floating Physics Labels / Equations ── */
  (function initFloatingLabels() {
    const section = document.getElementById('home');
    if (!section) return;

    const labels = ['∑', 'ψ', 'α_s', 'Λ_QCD', '⟨q̄q⟩', 'π±', 'η', 'ρ', 'J/ψ', 'γ*'];
    labels.forEach((text, i) => {
      const el = document.createElement('span');
      el.textContent = text;
      el.style.cssText = `
        position: absolute;
        color: rgba(139,92,246,${(0.06 + Math.random() * 0.1).toFixed(2)});
        font-size: ${(0.7 + Math.random() * 0.8).toFixed(1)}rem;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        pointer-events: none;
        user-select: none;
        z-index: 1;
        left: ${(5 + Math.random() * 85).toFixed(1)}%;
        top: ${(10 + Math.random() * 75).toFixed(1)}%;
        animation: ae-float ${(8 + Math.random() * 6).toFixed(1)}s ease-in-out infinite;
        animation-delay: ${(i * 0.7).toFixed(1)}s;
      `;
      section.appendChild(el);
    });
  })();

  /* ── 10. Section Entrance — add shimmer line ── */
  (function initSectionShimmer() {
    document.querySelectorAll('section').forEach(sec => {
      const shimmer = document.createElement('div');
      shimmer.className = 'ae-section-shimmer';
      sec.insertBefore(shimmer, sec.firstChild);
    });
  })();

  /* ── 11. Glitch effect on name hover ── */
  (function initGlitch() {
    const nameEl = document.querySelector('h2');
    if (!nameEl) return;
    nameEl.classList.add('ae-glitch');
    nameEl.setAttribute('data-text', nameEl.textContent);
  })();

  /* ── 12. Scroll Progress Bar — handled by advanced-v2.js (removed duplicate) ── */

})();

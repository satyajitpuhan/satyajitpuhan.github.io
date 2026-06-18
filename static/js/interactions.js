/**
 * interactions.js — Premium Micro-Interactions
 * Features: 3D card tilt, magnetic buttons, text scramble reveal, ripple effect
 * Pure vanilla JS — zero dependencies
 */
(function () {
  'use strict';

  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  /* ══════════════════════════════════════════════
     1. 3D CARD TILT
     Applies perspective tilt to cards on mousemove
  ══════════════════════════════════════════════ */
  function initTilt() {
    if (isMobile) return;
    const SELECTORS = [
      '.research-card',
      '.collaborator-card',
      '.ae-skill-gauge-card',
      '.news-card',
      '.ae-timeline-card',
    ];
    const cards = document.querySelectorAll(SELECTORS.join(','));

    cards.forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      card.style.transition = 'transform 0.12s ease, box-shadow 0.3s ease';

      card.addEventListener('mousemove', (e) => {
        const rect  = card.getBoundingClientRect();
        const cx    = rect.left + rect.width  / 2;
        const cy    = rect.top  + rect.height / 2;
        const dx    = (e.clientX - cx) / (rect.width  / 2);
        const dy    = (e.clientY - cy) / (rect.height / 2);
        const rotX  = -dy * 8;   // max 8deg
        const rotY  =  dx * 8;
        card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px) scale(1.02)`;
        card.style.boxShadow = `
          ${-rotY * 0.5}px ${rotX * 0.5}px 30px rgba(139,92,246,0.18),
          0 20px 60px rgba(0,0,0,0.4)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
        card.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease';
        setTimeout(() => {
          card.style.transition = 'transform 0.12s ease, box-shadow 0.3s ease';
        }, 500);
      });
    });
  }

  /* ══════════════════════════════════════════════
     2. MAGNETIC BUTTONS
     Buttons magnetically attract the cursor
  ══════════════════════════════════════════════ */
  function initMagnetic() {
    if (isMobile || window.__ultraEngineLoaded) return;
    const RADIUS = 80; // px — activation radius
    const STRENGTH = 0.38;

    const btns = document.querySelectorAll(
      '.hire_button, .btn-hero, #ae-back-to-top'
    );

    btns.forEach(btn => {
      let animating = false;
      let tx = 0, ty = 0;

      document.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = e.clientX - cx;
        const dy   = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < RADIUS) {
          const factor = (1 - dist / RADIUS) * STRENGTH;
          tx = dx * factor;
          ty = dy * factor;
          btn.style.transform = `translate(${tx}px, ${ty}px) scale(1.06)`;
          btn.style.transition = 'transform 0.2s cubic-bezier(0.23,1,0.32,1)';
        } else if (tx !== 0 || ty !== 0) {
          tx = 0; ty = 0;
          btn.style.transform = '';
          btn.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)';
        }
      }, { passive: true });
    });
  }

  /* ══════════════════════════════════════════════
     3. TEXT SCRAMBLE REVEAL
     Section h2 headings decrypt on scroll-in
  ══════════════════════════════════════════════ */
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

  function scrambleText(el) {
    const original = el.dataset.originalText || el.textContent;
    el.dataset.originalText = original;
    let iteration = 0;
    const total = original.length * 3; // steps
    clearInterval(el._scrambleTimer);
    el._scrambleTimer = setInterval(() => {
      el.textContent = original
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < Math.floor(iteration / 3)) return original[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join('');
      iteration++;
      if (iteration >= total) {
        clearInterval(el._scrambleTimer);
        el.textContent = original;
      }
    }, 28);
  }

  function initScramble() {
    if (window.__ultraEngineLoaded) return;
    const headings = document.querySelectorAll(
      '#service h2, #skill h2, #portfolio h2, #resume h2, #research-network h2'
    );
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          scrambleText(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    headings.forEach(h => obs.observe(h));
  }

  /* ══════════════════════════════════════════════
     4. RIPPLE CLICK EFFECT
     Material-design ink ripple on buttons
  ══════════════════════════════════════════════ */
  function initRipple() {
    const targets = document.querySelectorAll(
      '.hire_button, .btn-hero, .ae-resume-tab, .ae-back-to-top'
    );
    targets.forEach(btn => {
      btn.style.overflow = 'hidden';
      btn.style.position = btn.style.position || 'relative';
      btn.addEventListener('click', (e) => {
        const rect   = btn.getBoundingClientRect();
        const x      = e.clientX - rect.left;
        const y      = e.clientY - rect.top;
        const size   = Math.max(rect.width, rect.height) * 2;
        const ripple = document.createElement('span');
        ripple.style.cssText = `
          position:absolute;
          border-radius:50%;
          background:rgba(255,255,255,0.28);
          width:${size}px; height:${size}px;
          left:${x - size/2}px; top:${y - size/2}px;
          transform:scale(0); pointer-events:none;
          animation:rippleAnim 0.55s ease-out forwards;
          z-index:999;
        `;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  /* ══════════════════════════════════════════════
     5. SMOOTH SECTION INDICATOR (side dots)
  ══════════════════════════════════════════════ */
  function initSectionIndicator() {
    if (isMobile) return;
    const sectionIds = ['home','about','service','resume','portfolio','skill','collaborators','research-network'];
    const dots = [];
    const container = document.createElement('div');
    container.id = 'ae-section-dots';
    container.style.cssText = `
      position:fixed; right:20px; top:50%; transform:translateY(-50%);
      z-index:9000; display:flex; flex-direction:column; gap:10px;
    `;

    sectionIds.forEach((id, i) => {
      const sec = document.getElementById(id);
      if (!sec) return;
      const dot = document.createElement('button');
      dot.title = id.charAt(0).toUpperCase() + id.slice(1).replace('-',' ');
      dot.setAttribute('aria-label', dot.title);
      dot.style.cssText = `
        width:8px; height:8px; border-radius:50%; border:none;
        background:rgba(255,255,255,0.2); cursor:pointer; padding:0;
        transition:all 0.3s ease; display:block;
      `;
      dot.addEventListener('click', () => {
        sec.scrollIntoView({ behavior:'smooth', block:'start' });
      });
      container.appendChild(dot);
      dots.push({ dot, sec });
    });

    if (dots.length > 1) {
      document.body.appendChild(container);
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const found = dots.find(d => d.sec === entry.target);
          if (!found) return;
          if (entry.isIntersecting) {
            found.dot.style.background = 'linear-gradient(135deg,#8b5cf6,#06b6d4)';
            found.dot.style.width = '10px';
            found.dot.style.height = '10px';
            found.dot.style.boxShadow = '0 0 10px rgba(139,92,246,0.6)';
          } else {
            found.dot.style.background = 'rgba(255,255,255,0.2)';
            found.dot.style.width = '8px';
            found.dot.style.height = '8px';
            found.dot.style.boxShadow = 'none';
          }
        });
      }, { threshold: 0.4 });
      dots.forEach(d => obs.observe(d.sec));
    }
  }

  /* ══════════════════════════════════════════════
     INIT ALL
  ══════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTilt();
      initMagnetic();
      initScramble();
      initRipple();
      initSectionIndicator();
    });
  } else {
    initTilt();
    initMagnetic();
    initScramble();
    initRipple();
    initSectionIndicator();
  }

})();

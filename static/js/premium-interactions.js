/**
 * premium-interactions.js
 * Next-level interactive effects for Dr. Satyajit Puhan's portfolio
 * - Magnetic cursor with neon trail
 * - Scroll-reveal with physics
 * - Scroll progress indicator
 * - Sticky nav scroll state
 * - Counter animations
 * - Skill bar reveal with glow
 * - Card 3D tilt effects (removed for performance)
 * - Floating quantum particles
 * - Section intersection animations
 */

(function () {
  'use strict';

  /* ── Utility ── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const raf = requestAnimationFrame;

  /* ─────────────────────────────────────────────
     1. SCROLL PROGRESS BAR
  ───────────────────────────────────────────── */
  function initScrollProgress() {
    let bar = $('#ae-scroll-progress');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'ae-scroll-progress';
      document.body.prepend(bar);
    }
    
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────
     2. STICKY NAV — Add "scrolled" class
  ───────────────────────────────────────────── */
  function initStickyNav() {
    const wrap = $('#header-particles-wrap');
    if (!wrap) return;
    
    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 80) {
        wrap.classList.add('scrolled');
      } else {
        wrap.classList.remove('scrolled');
      }
      lastY = y;
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────
     3. SCROLL REVEAL — Intersection Observer
  ───────────────────────────────────────────── */
  function initScrollReveal() {
    const els = $$('[data-reveal]');
    if (!els.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Stagger children in same parent
          const parent = entry.target.parentElement;
          const siblings = parent ? [...parent.querySelectorAll('[data-reveal]')] : [entry.target];
          const idx = siblings.indexOf(entry.target);
          
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, idx * 80);
          
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px'
    });
    
    els.forEach(el => observer.observe(el));
  }

  /* ─────────────────────────────────────────────
     4. COUNTER ANIMATION — Hero stats
  ───────────────────────────────────────────── */
  function animateCounter(el, target, duration = 1800) {
    let start = null;
    const startVal = 0;
    
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startVal + ease * (target - startVal));
      el.textContent = current;
      if (progress < 1) raf(step);
      else el.textContent = target;
    }
    
    raf(step);
  }

  function initCounters() {
    const counterEls = $$('[data-counter]');
    if (!counterEls.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-counter'), 10);
          animateCounter(el, target);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    
    counterEls.forEach(el => observer.observe(el));
  }

  /* ─────────────────────────────────────────────
     5. SKILL BARS — Animate on scroll
  ───────────────────────────────────────────── */
  function initSkillBars() {
    const progressEls = $$('progress[data-max]');
    if (!progressEls.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const maxVal = parseInt(el.getAttribute('data-max'), 10);
          
          // Animate with delay for stagger
          const idx = progressEls.indexOf(el);
          setTimeout(() => {
            let current = 0;
            const step = () => {
              current = Math.min(current + 1.2, maxVal);
              el.value = current;
              if (current < maxVal) raf(step);
            };
            raf(step);
          }, idx * 100);
          
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    
    progressEls.forEach(el => observer.observe(el));
  }


  /* ─────────────────────────────────────────────
     7. FLOATING QUANTUM PARTICLES
     Very subtle ambient physics particles
  ───────────────────────────────────────────── */
  function initQuantumParticles() {
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];
    const particleCount = 12;
    
    function createParticle() {
      const p = document.createElement('div');
      p.className = 'quantum-particle';
      
      const size = Math.random() * 4 + 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const duration = Math.random() * 15 + 12;
      const delay = Math.random() * 8;
      const left = Math.random() * 100;
      
      p.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${left}%;
        bottom: -20px;
        box-shadow: 0 0 ${size * 2}px ${color};
        animation: quantum-float ${duration}s ${delay}s linear infinite;
        opacity: 0;
      `;
      
      document.body.appendChild(p);
    }
    
    for (let i = 0; i < particleCount; i++) {
      createParticle();
    }
  }

  /* ─────────────────────────────────────────────
     8. ACTIVE NAV LINK — Scroll-based highlight
  ───────────────────────────────────────────── */
  function initActiveNav() {
    const sections = $$('section[id]');
    const navLinks = $$('.nav-link');
    
    if (!sections.length || !navLinks.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.remove('active-section');
            const href = link.getAttribute('href') || '';
            if (href.includes(`#${id}`) || href.endsWith(`/${id}`) || (id === 'home' && (href === '/' || href.endsWith('/') ))) {
              link.classList.add('active-section');
            }
          });
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-80px 0px 0px 0px'
    });
    
    sections.forEach(s => observer.observe(s));
  }

  /* ─────────────────────────────────────────────
     9. IMAGE HOVER — Subtle glow effect
  ───────────────────────────────────────────── */
  function initImageHover() {
    const imgs = $$('#collaborators img, #about img, #skill img');
    imgs.forEach(img => {
      img.classList.add('img-hover-glow');
    });
  }

  /* ─────────────────────────────────────────────
     10. MODAL THEME FIX — Dark glass
  ───────────────────────────────────────────── */
  function initModalTheme() {
    document.addEventListener('show.bs.modal', (e) => {
      const modal = e.target;
      // Ensure dark backdrop
      document.querySelectorAll('.modal-backdrop').forEach(bd => {
        bd.style.backdropFilter = 'blur(4px)';
        bd.style.webkitBackdropFilter = 'blur(4px)';
      });
    });
  }

  /* ─────────────────────────────────────────────
     11. HERO BUTTON — Magnetic attract
  ───────────────────────────────────────────── */
  function initMagneticButtons() {
    const btns = $$('.btn-hero, .hire_button');
    
    btns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) translateY(-2px)`;
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.transition = 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
      });
      
      btn.addEventListener('mouseenter', () => {
        btn.style.transition = 'box-shadow 0.3s ease, background 0.3s ease';
      });
    });
  }

  /* ─────────────────────────────────────────────
     12. COLLABORATOR CARDS — Refactor to dark
  ───────────────────────────────────────────── */
  function upgradeCollaboratorCards() {
    // Find all collab cards and apply dark theme colors
    const collaboratorSection = $('#collaborators');
    if (!collaboratorSection) return;
    
    // All card containers inside collaborators
    const cards = collaboratorSection.querySelectorAll('[style*="background: rgba(255"]');
    cards.forEach(card => {
      // override glass to dark purple glass
      card.style.setProperty('background', 'rgba(15, 8, 38, 0.82)', 'important');
      card.style.setProperty('border', '1px solid rgba(139, 92, 246, 0.2)', 'important');
      card.style.setProperty('backdrop-filter', 'blur(20px)', 'important');
    });
    
    // Find "More Details" links and upgrade style
    const detailLinks = collaboratorSection.querySelectorAll('a[href*="collaborator"]');
    detailLinks.forEach(link => {
      link.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 16px;
        font-size: 0.75rem;
        color: #a78bfa;
        border: 1px solid rgba(139,92,246,0.3);
        border-radius: 20px;
        text-decoration: none;
        background: rgba(139,92,246,0.08);
        transition: all 0.3s ease;
        font-weight: 600;
      `;
    });
  }

  /* ─────────────────────────────────────────────
     13. SECTION DIVIDERS — Inject cosmic dividers
  ───────────────────────────────────────────── */
  function injectCosmicDividers() {
    // Nothing to inject if already styled — this is handled by CSS
  }

  /* ─────────────────────────────────────────────
     14. SMOOTH ANCHOR SCROLLING
  ───────────────────────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const offset = 100; // Account for sticky nav height
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  /* ─────────────────────────────────────────────
     15. CAROUSEL INDICATORS — Style upgrade
  ───────────────────────────────────────────── */
  function upgradeCarouselIndicators() {
    $$('.carousel-indicators button').forEach((btn, i) => {
      btn.style.borderRadius = '4px';
      btn.style.transition = 'all 0.3s ease';
    });
  }

  /* ─────────────────────────────────────────────
     16. SECTION ENTRANCE — Fade-in on first load
  ───────────────────────────────────────────── */
  function initSectionFade() {
    const firstSection = $('#home') || $('section');
    if (firstSection) {
      firstSection.style.opacity = '0';
      firstSection.style.transition = 'opacity 0.8s ease';
      setTimeout(() => {
        firstSection.style.opacity = '1';
      }, 100);
    }
  }

  /* ─────────────────────────────────────────────
     INIT ALL
  ───────────────────────────────────────────── */
  function init() {
    initScrollProgress();
    initStickyNav();
    initScrollReveal();
    initCounters();
    initSkillBars();
    initActiveNav();
    initImageHover();
    initModalTheme();
    initMagneticButtons();
    initSmoothScroll();
    upgradeCarouselIndicators();
    upgradeCollaboratorCards();

    // Delay non-critical inits
    setTimeout(() => {
      initQuantumParticles();
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

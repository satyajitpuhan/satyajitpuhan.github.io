/* ═══════════════════════════════════════════════════════════════════════
   Creative Enhancements — creative-enhancements.js  (v2 — bug-fixed)
   10 Advanced Features — all bugs corrected.
═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Utility: hex color → rgba string ── */
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* ══════════════════════════════════════════════════════
     1. CONSTELLATION NAVIGATION
  ══════════════════════════════════════════════════════ */
  (function initConstellationNav() {
    const sectionDefs = [
      { id: 'home',          label: 'Home'         },
      { id: 'about',         label: 'About'        },
      { id: 'skill',         label: 'Skills'       },
      { id: 'service',       label: 'Research'     },
      { id: 'portfolio',     label: 'Publications' },
      { id: 'news',          label: 'News'         },
      { id: 'collaborators', label: 'Network'      },
      { id: 'contact',       label: 'Contact'      },
    ].filter(s => document.getElementById(s.id));

    if (sectionDefs.length < 2) return;

    /* outer wrapper — position:relative is the key fix so SVG covers it correctly */
    const nav = document.createElement('nav');
    nav.id = 'constellation-nav';
    nav.setAttribute('aria-label', 'Section navigation');
    nav.style.cssText = `
      position: fixed;
      right: 24px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 9000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0;
    `;

    /* SVG for dashed constellation lines — drawn on top of the dots */
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      overflow: visible;
      z-index: 0;
    `;
    nav.appendChild(svg);

    sectionDefs.forEach(sec => {
      const row = document.createElement('div');
      row.style.cssText = `
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        height: 34px;
        cursor: pointer;
        z-index: 1;
      `;

      const lbl = document.createElement('span');
      lbl.textContent = sec.label;
      lbl.style.cssText = `
        position: absolute;
        right: 20px;
        color: rgba(255,255,255,0.75);
        font-size: 0.68rem;
        font-family: 'JetBrains Mono', monospace;
        letter-spacing: 1px;
        white-space: nowrap;
        opacity: 0;
        transform: translateX(6px);
        transition: opacity 0.25s ease, transform 0.25s ease;
        pointer-events: none;
        background: rgba(8,8,20,0.88);
        padding: 3px 10px;
        border-radius: 20px;
        border: 1px solid rgba(139,92,246,0.25);
        backdrop-filter: blur(10px);
      `;

      const dot = document.createElement('div');
      dot.dataset.sectionId = sec.id;
      dot.style.cssText = `
        width: 8px; height: 8px;
        border-radius: 50%;
        background: rgba(139,92,246,0.4);
        border: 1.5px solid rgba(139,92,246,0.65);
        box-shadow: 0 0 7px rgba(139,92,246,0.3);
        transition: all 0.35s cubic-bezier(0.23,1,0.32,1);
        flex-shrink: 0;
        pointer-events: auto;
      `;

      row.addEventListener('mouseenter', () => {
        lbl.style.opacity = '1';
        lbl.style.transform = 'translateX(0)';
      });
      row.addEventListener('mouseleave', () => {
        lbl.style.opacity = '0';
        lbl.style.transform = 'translateX(6px)';
      });
      row.addEventListener('click', () => {
        const el = document.getElementById(sec.id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      row.appendChild(lbl);
      row.appendChild(dot);
      nav.appendChild(row);
    });

    document.body.appendChild(nav);

    /* redraw the SVG lines each time the layout might change */
    function drawLines() {
      svg.innerHTML = '';
      const navRect = nav.getBoundingClientRect();
      const dotEls  = Array.from(nav.querySelectorAll('[data-section-id]'));

      const pts = dotEls.map(d => {
        const r = d.getBoundingClientRect();
        return {
          x: r.left - navRect.left + r.width  / 2,
          y: r.top  - navRect.top  + r.height / 2,
        };
      });

      for (let i = 0; i < pts.length - 1; i++) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', pts[i].x);
        line.setAttribute('y1', pts[i].y);
        line.setAttribute('x2', pts[i + 1].x);
        line.setAttribute('y2', pts[i + 1].y);
        line.setAttribute('stroke', 'rgba(139,92,246,0.18)');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', '2 4');
        svg.appendChild(line);
      }
    }

    /* active-section indicator */
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const d = nav.querySelector(`[data-section-id="${entry.target.id}"]`);
        if (!d) return;
        if (entry.isIntersecting) {
          d.style.background  = 'linear-gradient(135deg,#8b5cf6,#06b6d4)';
          d.style.border      = '2px solid rgba(6,182,212,0.9)';
          d.style.boxShadow   = '0 0 14px rgba(6,182,212,0.65),0 0 28px rgba(139,92,246,0.3)';
          d.style.transform   = 'scale(1.75)';
        } else {
          d.style.background  = 'rgba(139,92,246,0.4)';
          d.style.border      = '1.5px solid rgba(139,92,246,0.65)';
          d.style.boxShadow   = '0 0 7px rgba(139,92,246,0.3)';
          d.style.transform   = 'scale(1)';
        }
      });
    }, { threshold: 0.35 });

    sectionDefs.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });

    /* draw after layout is stable */
    requestAnimationFrame(() => { setTimeout(drawLines, 200); });
    window.addEventListener('resize', drawLines, { passive: true });

    /* hide on mobile */
    function toggleVisibility() {
      nav.style.display = window.innerWidth < 992 ? 'none' : 'flex';
    }
    window.addEventListener('resize', toggleVisibility, { passive: true });
    toggleVisibility();
  })();


  /* ══════════════════════════════════════════════════════
     2. TEXT SCRAMBLE / DECRYPT
  ══════════════════════════════════════════════════════ */
  (function initTextScramble() {
    const CHARS = 'ψαΣΛγπρφΘΩμνλδΦΨΞΔ∂∑∏∫ℏ≈≡∝∞';

    class Scrambler {
      constructor(el) {
        this.el  = el;
        this.orig = el.textContent.trim();
        this.raf  = null;
        this.frame = 0;
        this.queue = [];
      }
      run() {
        this.queue = Array.from(this.orig, (ch, i) => ({
          ch,
          start : Math.floor(Math.random() * 10),
          end   : Math.floor(Math.random() * 10) + 12,
        }));
        this.frame = 0;
        cancelAnimationFrame(this.raf);
        this._tick();
      }
      _tick() {
        let out = '';
        let done = 0;
        this.queue.forEach(({ ch, start, end }) => {
          if (this.frame >= end) {
            out += ch; done++;
          } else if (this.frame >= start) {
            const rnd = CHARS[Math.floor(Math.random() * CHARS.length)];
            out += `<span style="color:rgba(139,92,246,0.75);font-family:'JetBrains Mono',monospace">${rnd}</span>`;
          } else {
            out += `<span style="opacity:0.18">${ch}</span>`;
          }
        });
        this.el.innerHTML = out;
        this.frame++;
        if (done < this.queue.length) {
          this.raf = requestAnimationFrame(() => this._tick());
        } else {
          /* restore plain text so other scripts aren't confused */
          this.el.textContent = this.orig;
        }
      }
    }

    const headings = document.querySelectorAll('section h2, section h3');
    const map = new Map();

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        if (!map.has(el)) map.set(el, new Scrambler(el));
        map.get(el).run();
        io.unobserve(el);
      });
    }, { threshold: 0.55 });

    headings.forEach(h => {
      if (h.textContent.trim().length > 2) io.observe(h);
    });
  })();


  /* ══════════════════════════════════════════════════════
     3. HOLOGRAPHIC CARD SHEEN
  ══════════════════════════════════════════════════════ */
  (function initHolographicSheen() {
    document.querySelectorAll(
      '.research-card, .news-card, .collaborator-card, .pub-entry'
    ).forEach(card => {
      /* make sure the card is a positioning context */
      const pos = window.getComputedStyle(card).position;
      if (pos === 'static') card.style.position = 'relative';

      const sheen = document.createElement('div');
      sheen.style.cssText = `
        position:absolute;inset:0;border-radius:inherit;
        pointer-events:none;z-index:5;opacity:0;
        transition:opacity 0.35s ease;
        mix-blend-mode:color-dodge;
      `;
      card.appendChild(sheen);

      card.addEventListener('mousemove', e => {
        const r  = card.getBoundingClientRect();
        const x  = ((e.clientX - r.left) / r.width)  * 100;
        const y  = ((e.clientY - r.top)  / r.height) * 100;
        const hue = x * 1.8;

        sheen.style.opacity = '1';
        sheen.style.background = `radial-gradient(
          circle at ${x}% ${y}%,
          rgba(255,100,150,0.13) 0%,
          rgba(255,210,60,0.09) 18%,
          rgba(60,255,140,0.09) 34%,
          rgba(60,180,255,0.11) 50%,
          rgba(200,60,255,0.09) 65%,
          transparent 75%
        )`;
        sheen.style.filter = `hue-rotate(${hue}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        sheen.style.opacity = '0';
      });
    });
  })();


  /* ══════════════════════════════════════════════════════
     4. FORCE-DIRECTED CITATION GRAPH  (bug-fixed)
  ══════════════════════════════════════════════════════ */
  (function initCitationGraph() {
    const portfolio = document.getElementById('portfolio');
    if (!portfolio) return;

    /* build container */
    const wrap = document.createElement('div');
    wrap.id = 'citation-graph-container';
    wrap.style.cssText = `
      width:100%;height:260px;position:relative;
      margin:40px 0 20px;border-radius:20px;overflow:hidden;
      background:rgba(8,8,22,0.72);
      border:1px solid rgba(139,92,246,0.14);
      backdrop-filter:blur(12px);
    `;

    const lbl = document.createElement('div');
    lbl.style.cssText = `
      position:absolute;top:14px;left:18px;z-index:3;
      font-family:'JetBrains Mono',monospace;font-size:0.63rem;
      letter-spacing:3px;text-transform:uppercase;
      color:rgba(139,92,246,0.75);
    `;
    lbl.textContent = '⬡ Citation Network';
    wrap.appendChild(lbl);

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    wrap.appendChild(canvas);

    const ph = portfolio.querySelector('.container');
    if (ph && ph.children.length > 1) ph.insertBefore(wrap, ph.children[1]);
    else (ph || portfolio).appendChild(wrap);

    /* size canvas to pixel-perfect resolution */
    function sizeCanvas() {
      canvas.width  = wrap.offsetWidth  || wrap.clientWidth  || 600;
      canvas.height = wrap.offsetHeight || wrap.clientHeight || 260;
    }
    requestAnimationFrame(sizeCanvas);
    window.addEventListener('resize', sizeCanvas, { passive: true });

    const ctx = canvas.getContext('2d');

    const PAPERS = [
      { label: 'QCD Condensates',   cit: 42, color: '#8b5cf6' },
      { label: 'Hadronic Mass',     cit: 31, color: '#06b6d4' },
      { label: 'Pion Form Factor',  cit: 27, color: '#f59e0b' },
      { label: 'η Meson',           cit: 19, color: '#10b981' },
      { label: 'DCSB',              cit: 38, color: '#ec4899' },
      { label: 'Nucleon Structure', cit: 22, color: '#f43f5e' },
      { label: 'Color Confinement', cit: 45, color: '#8b5cf6' },
      { label: 'Gluon Propagator',  cit: 15, color: '#06b6d4' },
    ];

    let nodes = [], edges = [];
    const mouse = { x: null, y: null };

    function buildGraph() {
      const W = canvas.width || 600, H = canvas.height || 260;
      nodes = PAPERS.map(p => ({
        ...p,
        x : W * 0.15 + Math.random() * W * 0.7,
        y : H * 0.15 + Math.random() * H * 0.7,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r : 5 + p.cit / 9,
        angle: Math.random() * Math.PI * 2,
      }));
      edges = [];
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++)
          if (Math.random() < 0.42) edges.push([i, j]);
    }

    /* build after canvas has real dimensions */
    setTimeout(buildGraph, 300);

    wrap.addEventListener('mousemove', e => {
      const r = wrap.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    wrap.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    let visible = false;
    const visObs = new IntersectionObserver(ents => {
      visible = ents[0].isIntersecting;
    }, { threshold: 0.05 });
    visObs.observe(wrap);

    function tick() {
      requestAnimationFrame(tick);
      if (!visible || !nodes.length) return;

      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      /* repulsion */
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b  = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d  = Math.hypot(dx, dy) || 1;
          const f  = Math.min(1200 / (d * d), 2) * 0.01;
          a.vx -= (dx / d) * f;  a.vy -= (dy / d) * f;
          b.vx += (dx / d) * f;  b.vy += (dy / d) * f;
        }
      }
      /* spring edges */
      edges.forEach(([i, j]) => {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d  = Math.hypot(dx, dy) || 1;
        const s  = (d - 110) * 0.0015;
        a.vx += (dx / d) * s;  a.vy += (dy / d) * s;
        b.vx -= (dx / d) * s;  b.vy -= (dy / d) * s;
      });
      /* mouse repulsion */
      if (mouse.x !== null) {
        nodes.forEach(n => {
          const dx = n.x - mouse.x, dy = n.y - mouse.y;
          const d  = Math.hypot(dx, dy) || 1;
          if (d < 90) { n.vx += (dx / d) * (90 - d) * 0.04; n.vy += (dy / d) * (90 - d) * 0.04; }
        });
      }
      /* integrate */
      nodes.forEach(n => {
        n.vx *= 0.93; n.vy *= 0.93;
        n.x   = Math.max(n.r + 4, Math.min(W - n.r - 4, n.x + n.vx));
        n.y   = Math.max(n.r + 4, Math.min(H - n.r - 4, n.y + n.vy));
        n.angle += 0.01;
      });

      /* draw edges — fixed: no broken gradient, simple rgba */
      edges.forEach(([i, j]) => {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        const alpha = Math.max(0, 1 - d / 220) * 0.3;
        if (alpha <= 0) return;

        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, hexToRgba(a.color, alpha));
        grad.addColorStop(1, hexToRgba(b.color, alpha));

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 0.9;
        ctx.stroke();
      });

      /* draw nodes */
      nodes.forEach(n => {
        /* orbiting particle */
        const ox = n.x + Math.cos(n.angle) * (n.r + 5);
        const oy = n.y + Math.sin(n.angle) * (n.r + 5);
        ctx.save();
        ctx.shadowBlur  = 8; ctx.shadowColor = n.color;
        ctx.beginPath(); ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = n.color; ctx.fill();
        ctx.restore();

        /* node body */
        const g2 = ctx.createRadialGradient(
          n.x - n.r * 0.3, n.y - n.r * 0.3, 0,
          n.x, n.y, n.r
        );
        g2.addColorStop(0, hexToRgba(n.color, 0.85));
        g2.addColorStop(1, hexToRgba(n.color, 0.28));
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = g2; ctx.fill();

        /* border */
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(n.color, 0.65);
        ctx.lineWidth = 1; ctx.stroke();

        /* label */
        ctx.fillStyle  = 'rgba(255,255,255,0.72)';
        ctx.font       = '7.5px "JetBrains Mono", monospace';
        ctx.textAlign  = 'center';
        ctx.fillText(n.label, n.x, n.y + n.r + 12);
      });
    }
    tick();
  })();


  /* ══════════════════════════════════════════════════════
     5. AURORA BOREALIS LAYERS  (fixed: no negative top/bottom — avoids clipping)
  ══════════════════════════════════════════════════════ */
  (function initAurora() {
    const KF = document.createElement('style');
    KF.textContent = `
      @keyframes aurora-a {
        0%,100% { transform:translateX(-25%) scaleY(1) rotate(-4deg);   opacity:0.055; }
        40%      { transform:translateX(12%)  scaleY(1.5) rotate(3deg);  opacity:0.10; }
        70%      { transform:translateX(28%)  scaleY(0.8) rotate(-2deg); opacity:0.07; }
      }
      @keyframes aurora-b {
        0%,100% { transform:translateX(22%) scaleY(1.2) rotate(4deg);  opacity:0.045; }
        50%      { transform:translateX(-18%) scaleY(0.9) rotate(-5deg); opacity:0.085; }
      }
      @keyframes aurora-c {
        0%,100% { transform:translateX(0%) scaleY(1) rotate(-3deg);  opacity:0.035; filter:hue-rotate(0deg); }
        33%      { transform:translateX(-14%) scaleY(1.35) rotate(5deg); opacity:0.075; filter:hue-rotate(70deg); }
        66%      { transform:translateX(14%) scaleY(0.8) rotate(-1deg);  opacity:0.055; filter:hue-rotate(140deg); }
      }
      .aurora-l {
        position:absolute;pointer-events:none;
        width:130%;left:-15%;
        border-radius:50%;filter:blur(55px);z-index:0;
      }
    `;
    document.head.appendChild(KF);

    const PALETTE = [
      ['rgba(139,92,246,1)',  'rgba(6,182,212,1)'  ],
      ['rgba(245,158,11,1)',  'rgba(16,185,129,1)' ],
      ['rgba(244,63,94,1)',   'rgba(139,92,246,1)' ],
    ];

    document.querySelectorAll('#about,#skill,#service,#portfolio,#news,#collaborators')
      .forEach((sec, idx) => {
        /* ensure the section is a positioning context */
        const cp = window.getComputedStyle(sec).position;
        if (cp === 'static') sec.style.position = 'relative';

        /* remove overflow:hidden from inline style so aurora isn't clipped */
        if (sec.style.overflow === 'hidden') sec.style.overflow = 'visible';
        /* re-add it only for the content wrapper inside — handled by inner divs */

        const [c1, c2] = PALETTE[idx % PALETTE.length];
        const delays   = [idx * -2, idx * -3, idx * -1.5];
        const anames   = ['aurora-a', 'aurora-b', 'aurora-c'];
        const heights  = ['260px', '180px', '130px'];
        const tops     = ['4%', 'auto', '38%'];
        const bottoms  = ['auto', '4%', 'auto'];
        const grads    = [
          `linear-gradient(90deg,${c1},${c2})`,
          `linear-gradient(90deg,${c2},${c1})`,
          `linear-gradient(90deg,transparent,${c1},transparent)`,
        ];

        [0, 1, 2].forEach(k => {
          const el = document.createElement('div');
          el.className = 'aurora-l';
          el.style.cssText = `
            height:${heights[k]};
            top:${tops[k]};
            bottom:${bottoms[k]};
            background:${grads[k]};
            animation:${anames[k]} ${15 + idx * 3 + k * 3}s ease-in-out infinite;
            animation-delay:${delays[k]}s;
          `;
          sec.insertBefore(el, sec.firstChild);
        });
      });
  })();


  /* ══════════════════════════════════════════════════════
     6. INTERACTIVE FEYNMAN DIAGRAM WIDGET  (fixed canvas sizing)
  ══════════════════════════════════════════════════════ */
  (function initFeynmanWidget() {
    const about = document.getElementById('about');
    if (!about) return;

    const widget = document.createElement('div');
    widget.id = 'feynman-widget';
    widget.style.cssText = `
      margin-top:36px;padding:24px 28px;
      background:rgba(8,8,22,0.82);
      border:1px solid rgba(139,92,246,0.22);
      border-radius:20px;
      backdrop-filter:blur(16px);
      box-shadow:0 8px 40px rgba(0,0,0,0.45);
      position:relative;overflow:hidden;z-index:1;
    `;
    widget.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:0.63rem;letter-spacing:3px;text-transform:uppercase;color:#a78bfa;">⬡ Interactive Feynman Diagram</span>
        <span style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#10b981;font-size:0.58rem;padding:2px 8px;border-radius:20px;font-family:'JetBrains Mono',monospace;">LIVE</span>
      </div>
      <canvas id="feynman-canvas" style="width:100%;height:180px;border-radius:12px;display:block;cursor:crosshair;background:rgba(5,5,15,0.75);border:1px solid rgba(255,255,255,0.04);"></canvas>
      <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:0.68rem;color:rgba(255,255,255,0.38);font-family:'JetBrains Mono',monospace;">Click to emit particles</span>
        <span style="font-size:0.68rem;color:rgba(255,255,255,0.38);font-family:'JetBrains Mono',monospace;">
          <span style="color:#f43f5e;">●</span> u-quark &nbsp;
          <span style="color:#10b981;">●</span> d-quark &nbsp;
          <span style="color:#3b82f6;">●</span> gluon
        </span>
      </div>
    `;

    const cont = about.querySelector('.container');
    (cont || about).appendChild(widget);

    const canvas = document.getElementById('feynman-canvas');
    const ctx    = canvas.getContext('2d');

    /* size after layout is ready — critical fix */
    function sizeFeynman() {
      const cssW  = widget.clientWidth - 56;  // 28px padding each side
      canvas.width  = Math.max(cssW, 200);
      canvas.height = 180;
    }
    requestAnimationFrame(() => { sizeFeynman(); });
    window.addEventListener('resize', sizeFeynman, { passive: true });

    const TYPES = ['u', 'd', 'g'];
    const COLORS = { u: '#f43f5e', d: '#10b981', g: '#3b82f6' };

    class FPart {
      constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type;
        const a = Math.random() * Math.PI * 2;
        const s = 1.4 + Math.random() * 2.2;
        this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
        this.trail = []; this.life = 1;
        this.decay = 0.007 + Math.random() * 0.006;
        this.color = COLORS[type];
        this.r = type === 'g' ? 3 : 4.5;
        this.isGluon = type === 'g';
        this.osc = 0;
      }
      update(W, H) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 22) this.trail.shift();
        this.x += this.vx; this.y += this.vy;
        this.vy += 0.018;
        if (this.x < 0 || this.x > W) this.vx *= -1;
        if (this.y > H) { this.vy *= -0.65; this.y = H; }
        if (this.y < 0) { this.vy *= -1; this.y = 0; }
        this.life -= this.decay; this.osc += 0.32;
      }
      draw(c) {
        /* trail */
        if (this.trail.length > 1) {
          c.save();
          c.beginPath();
          this.trail.forEach((t, i) => {
            const wx = this.isGluon ? t.x + Math.sin(this.osc + i * 0.5) * 4 : t.x;
            i === 0 ? c.moveTo(wx, t.y) : c.lineTo(wx, t.y);
          });
          const [rr, gg, bb] = this.color.slice(1).match(/.{2}/g).map(x => parseInt(x, 16));
          c.strokeStyle = `rgba(${rr},${gg},${bb},${this.life * 0.35})`;
          c.lineWidth   = 1.4;
          if (this.isGluon) { c.setLineDash([4, 4]); }
          c.stroke(); c.setLineDash([]); c.restore();
        }
        /* dot */
        c.save();
        c.globalAlpha = this.life;
        c.shadowBlur  = 10; c.shadowColor = this.color;
        c.beginPath(); c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        c.fillStyle = this.color; c.fill();
        c.restore();
      }
    }

    const particles = [];
    canvas.addEventListener('click', e => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (canvas.width  / r.width);
      const y = (e.clientY - r.top)  * (canvas.height / r.height);
      for (let i = 0; i < 9; i++) particles.push(new FPart(x, y, TYPES[i % 3]));
    });

    let timer = 0;
    function loop() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (++timer % 28 === 0 && particles.length < 32) {
        particles.push(new FPart(Math.random() * W, Math.random() * H, TYPES[Math.floor(Math.random() * 3)]));
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(W, H); particles[i].draw(ctx);
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      requestAnimationFrame(loop);
    }
    loop();
  })();


  /* ══════════════════════════════════════════════════════
     7. SCROLL-SYNCED QCD PARTICLE FADE
  ══════════════════════════════════════════════════════ */
  (function initScrollParticleFade() {
    const canvas = document.getElementById('qcd-particle-canvas');
    if (!canvas) return;
    window.addEventListener('scroll', () => {
      const hero = document.getElementById('home');
      const hH   = hero ? hero.clientHeight : 600;
      const pct  = Math.min(window.scrollY / hH, 1);
      canvas.style.opacity = String(0.85 * (1 - pct * 0.75));
    }, { passive: true });
  })();


  /* ══════════════════════════════════════════════════════
     8. 3D CAREER TIMELINE
  ══════════════════════════════════════════════════════ */
  (function init3DTimeline() {
    const skill = document.getElementById('skill');
    if (!skill) return;

    const milestones = [
      { year:'2018', ev:'BSc Physics',      det:'Top of class',          icon:'🎓', c:'#8b5cf6' },
      { year:'2020', ev:'MSc Physics',      det:'Quantum Field Theory',   icon:'⚛️', c:'#06b6d4' },
      { year:'2021', ev:'PhD Begins',       det:'QCD Research',           icon:'🔬', c:'#10b981' },
      { year:'2022', ev:'1st Paper',        det:'Hadronic Physics',       icon:'📄', c:'#f59e0b' },
      { year:'2023', ev:'10 Publications',  det:'Major milestone',        icon:'🏆', c:'#f43f5e' },
      { year:'2024', ev:'Postdoc',          det:'Academia Sinica',        icon:'🌏', c:'#ec4899' },
      { year:'2025', ev:'h-index 7',        det:'150+ Citations',         icon:'📈', c:'#8b5cf6' },
    ];

    /* inject keyframes */
    const st = document.createElement('style');
    st.textContent = `
      @keyframes tl-float-even {
        0%,100%{transform:perspective(600px) rotateX(2deg) translateY(0);}
        50%    {transform:perspective(600px) rotateX(2deg) translateY(-6px);}
      }
      @keyframes tl-float-odd {
        0%,100%{transform:perspective(600px) rotateX(-2deg) translateY(0);}
        50%    {transform:perspective(600px) rotateX(-2deg) translateY(-6px);}
      }
      #tl-track { overflow-x:auto;display:flex;gap:12px;padding:20px 8px 32px;
        scrollbar-width:thin;scrollbar-color:rgba(139,92,246,0.3) transparent; }
      #tl-track::-webkit-scrollbar{height:4px;}
      #tl-track::-webkit-scrollbar-track{background:transparent;}
      #tl-track::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.35);border-radius:2px;}
    `;
    document.head.appendChild(st);

    const block = document.createElement('div');
    block.style.cssText = 'margin-top:56px;position:relative;z-index:1;';
    block.innerHTML = `
      <div style="text-align:center;margin-bottom:28px;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:0.63rem;letter-spacing:3px;text-transform:uppercase;color:#a78bfa;">◈ Career Timeline</span>
      </div>
      <div id="tl-track">
        ${milestones.map((m, i) => `
          <div class="tl-card" style="
            flex-shrink:0;width:138px;
            background:rgba(10,10,22,0.92);
            border:1px solid ${m.c}30;
            border-radius:16px;padding:18px 14px;text-align:center;
            position:relative;cursor:default;
            box-shadow:0 ${i%2?4:8}px 24px rgba(0,0,0,0.38);
            animation:tl-float-${i%2===0?'even':'odd'} ${4+i*0.3}s ease-in-out infinite;
            transition:all 0.38s cubic-bezier(0.23,1,0.32,1);
          "
          onmouseover="this.style.transform='perspective(600px) rotateX(-8deg) translateY(-14px) scale(1.06)';this.style.borderColor='${m.c}70';this.style.boxShadow='0 22px 50px rgba(0,0,0,0.55),0 0 28px ${m.c}25';"
          onmouseout="this.style.transform='';this.style.borderColor='${m.c}30';this.style.boxShadow='0 ${i%2?4:8}px 24px rgba(0,0,0,0.38)';"
          >
            <div style="font-size:1.7rem;margin-bottom:8px;">${m.icon}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.78rem;color:${m.c};font-weight:700;margin-bottom:5px;">${m.year}</div>
            <div style="color:#fff;font-weight:700;font-size:0.8rem;font-family:'Space Grotesk',sans-serif;margin-bottom:3px;">${m.ev}</div>
            <div style="color:rgba(255,255,255,0.38);font-size:0.68rem;">${m.det}</div>
            <div style="position:absolute;bottom:-12px;left:50%;transform:translateX(-50%);width:2px;height:20px;background:linear-gradient(to bottom,${m.c},transparent);"></div>
          </div>
        `).join('')}
      </div>
    `;

    const skillCont = skill.querySelector('.container');
    (skillCont || skill).appendChild(block);
  })();


  /* ══════════════════════════════════════════════════════
     9. CHATBOT VISUAL UPGRADE (MutationObserver for message entrance)
  ══════════════════════════════════════════════════════ */
  (function upgradeChatbot() {
    /* Watch for new message nodes and add entrance animation */
    function attachObserver() {
      const msgArea = document.querySelector('#satyabot-messages, .satyabot-messages, .chatbot-messages');
      if (!msgArea) { setTimeout(attachObserver, 1200); return; }

      const mo = new MutationObserver(muts => {
        muts.forEach(m => {
          m.addedNodes.forEach(n => {
            if (n.nodeType !== 1) return;
            n.style.animation = 'satyabot-fadeIn 0.38s cubic-bezier(0.23,1,0.32,1) both';
          });
        });
      });
      mo.observe(msgArea, { childList: true });
    }
    attachObserver();
  })();


  /* ══════════════════════════════════════════════════════
     10. LIVE RESEARCH STATUS BADGE
  ══════════════════════════════════════════════════════ */
  (function initLiveBadge() {
    const hero = document.getElementById('home');
    if (!hero) return;

    const topics = [
      'Studying QCD Condensates in Dense Matter',
      'Exploring η Meson Light-Front Structure',
      'Analyzing Pion Form Factor via DSE',
      'Computing Hadron Mass Spectra',
      'Investigating Color Confinement Mechanisms',
      'Writing: Nucleon Parton Distributions',
    ];
    let idx = 0;

    const badge = document.createElement('div');
    badge.id = 'live-research-badge';
    badge.style.cssText = `
      position:absolute;top:22px;right:22px;z-index:10;
      background:rgba(8,8,22,0.88);
      border:1px solid rgba(16,185,129,0.32);
      border-radius:100px;padding:7px 16px;
      display:flex;align-items:center;gap:10px;
      backdrop-filter:blur(16px);
      box-shadow:0 4px 20px rgba(0,0,0,0.42),0 0 18px rgba(16,185,129,0.05);
      max-width:310px;transition:all 0.45s ease;
    `;

    const dot = document.createElement('span');
    dot.style.cssText = `
      position:relative;display:inline-flex;align-items:center;flex-shrink:0;
    `;
    dot.innerHTML = `
      <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px rgba(16,185,129,0.8);display:block;"></span>
      <span style="position:absolute;width:8px;height:8px;border-radius:50%;background:#10b981;animation:live-ping 1.6s ease-out infinite;"></span>
    `;

    const txt = document.createElement('span');
    txt.id = 'live-research-text';
    txt.style.cssText = `
      font-family:'JetBrains Mono',monospace;font-size:0.63rem;
      color:rgba(255,255,255,0.68);letter-spacing:0.4px;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      max-width:240px;transition:opacity 0.3s ease,transform 0.3s ease;
    `;
    txt.textContent = topics[0];

    badge.appendChild(dot); badge.appendChild(txt);
    hero.appendChild(badge);

    const ps = document.createElement('style');
    ps.textContent = `
      @keyframes live-ping {
        0%  {transform:scale(1);opacity:0.8;}
        100%{transform:scale(2.6);opacity:0;}
      }
      #live-research-badge:hover{
        border-color:rgba(16,185,129,0.55)!important;
        box-shadow:0 4px 20px rgba(0,0,0,0.45),0 0 26px rgba(16,185,129,0.12)!important;
      }
    `;
    document.head.appendChild(ps);

    setInterval(() => {
      idx = (idx + 1) % topics.length;
      txt.style.opacity = '0'; txt.style.transform = 'translateY(5px)';
      setTimeout(() => {
        txt.textContent = topics[idx];
        txt.style.opacity = '1'; txt.style.transform = 'translateY(0)';
      }, 320);
    }, 5000);
  })();


  /* ══════════════════════════════════════════════════════
     BONUS A: Physics Symbol Mouse Trail
  ══════════════════════════════════════════════════════ */
  (function initMouseTrail() {
    if (window.innerWidth < 769) return;   /* desktop only */

    const SYMS = ['α','ψ','γ','π','ρ','φ','Λ','Σ','⊕','⊗','ℏ','∂'];
    const pool  = [];

    const st = document.createElement('style');
    st.textContent = `@keyframes sym-rise{0%{opacity:1;transform:translate(-50%,-50%) scale(1);}100%{opacity:0;transform:translate(-50%,-160%) scale(0.5);}}`;
    document.head.appendChild(st);

    document.addEventListener('mousemove', e => {
      if (Math.random() > 0.22) return;

      const el = document.createElement('span');
      el.textContent = SYMS[Math.floor(Math.random() * SYMS.length)];
      el.style.cssText = `
        position:fixed;left:${e.clientX}px;top:${e.clientY}px;
        pointer-events:none;z-index:99999;user-select:none;
        font-family:'JetBrains Mono',monospace;
        font-size:${0.5 + Math.random() * 0.55}rem;
        color:rgba(139,92,246,${0.38 + Math.random() * 0.42});
        animation:sym-rise 0.9s ease forwards;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }, { passive: true });
  })();


  /* ══════════════════════════════════════════════════════
     BONUS B: Animated Gradient Top Bar (navbar already done in template)
              — skip, handled in navbar.html
  ══════════════════════════════════════════════════════ */

})();

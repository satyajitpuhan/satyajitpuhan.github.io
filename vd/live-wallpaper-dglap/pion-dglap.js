/* ================================================================
   PION (π⁺) DGLAP EVOLUTION — LIVE WALLPAPER ENGINE
   ================================================================
   Physics:
     π⁺ = u d̄  (valence quark content)
     DGLAP evolves the pion PDFs: valence d̄, gluon, sea quarks
     Splitting functions: Pqq, Pqg, Pgq, Pgg animated visually
     NLO / NNLO bands from Q₀ uncertainty

   Visual Layout:
     CENTER  — Large PDF plot: x·f(x,Q²) vs x (log scale)
     AROUND  — Orbiting gluon springs + sea quark pairs
     LEFT    — Animated splitting vertex diagrams
     PANELS  — Glass UI with live evolution data
   ================================================================ */

(function () {
    'use strict';

    // ===================== PHYSICS CONSTANTS =====================
    const PHY = {
        Q2: 5.0,
        Q0: 0.60,
        lambdaQCD: 0.217,
        autoEvolve: true,
        animSpeed: 1.0,
        showBands: true,
    };

    const M_C = 1.27, M_B = 4.18, M_T = 172.76;
    const CF = 4 / 3, CA = 3, TR = 0.5;

    function activeNf(Q) {
        if (Q > M_T) return 6;
        if (Q > M_B) return 5;
        if (Q > M_C) return 4;
        return 3;
    }

    function alphaS(Q) {
        const nf = activeNf(Q);
        const b0 = 11 - (2 / 3) * nf;
        const L = Math.log(Q * Q / (PHY.lambdaQCD * PHY.lambdaQCD));
        if (L <= 0) return 1;
        return Math.min((4 * Math.PI) / (b0 * L), 1);
    }

    // ===================== PION PDFs =====================
    // Parameterized model that captures qualitative DGLAP evolution
    // Inspired by the user's HOPPET code: pion valence = d̄ distribution

    function pionValence(x, Q2) {
        // d̄ valence: peaks ~0.25 at low Q², shifts left + shrinks at high Q²
        const t = Math.log(Q2 + 1) / Math.log(100000);
        const A = 2.8 * (1 - t * 0.45);
        const a = 0.5 + t * 0.25;
        const b = 1.2 + t * 1.8;
        return A * Math.pow(x, a) * Math.pow(1 - x, b);
    }

    // Low-x damping: prevents unphysical divergence at x→0
    // Smooth cutoff: (x/x0)^2 / (1 + (x/x0)^2) with x0 ~ 0.005
    function lowXDamp(x) {
        const x0 = 0.005;
        const r = x / x0;
        return (r * r) / (1 + r * r);
    }

    function pionGluon(x, Q2) {
        // Gluon grows at small x with Q², damped at very low x
        const t = Math.log(Q2 + 1) / Math.log(100000);
        const A = (1.5 + t * 28);
        const a = -0.12 - t * 0.18;
        const b = 4.0 + t * 2.5;
        return A * Math.pow(x, a) * Math.pow(1 - x, b) * lowXDamp(x);
    }

    function pionSea(x, Q2) {
        // Sea quarks generated via g→qq̄, damped at very low x
        const t = Math.log(Q2 + 1) / Math.log(100000);
        const A = (0.2 + t * 9);
        const a = -0.08 - t * 0.14;
        const b = 5.5 + t * 2;
        return A * Math.pow(x, a) * Math.pow(1 - x, b) * lowXDamp(x);
    }

    // NLO / NNLO offsets (simulating Q₀ uncertainty)
    function pionValenceNLO(x, Q2, Q0) {
        const shift = (Q0 - 0.6) * 0.8;
        const t = Math.log(Q2 + 1) / Math.log(100000);
        const A = (2.8 + shift * 0.5) * (1 - t * 0.43);
        const a = 0.5 + t * 0.24 + shift * 0.05;
        const b = 1.2 + t * 1.7 - shift * 0.3;
        return A * Math.pow(x, a) * Math.pow(1 - x, b);
    }

    function pionValenceNNLO(x, Q2, Q0) {
        const shift = (Q0 - 0.6) * 0.6;
        const t = Math.log(Q2 + 1) / Math.log(100000);
        const A = (3.0 + shift * 0.4) * (1 - t * 0.46);
        const a = 0.52 + t * 0.26 + shift * 0.04;
        const b = 1.15 + t * 1.85 - shift * 0.25;
        return A * Math.pow(x, a) * Math.pow(1 - x, b);
    }

    // Momentum fraction
    function momentumFrac(fn, Q2) {
        let s = 0;
        const N = 120;
        for (let i = 1; i < N; i++) {
            const x = i / N;
            s += x * fn(x, Q2) / N;
        }
        return s;
    }

    // ===================== SPLITTING FUNCTIONS (for plots) =====================
    function Pqq(z) {
        if (z >= 1 || z <= 0) return 0;
        return CF * (1 + z * z) / (1 - z);
    }
    function Pqg(z) {
        if (z >= 1 || z <= 0) return 0;
        return TR * (z * z + (1 - z) * (1 - z));
    }
    function Pgq(z) {
        if (z >= 1 || z <= 0) return 0;
        return CF * (1 + (1 - z) * (1 - z)) / z;
    }
    function Pgg(z) {
        if (z >= 1 || z <= 0) return 0;
        return 2 * CA * (z / (1 - z) + (1 - z) / z + z * (1 - z));
    }

    // ===================== CANVASES =====================
    const bgCv = document.getElementById('bg-canvas');
    const spCv = document.getElementById('split-canvas');
    const pdfCv = document.getElementById('pdf-canvas');
    const bgCtx = bgCv.getContext('2d');
    const spCtx = spCv.getContext('2d');
    const pdfCtx = pdfCv.getContext('2d');
    let W, H;

    function resize() {
        W = window.innerWidth; H = window.innerHeight;
        [bgCv, spCv, pdfCv].forEach(c => { c.width = W; c.height = H; });
    }
    let _rt;
    window.addEventListener('resize', () => { clearTimeout(_rt); _rt = setTimeout(resize, 80); });
    resize();

    // ===================== COLORS =====================
    const COL = {
        val: '#ff6b8a',
        valGlow: '#ff3366',
        sea: '#b06bff',
        seaGlow: '#9933ff',
        gluon: '#33ffaa',
        gluonGlow: '#00ff88',
        nlo: '#4499ff',
        nnlo: '#ffffff',
        pion: '#ffcc44',
        bg: '#020208',
    };

    // ===================== ORBITING PARTICLES =====================
    // Gluons (spring coils) and sea-quark pairs orbit the central PDF plot

    class OrbitParticle {
        constructor(type) {
            this.type = type; // 'gluon', 'sea', 'antiquark'
            this.angle = Math.random() * Math.PI * 2;
            this.radius = 0;
            this.baseRadius = 0;
            this.speed = (0.3 + Math.random() * 0.6) * (Math.random() < 0.5 ? 1 : -1);
            this.phase = Math.random() * Math.PI * 2;
            this.size = 2 + Math.random() * 3;
            this.trail = [];
            this.maxTrail = 12;
            this.wobble = Math.random() * 15 + 5;
            this.wobbleSpeed = 0.5 + Math.random() * 1.5;
            this.life = 1;
            this.opacity = 0.6 + Math.random() * 0.4;
            // For sea: paired particle
            this.pairAngle = this.angle + Math.PI;
        }

        init(cx, cy, minR, maxR) {
            this.baseRadius = minR + Math.random() * (maxR - minR);
            this.radius = this.baseRadius;
            this.cx = cx;
            this.cy = cy;
        }

        update(dt, t) {
            this.angle += this.speed * 0.003 * dt * PHY.animSpeed;
            this.radius = this.baseRadius + Math.sin(t * 0.001 * this.wobbleSpeed + this.phase) * this.wobble;

            const x = this.cx + Math.cos(this.angle) * this.radius;
            const y = this.cy + Math.sin(this.angle) * this.radius * 0.6; // elliptical

            this.trail.push({ x, y });
            if (this.trail.length > this.maxTrail) this.trail.shift();

            this.x = x;
            this.y = y;
        }
    }

    let orbitParticles = [];
    const NUM_GLUONS = 18;
    const NUM_SEA = 12;

    function initOrbiters() {
        orbitParticles = [];
        const cx = W * 0.5;
        const cy = H * 0.48;
        const minR = Math.min(W, H) * 0.22;
        const maxR = Math.min(W, H) * 0.42;

        for (let i = 0; i < NUM_GLUONS; i++) {
            const p = new OrbitParticle('gluon');
            p.init(cx, cy, minR, maxR);
            orbitParticles.push(p);
        }
        for (let i = 0; i < NUM_SEA; i++) {
            const p = new OrbitParticle('sea');
            p.init(cx, cy, minR * 0.9, maxR * 1.1);
            orbitParticles.push(p);
        }
    }
    initOrbiters();

    // ===================== SPLITTING VERTEX ANIMATIONS =====================
    // Animated splitting events that spawn periodically around the plot

    class SplitEvent {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type; // 'qq', 'qg', 'gq', 'gg'
            this.t = 0;
            this.duration = 120 + Math.random() * 80;
            this.dead = false;
            this.angle = Math.random() * Math.PI * 2;
            this.spread = 0.4 + Math.random() * 0.3;
        }

        update(dt) {
            this.t += dt * PHY.animSpeed;
            if (this.t > this.duration) this.dead = true;
        }

        draw(ctx) {
            const progress = Math.min(this.t / this.duration, 1);
            const alpha = progress < 0.2 ? progress / 0.2 : (1 - (progress - 0.2) / 0.8);
            const len = 25 + progress * 35;

            const colors = {
                qq: [COL.val, COL.gluon],
                qg: [COL.gluon, COL.sea],
                gq: [COL.val, COL.gluon],
                gg: [COL.gluon, COL.gluon],
            };

            const [c1, c2] = colors[this.type];

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            // Incoming line
            ctx.beginPath();
            ctx.moveTo(-len * 0.5, 0);
            ctx.lineTo(0, 0);
            ctx.strokeStyle = hexAlpha(c1, 0.5 * alpha);
            ctx.lineWidth = 2;
            ctx.stroke();

            // Outgoing lines (split)
            const s = this.spread * progress;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len * progress, -Math.sin(s) * len * 0.6 * progress);
            ctx.strokeStyle = hexAlpha(c1, 0.6 * alpha);
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len * progress, Math.sin(s) * len * 0.6 * progress);
            ctx.strokeStyle = hexAlpha(c2, 0.6 * alpha);
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Vertex glow
            ctx.beginPath();
            ctx.arc(0, 0, 4 * alpha, 0, Math.PI * 2);
            ctx.fillStyle = hexAlpha('#ffffff', 0.3 * alpha);
            ctx.fill();

            // Outer glow
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fillStyle = hexAlpha(c1, 0.04 * alpha);
            ctx.fill();

            // Label
            if (alpha > 0.3) {
                const labels = { qq: 'q→qg', qg: 'g→qq̄', gq: 'q→gq', gg: 'g→gg' };
                ctx.font = '8px "JetBrains Mono"';
                ctx.fillStyle = hexAlpha('#aaccee', 0.3 * alpha);
                ctx.rotate(-this.angle);
                ctx.fillText(labels[this.type], 6, -10);
            }

            ctx.restore();
        }
    }

    let splitEvents = [];
    let splitSpawnTimer = 0;

    function spawnSplitEvent() {
        const cx = W * 0.5;
        const cy = H * 0.48;
        const r = Math.min(W, H) * (0.2 + Math.random() * 0.25);
        const a = Math.random() * Math.PI * 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.6;
        const types = ['qq', 'qg', 'gq', 'gg'];
        const type = types[Math.floor(Math.random() * types.length)];
        splitEvents.push(new SplitEvent(x, y, type));
        if (splitEvents.length > 15) splitEvents.splice(0, splitEvents.length - 15);
    }

    // ===================== HELPER =====================
    function hexAlpha(hex, a) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`;
    }

    function hexRGB(hex) {
        return {
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16),
        };
    }

    // ===================== DRAW BACKGROUND =====================
    let bgStars = [];
    function initStars() {
        bgStars = [];
        for (let i = 0; i < 200; i++) {
            bgStars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 1.2 + 0.2,
                a: Math.random() * 0.3 + 0.05,
                speed: Math.random() * 0.0005 + 0.0002,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }
    initStars();
    window.addEventListener('resize', () => { setTimeout(initStars, 100); });

    function drawBackground(ctx, t) {
        // Deep void
        ctx.fillStyle = COL.bg;
        ctx.fillRect(0, 0, W, H);

        // Subtle radial nebula glow behind the PDF plot
        const cx = W * 0.5, cy = H * 0.48;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.45);
        grad.addColorStop(0, 'rgba(20, 8, 40, 0.4)');
        grad.addColorStop(0.3, 'rgba(8, 12, 35, 0.25)');
        grad.addColorStop(0.6, 'rgba(4, 8, 20, 0.1)');
        grad.addColorStop(1, 'rgba(2, 2, 8, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Pion-themed warm glow
        const pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.15);
        pg.addColorStop(0, `rgba(255, 200, 68, ${0.02 + Math.sin(t * 0.0008) * 0.01})`);
        pg.addColorStop(1, 'rgba(255, 200, 68, 0)');
        ctx.fillStyle = pg;
        ctx.fillRect(0, 0, W, H);

        // Stars
        for (const s of bgStars) {
            const twinkle = Math.sin(t * s.speed * 8 + s.phase) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180,200,240,${s.a * twinkle})`;
            ctx.fill();
        }
    }

    // ===================== DRAW ORBITERS =====================
    function drawOrbiters(ctx, t) {
        for (const p of orbitParticles) {
            const { r, g, b } = hexRGB(p.type === 'gluon' ? COL.gluon : COL.sea);
            const a = p.opacity;

            // Trail
            for (let i = 0; i < p.trail.length - 1; i++) {
                const ta = (i / p.trail.length) * 0.15 * a;
                ctx.beginPath();
                ctx.moveTo(p.trail[i].x, p.trail[i].y);
                ctx.lineTo(p.trail[i + 1].x, p.trail[i + 1].y);
                ctx.strokeStyle = `rgba(${r},${g},${b},${ta})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }

            // Outer glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${0.04 * a})`;
            ctx.fill();

            if (p.type === 'gluon') {
                // Draw as coiled spring (gluon signature)
                drawMiniCoil(ctx, p.x, p.y, p.size, r, g, b, a, t);
            } else {
                // Sea quark — small dot with partner
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${0.65 * a})`;
                ctx.fill();

                // Anti-quark partner (small offset)
                const ax = p.x + Math.cos(p.angle + Math.PI) * 8;
                const ay = p.y + Math.sin(p.angle + Math.PI) * 5;
                ctx.beginPath();
                ctx.arc(ax, ay, p.size * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${0.35 * a})`;
                ctx.fill();

                // Connection line
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(ax, ay);
                ctx.strokeStyle = `rgba(${r},${g},${b},${0.12 * a})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }

    function drawMiniCoil(ctx, cx, cy, size, r, g, b, alpha, t) {
        const coils = 3;
        const w = size * 2;
        ctx.beginPath();
        for (let i = 0; i <= coils * 8; i++) {
            const frac = i / (coils * 8);
            const ang = frac * coils * Math.PI * 2 + t * 0.005;
            const px = cx + Math.cos(ang) * w * 0.5;
            const py = cy + Math.sin(ang) * w * 0.3 + (frac - 0.5) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 * alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Core dot
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.6 * alpha})`;
        ctx.fill();
    }

    // ===================== DRAW SPLIT EVENTS =====================
    function drawSplitEvents(ctx) {
        for (const ev of splitEvents) {
            if (!ev.dead) ev.draw(ctx);
        }
    }

    // ===================== PDF PLOT (CENTER — LARGE) =====================
    const PLOT = {
        xMin: 0.005,
        xMax: 0.95,
        yMin: 0.005,   // log-scale lower bound
        yMax: 5.0,     // log-scale upper bound
        steps: 200,
    };

    function getPlotRect() {
        // LARGE plot: fills most of the screen center
        const pw = Math.min(W * 0.58, 720);
        const ph = Math.min(H * 0.65, 560);
        const cx = W * 0.5;
        const cy = H * 0.48;
        return {
            left: cx - pw / 2,
            right: cx + pw / 2,
            top: cy - ph / 2,
            bottom: cy + ph / 2,
            width: pw,
            height: ph,
        };
    }

    function xToPixel(x, P) {
        const logMin = Math.log10(PLOT.xMin);
        const logMax = Math.log10(PLOT.xMax);
        const t = (Math.log10(x) - logMin) / (logMax - logMin);
        return P.left + t * P.width;
    }

    // LOG SCALE y-axis
    function yToPixel(y, P) {
        if (y <= 0) y = PLOT.yMin * 0.5;
        const logMin = Math.log10(PLOT.yMin);
        const logMax = Math.log10(PLOT.yMax);
        const t = (Math.log10(Math.max(y, PLOT.yMin * 0.5)) - logMin) / (logMax - logMin);
        return P.bottom - t * P.height;
    }

    function drawPdfPlot(ctx, t) {
        const Q2 = PHY.Q2;
        const P = getPlotRect();

        ctx.save();

        // Plot background (subtle dark)
        ctx.fillStyle = 'rgba(4, 6, 18, 0.35)';
        ctx.fillRect(P.left - 2, P.top - 2, P.width + 4, P.height + 4);

        // ---- BOLD AXES ----
        // Main axes lines
        ctx.strokeStyle = 'rgba(180, 200, 240, 0.5)';
        ctx.lineWidth = 2.5;
        // Bottom axis (x)
        ctx.beginPath();
        ctx.moveTo(P.left, P.bottom);
        ctx.lineTo(P.right, P.bottom);
        ctx.stroke();
        // Left axis (y)
        ctx.beginPath();
        ctx.moveTo(P.left, P.top);
        ctx.lineTo(P.left, P.bottom);
        ctx.stroke();

        // ---- X grid (log scale) ----
        const xGridVals = [0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9];
        for (const xv of xGridVals) {
            const px = xToPixel(xv, P);
            if (px < P.left || px > P.right) continue;
            // Grid line
            ctx.beginPath();
            ctx.moveTo(px, P.top);
            ctx.lineTo(px, P.bottom);
            ctx.strokeStyle = xv === 0.1 || xv === 0.5 ? 'rgba(100,150,220,0.08)' : 'rgba(100,150,220,0.035)';
            ctx.lineWidth = 0.6;
            ctx.stroke();
            // Tick mark
            ctx.beginPath();
            ctx.moveTo(px, P.bottom);
            ctx.lineTo(px, P.bottom + 6);
            ctx.strokeStyle = 'rgba(180,200,240,0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Label
            ctx.font = 'bold 10px "JetBrains Mono"';
            ctx.fillStyle = 'rgba(180,200,240,0.5)';
            ctx.textAlign = 'center';
            ctx.fillText(xv < 0.1 ? xv.toFixed(2) : xv.toFixed(1), px, P.bottom + 20);
        }

        // ---- Y grid (LOG scale) ----
        const yGridVals = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0];
        for (const yv of yGridVals) {
            if (yv < PLOT.yMin || yv > PLOT.yMax) continue;
            const py = yToPixel(yv, P);
            if (py < P.top || py > P.bottom) continue;
            // Grid line
            ctx.beginPath();
            ctx.moveTo(P.left, py);
            ctx.lineTo(P.right, py);
            ctx.strokeStyle = (yv === 0.1 || yv === 1.0) ? 'rgba(100,150,220,0.08)' : 'rgba(100,150,220,0.035)';
            ctx.lineWidth = 0.6;
            ctx.stroke();
            // Tick mark
            ctx.beginPath();
            ctx.moveTo(P.left - 6, py);
            ctx.lineTo(P.left, py);
            ctx.strokeStyle = 'rgba(180,200,240,0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Label
            ctx.font = 'bold 10px "JetBrains Mono"';
            ctx.fillStyle = 'rgba(180,200,240,0.5)';
            ctx.textAlign = 'right';
            const ylbl = yv >= 1 ? yv.toFixed(0) : (yv >= 0.1 ? yv.toFixed(1) : yv.toFixed(2));
            ctx.fillText(ylbl, P.left - 10, py + 4);
        }

        // ---- BOLD Axis Labels ----
        ctx.font = 'bold 14px "JetBrains Mono"';
        ctx.fillStyle = 'rgba(200,220,250,0.65)';
        ctx.textAlign = 'center';
        ctx.fillText('x', (P.left + P.right) / 2, P.bottom + 38);
        ctx.save();
        ctx.translate(P.left - 42, (P.top + P.bottom) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('x · f(x, Q²)', 0, 0);
        ctx.restore();

        // ---- Q² title ----
        ctx.font = 'bold 14px "Space Grotesk"';
        ctx.fillStyle = 'rgba(255,204,68,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText(`π⁺ PDFs at Q² = ${Q2.toFixed(1)} GeV²`, (P.left + P.right) / 2, P.top - 18);

        // ---- Draw NLO / NNLO bands ----
        if (PHY.showBands) {
            const Q0_list = [PHY.Q0 - 0.10, PHY.Q0, PHY.Q0 + 0.10];
            drawBand(ctx, P, Q2, Q0_list, pionValenceNLO, COL.nlo, 0.15, 2, [6, 4]);
            drawBand(ctx, P, Q2, Q0_list, pionValenceNNLO, COL.nnlo, 0.12, 2.5, []);
        }

        // ---- Main PDF curves: VALENCE + GLUON only ----
        const pdfs = [
            { fn: pionValence, label: 'x·v(x) Valence', color: COL.val, w: 3 },
            { fn: (x, q2) => pionGluon(x, q2) / 10, label: 'x·g(x)/10 Gluon', color: COL.gluon, w: 2.5 },
        ];

        for (const pdf of pdfs) {
            drawPdfCurve(ctx, P, Q2, pdf.fn, pdf.color, pdf.w, pdf.label);
        }

        ctx.restore();
    }

    function drawPdfCurve(ctx, P, Q2, fn, color, lineW, label) {
        const { r, g, b } = hexRGB(color);
        const logMin = Math.log10(PLOT.xMin);
        const logMax = Math.log10(PLOT.xMax);
        const pts = [];

        for (let i = 0; i <= PLOT.steps; i++) {
            const logX = logMin + (i / PLOT.steps) * (logMax - logMin);
            const x = Math.pow(10, logX);
            const y = x * fn(x, Q2);
            // Clamp to plot range for log y-axis
            const clampedY = Math.max(y, PLOT.yMin * 0.5);
            const py = yToPixel(Math.min(clampedY, PLOT.yMax), P);
            // Clip to plot bounds
            const clippedPy = Math.max(P.top, Math.min(P.bottom, py));
            pts.push({
                px: xToPixel(x, P),
                py: clippedPy,
                y: y,
            });
        }

        // Filled area (subtle)
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
            if (i === 0) ctx.moveTo(pts[i].px, pts[i].py);
            else ctx.lineTo(pts[i].px, pts[i].py);
        }
        ctx.lineTo(pts[pts.length - 1].px, P.bottom);
        ctx.lineTo(pts[0].px, P.bottom);
        ctx.closePath();
        ctx.fillStyle = `rgba(${r},${g},${b},0.04)`;
        ctx.fill();

        // Glow stroke
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
            if (i === 0) ctx.moveTo(pts[i].px, pts[i].py);
            else ctx.lineTo(pts[i].px, pts[i].py);
        }
        ctx.strokeStyle = `rgba(${r},${g},${b},0.15)`;
        ctx.lineWidth = lineW + 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Core stroke (bold)
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
            if (i === 0) ctx.moveTo(pts[i].px, pts[i].py);
            else ctx.lineTo(pts[i].px, pts[i].py);
        }
        ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`;
        ctx.lineWidth = lineW;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Label at peak
        let peakI = 0, peakY = 0;
        for (let i = 0; i < pts.length; i++) {
            if (pts[i].y > peakY) { peakY = pts[i].y; peakI = i; }
        }
        ctx.font = 'bold 11px "JetBrains Mono"';
        ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
        ctx.textAlign = 'left';
        ctx.fillText(label, pts[peakI].px + 10, pts[peakI].py - 8);
    }

    function drawBand(ctx, P, Q2, Q0_list, fn, color, bandAlpha, lineW, dash) {
        const { r, g, b } = hexRGB(color);
        const logMin = Math.log10(PLOT.xMin);
        const logMax = Math.log10(PLOT.xMax);

        const centralPts = [];
        const minPts = [];
        const maxPts = [];

        for (let i = 0; i <= PLOT.steps; i++) {
            const logX = logMin + (i / PLOT.steps) * (logMax - logMin);
            const x = Math.pow(10, logX);
            const vals = Q0_list.map(q0 => x * fn(x, Q2, q0));
            const central = Math.max(vals[1], PLOT.yMin * 0.5);
            const mn = Math.max(Math.min(...vals), PLOT.yMin * 0.5);
            const mx = Math.max(Math.max(...vals), PLOT.yMin * 0.5);
            const px = xToPixel(x, P);
            const clipY = (y) => Math.max(P.top, Math.min(P.bottom, yToPixel(Math.min(y, PLOT.yMax), P)));
            centralPts.push({ px, py: clipY(central) });
            minPts.push({ px, py: clipY(mn) });
            maxPts.push({ px, py: clipY(mx) });
        }

        // Band fill
        ctx.beginPath();
        for (let i = 0; i < maxPts.length; i++) {
            if (i === 0) ctx.moveTo(maxPts[i].px, maxPts[i].py);
            else ctx.lineTo(maxPts[i].px, maxPts[i].py);
        }
        for (let i = minPts.length - 1; i >= 0; i--) {
            ctx.lineTo(minPts[i].px, minPts[i].py);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(${r},${g},${b},${bandAlpha})`;
        ctx.fill();

        // Central line
        ctx.beginPath();
        ctx.setLineDash(dash);
        for (let i = 0; i < centralPts.length; i++) {
            if (i === 0) ctx.moveTo(centralPts[i].px, centralPts[i].py);
            else ctx.lineTo(centralPts[i].px, centralPts[i].py);
        }
        ctx.strokeStyle = `rgba(${r},${g},${b},0.7)`;
        ctx.lineWidth = lineW;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // ===================== PION MINI DIAGRAM =====================
    const pionMiniCv = document.getElementById('pion-mini-canvas');
    const pionMiniCtx = pionMiniCv ? pionMiniCv.getContext('2d') : null;

    function drawPionMini(ctx, t) {
        if (!ctx) return;
        const w = 190, h = 100;
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2, cy = h / 2;

        // Pion cloud
        const pulse = Math.sin(t * 0.002) * 0.15 + 0.85;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 38 * pulse);
        grad.addColorStop(0, 'rgba(255, 204, 68, 0.15)');
        grad.addColorStop(0.5, 'rgba(255, 136, 68, 0.06)');
        grad.addColorStop(1, 'rgba(255, 100, 50, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 38, 0, Math.PI * 2);
        ctx.fill();

        // u quark
        const uAngle = t * 0.003;
        const ux = cx + Math.cos(uAngle) * 14;
        const uy = cy + Math.sin(uAngle) * 10;
        ctx.beginPath();
        ctx.arc(ux, uy, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 107, 138, 0.8)';
        ctx.fill();
        ctx.font = '8px "JetBrains Mono"';
        ctx.fillStyle = 'rgba(255, 107, 138, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('u', ux, uy - 7);

        // d̄ quark
        const dAngle = t * 0.003 + Math.PI;
        const dx = cx + Math.cos(dAngle) * 14;
        const dy = cy + Math.sin(dAngle) * 10;
        ctx.beginPath();
        ctx.arc(dx, dy, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(68, 170, 255, 0.8)';
        ctx.fill();
        ctx.fillStyle = 'rgba(68, 170, 255, 0.6)';
        ctx.fillText('d̄', dx, dy - 7);

        // Gluon exchange (spring between quarks)
        ctx.beginPath();
        const coils = 4;
        for (let i = 0; i <= coils * 6; i++) {
            const frac = i / (coils * 6);
            const mx = ux + (dx - ux) * frac;
            const my = uy + (dy - uy) * frac;
            const perp = Math.sin(frac * coils * Math.PI * 2 + t * 0.005) * 5;
            const angle = Math.atan2(dy - uy, dx - ux);
            const ox = mx + Math.cos(angle + Math.PI / 2) * perp;
            const oy = my + Math.sin(angle + Math.PI / 2) * perp;
            if (i === 0) ctx.moveTo(ox, oy);
            else ctx.lineTo(ox, oy);
        }
        ctx.strokeStyle = 'rgba(51, 255, 170, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Orbiting sea quarks
        for (let i = 0; i < 3; i++) {
            const sa = t * 0.002 * (1 + i * 0.3) + i * Math.PI * 2 / 3;
            const sr = 28 + Math.sin(t * 0.001 + i) * 4;
            const sx = cx + Math.cos(sa) * sr;
            const sy = cy + Math.sin(sa) * sr * 0.7;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(176, 107, 255, 0.4)';
            ctx.fill();
        }

        // Orbiting gluons
        for (let i = 0; i < 2; i++) {
            const ga = -t * 0.0015 + i * Math.PI;
            const gr = 32 + Math.sin(t * 0.0012 + i * 2) * 4;
            const gx = cx + Math.cos(ga) * gr;
            const gy = cy + Math.sin(ga) * gr * 0.7;
            ctx.beginPath();
            ctx.arc(gx, gy, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(51, 255, 170, 0.35)';
            ctx.fill();
        }

        // Label
        ctx.font = '9px "Space Grotesk"';
        ctx.fillStyle = 'rgba(255, 204, 68, 0.3)';
        ctx.textAlign = 'center';
        ctx.fillText('π⁺', cx, h - 6);
    }

    // ===================== SPLITTING FUNCTION MINI CANVASES =====================
    const miniCanvases = {
        qq: document.getElementById('mini-qq'),
        qg: document.getElementById('mini-qg'),
        gq: document.getElementById('mini-gq'),
        gg: document.getElementById('mini-gg'),
    };
    const miniCtxs = {};
    for (const key in miniCanvases) {
        if (miniCanvases[key]) miniCtxs[key] = miniCanvases[key].getContext('2d');
    }

    function drawSplitMini(key, ctx, t) {
        if (!ctx) return;
        const s = 40;
        ctx.clearRect(0, 0, s, s);

        const cx = s / 2, cy = s / 2;
        const phase = t * 0.003;
        const spread = Math.sin(phase) * 0.3 + 0.7;

        const configs = {
            qq: { c1: COL.val, c2: COL.gluon, l1: 'q', l2: 'g' },
            qg: { c1: COL.gluon, c2: COL.sea, l1: 'q', l2: 'q̄' },
            gq: { c1: COL.val, c2: COL.gluon, l1: 'g', l2: 'q' },
            gg: { c1: COL.gluon, c2: COL.gluon, l1: 'g', l2: 'g' },
        };
        const cfg = configs[key];

        // Incoming
        ctx.beginPath();
        ctx.moveTo(2, cy);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = hexAlpha(cfg.c1, 0.5);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Vertex
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fillStyle = hexAlpha('#ffffff', 0.5);
        ctx.fill();

        // Outgoing
        const a1 = -spread * 0.5;
        const a2 = spread * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a1) * 16, cy + Math.sin(a1) * 14);
        ctx.strokeStyle = hexAlpha(cfg.c1, 0.6);
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a2) * 16, cy + Math.sin(a2) * 14);
        ctx.strokeStyle = hexAlpha(cfg.c2, 0.6);
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    // ===================== UI UPDATES =====================
    function updateUI() {
        const Q = Math.sqrt(PHY.Q2);
        const nf = activeNf(Q);
        const as = alphaS(Q);

        document.getElementById('q2-val').textContent = PHY.Q2.toFixed(1);
        document.getElementById('q-val').textContent = Q.toFixed(2);
        document.getElementById('alphas-val').textContent = as.toFixed(4);
        document.getElementById('nf-val').textContent = nf;

        // Momentum fractions
        const mV = momentumFrac(pionValence, PHY.Q2) * 2; // u + d̄
        const mS = momentumFrac(pionSea, PHY.Q2) * 4;
        const mG = momentumFrac(pionGluon, PHY.Q2);
        const total = mV + mS + mG + 0.001;

        const pV = (mV / total * 100);
        const pS = (mS / total * 100);
        const pG = (mG / total * 100);

        document.getElementById('bar-val').style.width = pV + '%';
        document.getElementById('bar-sea').style.width = pS + '%';
        document.getElementById('bar-gluon').style.width = pG + '%';

        document.getElementById('pct-val').textContent = pV.toFixed(0) + '%';
        document.getElementById('pct-sea').textContent = pS.toFixed(0) + '%';
        document.getElementById('pct-gluon').textContent = pG.toFixed(0) + '%';

        // Active splitting highlight
        const splitIds = ['split-qq', 'split-qg', 'split-gq', 'split-gg'];
        const activeIdx = Math.floor((performance.now() * 0.0004) % 4);
        splitIds.forEach((id, i) => {
            document.getElementById(id).classList.toggle('active-split', i === activeIdx);
        });

        // Splitting rates (approximate)
        document.getElementById('rate-qq').textContent = `α_s·C_F = ${(as * CF).toFixed(3)}`;
        document.getElementById('rate-qg').textContent = `α_s·T_R = ${(as * TR).toFixed(3)}`;
        document.getElementById('rate-gq').textContent = `α_s·C_F = ${(as * CF).toFixed(3)}`;
        document.getElementById('rate-gg').textContent = `α_s·C_A = ${(as * CA).toFixed(3)}`;

        document.getElementById('split-count').textContent = splitEvents.filter(e => !e.dead).length;
    }

    // ===================== FPS =====================
    let frameCount = 0, lastFpsTime = performance.now();
    function updateFps() {
        frameCount++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
            document.getElementById('fps-value').textContent = frameCount;
            frameCount = 0;
            lastFpsTime = now;
        }
    }

    // ===================== MAIN LOOP =====================
    let evoPhase = 0;
    let lastTime = performance.now();

    function animate(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 16.67, 3);
        lastTime = timestamp;

        // Auto-evolve Q²
        if (PHY.autoEvolve) {
            evoPhase += 0.00025 * dt * PHY.animSpeed;
            if (evoPhase > 1) evoPhase -= 1;
            const t01 = (Math.sin(evoPhase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
            PHY.Q2 = Math.pow(10, 0 + t01 * 10);
            document.getElementById('q2-slider').value = Math.log(PHY.Q2);
        }

        // Update orbiters
        const cx = W * 0.5, cy = H * 0.48;
        for (const p of orbitParticles) {
            p.cx = cx;
            p.cy = cy;
            p.update(dt, timestamp);
        }

        // Spawn split events
        splitSpawnTimer += dt * PHY.animSpeed;
        if (splitSpawnTimer > 12) {
            splitSpawnTimer = 0;
            spawnSplitEvent();
        }

        // Update split events
        for (let i = splitEvents.length - 1; i >= 0; i--) {
            splitEvents[i].update(dt);
            if (splitEvents[i].dead) splitEvents.splice(i, 1);
        }

        // ---- RENDER ----
        drawBackground(bgCtx, timestamp);

        spCtx.clearRect(0, 0, W, H);
        drawOrbiters(spCtx, timestamp);
        drawSplitEvents(spCtx);

        pdfCtx.clearRect(0, 0, W, H);
        drawPdfPlot(pdfCtx, timestamp);

        // Mini canvases
        drawPionMini(pionMiniCtx, timestamp);
        for (const key in miniCtxs) {
            drawSplitMini(key, miniCtxs[key], timestamp);
        }

        updateUI();
        updateFps();
        requestAnimationFrame(animate);
    }

    // ===================== CONTROLS =====================
    function initControls() {
        document.getElementById('q2-slider').addEventListener('input', e => {
            PHY.Q2 = Math.exp(parseFloat(e.target.value));
            PHY.autoEvolve = false;
            document.getElementById('auto-toggle').checked = false;
        });

        document.getElementById('q0-slider').addEventListener('input', e => {
            PHY.Q0 = parseFloat(e.target.value);
        });

        document.getElementById('speed-slider').addEventListener('input', e => {
            PHY.animSpeed = parseFloat(e.target.value);
        });

        document.getElementById('auto-toggle').addEventListener('change', e => {
            PHY.autoEvolve = e.target.checked;
        });

        document.getElementById('band-toggle').addEventListener('change', e => {
            PHY.showBands = e.target.checked;
        });

        document.getElementById('toggle-ui').addEventListener('click', () => {
            document.getElementById('ui-overlay').classList.toggle('hidden');
        });

        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        });

        // Click on split items to highlight
        document.querySelectorAll('.split-item').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('.split-item').forEach(s => s.classList.remove('active-split'));
                el.classList.add('active-split');
            });
        });
    }

    // ===================== INIT =====================
    function init() {
        initOrbiters();
        initControls();
        requestAnimationFrame(animate);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

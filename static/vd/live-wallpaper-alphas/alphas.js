/* ==============================================
   α_s(Q²) — RUNNING COUPLING CONSTANT WALLPAPER
   ==============================================
   Physics:
   - 1-loop: α_s = 4π / [β₀ ln(Q²/Λ²)]
   - 2-loop: α_s = (4π/β₀L)[1 - (β₁ ln L)/(β₀²L)]
   - 3-loop: includes β₂ corrections
   - Flavor thresholds at m_c, m_b, m_t
   - Landau pole at Q = Λ_QCD

   Visualization:
   - Animated α_s(Q²) curve with glow
   - Background gradient: warm(confinement) → cool(freedom)
   - Quarks: tightly bound blobs at low Q², free at high Q²
   - Scanning marker showing current Q position
   - Flavor threshold vertical lines
   - Landau pole explosion effect
   ============================================== */

(function () {
    'use strict';

    // ========== PHYSICS CONSTANTS ==========
    const PHYSICS = {
        lambdaQCD: 0.217,    // GeV
        nf: 5,
        order: 1,            // 1, 2, or 3 loop
        // Quark mass thresholds (GeV)
        m_c: 1.27,
        m_b: 4.18,
        m_t: 172.76,
        M_Z: 91.187,
        // Current scan position
        Q: 91.2,
        // World average
        alpha_MZ: 0.1179,
    };

    // β-function coefficients
    function getBeta0(nf) { return 11 - (2 / 3) * nf; }
    function getBeta1(nf) { return 102 - (38 / 3) * nf; }
    function getBeta2(nf) { return 2857 / 2 - (5033 / 18) * nf + (325 / 54) * nf * nf; }

    // Number of active flavors at scale Q
    function activeNf(Q) {
        if (Q > PHYSICS.m_t) return 6;
        if (Q > PHYSICS.m_b) return 5;
        if (Q > PHYSICS.m_c) return 4;
        return 3;
    }

    // α_s at 1-loop
    function alpha1loop(Q, Lambda, nf) {
        const L = Math.log(Q * Q / (Lambda * Lambda));
        if (L <= 0) return 5; // near/below Landau pole, cap
        const b0 = getBeta0(nf);
        return (4 * Math.PI) / (b0 * L);
    }

    // α_s at 2-loop
    function alpha2loop(Q, Lambda, nf) {
        const L = Math.log(Q * Q / (Lambda * Lambda));
        if (L <= 0) return 5;
        const b0 = getBeta0(nf);
        const b1 = getBeta1(nf);
        const a1 = (4 * Math.PI) / (b0 * L);
        const correction = 1 - (b1 * Math.log(L)) / (b0 * b0 * L);
        return a1 * correction;
    }

    // α_s at 3-loop (approximate)
    function alpha3loop(Q, Lambda, nf) {
        const L = Math.log(Q * Q / (Lambda * Lambda));
        if (L <= 0) return 5;
        const b0 = getBeta0(nf);
        const b1 = getBeta1(nf);
        const b2 = getBeta2(nf);
        const lnL = Math.log(L);
        const a1 = (4 * Math.PI) / (b0 * L);
        const c1 = -(b1 * lnL) / (b0 * b0 * L);
        const c2 = (b1 * b1 * (lnL * lnL - lnL - 1) + b0 * b2) / (b0 * b0 * b0 * b0 * L * L);
        return a1 * (1 + c1 + c2);
    }

    function getAlphaS(Q, Lambda, nf, order) {
        Lambda = Lambda || PHYSICS.lambdaQCD;
        nf = nf !== undefined ? nf : activeNf(Q);
        order = order || PHYSICS.order;
        let a;
        switch (order) {
            case 1: a = alpha1loop(Q, Lambda, nf); break;
            case 2: a = alpha2loop(Q, Lambda, nf); break;
            case 3: a = alpha3loop(Q, Lambda, nf); break;
            default: a = alpha1loop(Q, Lambda, nf);
        }
        return Math.max(0, Math.min(a, 5));
    }

    // ========== CANVAS SETUP ==========
    const bgCv = document.getElementById('bg-canvas');
    const plotCv = document.getElementById('plot-canvas');
    const fxCv = document.getElementById('fx-canvas');
    const bgCtx = bgCv.getContext('2d');
    const plotCtx = plotCv.getContext('2d');
    const fxCtx = fxCv.getContext('2d');
    let W, H;

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        [bgCv, plotCv, fxCv].forEach(c => { c.width = W; c.height = H; });
    }

    let _rt;
    window.addEventListener('resize', () => { clearTimeout(_rt); _rt = setTimeout(resize, 80); });
    resize();

    // ========== PLOT AREA ==========
    // The α_s plot occupies a region of the screen
    const PLOT = {
        // Q range: 0.1 to 1000 GeV (log scale)
        qMin: 0.15,
        qMax: 1500,
        // α_s range: 0 to 1.5
        aMin: 0,
        aMax: 1.6,

        // Pixel margins
        get left() { return W * 0.12; },
        get right() { return W * 0.88; },
        get top() { return H * 0.12; },
        get bottom() { return H * 0.88; },
        get width() { return this.right - this.left; },
        get height() { return this.bottom - this.top; },

        // Q (GeV) → pixel x (log scale)
        qToX(Q) {
            const logMin = Math.log10(this.qMin);
            const logMax = Math.log10(this.qMax);
            const t = (Math.log10(Q) - logMin) / (logMax - logMin);
            return this.left + t * this.width;
        },

        // α_s → pixel y
        aToY(a) {
            const t = (a - this.aMin) / (this.aMax - this.aMin);
            return this.bottom - t * this.height;
        },

        // Pixel x → Q
        xToQ(x) {
            const logMin = Math.log10(this.qMin);
            const logMax = Math.log10(this.qMax);
            const t = (x - this.left) / this.width;
            return Math.pow(10, logMin + t * (logMax - logMin));
        }
    };

    // ========== QUARK PARTICLES ==========
    // Quarks shown as particles: bound at low Q², free at high Q²
    class Quark {
        constructor() {
            this.reset();
        }
        reset() {
            this.Q = 0.3 + Math.random() * 800; // energy scale position
            this.baseX = PLOT.qToX(this.Q);
            this.baseY = PLOT.aToY(getAlphaS(this.Q, PHYSICS.lambdaQCD, activeNf(this.Q), PHYSICS.order));
            this.x = this.baseX;
            this.y = this.baseY;
            this.offsetX = 0;
            this.offsetY = 0;
            // Color based on QCD: red, green, blue
            this.color = Math.floor(Math.random() * 3);
            this.size = 1 + Math.random() * 2;
            this.phase = Math.random() * Math.PI * 2;
            this.orbitSpeed = 0.01 + Math.random() * 0.02;
        }
        update(dt) {
            const alpha = getAlphaS(this.Q, PHYSICS.lambdaQCD, activeNf(this.Q), PHYSICS.order);
            this.baseX = PLOT.qToX(this.Q);
            this.baseY = PLOT.aToY(alpha);

            // Orbit amplitude proportional to coupling strength
            // Strong coupling = tightly bound (small orbit)
            // Weak coupling = free (large drift)
            const bindingStrength = Math.min(alpha, 2);
            const freedom = Math.max(0, 1 - bindingStrength);
            const orbitRadius = 3 + freedom * 30;

            this.phase += this.orbitSpeed * dt;
            this.offsetX = Math.cos(this.phase) * orbitRadius;
            this.offsetY = Math.sin(this.phase * 1.3) * orbitRadius;

            this.x = this.baseX + this.offsetX;
            this.y = this.baseY + this.offsetY;
        }
        draw(ctx) {
            const colors = ['#ff3355', '#33ff88', '#3388ff'];
            const c = colors[this.color];
            const r = parseInt(c.slice(1, 3), 16);
            const g = parseInt(c.slice(3, 5), 16);
            const b = parseInt(c.slice(5, 7), 16);

            // Glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},0.06)`;
            ctx.fill();
            // Core
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
            ctx.fill();
        }
    }

    const quarks = [];
    function initQuarks() {
        quarks.length = 0;
        for (let i = 0; i < 80; i++) quarks.push(new Quark());
    }

    // ========== BACKGROUND ==========
    function drawBackground(ctx) {
        // Gradient from warm (left = low Q, confinement) to cool (right = high Q, freedom)
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, 'rgba(60, 10, 10, 0.15)');
        grad.addColorStop(0.15, 'rgba(50, 15, 5, 0.08)');
        grad.addColorStop(0.5, 'rgba(5, 8, 20, 0.02)');
        grad.addColorStop(1, 'rgba(5, 15, 40, 0.08)');
        ctx.fillStyle = '#030308';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Subtle radial glow at center
        const rGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.5);
        rGrad.addColorStop(0, 'rgba(30, 50, 80, 0.03)');
        rGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rGrad;
        ctx.fillRect(0, 0, W, H);
    }

    // ========== PLOT GRID ==========
    function drawGrid(ctx) {
        ctx.save();

        // Horizontal grid lines (α_s values)
        const alphaValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.4];
        for (const a of alphaValues) {
            const y = PLOT.aToY(a);
            ctx.beginPath();
            ctx.moveTo(PLOT.left, y);
            ctx.lineTo(PLOT.right, y);
            ctx.strokeStyle = a === 0.5 || a === 1.0 ? 'rgba(100,150,220,0.06)' : 'rgba(100,150,220,0.025)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Labels
            ctx.font = '10px "JetBrains Mono"';
            ctx.fillStyle = 'rgba(140,170,210,0.18)';
            ctx.textAlign = 'right';
            ctx.fillText(a.toFixed(1), PLOT.left - 8, y + 3);
        }

        // Vertical grid lines (Q values in GeV, log scale)
        const qValues = [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
        for (const q of qValues) {
            const x = PLOT.qToX(q);
            ctx.beginPath();
            ctx.moveTo(x, PLOT.top);
            ctx.lineTo(x, PLOT.bottom);
            ctx.strokeStyle = q === 1 || q === 10 || q === 100 ? 'rgba(100,150,220,0.06)' : 'rgba(100,150,220,0.025)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Labels
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(140,170,210,0.18)';
            ctx.fillText(q >= 1 ? q.toString() : q.toFixed(1), x, PLOT.bottom + 16);
        }

        // Axis labels
        ctx.font = '11px "JetBrains Mono"';
        ctx.fillStyle = 'rgba(140,170,210,0.25)';
        ctx.textAlign = 'center';
        ctx.fillText('Q (GeV)', (PLOT.left + PLOT.right) / 2, PLOT.bottom + 36);

        ctx.save();
        ctx.translate(PLOT.left - 40, (PLOT.top + PLOT.bottom) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('αₛ(Q)', 0, 0);
        ctx.restore();

        ctx.restore();
    }

    // ========== FLAVOR THRESHOLDS ==========
    function drawThresholds(ctx, t) {
        const thresholds = [
            { Q: PHYSICS.m_c, label: 'mꜱ ≈ 1.27', color: '#ffaa33', name: 'charm' },
            { Q: PHYSICS.m_b, label: 'mᵦ ≈ 4.18', color: '#33ddaa', name: 'bottom' },
            { Q: PHYSICS.M_Z, label: 'M_Z ≈ 91.2', color: '#44ccff', name: 'Z boson' },
            { Q: PHYSICS.m_t, label: 'mₜ ≈ 173', color: '#aa66ff', name: 'top' },
        ];

        for (const th of thresholds) {
            const x = PLOT.qToX(th.Q);
            const pulse = Math.sin(t * 0.002 + thresholds.indexOf(th)) * 0.15 + 0.85;

            // Dashed line
            ctx.beginPath();
            ctx.setLineDash([4, 6]);
            ctx.moveTo(x, PLOT.top);
            ctx.lineTo(x, PLOT.bottom);
            ctx.strokeStyle = th.color.replace(')', '') + '33';
            // Make it semi-transparent
            const r = parseInt(th.color.slice(1, 3), 16);
            const g = parseInt(th.color.slice(3, 5), 16);
            const b = parseInt(th.color.slice(5, 7), 16);
            ctx.strokeStyle = `rgba(${r},${g},${b},${0.12 * pulse})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);

            // Label
            ctx.font = '9px "JetBrains Mono"';
            ctx.fillStyle = `rgba(${r},${g},${b},${0.3 * pulse})`;
            ctx.textAlign = 'center';
            ctx.fillText(th.label, x, PLOT.top - 8);
        }

        // Λ_QCD vertical band
        const lambdaX = PLOT.qToX(PHYSICS.lambdaQCD);
        const bandWidth = 20;
        const lambdaGrad = ctx.createLinearGradient(lambdaX - bandWidth, 0, lambdaX + bandWidth, 0);
        lambdaGrad.addColorStop(0, 'rgba(255,40,40,0)');
        lambdaGrad.addColorStop(0.5, 'rgba(255,40,40,0.06)');
        lambdaGrad.addColorStop(1, 'rgba(255,40,40,0)');
        ctx.fillStyle = lambdaGrad;
        ctx.fillRect(lambdaX - bandWidth, PLOT.top, bandWidth * 2, PLOT.height);

        ctx.font = '10px "JetBrains Mono"';
        ctx.fillStyle = 'rgba(255,80,80,0.35)';
        ctx.textAlign = 'center';
        ctx.fillText('Λ_QCD', lambdaX, PLOT.bottom + 16);
    }

    // ========== α_s CURVE ==========
    function drawAlphaCurve(ctx, t) {
        const steps = 300;
        const logMin = Math.log10(PLOT.qMin);
        const logMax = Math.log10(PLOT.qMax);

        // Draw for each loop order (faded background for others)
        const orders = [1, 2, 3];
        const orderColors = ['rgba(68,200,255,', 'rgba(120,180,255,', 'rgba(200,160,255,'];
        const orderWidths = [2.5, 1.5, 1.5];

        for (const ord of orders) {
            const isActive = ord === PHYSICS.order;
            const colorBase = orderColors[ord - 1];
            const width = isActive ? orderWidths[ord - 1] : 0.8;
            const alpha = isActive ? 0.85 : 0.12;

            ctx.beginPath();
            let started = false;

            for (let i = 0; i <= steps; i++) {
                const logQ = logMin + (i / steps) * (logMax - logMin);
                const Q = Math.pow(10, logQ);
                const nf = activeNf(Q);
                const a = getAlphaS(Q, PHYSICS.lambdaQCD, nf, ord);

                if (a > PLOT.aMax + 0.5 || a < PLOT.aMin || isNaN(a)) {
                    started = false;
                    continue;
                }

                const x = PLOT.qToX(Q);
                const y = PLOT.aToY(a);

                if (!started) {
                    ctx.moveTo(x, y);
                    started = true;
                } else {
                    ctx.lineTo(x, y);
                }
            }

            // Glow pass for active order
            if (isActive) {
                ctx.strokeStyle = colorBase + '0.15)';
                ctx.lineWidth = width + 6;
                ctx.lineCap = 'round';
                ctx.stroke();
            }

            // Core line
            ctx.strokeStyle = colorBase + alpha + ')';
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        // Animated pulse along the active curve
        const pulseQ = Math.pow(10, logMin + ((t * 0.0001 * 0.7) % 1) * (logMax - logMin));
        const pulseA = getAlphaS(pulseQ, PHYSICS.lambdaQCD, activeNf(pulseQ), PHYSICS.order);
        if (pulseA < PLOT.aMax && pulseA > PLOT.aMin) {
            const px = PLOT.qToX(pulseQ);
            const py = PLOT.aToY(pulseA);
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(68,220,255,0.5)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(68,220,255,0.08)';
            ctx.fill();
        }
    }

    // ========== SCANNING MARKER ==========
    function drawScanMarker(ctx, t) {
        const Q = PHYSICS.Q;
        const alpha = getAlphaS(Q, PHYSICS.lambdaQCD, activeNf(Q), PHYSICS.order);
        const x = PLOT.qToX(Q);
        const y = PLOT.aToY(Math.min(alpha, PLOT.aMax));

        const pulse = Math.sin(t * 0.004) * 0.2 + 0.8;

        // Vertical scan line
        ctx.beginPath();
        ctx.setLineDash([3, 5]);
        ctx.moveTo(x, PLOT.top);
        ctx.lineTo(x, PLOT.bottom);
        ctx.strokeStyle = `rgba(255,255,255,${0.08 * pulse})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.setLineDash([]);

        // Horizontal line to axis
        if (alpha < PLOT.aMax) {
            ctx.beginPath();
            ctx.setLineDash([3, 5]);
            ctx.moveTo(PLOT.left, y);
            ctx.lineTo(x, y);
            ctx.strokeStyle = `rgba(255,255,255,${0.06 * pulse})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Crosshair at intersection
        if (alpha < PLOT.aMax && alpha > 0) {
            // Outer glow
            ctx.beginPath();
            ctx.arc(x, y, 18, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(68,220,255,${0.06 * pulse})`;
            ctx.fill();

            // Ring
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(68,220,255,${0.5 * pulse})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Dot
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.9 * pulse})`;
            ctx.fill();

            // Value label
            ctx.font = '11px "JetBrains Mono"';
            ctx.fillStyle = `rgba(68,220,255,${0.7 * pulse})`;
            ctx.textAlign = 'left';
            ctx.fillText(`α_s = ${alpha.toFixed(4)}`, x + 14, y - 8);
            ctx.fillStyle = `rgba(180,200,230,${0.4 * pulse})`;
            ctx.fillText(`Q = ${Q.toFixed(1)} GeV`, x + 14, y + 6);
        }
    }

    // ========== LANDAU POLE EFFECT ==========
    function drawLandauPole(ctx, t) {
        const lambdaX = PLOT.qToX(PHYSICS.lambdaQCD);
        const pulse = Math.sin(t * 0.003) * 0.3 + 0.7;

        // Glowing hazard zone
        const grad = ctx.createRadialGradient(lambdaX, PLOT.bottom * 0.5, 0, lambdaX, PLOT.bottom * 0.5, 80);
        grad.addColorStop(0, `rgba(255,40,20,${0.06 * pulse})`);
        grad.addColorStop(0.5, `rgba(255,40,20,${0.02 * pulse})`);
        grad.addColorStop(1, 'rgba(255,40,20,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(lambdaX - 80, PLOT.top, 160, PLOT.height);

        // Sparks near Landau pole
        for (let i = 0; i < 3; i++) {
            const sparkPhase = t * 0.005 + i * 2.1;
            const sx = lambdaX + Math.sin(sparkPhase) * 15;
            const sy = PLOT.top + (Math.sin(sparkPhase * 0.7 + i) * 0.5 + 0.5) * PLOT.height * 0.3;
            const sparkAlpha = (Math.sin(sparkPhase * 3) * 0.5 + 0.5) * 0.4;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,100,50,${sparkAlpha})`;
            ctx.fill();
        }
    }

    // ========== EXPERIMENTAL DATA POINTS (schematic) ==========
    // Some representative measurements
    const DATA_POINTS = [
        { Q: 1.78, alpha: 0.326, err: 0.019, exp: 'τ decay' },
        { Q: 5.0, alpha: 0.214, err: 0.012, exp: 'Υ decays' },
        { Q: 10.0, alpha: 0.178, err: 0.009, exp: 'e⁺e⁻ jets' },
        { Q: 22.0, alpha: 0.150, err: 0.007, exp: 'DIS' },
        { Q: 35.0, alpha: 0.140, err: 0.008, exp: 'e⁺e⁻ shapes' },
        { Q: 44.0, alpha: 0.133, err: 0.006, exp: 'PETRA' },
        { Q: 91.2, alpha: 0.1179, err: 0.001, exp: 'Z pole (LEP)' },
        { Q: 133, alpha: 0.110, err: 0.005, exp: 'LEP-2' },
        { Q: 189, alpha: 0.109, err: 0.004, exp: 'LEP-2' },
        { Q: 206, alpha: 0.108, err: 0.005, exp: 'LEP-2' },
    ];

    function drawDataPoints(ctx, t) {
        for (const dp of DATA_POINTS) {
            const x = PLOT.qToX(dp.Q);
            const y = PLOT.aToY(dp.alpha);
            const yUp = PLOT.aToY(dp.alpha + dp.err);
            const yDn = PLOT.aToY(dp.alpha - dp.err);

            const pulse = Math.sin(t * 0.002 + dp.Q * 0.1) * 0.15 + 0.85;

            // Error bar
            ctx.beginPath();
            ctx.moveTo(x, yUp);
            ctx.lineTo(x, yDn);
            ctx.strokeStyle = `rgba(255,200,80,${0.25 * pulse})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Caps
            ctx.beginPath();
            ctx.moveTo(x - 3, yUp); ctx.lineTo(x + 3, yUp);
            ctx.moveTo(x - 3, yDn); ctx.lineTo(x + 3, yDn);
            ctx.stroke();

            // Data point
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,200,80,${0.7 * pulse})`;
            ctx.fill();
        }
    }

    // ========== UI UPDATES ==========
    function updateUI() {
        const Q = PHYSICS.Q;
        const nf = activeNf(Q);
        const alpha = getAlphaS(Q, PHYSICS.lambdaQCD, nf, PHYSICS.order);

        document.getElementById('alpha-current').textContent = alpha < 5 ? alpha.toFixed(4) : '→ ∞';
        document.getElementById('q-current').textContent = Q.toFixed(1);
        document.getElementById('nf-current').textContent = nf;
        document.getElementById('lambda-val').textContent = (PHYSICS.lambdaQCD * 1000).toFixed(0);
        document.getElementById('beta0-val').textContent = getBeta0(nf).toFixed(0);

        // Color code the coupling value
        const valEl = document.getElementById('alpha-current');
        if (alpha > 1) {
            valEl.style.color = '#ff4466';
        } else if (alpha > 0.3) {
            valEl.style.color = '#ffaa44';
        } else {
            valEl.style.color = '#44ccff';
        }

        // Regime
        const regimeEl = document.getElementById('regime-value');
        if (Q < PHYSICS.lambdaQCD * 1.5) {
            regimeEl.textContent = 'N.P.';
            regimeEl.style.color = '#ff4466';
        } else if (alpha > 0.5) {
            regimeEl.textContent = 'Strong';
            regimeEl.style.color = '#ff8844';
        } else {
            regimeEl.textContent = 'pQCD';
            regimeEl.style.color = '#44ccff';
        }
    }

    // ========== FORMULA DISPLAY ==========
    function updateFormula(order) {
        const display = document.getElementById('formula-display');
        const note = document.getElementById('formula-note');

        if (order === 1) {
            display.querySelector('.formula-text').innerHTML =
                'α<sub>s</sub>(Q²) = <span class="f-frac"><span class="f-num">4π</span><span class="f-den">β₀ · ln(Q²/Λ²)</span></span>';
            note.textContent = 'β₀ = 11 − ⅔ nf';
        } else if (order === 2) {
            display.querySelector('.formula-text').innerHTML =
                'α<sub>s</sub> = <span class="f-frac"><span class="f-num">4π</span><span class="f-den">β₀L</span></span> · [1 − <span class="f-frac"><span class="f-num">β₁ ln L</span><span class="f-den">β₀² L</span></span>]';
            note.textContent = 'L = ln(Q²/Λ²),  β₁ = 102 − 38/3 nf';
        } else {
            display.querySelector('.formula-text').innerHTML =
                'α<sub>s</sub> = <span class="f-frac"><span class="f-num">4π</span><span class="f-den">β₀L</span></span> · [1 − <span class="f-frac"><span class="f-num">β₁ ln L</span><span class="f-den">β₀² L</span></span> + <span class="f-frac"><span class="f-num">β₁²(ln²L − lnL − 1) + β₀β₂</span><span class="f-den">β₀⁴ L²</span></span>]';
            note.textContent = 'β₂ = 2857/2 − 5033/18 nf + 325/54 nf²';
        }
    }

    // ========== FPS ==========
    let frameCount = 0, lastFpsTime = performance.now();
    const fpsEl = document.getElementById('fps-value');
    function updateFps() {
        frameCount++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
            fpsEl.textContent = frameCount;
            frameCount = 0;
            lastFpsTime = now;
        }
    }

    // ========== AUTO-SCAN ==========
    let autoScan = true;
    let scanPhase = 0;

    // ========== MAIN LOOP ==========
    let lastTime = performance.now();

    function animate(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 16.67, 3);
        lastTime = timestamp;

        // Auto-scan Q through energy scales
        if (autoScan) {
            scanPhase += 0.0004 * dt;
            if (scanPhase > 1) scanPhase -= 1;
            // Sweep Q logarithmically
            const logMin = Math.log10(0.3);
            const logMax = Math.log10(800);
            // Use a smooth oscillation
            const t01 = (Math.sin(scanPhase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
            PHYSICS.Q = Math.pow(10, logMin + t01 * (logMax - logMin));
            document.getElementById('q-slider').value = PHYSICS.Q;
        }

        // Background
        drawBackground(bgCtx);

        // Plot layer
        plotCtx.clearRect(0, 0, W, H);
        drawGrid(plotCtx);
        drawThresholds(plotCtx, timestamp);
        drawLandauPole(plotCtx, timestamp);
        drawDataPoints(plotCtx, timestamp);
        drawAlphaCurve(plotCtx, timestamp);
        drawScanMarker(plotCtx, timestamp);

        // Quarks on FX layer
        fxCtx.clearRect(0, 0, W, H);
        for (const q of quarks) {
            q.update(dt);
            q.draw(fxCtx);
        }

        updateUI();
        updateFps();
        requestAnimationFrame(animate);
    }

    // ========== CONTROLS ==========
    function initControls() {
        document.getElementById('q-slider').addEventListener('input', e => {
            PHYSICS.Q = parseFloat(e.target.value);
            autoScan = false;
        });

        document.getElementById('nf-slider').addEventListener('input', e => {
            // Override active flavors (manual mode)
        });

        document.getElementById('lambda-slider').addEventListener('input', e => {
            PHYSICS.lambdaQCD = parseInt(e.target.value) / 1000;
        });

        // Formula tabs
        document.querySelectorAll('.formula-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.formula-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                PHYSICS.order = parseInt(tab.dataset.order);
                updateFormula(PHYSICS.order);
            });
        });

        // Click on plot to set Q
        plotCv.addEventListener('click', e => {
            const Q = PLOT.xToQ(e.clientX);
            if (Q > PLOT.qMin && Q < PLOT.qMax) {
                PHYSICS.Q = Q;
                document.getElementById('q-slider').value = Q;
                autoScan = false;
            }
        });

        // Double-click to restart auto-scan
        plotCv.addEventListener('dblclick', () => {
            autoScan = true;
        });

        document.getElementById('toggle-ui').addEventListener('click', () => {
            document.querySelector('.ui-overlay').classList.toggle('hidden');
        });

        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        });
    }

    // ========== INIT ==========
    function init() {
        initQuarks();
        initControls();
        updateFormula(1);
        requestAnimationFrame(animate);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

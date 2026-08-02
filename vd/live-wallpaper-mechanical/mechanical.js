/* =====================================================
   PION MECHANICAL DISTRIBUTION — LFQM VISUALIZATION
   =====================================================
   Physics: Gravitational form factors A(t), D(t) from
   the Light-Front Quark Model with Gaussian wave function.
   2D light-front densities via Hankel transforms.
   ===================================================== */
(function () {
    'use strict';

    // ========== CONSTANTS ==========
    const HBARC = 0.197327; // GeV·fm
    const PI = Math.PI;
    const TWO_PI = 2 * PI;

    // ========== LFQM MODEL PARAMETERS ==========
    const P = {
        mq: 0.22,       // constituent quark mass (GeV)
        beta: 0.3659,   // Gaussian parameter (GeV)
        Mpi: 0.140,     // pion mass (GeV)
    };

    // Derived GFF scales (updated when params change)
    let Lambda_A, Lambda_D, D0;

    function updateModelParams() {
        Lambda_A = Math.sqrt(7.5) * P.beta; // ≈ 1.0 GeV
        Lambda_D = Math.sqrt(6.3) * P.beta; // ≈ 0.92 GeV
        D0 = -1.0 * (1 + 0.15 * (P.mq - 0.22) / 0.22);
        recomputeAll();
    }

    // ========== MODIFIED BESSEL FUNCTIONS K_n ==========
    // K₀(x) and K₁(x) via polynomial approximation (Abramowitz & Stegun)
    function besselK0(x) {
        if (x <= 0) return 1e30;
        if (x <= 2.0) {
            const t = x * x / 4.0;
            const I0 = 1.0 + t * (3.5156229 + t * (3.0899424 + t * (1.2067492
                + t * (0.2659732 + t * (0.0360768 + t * 0.0045813)))));
            return -Math.log(x / 2.0) * I0 + (-0.57721566 + t * (0.42278420
                + t * (0.23069756 + t * (0.03488590 + t * (0.00262698
                + t * (0.00010750 + t * 0.00000740))))));
        }
        const t = 2.0 / x;
        return (1.25331414 + t * (-0.07832358 + t * (0.02189568 + t * (-0.01062446
            + t * (0.00587872 + t * (-0.00251540 + t * 0.00053208)))))) / Math.sqrt(x) * Math.exp(-x);
    }

    function besselK1(x) {
        if (x <= 0) return 1e30;
        if (x <= 2.0) {
            const t = x * x / 4.0;
            const I1x = x * (0.5 + t * (0.87890594 + t * (0.51498869 + t * (0.15084934
                + t * (0.02658733 + t * (0.00301532 + t * 0.00032411))))));
            return Math.log(x / 2.0) * I1x + (1.0 / x) * (1.0 + t * (0.15443144
                + t * (-0.67278579 + t * (-0.18156897 + t * (-0.01919402
                + t * (-0.00110404 + t * (-0.00004686)))))));
        }
        const t = 2.0 / x;
        return (1.25331414 + t * (0.23498619 + t * (-0.03655620 + t * (0.01504268
            + t * (-0.00780353 + t * (0.00325614 + t * (-0.00068245))))))) / Math.sqrt(x) * Math.exp(-x);
    }

    // K₂(x) = K₀(x) + (2/x) K₁(x) via recurrence
    function besselK2(x) {
        if (x <= 0) return 1e30;
        return besselK0(x) + (2.0 / x) * besselK1(x);
    }

    // ========== GRAVITATIONAL FORM FACTORS (Dipole/Tripole) ==========
    function A_ff(t) { // dipole: A(t) = 1/(1-t/Λ_A²)²
        const u = 1.0 - t / (Lambda_A * Lambda_A);
        return 1.0 / (u * u);
    }
    function D_ff(t) { // tripole: D(t) = D₀/(1-t/Λ_D²)³
        const u = 1.0 - t / (Lambda_D * Lambda_D);
        return D0 / (u * u * u);
    }

    // ========== ANALYTICAL 2D HANKEL TRANSFORMS ==========
    function Atilde(b_gev) {
        const z = Lambda_A * b_gev;
        if (z < 1e-6) return Lambda_A * Lambda_A / (2 * PI);
        return Lambda_A * Lambda_A / (2 * PI) * (z / 2) * besselK1(z);
    }

    function Dtilde(b_gev) {
        const z = Lambda_D * b_gev;
        if (z < 1e-6) return D0 * Lambda_D * Lambda_D / (2 * PI);
        return D0 * Lambda_D * Lambda_D / (2 * PI) * (z * z / 8) * besselK2(z);
    }

    function computePressure(b_gev) {
        const LD = Lambda_D;
        const z = LD * b_gev;
        const z_eff = (z < 1e-4) ? 1e-4 : z;

        const H2 = LD * LD / (2 * PI) * (z_eff / 2) * besselK1(z_eff);
        const H3 = LD * LD / (2 * PI) * (z_eff * z_eff / 8) * besselK2(z_eff);

        const laplacianD = -D0 * LD * LD * (H2 - H3);
        return laplacianD / (4 * P.Mpi);
    }

    function computeShear(b_gev) {
        const eps = 0.01;
        const dPlus = Dtilde(b_gev + eps);
        const dMinus = Dtilde(Math.max(1e-6, b_gev - eps));
        const dPrime = (dPlus - dMinus) / (2 * eps);

        const p = computePressure(b_gev);
        const pPlusS = (b_gev > 1e-4) ? dPrime / (2 * P.Mpi * b_gev) : 2 * p;
        return pPlusS - p;
    }

    // ========== COMPUTE DENSITY ARRAYS ==========
    const N_R = 200;
    const R_MAX_FM = 1.8; // fm
    let rArray = [];
    let pressureArr = [];
    let shearArr = [];
    let energyArr = [];
    let cachedPMax = 1, cachedPMin = -1;

    function recomputeAll() {
        rArray = [];
        pressureArr = [];
        shearArr = [];
        energyArr = [];

        const dr_fm = R_MAX_FM / N_R;

        for (let i = 0; i <= N_R; i++) {
            const r_fm = i * dr_fm + 0.08; // start from 0.08 fm to skip extreme near-origin peak
            const b = r_fm / HBARC; // fm → GeV⁻¹
            rArray.push(r_fm);

            energyArr.push(P.Mpi * Atilde(b));
            pressureArr.push(computePressure(b) * HBARC * HBARC);
            shearArr.push(computeShear(b) * HBARC * HBARC);
        }

        pressureArr = smoothArray(pressureArr, 2);
        shearArr = smoothArray(shearArr, 2);

        cachedPMax = -Infinity; cachedPMin = Infinity;
        for (let i = 0; i < pressureArr.length; i++) {
            if (isFinite(pressureArr[i])) {
                cachedPMax = Math.max(cachedPMax, pressureArr[i]);
                cachedPMin = Math.min(cachedPMin, pressureArr[i]);
            }
        }
        if (cachedPMax <= 0) cachedPMax = 1;
        if (cachedPMin >= 0) cachedPMin = -1;

        const rMassSq = 8.0 / (Lambda_A * Lambda_A) * HBARC * HBARC;
        const d0El = document.getElementById('d0-val');
        const rmEl = document.getElementById('rmass-val');
        if (d0El) d0El.textContent = D0.toFixed(2);
        if (rmEl) rmEl.textContent = rMassSq.toFixed(2) + ' fm²';
    }

    function smoothArray(arr, passes) {
        let out = arr.slice();
        for (let p = 0; p < passes; p++) {
            const tmp = out.slice();
            for (let i = 1; i < tmp.length - 1; i++) {
                out[i] = 0.25 * tmp[i-1] + 0.5 * tmp[i] + 0.25 * tmp[i+1];
            }
        }
        return out;
    }

    // ========== CANVAS SETUP ==========
    const bgCanvas = document.getElementById('bg-canvas');
    const phCanvas = document.getElementById('physics-canvas');
    const bgCtx = bgCanvas.getContext('2d');
    const phCtx = phCanvas.getContext('2d');

    let W, H;
    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        bgCanvas.width = W; bgCanvas.height = H;
        phCanvas.width = W; phCanvas.height = H;
    }
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 100); });
    resize();

    // ========== BACKGROUND PARTICLES ==========
    const BG_PARTICLES = 80;
    const bgParticles = [];
    for (let i = 0; i < BG_PARTICLES; i++) {
        bgParticles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: 0.8 + Math.random() * 1.5,
            o: 0.15 + Math.random() * 0.25,
            hue: 200 + Math.random() * 60,
        });
    }

    function drawBackground(t) {
        bgCtx.fillStyle = '#06060f';
        bgCtx.fillRect(0, 0, W, H);

        // Subtle radial gradient
        const grd = bgCtx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
        grd.addColorStop(0, 'rgba(20, 12, 50, 0.5)');
        grd.addColorStop(0.5, 'rgba(10, 8, 30, 0.3)');
        grd.addColorStop(1, 'rgba(6, 6, 15, 0)');
        bgCtx.fillStyle = grd;
        bgCtx.fillRect(0, 0, W, H);

        // Particles
        for (const p of bgParticles) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < -10) p.x = W + 10;
            if (p.x > W + 10) p.x = -10;
            if (p.y < -10) p.y = H + 10;
            if (p.y > H + 10) p.y = -10;
            const pulse = 0.7 + 0.3 * Math.sin(t * 0.001 + p.hue);
            bgCtx.beginPath();
            bgCtx.arc(p.x, p.y, p.r * pulse, 0, TWO_PI);
            bgCtx.fillStyle = `hsla(${p.hue}, 60%, 65%, ${p.o * pulse})`;
            bgCtx.fill();
        }
    }

    // ========== DRAWING UTILITIES ==========
    function drawPlot(ctx, x, y, w, h, data, xData, {
        title = '', xLabel = '', yLabel = '',
        color = '#ff6b4a', lineWidth = 2,
        fillPositive = null, fillNegative = null,
        showZeroLine = false, yRange = null,
        secondData = null, secondColor = '#ffcf48',
        thirdData = null, thirdColor = '#a78bfa',
    } = {}) {
        const pad = { top: 28, right: 14, bottom: 28, left: 46 };
        const pw = w - pad.left - pad.right;
        const ph = h - pad.top - pad.bottom;
        const ox = x + pad.left;
        const oy = y + pad.top;

        // Determine y-range — use percentile clipping to prevent outliers from dominating
        let yMin, yMax;
        if (yRange) {
            [yMin, yMax] = yRange;
        } else {
            // Collect all finite values
            const allVals = [];
            const all = [data, secondData, thirdData].filter(Boolean);
            for (const d of all) {
                for (const v of d) {
                    if (isFinite(v)) allVals.push(v);
                }
            }
            allVals.sort((a, b) => a - b);
            const lo = Math.floor(allVals.length * 0.02);  // clip bottom 2%
            const hi = Math.ceil(allVals.length * 0.98) - 1; // clip top 2%
            yMin = allVals[lo] || 0;
            yMax = allVals[hi] || 1;
            const margin = (yMax - yMin) * 0.15 || 0.1;
            yMin -= margin; yMax += margin;
        }

        // Background
        ctx.fillStyle = 'rgba(8, 8, 24, 0.6)';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 100, 200, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const gy = oy + ph * i / 4;
            ctx.beginPath(); ctx.moveTo(ox, gy); ctx.lineTo(ox + pw, gy); ctx.stroke();
        }
        for (let i = 0; i <= 4; i++) {
            const gx = ox + pw * i / 4;
            ctx.beginPath(); ctx.moveTo(gx, oy); ctx.lineTo(gx, oy + ph); ctx.stroke();
        }

        // Zero line
        if (showZeroLine && yMin < 0 && yMax > 0) {
            const zy = oy + ph * (1 - (0 - yMin) / (yMax - yMin));
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(ox, zy); ctx.lineTo(ox + pw, zy); ctx.stroke();
            ctx.setLineDash([]);
        }

        // Helper to draw a single dataset (clamped to plot area)
        function plotLine(d, col, lw) {
            if (!d || d.length < 2) return;
            ctx.save();
            ctx.beginPath();
            ctx.rect(ox - 1, oy - 1, pw + 2, ph + 2);
            ctx.clip();
            ctx.strokeStyle = col;
            ctx.lineWidth = lw;
            ctx.beginPath();
            for (let i = 0; i < d.length; i++) {
                const px = ox + (xData[i] / xData[xData.length - 1]) * pw;
                const clamped = Math.max(yMin, Math.min(yMax, d[i]));
                const py = oy + ph * (1 - (clamped - yMin) / (yMax - yMin));
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.restore();
        }

        // Fill regions for pressure (clamped to plot area)
        if (fillPositive && data && yMin < 0 && yMax > 0) {
            const zy = oy + ph * (1 - (0 - yMin) / (yMax - yMin));
            ctx.save();
            ctx.beginPath();
            ctx.rect(ox - 1, oy - 1, pw + 2, ph + 2);
            ctx.clip();
            // Positive fill
            ctx.fillStyle = fillPositive;
            ctx.beginPath();
            ctx.moveTo(ox, zy);
            for (let i = 0; i < data.length; i++) {
                const px = ox + (xData[i] / xData[xData.length - 1]) * pw;
                const val = Math.max(0, Math.min(yMax, data[i]));
                const py = oy + ph * (1 - (val - yMin) / (yMax - yMin));
                ctx.lineTo(px, py);
            }
            ctx.lineTo(ox + pw, zy);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            // Negative fill
            if (fillNegative) {
                ctx.fillStyle = fillNegative;
                ctx.beginPath();
                ctx.moveTo(ox, zy);
                for (let i = 0; i < data.length; i++) {
                    const px = ox + (xData[i] / xData[xData.length - 1]) * pw;
                    const val = Math.min(0, data[i]);
                    const py = oy + ph * (1 - (val - yMin) / (yMax - yMin));
                    ctx.lineTo(px, py);
                }
                ctx.lineTo(ox + pw, zy);
                ctx.closePath();
                ctx.fill();
            }
        }

        plotLine(data, color, lineWidth);
        if (secondData) plotLine(secondData, secondColor, 1.5);
        if (thirdData) plotLine(thirdData, thirdColor, 1.5);

        // Title
        ctx.fillStyle = 'rgba(220,220,240,0.85)';
        ctx.font = '600 11px "Outfit"';
        ctx.textAlign = 'left';
        ctx.fillText(title, x + 12, y + 16);

        // Axis labels
        ctx.fillStyle = 'rgba(180,180,210,0.5)';
        ctx.font = '10px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText(xLabel, ox + pw / 2, y + h - 4);

        // Y-axis tick labels
        ctx.textAlign = 'right';
        ctx.font = '9px "JetBrains Mono"';
        for (let i = 0; i <= 4; i++) {
            const val = yMax - (yMax - yMin) * i / 4;
            const gy = oy + ph * i / 4;
            ctx.fillText(val.toFixed(2), ox - 4, gy + 3);
        }
    }

    // ========== CENTRAL PION VISUALIZATION ==========
    function drawPionCrossSection(ctx, cx, cy, radius, time) {
        // Draw radial pressure heatmap using concentric rings
        const steps = 80;
        for (let i = steps; i >= 1; i--) {
            const frac = i / steps;
            const r_fm = frac * 1.2; // up to 1.2 fm radius

            // Interpolate pressure at this radius
            const idx = r_fm / R_MAX_FM * N_R;
            const i0 = Math.min(Math.floor(idx), N_R - 1);
            const i1 = Math.min(i0 + 1, N_R);
            const t_interp = idx - i0;
            const pVal = (1 - t_interp) * (pressureArr[i0] || 0) + t_interp * (pressureArr[i1] || 0);

            // Map to color using cached extremes
            let r_c, g_c, b_c, alpha;
            if (pVal >= 0) {
                const norm = Math.pow(Math.min(pVal / cachedPMax, 1), 0.6); // gamma for better contrast
                r_c = Math.floor(255 - norm * 30);
                g_c = Math.floor(80 + (1-norm) * 60);
                b_c = Math.floor(40 + (1-norm) * 30);
                alpha = 0.08 + norm * 0.35;
            } else {
                const norm = Math.pow(Math.min(Math.abs(pVal / cachedPMin), 1), 0.6);
                r_c = Math.floor(30 + (1-norm) * 40);
                g_c = Math.floor(140 + norm * 60);
                b_c = Math.floor(200 + norm * 55);
                alpha = 0.06 + norm * 0.22;
            }

            const outerR = frac * radius;
            const innerR = ((i - 1) / steps) * radius;
            // Draw as ring for crisp boundaries
            ctx.beginPath();
            ctx.arc(cx, cy, outerR, 0, TWO_PI);
            if (innerR > 0.5) {
                ctx.arc(cx, cy, innerR, 0, TWO_PI, true);
            }
            ctx.fillStyle = `rgba(${r_c},${g_c},${b_c},${alpha})`;
            ctx.fill();
        }

        // Subtle outer glow ring (not too bright)
        const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.92, cx, cy, radius * 1.06);
        glowGrad.addColorStop(0, 'rgba(74, 200, 255, 0.05)');
        glowGrad.addColorStop(0.6, 'rgba(74, 200, 255, 0.02)');
        glowGrad.addColorStop(1, 'rgba(74, 200, 255, 0)');
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.06, 0, TWO_PI);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Force arrows (radial) — outward at center, inward at edge
        const nArrows = 16;
        for (let i = 0; i < nArrows; i++) {
            const angle = (i / nArrows) * TWO_PI + time * 0.0003;

            // Inner repulsive arrows (outward)
            const rInner = radius * 0.18;
            const arrowLen = radius * 0.12;
            drawForceArrow(ctx, cx, cy, angle, rInner, arrowLen, 'rgba(255,120,70,0.5)', time);

            // Outer attractive arrows (inward)
            const rOuter = radius * 0.72;
            drawForceArrow(ctx, cx, cy, angle, rOuter, -arrowLen * 0.8, 'rgba(74,200,255,0.35)', time);
        }

        // Quark-Antiquark visualization
        const qAngle = time * 0.0008;
        const qDist = radius * 0.25;
        const q1x = cx + Math.cos(qAngle) * qDist;
        const q1y = cy + Math.sin(qAngle) * qDist;
        const q2x = cx - Math.cos(qAngle) * qDist;
        const q2y = cy - Math.sin(qAngle) * qDist;

        // Gluon spring between quarks
        drawGluonSpring(ctx, q1x, q1y, q2x, q2y, time);

        // Quark blobs
        drawQuark(ctx, q1x, q1y, 'u', time);
        drawQuark(ctx, q2x, q2y, 'd̄', time);

        // Center label
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.font = '600 16px "Outfit"';
        ctx.textAlign = 'center';
        ctx.fillText('π⁺', cx, cy + radius + 30);

        // Radius markers
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 0.5;
        for (const rm of [0.33, 0.6, 1.0]) {
            const rr = (rm / 1.2) * radius;
            ctx.beginPath();
            ctx.arc(cx, cy, rr, 0, TWO_PI);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.font = '8px "JetBrains Mono"';
            ctx.textAlign = 'left';
            ctx.fillText(`${rm} fm`, cx + rr + 4, cy - 2);
        }
        ctx.setLineDash([]);
    }

    function drawForceArrow(ctx, cx, cy, angle, rStart, length, color, time) {
        const pulse = 0.7 + 0.3 * Math.sin(time * 0.002 + angle * 3);
        const sx = cx + Math.cos(angle) * rStart;
        const sy = cy + Math.sin(angle) * rStart;
        const ex = cx + Math.cos(angle) * (rStart + length * pulse);
        const ey = cy + Math.sin(angle) * (rStart + length * pulse);

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Arrowhead
        const headLen = 5;
        const headAngle = Math.atan2(ey - sy, ex - sx);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(headAngle - 0.4), ey - headLen * Math.sin(headAngle - 0.4));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(headAngle + 0.4), ey - headLen * Math.sin(headAngle + 0.4));
        ctx.stroke();
    }

    function drawGluonSpring(ctx, x1, y1, x2, y2, time) {
        const dx = x2 - x1, dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / dist, ny = dx / dist;
        const nCoils = 7;
        const amp = 6 + 2 * Math.sin(time * 0.003);

        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        for (let i = 1; i <= nCoils * 4; i++) {
            const t = i / (nCoils * 4);
            const mx = x1 + dx * t;
            const my = y1 + dy * t;
            const wave = Math.sin(t * nCoils * TWO_PI + time * 0.004) * amp;
            ctx.lineTo(mx + nx * wave, my + ny * wave);
        }
        ctx.stroke();
    }

    function drawQuark(ctx, x, y, label, time) {
        const pulse = 0.85 + 0.15 * Math.sin(time * 0.003);
        const r = 10 * pulse;

        // Glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
        glow.addColorStop(0, 'rgba(255, 207, 72, 0.3)');
        glow.addColorStop(1, 'rgba(255, 207, 72, 0)');
        ctx.beginPath();
        ctx.arc(x, y, r * 3, 0, TWO_PI);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TWO_PI);
        ctx.fillStyle = 'rgba(255, 207, 72, 0.7)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 230, 100, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
        ctx.textBaseline = 'alphabetic';
    }

    // ========== GFF PLOT ==========
    function drawGFFPlot(ctx, x, y, w, h, time) {
        const nPts = 60;
        const tMax = 3.0; // GeV²
        const tArr = [], aArr = [], dArr = [];
        for (let i = 0; i < nPts; i++) {
            const tVal = -tMax * i / (nPts - 1);
            tArr.push(-tVal); // plot vs -t (positive axis)
            aArr.push(A_ff(tVal));
            dArr.push(D_ff(tVal));
        }

        // Background
        ctx.fillStyle = 'rgba(8, 8, 24, 0.6)';
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
        ctx.strokeStyle = 'rgba(100, 100, 200, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const pad = { top: 28, right: 14, bottom: 28, left: 50 };
        const pw = w - pad.left - pad.right;
        const ph = h - pad.top - pad.bottom;
        const ox = x + pad.left;
        const oy = y + pad.top;

        const yMin = -1.2, yMax = 1.2;

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const gy = oy + ph * i / 4;
            ctx.beginPath(); ctx.moveTo(ox, gy); ctx.lineTo(ox + pw, gy); ctx.stroke();
        }

        // Zero line
        const zy = oy + ph * (1 - (0 - yMin) / (yMax - yMin));
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(ox, zy); ctx.lineTo(ox + pw, zy); ctx.stroke();
        ctx.setLineDash([]);

        // A(t)
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < nPts; i++) {
            const px = ox + (tArr[i] / tMax) * pw;
            const py = oy + ph * (1 - (aArr[i] - yMin) / (yMax - yMin));
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // D(t)
        ctx.strokeStyle = '#ffcf48';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < nPts; i++) {
            const px = ox + (tArr[i] / tMax) * pw;
            const clamped = Math.max(yMin, Math.min(yMax, dArr[i]));
            const py = oy + ph * (1 - (clamped - yMin) / (yMax - yMin));
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Labels
        ctx.fillStyle = 'rgba(220,220,240,0.85)';
        ctx.font = '600 13px "Outfit"';
        ctx.textAlign = 'left';
        ctx.fillText('Mass A(t) and D-term D(t) Form Factors', x + 16, y + 18);

        // Legend
        ctx.font = '11px "JetBrains Mono"';
        ctx.fillStyle = '#a78bfa';
        ctx.fillText('A(t)', ox + pw - 50, oy + 16);
        ctx.fillStyle = '#ffcf48';
        ctx.fillText('D(t)', ox + pw - 50, oy + 32);

        ctx.fillStyle = 'rgba(180,180,210,0.5)';
        ctx.font = '10px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText('−t (GeV²)', ox + pw / 2, y + h - 4);

        // Y ticks
        ctx.textAlign = 'right';
        ctx.font = '9px "JetBrains Mono"';
        for (let i = 0; i <= 4; i++) {
            const val = yMax - (yMax - yMin) * i / 4;
            ctx.fillText(val.toFixed(1), ox - 4, oy + ph * i / 4 + 3);
        }
    }

    // ========== CURSOR ==========
    const mouse = { x: W / 2, y: H / 2 };
    let cursorX = W / 2, cursorY = H / 2;
    document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    const cursorDot = document.createElement('div');
    cursorDot.style.cssText = `position:fixed;width:8px;height:8px;background:#4ac8ff;border-radius:50%;pointer-events:none;z-index:10001;box-shadow:0 0 10px rgba(74,200,255,0.5);will-change:transform;`;
    document.body.appendChild(cursorDot);

    const cursorRing = document.createElement('div');
    cursorRing.style.cssText = `position:fixed;width:32px;height:32px;border:1.5px solid rgba(74,200,255,0.4);border-radius:50%;pointer-events:none;z-index:10000;opacity:0.5;will-change:transform;`;
    document.body.appendChild(cursorRing);

    let ringX = W / 2, ringY = H / 2;

    // ========== MAIN RENDER LOOP ==========
    let lastTime = 0;

    function render(timestamp) {
        const dt = timestamp - lastTime;
        lastTime = timestamp;

        // Background
        drawBackground(timestamp);

        // Physics layer
        phCtx.clearRect(0, 0, W, H);

        // Layout - Center the pion
        const centerX = W * 0.5;
        const centerY = H * 0.5;
        const pionRadius = Math.min(W, H) * 0.25; // made slightly larger since it's the main focus

        // Central pion cross-section
        drawPionCrossSection(phCtx, centerX, centerY, pionRadius, timestamp);

        // Draw the GFF plot (Mass and D-term variation) larger in the bottom right
        if (pressureArr.length > 0) {
            const plotW = Math.min(500, W * 0.35); // significantly increased width
            const plotH = 250;                     // significantly increased height
            const plotX = W - plotW - 40;
            const plotY = H - plotH - 40;
            drawGFFPlot(phCtx, plotX, plotY, plotW, plotH, timestamp);
        }

        // Cursor update
        cursorX += (mouse.x - cursorX) * 0.4;
        cursorY += (mouse.y - cursorY) * 0.4;
        ringX += (mouse.x - ringX) * 0.12;
        ringY += (mouse.y - ringY) * 0.12;
        cursorDot.style.transform = `translate(${cursorX - 4}px, ${cursorY - 4}px)`;
        cursorRing.style.transform = `translate(${ringX - 16}px, ${ringY - 16}px)`;

        requestAnimationFrame(render);
    }

    // ========== CONTROLS ==========
    function initControls() {
        const betaSlider = document.getElementById('beta-slider');
        const mqSlider = document.getElementById('mq-slider');
        const betaVal = document.getElementById('beta-value');
        const mqVal = document.getElementById('mq-value');

        betaSlider.addEventListener('input', e => {
            P.beta = parseFloat(e.target.value);
            betaVal.textContent = P.beta.toFixed(3);
            updateModelParams();
        });

        mqSlider.addEventListener('input', e => {
            P.mq = parseFloat(e.target.value);
            mqVal.textContent = P.mq.toFixed(3);
            updateModelParams();
        });

        document.getElementById('toggle-ui').addEventListener('click', () => {
            document.getElementById('ui-overlay').classList.toggle('hidden');
        });

        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        });
    }

    // ========== INIT ==========
    function init() {
        updateModelParams();
        initControls();
        requestAnimationFrame(render);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

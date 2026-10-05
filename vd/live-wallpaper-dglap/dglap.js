// ================================================================
// PEDAGOGICAL DGLAP EVOLUTION — LIVE WALLPAPER ENGINE
// ================================================================
// Physics Context:
//   We visualize pion PDFs:
//   Valence = x*u_v(x) (or d_v), Gluon = x*g(x), Sea = x*Sigma(x)
//   As Q^2 increases, the valence distribution shifts to lower x
//   and its area decreases, while the gluon and sea distributions
//   explode at low x.
//   
// Visual Layout:
//   - Large central plot (x*f(x) vs x)
//   - Interactive splitting diagrams linking to evolution
//   - Dynamic physics insights based on Q^2
// ================================================================

(function () {
    'use strict';

    // ===================== PHYSICS & STATE =====================
    const STATE = {
        Q2: 2.3, // ln(Q^2) value on slider
        logY: false,
        autoEvolve: true,
        animSpeed: 0.8,
        lambdaQCD: 0.217
    };

    const M_C = 1.27, M_B = 4.18, M_T = 172.76;

    function activeNf(Q) {
        if (Q > M_T) return 6;
        if (Q > M_B) return 5;
        if (Q > M_C) return 4;
        return 3;
    }

    function alphaS(Q) {
        const nf = activeNf(Q);
        const b0 = 11 - (2 / 3) * nf;
        const L = Math.log(Q * Q / (STATE.lambdaQCD * STATE.lambdaQCD));
        if (L <= 0) return 1;
        return Math.min((4 * Math.PI) / (b0 * L), 1);
    }

    // Low-x dampening relaxed to allow massive visible spikes
    function damp(x) {
        const x0 = 0.0005; 
        const r = x / x0;
        return (r * r) / (1 + r * r);
    }

    // Phenomenological toy PDFs capturing DGLAP behavior
    function pdfValence(x, Q2) {
        // Pion valence (u or dbar): peaks slightly higher x than proton, shrinks and shifts left with Q2
        const t = Math.max(0, Math.log(Q2)) / Math.log(1000000); 
        const A = 2.0 * (1 - t * 0.5);
        const a = 0.5 + t * 0.3;
        const b = 1.0 + t * 2.5;
        return A * Math.pow(x, a) * Math.pow(1 - x, b);
    }

    function pdfGluon(x, Q2) {
        // Massive explosion at low x
        const t = Math.max(0, Math.log(Q2)) / Math.log(1000000);
        const A = 1.5 + t * 40;
        const a = -0.15 - t * 0.35; // steep power
        const b = 4.0 + t * 3.0;
        return A * Math.pow(x, a) * Math.pow(1 - x, b) * damp(x);
    }

    function pdfSea(x, Q2) {
        // Driven by g -> q qbar, also huge at low x
        const t = Math.max(0, Math.log(Q2)) / Math.log(1000000);
        const A = 0.3 + t * 25;
        const a = -0.10 - t * 0.30;
        const b = 5.0 + t * 3.0;
        return A * Math.pow(x, a) * Math.pow(1 - x, b) * damp(x);
    }

    // Integrate to find momentum fractions
    function momentumFrac(fn, Q2) {
        let sum = 0;
        const steps = 200;
        for (let i = 1; i < steps; i++) {
            const x = i / steps;
            sum += x * fn(x, Q2) / steps;
        }
        return sum;
    }

    // ===================== CANVAS SETUP =====================
    const cv = document.getElementById('main-canvas');
    const ctx = cv.getContext('2d');
    let W, H;

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        cv.width = W; 
        cv.height = H;
    }
    
    let _rt;
    window.addEventListener('resize', () => {
        clearTimeout(_rt);
        _rt = setTimeout(resize, 80);
    });
    resize();

    const COL = {
        val: '#ff3366',
        gluon: '#00ff88',
        sea: '#9933ff',
        bg: '#05050a',
        grid: 'rgba(255,255,255,0.08)',
        axes: 'rgba(255,255,255,0.4)',
        text: 'rgba(255,255,255,0.7)'
    };

    // ===================== PLOT DRAWING =====================
    const PLOT = {
        xMin: 0.001,
        xMax: 0.95,
        yLinMax: 3.5,
        yLogMin: 0.01,
        yLogMax: 10.0,
        steps: 180
    };

    function getPlotRect() {
        // Shift center slightly to the right to balance the left UI panel
        const cx = W * 0.55;
        const cy = H * 0.48;
        const pw = Math.min(W * 0.6, 800);
        const ph = Math.min(H * 0.65, 600);
        return {
            left: cx - pw * 0.45,
            right: cx + pw * 0.55,
            top: cy - ph / 2,
            bottom: cy + ph / 2,
            width: pw,
            height: ph
        };
    }

    function xToPx(x, P) {
        const lMin = Math.log10(PLOT.xMin);
        const lMax = Math.log10(PLOT.xMax);
        const t = (Math.log10(x) - lMin) / (lMax - lMin);
        return P.left + t * P.width;
    }

    function yToPx(y, P) {
        if (STATE.logY) {
            if (y <= 0) y = PLOT.yLogMin * 0.5;
            const lMin = Math.log10(PLOT.yLogMin);
            const lMax = Math.log10(PLOT.yLogMax);
            const t = (Math.log10(Math.max(y, PLOT.yLogMin * 0.5)) - lMin) / (lMax - lMin);
            return P.bottom - t * P.height;
        } else {
            return P.bottom - (y / PLOT.yLinMax) * P.height;
        }
    }

    function drawAxesAndGrid(ctx, P, actualQ2) {
        ctx.strokeStyle = COL.axes;
        ctx.lineWidth = 2.5;

        // X-axis
        ctx.beginPath();
        ctx.moveTo(P.left, P.bottom);
        ctx.lineTo(P.right, P.bottom);
        ctx.stroke();

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(P.left, P.bottom);
        ctx.lineTo(P.left, P.top);
        ctx.stroke();

        // X-Grid (Log scale)
        const xVals = [0.001, 0.01, 0.1, 0.5, 0.9];
        const xSub = [0.002, 0.005, 0.02, 0.05, 0.2, 0.4, 0.6, 0.8];
        
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px "JetBrains Mono"';
        
        // Draw subs
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let xv of xSub) {
            const px = xToPx(xv, P);
            if (px > P.left && px < P.right) {
                ctx.moveTo(px, P.top); ctx.lineTo(px, P.bottom);
            }
        }
        ctx.stroke();

        // Draw mains
        ctx.strokeStyle = COL.grid;
        ctx.lineWidth = 1.5;
        for (let xv of xVals) {
            const px = xToPx(xv, P);
            if (px >= P.left && px <= P.right) {
                ctx.beginPath();
                ctx.moveTo(px, P.top); ctx.lineTo(px, P.bottom + 8);
                ctx.stroke();
                
                ctx.fillStyle = COL.text;
                let lbl = xv === 0.001 ? "10⁻³" : (xv === 0.01 ? "10⁻²" : xv.toString());
                ctx.fillText(lbl, px, P.bottom + 24);
            }
        }

        // Y-Grid
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        let yVals, ySub;
        if (STATE.logY) {
            yVals = [0.01, 0.1, 1, 10];
            ySub = [0.02, 0.05, 0.2, 0.5, 2, 5];
        } else {
            yVals = [1, 2, 3];
            ySub = [0.5, 1.5, 2.5, 3.5];
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        for (let yv of ySub) {
            const py = yToPx(yv, P);
            if (py > P.top && py < P.bottom) {
                ctx.moveTo(P.left, py); ctx.lineTo(P.right, py);
            }
        }
        ctx.stroke();

        ctx.strokeStyle = COL.grid;
        for (let yv of yVals) {
            const py = yToPx(yv, P);
            if (py >= P.top && py <= P.bottom) {
                ctx.beginPath();
                ctx.moveTo(P.left - 8, py); ctx.lineTo(P.right, py);
                ctx.stroke();
                
                ctx.fillStyle = COL.text;
                let lbl = (STATE.logY && yv < 1) ? ("10" + (yv==0.01?"⁻²":"⁻¹")) : yv.toString();
                ctx.fillText(lbl, P.left - 14, py);
            }
        }

        // Labels
        ctx.font = 'bold 16px "JetBrains Mono"';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.textAlign = 'center';
        ctx.fillText("x (Bjorken scaling variable)", (P.left + P.right) / 2, P.bottom + 55);
        
        ctx.save();
        ctx.translate(P.left - 55, (P.top + P.bottom) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Momentum density  x · f(x, Q²)", 0, 0);
        ctx.restore();

        // Top title
        ctx.font = 'bold 22px "Space Grotesk"';
        let q2Str = actualQ2 < 1000 ? actualQ2.toFixed(1) : actualQ2.toExponential(1);
        ctx.fillText(`Pion PDFs at Q² = ${q2Str} GeV²`, (P.left + P.right) / 2, P.top - 20);
    }

    function drawCurve(ctx, P, actualQ2, fn, color, width, divisor=1) {
        const lMin = Math.log10(PLOT.xMin);
        const lMax = Math.log10(PLOT.xMax);
        
        const pts = [];
        for (let i = 0; i <= PLOT.steps; i++) {
            const lx = lMin + (i / PLOT.steps) * (lMax - lMin);
            const x = Math.pow(10, lx);
            let y = (x * fn(x, actualQ2)) / divisor;
            if (!isFinite(y) || isNaN(y)) y = 0;
            
            const px = xToPx(x, P);
            const pyRaw = yToPx(y, P);
            const py = Math.max(P.top, Math.min(P.bottom, pyRaw));
            
            pts.push({ px, py });
        }

        // Area under curve — always fill from first to last point
        ctx.beginPath();
        ctx.moveTo(pts[0].px, P.bottom);
        for (let i = 0; i < pts.length; i++) {
            ctx.lineTo(pts[i].px, pts[i].py);
        }
        ctx.lineTo(pts[pts.length - 1].px, P.bottom);
        ctx.closePath();
        const {r, g, b} = hexToRgb(color);
        ctx.fillStyle = `rgba(${r},${g},${b},0.08)`;
        ctx.fill();

        // The line itself
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
            if (i === 0) ctx.moveTo(pts[i].px, pts[i].py);
            else ctx.lineTo(pts[i].px, pts[i].py);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Glow
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = width * 3;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 255, g: 255, b: 255};
    }

    // ===================== SIMULATION LOOP =====================
    let lastTime = 0;

    function render(time) {
        const dt = Math.min(time - lastTime, 50);
        lastTime = time;

        // Auto evolution
        if (STATE.autoEvolve) {
            STATE.Q2 += (dt * 0.001) * STATE.animSpeed;
            if (STATE.Q2 > 14) STATE.Q2 = 0.1; // wrap around ln(Q2), avoid 0
            document.getElementById('q2-slider').value = STATE.Q2;
        }

        const actualQ2 = Math.pow(10, Math.max(STATE.Q2, 0.01)); // maps 0-14 to 1 - 10^14 scaling, avoid NaN
        const Q = Math.sqrt(actualQ2);

        // Clear
        ctx.fillStyle = COL.bg;
        ctx.fillRect(0, 0, W, H);

        if (W > 600 && H > 400) {
            // Dynamically adjust yLinMax based on current curves
            const testX = 0.05;
            const testYs = [
                testX * pdfValence(testX, actualQ2),
                testX * pdfSea(testX, actualQ2),
                (testX * pdfGluon(testX, actualQ2)) / 10
            ];
            const peakY = Math.max(...testYs, 1.0);
            PLOT.yLinMax = Math.max(3.5, Math.min(peakY * 1.3, 20));

            const P = getPlotRect();
            drawAxesAndGrid(ctx, P, actualQ2);
            
            // Draw PDFs — all three curves
            drawCurve(ctx, P, actualQ2, pdfValence, COL.val, 4);
            drawCurve(ctx, P, actualQ2, pdfSea, COL.sea, 3);
            drawCurve(ctx, P, actualQ2, pdfGluon, COL.gluon, 3, 10); // scale gluon down by 10
        }

        updateUI(actualQ2, Q);

        requestAnimationFrame(render);
    }

    // ===================== UI UPDATES =====================
    let fpsFrames = 0;
    let lastFpsTime = 0;
    let lastUIUpdate = 0;

    function updateUI(actualQ2, Q) {
        const now = performance.now();

        // Throttle expensive UI updates to every 200ms
        if (now - lastUIUpdate > 200) {
            lastUIUpdate = now;

            document.getElementById('q2-val').textContent = actualQ2 < 1000 ? actualQ2.toFixed(1) : actualQ2.toExponential(1);
            document.getElementById('q-val').textContent = Q < 1000 ? Q.toFixed(1) : Q.toExponential(1);
            document.getElementById('alphas-val').textContent = alphaS(Q).toFixed(3);
            document.getElementById('nf-val').textContent = activeNf(Q);

            // Fractions
            const mV = momentumFrac(pdfValence, actualQ2);
            const mS = momentumFrac(pdfSea, actualQ2) * 2; // times flavors roughly
            const mG = momentumFrac(pdfGluon, actualQ2);
            const sum = mV + mS + mG + 0.001;

            const pV = (mV / sum) * 100;
            const pS = (mS / sum) * 100;
            const pG = (mG / sum) * 100;

            document.getElementById('bar-val').style.width = `${pV}%`;
            document.getElementById('bar-sea').style.width = `${pS}%`;
            document.getElementById('bar-gluon').style.width = `${pG}%`;

            document.getElementById('pct-val').textContent = `${pV.toFixed(1)}%`;
            document.getElementById('pct-sea').textContent = `${pS.toFixed(1)}%`;
            document.getElementById('pct-gluon').textContent = `${pG.toFixed(1)}%`;

            // Insights logic based on Q2 ranges
            const insight = document.getElementById('insight-text');
            const cards = document.querySelectorAll('.split-card');
            cards.forEach(c => c.classList.remove('active'));

            if (actualQ2 < 5) {
                insight.innerHTML = "<strong>Low Q² scale (~1 GeV²):</strong><br>The pion is uniquely composed of a valence pair (u and d̄).";
            } else if (actualQ2 < 100) {
                insight.innerHTML = "<strong>Medium Q² scale (10-100 GeV²):</strong><br>Valence quarks start radiating gluons via bremsstrahlung (P<sub>qq</sub> splitting). Valence momentum shifts to lower x.";
                document.getElementById('sc-qq').classList.add('active');
                document.getElementById('sc-gq').classList.add('active');
            } else if (actualQ2 < 10000) {
                insight.innerHTML = "<strong>High Q² scale (100-10⁴ GeV²):</strong><br>Radiated gluons split into quark-antiquark sea pairs (P<sub>qg</sub>) and more gluons (P<sub>gg</sub>). The 'sea' awakens.";
                document.getElementById('sc-gqq').classList.add('active');
                document.getElementById('sc-gg').classList.add('active');
            } else {
                insight.innerHTML = "<strong>Extremely High Q² scale (>10⁴ GeV²):</strong><br>At very high resolution, the pion's identity is lost in an overwhelming swarm of low-momentum gluons and sea quarks.";
                cards.forEach(c => c.classList.add('active'));
            }
        }

        // FPS
        fpsFrames++;
        if (now - lastFpsTime > 1000) {
            document.getElementById('fps-val').textContent = fpsFrames;
            fpsFrames = 0;
            lastFpsTime = now;
        }
    }

    // ===================== INITIALIZE =====================
    function bindControls() {
        document.getElementById('q2-slider').addEventListener('input', e => {
            STATE.Q2 = parseFloat(e.target.value);
            STATE.autoEvolve = false;
            document.getElementById('auto-toggle').checked = false;
        });

        document.getElementById('speed-slider').addEventListener('input', e => {
            STATE.animSpeed = parseFloat(e.target.value);
        });

        document.getElementById('auto-toggle').addEventListener('change', e => {
            STATE.autoEvolve = e.target.checked;
        });

        document.getElementById('log-toggle').addEventListener('change', e => {
            STATE.logY = e.target.checked;
        });

        document.getElementById('toggle-ui').addEventListener('click', () => {
            document.getElementById('ui-overlay').classList.toggle('hidden');
        });

        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        bindControls();
        lastTime = performance.now();
        requestAnimationFrame(render);
    });

})();

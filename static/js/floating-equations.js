/* ── Floating KaTeX Equations — All pages ── */
(function () {

    /* Target the #content wrapper on sub-pages */
    const container = document.getElementById('content');
    if (!container) return;

    /* Ensure the container supports absolute positioning */
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    /* Wait for KaTeX to be available */
    function waitForKaTeX(cb) {
        if (window.katex) { cb(); return; }
        const interval = setInterval(() => {
            if (window.katex) { clearInterval(interval); cb(); }
        }, 100);
    }

    waitForKaTeX(function () {
        /* ── Physics equations relevant to light-front dynamics ── */
        const equations = [
            { tex: String.raw`x^{\pm}=\frac{x^{0}\pm x^{3}}{\sqrt{2}}`, display: true },
            { tex: String.raw`p^{-}=\frac{m^{2}+\mathbf{k}_{\perp}^{2}}{p^{+}}`, display: true },
            { tex: String.raw`f_{1}(x,\mathbf{k}_{\perp}^{2})`, display: false },
            { tex: String.raw`H(x,\zeta,t)`, display: false },
            { tex: String.raw`P^{+}P^{-}-\mathbf{P}_{\perp}^{2}=M^{2}`, display: true },
            { tex: String.raw`\psi(x,\mathbf{k}_{\perp})`, display: false },
            { tex: String.raw`F_{1}(Q^{2})=\int dx\,H(x,0,-Q^{2})`, display: true },
            { tex: String.raw`\partial_{\pm}=\frac{\partial_{0}\pm\partial_{3}}{\sqrt{2}}`, display: true },
            { tex: String.raw`h_{1}^{\perp}(x,\mathbf{k}_{\perp}^{2})`, display: false },
            { tex: String.raw`A^{+}=0`, display: false },
            { tex: String.raw`\mathcal{L}_{\mathrm{QCD}}`, display: false },
            { tex: String.raw`W(x,\mathbf{k}_{\perp},\mathbf{b}_{\perp})`, display: false },
            { tex: String.raw`\langle x \rangle = \int dx\, x\, f_{1}(x)`, display: true },
            { tex: String.raw`\Psi = \sum_{n} \psi_{n}\,|n\rangle`, display: true },
            { tex: String.raw`G_{\mu\nu}^{a}G^{a\,\mu\nu}`, display: false },
            { tex: String.raw`F_{\pi}(Q^{2})`, display: false },
        ];

        /* ── Create the overlay container ── */
        const layer = document.createElement('div');
        layer.id = 'floating-equations';
        layer.style.cssText =
            'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;overflow:hidden;';
        container.appendChild(layer);

        /* ── Spawn formula elements ── */
        const formulaEls = [];
        const W = () => container.offsetWidth;
        const H = () => container.offsetHeight;

        function rand(a, b) { return Math.random() * (b - a) + a; }

        const COLORS = [
            'rgba(99,102,241,VAR)',   // indigo
            'rgba(139,92,246,VAR)',   // violet
            'rgba(168,85,247,VAR)',   // purple
            'rgba(236,72,153,VAR)',   // pink
            'rgba(59,130,246,VAR)',   // blue
            'rgba(34,211,238,VAR)',   // cyan
            'rgba(16,185,129,VAR)',   // emerald
            'rgba(249,115,22,VAR)',   // orange
        ];

        equations.forEach((eq, i) => {
            const el = document.createElement('div');
            el.style.cssText =
                'position:absolute;will-change:transform,opacity;white-space:nowrap;transition:none;';

            const size = eq.display
                ? `font-size:clamp(14px,${rand(1.1, 1.6)}vw,26px);`
                : `font-size:clamp(12px,${rand(0.9, 1.3)}vw,22px);`;
            el.style.cssText += size;

            const colorTemplate = COLORS[Math.floor(Math.random() * COLORS.length)];
            const alpha = rand(0.55, 0.85);
            const color = colorTemplate.replace('VAR', alpha.toFixed(2));
            el.style.color = color;
            el.style.textShadow = `0 0 14px ${colorTemplate.replace('VAR', '0.4')}, 0 0 30px ${colorTemplate.replace('VAR', '0.15')}`;

            try {
                katex.render(eq.tex, el, { displayMode: eq.display, throwOnError: false });
            } catch (e) {
                el.textContent = eq.tex;
            }

            layer.appendChild(el);

            /* Animation state */
            const goingRight = Math.random() > 0.5;
            formulaEls.push({
                el,
                x: rand(0, W()),
                y: rand(0, H()),
                vx: goingRight ? rand(0.15, 0.45) : rand(-0.45, -0.15),
                vy: rand(-0.08, 0.08),
                amp: rand(10, 40),
                freq: rand(0.005, 0.02),
                phase: rand(0, Math.PI * 2),
                speed: rand(0.008, 0.025),
                baseY: 0,
                rot: rand(-0.04, 0.04),
                rotSpeed: rand(-0.0003, 0.0003),
                baseAlpha: alpha,
                alphaSpeed: rand(0.001, 0.004),
                alphaPhase: rand(0, Math.PI * 2),
            });

            formulaEls[formulaEls.length - 1].baseY = formulaEls[formulaEls.length - 1].y;
        });

        /* ── Animation loop ── */
        let t = 0;
        function animate() {
            t++;
            const w = W(), h = H();

            for (const f of formulaEls) {
                f.x += f.vx;
                const wave = Math.sin(f.x * f.freq + t * f.speed + f.phase) * f.amp;
                f.baseY += f.vy;
                f.y = f.baseY + wave;
                f.rot += f.rotSpeed;

                const opPulse = Math.sin(t * f.alphaSpeed + f.alphaPhase) * 0.1;
                const opacity = Math.max(0.4, Math.min(0.95, f.baseAlpha + opPulse));

                if (f.vx > 0 && f.x > w + 100) { f.x = -100; f.baseY = rand(0, h); }
                if (f.vx < 0 && f.x < -100) { f.x = w + 100; f.baseY = rand(0, h); }
                if (f.baseY < -60) f.baseY = h + 60;
                if (f.baseY > h + 60) f.baseY = -60;

                f.el.style.transform =
                    `translate(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px) rotate(${f.rot.toFixed(3)}rad)`;
                f.el.style.opacity = opacity.toFixed(2);
            }

            requestAnimationFrame(animate);
        }

        /* Fade in */
        layer.style.opacity = '0';
        layer.style.transition = 'opacity 1.5s ease';
        requestAnimationFrame(() => {
            layer.style.opacity = '1';
            animate();
        });
    });
})();

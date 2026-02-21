/* ── Floating Colorful Wave Dots ── */
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'wave-particles';
    canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.6;';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let W, H, particles;
    const PARTICLE_COUNT = 120;

    /* vibrant color palette */
    const COLORS = [
        '#6366f1', /* indigo */
        '#8b5cf6', /* violet */
        '#a855f7', /* purple */
        '#ec4899', /* pink */
        '#f43f5e', /* rose */
        '#f97316', /* orange */
        '#eab308', /* yellow */
        '#22d3ee', /* cyan */
        '#3b82f6', /* blue */
        '#10b981', /* emerald */
    ];

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function createParticle() {
        return {
            x: rand(0, W),
            y: rand(0, H),
            r: rand(2, 5),
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            vx: rand(-0.3, 0.3),
            vy: rand(-0.2, 0.2),
            phase: rand(0, Math.PI * 2),
            waveAmp: rand(20, 60),
            waveFreq: rand(0.005, 0.02),
            waveSpeed: rand(0.01, 0.03),
            baseY: 0,
            alpha: rand(0.3, 0.8),
        };
    }

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = createParticle();
            p.baseY = p.y;
            particles.push(p);
        }
    }

    let t = 0;
    function draw() {
        ctx.clearRect(0, 0, W, H);
        t += 1;

        for (const p of particles) {
            /* wave motion */
            const waveOffset =
                Math.sin(p.x * p.waveFreq + t * p.waveSpeed + p.phase) * p.waveAmp;

            p.x += p.vx;
            p.baseY += p.vy;
            p.y = p.baseY + waveOffset;

            /* wrap around edges */
            if (p.x < -10) p.x = W + 10;
            if (p.x > W + 10) p.x = -10;
            if (p.baseY < -10) { p.baseY = H + 10; p.y = p.baseY; }
            if (p.baseY > H + 10) { p.baseY = -10; p.y = p.baseY; }

            /* glow */
            const gradient = ctx.createRadialGradient(
                p.x, p.y, 0, p.x, p.y, p.r * 3
            );
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.globalAlpha = p.alpha;
            ctx.fill();

            /* solid core */
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha + 0.2;
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    init();
    draw();
})();

/* ── Floating Colorful Wave Dots — Home Section Only + Mouse Following ── */
(function () {
    const hero = document.getElementById('home');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'wave-particles';
    canvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    hero.style.position = 'relative';
    hero.style.overflow = 'hidden';
    hero.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let W, H, particles;
    const COUNT = 100;
    let mouseX = -1000, mouseY = -1000;

    const COLORS = [
        '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
        '#f43f5e', '#f97316', '#eab308', '#22d3ee',
        '#3b82f6', '#10b981',
    ];

    function rand(a, b) { return Math.random() * (b - a) + a; }

    function makeParticle() {
        return {
            x: rand(0, W), y: rand(0, H),
            r: rand(2, 5),
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            vx: rand(-0.4, 0.4), vy: rand(-0.2, 0.2),
            phase: rand(0, Math.PI * 2),
            amp: rand(15, 50),
            freq: rand(0.008, 0.025),
            speed: rand(0.015, 0.04),
            baseY: 0,
            alpha: rand(0.35, 0.85),
        };
    }

    function resize() {
        const rect = hero.getBoundingClientRect();
        W = canvas.width = rect.width;
        H = canvas.height = rect.height;
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < COUNT; i++) {
            const p = makeParticle();
            p.baseY = p.y;
            particles.push(p);
        }
    }

    /* track mouse within hero */
    hero.addEventListener('mousemove', function (e) {
        const rect = hero.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', function () {
        mouseX = -1000; mouseY = -1000;
    });

    let t = 0;
    function draw() {
        ctx.clearRect(0, 0, W, H);
        t++;

        for (const p of particles) {
            /* wave motion */
            const wave = Math.sin(p.x * p.freq + t * p.speed + p.phase) * p.amp;
            p.x += p.vx;
            p.baseY += p.vy;
            p.y = p.baseY + wave;

            /* mouse attraction — gently pull toward cursor */
            const dx = mouseX - p.x;
            const dy = mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200 && dist > 0) {
                const force = (200 - dist) / 200 * 0.6;
                p.x += dx / dist * force;
                p.baseY += dy / dist * force * 0.5;
            }

            /* wrap edges */
            if (p.x < -10) p.x = W + 10;
            if (p.x > W + 10) p.x = -10;
            if (p.baseY < -10) { p.baseY = H + 10; }
            if (p.baseY > H + 10) { p.baseY = -10; }

            /* glow */
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
            g.addColorStop(0, p.color);
            g.addColorStop(1, 'transparent');
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();

            /* core */
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.min(1, p.alpha + 0.2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    init();
    draw();
})();

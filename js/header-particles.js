/* ── Antigravity-style Floating Particles for Header ── */
(function () {
    const container = document.getElementById('header-particles-wrap');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'header-particles';
    canvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    container.insertBefore(canvas, container.firstChild);

    const ctx = canvas.getContext('2d');
    let W, H;

    /* ── Mouse tracking ── */
    let mouseX = -9999, mouseY = -9999;
    container.addEventListener('mousemove', function (e) {
        const rect = container.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    container.addEventListener('mouseleave', function () {
        mouseX = -9999;
        mouseY = -9999;
    });

    /* ── Rich multi-color palette ── */
    const PALETTE = [
        [99, 102, 241],    // indigo
        [139, 92, 246],    // violet
        [168, 85, 247],    // purple
        [59, 130, 246],    // blue
        [34, 211, 238],    // cyan
        [236, 72, 153],    // pink
        [16, 185, 129],    // emerald
        [251, 191, 36],    // amber/gold
        [244, 63, 94],     // rose
        [56, 189, 248],    // sky blue
        [167, 139, 250],   // light violet
        [52, 211, 153],    // teal
        [255, 255, 255],   // white
        [200, 210, 255],   // lavender
    ];

    /* ── Particle class ── */
    const PARTICLE_COUNT = 90;
    const CONNECTION_DIST = 100;
    const MOUSE_RADIUS = 120;
    const particles = [];

    function rand(a, b) { return Math.random() * (b - a) + a; }

    function createParticle() {
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        return {
            x: rand(0, W || 1400),
            y: rand(0, H || 140),
            vx: rand(-0.3, 0.3),
            vy: rand(-0.15, 0.15),
            size: rand(1, 3),
            color: color,
            alpha: rand(0.3, 0.85),
            pulseSpeed: rand(0.005, 0.02),
            pulsePhase: rand(0, Math.PI * 2),
        };
    }

    function initParticles() {
        particles.length = 0;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle());
        }
    }

    function resize() {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        W = rect.width;
        H = rect.height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (particles.length === 0) initParticles();
    }

    /* ── Animation loop ── */
    let time = 0;

    function draw() {
        ctx.clearRect(0, 0, W, H);
        time += 0.016;

        /* Update particles */
        for (const p of particles) {
            /* Gentle drift */
            p.x += p.vx;
            p.y += p.vy;

            /* Mouse repulsion */
            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_RADIUS && dist > 0) {
                const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
                p.x += (dx / dist) * force * 1.5;
                p.y += (dy / dist) * force * 1.5;
            }

            /* Wrap around edges */
            if (p.x < -10) p.x = W + 10;
            if (p.x > W + 10) p.x = -10;
            if (p.y < -10) p.y = H + 10;
            if (p.y > H + 10) p.y = -10;

            /* Pulse alpha */
            const pulse = Math.sin(time * p.pulseSpeed * 60 + p.pulsePhase) * 0.15;
            const alpha = Math.max(0.1, Math.min(1, p.alpha + pulse));

            /* Draw glow */
            const [r, g, b] = p.color;
            const glowR = p.size * 4;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
            grad.addColorStop(0, `rgba(${r},${g},${b},${(alpha * 0.4).toFixed(3)})`);
            grad.addColorStop(0.5, `rgba(${r},${g},${b},${(alpha * 0.08).toFixed(3)})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            /* Draw core dot */
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, alpha + 0.2).toFixed(3)})`;
            ctx.fill();
        }

        /* Draw connections */
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i], b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECTION_DIST) {
                    const opacity = (1 - dist / CONNECTION_DIST) * 0.12;
                    const [r, g, b_] = a.color;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(${r},${g},${b_},${opacity.toFixed(3)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
})();

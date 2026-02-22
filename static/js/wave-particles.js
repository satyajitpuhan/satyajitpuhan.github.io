/* ── Orbital Rotating Dots — Antigravity-inspired — Home Section ── */
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
    let W, H;
    let mouseX = -9999, mouseY = -9999;

    /* ── Palette — soft electric blues, lavenders, cyans ── */
    const COLORS = [
        [99, 102, 241],   // indigo
        [139, 92, 246],   // violet
        [168, 85, 247],   // purple
        [59, 130, 246],   // blue
        [34, 211, 238],   // cyan
        [236, 72, 153],   // pink
        [16, 185, 129],   // emerald
        [249, 115, 22],   // orange
        [255, 255, 255],  // white
        [200, 200, 255],  // light lavender
    ];

    function rand(a, b) { return Math.random() * (b - a) + a; }

    /* ── Build orbits — each orbit is a tilted ellipse ── */
    const ORBIT_COUNT = 6;
    const PARTICLES_PER_ORBIT = 18;
    const orbits = [];
    const particles = [];

    function buildOrbits() {
        orbits.length = 0;
        particles.length = 0;

        const cx = W * 0.5;
        const cy = H * 0.5;

        for (let o = 0; o < ORBIT_COUNT; o++) {
            const orbit = {
                cx: cx + rand(-W * 0.1, W * 0.1),
                cy: cy + rand(-H * 0.1, H * 0.1),
                rx: rand(W * 0.15, W * 0.45),   // semi-major axis
                ry: rand(H * 0.1, H * 0.35),     // semi-minor axis
                tilt: rand(-0.6, 0.6),            // radians tilt
                speed: rand(0.0008, 0.003) * (Math.random() > 0.5 ? 1 : -1),
            };
            orbits.push(orbit);

            const count = PARTICLES_PER_ORBIT + Math.floor(rand(-5, 8));
            for (let i = 0; i < count; i++) {
                const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                particles.push({
                    orbit: o,
                    angle: rand(0, Math.PI * 2),
                    radiusJitter: rand(0.85, 1.15),  // slight orbit deviation
                    size: rand(1.2, 3.5),
                    alpha: rand(0.3, 0.9),
                    color,
                    twinkleSpeed: rand(0.01, 0.04),
                    twinklePhase: rand(0, Math.PI * 2),
                    trail: rand(0.02, 0.06),  // trail length factor
                });
            }
        }

        /* Add extra scattered "starfield" particles */
        for (let i = 0; i < 40; i++) {
            particles.push({
                orbit: -1,  // no orbit — free floating
                x: rand(0, W),
                y: rand(0, H),
                vx: rand(-0.15, 0.15),
                vy: rand(-0.1, 0.1),
                size: rand(0.8, 2),
                alpha: rand(0.15, 0.5),
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                twinkleSpeed: rand(0.005, 0.02),
                twinklePhase: rand(0, Math.PI * 2),
            });
        }
    }

    function resize() {
        const rect = hero.getBoundingClientRect();
        W = canvas.width = rect.width;
        H = canvas.height = rect.height;
        buildOrbits();
    }

    /* ── Mouse tracking ── */
    hero.addEventListener('mousemove', function (e) {
        const rect = hero.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', function () {
        mouseX = -9999; mouseY = -9999;
    });

    /* ── Draw loop ── */
    let t = 0;
    function draw() {
        /* Subtle fade trail instead of full clear — gives motion trails */
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(0, 0, W, H);
        ctx.clearRect(0, 0, W, H);

        t++;

        for (const p of particles) {
            let px, py, depth;

            if (p.orbit >= 0) {
                /* Orbital particle */
                const orb = orbits[p.orbit];
                p.angle += orb.speed;

                const cosT = Math.cos(orb.tilt);
                const sinT = Math.sin(orb.tilt);
                const cosA = Math.cos(p.angle);
                const sinA = Math.sin(p.angle);

                const ex = orb.rx * p.radiusJitter * cosA;
                const ey = orb.ry * p.radiusJitter * sinA;

                /* Apply tilt rotation */
                px = orb.cx + ex * cosT - ey * sinT;
                py = orb.cy + ex * sinT + ey * cosT;

                /* Depth: particles "behind" center are smaller/dimmer */
                depth = 0.5 + 0.5 * sinA;  // 0 = far, 1 = near
            } else {
                /* Free-floating starfield particle */
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < -5) p.x = W + 5;
                if (p.x > W + 5) p.x = -5;
                if (p.y < -5) p.y = H + 5;
                if (p.y > H + 5) p.y = -5;
                px = p.x;
                py = p.y;
                depth = 0.3;
            }

            /* Mouse repulsion — subtle push away */
            const dx = px - mouseX;
            const dy = py - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150 && dist > 0) {
                const force = (150 - dist) / 150 * 12;
                px += (dx / dist) * force;
                py += (dy / dist) * force;
            }

            /* Twinkle */
            const twinkle = 0.5 + 0.5 * Math.sin(t * p.twinkleSpeed + p.twinklePhase);
            const alpha = p.alpha * (0.5 + 0.5 * twinkle) * (0.4 + 0.6 * depth);
            const size = p.size * (0.5 + 0.5 * depth);

            const [r, g, b] = p.color;

            /* Outer glow */
            const glowRadius = size * 4;
            const grad = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
            grad.addColorStop(0, `rgba(${r},${g},${b},${(alpha * 0.6).toFixed(2)})`);
            grad.addColorStop(0.4, `rgba(${r},${g},${b},${(alpha * 0.2).toFixed(2)})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.beginPath();
            ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            /* Core dot */
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, alpha + 0.3).toFixed(2)})`;
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
})();

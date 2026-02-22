/* ── 3D Rotating Sphere of Dots — Mouse-following center ── */
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

    /* ── Mouse tracking with smooth easing ── */
    let targetX, targetY, currentX, currentY;

    function resize() {
        const rect = hero.getBoundingClientRect();
        W = canvas.width = rect.width;
        H = canvas.height = rect.height;
        targetX = currentX = W / 2;
        targetY = currentY = H / 2;
    }

    hero.addEventListener('mousemove', function (e) {
        const rect = hero.getBoundingClientRect();
        targetX = e.clientX - rect.left;
        targetY = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', function () {
        targetX = W / 2;
        targetY = H / 2;
    });

    /* ── Color palette ── */
    const COLORS = [
        [99, 102, 241],   // indigo
        [139, 92, 246],   // violet
        [168, 85, 247],   // purple
        [59, 130, 246],   // blue
        [34, 211, 238],   // cyan
        [236, 72, 153],   // pink
        [16, 185, 129],   // emerald
        [255, 255, 255],  // white
        [200, 210, 255],  // lavender
    ];

    /* ── Build sphere points using Fibonacci distribution ── */
    const DOT_COUNT = 200;
    const RADIUS = 180;
    const dots = [];

    function rand(a, b) { return Math.random() * (b - a) + a; }

    for (let i = 0; i < DOT_COUNT; i++) {
        /* Fibonacci sphere for even distribution */
        const phi = Math.acos(1 - 2 * (i + 0.5) / DOT_COUNT);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;

        dots.push({
            /* Spherical coordinates */
            theta: theta,
            phi: phi,
            /* 3D position (computed each frame) */
            x3d: 0, y3d: 0, z3d: 0,
            /* Projected 2D */
            px: 0, py: 0,
            /* Visual */
            size: rand(1.5, 3.5),
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            alpha: rand(0.5, 1.0),
        });
    }

    /* ── Rotation angles ── */
    let rotX = 0;
    let rotY = 0;

    /* ── Draw loop ── */
    function draw() {
        ctx.clearRect(0, 0, W, H);

        /* Smooth mouse follow */
        currentX += (targetX - currentX) * 0.04;
        currentY += (targetY - currentY) * 0.04;

        /* Auto-rotate */
        rotY += 0.006;
        rotX += 0.002;

        const cosRx = Math.cos(rotX), sinRx = Math.sin(rotX);
        const cosRy = Math.cos(rotY), sinRy = Math.sin(rotY);

        /* Responsive sphere radius */
        const R = Math.min(W, H) * 0.22;

        /* Project each dot */
        for (const d of dots) {
            /* Spherical to Cartesian */
            let x = R * Math.sin(d.phi) * Math.cos(d.theta);
            let y = R * Math.sin(d.phi) * Math.sin(d.theta);
            let z = R * Math.cos(d.phi);

            /* Rotate around Y-axis */
            let x1 = x * cosRy - z * sinRy;
            let z1 = x * sinRy + z * cosRy;

            /* Rotate around X-axis */
            let y1 = y * cosRx - z1 * sinRx;
            let z2 = y * sinRx + z1 * cosRx;

            d.x3d = x1;
            d.y3d = y1;
            d.z3d = z2;

            /* Perspective projection */
            const perspective = 600;
            const scale = perspective / (perspective + z2);

            d.px = currentX + x1 * scale;
            d.py = currentY + y1 * scale;
            d.projScale = scale;
        }

        /* Sort by depth (far dots drawn first) */
        dots.sort((a, b) => a.z3d - b.z3d);

        /* Draw each dot */
        for (const d of dots) {
            const depth = (d.z3d + R) / (2 * R);  // 0 = far, 1 = near
            const alpha = d.alpha * (0.15 + 0.85 * depth);
            const size = d.size * d.projScale;
            const [r, g, b] = d.color;

            /* Glow halo */
            const glowR = size * 3.5;
            const grad = ctx.createRadialGradient(d.px, d.py, 0, d.px, d.py, glowR);
            grad.addColorStop(0, `rgba(${r},${g},${b},${(alpha * 0.5).toFixed(2)})`);
            grad.addColorStop(0.5, `rgba(${r},${g},${b},${(alpha * 0.12).toFixed(2)})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.beginPath();
            ctx.arc(d.px, d.py, glowR, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            /* Core dot */
            ctx.beginPath();
            ctx.arc(d.px, d.py, Math.max(0.5, size), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, alpha + 0.3).toFixed(2)})`;
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
})();

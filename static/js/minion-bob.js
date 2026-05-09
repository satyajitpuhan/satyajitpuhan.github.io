/* ── Premium 3D Minion Bob — Roams freely across the page ── */
(function () {
    'use strict';

    const CFG = {
        H: 110, W: 72,
        speed: 1.6, bounce: 5,
        legSwing: 0.5, armSwing: 0.4,
        walkSpeed: 0.11,
        dirMin: 140, dirMax: 400,
        margin: 50,
        blinkInterval: 180, blinkDur: 8,
        idlePause: 600
    };

    const canvas = document.createElement('canvas');
    canvas.id = 'minion-bob-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W, H, x, y, dirX = 1, dirY = 0, frame = 0;
    let nextDir = rand(CFG.dirMin, CFG.dirMax), dirFrames = 0;
    let blinkTimer = rand(100, CFG.blinkInterval), isBlinking = false, blinkFrame = 0;
    let isIdle = false, idleTimer = 0;

    function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        if (x === undefined) { x = rand(100, W - 100); y = H - CFG.margin - CFG.H; }
    }
    window.addEventListener('resize', resize);

    function pickDir() {
        dirX = Math.random() > 0.3 ? dirX : -dirX;
        const v = Math.random();
        dirY = v < 0.3 ? -1 : v < 0.6 ? 1 : 0;
        if (Math.random() < 0.15) { isIdle = true; idleTimer = rand(120, CFG.idlePause); }
        nextDir = rand(CFG.dirMin, CFG.dirMax);
        dirFrames = 0;
    }

    /* ── Helpers ── */
    function rr(cx, cy, w, h, r) {
        const x0 = cx - w / 2, y0 = cy - h / 2;
        ctx.beginPath();
        ctx.moveTo(x0 + r, y0);
        ctx.arcTo(x0 + w, y0, x0 + w, y0 + h, r);
        ctx.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
        ctx.arcTo(x0, y0 + h, x0, y0, r);
        ctx.arcTo(x0, y0, x0 + w, y0, r);
        ctx.closePath();
    }

    function capsule(cx, cy, w, h) {
        const r = w / 2;
        ctx.beginPath();
        ctx.moveTo(cx - r, cy - h / 2 + r);
        ctx.arcTo(cx - r, cy - h / 2, cx, cy - h / 2, r);
        ctx.arcTo(cx + r, cy - h / 2, cx + r, cy - h / 2 + r, r);
        ctx.lineTo(cx + r, cy + h / 2 - r);
        ctx.arcTo(cx + r, cy + h / 2, cx, cy + h / 2, r);
        ctx.arcTo(cx - r, cy + h / 2, cx - r, cy + h / 2 - r, r);
        ctx.closePath();
    }

    /* ── Draw the 3D Minion ── */
    function drawMinion(bx, by, wp, facing) {
        ctx.save();
        ctx.translate(bx, by);
        if (facing < 0) ctx.scale(-1, 1);

        const la = isIdle ? 0 : Math.sin(wp) * CFG.legSwing;
        const aa = isIdle ? Math.sin(frame * 0.03) * 0.15 : Math.sin(wp + Math.PI) * CFG.armSwing;
        const bw = CFG.W * 0.82, bh = CFG.H * 0.62;
        const bodyY = -bh * 0.12;

        /* ── Shadow ── */
        ctx.save();
        const sg = ctx.createRadialGradient(0, CFG.H * 0.5, 2, 0, CFG.H * 0.5, bw * 0.55);
        sg.addColorStop(0, 'rgba(0,0,0,0.18)');
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.ellipse(0, CFG.H * 0.5, bw * 0.55, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        /* ── Legs ── */
        for (let side = -1; side <= 1; side += 2) {
            ctx.save();
            ctx.translate(side * 9, CFG.H * 0.28);
            ctx.rotate(side === -1 ? la : -la);
            // Leg
            rr(0, 11, 13, 20, 3);
            const legG = ctx.createLinearGradient(-6, 0, 6, 0);
            legG.addColorStop(0, '#3A6BA5');
            legG.addColorStop(0.5, '#4A7FBF');
            legG.addColorStop(1, '#3A6BA5');
            ctx.fillStyle = legG;
            ctx.fill();
            ctx.strokeStyle = '#2E5580';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            // Shoe
            ctx.beginPath();
            ctx.ellipse(side * 2, 22, 10, 7, 0, 0, Math.PI * 2);
            const shG = ctx.createRadialGradient(side * 2, 20, 1, side * 2, 22, 10);
            shG.addColorStop(0, '#3a3a3a');
            shG.addColorStop(1, '#111');
            ctx.fillStyle = shG;
            ctx.fill();
            // Shoe sole
            ctx.beginPath();
            ctx.ellipse(side * 2, 25, 9, 3, 0, 0, Math.PI);
            ctx.fillStyle = '#555';
            ctx.fill();
            ctx.restore();
        }

        /* ── Left Arm (behind) ── */
        ctx.save();
        ctx.translate(-bw * 0.46, -CFG.H * 0.06);
        ctx.rotate(aa);
        rr(0, 14, 10, 24, 4);
        const laG = ctx.createLinearGradient(-5, 0, 5, 0);
        laG.addColorStop(0, '#D4A017');
        laG.addColorStop(0.4, '#F5D547');
        laG.addColorStop(1, '#D4A017');
        ctx.fillStyle = laG;
        ctx.fill();
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 0.6;
        ctx.stroke();
        // Glove
        ctx.beginPath();
        ctx.arc(0, 27, 7, 0, Math.PI * 2);
        const glG = ctx.createRadialGradient(-1, 25, 1, 0, 27, 7);
        glG.addColorStop(0, '#444');
        glG.addColorStop(1, '#111');
        ctx.fillStyle = glG;
        ctx.fill();
        // Glove fingers
        for (let f = -1; f <= 1; f++) {
            ctx.beginPath();
            ctx.ellipse(f * 4, 31, 2.5, 3, f * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#222';
            ctx.fill();
        }
        ctx.restore();

        /* ── Body (3D capsule) ── */
        ctx.save();
        capsule(0, bodyY, bw, bh);
        const bg = ctx.createLinearGradient(-bw / 2, bodyY, bw / 2, bodyY);
        bg.addColorStop(0, '#C89520');
        bg.addColorStop(0.15, '#E8C030');
        bg.addColorStop(0.35, '#F5D547');
        bg.addColorStop(0.55, '#FFEB80');
        bg.addColorStop(0.75, '#F5D547');
        bg.addColorStop(1, '#C89520');
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // Top highlight
        ctx.save();
        capsule(0, bodyY, bw, bh);
        ctx.clip();
        const hl = ctx.createLinearGradient(0, bodyY - bh / 2, 0, bodyY - bh / 4);
        hl.addColorStop(0, 'rgba(255,255,255,0.35)');
        hl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hl;
        ctx.fillRect(-bw / 2, bodyY - bh / 2, bw, bh / 3);
        ctx.restore();
        ctx.restore();

        /* ── Overalls ── */
        ctx.save();
        const ovT = CFG.H * 0.04, ovH = bh * 0.44;
        // Main overall body
        rr(0, ovT + ovH * 0.3, bw * 0.96, ovH, 5);
        const ovG = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
        ovG.addColorStop(0, '#2E5580');
        ovG.addColorStop(0.3, '#4A7FBF');
        ovG.addColorStop(0.7, '#4A7FBF');
        ovG.addColorStop(1, '#2E5580');
        ctx.fillStyle = ovG;
        ctx.fill();
        ctx.strokeStyle = '#1E3D5E';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Bib
        ctx.beginPath();
        ctx.moveTo(-bw * 0.28, ovT - 2);
        ctx.lineTo(bw * 0.28, ovT - 2);
        ctx.lineTo(bw * 0.35, ovT + ovH * 0.3);
        ctx.lineTo(-bw * 0.35, ovT + ovH * 0.3);
        ctx.closePath();
        ctx.fillStyle = ovG;
        ctx.fill();
        ctx.strokeStyle = '#1E3D5E';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Pocket
        rr(0, ovT + 7, bw * 0.3, ovH * 0.3, 3);
        const pkG = ctx.createLinearGradient(0, ovT + 2, 0, ovT + 14);
        pkG.addColorStop(0, '#3A6BA5');
        pkG.addColorStop(1, '#2E5580');
        ctx.fillStyle = pkG;
        ctx.fill();
        ctx.strokeStyle = '#1E3D5E';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // "G" logo
        ctx.fillStyle = '#FFE066';
        ctx.font = 'bold 8px "Arial Black", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('G', 0, ovT + 9);

        // Straps
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#3A6BA5';
        ctx.beginPath();
        ctx.moveTo(-bw * 0.26, ovT); ctx.lineTo(-bw * 0.34, -CFG.H * 0.17);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bw * 0.26, ovT); ctx.lineTo(bw * 0.34, -CFG.H * 0.17);
        ctx.stroke();
        // Buttons
        for (let s = -1; s <= 1; s += 2) {
            ctx.beginPath();
            ctx.arc(s * bw * 0.34, -CFG.H * 0.17, 3, 0, Math.PI * 2);
            const btnG = ctx.createRadialGradient(s * bw * 0.34 - 0.5, -CFG.H * 0.17 - 0.5, 0.5, s * bw * 0.34, -CFG.H * 0.17, 3);
            btnG.addColorStop(0, '#999');
            btnG.addColorStop(1, '#444');
            ctx.fillStyle = btnG;
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
        // Stitching lines
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-bw * 0.46, ovT + ovH * 0.1); ctx.lineTo(bw * 0.46, ovT + ovH * 0.1);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        /* ── Goggle Band ── */
        const gY = -CFG.H * 0.28;
        const gR = bw * 0.30;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-bw / 2 - 2, gY);
        ctx.lineTo(bw / 2 + 2, gY);
        const bandG = ctx.createLinearGradient(0, gY - 5, 0, gY + 5);
        bandG.addColorStop(0, '#777');
        bandG.addColorStop(0.3, '#555');
        bandG.addColorStop(0.7, '#444');
        bandG.addColorStop(1, '#333');
        ctx.strokeStyle = bandG;
        ctx.lineWidth = 9;
        ctx.stroke();
        // Band texture
        ctx.beginPath();
        ctx.moveTo(-bw / 2, gY - 3);
        ctx.lineTo(bw / 2, gY - 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        /* ── Goggle Rim (metallic) ── */
        ctx.save();
        // Outer ring
        ctx.beginPath();
        ctx.arc(0, gY, gR + 5, 0, Math.PI * 2);
        const rimOG = ctx.createLinearGradient(0, gY - gR - 5, 0, gY + gR + 5);
        rimOG.addColorStop(0, '#CCC');
        rimOG.addColorStop(0.2, '#999');
        rimOG.addColorStop(0.5, '#777');
        rimOG.addColorStop(0.8, '#555');
        rimOG.addColorStop(1, '#888');
        ctx.fillStyle = rimOG;
        ctx.fill();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Inner ring
        ctx.beginPath();
        ctx.arc(0, gY, gR + 2, 0, Math.PI * 2);
        const rimIG = ctx.createLinearGradient(0, gY - gR, 0, gY + gR);
        rimIG.addColorStop(0, '#AAA');
        rimIG.addColorStop(0.5, '#666');
        rimIG.addColorStop(1, '#999');
        ctx.fillStyle = rimIG;
        ctx.fill();
        // Screws on goggle
        for (let a = 0; a < 4; a++) {
            const angle = a * Math.PI / 2 + Math.PI / 4;
            const sx = Math.cos(angle) * (gR + 3.5);
            const sy = gY + Math.sin(angle) * (gR + 3.5);
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#888';
            ctx.fill();
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 0.3;
            ctx.stroke();
        }
        ctx.restore();

        /* ── Eye (glass lens) ── */
        ctx.save();
        // Glass background
        ctx.beginPath();
        ctx.arc(0, gY, gR - 2, 0, Math.PI * 2);
        const lensG = ctx.createRadialGradient(-3, gY - 3, 1, 0, gY, gR - 2);
        lensG.addColorStop(0, '#FFFFFF');
        lensG.addColorStop(0.7, '#F0F0F0');
        lensG.addColorStop(1, '#D8D8D8');
        ctx.fillStyle = lensG;
        ctx.fill();

        // Blink check
        if (!isBlinking) {
            // Iris
            const ix = facing * 2.5;
            ctx.beginPath();
            ctx.arc(ix, gY, gR * 0.48, 0, Math.PI * 2);
            const irisG = ctx.createRadialGradient(ix, gY, 1, ix, gY, gR * 0.48);
            irisG.addColorStop(0, '#8B5E3C');
            irisG.addColorStop(0.6, '#6B4226');
            irisG.addColorStop(1, '#4A2D15');
            ctx.fillStyle = irisG;
            ctx.fill();

            // Pupil
            ctx.beginPath();
            ctx.arc(ix + facing * 0.8, gY, gR * 0.22, 0, Math.PI * 2);
            ctx.fillStyle = '#0A0A0A';
            ctx.fill();

            // Eye highlight (big)
            ctx.beginPath();
            ctx.arc(ix - 3, gY - 4, gR * 0.14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.92)';
            ctx.fill();

            // Eye highlight (small)
            ctx.beginPath();
            ctx.arc(ix + 2, gY + 2, gR * 0.07, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fill();
        } else {
            // Closed eye line
            ctx.beginPath();
            ctx.arc(0, gY, gR * 0.35, 0.1, Math.PI - 0.1);
            ctx.strokeStyle = '#4A2D15';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        // Lens glass reflection
        ctx.beginPath();
        ctx.arc(0, gY, gR - 2, 0, Math.PI * 2);
        const glassRef = ctx.createLinearGradient(-gR, gY - gR, gR, gY + gR);
        glassRef.addColorStop(0, 'rgba(255,255,255,0.18)');
        glassRef.addColorStop(0.4, 'rgba(255,255,255,0)');
        glassRef.addColorStop(0.8, 'rgba(255,255,255,0.06)');
        ctx.fillStyle = glassRef;
        ctx.fill();
        ctx.restore();

        /* ── Mouth ── */
        ctx.save();
        const mY = -CFG.H * 0.07;
        if (isIdle && Math.sin(frame * 0.05) > 0.5) {
            // Happy open mouth
            ctx.beginPath();
            ctx.arc(0, mY, 9, 0.1, Math.PI - 0.1);
            ctx.fillStyle = '#8B1A1A';
            ctx.fill();
            // Teeth
            ctx.beginPath();
            ctx.rect(-5, mY - 1, 10, 4);
            ctx.fillStyle = '#FFF';
            ctx.fill();
            ctx.strokeStyle = '#DDD';
            ctx.lineWidth = 0.3;
            ctx.beginPath(); ctx.moveTo(0, mY - 1); ctx.lineTo(0, mY + 3); ctx.stroke();
            // Tongue
            ctx.beginPath();
            ctx.ellipse(0, mY + 5, 4, 3, 0, 0, Math.PI);
            ctx.fillStyle = '#D44';
            ctx.fill();
        } else {
            // Normal smile
            ctx.beginPath();
            ctx.arc(0, mY - 2, 7, 0.2, Math.PI - 0.2);
            ctx.strokeStyle = '#6B2A1A';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        ctx.restore();

        /* ── Hair ── */
        ctx.save();
        ctx.strokeStyle = '#2A1B0F';
        ctx.lineCap = 'round';
        const hb = -CFG.H * 0.47;
        const hairs = [
            { x: 0, cp1x: 3, cp1y: -10, ex: -2, ey: -16, w: 2.2 },
            { x: -5, cp1x: -9, cp1y: -7, ex: -12, ey: -12, w: 1.8 },
            { x: 5, cp1x: 9, cp1y: -7, ex: 12, ey: -12, w: 1.8 },
            { x: -3, cp1x: -7, cp1y: -8, ex: -7, ey: -13, w: 1.4 },
            { x: 3, cp1x: 7, cp1y: -8, ex: 7, ey: -13, w: 1.4 },
            { x: -7, cp1x: -12, cp1y: -4, ex: -15, ey: -8, w: 1.2 },
            { x: 7, cp1x: 12, cp1y: -4, ex: 15, ey: -8, w: 1.2 },
        ];
        const windOff = Math.sin(frame * 0.04) * 2;
        hairs.forEach(h => {
            ctx.lineWidth = h.w;
            ctx.beginPath();
            ctx.moveTo(h.x, hb + 2);
            ctx.quadraticCurveTo(h.cp1x + windOff, hb + h.cp1y, h.ex + windOff * 1.5, hb + h.ey);
            ctx.stroke();
        });
        ctx.restore();

        /* ── Right Arm (front) ── */
        ctx.save();
        ctx.translate(bw * 0.46, -CFG.H * 0.06);
        ctx.rotate(-aa);
        rr(0, 14, 10, 24, 4);
        const raG = ctx.createLinearGradient(-5, 0, 5, 0);
        raG.addColorStop(0, '#D4A017');
        raG.addColorStop(0.5, '#F5D547');
        raG.addColorStop(1, '#D4A017');
        ctx.fillStyle = raG;
        ctx.fill();
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 0.6;
        ctx.stroke();
        // Glove
        ctx.beginPath();
        ctx.arc(0, 27, 7, 0, Math.PI * 2);
        const grG = ctx.createRadialGradient(-1, 25, 1, 0, 27, 7);
        grG.addColorStop(0, '#444');
        grG.addColorStop(1, '#111');
        ctx.fillStyle = grG;
        ctx.fill();
        for (let f = -1; f <= 1; f++) {
            ctx.beginPath();
            ctx.ellipse(f * 4, 31, 2.5, 3, f * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#222';
            ctx.fill();
        }
        ctx.restore();

        ctx.restore();
    }

    /* ── Animation Loop ── */
    function animate() {
        ctx.clearRect(0, 0, W, H);
        frame++;
        dirFrames++;

        // Blink logic
        blinkTimer--;
        if (blinkTimer <= 0 && !isBlinking) {
            isBlinking = true;
            blinkFrame = 0;
        }
        if (isBlinking) {
            blinkFrame++;
            if (blinkFrame > CFG.blinkDur) {
                isBlinking = false;
                blinkTimer = rand(100, CFG.blinkInterval);
            }
        }

        // Idle logic
        if (isIdle) {
            idleTimer--;
            if (idleTimer <= 0) isIdle = false;
        }

        const wp = frame * CFG.walkSpeed;
        const bounce = isIdle ? Math.sin(frame * 0.05) * 2 : Math.abs(Math.sin(wp)) * CFG.bounce;

        if (dirFrames >= nextDir) pickDir();

        if (!isIdle) {
            x += CFG.speed * dirX;
            y += CFG.speed * 0.5 * dirY;
        }

        if (x > W + CFG.W) dirX = -1;
        else if (x < -CFG.W) dirX = 1;
        if (y < CFG.margin + CFG.H) { dirY = 1; y = CFG.margin + CFG.H; }
        else if (y > H - CFG.margin) { dirY = -1; y = H - CFG.margin; }

        drawMinion(x, y - bounce, wp, dirX);
        requestAnimationFrame(animate);
    }

    resize();
    animate();
})();

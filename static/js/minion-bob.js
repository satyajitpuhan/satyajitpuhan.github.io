// ── Premium 3D Minion Bob — Hyper-Realistic ──
(function () {
    'use strict';

    const CFG = {
        H: 140, W: 95,
        speed: 1.38, bounce: 8,
        legSwing: 0.42, armSwing: 0.32,
        walkSpeed: 0.105,
        dirMin: 120, dirMax: 280,
        margin: 65,
        blinkInterval: 130, blinkDur: 8,
        idlePause: 460
    };

    const canvas = document.createElement('canvas');
    canvas.id = 'minion-bob-canvas';
    canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
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

    // Helper for round-rect
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

    /* ── 3D Minion Drawing Routine ── */
    function drawMinion(bx, by, wp, facing) {
        ctx.save();
        ctx.translate(bx, by);
        if (facing < 0) ctx.scale(-1, 1);

        // Perspective float/yaw
        const legAngle = isIdle ? 0 : Math.sin(wp) * CFG.legSwing;
        const armAngle = isIdle ? Math.sin(frame * 0.03) * 0.20 : Math.sin(wp + Math.PI) * CFG.armSwing;
        const bodyYaw = Math.sin(wp) * 0.07;
        const fw = CFG.W * 0.84, fh = CFG.H * 0.67;
        const bodyY = -fh * 0.11 + Math.sin(wp) * 2;
        const shadowY = CFG.H * 0.52;

        // ====== Shadow (diffuse/soft) ======
        ctx.save();
        let sg = ctx.createRadialGradient(0, shadowY, 1, 0, shadowY, fw * 0.68);
        sg.addColorStop(0, 'rgba(0,0,0,0.27)');
        sg.addColorStop(0.75, 'rgba(0,0,0,0.09)');
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.ellipse(0, shadowY, fw * 0.66, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.33;
        ctx.ellipse(-10, shadowY + 5, fw * 0.43, 6.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // ====== Legs (bump shading) ======
        for (let side = -1; side <= 1; side += 2) {
            ctx.save();
            ctx.translate(side * 13, CFG.H * 0.28);
            ctx.rotate(side === -1 ? legAngle : -legAngle);
            rr(0, 16, 17, 32, 4.5);
            let legG = ctx.createLinearGradient(-8.5, 0, 8.5, 0);
            legG.addColorStop(0, '#32507b');
            legG.addColorStop(0.2, '#547ad0');
            legG.addColorStop(0.6, '#96baff');
            legG.addColorStop(0.8, '#4269a8');
            legG.addColorStop(1, '#264575');
            ctx.fillStyle = legG;
            ctx.shadowColor = 'rgba(30,40,60,0.45)';
            ctx.shadowBlur = 3.8;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#2b3c56';
            ctx.lineWidth = 1.1;
            ctx.stroke();

            // Shoe
            ctx.beginPath();
            ctx.ellipse(side * 2.5, 32, 17, 10, -0.18 * side, 0, Math.PI * 2);
            let shG = ctx.createRadialGradient(side * 2.5, 33, 5, side * 2.5, 35.5, 11);
            shG.addColorStop(0, '#343639');
            shG.addColorStop(0.7, '#111');
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = shG;
            ctx.fill();

            // Shoe highlight/sole
            ctx.globalAlpha = 0.55;
            ctx.beginPath();
            ctx.ellipse(side * 2.5 + 3, 36, 13, 3.7, 0, 0, Math.PI);
            ctx.fillStyle = 'rgba(220,220,220,0.22)';
            ctx.globalAlpha = 0.55;
            ctx.fill();
            ctx.globalAlpha = 1.0;

            ctx.restore();
        }

        // ===== Left Arm (behind; AO) =====
        ctx.save();
        ctx.translate(-fw * 0.54, -CFG.H * 0.13);
        ctx.rotate(armAngle - bodyYaw * 1.1);
        rr(0, 18, 12, 34, 7.2);
        let aG = ctx.createLinearGradient(-7, 0, 7, 0);
        aG.addColorStop(0, '#cba82c');
        aG.addColorStop(0.45, '#fff3be');
        aG.addColorStop(0.7, '#e4b740');
        aG.addColorStop(1, '#8a6e26');
        ctx.fillStyle = aG;
        ctx.shadowColor = 'rgba(70,51,20,0.3)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#a18837';
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Glove
        ctx.beginPath();
        ctx.arc(0, 34, 10, 0, Math.PI * 2);
        let glvG = ctx.createRadialGradient(-2, 32, 3, 0, 37, 10);
        glvG.addColorStop(0, '#1b1b1a');
        glvG.addColorStop(1, '#545350');
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = glvG;
        ctx.fill();
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.ellipse(-1, 39, 8, 2.7, -0.1, 0, Math.PI * 2);
        ctx.fillStyle = '#eee';
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // ===== Body (hyper-3D capsule, gradients) =====
        ctx.save();
        ctx.rotate(bodyYaw);
        capsule(0, bodyY, fw, fh);
        let bG = ctx.createLinearGradient(-fw / 2, bodyY, fw / 2, bodyY);
        bG.addColorStop(0, '#d7b657');
        bG.addColorStop(0.27, '#ffe366');
        bG.addColorStop(0.51, '#fff8dc');
        bG.addColorStop(0.72, '#fddb17');
        bG.addColorStop(0.98, '#b69223');
        bG.addColorStop(1.0, '#977a0c');
        ctx.fillStyle = bG;
        ctx.shadowColor = 'rgba(40,25,10,0.16)';
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Top edge highlight
        ctx.save();
        capsule(0, bodyY, fw, fh);
        ctx.clip();
        let hG = ctx.createLinearGradient(0, bodyY - fh / 2.205, 0, bodyY - fh / 4.6);
        hG.addColorStop(0, 'rgba(255,255,255,0.29)');
        hG.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hG;
        ctx.fillRect(-fw / 2, bodyY - fh / 2, fw, fh / 2.9);
        ctx.restore();

        // Bottom shadow
        ctx.save();
        capsule(0, bodyY, fw, fh);
        ctx.clip();
        let sG = ctx.createLinearGradient(0, bodyY + fh * 0.15, 0, bodyY + fh * 0.52);
        sG.addColorStop(0, 'rgba(0,0,0,0)');
        sG.addColorStop(1, 'rgba(100,60,8,0.10)');
        ctx.fillStyle = sG;
        ctx.fillRect(-fw / 2, bodyY, fw, fh / 2);
        ctx.restore();
        ctx.strokeStyle = '#a88a11';
        ctx.lineWidth = 1.7;
        ctx.stroke();
        ctx.restore();

        // ===== Overalls =====
        ctx.save();
        const ovT = CFG.H * 0.08, ovH = fh * 0.44;
        rr(0, ovT + ovH * 0.29, fw * 0.98, ovH, 9.5);
        let ovG = ctx.createLinearGradient(-fw / 2, 0, fw / 2, 0);
        ovG.addColorStop(0, '#2e3f66');
        ovG.addColorStop(0.25, '#5e83b9');
        ovG.addColorStop(0.68, '#3979ce');
        ovG.addColorStop(1, '#25294e');
        ctx.fillStyle = ovG;
        ctx.shadowColor = 'rgba(10,16,36,0.23)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#263156';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Bib
        ctx.beginPath();
        ctx.moveTo(-fw * 0.29, ovT - 5);
        ctx.lineTo(fw * 0.29, ovT - 5);
        ctx.lineTo(fw * 0.335, ovT + ovH * 0.32);
        ctx.lineTo(-fw * 0.335, ovT + ovH * 0.32);
        ctx.closePath();
        ctx.fillStyle = ovG;
        ctx.globalAlpha = 0.82;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Pocket
        rr(0, ovT + 10, fw * 0.295, ovH * 0.38, 5);
        let pkG = ctx.createLinearGradient(0, ovT + 3, 0, ovT + 24);
        pkG.addColorStop(0, '#4269a8');
        pkG.addColorStop(1, '#2b3c56');
        ctx.fillStyle = pkG;
        ctx.fill();

        // G logo
        ctx.save();
        ctx.font = 'bold 14.7px "Arial Black", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = 'rgba(80,47,7,0.35)';
        ctx.strokeText('G', 0, ovT + 11.2);
        ctx.shadowColor = '#f1e7b4';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffd900';
        ctx.fillText('G', 0, ovT + 11.2);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Straps
        ctx.lineWidth = 3.8;
        ctx.strokeStyle = '#536fc1';
        ctx.beginPath();
        ctx.moveTo(-fw * 0.253, ovT + 1); ctx.lineTo(-fw * 0.37, -CFG.H * 0.17);
        ctx.moveTo(fw * 0.252, ovT + 1); ctx.lineTo(fw * 0.37, -CFG.H * 0.17);
        ctx.stroke();

        // Buttons (radial + shine)
        for (let s = -1; s <= 1; s += 2) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(s * fw * 0.368, -CFG.H * 0.166, 4, 0, Math.PI * 2);
            let btnG = ctx.createRadialGradient(s * fw * 0.368 - 0.7, -CFG.H * 0.18, 1.3, s * fw * 0.368, -CFG.H * 0.166, 4);
            btnG.addColorStop(0, '#dedede');
            btnG.addColorStop(0.37, '#aaa');
            btnG.addColorStop(1, '#534a34');
            ctx.fillStyle = btnG;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.beginPath();
            ctx.ellipse(s * fw * 0.368 - 0.8, -CFG.H * 0.18 + 0.5, 1.5, 0.7, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.3;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }
        // White stitching
        ctx.setLineDash([3.5, 2]);
        ctx.strokeStyle = 'rgba(255,255,255,0.17)';
        ctx.lineWidth = 0.82;
        ctx.beginPath();
        ctx.moveTo(-fw * 0.47, ovT + ovH * 0.13);
        ctx.lineTo(fw * 0.47, ovT + ovH * 0.13);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // ===== Goggle Band (shadows/metal) =====
        const gY = -CFG.H * 0.296, gR = fw * 0.33;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-fw / 2 - 5, gY);
        ctx.lineTo(fw / 2 + 5, gY);
        let bandG = ctx.createLinearGradient(0, gY - 5, 0, gY + 7.5);
        bandG.addColorStop(0, '#111');
        bandG.addColorStop(0.15, '#888');
        bandG.addColorStop(0.65, '#222');
        bandG.addColorStop(1, '#aaa');
        ctx.lineWidth = 14.5;
        ctx.strokeStyle = bandG;
        ctx.globalAlpha = 0.88;
        ctx.shadowColor = '#14181A';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // ===== Goggle Rim (metallic) =====
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, gY, gR + 7, 0, Math.PI * 2);
        let rimOG = ctx.createLinearGradient(0, gY - gR - 7, 0, gY + gR + 7);
        rimOG.addColorStop(0, '#eee');
        rimOG.addColorStop(0.31, '#cfcfcf');
        rimOG.addColorStop(0.7, '#aaa');
        rimOG.addColorStop(1, '#646464');
        ctx.shadowColor = 'rgba(180,180,140,0.27)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = rimOG;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#adadad';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Screws/bolts
        for (let a = 0; a < 4; a++) {
            const angle = a * Math.PI / 2 + Math.PI / 4;
            const sx = Math.cos(angle) * (gR + 5.9);
            const sy = gY + Math.sin(angle) * (gR + 6);
            ctx.beginPath();
            ctx.arc(sx, sy, 2.3, 0, Math.PI * 2);
            ctx.fillStyle = '#bbb';
            ctx.fill();
            ctx.strokeStyle = '#777';
            ctx.lineWidth = 1.3;
            ctx.stroke();
        }
        ctx.restore();

        // ===== Eye (multi-layered) =====
        ctx.save();
        // Glass base
        ctx.beginPath();
        ctx.arc(0, gY, gR - 4.5, 0, Math.PI * 2);
        let lensG = ctx.createRadialGradient(-6, gY - 6, 0, 0, gY, gR - 4);
        lensG.addColorStop(0, '#f7f9fd');
        lensG.addColorStop(0.7, '#f0f0f0');
        lensG.addColorStop(1, '#e7e7e6');
        ctx.fillStyle = lensG;
        ctx.fill();
        if (!isBlinking) {
            // Iris
            const ix = facing * 4;
            ctx.beginPath();
            ctx.arc(ix, gY, gR * 0.46, 0, Math.PI * 2);
            let irisG = ctx.createRadialGradient(ix - 4, gY - 4, 2, ix, gY, gR * 0.46);
            irisG.addColorStop(0, '#af8344');
            irisG.addColorStop(0.37, '#cdb283');
            irisG.addColorStop(1, '#462b11');
            ctx.fillStyle = irisG;
            ctx.fill();

            // Pupil
            ctx.beginPath();
            ctx.arc(ix + facing * 1.1, gY, gR * 0.21, 0, Math.PI * 2);
            ctx.fillStyle = '#0A0A0A';
            ctx.frame = 2;
            ctx.fill();

            // Eye big highlight
            ctx.globalAlpha = 0.77;
            ctx.beginPath();
            ctx.arc(ix - 4, gY - 6, gR * 0.14, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Eye second highlight
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(ix + 2, gY + 2, gR * 0.07, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.globalAlpha = 1.0;
        } else {
            // Closed arc for blink
            ctx.beginPath();
            ctx.arc(0, gY, gR * 0.35, 0.1, Math.PI - 0.1);
            ctx.strokeStyle = '#4A2D15';
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        // Lens reflection
        ctx.globalAlpha = 0.11;
        ctx.beginPath();
        ctx.arc(0, gY, gR - 3.2, Math.PI * 1.7, Math.PI * 0.3, false);
        ctx.lineWidth = 13;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // ===== Mouth =====
        ctx.save();
        const mY = -CFG.H * 0.07;
        if (isIdle && Math.sin(frame * 0.05) > 0.5) {
            // Laugh, teeth & tongue
            ctx.beginPath();
            ctx.arc(0, mY, 13, 0.1, Math.PI - 0.1);
            ctx.fillStyle = '#8B1A1A';
            ctx.fill();
            ctx.beginPath();
            ctx.rect(-7, mY, 14, 6);
            ctx.fillStyle = '#FFF';
            ctx.fill();
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = '#ddd';
            ctx.beginPath(); ctx.moveTo(0, mY); ctx.lineTo(0, mY + 6); ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, mY + 8, 6, 3, 0, 0, Math.PI);
            ctx.fillStyle = '#d44';
            ctx.globalAlpha = 0.7;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        } else {
            // Smile
            ctx.beginPath();
            ctx.arc(0, mY - 4, 9, 0.2, Math.PI - 0.2);
            ctx.strokeStyle = '#652b15';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 1.0;
            ctx.stroke();
        }
        ctx.restore();

        // ===== Hair (wavy, deep brown, AO) =====
        ctx.save();
        ctx.strokeStyle = '#241711';
        ctx.lineCap = 'round';
        const hb = -CFG.H * 0.57;
        const hairs = [
            { x: 0, cp1x: 4, cp1y: -10, ex: -3, ey: -19, w: 2.6 },
            { x: -5, cp1x: -13, cp1y: -8, ex: -18, ey: -16, w: 1.9 },
            { x: 6, cp1x: 14, cp1y: -6.3, ex: 20, ey: -14, w: 1.8 },
            { x: -8, cp1x: -11, cp1y: -15, ex: -9, ey: -21, w: 1.2 },
            { x: 7, cp1x: 11, cp1y: -13, ex: 11, ey: -20, w: 1.2 }
        ];
        const windOff = Math.sin(frame * 0.04 + bx * 0.01) * 3.6;
        hairs.forEach(h => {
            ctx.lineWidth = h.w;
            ctx.beginPath();
            ctx.moveTo(h.x, hb + 2);
            ctx.quadraticCurveTo(h.cp1x + windOff, hb + h.cp1y, h.ex + windOff * 1.22, hb + h.ey);
            ctx.stroke();
        });
        ctx.restore();

        // ===== Right Arm (front, AO, highlights) =====
        ctx.save();
        ctx.translate(fw * 0.54, -CFG.H * 0.13);
        ctx.rotate(-armAngle - bodyYaw * 0.7);
        rr(0, 18, 12, 34, 7.2);
        ctx.shadowColor = 'rgba(68, 44, 8, 0.13)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = aG;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#a18837';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Glove
        ctx.beginPath();
        ctx.arc(0, 34, 10, 0, Math.PI * 2);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = glvG;
        ctx.fill();
        // Glove shine
        ctx.globalAlpha = 0.21;
        ctx.beginPath();
        ctx.ellipse(-1, 41, 8, 2.7, -0.11, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();

        ctx.restore();
    }

    /* ── Animation Loop ── */
    function animate() {
        ctx.clearRect(0, 0, W, H);
        frame++;
        dirFrames++;

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
        if (isIdle) {
            idleTimer--;
            if (idleTimer <= 0) isIdle = false;
        }
        const wp = frame * CFG.walkSpeed;
        const bounce = isIdle ? Math.sin(frame * 0.05) * 3 : Math.abs(Math.sin(wp)) * CFG.bounce;
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
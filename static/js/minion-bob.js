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

        // ===== Body (SSS skin + 3D shading) =====
        ctx.save();
        ctx.rotate(bodyYaw);
        // Base skin with warm SSS (subsurface scattering simulation)
        capsule(0, bodyY, fw, fh);
        let bG = ctx.createLinearGradient(-fw / 2, bodyY, fw / 2, bodyY);
        bG.addColorStop(0,    '#b8860b');
        bG.addColorStop(0.12, '#d4a520');
        bG.addColorStop(0.32, '#f5d040');
        bG.addColorStop(0.50, '#fff5b0');
        bG.addColorStop(0.68, '#f0c030');
        bG.addColorStop(0.88, '#c89010');
        bG.addColorStop(1.0,  '#8a6008');
        ctx.fillStyle = bG;
        ctx.shadowColor = 'rgba(180,100,0,0.22)';
        ctx.shadowBlur = 22;
        ctx.fill();
        ctx.shadowBlur = 0;
        // SSS warm glow from inside (orange rim light)
        ctx.save();
        capsule(0, bodyY, fw, fh);
        ctx.clip();
        let sscG = ctx.createRadialGradient(0, bodyY, fw*0.08, 0, bodyY, fw*0.55);
        sscG.addColorStop(0, 'rgba(255,220,80,0.13)');
        sscG.addColorStop(0.6,'rgba(255,160,20,0.06)');
        sscG.addColorStop(1,  'rgba(200,80,0,0.09)');
        ctx.fillStyle = sscG;
        ctx.fillRect(-fw/2, bodyY-fh/2, fw, fh);
        ctx.restore();
        // Specular highlight (glossy skin)
        ctx.save();
        capsule(0, bodyY, fw, fh);
        ctx.clip();
        let hG = ctx.createLinearGradient(-fw*0.2, bodyY-fh/2, fw*0.15, bodyY-fh/6);
        hG.addColorStop(0, 'rgba(255,255,255,0.42)');
        hG.addColorStop(0.4,'rgba(255,255,255,0.15)');
        hG.addColorStop(1,  'rgba(255,255,255,0)');
        ctx.fillStyle = hG;
        ctx.fillRect(-fw/2, bodyY-fh/2, fw, fh/2.4);
        ctx.restore();
        // Ambient occlusion bottom
        ctx.save();
        capsule(0, bodyY, fw, fh);
        ctx.clip();
        let aoG = ctx.createLinearGradient(0, bodyY+fh*0.2, 0, bodyY+fh*0.52);
        aoG.addColorStop(0, 'rgba(0,0,0,0)');
        aoG.addColorStop(1, 'rgba(80,40,0,0.18)');
        ctx.fillStyle = aoG;
        ctx.fillRect(-fw/2, bodyY, fw, fh/2);
        ctx.restore();
        ctx.strokeStyle = '#9a7010';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // ===== Overalls (denim fabric) =====
        ctx.save();
        const ovT = CFG.H * 0.08, ovH = fh * 0.44;
        // Main denim body with fabric-like gradient
        rr(0, ovT + ovH * 0.29, fw * 0.98, ovH, 9.5);
        let ovG = ctx.createLinearGradient(-fw/2, ovT, fw/2, ovT+ovH);
        ovG.addColorStop(0,    '#1a2d55');
        ovG.addColorStop(0.18, '#2e4d88');
        ovG.addColorStop(0.42, '#3a6ab5');
        ovG.addColorStop(0.60, '#2d55a0');
        ovG.addColorStop(0.80, '#1e3670');
        ovG.addColorStop(1,    '#131e40');
        ctx.fillStyle = ovG;
        ctx.shadowColor = 'rgba(5,10,30,0.35)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        // Denim fabric sheen
        ctx.save();
        rr(0, ovT + ovH * 0.29, fw * 0.98, ovH, 9.5);
        ctx.clip();
        let dnG = ctx.createLinearGradient(-fw*0.3, 0, fw*0.3, ovH*0.5);
        dnG.addColorStop(0, 'rgba(255,255,255,0.07)');
        dnG.addColorStop(0.5,'rgba(255,255,255,0.02)');
        dnG.addColorStop(1,  'rgba(255,255,255,0)');
        ctx.fillStyle = dnG; ctx.fillRect(-fw/2, ovT, fw, ovH);
        // Denim weave lines
        ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=0.7;
        for(let dy=ovT+4; dy<ovT+ovH; dy+=4){
            ctx.beginPath(); ctx.moveTo(-fw*0.49,dy); ctx.lineTo(fw*0.49,dy); ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = '#1a2a50'; ctx.lineWidth = 1.2; ctx.stroke();

        // Bib
        ctx.beginPath();
        ctx.moveTo(-fw*0.29, ovT-5); ctx.lineTo(fw*0.29, ovT-5);
        ctx.lineTo(fw*0.335, ovT+ovH*0.32); ctx.lineTo(-fw*0.335, ovT+ovH*0.32);
        ctx.closePath();
        ctx.fillStyle = ovG; ctx.globalAlpha = 0.88; ctx.fill(); ctx.globalAlpha = 1.0;

        // Pocket with depth shadow
        rr(0, ovT+10, fw*0.295, ovH*0.38, 5);
        let pkG = ctx.createLinearGradient(0, ovT+2, 0, ovT+26);
        pkG.addColorStop(0, '#2a4080'); pkG.addColorStop(1, '#1a2850');
        ctx.fillStyle = pkG; ctx.fill();
        ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=0.8; ctx.stroke();
        // Pocket inner shadow
        rr(0, ovT+10, fw*0.295, ovH*0.38, 5);
        ctx.save(); ctx.clip();
        let pkSh=ctx.createLinearGradient(0,ovT+2,0,ovT+8);
        pkSh.addColorStop(0,'rgba(0,0,0,0.25)'); pkSh.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=pkSh; ctx.fillRect(-fw*0.15,ovT+2,fw*0.3,8); ctx.restore();

        // G logo embroidered
        ctx.save();
        ctx.font = 'bold 13px "Arial Black",Arial';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        // Shadow/depth
        ctx.fillStyle='rgba(0,0,0,0.4)';
        ctx.fillText('G', 1, ovT+12.2);
        // Gold thread
        ctx.shadowColor='#ffd700'; ctx.shadowBlur=8;
        ctx.fillStyle='#ffd700'; ctx.fillText('G', 0, ovT+11.2);
        ctx.shadowBlur=0;
        // Highlight on gold
        ctx.globalAlpha=0.5; ctx.fillStyle='#fffbe0'; ctx.font='bold 8px Arial';
        ctx.fillText('G', -1, ovT+10.5); ctx.globalAlpha=1; ctx.restore();

        // Straps with shading
        ctx.lineWidth=4.5; ctx.strokeStyle='#2a50a0';
        ctx.beginPath();
        ctx.moveTo(-fw*0.253, ovT+1); ctx.lineTo(-fw*0.37, -CFG.H*0.17);
        ctx.moveTo( fw*0.252, ovT+1); ctx.lineTo( fw*0.37, -CFG.H*0.17);
        ctx.stroke();
        ctx.lineWidth=1.5; ctx.strokeStyle='rgba(100,150,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(-fw*0.248, ovT+1); ctx.lineTo(-fw*0.365, -CFG.H*0.17);
        ctx.moveTo( fw*0.248, ovT+1); ctx.lineTo( fw*0.365, -CFG.H*0.17);
        ctx.stroke();

        // Metal buttons
        for (let s=-1; s<=1; s+=2) {
            const bx2=s*fw*0.368, by2=-CFG.H*0.166;
            ctx.save();
            ctx.beginPath(); ctx.arc(bx2,by2,4.5,0,Math.PI*2);
            let btnG=ctx.createRadialGradient(bx2-1,by2-1.5,0.5,bx2,by2,4.5);
            btnG.addColorStop(0,'#f0f0f0'); btnG.addColorStop(0.4,'#b0b0b0');
            btnG.addColorStop(0.8,'#707070'); btnG.addColorStop(1,'#404040');
            ctx.fillStyle=btnG; ctx.fill();
            ctx.strokeStyle='#303030'; ctx.lineWidth=0.6; ctx.stroke();
            // Button hole cross
            ctx.strokeStyle='rgba(40,40,40,0.7)'; ctx.lineWidth=0.8;
            ctx.beginPath(); ctx.moveTo(bx2-1.5,by2); ctx.lineTo(bx2+1.5,by2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(bx2,by2-1.5); ctx.lineTo(bx2,by2+1.5); ctx.stroke();
            ctx.restore();
        }
        // Double stitching (realistic)
        for(let ds=0; ds<2; ds++){
            ctx.setLineDash([4,2.5]);
            ctx.strokeStyle=`rgba(255,255,255,${ds===0?0.14:0.07})`;
            ctx.lineWidth=0.7;
            ctx.beginPath();
            ctx.moveTo(-fw*0.47, ovT+ovH*0.13+ds*2.5);
            ctx.lineTo( fw*0.47, ovT+ovH*0.13+ds*2.5);
            ctx.stroke();
        }
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

        // ===== Eye (photorealistic layered) =====
        ctx.save();
        const eyeR = gR - 4.5;
        // Sclera (white of eye) with subtle veins warmth
        ctx.beginPath(); ctx.arc(0, gY, eyeR, 0, Math.PI*2);
        let scleraG = ctx.createRadialGradient(-eyeR*0.3, gY-eyeR*0.3, 0, 0, gY, eyeR);
        scleraG.addColorStop(0,   '#ffffff');
        scleraG.addColorStop(0.6, '#f5f0ea');
        scleraG.addColorStop(1,   '#e8ddd0');
        ctx.fillStyle = scleraG; ctx.fill();

        if (!isBlinking) {
            const ix = facing * 4;
            // Iris with realistic layers
            ctx.beginPath(); ctx.arc(ix, gY, eyeR*0.52, 0, Math.PI*2);
            let irisG = ctx.createRadialGradient(ix, gY, 0, ix, gY, eyeR*0.52);
            irisG.addColorStop(0,    '#6b3a10');
            irisG.addColorStop(0.25, '#9b6020');
            irisG.addColorStop(0.55, '#c89040');
            irisG.addColorStop(0.75, '#a07030');
            irisG.addColorStop(1,    '#3a1c05');
            ctx.fillStyle = irisG; ctx.fill();
            // Iris texture rays
            ctx.save(); ctx.clip();
            for(let r=0; r<12; r++){
                const ang=r*Math.PI/6;
                ctx.beginPath();
                ctx.moveTo(ix,gY);
                ctx.lineTo(ix+Math.cos(ang)*eyeR*0.5, gY+Math.sin(ang)*eyeR*0.5);
                ctx.strokeStyle='rgba(0,0,0,0.07)'; ctx.lineWidth=0.6; ctx.stroke();
            }
            ctx.restore();
            // Limbal ring (dark edge of iris)
            ctx.beginPath(); ctx.arc(ix, gY, eyeR*0.52, 0, Math.PI*2);
            ctx.strokeStyle='rgba(30,10,0,0.6)'; ctx.lineWidth=2.5; ctx.stroke();
            // Pupil with depth
            ctx.beginPath(); ctx.arc(ix+facing*1.1, gY, eyeR*0.24, 0, Math.PI*2);
            let pupG=ctx.createRadialGradient(ix+facing*0.5,gY-eyeR*0.05,0,ix+facing*1.1,gY,eyeR*0.24);
            pupG.addColorStop(0,'#1a1a1a'); pupG.addColorStop(1,'#000');
            ctx.fillStyle=pupG; ctx.fill();
            // Catch light (large)
            ctx.beginPath(); ctx.arc(ix-eyeR*0.18, gY-eyeR*0.22, eyeR*0.13, 0, Math.PI*2);
            ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.fill();
            // Catch light (small)
            ctx.beginPath(); ctx.arc(ix+eyeR*0.1, gY+eyeR*0.08, eyeR*0.055, 0, Math.PI*2);
            ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fill();
        } else {
            // Blink — eyelid crease
            ctx.beginPath(); ctx.arc(0, gY, eyeR*0.38, 0.08, Math.PI-0.08);
            ctx.strokeStyle='#3a1c05'; ctx.lineWidth=3.8; ctx.lineCap='round'; ctx.stroke();
            ctx.beginPath(); ctx.arc(0, gY, eyeR*0.32, 0.15, Math.PI-0.15);
            ctx.strokeStyle='rgba(80,30,0,0.3)'; ctx.lineWidth=1.5; ctx.stroke();
        }
        // Glass lens over eye (goggle glass refraction)
        ctx.save();
        ctx.beginPath(); ctx.arc(0, gY, eyeR, 0, Math.PI*2);
        ctx.clip();
        // Glass tint
        let glTint=ctx.createLinearGradient(-eyeR, gY-eyeR, eyeR, gY+eyeR);
        glTint.addColorStop(0,'rgba(200,230,255,0.12)');
        glTint.addColorStop(0.5,'rgba(255,255,255,0.02)');
        glTint.addColorStop(1,'rgba(180,210,255,0.08)');
        ctx.fillStyle=glTint; ctx.fillRect(-eyeR,gY-eyeR,eyeR*2,eyeR*2);
        // Glass glare streak
        ctx.beginPath();
        ctx.arc(0, gY, eyeR*0.85, Math.PI*1.68, Math.PI*0.28, false);
        ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=10; ctx.stroke();
        // Small corner glint
        ctx.beginPath(); ctx.arc(-eyeR*0.55, gY-eyeR*0.55, eyeR*0.12, 0, Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.fill();
        ctx.restore();
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
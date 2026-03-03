/* ── 3D Minion Bob — Roams freely across the page ── */
(function () {
    'use strict';

    /* ── Configuration ── */
    const BOB_HEIGHT = 90;       // px height of Bob sprite
    const BOB_WIDTH = 60;       // px width
    const SPEED = 1.8;      // px per frame
    const BOUNCE_AMP = 4;        // bounce amplitude in px
    const LEG_SWING = 0.55;     // leg swing angle (radians)
    const ARM_SWING = 0.45;     // arm swing angle (radians)
    const WALK_SPEED = 0.12;     // animation cycle speed
    const DIR_CHANGE_MIN = 120;  // min frames before direction change
    const DIR_CHANGE_MAX = 360;  // max frames before direction change
    const MARGIN = 40;           // edge margin in px

    /* ── Create the canvas (full viewport overlay) ── */
    const canvas = document.createElement('canvas');
    canvas.id = 'minion-bob-canvas';
    canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let W, H;

    /* ── State ── */
    let x, y;           // Bob's position
    let dirX = 1;        // horizontal direction: 1 = right, -1 = left
    let dirY = 0;        // vertical direction: 1 = down, -1 = up, 0 = flat
    let frame = 0;
    let nextDirChange = randomInt(DIR_CHANGE_MIN, DIR_CHANGE_MAX);
    let framesSinceDirChange = 0;

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /* ── Colors ── */
    const C = {
        yellow: '#F5D547',
        yellowDark: '#D4A017',
        yellowLight: '#FFEB80',
        overalls: '#4A7FBF',
        overallsDk: '#3A5F8F',
        pocket: '#3B6BA5',
        goggle: '#8C8C8C',
        goggleRim: '#5C5C5C',
        goggleDark: '#3A3A3A',
        eyeWhite: '#FFFFFF',
        iris: '#6B4226',
        pupil: '#1A1A1A',
        mouth: '#C0392B',
        mouthDark: '#922B21',
        teeth: '#FFFFFF',
        shoe: '#1A1A1A',
        glove: '#2C2C2C',
        hair: '#3D2B1F',
        ground: 'rgba(0,0,0,0.08)',
    };

    /* ── Resize handler ── */
    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        // Initialise position on first call
        if (x === undefined) {
            x = -BOB_WIDTH;
            y = H - MARGIN - BOB_HEIGHT;
        }
    }
    window.addEventListener('resize', resize);

    /* ── Pick a new random direction ── */
    function pickNewDirection() {
        // Always moving horizontally, sometimes also vertically
        dirX = Math.random() > 0.3 ? dirX : -dirX; // 30% chance to flip horizontal
        const vertRoll = Math.random();
        if (vertRoll < 0.35) {
            dirY = -1; // go up
        } else if (vertRoll < 0.7) {
            dirY = 1;  // go down
        } else {
            dirY = 0;  // stay flat
        }
        nextDirChange = randomInt(DIR_CHANGE_MIN, DIR_CHANGE_MAX);
        framesSinceDirChange = 0;
    }

    /* ── Helper: rounded rect ── */
    function roundRect(cx, cy, w, h, r) {
        const x0 = cx - w / 2, y0 = cy - h / 2;
        ctx.beginPath();
        ctx.moveTo(x0 + r, y0);
        ctx.lineTo(x0 + w - r, y0);
        ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
        ctx.lineTo(x0 + w, y0 + h - r);
        ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
        ctx.lineTo(x0 + r, y0 + h);
        ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
        ctx.lineTo(x0, y0 + r);
        ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
        ctx.closePath();
    }

    /* ── Draw Minion Bob ── */
    function drawBob(bx, by, walkPhase, facing) {
        ctx.save();
        ctx.translate(bx, by);
        if (facing < 0) {
            ctx.scale(-1, 1);
        }

        const legAngle = Math.sin(walkPhase) * LEG_SWING;
        const armAngle = Math.sin(walkPhase + Math.PI) * ARM_SWING;

        /* ── Shadow on ground ── */
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, BOB_HEIGHT * 0.52, BOB_WIDTH * 0.45, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = C.ground;
        ctx.fill();
        ctx.restore();

        /* ── LEFT LEG ── */
        ctx.save();
        ctx.translate(-8, BOB_HEIGHT * 0.28);
        ctx.rotate(legAngle);
        roundRect(0, 10, 12, 18, 3);
        ctx.fillStyle = C.overalls;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 20, 9, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = C.shoe;
        ctx.fill();
        ctx.restore();

        /* ── RIGHT LEG ── */
        ctx.save();
        ctx.translate(8, BOB_HEIGHT * 0.28);
        ctx.rotate(-legAngle);
        roundRect(0, 10, 12, 18, 3);
        ctx.fillStyle = C.overalls;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 20, 9, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = C.shoe;
        ctx.fill();
        ctx.restore();

        /* ── LEFT ARM (behind body) ── */
        ctx.save();
        ctx.translate(-BOB_WIDTH * 0.42, -BOB_HEIGHT * 0.08);
        ctx.rotate(armAngle);
        roundRect(0, 12, 9, 22, 4);
        ctx.fillStyle = C.yellow;
        ctx.fill();
        ctx.strokeStyle = C.yellowDark;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 24, 6, 0, Math.PI * 2);
        ctx.fillStyle = C.glove;
        ctx.fill();
        ctx.restore();

        /* ── BODY (yellow capsule) ── */
        const bodyW = BOB_WIDTH * 0.78;
        const bodyH = BOB_HEIGHT * 0.65;

        ctx.save();
        roundRect(0, -bodyH * 0.15, bodyW, bodyH, bodyW * 0.45);
        const bodyGrad = ctx.createLinearGradient(-bodyW / 2, 0, bodyW / 2, 0);
        bodyGrad.addColorStop(0, C.yellowDark);
        bodyGrad.addColorStop(0.3, C.yellow);
        bodyGrad.addColorStop(0.6, C.yellowLight);
        bodyGrad.addColorStop(1, C.yellowDark);
        ctx.fillStyle = bodyGrad;
        ctx.fill();
        ctx.strokeStyle = C.yellowDark;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        /* ── OVERALLS ── */
        ctx.save();
        const ovTop = BOB_HEIGHT * 0.03;
        const ovH = bodyH * 0.42;

        roundRect(0, ovTop + ovH * 0.3, bodyW * 0.98, ovH, 4);
        ctx.fillStyle = C.overalls;
        ctx.fill();
        ctx.strokeStyle = C.overallsDk;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-bodyW * 0.28, ovTop - 2);
        ctx.lineTo(bodyW * 0.28, ovTop - 2);
        ctx.lineTo(bodyW * 0.34, ovTop + ovH * 0.3);
        ctx.lineTo(-bodyW * 0.34, ovTop + ovH * 0.3);
        ctx.closePath();
        ctx.fillStyle = C.overalls;
        ctx.fill();
        ctx.strokeStyle = C.overallsDk;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        roundRect(0, ovTop + 6, bodyW * 0.28, ovH * 0.28, 2);
        ctx.fillStyle = C.pocket;
        ctx.fill();

        ctx.fillStyle = C.yellowLight;
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('G', 0, ovTop + 8);

        ctx.strokeStyle = C.overallsDk;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-bodyW * 0.26, ovTop - 1);
        ctx.lineTo(-bodyW * 0.32, -BOB_HEIGHT * 0.18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bodyW * 0.26, ovTop - 1);
        ctx.lineTo(bodyW * 0.32, -BOB_HEIGHT * 0.18);
        ctx.stroke();

        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(-bodyW * 0.32, -BOB_HEIGHT * 0.18, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bodyW * 0.32, -BOB_HEIGHT * 0.18, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        /* ── GOGGLE ── */
        const goggleY = -BOB_HEIGHT * 0.27;
        const goggleR = bodyW * 0.32;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-bodyW / 2, goggleY);
        ctx.lineTo(bodyW / 2, goggleY);
        ctx.strokeStyle = C.goggle;
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(0, goggleY, goggleR + 3, 0, Math.PI * 2);
        ctx.fillStyle = C.goggleDark;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, goggleY, goggleR + 1, 0, Math.PI * 2);
        ctx.fillStyle = C.goggle;
        ctx.fill();
        const rimGrad = ctx.createLinearGradient(0, goggleY - goggleR, 0, goggleY + goggleR);
        rimGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
        rimGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
        rimGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.beginPath();
        ctx.arc(0, goggleY, goggleR + 1, 0, Math.PI * 2);
        ctx.fillStyle = rimGrad;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(0, goggleY, goggleR - 3, 0, Math.PI * 2);
        ctx.fillStyle = C.eyeWhite;
        ctx.fill();

        const irisX = facing * 2;
        ctx.beginPath();
        ctx.arc(irisX, goggleY, goggleR * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = C.iris;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(irisX + facing, goggleY, goggleR * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = C.pupil;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(irisX - 2, goggleY - 3, goggleR * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
        ctx.restore();

        /* ── MOUTH ── */
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, -BOB_HEIGHT * 0.08, 8, 0.15, Math.PI - 0.15);
        ctx.fillStyle = C.mouthDark;
        ctx.fill();
        ctx.beginPath();
        ctx.rect(-3, -BOB_HEIGHT * 0.08, 6, 3);
        ctx.fillStyle = C.teeth;
        ctx.fill();
        ctx.restore();

        /* ── HAIR ── */
        ctx.save();
        ctx.strokeStyle = C.hair;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        const hairBase = -BOB_HEIGHT * 0.46;
        ctx.beginPath();
        ctx.moveTo(0, hairBase + 2);
        ctx.quadraticCurveTo(2, hairBase - 8, -1, hairBase - 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-5, hairBase + 3);
        ctx.quadraticCurveTo(-8, hairBase - 5, -10, hairBase - 9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(5, hairBase + 3);
        ctx.quadraticCurveTo(8, hairBase - 5, 10, hairBase - 9);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3, hairBase + 2);
        ctx.quadraticCurveTo(-6, hairBase - 6, -5, hairBase - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(3, hairBase + 2);
        ctx.quadraticCurveTo(6, hairBase - 6, 5, hairBase - 10);
        ctx.stroke();
        ctx.restore();

        /* ── RIGHT ARM (in front of body) ── */
        ctx.save();
        ctx.translate(BOB_WIDTH * 0.42, -BOB_HEIGHT * 0.08);
        ctx.rotate(-armAngle);
        roundRect(0, 12, 9, 22, 4);
        ctx.fillStyle = C.yellow;
        ctx.fill();
        ctx.strokeStyle = C.yellowDark;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 24, 6, 0, Math.PI * 2);
        ctx.fillStyle = C.glove;
        ctx.fill();
        ctx.restore();

        ctx.restore(); // main transform
    }

    /* ── Animation loop ── */
    function animate() {
        ctx.clearRect(0, 0, W, H);

        frame++;
        framesSinceDirChange++;
        const walkPhase = frame * WALK_SPEED;
        const bounce = Math.abs(Math.sin(walkPhase)) * BOUNCE_AMP;

        // Periodically change direction
        if (framesSinceDirChange >= nextDirChange) {
            pickNewDirection();
        }

        // Move
        x += SPEED * dirX;
        y += SPEED * 0.6 * dirY; // vertical movement a bit slower

        // Bounce off edges
        if (x > W + BOB_WIDTH) {
            dirX = -1;
        } else if (x < -BOB_WIDTH) {
            dirX = 1;
        }

        if (y < MARGIN + BOB_HEIGHT) {
            dirY = 1;  // push down
            y = MARGIN + BOB_HEIGHT;
        } else if (y > H - MARGIN) {
            dirY = -1; // push up
            y = H - MARGIN;
        }

        drawBob(x, y - bounce, walkPhase, dirX);

        requestAnimationFrame(animate);
    }

    /* ── Start ── */
    resize();
    animate();
})();

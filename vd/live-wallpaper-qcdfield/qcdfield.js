/* ==============================================
   QCD FIELD LIVE WALLPAPER — PHYSICS ENGINE
   ==============================================
   4 Visualization Modes:
   1. LATTICE QCD  — 3D perspective grid with quark nodes,
                     gluon links pulsing with color charge,
                     Wilson loop highlights
   2. BUBBLE CHAMBER — Classic spiral tracks, pair production
                        forks, V-particle decays, magnetic curvature
   3. FEYNMAN DIAGRAMS — Animated propagators (wavy, curly, straight),
                          vertices, loop corrections drifting across
   4. FLUX STRINGS — Quark-antiquark pairs connected by
                      chromodynamic flux tubes, confinement strings,
                      string breaking & pair creation
   ============================================== */

(function () {
    'use strict';

    // ========== CONFIG ==========
    const CFG = {
        mode: 'lattice',
        density: 7,
        energy: 1.0,
        perspective: 300,
        glowStrength: 0.6,
        colors: {
            red: '#ff2244',
            green: '#22ff88',
            blue: '#2266ff',
            gluon: '#ffaa11',
            matter: '#44ddff',
            anti: '#ff44aa',
            lattice: 'rgba(60,130,220,',
            feynmanLine: '#44ccff',
            feynmanWavy: '#ff4488',
            feynmanCurly: '#22ff88',
        }
    };

    // ========== CANVAS ==========
    const cv = document.getElementById('field-canvas');
    const fx = document.getElementById('fx-canvas');
    const ctx = cv.getContext('2d');
    const fxCtx = fx.getContext('2d');
    let W, H, cx, cy;

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        cx = W / 2;
        cy = H / 2;
        cv.width = W; cv.height = H;
        fx.width = W; fx.height = H;
    }

    let _resizeT;
    window.addEventListener('resize', () => { clearTimeout(_resizeT); _resizeT = setTimeout(resize, 80); });
    resize();

    // ========== SHARED STATE ==========
    const mouse = { x: cx, y: cy, active: false };
    document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
    document.addEventListener('mouseleave', () => { mouse.active = false; });

    let totalPairs = 0;
    let totalTubes = 0;
    let time = 0;

    // ====================================================================
    //   MODE 1: LATTICE QCD
    //   3D perspective grid, quark nodes, gluon link pulses, Wilson loops
    // ====================================================================
    const lattice = {
        nodes: [],
        links: [],
        wilsonLoops: [],
        rotX: 0.3,
        rotY: 0,

        init() {
            this.nodes = [];
            this.links = [];
            const n = CFG.density;
            const spacing = 60;

            for (let iz = 0; iz < n; iz++) {
                for (let iy = 0; iy < n; iy++) {
                    for (let ix = 0; ix < n; ix++) {
                        this.nodes.push({
                            gx: (ix - n / 2 + 0.5) * spacing,
                            gy: (iy - n / 2 + 0.5) * spacing,
                            gz: (iz - n / 2 + 0.5) * spacing,
                            color: Math.floor(Math.random() * 3), // 0=R, 1=G, 2=B
                            phase: Math.random() * Math.PI * 2,
                            ix, iy, iz
                        });
                    }
                }
            }

            // Build links (nearest neighbors)
            const idx = (ix, iy, iz) => iz * n * n + iy * n + ix;
            for (let iz = 0; iz < n; iz++) {
                for (let iy = 0; iy < n; iy++) {
                    for (let ix = 0; ix < n; ix++) {
                        if (ix < n - 1) this.links.push({ a: idx(ix, iy, iz), b: idx(ix + 1, iy, iz), phase: Math.random() * Math.PI * 2 });
                        if (iy < n - 1) this.links.push({ a: idx(ix, iy, iz), b: idx(ix, iy + 1, iz), phase: Math.random() * Math.PI * 2 });
                        if (iz < n - 1) this.links.push({ a: idx(ix, iy, iz), b: idx(ix, iy, iz + 1), phase: Math.random() * Math.PI * 2 });
                    }
                }
            }

            document.getElementById('node-count').textContent = this.nodes.length;

            // Pick a few Wilson loops
            this.wilsonLoops = [];
            for (let i = 0; i < 3; i++) {
                this.wilsonLoops.push({
                    ix: Math.floor(Math.random() * (n - 1)),
                    iy: Math.floor(Math.random() * (n - 1)),
                    iz: Math.floor(Math.random() * (n - 1)),
                    phase: Math.random() * Math.PI * 2,
                });
            }
        },

        project(gx, gy, gz) {
            // Rotate
            const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);
            const cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);
            let x = gx * cosY - gz * sinY;
            let z = gx * sinY + gz * cosY;
            let y = gy * cosX - z * sinX;
            z = gy * sinX + z * cosX;

            const persp = CFG.perspective / (CFG.perspective + z + 300);
            return {
                x: cx + x * persp,
                y: cy + y * persp,
                z: z,
                scale: persp,
            };
        },

        draw(ctx, t) {
            // Slow rotation
            this.rotY += 0.0008 * CFG.energy;
            this.rotX = 0.35 + Math.sin(t * 0.0003) * 0.1;

            // Mouse influence on rotation
            if (mouse.active) {
                this.rotY += (mouse.x / W - 0.5) * 0.003;
                this.rotX += (mouse.y / H - 0.5) * 0.001;
            }

            const projNodes = this.nodes.map(n => {
                const p = this.project(n.gx, n.gy, n.gz);
                return { ...p, color: n.color, phase: n.phase };
            });

            // Sort by z for depth
            const sortedLinks = this.links.slice().sort((a, b) => {
                const za = (projNodes[a.a].z + projNodes[a.b].z) / 2;
                const zb = (projNodes[b.a].z + projNodes[b.b].z) / 2;
                return za - zb;
            });

            // Draw links (gluon lines)
            for (const link of sortedLinks) {
                const pa = projNodes[link.a];
                const pb = projNodes[link.b];
                const avgScale = (pa.scale + pb.scale) / 2;
                const pulse = Math.sin(link.phase + t * 0.003 * CFG.energy) * 0.3 + 0.7;
                const alpha = avgScale * 0.12 * pulse;

                if (alpha < 0.01) continue;

                ctx.beginPath();
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
                ctx.strokeStyle = CFG.colors.lattice + alpha + ')';
                ctx.lineWidth = avgScale * 1.2;
                ctx.stroke();

                // Gluon pulse traveling along link
                link.phase += 0.02 * CFG.energy;
                const pulsePos = (Math.sin(link.phase) + 1) / 2;
                const px = pa.x + (pb.x - pa.x) * pulsePos;
                const py = pa.y + (pb.y - pa.y) * pulsePos;
                ctx.beginPath();
                ctx.arc(px, py, avgScale * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = CFG.colors.lattice + (alpha * 1.5) + ')';
                ctx.fill();
            }

            // Draw nodes (quarks)
            const colorMap = [CFG.colors.red, CFG.colors.green, CFG.colors.blue];
            const sortedNodes = projNodes.slice().sort((a, b) => a.z - b.z);

            for (const node of sortedNodes) {
                const pulse = Math.sin(node.phase + t * 0.002) * 0.2 + 0.8;
                const r = node.scale * 3.5 * pulse;
                const alpha = node.scale * 0.9;

                if (alpha < 0.05 || r < 0.5) continue;

                // Glow
                ctx.beginPath();
                ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
                const glowColor = colorMap[node.color];
                ctx.fillStyle = this.hexToRgba(glowColor, alpha * 0.12 * CFG.glowStrength);
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
                ctx.fillStyle = this.hexToRgba(glowColor, alpha * 0.8);
                ctx.fill();
            }

            totalTubes = this.links.length;
        },

        hexToRgba(hex, a) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`;
        }
    };

    // ====================================================================
    //   MODE 2: BUBBLE CHAMBER
    //   Spiral tracks, pair production, V-decays
    // ====================================================================
    const bubble = {
        tracks: [],
        maxTracks: 60,
        spawnTimer: 0,

        init() {
            this.tracks = [];
            this.spawnBurst(cx, cy, 12);
        },

        spawnBurst(ox, oy, count) {
            for (let i = 0; i < count; i++) {
                if (this.tracks.length >= this.maxTracks) break;
                const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
                const energy = 0.3 + Math.random() * 0.7;
                const charge = Math.random() > 0.5 ? 1 : -1;
                const type = Math.floor(Math.random() * 4); // 0-3 color types
                this.tracks.push(this.createTrack(ox, oy, angle, energy, charge, type));
            }
        },

        createTrack(x, y, angle, energy, charge, type) {
            return {
                points: [{ x, y }],
                angle,
                speed: 1.5 + energy * 3,
                energy,
                charge,
                type,
                // Spiral in magnetic field: radius of curvature ~ energy
                curvature: charge * (0.008 + Math.random() * 0.015) / (energy + 0.3),
                life: 1.0,
                decay: 0.002 + Math.random() * 0.004,
                thickness: 0.4 + energy * 1.5,
                hasDecayed: false,
                decayProb: 0.001 + Math.random() * 0.003,
                maxPts: 120,
                dead: false,
            };
        },

        update(dt) {
            this.spawnTimer += dt;
            if (this.spawnTimer > 120) { // periodic new events
                this.spawnTimer = 0;
                const sx = cx + (Math.random() - 0.5) * W * 0.4;
                const sy = cy + (Math.random() - 0.5) * H * 0.4;
                this.spawnBurst(sx, sy, 4 + Math.floor(Math.random() * 6));
            }

            for (let i = this.tracks.length - 1; i >= 0; i--) {
                const t = this.tracks[i];
                if (t.dead) { this.tracks.splice(i, 1); continue; }

                t.life -= t.decay * dt;
                if (t.life <= 0) { t.dead = true; continue; }

                const last = t.points[t.points.length - 1];
                // Spiral curvature increases as energy decreases (slower = tighter spiral)
                const effectiveCurve = t.curvature * (1 + (1 - t.life) * 2);
                t.angle += effectiveCurve * t.speed * dt;
                const spd = t.speed * t.life * CFG.energy;
                const nx = last.x + Math.cos(t.angle) * spd * dt;
                const ny = last.y + Math.sin(t.angle) * spd * dt;
                t.points.push({ x: nx, y: ny });
                if (t.points.length > t.maxPts) t.points.shift();

                // Boundary
                if (nx < -30 || nx > W + 30 || ny < -30 || ny > H + 30) t.dead = true;

                // V-decay: particle splits into two
                if (!t.hasDecayed && t.life < 0.6 && Math.random() < t.decayProb) {
                    t.hasDecayed = true;
                    const forkAngle = 0.3 + Math.random() * 0.5;
                    if (this.tracks.length < this.maxTracks) {
                        this.tracks.push(this.createTrack(nx, ny, t.angle + forkAngle, t.energy * 0.5, 1, (t.type + 1) % 4));
                        this.tracks.push(this.createTrack(nx, ny, t.angle - forkAngle, t.energy * 0.5, -1, (t.type + 2) % 4));
                        totalPairs++;
                    }
                }
            }
        },

        draw(ctx) {
            const typeColors = [CFG.colors.red, CFG.colors.green, CFG.colors.blue, CFG.colors.gluon];

            for (const t of this.tracks) {
                if (t.points.length < 2) continue;

                const color = typeColors[t.type % 4];
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);

                // Glow pass
                ctx.beginPath();
                ctx.moveTo(t.points[0].x, t.points[0].y);
                for (let i = 1; i < t.points.length; i++) ctx.lineTo(t.points[i].x, t.points[i].y);
                ctx.strokeStyle = `rgba(${r},${g},${b},${t.life * 0.08 * CFG.glowStrength})`;
                ctx.lineWidth = t.thickness * 5;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Core
                ctx.beginPath();
                ctx.moveTo(t.points[0].x, t.points[0].y);
                for (let i = 1; i < t.points.length; i++) ctx.lineTo(t.points[i].x, t.points[i].y);
                ctx.strokeStyle = `rgba(${r},${g},${b},${t.life * 0.7})`;
                ctx.lineWidth = t.thickness;
                ctx.stroke();

                // Bright head
                const head = t.points[t.points.length - 1];
                ctx.beginPath();
                ctx.arc(head.x, head.y, t.thickness * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${t.life * 0.9})`;
                ctx.fill();
            }

            totalTubes = this.tracks.length;
            document.getElementById('node-count').textContent = this.tracks.length;
        }
    };

    // ====================================================================
    //   MODE 3: FEYNMAN DIAGRAMS
    //   Propagators (straight, wavy, curly gluon), vertices, loops
    // ====================================================================
    const feynman = {
        diagrams: [],
        maxDiagrams: 8,
        spawnTimer: 0,

        init() {
            this.diagrams = [];
            for (let i = 0; i < 4; i++) this.spawnDiagram();
        },

        spawnDiagram() {
            if (this.diagrams.length >= this.maxDiagrams) return;

            const x = Math.random() * W;
            const y = Math.random() * H;
            const size = 80 + Math.random() * 140;
            const type = Math.floor(Math.random() * 5);
            // 0: qq -> qq (t-channel gluon)
            // 1: e+e- -> qq (s-channel photon)
            // 2: gg -> gg (gluon self-coupling)
            // 3: loop correction (self-energy)
            // 4: Drell-Yan (qq -> l+l-)

            this.diagrams.push({
                x, y, size, type,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.2,
                life: 1.0,
                decay: 0.0008 + Math.random() * 0.001,
                rotation: Math.random() * Math.PI * 0.3 - 0.15,
                phase: Math.random() * Math.PI * 2,
            });
        },

        update(dt) {
            this.spawnTimer += dt;
            if (this.spawnTimer > 80) {
                this.spawnTimer = 0;
                this.spawnDiagram();
            }

            for (let i = this.diagrams.length - 1; i >= 0; i--) {
                const d = this.diagrams[i];
                d.life -= d.decay * dt;
                d.x += d.vx * dt;
                d.y += d.vy * dt;
                d.phase += 0.02 * dt;
                if (d.life <= 0 || d.x < -200 || d.x > W + 200 || d.y < -200 || d.y > H + 200) {
                    this.diagrams.splice(i, 1);
                }
            }
        },

        draw(ctx) {
            for (const d of this.diagrams) {
                ctx.save();
                ctx.translate(d.x, d.y);
                ctx.rotate(d.rotation);
                ctx.globalAlpha = d.life * 0.65;

                const s = d.size;
                const hs = s / 2;

                switch (d.type) {
                    case 0: this.drawTChannel(ctx, s); break;
                    case 1: this.drawSChannel(ctx, s); break;
                    case 2: this.drawGluonSelf(ctx, s, d.phase); break;
                    case 3: this.drawSelfEnergy(ctx, s, d.phase); break;
                    case 4: this.drawDrellYan(ctx, s); break;
                }

                ctx.globalAlpha = 1;
                ctx.restore();
            }

            document.getElementById('node-count').textContent = this.diagrams.length;
            totalTubes = this.diagrams.length;
        },

        // Straight fermion line with arrow
        straightLine(ctx, x1, y1, x2, y2, color) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Arrow
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            ctx.beginPath();
            ctx.moveTo(mx + Math.cos(angle) * 6, my + Math.sin(angle) * 6);
            ctx.lineTo(mx + Math.cos(angle + 2.5) * 5, my + Math.sin(angle + 2.5) * 5);
            ctx.lineTo(mx + Math.cos(angle - 2.5) * 5, my + Math.sin(angle - 2.5) * 5);
            ctx.fillStyle = color;
            ctx.fill();
        },

        // Wavy line (photon/Z/W)
        wavyLine(ctx, x1, y1, x2, y2, color) {
            const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const waves = Math.max(3, Math.floor(dist / 12));

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            for (let i = 1; i <= waves * 2; i++) {
                const t = i / (waves * 2);
                const px = x1 + (x2 - x1) * t;
                const py = y1 + (y2 - y1) * t;
                const perp = (i % 2 === 0 ? 1 : -1) * 6;
                ctx.lineTo(px + Math.cos(angle + Math.PI / 2) * perp,
                           py + Math.sin(angle + Math.PI / 2) * perp);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.3;
            ctx.stroke();
        },

        // Curly line (gluon)
        curlyLine(ctx, x1, y1, x2, y2, color) {
            const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const loops = Math.max(3, Math.floor(dist / 15));

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            for (let i = 0; i < loops; i++) {
                const t1 = i / loops;
                const t2 = (i + 0.5) / loops;
                const t3 = (i + 1) / loops;
                const bx = x1 + (x2 - x1) * t2;
                const by = y1 + (y2 - y1) * t2;
                const perp = (i % 2 === 0 ? 1 : -1) * 10;
                const cpx = bx + Math.cos(angle + Math.PI / 2) * perp;
                const cpy = by + Math.sin(angle + Math.PI / 2) * perp;
                const ex = x1 + (x2 - x1) * t3;
                const ey = y1 + (y2 - y1) * t3;
                ctx.quadraticCurveTo(cpx, cpy, ex, ey);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.8;
            ctx.stroke();
        },

        // Vertex dot
        vertex(ctx, x, y) {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fill();
        },

        drawTChannel(ctx, s) {
            const hs = s / 2;
            // Two incoming, two outgoing fermions, gluon exchange
            this.straightLine(ctx, -hs, -hs * 0.6, 0, -hs * 0.15, CFG.colors.matter);
            this.straightLine(ctx, -hs, hs * 0.6, 0, hs * 0.15, CFG.colors.matter);
            this.straightLine(ctx, 0, -hs * 0.15, hs, -hs * 0.6, CFG.colors.matter);
            this.straightLine(ctx, 0, hs * 0.15, hs, hs * 0.6, CFG.colors.matter);
            this.curlyLine(ctx, 0, -hs * 0.15, 0, hs * 0.15, CFG.colors.gluon);
            this.vertex(ctx, 0, -hs * 0.15);
            this.vertex(ctx, 0, hs * 0.15);
        },

        drawSChannel(ctx, s) {
            const hs = s / 2;
            // e+e- annihilation -> photon -> qq
            this.straightLine(ctx, -hs, -hs * 0.5, 0, 0, CFG.colors.anti);
            this.straightLine(ctx, -hs, hs * 0.5, 0, 0, CFG.colors.matter);
            this.wavyLine(ctx, 0, 0, hs * 0.4, 0, CFG.colors.feynmanWavy);
            this.straightLine(ctx, hs * 0.4, 0, hs, -hs * 0.5, CFG.colors.red);
            this.straightLine(ctx, hs * 0.4, 0, hs, hs * 0.5, CFG.colors.blue);
            this.vertex(ctx, 0, 0);
            this.vertex(ctx, hs * 0.4, 0);
        },

        drawGluonSelf(ctx, s, phase) {
            const hs = s / 2;
            // Triple gluon vertex
            const cx = 0, cy = 0;
            const angles = [0, Math.PI * 2 / 3, Math.PI * 4 / 3];
            for (const a of angles) {
                this.curlyLine(ctx, cx, cy, cx + Math.cos(a + phase * 0.3) * hs * 0.7, cy + Math.sin(a + phase * 0.3) * hs * 0.7, CFG.colors.gluon);
            }
            this.vertex(ctx, cx, cy);
        },

        drawSelfEnergy(ctx, s, phase) {
            const hs = s / 2;
            // Fermion with loop correction
            this.straightLine(ctx, -hs, 0, -hs * 0.3, 0, CFG.colors.matter);
            this.straightLine(ctx, hs * 0.3, 0, hs, 0, CFG.colors.matter);
            // Loop
            ctx.beginPath();
            ctx.ellipse(0, 0, hs * 0.3, hs * 0.22, 0, 0, Math.PI * 2);
            ctx.strokeStyle = CFG.colors.feynmanCurly;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            this.vertex(ctx, -hs * 0.3, 0);
            this.vertex(ctx, hs * 0.3, 0);
        },

        drawDrellYan(ctx, s) {
            const hs = s / 2;
            // qq -> γ*/Z -> l+l-
            this.straightLine(ctx, -hs, -hs * 0.4, -hs * 0.15, 0, CFG.colors.red);
            this.straightLine(ctx, -hs, hs * 0.4, -hs * 0.15, 0, CFG.colors.blue);
            this.wavyLine(ctx, -hs * 0.15, 0, hs * 0.15, 0, CFG.colors.feynmanWavy);
            this.straightLine(ctx, hs * 0.15, 0, hs, -hs * 0.4, CFG.colors.anti);
            this.straightLine(ctx, hs * 0.15, 0, hs, hs * 0.4, CFG.colors.matter);
            this.vertex(ctx, -hs * 0.15, 0);
            this.vertex(ctx, hs * 0.15, 0);

            // Labels
            ctx.font = '9px "JetBrains Mono"';
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillText('q', -hs - 8, -hs * 0.4);
            ctx.fillText('q̄', -hs - 8, hs * 0.4 + 4);
            ctx.fillText('ℓ⁻', hs + 3, -hs * 0.4);
            ctx.fillText('ℓ⁺', hs + 3, hs * 0.4 + 4);
            ctx.fillText('γ*/Z', -12, -10);
        }
    };

    // ====================================================================
    //   MODE 4: FLUX STRINGS
    //   Quark-antiquark pairs connected by chromodynamic strings,
    //   string breaking, confinement
    // ====================================================================
    const strings = {
        pairs: [],
        maxPairs: 20,
        spawnTimer: 0,

        init() {
            this.pairs = [];
            for (let i = 0; i < 8; i++) this.spawnPair();
        },

        spawnPair() {
            if (this.pairs.length >= this.maxPairs) return;
            const x = cx + (Math.random() - 0.5) * W * 0.6;
            const y = cy + (Math.random() - 0.5) * H * 0.6;
            const angle = Math.random() * Math.PI * 2;
            const sep = 30 + Math.random() * 60;
            const colorType = Math.floor(Math.random() * 3);

            this.pairs.push({
                q: { x: x - Math.cos(angle) * sep / 2, y: y - Math.sin(angle) * sep / 2, vx: -Math.cos(angle) * 0.5, vy: -Math.sin(angle) * 0.5 },
                qbar: { x: x + Math.cos(angle) * sep / 2, y: y + Math.sin(angle) * sep / 2, vx: Math.cos(angle) * 0.5, vy: Math.sin(angle) * 0.5 },
                colorType,
                life: 1.0,
                hasBroken: false,
                tension: 0.003 + Math.random() * 0.003,
                phase: Math.random() * Math.PI * 2,
            });

            totalPairs++;
        },

        update(dt) {
            this.spawnTimer += dt;
            if (this.spawnTimer > 60) {
                this.spawnTimer = 0;
                this.spawnPair();
            }

            for (let i = this.pairs.length - 1; i >= 0; i--) {
                const p = this.pairs[i];
                p.life -= 0.001 * dt;
                if (p.life <= 0) { this.pairs.splice(i, 1); continue; }

                // String tension pulls quarks back
                const dx = p.qbar.x - p.q.x;
                const dy = p.qbar.y - p.q.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const fx = dx / (dist + 1) * p.tension * CFG.energy;
                const fy = dy / (dist + 1) * p.tension * CFG.energy;

                p.q.vx += fx * dt;
                p.q.vy += fy * dt;
                p.qbar.vx -= fx * dt;
                p.qbar.vy -= fy * dt;

                // Damping
                p.q.vx *= 0.998; p.q.vy *= 0.998;
                p.qbar.vx *= 0.998; p.qbar.vy *= 0.998;

                p.q.x += p.q.vx * dt;
                p.q.y += p.q.vy * dt;
                p.qbar.x += p.qbar.vx * dt;
                p.qbar.y += p.qbar.vy * dt;

                p.phase += 0.03 * dt;

                // String breaking: if too far apart, create new pair
                if (!p.hasBroken && dist > 180) {
                    p.hasBroken = true;
                    const midx = (p.q.x + p.qbar.x) / 2;
                    const midy = (p.q.y + p.qbar.y) / 2;
                    if (this.pairs.length < this.maxPairs) {
                        // New qq pair at midpoint
                        this.spawnPairAt(midx, midy, Math.atan2(dy, dx) + Math.PI / 2, (p.colorType + 1) % 3);
                        totalPairs++;
                    }
                }
            }
        },

        spawnPairAt(x, y, angle, colorType) {
            const sep = 20;
            this.pairs.push({
                q: { x: x - Math.cos(angle) * sep / 2, y: y - Math.sin(angle) * sep / 2, vx: -Math.cos(angle) * 0.3, vy: -Math.sin(angle) * 0.3 },
                qbar: { x: x + Math.cos(angle) * sep / 2, y: y + Math.sin(angle) * sep / 2, vx: Math.cos(angle) * 0.3, vy: Math.sin(angle) * 0.3 },
                colorType,
                life: 0.8,
                hasBroken: false,
                tension: 0.004,
                phase: Math.random() * Math.PI * 2,
            });
        },

        draw(ctx) {
            const colorMap = [CFG.colors.red, CFG.colors.green, CFG.colors.blue];

            for (const p of this.pairs) {
                const color = colorMap[p.colorType];
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);

                // Flux tube (with oscillation)
                const dx = p.qbar.x - p.q.x;
                const dy = p.qbar.y - p.q.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const segments = Math.max(8, Math.floor(dist / 8));
                const perpX = -dy / (dist + 1);
                const perpY = dx / (dist + 1);

                // Tube glow
                ctx.beginPath();
                ctx.moveTo(p.q.x, p.q.y);
                for (let s = 1; s < segments; s++) {
                    const t = s / segments;
                    const bx = p.q.x + dx * t;
                    const by = p.q.y + dy * t;
                    const wave = Math.sin(t * Math.PI * 4 + p.phase) * (4 + dist * 0.02);
                    ctx.lineTo(bx + perpX * wave, by + perpY * wave);
                }
                ctx.lineTo(p.qbar.x, p.qbar.y);
                ctx.strokeStyle = `rgba(${r},${g},${b},${p.life * 0.12 * CFG.glowStrength})`;
                ctx.lineWidth = 10;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Tube core
                ctx.beginPath();
                ctx.moveTo(p.q.x, p.q.y);
                for (let s = 1; s < segments; s++) {
                    const t = s / segments;
                    const bx = p.q.x + dx * t;
                    const by = p.q.y + dy * t;
                    const wave = Math.sin(t * Math.PI * 4 + p.phase) * (3 + dist * 0.015);
                    ctx.lineTo(bx + perpX * wave, by + perpY * wave);
                }
                ctx.lineTo(p.qbar.x, p.qbar.y);
                ctx.strokeStyle = `rgba(${r},${g},${b},${p.life * 0.5})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Energy density blobs along string
                for (let s = 1; s < segments; s += 3) {
                    const t = s / segments;
                    const bx = p.q.x + dx * t;
                    const by = p.q.y + dy * t;
                    const wave = Math.sin(t * Math.PI * 4 + p.phase) * 3;
                    const pulse = Math.sin(p.phase + t * 5) * 0.3 + 0.7;
                    ctx.beginPath();
                    ctx.arc(bx + perpX * wave, by + perpY * wave, 1.5 * pulse, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${r},${g},${b},${p.life * 0.4 * pulse})`;
                    ctx.fill();
                }

                // Quark node
                ctx.beginPath();
                ctx.arc(p.q.x, p.q.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${p.life * 0.9})`;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p.q.x, p.q.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${p.life * 0.08})`;
                ctx.fill();

                // Anti-quark node (slightly different shade)
                ctx.beginPath();
                ctx.arc(p.qbar.x, p.qbar.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)},${p.life * 0.9})`;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p.qbar.x, p.qbar.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)},${p.life * 0.08})`;
                ctx.fill();
            }

            totalTubes = this.pairs.length;
            document.getElementById('node-count').textContent = this.pairs.length * 2;
        }
    };

    // ====================================================================
    //   AMBIENT BACKGROUND FIELD (shared across all modes)
    // ====================================================================
    const ambientDots = [];
    function initAmbient() {
        ambientDots.length = 0;
        for (let i = 0; i < 50; i++) {
            ambientDots.push({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                size: 0.3 + Math.random() * 1,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    function drawAmbient(ctx, t) {
        for (const d of ambientDots) {
            d.x += d.vx; d.y += d.vy;
            d.phase += 0.015;
            if (d.x < -5) d.x = W + 5;
            if (d.x > W + 5) d.x = -5;
            if (d.y < -5) d.y = H + 5;
            if (d.y > H + 5) d.y = -5;

            const pulse = Math.sin(d.phase) * 0.3 + 0.7;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size * pulse, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(68,150,255,${0.12 * pulse})`;
            ctx.fill();
        }
    }

    // Subtle radial background
    function drawBgGlow(ctx) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6);
        grad.addColorStop(0, 'rgba(30,50,100,0.04)');
        grad.addColorStop(0.5, 'rgba(15,25,60,0.02)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    // ====================================================================
    //   CLOCK
    // ====================================================================
    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('clock-time').textContent = `${h}:${m}`;
        document.getElementById('clock-date').textContent =
            `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
    }

    // ====================================================================
    //   FPS
    // ====================================================================
    let frameCount = 0, lastFpsTime = performance.now(), fps = 60;
    const fpsEl = document.getElementById('fps-value');
    function updateFps() {
        frameCount++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFpsTime = now;
            fpsEl.textContent = fps;
        }
    }

    // ====================================================================
    //   MAIN LOOP
    // ====================================================================
    let lastTime = performance.now();

    function animate(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 16.67, 3);
        lastTime = timestamp;
        time = timestamp;

        // Clear
        ctx.fillStyle = '#020209';
        ctx.fillRect(0, 0, W, H);
        drawBgGlow(ctx);

        // Ambient field
        drawAmbient(ctx, timestamp);

        // Mode-specific rendering
        switch (CFG.mode) {
            case 'lattice':
                lattice.draw(ctx, timestamp);
                break;
            case 'bubble':
                bubble.update(dt);
                bubble.draw(ctx);
                break;
            case 'feynman':
                feynman.update(dt);
                feynman.draw(ctx);
                break;
            case 'strings':
                strings.update(dt);
                strings.draw(ctx);
                break;
        }

        // Update stats
        document.getElementById('tube-count').textContent = totalTubes;
        document.getElementById('pair-count').textContent = totalPairs;

        updateFps();
        requestAnimationFrame(animate);
    }

    // ====================================================================
    //   MODE SWITCHING
    // ====================================================================
    function setMode(mode) {
        CFG.mode = mode;
        totalPairs = 0;
        totalTubes = 0;

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        switch (mode) {
            case 'lattice': lattice.init(); break;
            case 'bubble': bubble.init(); break;
            case 'feynman': feynman.init(); break;
            case 'strings': strings.init(); break;
        }
    }

    // ====================================================================
    //   CONTROLS
    // ====================================================================
    function initControls() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => setMode(btn.dataset.mode));
        });

        document.getElementById('density-slider').addEventListener('input', e => {
            CFG.density = parseInt(e.target.value);
            if (CFG.mode === 'lattice') lattice.init();
        });

        document.getElementById('energy-slider').addEventListener('input', e => {
            CFG.energy = parseFloat(e.target.value);
            document.getElementById('alpha-s').textContent = (0.1179 / CFG.energy).toFixed(4);
        });

        document.getElementById('depth-slider').addEventListener('input', e => {
            CFG.perspective = parseInt(e.target.value);
        });

        document.getElementById('toggle-ui').addEventListener('click', () => {
            document.querySelector('.ui-overlay').classList.toggle('hidden');
        });

        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        });

        // Click on canvas to interact
        cv.addEventListener('click', e => {
            if (CFG.mode === 'bubble') {
                bubble.spawnBurst(e.clientX, e.clientY, 6 + Math.floor(Math.random() * 6));
            } else if (CFG.mode === 'strings') {
                strings.spawnPairAt(e.clientX, e.clientY, Math.random() * Math.PI * 2, Math.floor(Math.random() * 3));
            }
        });
    }

    // ====================================================================
    //   INIT
    // ====================================================================
    function init() {
        initAmbient();
        initControls();
        updateClock();
        setInterval(updateClock, 1000);
        setMode('lattice');
        requestAnimationFrame(animate);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

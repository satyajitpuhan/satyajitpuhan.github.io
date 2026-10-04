/* =============================================================================
   dragon.js — a 3D Eastern dragon that swims through the page behind the content.

   Loaded on demand by site.js (section 16) only when the visitor has it switched on.
   Everything is generated here — geometry, scale textures, lighting — so there are no
   model or image files to download besides three.js itself (self-hosted in ./vendor).

   How it moves: the head steers towards a target (a roaming waypoint, or an orbit
   around the mouse when it gets curious). Every frame the head's position and "up"
   direction are appended to a trail, and the body is laid along that trail, so each
   part of the body passes exactly where the head went — the way a serpent swims.

   export start(canvas, { theme, onReady }) → { stop(), setTheme(theme) }
   ========================================================================== */
import * as THREE from './vendor/three.module.min.js';

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rand = (seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(20260904);
const UP = new THREE.Vector3(0, 1, 0);

/* ---------------------------------------------------------------- textures */

// Overlapping scales whose free edge points towards the tail (+u), with an optional
// band of cream belly plates around v ≈ 0.75 (the underside of the body).
function scaleTextures(belly) {
  const W = 512, H = 512, cols = 10, rows = 18, cw = W / cols, rh = H / rows;
  const col = document.createElement('canvas'), bmp = document.createElement('canvas');
  col.width = bmp.width = W; col.height = bmp.height = H;
  const c = col.getContext('2d'), b = bmp.getContext('2d');
  c.fillStyle = '#4a2a0c'; c.fillRect(0, 0, W, H);
  b.fillStyle = '#000'; b.fillRect(0, 0, W, H);
  const jit = Array.from({ length: rows * cols }, rand);

  function scale(x, y, k) {
    const L = cw * 1.3, h = rh * 0.64;
    const path = new Path2D();
    path.moveTo(x - L * 0.5, y - h);
    path.bezierCurveTo(x + L * 0.25, y - h, x + L * 0.55, y - h * 0.5, x + L * 0.55, y);
    path.bezierCurveTo(x + L * 0.55, y + h * 0.5, x + L * 0.25, y + h, x - L * 0.5, y + h);
    path.closePath();
    const hue = 36 + k * 9, lit = 44 + k * 12;
    const g = c.createLinearGradient(x - L * 0.5, y, x + L * 0.55, y);
    g.addColorStop(0, 'hsl(28,70%,18%)');
    g.addColorStop(0.45, `hsl(${hue},72%,${lit}%)`);
    g.addColorStop(0.82, `hsl(${hue + 6},80%,${lit + 16}%)`);
    g.addColorStop(1, 'hsl(26,75%,16%)');
    c.fillStyle = g; c.fill(path);
    c.lineWidth = 1.4; c.strokeStyle = 'rgba(40,18,4,.75)'; c.stroke(path);
    const gb = b.createLinearGradient(x - L * 0.5, y, x + L * 0.55, y);
    gb.addColorStop(0, '#000'); gb.addColorStop(0.55, '#c8c8c8'); gb.addColorStop(0.86, '#fff'); gb.addColorStop(1, '#1a1a1a');
    b.fillStyle = gb; b.fill(path);
  }
  // tail-side columns first so each scale's free edge overlaps the base of the next one
  for (let cc = cols; cc >= -1; cc--) {
    for (let r = -1; r <= rows; r++) {
      const rr = (r + rows) % rows, cm = ((cc % cols) + cols) % cols;
      scale((cc + (rr % 2 ? 0.5 : 0)) * cw, (r + 0.5) * rh, jit[rr * cols + cm]);
    }
  }
  if (belly) {
    // a darker ridge along the spine (v = 0.25) …
    const ridge = c.createLinearGradient(0, H * 0.19, 0, H * 0.31);
    ridge.addColorStop(0, 'rgba(70,25,4,0)'); ridge.addColorStop(0.5, 'rgba(70,25,4,.55)'); ridge.addColorStop(1, 'rgba(70,25,4,0)');
    c.fillStyle = ridge; c.fillRect(0, H * 0.19, W, H * 0.12);
    // … and belly plates underneath (v = 0.62 – 0.88)
    const y0 = H * 0.62, y1 = H * 0.88, pw = W / 6;
    for (let p = -1; p <= 6; p++) {
      const x = p * pw;
      const g = c.createLinearGradient(x, 0, x + pw, 0);
      g.addColorStop(0, '#8a5a22'); g.addColorStop(0.12, '#f3dda4'); g.addColorStop(0.7, '#e6c27a'); g.addColorStop(0.93, '#a87430'); g.addColorStop(1, '#5b3510');
      c.fillStyle = g; c.fillRect(x, y0, pw, y1 - y0);
      const gb = b.createLinearGradient(x, 0, x + pw, 0);
      gb.addColorStop(0, '#111'); gb.addColorStop(0.18, '#e0e0e0'); gb.addColorStop(0.75, '#bbb'); gb.addColorStop(1, '#111');
      b.fillStyle = gb; b.fillRect(x, y0, pw, y1 - y0);
    }
    for (const yy of [y0, y1]) {
      const e = c.createLinearGradient(0, yy - 6, 0, yy + 6);
      e.addColorStop(0, 'rgba(60,30,6,0)'); e.addColorStop(0.5, 'rgba(60,30,6,.8)'); e.addColorStop(1, 'rgba(60,30,6,0)');
      c.fillStyle = e; c.fillRect(0, yy - 6, W, 12);
    }
  }
  const map = new THREE.CanvasTexture(col), bump = new THREE.CanvasTexture(bmp);
  for (const t of [map, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = false; t.anisotropy = 8; }
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, bump };
}

// A soft studio for metallic reflections: a warm key softbox, a cool rim and a warm bounce.
function studio(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  const sky = new THREE.SphereGeometry(50, 24, 12), cols = [];
  const p = sky.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) / 50 + 1) / 2;
    cols.push(0.08 + 0.55 * t, 0.06 + 0.45 * t, 0.05 + 0.36 * t);
  }
  sky.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  env.add(new THREE.Mesh(sky, new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));
  const panel = (r, g, b, x, y, z, w, h) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  };
  panel(7, 6.2, 5, -18, 26, 22, 28, 14);
  panel(1.6, 2.2, 3.4, 30, 4, -18, 16, 30);
  panel(3, 2, 1.1, 0, -30, 12, 40, 10);
  const tex = pm.fromScene(env, 0.035).texture;
  pm.dispose();
  return tex;
}

/* ---------------------------------------------------------------- geometry helpers */

// Deform a sphere with f(x,y,z) → [X,Y,Z]. Returns the geometry and the deformed
// equator (y = 0) as [X, |Z|] pairs, which gives the width of a mouth line.
function sculpt(f, ws = 56, hs = 36) {
  const g = new THREE.SphereGeometry(1, ws, hs), p = g.attributes.position, rim = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), [X, Y, Z] = f(x, y, z);
    p.setXYZ(i, X, Y, Z);
    if (Math.abs(y) < 1e-6) rim.push([X, Math.abs(Z)]);
  }
  g.computeVertexNormals();
  rim.sort((a, b) => a[0] - b[0]);
  const widthAt = X => { let w = 0; for (const [x, z] of rim) if (Math.abs(x - X) < 0.08) w = Math.max(w, z); return w; };
  return { g, widthAt };
}

// A tube whose radius follows rad(u) along the curve; optional vertex colours by u.
function taperedTube(points, segs, rad, colour) {
  const curve = new THREE.CatmullRomCurve3(points);
  const g = new THREE.TubeGeometry(curve, segs, 1, 8, false), p = g.attributes.position, cols = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs, c = curve.getPointAt(u), r = rad(u);
    for (let j = 0; j <= 8; j++) {
      const k = i * 9 + j;
      p.setXYZ(k, c.x + (p.getX(k) - c.x) * r, c.y + (p.getY(k) - c.y) * r, c.z + (p.getZ(k) - c.z) * r);
      if (colour) { const col = colour(u); cols.push(col.r, col.g, col.b); }
    }
  }
  if (colour) g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.computeVertexNormals();
  return g;
}

function basis(obj, x, y) {          // orient obj so its local x/y axes point along x/y
  const z = new THREE.Vector3().crossVectors(x, y);
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

function finGeometry(root = 0x8a1a10, tip = 0xf08a3a) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.12, 0.7, 0.62, 1.0);
  s.quadraticCurveTo(0.55, 0.45, 1.0, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -0.02);
  const p = g.attributes.position, cols = [], a = new THREE.Color(root), b = new THREE.Color(tip), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { c.lerpColors(a, b, Math.min(1, Math.max(0, p.getY(i)))); cols.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  return g;
}

/* ---------------------------------------------------------------- the dragon */

export function start(canvas, opts = {}) {
  const small = Math.min(innerWidth, innerHeight) < 600;
  const RINGS = small ? 110 : 170, SIDES = small ? 14 : 20, LEN = 30, TILE = 3.2;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  let dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = studio(renderer);
  const camera = new THREE.PerspectiveCamera(35, 1, 1, 200);
  camera.position.set(0, 0, small ? 56 : 42);

  scene.add(new THREE.HemisphereLight(0xfff3e0, 0x2a1608, 0.8));
  const key = new THREE.DirectionalLight(0xfff0d8, 2.4); key.position.set(-8, 12, 14); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa8c8ff, 1.6); rim.position.set(10, -3, -12); scene.add(rim);

  const world = new THREE.Group();          // nudged by scrolling (parallax)
  scene.add(world);

  /* materials */
  const bodyTex = scaleTextures(true), smallTex = scaleTextures(false);
  const skin = (tex, rx, ry) => {
    const map = tex.map.clone(), bump = tex.bump.clone();
    for (const t of [map, bump]) { t.repeat.set(rx, ry); t.needsUpdate = true; }
    return new THREE.MeshPhysicalMaterial({ map, bumpMap: bump, bumpScale: 3, metalness: 0.45, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 });
  };
  const bodyMat = new THREE.MeshPhysicalMaterial({ map: bodyTex.map, bumpMap: bodyTex.bump, bumpScale: 4, metalness: 0.45, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 });
  const headMat = skin(smallTex, 6, 4), jawMat = skin(smallTex, 5, 3), legMat = skin(smallTex, 2, 2);
  const hairMat = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.1 });
  const finMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.15, sheen: 0.6, sheenColor: new THREE.Color(0xff9a5a), side: THREE.DoubleSide });
  const ivory = new THREE.MeshStandardMaterial({ color: 0xf2e8d2, roughness: 0.32, metalness: 0.05 });
  const hornMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.1 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffb21e, emissive: 0xff8a00, emissiveIntensity: 1.6, roughness: 0.15 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x120604, roughness: 0.3 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x4a0c08, roughness: 0.6 });
  const whiskerMat = new THREE.MeshStandardMaterial({ color: 0xe8c27a, roughness: 0.45, metalness: 0.3, side: THREE.DoubleSide });

  /* body: one dynamic tube, rebuilt along the trail every frame */
  const nV = (RINGS + 1) * (SIDES + 1);
  const bodyGeo = new THREE.BufferGeometry();
  const bPos = new Float32Array(nV * 3), bNor = new Float32Array(nV * 3), bUv = new Float32Array(nV * 2), idx = [];
  for (let i = 0; i < RINGS; i++) for (let j = 0; j < SIDES; j++) {
    const a = i * (SIDES + 1) + j, b = a + SIDES + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  for (let i = 0; i <= RINGS; i++) for (let j = 0; j <= SIDES; j++) {
    const k = i * (SIDES + 1) + j;
    bUv[k * 2] = (i / RINGS) * LEN / TILE; bUv[k * 2 + 1] = j / SIDES;
  }
  bodyGeo.setIndex(idx);
  bodyGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3).setUsage(THREE.DynamicDrawUsage));
  bodyGeo.setAttribute('normal', new THREE.BufferAttribute(bNor, 3).setUsage(THREE.DynamicDrawUsage));
  bodyGeo.setAttribute('uv', new THREE.BufferAttribute(bUv, 2));
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.frustumCulled = false;
  world.add(body);

  // body radius along its length: s = 0 at the head, 1 at the tip of the tail
  const radius = s => 0.95 * (0.6 + 0.4 * sm(0, 0.22, s)) * (1 - 0.88 * Math.pow(sm(0.42, 1, s), 1.15))
    + 0.07 * Math.exp(-(((s - 0.2) / 0.045) ** 2)) + 0.06 * Math.exp(-(((s - 0.58) / 0.045) ** 2));

  /* head */
  const head = new THREE.Group();
  head.scale.setScalar(1.12);
  world.add(head);
  const skull = sculpt((x, y, z) => {
    const f = Math.max(0, x), taper = 1 - 0.3 * sm(0, 1, f);
    let Y = y * 0.62 * taper, Z = z * 0.68 * taper;
    if (y < 0) Y *= 0.42;                                                          // flat mouth line
    if (y > 0) Y += 0.24 * y * Math.exp(-(((x - 0.05) / 0.28) ** 2 + ((Math.abs(z) - 0.55) / 0.25) ** 2)); // brow ridges
    if (y > 0) Y += 0.1 * Math.exp(-(((x - 0.93) / 0.11) ** 2 + (z / 0.3) ** 2));  // nose
    Z *= 1 + 0.18 * sm(-0.1, -0.7, x);                                             // cheekbones
    return [x * 0.95 + f * f * 0.9 + 0.5, Y, Z];
  });
  head.add(new THREE.Mesh(skull.g, headMat));

  const jawPivot = new THREE.Group(); jawPivot.position.set(0.15, -0.06, 0); head.add(jawPivot);
  const jaw = sculpt((x, y, z) => {
    const f = Math.max(0, x), taper = 1 - 0.5 * sm(-0.2, 1, x);
    return [x * 1.2 + f * f * 0.25 + 0.7, (y < 0 ? y * 0.36 : y * 0.06) * taper, z * 0.56 * taper];
  }, 40, 24);
  jawPivot.add(new THREE.Mesh(jaw.g, jawMat));
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), mouthMat);
  mouth.scale.set(1.15, 0.16, 0.36); mouth.position.set(1.35, -0.06, 0); head.add(mouth);

  const toothGeo = new THREE.ConeGeometry(1, 1, 6);
  for (let X = 1.05; X < 2.35; X += 0.19) {
    const fang = Math.abs(X - 1.99) < 0.1, w = skull.widthAt(X) - 0.06;
    for (const s of [-1, 1]) {
      const t = new THREE.Mesh(toothGeo, ivory);
      t.scale.set(fang ? 0.065 : 0.04, fang ? 0.34 : 0.15, fang ? 0.065 : 0.04);
      t.position.set(X, -0.02 - t.scale.y / 2, s * w); t.rotation.x = Math.PI; head.add(t);
      const lw = jaw.widthAt(X - 0.85) - 0.06;
      if (lw > 0.05 && X < 2.2) {
        const l = new THREE.Mesh(toothGeo, ivory);
        l.scale.set(0.035, fang ? 0.22 : 0.12, 0.035);
        l.position.set(X - 0.15, l.scale.y / 2, s * lw); jawPivot.add(l);
      }
    }
  }

  const eyeGeo = new THREE.SphereGeometry(1, 20, 14);
  const eyeX = 1.3, eyeW = skull.widthAt(eyeX) * 0.86;
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat); eye.scale.setScalar(0.12); eye.position.set(eyeX, 0.24, s * eyeW); head.add(eye);
    const pupil = new THREE.Mesh(eyeGeo, dark); pupil.scale.set(0.03, 0.095, 0.05); pupil.position.set(eyeX + 0.03, 0.24, s * (eyeW + 0.1)); head.add(pupil);
    const nostril = new THREE.Mesh(eyeGeo, dark); nostril.scale.set(0.06, 0.035, 0.045); nostril.position.set(2.28, 0.2, s * 0.13); head.add(nostril);
  }

  const hornColour = u => new THREE.Color().lerpColors(new THREE.Color(0xefe3c6), new THREE.Color(0x6e4a22), Math.pow(u, 1.6));
  for (const s of [-1, 1]) {
    const P = (x, y, z) => new THREE.Vector3(x, y, z * s);
    head.add(new THREE.Mesh(taperedTube([P(0.62, 0.42, 0.25), P(0.25, 0.86, 0.33), P(-0.35, 1.1, 0.42), P(-1.0, 1.16, 0.5), P(-1.55, 1.38, 0.5)], 40, u => 0.12 * (1 - 0.86 * u), hornColour), hornMat));
    head.add(new THREE.Mesh(taperedTube([P(-0.3, 1.08, 0.42), P(-0.22, 1.5, 0.47), P(-0.45, 1.82, 0.5)], 16, u => 0.07 * (1 - 0.8 * u), u => hornColour(0.3 + 0.7 * u)), hornMat));
    const ear = new THREE.Mesh(finGeometry(), finMat);
    ear.scale.set(0.75, 0.55, 1); ear.position.set(0.45, 0.25, s * 0.52);
    basis(ear, new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0.55, s * 0.84).normalize());
    head.add(ear);
  }

  // little fluttering tufts on the head: brows and a chin beard
  const coneGeo = new THREE.ConeGeometry(0.5, 1, 5, 1, true); coneGeo.translate(0, 0.5, 0);
  // a lock of hair: a thin cone that curls towards its local +x as it gets longer
  const lockGeo = new THREE.ConeGeometry(0.035, 1, 6, 10, true); lockGeo.translate(0, 0.5, 0);
  { const p = lockGeo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) + 0.32 * y * y); } lockGeo.computeVertexNormals(); }
  const tufts = [];
  const tuft = (parent, pos, dir, len, w, colour) => {
    const m = new THREE.Mesh(coneGeo, hairMat.clone()); m.material.color.set(colour); m.material.side = THREE.DoubleSide;
    m.position.copy(pos); m.scale.set(w, len, w); parent.add(m);
    tufts.push({ m, dir: dir.clone().normalize(), seed: rand() * 9 });
  };
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) tuft(head, new THREE.Vector3(1.0 + k * 0.12, 0.42, s * 0.42), new THREE.Vector3(-1, 0.55, s * 0.5), 0.55 + k * 0.05, 0.09, k % 2 ? 0xe0662a : 0xb5301c);
  }
  for (let k = 0; k < 7; k++) tuft(jawPivot, new THREE.Vector3(1.35 + k * 0.07, -0.22, (k - 3) * 0.05), new THREE.Vector3(-0.55, -1, 0), 0.7 + rand() * 0.35, 0.08, [0xb5301c, 0xe0662a, 0xf0b44a][k % 3]);

  /* legs */
  function leg(front) {
    const root = new THREE.Group(), hip = new THREE.Group(), knee = new THREE.Group(), ankle = new THREE.Group();
    root.add(hip); hip.add(knee); knee.add(ankle);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.72, 6, 12), legMat); upper.position.y = -0.46; hip.add(upper);
    knee.position.y = -0.92;
    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.62, 6, 10), legMat); lower.position.y = -0.38; knee.add(lower);
    ankle.position.y = -0.78;
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), legMat); foot.scale.set(1.25, 0.6, 1.05); ankle.add(foot);
    for (const z of [-0.15, -0.05, 0.05, 0.15]) {
      const claw = new THREE.Mesh(toothGeo, ivory); claw.scale.set(0.05, 0.36, 0.05);
      claw.position.set(0.2, -0.06, z * 1.2); claw.rotation.set(0, 0, -Math.PI / 2 - 0.55 - Math.abs(z)); ankle.add(claw);
    }
    for (let k = 0; k < 5; k++) tuft(knee, new THREE.Vector3(-0.1, -0.05 - k * 0.08, (k - 2) * 0.06), new THREE.Vector3(-1, front ? 0.4 : -0.2, 0), 0.5 + rand() * 0.3, 0.08, [0xb5301c, 0xe0662a][k % 2]);
    root.scale.setScalar(1.3);
    world.add(root);
    return { root, hip, knee, ankle, front };
  }
  const legs = [[0.2, 1, true], [0.2, -1, true], [0.58, 1, false], [0.58, -1, false]].map(([s, side, front]) => Object.assign(leg(front), { s, side, phase: (front ? 0 : 2.1) + (side > 0 ? 0 : Math.PI * 0.85) }));

  /* dorsal fins and hair, instanced and laid along the body every frame */
  const fins = [];
  for (let s = 0.1; s < 0.96; s += 3 / RINGS) fins.push(s);
  const finMesh = new THREE.InstancedMesh(finGeometry(), finMat, fins.length);
  finMesh.frustumCulled = false; world.add(finMesh);

  const hairs = [];
  const hairPalette = [0xa8231a, 0xc2401c, 0xe0662a, 0xf0b44a];
  for (let k = 0; k < (small ? 110 : 190); k++) {         // mane: longest right behind the head
    const s = Math.pow(rand(), 1.5) * 0.14;
    hairs.push({ s, th: Math.PI * (0.05 + 0.9 * rand()), len: 1.9 - s * 7 + rand() * 0.7, w: 0.05 + rand() * 0.05, lift: 0.28 + rand() * 0.2, seed: rand() * 9 });
  }
  for (let k = 0; k < (small ? 40 : 70); k++) {           // tail tuft
    hairs.push({ s: 0.92 + rand() * 0.08, th: rand() * Math.PI * 2, len: 1.0 + rand() * 1.3, w: 0.05 + rand() * 0.04, lift: 0.55, seed: rand() * 9 });
  }
  const hairMesh = new THREE.InstancedMesh(lockGeo, hairMat, hairs.length);
  hairs.forEach((h, k) => hairMesh.setColorAt(k, new THREE.Color(hairPalette[(k * 7 + (h.seed * 3 | 0)) % 4])));
  hairMesh.frustumCulled = false; hairMat.side = THREE.DoubleSide; world.add(hairMesh);

  /* whiskers: verlet strands pinned to the snout */
  const WN = 18, WSEG = 0.3, WR = 5;
  const whiskers = [-1, 1].map(side => {
    const pts = [], prev = [];
    for (let i = 0; i < WN; i++) { pts.push(new THREE.Vector3()); prev.push(new THREE.Vector3()); }
    const geo = new THREE.BufferGeometry(), wi = [];
    for (let i = 0; i < WN - 1; i++) for (let j = 0; j < WR; j++) {
      const a = i * WR + j, b = i * WR + (j + 1) % WR, c = a + WR, d = b + WR;
      wi.push(a, b, c, c, b, d);
    }
    geo.setIndex(wi);
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(WN * WR * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(WN * WR * 3), 3).setUsage(THREE.DynamicDrawUsage));
    const mesh = new THREE.Mesh(geo, whiskerMat); mesh.frustumCulled = false; world.add(mesh);
    return { side, pts, prev, geo, anchor: new THREE.Vector3(2.12, 0.02, side * (skull.widthAt(2.12) + 0.02)), init: false };
  });

  /* ---------------------------------------------------------------- motion */
  let halfW = 20, halfH = 12;
  const headPos = new THREE.Vector3(), dir = new THREE.Vector3(1, 0, 0), up = new THREE.Vector3(0, 1, 0);
  const target = new THREE.Vector3(), mouse = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  let trail = [], headD = 0;
  function pushTrail() { trail.push({ x: headPos.x, y: headPos.y, z: headPos.z, ux: up.x, uy: up.y, uz: up.z, d: headD }); }
  function resetTrail() {
    trail = []; headD = 0;
    headPos.set(-halfW * 1.35 - LEN, halfH * 0.15, -4);
    dir.set(1, 0, 0); up.set(0, 1, 0);
    for (let i = 0; i <= 80; i++) { pushTrail(); headPos.x += LEN * 1.1 / 80; headD += LEN * 1.1 / 80; }
  }

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    halfW = halfH * camera.aspect;
  }
  resize();

  let mode = 'roam', modeUntil = 0, lastCurious = -99, interest = 0, mouseSeen = -99, nextRoar = 6 + rand() * 6;
  function newWaypoint() {
    const edge = rand() < 0.18;                       // now and then swim off-screen and come back
    target.set((rand() * 2 - 1) * halfW * (edge ? 1.35 : 0.9), (rand() * 2 - 1) * halfH * 0.8, -11 + rand() * 14);
  }
  // Carry the dragon over from the previous page, so it keeps swimming instead of re-entering.
  const KEY = 'sp-dragon-state';
  function save() {
    try {
      const pts = [];
      for (let i = 0; i <= 60; i++) { sample((i / 60) * (LEN + 1), 0); pts.push([P[0], P[1], P[2], U[0], U[1], U[2]].map(n => +n.toFixed(3))); }
      sessionStorage.setItem(KEY, JSON.stringify({ pts, dir: dir.toArray(), target: target.toArray() }));
    } catch (e) { /* storage unavailable: it will simply swim in again */ }
  }
  function restore() {
    try {
      const st = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (!st || !st.pts || st.pts.length < 2) return false;
      trail = []; headD = 0;
      for (let i = st.pts.length - 1; i >= 0; i--) {
        const [x, y, z, ux, uy, uz] = st.pts[i], l = trail[trail.length - 1];
        if (l) headD += Math.hypot(x - l.x, y - l.y, z - l.z);
        trail.push({ x, y, z, ux, uy, uz, d: headD });
      }
      headPos.fromArray(st.pts[0]); up.fromArray(st.pts[0], 3); dir.fromArray(st.dir); target.fromArray(st.target);
      return true;
    } catch (e) { return false; }
  }
  newWaypoint();
  if (!restore()) resetTrail();
  window.addEventListener('pagehide', save);

  const onMove = e => {
    const nx = e.clientX / innerWidth * 2 - 1, ny = -(e.clientY / innerHeight) * 2 + 1;
    tmp.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
    const k = (-1 - camera.position.z) / tmp.z;
    const moved = mouse.distanceTo(tmp2.copy(camera.position).addScaledVector(tmp, k));
    mouse.copy(tmp2); interest += Math.min(moved, 3) * 0.06; mouseSeen = clock;
  };
  let scrollY = window.scrollY, scrollV = 0, lift = 0, liftV = 0;
  const onScroll = () => { const y = window.scrollY, dy = y - scrollY; scrollY = y; scrollV += dy; liftV += dy * 0.006; };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize);

  /* scratch arrays for the spine */
  const P = new Float32Array((RINGS + 1) * 3), U = new Float32Array((RINGS + 1) * 3);
  const T = [], N = [], B = [], Q = [];
  for (let i = 0; i <= RINGS; i++) { T.push(new THREE.Vector3()); N.push(new THREE.Vector3()); B.push(new THREE.Vector3()); Q.push(new THREE.Vector3()); }

  function sample(dist, i) {
    const want = headD - dist;
    let lo = 0, hi = trail.length - 1;
    if (want <= trail[0].d) hi = lo = 0;
    else while (hi - lo > 1) { const m = (lo + hi) >> 1; if (trail[m].d <= want) lo = m; else hi = m; }
    const a = trail[lo], b = trail[hi], f = b.d > a.d ? (want - a.d) / (b.d - a.d) : 0;
    P[i * 3] = a.x + (b.x - a.x) * f; P[i * 3 + 1] = a.y + (b.y - a.y) * f; P[i * 3 + 2] = a.z + (b.z - a.z) * f;
    U[i * 3] = a.ux + (b.ux - a.ux) * f; U[i * 3 + 1] = a.uy + (b.uy - a.uy) * f; U[i * 3 + 2] = a.uz + (b.uz - a.uz) * f;
  }

  let clock = 0, jawOpen = 0, roarT = -1;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), v = new THREE.Vector3(), w = new THREE.Vector3(), wn2 = new THREE.Vector3();

  function step(dt) {
    clock += dt;

    // ---- choose where to go
    if (mode === 'roam') {
      if (headPos.distanceTo(target) < 3.5) newWaypoint();
      if (interest > 1 && clock - lastCurious > 14 && clock - mouseSeen < 1) { mode = 'curious'; modeUntil = clock + 7; lastCurious = clock; interest = 0; }
    } else {
      const a = clock * 0.9;
      target.set(mouse.x + Math.cos(a) * 4.5, mouse.y + Math.sin(a) * 3, -1 + Math.sin(a * 0.7) * 2);
      if (clock > modeUntil) { mode = 'roam'; newWaypoint(); }
    }
    interest *= Math.exp(-dt * 0.5);

    // ---- steer: turn towards the target at a limited rate, so it swims in long arcs
    scrollV *= Math.exp(-dt * 4);
    const boost = 1 + Math.min(1.6, Math.abs(scrollV) * 0.004);
    tmp.copy(target).sub(headPos); const dist = tmp.length(); tmp.normalize();
    const prevDir = tmp2.copy(dir);
    dir.lerp(tmp, 1 - Math.exp(-dt * (mode === 'curious' ? 1.9 : 1.25))).normalize();
    const speed = (mode === 'curious' ? 6.2 : 5) * (0.7 + 0.3 * sm(0, 6, dist)) * boost;
    headPos.addScaledVector(dir, speed * dt);
    headPos.z = Math.min(headPos.z, 6);
    headD += speed * dt;

    // ---- keep the back up (towards +y, slightly towards the viewer), banking into turns
    const turn = v.crossVectors(prevDir, dir);
    const bank = THREE.MathUtils.clamp(turn.dot(UP) * 18, -0.7, 0.7);
    w.set(0, 1, 0.35).addScaledVector(dir, -dir.y - dir.z * 0.35);
    if (w.lengthSq() < 0.05) w.set(0, 0, 1).addScaledVector(dir, -dir.z);
    w.normalize().applyAxisAngle(dir, bank);
    up.addScaledVector(dir, -up.dot(dir)).normalize().lerp(w, 1 - Math.exp(-dt * 2.5)).normalize();
    pushTrail();
    while (trail.length > 2 && trail[1].d < headD - LEN - 2) trail.shift();

    // ---- lay the spine along the trail, with a travelling vertical and sideways wave
    for (let i = 0; i <= RINGS; i++) sample((i / RINGS) * LEN, i);
    for (let i = 0; i <= RINGS; i++) {
      const a = Math.max(0, i - 1), b = Math.min(RINGS, i + 1);
      T[i].set(P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]).normalize();
      N[i].set(U[i * 3], U[i * 3 + 1], U[i * 3 + 2]);
      N[i].addScaledVector(T[i], -N[i].dot(T[i])).normalize();
      B[i].crossVectors(T[i], N[i]);
      const s = i / RINGS, env = sm(0.03, 0.3, s);
      const wv = Math.sin(s * Math.PI * 2 * 1.3 - clock * 2.3) * 0.5 * env;
      const ws = Math.sin(s * Math.PI * 2 * 0.9 - clock * 1.6) * 0.3 * env;
      Q[i].set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]).addScaledVector(N[i], wv).addScaledVector(B[i], ws);
    }
    for (let i = 0; i <= RINGS; i++) {
      const a = Math.max(0, i - 1), b = Math.min(RINGS, i + 1);
      T[i].subVectors(Q[b], Q[a]).normalize();
      N[i].addScaledVector(T[i], -N[i].dot(T[i])).normalize();
      B[i].crossVectors(T[i], N[i]);
    }

    // ---- body rings
    for (let i = 0; i <= RINGS; i++) {
      const r = radius(i / RINGS);
      for (let j = 0; j <= SIDES; j++) {
        const th = (j / SIDES) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), belly = sn < 0 ? 0.84 : 1;
        const k = (i * (SIDES + 1) + j) * 3;
        const ox = B[i].x * c + N[i].x * sn * belly, oy = B[i].y * c + N[i].y * sn * belly, oz = B[i].z * c + N[i].z * sn * belly;
        bPos[k] = Q[i].x + ox * r; bPos[k + 1] = Q[i].y + oy * r; bPos[k + 2] = Q[i].z + oz * r;
        const nx = B[i].x * c + N[i].x * sn, ny = B[i].y * c + N[i].y * sn, nz = B[i].z * c + N[i].z * sn;
        bNor[k] = nx; bNor[k + 1] = ny; bNor[k + 2] = nz;
      }
    }
    bodyGeo.attributes.position.needsUpdate = true;
    bodyGeo.attributes.normal.needsUpdate = true;

    // ---- head: sits on ring 0, facing forwards (against the body tangent)
    head.position.copy(Q[0]);
    basis(head, v.copy(T[0]).negate(), N[0]);
    head.updateMatrix();

    // jaw: breathing, and now and then a slow roar
    if (clock > nextRoar && roarT < 0) roarT = 0;
    let roar = 0;
    if (roarT >= 0) { roarT += dt; roar = roarT < 0.5 ? sm(0, 0.5, roarT) : roarT < 1.4 ? 1 : 1 - sm(1.4, 2.1, roarT); if (roarT > 2.1) { roarT = -1; nextRoar = clock + 10 + rand() * 9; } }
    jawOpen += ((0.05 + 0.03 * Math.sin(clock * 1.4)) + roar * 0.32 - jawOpen) * (1 - Math.exp(-dt * 8));
    jawPivot.rotation.z = -jawOpen;

    for (const t of tufts) {
      v.copy(t.dir); v.x += Math.sin(clock * 5 + t.seed) * 0.12; v.z += Math.cos(clock * 4.3 + t.seed) * 0.12;
      t.m.quaternion.setFromUnitVectors(UP, v.normalize());
    }

    // ---- legs paddle as it swims
    for (const L of legs) {
      const i = Math.round(L.s * RINGS), r = radius(L.s);
      v.copy(T[i]).negate(); w.crossVectors(v, N[i]);
      L.root.position.copy(Q[i]).addScaledVector(w, L.side * r * 0.72).addScaledVector(N[i], -r * 0.32);
      basis(L.root, v, N[i]);
      const ph = clock * 3.1 + L.phase, sw = Math.sin(ph);
      L.hip.rotation.set(-L.side * 0.55, 0, L.front ? 0.85 + 0.42 * sw : -0.8 + 0.42 * sw);
      L.knee.rotation.z = L.front ? -1.05 + 0.35 * Math.sin(ph + 1.2) : 1.0 + 0.35 * Math.sin(ph + 1.2);
      L.ankle.rotation.z = L.front ? 0.55 : -0.35;
    }

    // ---- dorsal fins
    fins.forEach((s, k) => {
      const i = Math.round(s * RINGS), r = radius(s), size = r * (0.7 + 0.25 * Math.sin(s * 40));
      v.copy(Q[i]).addScaledVector(N[i], r * 0.9);
      w.crossVectors(T[i], N[i]);
      m4.makeBasis(T[i], N[i], w).scale(sc.set(size * 1.1, size * 0.85, 1)).setPosition(v);
      finMesh.setMatrixAt(k, m4);
    });
    finMesh.instanceMatrix.needsUpdate = true;

    // ---- mane and tail tuft, fluttering
    hairs.forEach((h, k) => {
      const i = Math.min(RINGS, Math.round(h.s * RINGS)), r = radius(h.s);
      const c = Math.cos(h.th), sn = Math.sin(h.th);
      w.copy(B[i]).multiplyScalar(c).addScaledVector(N[i], sn);                         // outward
      v.copy(Q[i]).addScaledVector(w, r * 0.9);
      tmp.copy(T[i]).addScaledVector(w, h.lift)
        .addScaledVector(B[i], Math.sin(clock * 4.6 + h.seed) * 0.14).addScaledVector(N[i], Math.cos(clock * 3.9 + h.seed) * 0.1).normalize();
      tmp2.copy(w).negate().addScaledVector(tmp, w.dot(tmp)).normalize();               // curl back towards the body
      wn2.crossVectors(tmp2, tmp);
      m4.makeBasis(tmp2, tmp, wn2).scale(sc.set(h.len, h.len, h.len * h.w * 14)).setPosition(v);
      hairMesh.setMatrixAt(k, m4);
    });
    hairMesh.instanceMatrix.needsUpdate = true;

    // ---- whiskers
    for (const W of whiskers) {
      const a = v.copy(W.anchor).applyMatrix4(head.matrix);
      const rest = w.set(-0.35, -0.25, W.side * 0.9).normalize().applyQuaternion(head.quaternion);
      if (!W.init) { W.pts.forEach((p, i) => { p.copy(a).addScaledVector(rest, i * WSEG); W.prev[i].copy(p); }); W.init = true; }
      for (let i = 1; i < WN; i++) {
        const p = W.pts[i], pr = W.prev[i];
        tmp.subVectors(p, pr).multiplyScalar(0.9); pr.copy(p); p.add(tmp);
        p.addScaledVector(T[0], 0.004 * i);                          // drag: the strand streams backwards
        p.addScaledVector(N[0], Math.sin(clock * 2.6 + i * 0.45 + W.side) * 0.006 * i);
      }
      W.pts[0].copy(a); W.pts[1].copy(a).addScaledVector(rest, WSEG);
      for (let it = 0; it < 4; it++) for (let i = 1; i < WN; i++) {
        const p0 = W.pts[i - 1], p1 = W.pts[i];
        tmp.subVectors(p1, p0); const d = tmp.length() || 1;
        p1.addScaledVector(tmp, (WSEG - d) / d * (i === 1 ? 0 : 1));
      }
      const pos = W.geo.attributes.position.array, nor = W.geo.attributes.normal.array;
      for (let i = 0; i < WN; i++) {
        const p = W.pts[i], tng = tmp.subVectors(W.pts[Math.min(WN - 1, i + 1)], W.pts[Math.max(0, i - 1)]).normalize();
        const n1 = tmp2.crossVectors(tng, Math.abs(tng.z) < 0.9 ? sc.set(0, 0, 1) : sc.set(0, 1, 0)).normalize();
        const n2 = wn2.crossVectors(tng, n1);
        const rr = 0.075 * (1 - 0.8 * i / (WN - 1));
        for (let j = 0; j < WR; j++) {
          const th = j / WR * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), k = (i * WR + j) * 3;
          const nx = n1.x * c + n2.x * sn, ny = n1.y * c + n2.y * sn, nz = n1.z * c + n2.z * sn;
          pos[k] = p.x + nx * rr; pos[k + 1] = p.y + ny * rr; pos[k + 2] = p.z + nz * rr;
          nor[k] = nx; nor[k + 1] = ny; nor[k + 2] = nz;
        }
      }
      W.geo.attributes.position.needsUpdate = true; W.geo.attributes.normal.needsUpdate = true;
    }

    // ---- scrolling nudges the whole dragon, then it springs back
    liftV += (-lift * 14 - liftV * 5) * dt; lift += liftV * dt;
    world.position.y = THREE.MathUtils.clamp(lift, -4, 4);
  }

  /* ---------------------------------------------------------------- loop */
  let raf = 0, last = 0, running = false, ready = false, slow = 0;
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    step(dt);
    renderer.render(scene, camera);
    if (!ready) { ready = true; opts.onReady && opts.onReady(); }
    slow = slow * 0.97 + (dt > 0.034 ? 1 : 0) * 0.03;     // mostly under 30 fps → render fewer pixels,
    if (slow > 0.6 && dpr > 1) { dpr = 1; renderer.setPixelRatio(1); resize(); slow = 0; }
    else if (slow > 0.8) { pause(); opts.onSlow && opts.onSlow(); }   // and if that is not enough, give up
  }
  function play() { if (running || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function pause() { running = false; cancelAnimationFrame(raf); }
  const onVis = () => (document.hidden ? pause() : play());
  document.addEventListener('visibilitychange', onVis);

  function setTheme(t) {
    const darkMode = t !== 'light';
    renderer.toneMappingExposure = darkMode ? 0.95 : 1.05;
    key.intensity = darkMode ? 2.1 : 2.4;
  }
  setTheme(opts.theme);
  play();

  return {
    setTheme,
    debug: { camera, head, world, renderer, scene, step },   // for local testing only
    stop() {
      pause();
      window.removeEventListener('pagehide', save);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      renderer.dispose();
    },
  };
}

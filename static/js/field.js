/* =============================================================================
   field.js — "Minion mayhem": a gang of minions picks a fight with me in a field.

   Loaded on demand by site.js (section 16) when the visitor picks it. Everything is
   built in code (no model or image files), on three.js and the shared kit.js.

   The field is drawn real (grass, wildflowers, an oak, haystacks, a fence, rolling
   hills, clouds); the characters are cartoons with toon shading and ink outlines.
   The minions pop out of the haystack shouting, chase me round the field, one
   clamps onto my leg and another onto my arm (I hop about and fling them off), they
   pile on and knock me flat (I burst out and they go flying), and when I throw a
   banana they all dive on it in a dust-cloud brawl. Stunned minions see stars.

   export start(canvas, { theme, onReady, onSlow }) → { stop(), setTheme(theme) }
   ========================================================================== */
import * as THREE from './vendor/three.module.min.js';
import {
  TAU, sm, clamp, lerp, angDiff, rand, rnd, nz, V, C, mix, canvasTex, radial, mistTex, sculpt, taperedTube,
  SPH, mesh, capsule, makeRig, ell, smin, onFront, surfaceNet, taperCapsule, eyeTexture, addEye, KEYS, blank,
  fbm, foliageCard, blossomCard, cardCloud, GREENS, tiled, grassTex, woodTex, toon, inkMat, inked,
} from './kit.js';

/* ---------------------------------------------------------------- me */

function buildMe(small) {
  const R = makeRig({ hipH: 2.75, hipW: 0.33, neckY: 2.02, neckZ: 0.04, shY: 1.8, shW: 0.74, upper: 1.0, fore: 0.92, thigh: 1.32, shin: 1.3, ankleH: 0.2 });
  const skinC = C(0x8a5a3c), shirtC = C(0x8e9196), shirtD = C(0x6e7176), jeans = C(0x34486a), beard = C(0x231713);
  const skin = toon(0x8a5a3c);
  // torso in a grey T-shirt
  const torso = (x, y, z) => smin(smin(ell(x, y, z, 0, 1.4, 0.02, 0.78, 0.6, 0.44), ell(x, y, z, 0, 0.7, 0.06, 0.7, 0.7, 0.46), 0.35), ell(x, y, z, 0, 1.8, 0, 0.86, 0.26, 0.36), 0.3);
  inked(surfaceNet(torso, (x, y, z) => {
    if (y > 1.9 && Math.hypot(x / 0.3, (y - 2.1) / 0.3) < 1 && z > -0.05) return skinC;           // just the neck shows
    if (y < 0.12) return jeans;
    return mix(shirtC, shirtD, 0.5 + 0.5 * nz(x * 6, y * 6, z * 6) * 0.4);
  }, [-0.9, -0.1, -0.6], [0.9, 2.2, 0.6], small ? 0.04 : 0.03), toon(0xffffff, { vertexColors: true }), R.torso);
  // hips in jeans, a belt
  inked(sculpt((x, y, z) => [x * 0.66, y * 0.38 + 0.02, z * 0.44], null, 24, 16), toon(jeans), R.pelvis, undefined, undefined, 0.025);
  mesh(new THREE.TorusGeometry(0.66, 0.05, 6, 30).rotateX(Math.PI / 2), toon(0x3a2a20), R.pelvis, [0, 0.3, 0]).scale.z = 0.68;
  inked(capsule(0.17, 0.25), skin, R.torso, [0, 2.02, 0.02], undefined, 0.02);
  // head: broad jaw, a beard and moustache
  const head = (x, y, z) => {
    let d = ell(x, y, z, 0, 0.7, -0.04, 0.58, 0.66, 0.6);
    d = smin(d, ell(x, y, z, 0, 0.36, 0.08, 0.52, 0.42, 0.5), 0.25);
    d = smin(d, ell(x, y, z, 0, 0.5, 0.56, 0.1, 0.12, 0.1), 0.08);                           // nose
    return smin(d, Math.min(ell(x, y, z, 0.58, 0.58, -0.02, 0.08, 0.14, 0.09), ell(x, y, z, -0.58, 0.58, -0.02, 0.08, 0.14, 0.09)), 0.04);
  };
  const H = R.headMesh = new THREE.Group(); H.position.set(0, 0.08, 0.02); R.head.add(H);
  inked(surfaceNet(head, (x, y, z) => {
    const b = sm(0.52, 0.38, y + 0.18 * (1 - Math.abs(x))) * sm(-0.3, 0.1, z);                  // beard along the jaw
    const mo = Math.exp(-((x / 0.2) ** 2 + ((y - 0.37) / 0.04) ** 2)) * sm(0.3, 0.45, z);         // moustache
    return mix(skinC, beard, Math.max(b, mo) * 0.92);
  }, [-0.75, -0.15, -0.75], [0.75, 1.45, 0.8], small ? 0.03 : 0.022), toon(0xffffff, { vertexColors: true }), H, undefined, undefined, 0.022);
  // curly hair: a cap covered in curls
  const curls = [];
  for (let i = 0; i < 110; i++) {
    const u = rand(), a = rand() * TAU, el = 0.15 + 0.85 * Math.sqrt(u), y = el;
    const r = Math.sqrt(1 - Math.min(1, y * y)), p = V(Math.cos(a) * r * 0.66, 0.78 + y * 0.74, Math.sin(a) * r * 0.64 - 0.05);
    if (p.z > 0.3 && p.y < 1.12) continue;                                                       // keep the forehead clear
    curls.push(p);
  }
  const hairSdf = (x, y, z) => {
    let d = Math.max(ell(x, y, z, 0, 0.82, -0.08, 0.62, 0.62, 0.62), -ell(x, y, z, 0, 0.55, 0.44, 0.56, 0.5, 0.44));
    d = Math.max(d, 0.6 - y);
    for (const c of curls) { const dx = x - c.x, dy = y - c.y, dz = z - c.z; if (dx * dx + dy * dy + dz * dz < 0.12) d = smin(d, Math.sqrt(dx * dx + dy * dy + dz * dz) - 0.16, 0.05); }
    return d;
  };
  inked(surfaceNet(hairSdf, (x, y, z) => mix(C(0x1b1210), C(0x3a2620), 0.5 + 0.5 * Math.sin(x * 30 + y * 22 + z * 26)), [-0.9, 0.35, -0.9], [0.9, 1.8, 0.85], small ? 0.035 : 0.026),
    toon(0xffffff, { vertexColors: true }), H, undefined, undefined, 0.02);
  // face
  const eyeTex = eyeTexture(0x6a4426, 0x2e1a0e, 0x120a06), brow = toon(0x1a110e);
  for (const s of [1, -1]) {
    const { p, n } = onFront(head, s * 0.22, 0.74);
    const e = addEye(H, p.clone().addScaledVector(n, -0.06), 0.12, eyeTex, skin); e.base.scale.set(1, 0.95, 1); e.side = s;
    R.eyes.push(e);
    const b = onFront(head, s * 0.23, 0.93).p;
    mesh(taperedTube([b.clone().add(V(-s * 0.13, -0.02, 0.02)), b.clone().add(V(0, 0.02, 0.03)), b.clone().add(V(s * 0.14, -0.03, 0))], 10, u => 0.04 * (1 - 0.4 * u), null, 5), brow, H);
  }
  const m = onFront(head, 0, 0.3);
  R.mouth = mesh(SPH, toon(0x5a1a1a), H, null, [0.13, 0.02, 0.05]); R.mouth.position.copy(m.p).addScaledVector(m.n, -0.02);
  const smile = mesh(new THREE.TorusGeometry(0.12, 0.016, 6, 14, Math.PI * 0.7), toon(0x3a1a14), H); smile.position.copy(m.p).add(V(0, 0.08, 0)); smile.rotation.z = Math.PI + 0.47;
  R.mouthPt = new THREE.Object3D(); R.mouthPt.position.copy(m.p).add(V(0, 0, 0.08)); H.add(R.mouthPt);
  R.crown = new THREE.Object3D(); R.crown.position.set(0, 1.7, 0); H.add(R.crown);
  // arms: short sleeves, then skin
  const sleeve = new THREE.LatheGeometry([[0.23, 0.06], [0.25, -0.25], [0.24, -0.5]].map(([a, b]) => new THREE.Vector2(a, b)), 16);
  for (const a of R.arm) {
    inked(sleeve, toon(shirtC, { side: THREE.DoubleSide }), a.sh, undefined, undefined, 0.02);
    inked(SPH, toon(shirtC), a.sh, [0, -0.02, 0], 0.25, 0.02);
    inked(taperCapsule(0.17, 0.14, 0.92), skin, a.sh, undefined, undefined, 0.018);
    mesh(SPH, skin, a.el, undefined, 0.14);
    inked(taperCapsule(0.14, 0.11, 0.84), skin, a.el, undefined, undefined, 0.018);
    inked(surfaceNet((x, y, z) => smin(ell(x, y, z, 0, -0.12, 0, 0.12, 0.16, 0.08), ell(x, y, z, 0, -0.06, 0.11, 0.05, 0.09, 0.05), 0.05), () => skinC, [-0.25, -0.35, -0.2], [0.25, 0.12, 0.25], 0.022),
      toon(0xffffff, { vertexColors: true }), a.hand, undefined, undefined, 0.014);
    a.hand.userData.holdPt = new THREE.Object3D(); a.hand.userData.holdPt.position.set(0, -0.24, 0.08); a.hand.add(a.hand.userData.holdPt);
  }
  // legs in jeans, white sneakers
  for (const l of R.leg) {
    inked(taperCapsule(0.29, 0.23, 1.3), toon(jeans), l.hip, undefined, undefined, 0.02);
    inked(taperCapsule(0.23, 0.2, 1.24), toon(jeans), l.knee, undefined, undefined, 0.02);
    inked(sculpt((x, y, z) => [x * 0.19, y * 0.14 + (y < 0 ? 0 : 0.02), z * 0.36], (x, y) => (y < -0.4 ? C(0xd8d8d8) : C(0xf6f6f2)), 18, 12), toon(0xffffff, { vertexColors: true }), l.ankle, [0, -0.08, 0.16], undefined, 0.016);
  }
  return R;
}

/* ---------------------------------------------------------------- minions */

function buildMinion(k) {
  const tall = 0.85 + rand() * 0.4, R = 0.62, top = 1.25 + 0.6 * tall, two = k % 2 === 1;
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const yellow = C(0xf6d23a), yD = C(0xe8b820), denim = C(0x3d6fb6), denimD = C(0x2b5390);
  const sdf = (x, y, z) => {
    const yy = clamp(y, 0.62, top), dx = x, dy = y - yy;
    return Math.hypot(dx, dy, z) - R * (1 - 0.06 * sm(top, top + 0.6, y));
  };
  inked(surfaceNet(sdf, (x, y, z) => {
    const front = z > 0.05;
    if (y < 0.85 || (front && y < 1.25 && Math.abs(x) < 0.36)) {                               // overalls with a bib
      if (front && y < 1.1 && y > 0.82 && Math.abs(x) < 0.16) return denimD;                      // pocket
      return denim;
    }
    if (Math.abs(Math.abs(x) - 0.26) < 0.05 && y < 1.6 && z > -0.2) return denim;                 // straps
    return mix(yellow, yD, sm(0.4, 0, z) * 0.4);
  }, [-0.75, -0.05, -0.75], [0.75, top + 0.75, 0.75], 0.03), toon(0xffffff, { vertexColors: true }), body, undefined, undefined, 0.024);
  // the goggle band and lenses
  const eyeY = top - 0.05;
  mesh(new THREE.TorusGeometry(R + 0.02, 0.07, 8, 32).rotateX(Math.PI / 2), toon(0x2a2a2a), body, [0, eyeY, 0]);
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9cdd2, metalness: 0.9, roughness: 0.25 });
  const eyeTex = eyeTexture(0x8a5a2a, 0x4a2a10, 0x1a0e06), eyes = [];
  for (const s of two ? [1, -1] : [0]) {
    const p = V(s * 0.24, eyeY, R + 0.02);
    const rim = mesh(new THREE.TorusGeometry(two ? 0.2 : 0.27, 0.06, 10, 24), metal, body); rim.position.copy(p); rim.position.z += 0.04;
    rim.add(new THREE.Mesh(rim.geometry, inkMat(0.02)));
    const e = addEye(body, p.clone().add(V(0, 0, -0.06)), two ? 0.17 : 0.23, eyeTex, toon(yellow)); e.side = s || 1; eyes.push(e);
  }
  // mouth: a dark grin with teeth, opens wide to bite
  const mouth = new THREE.Group(); mouth.position.set(0, eyeY - 0.5, R - 0.03); body.add(mouth);
  const inside = mesh(SPH, toon(0x3a1010), mouth, null, [0.22, 0.06, 0.08]);
  const teeth = mesh(new THREE.BoxGeometry(0.3, 0.05, 0.04), toon(0xffffff), mouth, [0, 0.03, 0.06]);
  // hair: a few black sprouts
  const hairM = toon(0x1a1a1a), style = k % 3;
  for (let i = 0; i < (style === 0 ? 1 : style === 1 ? 7 : 4); i++) {
    const a = (i / 7) * TAU, r = style === 0 ? 0 : 0.18, b = V(Math.cos(a) * r, top + R - 0.04, Math.sin(a) * r);
    mesh(taperedTube([b, b.clone().add(V(Math.cos(a) * 0.08, 0.25, Math.sin(a) * 0.08)), b.clone().add(V(Math.cos(a) * 0.2, 0.42, Math.sin(a) * 0.2))], 8, u => 0.022 * (1 - 0.6 * u), null, 4), hairM, body);
  }
  // arms and gloves, legs and shoes
  const arms = [], legs = [], glove = toon(0x1c1c1c);
  for (const s of [1, -1]) {
    const sh = new THREE.Group(); sh.position.set(s * (R - 0.04), 1.05, 0); body.add(sh); sh.rotation.order = 'XZY';
    inked(taperCapsule(0.075, 0.07, 0.42), toon(yellow), sh, undefined, undefined, 0.014);
    const el = new THREE.Group(); el.position.y = -0.42; sh.add(el);
    inked(taperCapsule(0.07, 0.065, 0.34), toon(yellow), el, undefined, undefined, 0.014);
    inked(SPH, glove, el, [0, -0.42, 0], [0.11, 0.12, 0.1], 0.012);
    arms.push({ sh, el, s });
    const hip = new THREE.Group(); hip.position.set(s * 0.22, 0.35, 0); g.add(hip);
    inked(capsule(0.12, 0.18), toon(denim), hip, [0, -0.15, 0], undefined, 0.014);
    inked(sculpt((x, y, z) => [x * 0.15, y * 0.09, z * 0.22], null, 14, 10), toon(0x161616), hip, [0, -0.33, 0.07], undefined, 0.012);
    legs.push(hip);
  }
  body.position.y = 0.2;
  const sc = 0.95 + rand() * 0.15;
  g.scale.setScalar(sc);
  return {
    g, body, arms, legs, eyes, mouth, inside, teeth, mouthOpen: 0, sc, mouthY: (0.2 + eyeY - 0.5) * sc, height: (top + R + 0.2) * sc,
    pos: V(), vel: V(), y: 0, yaw: 0, spinX: 0, mode: 'hide', t: 0, phase: rand() * 9, speed: 3.4 + rand() * 0.8, blink: rand() * 3, stun: 0, target: null, attach: null, ang: rand() * TAU,
  };
}

function bananaGeo() {
  const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, a = -0.9 + t * 1.8; pts.push(V(Math.sin(a) * 0.5, -Math.cos(a) * 0.5 + 0.5, 0)); }
  return taperedTube(pts, 24, u => 0.09 * Math.sin(Math.PI * clamp(u * 1.08 - 0.04, 0, 1)) + 0.015, u => (u < 0.06 || u > 0.94 ? C(0x5a4a1a) : C(0xffd84a)), 8);
}

/* ---------------------------------------------------------------- speech, stars and dust */

const bubbleTex = new Map();
function bubble(text) {
  if (!bubbleTex.has(text)) bubbleTex.set(text, canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = '#fff'; c.strokeStyle = '#2a1a14'; c.lineWidth = 6;
    c.beginPath(); c.roundRect(8, 8, w - 16, h - 40, 30); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(w / 2 - 18, h - 34); c.lineTo(w / 2 - 4, h - 8); c.lineTo(w / 2 + 14, h - 34); c.fill(); c.stroke();
    c.fillStyle = '#fff'; c.fillRect(w / 2 - 15, h - 40, 26, 8);
    c.fillStyle = '#2a1a14'; c.font = 'bold 46px "Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, w / 2, (h - 32) / 2 + 4);
  }));
  return bubbleTex.get(text);
}
const starTex = canvasTex(64, 64, (c, S) => {
  c.fillStyle = '#ffd23a'; c.strokeStyle = '#a06a00'; c.lineWidth = 3; c.beginPath();
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 12 : 28; c.lineTo(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r); }
  c.closePath(); c.fill(); c.stroke();
});
const puffTex = canvasTex(128, 128, (c, S) => {
  for (let i = 0; i < 9; i++) { const x = S * (0.3 + 0.4 * rand()), y = S * (0.3 + 0.4 * rand()), r = S * (0.14 + 0.1 * rand()); const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(250,244,230,1)'); g.addColorStop(0.7, 'rgba(232,220,196,.95)'); g.addColorStop(1, 'rgba(210,196,170,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
});

/* ---------------------------------------------------------------- poses (for me) */

const P = {
  stand: {},
  hopL: { lfR: 0.9, lkR: 1.6, afR: 0.5, aeR: 1.5, aoR: 0.3, afL: 0.2, aoL: 1.0, aeL: 0.5, hp: 0.35, jaw: 0.9, lean: 0.2 },
  armOut: { afR: 1.5, aeR: 0.2, aoR: 0.4, afL: 0.3, aoL: 0.6, jaw: 0.6, hp: -0.1, twist: -0.3 },
  windmill: { aoR: 2.6, afR: 0.2, aeR: 0.1, lean: -0.1, jaw: 0.9 },
  fallen: { pp: -1.45, lfL: 0.15, lfR: 0.1, lkL: 0.3, lkR: 0.6, aoL: 1.3, aoR: 1.3, afL: 0.4, afR: 0.4, aeL: 0.4, aeR: 0.4, hp: 0.3, jaw: 0.5 },
  burst: { aoL: 1.6, aoR: 1.6, afL: 0.6, afR: 0.6, aeL: 0.1, aeR: 0.1, hp: -0.4, jaw: 1, lfL: 0.3, lkL: 0.4, lfR: 0.3, lkR: 0.4 },
  banana: { afR: 2.4, aeR: 0.9, aoR: 0.25, hp: -0.25, jaw: 0.4, afL: 0.5, aeL: 1.6 },
  throw: { afR: 1.9, aeR: 0.1, aoR: 0.1, twist: -0.5, lean: 0.25, afL: -0.3, aoL: 0.6 },
  dust: { afL: 0.6, aeL: 1.7, aoL: -0.5, afR: 0.6, aeR: 1.7, aoR: -0.5, jaw: 0.3 },
  laugh: { afL: 0.5, aeL: 1.9, aoL: -0.3, afR: 0.5, aeR: 1.9, aoR: -0.3, lean: -0.25, hp: -0.4, jaw: 1 },
  guard: { lfL: 0.45, lkL: 0.7, lfR: -0.3, lkR: 0.4, afL: 1.1, aeL: 1.9, afR: 0.8, aeR: 2.0, twist: 0.3, lean: 0.12, jaw: 0.2 },
  shoo: { afL: 0.8, aeL: 0.6, aoL: 0.2, afR: 0.8, aeR: 0.6, aoR: 0.2, hp: 0.35, lean: 0.25 },
  tired: { afL: 0.55, aeL: 0.4, aoL: -0.3, afR: 0.55, aeR: 0.4, aoR: -0.3, lean: 0.55, hp: 0.3, lfL: 0.3, lkL: 0.5, lfR: 0.3, lkR: 0.5, jaw: 0.7 },
};
const S = (...ps) => Object.assign({}, ...ps);

/* ---------------------------------------------------------------- the scene */

export function start(canvas, opts = {}) {
  const small = Math.min(innerWidth, innerHeight) < 600;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  let dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xeaf0f2, 140, 900);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 1800);
  const tanH = Math.tan(THREE.MathUtils.degToRad(17.5));
  const hemi = new THREE.HemisphereLight(0xeaf4ff, 0x6a7a40, 1.2); scene.add(hemi);
  const sunL = new THREE.DirectionalLight(0xfff2dc, 2.3); sunL.position.set(-30, 50, 30); scene.add(sunL);

  /* sky, clouds, far hills */
  const skyMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false });
  const skyTex = night => canvasTex(4, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    if (night) { g.addColorStop(0, 'rgba(40,40,90,0)'); g.addColorStop(0.5, 'rgba(110,70,120,.6)'); g.addColorStop(0.85, 'rgba(240,130,90,.9)'); g.addColorStop(1, 'rgba(255,180,110,1)'); }
    else { g.addColorStop(0, 'rgba(150,200,240,0)'); g.addColorStop(0.45, 'rgba(160,206,240,.55)'); g.addColorStop(0.9, 'rgba(214,234,246,.95)'); g.addColorStop(1, 'rgba(236,244,246,1)'); }
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  const skyTexes = [skyTex(false), skyTex(true)];
  mesh(new THREE.PlaneGeometry(5000, 700), skyMat, scene, [0, 170, -1500]).renderOrder = -10;
  const clouds = [];
  for (let i = 0; i < 10; i++) {
    const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, fog: false, transparent: true, depthWrite: false, opacity: 0.9 }));
    c.position.set((rand() * 2 - 1) * 900, 120 + rand() * 200, -1300 - rand() * 100); c.scale.set(420 + rand() * 300, 140 + rand() * 80, 1); c.renderOrder = -9; scene.add(c); clouds.push({ c, v: 4 + rand() * 4 });
  }
  {
    // rolling hills, a patchwork of fields and hedges
    const nx = small ? 160 : 260, nzr = 90, X = 900, pos = [], col = [], idx = [];
    for (let j = 0; j < nzr; j++) for (let i = 0; i < nx; i++) {
      const x = (i / (nx - 1) * 2 - 1) * X, z = -40 - 900 * Math.pow(j / (nzr - 1), 1.4);
      const h = 18 * fbm(x * 0.004, z * 0.004, 4) + 28 * sm(-100, -700, z) * (0.6 + 0.4 * fbm(x * 0.002 + 5, z * 0.003, 3)) - 6 * sm(-80, -40, z);
      pos.push(x, h, z);
      const patch = Math.floor(x / 60 + fbm(x * 0.01, z * 0.01, 2)) + Math.floor(z / 50);
      let c = C([0x6f9a3e, 0x86ac4a, 0x9cb85a, 0x5f8a36, 0xb7b85e][((patch % 5) + 5) % 5]);
      c = mix(c, C(0x3f6a2c), sm(0.42, 0.5, Math.abs(fbm(x * 0.03, z * 0.03, 2))) * 0.8);
      col.push(c.r, c.g, c.b);
      if (i < nx - 1 && j < nzr - 1) { const k = j * nx + i; idx.push(k, k + 1, k + nx, k + 1, k + nx + 1, k + nx); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const hills = mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, transparent: true }), scene); hills.renderOrder = 1;
    // distant trees and hedgerows on the hills: clusters of leafy cards
    const treeTex = foliageCard([0x5a8a3a, 0x6f9e48, 0x4a7a32, 0x86b058], 70), hAt = (cx, cz) => 18 * fbm(cx * 0.004, cz * 0.004, 4) + 28 * sm(-100, -700, cz) * (0.6 + 0.4 * fbm(cx * 0.002 + 5, cz * 0.003, 3)) - 6 * sm(-80, -40, cz);
    const NT = small ? 70 : 140, per = 14, centres = [];
    for (let i = 0; i < NT; i++) { const cx = (rand() * 2 - 1) * 650, cz = -200 - Math.pow(rand(), 0.7) * 380; centres.push([cx, cz, 3.5 + rand() * 4]); }
    scene.add(cardCloud(treeTex, NT * per, (i, p) => {
      const [cx, cz, r] = centres[(i / per) | 0], a = rand() * TAU, u = rand();
      p.set(cx + Math.cos(a) * r * u, hAt(cx, cz) + r * (0.45 + 0.6 * rand()), cz + Math.sin(a) * r * u * 0.6); return r * (0.8 + 0.4 * rand());
    }));
  }

  /* the field */
  const world = new THREE.Group(); scene.add(world);
  {
    const lawn = new THREE.PlaneGeometry(260, 90, 100, 30); lawn.rotateX(-Math.PI / 2); lawn.translate(0, 0, -20);
    const p = lawn.attributes.position, cols = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, 0.2 * nz(x * 0.2, 0, z * 0.2) - 6 * sm(-30, -60, z));
      const k = 0.85 + 0.25 * fbm(x * 0.05, z * 0.05, 3); cols.push(k, k, k, 1 - sm(8, 22, z));
    }
    lawn.setAttribute('color', new THREE.Float32BufferAttribute(cols, 4)); lawn.computeVertexNormals();
    const ground = mesh(lawn, new THREE.MeshStandardMaterial({ map: grassTex(), vertexColors: true, transparent: true, roughness: 1 }), world); ground.renderOrder = -2;
    // grass blades and wildflowers
    const blade = new THREE.BufferGeometry();
    blade.setAttribute('position', new THREE.Float32BufferAttribute([-0.05, 0, 0, 0.05, 0, 0, -0.03, 0.35, 0.02, 0.03, 0.35, 0.02, 0, 0.7, 0.08], 3));
    blade.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4]); blade.computeVertexNormals();
    const n = small ? 3500 : 9000, gr = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9 }), n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < n; i++) {
      m4.compose(V((rand() * 2 - 1) * 80, 0, -25 + rand() * 32), q.setFromEuler(e.set((rand() - 0.5) * 0.5, rand() * TAU, (rand() - 0.5) * 0.5)), V(1, 0.5 + rand(), 1)); gr.setMatrixAt(i, m4);
      gr.setColorAt(i, C(GREENS[(rand() * GREENS.length) | 0]).multiplyScalar(0.9 + rand() * 0.35));
    }
    world.add(gr);
    const fl = new THREE.InstancedMesh(new THREE.CircleGeometry(0.13, 7).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ roughness: 0.7, side: THREE.DoubleSide }), small ? 500 : 1200);
    for (let i = 0; i < fl.count; i++) {
      const cl = fbm(i * 0.37, 2.1, 2);
      m4.compose(V((rand() * 2 - 1) * 80, 0.35 + rand() * 0.3, -25 + rand() * 32), q.setFromEuler(e.set((rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.6)), V(1, 1, 1)); fl.setMatrixAt(i, m4);
      fl.setColorAt(i, C(cl > 0.1 ? 0xffffff : cl > -0.15 ? 0xffd23a : rand() < 0.5 ? 0xc06ad0 : 0xff6a6a));
    }
    world.add(fl);
  }
  // an oak, haystacks and a fence
  const oak = new THREE.Group(); world.add(oak);
  {
    const barkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
    const bark = (u, j) => mix(C(0x3e2c1f), C(0x6a4e36), 0.5 + 0.35 * Math.sin(u * 23 + j * 2.1));
    const spots = [];
    mesh(taperedTube([V(0, -0.5, 0), V(0.4, 3, 0.1), V(-0.2, 6, 0)], 24, u => 1.3 * (1 + 0.5 * Math.exp(-u * 8)) * (1 - 0.45 * u), bark, 10), barkMat, oak);
    const branch = (p0, d, len, r0, depth) => {
      const p1 = p0.clone().addScaledVector(d, len * 0.5).add(V(0, 0.4, 0)), p2 = p0.clone().addScaledVector(d, len);
      mesh(taperedTube([p0, p1, p2], 8, u => r0 * (1 - 0.5 * u), bark, 6), barkMat, oak);
      spots.push(p2, p1);
      if (depth) for (let k = 0; k < 3; k++) { const a = rand() * TAU; branch(p2, V(Math.cos(a), 0.4 + rand() * 0.4, Math.sin(a) * 0.6).addScaledVector(d, 0.6).normalize(), len * 0.65, r0 * 0.55, depth - 1); }
    };
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; branch(V(0, 5.5, 0), V(Math.cos(a), 0.5, Math.sin(a) * 0.7).normalize(), 5, 0.6, 1); }
    oak.add(cardCloud(foliageCard(GREENS, 60), small ? 220 : 380, (i, p) => { p.copy(spots[i % spots.length]).add(V(rand() - 0.5, rand() - 0.3, rand() - 0.5).multiplyScalar(4.2)); return 2 + rand() * 1.4; }));
  }
  const strawTex = tiled(canvasTex(128, 128, (c, S) => { c.fillStyle = '#d9b45a'; c.fillRect(0, 0, S, S); for (let i = 0; i < 900; i++) { c.strokeStyle = `rgba(${150 + rand() * 90 | 0},${110 + rand() * 70 | 0},40,.6)`; c.beginPath(); const x = rand() * S, y = rand() * S, a = rand() * 0.6 - 0.3; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); c.stroke(); } }), 3, 2);
  const hay = [];
  for (let i = 0; i < 2; i++) {
    const h = mesh(sculpt((x, y, z) => [x * 2.2 * (1 + 0.05 * Math.sin(y * 9 + x * 4)), Math.max(y, -0.2) * 2.6 + 0.5, z * 2.2 * (1 + 0.05 * Math.sin(y * 7 + z * 5))], null, 28, 16), new THREE.MeshStandardMaterial({ map: strawTex, roughness: 1 }), world);
    hay.push(h);
  }
  const fence = new THREE.Group(); world.add(fence);
  {
    const wood = new THREE.MeshStandardMaterial({ map: woodTex(0x8a6a4a), roughness: 0.9 });
    for (let i = 0; i < 30; i++) {
      const x = -90 + i * 6;
      mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), wood, fence, [x, 1.1, 0]).rotation.z = (rand() - 0.5) * 0.08;
      for (const y of [0.8, 1.7]) mesh(new THREE.BoxGeometry(6.1, 0.22, 0.12), wood, fence, [x + 3, y, 0]).rotation.z = (rand() - 0.5) * 0.04;
    }
  }
  // fireflies for the evening
  const flies = [];
  for (let i = 0; i < 30; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, 'rgba(255,250,170,1)'], [0.3, 'rgba(230,255,120,.6)'], [1, 'rgba(200,255,100,0)']]), transparent: true, depthWrite: false, opacity: 0 })); s.scale.setScalar(0.5); world.add(s); flies.push({ s, p: V((rand() * 2 - 1) * 30, 0.6 + rand() * 3, -18 + rand() * 20), ph: rand() * 9 }); }

  /* ---------------------------------------------------------------- layout */
  let aspect = 1, camK = 1;
  const halfWAt = z => (camera.position.z - z) * tanH * aspect;
  const xLim = z => Math.max(2, halfWAt(z) - 2.4);
  const haySpot = V();
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    aspect = w / h; camera.aspect = aspect;
    camK = Math.max(1, Math.pow(1.45 / aspect, 0.65));
    camera.position.set(0, 8 * camK, 40 * camK);
    camera.lookAt(0, 8 * camK - 40 * camK * Math.tan(THREE.MathUtils.degToRad(3)), 0);
    camera.updateProjectionMatrix();
    const hw = halfWAt(-14);
    oak.position.set(hw * 0.9, 0, -16);
    hay[0].position.set(-hw * 0.72, 0, -12); hay[1].position.set(-hw * 0.72 - 5, 0, -15); hay[1].scale.setScalar(0.8);
    haySpot.copy(hay[0].position);
    fence.position.set(0, 0, -21);
    scene.updateMatrixWorld(true);
  }
  resize();

  /* ---------------------------------------------------------------- input */
  let clock = 0, lastSeen = -99;
  const ptr = { x: 0, y: 0, has: false }, mouseW = V();
  const onMove = e => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true; lastSeen = clock; };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('resize', resize);
  function pointerWorld(z) {
    const v = V(ptr.x / innerWidth * 2 - 1, -(ptr.y / innerHeight) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
    return mouseW.copy(camera.position).addScaledVector(v, (z - camera.position.z) / v.z);
  }

  /* ---------------------------------------------------------------- me: rig update */
  const R = buildMe(small); world.add(R.root);
  const shadowTex = radial([[0, 'rgba(30,40,20,.4)'], [0.6, 'rgba(30,40,20,.15)'], [1, 'rgba(30,40,20,0)']]);
  const shadow = mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }), world); shadow.renderOrder = -1;
  const A = {
    pos: V(), yaw: 0, cur: blank(), target: blank(), out: blank(), rate: 6, rest: { ao: 0.14, lo: 0.04 },
    walkAmt: 0, phase: 0, moving: 0, stepping: 0, run: 0, solveY: R.d.hipH, seat: null, seatW: 0, osc: [], force: {}, hop: 0,
    look: null, lookW: 0, eyeX: 0, eyeTX: 0, lid: 0, lidT: 0, blinkAt: 2, blinkT: 0, wide: 0, autoLook: true,
  };
  A.set = (p, rate = 6) => { A.target = Object.assign(blank(), p); A.rate = rate; };
  R.mouth.userData.y0 = R.mouth.scale.y;
  const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), tv = V(), tv2 = V(), xAxis = V(1, 0, 0);
  function updateMe(dt) {
    const o = A.out, k = 1 - Math.exp(-dt * A.rate);
    for (const key of KEYS) A.cur[key] += (A.target[key] - A.cur[key]) * k;
    Object.assign(o, A.cur);
    A.walkAmt += ((A.moving > 0.05 || A.stepping ? 1 : 0) - A.walkAmt) * (1 - Math.exp(-dt * 8));
    A.phase += dt * (A.moving * (2.6 + 2.4 * A.run) + A.stepping * 6);
    if (A.walkAmt > 0.01) {
      const w = A.walkAmt, s = Math.sin(A.phase), c = Math.cos(A.phase), r = A.run;
      o.lfL += w * ((0.45 + 0.35 * r) * s + 0.25 * Math.max(0, c)); o.lfR += w * (-(0.45 + 0.35 * r) * s + 0.25 * Math.max(0, -c));
      o.lkL += w * (0.8 + 0.6 * r) * Math.max(0, c); o.lkR += w * (0.8 + 0.6 * r) * Math.max(0, -c);
      o.pr += w * 0.06 * s; o.twist += w * 0.12 * s; o.lean += w * 0.2 * r;
      o.afL -= w * (0.35 + 0.5 * r) * s; o.afR += w * (0.35 + 0.5 * r) * s; o.aeL += w * (0.2 + 1.0 * r); o.aeR += w * (0.2 + 1.0 * r);
    }
    for (const [key, amp, f, ph] of A.osc) o[key] += amp * Math.sin(clock * f + (ph || 0));
    for (const key in A.force) o[key] = A.force[key];
    let tgt = A.look ? A.look() : null;
    if (!tgt && A.autoLook && ptr.has && clock - lastSeen < 2.5) { R.head.getWorldPosition(tv2); const pw = pointerWorld(A.pos.z + 1); if (pw.distanceTo(tv2) < 10) tgt = pw; }
    A.lookW += ((tgt ? 1 : 0) - A.lookW) * (1 - Math.exp(-dt * 4));
    if (tgt) {
      R.head.getWorldPosition(tv2); tv.subVectors(tgt, tv2);
      const cy = Math.cos(A.yaw), sy = Math.sin(A.yaw), lx = tv.x * cy - tv.z * sy, lz = tv.x * sy + tv.z * cy;
      A._ly = Math.atan2(lx, lz) - o.twist; A._lp = -Math.atan2(tv.y, Math.hypot(lx, lz)) - o.lean;
    }
    if (A.lookW > 0.01 && A._ly !== undefined) { const hy = clamp(A._ly, -0.9, 0.9); o.hy = lerp(o.hy, hy, A.lookW); o.hp = lerp(o.hp, clamp(A._lp, -0.5, 0.5), A.lookW); A.eyeTX = clamp(A._ly - hy, -0.4, 0.4) * A.lookW; }
    A.eyeX += (A.eyeTX - A.eyeX) * (1 - Math.exp(-dt * 14));
    A.blinkAt -= dt; if (A.blinkAt < 0) { A.blinkT = 0.14; A.blinkAt = 2 + rnd() * 3; }
    A.blinkT -= dt; A.lid += (Math.max(A.lidT, A.blinkT > 0 ? 1 : 0) - A.lid) * (1 - Math.exp(-dt * 22)); A.wide *= Math.exp(-dt * 2);
    for (const e of R.eyes) { e.ball.rotation.set(0, A.eyeX, 0); e.lid.rotation.x = lerp(-0.8 - A.wide * 0.4, 1.45, A.lid); }
    R.mouth.scale.y = R.mouth.userData.y0 * (1 + clamp(o.jaw, 0, 1.2) * 7);
    R.root.position.copy(A.pos); R.root.rotation.y = A.yaw;
    R.pelvis.rotation.set(o.pp, 0, o.pr);
    R.torso.rotation.set(o.lean, o.twist, o.side);
    R.neck.rotation.set(o.hp * 0.35, o.hy * 0.35, o.hr * 0.35);
    R.head.rotation.set(o.hp * 0.65, o.hy * 0.65, o.hr * 0.65);
    for (let i = 0; i < 2; i++) {
      const a = R.arm[i], l = R.leg[i], s = a.s, K = i ? 'R' : 'L';
      a.sh.rotation.set(-o['af' + K], s * o['at' + K], s * (o['ao' + K] + A.rest.ao));
      a.el.rotation.set(-o['ae' + K], 0, 0);
      a.hand.quaternion.copy(q.copy(a.sh.quaternion).multiply(a.el.quaternion).invert());
      l.hip.rotation.set(-o['lf' + K], 0, s * (o['lo' + K] + A.rest.lo));
      l.knee.rotation.set(o['lk' + K], 0, 0);
      l.ankle.quaternion.copy(q.copy(l.hip.quaternion).multiply(l.knee.quaternion).invert()).multiply(q2.setFromAxisAngle(xAxis, o['la' + K]));
    }
    R.pelvis.position.y = R.d.hipH;
    R.root.updateMatrixWorld(true);
    const y0 = R.leg[0].ankle.getWorldPosition(tv).y, y1 = R.leg[1].ankle.getWorldPosition(tv).y;
    A.solveY = R.d.hipH + (A.pos.y + R.d.ankleH - Math.min(y0, y1));
    A.seatW += ((A.seat !== null ? 1 : 0) - A.seatW) * (1 - Math.exp(-dt * 5));
    R.pelvis.position.y = lerp(A.solveY, A.seat !== null ? A.seat : A.solveY, A.seatW) + A.hop;
    R.root.updateMatrixWorld(true);
    shadow.position.set(A.pos.x, 0.05, A.pos.z + 0.2); shadow.scale.set(3.4 + A.seatW * 1.5, 1, 3.4 + A.seatW * 3);
  }

  /* ---------------------------------------------------------------- minions */
  const NM = small ? 4 : 6;
  const minions = [];
  for (let k = 0; k < NM; k++) {
    const m = buildMinion(k); world.add(m.g); m.g.visible = false;
    m.shadow = mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }), world); m.shadow.renderOrder = -1; m.shadow.visible = false;
    m.stars = []; for (let i = 0; i < 3; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false })); s.scale.setScalar(0.32); s.visible = false; world.add(s); m.stars.push(s); }
    minions.push(m);
  }
  const bubbles = [];
  for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); s.visible = false; s.scale.set(1.8, 0.9, 1); world.add(s); bubbles.push({ s, t: 9, who: null, dy: 0 }); }
  function say(text, who, dy) {
    const b = bubbles.find(x => x.t > 1.4) || bubbles[0];
    b.s.material.map = bubble(text); b.s.material.needsUpdate = true; b.t = 0; b.who = who; b.dy = dy;
  }
  const minionWords = ['Bello!', 'Banana!', 'Bee-do!', 'Poopaye!', 'Tank yu!', 'Muak!', 'Para tú!'];
  const banana = mesh(bananaGeo(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }), world); banana.visible = false;
  let bananaState = null;
  const dust = [];
  for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false })); s.visible = false; world.add(s); dust.push({ s, o: V(), ph: rand() * 9 }); }
  let dustAt = null, dustT = 0;

  const ground = V();
  const limbPt = (obj, x, y, z) => obj.localToWorld(V(x, y, z));
  function updateMinion(m, dt) {
    m.t += dt; m.blink -= dt;
    let wad = 0, armsUp = 0, legsDangle = 0, chomp = 0;
    if (m.mode === 'hide') { m.g.visible = false; m.shadow.visible = false; return; }
    m.g.visible = true;
    if (m.mode === 'run' || m.mode === 'chase' || m.mode === 'flee') {
      let tx, tz;
      if (m.mode === 'chase') {                                       // surround me, then charge
        m.ang += dt * 0.6; const r = m.charge ? 0.9 : 3.2;
        tx = A.pos.x + Math.cos(m.ang) * r; tz = A.pos.z + Math.sin(m.ang) * r * 0.8;
      } else { tx = m.target.x; tz = m.target.z; }
      const dx = tx - m.pos.x, dz = tz - m.pos.z, d = Math.hypot(dx, dz);
      if (d > 0.08) {
        const want = Math.atan2(dx, dz), diff = angDiff(m.yaw, want);
        m.yaw += Math.sign(diff) * Math.min(Math.abs(diff), dt * 8);
        const sp = Math.min(m.speed * (m.mode === 'flee' ? 1.3 : 1), d * 4);
        m.pos.x += Math.sin(m.yaw) * sp * dt; m.pos.z += Math.cos(m.yaw) * sp * dt; wad = Math.min(1, sp / 2);
      } else if (m.mode === 'run') { m.mode = 'idle'; m.yaw += angDiff(m.yaw, Math.atan2(A.pos.x - m.pos.x, A.pos.z - m.pos.z)) * 0.5; }
      armsUp = m.mode === 'flee' ? 0.4 : 1;
      m.y = Math.abs(Math.sin(m.t * 12 + m.phase)) * 0.12 * wad;
    } else if (m.mode === 'idle' || m.mode === 'cheer') {
      m.yaw += angDiff(m.yaw, Math.atan2(A.pos.x - m.pos.x, A.pos.z - m.pos.z)) * Math.min(1, dt * 3);
      m.y = m.mode === 'cheer' ? Math.max(0, Math.sin(m.t * 9 + m.phase)) * 0.6 : 0; armsUp = m.mode === 'cheer' ? 1 : 0;
    } else if (m.mode === 'bite') {                                   // clamped onto my leg or arm
      const at = m.attach, p = at.obj.localToWorld(tv.copy(at.off));
      m.pos.set(p.x, 0, p.z); m.y = p.y - m.mouthY;
      m.yaw = Math.atan2(A.pos.x - p.x, A.pos.z - p.z) + (at.turn || 0);
      m.pos.x -= Math.sin(m.yaw) * 0.45 * m.sc; m.pos.z -= Math.cos(m.yaw) * 0.45 * m.sc;
      chomp = 1; legsDangle = 1; armsUp = 0.55;
    } else if (m.mode === 'pile') {
      const p = R.torso.localToWorld(tv.copy(m.attach)); m.pos.set(p.x, 0, p.z); m.y = p.y - 0.4; armsUp = 1; legsDangle = 1; chomp = 0.5;
      m.spinX = Math.sin(m.t * 6 + m.phase) * 0.3 - 0.6;
    } else if (m.mode === 'fly') {
      m.vel.y -= 22 * dt; m.pos.addScaledVector(V(m.vel.x, 0, m.vel.z), dt); m.y += m.vel.y * dt; if (!m.soft) m.spinX += dt * 9; legsDangle = 1; armsUp = 1;
      m.pos.x = clamp(m.pos.x, -xLim(m.pos.z) - 4, xLim(m.pos.z) + 4);
      if (m.y <= 0 && m.vel.y < 0) { m.y = 0; m.t = 0; if (m.soft) { m.soft = false; m.mode = 'idle'; m.spinX = 0; } else { m.mode = 'stun'; m.spinX = -Math.PI / 2; m.stun = 2.2 + rnd() * 1.5; } }   // a jump lands on its feet, a fling knocks it flat
    } else if (m.mode === 'stun') {                                    // flat on its back, seeing stars
      m.stun -= dt;
      if (m.stun < 0.6) m.spinX += (0 - m.spinX) * Math.min(1, dt * 6);
      if (m.stun < 0) { m.mode = 'idle'; m.spinX = 0; if (rnd() < 0.5) say(minionWords[(rnd() * minionWords.length) | 0], m, m.height + 0.5); }
    } else if (m.mode === 'brawl') { m.g.visible = false; m.shadow.visible = false; return; }
    else if (m.mode === 'eat') { m.y = 0; armsUp = 0.3; chomp = 0.6; }
    // pose
    const s = Math.sin(m.t * 13 + m.phase);
    m.body.rotation.set(m.mode === 'fly' || m.mode === 'stun' || m.mode === 'pile' ? 0 : 0.08 * wad, 0, 0.12 * s * wad);
    m.legs.forEach((l, i) => { l.rotation.x = legsDangle ? 0.5 + 0.4 * Math.sin(m.t * 10 + i * 3) : 0.7 * wad * (i ? -s : s); });
    m.arms.forEach((a, i) => {
      const flail = Math.sin(m.t * 15 + i * 2 + m.phase);
      a.sh.rotation.set(-(armsUp * (m.mode === 'bite' ? 1.4 : 2.6) + 0.3 * flail * armsUp), 0, a.s * (0.35 + 0.3 * armsUp + 0.1 * flail));
      a.el.rotation.x = -0.4 - 0.4 * armsUp;
    });
    m.mouthOpen += ((chomp ? 0.5 + 0.5 * Math.abs(Math.sin(m.t * 18)) : wad * 0.4 + (m.mode === 'cheer' ? 0.8 : 0.15)) - m.mouthOpen) * Math.min(1, dt * 20);
    m.inside.scale.y = 0.04 + 0.14 * m.mouthOpen; m.teeth.position.y = 0.02 + 0.08 * m.mouthOpen;
    if (m.blink < 0) m.blink = 2 + rnd() * 3;
    for (const e of m.eyes) { e.lid.rotation.x = m.mode === 'stun' ? 0.6 : m.blink < 0.12 ? 1.4 : -0.6; e.ball.rotation.y = m.mode === 'stun' ? Math.sin(m.t * 8) * 0.5 : 0; }
    m.g.position.set(m.pos.x, m.y, m.pos.z); m.g.rotation.set(m.spinX, m.yaw, 0, 'YXZ');
    m.shadow.visible = true; m.shadow.position.set(m.pos.x, 0.05, m.pos.z); m.shadow.scale.setScalar(1.6 * m.sc * (1 - clamp(m.y / 8, 0, 0.6)));
    m.stars.forEach((st, i) => { st.visible = m.mode === 'stun'; if (st.visible) { const a = m.t * 4 + i * TAU / 3; st.position.set(m.pos.x + Math.cos(a) * 0.5, 0.5 + m.sc * 0.4, m.pos.z + Math.sin(a) * 0.5); } });
  }
  function fling(m, power = 1) {
    m.mode = 'fly'; m.attach = null; m.soft = false;
    const a = rnd() * TAU; m.vel.set(Math.cos(a) * 6 * power, 9 + rnd() * 4 * power, Math.sin(a) * 4 * power);
    if (!isFinite(m.y) || m.y < 0) m.y = 0.1;
  }

  /* ---------------------------------------------------------------- behaviour (generators) */
  function* wait(t) { while (t > 0) t -= yield; }
  function* pose(p, t = 0.6, rate = 6) { A.set(p, rate); yield* wait(t); }
  function* turnTo(yaw, rate = 4) {
    while (Math.abs(angDiff(A.yaw, yaw)) > 0.04) { const dt = yield, d = angDiff(A.yaw, yaw); A.yaw += Math.sign(d) * Math.min(Math.abs(d), rate * dt); A.stepping = 0.7; }
    A.stepping = 0;
  }
  function* goTo(x, z, { speed = 2.2, run = 0, face } = {}) {
    A.run = run;
    for (;;) {
      const dt = yield, dx = x - A.pos.x, dz = z - A.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.12) break;
      const want = Math.atan2(dx, dz), diff = angDiff(A.yaw, want);
      A.yaw += Math.sign(diff) * Math.min(Math.abs(diff), dt * 6);
      const sp = speed * sm(0.1, 0.8, Math.cos(diff)) * Math.min(1, d / 0.5 + 0.25);
      A.pos.x += Math.sin(A.yaw) * sp * dt; A.pos.z += Math.cos(A.yaw) * sp * dt; A.moving = sp / speed;
    }
    A.moving = 0; A.run = 0;
    if (face !== undefined) yield* turnTo(face);
  }
  const faceCam = () => Math.atan2(camera.position.x - A.pos.x, camera.position.z - A.pos.z) * 0.7;
  const ATCAM = () => camera.position;
  const handPt = (i, out = V()) => R.arm[i].hand.userData.holdPt.getWorldPosition(out);
  const spot = () => { const z = -9 + rnd() * 10; return [(rnd() * 2 - 1) * xLim(z) * 0.8, z]; };
  const free = () => minions.filter(m => m.mode === 'idle' || m.mode === 'chase' || m.mode === 'run' || m.mode === 'cheer');

  function* popOut() {                                               // they burst out of the haystack
    for (const m of minions) {
      if (m.mode !== 'hide') continue;
      m.pos.copy(haySpot).add(V((rnd() - 0.5) * 2, 0, 2.2)); m.y = 3; m.vel.set(2 + rnd() * 4, 8, 2 + rnd() * 3); m.mode = 'fly'; m.soft = true; m.spinX = 0;
      say(minionWords[(rnd() * 3) | 0], m, m.height + 0.6);
      yield* wait(0.35);
    }
  }
  function* enter() {
    const x0 = halfWAt(0) + 3;
    A.pos.set(x0, 0, -2); A.yaw = -Math.PI / 2;
    yield* goTo(x0 * 0.35, -2, { speed: 3.4 });
    yield* turnTo(faceCam());
    A.osc = [['hy', 0.3, 1.6]]; yield* pose(P.dust, 1.4, 4); A.osc = [];      // a carefree stroll… whistling
    A.look = () => haySpot; A.wide = 1; say('Huh?', null, 1.2);
    yield* pose(S(P.stand, { hp: -0.05 }), 0.6, 8);
    yield* popOut();
    yield* wait(1.4);
    for (const m of minions) if (m.mode === 'idle') { m.mode = 'cheer'; m.t = 0; }
    yield* wait(0.8);
    A.look = null; say('Uh-oh…', null, 1.2);
    yield* wait(0.8);
  }
  function* chaseAndBite() {
    for (const m of free()) { m.mode = 'chase'; m.charge = false; }
    say(minionWords[(rnd() * 3) | 0], minions[0], minions[0].height + 0.6);
    const [x, z] = spot();
    A.look = () => minions[0].g.position;
    yield* goTo(x, z, { speed: 5.5, run: 1 });
    A.look = null;
    const m = free().sort((a, b) => a.pos.distanceTo(A.pos) - b.pos.distanceTo(A.pos))[0];
    if (!m) return;
    m.mode = 'bite'; m.attach = { obj: R.leg[0].knee, off: V(0, -0.45, 0.2) }; m.t = 0;
    say('CHOMP!', m, m.height + 0.3); A.wide = 1;
    say('OWW!', null, 1.4);
    // hopping on the other foot, shaking the leg
    A.osc = [['lfL', 0.35, 14], ['lkL', 0.25, 14, 1]];
    A.set(S(P.hopL, { lfR: 0, lkR: 0, lfL: 0.9, lkL: 1.6 }), 10);
    let t = 0; while (t < 3) { const dt = yield; t += dt; A.hop = Math.abs(Math.sin(t * 9)) * 0.4; A.yaw += dt * 1.6; }
    A.hop = 0; A.osc = [];
    fling(m, 1.2); say('Ha!', null, 1.4);
    yield* pose(P.stand, 0.4, 8);
    for (const o of minions) if (o.mode === 'chase') o.mode = 'idle';
  }
  function* armBite() {
    yield* turnTo(faceCam());
    const m = free()[0]; if (!m) return;
    m.mode = 'run'; m.target = V(A.pos.x + Math.sin(A.yaw + 0.8) * 2.2, 0, A.pos.z + Math.cos(A.yaw + 0.8) * 2.2);
    A.look = () => m.g.position; yield* pose(P.shoo, 1.2, 6);
    // it leaps up and clamps onto my arm
    m.mode = 'bite'; m.attach = { obj: R.arm[1].el, off: V(0, -0.45, 0.25), turn: 0 }; m.t = 0;
    say('Muak!', m, m.height + 0.3); A.look = null;
    yield* pose(P.armOut, 0.7, 8); say('Let go!', null, 1.4);
    // windmill the arm round until it flies off
    A.set(P.windmill, 10);
    let t = 0; while (t < 2.2) { const dt = yield; t += dt; A.force.afR = t * 9; A.wide = 1; }
    delete A.force.afR;
    fling(m, 1.6);
    yield* pose(P.dust, 1.0, 6);
  }
  function* pileOn() {
    yield* turnTo(faceCam());
    for (const m of free()) { m.mode = 'chase'; m.charge = false; }
    yield* pose(P.guard, 1.6, 6);
    say('Bring it!', null, 1.4);
    yield* wait(0.8);
    for (const m of minions) if (m.mode === 'chase') m.charge = true;
    say('Bee-do!', minions[1], minions[1].height + 0.6);
    yield* wait(0.6);
    // knocked flat; they pile on
    A.wide = 1; A.seat = 0.6; yield* pose(P.fallen, 0.6, 7);
    const offs = [V(0, 1.3, 0.55), V(0.45, 0.8, 0.55), V(-0.45, 0.9, 0.6), V(0, 2.0, 0.5), V(0.3, 0.4, 0.6), V(-0.3, 1.6, 0.55)];
    minions.filter(m => m.mode === 'chase').forEach((m, i) => { m.mode = 'pile'; m.attach = offs[i % offs.length]; m.t = 0; });
    dustAt = A.pos.clone().add(V(0, 1, 0)); dustT = 0;
    A.osc = [['aoL', 0.4, 8], ['aoR', 0.4, 8, 2], ['lfL', 0.3, 9], ['lfR', 0.3, 9, 1.5]];
    yield* wait(3);
    // I burst out and they go flying
    A.osc = []; A.seat = null; dustAt = null;
    yield* pose(P.burst, 0.15, 14);
    say('RAAAH!', null, 1.4);
    for (const m of minions) if (m.mode === 'pile') fling(m, 1.5);
    yield* wait(1.0);
    yield* pose(P.dust, 0.9, 6);
    yield* pose(S(P.laugh), 1.2, 6);
  }
  function* bananaTrick() {
    yield* turnTo(faceCam());
    banana.visible = true; bananaState = 'hand';
    yield* pose(P.banana, 0.8, 6);
    say('Banana?', null, 1.4);
    for (const m of free()) { m.mode = 'idle'; m.t = 0; }
    yield* wait(0.6);
    for (const m of minions) if (m.mode === 'idle') { m.mode = 'cheer'; say('BANANA!', m, m.height + 0.6); }
    yield* wait(1.4);
    // throw it across the field
    const tx = A.pos.x > 0 ? -xLim(-6) * 0.6 : xLim(-6) * 0.6, tz = -6;
    yield* pose(P.throw, 0.25, 12);
    bananaState = { from: handPt(1), to: V(tx, 0.15, tz), t: 0 };
    yield* pose(P.stand, 0.4, 6);
    for (const m of minions) if (m.mode === 'cheer' || m.mode === 'idle') { m.mode = 'run'; m.target = V(tx + (rnd() - 0.5), 0, tz + (rnd() - 0.5)); }
    A.look = () => banana.position;
    yield* wait(1.4);
    // the brawl
    dustAt = V(tx, 1, tz); dustT = 0;
    for (const m of minions) if (m.mode === 'run' || m.mode === 'idle') { m.mode = 'brawl'; m.pos.set(tx, 0, tz); }
    banana.visible = false; bananaState = null;
    yield* pose(P.laugh, 1.0, 5); A.osc = [['lean', 0.08, 10]];
    let t = 0; while (t < 3.2) { t += yield; if (rnd() < 0.04) say(minionWords[(rnd() * minionWords.length) | 0], { g: { position: dustAt } }, 1.4); }
    A.osc = [];
    dustAt = null;
    const brawlers = minions.filter(m => m.mode === 'brawl');
    brawlers.forEach((m, i) => { if (i === 0) { m.mode = 'eat'; m.t = 0; banana.visible = true; bananaState = 'minion'; m.yaw = Math.atan2(A.pos.x - tx, A.pos.z - tz); } else fling(m, 0.7); });
    A.look = null;
    yield* pose(P.dust, 1.2, 5);
    yield* wait(2);
    if (bananaState === 'minion') { banana.visible = false; bananaState = null; }
    for (const m of minions) if (m.mode === 'eat') { m.mode = 'idle'; say('Tank yu!', m, m.height + 0.6); }
  }
  function* catchBreath() {
    yield* turnTo(faceCam());
    yield* pose(P.tired, 2.2, 4);
    A.look = ATCAM; yield* pose(P.laugh, 1.2, 5); A.look = null;
    yield* pose(P.stand, 0.5);
  }
  const ACTS = { chase: [chaseAndBite, 3], arm: [armBite, 2], pile: [pileOn, 2], banana: [bananaTrick, 2] };
  function* life(first) {
    if (first) yield* first();
    if (minions.every(m => m.mode === 'hide')) yield* popOut();
    let last = '';
    for (;;) {
      const names = Object.keys(ACTS).filter(k => k !== last);
      let r = rnd() * names.reduce((s, k) => s + ACTS[k][1], 0), pick = names[0];
      for (const k of names) { r -= ACTS[k][1]; if (r <= 0) { pick = k; break; } }
      last = pick;
      yield* ACTS[pick][0]();
      while (minions.some(m => m.mode === 'fly' || m.mode === 'stun')) yield;     // let them get up again
      for (const m of minions) if (m.mode === 'idle') { const [x, z] = spot(); m.mode = 'run'; m.target = V(x, 0, z); }
      yield* catchBreath();
    }
  }
  const KEY = 'sp-field-state';
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify({ x: A.pos.x, z: A.pos.z, t: Date.now() })); } catch (e) { /* fine */ } }
  let restored = false;
  try { const st = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (st && Date.now() - st.t < 30 * 60 * 1000 && Math.abs(st.x) < xLim(st.z)) { A.pos.set(st.x, 0, st.z); A.yaw = faceCam(); restored = true; } } catch (e) { /* fine */ }
  if (restored) for (const m of minions) { const [x, z] = spot(); m.pos.set(x, 0, z); m.mode = 'idle'; }
  window.addEventListener('pagehide', save);
  let director = life(restored ? null : enter);

  /* ---------------------------------------------------------------- per frame */
  function step(dt) {
    clock += dt;
    try { director.next(dt); } catch (err) {
      console.error(err); A.seat = null; A.osc = []; A.force = {}; A.hop = 0; dustAt = null; banana.visible = false; bananaState = null;
      for (const m of minions) if (m.mode !== 'hide') { m.mode = 'idle'; m.spinX = 0; m.y = 0; m.attach = null; }
      director = life();
    }
    updateMe(dt);
    for (const m of minions) updateMinion(m, dt);
    // the banana
    if (bananaState === 'hand') { handPt(1, banana.position); banana.rotation.set(0, A.yaw, 0.5); }
    else if (bananaState === 'minion') { const m = minions.find(x => x.mode === 'eat'); if (m) { m.arms[0].el.localToWorld(banana.position.set(0, -0.45, 0.1)); banana.rotation.set(0, m.yaw, 1.2); } }
    else if (bananaState && bananaState.from) {
      const b = bananaState; b.t += dt / 1.1; const u = Math.min(1, b.t);
      banana.position.lerpVectors(b.from, b.to, u); banana.position.y += Math.sin(Math.PI * u) * 5; banana.rotation.z += dt * 12;
    }
    // speech bubbles
    for (const b of bubbles) {
      b.t += dt; b.s.visible = b.t < 1.4;
      if (!b.s.visible) continue;
      const base = b.who ? b.who.g.position : R.crown.getWorldPosition(tv);
      b.s.position.set(base.x, (b.who ? base.y : base.y) + b.dy + 0.3 * b.t, base.z);
      const k = Math.min(1, b.t * 8); b.s.scale.set(1.9 * k, 0.95 * k, 1); b.s.material.opacity = 1 - sm(1.0, 1.4, b.t);
    }
    // dust cloud
    dustT += dt;
    dust.forEach((d, i) => {
      d.s.visible = !!dustAt;
      if (!dustAt) return;
      const a = clock * 3 + i * 2.1 + d.ph;
      d.s.position.set(dustAt.x + Math.cos(a) * 1.1, dustAt.y + Math.sin(a * 1.3) * 0.6 + 0.4, dustAt.z + Math.sin(a) * 0.6);
      d.s.scale.setScalar(2.2 + 0.6 * Math.sin(clock * 7 + i)); d.s.material.opacity = Math.min(1, dustT * 3);
    });
    for (const c of clouds) { c.c.position.x += c.v * dt; if (c.c.position.x > 1100) c.c.position.x = -1100; }
    for (const f of flies) { f.s.position.set(f.p.x + Math.sin(clock * 0.7 + f.ph) * 1.5, f.p.y + Math.sin(clock * 1.3 + f.ph) * 0.4, f.p.z + Math.cos(clock * 0.5 + f.ph)); f.s.material.opacity = night ? 0.5 + 0.5 * Math.sin(clock * 3 + f.ph) : 0; }
    oak.rotation.z = 0.006 * Math.sin(clock * 0.8);
  }

  let raf = 0, last = 0, running = false, ready = false, slow = 0, night = false;
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    step(dt);
    renderer.render(scene, camera);
    if (!ready) { ready = true; opts.onReady && opts.onReady(); }
    slow = slow * 0.97 + (dt > 0.034 ? 1 : 0) * 0.03;
    if (slow > 0.6 && dpr > 1) { dpr = 1; renderer.setPixelRatio(1); resize(); slow = 0; }
    else if (slow > 0.8) { pause(); opts.onSlow && opts.onSlow(); }
  }
  function play() { if (running || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function pause() { running = false; cancelAnimationFrame(raf); }
  const onVis = () => (document.hidden ? pause() : play());
  document.addEventListener('visibilitychange', onVis);

  function setTheme(t) {
    night = t !== 'light';
    scene.fog.color.set(night ? 0x2a2440 : 0xeaf0f2);
    renderer.toneMappingExposure = night ? 0.9 : 1.0;
    skyMat.map = skyTexes[night ? 1 : 0]; skyMat.needsUpdate = true;
    hemi.color.set(night ? 0x9a8ad0 : 0xeaf4ff); hemi.groundColor.set(night ? 0x2a2420 : 0x6a7a40); hemi.intensity = night ? 0.8 : 1.2;
    sunL.color.set(night ? 0xffb07a : 0xfff2dc); sunL.intensity = night ? 1.3 : 2.3;
    for (const c of clouds) c.c.material.color.set(night ? 0xc08a9a : 0xffffff);
  }
  setTheme(opts.theme);
  play();

  return {
    setTheme,
    debug: { camera, scene, renderer, step, A, R, minions, run: name => { director = life(name === 'enter' ? enter : name === 'idle' ? function* () { for (;;) yield; } : ACTS[name][0]); } },
    stop() {
      pause(); save();
      window.removeEventListener('pagehide', save);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      renderer.dispose();
    },
  };
}

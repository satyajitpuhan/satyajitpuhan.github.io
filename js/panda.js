/* =============================================================================
   panda.js — a kung fu panda and his master living behind the content, on the hill
   of the peach tree above a valley of misty karst mountains.

   Loaded on demand by site.js (section 16) when the visitor picks the panda. Like
   dragon.js, everything is built here in code — characters, scenery, props — so the
   only download is three.js itself (self-hosted in ./vendor).

   What happens: the panda first peeks in from the side of the screen to check that
   nobody is watching (move the mouse or scroll while he is looking and he ducks
   back out), then tiptoes in. After that he wanders about with his staff and, now
   and then, practises a staff form, shakes a peach out of the tree and eats it,
   trains with his master, duels him for the last dumpling with chopsticks, or naps
   under the tree.

   The characters are simple rigs (pelvis, torso, head, two-bone arms and legs).
   Poses are sets of joint angles; each frame the joints ease towards the current
   target pose, a walk cycle is layered on top, and the body is lowered until the
   lower foot touches the ground. The behaviours are generator functions: each
   `yield` waits one frame and receives the frame time.

   export start(canvas, { theme, onReady, onSlow }) → { stop(), setTheme(theme) }
   ========================================================================== */
import * as THREE from './vendor/three.module.min.js';

const TAU = Math.PI * 2;
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
// seeded, so the scenery is the same on every page; behaviour uses Math.random
const rand = (seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(20261005);
const rnd = Math.random;
const nz = (x, y, z) => Math.sin(x * 1.7 + y * 3.1 + z * 2.3) * 0.5 + Math.sin(x * 3.9 - y * 2.2 + z * 1.3) * 0.3 + Math.sin(-x * 5.3 + y * 4.7 + z * 6.1) * 0.2;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = h => new THREE.Color(h);
const mix = (a, b, t) => a.clone().lerp(b, clamp(t, 0, 1));

/* ---------------------------------------------------------------- textures */

function canvasTex(w, h, draw, colour = true) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  if (colour) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const radial = stops => canvasTex(128, 128, (c, w) => {
  const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  c.fillStyle = g; c.fillRect(0, 0, w, w);
});
// short strokes of fur for the bump map
const furBump = canvasTex(256, 256, (c, S) => {
  c.fillStyle = '#808080'; c.fillRect(0, 0, S, S);
  for (let i = 0; i < 3200; i++) {
    const x = rand() * S, y = rand() * S, l = 3 + rand() * 7, a = Math.PI / 2 + (rand() - 0.5) * 0.9, v = 70 + rand() * 140 | 0;
    c.strokeStyle = `rgba(${v},${v},${v},.6)`; c.lineWidth = 0.8 + rand() * 1.2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
}, false);
furBump.wrapS = furBump.wrapT = THREE.RepeatWrapping; furBump.repeat.set(3, 3);
// soft cloud blobs for the mist banks
const mistTex = canvasTex(256, 256, (c, S) => {
  for (let i = 0; i < 46; i++) {
    const r = S * (0.08 + rand() * 0.14), x = S * 0.24 + rand() * S * 0.52, y = S * 0.42 + (rand() - 0.5) * S * 0.16;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,.34)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, S, S);
  }
});

/* ---------------------------------------------------------------- geometry helpers */

// Deform a unit sphere with f(x,y,z) → [X,Y,Z]; optional vertex colours from colour(x,y,z).
function sculpt(f, colour, ws = 40, hs = 28) {
  const g = new THREE.SphereGeometry(1, ws, hs), p = g.attributes.position, cols = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (colour) { const c = colour(x, y, z); cols.push(c.r, c.g, c.b); }
    const r = f(x, y, z); p.setXYZ(i, r[0], r[1], r[2]);
  }
  if (colour) g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.computeVertexNormals();
  return g;
}

// A tube whose radius follows rad(u) along a curve; optional vertex colours by u.
function taperedTube(points, segs, rad, colour, radial = 8) {
  const curve = new THREE.CatmullRomCurve3(points);
  const g = new THREE.TubeGeometry(curve, segs, 1, radial, false), p = g.attributes.position, cols = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs, c = curve.getPointAt(u), r = rad(u);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      p.setXYZ(k, c.x + (p.getX(k) - c.x) * r, c.y + (p.getY(k) - c.y) * r, c.z + (p.getZ(k) - c.z) * r);
      if (colour) { const col = colour(u, j); cols.push(col.r, col.g, col.b); }
    }
  }
  if (colour) g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.computeVertexNormals();
  return g;
}

function merge(geos) {
  const list = geos.map(g => (g.index ? g.toNonIndexed() : g));
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const [name, size] of [['position', 3], ['normal', 3], ['color', 3]]) {
    const arr = new Float32Array(n * size); let o = 0;
    for (const g of list) { arr.set(g.attributes[name].array, o); o += g.attributes[name].array.length; }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  return out;
}

const SPH = new THREE.SphereGeometry(1, 28, 20);
function mesh(geo, mat, parent, pos, scale) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (scale !== undefined) (typeof scale === 'number' ? m.scale.setScalar(scale) : m.scale.set(scale[0], scale[1], scale[2]));
  if (parent) parent.add(m);
  return m;
}
const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 14);

/* ---------------------------------------------------------------- rigs */

// pelvis → torso → neck → head; arms on the torso, legs on the pelvis. index 0 = left (+x).
function makeRig(d) {
  const root = new THREE.Group(), pelvis = new THREE.Group(), torso = new THREE.Group(), neck = new THREE.Group(), head = new THREE.Group();
  root.add(pelvis); pelvis.add(torso); torso.add(neck); neck.add(head);
  pelvis.position.y = d.hipH; neck.position.set(0, d.neckY, d.neckZ || 0);
  neck.rotation.order = head.rotation.order = 'YXZ';
  const arm = [], leg = [];
  for (const s of [1, -1]) {
    const sh = new THREE.Group(), el = new THREE.Group(), hand = new THREE.Group();
    sh.position.set(s * d.shW, d.shY, 0); torso.add(sh); sh.add(el); el.add(hand);
    el.position.y = -d.upper; hand.position.y = -d.fore; sh.rotation.order = 'XZY';
    arm.push({ sh, el, hand, s });
    const hip = new THREE.Group(), knee = new THREE.Group(), ankle = new THREE.Group();
    hip.position.set(s * d.hipW, 0, 0); pelvis.add(hip); hip.add(knee); knee.add(ankle);
    knee.position.y = -d.thigh; ankle.position.y = -d.shin; hip.rotation.order = 'XZY';
    leg.push({ hip, knee, ankle, s });
  }
  return { root, pelvis, torso, neck, head, arm, leg, d, eyes: [] };
}

// An eye that can look around and blink: a white ball with iris, pupil and a glint.
function addEye(parent, at, r, irisHex, M) {
  const base = new THREE.Group(); base.position.copy(at); parent.add(base);
  base.lookAt(base.getWorldPosition(V()).add(V(0, 0, 1)));
  const ball = new THREE.Group(); base.add(ball);
  mesh(SPH, M.eyeWhite, ball, [0, 0, 0], r);
  mesh(SPH, new THREE.MeshStandardMaterial({ color: irisHex, roughness: 0.25 }), ball, [0, 0, r * 0.74], [r * 0.66, r * 0.66, r * 0.34]);
  mesh(SPH, M.pupil, ball, [0, 0, r * 0.92], [r * 0.34, r * 0.36, r * 0.18]);
  mesh(SPH, M.glint, ball, [r * 0.25, r * 0.3, r * 0.98], r * 0.15);
  return { base, ball };
}

// a drop: round at the top, tapering to a point at the bottom (-y)
const teardrop = sculpt((x, y, z) => { const w = 1 - 0.4 * sm(0.2, -1, y); return [x * w, y * (y < 0 ? 1.05 : 0.9), z * w]; }, null, 24, 18);

function buildPo(M) {
  const R = makeRig({ hipH: 1.26, hipW: 0.66, neckY: 2.62, neckZ: 0.05, shY: 2.28, shW: 1.28, upper: 0.82, fore: 0.7, thigh: 0.5, shin: 0.5, ankleH: 0.26 });
  const white = C(0xf3efe6), black = C(0x1e1b1f), khaki = C(0xc8a46c), band = C(0xa07c4a);
  // belly: pear-shaped, white front, black shoulders and back, shorts at the bottom
  R.belly = new THREE.Group(); R.belly.position.y = 1.2; R.torso.add(R.belly);
  mesh(sculpt((x, y, z) => {
    const w = 1 + 0.13 * -y;
    let Z = z * 1.34 * w;
    if (z > 0) Z += 0.3 * z * Math.exp(-(((y + 0.12) / 0.55) ** 2));
    return [x * 1.56 * w, y * 1.72, Z];
  }, (x, y, z) => {
    if (y < -0.4) return khaki;
    if (y < -0.3) return band;
    return mix(white, black, sm(0.24, 0.3, y) * Math.max(sm(0.44, 0.52, Math.abs(x)), sm(-0.05, -0.15, z)));
  }, 48, 32), M.furV, R.belly);
  // head
  const fHead = (x, y, z) => {
    const muz = Math.exp(-((x / 0.42) ** 2 + ((y + 0.3) / 0.3) ** 2)) * Math.max(0, z);
    return [x * 1.2 * (1 + 0.07 * Math.exp(-(((y + 0.25) / 0.4) ** 2))), y * 1.02 - 0.06 * muz, z * 1.04 + 0.32 * muz];
  };
  const H = R.headMesh = mesh(sculpt(fHead, null, 48, 32), M.white, R.head, [0, 0.86, 0.1]);
  H.updateWorldMatrix(true, false);
  const on = (x, y, z) => { const d = V(x, y, z).normalize(); const [X, Y, Z] = fHead(d.x, d.y, d.z); return V(X, Y, Z); };
  for (const s of [1, -1]) {
    const ear = mesh(SPH, M.black, H, null, [0.36, 0.34, 0.2]);
    ear.position.copy(on(s * 0.62, 0.74, -0.08)).multiplyScalar(1.02); ear.rotation.set(-0.1, 0, -s * 0.38);
    const p = on(s * 0.38, 0.12, 0.9), n = p.clone().normalize();
    // eye patch: a teardrop drooping outwards, laid on the face
    const patch = mesh(teardrop, M.black, H, null, [0.3, 0.4, 0.13]);
    patch.position.copy(p).addScaledVector(n, -0.035);
    const up = V(-s * Math.sin(0.5), Math.cos(0.5), 0); up.addScaledVector(n, -up.dot(n)).normalize();
    patch.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V().crossVectors(up, n), up, n));
    R.eyes.push(addEye(H, on(s * 0.35, 0.17, 0.92).addScaledVector(n, 0.045), 0.155, 0x5aa83c, M));
  }
  mesh(SPH, M.nose, H, null, [0.2, 0.13, 0.14]).position.copy(on(0, -0.12, 1)).add(V(0, 0, 0.02));
  R.mouth = mesh(SPH, M.mouth, H, null, [0.22, 0.03, 0.1]); R.mouth.position.copy(on(0, -0.44, 0.9)).add(V(0, 0.02, -0.03));
  const smile = mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 18, Math.PI), M.black, H);
  smile.position.copy(R.mouth.position).add(V(0, 0.08, 0.02)); smile.rotation.z = Math.PI;
  R.mouthPt = new THREE.Object3D(); R.mouthPt.position.copy(R.mouth.position).add(V(0, 0, 0.12)); H.add(R.mouthPt);
  R.crown = new THREE.Object3D(); R.crown.position.set(0, 1.05, 0.1); H.add(R.crown);
  // arms and legs
  for (const a of R.arm) {
    mesh(capsule(0.4, 0.45), M.black, a.sh, [0, -0.36, 0]);
    mesh(capsule(0.34, 0.4), M.black, a.el, [0, -0.34, 0]);
    mesh(SPH, M.black, a.hand, [0, -0.05, 0], [0.36, 0.31, 0.39]);
  }
  for (const l of R.leg) {
    mesh(new THREE.CylinderGeometry(0.5, 0.57, 0.62, 18), M.khaki, l.hip, [0, -0.22, 0]);
    mesh(new THREE.TorusGeometry(0.53, 0.07, 8, 22), M.trim, l.hip, [0, -0.52, 0]).rotation.x = Math.PI / 2;
    mesh(capsule(0.42, 0.22), M.black, l.knee, [0, -0.22, 0]);
    mesh(SPH, M.black, l.ankle, [0, -0.02, 0.2], [0.42, 0.24, 0.58]);
  }
  return R;
}

function buildShifu(M) {
  const R = makeRig({ hipH: 0.82, hipW: 0.2, neckY: 1.12, neckZ: 0.02, shY: 0.95, shW: 0.47, upper: 0.4, fore: 0.36, thigh: 0.36, shin: 0.34, ankleH: 0.12 });
  const robe = C(0xb2804f), dark = C(0x3a2016), trim = C(0x6a4428), belt = C(0x3b2a1d);
  R.belly = new THREE.Group(); R.belly.position.y = 0.55; R.torso.add(R.belly);
  mesh(sculpt((x, y, z) => [x * 0.5 * (1 + 0.1 * -y), y * 0.64, z * 0.42 * (1 + 0.1 * -y)], (x, y, z) => {
    if (y < -0.45 && y > -0.68) return belt;
    const v = Math.abs(x) - (y - 0.05) * 0.6;
    if (z > 0.2 && y > 0.05) { if (v < 0) return dark; if (v < 0.09) return trim; }
    return robe;
  }, 36, 24), M.furV, R.belly);
  // head: orange-red with white muzzle, cheeks and brows, dark tear marks
  const orange = C(0xc45a2a), cream = C(0xf2e6cf), tear = C(0x5a2414);
  const fHead = (x, y, z) => {
    const muz = Math.exp(-((x / 0.3) ** 2 + ((y + 0.26) / 0.22) ** 2)) * Math.max(0, z);
    return [x * 0.5, y * 0.46 - 0.03 * muz, z * 0.46 + 0.24 * muz];
  };
  const H = R.headMesh = mesh(sculpt(fHead, (x, y, z) => {
    const ax = Math.abs(x);
    let w = Math.max(
      sm(0.45, 0.65, z) * sm(0.02, -0.12, y) * sm(0.5, 0.35, ax),                         // muzzle
      sm(0.62, 0.78, ax) * sm(0.02, -0.12, y) * sm(0.05, 0.35, z),                         // cheeks
      sm(0.55, 0.7, z) * sm(0.28, 0.36, y) * sm(0.58, 0.5, y) * sm(0.12, 0.2, ax) * sm(0.5, 0.42, ax)); // brows
    const t = sm(0.55, 0.7, z) * sm(0.1, 0.0, y) * sm(-0.42, -0.3, y) * Math.exp(-(((ax - 0.36) / 0.07) ** 2));
    return mix(mix(orange, cream, w), tear, t * 0.9);
  }, 40, 28), M.furV, R.head, [0, 0.46, 0.05]);
  H.scale.setScalar(1.18);
  const on = (x, y, z) => { const d = V(x, y, z).normalize(); const [X, Y, Z] = fHead(d.x, d.y, d.z); return V(X, Y, Z); };
  const earGeo = new THREE.ConeGeometry(0.3, 0.58, 14);
  for (const s of [1, -1]) {
    const ear = mesh(earGeo, M.cream, H, null, [1, 1, 0.38]);
    ear.position.copy(on(s * 0.55, 0.78, -0.1)).add(V(0, 0.12, 0)); ear.rotation.z = -s * 0.6;
    mesh(earGeo, M.earIn, ear, [0, -0.04, 0.12], [0.66, 0.74, 0.6]);
    const p = on(s * 0.3, 0.14, 0.92), n = p.clone().normalize();
    R.eyes.push(addEye(H, p.clone().addScaledVector(n, 0.02), 0.075, 0x4a8fd8, M));
    const b = on(s * 0.24, 0.34, 0.9);
    mesh(taperedTube([b, b.clone().add(V(s * 0.22, 0.07, -0.02)), b.clone().add(V(s * 0.5, 0.06, -0.22)), b.clone().add(V(s * 0.68, -0.06, -0.46))], 16, u => 0.035 * (1 - 0.7 * u), null, 5), M.cream, H);
    for (const k of [0, 1]) {
      const w = on(s * 0.13, -0.3 - k * 0.06, 0.95);
      mesh(taperedTube([w, w.clone().add(V(s * 0.22, -0.06 - k * 0.04, 0.05)), w.clone().add(V(s * 0.4, -0.36, 0.02)), w.clone().add(V(s * (0.44 - k * 0.1), -0.8 + k * 0.2, -0.06)), w.clone().add(V(s * (0.38 - k * 0.08), -1.12 + k * 0.3, -0.12))], 24, u => 0.022 * (1 - 0.7 * u), null, 5), M.cream, H);
    }
  }
  mesh(SPH, M.nose, H, null, [0.085, 0.06, 0.06]).position.copy(on(0, -0.2, 1)).add(V(0, 0, 0.01));
  R.mouth = mesh(SPH, M.mouth, H, null, [0.08, 0.012, 0.04]); R.mouth.position.copy(on(0, -0.42, 0.9));
  R.mouthPt = new THREE.Object3D(); R.mouthPt.position.copy(R.mouth.position).add(V(0, 0, 0.06)); H.add(R.mouthPt);
  R.crown = new THREE.Object3D(); R.crown.position.set(0, 0.5, 0); H.add(R.crown);
  for (const a of R.arm) {
    mesh(capsule(0.15, 0.24), M.robe, a.sh, [0, -0.2, 0]);
    mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.16, 12), M.robe, a.el, [0, -0.04, 0]);
    mesh(capsule(0.095, 0.24), M.darkFur, a.el, [0, -0.18, 0]);
    mesh(SPH, M.darkFur, a.hand, [0, -0.03, 0], [0.1, 0.09, 0.11]);
  }
  for (const l of R.leg) {
    mesh(capsule(0.17, 0.22), M.pants, l.hip, [0, -0.18, 0]);
    mesh(capsule(0.14, 0.2), M.pants, l.knee, [0, -0.17, 0]);
    mesh(SPH, M.darkFur, l.ankle, [0, -0.04, 0.07], [0.13, 0.08, 0.2]);
  }
  // ringed tail
  const ring = C(0xc8582a), ringD = C(0x4a2412);
  R.tail = new THREE.Group(); R.tail.position.set(0, 0.05, -0.32); R.pelvis.add(R.tail);
  mesh(taperedTube([V(0, 0, 0), V(0, -0.3, -0.35), V(0, -0.5, -0.85), V(0, -0.38, -1.35), V(0, 0.02, -1.62), V(0, 0.4, -1.55)], 40,
    u => 0.12 + 0.07 * Math.sin(Math.PI * Math.min(1, u * 1.4)) - 0.08 * sm(0.75, 1, u),
    u => (Math.floor(u * 9) % 2 ? ringD : ring), 10), M.furV, R.tail);
  return R;
}

/* ---------------------------------------------------------------- props */

function buildStaff(M) {
  const wood = u => mix(C(0x5a3b22), C(0x8b6640), 0.5 + 0.5 * Math.sin(u * 47));
  const holder = new THREE.Group(), spinner = new THREE.Group(), off = new THREE.Group();
  holder.add(spinner); spinner.add(off);
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(V(0.06 * Math.sin(t * 9), -1.9 + t * 5.55, 0.05 * Math.cos(t * 7.3))); }
  mesh(taperedTube(pts, 48, u => 0.075 + 0.03 * Math.sin(u * 31) ** 2 + 0.03 * sm(0.85, 1, u), wood), M.wood, off);
  const top = pts[12];
  mesh(taperedTube([top, top.clone().add(V(-0.25, 0.38, 0)), top.clone().add(V(-0.42, 0.78, 0.02)), top.clone().add(V(-0.3, 1.08, 0)), top.clone().add(V(-0.06, 1.02, 0))], 24, u => 0.085 * (1 - 0.7 * u), wood), M.wood, off);
  mesh(taperedTube([top, top.clone().add(V(0.22, 0.35, 0)), top.clone().add(V(0.38, 0.7, 0.01)), top.clone().add(V(0.43, 0.95, 0))], 18, u => 0.075 * (1 - 0.65 * u), wood), M.wood, off);
  for (const y of [-0.8, 0.9, 2.4]) mesh(SPH, M.knot, off, [0.06, y, 0.04], [0.11, 0.07, 0.11]);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, 'rgba(255,236,160,1)'], [0.25, 'rgba(255,190,70,.75)'], [1, 'rgba(255,160,40,0)']]), transparent: true, depthWrite: false, opacity: 0 }));
  glow.position.set(0, 4.25, 0); glow.scale.setScalar(3.2); off.add(glow);
  return { holder, spinner, off, glow, mode: null, angle: 0, spinV: 0, spinT: 0 };
}

function buildChopsticks(len, mat) {
  const g = new THREE.Group(), geo = new THREE.CylinderGeometry(0.018, 0.03, len, 6);
  geo.rotateX(Math.PI / 2); geo.translate(0, 0, len / 2);
  for (const s of [-1, 1]) { const m = mesh(geo, mat, g, [s * 0.04, 0, 0]); m.rotation.y = -s * 0.035; }
  g.tip = new THREE.Object3D(); g.tip.position.z = len; g.add(g.tip);
  g.visible = false; g.scale.setScalar(0.001);
  return g;
}

const dumplingGeo = sculpt((x, y, z) => {
  const a = Math.atan2(z, x);
  const Y = y < 0 ? y * 0.11 : y * 0.26 + 0.025 * Math.sin(a * 9) * sm(0.35, 0.95, y);
  return [x * 0.3 * (1 + 0.04 * Math.sin(a * 9) * Math.max(0, y)), Y, z * 0.3];
}, null, 24, 16);

function peachGeo() {
  return sculpt((x, y, z) => [x * 0.36 * (1 - 0.1 * Math.exp(-((x / 0.18) ** 2)) * Math.max(0, z)), y * 0.38 + 0.06 * Math.max(0, y) ** 3, z * 0.34], (x, y) => mix(C(0xf7c27e), C(0xe4566a), sm(-0.6, 0.6, y + x * 0.4)), 24, 18);
}

/* ---------------------------------------------------------------- poses */

const KEYS = ['lean', 'twist', 'side', 'hy', 'hp', 'hr', 'pp', 'pr', 'jaw'];
for (const k of ['L', 'R']) for (const n of ['af', 'ao', 'at', 'ae', 'lf', 'lo', 'lk', 'la']) KEYS.push(n + k);
const blank = () => Object.fromEntries(KEYS.map(k => [k, 0]));
const mirror = p => {
  const o = {};
  for (const [k, v] of Object.entries(p)) {
    const e = k.slice(-1);
    if (e === 'L' || e === 'R') o[k.slice(0, -1) + (e === 'L' ? 'R' : 'L')] = v;
    else o[k] = ['twist', 'side', 'hy', 'hr', 'pr'].includes(k) ? -v : v;
  }
  return o;
};
// joint angles in radians: af arm forward, ao arm out, ae elbow, lf leg forward, lo leg out, lk knee, la ankle
const P = {
  stand: {},
  salute: { lean: 0.34, hp: 0.28, afL: 1.25, aoL: -0.62, aeL: 1.05, afR: 1.25, aoR: -0.62, aeR: 1.2 },
  crouch: { lfL: 0.7, lkL: 1.3, lfR: 0.7, lkR: 1.3, lean: 0.35, afL: 0.6, afR: 0.6, aeL: 0.8, aeR: 0.8 },
  tuck: { lfL: 1.3, lkL: 2.0, lfR: 1.3, lkR: 2.0, lean: 0.4, afL: 0.9, aeL: 1.4, afR: 0.9, aeR: 1.4, hp: 0.3 },
  horse: { lfL: 0.45, loL: 0.6, lkL: 1.05, lfR: 0.45, loR: 0.6, lkR: 1.05, afL: 0.4, aeL: 2.0, afR: 0.4, aeR: 2.0, lean: 0.05 },
  crane: { lfL: 1.15, lkL: 1.8, loL: 0.15, aoL: 1.4, afL: 0.3, aoR: 1.4, afR: 0.3, aeL: 0.25, aeR: 0.25, hp: -0.18, lean: -0.05 },
  guard: { lfL: 0.35, lkL: 0.5, lfR: -0.25, lkR: 0.3, afL: 1.0, aeL: 1.7, afR: 0.7, aeR: 1.9, twist: 0.25, lean: 0.12 },
  punchR: { lfL: 0.45, lkL: 0.55, lfR: -0.35, lkR: 0.2, afR: 1.55, aeR: 0.05, aoR: -0.3, afL: 0.55, aeL: 2.0, twist: -0.45, lean: 0.18 },
  kickR: { lfR: 1.5, lkR: 0.1, laR: 0.4, lfL: 0.1, lkL: 0.35, afL: 1.0, aeL: 1.8, afR: 0.8, aeR: 1.8, lean: -0.28 },
  palm: { lfL: 0.55, lkL: 0.65, lfR: -0.5, lkR: 0.1, afR: 1.5, aeR: 0.1, aoR: -0.15, afL: 0.4, aeL: 1.7, lean: 0.32, twist: -0.3 },
  bellyOut: { lean: -0.42, afL: -0.5, aoL: 0.55, afR: -0.5, aoR: 0.55, hp: -0.3, lfL: 0.15, lfR: 0.15, lkL: 0.3, lkR: 0.3, jaw: 0.3 },
  sit: { lfL: 1.45, loL: 0.3, lkL: 0.15, laL: -1.1, lfR: 1.45, loR: 0.3, lkR: 0.15, laR: -1.1, lean: 0.14, afL: 0.5, aeL: 0.45, afR: 0.5, aeR: 0.45 },
  sitCross: { lfL: 1.25, loL: 0.95, lkL: 2.3, lfR: 1.25, loR: 0.95, lkR: 2.3, lean: 0.06, afL: 0.7, aeL: 0.9, afR: 0.7, aeR: 0.9 },
  stretch: { afL: 2.95, aoL: 0.35, aeL: 0.3, afR: 2.95, aoR: 0.35, aeR: 0.3, lean: -0.2, hp: -0.45, jaw: 1 },
  sneak: { afL: 1.05, aeL: 1.45, aoL: -0.15, afR: 1.05, aeR: 1.45, aoR: -0.15, lean: 0.24, hp: -0.1 },
  startled: { afL: 1.1, aoL: 0.7, aeL: 1.5, afR: 1.1, aoR: 0.7, aeR: 1.5, lean: -0.15, hp: -0.15, jaw: 0.6 },
  catchUp: { afL: 1.45, aeL: 0.7, aoL: -0.45, afR: 1.45, aeR: 0.7, aoR: -0.45, hp: 0.05, lean: -0.05 },
  holdMouth: { afL: 1.2, aeL: 1.75, aoL: -0.55, afR: 1.2, aeR: 1.75, aoR: -0.55, hp: 0.12 },
  pat: { afL: 0.55, aeL: 1.0, aoL: -0.35, afR: 0.5, aeR: 1.1, aoR: -0.3, lean: -0.12, hp: -0.1 },
  poke: { afR: 2.75, aeR: 0.15, aoR: 0.2, hp: -0.65, lean: -0.15, afL: 0.4, aeL: 1.0 },
  stick: { afR: 0.32, aeR: 0.55, aoR: 0.06 },
  reachBack: { afR: 2.6, aeR: 2.0, aoR: 0.2, hy: -0.2 },
  reachDown: { afR: 0.25, aoR: 0.5, aeR: 0.2, side: 0.12 },
  spin: { afR: 1.15, aeR: 0.55, aoR: -0.05, afL: 0.9, aeL: 1.8, lfL: 0.3, lkL: 0.45, lfR: -0.2, lkR: 0.2, lean: 0.1 },
  overhead: { afR: 2.95, aeR: 0.2, aoR: 0.1, afL: 0.8, aeL: 1.9, hp: -0.25, lfL: 0.3, lkL: 0.5, lfR: -0.25 },
  strike: { lfL: 0.75, lkL: 0.95, lfR: -0.55, lkR: 0.15, afR: 1.45, aeR: 0.05, afL: 1.25, aeL: 0.9, aoL: -0.5, lean: 0.3, twist: -0.2 },
  plant: { afL: 1.05, aoL: -0.55, aeL: 0.55, afR: 1.0, aoR: -0.5, aeR: 0.6, lean: 0.1, lfL: 0.3, loL: 0.45, lkL: 0.65, lfR: 0.3, loR: 0.45, lkR: 0.65, hp: -0.15 },
  reach: { afR: 1.0, aeR: 0.55, aoR: -0.2, lean: 0.25, hp: 0.35 },
  chopUp: { afR: 2.3, aeR: 0.5, aoR: -0.1, hp: -0.55, lean: -0.05 },
  eatChop: { afR: 1.05, aeR: 2.0, aoR: -0.3, hp: 0.05 },
  victory: { afR: 2.7, aeR: 0.35, aoR: 0.2, hp: -0.25, jaw: 0.35 },
  nap: { hp: 0.55, hr: 0.25, lean: 0.25, afL: 0.35, aeL: 0.35, afR: 0.35, aeR: 0.35 },
  wave: { afL: 0.4, aoL: 2.2, aeL: 1.0, hp: -0.05, jaw: 0.3 },
  scratch: { afL: 2.3, aoL: 0.85, aeL: 2.3, hr: -0.15, hy: 0.2 },
};
P.punchL = mirror(P.punchR);
const S = (...ps) => Object.assign({}, ...ps);

/* ---------------------------------------------------------------- scenery */

function buildScenery(scene, M, small) {
  const g = new THREE.Group(); scene.add(g);
  // the hill: grass that falls away as a cliff into the valley, fading out towards the viewer
  const hill = new THREE.PlaneGeometry(180, 82, 90, 41); hill.rotateX(-Math.PI / 2); hill.translate(0, 0, -14);
  {
    const p = hill.attributes.position, cols = [];
    const g1 = C(0x7f9d4d), g2 = C(0xa3bb68), g3 = C(0x67863f), rock = C(0x8a8170);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), n = nz(x * 0.13, 0.3, z * 0.13);
      const edge = -20 + 2.4 * Math.sin(x * 0.11) + 1.3 * Math.sin(x * 0.27 + 1), drop = sm(edge, edge - 9, z);
      p.setY(i, -drop * 44 + (1 - drop) * 0.3 * nz(x * 0.25, 0, z * 0.25) + drop * 3 * nz(x * 0.5, z * 0.3, 1));
      const c = mix(mix(g1, g2, n * 0.5 + 0.5), g3, sm(0.2, 0.9, nz(x * 0.31, 2, z * 0.27)) * 0.6);
      const k = mix(c, rock, sm(0.02, 0.25, drop));
      cols.push(k.r, k.g, k.b, 1 - sm(5, 15, z));
    }
    hill.setAttribute('color', new THREE.Float32BufferAttribute(cols, 4));
    hill.computeVertexNormals();
  }
  const ground = mesh(hill, new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, roughness: 1 }), g);
  ground.renderOrder = -2;
  // grass tufts and stones on the hill
  {
    const n = small ? 160 : 320, geo = new THREE.ConeGeometry(0.1, 0.55, 4, 1); geo.translate(0, 0.27, 0);
    const tufts = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 1 }), n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < n; i++) {
      const x = (rand() * 2 - 1) * 55, z = -18 + rand() * 24;
      q.setFromEuler(e.set((rand() - 0.5) * 0.5, rand() * 3, (rand() - 0.5) * 0.5));
      m4.compose(V(x, 0, z), q, V(1, 0.6 + rand() * 0.9, 1)); tufts.setMatrixAt(i, m4);
      tufts.setColorAt(i, mix(C(0x5d7d35), C(0x9fb85c), rand()));
    }
    g.add(tufts);
    const stoneGeo = new THREE.DodecahedronGeometry(1, 0);
    for (let i = 0; i < 9; i++) {
      const s = mesh(stoneGeo, M.stone, g, [(rand() * 2 - 1) * 40, 0, -19 + rand() * 14], [0.6 + rand() * 1.2, 0.35 + rand() * 0.4, 0.6 + rand()]);
      s.rotation.y = rand() * 3;
    }
  }
  // valley floor far below
  const far = (o) => new THREE.MeshStandardMaterial({ transparent: true, roughness: 1, ...o });   // drawn after the hill, so its faded edge hides them
  mesh(new THREE.PlaneGeometry(1200, 420).rotateX(-Math.PI / 2), far({ color: 0x6f8c5c }), g, [0, -44, -230]);
  // karst mountains in four layers, merged into one mesh
  const geos = [], peaks = [];
  const layers = [[-78, -100, 9, 34, 54], [-120, -160, 12, 44, 70], [-185, -235, 14, 52, 82], [-260, -320, 16, 60, 92]];
  const rockA = C(0x7e837a), rockB = C(0xa3a69a), green = C(0x45663a), green2 = C(0x6f8c4c);
  layers.forEach(([z0, z1, n, h0, h1], L) => {
    const spread = -z1 * 0.95;
    for (let i = 0; i < n; i++) {
      const h = h0 + rand() * (h1 - h0), r = h * (0.2 + rand() * 0.13), seed = rand() * 50;
      const x = ((i + rand() * 0.8) / n * 2 - 1) * spread, z = z0 + rand() * (z1 - z0);
      const prof = [];
      for (let k = 0; k <= 26; k++) { const t = k / 26; prof.push(new THREE.Vector2(Math.max(0.01, r * Math.pow(1 - Math.pow(t, 2.4), 0.55) * (1 + 0.12 * Math.sin(t * 9 + seed))), t * h)); }
      const geo = new THREE.LatheGeometry(prof, 26), p = geo.attributes.position, cols = [];
      for (let k = 0; k < p.count; k++) {
        const X = p.getX(k), Y = p.getY(k), Z = p.getZ(k), a = Math.atan2(Z, X), t = Y / h;
        const n1 = nz(X * 0.12 + seed, Y * 0.07, Z * 0.12), f = 1 + 0.16 * n1 + 0.09 * Math.sin(a * 3 + seed + Y * 0.05);
        p.setXYZ(k, X * f, Y, Z * f * 0.8);
        const veg = clamp(0.4 + 0.55 * nz(X * 0.2, Y * 0.15 + seed, Z * 0.2) + 0.3 * t, 0, 1) * sm(0.04, 0.25, t);
        const c = mix(mix(rockA, rockB, n1 * 0.5 + 0.5), mix(green, green2, n1 + 0.5), veg * (0.9 - L * 0.12));
        cols.push(c.r, c.g, c.b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      geo.computeVertexNormals(); geo.translate(x, -44, z);
      geos.push(geo); peaks.push({ x, z, h, L });
    }
  });
  mesh(merge(geos), far({ vertexColors: true }), g);
  // the palace on the tallest peak of the second layer, near the middle
  {
    const host = peaks.filter(p => p.L === 1 && Math.abs(p.x) < 70).sort((a, b) => b.h - a.h)[0];
    const pal = new THREE.Group(); pal.position.set(host.x, -44 + host.h - 1.6, host.z); pal.scale.setScalar(1.7); g.add(pal);
    const red = new THREE.MeshStandardMaterial({ color: 0x9a2c1c, roughness: 0.7 }), roof = new THREE.MeshStandardMaterial({ color: 0x2f6a5a, roughness: 0.55 }), gold = new THREE.MeshStandardMaterial({ color: 0xd2a447, roughness: 0.4, metalness: 0.4 });
    mesh(new THREE.BoxGeometry(6.4, 0.7, 4.4), M.stone, pal, [0, 0.35, 0]);
    mesh(new THREE.BoxGeometry(4.6, 1.7, 2.8), red, pal, [0, 1.55, 0]);
    const r1 = mesh(new THREE.ConeGeometry(4.1, 1.4, 4, 1), roof, pal, [0, 3.05, 0], [1, 1, 0.7]); r1.rotation.y = Math.PI / 4;
    mesh(new THREE.BoxGeometry(2.6, 1.0, 1.7), red, pal, [0, 3.95, 0]);
    const r2 = mesh(new THREE.ConeGeometry(2.6, 1.1, 4, 1), roof, pal, [0, 4.95, 0], [1, 1, 0.7]); r2.rotation.y = Math.PI / 4;
    mesh(new THREE.ConeGeometry(0.18, 1.1, 8), gold, pal, [0, 5.9, 0]);
  }
  // mist banks between the layers
  const mists = [];
  const mistMat = new THREE.MeshBasicMaterial({ map: mistTex, transparent: true, depthWrite: false, opacity: 0.85 });
  for (const [z, y, w, h] of [[-62, -16, 260, 40], [-108, -14, 360, 56], [-150, -6, 420, 64], [-210, -2, 520, 80], [-280, 4, 640, 90], [-36, -26, 220, 34]]) {
    for (const k of [0, 1]) {
      const m = mesh(new THREE.PlaneGeometry(w, h), mistMat, g, [(k ? 0.35 : -0.35) * w + (rand() - 0.5) * 40, y + k * 6, z - k * 6]);
      m.renderOrder = -1; mists.push({ m, x0: m.position.x, v: (rand() - 0.5) * 1.2, w });
    }
  }
  // sun by day, moon by night
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, 'rgba(255,248,225,1)'], [0.18, 'rgba(255,236,190,.9)'], [0.45, 'rgba(255,214,150,.25)'], [1, 'rgba(255,200,140,0)']]), fog: false, transparent: true, depthWrite: false }));
  sun.position.set(60, 64, -340); sun.scale.setScalar(95); sun.renderOrder = -4; g.add(sun);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 256, (c, S) => {
    const h = c.createRadialGradient(S / 2, S / 2, S * 0.18, S / 2, S / 2, S / 2);
    h.addColorStop(0, 'rgba(255,240,200,.45)'); h.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = h; c.fillRect(0, 0, S, S);
    const d = c.createRadialGradient(S * 0.46, S * 0.44, 0, S / 2, S / 2, S * 0.2);
    d.addColorStop(0, '#fffaf0'); d.addColorStop(0.85, '#f4e6c2'); d.addColorStop(1, '#e8d6a8');
    c.fillStyle = d; c.beginPath(); c.arc(S / 2, S / 2, S * 0.2, 0, TAU); c.fill();
    c.fillStyle = 'rgba(190,170,130,.25)';
    for (const [x, y, r] of [[0.45, 0.45, 0.05], [0.55, 0.53, 0.035], [0.47, 0.57, 0.03], [0.56, 0.42, 0.025]]) { c.beginPath(); c.arc(S * x, S * y, S * r, 0, TAU); c.fill(); }
  }), fog: false, transparent: true, depthWrite: false }));
  moon.position.copy(sun.position); moon.scale.setScalar(120); moon.material.opacity = 0.8; moon.renderOrder = -4; g.add(moon);
  return { group: g, mists, mistMat, sun, moon, peaks };
}

function buildTree(M, small) {
  const tree = new THREE.Group(), canopy = new THREE.Group(); tree.add(canopy);
  const bark = u => mix(C(0x3e2a1c), C(0x6b4a30), 0.5 + 0.5 * Math.sin(u * 23));
  const spots = [];
  const barkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, bumpMap: furBump, bumpScale: 2 });
  const trunkPts = [V(0, -0.5, 0), V(0.5, 2.2, 0.15), V(-0.45, 4.6, 0), V(0.25, 6.8, -0.15), V(0.1, 7.6, 0)];
  mesh(taperedTube(trunkPts, 40, u => 1.0 * (1 + 0.7 * Math.exp(-u * 10)) * (1 - 0.42 * u), bark, 12), barkMat, tree);
  function branch(p0, dir, len, r0, depth) {
    const pts = [p0.clone()]; let p = p0.clone(); const d = dir.clone();
    for (let k = 1; k <= 4; k++) { d.add(V((rand() - 0.5) * 0.5, (rand() - 0.45) * 0.35, (rand() - 0.5) * 0.5)).normalize(); p = p.clone().addScaledVector(d, len / 4); pts.push(p); }
    const r1 = r0 * 0.55;
    mesh(taperedTube(pts, 10, u => r0 + (r1 - r0) * u, bark, 7), barkMat, canopy);
    if (depth <= 1) spots.push(pts[2], p);
    if (depth === 0) return;
    const kids = depth === 3 ? 4 : 3;
    for (let k = 0; k < kids; k++) {
      const a = (k / kids) * TAU + rand() * 0.9;
      const nd = V(Math.cos(a), 0.25 + rand() * 0.35, Math.sin(a) * 0.6).addScaledVector(d, depth === 3 ? 0.25 : 0.55).normalize();
      branch(pts[2 + (k % 3)], nd, len * 0.72, r1 * 0.95, depth - 1);
    }
  }
  branch(trunkPts[3], V(0, 1, 0), 4.2, 0.62, 3);
  // blossom clusters
  const per = small ? 22 : 34, bl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.75 }), spots.length * per);
  const pinks = [0xf9d3dc, 0xf4a9bd, 0xec8aa8, 0xfde6ec, 0xf6bccb].map(C);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  let k = 0;
  for (const s of spots) for (let i = 0; i < per; i++) {
    const o = V(rand() - 0.5, rand() * 0.7 - 0.25, rand() - 0.5).multiplyScalar(2.6);
    m4.compose(s.clone().add(o), q.random(), V(1, 0.7, 1).multiplyScalar(0.12 + rand() * 0.22)); bl.setMatrixAt(k, m4);
    bl.setColorAt(k++, pinks[(rand() * pinks.length) | 0]);
  }
  canopy.add(bl);
  // peaches among the blossoms
  const pg = peachGeo();
  for (let i = 0; i < 9; i++) { const s = spots[(rand() * spots.length) | 0]; mesh(pg, M.peach, canopy, [s.x + rand() - 0.5, s.y - 0.7, s.z + rand() - 0.5], 0.8); }
  // paper lanterns, lit at night
  const lanterns = [];
  for (const i of [3, 11, 19]) {
    const s = spots[Math.min(spots.length - 1, i)], l = new THREE.Group(); l.position.set(s.x, s.y - 0.4, s.z); canopy.add(l);
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), M.knot, l, [0, -0.6, 0]);
    mesh(SPH, M.lantern, l, [0, -1.6, 0], [0.42, 0.52, 0.42]);
    mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 10), M.gold, l, [0, -1.08, 0]);
    mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 10), M.gold, l, [0, -2.12, 0]);
    lanterns.push(l);
  }
  const light = new THREE.PointLight(0xff8a3a, 0, 22, 1.6); light.position.set(0, 7, 2); tree.add(light);
  return { tree, canopy, spots, lanterns, light };
}

/* ---------------------------------------------------------------- the scene */

export function start(canvas, opts = {}) {
  const small = Math.min(innerWidth, innerHeight) < 600;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  let dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf7f5f0, 55, 300);   // thick enough that far peaks stay pale behind the text
  const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 700);
  const tanH = Math.tan(THREE.MathUtils.degToRad(17.5));

  const hemi = new THREE.HemisphereLight(0xeaf2ff, 0x6a5a40, 1.2); scene.add(hemi);
  const sunL = new THREE.DirectionalLight(0xfff0d8, 2.4); sunL.position.set(-20, 30, 26); scene.add(sunL);
  const rimL = new THREE.DirectionalLight(0xffd7a8, 0.9); rimL.position.set(16, 10, -20); scene.add(rimL);

  const fur = (hex, extra = {}) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.92, sheen: 0.6, sheenRoughness: 0.7, sheenColor: C(0x9a9a9a), bumpMap: furBump, bumpScale: 1.4, ...extra });
  const M = {
    white: fur(0xf3efe6), black: fur(0x1e1b1f), furV: fur(0xffffff, { vertexColors: true }), khaki: fur(0xc8a46c, { sheen: 0.2 }), trim: fur(0x5e3d20, { sheen: 0.2 }),
    robe: fur(0xb2804f, { sheen: 0.2 }), pants: fur(0x4a3426, { sheen: 0.2 }), darkFur: fur(0x3a2016), cream: fur(0xf2e6cf), earIn: fur(0x7a2e14),
    eyeWhite: new THREE.MeshStandardMaterial({ color: 0xfbfbf6, roughness: 0.2 }), pupil: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 }),
    glint: new THREE.MeshBasicMaterial({ color: 0xffffff }), nose: new THREE.MeshStandardMaterial({ color: 0x141214, roughness: 0.3 }),
    mouth: new THREE.MeshStandardMaterial({ color: 0x4a1418, roughness: 0.7 }),
    wood: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, bumpMap: furBump, bumpScale: 1.5 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xa49c8c, roughness: 0.95, flatShading: true }),
    peach: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }),
    lantern: new THREE.MeshStandardMaterial({ color: 0xc8352a, emissive: 0xff4a10, emissiveIntensity: 0.15, roughness: 0.6 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd2a447, roughness: 0.4, metalness: 0.5 }),
    lacquer: new THREE.MeshStandardMaterial({ color: 0x5e2216, roughness: 0.4 }),
    cushion: new THREE.MeshStandardMaterial({ color: 0xb8442c, roughness: 0.9 }),
    bun: new THREE.MeshStandardMaterial({ color: 0xf8f1e2, roughness: 0.7 }),
    chop: new THREE.MeshStandardMaterial({ color: 0xc89a5a, roughness: 0.5 }),
    knot: new THREE.MeshStandardMaterial({ color: 0x5a3b22, roughness: 0.8 }),
  };

  const scenery = buildScenery(scene, M, small);
  const T = buildTree(M, small); scene.add(T.tree);
  const world = new THREE.Group(); scene.add(world);

  /* characters */
  const shadowTex = radial([[0, 'rgba(0,0,0,.42)'], [0.55, 'rgba(0,0,0,.2)'], [1, 'rgba(0,0,0,0)']]);
  const shadowGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  function actor(rig, rest, width) {
    world.add(rig.root);
    const sh = mesh(shadowGeo, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }), world);
    sh.renderOrder = -1;
    const A = {
      rig, rest, width, shadow: sh, pos: V(), yaw: 0, cur: blank(), target: blank(), out: blank(), rate: 6,
      walkAmt: 0, phase: 0, moving: 0, stride: 2.6, stepping: 0, style: 'walk', armSwing: [1, 1],
      grounded: true, air: 0, solveY: rig.d.hipH, seat: null, seatW: 0, force: {}, osc: [],
      look: null, lookW: 0, eyeX: 0, eyeY: 0, eyeTX: 0, eyeTY: 0, lid: 0, lidT: 0, blinkAt: 1 + rnd() * 3, blinkT: 0, wide: 0,
      chew: 0, belly: 0, bellyV: 0, chop: null, chopAim: null, autoLook: true,
    };
    A.set = (p, rate = 6) => { A.target = Object.assign(blank(), p); A.rate = rate; };
    A.kick = v => { A.bellyV += v; };
    return A;
  }
  const po = actor(buildPo(M), { ao: 0.42, lo: 0.1 }, 3.6);
  const sf = actor(buildShifu(M), { ao: 0.16, lo: 0.06 }, 1.6);
  sf.rig.root.visible = false; sf.shadow.visible = false; sf.stride = 4;
  sf.rig.root.scale.setScalar(1.22);
  for (const [A, len] of [[po, 1.15], [sf, 0.6]]) { A.chop = buildChopsticks(len, M.chop); A.rig.arm[1].hand.add(A.chop); A.chop.position.set(0, -0.05, 0.08); }

  /* props: staff, table with a bowl of dumplings, a peach, chi effects */
  const staff = buildStaff(M); po.rig.arm[1].hand.add(staff.holder);
  const table = new THREE.Group(); world.add(table);
  mesh(new THREE.BoxGeometry(3.0, 0.16, 1.5), M.lacquer, table, [0, 0.82, 0]);
  for (const [x, z] of [[-1.3, -0.6], [1.3, -0.6], [-1.3, 0.6], [1.3, 0.6]]) mesh(new THREE.BoxGeometry(0.16, 0.8, 0.16), M.lacquer, table, [x, 0.4, z]);
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.24, 20), M.cushion, table, [s * 2.3, 0.12, 0]);
  const bowl = new THREE.Group(); bowl.position.set(0, 0.9, 0); table.add(bowl);
  {
    const prof = [[0, 0], [0.3, 0], [0.34, 0.06], [0.6, 0.3], [0.7, 0.5], [0.66, 0.52], [0.56, 0.32], [0.3, 0.1], [0, 0.09]].map(([x, y]) => new THREE.Vector2(x, y));
    const geo = new THREE.LatheGeometry(prof, 28), cols = [], p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const inner = (i % prof.length) >= 5; const c = inner ? C(0xf1e8d8) : C(0x8e2a1e); cols.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
    mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, side: THREE.DoubleSide }), bowl);
  }
  const dumplings = [[0, 0.32, 0], [-0.22, 0.26, 0.15], [0.22, 0.26, 0.12], [0.02, 0.24, -0.22], [0, 0.5, 0.02]].map(h => {
    const m = mesh(dumplingGeo, M.bun, world); m.rotation.y = rand() * 3;
    return { m, home: V(...h), state: 'bowl', holder: null, fly: null };
  });
  const peach = { m: mesh(peachGeo(), M.peach, world), state: 'gone', holder: null, fly: null, bites: 0 };
  peach.m.visible = false;
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffc85a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const ring = mesh(new THREE.RingGeometry(0.85, 1, 64).rotateX(-Math.PI / 2), ringMat, world); ring.renderOrder = 1;
  let chi = 0, chiT = -1;

  /* petals drifting from the tree */
  const NP = small ? 50 : 90;
  const petals = new THREE.InstancedMesh(new THREE.CircleGeometry(0.14, 6).scale(1, 0.65, 1), new THREE.MeshStandardMaterial({ color: 0xf6b3c6, roughness: 0.8, side: THREE.DoubleSide }), NP);
  petals.frustumCulled = false; world.add(petals);
  const pet = [];
  const spawnPetal = (o, anywhere) => {
    const s = T.spots[(rnd() * T.spots.length) | 0], w = T.canopy.localToWorld(s.clone());
    o.p.set(w.x + (rnd() - 0.5) * 3, anywhere ? rnd() * w.y : w.y, w.z + (rnd() - 0.5) * 3);
    o.v.set(0.3 + rnd() * 0.5, -(0.45 + rnd() * 0.5), (rnd() - 0.5) * 0.3); o.rot.set(rnd() * 6, rnd() * 6, rnd() * 6); o.sp = 1 + rnd() * 2.5; o.ph = rnd() * 6;
  };
  for (let i = 0; i < NP; i++) pet.push({ p: V(), v: V(), rot: new THREE.Euler(), sp: 1, ph: 0 });
  let wind = 0, gust = 0;

  /* ---------------------------------------------------------------- layout */
  let aspect = 1, camK = 1;
  const halfWAt = z => (camera.position.z - z) * tanH * aspect;
  const xLim = z => Math.max(2, halfWAt(z) - 2.6);
  const Z0 = -11, Z1 = 3.5;
  const obstacles = [];
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    aspect = w / h; camera.aspect = aspect;
    camK = Math.max(1, Math.pow(1.45 / aspect, 0.65));
    camera.position.set(0, 7.3 * camK, 38 * camK);
    camera.lookAt(0, 7.3 * camK - 38 * camK * Math.tan(THREE.MathUtils.degToRad(1.8)), 0);
    camera.updateProjectionMatrix();
    const tz = -10, narrow = aspect < 1;
    T.tree.position.set(Math.min(halfWAt(tz) * 0.62, halfWAt(tz) - (narrow ? 3 : 6)), 0, tz);
    T.tree.scale.setScalar(narrow ? 0.85 : 1);
    table.position.set(clamp(-halfWAt(-4) * 0.42, -halfWAt(-4) + 4.6, -1), 0, -4.5);
    obstacles.length = 0;
    obstacles.push({ x: T.tree.position.x, z: tz, r: 2.6 }, { x: table.position.x, z: table.position.z, r: 2.0 });
    scene.updateMatrixWorld(true);
  }
  resize();

  /* ---------------------------------------------------------------- input: is anyone watching? */
  let clock = 0, moveDist = 0, lastSeen = -99;
  const ptr = { x: 0, y: 0, has: false }, mouseW = V();
  const onMove = e => {
    if (ptr.has) moveDist += Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y);
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true; lastSeen = clock;
  };
  let scrollY = window.scrollY;
  const onScroll = () => { const y = window.scrollY; moveDist += Math.abs(y - scrollY) * 0.6; scrollY = y; lastSeen = clock; };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize);
  const watching = () => clock - lastSeen < 1.2;
  function pointerWorld(z) {
    const v = V(ptr.x / innerWidth * 2 - 1, -(ptr.y / innerHeight) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
    const t = (z - camera.position.z) / v.z;
    return mouseW.copy(camera.position).addScaledVector(v, t);
  }

  /* ---------------------------------------------------------------- per-frame actor update */
  const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), tv = V(), tv2 = V(), xAxis = V(1, 0, 0);
  function updateActor(A, dt) {
    const R = A.rig, o = A.out;
    const k = 1 - Math.exp(-dt * A.rate);
    for (const key of KEYS) A.cur[key] += (A.target[key] - A.cur[key]) * k;
    Object.assign(o, A.cur);
    // walk cycle
    const walking = A.moving > 0.05 || A.stepping > 0;
    A.walkAmt += ((walking ? 1 : 0) - A.walkAmt) * (1 - Math.exp(-dt * 8));
    A.phase += dt * (A.moving * A.stride + A.stepping * 6);
    if (A.walkAmt > 0.01) {
      const w = A.walkAmt, s = Math.sin(A.phase), c = Math.cos(A.phase), sneak = A.style === 'sneak';
      o.lfL += w * (0.5 * s + (sneak ? 0.65 : 0.28) * Math.max(0, c)); o.lfR += w * (-0.5 * s + (sneak ? 0.65 : 0.28) * Math.max(0, -c));
      o.lkL += w * (sneak ? 1.25 : 0.8) * Math.max(0, c); o.lkR += w * (sneak ? 1.25 : 0.8) * Math.max(0, -c);
      o.pr += w * 0.09 * s; o.twist += w * 0.1 * s; o.hr -= w * 0.05 * s;
      o.afL -= w * 0.38 * s * A.armSwing[0]; o.afR += w * 0.38 * s * A.armSwing[1];
      if (sneak) { o.hy += w * 0.5 * Math.sin(clock * 0.9); }
    }
    for (const [key, amp, f, ph] of A.osc) o[key] += amp * Math.sin(clock * f + (ph || 0));
    for (const key in A.force) o[key] = A.force[key];
    // head and eyes follow whatever they are looking at
    let tgt = A.look ? A.look() : null;
    if (!tgt && A.autoLook && ptr.has && clock - lastSeen < 2.5) {
      R.head.getWorldPosition(tv2);
      const pw = pointerWorld(A.pos.z + 1);
      if (pw.distanceTo(tv2) < 9) tgt = pw;
    }
    A.lookW += ((tgt ? 1 : 0) - A.lookW) * (1 - Math.exp(-dt * 4));
    if (tgt) {
      R.head.getWorldPosition(tv2); tv.subVectors(tgt, tv2);
      const cy = Math.cos(A.yaw), sy = Math.sin(A.yaw), lx = tv.x * cy - tv.z * sy, lz = tv.x * sy + tv.z * cy;
      A._ly = Math.atan2(lx, lz) - o.twist; A._lp = -Math.atan2(tv.y, Math.hypot(lx, lz)) - o.lean;
    }
    if (A.lookW > 0.01 && A._ly !== undefined) {
      const hy = clamp(A._ly, -1.1, 1.1), hp = clamp(A._lp, -0.6, 0.6);
      o.hy = lerp(o.hy, hy, A.lookW); o.hp = lerp(o.hp, hp, A.lookW);
      A.eyeTX = clamp(A._ly - hy, -0.4, 0.4) * A.lookW + A.eyeTX * (1 - A.lookW);
    }
    A.eyeX += (A.eyeTX - A.eyeX) * (1 - Math.exp(-dt * 14)); A.eyeY += (A.eyeTY - A.eyeY) * (1 - Math.exp(-dt * 14));
    // blinking
    A.blinkAt -= dt;
    if (A.blinkAt < 0) { A.blinkT = 0.16; A.blinkAt = 2 + rnd() * 4; }
    A.blinkT -= dt;
    A.lid += (Math.max(A.lidT, A.blinkT > 0 ? 1 : 0) - A.lid) * (1 - Math.exp(-dt * 22));
    A.wide += -A.wide * (1 - Math.exp(-dt * 2));
    for (const e of R.eyes) {
      e.ball.rotation.set(-A.eyeY, A.eyeX, 0);
      e.base.scale.set(1 + A.wide * 0.18, Math.max(0.08, 1 - A.lid) * (1 + A.wide * 0.25), 1);
    }
    // mouth, chewing, belly
    const jaw = clamp(o.jaw + (A.chew > 0 ? Math.abs(Math.sin(clock * 9)) * 0.55 : 0), 0, 1.2);
    A.chew -= dt;
    R.mouth.scale.y = R.mouth.userData.y0 * (1 + jaw * 4.5);
    A.bellyV += (-A.belly * 90 - A.bellyV * 7) * dt; A.belly += A.bellyV * dt;
    const br = 0.012 * Math.sin(clock * (A.sleep ? 1.4 : 2.1)) * (A.sleep ? 2.5 : 1);
    R.belly.scale.set(1 + A.belly * 0.06 + br * 0.6, 1 - A.belly * 0.05 + br, 1 + A.belly * 0.1 + br);
    R.headMesh.scale.x = R.headMesh.scale.y * (1 + (A.chew > 0 ? 0.05 : 0));   // cheeks puff while chewing
    // pose → joints
    R.root.position.copy(A.pos); R.root.rotation.y = A.yaw;
    R.pelvis.rotation.set(o.pp, 0, o.pr);
    R.torso.rotation.set(o.lean, o.twist, o.side);
    R.neck.rotation.set(o.hp * 0.35, o.hy * 0.35, o.hr * 0.35);
    R.head.rotation.set(o.hp * 0.65, o.hy * 0.65, o.hr * 0.65);
    for (let i = 0; i < 2; i++) {
      const a = R.arm[i], l = R.leg[i], s = a.s, K = i ? 'R' : 'L';
      a.sh.rotation.set(-o['af' + K], s * o['at' + K], s * (o['ao' + K] + A.rest.ao));
      a.el.rotation.set(-o['ae' + K], 0, 0);
      a.hand.quaternion.copy(q.copy(a.sh.quaternion).multiply(a.el.quaternion).invert());   // hands stay level with the torso
      l.hip.rotation.set(-o['lf' + K], 0, s * (o['lo' + K] + A.rest.lo));
      l.knee.rotation.set(o['lk' + K], 0, 0);
      l.ankle.quaternion.copy(q.copy(l.hip.quaternion).multiply(l.knee.quaternion).invert()).multiply(q2.setFromAxisAngle(xAxis, o['la' + K]));
    }
    // lower the body until the lower foot is on the ground (or onto the seat)
    if (A.grounded) {
      R.pelvis.position.y = R.d.hipH;
      R.root.updateMatrixWorld(true);
      const y0 = R.leg[0].ankle.getWorldPosition(tv).y, y1 = R.leg[1].ankle.getWorldPosition(tv).y;
      const k = R.root.scale.y;
      A.solveY = R.d.hipH + (A.pos.y + R.d.ankleH * k - Math.min(y0, y1)) / k;
    }
    A.seatW += ((A.seat !== null ? 1 : 0) - A.seatW) * (1 - Math.exp(-dt * 3));
    R.pelvis.position.y = lerp(A.solveY, A.seat !== null ? A.seat : A.solveY, A.seatW) + A.air;
    if (R.tail) R.tail.rotation.set(0.1 * Math.sin(clock * 1.3), 0.25 * Math.sin(clock * 0.9), 0);
    // shadow
    A.shadow.position.set(A.pos.x, 0.04, A.pos.z + 0.2);
    A.shadow.scale.setScalar(A.width * 1.5 * (1 - clamp(A.air / 8, 0, 0.5)));
    A.shadow.material.opacity = 1 - clamp(A.air / 6, 0, 0.6);
  }

  /* ---------------------------------------------------------------- props per frame */
  const STAFF = {
    back: { p: () => po.rig.torso, pos: [0.1, 2.25, -1.25], rot: [0.15, 0, Math.PI / 2 - 0.3], off: -1.2 },
    stick: { p: () => po.rig.arm[1].hand, pos: [0, -0.15, 0.1], rot: [0.12, 0, 0], off: 0.2 },
    spin: { p: () => po.rig.arm[1].hand, pos: [0, -0.1, 0.3], rot: [0, 0, 0], off: -1.2 },
    over: { p: () => po.rig.arm[1].hand, pos: [0, 0.1, 0], rot: [-Math.PI / 2, 0, 0], off: -1.2 },
    strike: { p: () => po.rig.arm[1].hand, pos: [0, -0.1, 0.1], rot: [Math.PI / 2 - 0.15, 0, 0], off: 1.0 },
    plant: { p: () => po.rig.root, pos: [0, 1.9, 1.9], rot: [0, 0, 0], off: 0 },
    side: { p: () => po.rig.root, pos: [-2.2, 1.85, 0.3], rot: [0, 0, 0.1], off: 0 },
  };
  function staffTo(mode, instant) {
    const m = STAFF[mode]; staff.mode = mode;
    m.p().attach(staff.holder);
    if (instant) { staff.holder.position.set(...m.pos); staff.holder.rotation.set(...m.rot); staff.off.position.y = m.off; }
  }
  const qT = new THREE.Quaternion(), eT = new THREE.Euler();
  const tip = (A, out) => A.chop.tip.getWorldPosition(out);
  const handsMid = (A, out) => { A.rig.arm[0].hand.getWorldPosition(out); A.rig.arm[1].hand.getWorldPosition(tv); return out.add(tv).multiplyScalar(0.5); };
  const mouth = (A, out = V()) => A.rig.mouthPt.getWorldPosition(out);
  function flyTo(item, to, h, dur) { item.fly = { from: item.m.position.clone(), to: to.clone(), h, dur, t: 0 }; item.state = 'fly'; item.holder = null; }
  function updateItem(it, dt) {
    if (it.state === 'held') {
      if (it.holder.hands) handsMid(it.holder.A, it.m.position).add(tv.set(Math.sin(it.holder.A.yaw), 0.1, Math.cos(it.holder.A.yaw)).multiplyScalar(0.3));
      else tip(it.holder.A, it.m.position);
    } else if (it.state === 'fly') {
      const f = it.fly; f.t += dt; const u = Math.min(1, f.t / f.dur);
      it.m.position.lerpVectors(f.from, f.to, u); it.m.position.y += 4 * f.h * u * (1 - u);
      it.m.rotation.x += dt * 9;
      if (u >= 1) { it.state = 'still'; }
    }
  }
  function updateProps(dt) {
    // staff eases into its current mode
    const m = STAFF[staff.mode], kk = 1 - Math.exp(-dt * 9);
    staff.holder.position.lerp(tv.set(...m.pos), kk);
    staff.holder.quaternion.slerp(qT.setFromEuler(eT.set(...m.rot)), kk);
    staff.off.position.y += (m.off - staff.off.position.y) * kk;
    staff.spinV += (staff.spinT - staff.spinV) * (1 - Math.exp(-dt * 4));
    if (staff.spinT === 0 && Math.abs(staff.spinV) < 2) {
      const goal = Math.round(staff.angle / TAU) * TAU; staff.angle += (goal - staff.angle) * (1 - Math.exp(-dt * 6)); staff.spinV = 0;
    } else staff.angle += staff.spinV * dt;
    staff.spinner.rotation.z = staff.angle;
    staff.glow.material.opacity = chi * 0.95;
    // chopsticks grow in and out of the paws, and point at what they are after
    for (const A of [po, sf]) {
      const c = A.chop, want = A.chopOn ? 1 : 0.001, s = c.scale.x + (want - c.scale.x) * (1 - Math.exp(-dt * 8));
      c.scale.setScalar(s); c.visible = s > 0.01;
      if (A.chopAim) { const aim = A.chopAim(); c.lookAt(aim); }
      else { c.quaternion.slerp(qT.setFromEuler(eT.set(0.35, 0.25, 0)), kk); }
    }
    for (const d of dumplings) {
      if (d.state === 'bowl') { d.m.visible = true; d.m.position.copy(d.home).applyMatrix4(bowl.matrixWorld); }
      else if (d.state === 'gone') d.m.visible = false;
      else updateItem(d, dt);
    }
    if (peach.state !== 'gone') updateItem(peach, dt);
    // chi burst: a golden ring across the grass
    if (chiT >= 0) {
      chiT += dt; const u = chiT / 1.6;
      ring.position.set(po.pos.x, 0.08, po.pos.z); ring.scale.setScalar(1 + u * 16); ringMat.opacity = 0.9 * (1 - u);
      if (u >= 1) { chiT = -1; ringMat.opacity = 0; }
    }
    for (const mat of [M.white, M.black, M.furV]) { mat.emissive.setRGB(1, 0.72, 0.25); mat.emissiveIntensity = chi * 0.16; }
    // wind, petals, mist, tree
    gust *= Math.exp(-dt * 1.2);
    wind = 0.5 + 0.35 * Math.sin(clock * 0.23) + 0.2 * Math.sin(clock * 0.71) + gust;
    T.canopy.rotation.z = 0.012 * Math.sin(clock * 0.8) * (1 + gust * 3) + 0.02 * gust * Math.sin(clock * 9);
    for (let i = 0; i < NP; i++) {
      const o = pet[i];
      o.p.x += (o.v.x * wind + Math.sin(clock * o.sp + o.ph) * 0.4) * dt;
      o.p.y += o.v.y * dt * (1 + gust * 0.5) + Math.sin(clock * 2 + o.ph) * 0.15 * dt;
      o.p.z += o.v.z * dt;
      o.rot.x += dt * o.sp; o.rot.y += dt * o.sp * 0.7;
      if (o.p.y < 0.05 || o.p.x > halfWAt(o.p.z) + 4) spawnPetal(o);
      m4.compose(o.p, q.setFromEuler(o.rot), sc1); petals.setMatrixAt(i, m4);
    }
    petals.instanceMatrix.needsUpdate = true;
    for (const s of scenery.mists) s.m.position.x = s.x0 + Math.sin(clock * 0.03 + s.x0) * s.w * 0.05 * s.v;
    T.lanterns.forEach((l, i) => { l.rotation.z = 0.06 * Math.sin(clock * 1.3 + i); });
  }
  const m4 = new THREE.Matrix4(), sc1 = V(1, 1, 1);
  for (const o of pet) spawnPetal(o, true);

  /* ---------------------------------------------------------------- behaviour helpers (generators) */
  function* wait(t) { while (t > 0) t -= yield; }
  function* all(...gs) {
    const live = new Set(gs); let dt = 0;
    for (;;) { for (const g of live) if (g.next(dt).done) live.delete(g); if (!live.size) return; dt = yield; }
  }
  function* pose(A, p, t = 0.6, rate = 7) { A.set(p, rate); yield* wait(t); }
  function* turnTo(A, yaw, rate = 3.2) {
    while (Math.abs(angDiff(A.yaw, yaw)) > 0.04) {
      const dt = yield, d = angDiff(A.yaw, yaw);
      A.yaw += Math.sign(d) * Math.min(Math.abs(d), rate * dt); A.stepping = 0.8;
    }
    A.stepping = 0;
  }
  function blocked(A, x, z) {
    for (const o of obstacles) {
      const ax = A.pos.x, az = A.pos.z, dx = x - ax, dz = z - az, L2 = dx * dx + dz * dz || 1;
      const t = clamp(((o.x - ax) * dx + (o.z - az) * dz) / L2, 0, 1), cx = ax + dx * t - o.x, cz = az + dz * t - o.z;
      if (Math.hypot(o.x - x, o.z - z) > o.r && Math.hypot(o.x - ax, o.z - az) > o.r && cx * cx + cz * cz < o.r * o.r) return o;
    }
    return null;
  }
  function* goTo(A, x, z, { speed = 2.3, style = 'walk', face, direct } = {}) {
    const o = !direct && blocked(A, x, z);                   // walk round the tree or the table (one detour, in front of it)
    if (o) { const side = A.pos.x < o.x ? -1 : 1; yield* goTo(A, o.x + side * (o.r + 1.4), o.z + o.r + 1.3, { speed, style, direct: true }); }
    A.style = style;
    for (;;) {
      const dt = yield, dx = x - A.pos.x, dz = z - A.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.12) break;
      const want = Math.atan2(dx, dz), diff = angDiff(A.yaw, want);
      A.yaw += Math.sign(diff) * Math.min(Math.abs(diff), dt * 4.5);
      const sp = speed * sm(0.15, 0.85, Math.cos(diff)) * Math.min(1, d / 0.5 + 0.25);
      A.pos.x += Math.sin(A.yaw) * sp * dt; A.pos.z += Math.cos(A.yaw) * sp * dt;
      A.moving = sp / speed;
    }
    A.moving = 0; A.style = 'walk';
    if (face !== undefined) yield* turnTo(A, face);
  }
  function* leap(A, x, z, h, dur, flips = 0, keepYaw = false) {
    const x0 = A.pos.x, z0 = A.pos.z;
    if (!keepYaw && Math.hypot(x - x0, z - z0) > 0.5) A.yaw = Math.atan2(x - x0, z - z0);
    yield* pose(A, P.crouch, 0.2, 14);
    const base = A.solveY; A.grounded = false; A.set(P.tuck, 9);
    let t = 0;
    while (t < dur) {
      t += yield; const u = Math.min(1, t / dur);
      A.pos.x = lerp(x0, x, u); A.pos.z = lerp(z0, z, u);
      A.solveY = lerp(base, A.rig.d.hipH, sm(0, 0.2, u)); A.air = 4 * h * u * (1 - u);
      if (flips) A.force.pp = flips * TAU * sm(0.15, 0.85, u);
      if (u > 0.75) A.set(P.crouch, 10);
    }
    delete A.force.pp; A.air = 0; A.grounded = true; A.kick(-1.5);
    yield* pose(A, P.crouch, 0.25, 14);
    A.set(P.stand, 6);
  }
  const ATCAM = () => camera.position;
  function* lookAround(A, quick) {
    A.autoLook = false;
    for (const [hy, ex, t] of [[0.8, 0.35, 0.8], [-0.8, -0.35, 1.0], [0, 0, 0.5]]) {
      A.target.hy = hy; A.eyeTX = ex; yield* wait(quick ? t * 0.5 : t);
    }
    A.eyeTX = 0; A.autoLook = true;
  }
  function* watchFor(t) { const d0 = moveDist; yield* wait(t); return moveDist - d0 > 30; }
  function pickSpot() {
    for (let i = 0; i < 20; i++) {
      const z = lerp(Z0, Z1, rnd()), x = (rnd() * 2 - 1) * xLim(z);
      if (Math.hypot(x - po.pos.x, z - po.pos.z) < 4) continue;
      if (obstacles.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 1.5)) continue;
      return [x, z];
    }
    return [0, 0];
  }
  const faceCam = A => Math.atan2(camera.position.x - A.pos.x, camera.position.z - A.pos.z) * 0.6;

  /* ---------------------------------------------------------------- behaviours */
  function* holdStaff() {
    if (staff.mode === 'stick') return;
    if (staff.mode === 'side') { yield* pose(po, P.reachDown, 0.45, 8); }
    else if (staff.mode === 'back') { yield* pose(po, P.reachBack, 0.45, 8); }
    staffTo('stick'); yield* pose(po, P.stick, 0.45, 6);
    po.armSwing = [1, 0.25];
  }
  function* staffOnBack() {
    if (staff.mode === 'back') return;
    if (staff.mode === 'side') { yield* pose(po, P.reachDown, 0.45, 8); staffTo('stick'); yield* wait(0.2); }
    yield* pose(po, P.reachBack, 0.45, 8);
    staffTo('back'); yield* pose(po, P.stand, 0.35, 6);
    po.armSwing = [1, 1];
  }

  function* peekIn(side) {
    const e = side || (rnd() < 0.5 ? -1 : 1), z = -2 + rnd() * 3, hw = halfWAt(z);
    po.rig.root.visible = true; po.shadow.visible = true;
    staffTo('back', true); po.armSwing = [1, 1];
    po.pos.set(e * (hw + 3.4), 0, z); po.yaw = 0; po.autoLook = false;
    const peekPose = S(e > 0 ? { afR: 1.0, aeR: 1.55, aoR: -0.1 } : { afL: 1.0, aeL: 1.55, aoL: -0.1 }, { side: e * 0.52, pr: e * 0.05, lean: 0.05 });
    function* slide(x, t) { const x0 = po.pos.x; let u = 0; po.stepping = 0.6; while (u < 1) { u = Math.min(1, u + (yield) / t); po.pos.x = lerp(x0, x, sm(0, 1, u)); } po.stepping = 0; }
    for (let tries = 0; ; tries++) {
      po.set(peekPose, 4);
      yield* slide(e * (hw + 0.7), 0.9);
      yield* wait(0.3);
      // look across the screen, then back at the viewer
      po.target.hy = -e * 0.8; po.eyeTX = -e * 0.35; yield* wait(1.1);
      po.eyeTX = e * 0.3; yield* wait(0.5);
      po.target.hy = 0; po.target.hp = -0.05; po.eyeTX = 0; po.look = ATCAM; yield* wait(0.4);
      const seen = yield* watchFor(1.5);
      po.look = null;
      if (!seen || tries >= 2) break;
      // someone moved — duck back out of sight
      po.wide = 1; po.set(S(peekPose, { side: e * 0.1, jaw: 0.5 }), 14);
      yield* slide(e * (hw + 3.4), 0.35);
      yield* wait(1.4 + rnd() * 1.2);
    }
    // coast is clear: tiptoe in, glancing about
    po.set(S(P.sneak, { side: 0 }), 5);
    yield* goTo(po, e * hw * 0.3, z - 1.5, { style: 'sneak', speed: 1.4 });
    po.set(P.stand, 5);
    yield* lookAround(po, true);
    po.autoLook = true;
    yield* pose(po, P.stretch, 1.5, 3);
    yield* pose(po, P.stand, 0.4, 5);
    yield* holdStaff();
  }

  function* wander() {
    yield* holdStaff();
    const [x, z] = pickSpot();
    yield* goTo(po, x, z);
    const r = rnd();
    if (watching() && r < 0.45) yield* waveHello();
    else if (r < 0.35) yield* lookAround(po);
    else if (r < 0.5) { yield* pose(po, S(P.stick, P.scratch), 1.4, 5); po.set(P.stick, 5); }
    else yield* wait(0.5 + rnd());
  }

  function* waveHello() {
    yield* turnTo(po, faceCam(po));
    po.look = ATCAM; po.osc = [['aoL', 0.3, 9]];
    yield* pose(po, S(P.stick, P.wave), 1.8, 6);
    po.osc = []; po.look = null; po.set(P.stick, 5);
    yield* wait(0.4);
  }

  function* kata() {
    yield* holdStaff();
    yield* turnTo(po, faceCam(po));
    yield* pose(po, S(P.salute, { afR: 1.0, aeR: 1.0 }), 1.0, 6);
    po.armSwing = [1, 1];
    staffTo('spin'); yield* pose(po, P.spin, 0.4, 8);
    staff.spinT = 15; yield* wait(1.6);
    staffTo('over'); yield* pose(po, P.overhead, 1.7, 6);
    staff.spinT = 0; staffTo('strike');
    yield* pose(po, P.guard, 0.4, 10);
    for (const t of [P.strike, P.guard, P.strike]) yield* pose(po, t, 0.45, 13);
    staffTo('spin'); staff.spinT = -18; yield* pose(po, P.spin, 1.0, 8);
    staff.spinT = 0; staffTo('plant');
    yield* pose(po, P.plant, 0.7, 6);
    // the staff wakes up: golden chi rolls out over the hill
    po.look = () => staff.glow.getWorldPosition(tv2);
    let t = 0; chiT = 0; gust = 2.5; po.kick(2);
    while (t < 2.2) { t += yield; chi = Math.sin(Math.PI * Math.min(1, t / 2.2)); }
    chi = 0; po.look = null;
    yield* pose(po, P.salute, 0.9, 6);
    yield* holdStaff();
  }

  function* peachSnack() {
    yield* holdStaff();
    const tx = T.tree.position.x, tz = T.tree.position.z, sx = tx - 3.6 * T.tree.scale.x, sz = tz + 2.8;
    yield* goTo(po, sx, sz, { face: 0.3 });
    yield* lookAround(po);
    // shake one loose with the staff
    po.osc = [['afR', 0.12, 17]]; gust = 1.5;
    yield* pose(po, S(P.poke), 1.2, 6);
    po.osc = [];
    yield* pose(po, P.stick, 0.45, 6);
    staffTo('side'); yield* pose(po, P.stand, 0.5, 6);
    // …it lands on his head
    const top = po.rig.crown.getWorldPosition(V());
    peach.m.visible = true; peach.state = 'still'; peach.m.scale.setScalar(1); peach.m.position.set(top.x + 0.3, 11, top.z + 0.2);
    flyTo(peach, top, 0, 0.75);
    yield* wait(0.75);
    po.wide = 1; po.kick(2); po.set(S(P.startled, { hp: 0.35 }), 16);
    yield* wait(0.2);
    po.set(P.catchUp, 9);
    yield* wait(0.25);
    flyTo(peach, handsMid(po, V()).add(V(Math.sin(po.yaw) * 0.3, 0.1, Math.cos(po.yaw) * 0.3)), 1.4, 0.6);
    po.look = () => peach.m.position;
    yield* wait(0.6);
    peach.state = 'held'; peach.holder = { A: po, hands: true }; po.look = null;
    yield* wait(0.4);
    for (let b = 0; b < 3; b++) {
      yield* pose(po, P.holdMouth, 0.5, 7);
      po.target.jaw = 1; yield* wait(0.25);
      po.target.jaw = 0; peach.m.scale.multiplyScalar(0.72); po.chew = 0.9;
      yield* pose(po, P.catchUp, 0.9, 6);
    }
    peach.state = 'gone'; peach.m.visible = false;
    po.lidT = 0.55; po.osc = [['aeL', 0.25, 10], ['aeR', 0.25, 10, 1.5]];
    po.kick(1.5);
    yield* pose(po, P.pat, 1.6, 6);
    po.osc = []; po.lidT = 0;
    yield* holdStaff();
  }

  function* shifuArrive(x, z, yawEnd) {
    const e = x > po.pos.x ? 1 : -1;
    sf.rig.root.visible = true; sf.shadow.visible = true;
    sf.pos.set(e * (halfWAt(z) + 3), 0, z); sf.yaw = -e * Math.PI / 2; sf.set(P.stand, 10);
    yield* leap(sf, x, z, 5, 1.2, 1);
    yield* turnTo(sf, yawEnd, 5);
  }
  function* shifuLeave() {
    const e = sf.pos.x > po.pos.x ? 1 : -1;
    yield* leap(sf, e * (halfWAt(sf.pos.z) + 4), sf.pos.z, 5, 1.1, 1);
    sf.rig.root.visible = false; sf.shadow.visible = false;
  }

  function* train() {
    yield* staffOnBack();
    const e = po.pos.x < 0 ? 1 : -1, gap = 4.4;
    const z = clamp(po.pos.z, -7, 1), px = clamp(po.pos.x, -xLim(z), xLim(z));
    const x = e > 0 ? Math.min(px, xLim(z) - gap) : Math.max(px, -xLim(z) + gap);
    yield* goTo(po, x, z);
    const yP = e * 1.0, yS = -e * 1.0;
    yield* turnTo(po, yP);
    yield* shifuArrive(x + e * gap, z, yS);
    po.look = () => sf.rig.head.getWorldPosition(tv2); sf.look = () => po.rig.head.getWorldPosition(V());
    yield* all(pose(po, P.salute, 1.1, 6), pose(sf, P.salute, 1.1, 6));
    yield* all(pose(po, P.stand, 0.4), pose(sf, P.stand, 0.4));
    // the master shows, the student copies
    yield* pose(sf, P.horse, 1.2, 6);
    po.osc = [['lkL', 0.06, 20], ['lkR', 0.06, 20, 1]];
    yield* pose(po, P.horse, 1.5, 5);
    po.osc = [];
    yield* all(pose(po, P.stand, 0.4), pose(sf, P.stand, 0.4));
    yield* pose(sf, P.crane, 1.3, 6);
    po.osc = [['side', 0.16, 4.5], ['aoL', 0.35, 7], ['aoR', 0.35, 7, 2]];
    yield* pose(po, P.crane, 1.8, 6);
    po.osc = [];
    yield* wait(0.7);
    yield* all(pose(po, P.stand, 0.4), pose(sf, P.stand, 0.4));
    for (const p of [P.punchR, P.punchL, P.kickR]) yield* pose(sf, p, 0.42, 13);
    yield* pose(sf, P.guard, 0.3, 10);
    for (const p of [P.punchR, P.punchL, P.kickR]) yield* pose(po, p, 0.5, 11);
    yield* pose(po, P.guard, 0.4, 8);
    // spar: the master strikes, the belly bounces him back
    const sx = sf.pos.x;
    yield* leap(sf, po.pos.x + e * 2.2, z, 1.2, 0.45, 0, true);
    sf.set(P.palm, 16); po.set(P.bellyOut, 14); yield* wait(0.15);
    po.kick(4); po.wide = 1;
    yield* leap(sf, sx, z, 3, 0.9, -1, true);
    yield* all(pose(po, P.stand, 0.6, 6), pose(sf, P.stand, 0.6));
    sf.osc = [['hp', 0.18, 8]]; yield* wait(0.8); sf.osc = [];
    yield* all(pose(po, P.salute, 1.0, 6), pose(sf, P.salute, 1.0, 6));
    yield* all(pose(po, P.stand, 0.4), pose(sf, P.stand, 0.4));
    po.look = sf.look = null;
    yield* shifuLeave();
    yield* pose(po, S(P.victory), 0.9, 8);
    po.set(P.stand);
    yield* holdStaff();
  }

  function* dumplingDuel() {
    yield* staffOnBack();
    const tx = table.position.x, tz = table.position.z, yP = Math.PI / 2 - 0.45, yS = -Math.PI / 2 + 0.45;
    yield* goTo(po, tx - 2.3, tz, { face: yP });
    po.seat = 0.36; yield* pose(po, P.sit, 1.0, 3);
    yield* shifuArrive(tx + 2.3, tz, yS);
    sf.seat = 0.3; yield* pose(sf, P.sitCross, 0.8, 4);
    const bowlP = () => bowl.localToWorld(V(0, 0.45, 0));
    po.look = () => sf.rig.head.getWorldPosition(tv2); sf.look = () => po.rig.head.getWorldPosition(V());
    yield* all(pose(po, S(P.sit, P.salute, { lfL: 1.45, lfR: 1.45 }), 1.0, 5), pose(sf, S(P.sitCross, P.salute), 1.0, 5));
    po.set(P.sit); sf.set(P.sitCross);
    po.chopOn = sf.chopOn = true; yield* wait(0.5);
    // chopsticks clash over the bowl
    po.look = sf.look = bowlP; po.chopAim = sf.chopAim = bowlP;
    yield* all(pose(po, S(P.sit, P.reach), 0.7, 6), pose(sf, S(P.sitCross, P.reach), 0.7, 6));
    for (let i = 0; i < 5; i++) {
      po.target.afR = 1.0 + (i % 2 ? 0.25 : -0.1); sf.target.afR = 1.0 + (i % 2 ? -0.1 : 0.25); po.rate = sf.rate = 16;
      yield* wait(0.2);
    }
    // the master snatches one…
    const d = dumplings[4]; d.state = 'held'; d.holder = { A: sf };
    sf.chopAim = null; sf.set(S(P.sitCross, P.chopUp), 7);
    po.look = () => d.m.position; sf.look = () => d.m.position;
    yield* wait(0.6);
    po.chopAim = () => d.m.position; yield* pose(po, S(P.sit, P.chopUp, { afR: 1.9 }), 0.45, 8);
    // …and flicks it away from the student, high into the air
    sf.set(S(P.sitCross, P.chopUp, { twist: 0.5, afR: 2.6 }), 10);
    yield* wait(0.15);
    po.set(S(P.sit, P.chopUp), 8); yield* wait(0.25);
    const catchAt = tip(po, V()); po.chopAim = () => d.m.position;
    d.m.position.copy(tip(sf, V())); flyTo(d, catchAt, 4, 1.15);
    yield* wait(1.15);
    d.state = 'held'; d.holder = { A: po }; po.chopAim = null; po.wide = 1;
    yield* pose(po, S(P.sit, P.victory), 0.9, 7);
    po.look = () => sf.rig.head.getWorldPosition(tv2); yield* wait(0.6);
    // …but he gives it to his master
    sf.chopAim = null; sf.set(S(P.sitCross, P.chopUp), 6); yield* wait(0.45);
    const give = tip(sf, V());
    d.m.position.copy(tip(po, V())); flyTo(d, give, 1.6, 0.8);
    po.set(P.sit, 6); sf.look = () => d.m.position;
    yield* wait(0.8);
    d.state = 'held'; d.holder = { A: sf };
    sf.chopAim = () => mouth(sf); sf.look = null;
    yield* pose(sf, S(P.sitCross, P.eatChop), 0.7, 6);
    sf.target.jaw = 1; yield* wait(0.25);
    d.state = 'gone'; sf.target.jaw = 0; sf.chew = 1.2; sf.chopAim = null;
    yield* pose(sf, P.sitCross, 1.2, 5);
    sf.osc = [['hp', 0.15, 8]]; yield* wait(0.7); sf.osc = [];
    // then the student has one too
    po.chopAim = bowlP; po.look = bowlP; yield* pose(po, S(P.sit, P.reach), 0.7, 6);
    const d2 = dumplings[0]; d2.state = 'held'; d2.holder = { A: po };
    po.chopAim = () => mouth(po); po.look = null;
    yield* pose(po, S(P.sit, P.eatChop), 0.7, 6);
    po.target.jaw = 1; yield* wait(0.3);
    d2.state = 'gone'; po.target.jaw = 0; po.chew = 1.4; po.chopAim = null; po.lidT = 0.5;
    yield* pose(po, P.sit, 1.0, 5);
    po.osc = [['aeL', 0.25, 10]]; po.kick(1.2);
    yield* pose(po, S(P.sit, P.pat), 1.2, 6);
    po.osc = []; po.lidT = 0;
    po.chopOn = sf.chopOn = false;
    po.look = () => sf.rig.head.getWorldPosition(tv2); sf.look = () => po.rig.head.getWorldPosition(V());
    yield* all(pose(po, S(P.sit, P.salute, { lfL: 1.45, lfR: 1.45 }), 1.0, 5), pose(sf, S(P.sitCross, P.salute), 1.0, 5));
    po.look = sf.look = null;
    sf.seat = null; yield* pose(sf, P.stand, 0.6, 4);
    yield* shifuLeave();
    po.seat = null; yield* pose(po, P.stand, 0.9, 3);
    for (const x of dumplings) x.state = 'bowl';
    yield* holdStaff();
  }

  function* nap() {
    yield* holdStaff();
    const tx = T.tree.position.x, tz = T.tree.position.z;
    yield* goTo(po, tx - 1.2, tz + 2.6, { face: -0.15 });
    staffTo('side');
    po.seat = 0.36; yield* pose(po, P.sit, 1.0, 3);
    yield* pose(po, S(P.sit, P.stretch, { lfL: 1.45, lfR: 1.45 }), 1.4, 3);
    po.autoLook = false; po.lidT = 1; po.sleep = true;
    yield* pose(po, S(P.sit, P.nap), 0.5, 1.5);
    let t = 0;
    const d0 = moveDist;
    while (t < 7 && !(t > 2.5 && moveDist - d0 > 400)) t += yield;
    po.sleep = false; po.lidT = 0; po.wide = 1;
    yield* pose(po, S(P.sit, P.startled), 0.3, 14);
    yield* lookAround(po, true);
    po.seat = null; yield* pose(po, P.stand, 0.9, 3);
    po.autoLook = true;
    yield* holdStaff();
  }

  function* exitAndPeek() {
    yield* staffOnBack();
    const e = po.pos.x > 0 ? 1 : -1;
    yield* goTo(po, e * (halfWAt(po.pos.z) + 4), po.pos.z, { speed: 2.6 });
    yield* wait(1.5 + rnd() * 2);
    yield* peekIn(rnd() < 0.5 ? e : -e);
  }

  const ACTS = { kata: [kata, 2], peach: [peachSnack, 1.6], train: [train, 1.8], dumplings: [dumplingDuel, 1.6], nap: [nap, 0.8], peek: [exitAndPeek, 0.8] };
  function* life(first) {
    if (first) yield* first();
    let last = '';
    for (;;) {
      const n = 1 + (rnd() * 2 | 0);
      for (let i = 0; i < n; i++) yield* wander();
      const names = Object.keys(ACTS).filter(k => k !== last);
      let r = rnd() * names.reduce((s, k) => s + ACTS[k][1], 0), pick = names[0];
      for (const k of names) { r -= ACTS[k][1]; if (r <= 0) { pick = k; break; } }
      last = pick;
      yield* ACTS[pick][0]();
    }
  }

  /* carry the panda over from the previous page */
  const KEY = 'sp-panda-state';
  function save() {
    try { sessionStorage.setItem(KEY, JSON.stringify({ x: po.pos.x, z: po.pos.z, yaw: po.yaw, t: Date.now() })); } catch (e) { /* fine */ }
  }
  let restored = false;
  try {
    const st = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (st && Date.now() - st.t < 30 * 60 * 1000 && isFinite(st.x) && Math.abs(st.x) < xLim(st.z) + 1) {   // off-screen (mid-peek): peek again
      po.pos.set(clamp(st.x, -xLim(st.z), xLim(st.z)), 0, clamp(st.z, Z0, Z1)); po.yaw = st.yaw || 0; restored = true;
    }
  } catch (e) { /* fine */ }
  window.addEventListener('pagehide', save);
  staffTo(restored ? 'stick' : 'back', true);
  if (restored) { po.set(P.stick, 50); po.armSwing = [1, 0.25]; }
  for (const A of [po, sf]) A.rig.mouth.userData.y0 = A.rig.mouth.scale.y;
  let director = life(restored ? () => lookAround(po) : peekIn);

  function step(dt) {
    clock += dt;
    try { director.next(dt); } catch (err) {
      console.error(err);                                       // never let a script error freeze the scene
      sf.rig.root.visible = sf.shadow.visible = false; po.rig.root.visible = true; sf.seat = po.seat = null; po.chopOn = sf.chopOn = false; po.grounded = sf.grounded = true; po.air = sf.air = 0;
      director = life();
    }
    updateActor(po, dt);
    if (sf.rig.root.visible) updateActor(sf, dt);
    world.updateMatrixWorld(true);
    updateProps(dt);
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
    slow = slow * 0.97 + (dt > 0.034 ? 1 : 0) * 0.03;
    if (slow > 0.6 && dpr > 1) { dpr = 1; renderer.setPixelRatio(1); resize(); slow = 0; }
    else if (slow > 0.8) { pause(); opts.onSlow && opts.onSlow(); }
  }
  function play() { if (running || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function pause() { running = false; cancelAnimationFrame(raf); }
  const onVis = () => (document.hidden ? pause() : play());
  document.addEventListener('visibilitychange', onVis);

  function setTheme(t) {
    const night = t !== 'light', bg = C(night ? 0x080b12 : 0xf7f5f0);
    scene.fog.color.copy(bg);
    renderer.toneMappingExposure = night ? 0.95 : 1.0;
    hemi.color.set(night ? 0x8ea0d8 : 0xeaf2ff); hemi.groundColor.set(night ? 0x1a1820 : 0x6a5a40); hemi.intensity = night ? 0.75 : 1.2;
    sunL.color.set(night ? 0xc0d0ff : 0xfff0d8); sunL.intensity = night ? 1.2 : 2.4;
    rimL.intensity = night ? 0.6 : 0.9;
    scenery.mistMat.color.set(night ? 0x3a4660 : 0xffffff); scenery.mistMat.opacity = night ? 0.6 : 0.85;
    scenery.sun.visible = !night; scenery.moon.visible = night;
    M.lantern.emissiveIntensity = night ? 2.2 : 0.15; T.light.intensity = night ? 14 : 0;
  }
  setTheme(opts.theme);
  play();

  return {
    setTheme,
    debug: { camera, scene, renderer, step, po, sf, run: name => { director = life(name === 'peekIn' ? peekIn : name === 'idle' ? function* () { for (;;) yield; } : ACTS[name][0]); } },
    stop() {
      pause();
      save();
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

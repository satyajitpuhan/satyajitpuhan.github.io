/* =============================================================================
   wolf.js — a lone black wolf that prowls the dark behind the content.

   Loaded on demand by site.js (section 16) when the visitor picks the wolf. Like
   dragon.js, everything is built here in code, so the only download is three.js.

   The wolf is one furred mesh, sculpted as a distance field in a standing pose and
   skinned to a skeleton (spine, neck, head, four legs, tail). The legs are placed
   by inverse kinematics: each paw stays planted on the ground while it carries
   weight and steps to a new footing when its turn in the gait comes (walk, trot,
   gallop), so the paws do not slide however the body moves.

   What it does: prowls with its head low, stops to sniff or to stare out at you,
   and now and then sits and howls at a moon that rises behind it. Move the mouse
   and it notices: it drops into a crouch, pins its ears, raises its hackles and
   stalks your cursor with its fangs bared, and if you keep teasing it, it lunges.
   Scroll hard and it snaps round to snarl at you. Sometimes it runs off and comes
   back later from the other side.

   export start(canvas, { theme, onReady, onSlow }) → { stop(), setTheme(theme) }
   ========================================================================== */
import * as THREE from './vendor/three.module.min.js';
import { TAU, sm, clamp, lerp, angDiff, rand, rnd, V, C, mix, canvasTex, radial, sculpt, mesh, SPH, ell, smin, sdfNormal, surfaceNet } from './kit.js';

const S = 3.4;                                   // wolf metres → scene units
const UP = V(0, 1, 0);

// smooth 3D value noise in 0..1, for the grizzle of the coat
const hash3 = (i, j, k) => { const n = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
function noise3(x, y, z) {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), u = sm(0, 1, x - i), v = sm(0, 1, y - j), w = sm(0, 1, z - k);
  const L = (a, b, t) => a + (b - a) * t, h = (a, b, c) => hash3(i + a, j + b, k + c);
  return L(L(L(h(0, 0, 0), h(1, 0, 0), u), L(h(0, 1, 0), h(1, 1, 0), u), v), L(L(h(0, 0, 1), h(1, 0, 1), u), L(h(0, 1, 1), h(1, 1, 1), u), v), w);
}

/* ---------------------------------------------------------------- fur, lit from behind by the moon */

// Shell fur as in kit.js (the mesh drawn again in layers, pushed out along its normals, keeping
// only the pixels on a strand), plus a cold rim where the coat turns away from the viewer, so a
// black wolf still shows its outline against a dark page.
const RIM = { value: C(0x9fb6ff) }, RIM_K = { value: 1 };
const furMats = new Map();
function furMaterial(layer, len, freq) {
  const key = `${layer}|${len}|${freq}`;
  if (furMats.has(key)) return furMats.get(key);
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uLayer: { value: layer }, uLen: { value: len }, uFreq: { value: freq }, uRim: RIM, uRimK: RIM_K });
    sh.vertexShader = 'uniform float uLayer, uLen, uFreq;\nattribute float bare;\nvarying vec3 vFur, vFurN;\nvarying float vBare;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvFur = position * uFreq; vFurN = normal; vBare = bare;\ntransformed += normal * (uLen * uLayer * (1.0 - bare));\ntransformed.y -= uLen * uLayer * uLayer * 0.35;');
    sh.fragmentShader = 'uniform float uLayer, uRimK;\nuniform vec3 uRim;\nvarying vec3 vFur, vFurN;\nvarying float vBare;\nfloat furHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\n' +
      sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      if (uLayer > 0.0) {
        if (vBare > 0.5) discard;
        vec3 c = floor(vFur), o = vec3(furHash(c), furHash(c + 17.3), furHash(c + 41.9)) * 0.6 + 0.2;
        float h = 0.45 + 0.55 * furHash(c + 7.1);
        float d = length(cross(fract(vFur) - o, normalize(vFurN)));
        if (uLayer > h || d > 0.85 * (1.0 - 0.75 * uLayer / h)) discard;
      }
      diffuseColor.rgb *= mix(0.85 + 0.3 * uLayer, 1.0, vBare);`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float fres = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
      totalEmissiveRadiance += uRim * uRimK * pow(fres, 2.6) * (0.25 + 0.75 * uLayer) * (1.0 - 0.7 * vBare);`);
  };
  m.customProgramCacheKey = () => 'wolf-fur';
  furMats.set(key, m);
  return m;
}
function furry(geo, parent, { len, layers, freq }) {
  const base = mesh(geo, furMaterial(0, len, freq), parent);
  for (let i = 1; i <= layers; i++) base.add(new THREE.Mesh(geo, furMaterial(i / layers, len, freq)));
  return base;
}

/* ---------------------------------------------------------------- the shape, standing (x forward, y up) */

// joints of the standing wolf, in metres; legs at z = ±FZ (front) and ±HZ (hind)
const FZ = 0.1, HZ = 0.095;
const FL = { sh: [0.40, 0.63], el: [0.31, 0.405], wr: [0.335, 0.125], paw: [0.352, 0.042], toe: [0.425, 0.024] };
const HL = { hip: [-0.40, 0.64], kn: [-0.285, 0.415], hk: [-0.47, 0.18], paw: [-0.452, 0.042], toe: [-0.38, 0.024] };
const TAIL = [[-0.56, 0.73], [-0.69, 0.63], [-0.80, 0.49], [-0.87, 0.34], [-0.91, 0.2]];
const SPINE = { hips: [-0.30, 0.68], spine: [0.0, 0.68], chest: [0.26, 0.70], neck: [0.46, 0.80], head: [0.70, 0.96] };
const JAW = [0.765, 0.912];                      // hinge of the lower jaw
const HS = 1.22;                                 // the head is drawn this much larger, about the head joint
const unHead = (x, y, z) => [SPINE.head[0] + (x - SPINE.head[0]) / HS, SPINE.head[1] + (y - SPINE.head[1]) / HS, z / HS];

// distance to a cone-capsule from a to b (2D points at height z) with radii r0 → r1
function seg(x, y, z, a, b, zc, r0, r1) {
  const bx = b[0] - a[0], by = b[1] - a[1], px = x - a[0], py = y - a[1], pz = z - zc;
  const t = clamp((px * bx + py * by) / (bx * bx + by * by), 0, 1);
  return Math.hypot(px - bx * t, py - by * t, pz) - (r0 + (r1 - r0) * t);
}

function headSdf(x, y, z) {
  let d = ell(x, y, z, 0.765, 0.985, 0, 0.12, 0.095, 0.09);                    // cranium
  d = smin(d, ell(x, y, z, 0.80, 0.94, 0, 0.095, 0.072, 0.085), 0.04);         // cheeks: heavy jaw muscles
  d = smin(d, ell(x, y, z, 0.955, 0.946, 0, 0.135, 0.05, 0.045), 0.05);        // a long muzzle
  d = smin(d, ell(x, y, z, 1.052, 0.95, 0, 0.032, 0.033, 0.031), 0.02);        // nose end
  d = smin(d, ell(x, y, z, 0.835, 1.012, 0, 0.06, 0.03, 0.066), 0.03);         // a low, heavy brow
  d = smin(d, ell(x, y, z, 0.72, 0.93, 0, 0.08, 0.1, 0.112), 0.05);            // ruff on the cheeks
  return Math.max(d, 0.902 - y - (1 - sm(0.8, 0.86, x)));                      // lip line: below it is the jaw's
}

function legSdf(x, y, z, s) {
  const fz = s * FZ, hz = s * HZ;
  let f = seg(x, y, z, FL.sh, FL.el, fz, 0.078, 0.056);
  f = smin(f, ell(x, y, z, 0.35, 0.5, fz, 0.075, 0.12, 0.062), 0.05);         // triceps
  f = smin(f, seg(x, y, z, FL.el, FL.wr, fz, 0.047, 0.03), 0.035);
  f = smin(f, ell(x, y, z, 0.31, 0.34, fz, 0.042, 0.07, 0.04), 0.03);          // forearm
  f = smin(f, seg(x, y, z, FL.wr, FL.paw, fz, 0.031, 0.028), 0.02);
  f = smin(f, ell(x, y, z, 0.383, 0.03, fz, 0.056, 0.03, 0.038), 0.025);       // paw
  let h = smin(seg(x, y, z, HL.hip, HL.kn, hz, 0.085, 0.056), ell(x, y, z, -0.36, 0.53, hz, 0.135, 0.15, 0.086), 0.05);   // thigh
  h = smin(h, seg(x, y, z, HL.kn, HL.hk, hz, 0.052, 0.027), 0.035);
  h = smin(h, ell(x, y, z, -0.355, 0.33, hz, 0.05, 0.085, 0.042), 0.03);       // gaskin
  h = smin(h, seg(x, y, z, HL.hk, HL.paw, hz, 0.029, 0.027), 0.02);
  h = smin(h, ell(x, y, z, -0.415, 0.03, hz, 0.056, 0.03, 0.038), 0.025);
  return { f, h };
}

function wolfSdf(x, y, z) {
  let d = ell(x, y, z, 0.30, 0.61, 0, 0.29, 0.25, 0.172);                      // deep chest
  d = smin(d, ell(x, y, z, 0.28, 0.775, 0, 0.24, 0.12, 0.15), 0.1);            // withers
  d = smin(d, ell(x, y, z, -0.04, 0.66, 0, 0.32, 0.15, 0.142), 0.14);          // waist, tucked up
  d = smin(d, ell(x, y, z, -0.36, 0.665, 0, 0.21, 0.165, 0.152), 0.1);         // hips
  if (x > 0.2) {
    d = smin(d, seg(x, y, z, [0.36, 0.72], [0.68, 0.95], 0, 0.165, 0.11), 0.08);   // neck
    d = smin(d, ell(x, y, z, 0.5, 0.82, 0, 0.17, 0.2, 0.168), 0.07);              // the ruff
  }
  if (x > 0.55) d = smin(d, HS * headSdf(...unHead(x, y, z)), 0.05);
  if (y < 0.78 && x > -0.7 && x < 0.55) {
    const L = legSdf(x, y, z, z >= 0 ? 1 : -1);
    d = smin(d, L.f, 0.07); d = smin(d, L.h, 0.07);
  }
  if (x < -0.42) {
    let t = seg(x, y, z, TAIL[0], TAIL[1], 0, 0.055, 0.075);
    t = smin(t, seg(x, y, z, TAIL[1], TAIL[2], 0, 0.075, 0.085), 0.04);
    t = smin(t, seg(x, y, z, TAIL[2], TAIL[3], 0, 0.085, 0.07), 0.04);
    t = smin(t, seg(x, y, z, TAIL[3], TAIL[4], 0, 0.07, 0.02), 0.04);
    d = smin(d, t, 0.05);
  }
  return d;
}

// lower jaw, in the space of its hinge
function jawSdf(x, y, z) {
  let d = seg(x, y, z, [0.0, -0.022], [0.28, -0.016], 0, 0.042, 0.025);
  d = smin(d, ell(x, y, z, 0.03, -0.03, 0, 0.07, 0.035, 0.055), 0.03);
  d = smin(d, ell(x, y, z, 0.262, -0.03, 0, 0.036, 0.022, 0.025), 0.02);      // chin
  return Math.max(d, y + 0.004);
}

// from outside along -dir to the surface
function toSurface(sdf, p, dir) {
  p = p.clone().addScaledVector(dir, 0.4);
  for (let i = 0; i < 120; i++) { const d = sdf(p.x, p.y, p.z); if (Math.abs(d) < 3e-4) break; p.addScaledVector(dir, -clamp(d, -0.01, 0.05)); }
  return { p, n: sdfNormal(sdf, p.x, p.y, p.z, 0.004) };
}

/* ---------------------------------------------------------------- building the wolf */

function buildWolf(small) {
  const root = new THREE.Group();

  /* bones */
  const bones = [], B = {};
  const bone = (name, at, parent) => {
    const b = new THREE.Bone(); b.name = name; b.userData.at = V(at[0], at[1], at[2] || 0);
    if (parent) { b.position.copy(b.userData.at).sub(parent.userData.at); parent.add(b); } else b.position.copy(b.userData.at);
    B[name] = b; bones.push(b); return b;
  };
  bone('hips', SPINE.hips);
  bone('spine', SPINE.spine, B.hips);
  bone('chest', SPINE.chest, B.spine);
  bone('neck', SPINE.neck, B.chest);
  bone('head', SPINE.head, B.neck);
  const legs = [];
  for (const s of [1, -1]) {
    const k = s > 0 ? 'L' : 'R';
    const chain = (names, J, z, parent) => names.reduce((c, nm, i) => [...c, bone(nm + k, [...J[i], z], i ? c[i - 1] : parent)], []);
    const f = chain(['sh', 'el', 'wr', 'fp'], [FL.sh, FL.el, FL.wr, FL.paw], s * FZ, B.chest);
    const h = chain(['hip', 'kn', 'hk', 'hp'], [HL.hip, HL.kn, HL.hk, HL.paw], s * HZ, B.hips);
    legs.push({ front: true, s, chain: f, toe: V(FL.toe[0], FL.toe[1], s * FZ) }, { front: false, s, chain: h, toe: V(HL.toe[0], HL.toe[1], s * HZ) });
  }
  const tail = [];
  for (let i = 0; i < 4; i++) tail.push(bone('t' + i, TAIL[i], i ? tail[i - 1] : B.hips));

  // the pieces of the skeleton each bone moves: a segment and a thickness
  const P3 = (p, z = 0) => V(p[0], p[1], z);
  const parts = [
    [B.hips, V(-0.62, 0.7, 0), V(-0.15, 0.68, 0), 0.16],
    [B.spine, V(-0.15, 0.68, 0), V(0.14, 0.69, 0), 0.15],
    [B.chest, V(0.14, 0.69, 0), V(0.42, 0.74, 0), 0.2],
    [B.neck, V(0.42, 0.76, 0), V(0.67, 0.93, 0), 0.15],
    [B.head, V(0.70, 0.97, 0), V(1.06, 0.95, 0), 0.08],
  ];
  for (const L of legs) {
    const J = L.front ? [FL.sh, FL.el, FL.wr, FL.paw, FL.toe] : [HL.hip, HL.kn, HL.hk, HL.paw, HL.toe], z = L.s * (L.front ? FZ : HZ);
    const r = L.front ? [0.07, 0.045, 0.03, 0.03] : [0.09, 0.05, 0.03, 0.03];
    for (let i = 0; i < 4; i++) parts.push([L.chain[i], P3(J[i], z), P3(J[i + 1], z), r[i]]);
  }
  for (let i = 0; i < 4; i++) parts.push([tail[i], P3(TAIL[i]), P3(TAIL[i + 1]), 0.075]);
  const segD = (p, a, b) => { const ab = tmpA.subVectors(b, a), t = clamp(tmpB.subVectors(p, a).dot(ab) / ab.lengthSq(), 0, 1); return tmpB.sub(ab.multiplyScalar(t)).length(); };
  const tmpA = V(), tmpB = V();
  const boneOf = new Map(bones.map((b, i) => [b, i]));
  function weights(p) {
    const sc = parts.map(([b, a, e, r]) => [boneOf.get(b), segD(p, a, e) - 0.8 * r]).sort((u, v) => u[1] - v[1]).slice(0, 4);
    const w = sc.map(([, s]) => Math.exp(-(s - sc[0][1]) / 0.028)), tot = w.reduce((u, v) => u + v, 0);
    return { idx: sc.map(u => u[0]), w: w.map(v => v / tot) };
  }

  /* colours: a black wolf, grizzled silver on the flanks and under the throat */
  const BLACK = C(0x111014), CHAR = C(0x2a292e), GREY = C(0x625f66), SILVER = C(0x98959c), LIP = C(0x080707), LID = C(0x0a090b), SCAR = C(0x6e4a47);
  const eyes = [];
  for (const s of [1, -1]) {
    const dir = V(0.5, 0.12, s * 0.86).normalize(), { p, n } = toSurface(headSdf, V(0.855, 0.99, 0), dir);
    eyes.push({ s, p, n });
  }
  const scarA = [0.80, 1.05], scarB = [0.885, 0.93];
  const colour = (X, Y, Z, n) => {
    const [x, y, z] = X > 0.6 ? unHead(X, Y, Z) : [X, Y, Z];
    const g = noise3(x * 45, y * 45, z * 45), h = noise3(x * 8 + 2, y * 8, z * 8);
    let c = mix(BLACK, CHAR, 0.25 + 0.75 * h);
    const flank = sm(0.8, 0.15, Math.abs(n.y)) * sm(0.3, 0.55, y) * sm(0.62, 0.45, x);
    const under = sm(-0.15, -0.7, n.y) * sm(0.32, 0.46, y) * sm(0.85, 0.7, x);
    const ruff = sm(0.38, 0.52, x) * sm(0.85, 0.7, x) * sm(0.3, -0.4, n.y);
    const legIn = y < 0.45 ? sm(0.2, 0.75, -Math.sign(z) * n.z) * 0.5 : 0;
    c = mix(c, GREY, 0.42 * under + 0.32 * flank * g + 0.5 * ruff * g + legIn * g);
    if (x > 0.62) c = mix(c, SILVER, 0.35 * sm(0.93, 0.9, y) * sm(0.86, 0.95, x) * g);   // grizzled muzzle
    if (x > 0.82 && y < 0.913) { c = LIP.clone(); c.bare = 1; }                         // black lips
    for (const e of eyes) if (Math.hypot(x - e.p.x, y - e.p.y, z - e.p.z) < 0.028) { c = LID.clone(); c.bare = 1; }
    if (z > 0.02) {                                                                       // an old scar down across the left eye
      const bx = scarB[0] - scarA[0], by = scarB[1] - scarA[1], t = clamp(((x - scarA[0]) * bx + (y - scarA[1]) * by) / (bx * bx + by * by), 0, 1);
      if (Math.hypot(x - scarA[0] - bx * t, y - scarA[1] - by * t) < 0.0065 * (1 - 0.5 * Math.abs(t - 0.5))) { c = SCAR.clone(); c.bare = 1; }
    }
    return c;
  };

  const cell = small ? 0.02 : 0.016;
  const geo = surfaceNet(wolfSdf, colour, [-1.02, -0.01, -0.3], [1.22, 1.17, 0.3], cell);
  const pos = geo.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), p = V();
  for (let i = 0; i < n; i++) {
    const { idx, w } = weights(p.fromBufferAttribute(pos, i));
    for (let k = 0; k < 4; k++) { si[i * 4 + k] = idx[k] ?? 0; sw[i * 4 + k] = w[k] ?? 0; }
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));

  const FUR = { len: 0.024, layers: small ? 5 : 8, freq: 110 };
  const body = new THREE.SkinnedMesh(geo, furMaterial(0, FUR.len, FUR.freq));
  body.add(B.hips); root.add(body);
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  body.bind(skeleton);
  body.frustumCulled = false;
  for (let i = 1; i <= FUR.layers; i++) {
    const sh = new THREE.SkinnedMesh(geo, furMaterial(i / FUR.layers, FUR.len, FUR.freq));
    sh.bind(skeleton, body.bindMatrix); sh.frustumCulled = false; body.add(sh);
  }

  /* the head's parts hang off the head bone, in its space */
  const at = B.head.userData.at, local = (x, y, z = 0) => V(x - at.x, y - at.y, z);
  const H = new THREE.Group(); H.scale.setScalar(HS); B.head.add(H);
  const jaw = new THREE.Group(); jaw.position.copy(local(...JAW)); H.add(jaw);
  const jawGeo = surfaceNet(jawSdf, (x, y, z, g) => {
    if (g.y > 0.6 && y > -0.012) { const c = C(0x5a1418); c.bare = 1; return c; }        // gums along the top
    if (y > -0.012) { const c = LIP.clone(); c.bare = 1; return c; }
    const k = noise3(x * 45, y * 45, z * 45);
    return mix(CHAR, GREY, 0.25 + 0.35 * k * sm(0.3, -0.6, g.y));
  }, [-0.1, -0.08, -0.09], [0.31, 0.01, 0.09], 0.008);
  furry(jawGeo, jaw, { len: 0.012, layers: small ? 3 : 5, freq: 90 });

  const mat = {
    mouth: new THREE.MeshStandardMaterial({ color: 0x220507, roughness: 0.55 }),
    tongue: new THREE.MeshStandardMaterial({ color: 0x5e161c, roughness: 0.4 }),
    gum: new THREE.MeshStandardMaterial({ color: 0x581218, roughness: 0.5 }),
    tooth: new THREE.MeshStandardMaterial({ color: 0xe9dfc6, roughness: 0.3 }),
    nose: new THREE.MeshPhysicalMaterial({ color: 0x0b0a0c, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.3 }),
    eye: new THREE.MeshStandardMaterial({ color: 0xffb32a, emissive: 0xff7a0a, emissiveIntensity: 2.2, roughness: 0.15 }),
    pupil: new THREE.MeshBasicMaterial({ color: 0x050303 }),
    lid: new THREE.MeshStandardMaterial({ color: 0x0b0a0d, roughness: 0.8 }),
    wrinkle: new THREE.MeshStandardMaterial({ color: 0x0d0c0f, roughness: 0.9 }),
  };
  mesh(SPH, mat.mouth, H, local(0.925, 0.905).toArray(), [0.14, 0.012, 0.038]);
  mesh(SPH, mat.tongue, jaw, [0.14, -0.006, 0], [0.13, 0.01, 0.028]);
  const gums = mesh(SPH, mat.gum, H, local(0.99, 0.902).toArray(), [0.08, 0.001, 0.042]);
  const tooth = new THREE.ConeGeometry(1, 1, 7); tooth.rotateX(Math.PI); tooth.translate(0, -0.5, 0);   // root at y = 0, tip at y = -1
  const fang = (parent, x, y, z, w, l, up) => { const t = mesh(tooth, mat.tooth, parent, [x, y, z], [w, l, w]); if (up) t.rotation.x = Math.PI; t.rotation.z = up ? 0.15 : -0.12; return t; };
  const upperTeeth = new THREE.Group(); H.add(upperTeeth);
  for (const s of [1, -1]) {
    fang(upperTeeth, ...local(1.016, 0.91, s * 0.034).toArray(), 0.0075, 0.046);            // long upper fangs
    for (let k = 0; k < 3; k++) fang(upperTeeth, ...local(1.05 - k * 0.002, 0.912, s * (0.006 + k * 0.009)).toArray(), 0.0035, 0.012);
    for (let k = 0; k < 5; k++) fang(upperTeeth, ...local(0.99 - k * 0.03, 0.909, s * (0.038 + k * 0.002)).toArray(), 0.005, 0.012 + (k === 3 ? 0.01 : 0));
    fang(jaw, 0.243, -0.002, s * 0.025, 0.0065, 0.032, true);                                // lower fangs
    for (let k = 0; k < 5; k++) fang(jaw, 0.205 - k * 0.032, -0.004, s * (0.028 + k * 0.002), 0.0045, 0.012, true);
  }
  // nose, with nostrils
  {
    const { p: np, n: nn } = toSurface(headSdf, V(1.02, 0.955, 0), V(1, 0.25, 0).normalize());
    const nose = mesh(SPH, mat.nose, H, local(np.x - 0.012, np.y - 0.003).toArray(), [0.024, 0.019, 0.026]);
    for (const s of [1, -1]) mesh(SPH, mat.pupil, H, local(np.x + 0.009, np.y - 0.006, s * 0.009).toArray(), [0.006, 0.005, 0.007]);
    nose.userData.n = nn;
  }
  // wrinkles across the top of the muzzle, that show when it snarls
  const wrinkles = [];
  for (let k = 0; k < 3; k++) {
    const x = 0.9 + k * 0.025, { p: wp } = toSurface(headSdf, V(x, 0.95, 0), UP);
    const w = mesh(new THREE.TorusGeometry(0.04 - k * 0.003, 0.0035, 5, 18, Math.PI * 0.9), mat.wrinkle, H, local(wp.x, wp.y - 0.04 + k * 0.003).toArray());
    w.rotation.set(0, Math.PI / 2, Math.PI * 0.05); w.scale.setScalar(0.001);
    wrinkles.push(w);
  }
  // eyes: glowing amber, round black pupils, and a heavy lid slanting down to the nose
  const glowTex = radial([[0, 'rgba(255,214,120,1)'], [0.18, 'rgba(255,150,30,.75)'], [0.5, 'rgba(255,90,0,.18)'], [1, 'rgba(255,60,0,0)']]);
  const glows = [], eyeBalls = [], lids = [];
  for (const e of eyes) {
    const c = e.p.clone().addScaledVector(e.n, -0.008), out = e.n;
    const ball = mesh(SPH, mat.eye, H, local(c.x, c.y, c.z).toArray(), 0.0165); eyeBalls.push(ball);
    const pp = c.clone().addScaledVector(out, 0.0145);
    const pupil = mesh(SPH, mat.pupil, H, local(pp.x, pp.y, pp.z).toArray(), [0.006, 0.006, 0.006]);
    pupil.scale.setScalar(0.0048);
    const lid = new THREE.Group(); lid.position.copy(local(c.x, c.y, c.z)); H.add(lid);
    const lm = mesh(new THREE.SphereGeometry(0.0185, 20, 10, 0, TAU, 0, Math.PI * 0.5), mat.lid, lid);
    lid.quaternion.setFromUnitVectors(UP, V(0.25, 1, 0).normalize());
    lid.rotateOnWorldAxis(out.clone(), -e.s * 0.5);
    lid.userData.base = lid.quaternion.clone(); lid.userData.out = out.clone(); lids.push(lid);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
    glow.position.copy(local(c.x, c.y, c.z).addScaledVector(out, 0.012)); H.add(glow); glows.push(glow);
    lm.renderOrder = 1;
  }
  // ears: tall, pointed, set back on the skull; the left one torn
  const ears = [];
  for (const s of [1, -1]) {
    const torn = s > 0;
    const g = sculpt((x, y, z) => {
      const t = (y + 1) / 2;
      let W = 0.05 * Math.pow(1 - t, 0.8), X = x * 0.04 * Math.pow(1 - t, 0.9);
      if (x > 0) X *= 0.2;                                                     // hollow in front
      let Z = z * W;
      if (torn && t > 0.42 && t < 0.62 && z * s < -0.2) Z *= 0.45;            // a bite out of the edge
      return [X, t * 0.128, Z];
    }, (x, y, z) => (x > 0.3 ? C(0x3a3036) : mix(BLACK, CHAR, 0.4)), 18, 16);
    const pivot = new THREE.Group(); pivot.position.copy(local(0.715, 1.055, s * 0.058)); H.add(pivot);
    const tilt = new THREE.Group(); tilt.rotation.x = s * 0.32; pivot.add(tilt);
    furry(g, tilt, { len: 0.008, layers: small ? 2 : 4, freq: 120 });
    ears.push(pivot);
  }

  /* hackles: long guard hairs along the ruff and the spine, that rise when it is angry */
  const lockGeo = new THREE.ConeGeometry(0.07, 1, 5, 6, true); lockGeo.translate(0, 0.5, 0);
  {
    const lp = lockGeo.attributes.position, cols = [];
    for (let i = 0; i < lp.count; i++) {
      const y = lp.getY(i); lp.setX(i, lp.getX(i) + 0.3 * y * y);
      const c = mix(C(0x161519), C(0x8e8b94), sm(0.4, 1, y)); cols.push(c.r, c.g, c.b);
    }
    lockGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    lockGeo.computeVertexNormals();
  }
  const axisY = x => x < 0 ? 0.67 : x < 0.3 ? lerp(0.67, 0.7, x / 0.3) : lerp(0.7, 0.96, sm(0.3, 0.72, x));
  const locks = [];
  const nLocks = small ? 150 : 280;
  for (let k = 0; k < nLocks; k++) {
    const r = rand();
    let x, th, len;
    if (r < 0.42) { x = 0.42 + rand() * 0.25; th = (rand() * 2 - 1) * 1.7; len = 0.045 + rand() * 0.04; }        // ruff
    else if (r < 0.7) { x = 0.12 + rand() * 0.3; th = (rand() * 2 - 1) * 0.9; len = 0.035 + rand() * 0.03; }     // shoulders
    else if (r < 0.9) { x = -0.5 + rand() * 0.62; th = (rand() * 2 - 1) * 0.4; len = 0.025 + rand() * 0.02; }   // along the spine
    else { x = 0.68 + rand() * 0.08; th = (rand() < 0.5 ? -1 : 1) * (1.0 + rand() * 1.0); len = 0.035 + rand() * 0.025; }   // cheeks
    const dir = V(0, Math.cos(th), Math.sin(th)), { p: lp, n: ln } = toSurface(wolfSdf, V(x, axisY(x), 0), dir);
    const side = V().crossVectors(ln, V(-1, 0, 0)).normalize();
    const back = V().crossVectors(side, ln).normalize();                       // along the skin, towards the tail
    if (x > 0.68) back.addScaledVector(UP, -0.6).normalize();                  // cheek ruff sweeps back and down
    locks.push({ b: weights(lp).idx[0], p: lp.addScaledVector(ln, -0.006), n: ln, back, side, len, w: 1 + rand() * 1.2, seed: rand() * 9, rest: 0.1 + rand() * 0.15 });
  }
  const lockMesh = new THREE.InstancedMesh(lockGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }), locks.length);
  lockMesh.frustumCulled = false;

  return { root, body, skeleton, bones, B, legs, tail, jaw, ears, glows, eyeBalls, lids, wrinkles, gums, upperTeeth, locks, lockMesh, mat };
}

/* ---------------------------------------------------------------- the moon it howls at */

const moonTex = () => canvasTex(512, 512, (c, W) => {
  const r = W * 0.2, cx = W / 2, cy = W / 2;
  const halo = c.createRadialGradient(cx, cy, r * 0.9, cx, cy, W / 2);
  halo.addColorStop(0, 'rgba(210,225,255,.35)'); halo.addColorStop(0.3, 'rgba(170,190,240,.1)'); halo.addColorStop(1, 'rgba(150,170,230,0)');
  c.fillStyle = halo; c.fillRect(0, 0, W, W);
  const g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#fbf8ef'); g.addColorStop(0.7, '#e6e2d6'); g.addColorStop(1, '#c9c6bd');
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
  c.save(); c.clip();
  for (let i = 0; i < 26; i++) {                                             // maria and craters
    const a = rand() * TAU, d = Math.sqrt(rand()) * r * 0.85, cr = r * (0.05 + rand() * (i < 6 ? 0.3 : 0.1));
    c.fillStyle = `rgba(120,120,125,${i < 6 ? 0.22 : 0.16})`;
    c.beginPath(); c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, cr, 0, TAU); c.fill();
  }
  c.restore();
});

/* ---------------------------------------------------------------- start */

export function start(canvas, opts = {}) {
  const small = Math.min(innerWidth, innerHeight) < 600;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  let dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 400);
  const tanH = Math.tan(THREE.MathUtils.degToRad(17.5));

  const hemi = new THREE.HemisphereLight(0xc4cfe6, 0x1c1814, 1.4); scene.add(hemi);
  const moonL = new THREE.DirectionalLight(0xdfe8ff, 3); moonL.position.set(-14, 22, 14); scene.add(moonL);
  const rimL = new THREE.DirectionalLight(0xa9c6ff, 3.2); rimL.position.set(12, 9, -20); scene.add(rimL);
  const rimL2 = new THREE.DirectionalLight(0x8fb0ff, 1.6); rimL2.position.set(-16, 6, -14); scene.add(rimL2);

  const W = buildWolf(small);
  scene.add(W.root, W.lockMesh);
  W.root.scale.setScalar(S);
  const { B, legs, tail, jaw, ears, glows, wrinkles, gums, locks, lockMesh } = W;

  // a soft shadow on the ground, and mist drifting low
  const shadow = mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(0,0,0,.5)'], [0.5, 'rgba(0,0,0,.24)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }), scene);
  shadow.renderOrder = -1;
  const mistTex = canvasTex(256, 256, (c, w) => {                     // a soft, wide falloff, so no rings show
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    for (let i = 0; i <= 12; i++) { const u = i / 12; g.addColorStop(u, `rgba(255,255,255,${(0.55 * Math.exp(-4.5 * u * u) * (1 - u)).toFixed(3)})`); }
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  });
  const mists = [];
  for (let i = 0; i < (small ? 7 : 12); i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, transparent: true, depthWrite: false, opacity: 0 }));
    m.userData = { x: (rand() * 2 - 1) * 30, z: -24 + rand() * 32, v: 0.3 + rand() * 0.5, o: 0.5 + rand() * 0.5 };
    m.scale.set(16 + rand() * 14, 3 + rand() * 2.5, 1); scene.add(m); mists.push(m);
  }
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(), transparent: true, depthWrite: false, opacity: 0, fog: false }));
  moon.scale.setScalar(30); scene.add(moon);

  /* ---------------------------------------------------------------- layout */
  let aspect = 1, camK = 1;
  const Z0 = -22, Z1 = 9;                                   // how far back and how near it comes
  const camDist = z => Math.hypot(camera.position.y, camera.position.z - z);
  const xLim = z => Math.max(3, camDist(z) * tanH * aspect - 4);
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    aspect = w / h; camera.aspect = aspect;
    camK = Math.max(1, Math.pow(1.3 / aspect, 0.6));
    camera.position.set(0, 8 * camK, 31 * camK);
    camera.lookAt(0, 1.5, -4);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const down = Math.atan2(camera.position.y - 1.5, camera.position.z + 4), D = camera.position.z + 150;   // high in the sky, near the top of the screen
    moon.position.set(D * tanH * aspect * 0.5, camera.position.y + D * Math.tan(THREE.MathUtils.degToRad(17.5 * 0.66) - down), -150);
  }
  resize();

  /* ---------------------------------------------------------------- input */
  let clock = 0, interest = 0, lastMove = -99, lastScroll = -99, scrollKick = 0;
  const ptr = { x: 0, y: 0, has: false }, cursor = V(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const ground = new THREE.Plane(UP, 0);
  function aimCursor() {
    ndc.set(ptr.x / innerWidth * 2 - 1, -(ptr.y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(ground, cursor) || cursor.z < Z0 - 6) ray.ray.at((camera.position.z - Z0 + 6) / Math.max(0.2, -ray.ray.direction.z), cursor);
    cursor.y = 0;
    cursor.z = clamp(cursor.z, Z0 - 4, Z1 + 4);
  }
  const onMove = e => {
    if (ptr.has) interest += Math.min(120, Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y)) * 0.0028;
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true; lastMove = clock;
  };
  let scrollY = window.scrollY;
  const onScroll = () => { const y = window.scrollY; scrollKick += Math.abs(y - scrollY); scrollY = y; lastScroll = clock; };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize);

  /* ---------------------------------------------------------------- the body's state */
  const pos = V(), vel = V(), goal = V(), head = V(), tmp = V(), tmp2 = V();
  let yaw = 0, yawRate = 0, speed = 0, want = 0, bend = 0;
  // pose: eased towards targets; crouch and sit fold the legs, the rest are angles or 0..1 amounts
  const POSE = { crouch: 0, sit: 0, neck: -0.3, head: 0.2, jaw: 0.04, snarl: 0, ears: 0.6, hackles: 0.15, tail: -0.1, lift: 0, glow: 0.7 };
  const pose = { ...POSE }, aim = { ...POSE };
  const look = { at: null, w: 0, cam: false };            // head turns to a point (or the camera)
  let lookY = 0, lookP = 0;

  /* legs: where each paw rests under the body, its place in the gait, and where it is planted */
  for (const L of legs) {
    const paw = L.chain[3].userData.at;
    L.home = V(paw.x, 0, paw.z); L.F = V(); L.swing = false; L.liftAmt = 0; L.from = V();
    const c = L.chain.map(b => b.position), toe = V().subVectors(L.toe, L.chain[3].userData.at);
    L.len = [c[1].length(), c[2].length(), c[3].length()];
    L.bind = [Math.atan2(c[1].y, c[1].x), Math.atan2(c[2].y, c[2].x), Math.atan2(c[3].y, c[3].x), Math.atan2(toe.y, toe.x)];
    L.key = (L.front ? 'F' : 'H') + (L.s > 0 ? 'L' : 'R');
  }
  const GAITS = {
    walk: { off: { HL: 0, FL: 0.25, HR: 0.5, FR: 0.75 }, duty: 0.68, stride: 0.72, lift: 0.06 },
    trot: { off: { FL: 0, HR: 0.02, FR: 0.5, HL: 0.52 }, duty: 0.46, stride: 1.05, lift: 0.08 },
    gallop: { off: { HL: 0, HR: 0.1, FL: 0.5, FR: 0.6 }, duty: 0.3, stride: 2.5, lift: 0.14 },
  };
  let gaitName = 'walk', phase = 0, airW = 0, hop = 0;
  const homeWorld = (L, out) => {
    out.copy(L.home);
    if (L.front) out.x += pose.sit * 0.02 - pose.crouch * 0.03;
    else out.x += pose.sit * 0.2 + pose.crouch * 0.02;
    out.z *= 1 + pose.sit * 0.25;
    out.y = L.chain[3].userData.at.y;
    return W.root.localToWorld(out);
  };
  function placeFeet() { for (const L of legs) { homeWorld(L, L.F); L.swing = false; } }

  /* ---------------------------------------------------------------- what it does */
  let mode = 'enter', t = 0, until = 0, lastHowl = clock - 25, lastLunge = -99, wait = 0, glanceAt = 5, sub = 0, side = 1;
  const pickWaypoint = () => {
    const z = lerp(Z0 + 2, Z1 - 3, Math.pow(rand(), 0.8));
    goal.set((rand() * 2 - 1) * xLim(z) * 0.85, 0, z);
  };
  function enterFrom(s) {
    side = s;
    const z = lerp(Z0 + 4, Z1 - 4, rand());
    pos.set(s * (xLim(z) + 14), 0, z); yaw = s > 0 ? Math.PI : 0;
    goal.set(s * xLim(z) * (0.2 + rand() * 0.4), 0, z + (rand() - 0.5) * 6);
    applyRoot(); placeFeet();
    go('enter');
  }
  function go(m, d = 0) { mode = m; t = 0; until = d; sub = 0; }
  const offScreen = () => Math.abs(pos.x) > xLim(pos.z) + 9;

  function behave(dt) {
    t += dt;
    interest *= Math.exp(-dt * 0.6);
    scrollKick *= Math.exp(-dt * 2.5);
    Object.assign(aim, POSE);
    look.at = null; look.cam = false;
    const calm = mode === 'enter' || mode === 'roam' || mode === 'pause';
    // something to stalk: the mouse is moving about
    if (calm && interest > 1.1 && clock - lastLunge > 12 && ptr.has) { interest = 0; go('stalk'); }
    // a hard scroll: it whips round and snarls at you
    if ((calm || mode === 'howl') && scrollKick > 900 && !offScreen()) { scrollKick = 0; go('startle'); }

    if (mode === 'enter' || mode === 'roam') {
      want = mode === 'enter' ? 5.6 : 2.5;
      if (pos.distanceTo(goal) < 1.6) {
        if (mode === 'enter') { go('roam'); pickWaypoint(); }
        else { go('pause', 2.5 + rnd() * 2.5); sub = rnd(); }
      }
      if (clock > glanceAt) { look.cam = true; if (clock > glanceAt + 1.8) glanceAt = clock + 6 + rnd() * 8; }
    } else if (mode === 'pause') {
      want = 0;
      if (sub < 0.35) { aim.neck = -0.95; aim.head = -0.25; aim.ears = 0.8; }                          // sniffs the ground
      else if (sub < 0.7) { look.cam = true; aim.snarl = sm(0.8, 1.6, t) * 0.45; aim.glow = 1; aim.hackles = 0.4; }   // stares at you
      else { look.at = tmp2.set(pos.x + Math.sin(t * 1.3) * 12, 2, pos.z + 6); }                        // looks about
      if (t > until) {
        const r = rnd();
        if (clock - lastHowl > 50 && r < 0.4) go('howl');
        else if (r > 0.85) { go('run'); side = pos.x > 0 ? 1 : -1; const z = pos.z + (rnd() - 0.5) * 8; goal.set(side * (xLim(z) + 16), 0, z); }
        else { go('roam'); pickWaypoint(); }
      }
    } else if (mode === 'howl') {
      want = 0; aim.sit = sm(0, 1, t);
      if (t > 1.1 && t < 5.4) { const k = sm(1.1, 1.8, t) * (1 - sm(4.8, 5.4, t)); aim.neck = lerp(-0.3, 0.42, k); aim.head = lerp(0.2, 0.42, k); aim.jaw = 0.04 + k * (0.36 + 0.05 * Math.sin(t * 7)); aim.ears = lerp(0.6, -0.3, k); }
      if (t > 6.4) aim.sit = 1 - sm(6.4, 7.2, t);
      if (t > 7.4) { lastHowl = clock; go('roam'); pickWaypoint(); }
    } else if (mode === 'run') {
      want = 13; aim.ears = -0.7; aim.tail = -0.35; aim.neck = -0.2; aim.head = 0.05;
      if (offScreen()) go('away', 3 + rnd() * 5);
    } else if (mode === 'away') {
      want = 0; speed = 0;
      if (t > until) enterFrom(rnd() < 0.65 ? -side : side);
    } else if (mode === 'stalk') {
      aimCursor(); goal.copy(cursor);
      const d = pos.distanceTo(goal);
      want = d > 9 ? 2.4 : d > 4.5 ? 1.3 : 0;
      Object.assign(aim, { crouch: 0.6, neck: -0.62, head: 0.4, snarl: 0.75, ears: -1, hackles: 1, tail: -0.3, glow: 1.25 });
      aim.jaw = 0.1 + 0.015 * Math.sin(clock * 38);                    // a growl
      look.at = tmp2.copy(cursor).setY(1.2);
      if (d < 10 && clock - lastMove < 0.5 && t > 1.6) { go('lunge'); goal.copy(cursor); }
      else if (clock - lastMove > 4.5 || t > 16) go('stare');
    } else if (mode === 'lunge') {
      look.at = tmp2.copy(goal).setY(1.4);
      Object.assign(aim, { crouch: 0.9, neck: -0.55, head: 0.45, snarl: 1, ears: -1, hackles: 1, tail: -0.25, glow: 1.6, jaw: 0.14 });
      if (t < 0.4) want = 0;
      else if (t < 0.95) {                                                // the leap
        const k = (t - 0.4) / 0.55;
        if (sub === 0) { sub = 1; tmp.subVectors(goal, pos).setY(0); const dd = tmp.length(); goal.copy(pos).addScaledVector(tmp.normalize(), clamp(dd, 4, 9)); }
        want = 16; speed = 16; aim.crouch = 0; airW = 1; hop = Math.sin(Math.PI * k) * 0.3;
        aim.jaw = k < 0.7 ? 0.62 : 0.05;
      } else {
        airW = 0; hop = 0; want = 0;
        if (t > 1.0 && sub === 1) { sub = 2; speed *= 0.2; placeFeet(); }
        if (t > 1.3) { lastLunge = clock; go('standoff', 1.8); }
      }
    } else if (mode === 'standoff' || mode === 'stare' || mode === 'startle') {
      want = 0;
      Object.assign(aim, { crouch: 0.45, neck: -0.5, head: 0.4, snarl: 1, ears: -1, hackles: 1, tail: -0.3, glow: 1.45 });
      aim.jaw = 0.14 + 0.02 * Math.sin(clock * 41);
      if (mode === 'standoff' && ptr.has) { aimCursor(); look.at = tmp2.copy(cursor).setY(1.2); } else look.cam = true;
      if (t > (mode === 'startle' ? 2.2 : mode === 'stare' ? 2.6 : until)) { lastLunge = Math.max(lastLunge, clock - 4); go('roam'); pickWaypoint(); }
    }
    look.w += ((look.at || look.cam ? 1 : 0) - look.w) * (1 - Math.exp(-dt * 4));
  }

  /* ---------------------------------------------------------------- moving the body */
  function applyRoot() {
    W.root.position.set(pos.x, 0, pos.z);
    W.root.rotation.y = yaw;
    W.root.updateMatrixWorld(true);
  }

  function locomote(dt) {
    if (mode === 'away') return;
    tmp.subVectors(goal, pos).setY(0);
    const dist = tmp.length();
    let turn = 0;
    if (mode === 'stalk' || mode === 'standoff' || mode === 'stare' || mode === 'startle' || (mode === 'lunge' && t < 0.4)) {
      // face what it is snarling at
      const tgt = mode === 'stare' || mode === 'startle' ? tmp.set(camera.position.x - pos.x, 0, camera.position.z - pos.z) : tmp;
      if (tgt.lengthSq() > 0.01) turn = angDiff(yaw, Math.atan2(-tgt.z, tgt.x));
      if (mode !== 'stalk') turn *= (mode === 'stare' || mode === 'startle') ? 0.35 : 1;
    } else if (dist > 0.3) turn = angDiff(yaw, Math.atan2(-tmp.z, tmp.x));
    const rate = mode === 'run' ? 2.4 : mode === 'lunge' ? (t < 0.4 ? 3 : 0) : 1.7;
    const dy = clamp(turn, -rate * dt, rate * dt);
    yaw += dy;
    yawRate += (dy / Math.max(dt, 1e-4) - yawRate) * (1 - Math.exp(-dt * 6));
    let target = want;
    if (mode !== 'lunge') target *= sm(0, mode === 'stalk' ? 1.5 : 3, dist) * Math.max(0.15, Math.cos(turn));
    speed += (target - speed) * (1 - Math.exp(-dt * (mode === 'lunge' ? 12 : 2.6)));
    vel.set(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(speed);
    pos.addScaledVector(vel, dt);
    if (mode !== 'run' && mode !== 'enter') pos.z = clamp(pos.z, Z0, Z1);
    applyRoot();
  }

  function gaitStep(dt) {
    const v = speed / S;                                                      // metres a second
    const next = v > (gaitName === 'gallop' ? 2.3 : 2.7) ? 'gallop' : v > (gaitName === 'walk' ? 1.25 : 1.05) ? 'trot' : 'walk';
    gaitName = next;
    const G = GAITS[gaitName];
    let far = false, swinging = false;
    for (const L of legs) {
      if (L.swing) swinging = true;
      if (homeWorld(L, tmp).distanceTo(L.F) > 0.07 * S) far = true;
    }
    const f = Math.max(v / G.stride, 1.1);
    if (v > 0.05 || swinging || far) phase = (phase + dt * f) % 1;
    for (const L of legs) {
      const p = (phase + G.off[L.key] + 1) % 1, stanceT = G.duty / f;
      if (p < G.duty) {
        if (L.swing) { L.swing = false; L.F.y = L.chain[3].userData.at.y * S; }
        L.liftAmt += (0 - L.liftAmt) * Math.min(1, dt * 20);
        continue;
      }
      if (!L.swing) { L.swing = true; L.from.copy(L.F); }
      const u = (p - G.duty) / (1 - G.duty), remain = (1 - u) * (1 - G.duty) / f;
      homeWorld(L, tmp).addScaledVector(vel, remain + stanceT * (gaitName === 'gallop' ? 0.62 : 0.5));
      const k = Math.min(1, dt / Math.max(remain, dt));
      L.F.x += (tmp.x - L.F.x) * k; L.F.z += (tmp.z - L.F.z) * k;
      const lift = Math.sin(Math.PI * u);
      L.F.y = (L.chain[3].userData.at.y + G.lift * lift * (0.5 + 0.5 * sm(0.1, 0.8, v))) * S;
      L.liftAmt = lift * sm(0.02, 0.3, v + (far ? 0.3 : 0));
    }
  }

  // two bones to reach the wrist (or hock), then the pastern and the paw at set angles
  const Fw = V(), Pl = V();
  function solveLeg(L, pitch) {
    const [b0, b1, b2, b3] = L.chain, parent = b0.parent;
    Fw.copy(L.F);
    if (airW > 0) {                                                           // in the air: front legs reach, hind legs stretch back
      tmp.set(L.front ? 0.62 : -0.72, L.front ? 0.3 : 0.24, L.s * (L.front ? FZ : HZ));
      W.root.localToWorld(tmp);
      Fw.lerp(tmp, airW);
    }
    parent.worldToLocal(Pl.copy(Fw));
    // the pastern: near upright under weight, folded back as the paw swings through
    const lift = L.liftAmt * (1 - airW);
    let a3 = L.front ? -1.33 - 1.7 * lift - 0.35 * pose.crouch : -1.42 - 0.5 * lift + pose.sit * 1.45;
    if (airW) a3 = lerp(a3, L.front ? -0.4 : -2.6, airW);
    const a3l = a3 - pitch;
    const wx = Pl.x - L.len[2] * Math.cos(a3l), wy = Pl.y - L.len[2] * Math.sin(a3l);
    const dx = wx - b0.position.x, dy = wy - b0.position.y, dz = Pl.z - b0.position.z;
    const alpha = clamp(Math.atan2(-dz, -dy), -0.35, 0.35);
    const tx = dx, ty = -Math.hypot(dy, dz);
    const L1 = L.len[0], L2 = L.len[1];
    const d = clamp(Math.hypot(tx, ty), Math.abs(L1 - L2) + 1e-3, (L1 + L2) * 0.999);
    const A = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), aT = Math.atan2(ty, tx);
    const a1 = L.front ? aT - A : aT + A;
    const a2 = Math.atan2(ty - L1 * Math.sin(a1), tx - L1 * Math.cos(a1));
    const a4 = lerp(-0.14, a3 + (L.front ? 0.9 : 0.5), Math.max(lift, airW * 0.6)) - pitch;
    b0.rotation.set(alpha, 0, a1 - L.bind[0]);
    b1.rotation.z = (a2 - L.bind[1]) - (a1 - L.bind[0]);
    b2.rotation.z = (a3l - L.bind[2]) - (a2 - L.bind[1]);
    b3.rotation.z = (a4 - L.bind[3]) - (a3l - L.bind[2]);
  }

  const m4 = new THREE.Matrix4(), m5 = new THREE.Matrix4(), sc = V(), bx = V(), by = V(), bz = V();
  const skinM = W.bones.map(() => new THREE.Matrix4());

  function pose3d(dt) {
    const k = 1 - Math.exp(-dt * 5);
    for (const key in pose) pose[key] += (aim[key] - pose[key]) * k;
    if (mode === 'lunge' && t > 0.4 && t < 0.95) pose.jaw += (aim.jaw - pose.jaw) * (1 - Math.exp(-dt * 30));   // the snap is quick
    const v = speed / S, G = GAITS[gaitName], ph = phase * TAU;
    const gallop = gaitName === 'gallop' ? sm(1.8, 2.8, v) : 0, trot = gaitName === 'trot' ? 1 : 0;

    // body: lower for crouch and sit, pitched up to sit, rocking and flexing at the gallop
    const bob = (0.006 + 0.01 * trot) * Math.cos(2 * ph) * sm(0.05, 0.4, v) + gallop * (0.045 * Math.sin(ph - 0.6) - 0.05);
    B.hips.position.y = SPINE.hips[1] - 0.11 * pose.crouch - 0.45 * pose.sit + bob + hop;
    B.hips.position.x = SPINE.hips[0] + 0.08 * pose.sit;
    const pitch = 0.62 * pose.sit + gallop * 0.14 * Math.sin(ph) - 0.04 * pose.crouch;
    B.hips.rotation.z = pitch;
    bend += (clamp(yawRate * 0.3, -0.4, 0.4) - bend) * (1 - Math.exp(-dt * 4));
    const flex = gallop * 0.3 * Math.sin(ph + 0.4);
    B.spine.rotation.set(0, bend * 0.35, flex);
    B.chest.rotation.set(0, bend * 0.4, -flex * 0.6 - 0.12 * pose.sit + 0.05 * Math.sin(clock * 1.7) * 0.2);

    // neck and head: posture, then turned towards whatever it is looking at
    W.root.updateMatrixWorld(true);
    let ty = 0, tp = 0;
    if (look.at || look.cam) {
      head.setFromMatrixPosition(B.head.matrixWorld);
      const target = look.cam ? tmp.copy(camera.position) : tmp.copy(look.at);
      B.chest.worldToLocal(target); B.chest.worldToLocal(head);
      target.sub(head);
      ty = clamp(Math.atan2(-target.z, target.x), -1.25, 1.25);
      tp = clamp(Math.atan2(target.y, Math.hypot(target.x, target.z)), -0.8, 0.7);
    }
    lookY += (ty * look.w - lookY) * (1 - Math.exp(-dt * 6)); lookP += (tp - lookP) * (1 - Math.exp(-dt * 6));
    const neckP = pose.neck - 0.5 * pitch, hp = lerp(pose.head, clamp(lookP - neckP, -0.9, 1.0), look.w * 0.85);
    B.neck.rotation.set(0, lookY * 0.45, neckP + gallop * 0.08 * Math.sin(ph + 1.5));
    B.head.rotation.set(-lookY * 0.12, lookY * 0.55, hp - (mode === 'lunge' && t > 0.4 && t < 0.95 ? 0.2 : 0));
    jaw.rotation.z = -pose.jaw;

    // ears: pricked forward, laid back flat when it snarls or runs
    for (const e of ears) e.rotation.set(0, 0, lerp(-1.05, 0.15, (pose.ears + 1) / 2));
    // snarl: wrinkled muzzle, bared gums, the eyes narrowed and burning
    for (const w of wrinkles) w.scale.setScalar(0.001 + pose.snarl);
    gums.scale.y = 0.001 + 0.006 * pose.snarl;
    W.upperTeeth.position.y = -0.003 * pose.snarl;
    const flick = 0.92 + 0.08 * Math.sin(clock * 9.1) * Math.sin(clock * 3.7);
    glows.forEach(g => { g.material.opacity = clamp(pose.glow * 0.7 * glowK * flick, 0, 1); g.scale.setScalar(0.05 + 0.035 * pose.glow); });
    W.mat.eye.emissiveIntensity = (1.4 + 1.4 * pose.glow) * eyeK;

    // tail: low and straight when it means business, swaying as it walks
    const sway = Math.sin(ph) * 0.12 * sm(0.05, 0.5, v) + Math.sin(clock * 0.9) * 0.04;
    // (rotating a tail bone positive swings it down)
    tail.forEach((b, i) => b.rotation.set(0, sway * (0.6 + i * 0.3) - bend * 0.3, (pose.tail - gallop * (0.3 + 0.1 * Math.sin(ph))) * (i ? 0.45 : 1) - pose.sit * (i ? -0.12 : 1.05)));   // sitting, it lies along the ground

    W.root.updateMatrixWorld(true);
    for (const L of legs) solveLeg(L, L.front ? pitch + B.spine.rotation.z + B.chest.rotation.z : pitch);
    W.root.updateMatrixWorld(true);

    // hackles
    W.bones.forEach((b, i) => skinM[i].multiplyMatrices(b.matrixWorld, W.skeleton.boneInverses[i]));
    const raise = pose.hackles;
    locks.forEach((h, i) => {
      const r = clamp(h.rest + raise * 0.42 + Math.sin(clock * 5 + h.seed) * 0.03, 0, 1);
      by.copy(h.back).lerp(h.n, r).normalize();
      bx.crossVectors(h.side, by).normalize();
      bz.crossVectors(bx, by);
      const L = h.len * (1 + 0.25 * raise);
      m4.makeBasis(bx, by, bz).scale(sc.set(L, L, L * h.w)).setPosition(h.p);
      m5.multiplyMatrices(skinM[h.b], m4);
      lockMesh.setMatrixAt(i, m5);
    });
    lockMesh.instanceMatrix.needsUpdate = true;

    // shadow under the body
    shadow.position.set(pos.x - Math.cos(yaw) * 0.05 * S, 0.02, pos.z + Math.sin(yaw) * 0.05 * S);
    shadow.rotation.y = yaw;
    shadow.scale.set(1.7 * S, 1, 0.55 * S * (1 - 0.4 * hop));
    shadow.visible = mode !== 'away';
  }

  /* ---------------------------------------------------------------- loop */
  let glowK = 1, eyeK = 1, mistC = C(0x9aa8c4), mistO = 0.12;
  function step(dt) {
    clock += dt;
    behave(dt);
    locomote(dt);
    gaitStep(dt);
    pose3d(dt);
    const howl = mode === 'howl' ? sm(0.5, 2.5, t) * (1 - sm(6.2, 7.4, t)) : 0;
    moon.material.opacity += (howl * 0.95 - moon.material.opacity) * (1 - Math.exp(-dt * 1.5));
    moon.visible = moon.material.opacity > 0.01;
    for (const m of mists) {
      const u = m.userData; u.x += u.v * dt;
      const lim = xLim(u.z) + 18; if (u.x > lim) u.x = -lim;
      m.position.set(u.x, 0.9, u.z);
      m.material.color.copy(mistC); m.material.opacity = mistO * u.o * (0.75 + 0.25 * Math.sin(clock * 0.3 + u.z)); m.visible = mistO > 0;
    }
  }

  // carry it over from the previous page, so it keeps prowling instead of coming in again
  const KEY = 'sp-wolf-state';
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify({ x: +pos.x.toFixed(2), z: +pos.z.toFixed(2), yaw: +yaw.toFixed(3), lastHowl: lastHowl - clock })); } catch (e) {} }
  let restored = false;
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (s && Math.abs(s.x) < xLim(s.z) + 2) { pos.set(s.x, 0, s.z); yaw = s.yaw; lastHowl = Math.max(-40, s.lastHowl || 0); restored = true; }
  } catch (e) {}
  if (restored) { applyRoot(); pose3d(0.016); placeFeet(); go('roam'); pickWaypoint(); }
  else { pose3d(0.016); enterFrom(rand() < 0.5 ? -1 : 1); }
  window.addEventListener('pagehide', save);

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

  function setTheme(th) {
    const night = th !== 'light';
    renderer.toneMappingExposure = night ? 1.0 : 1.05;
    hemi.intensity = night ? 1.35 : 1.3;
    moonL.intensity = night ? 3.2 : 2.8;
    rimL.intensity = night ? 4.5 : 1.8; rimL2.intensity = night ? 2.6 : 0.8;
    glowK = night ? 1 : 0.55; eyeK = night ? 1 : 0.8;
    RIM.value.set(night ? 0xa8bcff : 0xc8cfdc); RIM_K.value = night ? 1.25 : 0.35;
    mistC.set(0x8a9ab8); mistO = night ? 0.12 : 0;                         // on the pale page mist only shows as banding
  }
  setTheme(opts.theme);
  play();

  return {
    setTheme,
    debug: {
      camera, scene, renderer, step, W, get mode() { return mode; },
      go(m, d) { go(m, d); if (m === 'run') { side = 1; goal.set(xLim(pos.z) + 16, 0, pos.z); } },
      place(x, z, a) { pos.set(x, 0, z); yaw = a; applyRoot(); pose3d(0.016); placeFeet(); goal.copy(pos); },
      pointer(x, y) { ptr.x = x; ptr.y = y; ptr.has = true; lastMove = clock; },
      set interest(v) { interest = v; }, set want(v) { want = v; }, goal, pause, play,
    },
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

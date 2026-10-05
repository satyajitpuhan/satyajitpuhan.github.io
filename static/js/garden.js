/* =============================================================================
   garden.js — a morning walk: a cartoon girl in a flower garden on the rim of a
   great red-rock canyon that opens out to the sea, with the sun coming up.

   Loaded on demand by site.js (section 16) when the visitor picks it. Everything is
   built in code (no model or image files), on three.js and the shared kit.js.

   The scenery is drawn "real": layered canyon walls, buttes and mesas from a
   terraced height field, a river running down to the sea, waves that catch the
   low sun, flower beds, trees, a rose arch and a bench. The girl is drawn as a
   cartoon: flat toon shading, ink outlines, big eyes, a swinging braid and a
   dress that sways. She strolls along the path, smells the flowers and tucks one in
   her hair, gazes out over the canyon, twirls, sits on the bench, and lets a
   butterfly land on her finger. Little hearts float up when she is happy.

   export start(canvas, { theme, onReady, onSlow }) → { stop(), setTheme(theme) }
   ========================================================================== */
import * as THREE from './vendor/three.module.min.js';
import {
  TAU, sm, clamp, lerp, angDiff, rand, rnd, nz, V, C, mix, canvasTex, radial, mistTex,
  sculpt, taperedTube, SPH, mesh, capsule, makeRig, ell, smin, onFront, surfaceNet, taperCapsule,
  eyeTexture, addEye, KEYS, blank, mirror,
} from './kit.js';

/* ---------------------------------------------------------------- noise */

function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (i, j) => { const n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return n - Math.floor(n); };
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v) * 2 - 1;
}
function fbm(x, y, oct = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }

/* ---------------------------------------------------------------- cartoon materials */

const toonGrad = (() => {
  const t = new THREE.DataTexture(new Uint8Array([95, 165, 220, 255]), 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
})();
const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: toonGrad, ...extra });
// Ink outline: the mesh drawn again, inside out, pushed out along its normals.
const inks = new Map();
function inkMat(w) {
  const k = w.toFixed(4);
  if (!inks.has(k)) {
    const m = new THREE.MeshBasicMaterial({ color: 0x3b2622, side: THREE.BackSide });
    m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed += normal * ${k};`); };
    m.customProgramCacheKey = () => 'ink' + k;
    inks.set(k, m);
  }
  return inks.get(k);
}
function inked(geo, mat, parent, pos, scale, w = 0.026) {
  const m = mesh(geo, mat, parent, pos, scale);
  const s = scale === undefined ? 1 : typeof scale === 'number' ? scale : Math.max(...scale);
  m.add(new THREE.Mesh(geo, inkMat(w / s)));
  return m;
}

/* ---------------------------------------------------------------- the girl */

function buildGirl(small) {
  const R = makeRig({ hipH: 2.55, hipW: 0.24, neckY: 1.58, neckZ: 0.02, shY: 1.42, shW: 0.54, upper: 0.92, fore: 0.82, thigh: 1.2, shin: 1.18, ankleH: 0.17 });
  const skinC = 0xe0a47c, hairC = 0x2a1a15, dressC = C(0xb9a3e3), dressD = C(0x6b52aa), cream = C(0xfbf6ee);
  const skin = toon(skinC), hair = toon(0xffffff, { vertexColors: true }), dressMat = toon(0xffffff, { vertexColors: true });
  // lavender with little white flowers
  const print = (x, y, z) => {
    const k = Math.sin(x * 34 + 1.3) * Math.sin(y * 31 + 0.4) * Math.sin(z * 37 + 2.1);
    return k > 0.8 ? cream : dressC;
  };
  // bodice: chest and waist, a scoop neck, a violet ribbon at the waist
  R.belly = new THREE.Group(); R.torso.add(R.belly);
  const bod = (x, y, z) => smin(smin(ell(x, y, z, 0, 1.08, 0.02, 0.44, 0.48, 0.28), ell(x, y, z, 0, 0.55, 0, 0.34, 0.42, 0.24), 0.25), ell(x, y, z, 0, 1.3, 0.02, 0.42, 0.22, 0.24), 0.2);
  inked(surfaceNet(bod, (x, y, z) => {
    if (y > 1.42 - 0.35 * x * x || (z > 0.05 && y > 1.28 - 0.5 * x * x)) return C(skinC);
    if (y > 0.5 && y < 0.66) return dressD;
    return print(x, y, z);
  }, [-0.7, 0.05, -0.5], [0.7, 1.7, 0.5], 0.03), dressMat, R.belly);
  // a bow at the back of the ribbon
  for (const s of [1, -1]) inked(SPH, toon(dressD), R.belly, [s * 0.12, 0.6, -0.27], [0.12, 0.07, 0.04], 0.012);
  // skirt: an A-line with a wavy hem, hung from the pelvis so it can sway and flare
  R.skirt = new THREE.Group(); R.skirt.position.y = 0.55; R.pelvis.add(R.skirt);
  {
    const prof = []; for (let i = 0; i <= 12; i++) { const t = i / 12; prof.push(new THREE.Vector2(0.36 + 0.68 * Math.pow(t, 0.9), -t * 1.75)); }
    const geo = new THREE.LatheGeometry(prof, 48), p = geo.attributes.position, cols = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), t = -y / 1.75;
      const f = 1 + 0.06 * Math.sin(a * 9) * t;                       // soft folds
      p.setXYZ(i, x * f, y + 0.05 * Math.sin(a * 9) * sm(0.85, 1, t), z * f);
      const c = t > 0.94 ? dressD : print(x, y, z); cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const sk = mesh(geo, toon(0xffffff, { vertexColors: true, side: THREE.DoubleSide }), R.skirt);
    sk.add(new THREE.Mesh(geo, inkMat(0.022)));
  }
  // neck
  inked(capsule(0.13, 0.2), skin, R.torso, [0, 1.56, 0.0], undefined, 0.02);
  // head: soft cartoon face, rosy cheeks
  const head = (x, y, z) => {
    let d = ell(x, y, z, 0, 0.66, -0.04, 0.6, 0.62, 0.6);
    d = smin(d, ell(x, y, z, 0, 0.42, 0.1, 0.5, 0.42, 0.48), 0.25);
    d = smin(d, ell(x, y, z, 0, 0.2, 0.26, 0.22, 0.16, 0.2), 0.16);
    d = smin(d, ell(x, y, z, 0, 0.47, 0.56, 0.06, 0.08, 0.07), 0.06);
    return smin(d, Math.min(ell(x, y, z, 0.58, 0.5, -0.02, 0.07, 0.12, 0.08), ell(x, y, z, -0.58, 0.5, -0.02, 0.07, 0.12, 0.08)), 0.04);
  };
  const H = R.headMesh = new THREE.Group(); H.position.set(0, 0.02, 0.03); R.head.add(H);
  const skinCol = C(skinC), blush = C(0xf09080);
  inked(surfaceNet(head, (x, y, z) => mix(skinCol, blush, 0.55 * Math.exp(-(((Math.abs(x) - 0.3) / 0.12) ** 2 + ((y - 0.36) / 0.08) ** 2)) * sm(0.2, 0.45, z)),
    [-0.75, -0.1, -0.75], [0.75, 1.4, 0.8], small ? 0.03 : 0.022), toon(0xffffff, { vertexColors: true }), H, undefined, undefined, 0.022);
  // hair: a cap with a side-swept fringe, the face cut out
  const hairSdf = (x, y, z) => {
    let d = smin(ell(x, y, z, 0, 0.74, -0.07, 0.65, 0.68, 0.65), ell(x, y, z, 0, 0.1, -0.32, 0.58, 0.95, 0.34), 0.3);   // crown, and long hair down her back
    d = smin(d, Math.min(ell(x, y, z, 0.52, 0.3, -0.1, 0.17, 0.55, 0.3), ell(x, y, z, -0.52, 0.3, -0.1, 0.17, 0.55, 0.3)), 0.14);
    d = Math.max(d, -ell(x, y, z, 0, 0.48, 0.42, 0.5, 0.56, 0.42));                   // the face
    d = Math.max(d, -ell(x, y, z, 0.05, -0.55, 0.3, 0.9, 0.5, 0.5));                   // clear of the shoulders in front
    return smin(d, smin(ell(x, y, z, 0.18, 1.0, 0.36, 0.42, 0.13, 0.2), ell(x, y, z, 0.44, 0.78, 0.4, 0.14, 0.24, 0.12), 0.1), 0.1);   // fringe swept to her left
  };
  const hairD = C(hairC), hairL = C(0x5a3b2e);
  inked(surfaceNet(hairSdf, (x, y, z) => mix(hairD, hairL, 0.65 * Math.exp(-(((y - 1.05) / 0.09) ** 2)) * sm(-0.2, 0.3, z)),
    [-0.85, -1.0, -0.9], [0.85, 1.55, 0.8], small ? 0.032 : 0.024), hair, H, undefined, undefined, 0.022);
  // a side braid over her shoulder, a ribbon and a flower
  R.braid = new THREE.Group(); R.braid.position.set(0.42, 0.4, -0.18); H.add(R.braid);
  {
    const bead = sculpt((x, y, z) => [x * 0.12, y * 0.16, z * 0.11], null, 16, 12);
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      inked(bead, toon(hairC), R.braid, [0.06 * Math.sin(t * 3), -0.08 - t * 1.05, 0.14 + 0.3 * t], 1 - 0.35 * t, 0.018).rotation.z = (i % 2 ? 0.45 : -0.45);
    }
    inked(SPH, toon(0xff8fae), R.braid, [0.07, -1.22, 0.46], [0.07, 0.06, 0.07], 0.01);
    inked(new THREE.ConeGeometry(0.1, 0.22, 10).rotateX(Math.PI), toon(hairC), R.braid, [0.07, -1.35, 0.48], undefined, 0.016);
  }
  R.hairFlower = new THREE.Group(); R.hairFlower.position.set(0.48, 0.92, 0.16); R.hairFlower.rotation.set(0.2, 0.6, -0.3); H.add(R.hairFlower);
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; inked(SPH, toon(0xffffff), R.hairFlower, [Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0], [0.07, 0.07, 0.025], 0.008); }
  mesh(SPH, toon(0xffc93d), R.hairFlower, [0, 0, 0.02], 0.045);
  R.hairFlower.visible = false;
  // face: big eyes with lashes, brows, round glasses, a small smile
  const eyeTex = eyeTexture(0x9a6a40, 0x4a2a16, 0x1a0e08);
  const lashMat = toon(0x24140f), frame = toon(0xc99a72);
  for (const s of [1, -1]) {
    const { p, n } = onFront(head, s * 0.22, 0.6);
    const e = addEye(H, p.clone().addScaledVector(n, -0.065), 0.145, eyeTex, skin);
    e.base.scale.set(0.92, 1.12, 1);
    R.eyes.push(e);
    const lash = mesh(new THREE.TorusGeometry(0.135, 0.017, 6, 16, Math.PI * 0.95), lashMat, H);
    lash.position.copy(p).add(V(0, 0.015, 0.03)); lash.rotation.set(-0.2, s * 0.25, 0.08);
    const flick = mesh(new THREE.ConeGeometry(0.02, 0.09, 5), lashMat, H);
    flick.position.copy(p).add(V(s * 0.15, 0.09, 0.0)); flick.rotation.z = -s * 1.0;
    const b = onFront(head, s * 0.23, 0.82).p;
    mesh(taperedTube([b.clone().add(V(-s * 0.12, -0.03, 0.02)), b.clone().add(V(0, 0.02, 0.03)), b.clone().add(V(s * 0.13, -0.02, 0.0))], 10, u => 0.024 * (1 - 0.5 * Math.abs(u - 0.3)), null, 5), lashMat, H);
    // glasses: thin round rims
    const rim = mesh(new THREE.TorusGeometry(0.17, 0.014, 6, 28), frame, H);
    rim.position.copy(p).add(V(0, 0.0, 0.1)); rim.rotation.y = s * 0.15;
    const arm = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.62, 5), frame, H);
    arm.rotation.x = Math.PI / 2; arm.position.set(s * 0.55, p.y + 0.02, p.z - 0.24); arm.rotation.z = s * 0.12;
  }
  const bridge = mesh(new THREE.TorusGeometry(0.06, 0.012, 5, 10, Math.PI), frame, H);
  bridge.position.copy(onFront(head, 0, 0.62).p).add(V(0, 0.0, 0.08));
  const m = onFront(head, 0, 0.29);
  R.mouth = mesh(SPH, toon(0x7a2a2e), H, null, [0.08, 0.012, 0.04]); R.mouth.position.copy(m.p).addScaledVector(m.n, -0.01);
  const smile = mesh(new THREE.TorusGeometry(0.085, 0.014, 6, 14, Math.PI * 0.75), toon(0x9a3c3c), H);
  smile.position.copy(m.p).add(V(0, 0.07, 0.0)); smile.rotation.set(-0.25, 0, Math.PI + Math.PI * 0.125);
  R.mouthPt = new THREE.Object3D(); R.mouthPt.position.copy(m.p).add(V(0, 0, 0.06)); H.add(R.mouthPt);
  R.crown = new THREE.Object3D(); R.crown.position.set(0, 1.4, 0); H.add(R.crown);
  // arms with puff sleeves; cartoon hands
  const puff = sculpt((x, y, z) => [x * 0.21, y * 0.18 - 0.08, z * 0.21], null, 20, 14);
  const upper = taperCapsule(0.13, 0.105, 0.82), fore = taperCapsule(0.105, 0.08, 0.74);
  const hand = surfaceNet((x, y, z) => smin(ell(x, y, z, 0, -0.1, 0.0, 0.1, 0.13, 0.06), ell(x, y, z, 0, -0.04, 0.09, 0.04, 0.07, 0.04), 0.04), () => skinCol, [-0.2, -0.3, -0.15], [0.2, 0.1, 0.2], 0.018);
  for (const a of R.arm) {
    inked(puff, toon(dressC), a.sh, undefined, undefined, 0.02);
    inked(upper, skin, a.sh, undefined, undefined, 0.016);
    inked(fore, skin, a.el, undefined, undefined, 0.016);
    inked(hand, toon(0xffffff, { vertexColors: true }), a.hand, undefined, undefined, 0.012);
    a.hand.userData.holdPt = new THREE.Object3D(); a.hand.userData.holdPt.position.set(0, -0.2, 0.08); a.hand.add(a.hand.userData.holdPt);
  }
  // legs and sandals
  const thigh = taperCapsule(0.18, 0.13, 1.15), shin = taperCapsule(0.13, 0.085, 1.12);
  const sandal = toon(0xf4efe6);
  for (const l of R.leg) {
    inked(thigh, skin, l.hip, undefined, undefined, 0.016);
    inked(shin, skin, l.knee, undefined, undefined, 0.016);
    inked(sculpt((x, y, z) => [x * 0.1, y * 0.08, z * 0.22], null, 16, 10), skin, l.ankle, [0, -0.06, 0.1], undefined, 0.014);
    inked(new THREE.BoxGeometry(0.22, 0.05, 0.5), sandal, l.ankle, [0, -0.15, 0.1], undefined, 0.012);
    mesh(new THREE.TorusGeometry(0.1, 0.018, 5, 12, Math.PI), sandal, l.ankle, [0, -0.08, 0.16]).rotation.y = Math.PI / 2;
  }
  return R;
}

/* ---------------------------------------------------------------- scenery */

const STRATA = [0xb4553a, 0xd2864c, 0xe7b57a, 0xa8604b, 0xc9784e, 0x8f5a52, 0xdca06a, 0xbf6a45, 0xe9c28f, 0x9c4c3a].map(C);

// The canyon: terraced plateau, a meandering river gorge, buttes standing in it,
// the whole thing sinking into the sea on the right, far away.
const riverX = z => 30 * Math.sin(z * 0.011 + 0.6) + 16 * Math.sin(z * 0.027 + 1.3) - 20;
function canyonH(x, z) {
  const d = Math.abs(x - riverX(z));
  const n = fbm(x * 0.011, z * 0.011), n2 = fbm(x * 0.028 + 5.2, z * 0.028 + 1.7, 4);
  const plateau = 4 + 7 * n + 10 * sm(-250, -420, z);                                          // the far rim, near eye level
  const w = 90 + 50 * n2;
  let t = sm(18, w, d + 30 * n2);
  const butte = sm(0.1, 0.32, fbm(x * 0.017 + 11, z * 0.017 + 3, 4)) * sm(14, 36, d);           // buttes standing in the gorge
  t = Math.max(t, butte * 0.82);
  let h = lerp(-25, plateau, t);
  const step = 7, s = (h + 25) / step, f = s - Math.floor(s);
  h = (Math.floor(s) + sm(0.42, 0.92, f)) * step - 25 + 0.6 * fbm(x * 0.2, z * 0.2, 2);      // ledges and cliffs
  h -= 95 * sm(-250, -400, z) * sm(-40, 160, x);                                                 // opens to the sea on the right
  h -= 80 * sm(-430, -490, z);
  return Math.min(h, lerp(-22, 40, sm(-30, -150, z)));                                        // the gorge right below the garden
}

function buildCanyon(small) {
  const nx = small ? 220 : 380, nzr = small ? 110 : 170, X = 560;
  const pos = [], col = [], idx = [];
  const zAt = t => -18 - 470 * Math.pow(t, 1.55);
  const H = [];
  for (let j = 0; j < nzr; j++) for (let i = 0; i < nx; i++) {
    const x = (i / (nx - 1) * 2 - 1) * X, z = zAt(j / (nzr - 1)), h = canyonH(x, z);
    pos.push(x, h, z); H.push(h);
  }
  for (let j = 0; j < nzr; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, h = H[k];
    const hx = H[j * nx + Math.min(nx - 1, i + 1)] - H[j * nx + Math.max(0, i - 1)], hz = H[Math.min(nzr - 1, j + 1) * nx + i] - H[Math.max(0, j - 1) * nx + i];
    const steep = clamp((Math.abs(hx) + Math.abs(hz)) / 9, 0, 1);
    const x = pos[k * 3], z = pos[k * 3 + 2];
    const band = Math.floor((h + 25) / 2.2 + 0.35 * fbm(x * 0.05, z * 0.05, 2));                // the rock's layers
    let c = STRATA[((band % STRATA.length) + STRATA.length) % STRATA.length].clone();
    c.multiplyScalar(0.92 + 0.12 * fbm(x * 0.3, z * 0.3, 2));
    const flat = 1 - steep;
    c.multiplyScalar(0.85 + 0.25 * steep);
    c = mix(c, C(0xd9b07c), flat * 0.25);                                                      // sandy ledges
    c = mix(c, C(0x6f7a4a), flat * sm(0.2, 0.55, fbm(x * 0.08 + 3, z * 0.08, 3)) * 0.7);       // juniper and sage
    if (h < -21 && z > -380) c = mix(c, C(0x6a8a4a), 0.55);                                 // green along the river
    col.push(c.r, c.g, c.b);
    if (i < nx - 1 && j < nzr - 1) idx.push(k, k + 1, k + nx, k + 1, k + nx + 1, k + nx);     // facing up
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, transparent: true }));   // drawn after the lawn, so its faded edge hides it
}

// Water: flat geometry, waves in the shading, so the low sun leaves a glittering path.
function waterMaterial(colour) {
  const m = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.16, metalness: 0.05, transparent: true });
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = m.userData.time;
    sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform float uTime;\nvarying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      {
        vec2 p = vWPos.xz;
        float t = uTime;
        vec2 g = vec2(0.0);
        g += 0.30 * vec2(0.08, 0.05) * cos(dot(p, vec2(0.08, 0.05)) + t * 0.9);
        g += 0.22 * vec2(-0.05, 0.11) * cos(dot(p, vec2(-0.05, 0.11)) + t * 1.3);
        g += 0.16 * vec2(0.21, -0.13) * cos(dot(p, vec2(0.21, -0.13)) + t * 1.9);
        g += 0.10 * vec2(-0.37, -0.29) * cos(dot(p, vec2(-0.37, -0.29)) + t * 2.6);
        g += 0.06 * vec2(0.71, 0.53) * cos(dot(p, vec2(0.71, 0.53)) + t * 3.4);
        float fade = 1.0 / (1.0 + length(vWPos - cameraPosition) * 0.004);
        vec3 wn = normalize(vec3(-g.x * 6.0 * fade, 1.0, -g.y * 6.0 * fade));
        normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
      }`);
  };
  m.userData.time = { value: 0 };
  return m;
}

function buildTree(foliage, blossom, small, size = 1) {
  const tree = new THREE.Group(), canopy = new THREE.Group(); tree.add(canopy);
  const barkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  const bark = u => mix(C(0x4a3424), C(0x77573c), 0.5 + 0.5 * Math.sin(u * 23));
  const spots = [];
  const trunk = [V(0, -0.5, 0), V(0.3, 2.5, 0.1), V(-0.3, 5, 0), V(0.2, 7, -0.1)];
  mesh(taperedTube(trunk, 30, u => 0.8 * (1 + 0.6 * Math.exp(-u * 10)) * (1 - 0.45 * u), bark, 10), barkMat, tree);
  function branch(p0, dir, len, r0, depth) {
    const pts = [p0.clone()]; let p = p0.clone(); const d = dir.clone();
    for (let k = 1; k <= 3; k++) { d.add(V((rand() - 0.5) * 0.5, (rand() - 0.4) * 0.3, (rand() - 0.5) * 0.5)).normalize(); p = p.clone().addScaledVector(d, len / 3); pts.push(p); }
    mesh(taperedTube(pts, 8, u => r0 * (1 - 0.45 * u), bark, 6), barkMat, canopy);
    if (depth <= 1) spots.push(p);
    if (!depth) return;
    for (let k = 0; k < 3; k++) {
      const a = k / 3 * TAU + rand();
      branch(pts[1 + (k % 2)], V(Math.cos(a), 0.35 + rand() * 0.4, Math.sin(a) * 0.7).addScaledVector(d, 0.5).normalize(), len * 0.72, r0 * 0.6, depth - 1);
    }
  }
  branch(trunk[3], V(0, 1, 0), 3.8, 0.5, 3);
  const per = small ? 30 : 48, n = spots.length * per;
  const blob = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.8 }), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  let k = 0;
  for (const s of spots) for (let i = 0; i < per; i++) {
    const o = V(rand() - 0.5, rand() * 0.8 - 0.3, rand() - 0.5).multiplyScalar(2.8);
    m4.compose(s.clone().add(o), q.random(), V(1, 0.75, 1).multiplyScalar(0.14 + rand() * 0.24)); blob.setMatrixAt(k, m4);
    const pal = rand() < 0.62 ? blossom : foliage; blob.setColorAt(k++, C(pal[(rand() * pal.length) | 0]));
  }
  canopy.add(blob);
  tree.scale.setScalar(size);
  return { tree, canopy, spots };
}

/* ---------------------------------------------------------------- poses */

const G = {
  stand: {},
  sniff: { lean: 0.55, hp: 0.4, hr: 0.15, lfL: 0.3, lkL: 0.55, lfR: 0.3, lkR: 0.55, afR: 0.95, aeR: 0.9, aoR: -0.1, afL: 0.15, aeL: 0.25 },
  pick: { lean: 0.6, hp: 0.5, lfL: 0.35, lkL: 0.65, lfR: 0.35, lkR: 0.65, afR: 0.85, aeR: 0.3, aoR: 0.05 },
  holdFlower: { afR: 1.0, aeR: 2.0, aoR: -0.3, hp: 0.15, hr: 0.2 },
  tuck: { afL: 2.3, aoL: 0.65, aeL: 2.35, hr: -0.22, hy: -0.15 },
  gaze: { afL: 0.08, aeL: 0.3, afR: 0.08, aeR: 0.3, aoL: -0.12, aoR: -0.12, hp: -0.15 },
  hug: { afL: 0.85, aeL: 2.05, aoL: -0.5, afR: 0.85, aeR: 2.05, aoR: -0.5, hp: 0.05, hr: 0.18 },
  twirl: { aoL: 1.35, aoR: 1.35, afL: 0.25, afR: 0.25, aeL: 0.15, aeR: 0.15, hp: -0.25, jaw: 0.5 },
  sit: { lfL: 1.5, lkL: 1.45, lfR: 1.5, lkR: 1.55, lean: 0.06, afL: 0.55, aeL: 0.55, afR: 0.55, aeR: 0.55, aoL: -0.08, aoR: -0.08 },
  finger: { afR: 1.55, aeR: 1.0, aoR: 0.1, hp: -0.18 },
  wave: { afR: 0.35, aoR: 2.3, aeR: 1.0, jaw: 0.3, hr: 0.12 },
  stretch: { afL: 2.95, aoL: 0.3, aeL: 0.2, afR: 2.95, aoR: 0.3, aeR: 0.2, lean: -0.12, hp: -0.35 },
  lookBack: { twist: 0.55, hy: 1.0, hp: 0.05 },
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
  scene.fog = new THREE.Fog(0xf3dcc6, 160, 1700);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 2600);
  const tanH = Math.tan(THREE.MathUtils.degToRad(17.5));

  // morning light: a soft key from the viewer's left, the low sun ahead over the sea
  const hemi = new THREE.HemisphereLight(0xfff1e0, 0x7a5a40, 1.15); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe6c8, 2.2); key.position.set(-30, 40, 40); scene.add(key);
  const sunL = new THREE.DirectionalLight(0xffb878, 1.6); sunL.position.set(300, 60, -900); scene.add(sunL);

  /* sky band, sun, clouds */
  const skyMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false });
  const skyTex = night => canvasTex(4, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    if (night) { g.addColorStop(0, 'rgba(30,24,60,0)'); g.addColorStop(0.55, 'rgba(70,46,96,.55)'); g.addColorStop(0.85, 'rgba(196,108,110,.85)'); g.addColorStop(1, 'rgba(240,160,110,1)'); }
    else { g.addColorStop(0, 'rgba(255,236,214,0)'); g.addColorStop(0.5, 'rgba(255,214,180,.45)'); g.addColorStop(0.85, 'rgba(255,200,150,.85)'); g.addColorStop(1, 'rgba(255,214,170,1)'); }
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  const skyTexes = [skyTex(false), skyTex(true)];
  const sky = mesh(new THREE.PlaneGeometry(6000, 900), skyMat, scene, [0, 150, -2300]); sky.renderOrder = -10;
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, 'rgba(255,252,236,1)'], [0.12, 'rgba(255,240,200,1)'], [0.3, 'rgba(255,200,130,.45)'], [1, 'rgba(255,170,100,0)']]), fog: false, transparent: true, depthWrite: false }));
  sun.position.set(560, 12, -2200); sun.scale.setScalar(520); sun.renderOrder = -9; scene.add(sun);
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, fog: false, transparent: true, depthWrite: false, color: 0xffd6c0, opacity: 0.7 }));
    c.position.set((rand() * 2 - 1) * 1400, 110 + rand() * 260, -1900 - rand() * 200); c.scale.set(700 + rand() * 600, 180 + rand() * 120, 1);
    c.renderOrder = -8; scene.add(c); clouds.push({ c, v: 3 + rand() * 5 });
  }

  /* the canyon, the river and the sea */
  const canyon = buildCanyon(small); canyon.renderOrder = 1; scene.add(canyon);
  const water = waterMaterial(0x2f6f8f);
  const sea = mesh(new THREE.PlaneGeometry(6000, 2600).rotateX(-Math.PI / 2), water, scene, [0, -41, -1500]); sea.renderOrder = 0;
  {
    const pts = []; for (let z = -20; z > -460; z -= 10) pts.push(V(riverX(z), lerp(-24.4, -40.6, sm(-280, -400, z)), z));
    const curve = new THREE.CatmullRomCurve3(pts), segs = 120, g = new THREE.BufferGeometry(), p = [], ix = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs, c = curve.getPointAt(u), tg = curve.getTangentAt(u), w = 7 + 6 * u;
      p.push(c.x - tg.z * w, c.y, c.z + tg.x * w, c.x + tg.z * w, c.y, c.z - tg.x * w);
      if (i < segs) ix.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix); g.computeVertexNormals();
    mesh(g, water, scene).renderOrder = 0;
  }

  /* birds gliding over the canyon */
  const birds = [];
  {
    const wing = new THREE.BufferGeometry();
    wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1.6, 0.1, -0.5, 0.5, 0, 0.35], 3));
    const bm = new THREE.MeshBasicMaterial({ color: 0x3a2a26, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Group(), l = mesh(wing, bm, b), r = mesh(wing, bm, b); r.scale.x = -1;
      b.scale.setScalar(1.4 + rand()); scene.add(b);
      birds.push({ b, l, r, cx: (rand() * 2 - 1) * 150, cz: -120 - rand() * 200, y: 18 + rand() * 30, rad: 40 + rand() * 60, sp: 0.06 + rand() * 0.05, ph: rand() * TAU });
    }
  }

  /* the garden on the rim */
  const world = new THREE.Group(); scene.add(world);
  const rimZ = x => -16 + 0.8 * Math.sin(x * 0.13) + 0.5 * Math.sin(x * 0.31 + 1);
  const pathZ = x => -4.5 + 2.4 * Math.sin(x * 0.075 + 0.6);
  {
    const lawn = new THREE.PlaneGeometry(220, 44, 110, 26); lawn.rotateX(-Math.PI / 2); lawn.translate(0, 0, 2);
    const p = lawn.attributes.position, cols = [];
    const g1 = C(0x6f9a45), g2 = C(0x93b85a), g3 = C(0x5a8238), rock = C(0xb0704a);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), edge = rimZ(x), drop = sm(edge, edge - 4, z);
      p.setY(i, -drop * 14 + (1 - drop) * 0.15 * nz(x * 0.3, 0, z * 0.3));
      const k = mix(mix(mix(g1, g2, nz(x * 0.15, 1, z * 0.15) * 0.5 + 0.5), g3, sm(0.3, 0.9, nz(x * 0.4, 2, z * 0.4)) * 0.5), rock, sm(0.02, 0.3, drop));
      cols.push(k.r, k.g, k.b, 1 - sm(6, 17, z));
    }
    lawn.setAttribute('color', new THREE.Float32BufferAttribute(cols, 4)); lawn.computeVertexNormals();
    const ground = mesh(lawn, new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, roughness: 1 }), world); ground.renderOrder = -2;
  }
  // flagstone path
  {
    const tex = canvasTex(256, 256, (c, S) => {
      c.fillStyle = '#b9a58a'; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 26; i++) {
        const x = rand() * S, y = rand() * S, r = 22 + rand() * 26, v = 190 + rand() * 40 | 0;
        c.fillStyle = `rgb(${v},${v - 18},${v - 40})`; c.beginPath();
        for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, rr = r * (0.75 + rand() * 0.35); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        c.fill(); c.strokeStyle = 'rgba(90,80,60,.5)'; c.lineWidth = 2; c.stroke();
      }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const g = new THREE.BufferGeometry(), p = [], uv = [], ix = [], N = 220, W = 1.7;
    for (let i = 0; i <= N; i++) {
      const x = -110 + i / N * 220, z = pathZ(x), dz = (pathZ(x + 0.1) - z) / 0.1, l = Math.hypot(1, dz);
      p.push(x + dz / l * W, 0.04, z - 1 / l * W, x - dz / l * W, 0.04, z + 1 / l * W); uv.push(i * 0.6, 0, i * 0.6, 1);
      if (i < N) ix.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 2, i * 2 + 1, i * 2 + 3);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix); g.computeVertexNormals();
    mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), world).renderOrder = -1;
  }
  // low stone wall along the rim, with a string of little lights
  const lightsMat = new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffb84a, emissiveIntensity: 0.2 });
  {
    const stone = new THREE.MeshStandardMaterial({ color: 0xc9a07a, roughness: 0.9 });
    const n = 60, wall = new THREE.InstancedMesh(new THREE.BoxGeometry(3.7, 0.9, 0.7), stone, n), posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), stone, n + 1);
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), lightsMat, n * 8);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i <= n; i++) {
      const x = -110 + i * 3.7, z = rimZ(x) + 1.2;
      m4.compose(V(x, 0.8, z), q, V(1, 1, 1)); posts.setMatrixAt(i, m4);
      if (i === n) break;
      const x2 = x + 3.7, z2 = rimZ(x2) + 1.2;
      q.setFromAxisAngle(V(0, 1, 0), -Math.atan2(z2 - z, 3.7)); m4.compose(V(x + 1.85, 0.45, (z + z2) / 2), q, V(1, 1, 1)); wall.setMatrixAt(i, m4); q.identity();
      for (let k = 0; k < 8; k++) { const u = (k + 0.5) / 8; m4.compose(V(lerp(x, x2, u), 1.55 - 0.45 * Math.sin(Math.PI * u), lerp(z, z2, u)), q, V(1, 1, 1)); bulbs.setMatrixAt(i * 8 + k, m4); }
    }
    world.add(wall, posts, bulbs);
  }
  // flower beds along both sides of the path
  const flowerSpots = [];
  {
    const types = [
      { geo: sculpt((x, y, z) => [x * 0.26, y * 0.18 + 0.03 * Math.sin(Math.atan2(z, x) * 5 + y * 6), z * 0.26], null, 10, 8), cols: [0xe23a4e, 0xf06a8a, 0xffffff, 0xff9eb5, 0xc81e3a] },   // roses
      { geo: new THREE.LatheGeometry([[0.001, -0.12], [0.12, -0.08], [0.15, 0.08], [0.11, 0.16]].map(([a, b]) => new THREE.Vector2(a, b)), 7), cols: [0xffd23a, 0xff8a3a, 0xff6aa0, 0xffffff] },   // tulips
      { geo: sculpt((x, y, z) => [x * 0.06, y * 0.28 + 0.15, z * 0.06], null, 6, 8), cols: [0x8a6ad0, 0x9a7ae0, 0x7a5ac0] },                                                                      // lavender
      { geo: new THREE.CylinderGeometry(0.2, 0.2, 0.03, 10), cols: [0xffffff, 0xfff5d6] },                                                                                                       // daisies
      { geo: new THREE.IcosahedronGeometry(0.16, 0), cols: [0xff9a1a, 0xffc21a, 0xf26a1a] },                                                                                                     // marigolds
    ];
    const N = small ? 1200 : 2600, stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.025, 1, 4).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x4f7a2e }), N);
    const heads = types.map(t => new THREE.InstancedMesh(t.geo, new THREE.MeshStandardMaterial({ roughness: 0.7, side: THREE.DoubleSide }), N));
    const counts = types.map(() => 0);
    const bush = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 0.9 }), small ? 300 : 600);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let b = 0;
    for (let i = 0; i < N; i++) {
      const x = (rand() * 2 - 1) * 100, side = rand() < 0.5 ? 1 : -1, off = 2.1 + rand() * 4.2, z = pathZ(x) + side * off;
      if (z < rimZ(x) + 2.2 || z > 9) continue;
      const cluster = fbm(x * 0.12, side * 3, 2), t = (Math.floor((cluster * 0.5 + 0.5) * 7 + rand() * 1.5)) % types.length;
      const h = 0.25 + rand() * 0.4 + (t === 2 ? 0.15 : 0);
      m4.compose(V(x, 0, z), q.setFromEuler(e.set((rand() - 0.5) * 0.25, 0, (rand() - 0.5) * 0.25)), V(1, h, 1)); stems.setMatrixAt(i, m4);
      const ty = types[t], k = counts[t]++;
      m4.compose(V(x, h, z), q.setFromEuler(e.set((rand() - 0.5) * 0.4, rand() * 3, (rand() - 0.5) * 0.4)), V(1, 1, 1)); heads[t].setMatrixAt(k, m4);
      heads[t].setColorAt(k, C(ty.cols[(rand() * ty.cols.length) | 0]));
      if (b < bush.count && rand() < 0.22) { m4.compose(V(x + rand() - 0.5, 0.05, z + rand() - 0.5), q.random(), V(0.55 + rand() * 0.4, 0.2 + rand() * 0.12, 0.55 + rand() * 0.4)); bush.setMatrixAt(b, m4); bush.setColorAt(b++, mix(C(0x3f6a2a), C(0x6a9a3a), rand())); }
      if (rand() < 0.08) flowerSpots.push(V(x, h, z));
    }
    heads.forEach((h, t) => { h.count = counts[t]; world.add(h); });
    bush.count = b; world.add(stems, bush);
  }
  // a rose arch over the path, and a bench looking out over the canyon
  const arch = new THREE.Group(); world.add(arch);
  {
    const iron = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5, metalness: 0.6 });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.6, 8), iron, arch, [0, 2.3, s * 2.1]);
    mesh(new THREE.TorusGeometry(2.1, 0.08, 8, 30, Math.PI).rotateY(Math.PI / 2), iron, arch, [0, 4.6, 0]);
    const leaf = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.32, 0), new THREE.MeshStandardMaterial({ roughness: 0.85 }), 260);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i < 260; i++) {
      const u = rand(); let p;
      if (u < 0.55) { const a = rand() * Math.PI; p = V(0, 4.6 + Math.sin(a) * 2.1, Math.cos(a) * 2.1); }
      else { const s = rand() < 0.5 ? -1 : 1; p = V(0, rand() * 4.6, s * 2.1); }
      p.add(V(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.6));
      m4.compose(p, q.random(), V(1, 1, 1).multiplyScalar(0.6 + rand() * 0.7)); leaf.setMatrixAt(i, m4);
      leaf.setColorAt(i, rand() < 0.35 ? C([0xe23a5e, 0xff7a9a, 0xfff0f2][(rand() * 3) | 0]) : mix(C(0x3a6a2a), C(0x5f8f3a), rand()));
    }
    arch.add(leaf);
  }
  const bench = new THREE.Group(); world.add(bench);
  {
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.8 }), iron = new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.5, metalness: 0.6 });
    for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(3.6, 0.1, 0.22), wood, bench, [0, 1.3, -0.35 + i * 0.25]);
    for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(3.6, 0.22, 0.08), wood, bench, [0, 1.75 + i * 0.32, -0.55]).rotation.x = -0.15;
    for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(0.12, 1.3, 0.9), iron, bench, [s * 1.6, 0.65, -0.1]); mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), iron, bench, [s * 1.6, 2.0, -0.6]); }
  }
  // trees: a jacaranda and a pink-blossom tree framing the garden, slim cypresses on the rim
  const treeL = buildTree([0x4f7a3a, 0x6a9a48], [0x8f6ad8, 0xa98ae8, 0x7a58c8], small, 1.05), treeR = buildTree([0x4f7a3a, 0x6a9a48], [0xf6a6c6, 0xffc4d8, 0xf088b0, 0xffffff], small, 0.95);
  world.add(treeL.tree, treeR.tree);
  const cypress = [];
  {
    const g = sculpt((x, y, z) => [x * 0.9 * (1 - 0.8 * sm(-1, 1, y)) * (1 + 0.08 * Math.sin(y * 9 + x * 3)), y * 5 + 5, z * 0.9 * (1 - 0.8 * sm(-1, 1, y))], null, 12, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2f4f2a, roughness: 0.95, flatShading: true });
    for (let i = 0; i < 6; i++) { const c = mesh(g, mat, world); c.scale.setScalar(0.8 + rand() * 0.5); cypress.push(c); }
  }
  // butterflies
  const flies = [];
  {
    const wing = new THREE.CircleGeometry(0.22, 8).scale(1, 0.75, 1).translate(0.2, 0.05, 0);
    for (let i = 0; i < (small ? 4 : 7); i++) {
      const col = [0xffb21a, 0x7ac8ff, 0xff7aa8, 0xffffff, 0xc89aff][i % 5];
      const b = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide, roughness: 0.6 });
      const l = mesh(wing, mat, b), r = mesh(wing, mat, b); r.scale.x = -1;
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 4).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2a2020 }), b);
      world.add(b);
      flies.push({ b, l, r, p: V((rnd() * 2 - 1) * 20, 1 + rnd() * 2, rnd() * 6 - 4), t: V(), ph: rnd() * 9, follow: null, land: 0 });
    }
  }
  // little hearts that float up when she is happy
  const heartTex = canvasTex(64, 64, (c) => {
    c.fillStyle = '#ff6f9a'; c.beginPath(); c.moveTo(32, 56);
    c.bezierCurveTo(4, 36, 6, 10, 22, 10); c.bezierCurveTo(28, 10, 32, 16, 32, 20); c.bezierCurveTo(32, 16, 36, 10, 42, 10); c.bezierCurveTo(58, 10, 60, 36, 32, 56); c.fill();
  });
  const hearts = [];
  for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false, opacity: 0 })); s.scale.setScalar(0.4); world.add(s); hearts.push({ s, t: 9, v: V() }); }
  function puffHearts(at, n = 5) {
    for (const h of hearts) { if (n <= 0) break; if (h.t < 1.6) continue; h.t = 0; h.s.position.copy(at).add(V((rnd() - 0.5) * 0.8, rnd() * 0.4, (rnd() - 0.5) * 0.4)); h.v.set((rnd() - 0.5) * 0.4, 0.8 + rnd() * 0.5, 0); h.s.scale.setScalar(0.25 + rnd() * 0.25); n--; }
  }
  // a flower she can hold
  const heldFlower = new THREE.Group(); world.add(heldFlower); heldFlower.visible = false;
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; inked(SPH, toon(0xffffff), heldFlower, [Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0], [0.08, 0.08, 0.03], 0.008); }
  mesh(SPH, toon(0xffc93d), heldFlower, [0, 0, 0.02], 0.05);
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 4), toon(0x4f8a2e), heldFlower, [0, -0.27, 0]);

  /* ---------------------------------------------------------------- layout */
  let aspect = 1, camK = 1;
  const halfWAt = z => (camera.position.z - z) * tanH * aspect;
  const xLim = z => Math.max(2, halfWAt(z) - 2.4);
  const obstacles = [];
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    aspect = w / h; camera.aspect = aspect;
    camK = Math.max(1, Math.pow(1.45 / aspect, 0.65));
    camera.position.set(0, 12 * camK, 38 * camK);                                   // high enough to look down into the canyon
    camera.lookAt(0, 12 * camK - 38 * camK * Math.tan(THREE.MathUtils.degToRad(6)), 0);
    camera.updateProjectionMatrix();
    const narrow = aspect < 1, hw = halfWAt(-9);
    treeL.tree.position.set(-hw * 0.97, 0, -10.5);                                   // at the edges, framing the view and clear of the text
    treeR.tree.position.set(hw * 0.97, 0, -11);
    for (const t of [treeL, treeR]) t.tree.scale.setScalar(narrow ? 0.8 : 1);
    const ax = -hw * 0.22; arch.position.set(ax, 0, pathZ(ax)); arch.rotation.y = -Math.atan((pathZ(ax + 0.1) - pathZ(ax)) / 0.1);
    const bx = clamp(hw * 0.35, 4, hw - 5); bench.position.set(bx, 0, rimZ(bx) + 3.6); bench.rotation.y = Math.PI + 0.55;
    cypress.forEach((c, i) => { const s = i < 3 ? -1 : 1, k = i % 3; c.position.set(s * (hw * (0.98 + k * 0.22) + k * 3), 0, rimZ(s * hw) + 2.4 - k * 0.6); });
    obstacles.length = 0;
    obstacles.push({ x: treeL.tree.position.x, z: -10.5, r: 2.4 }, { x: treeR.tree.position.x, z: -11, r: 2.4 }, { x: bx, z: bench.position.z, r: 2.4 });
    scene.updateMatrixWorld(true);
  }
  resize();

  /* ---------------------------------------------------------------- input */
  let clock = 0, lastSeen = -99;
  const ptr = { x: 0, y: 0, has: false }, mouseW = V();
  const onMove = e => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true; lastSeen = clock; };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('resize', resize);
  const watching = () => clock - lastSeen < 1.5;
  function pointerWorld(z) {
    const v = V(ptr.x / innerWidth * 2 - 1, -(ptr.y / innerHeight) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
    return mouseW.copy(camera.position).addScaledVector(v, (z - camera.position.z) / v.z);
  }

  /* ---------------------------------------------------------------- her */
  const R = buildGirl(small); world.add(R.root);
  const shadow = mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(60,30,20,.4)'], [0.6, 'rgba(60,30,20,.15)'], [1, 'rgba(60,30,20,0)']]), transparent: true, depthWrite: false }), world);
  shadow.renderOrder = -1;
  const A = {
    pos: V(), yaw: 0, cur: blank(), target: blank(), out: blank(), rate: 6, rest: { ao: 0.1, lo: 0.02 },
    walkAmt: 0, phase: 0, moving: 0, stepping: 0, solveY: R.d.hipH, seat: null, seatW: 0, osc: [], force: {},
    look: null, lookW: 0, eyeX: 0, eyeTX: 0, lid: 0, lidT: 0, blinkAt: 2, blinkT: 0, wide: 0, autoLook: true,
    flare: 0, flareT: 0, spin: 0, braidV: V(), braid: V(), lastYaw: 0, hold: null,
  };
  A.set = (p, rate = 6) => { A.target = Object.assign(blank(), p); A.rate = rate; };
  for (const e of R.eyes) e.lid.rotation.x = -0.5;
  R.mouth.userData.y0 = R.mouth.scale.y;
  const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), tv = V(), tv2 = V(), xAxis = V(1, 0, 0);
  let wind = 0, gust = 0;
  function update(dt) {
    const o = A.out, k = 1 - Math.exp(-dt * A.rate);
    for (const key of KEYS) A.cur[key] += (A.target[key] - A.cur[key]) * k;
    Object.assign(o, A.cur);
    // a light, swinging stroll
    A.walkAmt += ((A.moving > 0.05 || A.stepping ? 1 : 0) - A.walkAmt) * (1 - Math.exp(-dt * 8));
    A.phase += dt * (A.moving * 2.4 + A.stepping * 6);
    if (A.walkAmt > 0.01) {
      const w = A.walkAmt, s = Math.sin(A.phase), c = Math.cos(A.phase);
      o.lfL += w * (0.42 * s + 0.22 * Math.max(0, c)); o.lfR += w * (-0.42 * s + 0.22 * Math.max(0, -c));
      o.lkL += w * 0.75 * Math.max(0, c); o.lkR += w * 0.75 * Math.max(0, -c);
      o.pr += w * 0.06 * s; o.twist += w * 0.1 * s; o.hr -= w * 0.03 * s;
      if (!A.hold) { o.afL -= w * 0.32 * s; o.afR += w * 0.32 * s; o.aeL += w * 0.15; o.aeR += w * 0.15; }
    }
    for (const [key, amp, f, ph] of A.osc) o[key] += amp * Math.sin(clock * f + (ph || 0));
    for (const key in A.force) o[key] = A.force[key];
    // head and eyes
    let tgt = A.look ? A.look() : null;
    if (!tgt && A.autoLook && ptr.has && clock - lastSeen < 2.5) { R.head.getWorldPosition(tv2); const pw = pointerWorld(A.pos.z + 1); if (pw.distanceTo(tv2) < 10) tgt = pw; }
    A.lookW += ((tgt ? 1 : 0) - A.lookW) * (1 - Math.exp(-dt * 4));
    if (tgt) {
      R.head.getWorldPosition(tv2); tv.subVectors(tgt, tv2);
      const cy = Math.cos(A.yaw), sy = Math.sin(A.yaw), lx = tv.x * cy - tv.z * sy, lz = tv.x * sy + tv.z * cy;
      A._ly = Math.atan2(lx, lz) - o.twist; A._lp = -Math.atan2(tv.y, Math.hypot(lx, lz)) - o.lean;
    }
    if (A.lookW > 0.01 && A._ly !== undefined) {
      const hy = clamp(A._ly, -0.85, 0.85);
      o.hy = lerp(o.hy, hy, A.lookW); o.hp = lerp(o.hp, clamp(A._lp, -0.5, 0.5), A.lookW);
      A.eyeTX = clamp(A._ly - hy, -0.4, 0.4) * A.lookW;
    }
    A.eyeX += (A.eyeTX - A.eyeX) * (1 - Math.exp(-dt * 14));
    A.blinkAt -= dt; if (A.blinkAt < 0) { A.blinkT = 0.14; A.blinkAt = 2 + rnd() * 3.5; }
    A.blinkT -= dt;
    A.lid += (Math.max(A.lidT, A.blinkT > 0 ? 1 : 0) - A.lid) * (1 - Math.exp(-dt * 22));
    A.wide *= Math.exp(-dt * 2);
    for (const e of R.eyes) { e.ball.rotation.set(0, A.eyeX, 0); e.lid.rotation.x = lerp(-0.55 - A.wide * 0.3, 1.45, A.lid); }
    R.mouth.scale.y = R.mouth.userData.y0 * (1 + clamp(o.jaw, 0, 1.2) * 6);
    // pose → joints
    R.root.position.copy(A.pos); R.root.rotation.y = A.yaw + A.spin;
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
    A.seatW += ((A.seat !== null ? 1 : 0) - A.seatW) * (1 - Math.exp(-dt * 3));
    R.pelvis.position.y = lerp(A.solveY, A.seat !== null ? A.seat : A.solveY, A.seatW);
    // the skirt sways with her steps and the breeze, flares when she twirls, and folds over her lap when she sits
    A.flare += (A.flareT - A.flare) * (1 - Math.exp(-dt * 5));
    const sw = A.walkAmt * Math.sin(A.phase);
    R.skirt.rotation.set(-0.09 * A.walkAmt * Math.cos(A.phase) - 0.04 * wind - 1.2 * A.seatW, 0, 0.05 * sw);
    R.skirt.scale.set(1 + A.flare * 0.45, 1 - A.flare * 0.12 - A.seatW * 0.25, 1 + A.flare * 0.45);
    // the braid lags behind her turns and swings as she walks
    const dyaw = angDiff(A.lastYaw, A.yaw + A.spin) / Math.max(dt, 1e-3); A.lastYaw = A.yaw + A.spin;
    A.braidV.x += (-A.braid.x * 40 - A.braidV.x * 5 + dyaw * 2.2 + sw * 3) * dt; A.braid.x += A.braidV.x * dt;
    A.braidV.z += (-A.braid.z * 40 - A.braidV.z * 5 - A.walkAmt * Math.abs(Math.cos(A.phase)) * 4 + wind * 0.6) * dt; A.braid.z += A.braidV.z * dt;
    R.braid.rotation.set(clamp(A.braid.z, -0.5, 0.5), 0, clamp(A.braid.x, -0.5, 0.5) - 0.12);
    shadow.position.set(A.pos.x, 0.05, A.pos.z + 0.2); shadow.scale.setScalar(2.4 + A.flare * 1.4);
  }

  /* ---------------------------------------------------------------- behaviour */
  function* wait(t) { while (t > 0) t -= yield; }
  function* pose(p, t = 0.6, rate = 6) { A.set(p, rate); yield* wait(t); }
  function* turnTo(yaw, rate = 3) {
    while (Math.abs(angDiff(A.yaw, yaw)) > 0.04) { const dt = yield, d = angDiff(A.yaw, yaw); A.yaw += Math.sign(d) * Math.min(Math.abs(d), rate * dt); A.stepping = 0.7; }
    A.stepping = 0;
  }
  function blocked(x, z) {
    for (const o of obstacles) {
      const ax = A.pos.x, az = A.pos.z, dx = x - ax, dz = z - az, L2 = dx * dx + dz * dz || 1;
      const t = clamp(((o.x - ax) * dx + (o.z - az) * dz) / L2, 0, 1), cx = ax + dx * t - o.x, cz = az + dz * t - o.z;
      if (Math.hypot(o.x - x, o.z - z) > o.r && Math.hypot(o.x - ax, o.z - az) > o.r && cx * cx + cz * cz < o.r * o.r) return o;
    }
    return null;
  }
  function* goTo(x, z, { speed = 1.9, face, direct } = {}) {
    const o = !direct && blocked(x, z);
    if (o) yield* goTo(o.x + (A.pos.x < o.x ? -1 : 1) * (o.r + 1.2), o.z + o.r + 1.2, { speed, direct: true });
    for (;;) {
      const dt = yield, dx = x - A.pos.x, dz = z - A.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.1) break;
      const want = Math.atan2(dx, dz), diff = angDiff(A.yaw, want);
      A.yaw += Math.sign(diff) * Math.min(Math.abs(diff), dt * 4);
      const sp = speed * sm(0.15, 0.85, Math.cos(diff)) * Math.min(1, d / 0.5 + 0.25);
      A.pos.x += Math.sin(A.yaw) * sp * dt; A.pos.z += Math.cos(A.yaw) * sp * dt; A.moving = sp / speed;
    }
    A.moving = 0;
    if (face !== undefined) yield* turnTo(face);
  }
  const faceCam = () => Math.atan2(camera.position.x - A.pos.x, camera.position.z - A.pos.z) * 0.7;
  const ATCAM = () => camera.position;
  const handPt = (i, out = V()) => R.arm[i].hand.userData.holdPt.getWorldPosition(out);

  function* stroll() {
    const z0 = 0, x = clamp(A.pos.x + (rnd() < 0.5 ? -1 : 1) * (6 + rnd() * 10), -xLim(z0), xLim(z0));
    yield* goTo(x, pathZ(x));
    yield* turnTo(faceCam() + (rnd() - 0.5) * 0.5);
    if (watching() && rnd() < 0.4) {
      A.look = ATCAM; A.osc = [['aoR', 0.28, 9]];
      yield* pose(G.wave, 1.6, 6);
      A.osc = []; A.look = null; puffHearts(R.crown.getWorldPosition(V()), 2); yield* pose(G.stand, 0.4);
    } else yield* wait(0.5 + rnd());
  }
  function* smellFlower() {
    const f = flowerSpots.filter(p => Math.abs(p.x) < xLim(p.z) && Math.abs(p.x - A.pos.x) < 25).sort(() => rnd() - 0.5)[0];
    if (!f) return;
    const side = f.z > pathZ(f.x) ? 1 : -1;
    yield* goTo(f.x, f.z - side * 1.5, { face: side > 0 ? 0 : Math.PI });
    yield* pose(G.sniff, 0.9, 4);
    A.lidT = 1; yield* wait(1.4);
    puffHearts(R.crown.getWorldPosition(V()).add(V(0, -0.3, 0.4)), 4);
    A.lidT = 0.35; A.target.jaw = 0.25; yield* wait(0.8);
    A.lidT = 0;
    // pick one and tuck it behind her ear
    yield* pose(G.pick, 0.6, 6);
    heldFlower.visible = true; A.hold = 1;
    yield* pose(G.holdFlower, 0.8, 5);
    yield* turnTo(faceCam());
    yield* pose(G.tuck, 0.9, 5);
    heldFlower.visible = false; R.hairFlower.visible = true; A.hold = null;
    yield* pose(S(G.stand, { hr: 0.15 }), 0.8, 4);
    puffHearts(R.crown.getWorldPosition(V()), 3);
  }
  function* gaze() {
    const x = clamp(A.pos.x, -xLim(-12) + 2, xLim(-12) - 2), z = rimZ(x) + 3;
    yield* goTo(x, z, { face: Math.PI + (rnd() - 0.5) * 0.4 });
    A.autoLook = false;
    yield* pose(S(G.gaze, G.stand), 0.6, 4);
    gust = 1.5; A.osc = [['hr', 0.06, 1.2]];
    yield* wait(3.2);
    yield* pose(S(G.gaze, { afL: -0.4, aoL: -0.25, aeL: 0.9, afR: -0.4, aoR: -0.25, aeR: 0.9 }), 2.5, 3);   // hands behind her back
    // a glance back over her shoulder at you, and a smile
    A.osc = []; A.look = ATCAM;
    yield* pose(S(G.lookBack, { afL: -0.4, aoL: -0.25, aeL: 0.9, afR: -0.4, aoR: -0.25, aeR: 0.9, jaw: 0.2 }), 1.8, 4);
    A.look = null; A.autoLook = true;
    yield* pose(G.stand, 0.5);
  }
  function* twirl() {
    yield* turnTo(faceCam());
    yield* pose(G.twirl, 0.4, 6);
    A.flareT = 1; gust = 1;
    let t = 0; const T = 1.6;
    while (t < T) { t += yield; A.spin = TAU * sm(0, 1, t / T); A.stepping = 0.8; }
    A.spin = 0; A.yaw = A.yaw % TAU; A.stepping = 0; A.flareT = 0;
    puffHearts(R.crown.getWorldPosition(V()), 5);
    yield* pose(S(G.hug, { jaw: 0.3 }), 1.2, 5);
    yield* pose(G.stand, 0.5);
  }
  function* sitBench() {
    const fwd = V(Math.sin(bench.rotation.y), 0, Math.cos(bench.rotation.y)), seat = bench.position.clone().addScaledVector(fwd, 0.2);
    yield* goTo(seat.x + fwd.x * 1.8, seat.z + fwd.z * 1.8);
    yield* goTo(seat.x, seat.z, { face: bench.rotation.y, direct: true });
    A.seat = 1.42; yield* pose(G.sit, 1.0, 3);
    A.osc = [['lkL', 0.18, 2.6], ['lkR', 0.18, 2.6, 1.9]];
    A.autoLook = false; yield* wait(2.5);
    yield* pose(S(G.sit, G.stretch, { lfL: 1.5, lfR: 1.5, lkL: 1.45, lkR: 1.55 }), 1.6, 3);
    yield* pose(G.sit, 1.0, 3);
    A.look = ATCAM; yield* pose(S(G.sit, { twist: 0.4, jaw: 0.2 }), 1.6, 4); A.look = null; A.autoLook = true;
    A.osc = [];
    A.seat = null; yield* pose(G.stand, 1.0, 3);
  }
  function* butterfly() {
    const f = flies.reduce((a, b) => (a.p.distanceTo(A.pos) < b.p.distanceTo(A.pos) ? a : b));
    yield* turnTo(faceCam());
    yield* pose(G.finger, 0.8, 5);
    f.follow = () => handPt(1);
    A.look = () => f.p;
    let t = 0; while (t < 6 && f.p.distanceTo(handPt(1, tv2)) > 0.25) t += yield;
    f.land = 1; A.wide = 1; A.target.jaw = 0.35;
    puffHearts(f.p.clone().add(V(0, 0.3, 0)), 4);
    yield* wait(2.2);
    f.follow = null; f.land = 0; A.look = null; A.target.jaw = 0;
    yield* pose(G.stand, 0.5);
  }
  const ACTS = { smell: [smellFlower, 2], gaze: [gaze, 1.5], twirl: [twirl, 1.1], bench: [sitBench, 1.2], butterfly: [butterfly, 1.2] };
  function* enter() {
    const e = rnd() < 0.5 ? -1 : 1, x0 = e * (halfWAt(0) + 3);
    A.pos.set(x0, 0, pathZ(x0)); A.yaw = -e * Math.PI / 2;
    yield* goTo(e * halfWAt(0) * 0.4, pathZ(e * halfWAt(0) * 0.4));
    yield* turnTo(faceCam());
    A.look = ATCAM; yield* pose(S(G.wave, {}), 0.2, 6); A.osc = [['aoR', 0.28, 9]]; yield* wait(1.4); A.osc = []; A.look = null;
    yield* pose(G.stretch, 1.4, 3); yield* pose(G.stand, 0.5);
  }
  function* life(first) {
    if (first) yield* first();
    let last = '';
    for (;;) {
      for (let i = 0, n = 1 + (rnd() * 2 | 0); i < n; i++) yield* stroll();
      const names = Object.keys(ACTS).filter(k => k !== last);
      let r = rnd() * names.reduce((s, k) => s + ACTS[k][1], 0), pick = names[0];
      for (const k of names) { r -= ACTS[k][1]; if (r <= 0) { pick = k; break; } }
      last = pick;
      yield* ACTS[pick][0]();
    }
  }

  const KEY = 'sp-garden-state';
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify({ x: A.pos.x, z: A.pos.z, yaw: A.yaw, flower: R.hairFlower.visible, t: Date.now() })); } catch (e) { /* fine */ } }
  let restored = false;
  try {
    const st = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (st && Date.now() - st.t < 30 * 60 * 1000 && Math.abs(st.x) < xLim(st.z)) { A.pos.set(st.x, 0, st.z); A.yaw = st.yaw || 0; R.hairFlower.visible = !!st.flower; restored = true; }
  } catch (e) { /* fine */ }
  window.addEventListener('pagehide', save);
  let director = life(restored ? null : enter);

  /* ---------------------------------------------------------------- per frame */
  const m4 = new THREE.Matrix4();
  function step(dt) {
    clock += dt;
    try { director.next(dt); } catch (err) { console.error(err); A.seat = null; A.spin = 0; A.flareT = 0; A.hold = null; director = life(); }
    gust *= Math.exp(-dt * 0.8);
    wind = 0.5 + 0.3 * Math.sin(clock * 0.31) + 0.2 * Math.sin(clock * 0.87) + gust;
    update(dt);
    if (heldFlower.visible) { handPt(1, heldFlower.position); heldFlower.rotation.y = A.yaw; }
    water.userData.time.value = clock;
    for (const c of clouds) { c.c.position.x += c.v * dt; if (c.c.position.x > 1600) c.c.position.x = -1600; }
    for (const b of birds) {
      const a = clock * b.sp + b.ph;
      b.b.position.set(b.cx + Math.cos(a) * b.rad, b.y + Math.sin(a * 2) * 2, b.cz + Math.sin(a) * b.rad * 0.5);
      b.b.rotation.set(0, -a + Math.PI, 0.2);
      const f = Math.sin(clock * 6 + b.ph) * 0.5 * (0.5 + 0.5 * Math.sin(a * 3));
      b.l.rotation.z = f; b.r.rotation.z = -f;
    }
    for (const f of flies) {
      if (f.follow) f.t.copy(f.follow()).add(V(0, f.land ? 0.06 : 0.3, 0));
      else if (f.p.distanceTo(f.t) < 0.6 || clock > f.ph) { f.ph = clock + 3 + rnd() * 4; const s = flowerSpots[(rnd() * flowerSpots.length) | 0] || V(); f.t.set(clamp(s.x, -xLim(s.z), xLim(s.z)), s.y + 0.6 + rnd(), s.z); }
      tv.subVectors(f.t, f.p); const d = tv.length();
      f.p.addScaledVector(tv.normalize(), Math.min(d, dt * (f.land ? 2 : 2.4)));
      f.p.y += Math.sin(clock * 7 + f.ph) * dt * (f.land ? 0 : 0.6);
      f.b.position.copy(f.p); f.b.rotation.y = Math.atan2(tv.x, tv.z);
      const flap = f.land ? 0.6 + 0.3 * Math.sin(clock * 3) : 0.2 + 0.9 * Math.abs(Math.sin(clock * 18 + f.ph));
      f.l.rotation.y = -flap; f.r.rotation.y = flap;
    }
    for (const h of hearts) {
      h.t += dt; h.s.material.opacity = h.t < 1.6 ? Math.sin(Math.PI * h.t / 1.6) : 0;
      if (h.t < 1.6) h.s.position.addScaledVector(h.v, dt).x += Math.sin(clock * 4 + h.v.x * 9) * dt * 0.3;
    }
    treeL.canopy.rotation.z = 0.01 * Math.sin(clock * 0.8) * (1 + gust); treeR.canopy.rotation.z = 0.01 * Math.sin(clock * 0.7 + 1) * (1 + gust);
  }

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
    const night = t !== 'light';
    scene.fog.color.set(night ? 0x2a2038 : 0xf3dcc6);
    renderer.toneMappingExposure = night ? 0.9 : 1.0;
    skyMat.map = skyTexes[night ? 1 : 0]; skyMat.needsUpdate = true;
    hemi.color.set(night ? 0x9a8ac8 : 0xfff1e0); hemi.groundColor.set(night ? 0x2a1c22 : 0x7a5a40); hemi.intensity = night ? 0.8 : 1.15;
    key.color.set(night ? 0xd0c0ff : 0xffe6c8); key.intensity = night ? 1.2 : 2.2;
    sunL.color.set(night ? 0xff8a6a : 0xffb878); sunL.intensity = night ? 1.2 : 1.6;
    sun.material.opacity = night ? 0.75 : 1;
    for (const c of clouds) c.c.material.color.set(night ? 0x8a5a7a : 0xffd6c0);
    lightsMat.emissiveIntensity = night ? 2.4 : 0.2;
  }
  setTheme(opts.theme);
  play();

  return {
    setTheme,
    debug: { camera, scene, renderer, step, A, R, run: name => { director = life(name === 'enter' ? enter : name === 'idle' ? function* () { for (;;) yield; } : ACTS[name][0]); } },
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

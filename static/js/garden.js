/* =============================================================================
   garden.js — "Wishes": a morning on the rim of a great red-rock canyon that opens out to
   the sea, with a flower garden and a little café called Wishes.

   Loaded on demand by site.js (section 16) when the visitor picks it. Everything is
   built in code (no model or image files), on three.js and the shared kit.js.

   The world is drawn "real": layered canyon walls and buttes from a terraced height
   field, a river running down to the sea, waves that catch the low sun, flower beds
   with real petals, grass, trees and a rose arch made of painted leaf and blossom
   sprays, a stone wall, rabbits with fur, and the café with its awning, sign, warm
   windows and tables outside. She is drawn as a cartoon princess: toon shading, ink
   outlines, big eyes, a yellow rose by her ear, long hair that sways and a
   gown that flows. Her story: she picks a rose and smells it, a butterfly lands on her
   face, and she takes the rose to the bench and sits looking out over the canyon. She
   also has coffee at the café, twirls, and gazes at the view. Hearts float up when she
   is happy.

   export start(canvas, { theme, onReady, onSlow }) → { stop(), setTheme(theme) }
   ========================================================================== */
import * as THREE from './vendor/three.module.min.js';
import {
  TAU, sm, clamp, lerp, angDiff, rand, rnd, nz, V, C, mix, canvasTex, radial, mistTex, sculpt,
  taperedTube, SPH, mesh, capsule, makeRig, ell, smin, onFront, surfaceNet, taperCapsule, eyeTexture,
  addEye, furry, KEYS, blank, mirror, vnoise, fbm, css, drawLeaf, drawBlossom, drawRose, foliageCard,
  blossomCard, roseCard, cardCloud, merge, GREENS, tiled, grassTex, stoneTex, woodTex, toonGrad, toon,
  inks, inkMat, inked,
} from './kit.js';

/* ---------------------------------------------------------------- the girl */

function buildGirl(small) {
  const R = makeRig({ hipH: 2.55, hipW: 0.22, neckY: 1.58, neckZ: 0.02, shY: 1.42, shW: 0.52, upper: 0.9, fore: 0.8, thigh: 1.2, shin: 1.18, ankleH: 0.17 });
  const skinC = 0xe9bc99, skinCol = C(skinC), skin = toon(skinC), hairC = 0x2a1a15;
  const gownTop = C(0xc9b2f2), gownHem = C(0xf6b8d4), sashC = C(0x8f6fd6), spark = C(0xfffaf0);
  const sparkle = (x, y, z, c) => (Math.sin(x * 41 + 1.3) * Math.sin(y * 37 + 0.4) * Math.sin(z * 43 + 2.1) > 0.86 ? spark : c);
  // bodice with a sweetheart neckline and a sash
  R.belly = new THREE.Group(); R.torso.add(R.belly);
  const bod = (x, y, z) => smin(smin(ell(x, y, z, 0, 1.08, 0.02, 0.43, 0.47, 0.27), ell(x, y, z, 0, 0.55, 0, 0.32, 0.42, 0.23), 0.25), ell(x, y, z, 0, 1.3, 0.02, 0.41, 0.2, 0.23), 0.2);
  inked(surfaceNet(bod, (x, y, z) => {
    if (y > 1.4 - 0.3 * x * x || (z > 0.05 && y > 1.2 - 0.45 * x * x + 0.05 * Math.cos(x * 9))) return skinCol;
    if (y > 0.5 && y < 0.66) return sashC;
    return sparkle(x, y, z, gownTop);
  }, [-0.7, 0.05, -0.5], [0.7, 1.7, 0.5], 0.028), toon(0xffffff, { vertexColors: true }), R.belly);
  const bowM = toon(sashC);
  for (const s of [1, -1]) {
    inked(SPH, bowM, R.belly, [s * 0.17, 0.62, -0.27], [0.17, 0.09, 0.05], 0.012);
    inked(capsule(0.035, 0.5), bowM, R.belly, [s * 0.08, 0.28, -0.27], undefined, 0.01).rotation.z = s * 0.25;
  }
  inked(SPH, bowM, R.belly, [0, 0.6, -0.29], 0.065, 0.01);
  // a floor-length gown, lavender fading to rose, with a sheer overskirt
  R.skirt = new THREE.Group(); R.skirt.position.y = 0.58; R.pelvis.add(R.skirt);
  {
    const L = 2.8, prof = []; for (let i = 0; i <= 20; i++) { const t = i / 20; prof.push(new THREE.Vector2(0.34 + 1.02 * Math.pow(t, 1.25), -t * L)); }
    const geo = new THREE.LatheGeometry(prof, 72), p = geo.attributes.position, cols = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), t = -y / L, f = 1 + 0.055 * Math.sin(a * 12) * t;
      p.setXYZ(i, x * f, y + 0.05 * Math.sin(a * 12) * sm(0.85, 1, t), z * f);
      let c = mix(gownTop, gownHem, Math.pow(t, 1.3)); if (t > 0.95) c = mix(c, sashC, 0.55);
      c = sparkle(x, y, z, c); cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
    // when she sits the gown drapes: down to her lap, along her thighs, over her knees towards the floor
    const n = p.count, rest = Float32Array.from(p.array), seated = new Float32Array(n * 3), lap = 1.25, drop = 1.62;
    for (let i = 0; i < n; i++) {
      const t = (i % (prof.length)) / (prof.length - 1), x = rest[i * 3], z = rest[i * 3 + 2], a = Math.atan2(x, z), f = (Math.cos(a) + 1) / 2, sd = t * L;
      const s1 = Math.min(sd, 0.45), s2 = clamp(sd - 0.45, 0, lap), s3 = Math.max(0, sd - 0.45 - lap);
      const fy = -s1 * 0.8 - s3, fz = 0.25 + s1 * 0.5 + s2 + s3 * 0.12;                         // front: waist → lap → knees → down
      const by = -Math.min(sd, 0.58), bz = -0.25 - Math.max(0, sd - 0.58) * 0.25;               // back: lies on the seat
      const w = 0.36 + 0.62 * sm(0, 1.6, sd) + 0.15 * sm(1.6, 2.8, sd) * f;
      seated[i * 3] = Math.sin(a) * w; seated[i * 3 + 1] = Math.max(lerp(by, fy, sm(0.15, 0.85, f)), -drop - 0.3); seated[i * 3 + 2] = lerp(bz, fz, Math.pow(f, 0.8)) * (0.55 + 0.45 * Math.abs(Math.cos(a)));
    }
    R.drape = { geo, rest, seated, w: 0 };
    const sk = mesh(geo, toon(0xffffff, { vertexColors: true, side: THREE.DoubleSide }), R.skirt);
    sk.add(new THREE.Mesh(geo, inkMat(0.022)));
    const over = mesh(geo, toon(0xffffff, { transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }), R.skirt);
    over.scale.set(1.05, 0.82, 1.05);
  }
  inked(capsule(0.12, 0.2), skin, R.torso, [0, 1.56, 0.0], undefined, 0.02);
  // head: her slim oval face with a soft chin
  const head = (x, y, z) => {
    let d = ell(x, y, z, 0, 0.7, -0.05, 0.5, 0.64, 0.57);
    d = smin(d, ell(x, y, z, 0, 0.4, 0.08, 0.39, 0.44, 0.45), 0.22);
    d = smin(d, ell(x, y, z, 0, 0.16, 0.22, 0.17, 0.15, 0.19), 0.15);                          // chin
    d = smin(d, ell(x, y, z, 0, 0.45, 0.54, 0.045, 0.1, 0.062), 0.05);                         // a slim nose
    return smin(d, Math.min(ell(x, y, z, 0.5, 0.5, -0.03, 0.065, 0.12, 0.08), ell(x, y, z, -0.5, 0.5, -0.03, 0.065, 0.12, 0.08)), 0.04);
  };
  const H = R.headMesh = new THREE.Group(); H.position.set(0, 0.02, 0.03); R.head.add(H);
  const blush = C(0xe9928a);
  inked(surfaceNet(head, (x, y, z) => mix(skinCol, blush, 0.22 * Math.exp(-(((Math.abs(x) - 0.28) / 0.12) ** 2 + ((y - 0.36) / 0.08) ** 2)) * sm(0.2, 0.45, z)),
    [-0.75, -0.1, -0.75], [0.75, 1.4, 0.8], small ? 0.03 : 0.022), toon(0xffffff, { vertexColors: true }), H, undefined, undefined, 0.022);
  // hair: pulled back sleek from a centre parting, ears showing, into a low ponytail
  const hairD = C(hairC), hairL = C(0x4a2c20);
  const hairline = x => 1.08 - 0.45 * (x / 0.5) ** 2;
  const hairCap = (x, y, z) => {
    let d = ell(x, y, z, 0, 0.73, -0.08, 0.545, 0.67, 0.6);
    d = smin(d, ell(x, y, z, 0, 0.42, -0.36, 0.45, 0.36, 0.3), 0.18);                          // the back of the head, down to the nape
    d = Math.max(d, -Math.max(y - hairline(x), -0.06 - z));                                         // forehead and face clear
    d = Math.max(d, -Math.min(ell(x, y, z, 0.53, 0.44, 0.02, 0.17, 0.24, 0.2), ell(x, y, z, -0.53, 0.44, 0.02, 0.17, 0.24, 0.2)));   // ears clear
    return d;
  };
  const hairCol = (x, y, z) => mix(hairD, hairL, 0.45 * Math.exp(-(((y - 1.12) / 0.1) ** 2)) * sm(-0.3, 0.2, z)
    + 0.22 * sm(0.7, 1, Math.sin(x * 30 + z * 3)) * sm(0.6, 1.0, y)) .lerp(hairD.clone().multiplyScalar(0.55), Math.exp(-((x / 0.018) ** 2)) * sm(0.95, 1.2, y) * sm(-0.1, 0.3, z));   // fine strands and the parting
  inked(surfaceNet(hairCap, hairCol, [-0.85, -0.2, -0.95], [0.85, 1.55, 0.8], small ? 0.03 : 0.022), toon(0xffffff, { vertexColors: true }), H, undefined, undefined, 0.022);
  // loose wisps at her temples
  const wispM = toon(hairC);
  for (const s of [1, -1]) {
    const w = mesh(taperedTube([V(s * 0.4, 0.98, 0.22), V(s * 0.47, 0.78, 0.2), V(s * 0.47, 0.56, 0.2), V(s * 0.44, 0.36, 0.17)], 14, u => 0.03 * (1 - 0.75 * u), null, 6), wispM, H);
    w.rotation.z = s * 0.03;
  }
  // the ponytail, tied at the nape; it sways on its own
  R.hairBack = new THREE.Group(); R.hairBack.position.set(0, 0.5, -0.6); H.add(R.hairBack);
  mesh(new THREE.TorusGeometry(0.1, 0.035, 6, 16), toon(0x1a100c), R.hairBack, [0, 0, -0.02]).rotation.x = 0.4;
  inked(surfaceNet((x, y, z) => {
    const t = clamp(-y / 1.25, 0, 1), w = 0.15 * (1 - 0.65 * t) + 0.03;
    return ell(x + 0.04 * Math.sin(y * 5), y, z + 0.12 * t * t + 0.02 * Math.sin(y * 7 + x * 4), 0, -0.6, -0.08, w, 0.68, w * 0.85);
  }, (x, y, z) => hairCol(x * 0.6, 1.0 + y * 0.1, z), [-0.5, -1.4, -0.6], [0.5, 0.1, 0.4], small ? 0.032 : 0.024), toon(0xffffff, { vertexColors: true }), R.hairBack, undefined, undefined, 0.02);
  R.hairFlower = toonRose(0xffd23a, 1.6); R.hairFlower.position.set(0.6, 0.86, 0.02); R.hairFlower.rotation.set(1.1, 0.5, -0.7); H.add(R.hairFlower);   // a yellow rose by her ear
  R.hairFlower.visible = false;
  // small stud earrings
  const stud = toon(0xf3e2b8);
  for (const s of [1, -1]) mesh(SPH, stud, H, [s * 0.555, 0.4, 0.0], 0.03);
  // face: dark brown eyes, slim brows, round tortoiseshell glasses, a gentle closed-lip smile
  const eyeTex = eyeTexture(0x5a3420, 0x2e1a10, 0x120a06);
  const lashMat = toon(0x22140f), frame = toon(0x9c6650), frameL = toon(0x83503c), lips = toon(0xc96f6f);
  for (const s of [1, -1]) {
    const { p, n } = onFront(head, s * 0.2, 0.62);
    const e = addEye(H, p.clone().addScaledVector(n, -0.045), 0.118, eyeTex, skin);
    e.base.scale.set(1.12, 0.9, 1); e.side = s;
    R.eyes.push(e);
    const lash = mesh(new THREE.TorusGeometry(0.118, 0.015, 6, 18, Math.PI * 0.9), lashMat, H);
    lash.position.copy(p).add(V(0, -0.005, 0.03)); lash.rotation.set(-0.2, s * 0.25, 0.15);
    const f = mesh(new THREE.ConeGeometry(0.014, 0.06, 5), lashMat, H); f.position.copy(p).add(V(s * 0.13, 0.07, -0.01)); f.rotation.z = -s * 1.1;
    const b = onFront(head, s * 0.21, 0.82).p;
    mesh(taperedTube([b.clone().add(V(-s * 0.11, -0.02, 0.02)), b.clone().add(V(s * 0.01, 0.03, 0.03)), b.clone().add(V(s * 0.13, -0.01, 0.0))], 10, u => 0.015 * (1 - 0.55 * Math.abs(u - 0.3)), null, 5), lashMat, H);
    // round frames, a little mottled like tortoiseshell
    const rim = new THREE.Group(); rim.position.copy(p).add(V(0, 0.0, 0.11)); rim.rotation.y = s * 0.12; H.add(rim);
    mesh(new THREE.TorusGeometry(0.175, 0.015, 8, 32), frame, rim);
    for (let k = 0; k < 5; k++) mesh(new THREE.TorusGeometry(0.175, 0.0158, 6, 4, 0.14 + 0.08 * (k % 2)), frameL, rim).rotation.z = k * 1.31 + 0.5;
    mesh(new THREE.CircleGeometry(0.17, 28), new THREE.MeshBasicMaterial({ color: 0xffeef0, transparent: true, opacity: 0.1, depthWrite: false }), rim, [0, 0, -0.005]);
    const arm = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.6, 5), frame, H);
    arm.rotation.x = Math.PI / 2; arm.position.set(s * 0.47, p.y + 0.03, p.z - 0.22); arm.rotation.z = s * 0.1;
  }
  mesh(new THREE.TorusGeometry(0.05, 0.013, 5, 10, Math.PI), frame, H).position.copy(onFront(head, 0, 0.62).p).add(V(0, 0.01, 0.1));
  const m = onFront(head, 0, 0.27);
  R.mouth = mesh(SPH, toon(0x8a3b3b), H, null, [0.055, 0.004, 0.025]); R.mouth.position.copy(m.p).addScaledVector(m.n, -0.008);
  const up = mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 16, Math.PI * 0.5), lips, H);             // a soft closed smile
  up.position.copy(m.p).add(V(0, 0.075, 0.005)); up.rotation.set(-0.2, 0, Math.PI + Math.PI * 0.25);
  mesh(SPH, lips, H, null, [0.042, 0.014, 0.022]).position.copy(m.p).add(V(0, -0.018, 0.0));
  // the nose: a soft shadow under the tip and the nostrils
  const noseSh = toon(0xcf9a7c), nb = onFront(head, 0, 0.4);
  mesh(new THREE.TorusGeometry(0.035, 0.009, 5, 10, Math.PI * 0.8), noseSh, H, [nb.p.x, nb.p.y + 0.01, nb.p.z + 0.02]).rotation.set(-0.3, 0, Math.PI + Math.PI * 0.1);
  R.mouthPt = new THREE.Object3D(); R.mouthPt.position.copy(m.p).add(V(0, 0, 0.06)); H.add(R.mouthPt);
  R.nosePt = new THREE.Object3D(); R.nosePt.position.copy(onFront(head, 0, 0.47).p).add(V(0, 0.02, 0.08)); H.add(R.nosePt);
  R.crown = new THREE.Object3D(); R.crown.position.set(0, 1.45, 0); H.add(R.crown);
  // arms with sheer puff sleeves; slender cartoon hands
  const puff = sculpt((x, y, z) => [x * 0.22, y * 0.19 - 0.08, z * 0.22], null, 20, 14);
  const upper = taperCapsule(0.12, 0.1, 0.82), fore = taperCapsule(0.1, 0.075, 0.74);
  const hand = surfaceNet((x, y, z) => smin(ell(x, y, z, 0, -0.1, 0.0, 0.09, 0.13, 0.055), ell(x, y, z, 0, -0.04, 0.085, 0.035, 0.07, 0.035), 0.04), () => skinCol, [-0.2, -0.3, -0.15], [0.2, 0.1, 0.2], 0.018);
  for (const a of R.arm) {
    inked(puff, toon(0xd9c8f8, { transparent: true, opacity: 0.85 }), a.sh, undefined, undefined, 0.018);
    inked(upper, skin, a.sh, undefined, undefined, 0.016);
    mesh(SPH, skin, a.el, undefined, 0.1);
    inked(fore, skin, a.el, undefined, undefined, 0.016);
    inked(hand, toon(0xffffff, { vertexColors: true }), a.hand, undefined, undefined, 0.012);
    a.hand.userData.holdPt = new THREE.Object3D(); a.hand.userData.holdPt.position.set(0, -0.2, 0.08); a.hand.add(a.hand.userData.holdPt);
  }
  // legs (mostly under the gown) and pink slippers with little bows
  const thigh = taperCapsule(0.17, 0.12, 1.15), shin = taperCapsule(0.12, 0.08, 1.12), slip = toon(0xf6a5c8);
  for (const l of R.leg) {
    mesh(thigh, skin, l.hip); inked(shin, skin, l.knee, undefined, undefined, 0.014);
    inked(sculpt((x, y, z) => [x * 0.12, y * 0.09, z * 0.25], null, 16, 10), slip, l.ankle, [0, -0.08, 0.1], undefined, 0.014);
    mesh(SPH, toon(0xffffff), l.ankle, [0, -0.02, 0.28], [0.06, 0.035, 0.03]);
  }
  return R;
}

/* ---------------------------------------------------------------- scenery */

const STRATA = [0xb4553a, 0xd2864c, 0xe7b57a, 0xa8604b, 0xc9784e, 0x8f5a52, 0xdca06a, 0xbf6a45, 0xe9c28f, 0x9c4c3a].map(C);

// The canyon: terraced plateau, a meandering river gorge, buttes standing in it,
// the whole thing sinking into the sea on the right, far away.
const riverX = z => 30 * Math.sin(z * 0.011 + 0.6) + 16 * Math.sin(z * 0.027 + 1.3) - 20;
const riverY = z => lerp(-24.4, -40.6, sm(-280, -400, z));
// The waterfall: it pours off the front of the big mesa on the left into a plunge pool carved
// out of the rock (an amphitheatre with sheer walls), and a short channel takes it to the river.
const POOL = V(-48, 0, -368), OUTLET = V(-24, 0, -354), POOL_Y = riverY(-360) + 0.4;
function poolCut(x, z) {
  const ax = OUTLET.x - POOL.x, az = OUTLET.z - POOL.z, u = clamp(((x - POOL.x) * ax + (z - POOL.z) * az) / (ax * ax + az * az), 0, 1);
  const d = Math.hypot(x - POOL.x - ax * u, z - POOL.z - az * u);
  return sm(lerp(5, 2.5, u), lerp(13, 7, u), d);                                              // 0 in the pool and channel, 1 on the rock
}
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
  h = Math.min(h, lerp(POOL_Y - 2.5, h, poolCut(x, z)));                                     // the plunge pool and its channel
  return Math.min(h, lerp(-22, 40, sm(-30, -150, z)));                                        // the gorge right below the garden
}

function buildCanyon(small) {
  const nx = small ? 260 : 480, nzr = small ? 130 : 210, X = 560;
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
  return new THREE.Mesh(g, rockMaterial());   // drawn after the lawn, so its faded edge hides it
}

// GLSL shared by the rock and the bark: 3D value noise (rn), a few octaves of it (rf), and
// bump mapping from any height expression via screen-space derivatives (no texture needed).
const NOISE_GLSL = `
  float rh(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float rn(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(rh(i), rh(i + vec3(1, 0, 0)), f.x), mix(rh(i + vec3(0, 1, 0)), rh(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(rh(i + vec3(0, 0, 1)), rh(i + vec3(1, 0, 1)), f.x), mix(rh(i + vec3(0, 1, 1)), rh(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float rf(vec3 p) { return 0.5 * rn(p) + 0.25 * rn(p * 2.03 + 7.1) + 0.125 * rn(p * 4.1 + 3.3) + 0.0625 * rn(p * 8.3 + 1.7); }
`;
const BUMP_GLSL = h => `
  {
    vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition);
    float dhx = dFdx(${h}), dhy = dFdy(${h});
    vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx);
    float det = dot(dpx, r1);
    normal = normalize(abs(det) * normal - sign(det) * (dhx * r1 + dhy * r2));
  }`;

// Sandstone: the vertex colours give the big layers; the shader adds what makes it read as rock
// up close: thin bedding lines that wander, weathered patches, dark desert-varnish streaks down
// the cliff faces, and a bumpy surface (bump-mapped from the same noise) so the light catches
// ridges and pockets instead of sliding over smooth clay. The detail fades out with distance.
function rockMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, transparent: true });
  m.onBeforeCompile = sh => {
    sh.vertexShader = 'varying vec3 vWPos;\nvarying vec3 vWNorm;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
      vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vWNorm = normalize(mat3(modelMatrix) * objectNormal);`);
    sh.fragmentShader = 'varying vec3 vWPos;\nvarying vec3 vWNorm;\n' + NOISE_GLSL + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        float rDist = length(vWPos - cameraPosition);
        float rNear = 1.0 - smoothstep(120.0, 520.0, rDist);
        float steepW = 1.0 - smoothstep(0.35, 0.8, vWNorm.y);
        float wob = rf(vec3(vWPos.xz * 0.04, 0.0)) * 3.0;
        float bed = sin((vWPos.y + wob) * 5.5) * 0.5 + 0.5;                                   // thin bedding lines
        float bed2 = smoothstep(0.55, 0.95, sin((vWPos.y + wob * 1.7) * 1.3 + 1.0));
        float patchN = rf(vWPos * vec3(0.12, 0.3, 0.12));                                     // weathered patches
        float streak = rf(vec3(vWPos.x * 0.55, vWPos.y * 0.035, vWPos.z * 0.55));            // varnish running down the faces
        vec3 c = diffuseColor.rgb;
        c *= mix(1.0, 0.86 + 0.2 * bed, steepW * rNear);
        c *= 1.0 - 0.1 * bed2 * steepW;
        c *= 0.82 + 0.36 * patchN;
        c = mix(c, c * vec3(0.48, 0.38, 0.34), smoothstep(0.52, 0.78, streak) * steepW * 0.75);
        float lum = dot(c, vec3(0.299, 0.587, 0.114));
        diffuseColor.rgb = mix(vec3(lum), c, 0.82);                                           // real sandstone is less saturated than paint
      `)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          float hb = rf(vWPos * 0.9) * 0.5 + rf(vWPos * vec3(0.25, 2.2, 0.25)) * 0.35 + rn(vWPos * 3.1) * 0.15;
          hb *= 0.9 * rNear;
          ` + BUMP_GLSL('hb') + `
        }`);
  };
  return m;
}

// Water: flat geometry, waves in the shading, so the low sun leaves a glittering path. Each wave
// fades out once it is finer than a pixel (no shimmering stripes far away), the sky is reflected
// more strongly at a glance (Fresnel), and `haze` thins the fog so the far sea still reads blue.
// `u` shares the time and sky uniforms between the river and the sea.
function waterMaterial(colour, haze = 1, u = { time: { value: 0 }, sky: { value: C(0x8fb0cf) } }) {
  const m = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.16, metalness: 0.05, transparent: true });
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = u.time; sh.uniforms.uSky = u.sky;
    sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform float uTime;\nuniform vec3 uSky;\nvarying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
      {
        float fr = 0.02 + 0.98 * pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 5.0);   // the sky in the water, stronger at a glance
        outgoingLight = mix(outgoingLight, uSky, clamp(fr, 0.0, 0.55));
      }
      #include <opaque_fragment>`).replace('#include <fog_fragment>', `
      #ifdef USE_FOG
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth) * ${haze.toFixed(2)});
      #endif`).replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      {
        vec2 p = vWPos.xz;
        float t = uTime, px = length(fwidth(p));
        vec2 g = vec2(0.0);
        #define WAVE(a, k, s) g += a * k * cos(dot(p, k) + t * s) * clamp(1.0 - px * length(k) * 1.5, 0.0, 1.0);
        WAVE(0.30, vec2(0.08, 0.05), 0.9)
        WAVE(0.22, vec2(-0.05, 0.11), 1.3)
        WAVE(0.16, vec2(0.21, -0.13), 1.9)
        WAVE(0.10, vec2(-0.37, -0.29), 2.6)
        WAVE(0.06, vec2(0.71, 0.53), 3.4)
        vec3 wn = normalize(vec3(-g.x * 6.0, 1.0, -g.y * 6.0));
        normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
      }`);
  };
  m.customProgramCacheKey = () => 'water' + haze;
  m.userData = u;
  return m;
}

// The waterfall, its spray and a rainbow. The falling sheet follows the rock face down into the
// plunge pool; streaks and droplets race down it (faster lower down, as the water speeds up) and
// its edges fray. Spray billows up from the foot, foam spreads on the pool, and a rainbow stands
// in the spray: a spectral arc, red outside and violet inside, slightly brighter within the bow,
// fading where it meets the gorge. update() animates it; face() turns the bow to the viewer.
function buildWaterfall(water) {
  const g = new THREE.Group(), time = { value: 0 }, light = { value: 1 }, bowK = { value: 1 };
  const lipZ = POOL.z - 13.5, top = canyonH(POOL.x, lipZ - 1) + 0.2, S = 48, U = 10, path = [];
  for (let i = 0, zPrev = lipZ; i <= S; i++) {
    const t = i / S, y = lerp(top, POOL_Y, t);
    let z = zPrev; while (z < POOL.z && canyonH(POOL.x, z) > y) z += 0.1;                // the rock face at this height
    zPrev = z; path.push(V(POOL.x, y, z + 0.6 + 1.4 * Math.sqrt(t)));
  }
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= S; i++) for (let j = 0; j <= U; j++) {
    const t = i / S, u = j / U, w = lerp(4, 9, Math.pow(t, 0.8)), p = path[i];
    pos.push(p.x + (u - 0.5) * w, p.y, p.z + 0.5 * (1 - (2 * u - 1) ** 2)); uv.push(u, t);
    if (i < S && j < U) { const k = i * (U + 1) + j; idx.push(k, k + U + 1, k + 1, k + 1, k + U + 1, k + U + 2); }
  }
  const sheet = new THREE.BufferGeometry();
  sheet.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sheet.setAttribute('fuv', new THREE.Float32BufferAttribute(uv, 2)); sheet.setIndex(idx);
  const shaded = (key, frag, opts) => {
    const m = new THREE.MeshBasicMaterial(Object.assign({ transparent: true, depthWrite: false, side: THREE.DoubleSide }, opts));
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { uTime: time, uLight: light, uBow: bowK });
      sh.vertexShader = 'attribute vec2 fuv;\nvarying vec2 vFUv;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFUv = fuv;');
      sh.fragmentShader = 'uniform float uTime;\nuniform float uLight;\nuniform float uBow;\nvarying vec2 vFUv;\n' + NOISE_GLSL + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + frag);
    };
    m.customProgramCacheKey = () => key;
    return m;
  };
  const fall = mesh(sheet, shaded('waterfall', `
    float u = vFUv.x, v = vFUv.y, sp = 1.0 + 1.8 * v;
    float streak = rf(vec3(u * 9.0, v * 2.5 - uTime * 0.9 * sp, 0.0));
    float fine = rn(vec3(u * 38.0, v * 7.0 - uTime * 2.6 * sp, 3.0));
    float ragged = (rn(vec3(v * 6.0 - uTime * 1.5, u * 2.0, 7.0)) - 0.5) * 0.24;
    float edge = smoothstep(0.0, 0.22, u + ragged) * smoothstep(1.0, 0.78, u - ragged);
    float a = edge * clamp(0.3 + 0.85 * streak * (0.6 + 0.6 * fine), 0.0, 1.0) * smoothstep(0.0, 0.03, v);
    vec3 c = mix(vec3(0.6, 0.72, 0.78), vec3(1.0), smoothstep(0.3, 0.8, streak * (0.7 + 0.5 * fine)));
    diffuseColor = vec4(c * uLight, a * 0.92);`), g);
  fall.renderOrder = 2;
  const foot = path[S];
  // the pool, the channel to the river, and foam where the water lands
  mesh(new THREE.CircleGeometry(7, 32).rotateX(-Math.PI / 2), water, g, [POOL.x, POOL_Y, POOL.z]).renderOrder = 0;
  {
    const a = V(POOL.x, POOL_Y, POOL.z), b = V(OUTLET.x, riverY(OUTLET.z) + 0.05, OUTLET.z), d = b.clone().sub(a), n = V(-d.z, 0, d.x).normalize(), p = [], ix = [];
    for (let i = 0; i <= 12; i++) { const u = i / 12, c = a.clone().addScaledVector(d, u), w = lerp(3.5, 2.5, u); c.y = lerp(a.y, b.y, u); p.push(c.x + n.x * w, c.y, c.z + n.z * w, c.x - n.x * w, c.y, c.z - n.z * w); if (i < 12) ix.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); cg.setIndex(ix); cg.computeVertexNormals();
    mesh(cg, water, g).renderOrder = 0;
  }
  const foamG = new THREE.PlaneGeometry(16, 16).rotateX(-Math.PI / 2); foamG.setAttribute('fuv', foamG.attributes.uv);
  mesh(foamG, shaded('foam', `
    vec2 q = vFUv * 2.0 - 1.0; float r = length(q), an = atan(q.y, q.x);
    float f = rf(vec3(an * 3.0, r * 6.0 - uTime * 1.2, 5.0)) * rn(vec3(q * 9.0, uTime * 0.6));
    diffuseColor = vec4(vec3(0.95, 0.98, 1.0) * uLight, smoothstep(1.0, 0.25, r) * smoothstep(0.15, 0.55, f + 0.35 * (1.0 - r)) * 0.85);`), g, [foot.x, POOL_Y + 0.08, foot.z + 1.5]).renderOrder = 2;
  // spray billowing up from the foot
  const mist = [];
  for (let i = 0; i < 16; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, transparent: true, depthWrite: false, opacity: 0 }));
    sp.renderOrder = 3; g.add(sp); mist.push({ sp, t: i / 16, a: rand() * TAU });
  }
  // the rainbow
  const R = 18, bowG = new THREE.PlaneGeometry(2 * R, R).translate(0, R / 2, 0); bowG.setAttribute('fuv', bowG.attributes.uv);
  const bow = mesh(bowG, shaded('rainbow', `
    vec2 q = vFUv * vec2(2.0, 1.0) - vec2(1.0, 0.0);
    float r = length(q), k = clamp((r - 0.87) / 0.13, 0.0, 1.0);                                // a thin band: violet inside, red outside
    vec3 hue = vec3(smoothstep(0.35, 0.9, k) + 0.25 * smoothstep(0.25, 0.0, k),                // soft spectrum, red and yellow strongest
                    smoothstep(0.15, 0.55, k) * smoothstep(1.0, 0.6, k),
                    smoothstep(0.65, 0.1, k) * 0.85);
    float band = smoothstep(0.84, 0.91, r) * smoothstep(1.01, 0.95, r);
    float spray = smoothstep(0.8, 0.2, abs(q.x)) * smoothstep(0.45, 0.7, q.y);              // only where it crosses the spray, round the falls
    spray *= 0.55 + 0.45 * rf(vec3(q * 3.0, uTime * 0.25));                                    // and patchy as it drifts
    diffuseColor = vec4(mix(hue, vec3(0.6), 0.2) * band * spray * 0.3 * uBow, 1.0);`, { blending: THREE.AdditiveBlending, fog: false }), g, [foot.x + 1, POOL_Y, foot.z + 6]);
  bow.renderOrder = 4;
  return {
    group: g,
    face(cam) { bow.rotation.y = Math.atan2(cam.x - bow.position.x, cam.z - bow.position.z); },
    setNight(night) { light.value = night ? 0.5 : 1; bowK.value = night ? 0.22 : 1; },
    update(clock, dt) {
      time.value = clock;
      for (const m of mist) {
        m.t = (m.t + dt * 0.1) % 1;
        m.sp.position.set(foot.x + Math.cos(m.a) * m.t * 7, POOL_Y + 1 + m.t * 20, foot.z + 2 + Math.abs(Math.sin(m.a)) * m.t * 5);
        m.sp.scale.setScalar(6 + m.t * 16); m.sp.material.opacity = 0.38 * Math.sin(Math.PI * m.t) * light.value;
      }
    },
  };
}

// Bark: deep vertical furrows between flat plates, darker in the cracks, a little moss low on
// the north side; the same pattern drives a bump so the trunk catches the light like bark.
function barkMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  m.onBeforeCompile = sh => {
    sh.vertexShader = 'varying vec3 vOPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvOPos = position;');
    sh.fragmentShader = 'varying vec3 vOPos;\n' + NOISE_GLSL + `
      float barkH(vec3 p) {
        float a = atan(p.z, p.x);
        float f = rf(vec3(a * 1.6, p.y * 0.35, 0.0));
        float plates = abs(sin(a * 6.0 + f * 6.0 + p.y * 0.12));
        return smoothstep(0.08, 0.7, plates) * 0.8 + rf(vec3(a * 3.0, p.y * 1.2, 1.0)) * 0.2;
      }
    ` + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        float bk = barkH(vOPos);
        diffuseColor.rgb *= mix(0.38, 1.08, bk);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32, 0.38, 0.2), smoothstep(0.55, 0.85, rf(vOPos * 1.4)) * smoothstep(3.0, 0.0, vOPos.y) * 0.5);   // moss near the ground
      `)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float bkh = bk * 0.18;
        ` + BUMP_GLSL('bkh'));
  };
  return m;
}

// Light inside a crown is mostly blocked by the leaves around it. Shade each card of a cloud by
// how deep it sits: dark in the middle and underneath, bright on the sunny outside. This is what
// turns a scatter of leaf cards into a solid, rounded tree.
function shadeCloud(cloud, centre, radius, lo = 0.42, ky = 0.8) {   // ky 0: a column, shaded across only
  const m4 = new THREE.Matrix4(), p = V(), c = new THREE.Color();
  for (let i = 0; i < cloud.count; i++) {
    cloud.getMatrixAt(i, m4); p.setFromMatrixPosition(m4).sub(centre);
    const out = clamp(Math.hypot(p.x, p.z * 0.9, p.y * ky) / radius, 0, 1), up = ky ? clamp(p.y / radius, -1, 1) : 0;
    cloud.getColorAt(i, c); cloud.setColorAt(i, c.multiplyScalar(clamp(lo + (1.05 - lo) * Math.pow(out, 1.3) + 0.18 * up, lo * 0.8, 1.2)));
  }
  cloud.instanceColor.needsUpdate = true;
  return cloud;
}

// Leaves are thin and let light through, so a card facing away from the sky should not go black:
// light every card as if it faced mostly upwards, keeping a little of its own tilt for variety.
function foliageLit(cloud) {
  cloud.material.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      normal = normalize(mix(normal, (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz, 0.65));`);
  };
  cloud.material.customProgramCacheKey = () => 'foliageLit';
  return cloud;
}

function buildTree(greens, blossoms, small, size = 1) {
  const tree = new THREE.Group(), canopy = new THREE.Group(); tree.add(canopy);
  const barkMat = barkMaterial();
  const bark = (u, j) => mix(C(0x4a3a2c), C(0x76624e), 0.5 + 0.3 * Math.sin(u * 23 + j * 2.1) + 0.15 * Math.sin(j * 5.3));   // grey-brown, like real bark
  const spots = [];
  const trunk = [V(0, -0.5, 0), V(0.3, 2.5, 0.1), V(-0.3, 5, 0), V(0.2, 7, -0.1)];
  mesh(taperedTube(trunk, 30, u => 0.8 * (1 + 0.6 * Math.exp(-u * 10)) * (1 - 0.45 * u), bark, 14), barkMat, tree);
  function branch(p0, dir, len, r0, depth) {
    const pts = [p0.clone()]; let p = p0.clone(); const d = dir.clone();
    for (let k = 1; k <= 3; k++) { d.add(V((rand() - 0.5) * 0.5, (rand() - 0.4) * 0.3, (rand() - 0.5) * 0.5)).normalize(); p = p.clone().addScaledVector(d, len / 3); pts.push(p); }
    mesh(taperedTube(pts, 8, u => r0 * (1 - 0.45 * u), bark, 6), barkMat, canopy);
    if (depth <= 1) spots.push(p, pts[2]);
    if (!depth) return;
    for (let k = 0; k < 3; k++) {
      const a = k / 3 * TAU + rand();
      branch(pts[1 + (k % 2)], V(Math.cos(a), 0.35 + rand() * 0.4, Math.sin(a) * 0.7).addScaledVector(d, 0.5).normalize(), len * 0.72, r0 * 0.6, depth - 1);
    }
  }
  branch(trunk[3], V(0, 1, 0), 3.8, 0.5, 3);
  // the crown: painted sprays of leaves and blossom, clumped on the branch tips, with a denser,
  // darker core so you cannot see through it, all shaded by depth
  const centre = spots.reduce((a, p) => a.add(p), V()).multiplyScalar(1 / spots.length);
  const radius = Math.max(...spots.map(p => p.distanceTo(centre))) + 2.5;
  const n = spots.length * (small ? 14 : 24);
  const around = (r, s0, s1) => (i, p) => { p.copy(spots[i % spots.length]).add(V(rand() - 0.5, rand() * 0.8 - 0.3, rand() - 0.5).multiplyScalar(r)); return s0 + rand() * (s1 - s0); };
  const shade = c => foliageLit(shadeCloud(c, centre, radius));
  canopy.add(shade(cardCloud(foliageCard(greens), Math.round(n * 0.25), (i, p) => { p.lerpVectors(centre, spots[i % spots.length], 0.35 + rand() * 0.4); return 2.8 + rand() * 1.2; })));
  canopy.add(shade(cardCloud(foliageCard(greens), Math.round(n * 0.55), around(3.0, 1.8, 2.8))));
  if (blossoms) canopy.add(shade(cardCloud(blossomCard(blossoms, greens), Math.round(n * 0.7), around(2.8, 1.6, 2.6))));
  tree.scale.setScalar(size);
  return { tree, canopy, spots };
}

/* ---------------------------------------------------------------- props: a rose, rabbits, the café */

// A cartoon rose (it belongs to her): petals wound in a spiral round a bud.
function toonRose(col, size = 1) {
  const g = new THREE.Group(), mat = toon(col), dark = toon(C(col).multiplyScalar(0.75));
  mesh(SPH, dark, g, [0, 0.02, 0], [0.05, 0.06, 0.05]);
  for (let k = 0; k < 11; k++) {
    const a = k * 2.4, r = 0.03 + k * 0.009, h = 0.07 - k * 0.003;
    const p = mesh(SPH, k < 4 ? dark : mat, g, [Math.cos(a) * r, 0.02, Math.sin(a) * r], [0.045 + k * 0.004, h, 0.018]);
    p.rotation.set(0, -a + Math.PI / 2, 0); p.rotateX(-0.25 - k * 0.07);
  }
  for (const s of [1, -1]) { const l = mesh(SPH, toon(0x4f8a2e), g, [s * 0.11, -0.05, 0], [0.08, 0.02, 0.04]); l.rotation.z = s * 0.4; }
  g.scale.setScalar(size);
  return g;
}

// A real-looking rabbit with fur, long ears that twitch, and a cotton tail.
function buildRabbit(coat, belly) {
  const rb = new THREE.Group(), body = new THREE.Group(); rb.add(body);
  const sdf = (x, y, z) => {
    let d = smin(ell(x, y, z, 0, 0.42, -0.08, 0.34, 0.36, 0.52), Math.min(ell(x, y, z, 0.17, 0.36, -0.28, 0.19, 0.27, 0.3), ell(x, y, z, -0.17, 0.36, -0.28, 0.19, 0.27, 0.3)), 0.12);
    d = smin(d, ell(x, y, z, 0, 0.74, 0.36, 0.22, 0.22, 0.27), 0.14);
    d = smin(d, Math.min(ell(x, y, z, 0.11, 0.66, 0.5, 0.11, 0.1, 0.12), ell(x, y, z, -0.11, 0.66, 0.5, 0.11, 0.1, 0.12)), 0.06);
    d = smin(d, Math.min(ell(x, y, z, 0.09, 0.1, 0.3, 0.06, 0.12, 0.07), ell(x, y, z, -0.09, 0.1, 0.3, 0.06, 0.12, 0.07)), 0.06);
    return smin(d, Math.min(ell(x, y, z, 0.17, 0.06, -0.14, 0.09, 0.06, 0.27), ell(x, y, z, -0.17, 0.06, -0.14, 0.09, 0.06, 0.27)), 0.05);
  };
  const cC = C(coat), bC = C(belly);
  furry(surfaceNet(sdf, (x, y, z) => mix(cC, bC, sm(0.32, 0.1, y) * sm(-0.2, 0.2, z) + sm(0.6, 0.5, y) * sm(0.5, 0.62, z) * 0.7), [-0.5, -0.05, -0.75], [0.5, 1.05, 0.75], 0.03), body, { len: 0.035, layers: 6, freq: 30 });
  furry(sculpt((x, y, z) => [x * 0.11, y * 0.11, z * 0.1], () => C(0xfaf8f4), 14, 10), body, { len: 0.04, layers: 6, freq: 30, pos: [0, 0.48, -0.6] });
  const eyeM = new THREE.MeshStandardMaterial({ color: 0x120a08, roughness: 0.1 });
  for (const s of [1, -1]) {
    mesh(SPH, eyeM, body, [s * 0.16, 0.8, 0.46], [0.045, 0.05, 0.04]);
    mesh(SPH, new THREE.MeshBasicMaterial({ color: 0xffffff }), body, [s * 0.18, 0.82, 0.48], 0.01);
  }
  mesh(SPH, new THREE.MeshStandardMaterial({ color: 0xd98a96, roughness: 0.5 }), body, [0, 0.72, 0.62], [0.035, 0.025, 0.02]);
  const ears = [];
  for (const s of [1, -1]) {
    const e = new THREE.Group(); e.position.set(s * 0.08, 0.92, 0.28); e.rotation.set(-0.35, 0, -s * 0.18); body.add(e);
    furry(sculpt((x, y, z) => [x * 0.075 * (1 - 0.3 * Math.abs(y)), y * 0.3 + 0.28, z * 0.03 - 0.025 * Math.max(0, z) * (1 - x * x)], (x, y, z) => (z > 0.2 ? mix(C(0xe8a0a8), cC, sm(0.5, 0.9, Math.abs(x))) : cC), 14, 14), e, { len: 0.02, layers: 4, freq: 34 });
    ears.push(e);
  }
  rb.scale.setScalar(1.25);
  return { rb, body, ears, pos: V(), yaw: rand() * TAU, from: V(), to: V(), t: 0, hop: 0, hops: 0, rest: 1 + rand() * 3, twitch: 0, nibble: 0 };
}

// The café: a cream cottage with timber framing, a tiled roof, a striped awning, warm windows,
// a sign, flower boxes, a chalkboard, string lights and bistro tables outside.
function buildCafe() {
  const cafe = new THREE.Group();
  const W = 9, D = 6, Hh = 4.4, B = 0.7;
  const plaster = tiled(canvasTex(256, 256, (c, S) => { c.fillStyle = '#f1e4cc'; c.fillRect(0, 0, S, S); for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(${150 + rand() * 60 | 0},${120 + rand() * 50 | 0},90,${rand() * 0.08})`; c.fillRect(rand() * S, rand() * S, 2 + rand() * 6, 2 + rand() * 6); } }), 2, 1);
  const tiles = tiled(canvasTex(256, 256, (c, S) => {
    c.fillStyle = '#7a3a22'; c.fillRect(0, 0, S, S);
    for (let r = 0; r < 10; r++) for (let k = -1; k < 9; k++) {
      const x = k * 32 + (r % 2) * 16, y = r * 26, g = c.createLinearGradient(0, y, 0, y + 26);
      const base = 0xb5532e + ((rand() * 3 | 0) << 4); g.addColorStop(0, css(base, 1.05)); g.addColorStop(1, css(base, 0.62));
      c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30, y); c.lineTo(x + 30, y + 18); c.quadraticCurveTo(x + 15, y + 30, x, y + 18); c.fill();
    }
  }), 4, 2);
  const wood = new THREE.MeshStandardMaterial({ map: woodTex(0x5a3a24), roughness: 0.8 });
  const stoneM = new THREE.MeshStandardMaterial({ map: tiled(stoneTex('#b7a089'), 3, 1), roughness: 0.95 });
  const wallM = new THREE.MeshStandardMaterial({ map: plaster, roughness: 0.95 });
  mesh(new THREE.BoxGeometry(W + 0.3, B, D + 0.3), stoneM, cafe, [0, B / 2, 0]);
  mesh(new THREE.BoxGeometry(W, Hh, D), wallM, cafe, [0, B + Hh / 2, 0]);
  // timber frame on the front
  const fz = D / 2 + 0.04, beam = (w, h, x, y) => mesh(new THREE.BoxGeometry(w, h, 0.12), wood, cafe, [x, y, fz]);
  for (const x of [-W / 2 + 0.12, -1.25, 1.25, W / 2 - 0.12]) beam(0.24, Hh, x, B + Hh / 2);
  beam(W, 0.24, 0, B + Hh - 0.12); beam(W, 0.2, 0, B + 0.1);
  // the roof: two tiled slopes and plaster gables
  const ridge = 2.8, over = 0.6, half = D / 2 + over, slope = Math.hypot(half, ridge), ang = Math.atan2(ridge, half);
  const roofM = new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.8, side: THREE.DoubleSide });
  for (const s of [1, -1]) {
    const r = mesh(new THREE.PlaneGeometry(W + 1.2, slope), roofM, cafe, [0, B + Hh + ridge / 2, s * half / 2]);
    r.rotation.x = -s * (Math.PI / 2 - ang);                                          // sloping down from the ridge to the eave
  }
  const eave = ridge * over / half, gable = new THREE.Shape();
  gable.moveTo(-D / 2, 0); gable.lineTo(D / 2, 0); gable.lineTo(D / 2, eave); gable.lineTo(0, ridge); gable.lineTo(-D / 2, eave); gable.closePath();
  for (const s of [1, -1]) { const g = mesh(new THREE.ShapeGeometry(gable), wallM, cafe, [s * W / 2, B + Hh, 0]); g.rotation.y = s * Math.PI / 2; }
  mesh(new THREE.BoxGeometry(0.8, 2.4, 0.8), stoneM, cafe, [W / 2 - 1.6, B + Hh + 1.9, -1.2]);
  // windows glowing warm from inside, a door that opens
  const glowTex = canvasTex(128, 128, (c, S) => {
    const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#ffd99a'); g.addColorStop(1, '#e8963e'); c.fillStyle = g; c.fillRect(0, 0, S, S);
    c.fillStyle = 'rgba(90,50,20,.55)'; for (const y of [0.32, 0.62]) c.fillRect(0, S * y, S, 4);
    for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(${120 + rand() * 80 | 0},${60 + rand() * 40 | 0},30,.7)`; c.fillRect(rand() * S, S * (rand() < 0.5 ? 0.22 : 0.52), 6 + rand() * 8, 10 + rand() * 6); }
  });
  const glass = new THREE.MeshStandardMaterial({ map: glowTex, emissive: 0xffb060, emissiveMap: glowTex, emissiveIntensity: 0.5, roughness: 0.2 });
  for (const x of [-2.95, 2.95]) {
    mesh(new THREE.PlaneGeometry(2.6, 2.2), glass, cafe, [x, B + 2.3, fz + 0.02]);
    for (const dx of [-1.35, 0, 1.35]) mesh(new THREE.BoxGeometry(0.1, 2.4, 0.1), wood, cafe, [x + dx, B + 2.3, fz + 0.06]);
    for (const dy of [-1.15, 0, 1.15]) mesh(new THREE.BoxGeometry(2.8, 0.1, 0.1), wood, cafe, [x, B + 2.3 + dy, fz + 0.06]);
    const box = mesh(new THREE.BoxGeometry(2.8, 0.45, 0.55), wood, cafe, [x, B + 1.05, fz + 0.3]);
    box.add(cardCloud(roseCard([0xd23a4e, 0xffd23a, 0xff8fb1, 0xffffff], GREENS), 14, (i, p) => { p.set((rand() - 0.5) * 2.4, 0.35 + rand() * 0.3, (rand() - 0.5) * 0.4); return 0.55 + rand() * 0.3; }));
  }
  const door = new THREE.Group(); door.position.set(-0.85, B, fz + 0.03); cafe.add(door);
  mesh(new THREE.BoxGeometry(1.7, 3.2, 0.1), wood, door, [0.85, 1.6, 0]);
  mesh(new THREE.PlaneGeometry(1.0, 1.0), glass, door, [0.85, 2.3, 0.06]);
  mesh(SPH, new THREE.MeshStandardMaterial({ color: 0xd8b25a, metalness: 0.8, roughness: 0.3 }), door, [1.5, 1.6, 0.1], 0.07);
  // striped awning with a scalloped edge
  const stripes = canvasTex(256, 128, (c, w, h) => {
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f6efe2' : '#6f9a72'; c.fillRect(i * w / 8, 0, w / 8, h * 0.82); }
    for (let i = 0; i < 16; i++) { c.fillStyle = (i >> 1) % 2 ? '#f6efe2' : '#6f9a72'; c.beginPath(); c.arc((i + 0.5) * w / 16, h * 0.82, w / 32, 0, Math.PI); c.fill(); }
  });
  const aw = mesh(new THREE.PlaneGeometry(W - 0.4, 1.8), new THREE.MeshStandardMaterial({ map: stripes, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }), cafe, [0, B + Hh - 0.45, fz + 0.75]);
  aw.rotation.x = 0.85;
  // the sign
  const signTex = canvasTex(512, 160, (c, w, h) => {
    c.fillStyle = '#2f4a3a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d9b45a'; c.lineWidth = 8; c.strokeRect(10, 10, w - 20, h - 20);
    c.fillStyle = '#f2d58a'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'italic bold 84px Georgia, "Times New Roman", serif'; c.fillText('Wishes', w / 2 + 44, h / 2 - 8);
    c.font = '28px Georgia, "Times New Roman", serif'; c.fillText('c a f é', w / 2 + 44, h - 30);
    c.strokeStyle = '#f2d58a'; c.lineWidth = 7; c.beginPath(); c.moveTo(80, 60); c.lineTo(88, 115); c.lineTo(132, 115); c.lineTo(140, 60); c.closePath(); c.stroke();
    c.beginPath(); c.arc(146, 82, 12, -Math.PI / 2, Math.PI / 2); c.stroke();
    for (const x of [96, 112, 126]) { c.beginPath(); c.moveTo(x, 50); c.bezierCurveTo(x - 8, 38, x + 8, 30, x, 18); c.stroke(); }
  });
  mesh(new THREE.PlaneGeometry(3.4, 1.06), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6, emissive: 0x222222, emissiveMap: signTex, emissiveIntensity: 0.2 }), cafe, [0, B + Hh + 0.75, fz + 0.65]).rotation.x = -0.1;
  // chalkboard
  const chalk = canvasTex(160, 220, (c, w, h) => {
    c.fillStyle = '#5a3a24'; c.fillRect(0, 0, w, h); c.fillStyle = '#26302a'; c.fillRect(10, 10, w - 20, h - 20);
    c.fillStyle = '#f4efe4'; c.font = 'bold 24px Georgia, serif'; c.textAlign = 'center';
    c.fillText('Coffee', w / 2, 60); c.fillText('Tea', w / 2, 100); c.fillText('Cake', w / 2, 140);
    c.fillStyle = '#ff9ec4'; c.beginPath(); c.arc(w / 2 - 8, 178, 9, 0, TAU); c.arc(w / 2 + 8, 178, 9, 0, TAU); c.fill(); c.beginPath(); c.moveTo(w / 2 - 17, 181); c.lineTo(w / 2, 200); c.lineTo(w / 2 + 17, 181); c.fill();
  });
  const ab = new THREE.Group(); ab.position.set(2.6, 0, fz + 1.5); ab.rotation.y = -0.3; cafe.add(ab);
  for (const s of [1, -1]) { const b = mesh(new THREE.PlaneGeometry(1.0, 1.4), new THREE.MeshStandardMaterial({ map: chalk, side: THREE.DoubleSide, roughness: 0.9 }), ab, [0, 0.7, s * 0.18]); b.rotation.x = s * 0.25; }
  // pots by the door
  for (const x of [-2.2, 1.6]) {
    const pot = mesh(new THREE.LatheGeometry([[0.001, 0], [0.32, 0], [0.42, 0.65], [0.46, 0.7]].map(([a, b]) => new THREE.Vector2(a, b)), 16), new THREE.MeshStandardMaterial({ color: 0xb8653a, roughness: 0.85 }), cafe, [x, 0, fz + 0.6]);
    pot.add(cardCloud(foliageCard(GREENS), 16, (i, p) => { p.set((rand() - 0.5) * 0.7, 0.9 + rand() * 0.9, (rand() - 0.5) * 0.7); return 0.6 + rand() * 0.4; }));
  }
  // bistro tables, chairs and an umbrella
  const iron = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.45, metalness: 0.6 }), marble = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.3 });
  const tables = [];
  for (const [tx, tz] of [[5.6, 5.4], [8.4, 3.2]]) {
    const t = new THREE.Group(); t.position.set(tx, 0, tz); cafe.add(t);
    mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.08, 28), marble, t, [0, 1.95, 0]);
    mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.9, 8), iron, t, [0, 0.95, 0]);
    mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.06, 16), iron, t, [0, 0.03, 0]);
    const seats = [];
    for (const a of [0.9, -2.2]) {
      const ch = new THREE.Group(); ch.position.set(Math.sin(a) * 1.35, 0, Math.cos(a) * 1.35); ch.rotation.y = a + Math.PI; t.add(ch);
      mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.07, 20), iron, ch, [0, 1.32, 0]);
      for (const [lx, lz] of [[0.28, 0.28], [-0.28, 0.28], [0.28, -0.28], [-0.28, -0.28]]) mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.32, 5), iron, ch, [lx, 0.66, lz]);
      mesh(new THREE.TorusGeometry(0.36, 0.035, 6, 20, Math.PI), iron, ch, [0, 1.75, -0.38]);
      seats.push({ chair: ch });
    }
    tables.push({ t, seats });
  }
  const umb = new THREE.Group(); umb.position.set(5.6, 0, 5.4); cafe.add(umb);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.6, 6), wood, umb, [0, 2.3, 0]);
  const canopyTex = canvasTex(256, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f6efe2' : '#6f9a72'; c.fillRect(i * w / 8, 0, w / 8, h); } });
  mesh(new THREE.ConeGeometry(2.3, 0.9, 16, 1, true), new THREE.MeshStandardMaterial({ map: canopyTex, side: THREE.DoubleSide, roughness: 0.9 }), umb, [0, 4.55, 0]);
  // string lights from the roof to the umbrella pole
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffb54a, emissiveIntensity: 0.25 });
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.08, 8, 6), bulbM, 24), m4 = new THREE.Matrix4(), a0 = V(W / 2, B + Hh, fz), a1 = V(5.6, 4.0, 5.4);
  for (let i = 0; i < 24; i++) { const u = (i + 0.5) / 24, p = a0.clone().lerp(a1, u); p.y -= Math.sin(Math.PI * u) * 0.7; m4.makeTranslation(p.x, p.y, p.z); bulbs.setMatrixAt(i, m4); }
  cafe.add(bulbs);
  const light = new THREE.PointLight(0xffb45a, 0, 16, 1.6); light.position.set(0, 2.6, fz + 1.5); cafe.add(light);
  // chimney smoke
  const smoke = [];
  for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]), transparent: true, depthWrite: false })); cafe.add(s); smoke.push({ s, t: i / 6 }); }
  return { cafe, door, doorPt: V(0, 0, fz + 1.4), insidePt: V(0, 0, fz - 1.6), tables, glass, bulbM, light, smoke, chimney: V(W / 2 - 1.6, B + Hh + 3.2, -1.2) };
}

// A white mug of coffee.
function buildMug() {
  const g = new THREE.Group();
  mesh(new THREE.LatheGeometry([[0.001, 0], [0.13, 0], [0.14, 0.02], [0.15, 0.26], [0.135, 0.26], [0.125, 0.04], [0.001, 0.04]].map(([a, b]) => new THREE.Vector2(a, b)), 20), new THREE.MeshStandardMaterial({ color: 0xfbfaf6, roughness: 0.25, side: THREE.DoubleSide }), g);
  mesh(new THREE.CircleGeometry(0.128, 20).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5a3420, roughness: 0.2 }), g, [0, 0.21, 0]);
  mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 12), new THREE.MeshStandardMaterial({ color: 0xfbfaf6, roughness: 0.25 }), g, [0.16, 0.14, 0]);
  return g;
}

/* ---------------------------------------------------------------- poses */

const G = {
  stand: {},
  sniff: { lean: 0.55, hp: 0.4, hr: 0.15, lfL: 0.3, lkL: 0.55, lfR: 0.3, lkR: 0.55, afR: 0.95, aeR: 0.9, aoR: -0.1, afL: 0.15, aeL: 0.25 },
  pick: { lean: 0.6, hp: 0.5, lfL: 0.35, lkL: 0.65, lfR: 0.35, lkR: 0.65, afR: 0.85, aeR: 0.3, aoR: 0.05 },
  shy: { hr: 0.24, hp: 0.08, afL: 1.0, aeL: 2.25, aoL: -0.45, afR: 0.3, aeR: 0.5, aoR: -0.2, jaw: 0.15 },
  carry: { afR: 0.65, aeR: 1.55, aoR: -0.3 },
  lap: { afR: 0.6, aeR: 1.05, aoR: -0.4, afL: 0.55, aeL: 0.95, aoL: -0.35 },
  sip: { afR: 1.15, aeR: 2.1, aoR: -0.28, hp: 0.06 },
  cup: { afR: 0.75, aeR: 1.65, aoR: -0.25, afL: 0.7, aeL: 1.6, aoL: -0.4 },
  giggle: { hr: 0.18, afL: 0.9, aeL: 2.1, aoL: -0.5, afR: 0.65, aeR: 1.55, aoR: -0.3, jaw: 0.35 },
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
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xdcd6d2, 45, 1250);                                 // aerial haze: the far rim fades and cools
  const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 2600);
  const tanH = Math.tan(THREE.MathUtils.degToRad(17.5));

  // morning light: a soft key from the viewer's left, the low sun ahead over the sea
  const hemi = new THREE.HemisphereLight(0xdfe8f4, 0x7a5a40, 1.05); scene.add(hemi);   // blue skylight fills the shade
  const key = new THREE.DirectionalLight(0xffe6c8, 2.3); key.position.set(-30, 40, 40); scene.add(key);
  // the key light casts soft shadows over the garden (trees, café, arch, bench, wall)
  key.castShadow = true; key.shadow.mapSize.setScalar(small ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -75, right: 75, top: 45, bottom: -45, near: 1, far: 160 });
  key.shadow.bias = -0.0006; key.shadow.normalBias = 0.04; key.shadow.radius = 3;
  const sunL = new THREE.DirectionalLight(0xffb878, 1.6); sunL.position.set(300, 60, -900); scene.add(sunL);

  /* sky band, sun, clouds */
  const skyMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false });
  const skyTex = night => canvasTex(4, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    if (night) { g.addColorStop(0, 'rgba(30,24,60,0)'); g.addColorStop(0.55, 'rgba(70,46,96,.55)'); g.addColorStop(0.85, 'rgba(196,108,110,.85)'); g.addColorStop(1, 'rgba(240,160,110,1)'); }
    else { g.addColorStop(0, 'rgba(120,166,222,0)'); g.addColorStop(0.3, 'rgba(126,172,224,.6)'); g.addColorStop(0.58, 'rgba(176,204,232,.95)'); g.addColorStop(0.8, 'rgba(226,224,222,1)'); g.addColorStop(1, 'rgba(250,228,200,1)'); }
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  const skyTexes = [skyTex(false), skyTex(true)];
  const sky = mesh(new THREE.PlaneGeometry(6000, 900), skyMat, scene, [0, 150, -2300]); sky.renderOrder = -10;
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, 'rgba(255,252,236,1)'], [0.12, 'rgba(255,240,200,1)'], [0.3, 'rgba(255,200,130,.45)'], [1, 'rgba(255,170,100,0)']]), fog: false, transparent: true, depthWrite: false }));
  sun.position.set(560, 12, -2200); sun.scale.setScalar(520); sun.renderOrder = -9; scene.add(sun);
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, fog: false, transparent: true, depthWrite: false, color: 0xffffff, opacity: 0.85 }));
    c.position.set((rand() * 2 - 1) * 1400, 110 + rand() * 260, -1900 - rand() * 200); c.scale.set(700 + rand() * 600, 180 + rand() * 120, 1);
    c.renderOrder = -8; scene.add(c); clouds.push({ c, v: 3 + rand() * 5 });
  }

  /* the canyon, the river and the sea */
  const canyon = buildCanyon(small); canyon.renderOrder = 1; scene.add(canyon);
  const water = waterMaterial(0x2c6a72), seaWater = waterMaterial(0x1d5878, 0.4, water.userData);   // a greener river, a deep blue sea
  const sea = mesh(new THREE.PlaneGeometry(6000, 2600).rotateX(-Math.PI / 2), seaWater, scene, [0, -41, -1500]); sea.renderOrder = 0;
  {
    const pts = []; for (let z = -20; z > -460; z -= 10) pts.push(V(riverX(z), riverY(z), z));
    const curve = new THREE.CatmullRomCurve3(pts), segs = 120, g = new THREE.BufferGeometry(), p = [], ix = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs, c = curve.getPointAt(u), tg = curve.getTangentAt(u), w = 7 + 6 * u;
      p.push(c.x - tg.z * w, c.y, c.z + tg.x * w, c.x + tg.z * w, c.y, c.z - tg.x * w);
      if (i < segs) ix.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix); g.computeVertexNormals();
    mesh(g, water, scene).renderOrder = 0;
  }
  const waterfall = buildWaterfall(water); scene.add(waterfall.group);

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
    const g1 = C(0xc9d6b6), g2 = C(0xeef0e2), g3 = C(0xa6b48e), dry = C(0xe2d6a8), rock = C(0xb0704a);   // natural, uneven lawn with sun-dried patches
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), edge = rimZ(x), drop = sm(edge, edge - 4, z);
      p.setY(i, -drop * 14 + (1 - drop) * 0.15 * nz(x * 0.3, 0, z * 0.3));
      const k = mix(mix(mix(mix(g1, g2, nz(x * 0.15, 1, z * 0.15) * 0.5 + 0.5), g3, sm(0.3, 0.9, nz(x * 0.4, 2, z * 0.4)) * 0.5), dry, sm(0.25, 0.7, fbm(x * 0.06 + 9, z * 0.09, 3)) * 0.45), rock, sm(0.02, 0.3, drop));
      cols.push(k.r, k.g, k.b, 1 - sm(6, 17, z));
    }
    lawn.setAttribute('color', new THREE.Float32BufferAttribute(cols, 4)); lawn.computeVertexNormals();
    const ground = mesh(lawn, new THREE.MeshStandardMaterial({ map: grassTex(), vertexColors: true, transparent: true, roughness: 1 }), world); ground.renderOrder = -2; ground.receiveShadow = true;
  }
  // blades of grass
  {
    const blade = new THREE.BufferGeometry();
    blade.setAttribute('position', new THREE.Float32BufferAttribute([-0.04, 0, 0, 0.04, 0, 0, -0.025, 0.3, 0.02, 0.025, 0.3, 0.02, 0, 0.6, 0.07], 3));
    blade.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4]); blade.computeVertexNormals();
    const n = small ? 3000 : 8000, g = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9 }), n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let k = 0;
    for (let i = 0; i < n * 2 && k < n; i++) {
      const x = (rand() * 2 - 1) * 75, z = -15 + rand() * 25;
      if (z < rimZ(x) + 1.8 || Math.abs(z - pathZ(x)) < 1.9) continue;
      m4.compose(V(x, 0, z), q.setFromEuler(e.set((rand() - 0.5) * 0.5, rand() * TAU, (rand() - 0.5) * 0.5)), V(1, 0.5 + rand() * 0.9, 1)); g.setMatrixAt(k, m4);
      g.setColorAt(k++, mix(C(GREENS[(rand() * GREENS.length) | 0]), C(rand() < 0.15 ? 0xb8ad78 : 0x7d8a52), 0.3).multiplyScalar(0.9 + rand() * 0.35));   // olive and straw, not paint green
    }
    g.count = k; world.add(g);
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
    const path = mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), world); path.renderOrder = -1; path.receiveShadow = true;
  }
  // low stone wall along the rim, with a string of little lights
  const lightsMat = new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffb84a, emissiveIntensity: 0.2 });
  {
    const stone = new THREE.MeshStandardMaterial({ map: stoneTex(), roughness: 0.95 });
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
  // flower beds along both sides of the path: real petals, stems and leaves
  const flowerSpots = [];
  {
    // a flat flower of n petals, cupped (or with drooping tips), each petal shaded darker towards its base
    const petals = (n, R, cup, inner = 0.3, droop = 0) => {
      const pos = [0, 0, 0], col = [0.5, 0.5, 0.5], idx = [], N = 72, rings = [[0.3, 0.62], [0.65, 0.92], [1, 1.08]];
      for (const [ring, k] of rings) for (let i = 0; i < N; i++) {
        const a = i / N * TAU, lobe = Math.pow(Math.abs(Math.cos(a * n / 2)), 0.6), r = R * ring * (inner + (1 - inner) * lobe), t = r / R;
        pos.push(Math.cos(a) * r, (cup * t * t - droop * t ** 4) * R, Math.sin(a) * r);
        const v = k * (0.88 + 0.12 * lobe); col.push(v, v, v);
      }
      const at = j => 1 + j * N;
      for (let i = 0; i < N; i++) {
        const i2 = (i + 1) % N; idx.push(0, at(0) + i2, at(0) + i);
        for (let j = 0; j < rings.length - 1; j++) { const a = at(j) + i, b = at(j) + i2, c = at(j + 1) + i, d = at(j + 1) + i2; idx.push(a, b, d, a, d, c); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      return g;
    };
    const rose = sculpt((x, y, z) => { const a = Math.atan2(z, x), r = Math.hypot(x, z), w = 1 + 0.08 * Math.sin(a * 3 + r * 12 + y * 5); return [x * 0.17 * w, y < 0 ? y * 0.11 : y * 0.15, z * 0.17 * w]; }, (x, y, z) => C(0xffffff).multiplyScalar(0.62 + 0.38 * (0.5 + 0.5 * Math.sin(Math.atan2(z, x) * 3 + Math.hypot(x, z) * 12 + y * 5)) * (0.75 + 0.25 * y)), 24, 16);
    // a tulip: six overlapping petals closing into a cup with pointed tips, green-tinged at the base
    const tulip = (() => {
      const g = new THREE.LatheGeometry([[0.01, -0.1], [0.07, -0.09], [0.12, -0.03], [0.135, 0.07], [0.115, 0.18]].map(([a, b]) => new THREE.Vector2(a, b)), 36), p = g.attributes.position, col = [];
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), t = (y + 0.1) / 0.28;
        const k = 1 + 0.07 * Math.cos(a * 6) * sm(0, 0.5, t);
        p.setXYZ(i, x * k, y + 0.055 * Math.pow(Math.max(0, Math.cos(a * 3)), 3) * sm(0.6, 1, t), z * k);
        const c = mix(C(0x9aa070), C(0xffffff), sm(0, 0.45, t)).multiplyScalar(0.8 + 0.25 * t); col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
    })();
    // lavender: a spike of tiny florets in whorls, paler towards the tip
    const lavender = (() => {
      const parts = [];
      for (let k = 0; k < 18; k++) for (let w = 0; w < 2; w++) {
        const y = -0.08 + k * 0.025, a = k * 2.4 + w * Math.PI, r = 0.026 * (1 - 0.45 * k / 18), f = new THREE.OctahedronGeometry(0.034 * (1 - 0.35 * k / 18), 0);
        f.translate(Math.cos(a) * r, y, Math.sin(a) * r);
        const v = 0.62 + 0.5 * k / 18 + 0.1 * rand(), n = f.attributes.position.count; f.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n * 3).fill(v), 3));
        parts.push(f);
      }
      return merge(parts);
    })();
    const types = [
      { geo: petals(5, 0.22, 0.45), cols: [0xf48fb1, 0xffffff, 0xce93d8, 0xff80ab, 0xffcc80], ctr: 0xf2c94c },          // cosmos
      { geo: petals(16, 0.17, 0.05, 0.6, 0.35), cols: [0xffffff, 0xfffde7], ctr: 0xf5b800 },                          // daisies, tips drooping
      { geo: rose, cols: [0xc62828, 0xe53950, 0xf48fb1, 0xfff3e0, 0xffd54f] },                                          // roses
      { geo: tulip, cols: [0xffd54f, 0xff7043, 0xf06292, 0xfafafa, 0xba68c8], strap: true },                            // tulips
      { geo: lavender, cols: [0x8e7cc3, 0x9c89d6, 0x7e6bb8], strap: true },                                             // lavender
      { geo: petals(10, 0.15, 0.9, 0.5), cols: [0xffa726, 0xffca28, 0xff7043], ctr: 0x8d5a2b },                         // marigolds
    ];
    // leaves that arch up from the base and droop, folded along the midrib, darker at the base
    const leafGeo = (L, W) => {
      const pos = [], col = [], idx = [], S = 5;
      for (let i = 0; i <= S; i++) {
        const u = i / S, w = W * Math.sin(Math.PI * Math.min(1, 0.12 + u * 0.95)), y = L * (0.9 * u - 0.75 * u * u), z = L * u * 0.85;
        for (const sx of [-1, 0, 1]) { pos.push(sx * w, y - (sx ? 0.35 * w : 0), z); const v = 0.6 + 0.5 * u - (sx ? 0 : 0.06); col.push(v, v, v); }
        if (i < S) { const b = i * 3; idx.push(b, b + 3, b + 1, b + 1, b + 3, b + 4, b + 1, b + 4, b + 2, b + 2, b + 4, b + 5); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      return g;
    };
    const N = small ? 1300 : 3200;
    const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.022, 1, 5).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x4a7a2c, roughness: 0.8 }), N);
    const leafMat = () => new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.7 });
    const broad = new THREE.InstancedMesh(leafGeo(0.34, 0.075), leafMat(), N * 4), strap = new THREE.InstancedMesh(leafGeo(0.5, 0.035), leafMat(), N * 4);
    const heads = types.map(t => new THREE.InstancedMesh(t.geo, new THREE.MeshStandardMaterial({ vertexColors: !!t.geo.attributes.color, roughness: 0.6, side: THREE.DoubleSide }), N));
    const centres = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ roughness: 0.9 }), N);
    const counts = types.map(() => 0);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let s = 0, ce = 0;
    const nLeaf = new Map([[broad, 0], [strap, 0]]);
    // flowers grow in clumps of one kind, mostly one colour, like a planted bed
    for (let tries = 0; tries < N * 2 && s < N; tries++) {
      const cx = (rand() * 2 - 1) * 100, side = rand() < 0.5 ? 1 : -1, cz = pathZ(cx) + side * (2.3 + rand() * 4);
      if (cz < rimZ(cx) + 2.4 || cz > 9) continue;
      const t = (Math.floor((fbm(cx * 0.12, side * 3, 2) * 0.5 + 0.5) * 8 + rand() * 1.5)) % types.length, ty = types[t];
      const main = ty.cols[(rand() * ty.cols.length) | 0], m = 4 + ((rand() * 7) | 0);
      for (let j = 0; j < m && s < N; j++) {
        const a = rand() * TAU, rr = Math.sqrt(rand()) * 0.85, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
        if (z < rimZ(x) + 2.2 || z > 9 || Math.abs(z - pathZ(x)) < 1.9) continue;
        const h = 0.3 + rand() * 0.45 + (t === 4 ? 0.2 : 0), tilt = q.setFromEuler(e.set((rand() - 0.5) * 0.3, 0, (rand() - 0.5) * 0.3)).clone();
        m4.compose(V(x, 0, z), tilt, V(1, h, 1)); stems.setMatrixAt(s++, m4);
        const top = V(0, h, 0).applyQuaternion(tilt).add(V(x, 0, z)), k = counts[t]++, sz = 0.8 + rand() * 0.4;
        m4.compose(top, q.setFromEuler(e.set((rand() - 0.5) * 0.6, rand() * TAU, (rand() - 0.5) * 0.6)), V(sz, sz, sz)); heads[t].setMatrixAt(k, m4);
        heads[t].setColorAt(k, C(rand() < 0.8 ? main : ty.cols[(rand() * ty.cols.length) | 0]).multiplyScalar(0.86 + rand() * 0.22));
        if (ty.ctr) { m4.compose(top.clone().add(V(0, 0.03 * sz, 0)), q, V(sz, 0.6 * sz, sz)); centres.setMatrixAt(ce, m4); centres.setColorAt(ce++, C(ty.ctr).multiplyScalar(0.8 + rand() * 0.3)); }
        const lv = ty.strap ? strap : broad, nl = 3 + (rand() < 0.5 ? 1 : 0);
        for (let l = 0; l < nl; l++) {
          m4.compose(V(x, 0.02, z), q.setFromEuler(e.set(0, l / nl * TAU + rand() * 0.8, 0)), V(1, 1, 1).multiplyScalar(0.7 + rand() * 0.6));
          const li = nLeaf.get(lv); nLeaf.set(lv, li + 1);
          lv.setMatrixAt(li, m4); lv.setColorAt(li, C(GREENS[(rand() * GREENS.length) | 0]).multiplyScalar(0.7 + rand() * 0.3));
        }
        if (rand() < 0.08) flowerSpots.push(top.clone());
      }
    }
    stems.count = s; centres.count = ce; broad.count = nLeaf.get(broad); strap.count = nLeaf.get(strap);
    heads.forEach((h, t) => { h.count = counts[t]; world.add(h); });
    world.add(stems, broad, strap, centres);
    // low shrubs along the beds
    world.add(foliageLit(cardCloud(foliageCard(GREENS), small ? 260 : 620, (i, p) => {
      for (;;) { const x = (rand() * 2 - 1) * 90, z = pathZ(x) + (rand() < 0.5 ? 1 : -1) * (3 + rand() * 4); if (z > rimZ(x) + 2.4 && z < 9) { p.set(x, 0.15 + rand() * 0.25, z); return 0.7 + rand() * 0.6; } }
    })));
  }
  // a rose arch over the path, and a bench looking out over the canyon
  const arch = new THREE.Group(); world.add(arch);
  {
    const iron = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5, metalness: 0.6 });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.6, 8), iron, arch, [0, 2.3, s * 2.1]);
    mesh(new THREE.TorusGeometry(2.1, 0.08, 8, 30, Math.PI).rotateY(Math.PI / 2), iron, arch, [0, 4.6, 0]);
    const onArch = (i, p) => {
      if (rand() < 0.55) { const a = rand() * Math.PI; p.set(0, 4.6 + Math.sin(a) * 2.1, Math.cos(a) * 2.1); }
      else p.set(0, rand() * 4.6, (rand() < 0.5 ? -1 : 1) * 2.1);
      p.add(V(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.7)); return 0.8 + rand() * 0.6;
    };
    const leaf = new THREE.Group();
    leaf.add(foliageLit(cardCloud(foliageCard(GREENS), 90, onArch)), foliageLit(cardCloud(roseCard([0xd32f4f, 0xf06292, 0xfff0f2, 0xffd54f], GREENS), 80, onArch)));
    arch.add(leaf);
  }
  const bench = new THREE.Group(); world.add(bench);
  {
    const wood = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.8 }), iron = new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.5, metalness: 0.6 });
    for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(3.6, 0.1, 0.22), wood, bench, [0, 1.3, -0.35 + i * 0.25]);
    for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(3.6, 0.22, 0.08), wood, bench, [0, 1.75 + i * 0.32, -0.55]).rotation.x = -0.15;
    for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(0.12, 1.3, 0.9), iron, bench, [s * 1.6, 0.65, -0.1]); mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), iron, bench, [s * 1.6, 2.0, -0.6]); }
  }
  // trees: a jacaranda and a pink-blossom tree framing the garden, slim cypresses on the rim
  const treeL = buildTree(GREENS, [0x8f6ad8, 0xa98ae8, 0x7a58c8, 0xb9a2f0], small, 1.05), treeR = buildTree(GREENS, [0xf6a6c6, 0xffc4d8, 0xf088b0, 0xffffff], small, 0.95);
  world.add(treeL.tree, treeR.tree);
  const cypress = [];
  {
    const tex = foliageCard([0x2f4f2a, 0x3a5f30, 0x27452a, 0x46703a, 0x52773e], 90);
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Group(), h = 8 + rand() * 4;
      mesh(new THREE.CylinderGeometry(0.12, 0.2, h * 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x4a3424 }), c, [0, h * 0.15, 0]);   // hidden in the foliage
      const prof = y => 1.25 * Math.pow(Math.max(0, 1 - Math.pow(y / h, 2.2)), 0.65) * (0.55 + 0.45 * sm(0, 0.12, y / h)) + 0.12;   // a tall flame, pointed on top
      c.add(foliageLit(shadeCloud(cardCloud(tex, small ? 180 : 320, (k, p) => { const y = rand() * h, a = rand() * TAU, r = prof(y) * Math.pow(rand(), 0.35); p.set(Math.cos(a) * r, y + 0.6, Math.sin(a) * r); return 0.7 + rand() * 0.5; }), V(0, h * 0.5, 0), 1.3, 0.35, 0)));
      world.add(c); cypress.push(c);
    }
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
  // the café, Wishes
  const C0 = buildCafe(); world.add(C0.cafe);
  // rabbits
  const rabbits = [[0xf4f1ea, 0xffffff], [0x9a7552, 0xe6d6c0], [0x8e8a86, 0xd8d4cc]].map(([a, b]) => { const r = buildRabbit(a, b); world.add(r.rb); return r; });
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
  // the rose she picks and carries, a mug of coffee, and the rose she leaves on the bench
  const heldFlower = new THREE.Group(); world.add(heldFlower); heldFlower.visible = false;
  heldFlower.add(toonRose(0xff6f91, 1.3)); mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 4), toon(0x4f8a2e), heldFlower, [0, -0.32, 0]);
  const benchRose = heldFlower.clone(); benchRose.visible = false; world.add(benchRose);
  const mug = buildMug(); mug.visible = false; world.add(mug);
  const steam = [];
  for (let i = 0; i < 4; i++) { const st = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]), transparent: true, depthWrite: false })); world.add(st); steam.push({ s: st, t: i / 4 }); }
  let mugHot = 0, mugAt = null, doorOpen = 0;
  // real shadows from the solid things in the garden; the lawn, path, wall and café take them
  for (const o of [treeL.tree, treeR.tree, arch, bench, C0.cafe, ...cypress]) o.traverse(m => { if (m.isMesh) m.castShadow = true; });
  for (const o of [C0.cafe, bench]) o.traverse(m => { if (m.isMesh) m.receiveShadow = true; });
  world.traverse(m => { if (m.isInstancedMesh && m.geometry.type === 'BoxGeometry') m.castShadow = m.receiveShadow = true; });   // the stone wall and its posts

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
    camera.updateProjectionMatrix(); waterfall.face(camera.position);
    const narrow = aspect < 1, hw = halfWAt(-9);
    treeL.tree.position.set(-hw * 0.97, 0, -10.5);                                   // at the edges, framing the view and clear of the text
    treeR.tree.position.set(hw * 0.97, 0, -11);
    for (const t of [treeL, treeR]) t.tree.scale.setScalar(narrow ? 0.8 : 1);
    const ax = -hw * 0.05; arch.position.set(ax, 0, pathZ(ax)); arch.rotation.y = -Math.atan((pathZ(ax + 0.1) - pathZ(ax)) / 0.1) + 0.75;   // turned so its curve shows
    const bx = clamp(hw * 0.42, 5, hw - 5); bench.position.set(bx, 0, pathZ(bx) - 3.4); bench.rotation.y = -0.2;            // facing you, the canyon behind her
    const cz = -3, chw = halfWAt(cz);                                              // at the left edge, low on the screen, clear of the text
    C0.cafe.position.set(-chw + (narrow ? 2.4 : 3.0), 0, cz); C0.cafe.rotation.y = 0.55; C0.cafe.scale.setScalar(narrow ? 0.62 : 0.85);
    cypress.forEach((c, i) => { const s = i < 3 ? -1 : 1, k = i % 3; c.position.set(s * (hw * (0.98 + k * 0.22) + k * 3), 0, rimZ(s * hw) + 2.4 - k * 0.6); });
    obstacles.length = 0;
    scene.updateMatrixWorld(true);
    obstacles.push({ x: treeL.tree.position.x, z: -10.5, r: 2.4 }, { x: C0.cafe.position.x, z: cz - 1, r: 4.2 }, { x: treeR.tree.position.x, z: -11, r: 2.4 }, { x: bx, z: bench.position.z, r: 2.4 });
    for (const t of C0.tables) { const w = t.t.getWorldPosition(V()); obstacles.push({ x: w.x, z: w.z, r: 1.3 }); }
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
  // A clipping plane at the café's front wall: while she walks in or out, the part of her
  // that is already inside the house is not drawn, so she passes through the doorway
  // instead of overlapping the walls. Parked far away the rest of the time.
  renderer.localClippingEnabled = true;
  const wallClip = new THREE.Plane(V(0, 0, 1), 1e6);
  const own = new Map();
  for (const root of [R.root, mug]) root.traverse(o => {
    if (!o.material) return;
    o.material = [].concat(o.material).map(m => {
      if ([...inks.values()].includes(m)) {                     // outline materials are shared with the scenery: use her own copies
        if (!own.has(m)) { const c = m.clone(); c.onBeforeCompile = m.onBeforeCompile; c.customProgramCacheKey = m.customProgramCacheKey; own.set(m, c); }
        m = own.get(m);
      }
      m.clippingPlanes = [wallClip];
      return m;
    });
    if (o.material.length === 1) o.material = o.material[0];
  });
  function clipAtCafeWall(on) {
    if (!on) { wallClip.constant = 1e6; return; }
    const n = V(0, 0, 1).applyQuaternion(C0.cafe.getWorldQuaternion(new THREE.Quaternion())).normalize();
    const p = C0.cafe.localToWorld(C0.doorPt.clone().setZ(C0.doorPt.z - 1.4 + 0.02));        // the outer face of the front wall
    wallClip.setFromNormalAndCoplanarPoint(n, p);
  }
  R.drape.geo.computeBoundingSphere(); R.skirt.traverse(o => { o.frustumCulled = false; });
  const shadow = mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(60,30,20,.4)'], [0.6, 'rgba(60,30,20,.15)'], [1, 'rgba(60,30,20,0)']]), transparent: true, depthWrite: false }), world);
  shadow.renderOrder = -1;
  const A = {
    pos: V(), yaw: 0, cur: blank(), target: blank(), out: blank(), rate: 6, rest: { ao: 0.1, lo: 0.02 },
    walkAmt: 0, phase: 0, moving: 0, stepping: 0, solveY: R.d.hipH, seat: null, seatW: 0, osc: [], force: {},
    look: null, lookW: 0, eyeX: 0, eyeTX: 0, lid: 0, lidT: 0, blinkAt: 2, blinkT: 0, wide: 0, autoLook: true,
    flare: 0, flareT: 0, spin: 0, braidV: V(), braid: V(), lastYaw: 0, hold: null, cross: 0, crossT: 0,
  };
  A.set = (p, rate = 6) => { A.target = Object.assign(blank(), p); A.rate = rate; };
  for (const e of R.eyes) e.lid.rotation.x = -1.15;
  R.mouth.userData.y0 = R.mouth.scale.y;
  const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), tv = V(), tv2 = V(), xAxis = V(1, 0, 0);
  let wind = 0, gust = 0;
  function update(dt) {
    const o = A.out, k = 1 - Math.exp(-dt * A.rate);
    for (const key of KEYS) A.cur[key] += (A.target[key] - A.cur[key]) * k;
    Object.assign(o, A.cur);
    // a light, swinging stroll
    A.walkAmt += ((A.moving > 0.05 || A.stepping ? 1 : 0) - A.walkAmt) * (1 - Math.exp(-dt * 8));
    A.phase += dt * (A.moving * 3.0 + A.stepping * 6);
    if (A.walkAmt > 0.01) {
      const w = A.walkAmt, s = Math.sin(A.phase), c = Math.cos(A.phase);
      o.lfL += w * (0.3 * s + 0.16 * Math.max(0, c)); o.lfR += w * (-0.3 * s + 0.16 * Math.max(0, -c));
      o.lkL += w * 0.55 * Math.max(0, c); o.lkR += w * 0.55 * Math.max(0, -c);
      o.pr += w * 0.07 * s; o.twist += w * 0.08 * s; o.hr -= w * 0.03 * s;
      o.afL -= w * 0.22 * s; o.aeL += w * 0.2;
      if (!A.hold) { o.afR += w * 0.22 * s; o.aeR += w * 0.2; }
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
    A.cross += (A.crossT - A.cross) * (1 - Math.exp(-dt * 6));
    for (const e of R.eyes) { e.ball.rotation.set(-A.cross * 0.4, A.eyeX - e.side * A.cross, 0); e.lid.rotation.x = lerp(-1.15 - A.wide * 0.3, 1.45, A.lid); }
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
    const st = 1 - A.seatW;
    R.skirt.rotation.set((-0.06 * A.walkAmt * Math.cos(A.phase) - 0.03 * wind) * st, 0, 0.04 * sw * st);
    R.skirt.scale.set(1 + A.flare * 0.4, 1 - A.flare * 0.1, 1 + A.flare * 0.4);
    const Dr = R.drape, dw = sm(0.05, 0.95, A.seatW);
    if (Math.abs(dw - Dr.w) > 1e-3) {                                      // reshape only while she sits down or stands up
      Dr.w = dw; const P = Dr.geo.attributes.position.array;
      for (let i = 0; i < P.length; i++) P[i] = Dr.rest[i] + (Dr.seated[i] - Dr.rest[i]) * dw;
      Dr.geo.attributes.position.needsUpdate = true; Dr.geo.computeVertexNormals();
    }
    // the braid lags behind her turns and swings as she walks
    const dyaw = angDiff(A.lastYaw, A.yaw + A.spin) / Math.max(dt, 1e-3); A.lastYaw = A.yaw + A.spin;
    A.braidV.x += (-A.braid.x * 40 - A.braidV.x * 5 + dyaw * 2.2 + sw * 3) * dt; A.braid.x += A.braidV.x * dt;
    A.braidV.z += (-A.braid.z * 40 - A.braidV.z * 5 - A.walkAmt * Math.abs(Math.cos(A.phase)) * 4 + wind * 0.6) * dt; A.braid.z += A.braidV.z * dt;
    R.hairBack.rotation.set(clamp(-A.braid.z * 0.5 + 0.08 * A.walkAmt + 0.03 * wind, -0.35, 0.4), 0, clamp(A.braid.x * 0.6, -0.35, 0.35));
    shadow.position.set(A.pos.x, 0.05, A.pos.z + 0.2); shadow.scale.setScalar(3 + A.flare * 1.4);
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

  function* shySmile() {
    A.look = ATCAM;
    yield* pose(S(G.shy, A.hold ? { afR: 0.65, aeR: 1.55, aoR: -0.3 } : {}), 1.8, 4);
    puffHearts(R.crown.getWorldPosition(V()), 2);
    A.look = null; yield* pose(A.hold ? G.carry : G.stand, 0.5);
  }
  function* stroll() {
    const z0 = 0, x = clamp(A.pos.x + (rnd() < 0.5 ? -1 : 1) * (6 + rnd() * 10), -xLim(z0), xLim(z0));
    yield* goTo(x, pathZ(x));
    yield* turnTo(faceCam() + (rnd() - 0.5) * 0.5);
    if (watching() && rnd() < 0.45) yield* shySmile(); else yield* wait(0.5 + rnd());
  }
  // her little story: she picks a rose and smells it, a butterfly lands on her face,
  // and she takes the rose to the bench and sits looking out over the canyon
  function* pickRose() {
    const f = flowerSpots.filter(p => p.z > pathZ(p.x) && Math.abs(p.x) < xLim(p.z) - 2 && Math.abs(p.x - arch.position.x) > 4.5 && Math.abs(p.x - bench.position.x) > 3).sort((a, b) => Math.abs(a.x - A.pos.x) - Math.abs(b.x - A.pos.x))[0];
    if (f) yield* goTo(f.x, pathZ(f.x) + 0.6, { face: 0.15 });
    yield* pose(G.pick, 1.0, 4);
    heldFlower.visible = true; A.hold = 1;
    yield* pose(G.holdFlower, 0.9, 4);
    A.lidT = 1; yield* wait(1.6);
    puffHearts(R.crown.getWorldPosition(V()).add(V(0, -0.3, 0.4)), 4);
    A.lidT = 0.4; A.target.jaw = 0.2; yield* wait(0.9); A.lidT = 0;
    yield* pose(G.carry, 0.5);
  }
  function* butterflyKiss() {
    const fl = flies.reduce((a, b) => (a.p.distanceTo(A.pos) < b.p.distanceTo(A.pos) ? a : b));
    yield* turnTo(faceCam());
    A.look = () => fl.p;
    const nose = () => R.nosePt.getWorldPosition(V()).add(V(Math.sin(A.yaw) * 0.06, -0.04, Math.cos(A.yaw) * 0.06));
    fl.follow = nose;
    let t = 0; while (t < 7 && fl.p.distanceTo(nose()) > 0.22) t += yield;
    fl.land = 1; A.look = null; A.crossT = 0.32; A.wide = 1;
    yield* wait(0.8);
    A.osc = [['hr', 0.07, 7], ['side', 0.03, 7]];
    yield* pose(G.giggle, 1.6, 6);
    puffHearts(R.crown.getWorldPosition(V()), 5);
    fl.follow = null; fl.land = 0; fl.t.copy(fl.p).add(V(2, 2.5, 1)); fl.ph = clock + 3;
    A.osc = []; A.crossT = 0; A.look = () => fl.p;
    yield* pose(G.carry, 1.4, 4);
    A.look = null;
  }
  function* sitBench() {
    const fwd = V(Math.sin(bench.rotation.y), 0, Math.cos(bench.rotation.y)), seat = bench.position.clone().addScaledVector(fwd, 0.15);
    yield* goTo(seat.x + fwd.x * 1.8, seat.z + fwd.z * 1.8);
    yield* goTo(seat.x, seat.z, { face: bench.rotation.y, direct: true });
    A.seat = 1.42; yield* pose(S(G.sit, A.hold ? G.lap : {}), 1.0, 3);
    A.osc = [['lkL', 0.12, 2.4], ['lkR', 0.12, 2.4, 1.9]];
    A.autoLook = false; A.look = () => V(0, -10, -250);                    // out over the canyon
    yield* wait(3.2);
    puffHearts(R.crown.getWorldPosition(V()), 3);
    A.look = ATCAM; yield* pose(S(G.sit, G.lap, { hr: 0.2, jaw: 0.2 }), 2.2, 3);
    A.look = null; A.autoLook = true; A.osc = [];
    if (A.hold) { heldFlower.visible = false; A.hold = null; benchRose.visible = true; benchRose.position.copy(seat).add(V(0.9, 1.4, 0)); benchRose.rotation.set(0, 0, Math.PI / 2); }   // leaves the rose on the bench
    A.seat = null; yield* pose(G.stand, 1.0, 3);
  }
  function* story() { yield* pickRose(); yield* butterflyKiss(); yield* sitBench(); }
  // a coffee at Wishes
  function* cafeVisit() {
    const door = C0.cafe.localToWorld(C0.doorPt.clone()), inside = C0.cafe.localToWorld(C0.insidePt.clone()), into = C0.cafe.rotation.y + Math.PI;
    yield* goTo(door.x, door.z, { face: into });
    // she opens the door, steps in, and comes back out a little later with her coffee
    doorOpen = 1; yield* wait(0.8);
    clipAtCafeWall(true);
    yield* goTo(inside.x, inside.z, { speed: 1.2, direct: true });
    R.root.visible = false; shadow.visible = false; yield* wait(0.6);
    doorOpen = 0; yield* wait(2.6);
    doorOpen = 1; yield* wait(0.6);
    mug.visible = true; mugAt = 'hand'; mugHot = 1; A.hold = 1;
    A.yaw = into + Math.PI; R.root.visible = true;
    yield* goTo(door.x, door.z, { speed: 1.2, direct: true });
    shadow.visible = true; clipAtCafeWall(false);
    yield* wait(0.4); doorOpen = 0;
    yield* pose(G.cup, 0.4);
    const ch = C0.tables[0].seats[0].chair, cw = ch.getWorldPosition(V()), cy = ch.getWorldQuaternion(new THREE.Quaternion()), f = V(0, 0, 1).applyQuaternion(cy);
    yield* goTo(cw.x + f.x * 1.6, cw.z + f.z * 1.6);
    yield* goTo(cw.x, cw.z, { face: Math.atan2(f.x, f.z), direct: true });
    A.seat = 1.42; yield* pose(S(G.sit, G.cup), 1.0, 3);
    for (let i = 0; i < 2; i++) {
      yield* pose(S(G.sit, G.sip), 0.7, 4); A.lidT = 1; yield* wait(1.0); A.lidT = 0;
      puffHearts(R.crown.getWorldPosition(V()), 2);
      yield* pose(S(G.sit, G.cup), 1.0, 4);
      A.look = () => V(0, -10, -250); yield* wait(2.2); A.look = null;
    }
    mugAt = C0.tables[0].t.localToWorld(V(0.3, 2.0, 0.2)); A.hold = null;   // leaves the cup on the table
    A.seat = null; yield* pose(G.stand, 1.0, 3);
  }
  function* gaze() {
    const x = clamp(A.pos.x, -xLim(-12) + 2, xLim(-12) - 2), z = rimZ(x) + 3;
    yield* goTo(x, z, { face: Math.PI + (rnd() - 0.5) * 0.4 });
    A.autoLook = false;
    yield* pose(S(G.gaze, G.stand), 0.6, 4);
    gust = 1.5; A.osc = [['hr', 0.06, 1.2]];
    yield* wait(3.2);
    yield* pose(S(G.gaze, { afL: -0.4, aoL: -0.25, aeL: 0.9, afR: -0.4, aoR: -0.25, aeR: 0.9 }), 2.5, 3);
    A.osc = []; A.look = ATCAM;
    yield* pose(S(G.lookBack, { afL: -0.4, aoL: -0.25, aeL: 0.9, afR: -0.4, aoR: -0.25, aeR: 0.9, jaw: 0.2 }), 1.8, 4);
    A.look = null; A.autoLook = true;
    yield* pose(G.stand, 0.5);
  }
  function* twirl() {
    yield* turnTo(faceCam());
    yield* pose(G.twirl, 0.4, 6);
    A.flareT = 1; gust = 1;
    let t = 0; const T = 1.8;
    while (t < T) { t += yield; A.spin = TAU * sm(0, 1, t / T); A.stepping = 0.8; }
    A.spin = 0; A.yaw = A.yaw % TAU; A.stepping = 0; A.flareT = 0;
    puffHearts(R.crown.getWorldPosition(V()), 5);
    yield* pose(S(G.hug, { jaw: 0.3 }), 1.2, 5);
    yield* pose(G.stand, 0.5);
  }
  const ACTS = { story: [story, 3], cafe: [cafeVisit, 2], twirl: [twirl, 1], gaze: [gaze, 1] };
  function* enter() {
    const e = rnd() < 0.5 ? -1 : 1, x0 = e * (halfWAt(0) + 3);
    A.pos.set(x0, 0, pathZ(x0)); A.yaw = -e * Math.PI / 2;
    yield* goTo(e * halfWAt(0) * 0.4, pathZ(e * halfWAt(0) * 0.4));
    yield* turnTo(Math.PI * 0.85 * e);                                      // the view
    A.autoLook = false; yield* pose(G.hug, 2.0, 3); A.autoLook = true;
    yield* turnTo(faceCam());
    yield* shySmile();
  }
  function* life(first) {
    if (first) yield* first();
    yield* story();                                                           // her story first
    let last = 'story';
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
    if (st && Date.now() - st.t < 30 * 60 * 1000 && Math.abs(st.x) < xLim(st.z)) { A.pos.set(st.x, 0, st.z); A.yaw = st.yaw || 0; restored = true; }
  } catch (e) { /* fine */ }
  window.addEventListener('pagehide', save);
  for (const r of rabbits) { r.pos.set((rnd() * 2 - 1) * xLim(0), 0, -6 + rnd() * 10); r.from.copy(r.pos); }
  let director = life(restored ? null : enter);
  R.hairFlower.visible = true;

  /* ---------------------------------------------------------------- per frame */
  const m4 = new THREE.Matrix4();
  function step(dt) {
    clock += dt;
    try { director.next(dt); } catch (err) { console.error(err); A.seat = null; A.spin = 0; A.flareT = 0; A.hold = null; A.crossT = 0; heldFlower.visible = false; director = life(); }
    gust *= Math.exp(-dt * 0.8);
    wind = 0.5 + 0.3 * Math.sin(clock * 0.31) + 0.2 * Math.sin(clock * 0.87) + gust;
    update(dt);
    if (heldFlower.visible) { handPt(1, heldFlower.position); heldFlower.rotation.y = A.yaw; }
    if (mug.visible) {
      if (mugAt === 'hand') { handPt(1, mug.position); mug.position.y -= 0.12; mug.rotation.y = A.yaw - Math.PI / 2; } else mug.position.copy(mugAt);
      mugHot = Math.max(0, mugHot - dt / 90); if (mugAt !== 'hand' && mugHot <= 0.5) { mug.visible = false; }
    }
    for (const st of steam) {
      st.t = (st.t + dt * 0.5) % 1; st.s.visible = mug.visible && mugHot > 0;
      st.s.position.copy(mug.position).add(V(Math.sin(clock * 2 + st.t * 9) * 0.05, 0.3 + st.t * 0.6, 0)); st.s.scale.setScalar(0.15 + st.t * 0.3); st.s.material.opacity = 0.5 * Math.sin(Math.PI * st.t) * mugHot;
    }
    for (const sm2 of C0.smoke) {
      sm2.t = (sm2.t + dt * 0.08) % 1;
      sm2.s.position.copy(C0.chimney).add(V(sm2.t * 2.5 + Math.sin(clock * 0.7 + sm2.t * 6) * 0.3, sm2.t * 5, 0)); sm2.s.scale.setScalar(0.8 + sm2.t * 2.4); sm2.s.material.opacity = 0.35 * Math.sin(Math.PI * sm2.t);
    }
    C0.door.rotation.y += (-1.4 * doorOpen - C0.door.rotation.y) * (1 - Math.exp(-dt * 4));
    for (const r of rabbits) {
      if (r.hops > 0) {
        r.t += dt / 0.42; const u = Math.min(1, r.t);
        r.pos.lerpVectors(r.from, r.to, u); r.pos.y = Math.sin(Math.PI * u) * 0.45;
        r.body.rotation.x = -0.35 * Math.cos(Math.PI * u);
        if (u >= 1) { r.hops--; r.t = 0; r.from.copy(r.pos); r.from.y = 0; if (r.hops > 0) r.to.copy(r.from).add(V(Math.sin(r.yaw), 0, Math.cos(r.yaw)).multiplyScalar(0.9)); else { r.rest = 1.5 + rnd() * 4; r.body.rotation.x = 0; } }
      } else {
        r.rest -= dt; r.nibble = Math.max(0, Math.sin(clock * 9 + r.yaw * 5)) * 0.12;
        r.body.rotation.x = r.nibble;
        if (r.rest < 0) {
          let tx, tz;
          if (rnd() < 0.25) { tx = A.pos.x + (rnd() - 0.5) * 6; tz = A.pos.z + 2 + rnd() * 2; }
          else { tx = (rnd() * 2 - 1) * xLim(0); tz = -12 + rnd() * 16; }
          tz = Math.max(tz, rimZ(tx) + 3);
          r.yaw = Math.atan2(tx - r.pos.x, tz - r.pos.z); r.from.copy(r.pos); r.from.y = 0;
          r.hops = Math.max(1, Math.min(8, Math.round(Math.hypot(tx - r.pos.x, tz - r.pos.z) / 0.9)));
          r.to.copy(r.from).add(V(Math.sin(r.yaw), 0, Math.cos(r.yaw)).multiplyScalar(0.9)); r.t = 0;
        }
      }
      r.twitch -= dt; if (r.twitch < 0) { r.twitch = 1 + rnd() * 3; r.ears[(rnd() * 2) | 0].userData.k = 1; }
      for (const e of r.ears) { e.userData.k = (e.userData.k || 0) * Math.exp(-dt * 6); e.rotation.x = -0.35 + 0.3 * Math.sin(clock * 30) * e.userData.k; }
      r.rb.position.copy(r.pos); r.rb.rotation.y = r.yaw;
    }
    water.userData.time.value = clock; waterfall.update(clock, dt);
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
    scene.fog.color.set(night ? 0x3a2f4a : 0xdcd6d2);
    water.userData.sky.value.set(night ? 0x6a4a6e : 0x8fb0cf);
    renderer.toneMappingExposure = night ? 0.9 : 1.0;
    skyMat.map = skyTexes[night ? 1 : 0]; skyMat.needsUpdate = true;
    hemi.color.set(night ? 0x9a8ac8 : 0xdfe8f4); hemi.groundColor.set(night ? 0x2a1c22 : 0x7a5a40); hemi.intensity = night ? 0.8 : 1.05;
    key.color.set(night ? 0xd0c0ff : 0xffe6c8); key.intensity = night ? 1.2 : 2.3;
    sunL.color.set(night ? 0xff8a6a : 0xffb878); sunL.intensity = night ? 1.2 : 1.6;
    sun.material.opacity = night ? 0.75 : 1;
    for (const c of clouds) c.c.material.color.set(night ? 0x8a5a7a : 0xffffff);
    lightsMat.emissiveIntensity = night ? 2.4 : 0.2; waterfall.setNight(night);
    C0.bulbM.emissiveIntensity = night ? 2.6 : 0.25; C0.glass.emissiveIntensity = night ? 1.6 : 0.5; C0.light.intensity = night ? 18 : 0;
  }
  setTheme(opts.theme);
  play();

  return {
    setTheme,
    debug: { camera, scene, renderer, step, A, R, run: name => { director = life(name === 'enter' ? enter : name === 'idle' ? function* () { for (;;) yield; } : name === 'pick' ? pickRose : name === 'kiss' ? butterflyKiss : name === 'bench' ? sitBench : ACTS[name][0]); } },
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

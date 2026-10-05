/* =============================================================================
   kit.js — building blocks shared by the 3D companions (panda.js, garden.js).

   Small maths helpers, procedural textures, geometry helpers (sculpted spheres,
   tapered tubes, distance-field sculpting with surface nets), shell fur, turning
   eyes, a simple character rig and the pose keys the characters are animated with.
   ========================================================================== */
import * as THREE from './vendor/three.module.min.js';

export const TAU = Math.PI * 2;
export const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
// seeded, so the scenery is the same on every page; behaviour uses Math.random
export const rand = (seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(20261005);
export const rnd = Math.random;
export const nz = (x, y, z) => Math.sin(x * 1.7 + y * 3.1 + z * 2.3) * 0.5 + Math.sin(x * 3.9 - y * 2.2 + z * 1.3) * 0.3 + Math.sin(-x * 5.3 + y * 4.7 + z * 6.1) * 0.2;
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const C = h => new THREE.Color(h);
export const mix = (a, b, t) => a.clone().lerp(b, clamp(t, 0, 1));

/* ---------------------------------------------------------------- textures */

export function canvasTex(w, h, draw, colour = true) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  if (colour) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export const radial = stops => canvasTex(128, 128, (c, w) => {
  const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  c.fillStyle = g; c.fillRect(0, 0, w, w);
});
// short strokes of fur for the bump map
export const furBump = canvasTex(256, 256, (c, S) => {
  c.fillStyle = '#808080'; c.fillRect(0, 0, S, S);
  for (let i = 0; i < 3200; i++) {
    const x = rand() * S, y = rand() * S, l = 3 + rand() * 7, a = Math.PI / 2 + (rand() - 0.5) * 0.9, v = 70 + rand() * 140 | 0;
    c.strokeStyle = `rgba(${v},${v},${v},.6)`; c.lineWidth = 0.8 + rand() * 1.2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
}, false);
furBump.wrapS = furBump.wrapT = THREE.RepeatWrapping; furBump.repeat.set(3, 3);
// soft cloud blobs for the mist banks
export const mistTex = canvasTex(256, 256, (c, S) => {
  for (let i = 0; i < 46; i++) {
    const r = S * (0.08 + rand() * 0.14), x = S * 0.24 + rand() * S * 0.52, y = S * 0.42 + (rand() - 0.5) * S * 0.16;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,.34)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, S, S);
  }
});

/* ---------------------------------------------------------------- geometry helpers */

// Deform a unit sphere with f(x,y,z) → [X,Y,Z]; optional vertex colours from colour(x,y,z).
export function sculpt(f, colour, ws = 40, hs = 28) {
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
export function taperedTube(points, segs, rad, colour, radial = 8) {
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

export function merge(geos) {
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

export const SPH = new THREE.SphereGeometry(1, 28, 20);
export function mesh(geo, mat, parent, pos, scale) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (scale !== undefined) (typeof scale === 'number' ? m.scale.setScalar(scale) : m.scale.set(scale[0], scale[1], scale[2]));
  if (parent) parent.add(m);
  return m;
}
export const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 14);

/* ---------------------------------------------------------------- rigs */

// pelvis → torso → neck → head; arms on the torso, legs on the pelvis. index 0 = left (+x).
export function makeRig(d) {
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

/* ---------------------------------------------------------------- sculpting with distance fields */

// Signed distance to an ellipsoid (a close bound), and a smooth union that blends shapes together.
export function ell(x, y, z, cx, cy, cz, rx, ry, rz) {
  const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz;
  const k0 = Math.sqrt(px * px + py * py + pz * pz), k1 = Math.sqrt(px * px / (rx * rx) + py * py / (ry * ry) + pz * pz / (rz * rz));
  return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz);
}
export const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
export function sdfNormal(sdf, x, y, z, e = 0.01) {
  const gx = sdf(x + e, y, z) - sdf(x - e, y, z), gy = sdf(x, y + e, z) - sdf(x, y - e, z), gz = sdf(x, y, z + e) - sdf(x, y, z - e);
  const l = Math.hypot(gx, gy, gz) || 1;
  return V(gx / l, gy / l, gz / l);
}
// Where a ray from the front (+z) along -z first meets the surface: places features on a face.
export function onFront(sdf, x, y) {
  let z = 4;
  for (let i = 0; i < 80; i++) { const d = sdf(x, y, z); if (d < 1e-3) break; z -= Math.max(d, 0.002); }
  return { p: V(x, y, z), n: sdfNormal(sdf, x, y, z) };
}

// Surface nets: one vertex per grid cell the surface passes through (snapped onto the surface),
// one quad per grid edge it crosses. Gives a smooth closed mesh of the shape sdf < 0.
export function surfaceNet(sdf, colour, lo, hi, cell) {
  const nx = Math.ceil((hi[0] - lo[0]) / cell) + 1, ny = Math.ceil((hi[1] - lo[1]) / cell) + 1, nz = Math.ceil((hi[2] - lo[2]) / cell) + 1;
  const at = (i, j, k) => i + nx * (j + ny * k), F = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F[at(i, j, k)] = sdf(lo[0] + i * cell, lo[1] + j * cell, lo[2] + k * cell);
  const vid = new Int32Array(nx * ny * nz).fill(-1), pos = [], nor = [], col = [], bare = [], val = new Float32Array(8);
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let inside = 0;
    for (let c = 0; c < 8; c++) { val[c] = F[at(i + (c & 1), j + (c >> 1 & 1), k + (c >> 2 & 1))]; if (val[c] < 0) inside++; }
    if (inside === 0 || inside === 8) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of EDGES) {
      if ((val[a] < 0) === (val[b] < 0)) continue;
      const t = val[a] / (val[a] - val[b]);
      sx += (a & 1) + t * ((b & 1) - (a & 1)); sy += (a >> 1 & 1) + t * ((b >> 1 & 1) - (a >> 1 & 1)); sz += (a >> 2 & 1) + t * ((b >> 2 & 1) - (a >> 2 & 1)); n++;
    }
    let x = lo[0] + (i + sx / n) * cell, y = lo[1] + (j + sy / n) * cell, z = lo[2] + (k + sz / n) * cell;
    let g = sdfNormal(sdf, x, y, z, cell * 0.5); const d = sdf(x, y, z);
    x -= g.x * d; y -= g.y * d; z -= g.z * d;
    g = sdfNormal(sdf, x, y, z, cell * 0.5);
    vid[at(i, j, k)] = pos.length / 3;
    pos.push(x, y, z); nor.push(g.x, g.y, g.z);
    const c = colour(x, y, z, g); col.push(c.r, c.g, c.b); bare.push(c.bare ? 1 : 0);
  }
  const idx = [], pa = V(), pb = V(), pc = V();
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const f0 = F[at(i, j, k)];
    for (let ax = 0; ax < 3; ax++) {
      const i1 = i + (ax === 0 ? 1 : 0), j1 = j + (ax === 1 ? 1 : 0), k1 = k + (ax === 2 ? 1 : 0);
      if (i1 >= nx || j1 >= ny || k1 >= nz || (f0 < 0) === (F[at(i1, j1, k1)] < 0)) continue;
      let q;
      if (ax === 0) { if (!j || !k) continue; q = [at(i, j - 1, k - 1), at(i, j, k - 1), at(i, j, k), at(i, j - 1, k)]; }
      else if (ax === 1) { if (!i || !k) continue; q = [at(i - 1, j, k - 1), at(i, j, k - 1), at(i, j, k), at(i - 1, j, k)]; }
      else { if (!i || !j) continue; q = [at(i - 1, j - 1, k), at(i, j - 1, k), at(i, j, k), at(i - 1, j, k)]; }
      const [a, b, c, d] = q.map(m => vid[m]);
      if (a < 0 || b < 0 || c < 0 || d < 0) continue;
      pa.fromArray(pos, a * 3); pb.fromArray(pos, b * 3).sub(pa); pc.fromArray(pos, c * 3).sub(pa);
      const out = pb.cross(pc).getComponent(ax) * (f0 < 0 ? 1 : -1);     // face must point from inside to outside
      if (out >= 0) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  if (bare.some(Boolean)) g.setAttribute('bare', new THREE.Float32BufferAttribute(bare, 1));   // cloth: no fur
  g.setIndex(idx);
  return g;
}

// A capsule from y = 0 (radius r0) down to y = -len (radius r1).
export const taperCapsule = (r0, r1, len) => sculpt((x, y, z) => (y >= 0 ? [x * r0, y * r0, z * r0] : [x * r1, y * r1 - len, z * r1]), null, 24, 18);

/* ---------------------------------------------------------------- fur */

// Fur by shells: the mesh is drawn again several times, each copy pushed a little further out
// along its normals, keeping only the pixels that fall on a strand. Strands are cells of a 3D grid
// fixed to the un-pushed surface, so each one carries on through all the shells.
export const furMats = new Map();
export function furMaterial(layer, len, freq) {
  const key = `${layer}|${len}|${freq}`;
  if (furMats.has(key)) return furMats.get(key);
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uLayer: { value: layer }, uLen: { value: len }, uFreq: { value: freq } });
    sh.vertexShader = 'uniform float uLayer, uLen, uFreq;\nattribute float bare;\nvarying vec3 vFur, vFurN;\nvarying float vBare;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvFur = position * uFreq; vFurN = normal; vBare = bare;\ntransformed += normal * (uLen * uLayer * (1.0 - bare));\ntransformed.y -= uLen * uLayer * uLayer * 0.45;');
    sh.fragmentShader = 'uniform float uLayer;\nvarying vec3 vFur, vFurN;\nvarying float vBare;\nfloat furHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\n' +
      sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      if (uLayer > 0.0) {
        if (vBare > 0.5) discard;
        vec3 c = floor(vFur), o = vec3(furHash(c), furHash(c + 17.3), furHash(c + 41.9)) * 0.6 + 0.2;
        float h = 0.5 + 0.5 * furHash(c + 7.1);
        float d = length(cross(fract(vFur) - o, normalize(vFurN)));
        if (uLayer > h || d > 0.85 * (1.0 - 0.75 * uLayer / h)) discard;
      }
      diffuseColor.rgb *= mix(0.9 + 0.12 * uLayer, 1.0, vBare);`);
  };
  m.customProgramCacheKey = () => 'fur-shell';
  furMats.set(key, m);
  return m;
}
export function furry(geo, parent, { len = 0.07, layers = 10, freq = 16, pos, scale } = {}) {
  const base = mesh(geo, furMaterial(0, len, freq), parent, pos, scale);
  for (let i = 1; i <= layers; i++) base.add(new THREE.Mesh(geo, furMaterial(i / layers, len, freq)));
  return base;
}

/* ---------------------------------------------------------------- eyes */

// An eyeball texture with the iris painted round +z (three's sphere UVs), so the ball can turn.
export function eyeTexture(inner, outer, ring) {
  return canvasTex(256, 128, (c, W, H) => {
    const img = c.createImageData(W, H), A = C(inner), B = C(outer), R = C(ring), col = new THREE.Color();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const phi = (x + 0.5) / W * TAU, th = (y + 0.5) / H * Math.PI;
      const a = Math.acos(clamp(Math.sin(phi) * Math.sin(th), -1, 1)), ang = Math.atan2(Math.cos(th), -Math.cos(phi) * Math.sin(th));
      if (a < 0.24) col.setRGB(0.02, 0.02, 0.02);
      else if (a < 0.56) {
        const t = (a - 0.24) / 0.32;
        col.copy(A).lerp(B, t).lerp(R, sm(0.75, 1, t)).multiplyScalar(0.85 + 0.25 * Math.sin(ang * 23) * Math.sin(ang * 7 + 1));
      } else col.setRGB(0.97, 0.96, 0.93).lerp(C(0xe8d6cc), sm(1.2, 2.2, a));
      const k = (y * W + x) * 4;
      img.data[k] = Math.min(255, col.r * 255); img.data[k + 1] = Math.min(255, col.g * 255); img.data[k + 2] = Math.min(255, col.b * 255); img.data[k + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  }, false);
}
// A turning eyeball, a glint, and (optionally) an upper lid that blinks.
export function addEye(parent, at, r, tex, lidMat) {
  const base = new THREE.Group(); base.position.copy(at); parent.add(base);
  base.lookAt(base.getWorldPosition(V()).add(V(0, 0, 1)));
  const ball = new THREE.Group(); base.add(ball);
  mesh(SPH, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.12 }), ball, [0, 0, 0], r);
  mesh(SPH, new THREE.MeshBasicMaterial({ color: 0xffffff }), base, [r * 0.3, r * 0.34, r * 0.93], r * 0.13);
  let lid = null;
  if (lidMat) {
    lid = new THREE.Group(); base.add(lid);
    mesh(new THREE.SphereGeometry(r * 1.08, 24, 10, 0, TAU, 0, Math.PI / 2), lidMat, lid);
  }
  return { base, ball, lid };
}

/* ---------------------------------------------------------------- poses */

export const KEYS = ['lean', 'twist', 'side', 'hy', 'hp', 'hr', 'pp', 'pr', 'jaw'];
for (const k of ['L', 'R']) for (const n of ['af', 'ao', 'at', 'ae', 'lf', 'lo', 'lk', 'la']) KEYS.push(n + k);
export const blank = () => Object.fromEntries(KEYS.map(k => [k, 0]));
export const mirror = p => {
  const o = {};
  for (const [k, v] of Object.entries(p)) {
    const e = k.slice(-1);
    if (e === 'L' || e === 'R') o[k.slice(0, -1) + (e === 'L' ? 'R' : 'L')] = v;
    else o[k] = ['twist', 'side', 'hy', 'hr', 'pr'].includes(k) ? -v : v;
  }
  return o;
};
// joint angles in radians: af arm forward, ao arm out, ae elbow, lf leg forward, lo leg out, lk knee, la ankle

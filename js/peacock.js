/* =============================================================================
   peacock.js — an Indian peacock (Pavo cristatus) in full display behind the content.

   Loaded on demand by site.js (section 16) when the visitor picks the peacock. Like
   wolf.js, everything is built here in code, so the only download is three.js.

   The bird: a sculpted body (royal-blue breast, bronze-green scaled back, buff wings
   barred with black and chestnut primaries), a slender blue neck that is rebuilt every
   frame so it can bob and turn, a head with the white face stripes and the crest of
   blue-tipped wires, and legs placed by inverse kinematics so the feet stay planted.

   The train is always up: about 150 feathers in staggered rows, each with its eyespot
   (navy heart, royal blue, turquoise, bronze and a green-gold ring in loose golden
   barbs). Their colours shift with the angle you see them from, like the real thing.

   What it does: struts about, turns from side to side to show off its fan, rattles it
   so the eyes shimmer, turns round to show its back and shake its wings, and calls.
   Move the mouse and it watches your cursor; keep moving and it turns to face you and
   puts on a show. Scroll hard and it rattles. By day marigold petals drift down; at
   night there are fireflies and the eyes catch the light.

   export start(canvas, { theme, onReady, onSlow }) → { stop(), setTheme(theme) }
   ========================================================================== */
import * as THREE from './vendor/three.module.min.js';
import { TAU, sm, clamp, lerp, angDiff, rand, rnd, V, C, canvasTex, radial, mesh, SPH, ell, smin, surfaceNet, furry } from './kit.js';

const S = 4.3;                                   // peacock metres → scene units
const UP = V(0, 1, 0);

/* ---------------------------------------------------------------- the train: layout */

const ROWS = 6, L_MIN = 0.36, L_MAX = 1.18, TH_MAX = 1.72, SPACING = 0.118;
const EYE_W = 0.15, EYE_H = 0.185;              // size of an eyespot with its fringe, in metres
const FAN_BASE = [0, 0.70, -0.2];                // where the train rises from the back

function trainLayout() {
  const out = [];
  for (let k = 0; k < ROWS; k++) {
    const L = L_MIN + (L_MAX - L_MIN) * k / (ROWS - 1);
    const n = Math.round(L * 2 * TH_MAX / SPACING);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5 + (k % 2 ? 0.25 : -0.25)) / n;                     // rows staggered
      const th = (u * 2 - 1) * TH_MAX + (rand() - 0.5) * 0.02;
      const edge = Math.min(i, n - 1 - i);
      out.push({
        k, th, L: L * (0.97 + rand() * 0.06),
        eye: !(k >= ROWS - 2 && edge < 2),                                     // fishtail feathers at the ends: no eye
        ph: rand() * TAU, wob: 0.7 + rand() * 0.6,
      });
    }
  }
  return out;
}

/* ---------------------------------------------------------------- textures, painted in code */

// One eyespot, tip of the feather at the top: loose golden barbs, a green-gold ring, bronze,
// turquoise, royal blue and the navy heart.
const eyeTex = () => canvasTex(256, 320, (c, W, H) => {
  const cx = W / 2, cy = H * 0.55;
  c.lineCap = 'round';
  for (let i = 0; i < 520; i++) {                                              // the fringe of loose barbs
    const a = -Math.PI / 2 + (rand() * 2 - 1) * Math.PI * 0.98;
    const r0 = 18 + rand() * 30, r1 = (0.78 + rand() * 0.22) * Math.min(W * 0.5, (a < 0 ? H * 0.55 : H * 0.45));
    const bend = (rand() - 0.5) * 0.25;
    const g = c.createLinearGradient(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    const hue = rand();
    g.addColorStop(0, hue < 0.5 ? 'rgba(150,170,60,.95)' : 'rgba(110,150,70,.95)');
    g.addColorStop(0.6, hue < 0.5 ? 'rgba(190,160,60,.8)' : 'rgba(140,160,60,.8)');
    g.addColorStop(1, 'rgba(160,130,50,0)');
    c.strokeStyle = g; c.lineWidth = 0.8 + rand() * 1.3;
    c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    c.quadraticCurveTo(cx + Math.cos(a + bend) * (r0 + r1) / 2, cy + Math.sin(a + bend) * (r0 + r1) / 2, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    c.stroke();
  }
  const ring = (rx, ry, inner, outer, dy = 0) => {
    const g = c.createRadialGradient(cx, cy + dy, 0, cx, cy + dy, Math.max(rx, ry));
    g.addColorStop(0, inner); g.addColorStop(0.75, inner); g.addColorStop(1, outer);
    c.save(); c.translate(cx, cy + dy); c.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry)); c.translate(-cx, -(cy + dy));
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy + dy, Math.max(rx, ry), 0, TAU); c.fill(); c.restore();
  };
  c.filter = 'blur(1.2px)';
  ring(W * 0.34, H * 0.33, '#8fb83c', '#6f9a34');                              // green-gold
  ring(W * 0.29, H * 0.285, '#b8742e', '#8a4f22', 2);                          // bronze
  ring(W * 0.235, H * 0.235, '#2ec4b6', '#1ea59f', 4);                         // turquoise
  ring(W * 0.17, H * 0.175, '#1b5fd6', '#1a47b4', 6);                          // royal blue
  c.filter = 'blur(0.8px)';
  c.fillStyle = '#100c3e';                                                      // the navy heart, lobes at the top
  const hx = cx, hy = cy + 10, hr = W * 0.068;
  c.beginPath();
  c.moveTo(hx, hy + hr * 1.9);
  c.bezierCurveTo(hx - hr * 2.1, hy + hr * 0.6, hx - hr * 1.5, hy - hr * 1.7, hx, hy - hr * 0.7);
  c.bezierCurveTo(hx + hr * 1.5, hy - hr * 1.7, hx + hr * 2.1, hy + hr * 0.6, hx, hy + hr * 1.9);
  c.fill();
  c.filter = 'none';
  const sheen = c.createRadialGradient(hx - hr * 0.4, hy - hr * 0.3, 0, hx, hy, hr * 1.8);
  sheen.addColorStop(0, 'rgba(120,90,230,.55)'); sheen.addColorStop(1, 'rgba(60,40,160,0)');
  c.fillStyle = sheen; c.beginPath(); c.arc(hx, hy, hr * 1.8, 0, TAU); c.fill();
});

// The long part of a train feather, base at the bottom: a pale shaft with metallic barbs that
// fan out wider towards the eye, so neighbouring feathers overlap into one sheet of plumage.
const vaneTex = () => canvasTex(128, 512, (c, W, H) => {
  c.lineCap = 'round';
  const cols = ['40,120,70', '70,146,66', '168,140,46', '44,128,112', '96,150,60', '150,112,40'];
  for (let i = 0; i < 2600; i++) {
    const y = H * Math.pow(rand(), 0.75), t = 1 - y / H;                         // 0 at the base, 1 at the tip
    const hw = W / 2 * (0.12 + 0.88 * Math.pow(t, 0.7));
    const s = rand() < 0.5 ? -1 : 1, len = hw * (0.55 + rand() * 0.45);
    const a = (0.95 + rand() * 0.35) * s;
    c.strokeStyle = `rgba(${cols[(rand() * cols.length) | 0]},${(0.3 + 0.65 * t).toFixed(2)})`; c.lineWidth = 0.8 + rand() * 1.6;
    c.beginPath(); c.moveTo(W / 2, y); c.quadraticCurveTo(W / 2 + Math.sin(a) * len * 0.5, y - len * 0.1, W / 2 + Math.sin(a) * len, y - Math.cos(a) * len * 0.4 - len * 0.12); c.stroke();
  }
  const g = c.createLinearGradient(0, H, 0, 0);
  g.addColorStop(0, '#d8cba6'); g.addColorStop(1, '#b8a46a');
  c.fillStyle = g; c.fillRect(W / 2 - 1.6, 0, 3.2, H);
});

// The sheet of plumage behind the eyes: dense metallic bronze-green barbs streaming outwards.
const sheetTex = () => canvasTex(512, 256, (c, W, H) => {
  c.fillStyle = 'rgba(38,62,34,0)'; c.fillRect(0, 0, W, H);
  c.lineCap = 'round';
  const cols = ['30,96,56', '52,122,58', '112,120,40', '28,104,96', '130,106,38', '44,84,44'];
  for (let i = 0; i < 9000; i++) {
    const x = rand() * W, y0 = H * rand(), len = 8 + rand() * 30, t = 1 - y0 / H;
    if (rand() > 0.35 + 0.65 * Math.min(1, t * 1.8)) continue;
    const top = y0 - len * (0.6 + 0.4 * t);
    if (top < H * 0.02 * (1 + Math.sin(x * 0.21) + Math.sin(x * 0.067))) continue;         // a ragged top edge
    const side = Math.min(x, W - x) / W;
    if (side < 0.04 * (1 + Math.sin(y0 * 0.17)) && rand() > side * 20) continue;            // and ragged sides
    c.strokeStyle = `rgba(${cols[(rand() * cols.length) | 0]},${(0.55 + 0.4 * rand()).toFixed(2)})`; c.lineWidth = 1 + rand() * 2;
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x + (rand() - 0.5) * 6, top); c.stroke();
  }
});

// The stiff brown tail feathers that hold the train up from behind.
const tailTex = () => canvasTex(64, 256, (c, W, H) => {
  c.fillStyle = '#6b5a44';
  c.beginPath(); c.moveTo(W / 2, 0); c.quadraticCurveTo(W, H * 0.1, W * 0.86, H); c.lineTo(W * 0.14, H); c.quadraticCurveTo(0, H * 0.1, W / 2, 0); c.fill();
  for (let y = 6; y < H; y += 9) { c.fillStyle = 'rgba(40,30,22,.35)'; c.fillRect(0, y, W, 3); }
  c.fillStyle = '#cdbf9e'; c.fillRect(W / 2 - 1, 0, 2, H);
});

const petalTex = () => canvasTex(64, 64, (c, W) => {
  const g = c.createRadialGradient(W / 2, W * 0.75, 2, W / 2, W / 2, W / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(235,235,235,1)');
  c.fillStyle = g;
  c.beginPath(); c.moveTo(W / 2, W * 0.95); c.bezierCurveTo(W * 0.05, W * 0.6, W * 0.2, W * 0.08, W / 2, W * 0.05);
  c.bezierCurveTo(W * 0.8, W * 0.08, W * 0.95, W * 0.6, W / 2, W * 0.95); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 1; c.beginPath(); c.moveTo(W / 2, W * 0.9); c.lineTo(W / 2, W * 0.15); c.stroke();
});

/* ---------------------------------------------------------------- shimmer and plumage patterns */

const U = { time: { value: 0 }, shiver: { value: 0 }, glow: { value: 0 } };
const HUE_GLSL = `
vec3 hueTurn(vec3 c, float a) { const vec3 k = vec3(0.57735); float ca = cos(a); return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca); }
`;

// Train feathers: the colour turns with the viewing angle and ripples while the train rattles;
// the back of the fan is dull brown, as on the bird.
function featherMaterial(map, { eye }) {
  const m = new THREE.MeshStandardMaterial({ map, alphaTest: 0.38, side: THREE.DoubleSide, roughness: 0.42, metalness: 0.15, alphaToCoverage: true });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uTime: U.time, uShiver: U.shiver, uGlow: U.glow });
    sh.vertexShader = 'varying float vPhase;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n#ifdef USE_INSTANCING\nvPhase = instanceMatrix[3].x * 23.0 + instanceMatrix[3].y * 17.0;\n#else\nvPhase = 0.0;\n#endif');
    sh.fragmentShader = 'uniform float uTime, uShiver, uGlow;\nvarying float vPhase;\n' + HUE_GLSL + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        vec3 c = diffuseColor.rgb;
        float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
        float fres = 1.0 - abs(dot(normal, normalize(vViewPosition)));
        float a = 1.1 * fres - 0.25 + 0.28 * sin(uTime * 1.3 + vPhase) + uShiver * 0.32 * sin(uTime * 24.0 + vPhase * 3.0);
        c = mix(c, hueTurn(c, a), clamp(sat * 2.5, 0.0, 1.0));
        c *= 1.0 + uShiver * 0.35 * sin(uTime * 19.0 + vPhase * 5.0);
        if (!gl_FrontFacing) c = mix(c, vec3(0.30, 0.26, 0.19) * (0.6 + 0.4 * dot(c, vec3(0.33))), 0.85);
        diffuseColor.rgb = c;
        totalEmissiveRadiance += ${eye ? '1.0' : '0.35'} * c * uGlow * (gl_FrontFacing ? 1.0 : 0.0) * (0.7 + 0.3 * sin(uTime * 2.0 + vPhase));
      }`);
  };
  m.customProgramCacheKey = () => 'peacock-feather-' + (eye ? 'eye' : 'vane');
  return m;
}

// Body plumage: vertex colours plus a pattern by a per-vertex code (aPat = kind, s, t):
// 1 bronze-green scales on the back, 2 fine scales on the blue neck, 3 black barring on the wings.
function plumageMaterial() {
  const m = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.38, metalness: 0.12,
    iridescence: 0.75, iridescenceIOR: 1.45, iridescenceThicknessRange: [260, 620],
    clearcoat: 0.35, clearcoatRoughness: 0.45, sheen: 0.18, sheenColor: C(0x4fd0c8), sheenRoughness: 0.5,
    side: THREE.DoubleSide,
  });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uTime: U.time });
    sh.vertexShader = 'attribute vec3 aPat;\nvarying vec3 vPat;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPat = aPat;');
    sh.fragmentShader = 'uniform float uTime;\nvarying vec3 vPat;\n' + HUE_GLSL + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      if (vPat.x > 0.5 && vPat.x < 2.5) {
        vec2 g = vPat.yz; g.x += 0.5 * mod(floor(g.y), 2.0);
        vec2 q = fract(g) - vec2(0.5, 0.2);
        float d = length(q * vec2(1.0, 0.8));
        float edge = smoothstep(0.36, 0.56, d);
        diffuseColor.rgb *= mix(vPat.x < 1.5 ? 1.18 : 1.08, vPat.x < 1.5 ? 0.32 : 0.72, edge);
      } else if (vPat.x > 2.5) {
        float b = 0.5 + 0.5 * sin(vPat.z * 6.2831 + 0.6 * sin(vPat.y * 9.0));
        diffuseColor.rgb *= mix(1.0, 0.16, smoothstep(0.6, 0.86, b));
      }`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        vec3 c = diffuseColor.rgb;
        float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
        float fres = 1.0 - abs(dot(normal, normalize(vViewPosition)));
        diffuseColor.rgb = mix(c, hueTurn(c, 0.9 * fres - 0.2), clamp(sat * 2.0, 0.0, 0.85));
      }`);
  };
  m.customProgramCacheKey = () => 'peacock-plumage';
  return m;
}

// surface net of an sdf, with vertex colours and pattern codes from paint(x, y, z) → { c, pat: [kind, s, t] }
function sculptSdf(sdf, paint, lo, hi, cell) {
  const pats = [];
  const g = surfaceNet(sdf, (x, y, z) => { const p = paint(x, y, z); pats.push(...(p.pat || [0, 0, 0])); return p.c; }, lo, hi, cell);
  g.setAttribute('aPat', new THREE.Float32BufferAttribute(pats, 3));
  return g;
}

/* ---------------------------------------------------------------- the bird's shape (metres; forward +z, up +y) */

const COL = {
  blue: C(0x1747b8), blueHi: C(0x2160d8), teal: C(0x177f8a), belly: C(0x12171c), bronze: C(0x4a8a3a), green: C(0x2f6e3c),
  buff: C(0xc4ab7c), dark: C(0x1f2840), rufous: C(0xb0541f), thigh: C(0x3a342c), horn: C(0xcbb998), white: C(0xf4f1ea),
};
const tilt = (y, z, a) => [y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];

function bodySdf(x, y, z) {
  const [ty, tz] = tilt(y - 0.62, z, -0.22);
  let d = ell(x, ty + 0.62, tz, 0, 0.62, 0, 0.14, 0.145, 0.27);                    // the body, front raised
  d = smin(d, ell(x, y, z, 0, 0.635, 0.1, 0.108, 0.13, 0.115), 0.07);               // breast
  d = smin(d, ell(x, y, z, 0, 0.71, -0.15, 0.115, 0.085, 0.14), 0.06);             // rump, where the train rises
  d = smin(d, Math.hypot(x, y - lerp(0.70, 0.83, clamp((z - 0.12) / 0.08, 0, 1)), z - clamp(z, 0.12, 0.2)) - 0.054, 0.05);   // base of the neck
  const s = x >= 0 ? 1 : -1;
  d = smin(d, ell(x, y, z, s * 0.06, 0.5, 0.0, 0.05, 0.1, 0.07), 0.08);             // feathered thighs
  return d;
}
function bodyPaint(x, y, z) {
  const up = sm(0.62, 0.74, y), front = sm(-0.02, 0.14, z);
  let c = COL.belly.clone();
  c.lerp(COL.blue, front * sm(0.5, 0.62, y));                                       // breast
  if (y < 0.56 && Math.abs(x) > 0.03) c.lerp(COL.thigh, sm(0.56, 0.46, y) * 0.95);
  const back = up * (1 - front * 0.8);
  c.lerp(COL.bronze, back);
  if (z < -0.08) c.lerp(COL.green, up * sm(-0.08, -0.22, z));
  if (back > 0.4) return { c, pat: [1, x * 58, -z * 58 + y * 20] };
  if (front > 0.5 && y > 0.6) return { c, pat: [2, x * 90, y * 90] };
  return { c };
}

function wingSdf(x, y, z) {
  const [ty, tz] = tilt(y - 0.64, z + 0.04, -0.12);
  let d = ell(x, ty, tz, 0, 0, 0, 0.042, 0.1, 0.24);
  d = smin(d, ell(x, ty, tz, 0, -0.03, -0.17, 0.03, 0.06, 0.12), 0.05);            // primaries, the point of the wing
  return d;
}
function wingPaint(x, y, z) {
  const ty = y - 0.64;
  if (z < -0.1 && ty < 0.02) return { c: COL.rufous.clone().lerp(C(0x7a3416), sm(-0.1, -0.33, z)) };   // chestnut primaries
  if (ty < -0.04) return { c: COL.dark.clone() };                                  // dark secondaries
  return { c: COL.buff.clone().lerp(C(0xb9a27a), sm(0.06, -0.04, ty)), pat: [3, z * 30, ty * 46 - z * 9] };
}

function headSdf(x, y, z) {
  let d = ell(x, y, z, 0, 0, 0, 0.03, 0.033, 0.04);                                // crown
  d = smin(d, ell(x, y, z, 0, -0.008, 0.026, 0.022, 0.021, 0.026), 0.012);         // face
  const t = clamp((z - 0.035) / 0.05, 0, 1);                                       // the bill, curving down a touch
  d = smin(d, Math.hypot(x, y - (-0.004 - 0.008 * t * t), z - (0.035 + 0.05 * t)) - lerp(0.011, 0.003, t), 0.008);
  return d;
}
function headPaint(x, y, z) {
  if (z > 0.043) return { c: COL.horn.clone() };
  const s = Math.abs(x);
  if (s > 0.012 && z > -0.02) {
    const eye = ((y - 0.004) / 0.012) ** 2 + ((z - 0.012) / 0.017) ** 2;
    if (eye < 1) return { c: COL.white.clone() };                                   // bare skin round the eye
    if (Math.abs(y - 0.019) < 0.0035 && z > -0.012 && z < 0.032) return { c: COL.white.clone() };      // stripe above
    if (Math.abs(y + 0.012 - 0.004 * (z - 0.01) / 0.03) < 0.003 && z > -0.018 && z < 0.026) return { c: COL.white.clone() };   // and below
  }
  return { c: COL.blueHi.clone().lerp(COL.teal, sm(0.0, 0.03, y) * 0.35), pat: [2, x * 160, y * 160] };
}

/* ---------------------------------------------------------------- build */

function buildPeacock() {
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);
  const plume = plumageMaterial();

  mesh(sculptSdf(bodySdf, bodyPaint, [-0.2, 0.36, -0.36], [0.2, 0.9, 0.3], 0.011), plume, body);
  // the grey-buff down at the base of the train, seen when it turns its back
  const downGeo = new THREE.SphereGeometry(1, 24, 16);
  downGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Array(downGeo.attributes.position.count * 3).fill(0).map((_, i) => [0.2, 0.17, 0.13][i % 3]), 3));
  furry(downGeo, body, { len: 0.28, layers: 7, freq: 30, pos: [0, 0.66, -0.26], scale: [0.12, 0.09, 0.07] });

  const wings = [];
  for (const s of [1, -1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.11, 0.72, 0.1); body.add(pivot);
    const geo = sculptSdf((x, y, z) => wingSdf(x * s - 0.118, y, z), (x, y, z) => wingPaint(x * s, y, z), [-0.2, 0.44, -0.46], [0.2, 0.8, 0.24], 0.011);
    geo.translate(-s * 0.11, -0.72, -0.1);
    mesh(geo, plume, pivot);
    wings.push({ pivot, s });
  }

  // the neck, rebuilt each frame along a curve from the breast to the head
  const NU = 22, NV = 12;
  const neckGeo = new THREE.BufferGeometry();
  const npos = new Float32Array((NU + 1) * (NV + 1) * 3), ncol = [], npat = [], nidx = [];
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
    const u = i / NU, a = j / NV * TAU, behind = sm(0.2, -0.9, Math.cos(a)) * sm(0.45, 0, u);
    const c = COL.blue.clone().lerp(COL.blueHi, u * 0.6).lerp(COL.teal, 0.25 * Math.max(0, Math.sin(a)) ** 2).lerp(COL.bronze, behind * 0.6);
    ncol.push(c.r, c.g, c.b); npat.push(2, j * 2.4, u * 46);
    if (i < NU && j < NV) { const p = i * (NV + 1) + j; nidx.push(p, p + NV + 1, p + 1, p + 1, p + NV + 1, p + NV + 2); }
  }
  neckGeo.setAttribute('position', new THREE.BufferAttribute(npos, 3).setUsage(THREE.DynamicDrawUsage));
  neckGeo.setAttribute('color', new THREE.Float32BufferAttribute(ncol, 3));
  neckGeo.setAttribute('aPat', new THREE.Float32BufferAttribute(npat, 3));
  neckGeo.setIndex(nidx);
  const neck = mesh(neckGeo, plume, body); neck.frustumCulled = false;

  // the head, its lower bill, eyes and the crest
  const head = new THREE.Group(); body.add(head);
  mesh(sculptSdf(headSdf, headPaint, [-0.05, -0.05, -0.06], [0.05, 0.05, 0.1], 0.0042), plume, head);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.013, 0.03); head.add(jaw);
  mesh(new THREE.ConeGeometry(0.008, 0.045, 10).rotateX(Math.PI / 2).translate(0, 0, 0.022), new THREE.MeshStandardMaterial({ color: COL.horn, roughness: 0.5 }), jaw, [0, 0, 0], [1, 0.55, 1]);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x2a170c, roughness: 0.08, metalness: 0.1 });
  const glint = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const s of [1, -1]) {
    mesh(SPH, eyeMat, head, [s * 0.026, 0.004, 0.013], 0.0068);
    mesh(SPH, glint, head, [s * 0.031, 0.007, 0.016], 0.0018);
  }
  const NC = 22, wire = new THREE.CylinderGeometry(0.0011, 0.0015, 1, 5).translate(0, 0.5, 0);
  const crestShaft = new THREE.InstancedMesh(wire, new THREE.MeshStandardMaterial({ color: 0x2f4a5a, roughness: 0.6 }), NC);
  const crestTip = new THREE.InstancedMesh(SPH, new THREE.MeshPhysicalMaterial({ color: 0x1c6fb0, roughness: 0.35, iridescence: 0.8, iridescenceIOR: 1.45 }), NC);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V();
  for (let i = 0; i < NC; i++) {
    const a = (i / (NC - 1) - 0.5) * 1.15 + (rand() - 0.5) * 0.06, side = (rand() - 0.5) * 0.35, L = 0.058 + rand() * 0.012;
    const dir = V(Math.sin(side) * 0.6, Math.cos(a), Math.sin(a)).normalize();
    const base = V(side * 0.01, 0.028, 0.002 + a * 0.012);
    q.setFromUnitVectors(UP, dir);
    crestShaft.setMatrixAt(i, mtx.compose(base, q, sc.set(1, L, 1)));
    crestTip.setMatrixAt(i, mtx.compose(base.clone().addScaledVector(dir, L), q, sc.set(0.0055, 0.0085, 0.0028)));
  }
  head.add(crestShaft, crestTip);

  // the train: a vane and an eye per feather, plus the brown tail feathers behind
  const fan = new THREE.Group(); fan.position.set(...FAN_BASE); body.add(fan);
  const feathers = trainLayout();
  const quad = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const eyeQuad = new THREE.PlaneGeometry(1, 1);
  const vanes = new THREE.InstancedMesh(quad, featherMaterial(vaneTex(), { eye: false }), feathers.length);
  const eyes = new THREE.InstancedMesh(eyeQuad, featherMaterial(eyeTex(), { eye: true }), feathers.length);
  const SU = 40, SV = 10, sheetGeo = new THREE.BufferGeometry(), sidx = [], suv = [];
  for (let i = 0; i <= SU; i++) for (let j = 0; j <= SV; j++) {
    suv.push(i / SU, j / SV);
    if (i < SU && j < SV) { const p = i * (SV + 1) + j; sidx.push(p, p + SV + 1, p + 1, p + 1, p + SV + 1, p + SV + 2); }
  }
  sheetGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SU + 1) * (SV + 1) * 3), 3).setUsage(THREE.DynamicDrawUsage));
  sheetGeo.setAttribute('uv', new THREE.Float32BufferAttribute(suv, 2));
  sheetGeo.setIndex(sidx);
  const sheet = mesh(sheetGeo, featherMaterial(sheetTex(), { eye: false }), fan); sheet.frustumCulled = false;
  const NT = 18, tails = [];
  for (let i = 0; i < NT; i++) tails.push({ th: (i / (NT - 1) * 2 - 1) * 1.25, L: 0.5 + rand() * 0.06 });
  const tailMesh = new THREE.InstancedMesh(quad, new THREE.MeshStandardMaterial({ map: tailTex(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 }), NT);
  for (const m of [vanes, eyes, tailMesh]) { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); fan.add(m); }

  // legs: two segments each, set by inverse kinematics every frame, and a foot of four toes
  const legMat = new THREE.MeshStandardMaterial({ color: 0x8a7862, roughness: 0.65 });
  const seg = new THREE.CylinderGeometry(1, 0.8, 1, 8).translate(0, 0.5, 0);
  const legs = [1, -1].map(s => {
    const upper = mesh(seg, legMat, root), lower = mesh(seg, legMat, root);
    const foot = new THREE.Group(); root.add(foot);
    for (const [a, l] of [[0, 0.065], [0.45, 0.055], [-0.45, 0.055], [Math.PI, 0.03]]) {
      const toe = mesh(seg, legMat, foot); toe.scale.set(0.006, l, 0.006);
      toe.quaternion.setFromUnitVectors(UP, V(Math.sin(a), -0.08, Math.cos(a)).normalize());
    }
    mesh(seg, legMat, foot, [0, 0.04, -0.012], [0.004, 0.025, 0.004]).rotation.x = -2.2;   // spur
    return { s, upper, lower, foot, hip: V(s * 0.068, 0.42, 0.0), F: V(), from: V(), to: V(), t: 1, stepping: false };
  });

  return { root, body, wings, neck, neckGeo, NU, NV, head, jaw, fan, feathers, vanes, eyes, tails, tailMesh, legs, sheet, SU, SV };
}

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

  const hemi = new THREE.HemisphereLight(0xdfeaff, 0x6b5a3a, 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d2, 3.2); sun.position.set(-10, 18, 16); scene.add(sun);
  const rim = new THREE.DirectionalLight(0xffd7a0, 1.6); rim.position.set(10, 10, -18); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xbfe6ff, 0.8); fill.position.set(14, 4, 10); scene.add(fill);

  const P = buildPeacock();
  scene.add(P.root);
  P.root.scale.setScalar(S);
  const { body, wings, head, jaw, fan, feathers, vanes, eyes, tails, tailMesh, legs } = P;

  const shadow = mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(0,0,0,.42)'], [0.55, 'rgba(0,0,0,.16)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }), scene);
  shadow.renderOrder = -1;

  // by day, marigold and rose petals drifting down; at night, fireflies
  const NP = small ? 26 : 46;
  const petals = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.42), new THREE.MeshStandardMaterial({ map: petalTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 }), NP);
  petals.frustumCulled = false; petals.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(petals);
  const PETAL_C = [0xf39c12, 0xf7b733, 0xe8590c, 0xffcf40, 0xe0457b, 0xd6336c];
  const petalU = Array.from({ length: NP }, (_, i) => {
    petals.setColorAt(i, C(PETAL_C[i % PETAL_C.length]));
    return { p: V((rand() * 2 - 1) * 36, rand() * 26, -26 + rand() * 34), v: 0.5 + rand() * 0.7, sp: V(rand(), rand(), rand()).multiplyScalar(TAU), w: 0.6 + rand() * 1.4 };
  });
  const NF = small ? 24 : 44, flyPos = new Float32Array(NF * 3), flyCol = new Float32Array(NF * 3), flyU = [];
  for (let i = 0; i < NF; i++) flyU.push({ c: V((rand() * 2 - 1) * 32, 0.8 + rand() * 9, -24 + rand() * 30), ph: rand() * TAU, r: 0.6 + rand() * 1.4, f: 0.3 + rand() * 0.5 });
  const flyGeo = new THREE.BufferGeometry();
  flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3).setUsage(THREE.DynamicDrawUsage));
  flyGeo.setAttribute('color', new THREE.BufferAttribute(flyCol, 3).setUsage(THREE.DynamicDrawUsage));
  const flies = new THREE.Points(flyGeo, new THREE.PointsMaterial({ map: radial([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]), size: 0.55, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  flies.frustumCulled = false; scene.add(flies);
  let night = true;

  /* ---------------------------------------------------------------- layout */
  let aspect = 1, camK = 1;
  const Z0 = -18, Z1 = 0;                                   // how far back and how near it comes
  const camDist = z => Math.hypot(camera.position.y, camera.position.z - z);
  const xLim = z => Math.max(2, camDist(z) * tanH * aspect - 5.5);
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    aspect = w / h; camera.aspect = aspect;
    camK = Math.max(1, Math.pow(1.3 / aspect, 0.6));
    camera.position.set(0, 8 * camK, 31 * camK);
    camera.lookAt(0, 2.5, -4);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  }
  resize();

  /* ---------------------------------------------------------------- input */
  let clock = 0, interest = 0, lastMove = -99, scrollKick = 0;
  const ptr = { x: 0, y: 0, has: false }, cursor = V(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const ground = new THREE.Plane(UP, 0);
  function aimCursor() {
    ndc.set(ptr.x / innerWidth * 2 - 1, -(ptr.y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(ground, cursor) || cursor.z < Z0 - 6) ray.ray.at((camera.position.z - Z0 + 6) / Math.max(0.2, -ray.ray.direction.z), cursor);
    cursor.y = 0; cursor.z = clamp(cursor.z, Z0 - 4, Z1 + 6);
  }
  const onMove = e => {
    if (ptr.has) interest += Math.min(120, Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y)) * 0.0022;
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true; lastMove = clock;
  };
  let scrollY = window.scrollY;
  const onScroll = () => { const y = window.scrollY; scrollKick += Math.abs(y - scrollY); scrollY = y; };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize);

  /* ---------------------------------------------------------------- state */
  const pos = V(), goal = V(), tmp = V(), tmp2 = V();
  let yaw = 0, speed = 0, stride = 0, mode = 'pose', modeT = 0, modeLen = 6, wantYaw = 0;
  let spread = 1, shiver = 0, shiverAim = 0, droop = 0.45, call = 0, look = V(0, 1.1, 2), lookW = 0, swayPh = rnd() * TAU;
  const facing = () => Math.atan2(camera.position.x - pos.x, camera.position.z - pos.z);

  function go(m, len) {
    mode = m; modeT = 0; modeLen = len;
    if (m === 'strut') pickGoal();
    if (m === 'pose') wantYaw = facing() + (rnd() - 0.5) * 0.9;
    if (m === 'turnback') wantYaw = facing() + Math.PI * (rnd() < 0.5 ? 1 : -1) * 0.92;
  }
  function pickGoal() {
    for (let i = 0; i < 12; i++) {
      const z = lerp(Z0, Z1, rnd()), lim = xLim(z), x = (rnd() * 2 - 1) * lim;
      if (Math.hypot(x - pos.x, z - pos.z) > 5) { goal.set(x, 0, z); return; }
    }
    goal.set(-pos.x * 0.5, 0, lerp(Z0, Z1, rnd()));
  }
  function next() {
    const r = rnd();
    if (r < 0.38) go('strut', 30);
    else if (r < 0.62) go('shiver', 2.4);
    else if (r < 0.78) go('turnback', 5.5);
    else if (r < 0.9) go('call', 2.2);
    else go('pose', 6 + rnd() * 5);
  }

  /* ---------------------------------------------------------------- behaviour */
  function behave(dt) {
    modeT += dt;
    const moving = clock - lastMove < 2.5;
    if (moving) { aimCursor(); look.set(cursor.x, 1.1 * S, cursor.z); lookW = Math.min(1, lookW + dt * 2); }
    else lookW = Math.max(0, lookW - dt * 0.6);
    interest = Math.max(0, interest - dt * 0.35);
    scrollKick = Math.max(0, scrollKick - dt * 900);

    // keep moving the mouse and it turns to you and puts on a show; a hard scroll makes it rattle
    if (interest > 1.3 && mode !== 'show' && mode !== 'shiver') { interest = 0.2; go('show', 4.5); }
    if (scrollKick > 900 && mode !== 'shiver' && mode !== 'show') { scrollKick = 0; go('shiver', 2.2); }

    shiverAim = 0; let droopAim = 0.45, walk = false;
    switch (mode) {
      case 'pose': {                                        // turning slowly from side to side to show the fan
        wantYaw = facing() + Math.sin(modeT * 0.45 + swayPh) * 0.55;
        if (modeT > modeLen) next();
        break;
      }
      case 'strut': {
        tmp.subVectors(goal, pos); tmp.y = 0;
        const d = tmp.length();
        wantYaw = Math.atan2(tmp.x, tmp.z); walk = true;
        if (d < 0.6 || modeT > modeLen) go('pose', 5 + rnd() * 6);
        break;
      }
      case 'shiver': {                                      // train-rattling: the eyes shimmer, the wings droop and quiver
        wantYaw = facing() + Math.sin(swayPh) * 0.25;
        shiverAim = sm(0, 0.25, modeT) * (1 - sm(modeLen - 0.35, modeLen, modeT)); droopAim = 0.85;
        if (modeT > modeLen) go('pose', 5 + rnd() * 5);
        break;
      }
      case 'show': {                                        // turn to the cursor and rattle at it
        aimCursor(); wantYaw = Math.atan2(cursor.x - pos.x, cursor.z - pos.z);
        const t = modeT - 0.9;
        shiverAim = t > 0 ? sm(0, 0.25, t) * (1 - sm(modeLen - 1.3, modeLen - 0.9, t)) : 0; droopAim = 0.85;
        if (modeT > modeLen) go('pose', 6 + rnd() * 5);
        break;
      }
      case 'turnback': {                                    // shows its back and shakes its wings, then turns round with a rattle
        droopAim = modeT > 1.2 && modeT < 4 ? 0.95 : 0.5;
        if (modeT > 4.1) wantYaw = facing();
        if (modeT > modeLen) go('shiver', 2);
        break;
      }
      case 'call': {
        wantYaw = facing() + 0.35;
        call = sm(0, 0.35, modeT) * (1 - sm(modeLen - 0.4, modeLen, modeT));
        if (modeT > modeLen) { call = 0; go('pose', 5 + rnd() * 4); }
        break;
      }
      case 'open': {                                        // the first time: the train swings up and opens
        spread = sm(0.3, 2.4, modeT); shiverAim = sm(1.8, 2.2, modeT) * (1 - sm(3.2, 3.6, modeT)); droopAim = 0.8;
        if (modeT > modeLen) { spread = 1; go('pose', 5); }
        break;
      }
    }
    if (mode !== 'call') call = Math.max(0, call - dt * 3);

    // turn, then walk; it turns on the spot first if the heading is far off
    const dy = angDiff(yaw, wantYaw), rate = walk ? 1.5 : 1.1;
    yaw += clamp(dy, -rate * dt, rate * dt);
    const want = walk && Math.abs(dy) < 0.9 ? 1.15 : 0;
    speed += (want - speed) * Math.min(1, dt * 2.5);
    pos.x += Math.sin(yaw) * speed * dt; pos.z += Math.cos(yaw) * speed * dt;
    pos.z = clamp(pos.z, Z0 - 2, Z1 + 1); pos.x = clamp(pos.x, -xLim(pos.z) - 1, xLim(pos.z) + 1);
    stride += speed * dt;

    shiver += (shiverAim - shiver) * Math.min(1, dt * 8);
    droop += (droopAim - droop) * Math.min(1, dt * 3);
  }

  /* ---------------------------------------------------------------- pose the bird */
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1);
  const R = V(), Ud = V(), N = V(), base = V(), Z = V(0, 0, 1), Y = V(0, 1, 0);
  const headPos = V(), headLocalLook = V(), inv = new THREE.Matrix4();
  const bez = new THREE.CubicBezierCurve3(V(), V(), V(), V()), bp = V(), bt = V(), bn = V(), bb = V(), Xax = V(1, 0, 0);
  const hipW = V(), J = V(), D = V();
  let headYaw = 0, headPitch = 0;

  function featherBasis(th, e, extraSide, extraFwd) {
    // display direction: up and out in a dish that curls forward at the sides; folded: trailing behind
    const a = Math.abs(th) / TH_MAX, cup = 0.16 + 0.32 * Math.pow(a, 1.6);
    Ud.set(Math.sin(th) * Math.cos(cup), Math.cos(th) * Math.cos(cup), Math.sin(cup));
    tmp.set(Math.sin(th) * 0.12, 0.05, -1).normalize();
    Ud.lerp(tmp, 1 - e).normalize();
    N.copy(Z).addScaledVector(Ud, -Ud.dot(Z));                 // open: the feather faces forward
    tmp2.copy(Y).addScaledVector(Ud, -Ud.dot(Y));              // folded: it lies flat, facing up
    if (N.lengthSq() < 1e-6) N.copy(tmp2);
    if (tmp2.lengthSq() < 1e-6) tmp2.copy(N);
    N.normalize().lerp(tmp2.normalize(), 1 - sm(0.2, 0.7, e)).normalize();
    R.crossVectors(Ud, N).normalize();
    Ud.addScaledVector(R, extraSide).addScaledVector(N, extraFwd).normalize();
    N.addScaledVector(Ud, -Ud.dot(N)).normalize();
    R.crossVectors(Ud, N);
  }
  function setBasis(target, i, origin, w, h) {
    mtx.makeBasis(R.clone().multiplyScalar(w), Ud.clone().multiplyScalar(h), N);
    mtx.setPosition(origin);
    target.setMatrixAt(i, mtx);
  }

  function poseTrain() {
    const e = sm(0, 1, spread), t = clock, sh = shiver;
    for (let i = 0; i < feathers.length; i++) {
      const f = feathers[i];
      const side = sh * 0.035 * f.wob * Math.sin(t * 26 + f.ph) + 0.012 * Math.sin(t * 0.9 + f.ph) * f.wob;
      const fwd = sh * 0.03 * Math.sin(t * 31 + f.ph * 2) + 0.008 * Math.sin(t * 1.3 + f.ph);
      featherBasis(f.th * (0.25 + 0.75 * e), e, side, fwd);
      const layer = (ROWS - 1 - f.k) * 0.007;
      base.copy(Ud).multiplyScalar(0.03).addScaledVector(N, layer);
      setBasis(vanes, i, base, 0.12, f.L - EYE_H * 0.4);
      if (f.eye) {
        base.copy(Ud).multiplyScalar(f.L - EYE_H * 0.42).addScaledVector(N, layer + 0.0025);
        setBasis(eyes, i, base, EYE_W, EYE_H);
      } else eyes.setMatrixAt(i, mtx.makeScale(0, 0, 0));
    }
    for (let i = 0; i < tails.length; i++) {
      const f = tails[i];
      featherBasis(f.th * (0.3 + 0.7 * e), e, sh * 0.02 * Math.sin(t * 22 + i), 0);
      base.copy(Ud).multiplyScalar(0.02).addScaledVector(N, -0.035);
      setBasis(tailMesh, i, base, 0.06, f.L);
    }
    const sp = P.sheet.geometry.attributes.position;
    for (let i = 0; i <= P.SU; i++) {
      const th = (i / P.SU * 2 - 1) * (TH_MAX + 0.04);
      featherBasis(th * (0.25 + 0.75 * e), e, 0, sh * 0.02 * Math.sin(t * 27 + i));
      for (let j = 0; j <= P.SV; j++) {
        const r = 0.04 + (L_MAX * 0.93 - 0.04) * j / P.SV, k = (i * (P.SV + 1) + j) * 3;
        sp.array[k] = Ud.x * r - N.x * 0.012; sp.array[k + 1] = Ud.y * r - N.y * 0.012; sp.array[k + 2] = Ud.z * r - N.z * 0.012;
      }
    }
    sp.needsUpdate = true; P.sheet.geometry.computeVertexNormals();
    vanes.instanceMatrix.needsUpdate = eyes.instanceMatrix.needsUpdate = tailMesh.instanceMatrix.needsUpdate = true;
    // the whole fan leans back a little, and is thrust forward and shaken when it rattles
    fan.rotation.set(-0.16 + 0.1 * sh + 0.025 * Math.sin(stride * 3.2) * Math.min(1, speed), 0, 0.03 * Math.sin(clock * 0.7) + sh * 0.02 * Math.sin(clock * 17));
    fan.position.set(FAN_BASE[0], FAN_BASE[1] + sh * 0.01 * Math.sin(clock * 40), FAN_BASE[2]);
  }

  function poseBody(dt) {
    const step = Math.min(1, speed);
    body.position.set(0, -0.012 * step * Math.abs(Math.sin(stride * 2.4)) + 0.004 * Math.sin(clock * 1.7), 0);
    body.rotation.set(-0.04 * call, 0, 0.02 * step * Math.sin(stride * 2.4));
    for (const w of wings) {
      const quiver = shiver * 0.04 * Math.sin(clock * 34 + w.s) + (mode === 'turnback' && droop > 0.8 ? 0.06 * Math.sin(clock * 28) : 0);
      w.pivot.rotation.set(-0.32 * droop, 0, w.s * (0.18 * droop + quiver));
    }

    // the head: looks at the cursor when the mouse moves, otherwise about itself and at you; bobs as it walks
    const hy0 = mode === 'call' ? 0 : lookW > 0 ? 0 : Math.sin(clock * 0.37 + 1) * 0.5 + Math.sin(clock * 1.1) * 0.15;
    let wantHY = hy0, wantHP = -0.05 + 0.04 * Math.sin(clock * 0.5);
    if (lookW > 0) {
      inv.copy(body.matrixWorld).invert();
      headLocalLook.copy(look).applyMatrix4(inv);
      wantHY = lerp(hy0, clamp(Math.atan2(headLocalLook.x, headLocalLook.z - 0.2), -1.1, 1.1), lookW);
      wantHP = lerp(wantHP, clamp(Math.atan2(headLocalLook.y - 1.13, Math.hypot(headLocalLook.x, headLocalLook.z)), -0.5, 0.4), lookW);
    }
    headYaw += (wantHY - headYaw) * Math.min(1, dt * 4);
    headPitch += (wantHP - headPitch) * Math.min(1, dt * 4);
    const bob = step * Math.max(0, Math.sin(stride * 2.4)) * 0.03;
    headPos.set(Math.sin(headYaw) * 0.045, 1.13 + 0.07 * call - 0.012 * shiver + 0.006 * Math.sin(clock * 2.3), 0.23 + bob - 0.03 * call + 0.01 * Math.cos(headYaw));
    head.position.copy(headPos);
    head.rotation.set(-headPitch - 0.55 * call, headYaw, 0, 'YXZ');
    jaw.rotation.x = call * (0.35 + 0.25 * Math.sin(clock * 9)) ;

    // the neck: a cubic from the breast to the back of the head, an S that straightens as it reaches up
    bez.v0.set(0, 0.7, 0.12);
    const p3 = bez.v3.set(0, -0.012, -0.02).applyEuler(head.rotation).add(headPos);
    bez.v1.set(0, 0.9, 0.24 + 0.03 * call);
    bez.v2.copy(p3).add(tmp.set(0, -0.09, -0.035 + 0.03 * call));
    const pos3 = P.neckGeo.attributes.position, NU = P.NU, NV = P.NV;
    for (let i = 0; i <= NU; i++) {
      const u = i / NU;
      bez.getPoint(u, bp); bez.getTangent(u, bt);
      bn.crossVectors(bt, Xax).normalize(); bb.crossVectors(bn, bt).normalize();
      const r = lerp(0.062, 0.022, Math.pow(u, 0.5)) * (1 + 0.12 * sm(0.25, 0, u));
      for (let j = 0; j <= NV; j++) {
        const a = j / NV * TAU, ca = Math.cos(a), sa = Math.sin(a);
        const k = (i * (NV + 1) + j) * 3;
        pos3.array[k] = bp.x + (bb.x * sa + bn.x * ca) * r * 0.92;
        pos3.array[k + 1] = bp.y + (bb.y * sa + bn.y * ca) * r;
        pos3.array[k + 2] = bp.z + (bb.z * sa + bn.z * ca) * r;
      }
    }
    pos3.needsUpdate = true;
    P.neckGeo.computeVertexNormals();
  }

  // feet stay planted and step in turn; the legs reach them by two-bone inverse kinematics
  const homeOf = (L, out) => out.set(L.s * 0.07, 0, 0.03).applyMatrix4(P.root.matrixWorld);
  function poseLegs(dt) {
    P.root.updateMatrixWorld(true);
    for (const L of legs) {
      homeOf(L, tmp);
      if (L.stepping) {
        L.t = Math.min(1, L.t + dt / 0.34);
        L.F.lerpVectors(L.from, L.to, sm(0, 1, L.t));
        L.F.y = Math.sin(Math.PI * L.t) * 0.08 * S;
        if (L.t >= 1) { L.stepping = false; L.F.y = 0; }
      } else {
        const other = legs.find(o => o !== L);
        const far = tmp.distanceTo(L.F) > (speed > 0.2 ? 0.1 : 0.05) * S;
        if (far && !other.stepping) {
          L.stepping = true; L.t = 0; L.from.copy(L.F);
          L.to.copy(tmp).add(tmp2.set(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(speed * 0.22));
        }
      }
    }
    inv.copy(P.root.matrixWorld).invert();
    for (const L of legs) {
      hipW.copy(L.hip).add(body.position);
      D.copy(L.F).applyMatrix4(inv);                         // the foot, in the bird's own metres
      const a = 0.22, b = 0.23;
      tmp.subVectors(D, hipW); let d = tmp.length();
      d = Math.min(d, a + b - 1e-3); tmp.normalize();
      const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x));
      tmp2.set(0, 0, -1); tmp2.addScaledVector(tmp, -tmp2.dot(tmp)).normalize();
      J.copy(hipW).addScaledVector(tmp, x).addScaledVector(tmp2, h);    // the ankle bends backwards, as a bird's does
      const foot = tmp.clone().multiplyScalar(d).add(hipW);
      placeSeg(L.upper, hipW, J, 0.022);
      placeSeg(L.lower, J, foot, 0.015);
      L.foot.position.copy(foot);
      L.foot.rotation.set(0, 0, 0);
    }
  }
  function placeSeg(m, a, b, r) {
    tmp.subVectors(b, a); const l = tmp.length();
    m.position.copy(a); m.quaternion.setFromUnitVectors(UP, tmp.normalize()); m.scale.set(r, l, r);
  }

  function applyRoot() { P.root.position.copy(pos); P.root.rotation.y = yaw; }

  function scenery(dt) {
    const e = sm(0, 1, spread);
    shadow.position.set(pos.x - Math.sin(yaw) * 0.6, 0.02, pos.z - Math.cos(yaw) * 0.6);
    shadow.rotation.y = yaw;
    shadow.scale.set(lerp(2.6, 8.4, e), 1, lerp(5, 3.4, e));
    petals.visible = !night; flies.visible = night;
    if (!night) {
      for (let i = 0; i < NP; i++) {
        const u = petalU[i];
        u.p.y -= u.v * dt; u.p.x += Math.sin(clock * 0.4 + u.sp.x) * 0.5 * dt + 0.25 * dt;
        if (u.p.y < -0.5) { u.p.y = 24 + rnd() * 4; u.p.x = (rnd() * 2 - 1) * 36; }
        if (u.p.x > 38) u.p.x = -38;
        q.setFromEuler(new THREE.Euler(clock * u.w + u.sp.x, clock * u.w * 0.7 + u.sp.y, Math.sin(clock + u.sp.z)));
        petals.setMatrixAt(i, mtx.compose(u.p, q, sc.set(1, 1, 1)));
      }
      petals.instanceMatrix.needsUpdate = true;
    } else {
      for (let i = 0; i < NF; i++) {
        const u = flyU[i], t = clock * u.f + u.ph;
        flyPos[i * 3] = u.c.x + Math.sin(t) * u.r; flyPos[i * 3 + 1] = u.c.y + Math.sin(t * 1.7) * 0.6; flyPos[i * 3 + 2] = u.c.z + Math.cos(t * 0.8) * u.r;
        const b = Math.pow(0.5 + 0.5 * Math.sin(clock * 1.9 + u.ph * 3), 3);
        flyCol[i * 3] = 1.0 * b; flyCol[i * 3 + 1] = 0.92 * b; flyCol[i * 3 + 2] = 0.42 * b;
      }
      flyGeo.attributes.position.needsUpdate = flyGeo.attributes.color.needsUpdate = true;
    }
  }

  function step(dt) {
    clock += dt;
    U.time.value = clock; U.shiver.value = shiver;
    behave(dt);
    applyRoot();
    P.root.updateMatrixWorld(true);
    poseBody(dt);
    poseTrain();
    poseLegs(dt);
    scenery(dt);
  }

  // carry it over from the previous page, so it keeps displaying instead of starting again
  const KEY = 'sp-peacock-state';
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify({ x: +pos.x.toFixed(2), z: +pos.z.toFixed(2), yaw: +yaw.toFixed(3) })); } catch (e) {} }
  let restored = false;
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (s && Math.abs(s.x) < xLim(s.z) + 2) { pos.set(s.x, 0, s.z); yaw = s.yaw; restored = true; }
  } catch (e) {}
  if (!restored) { pos.set((rnd() < 0.5 ? -1 : 1) * xLim(-8) * 0.55, 0, -8); yaw = facing(); spread = 0; go('open', 3.8); }
  else go('pose', 4 + rnd() * 4);
  applyRoot(); P.root.updateMatrixWorld(true);
  for (const L of legs) homeOf(L, L.F);
  step(0.016);
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
    night = th !== 'light';
    renderer.toneMappingExposure = night ? 1.05 : 0.88;
    hemi.color.set(night ? 0x9fb0d6 : 0xdfeaff); hemi.groundColor.set(night ? 0x1a1820 : 0x6b5a3a); hemi.intensity = night ? 1.1 : 1.3;
    sun.color.set(night ? 0xcfdcff : 0xfff0d2); sun.intensity = night ? 2.4 : 2.7;
    rim.color.set(night ? 0x9fbcff : 0xffd7a0); rim.intensity = night ? 2.8 : 1.6;
    fill.intensity = night ? 0.6 : 0.8;
    U.glow.value = night ? 0.22 : 0.04;
  }
  setTheme(opts.theme);
  play();

  return {
    setTheme,
    debug: {
      camera, scene, renderer, step, P, get mode() { return mode; },
      go, place(x, z, a) { pos.set(x, 0, z); yaw = a; applyRoot(); P.root.updateMatrixWorld(true); for (const L of legs) homeOf(L, L.F); },
      pointer(x, y) { ptr.x = x; ptr.y = y; ptr.has = true; lastMove = clock; }, pause, play,
      set spread(v) { spread = v; },
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

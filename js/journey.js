/* =============================================================================
   journey.js — "Journey": a cartoon of a broken man, drawn over four of my own videos.

   Loaded on demand by site.js (section 16) when the visitor picks it. Like Sunrise it is a
   2D canvas. The backdrops are clips I filmed (static/media/journey: cropped to 16:9,
   20 frames a second, played forwards then backwards so the loop never jumps); the story
   is drawn live on top, in four chapters of 16 s each:

     1. dusk  — he walks through a crowd that points and laughs at him; one of them
                shoulders him aside, and a rain cloud gathers over his head;
     2. moon  — he brings a rose to the girl he loves; she turns and walks away without
                looking back, and his heart cracks in two;
     3. fog   — alone on a bridge in the rain he sits hugging his knees, until a stray
                puppy comes and sits beside him;
     4. dawn  — he gets up, his heart stitched back together; the cloud breaks up into
                birds, and he walks on into the sunrise with the puppy.

   Then it begins again. The story carries on from where it was when you change page.
   The cast is drawn in code: me (curly hair, beard, grey T-shirt, jeans), the girl,
   the crowd (shadows with eyes), the puppy, the heart, the rose and the cloud.

   export start(canvas, { theme, onReady, onSlow }) → { stop(), setTheme(theme) }
   ========================================================================== */

const MEDIA = name => new URL(`../media/journey/${name}`, import.meta.url).href;
const SCENES = ['dusk', 'moon', 'fog', 'dawn'];
const CH = 16, CYCLE = CH * SCENES.length, FADE = 1.4;      // chapter length, whole story, backdrop cross-fade
const KEY = 'sp-journey';
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = u => u * u * (3 - 2 * u);
const seg = (t, a, b) => smooth(clamp((t - a) / (b - a), 0, 1));     // 0 before a, 1 after b, eased between
const win = (t, a, b, f = 0.6) => seg(t, a, a + f) * (1 - seg(t, b - f, b));   // on between a and b
const rand = (seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; })(20261008);

const LINES = {
  en: ['The whole world turned its back on him.', 'He loved her. She never looked back.',
       'Alone, with a broken heart.', 'Only a stray stayed.', 'Still, he walks on.'],
  or: ['ସାରା ଦୁନିଆ ତାଠାରୁ ମୁହଁ ଫେରାଇଲା।', 'ସେ ତାକୁ ଭଲ ପାଉଥିଲା। ସେ ଥରେ ବି ଫେରି ଚାହିଁଲା ନାହିଁ।',
       'ଏକା, ଭଙ୍ଗା ହୃଦୟ ନେଇ।', 'କେବଳ ଏକ ବୁଲା କୁକୁର ପାଖରେ ରହିଲା।', 'ତଥାପି, ସେ ଆଗକୁ ଚାଲିଲା।'],
};
// [chapter, from, to, line]
const CAPTIONS = [[0, 1.2, 8, 0], [1, 1.5, 9, 1], [2, 2, 8.5, 2], [2, 9.5, 15, 3], [3, 4.8, 12, 4]];

/* ---------------------------------------------------------------- poses
   Angles in radians from straight down, positive = forwards. L is the far side, R the near
   side; t = thigh, k = knee bend, a = shoulder, e = elbow bend; head > 0 looks down. */

const POSE = {
  stand: { lean: 0.03, tL: 0.04, kL: 0.06, tR: -0.03, kR: 0.04, aL: 0.06, eL: 0.2, aR: -0.04, eR: 0.18, head: 0 },
  slump: { lean: 0.17, tL: 0.05, kL: 0.1, tR: -0.03, kR: 0.08, aL: 0.12, eL: 0.08, aR: 0.08, eR: 0.06, head: 0.62 },
  offer: { lean: 0.1, tL: -0.14, kL: 0.08, tR: 0.24, kR: 0.14, aL: 0.02, eL: 0.22, aR: 1.25, eR: 0.12, head: -0.08 },
  sit:   { lean: 0.32, tL: 2.6, kL: 2.8, tR: 2.7, kR: 2.85, aL: 1.45, eL: 1.0, aR: 1.55, eR: 0.95, head: 1.05 },   // head on his arms, on his knees
  pet:   { lean: 0.3, tL: 2.6, kL: 2.8, tR: 2.7, kR: 2.85, aL: 1.45, eL: 1.0, aR: 1.45, eR: 0.15, head: 0.35 },
};
const STRIDE = 2 * 45 * Math.sin(0.42);         // ground covered by one step, so the feet don't slide

function mix(a, b, u) { const o = {}; for (const k in a) o[k] = a[k] + (b[k] - a[k]) * u; return o; }
function walking(p, ph, amt) {
  if (amt <= 0) return p;
  const s = Math.sin(ph), c = Math.cos(ph), o = { ...p };
  o.tR += 0.42 * s * amt; o.tL -= 0.42 * s * amt;
  o.kR += 0.62 * Math.max(0, c) * amt; o.kL += 0.62 * Math.max(0, -c) * amt;
  o.aR -= 0.34 * s * amt; o.aL += 0.34 * s * amt; o.eR += 0.14 * amt; o.eL += 0.14 * amt;
  return o;
}

// joints of a pose, in body units (about 100 tall), feet (or seat) on the ground at y = 0
function rig(p) {
  const d = (a, l) => [Math.sin(a) * l, Math.cos(a) * l];
  const add = (q, r) => [q[0] + r[0], q[1] + r[1]];
  const kL = d(p.tL, 23), fL = add(kL, d(p.tL - p.kL, 22));
  const kR = d(p.tR, 23), fR = add(kR, d(p.tR - p.kR, 22));
  const lift = Math.max(fL[1], fR[1], 4);           // whichever reaches lowest rests on the ground
  const up = (q, a, l) => [q[0] + Math.sin(a) * l, q[1] - Math.cos(a) * l];
  const hip = [0, -lift], o = q => [q[0], q[1] - lift];
  const sh = up(hip, p.lean, 30), nk = up(sh, p.lean, 4), ha = p.lean * 0.6 + p.head, hc = up(nk, ha, 10);
  const as = up(sh, p.lean, -2.5);
  const eL = add(as, d(p.aL, 16)), hL = add(eL, d(p.aL + p.eL, 15));
  const eR = add(as, d(p.aR, 16)), hR = add(eR, d(p.aR + p.eR, 15));
  return { hip, kL: o(kL), fL: o(fL), kR: o(kR), fR: o(fR), sh, nk, hc, ha, as, eL, hL, eR, hR, lean: p.lean,
    chest: [lerp(as[0], hip[0], 0.28) + 8, lerp(as[1], hip[1], 0.28)] };
}

/* ---------------------------------------------------------------- the cast */

const OL = 1.25;                                   // outline width, body units

function stroke(c, pts, w, col, line) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  if (line) { c.strokeStyle = line; c.lineWidth = w + OL * 2; c.stroke(); }
  c.strokeStyle = col; c.lineWidth = w; c.stroke();
}
function blob(c, x, y, rx, ry, rot, col, line) {
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU);
  if (line) { c.strokeStyle = line; c.lineWidth = OL * 2; c.stroke(); }
  c.fillStyle = col; c.fill();
}
const mid = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];

const HIM = { kind: 'him', skin: '#8e5b3b', skin2: '#734729', line: '#2a1910', top: '#8f959e', top2: '#737882',
  legs: '#3e5280', legs2: '#2f3e62', shoe: '#2b2725', hair: '#17110e', hair2: '#2c211b' };
const HER = { kind: 'her', skin: '#a9714d', skin2: '#8c5a3a', line: '#2e1b13', top: '#b8435f', top2: '#923349',
  legs: '#ecdcc8', legs2: '#cdb9a2', shoe: '#7a3d2c', hair: '#130d0b', hair2: '#2a1d18' };

// a person: f = { x, gy, k, face (-1..1, sign = facing), pose, st, mood, t }
function person(c, f) {
  const r = rig(f.pose), st = f.st, shade = st.kind === 'shade';
  const L = shade ? null : st.line, far = shade ? st.fill : null;
  c.save(); c.translate(f.x, f.gy); c.scale(f.k * f.face, f.k * (f.sy || 1));
  c.lineCap = 'round'; c.lineJoin = 'round';
  const arm = (s, e, h, near) => {
    if (shade) { stroke(c, [s, e, h], 6, st.fill); return; }
    stroke(c, [s, e, h], 5.2, near ? st.skin : st.skin2, L);
    blob(c, h[0], h[1], 2.9, 2.9, 0, near ? st.skin : st.skin2, L);
    stroke(c, [s, mid(s, e, st.kind === 'her' ? 0.45 : 0.62)], 7, near ? st.top : st.top2, L);
  };
  const leg = (k, ft, near) => {
    const hp = [r.hip[0], r.hip[1]];
    if (shade) { stroke(c, [hp, k, ft], 9, st.fill); blob(c, ft[0] + 2.5, ft[1] - 1.2, 4.6, 2.3, 0, st.fill); return; }
    stroke(c, [hp, k, ft], st.kind === 'her' ? 7.5 : 9.4, near ? st.legs : st.legs2, L);
    blob(c, ft[0] + 2.6, ft[1] - 1.3, 4.8, 2.4, 0, st.shoe, L);
  };
  const torsoA = mid(r.hip, r.sh, 0.12), torsoB = mid(r.hip, r.sh, 0.9);

  arm(r.as, r.eL, r.hL, false);
  leg(r.kL, r.fL, false);
  if (st.kind === 'her') {                         // a kurti that flares to the knees
    const hem = mid(r.kL, r.kR, 0.5), hw = 12 + Math.abs(r.kL[0] - r.kR[0]) * 0.35;
    c.beginPath(); c.moveTo(r.hip[0] - 7, r.hip[1] - 4); c.lineTo(r.hip[0] + 7, r.hip[1] - 4);
    c.quadraticCurveTo(hem[0] + hw * 0.8, hem[1] - 6, hem[0] + hw, hem[1] + 4);
    c.quadraticCurveTo(hem[0], hem[1] + 7, hem[0] - hw, hem[1] + 4);
    c.quadraticCurveTo(hem[0] - hw * 0.8, hem[1] - 6, r.hip[0] - 7, r.hip[1] - 4); c.closePath();
    c.strokeStyle = L; c.lineWidth = OL * 2; c.stroke(); c.fillStyle = st.top; c.fill();
    stroke(c, [torsoA, torsoB], 15, st.top, L);
  } else {
    stroke(c, [torsoA, torsoB], shade ? 20 : 22, shade ? st.fill : st.top, L);
  }
  leg(r.kR, r.fR, true);
  stroke(c, [r.sh, r.nk], 6, shade ? st.fill : st.skin2, L);
  if (st.kind === 'her') hairBack(c, r, st);
  c.save(); c.translate(r.hc[0], r.hc[1]); c.rotate(r.ha * 0.85);
  if (shade) shadeHead(c, st, f.mood); else if (st.kind === 'her') herHead(c, st, f.mood, f.t); else hisHead(c, st, f.mood, f.t);
  c.restore();
  arm(r.as, r.eR, r.hR, true);
  c.restore();
  // a few points in screen space, for props
  const S = q => [f.x + q[0] * f.k * f.face, f.gy + q[1] * f.k * (f.sy || 1)];
  return { hand: S(r.hR), chest: S(r.chest), head: S(r.hc), top: S([r.hc[0], r.hc[1] - 14]) };
}

function hisHead(c, st, m, t) {
  const L = st.line;
  blob(c, 0, 0, 11, 11, 0, st.skin, L);
  // curly hair: rings of curls over the back and top
  for (let i = 0; i <= 15; i++) {
    const a = lerp(2.55, 5.6, i / 15), rr = 10.6 + (i % 3) * 0.9, cr = 4 + (i % 2) * 1.1;
    blob(c, Math.cos(a) * rr, Math.sin(a) * rr, cr, cr, 0, i % 2 ? st.hair : st.hair2, L);
  }
  for (let i = 0; i <= 6; i++) {
    const a = lerp(3.4, 5.1, i / 6);
    blob(c, Math.cos(a) * 13.5, Math.sin(a) * 13.5, 4.2, 4.2, 0, i % 2 ? st.hair2 : st.hair, null);
  }
  blob(c, -1.6, 1.6, 2.5, 3, 0, st.skin2, L);                  // ear
  // beard and moustache
  c.beginPath(); c.moveTo(-3.6, -1.5); c.lineTo(-1.8, 5); c.quadraticCurveTo(0.5, 12.6, 6.2, 12.2);
  c.quadraticCurveTo(11.2, 9.4, 11.3, 3.6); c.lineTo(9.6, 4.2); c.quadraticCurveTo(5, 7.4, 1.6, 4.6); c.lineTo(0.4, -1.2); c.closePath();
  c.fillStyle = st.hair; c.fill();
  blob(c, 8.5, 3.4, 3.1, 1.35, -0.08, st.hair, null);
  // nose
  c.beginPath(); c.moveTo(9.6, -2); c.quadraticCurveTo(13.1, 1.4, 10.1, 2.1); c.fillStyle = st.skin; c.fill();
  c.strokeStyle = L; c.lineWidth = 0.9; c.stroke();
  face(c, st, m, t, [3.2, 8.4], -2.6);
  // mouth, a lighter line in the beard
  const sm = m.smile || 0;
  c.beginPath(); c.moveTo(6.7, 6.1); c.quadraticCurveTo(8.3, 6.1 + sm * 1.9, 9.9, 5.8);
  c.strokeStyle = '#c48a73'; c.lineWidth = 0.95; c.stroke();
}

function herHead(c, st, m, t) {
  const L = st.line;
  blob(c, 0, 0, 10.3, 10.6, 0, st.skin, L);
  c.beginPath(); c.arc(0, -0.6, 11.2, Math.PI * 1.02, Math.PI * 1.86);   // hair over the crown, parted
  c.quadraticCurveTo(4, -6, -2, -4); c.quadraticCurveTo(-7, -2, -9.8, 3); c.closePath();
  c.fillStyle = st.hair; c.fill(); c.strokeStyle = L; c.lineWidth = OL; c.stroke();
  blob(c, -1.6, 1.8, 1.6, 2.2, 0, st.skin2, L);
  blob(c, -1.5, 4.6, 0.8, 0.8, 0, '#e8c25a', null);            // earring
  blob(c, 6.2, -6.1, 0.7, 0.7, 0, '#c7283a', null);            // bindi
  c.beginPath(); c.moveTo(9.3, -2); c.quadraticCurveTo(12.1, 1.3, 9.6, 2); c.fillStyle = st.skin; c.fill();
  c.strokeStyle = L; c.lineWidth = 0.8; c.stroke();
  face(c, st, m, t, [3.1, 8], -2.2, true);
  const sm = m.smile || 0;
  c.beginPath(); c.moveTo(6.4, 5.4); c.quadraticCurveTo(7.9, 5.4 + sm * 1.6, 9.3, 5.1);
  c.strokeStyle = '#a3364a'; c.lineWidth = 1.1; c.stroke();
}

function hairBack(c, r, st) {                       // her long plait of hair down her back
  c.save(); c.translate(r.hc[0], r.hc[1]); c.rotate(r.ha * 0.85);
  c.beginPath(); c.moveTo(-2, -10.6); c.quadraticCurveTo(-13, -6, -11.5, 8);
  c.quadraticCurveTo(-11, 22, -7.5, 33); c.quadraticCurveTo(-4, 34, -3.6, 30);
  c.quadraticCurveTo(-5.5, 18, -2, 6); c.closePath();
  c.fillStyle = st.hair; c.fill(); c.strokeStyle = st.line; c.lineWidth = OL * 2; c.stroke(); c.fill();
  c.restore();
}

// eyes, brows, lids and tears; xs = [far eye, near eye]
function face(c, st, m, t, xs, y, lashes) {
  const sad = m.sad || 0, lid = clamp((m.lid ?? 0.15) + sad * 0.25, 0, 1), shut = m.shut || 0, gx = m.gx || 0, gy = m.gy || 0;
  const blink = (Math.sin(t * 0.9 + xs[0]) > 0.995) ? 1 : 0;
  xs.forEach((x, i) => {
    const sc = (i ? 1 : 0.85) * (lashes ? 0.85 : 0.92), rx = 1.9 * sc, ry = 2.3 * sc;
    if (shut > 0.5 || blink) {
      c.beginPath(); c.arc(x, y + 0.4, rx, 0.15 * Math.PI, 0.85 * Math.PI); c.strokeStyle = st.line; c.lineWidth = 0.9; c.stroke();
    } else {
      c.save(); c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = '#fbf6ee'; c.fill(); c.clip();
      blob(c, x + gx * 0.7 + 0.35, y + gy * 0.8 + 0.3, 1.25, 1.35, 0, '#1b120d', null);
      blob(c, x + gx * 0.7 + 0.75, y + gy * 0.8 - 0.25, 0.38, 0.38, 0, '#ffffff', null);
      c.fillStyle = st.skin; c.fillRect(x - 3, y - ry - 1, 6, (ry * 2 + 1) * lid);
      c.restore();
      c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.strokeStyle = st.line; c.lineWidth = 0.75; c.stroke();
      if (lashes) { c.beginPath(); c.moveTo(x + rx * 0.6, y - ry * 0.7); c.lineTo(x + rx * 1.3, y - ry * 1.05); c.stroke(); }
    }
    // brows: the inner ends rise when he is sad
    const inner = i ? -1 : 1, iy = y - 3.9 - sad * 1.4, oy = y - 3.5 + sad * 0.5;
    c.beginPath(); c.moveTo(x - inner * 2.1, oy); c.lineTo(x + inner * 1.9, iy);
    c.strokeStyle = st.hair; c.lineWidth = lashes ? 0.8 : 1.25; c.stroke();
  });
  if (m.tear > 0) {                                  // a tear running down the near cheek, again and again
    const u = (t * 0.55) % 1, x = xs[1] + 0.4, ty = y + 2.2 + u * 7.5;
    c.save(); c.globalAlpha *= m.tear * (1 - u * 0.6);
    c.beginPath(); c.moveTo(x, ty - 1.8); c.quadraticCurveTo(x + 1.15, ty, x, ty + 0.9); c.quadraticCurveTo(x - 1.15, ty, x, ty - 1.8);
    c.fillStyle = '#9fd2f5'; c.fill(); c.restore();
  }
}

function shadeHead(c, st, m) {                     // the crowd: shadows, only their eyes show
  blob(c, 0, 0, 10.5, 11, 0, st.fill, null);
  blob(c, -4, -6, 8, 6, 0.2, st.fill, null);
  const gx = m.gx || 0;
  for (const x of [3.6, 8.2]) {
    blob(c, x, -2, 1.8, 1.05, 0.1, st.eye, null);
    blob(c, x + gx * 0.9, -2, 0.75, 0.75, 0, st.fill, null);
  }
  if (m.laugh) {                                   // a grin
    c.beginPath(); c.moveTo(4.4, 4); c.quadraticCurveTo(7.2, 7.4 * m.laugh + 4, 9.8, 3.4);
    c.strokeStyle = st.eye; c.lineWidth = 0.9; c.stroke();
  }
}

// the stray: s = { ph, trot, sit, wag, look, happy }
function puppy(c, x, gy, k, face, s, t) {
  const L = '#4a2a14', fur = '#c98b4b', fur2 = '#a86d36', light = '#e7b97f', ear = '#6c3f1f';
  const sit = s.sit, bob = Math.abs(Math.sin(s.ph)) * 1.1 * s.trot;
  c.save(); c.translate(x, gy - bob * k); c.scale(k * face, k); c.lineCap = 'round'; c.lineJoin = 'round';
  const hip = [-8, -12 + 6.5 * sit], sh = [7, -13.5 - 2.5 * sit];
  const sw = Math.sin(s.ph) * 3.6 * s.trot;
  // tail
  const ta = -0.9 + Math.sin(t * (s.wag || 4)) * 0.55;
  c.beginPath(); c.moveTo(hip[0] - 1, hip[1] - 1.5);
  c.quadraticCurveTo(hip[0] - 6, hip[1] - 2 + Math.sin(ta) * 3, hip[0] - 6 + Math.cos(ta) * 3, hip[1] - 8 + Math.sin(ta) * 4);
  c.strokeStyle = L; c.lineWidth = 3.6 + OL * 2; c.stroke(); c.strokeStyle = fur; c.lineWidth = 3.6; c.stroke();
  // far legs
  const hind = (dx, col) => stroke(c, [hip, [lerp(hip[0] + 1 + dx, hip[0] + 6, sit), lerp(-5, -3.5, sit)], [lerp(hip[0] - 0.5 + dx, hip[0] + 5, sit), 0]], 3.4, col, L);
  const fore = (dx, col) => stroke(c, [[sh[0], sh[1] + 2], [sh[0] + dx * 0.5, -6], [sh[0] + dx, 0]], 3.2, col, L);
  hind(-sw, fur2); fore(sw, fur2);
  stroke(c, [hip, sh], 12, fur, L);                                    // body
  blob(c, sh[0] - 1, sh[1] + 2.5, 4.2, 4, 0, light, null);             // chest
  hind(sw, fur); fore(-sw, fur);
  // head
  const look = s.look || 0, hx = sh[0] + 5.5 + look * 1.5, hy = sh[1] - 7 - 1.5 * sit + look * 2.5;
  c.save(); c.translate(hx, hy); c.rotate(look * 0.35);
  blob(c, 0, 0, 5.6, 5.3, 0, fur, L);
  blob(c, 5, 1.6, 4.1, 2.9, 0.1, light, L);
  blob(c, 8.7, 0.6, 1.25, 1.05, 0, '#211510', null);
  blob(c, 2.4, -1.6, 0.95, 1.05, 0, '#1a100b', null);
  blob(c, 2.7, -2, 0.3, 0.3, 0, '#fff', null);
  if (s.happy) blob(c, 6.2, 4.6, 1.3, 1.7 * s.happy, 0, '#e2707f', null);   // tongue
  c.beginPath(); c.ellipse(-1.8, -1.2, 2.4, 4.8, 0.45 + Math.sin(t * 3) * 0.06 * s.trot, 0, TAU);
  c.fillStyle = ear; c.fill(); c.strokeStyle = L; c.lineWidth = OL; c.stroke();
  c.restore();
  c.restore();
}

function heartPath(c, r) {
  c.beginPath(); c.moveTo(0, -r * 0.35);
  c.bezierCurveTo(-r * 0.15, -r * 0.95, -r * 1.1, -r * 0.75, -r, -r * 0.1);
  c.bezierCurveTo(-r * 0.95, r * 0.35, -r * 0.4, r * 0.7, 0, r);
  c.bezierCurveTo(r * 0.4, r * 0.7, r * 0.95, r * 0.35, r, -r * 0.1);
  c.bezierCurveTo(r * 1.1, -r * 0.75, r * 0.15, -r * 0.95, 0, -r * 0.35); c.closePath();
}
const CRACK = [[0, -0.35], [-0.2, -0.05], [0.15, 0.22], [-0.13, 0.5], [0.09, 0.76], [0, 1]];

// his heart: s = { beat, crack, split, stitch, dim }
function heart(c, x, y, r, s) {
  c.save(); c.translate(x, y);
  const glow = s.stitch > 0 ? 'rgba(255,196,120,' : 'rgba(255,90,110,';
  const ga = s.stitch > 0 ? 0.5 * s.stitch : 0.28 * (1 - s.dim);
  if (ga > 0.01) {
    const g = c.createRadialGradient(0, r * 0.2, 0, 0, r * 0.2, r * 2.6);
    g.addColorStop(0, glow + ga + ')'); g.addColorStop(1, glow + '0)');
    c.fillStyle = g; c.fillRect(-r * 3, -r * 3, r * 6, r * 6);
  }
  const b = 1 + s.beat; c.scale(b, b);
  const fill = s.dim > 0 ? `rgb(${lerp(226, 160, s.dim) | 0},${lerp(64, 70, s.dim) | 0},${lerp(80, 84, s.dim) | 0})` : '#e2404f';
  const half = side => {
    c.save();
    const sp = s.split * side;
    c.translate(sp * r * 0.32, Math.abs(sp) * r * 0.12); c.rotate(sp * 0.22);
    c.beginPath(); c.moveTo(side * 2 * r, -2 * r);
    for (const [px, py] of CRACK) c.lineTo(px * r, py * r);
    c.lineTo(0, 2 * r); c.lineTo(side * 2 * r, 2 * r); c.closePath(); c.clip();
    heartPath(c, r); c.fillStyle = fill; c.fill(); c.strokeStyle = '#6e1720'; c.lineWidth = r * 0.14; c.stroke();
    blob(c, -r * 0.45, -r * 0.35, r * 0.22, r * 0.14, -0.6, 'rgba(255,255,255,.55)', null);
    c.restore();
  };
  if (s.split > 0.001 || s.crack >= 1) { half(-1); half(1); } else {
    heartPath(c, r); c.fillStyle = fill; c.fill(); c.strokeStyle = '#6e1720'; c.lineWidth = r * 0.14; c.stroke();
    blob(c, -r * 0.45, -r * 0.35, r * 0.22, r * 0.14, -0.6, 'rgba(255,255,255,.55)', null);
  }
  if (s.crack > 0 && s.split < 0.05) {           // the crack runs down from the top
    const n = (CRACK.length - 1) * s.crack;
    c.beginPath(); c.moveTo(CRACK[0][0] * r, CRACK[0][1] * r);
    for (let i = 1; i <= Math.ceil(n); i++) {
      const u = Math.min(1, n - (i - 1)), p = CRACK[i - 1], q = CRACK[i];
      c.lineTo(lerp(p[0], q[0], u) * r, lerp(p[1], q[1], u) * r);
    }
    c.strokeStyle = '#3a0a10'; c.lineWidth = r * 0.12; c.lineCap = 'round'; c.stroke();
  }
  if (s.stitch > 0) {                             // stitched back together
    c.globalAlpha *= s.stitch; c.strokeStyle = '#f6e6c8'; c.lineWidth = r * 0.09; c.lineCap = 'round';
    for (let i = 0; i < CRACK.length - 1; i++) {
      const [px, py] = mid(CRACK[i], CRACK[i + 1], 0.5), w = 0.16;
      c.beginPath(); c.moveTo((px - w) * r, (py - w) * r); c.lineTo((px + w) * r, (py + w) * r);
      c.moveTo((px + w) * r, (py - w) * r); c.lineTo((px - w) * r, (py + w) * r); c.stroke();
    }
  }
  c.restore();
}

function rose(c, x, y, ang, k, petals) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(k, k); c.lineCap = 'round';
  stroke(c, [[0, 0], [0.6, -9], [0, -18]], 1.3, '#3f7a3a', '#1f3d1d');
  blob(c, 1.8, -8.5, 2.6, 1.1, -0.6, '#4f9147', '#1f3d1d');
  if (petals > 0) {
    const s = 0.55 + 0.45 * petals;
    blob(c, 0, -20.5, 3.3 * s, 3 * s, 0, '#a3152b', '#4a0812');
    blob(c, -1.4 * s, -21.2, 2.1 * s, 2 * s, 0, '#c8243b', null);
    blob(c, 1.3 * s, -20, 1.9 * s, 1.8 * s, 0, '#d63a50', null);
    blob(c, 0.2, -22.4 * (0.95 + 0.05 * s), 1.6 * s, 1.1 * s, 0, '#e65468', null);
  }
  c.restore();
}

function cloud(c, x, y, k, a, col) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(k, k); c.fillStyle = col;
  for (const [cx, cy, r] of [[-8, 1, 5.2], [-2, -3.4, 6.6], [5.5, -1.6, 5.8], [10, 1.6, 4.2], [1, 2.4, 5.8], [-11.5, 3, 3.4]]) {
    c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
  }
  c.restore();
}

function bubble(c, x, y, text, a, k, font, dark) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha *= a;
  const fs = Math.max(12, 6.4 * k); c.font = `600 ${fs}px ${font}`;
  const w = c.measureText(text).width + fs * 1.2, h = fs * 1.75, bx = x - w / 2, by = y - h - fs * 0.5;
  c.beginPath(); c.roundRect(bx, by, w, h, h / 2);
  c.moveTo(x - fs * 0.35, by + h - 1); c.lineTo(x + fs * 0.1, by + h + fs * 0.6); c.lineTo(x + fs * 0.45, by + h - 1);
  c.fillStyle = dark ? 'rgba(236,232,224,.94)' : 'rgba(255,255,255,.95)'; c.fill();
  c.strokeStyle = 'rgba(30,28,36,.55)'; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = '#24212b'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, by + h / 2 + 1);
  c.restore();
}

/* ---------------------------------------------------------------- the crowd, chapter 1
   at = when they enter on the right, v = speed (screen widths a second), z = depth, h = height,
   say/when = what they shout and when, stop = where they stand and point. */

const CROWD = [
  { at: 0.0, v: 0.085, z: 0.8, h: 0.96, say: 'Ha ha!', when: 3.6 },
  { at: 0.7, v: 0.08, z: 1.0, h: 1.03, say: 'Loser!', when: 5.3, stop: [4.6, 8.0], point: true },
  { at: 1.9, v: 0.09, z: 0.8, h: 0.92, say: 'Go away!', when: 6.6 },
  { at: 2.6, v: 0.072, z: 1.1, h: 1.0, laugh: true },
  { at: 3.62, v: 0.13, z: 1.12, h: 1.06, bump: true },
  { at: 4.6, v: 0.1, z: 0.8, h: 1.02, say: 'Useless', when: 9.6 },
  { at: 7.3, v: 0.08, z: 0.8, h: 0.95, say: 'Ha ha ha', when: 11.4, laugh: true },
  { at: 8.6, v: 0.085, z: 1.0, h: 0.99, say: 'Weirdo', when: 13.2 },
];
const BUMP = 9.2, ENTER = -0.08, STOPX = 0.4, SPOT = 0.52;

/* ---------------------------------------------------------------- main */

export function start(canvas, opts = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let theme = opts.theme || 'light', running = false, raf = 0, last = 0, T = 0, slowFrames = 0, ready = false;
  let W = 0, H = 0, dpr = 1, gy = 0, k = 1, caption = 18;
  const lang = document.documentElement.lang === 'or' ? 'or' : 'en';
  const FONT = '"Inter", -apple-system, "Segoe UI", Roboto, sans-serif';
  const SERIF = lang === 'or' ? '"Noto Serif Oriya", "Noto Sans Oriya", serif' : '"Instrument Serif", Georgia, serif';
  const vids = [], posters = [], drops = [], blades = [];

  try {
    const st = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (st && Date.now() - st.at < 30 * 60 * 1000) T = (st.T + (Date.now() - st.at) / 1000) % CYCLE;
  } catch (e) { /* fine */ }
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ T, at: Date.now() })); } catch (e) { /* fine */ } };

  /* ------------------------------------------------------------ media */

  SCENES.forEach((name, i) => {
    const im = new Image(); im.decoding = 'async'; im.src = MEDIA(`${name}.webp`); posters[i] = im;
    const v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = i === chapterOf(T) ? 'auto' : 'metadata';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
    v.src = MEDIA(`${name}.webm`);
    document.body.appendChild(v); vids[i] = v;
  });
  function chapterOf(t) { return Math.floor(t / CH) % SCENES.length; }
  function syncVideos() {
    const c = chapterOf(T), lt = T - c * CH, n = (c + 1) % SCENES.length;
    vids.forEach((v, i) => {
      const want = running && (i === c || (i === n && lt > CH - 3));
      if (want && v.paused) { v.preload = 'auto'; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else if (!want && !v.paused) v.pause();
    });
  }

  /* ------------------------------------------------------------ layout */

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.round(innerWidth * dpr); H = Math.round(innerHeight * dpr);
    canvas.width = W; canvas.height = H;
    gy = Math.round(H * 0.9);
    k = Math.min(H * 0.26, W * 0.42) / 100;
    caption = clamp(H * 0.03, 15 * dpr, 28 * dpr);
    drops.length = 0; blades.length = 0;
    const n = Math.round(clamp(W * H / 9000, 60, 240));
    for (let i = 0; i < n; i++) drops.push({ x: rand(), y: rand(), l: 0.02 + rand() * 0.03, v: 0.9 + rand() * 0.6 });
    const m = Math.round(clamp(W / 9, 60, 220));
    for (let i = 0; i < m; i++) {
      const tone = rand();
      blades.push({ x: rand() * W, y: gy + (H - gy) * (rand() * 1.1 - 0.05), len: H * (0.018 + rand() * 0.035), ph: rand() * TAU,
        lean: (rand() - 0.5) * 0.6, col: tone < 0.4 ? '#4c7a34' : tone < 0.8 ? '#5f8f3c' : '#7aa64a' });
    }
  }
  const X = f => f * W;

  /* ------------------------------------------------------------ drawing */

  function backdrop(i, a) {
    if (a <= 0.001) return;
    const v = vids[i], useV = v && v.readyState >= 2 && !v.error && v.videoWidth;
    const src = useV ? v : posters[i];
    const sw = useV ? v.videoWidth : src.naturalWidth, sh = useV ? v.videoHeight : src.naturalHeight;
    if (!sw) { if (a >= 1) { ctx.fillStyle = theme === 'dark' ? '#14161d' : '#ece6dc'; ctx.fillRect(0, 0, W, H); } return; }
    const s = Math.max(W / sw, H / sh), w = sw * s, h = sh * s;
    ctx.globalAlpha = a; ctx.drawImage(src, (W - w) / 2, (H - h) * 0.6, w, h); ctx.globalAlpha = 1;
  }

  function ground(i, a) {
    if (a <= 0.001) return;
    const dark = theme === 'dark';
    ctx.save(); ctx.globalAlpha = a;
    if (SCENES[i] === 'dusk') {                    // a pavement
      const g = ctx.createLinearGradient(0, gy - 6 * k, 0, H);
      g.addColorStop(0, dark ? '#2b2e36' : '#4a4d55'); g.addColorStop(1, dark ? '#17181d' : '#2c2e34');
      ctx.fillStyle = g; ctx.fillRect(0, gy - 4 * k, W, H);
      ctx.fillStyle = dark ? 'rgba(150,150,160,.35)' : 'rgba(190,190,198,.6)'; ctx.fillRect(0, gy - 4 * k, W, Math.max(2, 1.2 * k));
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
      for (let x = 0; x < W + 8 * k; x += 22 * k) { ctx.beginPath(); ctx.moveTo(x, gy - 3 * k); ctx.lineTo(x - 8 * k, H); ctx.stroke(); }
    } else if (SCENES[i] === 'moon') {             // a dark hill under the moon
      ctx.beginPath(); ctx.moveTo(0, gy + 2 * k);
      ctx.bezierCurveTo(W * 0.3, gy - 9 * k, W * 0.65, gy - 7 * k, W, gy + 4 * k); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = dark ? '#151629' : '#2a2b48'; ctx.fill();
      ctx.strokeStyle = 'rgba(170,170,230,.25)'; ctx.lineWidth = Math.max(1.5, 0.6 * k); ctx.stroke();
    }
    ctx.restore();
  }

  function veil() {
    ctx.fillStyle = theme === 'dark' ? 'rgba(8,10,16,.36)' : 'rgba(247,243,236,.34)';
    ctx.fillRect(0, 0, W, H);
  }

  // a soft shadow at someone's feet
  function shadow(x, w, a = 0.28) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x, gy + 0.5 * k, w * k, 2.4 * k, 0, 0, TAU); ctx.fill(); ctx.restore();
  }

  function rain(a, t) {
    if (a <= 0.01) return;
    ctx.save(); ctx.strokeStyle = theme === 'dark' ? 'rgba(190,205,230,.45)' : 'rgba(70,86,116,.5)';
    ctx.lineWidth = Math.max(1.2, 0.4 * k); ctx.globalAlpha = a; ctx.beginPath();
    for (const d of drops) {
      const y = ((d.y + t * d.v * 0.9) % 1) * H * 1.1 - H * 0.05, x = d.x * W - y * 0.12;
      ctx.moveTo(x, y); ctx.lineTo(x - d.l * H * 0.12, y + d.l * H);
    }
    ctx.stroke(); ctx.restore();
  }

  // a little rain cloud over his head, raining on him
  function headCloud(top, a, drizzle, t) {
    if (a <= 0.01) return;
    const x = top[0], y = top[1] - 10 * k;
    cloud(ctx, x, y, k * 1.05, a, theme === 'dark' ? '#5c6270' : '#767d8b');
    if (drizzle > 0.01) {
      ctx.save(); ctx.strokeStyle = theme === 'dark' ? 'rgba(160,190,230,.7)' : 'rgba(90,120,170,.75)';
      ctx.lineWidth = Math.max(1, 0.45 * k); ctx.globalAlpha = a * drizzle; ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const u = (t * 1.6 + i * 0.37) % 1, dx = (i / 6 - 0.5) * 18 * k, yy = y + 5 * k + u * 14 * k;
        ctx.moveTo(x + dx, yy); ctx.lineTo(x + dx - 0.6 * k, yy + 3 * k);
      }
      ctx.stroke(); ctx.restore();
    }
  }

  function loveHearts(from, t0, lt) {             // little hearts floating up from him
    for (let i = 0; i < 8; i++) {
      const s = t0 + i * 0.75, u = (lt - s) / 3.2;
      if (u <= 0 || u >= 1) continue;
      const x = from[0] + Math.sin(u * 5 + i) * 6 * k + (i % 3 - 1) * 5 * k, y = from[1] - u * 34 * k;
      ctx.save(); ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9; ctx.translate(x, y);
      heartPath(ctx, 2.6 * k * (0.7 + 0.3 * (i % 2))); ctx.fillStyle = '#ff7d99'; ctx.fill(); ctx.restore();
    }
  }

  function birds(x0, y0, u) {
    if (u <= 0 || u >= 1) return;
    ctx.save(); ctx.strokeStyle = theme === 'dark' ? 'rgba(235,230,220,.85)' : 'rgba(40,40,52,.8)';
    ctx.lineWidth = Math.max(1.4, 0.55 * k); ctx.lineCap = 'round'; ctx.globalAlpha = 1 - seg(u, 0.7, 1);
    for (let i = 0; i < 3; i++) {
      const x = x0 + (i - 1) * 6 * k + u * (W * 0.3 + i * 30 * k), y = y0 - u * H * (0.35 + i * 0.06), f = Math.sin(u * 40 + i * 2) * 1.6 * k, s = 3.2 * k;
      ctx.beginPath(); ctx.moveTo(x - s, y - f); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.3, x, y); ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.3, x + s, y - f); ctx.stroke();
    }
    ctx.restore();
  }

  function grass(a, t) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, 0.7 * k);
    for (const b of blades) {
      const sway = Math.sin(t * 1.3 + b.ph) * 0.12, ang = b.lean + sway;
      ctx.strokeStyle = b.col; ctx.beginPath(); ctx.moveTo(b.x, b.y);
      ctx.quadraticCurveTo(b.x + Math.sin(ang) * b.len * 0.3, b.y - b.len * 0.6, b.x + Math.sin(ang) * b.len, b.y - Math.cos(ang) * b.len); ctx.stroke();
    }
    ctx.restore();
  }

  function fogDrift(t) {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const x = ((t * 0.012 * (i + 1) + i * 0.37) % 1.4 - 0.2) * W, y = gy - H * (0.05 + i * 0.06), r = H * 0.35;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, theme === 'dark' ? 'rgba(170,175,185,.14)' : 'rgba(240,240,244,.28)'); g.addColorStop(1, 'rgba(240,240,244,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  }

  function captions(c, lt) {
    for (const [ch, a, b, line] of CAPTIONS) {
      if (ch !== c) continue;
      const al = win(lt, a, b, 0.9);
      if (al <= 0.01) continue;
      ctx.save(); ctx.globalAlpha = al * 0.92;
      ctx.font = `${lang === 'or' ? '' : 'italic '}${caption}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const text = LINES[lang][line], x = W / 2;
      // on a narrow screen, break the line in two near the middle
      let rows = [text];
      if (ctx.measureText(text).width > W * 0.92) {
        const sp = [...text.matchAll(/ /g)].map(m => m.index), cut = sp.reduce((b, i) => Math.abs(i - text.length / 2) < Math.abs(b - text.length / 2) ? i : b, sp[0] ?? -1);
        if (cut > 0) rows = [text.slice(0, cut), text.slice(cut + 1)];
      }
      const lh = caption * 1.15, y0 = Math.min(H - caption * 0.9 - lh * (rows.length - 1), gy + (H - gy) * 0.55 - lh * (rows.length - 1) / 2);
      ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = caption * 0.35; ctx.fillStyle = 'rgba(248,242,232,.96)';
      rows.forEach((r, i) => ctx.fillText(r, x, y0 + i * lh));
      ctx.restore();
    }
  }

  const walkPh = (x0, x) => (x - x0) * W / k * Math.PI / STRIDE;

  /* ------------------------------------------------------------ the story */

  function chapter1(lt, t) {
    const dark = theme === 'dark';
    const fill = dark ? 'rgba(16,17,24,.95)' : 'rgba(44,47,58,.93)', fillFar = dark ? 'rgba(30,32,42,.78)' : 'rgba(78,82,96,.72)';
    const walkU = clamp(lt / BUMP, 0, 1), x = lerp(ENTER, STOPX, walkU);
    const amt = lt < BUMP ? 1 : 1 - seg(lt, BUMP, BUMP + 0.35);
    const knock = lt > BUMP ? Math.exp(-(lt - BUMP) * 3.2) * Math.sin((lt - BUMP) * 9) : 0;
    let p = walking(mix(POSE.stand, POSE.slump, 0.7 + 0.3 * seg(lt, BUMP, BUMP + 1.5)), walkPh(ENTER, x), amt);
    p = { ...p, lean: p.lean - knock * 0.35, head: p.head - knock * 0.3 };
    const crowd = CROWD.map(f => {
      let te = lt - f.at; if (te < 0) return null;
      let stopped = false;
      if (f.stop) { const [s0, s1] = f.stop; if (lt > s0) { te -= Math.min(lt, s1) - s0; stopped = lt < s1; } }
      const fx = 1.12 - f.v * te; if (fx < -0.15) return null;
      return { f, x: fx, stopped, te };
    }).filter(Boolean);
    const said = [];
    const draw = far => crowd.filter(c => (c.f.z < 1) === far).forEach(c => {
      const kk = k * c.f.h * c.f.z, yy = gy - (1 - c.f.z) * H * 0.06;
      const look = Math.sign(c.x - x);              // they face left, so +1 looks ahead of them
      const near = Math.abs(c.x - x) < 0.25;
      let q = walking(POSE.stand, (1.12 - c.x) * W / kk * Math.PI / STRIDE, c.stopped ? 0 : 1);
      if (c.f.point && c.stopped) q = { ...q, aR: lerp(q.aR, 1.45, seg(lt, c.f.stop[0], c.f.stop[0] + 0.5)), eR: 0.05 };
      const laugh = (c.f.laugh || c.f.say) && near ? 0.6 + 0.4 * Math.abs(Math.sin(t * 9)) : 0;
      if (laugh && c.stopped) q = { ...q, lean: q.lean - 0.05 * Math.abs(Math.sin(t * 9)) };
      if (!far) shadow(X(c.x), 9 * c.f.h, 0.22);
      const at = person(ctx, { x: X(c.x), gy: yy, k: kk, face: -1, pose: q, st: { kind: 'shade', fill: far ? fillFar : fill, eye: dark ? '#f2efe8' : '#ffffff' },
        mood: { gx: near ? look : 1, laugh }, t });
      if (c.f.say) said.push([at.top[0], at.top[1] - 3 * kk, c.f.say, win(lt, c.f.when, c.f.when + 1.9, 0.25), kk]);
    });
    draw(true);
    shadow(X(x), 10);
    const me = person(ctx, { x: X(x), gy, k, face: 1, pose: p, st: HIM, mood: { sad: 0.8, lid: 0.35, gy: 0.6, tear: seg(lt, 12, 13) * 0.7 }, t });
    heart(ctx, me.chest[0], me.chest[1], 3.4 * k, { beat: 0.04 * Math.max(0, Math.sin(t * 5)), crack: 0, split: 0, stitch: 0, dim: 0.35 });
    draw(false);
    for (const [bx, by, text, a, kk] of said) bubble(ctx, bx, by, text, a, kk, FONT, dark);
    headCloud(me.top, seg(lt, 11, 13), seg(lt, 13, 14), t);
  }

  function chapter2(lt, t) {
    const x = lerp(STOPX, SPOT, seg(lt, 1.4, 4.6));
    const amt = win(lt, 1.4, 4.6, 0.4);
    let p = mix(POSE.slump, POSE.stand, seg(lt, 0.2, 2.2));
    p = mix(p, POSE.offer, seg(lt, 4.6, 5.4));
    p = mix(p, POSE.slump, seg(lt, 8, 11.5));
    p = walking(p, walkPh(STOPX, x), amt);
    // her: looking up at the moon, then turning and walking away
    const turn = seg(lt, 5.6, 6.0), hx = lerp(0.72, 1.22, clamp((lt - 6.1) / 7, 0, 1));
    const hp = walking(mix({ ...POSE.stand, head: -0.25, aR: 0.1, eR: 0.5 }, POSE.stand, turn), walkPh(0.72, hx), win(lt, 6.1, 13.1, 0.3));
    const herA = seg(lt, 0, 1.2);
    if (hx < 1.2) {
      ctx.save(); ctx.globalAlpha = herA;
      shadow(X(hx), 8);
      person(ctx, { x: X(hx), gy, k: k * 0.94, face: lerp(-1, 1, turn) || 0.05, pose: hp, st: HER, mood: { smile: 0.3, gy: turn > 0.5 ? 0 : -0.35, lid: 0.22 }, t });
      ctx.restore();
    }
    shadow(X(x), 10);
    const sad = seg(lt, 7.6, 9);
    const me = person(ctx, { x: X(x), gy, k, face: 1, pose: p, st: HIM,
      mood: { sad: lerp(0.6, 0, seg(lt, 0.5, 2)) + sad, lid: 0.15 + sad * 0.3, smile: 0.6 * seg(lt, 1.5, 3) * (1 - sad) - sad * 0.8, gy: sad * 0.7, tear: seg(lt, 10.4, 11) }, t });
    // the rose
    const ra = lerp(-0.25, 0.25, seg(lt, 4.6, 5.4)) + lerp(0, 2.1, seg(lt, 8.6, 11.5));
    rose(ctx, me.hand[0], me.hand[1], ra, k * 0.95, 1);
    const beat = 0.05 + 0.1 * seg(lt, 2.5, 4) * (1 - sad);
    const shake = lt > 7.6 && lt < 8.6 ? Math.sin(lt * 70) * 0.8 * k : 0;
    heart(ctx, me.chest[0] + shake, me.chest[1], 3.4 * k, { beat: beat * Math.max(0, Math.sin(t * (6 + 4 * seg(lt, 2, 4)))) * (1 - sad),
      crack: seg(lt, 7.6, 8.4), split: seg(lt, 9.4, 11), stitch: 0, dim: lerp(0.35, 0, seg(lt, 0.4, 2)) + sad * 0.6 });
    loveHearts(me.top, 1.6, lt);
    headCloud(me.top, 1 - seg(lt, 0, 1.6), 1 - seg(lt, 0, 0.8), t);
  }

  function chapter3(lt, t) {
    const x = SPOT, dark = theme === 'dark';
    const sit = seg(lt, 0.6, 3.4);
    let p = mix(POSE.slump, POSE.sit, sit);
    const sob = win(lt, 3.4, 11.5, 1) * Math.sin(t * 6.5) * 0.04;
    p = { ...p, lean: p.lean + sob, head: p.head + sob };
    // the puppy comes in from the right, sits and nuzzles him; he looks up and pets it
    const dogStop = x + 50 * k / W, dx = lt < 7.4 ? 1.12 : lerp(1.12, dogStop, clamp((lt - 7.4) / 3.6, 0, 1));
    const pet = seg(lt, 12.6, 13.8);
    p = mix(p, { ...POSE.pet, aR: POSE.pet.aR + Math.sin(t * 4.5) * 0.12 * seg(lt, 13.8, 14.4) }, pet);
    rain(1 - seg(lt, 11.5, 15.5), t);
    // the rose falls from his hand and loses its petals
    const fall = seg(lt, 0.7, 1.5), rx = X(x) + 16 * k, petals = 1 - seg(lt, 3, 15);
    shadow(X(x) + 4 * k, 12);
    const me = person(ctx, { x: X(x), gy, k, face: 1, pose: p, st: HIM,
      mood: { sad: 1 - pet * 0.4, shut: lt > 3.4 && lt < 12.6 ? 1 : 0, gy: 0.4, tear: (1 - pet) * seg(lt, 1, 2), smile: -0.8 + pet * 1.1 }, t });
    if (fall < 1) rose(ctx, lerp(me.hand[0], rx, fall), lerp(me.hand[1], gy - 1 * k, fall), lerp(2.35, 1.5, fall), k * 0.95, petals);
    else rose(ctx, rx, gy - 1 * k, 1.5, k * 0.95, petals);
    for (let i = 0; i < 5; i++) {                  // petals drifting off
      const s = 3 + i * 2.4, u = (lt - s) / 2.6; if (u <= 0 || u >= 1) continue;
      ctx.save(); ctx.globalAlpha = 1 - u; ctx.translate(rx + 20 * k * u + Math.sin(u * 6 + i) * 3 * k, gy - 2 * k + u * 0.5 * k);
      ctx.rotate(u * 4 + i); blob(ctx, 0, 0, 1.6 * k, 0.9 * k, 0, '#b8233a', null); ctx.restore();
    }
    heart(ctx, me.chest[0], me.chest[1] - 2 * k * sit, 3.4 * k, { beat: 0, crack: 1, split: 1, stitch: 0, dim: 0.75 - pet * 0.25 });
    if (lt > 7.4) {
      const sitD = seg(lt, 11, 11.6), trot = 1 - seg(lt, 10.8, 11.1);
      shadow(X(dx), 9, 0.22);
      puppy(ctx, X(dx), gy, k * 1.15, -1, { ph: (1.12 - dx) * W / k * 0.22, trot, sit: sitD, wag: 4 + 8 * seg(lt, 11, 12),
        look: lerp(0, 0.6, win(lt, 11.8, 13, 0.3)) - pet * 0.2, happy: seg(lt, 13.8, 14.4) }, t);
    }
    headCloud(me.top, seg(lt, 0, 1.5) * (1 - pet * 0.35), 1 - seg(lt, 11.5, 13.5), t);
    fogDrift(t);
  }

  function chapter4(lt, t) {
    const up = seg(lt, 0.2, 2.6), go = 4.4, x = lt < go ? SPOT : SPOT + (lt - go) * 0.058;
    let p = mix(POSE.pet, mix(POSE.stand, { ...POSE.stand, head: -0.12 }, seg(lt, 2.6, 4)), up);
    p = walking(p, walkPh(SPOT, x), seg(lt, go - 0.2, go + 0.3));
    shadow(X(x), 10);
    const me = person(ctx, { x: X(x), gy, k, face: 1, pose: p, st: HIM, mood: { sad: 0.5 - 0.5 * seg(lt, 2, 4), smile: lerp(0.3, 0.8, seg(lt, 3, 5)), lid: 0.2 }, t });
    const st = seg(lt, 2.2, 3.4);
    heart(ctx, me.chest[0], me.chest[1], 3.4 * k, { beat: 0.06 * Math.max(0, Math.sin(t * 5)) * st, crack: 1, split: 1 - st, stitch: seg(lt, 2.8, 4), dim: 0.5 * (1 - st) });
    // the cloud breaks up into birds
    const top = me.top;
    headCloud(top, 1 - seg(lt, 3.2, 3.9), 0, t);
    birds(top[0], top[1] - 10 * k, (lt - 3.4) / 6);
    // the puppy trots along just ahead of him
    const dStand = seg(lt, 0.6, 1.4), dx = x + lerp(50, 36, seg(lt, go - 0.6, go + 0.8)) * k / W + (lt > go ? Math.sin(t * 1.3) * 4 * k / W : 0);
    shadow(X(dx), 9, 0.22);
    puppy(ctx, X(dx), gy, k * 1.15, lt > go - 0.6 ? 1 : -1, { ph: walkPh(SPOT, x) * 1.6, trot: seg(lt, go - 0.2, go + 0.3), sit: 1 - dStand, wag: 9, look: lt < go ? 0.2 : -0.1, happy: 1 }, t);
  }

  const CHAPTERS = [chapter1, chapter2, chapter3, chapter4];

  function draw() {
    const c = chapterOf(T), lt = T - c * CH, n = (c + 1) % SCENES.length, fa = seg(lt, CH - FADE, CH), t = T;
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    backdrop(c, 1); backdrop(n, fa);
    veil();
    ground(c, 1 - fa * (SCENES[n] === SCENES[c] ? 0 : 1)); ground(n, fa);
    if (SCENES[c] === 'dawn' || SCENES[n] === 'dawn') grass(c === 3 ? 1 - fa : fa, t);
    CHAPTERS[c](lt, t);
    captions(c, lt);
  }

  /* ------------------------------------------------------------ loop */

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 32) return;                  // ~30 frames a second is plenty
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 30;
    const before = chapterOf(T);
    last = now; T = (T + dt) % CYCLE;
    if (chapterOf(T) !== before || ((T % CH) > CH - 3 && ((T - dt) % CH) <= CH - 3)) syncVideos();
    const t0 = performance.now(); draw(); const cost = performance.now() - t0;
    slowFrames = cost > 40 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames > 90 && opts.onSlow) opts.onSlow();
  }
  function play() { if (running || !ready || document.hidden) return; running = true; last = 0; syncVideos(); raf = requestAnimationFrame(frame); }
  function pause() { running = false; cancelAnimationFrame(raf); syncVideos(); }
  const onVis = () => (document.hidden ? pause() : play());
  const onResize = () => { fit(); if (ready && !running) draw(); };

  fit();
  const first = posters[chapterOf(T)];
  new Promise((ok, no) => { if (first.complete && first.naturalWidth) ok(); else { first.onload = ok; first.onerror = no; } }).then(() => {
    ready = true; draw();
    if (opts.onReady) opts.onReady();
    play();
  }).catch(() => { if (opts.onSlow) opts.onSlow(); });

  addEventListener('resize', onResize);
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', onVis);

  return {
    stop() {
      save(); pause(); ready = false;
      removeEventListener('resize', onResize); removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', onVis);
      vids.forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); });
    },
    setTheme(th) { theme = th; if (ready && !running) draw(); },
    debug: { draw, seek: s => { T = ((s % CYCLE) + CYCLE) % CYCLE; syncVideos(); }, get T() { return T; } },
  };
}

/* =============================================================================
   sunrise.js — "Sunrise": me and my dog on a Himalayan ridge at first light.

   Loaded on demand by site.js (section 16) when the visitor picks it. Unlike the other
   companions this one is photographic, drawn on a 2D canvas:

     * the ridge is a real photograph ("Himalaya sunrise" by Ali Sabbagh, CC0, Wikimedia
       Commons);
     * I am cut out of one of my own photos, the dog out of "Golden Retriever Reggy"
       (public domain, Wikimedia Commons); both were relit offline for a low sun behind
       and to the left (warm grade, highlights rolled off, a rim of sunlight on the edges
       that face the sun);
     * live on top: the sun breathing behind the ridge, slow god rays, valley mist
       drifting, birds crossing, golden grass swaying in front of us, dust glinting in
       the light, a faint lens flare, and the two of us breathing.

   export start(canvas, { theme, onReady, onSlow }) → { stop(), setTheme(theme) }
   ========================================================================== */

const IMG = name => new URL(`../images/sunrise/${name}`, import.meta.url).href;
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const rand = (seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; })(20261006);

// where things sit, in the coordinates of the photograph (0..1 across, 0..1 down)
const SUN = { x: 0.096, y: 0.17 };
const ME = { x: 0.645, bottom: 1.05, h: 0.57 };             // left edge, bottom, height
const DOG = { dx: -0.045, bottom: 1.03, h: 0.4 };        // left edge relative to my right edge

function load(src) {
  return new Promise((ok, no) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
}

export function start(canvas, opts = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let theme = opts.theme || 'light', running = false, raf = 0, last = 0, t = 0, slowFrames = 0, ready = false;
  let W = 0, H = 0, dpr = 1, view = null, ridge = null, me = null, dog = null, sky = null;
  const blades = [], motes = [], birds = [];

  /* ---------------------------------------------------------------- layout */

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.round(innerWidth * dpr); H = Math.round(innerHeight * dpr);
    canvas.width = W; canvas.height = H;
    if (!ridge) return;
    // cover the screen with the photo; on narrow screens slide right so we stay in view
    const s = Math.max(W / ridge.width, H / ridge.height), w = ridge.width * s, h = ridge.height * s;
    const focus = W / H < 1.2 ? 0.66 : 0.5;
    const ox = clamp(W / 2 - focus * w, W - w, 0), oy = (H - h) / 2;
    view = { s, w, h, ox, oy, X: u => ox + u * w, Y: v => oy + v * h };
    // the photo, drawn once per resize
    sky = document.createElement('canvas'); sky.width = W; sky.height = H;
    sky.getContext('2d').drawImage(ridge, ox, oy, w, h);
    scatter();
  }

  function scatter() {
    blades.length = 0; motes.length = 0; birds.length = 0;
    const n = Math.round(clamp(W / 7, 110, 300));
    for (let i = 0; i < n; i++) {
      // tufts in front of us, a few elsewhere along the bottom
      const near = rand() < 0.7, x = near ? (W / H < 1 ? W * (0.15 + rand() * 0.85) : view.X(ME.x - 0.04 + rand() * 0.36)) : rand() * W;
      const len = H * (near ? 0.03 + rand() * rand() * 0.13 : 0.02 + rand() * 0.05), tone = rand();
      blades.push({ x, len, lean: (rand() - 0.5) * 0.7, ph: rand() * TAU, sp: 0.5 + rand() * 0.7,
        w: dpr * (1.2 + rand() * 2.2), col: tone < 0.4 ? 'rgba(176,122,52,.8)' : tone < 0.75 ? 'rgba(206,154,76,.75)' : 'rgba(132,88,38,.85)', lit: rand() < 0.35, seed: rand() });
    }
    blades.sort((a, b) => a.len - b.len);
    for (let i = 0; i < 46; i++) motes.push({ x: rand(), y: 0.2 + rand() * 0.65, r: 0.6 + rand() * 1.8, ph: rand() * TAU, sp: 0.004 + rand() * 0.01 });
    for (let i = 0; i < 4; i++) birds.push({ x: rand(), y: 0.1 + rand() * 0.22, s: 0.6 + rand() * 0.6, v: 0.006 + rand() * 0.008, ph: rand() * TAU, dir: rand() < 0.5 ? 1 : -1 });
  }

  /* ---------------------------------------------------------------- drawing */

  // where the two of us stand on screen: in the photo's coordinates, scaled down to fit narrow screens
  function placement() {
    const mh = view.h * ME.h, mw = mh * me.width / me.height, dh = view.h * DOG.h, dw = dh * dog.width / dog.height;
    const span = mw + dw + view.w * DOG.dx, k = Math.min(1, 0.9 * W / span);
    if (k === 1) {
      const mx = view.X(ME.x);
      return { me: [mx, view.Y(ME.bottom), mw, mh], dog: [mx + mw + view.w * DOG.dx, view.Y(DOG.bottom), dw, dh] };
    }
    const x0 = W - 0.04 * W - span * k, y = H * 1.02;
    return { me: [x0, y, mw * k, mh * k], dog: [x0 + (mw + view.w * DOG.dx) * k, y - H * 0.01, dw * k, dh * k] };
  }

  function figure(img, [X, Y, dw, dh], breathe) {
    // soft contact shadow on the grass
    const g = ctx.createRadialGradient(X + dw / 2, Y - dh * 0.06, 0, X + dw / 2, Y - dh * 0.06, dw * 0.62);
    g.addColorStop(0, 'rgba(48,26,8,.42)'); g.addColorStop(1, 'rgba(48,26,8,0)');
    ctx.save(); ctx.translate(X + dw / 2, Y - dh * 0.06); ctx.scale(1, 0.22); ctx.translate(-(X + dw / 2), -(Y - dh * 0.06));
    ctx.fillStyle = g; ctx.fillRect(X - dw * 0.2, Y - dh * 0.06 - dw, dw * 1.4, dw * 2); ctx.restore();
    // breathing: a slow rise of the chest, anchored at the seat
    const b = 1 + breathe;
    ctx.drawImage(img, X, Y - dh * b, dw, dh * b);
  }

  function draw() {
    const sunX = view.X(SUN.x), sunY = view.Y(SUN.y), R = Math.max(W, H);
    const dark = theme === 'dark';
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.drawImage(sky, 0, 0);

    // the sun breathing behind the ridge
    ctx.globalCompositeOperation = 'screen';
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.35);
    let g = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, R * 0.55);
    g.addColorStop(0, `rgba(255,236,190,${0.32 + 0.1 * pulse})`); g.addColorStop(0.25, 'rgba(255,196,120,.14)'); g.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // god rays fanning out from the sun
    ctx.save(); ctx.translate(sunX, sunY);
    for (let i = 0; i < 9; i++) {
      const a = 0.05 + i * 0.13 + 0.03 * Math.sin(t * 0.07 + i * 1.7), len = R * 1.25, wid = 0.04 + 0.025 * Math.sin(i * 2.3);
      const rg = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      const k = 0.028 + 0.02 * Math.sin(t * 0.21 + i);
      rg.addColorStop(0, `rgba(255,226,170,${k})`); rg.addColorStop(1, 'rgba(255,226,170,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - wid) * len, Math.sin(a - wid) * len); ctx.lineTo(Math.cos(a + wid) * len, Math.sin(a + wid) * len); ctx.fill();
    }
    ctx.restore();

    // valley mist drifting slowly to the right
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 7; i++) {
      const u = ((i / 7 + t * 0.004) % 1.2) - 0.1, x = view.X(0.28 + u * 0.75), y = view.Y(0.47 + 0.05 * Math.sin(i * 2.1)), r = view.w * (0.09 + 0.05 * Math.sin(i * 1.3 + 1));
      const mg = ctx.createRadialGradient(x, y, 0, x, y, r);
      mg.addColorStop(0, 'rgba(255,236,214,.13)'); mg.addColorStop(1, 'rgba(255,236,214,0)');
      ctx.save(); ctx.translate(x, y); ctx.scale(2.4, 0.42); ctx.translate(-x, -y); ctx.fillStyle = mg; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
    }

    // birds crossing the sky
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = dark ? 'rgba(30,20,22,.75)' : 'rgba(55,42,38,.7)'; ctx.lineCap = 'round';
    for (const b of birds) {
      b.x += b.v * b.dir / 60; if (b.x > 1.15) b.x = -0.15; if (b.x < -0.15) b.x = 1.15;
      const x = b.x * W, y = b.y * H + Math.sin(t * 0.6 + b.ph) * H * 0.01, s = b.s * dpr * 7, f = Math.sin(t * 7 * b.s + b.ph);
      ctx.lineWidth = dpr * 1.3; ctx.beginPath();
      ctx.moveTo(x - s, y - f * s * 0.5); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.35 - f * s * 0.25, x, y);
      ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.35 - f * s * 0.25, x + s, y - f * s * 0.5); ctx.stroke();
    }

    // the two of us
    const at = placement();
    figure(me, at.me, 0.004 * Math.sin(t * 1.25));
    figure(dog, at.dog, 0.006 * Math.sin(t * 2.1 + 1));

    // golden grass in front, swaying in the morning breeze
    for (const bl of blades) {
      const sway = Math.sin(t * bl.sp + bl.ph) * 0.12 + Math.sin(t * 0.4 + bl.x * 0.002) * 0.08;
      const a = bl.lean + sway, tipX = bl.x + Math.sin(a) * bl.len, tipY = H - Math.cos(a) * bl.len;
      // out of focus: a wide faint stroke under a narrower one
      ctx.strokeStyle = bl.col; ctx.globalAlpha = 0.35; ctx.lineWidth = bl.w * 2.6;
      ctx.beginPath(); ctx.moveTo(bl.x, H + 2); ctx.quadraticCurveTo(bl.x + Math.sin(a) * bl.len * 0.3, H - bl.len * 0.55, tipX, tipY); ctx.stroke();
      ctx.globalAlpha = 0.8; ctx.lineWidth = bl.w;
      ctx.beginPath(); ctx.moveTo(bl.x, H + 2); ctx.quadraticCurveTo(bl.x + Math.sin(a) * bl.len * 0.3, H - bl.len * 0.55, tipX, tipY); ctx.stroke();
      ctx.globalAlpha = 1;
      if (bl.lit) {          // sunlight catching the edge facing the sun
        ctx.strokeStyle = 'rgba(255,222,160,.3)'; ctx.lineWidth = bl.w * 0.45;
        ctx.beginPath(); ctx.moveTo(bl.x - bl.w * 0.3, H - bl.len * 0.3); ctx.quadraticCurveTo(bl.x + Math.sin(a) * bl.len * 0.3 - bl.w * 0.3, H - bl.len * 0.6, tipX - bl.w * 0.3, tipY); ctx.stroke();
      }
      if (bl.seed > 0.9) {   // a seed head
        ctx.fillStyle = 'rgba(232,196,128,.6)'; ctx.beginPath(); ctx.ellipse(tipX, tipY, bl.w * 1.4, bl.w * 4, a, 0, TAU); ctx.fill();
      }
    }

    // dust glinting in the light, and a faint lens flare
    ctx.globalCompositeOperation = 'screen';
    for (const p of motes) {
      p.y -= p.sp / 60; p.x += Math.sin(t * 0.5 + p.ph) * 0.0004; if (p.y < 0.15) p.y = 0.85;
      const tw = 0.4 + 0.6 * Math.max(0, Math.sin(t * 1.7 + p.ph));
      ctx.fillStyle = `rgba(255,236,190,${0.55 * tw})`; ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r * dpr, 0, TAU); ctx.fill();
    }
    const cx = W / 2, cy = H / 2;
    for (const [k, r, al] of [[0.55, 0.04, 0.07], [0.9, 0.025, 0.08], [1.25, 0.07, 0.05], [1.6, 0.03, 0.06]]) {
      const x = sunX + (cx - sunX) * k * 2, y = sunY + (cy - sunY) * k * 2, rr = R * r;
      const fg = ctx.createRadialGradient(x, y, 0, x, y, rr);
      fg.addColorStop(0, `rgba(255,214,150,${al})`); fg.addColorStop(0.7, `rgba(255,190,120,${al * 0.6})`); fg.addColorStop(1, 'rgba(255,190,120,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
    }

    // dark theme: an earlier, deeper dawn
    if (dark) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(120,96,128,1)'; ctx.globalAlpha = 0.55; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'screen';
      g = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, R * 0.6);
      g.addColorStop(0, 'rgba(255,150,80,.35)'); g.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------------------------------------------------------------- loop */

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 32) return;                  // ~30 frames a second is plenty
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 30;
    last = now; t += dt;
    const t0 = performance.now(); draw(); const cost = performance.now() - t0;
    slowFrames = cost > 40 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames > 90 && opts.onSlow) opts.onSlow();
  }
  function play() { if (running || !ready || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function pause() { running = false; cancelAnimationFrame(raf); }
  const onVis = () => (document.hidden ? pause() : play());
  const onResize = () => { fit(); if (ready && !running) draw(); };

  Promise.all([load(IMG('ridge.webp')), load(IMG('me.webp')), load(IMG('dog.webp'))]).then(([a, b, c]) => {
    ridge = a; me = b; dog = c; fit(); ready = true; draw();
    if (opts.onReady) opts.onReady();
    play();
  }).catch(() => { if (opts.onSlow) opts.onSlow(); });

  fit();
  addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVis);

  return {
    stop() { pause(); ready = false; removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis); },
    setTheme(th) { theme = th; if (ready && !running) draw(); },
    debug: { draw, advance: s => { t += s; }, get t() { return t; } },
  };
}

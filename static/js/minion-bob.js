/**
 * minion-bob.js
 * ─────────────────────────────────────────────────────────────────
 * 3-D Minion Bob mascot (Three.js r128).
 * Bob walks into the page from below, wanders around, flees the
 * mouse, blinks, waves, and shows speech bubbles.
 * ─────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  /* poll until Three.js CDN has finished loading */
  function whenThree(fn, n) {
    if (window.THREE) { fn(); return; }
    if ((n = (n || 0)) > 80) return;
    setTimeout(function () { whenThree(fn, n + 1); }, 120);
  }

  whenThree(spawnBob);

  /* ═══════════════════════════════════════════════════════════════
     MAIN
  ═══════════════════════════════════════════════════════════════ */
  function spawnBob() {
    var T   = window.THREE;
    var CW  = 170, CH = 220;     /* canvas size in CSS pixels */
    var vW  = window.innerWidth;
    var vH  = window.innerHeight;

    /* ── DOM wrapper ─────────────────────────────────────────── */
    var wrap = document.createElement('div');
    wrap.id  = 'minion-bob';
    wrap.style.cssText =
      'position:fixed;' +
      'width:'   + CW + 'px;height:' + CH + 'px;' +
      'z-index:7500;pointer-events:none;' +
      'left:'    + (vW - CW - 200) + 'px;' +
      'top:'     + (vH + 20)       + 'px;';  /* start below viewport */
    document.body.appendChild(wrap);

    /* ── speech bubble ───────────────────────────────────────── */
    var bub = document.createElement('div');
    bub.style.cssText =
      'position:absolute;' +
      'bottom:' + (CH + 8) + 'px;left:50%;transform:translateX(-50%);' +
      'background:#fff;border:2.5px solid #444;border-radius:14px;' +
      'padding:6px 13px;white-space:nowrap;' +
      'font-family:\'Space Grotesk\',system-ui,sans-serif;' +
      'font-size:12px;font-weight:700;color:#222;' +
      'opacity:0;transition:opacity 0.38s ease;' +
      'box-shadow:0 6px 22px rgba(0,0,0,.22);pointer-events:none;';
    bub.innerHTML =
      '<span id="bob-bub-inner">Bello!</span>' +
      '<div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border:9px solid transparent;border-top:10px solid #444;border-bottom:0"></div>' +
      '<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border:7px solid transparent;border-top:7px solid #fff;border-bottom:0"></div>';
    wrap.appendChild(bub);

    var bubTxt = bub.querySelector('#bob-bub-inner');
    var PHRASES = ['Bello! 👋','Me like! ⚛️','Poopaye! 🍌','Tulaliloo! ✨','Bee do! 🚨','Tank yu! 😊','Papagena! 🎵','Me want banana! 🍌'];

    function showBub(txt) {
      bubTxt.textContent = txt;
      bub.style.opacity  = '1';
      clearTimeout(bub._t);
      bub._t = setTimeout(function () { bub.style.opacity = '0'; }, 2800);
    }

    /* ── Three.js renderer ───────────────────────────────────── */
    var cv  = document.createElement('canvas');
    wrap.appendChild(cv);

    var ren = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ren.setSize(CW, CH);
    ren.setClearColor(0x000000, 0);

    var sc  = new T.Scene();
    var cam = new T.PerspectiveCamera(42, CW / CH, 0.1, 100);
    cam.position.set(0, 0.6, 9.2);
    cam.lookAt(0, 0, 0);

    /* ── lights ──────────────────────────────────────────────── */
    sc.add(new T.AmbientLight(0xffffff, 0.5));
    var sun  = new T.DirectionalLight(0xfff5dd, 1.4);  sun.position.set(4, 7, 6);  sc.add(sun);
    var fill = new T.DirectionalLight(0x88aaff, 0.38); fill.position.set(-4, 1, 3); sc.add(fill);
    var rim  = new T.DirectionalLight(0xffffff, 0.15); rim.position.set(0, -4, -2); sc.add(rim);

    /* ── materials ───────────────────────────────────────────── */
    function mat(hex, sh, sp) {
      return new T.MeshPhongMaterial({ color: new T.Color(hex), shininess: sh, specular: new T.Color(sp || 0x111111) });
    }
    var mY  = mat(0xF9C21A, 60,  0x443300);
    var mBl = mat(0x2255BB, 30,  0x001133);
    var mDn = mat(0x1B3A7A, 12,  0x000000);
    var mW  = mat(0xFFFFFF, 95,  0x999999);
    var mK  = mat(0x111111, 20,  0x000000);
    var mGr = mat(0xBBBBBB, 130, 0xCCCCCC);
    var mBr = mat(0x5C3A1E, 18,  0x000000);
    var mSh = mat(0x181818, 95,  0x555555);

    /* ── character root ──────────────────────────────────────── */
    var bob  = new T.Group();
    sc.add(bob);
    function mk(g, m) { return new T.Mesh(g, m); }

    /* shadow */
    var shdwMat = new T.MeshBasicMaterial({ color:0, transparent:true, opacity:0.13, side:T.DoubleSide });
    var shdw = mk(new T.CircleGeometry(0.62, 32), shdwMat);
    shdw.rotation.x = -Math.PI / 2;  shdw.position.y = -1.70;
    bob.add(shdw);

    /* body */
    var bodyM = mk(new T.SphereGeometry(0.78, 32, 24), mY);
    bodyM.scale.y = 1.24;
    bob.add(bodyM);

    /* overalls – pants */
    var pantsM = mk(new T.CylinderGeometry(0.75, 0.71, 0.78, 24), mBl);
    pantsM.position.y = -0.58;
    bob.add(pantsM);

    /* overalls – bib */
    var bibM = mk(new T.BoxGeometry(0.88, 0.72, 0.12), mBl);
    bibM.position.set(0, -0.05, 0.72);
    bob.add(bibM);

    /* straps */
    [[-0.22, 0.17],[0.22, -0.17]].forEach(function (s) {
      var st = mk(new T.BoxGeometry(0.12, 0.48, 0.09), mBl);
      st.position.set(s[0], 0.32, 0.72); st.rotation.z = s[1];
      bob.add(st);
    });

    /* pocket */
    var pktM = mk(new T.BoxGeometry(0.26, 0.16, 0.04), mDn);
    pktM.position.set(0, -0.19, 0.80);
    bob.add(pktM);

    /* ── head group ──────────────────────────────────────────── */
    var hG = new T.Group();
    hG.position.y = 1.26;
    bob.add(hG);

    hG.add(mk(new T.SphereGeometry(0.75, 32, 32), mY));

    /* hair */
    var hairM = mk(new T.ConeGeometry(0.09, 0.52, 8), mBr);
    hairM.position.set(0.15, 0.81, 0.06); hairM.rotation.z = -0.22;
    hG.add(hairM);

    /* goggle strap ring */
    var strapM = mk(new T.TorusGeometry(0.75, 0.052, 8, 48), mGr);
    strapM.rotation.x = Math.PI / 2;
    hG.add(strapM);

    /* goggle bridge */
    var brM = mk(new T.CylinderGeometry(0.038, 0.038, 0.31, 8), mGr);
    brM.rotation.z = Math.PI / 2; brM.position.set(0, 0.025, 0.72);
    hG.add(brM);

    /* ── eyes ────────────────────────────────────────────────── */
    /* NOTE: parameters use 'er,ex,ey,ez' to avoid shadowing outer px/py */
    function mkEye(er, ex, ey, ez) {
      var g = new T.Group();
      g.position.set(ex, ey, ez);

      var ew   = mk(new T.SphereGeometry(er, 22, 22), mW);
      var pup  = mk(new T.SphereGeometry(er * 0.52, 16, 16), mBr);
      pup.position.z = er * 0.68;
      var iris = mk(new T.SphereGeometry(er * 0.28, 14, 14), mK);
      iris.position.z = er * 0.86;
      var hl   = mk(new T.SphereGeometry(er * 0.115, 8, 8), mW);
      hl.position.set(er * 0.18, er * 0.23, er * 0.94);
      var ring = mk(new T.TorusGeometry(er + 0.068, 0.052, 8, 24), mGr);

      [ew, pup, iris, hl, ring].forEach(function (m) { g.add(m); });
      hG.add(g);
      return { ew: ew, pup: pup, iris: iris };
    }

    /* Bob's asymmetric eyes: big left, small right */
    var eL = mkEye(0.268, -0.205,  0.065, 0.68);
    var eR = mkEye(0.208,  0.245,  0.010, 0.68);

    /* smile */
    var smM = mk(new T.TorusGeometry(0.215, 0.044, 8, 22, Math.PI), mK);
    smM.position.set(0, -0.325, 0.70); smM.rotation.z = Math.PI;
    hG.add(smM);

    /* ── arms ────────────────────────────────────────────────── */
    function mkArm(sign) {
      var g = new T.Group();
      g.position.set(sign * 0.84, 0.10, 0);
      var cyl = mk(new T.CylinderGeometry(0.13, 0.13, 0.50, 12), mY);
      cyl.rotation.z = Math.PI / 2; cyl.position.x = sign * 0.25;
      g.add(cyl);
      g.add(mk(new T.SphereGeometry(0.13, 14, 14), mY));         /* shoulder cap */
      var wc = mk(new T.SphereGeometry(0.13, 14, 14), mY);
      wc.position.x = sign * 0.50; g.add(wc);                    /* wrist cap    */
      var gl = mk(new T.SphereGeometry(0.18, 16, 16), mW);
      gl.position.x = sign * 0.69; g.add(gl);                    /* glove        */
      bob.add(g); return g;
    }
    var aL = mkArm(-1), aR = mkArm(1);

    /* ── legs ────────────────────────────────────────────────── */
    function mkLeg(sign) {
      var g = new T.Group();
      g.position.set(sign * 0.31, -1.10, 0);
      g.add(mk(new T.CylinderGeometry(0.21, 0.20, 0.36, 16), mY));
      var bc = mk(new T.SphereGeometry(0.20, 16, 16), mY);
      bc.position.y = -0.18; g.add(bc);
      var shoe = mk(new T.SphereGeometry(0.23, 16, 12), mSh);
      shoe.scale.set(1, 0.62, 1.45); shoe.position.set(0, -0.42, 0.10);
      g.add(shoe);
      bob.add(g); return g;
    }
    var lL = mkLeg(-1), lR = mkLeg(1);

    /* ── page-position state ─────────────────────────────────── */
    var bobX = vW - CW - 200;   /* CSS left  (starts near right edge) */
    var bobY = vH + 20;          /* CSS top   (starts off-screen)      */
    var tgtX = bobX;
    var tgtY = vH - CH - 50;
    var spd    = 1.3;
    var dirTmr = 0;
    var entering = true;

    function pickTarget() {
      var mg = 80;
      tgtX = mg + Math.random() * (vW - CW - mg * 2);
      tgtY = vH * 0.55 + Math.random() * (vH * 0.36);
      dirTmr = 90 + Math.random() * 170;
    }

    /* mouse position */
    var mouseX = vW / 2, mouseY = vH / 2;
    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
    }, { passive: true });

    window.addEventListener('resize', function () {
      vW = window.innerWidth; vH = window.innerHeight;
    }, { passive: true });

    /* ── animation state ─────────────────────────────────────── */
    var t   = 0;
    var fac = 1;      /* facing +1=right / -1=left */
    var mov = false;

    var blT      = 80 + Math.random() * 80;
    var blinking = false, blPh = 0;

    var waT    = 220 + Math.random() * 300;
    var waving = false, waPh = 0;

    /* entrance tilt: Bob leans forward as if walking onto the page */
    bob.rotation.x = 0.30;
    bob.scale.set(0.5, 0.5, 0.5);

    /* ── main loop ───────────────────────────────────────────── */
    function loop() {
      requestAnimationFrame(loop);
      t += 0.04;

      /* PAGE POSITION ─────────────────────────────────────────── */
      if (entering) {
        bobY -= 2.0;                                   /* walk up  */
        bob.rotation.x *= 0.96;                        /* straighten */
        var ns = Math.min(1.0, bob.scale.x + 0.015);  /* grow in    */
        bob.scale.set(ns, ns, ns);
        mov = true;

        if (bobY <= vH - CH - 50) {
          bobY = vH - CH - 50;
          entering = false;
          pickTarget();
          setTimeout(function () { showBub('Bello! 👋'); }, 500);
        }
      } else {
        dirTmr--;
        if (dirTmr <= 0) pickTarget();

        var dx = tgtX - bobX, dy = tgtY - bobY;
        var d  = Math.sqrt(dx * dx + dy * dy);
        mov = d > 8;
        if (mov) {
          bobX += (dx / d) * spd;
          bobY += (dy / d) * spd;
          fac = dx > 0 ? 1 : -1;
        }

        /* flee mouse */
        var fx = bobX + CW / 2 - mouseX;
        var fy = bobY + CH / 2 - mouseY;
        var fd = Math.sqrt(fx * fx + fy * fy);
        if (fd > 0 && fd < 150) {
          var fl = ((150 - fd) / 150) * 3.8;
          bobX += (fx / fd) * fl;
          bobY += (fy / fd) * fl;
          fac = fx > 0 ? 1 : -1;
          mov = true;
          if (fd < 65 && Math.random() < 0.008) {
            showBub('Bee do bee do! 🚨');
            dirTmr = 0;
          }
        }

        /* clamp */
        bobX = Math.max(40, Math.min(vW - CW - 40, bobX));
        bobY = Math.max(40, Math.min(vH - CH - 40, bobY));
      }

      /* update DOM */
      wrap.style.left   = Math.round(bobX) + 'px';
      wrap.style.top    = Math.round(bobY) + 'px';
      wrap.style.right  = 'auto';
      wrap.style.bottom = 'auto';

      /* 3-D WALK CYCLE ────────────────────────────────────────── */
      if (mov) {
        var cyc = t * 5.0;
        bob.position.y   = Math.abs(Math.sin(cyc)) * 0.10;
        lL.rotation.x    =  Math.sin(cyc) * 0.44;
        lR.rotation.x    = -Math.sin(cyc) * 0.44;
        if (!waving) {
          aL.rotation.z  =  Math.sin(cyc) * 0.30;
          aR.rotation.z  = -Math.sin(cyc) * 0.30;
        }
        bodyM.rotation.z = Math.sin(cyc) * 0.032;
        shdw.scale.setScalar(1.0 - bob.position.y * 0.18);
      } else {
        /* idle breathing */
        var br = Math.sin(t * 1.9);
        bodyM.scale.y    = 1.24 + br * 0.022;
        bodyM.scale.x    = 1.00 - br * 0.008;
        bob.position.y   = br * 0.038;
        lL.rotation.x   *= 0.87; lR.rotation.x *= 0.87;
        if (!waving) { aL.rotation.z *= 0.9; aR.rotation.z *= 0.9; }
        bodyM.rotation.z *= 0.88;
        shdw.scale.setScalar(1.0);
      }

      /* smooth facing */
      bob.rotation.y += (fac * 0.18 - bob.rotation.y) * 0.1;

      /* WAVING ─────────────────────────────────────────────────── */
      waT--;
      if (waT <= 0 && !waving) {
        waving = true; waPh = 0;
        waT = 250 + Math.random() * 360;
        if (Math.random() < 0.65)
          showBub(PHRASES[0 | (Math.random() * PHRASES.length)]);
      }
      if (waving) {
        waPh += 0.07;
        aR.rotation.z = -0.6 - Math.abs(Math.sin(waPh * 2.9)) * 1.35;
        if (waPh > Math.PI * 1.85) { waving = false; aR.rotation.z = 0; }
      }

      /* BLINKING ───────────────────────────────────────────────── */
      blT--;
      if (blT <= 0 && !blinking) { blinking = true; blPh = 0; blT = 70 + Math.random() * 110; }
      if (blinking) {
        blPh += 0.30;
        var sc = Math.max(0.04, Math.cos(blPh * Math.PI));
        eL.ew.scale.y = sc; eL.pup.scale.y = sc;
        eR.ew.scale.y = sc; eR.pup.scale.y = sc;
        if (blPh >= 1) {
          blinking = false;
          eL.ew.scale.y = eL.pup.scale.y = 1;
          eR.ew.scale.y = eR.pup.scale.y = 1;
        }
      }

      /* EYE TRACKING ───────────────────────────────────────────── */
      /* Use bobX/bobY (not the shadowed px/py params from mkEye!) */
      var ex = Math.max(-0.13, Math.min(0.13,
        (mouseX - (bobX + CW / 2)) / vW * 0.42));
      var ey = Math.max(-0.13, Math.min(0.13,
        -(mouseY - (bobY + CH / 2)) / vH * 0.42));

      eL.pup.position.x  = ex;      eL.pup.position.y  = ey;
      eL.iris.position.x = ex*1.35; eL.iris.position.y = ey*1.35;
      eR.pup.position.x  = ex*0.80; eR.pup.position.y  = ey*0.80;
      eR.iris.position.x = ex*1.10; eR.iris.position.y = ey*1.10;

      hG.rotation.y = ex * 0.36;
      hG.rotation.x = -ey * 0.28;

      ren.render(sc, cam);
    }

    loop();
  }

})();

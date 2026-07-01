/**
 * three-quark.js — Interactive 3D QCD Quark Confinement Visualizer
 * Uses Three.js (loaded from CDN in base.html)
 * Replaces the 2D canvas QCD system with a true WebGL 3D scene.
 */
(function () {
  'use strict';

  // Wait for Three.js CDN to load
  function waitForThree(cb, tries) {
    tries = tries || 0;
    if (window.THREE) return cb();
    if (tries > 30) return; // give up after 3s
    setTimeout(() => waitForThree(cb, tries + 1), 100);
  }

  waitForThree(initScene);

  function initScene() {
    const canvas = document.getElementById('qcd-particle-canvas');
    if (!canvas) return;

    const THREE = window.THREE;
    const W = canvas.clientWidth  || canvas.offsetWidth  || window.innerWidth;
    const H = canvas.clientHeight || canvas.offsetHeight || window.innerHeight;

    // ── Renderer ──────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    // ── Scene & Camera ────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
    camera.position.set(0, 0, 14);

    // ── Lighting ──────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const ptLight1 = new THREE.PointLight(0xff4444, 3, 30); scene.add(ptLight1);
    const ptLight2 = new THREE.PointLight(0x44ff44, 3, 30); scene.add(ptLight2);
    const ptLight3 = new THREE.PointLight(0x4444ff, 3, 30); scene.add(ptLight3);

    // ── Quark geometry ────────────────────────────────────
    const QUARK_R = 0.55;
    const ORBIT_R = 3.8;
    const quarkColors = [0xff3366, 0x33ff88, 0x3388ff]; // RGB = RGBcolor charge
    const quarkGlowColors = ['rgba(255,51,102,0.6)', 'rgba(51,255,136,0.6)', 'rgba(51,136,255,0.6)'];

    const quarks = quarkColors.map((col, i) => {
      const geo  = new THREE.SphereGeometry(QUARK_R, 32, 32);
      const mat  = new THREE.MeshPhongMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.7,
        shininess: 120,
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / 3) * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * ORBIT_R,
        Math.sin(angle) * ORBIT_R * 0.4,
        Math.sin(angle) * ORBIT_R * 0.6
      );
      scene.add(mesh);
      return { mesh, angle, baseAngle: angle, col };
    });

    // Attach point lights to quarks
    ptLight1.position.copy(quarks[0].mesh.position);
    ptLight2.position.copy(quarks[1].mesh.position);
    ptLight3.position.copy(quarks[2].mesh.position);

    // ── Gluon tube geometry (as cylinder between quarks) ──
    function makeTube(v1, v2) {
      const dir = new THREE.Vector3().subVectors(v2, v1);
      const len = dir.length();
      const geo = new THREE.CylinderGeometry(0.04, 0.04, len, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
      });
      const mesh = new THREE.Mesh(geo, mat);
      // Position at midpoint
      mesh.position.copy(v1).lerp(v2, 0.5);
      // Orient along direction
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.normalize()
      );
      scene.add(mesh);
      return mesh;
    }

    const tubes = [
      makeTube(quarks[0].mesh.position, quarks[1].mesh.position),
      makeTube(quarks[1].mesh.position, quarks[2].mesh.position),
      makeTube(quarks[2].mesh.position, quarks[0].mesh.position),
    ];

    function updateTube(tube, v1, v2) {
      const dir = new THREE.Vector3().subVectors(v2, v1);
      const len = dir.length();
      tube.scale.y = len;
      tube.position.copy(v1).lerp(v2, 0.5);
      tube.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      );
    }

    // ── Star field ─────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for (let i = 0; i < 600; i++) {
      starVerts.push(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 60 - 20
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── Central nucleus glow ──────────────────────────────
    const nucleusGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const nucleusMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
    scene.add(new THREE.Mesh(nucleusGeo, nucleusMat));

    // ── Mouse interaction ─────────────────────────────────
    const mouse = { x: 0, y: 0, active: false };
    const heroSection = canvas.closest('section') || document.getElementById('home');
    if (heroSection) {
      heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
        mouse.y = -((e.clientY - rect.top)  / rect.height - 0.5) * 2;
        mouse.active = true;
      }, { passive: true });
      heroSection.addEventListener('mouseleave', () => { mouse.active = false; });
      heroSection.addEventListener('click', () => {
        // Scatter quarks on click
        quarks.forEach(q => {
          q.scattered = true;
          q.scatterT  = 0;
          q.scatterVel = {
            x: (Math.random() - 0.5) * 0.3,
            y: (Math.random() - 0.5) * 0.2,
            z: (Math.random() - 0.5) * 0.2,
          };
        });
      });
    }

    // ── Resize handling ───────────────────────────────────
    window.addEventListener('resize', () => {
      const nW = canvas.clientWidth  || window.innerWidth;
      const nH = canvas.clientHeight || window.innerHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    });

    // ── Animation loop ────────────────────────────────────
    let t = 0;
    const BASE_SPEED = 0.004;

    function animate() {
      requestAnimationFrame(animate);
      t += BASE_SPEED;

      quarks.forEach((q, i) => {
        if (q.scattered) {
          // Scatter phase
          q.mesh.position.x += q.scatterVel.x;
          q.mesh.position.y += q.scatterVel.y;
          q.mesh.position.z += q.scatterVel.z;
          q.scatterT++;
          if (q.scatterT > 55) { q.scattered = false; }
        } else {
          // Normal orbit
          const angle = q.baseAngle + t * (1 + i * 0.15);
          // Mouse influence: tilt the orbit plane
          const mx = mouse.active ? mouse.x * 0.8 : 0;
          const my = mouse.active ? mouse.y * 0.8 : 0;
          q.mesh.position.set(
            Math.cos(angle) * ORBIT_R,
            Math.sin(angle) * ORBIT_R * 0.38 + my * 1.2,
            Math.sin(angle) * ORBIT_R * 0.65 + mx * 1.2
          );
        }

        // Pulse emissive
        q.mesh.material.emissiveIntensity = 0.55 + 0.25 * Math.sin(t * 3 + i * 2.1);
      });

      // Update lights to quark positions
      ptLight1.position.copy(quarks[0].mesh.position);
      ptLight2.position.copy(quarks[1].mesh.position);
      ptLight3.position.copy(quarks[2].mesh.position);

      // Vary gluon tube opacity (flux tube pulsing = confinement)
      tubes.forEach((tube, i) => {
        tube.material.opacity = 0.10 + 0.16 * Math.abs(Math.sin(t * 2 + i * 1.3));
      });

      // Update tube geometry
      updateTube(tubes[0], quarks[0].mesh.position, quarks[1].mesh.position);
      updateTube(tubes[1], quarks[1].mesh.position, quarks[2].mesh.position);
      updateTube(tubes[2], quarks[2].mesh.position, quarks[0].mesh.position);

      // Slow camera drift
      camera.position.x = Math.sin(t * 0.18) * 1.5;
      camera.position.y = Math.cos(t * 0.12) * 0.8;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    animate();
  }
})();

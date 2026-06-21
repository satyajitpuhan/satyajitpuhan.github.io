/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WORLD-CLASS.JS  —  Satyajit Puhan Portfolio  —  Ultimate Interaction Engine
 * Features:
 *   1. WebGL Quantum Field Shader (hero background)
 *   2. 3D Holographic Card Tilt
 *   3. Scroll Velocity Skew System
 *   4. Magnetic Typography
 *   5. Advanced Cursor Particle Trail
 *   6. Smooth Scroll with Velocity Damping
 *   7. Spring Physics Reveal System
 *   8. Constellation Network (collaborators)
 *   9. Morphing Section Dividers
 *  ═══════════════════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersContrast = window.matchMedia('(prefers-contrast: more)').matches;

  /* ════════════════════════════════════════════
     1. WEBGL QUANTUM FIELD SHADER
     A real-time gravitational / quantum field
     simulation using fragment shader math.
  ════════════════════════════════════════════ */
  function initQuantumField() {
    if (isMobile || prefersReducedMotion) return;

    const canvas = document.getElementById('wc-quantum-canvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const vertexSrc = `
      attribute vec2 a_pos;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const fragmentSrc = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_intensity;

      // Simplex noise helpers
      vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                        + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                 dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float fbm(vec2 p) {
        float sum = 0.0;
        float amp = 0.5;
        float freq = 1.0;
        for (int i = 0; i < 5; i++) {
          sum += amp * snoise(p * freq);
          freq *= 2.0;
          amp *= 0.5;
        }
        return sum;
      }

      float quantumField(vec2 uv, float t) {
        vec2 p = uv * 3.0;
        float n1 = fbm(p + vec2(t * 0.15, t * 0.1));
        float n2 = fbm(p * 1.5 - vec2(t * 0.1, t * 0.15));
        float n3 = fbm(p * 0.5 + vec2(t * 0.08, -t * 0.12));
        return (n1 + n2 * 0.5 + n3 * 0.25) / 1.75;
      }

      float gravitationalLens(vec2 uv, vec2 center, float strength) {
        vec2 dir = uv - center;
        float dist = length(dir);
        float lens = strength / (dist + 0.1);
        return lens * 0.02;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 suv = (uv - 0.5) * aspect;

        // Mouse interaction (normalized 0-1)
        vec2 mouse = (u_mouse - 0.5) * aspect;

        float t = u_time * 0.3;

        // Gravitational lens at mouse position
        float lens = gravitationalLens(suv, mouse, 0.5);

        // Quantum field
        float field = quantumField(suv + lens, t);

        // Color palette: amber, teal, rose, violet
        vec3 amber = vec3(0.91, 0.64, 0.27);
        vec3 teal  = vec3(0.18, 0.77, 0.71);
        vec3 rose  = vec3(0.88, 0.36, 0.48);
        vec3 violet = vec3(0.55, 0.36, 0.97);
        vec3 deep  = vec3(0.02, 0.035, 0.067);

        // Field colors
        float f1 = smoothstep(-0.5, 0.5, field);
        float f2 = smoothstep(0.0, 0.8, field + snoise(suv * 2.0 + t * 0.2) * 0.3);
        float f3 = smoothstep(-0.2, 0.6, field + snoise(suv * 3.0 - t * 0.15) * 0.2);

        vec3 col = deep;
        col = mix(col, violet * 0.3, f1 * 0.4);
        col = mix(col, teal * 0.35, f2 * 0.35);
        col = mix(col, amber * 0.4, f3 * 0.3);
        col = mix(col, rose * 0.25, (1.0 - f2) * 0.2);

        // Add subtle glow around mouse
        float mouseDist = length(suv - mouse);
        float mouseGlow = exp(-mouseDist * 3.0) * 0.15;
        col += teal * mouseGlow;

        // Add bright filaments
        float filament = abs(sin(field * 6.0 + t * 2.0));
        filament = pow(filament, 8.0);
        col += mix(amber, teal, snoise(suv + t * 0.1)) * filament * 0.15 * u_intensity;

        // Vignette
        float vign = 1.0 - smoothstep(0.3, 1.2, length(suv));
        col *= 0.6 + vign * 0.4;

        // Output with alpha for blending
        float alpha = 0.85 + field * 0.15;
        gl_FragColor = vec4(col, alpha);
      }
    `;

    function createShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    const vs = createShader(gl.VERTEX_SHADER, vertexSrc);
    const fs = createShader(gl.FRAGMENT_SHADER, fragmentSrc);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uIntensity = gl.getUniformLocation(program, 'u_intensity');

    let mouseX = 0.5, mouseY = 0.5;
    let targetMouseX = 0.5, targetMouseY = 0.5;
    let canvasVisible = true;

    // Track mouse with lerp
    const heroSection = document.getElementById('home');
    if (heroSection) {
      heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        targetMouseX = (e.clientX - rect.left) / rect.width;
        targetMouseY = 1.0 - (e.clientY - rect.top) / rect.height;
      }, { passive: true });
      heroSection.addEventListener('mouseleave', () => {
        targetMouseX = 0.5;
        targetMouseY = 0.5;
      });
    }

    // Visibility observer
    const visObserver = new IntersectionObserver((entries) => {
      canvasVisible = entries[0].isIntersecting;
    }, { threshold: 0 });
    visObserver.observe(canvas);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    let startTime = performance.now();
    let frameCount = 0;

    function render() {
      if (!canvasVisible) {
        requestAnimationFrame(render);
        return;
      }

      // Lerp mouse
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const elapsed = (performance.now() - startTime) / 1000;
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.uniform1f(uIntensity, 1.0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }

  /* ════════════════════════════════════════════
     2. 3D HOLOGRAPHIC CARD TILT
  ════════════════════════════════════════════ */
  function init3DCards() {
    if (isMobile || prefersReducedMotion) return;

    const cards = document.querySelectorAll('.wc-3d-card');
    if (!cards.length) return;

    cards.forEach(card => {
      const wrap = card.closest('.wc-3d-card-wrap') || card.parentElement;
      if (!wrap) return;
      wrap.style.perspective = '1200px';

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const rotateX = (y - 0.5) * -8; // -4 to 4 deg
        const rotateY = (x - 0.5) * 8;  // -4 to 4 deg

        card.style.setProperty('--wc-rotate-x', rotateX + 'deg');
        card.style.setProperty('--wc-rotate-y', rotateY + 'deg');
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        // Update shine position
        card.style.setProperty('--wc-shine-x', (x * 100) + '%');
        card.style.setProperty('--wc-shine-y', (y * 100) + '%');
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        card.style.setProperty('--wc-shine-x', '50%');
        card.style.setProperty('--wc-shine-y', '50%');
      });
    });
  }

  /* ════════════════════════════════════════════
     3. SCROLL VELOCITY SKEW SYSTEM
  ════════════════════════════════════════════ */
  function initScrollVelocity() {
    if (isMobile || prefersReducedMotion) return;

    const elements = document.querySelectorAll('.wc-velocity-skew');
    if (!elements.length) return;

    let lastScrollY = window.scrollY;
    let velocity = 0;
    let targetVelocity = 0;
    let ticking = false;

    function update() {
      // Smooth damping
      velocity += (targetVelocity - velocity) * 0.15;

      const skew = Math.max(-3, Math.min(3, velocity * 0.08));
      const scaleY = 1 + Math.abs(velocity) * 0.0003;

      elements.forEach(el => {
        el.style.transform = `skewY(${skew}deg) scaleY(${scaleY})`;
      });

      if (Math.abs(velocity) > 0.01) {
        requestAnimationFrame(update);
      } else {
        ticking = false;
        elements.forEach(el => {
          el.style.transform = 'skewY(0deg) scaleY(1)';
        });
      }
    }

    window.addEventListener('scroll', () => {
      const currentY = window.scrollY;
      targetVelocity = currentY - lastScrollY;
      lastScrollY = currentY;

      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }

      // Reset target velocity after scroll stops
      clearTimeout(window._scrollTimeout);
      window._scrollTimeout = setTimeout(() => {
        targetVelocity = 0;
      }, 150);
    }, { passive: true });
  }

  /* ════════════════════════════════════════════
     4. MAGNETIC TYPOGRAPHY
  ════════════════════════════════════════════ */
  function initMagneticText() {
    if (isMobile) return;

    const elements = document.querySelectorAll('.wc-magnetic-text');
    if (!elements.length) return;

    const RADIUS = 150;
    const STRENGTH = 0.3;

    elements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < RADIUS) {
          const force = (1 - dist / RADIUS) * STRENGTH;
          el.style.transform = `translate(${dx * force}px, ${dy * force}px)`;
        }
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ════════════════════════════════════════════
     5. ADVANCED CURSOR PARTICLE TRAIL
  ════════════════════════════════════════════ */
  function initCursorParticles() {
    if (isMobile || prefersReducedMotion) return;

    const container = document.createElement('div');
    container.className = 'wc-particle-trail';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);

    const particles = [];
    const MAX_PARTICLES = 30;
    const COLORS = ['#e8a444', '#2ec4b6', '#e05c7a', '#8b5cf6'];

    let mx = -100, my = -100;
    let lastMX = -100, lastMY = -100;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;

      // Spawn particles on movement
      const dist = Math.sqrt((mx - lastMX) ** 2 + (my - lastMY) ** 2);
      if (dist > 5) {
        spawnParticle(mx, my);
        lastMX = mx;
        lastMY = my;
      }
    }, { passive: true });

    function spawnParticle(x, y) {
      if (particles.length >= MAX_PARTICLES) {
        const old = particles.shift();
        if (old.el) old.el.remove();
      }

      const el = document.createElement('div');
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = Math.random() * 4 + 2;

      el.style.cssText = `
        position: fixed;
        left: 0; top: 0;
        width: ${size}px; height: ${size}px;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 0 ${size * 2}px ${color};
        pointer-events: none;
        z-index: 9997;
        opacity: 0.8;
        will-change: transform, opacity;
      `;
      container.appendChild(el);

      particles.push({
        el: el,
        x: x, y: y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.015
      });
    }

    function animateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.vy += 0.03; // gravity

        if (p.life <= 0) {
          p.el.remove();
          particles.splice(i, 1);
          continue;
        }

        p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        p.el.style.opacity = p.life * 0.8;
      }

      // Draw connections between nearby particles
      drawConnections();

      requestAnimationFrame(animateParticles);
    }

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9996;';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function drawConnections() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (particles.length < 3) return;

      const maxDist = 100;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.15 * Math.min(particles[i].life, particles[j].life);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(232, 164, 68, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    requestAnimationFrame(animateParticles);
  }

  /* ════════════════════════════════════════════
     6. SMOOTH SCROLL WITH VELOCITY DAMPING
  ════════════════════════════════════════════ */
  function initSmoothScrollV2() {
    if (prefersReducedMotion || isMobile) return;

    // Check if ultra-engine already has smooth scroll
    if (window.__ultraEngineLoaded) return;

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let velocity = 0;
    let isScrolling = false;
    const ease = 0.075;
    const velocityDamping = 0.85;

    function smoothLoop() {
      const diff = targetY - currentY;
      velocity = diff * ease;
      currentY += velocity;

      if (Math.abs(diff) < 0.5 && Math.abs(velocity) < 0.1) {
        currentY = targetY;
        isScrolling = false;
        return;
      }

      window.scrollTo(0, currentY);
      requestAnimationFrame(smoothLoop);
    }

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const rect = target.getBoundingClientRect();
      targetY = window.scrollY + rect.top - 80;
      if (!isScrolling) {
        isScrolling = true;
        smoothLoop();
      }
    });

    window.addEventListener('scroll', () => {
      if (!isScrolling) {
        targetY = window.scrollY;
        currentY = window.scrollY;
      }
    }, { passive: true });
  }

  /* ════════════════════════════════════════════
     7. SPRING PHYSICS REVEAL SYSTEM
  ════════════════════════════════════════════ */
  function initSpringReveals() {
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('visible');
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

    document.querySelectorAll('.wc-scroll-reveal, .wc-scroll-reveal-scale, .wc-scroll-reveal-left, .wc-scroll-reveal-right, .wc-reveal-clip, .wc-reveal-clip-right').forEach(el => {
      observer.observe(el);
    });
  }

  /* ════════════════════════════════════════════
     8. CONSTELLATION NETWORK (Collaborators)
  ════════════════════════════════════════════ */
  function initConstellationNetwork() {
    const canvas = document.getElementById('wc-constellation-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes = [];
    const NODE_COUNT = 40;
    const CONNECTION_DIST = 120;
    const MOUSE_DIST = 150;

    let mouseX = -1000, mouseY = -1000;

    function resize() {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Initialize nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
        color: ['#e8a444', '#2ec4b6', '#e05c7a', '#8b5cf6'][Math.floor(Math.random() * 4)]
      });
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => {
      mouseX = -1000;
      mouseY = -1000;
    });

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Mouse repulsion
        const dx = node.x - mouseX;
        const dy = node.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST) {
          const force = (MOUSE_DIST - dist) / MOUSE_DIST * 0.5;
          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;
        }

        // Damping
        node.vx *= 0.99;
        node.vy *= 0.99;

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = node.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.2;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(232, 164, 68, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    // Visibility check
    const visObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animate();
      }
    });
    visObserver.observe(canvas);
  }

  /* ════════════════════════════════════════════
     9. MORPHING SECTION DIVIDERS
  ════════════════════════════════════════════ */
  function initMorphDividers() {
    const dividers = document.querySelectorAll('.wc-morph-divider svg path');
    if (!dividers.length) return;

    const shapes = [
      'M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z',
      'M0,20 C480,50 960,10 1440,40 L1440,60 L0,60 Z',
      'M0,40 C360,10 1080,50 1440,20 L1440,60 L0,60 Z',
      'M0,30 C240,50 720,10 1080,30 C1200,40 1320,20 1440,30 L1440,60 L0,60 Z'
    ];

    dividers.forEach((path, i) => {
      const shapeIndex = i % shapes.length;
      // Animate between shapes on scroll
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          path.setAttribute('d', shapes[(shapeIndex + 1) % shapes.length]);
        }
      }, { threshold: 0.5 });
      observer.observe(path.closest('.wc-morph-divider'));
    });
  }

  /* ════════════════════════════════════════════
     10. PARALLAX LAYERS v2
  ════════════════════════════════════════════ */
  function initParallaxV2() {
    if (prefersReducedMotion || isMobile) return;

    const slowElements = document.querySelectorAll('.wc-parallax-slow');
    const fastElements = document.querySelectorAll('.wc-parallax-fast');

    let ticking = false;

    function update() {
      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;

      slowElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const offset = (elCenter - viewportH / 2) * 0.05;
        el.style.transform = `translateY(${offset}px)`;
      });

      fastElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const offset = (elCenter - viewportH / 2) * 0.15;
        el.style.transform = `translateY(${offset}px)`;
      });

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ════════════════════════════════════════════
     11. PAGE TRANSITION SYSTEM
  ════════════════════════════════════════════ */
  function initPageTransition() {
    if (!document.startViewTransition) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'wc-page-transition';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        overlay.classList.add('active');
        setTimeout(() => {
          document.startViewTransition(() => {
            window.location.href = href;
          });
        }, 400);
      });
    });
  }

  /* ════════════════════════════════════════════
     12. ENHANCED LOADING SCREEN
  ════════════════════════════════════════════ */
  function initLoadingV2() {
    const screen = document.getElementById('ae-loading-screen');
    if (!screen) return;

    // Replace spinner with world-class version
    const spinner = screen.querySelector('.ae-loading-spinner');
    if (spinner) {
      spinner.outerHTML = '<div class="wc-loading-ring"></div>';
    }

    // Orchestrate hide
    window.addEventListener('load', () => {
      setTimeout(() => {
        screen.classList.add('done');
        // Trigger page transition reveal
        setTimeout(() => {
          document.body.dispatchEvent(new CustomEvent('wc-loaded'));
        }, 600);
      }, 800);
    });

    // Fallback
    setTimeout(() => {
      screen && screen.classList.add('done');
    }, 5000);
  }

  /* ════════════════════════════════════════════
     13. TEXT SPLITTER (for kinetic reveals)
  ════════════════════════════════════════════ */
  function initTextSplitter() {
    const elements = document.querySelectorAll('.wc-split-text');
    if (!elements.length) return;

    elements.forEach(el => {
      const text = el.textContent;
      el.innerHTML = '';
      el.style.display = 'inline-block';

      text.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        span.style.transition = `transform 0.6s var(--ease) ${i * 30}ms, opacity 0.6s var(--ease) ${i * 30}ms`;
        span.style.opacity = '0';
        span.style.transform = 'translateY(20px)';
        el.appendChild(span);
      });

      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          el.querySelectorAll('span').forEach(span => {
            span.style.opacity = '1';
            span.style.transform = 'translateY(0)';
          });
          observer.unobserve(el);
        }
      }, { threshold: 0.5 });
      observer.observe(el);
    });
  }

  /* ════════════════════════════════════════════
     14. AUTO-ENHANCE EXISTING ELEMENTS
  ════════════════════════════════════════════ */
  function autoEnhanceWorldClass() {
    // Add 3D card to publication/research cards
    document.querySelectorAll('.research-card, .portfolio-item, .ae-skill-gauge-card').forEach(card => {
      if (!card.classList.contains('wc-3d-card')) {
        card.classList.add('wc-3d-card');
        const parent = card.parentElement;
        if (parent && !parent.classList.contains('wc-3d-card-wrap')) {
          parent.classList.add('wc-3d-card-wrap');
        }
      }
    });

    // Add velocity skew to sections
    document.querySelectorAll('section').forEach(sec => {
      if (!sec.classList.contains('wc-velocity-skew')) {
        sec.classList.add('wc-velocity-skew');
      }
    });

    // Add kinetic title to section headers
    document.querySelectorAll('.section h1, .section h2, .about_header h2').forEach(h => {
      if (!h.classList.contains('wc-kinetic-title')) {
        h.classList.add('wc-kinetic-title');
      }
    });

    // Add scroll reveal to content blocks
    document.querySelectorAll('.section .row, .about_header, .service-content').forEach(el => {
      if (!el.classList.contains('wc-scroll-reveal') && !el.classList.contains('wc-scroll-reveal-scale')) {
        el.classList.add('wc-scroll-reveal');
      }
    });

    // Add shine sweep to CTA buttons
    document.querySelectorAll('.hire_button, .btn-hero, .ae-glow-pulse').forEach(btn => {
      if (!btn.classList.contains('wc-shine-sweep')) {
        btn.classList.add('wc-shine-sweep');
      }
    });

    // Add iridescent to glass containers
    document.querySelectorAll('.ae-glass, .ae-glass-strong').forEach(el => {
      if (!el.classList.contains('wc-iridescent')) {
        el.classList.add('wc-iridescent');
      }
    });
  }

  /* ════════════════════════════════════════════
     INITIALIZATION
  ════════════════════════════════════════════ */
  function init() {
    autoEnhanceWorldClass();
    initLoadingV2();
    initQuantumField();
    init3DCards();
    initScrollVelocity();
    initMagneticText();
    initCursorParticles();
    initSmoothScrollV2();
    initSpringReveals();
    initConstellationNetwork();
    initMorphDividers();
    initParallaxV2();
    initPageTransition();
    initTextSplitter();
    window.__worldClassLoaded = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

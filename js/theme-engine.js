/**
 * theme-engine.js
 * Implements a Quantum Phase Transition toggle for Light/Dark mode.
 */
(function() {
    'use strict';
  
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('ae-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentTheme = savedTheme ? savedTheme : (prefersDark ? 'dark' : 'light');
    
    const root = document.documentElement;
    
    function applyTheme(theme) {
      if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
        document.getElementById('theme-icon-dark').style.display = 'none';
        document.getElementById('theme-icon-light').style.display = 'block';
      } else {
        root.removeAttribute('data-theme');
        document.getElementById('theme-icon-dark').style.display = 'block';
        document.getElementById('theme-icon-light').style.display = 'none';
      }
      localStorage.setItem('ae-theme', theme);
    }
  
    // Initial apply (without animation)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => applyTheme(currentTheme));
    } else {
      applyTheme(currentTheme);
    }
  
    // The Phase Transition effect
    function toggleTheme(e) {
      const isDark = (currentTheme === 'dark');
      const nextTheme = isDark ? 'light' : 'dark';
      
      // Calculate click position for the expanding circle
      const x = e.clientX;
      const y = e.clientY;
      const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  
      // If the View Transitions API is supported, use it for a native, smooth clip-path animation
      if (document.startViewTransition) {
        const transition = document.startViewTransition(() => {
          currentTheme = nextTheme;
          applyTheme(currentTheme);
        });
        
        transition.ready.then(() => {
          document.documentElement.animate(
            [
              { clipPath: `circle(0px at ${x}px ${y}px)` },
              { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }
            ],
            {
              duration: 500,
              easing: 'ease-out',
              pseudoElement: '::view-transition-new(root)'
            }
          );
        });
      } else {
        // Fallback for browsers that don't support View Transitions
        currentTheme = nextTheme;
        applyTheme(currentTheme);
      }
    }
  
    // Attach listener
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const toggleBtn = document.getElementById('quantum-theme-toggle');
        if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);
      });
    } else {
      const toggleBtn = document.getElementById('quantum-theme-toggle');
      if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);
    }
  })();
  

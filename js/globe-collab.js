/**
 * globe-collab.js - 3D Collaboration Map
 * Renders an interactive WebGL globe with glowing arcs between institutions.
 * Requires: globe.gl (loaded via CDN)
 */
(function() {
    'use strict';
  
    // Coordinates for key institutions
    const locs = {
      taiwan: { lat: 25.0410, lng: 121.6146, name: 'Academia Sinica, Taiwan', color: '#10b981' },
      india: { lat: 31.3959, lng: 75.5358, name: 'NIT Jalandhar, India', color: '#06b6d4' },
      russia: { lat: 56.7441, lng: 37.1970, name: 'JINR Dubna, Russia', color: '#f43f5e' },
      cern: { lat: 46.2333, lng: 6.0500, name: 'CERN, Switzerland', color: '#f59e0b' }
    };
  
    const arcsData = [
      { startLat: locs.taiwan.lat, startLng: locs.taiwan.lng, endLat: locs.india.lat, endLng: locs.india.lng, color: [locs.taiwan.color, locs.india.color] },
      { startLat: locs.india.lat, startLng: locs.india.lng, endLat: locs.russia.lat, endLng: locs.russia.lng, color: [locs.india.color, locs.russia.color] },
      { startLat: locs.india.lat, startLng: locs.india.lng, endLat: locs.cern.lat, endLng: locs.cern.lng, color: [locs.india.color, locs.cern.color] },
      { startLat: locs.russia.lat, startLng: locs.russia.lng, endLat: locs.taiwan.lat, endLng: locs.taiwan.lng, color: [locs.russia.color, locs.taiwan.color] }
    ];
  
    const ringsData = Object.values(locs);
  
    function initGlobe() {
      const container = document.getElementById('globe-container');
      if (!container) return;
      if (!window.Globe) {
        // Retry if globe.gl hasn't loaded yet
        setTimeout(initGlobe, 200);
        return;
      }
  
      // Initialize globe
      const myGlobe = Globe()
        (container)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
        .backgroundColor('rgba(0,0,0,0)') // Transparent bg
        .width(container.clientWidth)
        .height(container.clientHeight)
        // Add arcs
        .arcsData(arcsData)
        .arcColor('color')
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2000)
        .arcStroke(1.5)
        // Add pulsing rings at locations
        .ringsData(ringsData)
        .ringColor('color')
        .ringMaxRadius(3.5)
        .ringPropagationSpeed(3)
        .ringRepeatPeriod(700)
        // Labels
        .labelsData(ringsData)
        .labelLat(d => d.lat)
        .labelLng(d => d.lng)
        .labelText(d => d.name)
        .labelSize(1.5)
        .labelDotRadius(0.5)
        .labelColor(() => 'rgba(255, 255, 255, 0.8)')
        .labelResolution(2);
  
      // Set initial camera view centered roughly over Asia
      myGlobe.pointOfView({ lat: 35, lng: 90, altitude: 2 }, 1000);
  
      // Auto-rotate
      myGlobe.controls().autoRotate = true;
      myGlobe.controls().autoRotateSpeed = 1.2;
      // Disable zoom so scroll doesn't get stuck on the globe
      myGlobe.controls().enableZoom = false;
  
      // Resize observer
      window.addEventListener('resize', () => {
        myGlobe.width(container.clientWidth);
        myGlobe.height(container.clientHeight);
      });
    }
  
    // Trigger initialization when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initGlobe);
    } else {
      initGlobe();
    }
  })();
  

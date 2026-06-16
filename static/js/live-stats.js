/**
 * live-stats.js
 * Fetches real-time publication stats from Inspire-HEP.
 * Gracefully falls back to cached/approximate values if the API fails.
 */
(function() {
    'use strict';
  
    // Fallback data in case the API rate limits or fails
    const FALLBACK_DATA = {
      citations: 176,
      hindex: 7,
      papers: 41
    };
  
    async function fetchInspireStats() {
      const citeEl = document.getElementById('inspire-citations');
      const hindexEl = document.getElementById('inspire-hindex');
      const papersEl = document.getElementById('inspire-papers');
  
      if (!citeEl || !hindexEl || !papersEl) return;
  
      try {
        // Query Inspire-HEP using exact author recid to avoid false matches
        // (e.g. NOvA collaboration papers from a different "Puhan")
        const response = await fetch('https://inspirehep.net/api/literature?q=a+Satyajit.Puhan.1&size=250');
        if (!response.ok) throw new Error('API response not ok');
        
        const data = await response.json();
        const papers = data.hits.total;
        
        // Sum up citations
        let totalCitations = 0;
        let citationsArray = [];
        if (data.hits.hits) {
          data.hits.hits.forEach(hit => {
            const citeCount = hit.metadata.citation_count || 0;
            totalCitations += citeCount;
            if (citeCount > 0) citationsArray.push(citeCount);
          });
        }
  
        // Calculate h-index
        citationsArray.sort((a, b) => b - a);
        let hindex = 0;
        for (let i = 0; i < citationsArray.length; i++) {
          if (citationsArray[i] >= i + 1) {
            hindex = i + 1;
          } else {
            break;
          }
        }
  
        // Animate numbers
        animateValue(citeEl, 0, totalCitations > 0 ? totalCitations : FALLBACK_DATA.citations, 1500);
        animateValue(hindexEl, 0, hindex > 0 ? hindex : FALLBACK_DATA.hindex, 1500);
        animateValue(papersEl, 0, papers > 0 ? papers : FALLBACK_DATA.papers, 1500);
  
      } catch (e) {
        console.warn('Inspire-HEP live fetch failed. Using fallback stats.', e);
        animateValue(citeEl, 0, FALLBACK_DATA.citations, 1500);
        animateValue(hindexEl, 0, FALLBACK_DATA.hindex, 1500);
        animateValue(papersEl, 0, FALLBACK_DATA.papers, 1500);
      }
    }
  
    // Helper function to animate counting up
    function animateValue(obj, start, end, duration) {
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // ease out quad
        const easeProgress = progress * (2 - progress);
        obj.innerHTML = Math.floor(easeProgress * (end - start) + start);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          obj.innerHTML = end; // Ensure exact final value
        }
      };
      window.requestAnimationFrame(step);
    }
  
    // Run fetch when DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fetchInspireStats);
    } else {
      fetchInspireStats();
    }
  })();
  

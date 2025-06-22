/**
 * iOS Safari-specific fixes
 * This script addresses common iOS Safari compatibility issues
 */

(function() {
    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (!isIOS) return; // Only run on iOS devices
    
    // Add iOS indicator class
    document.documentElement.classList.add('ios');
    
    // Fix for 100vh issue in iOS Safari
    function fixIOSHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Apply to main elements
        const app = document.getElementById('app');
        if (app) {
            app.style.height = `calc(var(--vh, 1vh) * 100)`;
            app.style.minHeight = `calc(var(--vh, 1vh) * 100)`;
        }
    }
    
    // Fix viewport issues
    window.addEventListener('resize', fixIOSHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(fixIOSHeight, 100); // Delay needed for iOS
    });
    
    // Run on page load
    document.addEventListener('DOMContentLoaded', fixIOSHeight);
    
    // Fix input focus issues
    document.addEventListener('touchstart', function(e) {
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'TEXTAREA' || 
            e.target.tagName === 'SELECT') {
            // Nothing needed here, just ensuring the focus works
        }
    }, false);
    
    // Fix for double-tap zoom
    let lastTapTime = 0;
    document.addEventListener('touchend', function(e) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        
        if (tapLength < 500 && tapLength > 0) {
            e.preventDefault();
            return false;
        }
        
        lastTapTime = currentTime;
    });
    
    // Force redraw on orientation change to fix layout issues
    window.addEventListener('orientationchange', function() {
        // Trick to force a repaint
        document.body.style.display = 'none';
        // Accessing offsetHeight forces a repaint
        document.body.offsetHeight;
        document.body.style.display = ''; 
    });
    
    // Fix for position fixed elements in iOS
    window.addEventListener('scroll', function() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
            // At bottom of page - fix for iOS keyboard behavior
            document.documentElement.classList.add('at-bottom');
        } else {
            document.documentElement.classList.remove('at-bottom');
        }
    });
    
    console.log("iOS compatibility fixes applied");
})(); 
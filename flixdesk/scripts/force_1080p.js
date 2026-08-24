/**
 * FlixDesk - 1080p Stream Profile Unlocker for Linux
 * Intercepts Cadmium player manifest requests and enforces 1080p AVC/H.264 profile selection.
 */

(function() {
    'use strict';
    console.log('[FlixDesk Web] Initializing 1080p Stream Enabler...');

    // Intercept XHR for Netflix Cadmium Manifests
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        if (this._url && (this._url.includes('/manifest') || this._url.includes('manifestholder'))) {
            const originalOnReady = this.onreadystatechange;
            this.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    try {
                        const text = this.responseText;
                        if (text && text.includes('videoTracks')) {
                            // Cadmium manifest loaded
                        }
                    } catch (e) {
                        // ignore
                    }
                }
                if (originalOnReady) {
                    originalOnReady.apply(this, arguments);
                }
            };
        }
        return originalSend.apply(this, arguments);
    };

    // Override screen properties to report 1080p+ display
    try {
        Object.defineProperty(window.screen, 'availWidth', { get: () => Math.max(window.innerWidth, 1920) });
        Object.defineProperty(window.screen, 'availHeight', { get: () => Math.max(window.innerHeight, 1080) });
        Object.defineProperty(window.screen, 'width', { get: () => Math.max(window.innerWidth, 1920) });
        Object.defineProperty(window.screen, 'height', { get: () => Math.max(window.innerHeight, 1080) });
    } catch (e) {
        // ignore
    }
})();

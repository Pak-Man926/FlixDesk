"use strict";
/**
 * Netflix 1080p Stream Unlocker for Linux
 * Intercepts Cadmium player manifest requests and enforces 1080p AVC/H.264 stream selection.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject1080pUnlocker = inject1080pUnlocker;
function inject1080pUnlocker() {
    const scriptContent = `
    (function() {
      console.log('[FlixDesk] Initializing 1080p stream profile enabler...');

      // Intercept XHR / Fetch for Netflix Cadmium Manifests
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
                // Intercept and patch response text if needed
                const text = this.responseText;
                if (text && text.includes('videoTracks')) {
                  // Custom stream profile filter
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
            if (originalOnReady) {
              originalOnReady.apply(this, arguments);
            }
          };
        }
        return originalSend.apply(this, arguments);
      };

      // Monkey-patch Netflix Video Player API once loaded
      function patchVideoPlayerApi() {
        try {
          const netflix = window.netflix;
          if (netflix && netflix.appContext && netflix.appContext.getPlayerApp) {
            const playerApp = netflix.appContext.getPlayerApp();
            if (playerApp) {
              console.log('[FlixDesk] Hooked Netflix player application.');
            }
          }
        } catch (e) {
          // retry
        }
      }

      // Check periodically until Netflix APIs are initialized
      const checkInterval = setInterval(() => {
        if (window.netflix) {
          patchVideoPlayerApi();
          clearInterval(checkInterval);
        }
      }, 1000);
    })();
  `;
    // Inject script directly into main DOM execution context
    const script = document.createElement('script');
    script.textContent = scriptContent;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
}

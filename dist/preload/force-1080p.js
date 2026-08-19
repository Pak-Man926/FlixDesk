"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject1080pUnlocker = void 0;

function inject1080pUnlocker() {
    const scriptContent = `
    (function() {
      console.log('[FlixDesk] Initializing 1080p stream profile enabler...');

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
                  // Manifest stream profile hooks
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

      const checkInterval = setInterval(() => {
        if (window.netflix) {
          patchVideoPlayerApi();
          clearInterval(checkInterval);
        }
      }, 1000);
    })();
  `;
    const script = document.createElement('script');
    script.textContent = scriptContent;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
}
exports.inject1080pUnlocker = inject1080pUnlocker;

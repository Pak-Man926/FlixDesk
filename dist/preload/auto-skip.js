"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoSkipper = void 0;
class AutoSkipper {
    observer = null;
    autoSkipIntro = true;
    autoSkipRecap = true;
    autoPlayNext = true;
    lastSkipTimestamp = 0;
    constructor() { }
    updateConfig(config) {
        if (config.autoSkipIntro !== undefined)
            this.autoSkipIntro = config.autoSkipIntro;
        if (config.autoSkipRecap !== undefined)
            this.autoSkipRecap = config.autoSkipRecap;
        if (config.autoPlayNext !== undefined)
            this.autoPlayNext = config.autoPlayNext;
    }
    start() {
        if (this.observer)
            return;
        this.observer = new MutationObserver(() => {
            this.checkAndSkip();
        });
        this.observer.observe(document.documentElement || document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-uia', 'style'],
        });
        console.log('[FlixDesk] Auto-skip observer started.');
    }
    checkAndSkip() {
        const now = Date.now();
        // Debounce checks to avoid rapid repeat clicks
        if (now - this.lastSkipTimestamp < 500)
            return;
        // 1. Skip Intro
        if (this.autoSkipIntro) {
            const skipIntroBtn = document.querySelector('[data-uia="player-skip-intro"], button[aria-label="Skip Intro"], .watch-video--skip-content-button');
            if (skipIntroBtn && this.isElementVisible(skipIntroBtn)) {
                const text = skipIntroBtn.innerText.toLowerCase();
                if (!text.includes('recap')) {
                    console.log('[FlixDesk] Auto-skipping Intro...');
                    skipIntroBtn.click();
                    this.lastSkipTimestamp = now;
                    return;
                }
            }
        }
        // 2. Skip Recap
        if (this.autoSkipRecap) {
            const skipRecapBtn = document.querySelector('[data-uia="player-skip-recap"], button[aria-label="Skip Recap"], .watch-video--skip-content-button');
            if (skipRecapBtn && this.isElementVisible(skipRecapBtn)) {
                console.log('[FlixDesk] Auto-skipping Recap...');
                skipRecapBtn.click();
                this.lastSkipTimestamp = now;
                return;
            }
        }
        // 3. Auto-play Next Episode
        if (this.autoPlayNext) {
            const nextEpBtn = document.querySelector('[data-uia="next-episode-seamless-button"], [data-uia="next-episode-seamless-button-draining"]');
            if (nextEpBtn && this.isElementVisible(nextEpBtn)) {
                console.log('[FlixDesk] Auto-playing Next Episode...');
                nextEpBtn.click();
                this.lastSkipTimestamp = now;
                return;
            }
        }
    }
    isElementVisible(el) {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }
    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}
exports.AutoSkipper = AutoSkipper;

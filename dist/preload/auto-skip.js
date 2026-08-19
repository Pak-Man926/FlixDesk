"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoSkipper = void 0;

class AutoSkipper {
    constructor() {
        this.observer = null;
        this.autoSkipIntro = true;
        this.autoSkipRecap = true;
        this.autoPlayNext = true;
        this.lastSkipTimestamp = 0;
    }
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
        if (now - this.lastSkipTimestamp < 500)
            return;
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
        if (this.autoSkipRecap) {
            const skipRecapBtn = document.querySelector('[data-uia="player-skip-recap"], button[aria-label="Skip Recap"], .watch-video--skip-content-button');
            if (skipRecapBtn && this.isElementVisible(skipRecapBtn)) {
                console.log('[FlixDesk] Auto-skipping Recap...');
                skipRecapBtn.click();
                this.lastSkipTimestamp = now;
                return;
            }
        }
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

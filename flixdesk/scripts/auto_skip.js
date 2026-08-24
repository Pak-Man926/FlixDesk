/**
 * FlixDesk - Auto Skip Controller (Intro, Recap, Next Episode)
 * Injected into Netflix DOM to detect and click player skip buttons instantly.
 */

(function() {
    'use strict';
    console.log('[FlixDesk Web] Initializing Smart Auto-Skip observer...');

    const SELECTORS = {
        skipIntro: [
            '[data-uia="player-skip-intro"]',
            '.watch-video--skip-content-button',
            '.nf-flat-button.nf-flat-button-uppercase',
        ],
        skipRecap: [
            '[data-uia="player-skip-recap"]',
            '.watch-video--skip-recap-button',
        ],
        nextEpisode: [
            '[data-uia="next-episode-seamless-button"]',
            '[data-uia="next-episode-seamless-button-draining"]',
            '.WatchNext-seamless-button',
        ],
    };

    function tryClickElement(selectorList) {
        for (const selector of selectorList) {
            try {
                const element = document.querySelector(selector);
                if (element && element.offsetParent !== null && !element.disabled) {
                    const text = (element.innerText || element.textContent || '').trim().toLowerCase();
                    // Don't click audio/subtitles by accident
                    if (text.includes('skip') || text.includes('intro') || text.includes('recap') || text.includes('next')) {
                        console.log(`[FlixDesk Auto-Skip] Auto-clicked: "${text}" (${selector})`);
                        element.click();
                        return true;
                    }
                }
            } catch (e) {
                // Ignore selector errors
            }
        }
        return false;
    }

    function checkAndSkip() {
        // 1. Check Skip Intro
        if (window.__flixdesk_skip_intro !== false) {
            if (tryClickElement(SELECTORS.skipIntro)) return;
        }

        // 2. Check Skip Recap
        if (window.__flixdesk_skip_recap !== false) {
            if (tryClickElement(SELECTORS.skipRecap)) return;
        }

        // 3. Check Next Episode Seamless Button
        if (window.__flixdesk_play_next !== false) {
            tryClickElement(SELECTORS.nextEpisode);
        }
    }

    // High frequency interval check
    setInterval(checkAndSkip, 400);

    // MutationObserver for instant DOM attachment detection
    const observer = new MutationObserver((mutations) => {
        checkAndSkip();
    });

    observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true,
    });
})();

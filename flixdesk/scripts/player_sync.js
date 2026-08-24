/**
 * FlixDesk - Netflix Player State Synchronizer
 * Extracts movie title, episode, duration, and playing state from the Netflix DOM.
 */

(function() {
    'use strict';

    function extractState() {
        const video = document.querySelector('video');
        if (!video) {
            return {
                playing: false,
                currentTime: 0,
                duration: 0,
                title: '',
                episode: '',
            };
        }

        let title = '';
        let episode = '';

        // Extract title & episode from player controls
        const titleEl = document.querySelector('[data-uia="video-title"]');
        if (titleEl) {
            const spans = titleEl.querySelectorAll('span');
            if (spans.length >= 2) {
                title = (spans[0].innerText || '').trim();
                episode = (spans[1].innerText || '').trim();
            } else {
                title = (titleEl.innerText || '').trim();
            }
        }

        if (!title) {
            title = document.title.replace(' - Netflix', '').trim();
        }

        return {
            playing: !video.paused && !video.ended,
            currentTime: video.currentTime || 0,
            duration: video.duration || 0,
            title: title || 'Netflix',
            episode: episode,
        };
    }

    // Expose state getter to Qt
    window.__flixdesk_get_player_state = extractState;
})();

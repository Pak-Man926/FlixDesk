"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerSync = void 0;
const electron_1 = require("electron");

class PlayerSync {
    constructor() {
        this.activeVideo = null;
        this.syncInterval = null;
        this.lastState = {
            isPlaying: false,
            isBuffering: false,
            title: 'Netflix',
            subTitle: '',
            seasonEpisode: '',
            artworkUrl: '',
            duration: 0,
            currentTime: 0,
            volume: 1.0,
            isMuted: false,
            playbackRate: 1.0,
        };
    }
    start() {
        this.attachVideoListeners();
        this.syncInterval = setInterval(() => {
            this.attachVideoListeners();
            this.syncState();
        }, 1000);
        electron_1.ipcRenderer.on('player:command', (_event, { command, data }) => {
            this.handleCommand(command, data);
        });
    }
    attachVideoListeners() {
        const video = document.querySelector('video');
        if (video && video !== this.activeVideo) {
            this.activeVideo = video;
            video.addEventListener('play', () => this.syncState());
            video.addEventListener('pause', () => this.syncState());
            video.addEventListener('timeupdate', () => this.syncState());
            video.addEventListener('volumechange', () => this.syncState());
            video.addEventListener('ended', () => this.syncState());
            video.addEventListener('waiting', () => this.syncState());
            video.addEventListener('playing', () => this.syncState());
            console.log('[FlixDesk] Attached to Netflix video element.');
        }
    }
    getNetflixPlayer() {
        try {
            const netflix = window.netflix;
            if (netflix && netflix.appContext && netflix.appContext.getPlayerApp) {
                const playerApp = netflix.appContext.getPlayerApp();
                const state = playerApp.getState();
                if (state && state.videoPlayer) {
                    const sessionIds = state.videoPlayer.getVideoPlayerSessionIds();
                    if (sessionIds && sessionIds.length > 0) {
                        return state.videoPlayer.getVideoPlayerBySessionId(sessionIds[sessionIds.length - 1]);
                    }
                }
            }
        }
        catch (e) {
            // ignore
        }
        return null;
    }
    extractMetadata() {
        let title = 'Netflix';
        let subTitle;
        let seasonEpisode;
        let artworkUrl;
        const titleHeader = document.querySelector('.video-title h4, [data-uia="video-title"] h4');
        const titleSpans = document.querySelectorAll('.video-title span, [data-uia="video-title"] span');
        if (titleHeader && titleHeader.innerText.trim()) {
            title = titleHeader.innerText.trim();
        }
        if (titleSpans && titleSpans.length > 0) {
            const spanTexts = Array.from(titleSpans).map((s) => s.innerText.trim()).filter(Boolean);
            if (spanTexts.length === 1) {
                if (spanTexts[0].toLowerCase().includes('season') || spanTexts[0].toLowerCase().includes('episode') || spanTexts[0].toLowerCase().includes('part')) {
                    seasonEpisode = spanTexts[0];
                }
                else {
                    subTitle = spanTexts[0];
                }
            }
            else if (spanTexts.length >= 2) {
                seasonEpisode = spanTexts[0];
                subTitle = spanTexts[1];
            }
        }
        if (title === 'Netflix' && document.title && document.title.includes('Netflix -')) {
            const cleanDocTitle = document.title.replace('Netflix -', '').trim();
            const parts = cleanDocTitle.split(':').map((p) => p.trim());
            if (parts.length >= 1) {
                title = parts[0];
            }
            if (parts.length >= 2) {
                seasonEpisode = parts[1];
            }
            if (parts.length >= 3) {
                subTitle = parts.slice(2).join(': ');
            }
        }
        const boxartImg = document.querySelector('.evidence-item-poster, .previewModal--boxart img, .title-card img');
        if (boxartImg && boxartImg.src) {
            artworkUrl = boxartImg.src;
        }
        return { title, subTitle, seasonEpisode, artworkUrl };
    }
    syncState() {
        const video = this.activeVideo;
        const meta = this.extractMetadata();
        const isPlaying = video ? !video.paused && !video.ended && video.readyState > 2 : false;
        const duration = video ? video.duration || 0 : 0;
        const currentTime = video ? video.currentTime || 0 : 0;
        const volume = video ? video.volume : 1.0;
        const isMuted = video ? video.muted : false;
        const playbackRate = video ? video.playbackRate || 1.0 : 1.0;
        const newState = {
            isPlaying,
            isBuffering: video ? video.readyState < 3 && !video.paused : false,
            title: meta.title,
            subTitle: meta.subTitle,
            seasonEpisode: meta.seasonEpisode,
            artworkUrl: meta.artworkUrl,
            duration,
            currentTime,
            volume,
            isMuted,
            playbackRate,
        };
        this.lastState = newState;
        electron_1.ipcRenderer.send('player:state', newState);
    }
    handleCommand(command, data) {
        const video = this.activeVideo;
        const player = this.getNetflixPlayer();
        switch (command) {
            case 'play':
                if (player)
                    player.play();
                else if (video)
                    video.play();
                break;
            case 'pause':
                if (player)
                    player.pause();
                else if (video)
                    video.pause();
                break;
            case 'playpause':
                if (player) {
                    if (player.isPlaying())
                        player.pause();
                    else
                        player.play();
                }
                else if (video) {
                    if (video.paused)
                        video.play();
                    else
                        video.pause();
                }
                break;
            case 'next':
                const nextBtn = document.querySelector('[data-uia="control-next"], [data-uia="next-episode-seamless-button"], .button-nfVideosNext');
                if (nextBtn) {
                    nextBtn.click();
                }
                break;
            case 'previous':
                if (video) {
                    if (video.currentTime > 5) {
                        video.currentTime = 0;
                    }
                }
                break;
            case 'seek':
                if (typeof data === 'number') {
                    if (player) {
                        const targetMs = Math.max(0, ((video === null || video === void 0 ? void 0 : video.currentTime) || 0) + data) * 1000;
                        player.seek(targetMs);
                    }
                    else if (video) {
                        video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + data));
                    }
                }
                break;
            case 'setPosition':
                if (typeof data === 'number') {
                    if (player) {
                        player.seek(data * 1000);
                    }
                    else if (video) {
                        video.currentTime = Math.max(0, Math.min(video.duration || 0, data));
                    }
                }
                break;
            case 'setVolume':
                if (typeof data === 'number' && video) {
                    video.volume = Math.max(0, Math.min(1, data));
                }
                break;
            case 'toggleMute':
                if (video) {
                    video.muted = !video.muted;
                }
                break;
            case 'skipIntro':
                const skipBtn = document.querySelector('[data-uia="player-skip-intro"], [data-uia="player-skip-recap"], .watch-video--skip-content-button');
                if (skipBtn) {
                    skipBtn.click();
                }
                break;
        }
        setTimeout(() => this.syncState(), 100);
    }
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
}
exports.PlayerSync = PlayerSync;

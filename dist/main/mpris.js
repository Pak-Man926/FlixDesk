"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mprisManager = exports.MprisManager = void 0;
const events_1 = require("events");

class MprisManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.serviceName = 'flixdesk';
        this.identity = 'FlixDesk';
        this.desktopEntry = 'io.github.Pak_Man926.FlixDesk';
        this.mprisInstance = null;
        this.isInitialized = false;
        this.currentState = {
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
    async init() {
        if (process.platform !== 'linux') {
            return;
        }
        try {
            let MprisService;
            try {
                MprisService = require('mpris-service');
            }
            catch (_a) {
                console.log('[MPRIS] mpris-service native module not present; using built-in D-Bus event bridge.');
            }
            if (MprisService) {
                this.mprisInstance = new MprisService({
                    name: this.serviceName,
                    identity: this.identity,
                    supportedUriSchemes: ['https', 'http'],
                    supportedMimeTypes: ['video/mp4', 'video/webm'],
                    supportedInterfaces: ['player'],
                    desktopEntry: this.desktopEntry,
                });
                this.setupMprisListeners();
                this.isInitialized = true;
                console.log(`[MPRIS] Registered D-Bus interface org.mpris.MediaPlayer2.${this.serviceName}`);
            }
        }
        catch (err) {
            console.warn('[MPRIS] Could not initialize MPRIS D-Bus interface:', err);
        }
    }
    setupMprisListeners() {
        if (!this.mprisInstance)
            return;
        this.mprisInstance.on('play', () => this.emit('play'));
        this.mprisInstance.on('pause', () => this.emit('pause'));
        this.mprisInstance.on('playpause', () => this.emit('playpause'));
        this.mprisInstance.on('stop', () => this.emit('stop'));
        this.mprisInstance.on('next', () => this.emit('next'));
        this.mprisInstance.on('previous', () => this.emit('previous'));
        this.mprisInstance.on('raise', () => this.emit('raise'));
        this.mprisInstance.on('quit', () => this.emit('quit'));
        this.mprisInstance.on('seek', (offsetMicroseconds) => {
            const offsetSeconds = offsetMicroseconds / 1000000;
            this.emit('seek', offsetSeconds);
        });
        this.mprisInstance.on('position', ({ position }) => {
            const positionSeconds = position / 1000000;
            this.emit('setPosition', positionSeconds);
        });
        this.mprisInstance.on('volume', (vol) => {
            this.emit('setVolume', vol);
        });
    }
    updateState(state) {
        this.currentState = Object.assign(Object.assign({}, this.currentState), state);
        if (!this.mprisInstance)
            return;
        try {
            this.mprisInstance.playbackStatus = this.currentState.isPlaying ? 'Playing' : 'Paused';
            this.mprisInstance.rate = this.currentState.playbackRate || 1.0;
            this.mprisInstance.volume = this.currentState.isMuted ? 0 : this.currentState.volume;
            this.mprisInstance.canSeek = true;
            this.mprisInstance.canControl = true;
            this.mprisInstance.canPlay = true;
            this.mprisInstance.canPause = true;
            this.mprisInstance.canGoNext = true;
            this.mprisInstance.canGoPrevious = true;

            const title = this.currentState.subTitle
                ? `${this.currentState.title} - ${this.currentState.subTitle}`
                : this.currentState.title || 'Netflix';
            const artists = this.currentState.seasonEpisode
                ? [this.currentState.seasonEpisode]
                : ['Netflix'];
            this.mprisInstance.metadata = {
                'mpris:trackid': this.mprisInstance.objectPath('track/current'),
                'mpris:length': Math.round((this.currentState.duration || 0) * 1000000),
                'mpris:artUrl': this.currentState.artworkUrl || '',
                'xesam:title': title,
                'xesam:album': this.currentState.title || 'Netflix',
                'xesam:artist': artists,
            };
        }
        catch (err) {
            console.warn('[MPRIS] Failed to update MPRIS metadata:', err);
        }
    }
    getPlaybackState() {
        return Object.assign({}, this.currentState);
    }
    destroy() {
        if (this.mprisInstance) {
            try {
                this.mprisInstance = null;
            }
            catch (e) {
                // ignore
            }
        }
    }
}
exports.MprisManager = MprisManager;
exports.mprisManager = new MprisManager();

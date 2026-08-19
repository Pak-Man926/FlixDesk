"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = exports.SettingsStore = void 0;
const electron_1 = require("electron");
const fs = require("fs");
const path = require("path");

const DEFAULT_SETTINGS = {
    autoSkipIntro: true,
    autoSkipRecap: true,
    autoPlayNext: true,
    force1080p: true,
    rememberPlaybackSpeed: true,
    lastPlaybackSpeed: 1.0,

    enableMpris: true,
    enableTray: true,
    startMinimized: false,
    closeToTray: true,
    enableHardwareAcceleration: true,
    enableWayland: true,

    enableDiscordRPC: true,
    showEpisodeInDiscord: true,
    customUserAgent: '',

    windowBounds: {
        width: 1280,
        height: 720,
    },
};

class SettingsStore {
    constructor() {
        const userDataPath = electron_1.app ? electron_1.app.getPath('userData') : path.join(process.env.HOME || '/tmp', '.config', 'FlixDesk');
        if (!fs.existsSync(userDataPath)) {
            try {
                fs.mkdirSync(userDataPath, { recursive: true });
            }
            catch (err) {
                console.error('Failed to create userData directory:', err);
            }
        }
        this.filePath = path.join(userDataPath, 'settings.json');
        this.settings = this.load();
    }
    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, 'utf-8');
                const parsed = JSON.parse(data);
                return Object.assign(Object.assign({}, DEFAULT_SETTINGS), parsed);
            }
        }
        catch (err) {
            console.error('Error loading settings from disk, reverting to defaults:', err);
        }
        return Object.assign({}, DEFAULT_SETTINGS);
    }
    get(key) {
        return this.settings[key];
    }
    getAll() {
        return Object.assign({}, this.settings);
    }
    set(key, value) {
        this.settings[key] = value;
        this.save();
    }
    setMultiple(partial) {
        this.settings = Object.assign(Object.assign({}, this.settings), partial);
        this.save();
    }
    save() {
        try {
            const tempPath = `${this.filePath}.tmp`;
            fs.writeFileSync(tempPath, JSON.stringify(this.settings, null, 2), 'utf-8');
            fs.renameSync(tempPath, this.filePath);
        }
        catch (err) {
            console.error('Failed to save settings to disk:', err);
        }
    }
}
exports.SettingsStore = SettingsStore;
exports.store = new SettingsStore();

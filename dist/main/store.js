"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = exports.SettingsStore = void 0;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
    filePath;
    settings;
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
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
        }
        catch (err) {
            console.error('Error loading settings from disk, reverting to defaults:', err);
        }
        return { ...DEFAULT_SETTINGS };
    }
    get(key) {
        return this.settings[key];
    }
    getAll() {
        return { ...this.settings };
    }
    set(key, value) {
        this.settings[key] = value;
        this.save();
    }
    setMultiple(partial) {
        this.settings = { ...this.settings, ...partial };
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const player_sync_1 = require("./player-sync");
const auto_skip_1 = require("./auto-skip");
const force_1080p_1 = require("./force-1080p");
const pip_1 = require("./pip");
// Initialize core components
const playerSync = new player_sync_1.PlayerSync();
const autoSkipper = new auto_skip_1.AutoSkipper();
// Listen for settings changes from main process
electron_1.ipcRenderer.on('settings:updated', (_event, settings) => {
    autoSkipper.updateConfig({
        autoSkipIntro: settings.autoSkipIntro,
        autoSkipRecap: settings.autoSkipRecap,
        autoPlayNext: settings.autoPlayNext,
    });
});
// Setup on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
    // If we are on netflix.com, initialize streaming enhancements
    if (window.location.hostname.includes('netflix.com')) {
        playerSync.start();
        autoSkipper.start();
        (0, force_1080p_1.inject1080pUnlocker)();
        if (navigator.requestMediaKeySystemAccess) {
            navigator.requestMediaKeySystemAccess('com.widevine.alpha', [
                {
                    initDataTypes: ['cenc'],
                    audioCapabilities: [{ contentType: 'audio/mp4;codecs="mp4a.40.2"' }],
                    videoCapabilities: [{ contentType: 'video/mp4;codecs="avc1.42E01E"' }],
                },
            ])
            .then(() => {
                console.log('[FlixDesk DRM] com.widevine.alpha is supported and active!');
            })
            .catch((err) => {
                console.warn('[FlixDesk DRM] com.widevine.alpha check:', err.message);
            });
        }
        // Listen for PiP command
        electron_1.ipcRenderer.on('player:command', (_event, { command }) => {
            if (command === 'togglePip') {
                pip_1.PipController.togglePip();
            }
        });
    }
});
// Expose safe API to renderer (used by Settings UI and overlays)
electron_1.contextBridge.exposeInMainWorld('flixDeskAPI', {
    // Settings
    getAllSettings: () => electron_1.ipcRenderer.invoke('settings:get-all'),
    getSetting: (key) => electron_1.ipcRenderer.invoke('settings:get', key),
    setSetting: (key, value) => electron_1.ipcRenderer.invoke('settings:set', key, value),
    saveAllSettings: (settings) => electron_1.ipcRenderer.invoke('settings:save-all', settings),
    // Diagnostics & Info
    getWidevineInfo: () => electron_1.ipcRenderer.invoke('widevine:get-info'),
    getAppInfo: () => electron_1.ipcRenderer.invoke('app:get-info'),
    // Actions
    closeSettings: () => electron_1.ipcRenderer.send('settings:close'),
    openSettings: () => electron_1.ipcRenderer.send('settings:open'),
    togglePip: () => pip_1.PipController.togglePip(),
    // Event Listeners
    onSettingsUpdated: (callback) => {
        electron_1.ipcRenderer.on('settings:updated', (_event, settings) => callback(settings));
    },
});

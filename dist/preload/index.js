"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const player_sync_1 = require("./player-sync");
const auto_skip_1 = require("./auto-skip");
const force_1080p_1 = require("./force-1080p");
const pip_1 = require("./pip");

const playerSync = new player_sync_1.PlayerSync();
const autoSkipper = new auto_skip_1.AutoSkipper();

electron_1.ipcRenderer.on('settings:updated', (_event, settings) => {
    autoSkipper.updateConfig({
        autoSkipIntro: settings.autoSkipIntro,
        autoSkipRecap: settings.autoSkipRecap,
        autoPlayNext: settings.autoPlayNext,
    });
});

window.addEventListener('DOMContentLoaded', () => {
    if (window.location.hostname.includes('netflix.com')) {
        playerSync.start();
        autoSkipper.start();
        (0, force_1080p_1.inject1080pUnlocker)();
        electron_1.ipcRenderer.on('player:command', (_event, { command }) => {
            if (command === 'togglePip') {
                pip_1.PipController.togglePip();
            }
        });
    }
});

electron_1.contextBridge.exposeInMainWorld('flixDeskAPI', {
    getAllSettings: () => electron_1.ipcRenderer.invoke('settings:get-all'),
    getSetting: (key) => electron_1.ipcRenderer.invoke('settings:get', key),
    setSetting: (key, value) => electron_1.ipcRenderer.invoke('settings:set', key, value),
    saveAllSettings: (settings) => electron_1.ipcRenderer.invoke('settings:save-all', settings),
    getWidevineInfo: () => electron_1.ipcRenderer.invoke('widevine:get-info'),
    getAppInfo: () => electron_1.ipcRenderer.invoke('app:get-info'),
    closeSettings: () => electron_1.ipcRenderer.send('settings:close'),
    openSettings: () => electron_1.ipcRenderer.send('settings:open'),
    togglePip: () => pip_1.PipController.togglePip(),
    onSettingsUpdated: (callback) => {
        electron_1.ipcRenderer.on('settings:updated', (_event, settings) => callback(settings));
    },
});

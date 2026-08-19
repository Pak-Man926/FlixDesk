"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIPC = void 0;
const electron_1 = require("electron");
const store_1 = require("./store");
const mpris_1 = require("./mpris");
const tray_1 = require("./tray");
const discord_1 = require("./discord");
const widevine_1 = require("./widevine");

function setupIPC(mainWindow, openSettingsWindow, closeSettingsWindow) {
    electron_1.ipcMain.on('player:state', (_event, state) => {
        if (store_1.store.get('enableMpris')) {
            mpris_1.mprisManager.updateState(state);
        }
        if (store_1.store.get('enableTray')) {
            tray_1.trayManager.updateState(state);
        }
        if (store_1.store.get('enableDiscordRPC')) {
            discord_1.discordRPC.updateActivity(mpris_1.mprisManager.getPlaybackState());
        }
    });

    electron_1.ipcMain.handle('settings:get-all', () => {
        return store_1.store.getAll();
    });

    electron_1.ipcMain.handle('settings:get', (_event, key) => {
        return store_1.store.get(key);
    });

    electron_1.ipcMain.handle('settings:set', (_event, key, value) => {
        store_1.store.set(key, value);
        if (key === 'enableDiscordRPC' || key === 'showEpisodeInDiscord') {
            discord_1.discordRPC.setEnabled(store_1.store.get('enableDiscordRPC'), store_1.store.get('showEpisodeInDiscord'));
        }
        mainWindow.webContents.send('settings:updated', store_1.store.getAll());
        return true;
    });

    electron_1.ipcMain.handle('settings:save-all', (_event, settings) => {
        store_1.store.setMultiple(settings);
        discord_1.discordRPC.setEnabled(store_1.store.get('enableDiscordRPC'), store_1.store.get('showEpisodeInDiscord'));
        mainWindow.webContents.send('settings:updated', store_1.store.getAll());
        return true;
    });

    electron_1.ipcMain.handle('widevine:get-info', () => {
        return widevine_1.widevineManager.getWidevineInfo();
    });

    electron_1.ipcMain.handle('app:get-info', () => {
        return {
            name: 'FlixDesk',
            version: electron_1.app.getVersion(),
            electronVersion: process.versions.electron,
            chromeVersion: process.versions.chrome,
            platform: process.platform,
            arch: process.arch,
            desktopEnv: process.env.XDG_CURRENT_DESKTOP || 'Linux',
            sessionType: process.env.XDG_SESSION_TYPE || 'x11',
        };
    });

    electron_1.ipcMain.on('settings:open', () => {
        openSettingsWindow();
    });

    electron_1.ipcMain.on('settings:close', () => {
        closeSettingsWindow === null || closeSettingsWindow === void 0 ? void 0 : closeSettingsWindow();
    });

    const forwardToPlayer = (command, data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('player:command', { command, data });
        }
    };

    mpris_1.mprisManager.on('play', () => forwardToPlayer('play'));
    mpris_1.mprisManager.on('pause', () => forwardToPlayer('pause'));
    mpris_1.mprisManager.on('playpause', () => forwardToPlayer('playpause'));
    mpris_1.mprisManager.on('stop', () => forwardToPlayer('pause'));
    mpris_1.mprisManager.on('next', () => forwardToPlayer('next'));
    mpris_1.mprisManager.on('previous', () => forwardToPlayer('previous'));
    mpris_1.mprisManager.on('seek', (offset) => forwardToPlayer('seek', offset));
    mpris_1.mprisManager.on('setPosition', (pos) => forwardToPlayer('setPosition', pos));
    mpris_1.mprisManager.on('setVolume', (vol) => forwardToPlayer('setVolume', vol));
    mpris_1.mprisManager.on('raise', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
    mpris_1.mprisManager.on('quit', () => electron_1.app.quit());
}
exports.setupIPC = setupIPC;

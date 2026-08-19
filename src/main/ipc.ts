import { ipcMain, BrowserWindow, app } from 'electron';
import { store } from './store';
import { mprisManager } from './mpris';
import { trayManager } from './tray';
import { discordRPC } from './discord';
import { widevineManager } from './widevine';
import { PlaybackState, AppSettings } from './types';

export function setupIPC(
  mainWindow: BrowserWindow,
  openSettingsWindow: () => void,
  closeSettingsWindow?: () => void
): void {
  // 1. Playback state updates from Netflix web page preload
  ipcMain.on('player:state', (_event, state: Partial<PlaybackState>) => {
    // Update MPRIS Linux D-Bus
    if (store.get('enableMpris')) {
      mprisManager.updateState(state);
    }

    // Update Tray
    if (store.get('enableTray')) {
      trayManager.updateState(state);
    }

    // Update Discord Rich Presence
    if (store.get('enableDiscordRPC')) {
      discordRPC.updateActivity(mprisManager.getPlaybackState());
    }
  });

  // 2. Settings IPC handlers
  ipcMain.handle('settings:get-all', () => {
    return store.getAll();
  });

  ipcMain.handle('settings:get', (_event, key: keyof AppSettings) => {
    return store.get(key);
  });

  ipcMain.handle('settings:set', (_event, key: keyof AppSettings, value: any) => {
    store.set(key, value);

    // Apply immediate side-effects
    if (key === 'enableDiscordRPC' || key === 'showEpisodeInDiscord') {
      discordRPC.setEnabled(store.get('enableDiscordRPC'), store.get('showEpisodeInDiscord'));
    }

    // Forward updated settings to preload
    mainWindow.webContents.send('settings:updated', store.getAll());
    return true;
  });

  ipcMain.handle('settings:save-all', (_event, settings: Partial<AppSettings>) => {
    store.setMultiple(settings);
    discordRPC.setEnabled(store.get('enableDiscordRPC'), store.get('showEpisodeInDiscord'));
    mainWindow.webContents.send('settings:updated', store.getAll());
    return true;
  });

  // 3. Widevine Info
  ipcMain.handle('widevine:get-info', () => {
    return widevineManager.getWidevineInfo();
  });

  // 4. App Info & System
  ipcMain.handle('app:get-info', () => {
    return {
      name: 'FlixDesk',
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      platform: process.platform,
      arch: process.arch,
      desktopEnv: process.env.XDG_CURRENT_DESKTOP || 'Linux',
      sessionType: process.env.XDG_SESSION_TYPE || 'x11',
    };
  });

  // 5. Open Settings Window
  ipcMain.on('settings:open', () => {
    openSettingsWindow();
  });

  // 6. Close Settings Window
  ipcMain.on('settings:close', () => {
    closeSettingsWindow?.();
  });

  // 7. MPRIS / Tray commands relay to web page
  const forwardToPlayer = (command: string, data?: any) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('player:command', { command, data });
    }
  };

  mprisManager.on('play', () => forwardToPlayer('play'));
  mprisManager.on('pause', () => forwardToPlayer('pause'));
  mprisManager.on('playpause', () => forwardToPlayer('playpause'));
  mprisManager.on('stop', () => forwardToPlayer('pause'));
  mprisManager.on('next', () => forwardToPlayer('next'));
  mprisManager.on('previous', () => forwardToPlayer('previous'));
  mprisManager.on('seek', (offset) => forwardToPlayer('seek', offset));
  mprisManager.on('setPosition', (pos) => forwardToPlayer('setPosition', pos));
  mprisManager.on('setVolume', (vol) => forwardToPlayer('setVolume', vol));
  mprisManager.on('raise', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  mprisManager.on('quit', () => app.quit());
}

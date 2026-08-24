import { contextBridge, ipcRenderer } from 'electron';
import { PlayerSync } from './player-sync';
import { AutoSkipper } from './auto-skip';
import { inject1080pUnlocker } from './force-1080p';
import { PipController } from './pip';
import { AppSettings } from '../main/types';

// Initialize core components
const playerSync = new PlayerSync();
const autoSkipper = new AutoSkipper();

// Listen for settings changes from main process
ipcRenderer.on('settings:updated', (_event, settings: AppSettings) => {
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
    inject1080pUnlocker();

    // Verify DRM / Widevine EME capability
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
    ipcRenderer.on('player:command', (_event, { command }) => {
      if (command === 'togglePip') {
        PipController.togglePip();
      }
    });
  }
});

// Expose safe API to renderer (used by Settings UI and overlays)
contextBridge.exposeInMainWorld('flixDeskAPI', {
  // Settings
  getAllSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get-all'),
  getSetting: (key: keyof AppSettings): Promise<any> => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: keyof AppSettings, value: any): Promise<boolean> =>
    ipcRenderer.invoke('settings:set', key, value),
  saveAllSettings: (settings: Partial<AppSettings>): Promise<boolean> =>
    ipcRenderer.invoke('settings:save-all', settings),

  // Diagnostics & Info
  getWidevineInfo: (): Promise<any> => ipcRenderer.invoke('widevine:get-info'),
  getAppInfo: (): Promise<any> => ipcRenderer.invoke('app:get-info'),

  // Actions
  closeSettings: (): void => ipcRenderer.send('settings:close'),
  openSettings: (): void => ipcRenderer.send('settings:open'),
  togglePip: (): Promise<boolean> => PipController.togglePip(),

  // Event Listeners
  onSettingsUpdated: (callback: (settings: AppSettings) => void) => {
    ipcRenderer.on('settings:updated', (_event, settings) => callback(settings));
  },
});

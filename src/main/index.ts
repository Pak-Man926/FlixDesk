import { app, BrowserWindow, session, shell, nativeImage, Menu } from 'electron';
import * as path from 'path';
import { store } from './store';
import { widevineManager } from './widevine';
import { mprisManager } from './mpris';
import { trayManager } from './tray';
import { discordRPC } from './discord';
import { buildAppMenu } from './menu';
import { setupIPC } from './ipc';

// Apply Widevine and Hardware Video Decoding switches BEFORE app is ready
const enableHwAccel = store.get('enableHardwareAcceleration');
const enableWayland = store.get('enableWayland');
widevineManager.applySwitches(enableHwAccel, enableWayland);

// Dynamic Chrome User-Agent matching Electron's Chromium engine
const chromeVersion = process.versions.chrome || '128.0.0.0';
const DEFAULT_USER_AGENT =
  `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let isQuitting = false;

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[FlixDesk] Another instance is already running. Exiting.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function getAppIconPath(): string {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'icons', '512x512.png')
    : path.join(__dirname, '..', '..', 'assets', 'icons', '512x512.png');
  return iconPath;
}

function createMainWindow(): BrowserWindow {
  const savedBounds = store.get('windowBounds');

  const win = new BrowserWindow({
    title: 'FlixDesk',
    width: savedBounds.width || 1280,
    height: savedBounds.height || 720,
    x: savedBounds.x,
    y: savedBounds.y,
    minWidth: 800,
    minHeight: 500,
    backgroundColor: '#141414',
    icon: getAppIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      plugins: true,
      webSecurity: true,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  if (savedBounds.isMaximized) {
    win.maximize();
  }

  // Persist window size & position
  const saveBounds = () => {
    if (!win.isDestroyed() && !win.isMinimized()) {
      const bounds = win.getBounds();
      store.set('windowBounds', {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        isMaximized: win.isMaximized(),
      });
    }
  };

  win.on('resize', saveBounds);
  win.on('move', saveBounds);

  // Close to tray behavior
  win.on('close', (event) => {
    if (!isQuitting && store.get('closeToTray') && store.get('enableTray')) {
      event.preventDefault();
      win.hide();
      return false;
    }
    saveBounds();
  });

  // Keyboard shortcut handler that bypasses webpage event interception
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      // Toggle DevTools (F12 or Ctrl+Shift+I)
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        win.webContents.toggleDevTools();
        event.preventDefault();
      }
      // Toggle Fullscreen (F11)
      else if (input.key === 'F11') {
        win.setFullScreen(!win.isFullScreen());
        event.preventDefault();
      }
      // Preferences (Ctrl+,)
      else if (input.control && input.key === ',') {
        createSettingsWindow();
        event.preventDefault();
      }
      // Reload (Ctrl+R)
      else if (input.control && input.key.toLowerCase() === 'r') {
        win.webContents.reload();
        event.preventDefault();
      }
    }
  });

  // Automatically open DevTools in detached window for diagnostics
  win.webContents.openDevTools({ mode: 'detach' });

  // Load Netflix
  const userAgent = store.get('customUserAgent') || DEFAULT_USER_AGENT;
  win.loadURL('https://www.netflix.com', { userAgent });

  return win;
}

function createSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    title: 'FlixDesk - Preferences',
    width: 680,
    height: 580,
    resizable: false,
    minimizable: false,
    maximizable: false,
    parent: mainWindow || undefined,
    modal: false,
    backgroundColor: '#141414',
    icon: getAppIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, '..', 'renderer', 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function configureSession(): void {
  const userAgent = store.get('customUserAgent') || DEFAULT_USER_AGENT;

  // Set user agent across default session and app fallback
  session.defaultSession.setUserAgent(userAgent);
  app.userAgentFallback = userAgent;

  // Strip Electron identifier from request headers
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = { ...details.requestHeaders };
    requestHeaders['User-Agent'] = userAgent;
    callback({ cancel: false, requestHeaders });
  });

  // Automatically grant DRM (Widevine / protected-media-identifier) and media permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // Chromium permission for Widevine / DRM is 'protected-media-identifier' or 'mediaKeySystem'
    console.log(`[FlixDesk Session] Permission requested: ${permission}`);
    callback(true);
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    return true;
  });
}

function handleAppAction(action: string, data?: any): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  switch (action) {
    case 'openSettings':
      createSettingsWindow();
      break;
    case 'openAbout':
      createSettingsWindow();
      break;
    case 'toggleAutoSkip':
      store.set('autoSkipIntro', data);
      store.set('autoSkipRecap', data);
      mainWindow.webContents.send('settings:updated', store.getAll());
      break;
    default:
      mainWindow.webContents.send('player:command', { command: action, data });
      break;
  }
}

app.whenReady().then(async () => {
  // 1. Support Widevine Components API if present (Castlabs / Widevine EVS)
  try {
    const electronModule = require('electron');
    if (electronModule.components && typeof electronModule.components.whenReady === 'function') {
      console.log('[FlixDesk] Checking Widevine components subsystem...');
      await electronModule.components.whenReady();
      const status = typeof electronModule.components.status === 'function' ? electronModule.components.status() : 'ready';
      console.log('[FlixDesk] Widevine components status:', JSON.stringify(status));
    }
  } catch (e) {
    console.log('[FlixDesk] Online component updater skipped, using local Widevine CDM.');
  }

  configureSession();

  mainWindow = createMainWindow();

  // Setup Application Menu
  const menu = buildAppMenu(mainWindow, handleAppAction);
  Menu.setApplicationMenu(menu);

  // Setup IPC
  setupIPC(mainWindow, createSettingsWindow, () => settingsWindow?.close());

  // Setup Linux MPRIS
  if (store.get('enableMpris')) {
    await mprisManager.init();
  }

  // Setup System Tray
  if (store.get('enableTray')) {
    trayManager.init(mainWindow, handleAppAction);
  }

  // Setup Discord RPC
  if (store.get('enableDiscordRPC')) {
    discordRPC.setEnabled(true, store.get('showEpisodeInDiscord'));
  }

  // Start minimized if configured
  if (store.get('startMinimized')) {
    mainWindow.hide();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  discordRPC.disconnect();
  mprisManager.destroy();
  trayManager.destroy();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

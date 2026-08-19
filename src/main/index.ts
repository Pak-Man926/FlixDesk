import { app, BrowserWindow, session, shell, nativeImage } from 'electron';
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

// Standard Desktop Chrome User-Agent (strips Electron identifier)
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

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

  // Handle external links (open in default Linux browser)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.includes('netflix.com')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

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

  // Set user agent across default session
  session.defaultSession.setUserAgent(userAgent);

  // Strip Electron identifier from request headers
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = { ...details.requestHeaders };
    requestHeaders['User-Agent'] = userAgent;
    callback({ cancel: false, requestHeaders });
  });

  // Enable DRM certificate handling & permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'mediaKeySystem', 'fullscreen', 'notifications'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
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

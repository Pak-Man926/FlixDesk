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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const store_1 = require("./store");
const widevine_1 = require("./widevine");
const mpris_1 = require("./mpris");
const tray_1 = require("./tray");
const discord_1 = require("./discord");
const menu_1 = require("./menu");
const ipc_1 = require("./ipc");
// Apply Widevine and Hardware Video Decoding switches BEFORE app is ready
const enableHwAccel = store_1.store.get('enableHardwareAcceleration');
const enableWayland = store_1.store.get('enableWayland');
widevine_1.widevineManager.applySwitches(enableHwAccel, enableWayland);
// Dynamic Desktop Chrome User-Agent matching Electron's Chromium engine
const chromeVersion = process.versions.chrome || '128.0.0.0';
const DEFAULT_USER_AGENT = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
let mainWindow = null;
let settingsWindow = null;
let isQuitting = false;
// Single Instance Lock
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    console.log('[FlixDesk] Another instance is already running. Exiting.');
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}
function getAppIconPath() {
    const iconPath = electron_1.app.isPackaged
        ? path.join(process.resourcesPath, 'assets', 'icons', '512x512.png')
        : path.join(__dirname, '..', '..', 'assets', 'icons', '512x512.png');
    return iconPath;
}
function createMainWindow() {
    const savedBounds = store_1.store.get('windowBounds');
    const win = new electron_1.BrowserWindow({
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
            store_1.store.set('windowBounds', {
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
        if (!isQuitting && store_1.store.get('closeToTray') && store_1.store.get('enableTray')) {
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
    const userAgent = store_1.store.get('customUserAgent') || DEFAULT_USER_AGENT;
    win.loadURL('https://www.netflix.com', { userAgent });
    return win;
}
function createSettingsWindow() {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.show();
        settingsWindow.focus();
        return;
    }
    settingsWindow = new electron_1.BrowserWindow({
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
function configureSession() {
    const userAgent = store_1.store.get('customUserAgent') || DEFAULT_USER_AGENT;
    electron_1.session.defaultSession.setUserAgent(userAgent);
    electron_1.app.userAgentFallback = userAgent;
    electron_1.session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const requestHeaders = Object.assign({}, details.requestHeaders);
        requestHeaders['User-Agent'] = userAgent;
        callback({ cancel: false, requestHeaders });
    });
    electron_1.session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        console.log(`[FlixDesk Session] Permission requested: ${permission}`);
        callback(true);
    });
    electron_1.session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
        return true;
    });
}
function handleAppAction(action, data) {
    if (!mainWindow || mainWindow.isDestroyed())
        return;
    switch (action) {
        case 'openSettings':
            createSettingsWindow();
            break;
        case 'openAbout':
            createSettingsWindow();
            break;
        case 'toggleAutoSkip':
            store_1.store.set('autoSkipIntro', data);
            store_1.store.set('autoSkipRecap', data);
            mainWindow.webContents.send('settings:updated', store_1.store.getAll());
            break;
        default:
            mainWindow.webContents.send('player:command', { command: action, data });
            break;
    }
}
electron_1.app.whenReady().then(async () => {
    try {
        const electronModule = require('electron');
        if (electronModule.components && typeof electronModule.components.whenReady === 'function') {
            console.log('[FlixDesk] Checking Widevine components subsystem...');
            await electronModule.components.whenReady();
            const status = typeof electronModule.components.status === 'function' ? electronModule.components.status() : 'ready';
            console.log('[FlixDesk] Widevine components status:', JSON.stringify(status));
        }
    }
    catch (e) {
        console.log('[FlixDesk] Online component updater skipped, using local Widevine CDM.');
    }
    configureSession();
    mainWindow = createMainWindow();
    // Setup Application Menu
    const menu = (0, menu_1.buildAppMenu)(mainWindow, handleAppAction);
    electron_1.Menu.setApplicationMenu(menu);
    // Setup IPC
    (0, ipc_1.setupIPC)(mainWindow, createSettingsWindow, () => settingsWindow?.close());
    // Setup Linux MPRIS
    if (store_1.store.get('enableMpris')) {
        await mpris_1.mprisManager.init();
    }
    // Setup System Tray
    if (store_1.store.get('enableTray')) {
        tray_1.trayManager.init(mainWindow, handleAppAction);
    }
    // Setup Discord RPC
    if (store_1.store.get('enableDiscordRPC')) {
        discord_1.discordRPC.setEnabled(true, store_1.store.get('showEpisodeInDiscord'));
    }
    // Start minimized if configured
    if (store_1.store.get('startMinimized')) {
        mainWindow.hide();
    }
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            mainWindow = createMainWindow();
        }
        else if (mainWindow) {
            mainWindow.show();
        }
    });
});
electron_1.app.on('before-quit', () => {
    isQuitting = true;
    discord_1.discordRPC.disconnect();
    mpris_1.mprisManager.destroy();
    tray_1.trayManager.destroy();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});

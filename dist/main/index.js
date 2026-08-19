"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const store_1 = require("./store");
const widevine_1 = require("./widevine");
const mpris_1 = require("./mpris");
const tray_1 = require("./tray");
const discord_1 = require("./discord");
const menu_1 = require("./menu");
const ipc_1 = require("./ipc");

const enableHwAccel = store_1.store.get('enableHardwareAcceleration');
const enableWayland = store_1.store.get('enableWayland');
widevine_1.widevineManager.applySwitches(enableHwAccel, enableWayland);

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

let mainWindow = null;
let settingsWindow = null;
let isQuitting = false;

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

    win.on('close', (event) => {
        if (!isQuitting && store_1.store.get('closeToTray') && store_1.store.get('enableTray')) {
            event.preventDefault();
            win.hide();
            return false;
        }
        saveBounds();
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (!url.includes('netflix.com')) {
            electron_1.shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

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
    electron_1.session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const requestHeaders = Object.assign({}, details.requestHeaders);
        requestHeaders['User-Agent'] = userAgent;
        callback({ cancel: false, requestHeaders });
    });
    electron_1.session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['media', 'mediaKeySystem', 'fullscreen', 'notifications'];
        if (allowedPermissions.includes(permission)) {
            callback(true);
        }
        else {
            callback(false);
        }
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
    configureSession();
    mainWindow = createMainWindow();
    const menu = (0, menu_1.buildAppMenu)(mainWindow, handleAppAction);
    electron_1.Menu.setApplicationMenu(menu);
    (0, ipc_1.setupIPC)(mainWindow, createSettingsWindow, () => settingsWindow === null || settingsWindow === void 0 ? void 0 : settingsWindow.close());
    if (store_1.store.get('enableMpris')) {
        await mpris_1.mprisManager.init();
    }
    if (store_1.store.get('enableTray')) {
        tray_1.trayManager.init(mainWindow, handleAppAction);
    }
    if (store_1.store.get('enableDiscordRPC')) {
        discord_1.discordRPC.setEnabled(true, store_1.store.get('showEpisodeInDiscord'));
    }
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

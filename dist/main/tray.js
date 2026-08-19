"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trayManager = exports.TrayManager = void 0;
const electron_1 = require("electron");
const path = require("path");

class TrayManager {
    constructor() {
        this.tray = null;
        this.mainWindow = null;
        this.onActionCallback = null;
        this.currentState = {
            isPlaying: false,
            isBuffering: false,
            title: 'Netflix',
            duration: 0,
            currentTime: 0,
            volume: 1.0,
            isMuted: false,
            playbackRate: 1.0,
        };
    }
    init(window, onAction) {
        this.mainWindow = window;
        this.onActionCallback = onAction;
        const iconPath = this.getTrayIconPath();
        const icon = electron_1.nativeImage.createFromPath(iconPath);
        this.tray = new electron_1.Tray(icon);
        this.tray.setToolTip('FlixDesk - Netflix Desktop Client');
        this.tray.on('click', () => {
            this.toggleWindow();
        });
        this.updateContextMenu();
    }
    getTrayIconPath() {
        const assetPath = electron_1.app.isPackaged
            ? path.join(process.resourcesPath, 'assets', 'icons', '32x32.png')
            : path.join(__dirname, '..', '..', 'assets', 'icons', '32x32.png');
        return assetPath;
    }
    updateState(state) {
        this.currentState = Object.assign(Object.assign({}, this.currentState), state);
        this.updateContextMenu();
    }
    updateContextMenu() {
        if (!this.tray)
            return;
        const isPlaying = this.currentState.isPlaying;
        const title = this.currentState.title || 'Netflix';
        const subTitle = this.currentState.subTitle ? ` (${this.currentState.subTitle})` : '';
        const statusLabel = isPlaying ? `▶ Playing: ${title}${subTitle}` : `⏸ ${title}`;
        const contextMenu = electron_1.Menu.buildFromTemplate([
            {
                label: 'FlixDesk',
                sublabel: statusLabel,
                enabled: false,
            },
            { type: 'separator' },
            {
                label: isPlaying ? 'Pause' : 'Play',
                accelerator: 'Space',
                click: () => { var _a; return (_a = this.onActionCallback) === null || _a === void 0 ? void 0 : _a.call(this, 'playpause'); },
            },
            {
                label: 'Next Episode',
                accelerator: 'CmdOrCtrl+N',
                click: () => { var _a; return (_a = this.onActionCallback) === null || _a === void 0 ? void 0 : _a.call(this, 'next'); },
            },
            {
                label: 'Skip Intro / Recap',
                click: () => { var _a; return (_a = this.onActionCallback) === null || _a === void 0 ? void 0 : _a.call(this, 'skipIntro'); },
            },
            {
                label: this.currentState.isMuted ? 'Unmute' : 'Mute',
                click: () => { var _a; return (_a = this.onActionCallback) === null || _a === void 0 ? void 0 : _a.call(this, 'toggleMute'); },
            },
            {
                label: 'Picture-in-Picture',
                accelerator: 'CmdOrCtrl+P',
                click: () => { var _a; return (_a = this.onActionCallback) === null || _a === void 0 ? void 0 : _a.call(this, 'togglePip'); },
            },
            { type: 'separator' },
            {
                label: ((_a = this.mainWindow) === null || _a === void 0 ? void 0 : _a.isVisible()) ? 'Hide to Tray' : 'Show FlixDesk',
                click: () => this.toggleWindow(),
            },
            {
                label: 'Preferences...',
                accelerator: 'CmdOrCtrl+,',
                click: () => { var _a; return (_a = this.onActionCallback) === null || _a === void 0 ? void 0 : _a.call(this, 'openSettings'); },
            },
            { type: 'separator' },
            {
                label: 'Quit FlixDesk',
                accelerator: 'CmdOrCtrl+Q',
                click: () => {
                    electron_1.app.quit();
                },
            },
        ]);
        this.tray.setContextMenu(contextMenu);
        this.tray.setToolTip(isPlaying ? `FlixDesk: Playing ${title}` : 'FlixDesk - Netflix Desktop Client');
    }
    toggleWindow() {
        if (!this.mainWindow)
            return;
        if (this.mainWindow.isVisible()) {
            if (this.mainWindow.isFocused()) {
                this.mainWindow.hide();
            }
            else {
                this.mainWindow.focus();
            }
        }
        else {
            this.mainWindow.show();
            this.mainWindow.focus();
        }
    }
    destroy() {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
        }
    }
}
exports.TrayManager = TrayManager;
exports.trayManager = new TrayManager();

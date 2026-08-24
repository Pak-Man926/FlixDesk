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
exports.trayManager = exports.TrayManager = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
class TrayManager {
    tray = null;
    mainWindow = null;
    onActionCallback = null;
    currentState = {
        isPlaying: false,
        isBuffering: false,
        title: 'Netflix',
        duration: 0,
        currentTime: 0,
        volume: 1.0,
        isMuted: false,
        playbackRate: 1.0,
    };
    constructor() { }
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
        this.currentState = { ...this.currentState, ...state };
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
                click: () => this.onActionCallback?.('playpause'),
            },
            {
                label: 'Next Episode',
                accelerator: 'CmdOrCtrl+N',
                click: () => this.onActionCallback?.('next'),
            },
            {
                label: 'Skip Intro / Recap',
                click: () => this.onActionCallback?.('skipIntro'),
            },
            {
                label: this.currentState.isMuted ? 'Unmute' : 'Mute',
                click: () => this.onActionCallback?.('toggleMute'),
            },
            {
                label: 'Picture-in-Picture',
                accelerator: 'CmdOrCtrl+P',
                click: () => this.onActionCallback?.('togglePip'),
            },
            { type: 'separator' },
            {
                label: this.mainWindow?.isVisible() ? 'Hide to Tray' : 'Show FlixDesk',
                click: () => this.toggleWindow(),
            },
            {
                label: 'Preferences...',
                accelerator: 'CmdOrCtrl+,',
                click: () => this.onActionCallback?.('openSettings'),
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

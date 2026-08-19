import { app, Menu, Tray, nativeImage, BrowserWindow } from 'electron';
import * as path from 'path';
import { PlaybackState } from './types';

export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private onActionCallback: ((action: string, data?: any) => void) | null = null;
  private currentState: PlaybackState = {
    isPlaying: false,
    isBuffering: false,
    title: 'Netflix',
    duration: 0,
    currentTime: 0,
    volume: 1.0,
    isMuted: false,
    playbackRate: 1.0,
  };

  constructor() {}

  public init(
    window: BrowserWindow,
    onAction: (action: string, data?: any) => void
  ): void {
    this.mainWindow = window;
    this.onActionCallback = onAction;

    const iconPath = this.getTrayIconPath();
    const icon = nativeImage.createFromPath(iconPath);

    this.tray = new Tray(icon);
    this.tray.setToolTip('FlixDesk - Netflix Desktop Client');

    this.tray.on('click', () => {
      this.toggleWindow();
    });

    this.updateContextMenu();
  }

  private getTrayIconPath(): string {
    const assetPath = app.isPackaged
      ? path.join(process.resourcesPath, 'assets', 'icons', '32x32.png')
      : path.join(__dirname, '..', '..', 'assets', 'icons', '32x32.png');
    return assetPath;
  }

  public updateState(state: Partial<PlaybackState>): void {
    this.currentState = { ...this.currentState, ...state };
    this.updateContextMenu();
  }

  public updateContextMenu(): void {
    if (!this.tray) return;

    const isPlaying = this.currentState.isPlaying;
    const title = this.currentState.title || 'Netflix';
    const subTitle = this.currentState.subTitle ? ` (${this.currentState.subTitle})` : '';
    const statusLabel = isPlaying ? `▶ Playing: ${title}${subTitle}` : `⏸ ${title}`;

    const contextMenu = Menu.buildFromTemplate([
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
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip(
      isPlaying ? `FlixDesk: Playing ${title}` : 'FlixDesk - Netflix Desktop Client'
    );
  }

  public toggleWindow(): void {
    if (!this.mainWindow) return;

    if (this.mainWindow.isVisible()) {
      if (this.mainWindow.isFocused()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow.focus();
      }
    } else {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

export const trayManager = new TrayManager();

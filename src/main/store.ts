import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { AppSettings } from './types';

const DEFAULT_SETTINGS: AppSettings = {
  autoSkipIntro: true,
  autoSkipRecap: true,
  autoPlayNext: true,
  force1080p: true,
  rememberPlaybackSpeed: true,
  lastPlaybackSpeed: 1.0,

  enableMpris: true,
  enableTray: true,
  startMinimized: false,
  closeToTray: true,
  enableHardwareAcceleration: true,
  enableWayland: true,

  enableDiscordRPC: true,
  showEpisodeInDiscord: true,
  customUserAgent: '',

  windowBounds: {
    width: 1280,
    height: 720,
  },
};

export class SettingsStore {
  private filePath: string;
  private settings: AppSettings;

  constructor() {
    const userDataPath = app ? app.getPath('userData') : path.join(process.env.HOME || '/tmp', '.config', 'FlixDesk');
    if (!fs.existsSync(userDataPath)) {
      try {
        fs.mkdirSync(userDataPath, { recursive: true });
      } catch (err) {
        console.error('Failed to create userData directory:', err);
      }
    }
    this.filePath = path.join(userDataPath, 'settings.json');
    this.settings = this.load();
  }

  private load(): AppSettings {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (err) {
      console.error('Error loading settings from disk, reverting to defaults:', err);
    }
    return { ...DEFAULT_SETTINGS };
  }

  public get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  public getAll(): AppSettings {
    return { ...this.settings };
  }

  public set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value;
    this.save();
  }

  public setMultiple(partial: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.save();
  }

  private save(): void {
    try {
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.settings, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('Failed to save settings to disk:', err);
    }
  }
}

export const store = new SettingsStore();

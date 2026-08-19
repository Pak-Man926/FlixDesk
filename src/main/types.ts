/**
 * FlixDesk - Type Definitions
 * io.github.Pak_Man926.FlixDesk
 */

export interface AppSettings {
  // Playback settings
  autoSkipIntro: boolean;
  autoSkipRecap: boolean;
  autoPlayNext: boolean;
  force1080p: boolean;
  rememberPlaybackSpeed: boolean;
  lastPlaybackSpeed: number;

  // Linux Desktop & System Integration
  enableMpris: boolean;
  enableTray: boolean;
  startMinimized: boolean;
  closeToTray: boolean;
  enableHardwareAcceleration: boolean;
  enableWayland: boolean;

  // Social & Extras
  enableDiscordRPC: boolean;
  showEpisodeInDiscord: boolean;
  customUserAgent: string;

  // Window State
  windowBounds: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    isMaximized?: boolean;
  };
}

export interface PlaybackState {
  isPlaying: boolean;
  isBuffering: boolean;
  title: string;
  subTitle?: string;
  seasonEpisode?: string;
  artworkUrl?: string;
  duration: number; // in seconds
  currentTime: number; // in seconds
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  playbackRate: number;
}

export interface WidevineInfo {
  found: boolean;
  path: string | null;
  version: string | null;
  source: string | null;
}

export interface DiscordActivity {
  details: string;
  state: string;
  startTimestamp?: number;
  endTimestamp?: number;
  largeImageKey: string;
  largeImageText: string;
  smallImageKey?: string;
  smallImageText?: string;
  instance: boolean;
}

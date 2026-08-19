import { ipcRenderer } from 'electron';
import { PlaybackState } from '../main/types';

export class PlayerSync {
  private activeVideo: HTMLVideoElement | null = null;
  private syncInterval: any = null;
  private lastState: PlaybackState = {
    isPlaying: false,
    isBuffering: false,
    title: 'Netflix',
    subTitle: '',
    seasonEpisode: '',
    artworkUrl: '',
    duration: 0,
    currentTime: 0,
    volume: 1.0,
    isMuted: false,
    playbackRate: 1.0,
  };

  constructor() {}

  public start(): void {
    // Continuously check for video element attachment
    this.attachVideoListeners();

    // Polling interval for metadata and time sync
    this.syncInterval = setInterval(() => {
      this.attachVideoListeners();
      this.syncState();
    }, 1000);

    // Listen for commands from Main Process (MPRIS / Tray / Shortcuts)
    ipcRenderer.on('player:command', (_event, { command, data }) => {
      this.handleCommand(command, data);
    });
  }

  private attachVideoListeners(): void {
    const video = document.querySelector('video') as HTMLVideoElement | null;
    if (video && video !== this.activeVideo) {
      this.activeVideo = video;

      video.addEventListener('play', () => this.syncState());
      video.addEventListener('pause', () => this.syncState());
      video.addEventListener('timeupdate', () => this.syncState());
      video.addEventListener('volumechange', () => this.syncState());
      video.addEventListener('ended', () => this.syncState());
      video.addEventListener('waiting', () => this.syncState());
      video.addEventListener('playing', () => this.syncState());

      console.log('[FlixDesk] Attached to Netflix video element.');
    }
  }

  private getNetflixPlayer(): any {
    try {
      const netflix = (window as any).netflix;
      if (netflix && netflix.appContext && netflix.appContext.getPlayerApp) {
        const playerApp = netflix.appContext.getPlayerApp();
        const state = playerApp.getState();
        if (state && state.videoPlayer) {
          const sessionIds = state.videoPlayer.getVideoPlayerSessionIds();
          if (sessionIds && sessionIds.length > 0) {
            return state.videoPlayer.getVideoPlayerBySessionId(sessionIds[sessionIds.length - 1]);
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  public extractMetadata(): { title: string; subTitle?: string; seasonEpisode?: string; artworkUrl?: string } {
    let title = 'Netflix';
    let subTitle: string | undefined;
    let seasonEpisode: string | undefined;
    let artworkUrl: string | undefined;

    // 1. Try DOM elements for active video title in player UI
    const titleHeader = document.querySelector('.video-title h4, [data-uia="video-title"] h4') as HTMLElement;
    const titleSpans = document.querySelectorAll('.video-title span, [data-uia="video-title"] span');

    if (titleHeader && titleHeader.innerText.trim()) {
      title = titleHeader.innerText.trim();
    }

    if (titleSpans && titleSpans.length > 0) {
      const spanTexts = Array.from(titleSpans).map((s) => (s as HTMLElement).innerText.trim()).filter(Boolean);
      if (spanTexts.length === 1) {
        if (spanTexts[0].toLowerCase().includes('season') || spanTexts[0].toLowerCase().includes('episode') || spanTexts[0].toLowerCase().includes('part')) {
          seasonEpisode = spanTexts[0];
        } else {
          subTitle = spanTexts[0];
        }
      } else if (spanTexts.length >= 2) {
        seasonEpisode = spanTexts[0];
        subTitle = spanTexts[1];
      }
    }

    // 2. Fallback: Parse document title (e.g. "Netflix - Stranger Things: Season 4: Chapter 1...")
    if (title === 'Netflix' && document.title && document.title.includes('Netflix -')) {
      const cleanDocTitle = document.title.replace('Netflix -', '').trim();
      const parts = cleanDocTitle.split(':').map((p) => p.trim());
      if (parts.length >= 1) {
        title = parts[0];
      }
      if (parts.length >= 2) {
        seasonEpisode = parts[1];
      }
      if (parts.length >= 3) {
        subTitle = parts.slice(2).join(': ');
      }
    }

    // 3. Try to extract thumbnail / poster artwork
    const boxartImg = document.querySelector('.evidence-item-poster, .previewModal--boxart img, .title-card img') as HTMLImageElement;
    if (boxartImg && boxartImg.src) {
      artworkUrl = boxartImg.src;
    }

    return { title, subTitle, seasonEpisode, artworkUrl };
  }

  public syncState(): void {
    const video = this.activeVideo;
    const meta = this.extractMetadata();

    const isPlaying = video ? !video.paused && !video.ended && video.readyState > 2 : false;
    const duration = video ? video.duration || 0 : 0;
    const currentTime = video ? video.currentTime || 0 : 0;
    const volume = video ? video.volume : 1.0;
    const isMuted = video ? video.muted : false;
    const playbackRate = video ? video.playbackRate || 1.0 : 1.0;

    const newState: PlaybackState = {
      isPlaying,
      isBuffering: video ? video.readyState < 3 && !video.paused : false,
      title: meta.title,
      subTitle: meta.subTitle,
      seasonEpisode: meta.seasonEpisode,
      artworkUrl: meta.artworkUrl,
      duration,
      currentTime,
      volume,
      isMuted,
      playbackRate,
    };

    // Emit if anything changed significantly
    this.lastState = newState;
    ipcRenderer.send('player:state', newState);
  }

  public handleCommand(command: string, data?: any): void {
    const video = this.activeVideo;
    const player = this.getNetflixPlayer();

    switch (command) {
      case 'play':
        if (player) player.play();
        else if (video) video.play();
        break;

      case 'pause':
        if (player) player.pause();
        else if (video) video.pause();
        break;

      case 'playpause':
        if (player) {
          if (player.isPlaying()) player.pause();
          else player.play();
        } else if (video) {
          if (video.paused) video.play();
          else video.pause();
        }
        break;

      case 'next':
        // Try clicking next episode button
        const nextBtn = document.querySelector(
          '[data-uia="control-next"], [data-uia="next-episode-seamless-button"], .button-nfVideosNext'
        ) as HTMLElement;
        if (nextBtn) {
          nextBtn.click();
        }
        break;

      case 'previous':
        if (video) {
          if (video.currentTime > 5) {
            video.currentTime = 0;
          }
        }
        break;

      case 'seek':
        if (typeof data === 'number') {
          if (player) {
            const targetMs = Math.max(0, (video?.currentTime || 0) + data) * 1000;
            player.seek(targetMs);
          } else if (video) {
            video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + data));
          }
        }
        break;

      case 'setPosition':
        if (typeof data === 'number') {
          if (player) {
            player.seek(data * 1000);
          } else if (video) {
            video.currentTime = Math.max(0, Math.min(video.duration || 0, data));
          }
        }
        break;

      case 'setVolume':
        if (typeof data === 'number' && video) {
          video.volume = Math.max(0, Math.min(1, data));
        }
        break;

      case 'toggleMute':
        if (video) {
          video.muted = !video.muted;
        }
        break;

      case 'skipIntro':
        const skipBtn = document.querySelector(
          '[data-uia="player-skip-intro"], [data-uia="player-skip-recap"], .watch-video--skip-content-button'
        ) as HTMLElement;
        if (skipBtn) {
          skipBtn.click();
        }
        break;
    }

    // Immediate sync after command
    setTimeout(() => this.syncState(), 100);
  }

  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

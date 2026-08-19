import * as net from 'net';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { PlaybackState } from './types';

const CLIENT_ID = '123456789012345678'; // Standard Discord Application ID for FlixDesk

enum DiscordOpcode {
  HANDSHAKE = 0,
  FRAME = 1,
  CLOSE = 2,
  PING = 3,
  PONG = 4,
}

export class DiscordRPC {
  private socket: net.Socket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private enabled = true;
  private showEpisode = true;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private lastState: PlaybackState | null = null;

  constructor() {}

  public setEnabled(enabled: boolean, showEpisode: boolean = true): void {
    this.enabled = enabled;
    this.showEpisode = showEpisode;

    if (!enabled) {
      this.disconnect();
    } else if (!this.isConnected && !this.isConnecting) {
      this.connect();
    } else if (this.isConnected && this.lastState) {
      this.updateActivity(this.lastState);
    }
  }

  public connect(): void {
    if (!this.enabled || this.isConnected || this.isConnecting) return;

    this.isConnecting = true;
    const socketPath = this.getDiscordSocketPath();

    if (!socketPath) {
      this.isConnecting = false;
      this.scheduleReconnect();
      return;
    }

    try {
      this.socket = net.createConnection(socketPath, () => {
        this.isConnected = true;
        this.isConnecting = false;
        console.log('[Discord RPC] Connected to Discord IPC socket at', socketPath);
        this.sendHandshake();

        if (this.lastState) {
          this.updateActivity(this.lastState);
        }
      });

      this.socket.on('error', (err) => {
        // Discord might not be running
        this.cleanupSocket();
        this.scheduleReconnect();
      });

      this.socket.on('close', () => {
        this.cleanupSocket();
        this.scheduleReconnect();
      });
    } catch (err) {
      this.cleanupSocket();
      this.scheduleReconnect();
    }
  }

  private getDiscordSocketPath(): string | null {
    const runtimeDir = process.env.XDG_RUNTIME_DIR || `/run/user/${process.getuid ? process.getuid() : 1000}`;
    const tmpDir = os.tmpdir();

    const candidateDirs = [runtimeDir, tmpDir, '/tmp'];

    for (const dir of candidateDirs) {
      for (let i = 0; i < 10; i++) {
        const socketPath = path.join(dir, `discord-ipc-${i}`);
        if (fs.existsSync(socketPath)) {
          return socketPath;
        }
      }
    }
    return null;
  }

  private sendHandshake(): void {
    const payload = JSON.stringify({
      v: 1,
      client_id: CLIENT_ID,
    });
    this.send(DiscordOpcode.HANDSHAKE, payload);
  }

  private send(opcode: DiscordOpcode, payload: string): void {
    if (!this.socket || !this.isConnected) return;

    try {
      const buffer = Buffer.from(payload);
      const header = Buffer.alloc(8);
      header.writeInt32LE(opcode, 0);
      header.writeInt32LE(buffer.length, 4);

      this.socket.write(Buffer.concat([header, buffer]));
    } catch (err) {
      console.warn('[Discord RPC] Error sending packet:', err);
    }
  }

  public updateActivity(state: PlaybackState): void {
    this.lastState = state;
    if (!this.enabled || !this.isConnected) return;

    try {
      const now = Math.floor(Date.now() / 1000);
      const isPlaying = state.isPlaying;
      let details = state.title || 'Browsing Netflix';
      let stateText = 'FlixDesk for Linux';
      let timestamps: any = {};

      if (isPlaying && state.duration > 0) {
        if (state.subTitle && this.showEpisode) {
          details = state.title;
          stateText = state.seasonEpisode ? `${state.seasonEpisode}: ${state.subTitle}` : state.subTitle;
        } else if (state.seasonEpisode && this.showEpisode) {
          stateText = state.seasonEpisode;
        }

        const remainingSeconds = Math.max(0, state.duration - state.currentTime);
        timestamps = {
          start: now - Math.floor(state.currentTime),
          end: now + Math.floor(remainingSeconds),
        };
      } else if (!isPlaying && state.title && state.title !== 'Netflix') {
        stateText = 'Paused';
      }

      const activityPayload = {
        cmd: 'SET_ACTIVITY',
        args: {
          pid: process.pid,
          activity: {
            details: details.substring(0, 128),
            state: stateText.substring(0, 128),
            timestamps: isPlaying ? timestamps : undefined,
            assets: {
              large_image: 'flixdesk_logo',
              large_text: 'FlixDesk - Netflix for Linux',
              small_image: isPlaying ? 'play_icon' : 'pause_icon',
              small_text: isPlaying ? 'Playing' : 'Paused',
            },
            instance: false,
          },
        },
        nonce: `${Date.now()}`,
      };

      this.send(DiscordOpcode.FRAME, JSON.stringify(activityPayload));
    } catch (err) {
      console.warn('[Discord RPC] Failed to update activity:', err);
    }
  }

  public clearActivity(): void {
    if (!this.isConnected) return;
    const payload = {
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: null,
      },
      nonce: `${Date.now()}`,
    };
    this.send(DiscordOpcode.FRAME, JSON.stringify(payload));
  }

  private cleanupSocket(): void {
    this.isConnected = false;
    this.isConnecting = false;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.destroy();
      this.socket = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this.enabled || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.enabled && !this.isConnected) {
        this.connect();
      }
    }, 15000);
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.clearActivity();
    this.cleanupSocket();
  }
}

export const discordRPC = new DiscordRPC();

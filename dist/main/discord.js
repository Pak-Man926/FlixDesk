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
exports.discordRPC = exports.DiscordRPC = void 0;
const net = __importStar(require("net"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const CLIENT_ID = '123456789012345678'; // Standard Discord Application ID for FlixDesk
var DiscordOpcode;
(function (DiscordOpcode) {
    DiscordOpcode[DiscordOpcode["HANDSHAKE"] = 0] = "HANDSHAKE";
    DiscordOpcode[DiscordOpcode["FRAME"] = 1] = "FRAME";
    DiscordOpcode[DiscordOpcode["CLOSE"] = 2] = "CLOSE";
    DiscordOpcode[DiscordOpcode["PING"] = 3] = "PING";
    DiscordOpcode[DiscordOpcode["PONG"] = 4] = "PONG";
})(DiscordOpcode || (DiscordOpcode = {}));
class DiscordRPC {
    socket = null;
    isConnected = false;
    isConnecting = false;
    enabled = true;
    showEpisode = true;
    reconnectTimer = null;
    lastState = null;
    constructor() { }
    setEnabled(enabled, showEpisode = true) {
        this.enabled = enabled;
        this.showEpisode = showEpisode;
        if (!enabled) {
            this.disconnect();
        }
        else if (!this.isConnected && !this.isConnecting) {
            this.connect();
        }
        else if (this.isConnected && this.lastState) {
            this.updateActivity(this.lastState);
        }
    }
    connect() {
        if (!this.enabled || this.isConnected || this.isConnecting)
            return;
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
        }
        catch (err) {
            this.cleanupSocket();
            this.scheduleReconnect();
        }
    }
    getDiscordSocketPath() {
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
    sendHandshake() {
        const payload = JSON.stringify({
            v: 1,
            client_id: CLIENT_ID,
        });
        this.send(DiscordOpcode.HANDSHAKE, payload);
    }
    send(opcode, payload) {
        if (!this.socket || !this.isConnected)
            return;
        try {
            const buffer = Buffer.from(payload);
            const header = Buffer.alloc(8);
            header.writeInt32LE(opcode, 0);
            header.writeInt32LE(buffer.length, 4);
            this.socket.write(Buffer.concat([header, buffer]));
        }
        catch (err) {
            console.warn('[Discord RPC] Error sending packet:', err);
        }
    }
    updateActivity(state) {
        this.lastState = state;
        if (!this.enabled || !this.isConnected)
            return;
        try {
            const now = Math.floor(Date.now() / 1000);
            const isPlaying = state.isPlaying;
            let details = state.title || 'Browsing Netflix';
            let stateText = 'FlixDesk for Linux';
            let timestamps = {};
            if (isPlaying && state.duration > 0) {
                if (state.subTitle && this.showEpisode) {
                    details = state.title;
                    stateText = state.seasonEpisode ? `${state.seasonEpisode}: ${state.subTitle}` : state.subTitle;
                }
                else if (state.seasonEpisode && this.showEpisode) {
                    stateText = state.seasonEpisode;
                }
                const remainingSeconds = Math.max(0, state.duration - state.currentTime);
                timestamps = {
                    start: now - Math.floor(state.currentTime),
                    end: now + Math.floor(remainingSeconds),
                };
            }
            else if (!isPlaying && state.title && state.title !== 'Netflix') {
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
        }
        catch (err) {
            console.warn('[Discord RPC] Failed to update activity:', err);
        }
    }
    clearActivity() {
        if (!this.isConnected)
            return;
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
    cleanupSocket() {
        this.isConnected = false;
        this.isConnecting = false;
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.destroy();
            this.socket = null;
        }
    }
    scheduleReconnect() {
        if (!this.enabled || this.reconnectTimer)
            return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.enabled && !this.isConnected) {
                this.connect();
            }
        }, 15000);
    }
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.clearActivity();
        this.cleanupSocket();
    }
}
exports.DiscordRPC = DiscordRPC;
exports.discordRPC = new DiscordRPC();

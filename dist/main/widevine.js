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
exports.widevineManager = exports.WidevineManager = void 0;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Discovers and configures Google Widevine CDM (Content Decryption Module)
 * for protected Netflix EME playback on Linux.
 */
class WidevineManager {
    static instance;
    info = {
        found: false,
        path: null,
        version: null,
        source: null,
    };
    constructor() { }
    static getInstance() {
        if (!WidevineManager.instance) {
            WidevineManager.instance = new WidevineManager();
        }
        return WidevineManager.instance;
    }
    getWidevineInfo() {
        return { ...this.info };
    }
    /**
     * Search candidate paths for libwidevinecdm.so across common Linux installations
     */
    discoverWidevine() {
        const home = process.env.HOME || '';
        const userData = electron_1.app ? electron_1.app.getPath('userData') : path.join(home, '.config', 'FlixDesk');
        const candidatePaths = [
            // 1. Flatpak sandbox extra-data location
            {
                path: '/app/extra/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
                manifest: '/app/extra/WidevineCdm/manifest.json',
                source: 'Flatpak Extra-Data',
            },
            {
                path: '/app/extra/libwidevinecdm.so',
                manifest: '/app/extra/manifest.json',
                source: 'Flatpak Extra-Data Direct',
            },
            {
                path: '/app/lib/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
                manifest: '/app/lib/WidevineCdm/manifest.json',
                source: 'Flatpak Runtime Lib',
            },
            // 2. Application user data directory (local download / updater)
            {
                path: path.join(userData, 'WidevineCdm', '_platform_specific', 'linux_x64', 'libwidevinecdm.so'),
                manifest: path.join(userData, 'WidevineCdm', 'manifest.json'),
                source: 'FlixDesk AppData',
            },
            {
                path: path.join(userData, 'WidevineCdm', 'libwidevinecdm.so'),
                manifest: path.join(userData, 'WidevineCdm', 'manifest.json'),
                source: 'FlixDesk AppData Direct',
            },
            // 3. Google Chrome Stable / Beta / Unstable
            {
                path: '/opt/google/chrome/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
                manifest: '/opt/google/chrome/WidevineCdm/manifest.json',
                source: 'Google Chrome Stable',
            },
            {
                path: '/opt/google/chrome-beta/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
                manifest: '/opt/google/chrome-beta/WidevineCdm/manifest.json',
                source: 'Google Chrome Beta',
            },
            {
                path: '/opt/google/chrome-unstable/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
                manifest: '/opt/google/chrome-unstable/WidevineCdm/manifest.json',
                source: 'Google Chrome Unstable',
            },
            // 4. Chromium & Distribution packages (Ubuntu, Pop!_OS, Debian, Fedora, Arch)
            {
                path: '/usr/lib/chromium/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
                manifest: '/usr/lib/chromium/WidevineCdm/manifest.json',
                source: 'System Chromium (/usr/lib/chromium)',
            },
            {
                path: '/usr/lib/chromium-browser/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
                manifest: '/usr/lib/chromium-browser/WidevineCdm/manifest.json',
                source: 'System Chromium Browser',
            },
            {
                path: '/usr/lib/x86_64-linux-gnu/chromium/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
                manifest: '/usr/lib/x86_64-linux-gnu/chromium/WidevineCdm/manifest.json',
                source: 'Debian/Ubuntu Multiarch Chromium',
            },
            // 5. Brave Browser
            {
                path: '/opt/brave.com/brave/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
                manifest: '/opt/brave.com/brave/WidevineCdm/manifest.json',
                source: 'Brave Browser',
            },
            {
                path: path.join(home, '.config/BraveSoftware/Brave-Browser/WidevineCdm/libwidevinecdm.so'),
                manifest: path.join(home, '.config/BraveSoftware/Brave-Browser/WidevineCdm/manifest.json'),
                source: 'User Brave CDM',
            },
            // 6. Vivaldi Browser
            {
                path: '/opt/vivaldi/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
                manifest: '/opt/vivaldi/WidevineCdm/manifest.json',
                source: 'Vivaldi Browser',
            },
            {
                path: '/var/opt/vivaldi/WidevineCdm/libwidevinecdm.so',
                manifest: '/var/opt/vivaldi/WidevineCdm/manifest.json',
                source: 'Vivaldi Opt Var',
            },
            // 7. Microsoft Edge for Linux
            {
                path: '/opt/microsoft/msedge/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
                manifest: '/opt/microsoft/msedge/WidevineCdm/manifest.json',
                source: 'Microsoft Edge Linux',
            },
        ];
        for (const candidate of candidatePaths) {
            if (fs.existsSync(candidate.path)) {
                let version = '4.10.2830.0'; // Modern fallback version
                if (fs.existsSync(candidate.manifest)) {
                    try {
                        const manifestContent = JSON.parse(fs.readFileSync(candidate.manifest, 'utf-8'));
                        if (manifestContent.version) {
                            version = manifestContent.version;
                        }
                    }
                    catch (e) {
                        console.warn(`[Widevine] Could not parse manifest at ${candidate.manifest}`);
                    }
                }
                this.info = {
                    found: true,
                    path: candidate.path,
                    version: version,
                    source: candidate.source,
                };
                console.log(`[Widevine] Found Widevine CDM from ${candidate.source}`);
                console.log(`[Widevine] Path: ${candidate.path} (v${version})`);
                return this.info;
            }
        }
        console.warn('[Widevine] No Widevine CDM library found on this system.');
        return this.info;
    }
    /**
     * Applies Widevine and Hardware Acceleration flags to Electron command line
     */
    applySwitches(enableHwAccel = true, enableWayland = true) {
        const info = this.discoverWidevine();
        if (info.found && info.path && info.version) {
            const cdmDir = info.path.includes('_platform_specific')
                ? path.resolve(path.dirname(info.path), '../..')
                : path.dirname(info.path);
            electron_1.app.commandLine.appendSwitch('widevine-cdm-path', cdmDir);
            electron_1.app.commandLine.appendSwitch('widevine-cdm-version', info.version);
            electron_1.app.commandLine.appendSwitch('widevinecdm-path', info.path);
            electron_1.app.commandLine.appendSwitch('widevinecdm-version', info.version);
            console.log(`[Widevine] Registered Widevine CDM: dir=${cdmDir}, file=${info.path}, version=${info.version}`);
        }
        // GPU & Hardware Acceleration for Linux
        electron_1.app.commandLine.appendSwitch('disable-gpu-sandbox');
        electron_1.app.commandLine.appendSwitch('no-sandbox');
        if (enableHwAccel) {
            electron_1.app.commandLine.appendSwitch('ignore-gpu-blocklist');
            electron_1.app.commandLine.appendSwitch('enable-gpu-rasterization');
            electron_1.app.commandLine.appendSwitch('enable-accelerated-video-decode');
        }
        // Wayland support
        if (enableWayland && (process.env.XDG_SESSION_TYPE === 'wayland' || process.env.WAYLAND_DISPLAY)) {
            electron_1.app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
        }
        // Media and DRM flags
        electron_1.app.commandLine.appendSwitch('enable-encrypted-media');
        electron_1.app.commandLine.appendSwitch('no-verify-widevine-cdm');
        electron_1.app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
    }
}
exports.WidevineManager = WidevineManager;
exports.widevineManager = WidevineManager.getInstance();

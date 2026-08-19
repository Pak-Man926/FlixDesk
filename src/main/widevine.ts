import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { WidevineInfo } from './types';

/**
 * Discovers and configures Google Widevine CDM (Content Decryption Module)
 * for protected Netflix EME playback on Linux.
 */
export class WidevineManager {
  private static instance: WidevineManager;
  private info: WidevineInfo = {
    found: false,
    path: null,
    version: null,
    source: null,
  };

  private constructor() {}

  public static getInstance(): WidevineManager {
    if (!WidevineManager.instance) {
      WidevineManager.instance = new WidevineManager();
    }
    return WidevineManager.instance;
  }

  public getWidevineInfo(): WidevineInfo {
    return { ...this.info };
  }

  /**
   * Search candidate paths for libwidevinecdm.so across common Linux installations
   */
  public discoverWidevine(): WidevineInfo {
    const home = process.env.HOME || '';
    const userData = app ? app.getPath('userData') : path.join(home, '.config', 'FlixDesk');

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
          } catch (e) {
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
  public applySwitches(enableHwAccel: boolean = true, enableWayland: boolean = true): void {
    const info = this.discoverWidevine();

    if (info.found && info.path && info.version) {
      app.commandLine.appendSwitch('widevinecdm-path', info.path);
      app.commandLine.appendSwitch('widevinecdm-version', info.version);
      console.log(`[Widevine] Configured Electron switches: path=${info.path}, version=${info.version}`);
    }

    // Hardware Acceleration & VA-API video decoding for Linux
    if (enableHwAccel) {
      app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoDecodeLinuxGL,CanvasOopRasterization');
      app.commandLine.appendSwitch('enable-accelerated-video-decode');
      app.commandLine.appendSwitch('enable-gpu-rasterization');
      app.commandLine.appendSwitch('ignore-gpu-blocklist');
    }

    // Wayland support
    if (enableWayland && (process.env.XDG_SESSION_TYPE === 'wayland' || process.env.WAYLAND_DISPLAY)) {
      app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
      app.commandLine.appendSwitch('enable-features', 'WaylandWindowDecorations');
    }

    // Media and DRM flags
    app.commandLine.appendSwitch('enable-encrypted-media');
    app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
  }
}

export const widevineManager = WidevineManager.getInstance();

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
      // 1. Application user data directory (local download / updater)
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

      // 2. Brave Browser
      {
        path: '/opt/brave.com/brave/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
        manifest: '/opt/brave.com/brave/WidevineCdm/manifest.json',
        source: 'Brave Browser System',
      },
      {
        path: '/opt/brave.com/brave/resources/widevine_cdm/_platform_specific/linux_x64/libwidevinecdm.so',
        manifest: '/opt/brave.com/brave/resources/widevine_cdm/manifest.json',
        source: 'Brave Browser Resources',
      },
      {
        path: path.join(home, '.config/BraveSoftware/Brave-Browser/WidevineCdm/libwidevinecdm.so'),
        manifest: path.join(home, '.config/BraveSoftware/Brave-Browser/WidevineCdm/manifest.json'),
        source: 'User Brave CDM Direct',
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

      // 5. Microsoft Edge for Linux
      {
        path: '/opt/microsoft/msedge/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so',
        manifest: '/opt/microsoft/msedge/WidevineCdm/manifest.json',
        source: 'Microsoft Edge Linux',
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
    ];

    // Check version-specific user component directories (e.g. Brave & Chrome component updaters)
    const browserComponentRoots = [
      { root: path.join(home, '.config/BraveSoftware/Brave-Browser/WidevineCdm'), source: 'Brave User Component' },
      { root: path.join(home, '.config/google-chrome/WidevineCdm'), source: 'Chrome User Component' },
      { root: path.join(home, '.config/chromium/WidevineCdm'), source: 'Chromium User Component' },
      { root: path.join(home, '.config/microsoft-edge/WidevineCdm'), source: 'Edge User Component' },
    ];

    for (const comp of browserComponentRoots) {
      if (fs.existsSync(comp.root)) {
        try {
          const entries = fs.readdirSync(comp.root, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              candidatePaths.push({
                path: path.join(comp.root, entry.name, '_platform_specific', 'linux_x64', 'libwidevinecdm.so'),
                manifest: path.join(comp.root, entry.name, 'manifest.json'),
                source: `${comp.source} (${entry.name})`,
              });
              candidatePaths.push({
                path: path.join(comp.root, entry.name, 'libwidevinecdm.so'),
                manifest: path.join(comp.root, entry.name, 'manifest.json'),
                source: `${comp.source} Flat (${entry.name})`,
              });
            }
          }
        } catch {
          // Ignore read errors
        }
      }
    }

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
      const cdmDir = info.path.includes('_platform_specific')
        ? path.resolve(path.dirname(info.path), '../..')
        : path.dirname(info.path);

      // Support all variations of Chromium Widevine command-line switches
      app.commandLine.appendSwitch('widevine-cdm-path', cdmDir);
      app.commandLine.appendSwitch('widevine-cdm-version', info.version);
      app.commandLine.appendSwitch('widevinecdm-path', info.path);
      app.commandLine.appendSwitch('widevinecdm-version', info.version);

      console.log(`[Widevine] Registered Widevine CDM: dir=${cdmDir}, file=${info.path}, version=${info.version}`);
    }

    // GPU & Hardware Acceleration for Linux
    app.commandLine.appendSwitch('disable-gpu-sandbox');
    app.commandLine.appendSwitch('no-sandbox');

    if (enableHwAccel) {
      app.commandLine.appendSwitch('ignore-gpu-blocklist');
      app.commandLine.appendSwitch('enable-gpu-rasterization');
      app.commandLine.appendSwitch('enable-accelerated-video-decode');
    }

    // Wayland support
    if (enableWayland && (process.env.XDG_SESSION_TYPE === 'wayland' || process.env.WAYLAND_DISPLAY)) {
      app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
    }

    // Media and DRM flags
    app.commandLine.appendSwitch('enable-encrypted-media');
    app.commandLine.appendSwitch('no-verify-widevine-cdm');
    app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
  }
}

export const widevineManager = WidevineManager.getInstance();

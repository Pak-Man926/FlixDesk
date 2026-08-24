"""
FlixDesk - Widevine CDM Discovery & Configuration
Locates Google's Widevine DRM library and sets up Chromium flags for QtWebEngine.
"""

import os
from pathlib import Path
from typing import Optional, Dict, Any


class WidevineManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WidevineManager, cls).__new__(cls)
            cls._instance._info = None
        return cls._instance

    def discover(self) -> Dict[str, Any]:
        if self._info is not None:
            return self._info

        home = Path.home()
        candidates = [
            # 1. Flatpak extra-data location
            {
                "path": "/app/extra/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so",
                "source": "Flatpak Extra Data",
            },
            # 2. Local FlixDesk AppData (extracted via extract-widevine.sh)
            {
                "path": str(home / ".config/FlixDesk/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so"),
                "source": "FlixDesk Local AppData",
            },
            {
                "path": str(home / ".config/FlixDesk/WidevineCdm/libwidevinecdm.so"),
                "source": "FlixDesk Flat AppData",
            },
            # 3. Google Chrome (Stable, Beta, Unstable)
            {
                "path": "/opt/google/chrome/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so",
                "source": "Google Chrome Stable",
            },
            {
                "path": "/opt/google/chrome-beta/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so",
                "source": "Google Chrome Beta",
            },
            {
                "path": "/opt/google/chrome-unstable/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so",
                "source": "Google Chrome Unstable",
            },
            # 4. System Chromium (Ubuntu, Pop!_OS, Debian, Fedora, Arch)
            {
                "path": "/usr/lib/chromium/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so",
                "source": "System Chromium (/usr/lib/chromium)",
            },
            {
                "path": "/usr/lib/chromium-browser/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so",
                "source": "System Chromium Browser",
            },
            {
                "path": "/usr/lib/x86_64-linux-gnu/chromium/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so",
                "source": "Debian/Ubuntu Multiarch Chromium",
            },
            # 5. Brave Browser
            {
                "path": "/opt/brave.com/brave/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so",
                "source": "Brave Browser",
            },
            {
                "path": str(home / ".config/BraveSoftware/Brave-Browser/WidevineCdm/libwidevinecdm.so"),
                "source": "User Brave CDM",
            },
            # 6. Vivaldi Browser
            {
                "path": "/opt/vivaldi/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so",
                "source": "Vivaldi Browser",
            },
            {
                "path": "/var/opt/vivaldi/WidevineCdm/libwidevinecdm.so",
                "source": "Vivaldi Opt Var",
            },
            # 7. Microsoft Edge for Linux
            {
                "path": "/opt/microsoft/msedge/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so",
                "source": "Microsoft Edge Linux",
            },
        ]

        for item in candidates:
            if os.path.isfile(item["path"]):
                self._info = {
                    "found": True,
                    "path": item["path"],
                    "source": item["source"],
                }
                print(f"[Widevine] Found Widevine CDM from {item['source']}")
                print(f"[Widevine] Library: {item['path']}")
                return self._info

        print("[Widevine] No Widevine CDM library found on this system.")
        self._info = {"found": False, "path": None, "source": None}
        return self._info

    def configure_environment(self, enable_hw_accel: bool = True, enable_wayland: bool = True) -> None:
        """
        Configures the QTWEBENGINE_CHROMIUM_FLAGS environment variable.
        Must be invoked BEFORE QApplication is initialized.
        """
        info = self.discover()
        flags = [
            "--enable-encrypted-media",
            "--autoplay-policy=no-user-gesture-required",
            "--no-sandbox",
            "--disable-gpu-sandbox",
        ]

        if info["found"] and info["path"]:
            flags.append(f"--widevine-path={info['path']}")

        if enable_hw_accel:
            flags.extend([
                "--ignore-gpu-blocklist",
                "--enable-gpu-rasterization",
                "--enable-accelerated-video-decode",
            ])

        if enable_wayland and (os.environ.get("XDG_SESSION_TYPE") == "wayland" or os.environ.get("WAYLAND_DISPLAY")):
            flags.append("--ozone-platform-hint=auto")

        existing_flags = os.environ.get("QTWEBENGINE_CHROMIUM_FLAGS", "")
        new_flags = " ".join(flags)
        os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = f"{existing_flags} {new_flags}".strip()
        print(f"[Widevine] Configured QTWEBENGINE_CHROMIUM_FLAGS: {os.environ['QTWEBENGINE_CHROMIUM_FLAGS']}")


widevine = WidevineManager()

# FlixDesk

**FlixDesk** is a modern, feature-rich, unofficial desktop client wrapper for **Netflix** tailored for Linux desktops (including Pop!_OS COSMIC, GNOME, and KDE Plasma). It integrates the web experience of Netflix into a native application container, providing optimizations and OS integration that standard web browsers lack on Linux.

### Key Features

*   **🛡️ Widevine DRM Playback:** Built-in auto-discovery and loading for Google Widevine CDM to ensure seamless video rendering.
*   **⚡ 1080p Full HD Playback:** Automatically unlocks full HD streams on Linux by overriding the default browser resolution cap of 720p.
*   **🐧 Native MPRIS D-Bus Support:** Allows controlling playback (Play, Pause, Next) through physical keyboard media keys, system quick settings, lock screens, and desktop media widgets via [mpris.py](file:///home/pak_man/Desktop/Netflix%20Client/flixdesk/mpris.py).
*   **⏭️ Auto-Skip Custom Actions:** Injected JavaScript automation ([auto_skip.js](file:///home/pak_man/Desktop/Netflix%20Client/flixdesk/scripts/auto_skip.js)) that automatically clicks *"Skip Intro"*, *"Skip Recap"*, and proceeds to the *"Next Episode"*.
*   **🚀 Hardware Acceleration:** Pre-configured with Chromium VA-API flags and GPU rasterization to minimize CPU usage and extend battery life during playback.
*   **🔔 Desktop Tray & Shortcuts:** Minimize-to-tray capability and custom keyboard shortcuts mapped natively.

### Architecture

The client's codebase (defined in [README.md](file:///home/pak_man/Desktop/Netflix%20Client/README.md)) is structured as follows:

*   **GUI & Integrations:** Built with Python and Qt (PySide6) to handle the main UI frame, settings, MPRIS interface, and system tray.
*   **Web Engine Overrides:** JavaScript injection inside `QWebEngineView` to inject behavior like [force_1080p.js](file:///home/pak_man/Desktop/Netflix%20Client/flixdesk/scripts/force_1080p.js) and [player_sync.js](file:///home/pak_man/Desktop/Netflix%20Client/flixdesk/scripts/player_sync.js) directly into the Netflix web player.
*   **Packaging:** Supported targets for AUR and a sandboxed Universal Flatpak configuration located in [packaging/flatpak](file:///home/pak_man/Desktop/Netflix%20Client/packaging/flatpak).
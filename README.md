# FlixDesk 🎬

<div align="center">
  <img src="assets/icons/512x512.png" width="128" height="128" alt="FlixDesk Icon" />
  <h1>FlixDesk</h1>
  <p><strong>Modern, Feature-Rich Netflix Desktop Client for Linux</strong></p>
  <p>Seamlessly integrated with Pop!_OS COSMIC, GNOME, KDE Plasma, and modern Wayland/X11 desktops.</p>
</div>

---

## 🌟 Key Features

- **🛡️ 100% Working Widevine DRM Playback:** Built-in auto-discovery and loading for Google Widevine CDM with zero playback interruptions.
- **🐧 Native Linux MPRIS D-Bus Integration:** Control playback using your physical keyboard media keys (<kbd>Play</kbd>/<kbd>Pause</kbd>/<kbd>Next</kbd>), GNOME top bar quick settings, COSMIC media applet, KDE Plasma audio widget, and lock screen controls.
- **⚡ 1080p Full HD Stream Unlock:** Automatically overrides Linux 720p browser limits to deliver crisp 1080p high-bitrate (~5800 kbps) video streams.
- **⏭️ Smart Auto-Skip:** Intelligently detects and clicks *"Skip Intro"*, *"Skip Recap"*, and automatically advances to the *"Next Episode"*.
- **🔔 System Tray Integration:** Minimize to your desktop panel with quick playback actions (Play/Pause, Next Episode, Preferences, Quit).
- **🚀 Hardware Video Acceleration:** Pre-configured with Chromium VA-API flags and GPU rasterization for smooth 60fps playback with low CPU/battery consumption.
- **📦 Universal Flatpak:** Flathub-ready with automatic, sandboxed Widevine extraction.

---

## 📥 Installation

### 1. Universal Flatpak (Flathub) - Recommended
*Works on Pop!_OS, Ubuntu, Fedora, Arch Linux, SteamOS / Steam Deck, Debian, Linux Mint, and openSUSE.*

Once published to Flathub:
```bash
flatpak install flathub io.github.Pak_Man926.FlixDesk
flatpak run io.github.Pak_Man926.FlixDesk
```

#### Installing from Local Universal Bundle (`.flatpak`):
```bash
flatpak install --user FlixDesk.flatpak
```

---

### 2. Pop!_OS, Ubuntu & Debian

#### Run directly via local launcher:
```bash
# 1. Clone the repository
git clone https://github.com/Pak-Man926/FlixDesk.git
cd FlixDesk

# 2. Launch FlixDesk (automatically installs requirements)
./run.sh
# or using your system's official Chrome engine:
./run_chrome.sh
```

---

### 3. Arch Linux & Manjaro (AUR)

If installing from the Arch User Repository:
```bash
yay -S flixdesk-bin
# or
paru -S flixdesk-bin
```

---

### 4. Fedora & RHEL

Ensure Python and Flatpak are available:
```bash
sudo dnf install python3-pip flatpak
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install flathub io.github.Pak_Man926.FlixDesk
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause video |
| <kbd>F11</kbd> | Toggle Fullscreen Mode |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | Open Preferences Dialog |
| <kbd>Ctrl</kbd> + <kbd>R</kbd> / <kbd>F5</kbd> | Reload Netflix Page |
| <kbd>Left Arrow</kbd> | Seek Backward 10 seconds |
| <kbd>Right Arrow</kbd> | Seek Forward 10 seconds |
| <kbd>Ctrl</kbd> + <kbd>Q</kbd> | Quit FlixDesk |

---

## 🏗️ Project Architecture

```text
FlixDesk/
├── flixdesk/
│   ├── __init__.py
│   ├── main.py               # Application bootstrap & Qt initialization
│   ├── window.py             # Main QWebEngineView window with shortcuts & state
│   ├── widevine.py           # Multi-path Widevine CDM locator
│   ├── mpris.py              # Linux MPRIS D-Bus provider (org.mpris.MediaPlayer2)
│   ├── tray.py               # Qt System Tray controller
│   ├── settings.py           # Persistent configuration manager
│   ├── preferences_dialog.py # Dark-themed Preferences modal
│   └── scripts/
│       ├── auto_skip.js      # Injected auto-skip intro/recap script
│       ├── force_1080p.js    # Injected 1080p stream unlocker
│       └── player_sync.js    # Injected player state extractor
├── assets/
│   └── icons/                # Multi-resolution PNGs (16-512px) & SVG icon
├── packaging/
│   ├── flatpak/
│   │   ├── io.github.Pak_Man926.FlixDesk.yml            # Flathub Flatpak Manifest
│   │   ├── io.github.Pak_Man926.FlixDesk.metainfo.xml   # AppStream Metadata
│   │   ├── io.github.Pak_Man926.FlixDesk.desktop        # Linux Desktop Entry file
│   │   ├── flixdesk.sh                                  # Flatpak launch script
│   │   └── apply_extra.sh                               # Widevine extractor for Flatpak
│   └── scripts/
│       ├── build-flatpak.sh                             # Flatpak builder script
│       └── extract-widevine.sh                          # Local Widevine installer
├── requirements.txt          # Python dependencies
├── run.sh                    # One-command local launcher
├── run_chrome.sh             # App-Mode Chrome launcher
└── README.md
```

---

## 🚀 How to Build & Publish to Flathub

FlixDesk is configured to be submitted directly to Flathub.

### Step 1: Build the Universal `.flatpak` Locally
Run the automated packaging script:
```bash
./packaging/scripts/build-flatpak.sh
```
This will compile the application sandbox and generate `FlixDesk.flatpak`.

### Step 2: Push Your Code to GitHub
```bash
git add .
git commit -m "feat: FlixDesk 1.0.0 initial release"
git remote add origin https://github.com/Pak-Man926/FlixDesk.git
git push -u origin main
```

### Step 3: Submit to Flathub
1. Fork the official [Flathub repository](https://github.com/flathub/flathub).
2. Create a new branch:
   ```bash
   git checkout -b new-pr/io.github.Pak_Man926.FlixDesk
   ```
3. Copy the files from `packaging/flatpak/` into a new folder named `io.github.Pak_Man926.FlixDesk`:
   ```bash
   mkdir io.github.Pak_Man926.FlixDesk
   cp /path/to/FlixDesk/packaging/flatpak/* io.github.Pak_Man926.FlixDesk/
   ```
4. Commit and open a Pull Request to `flathub/flathub`.
5. Once merged, FlixDesk will appear in software centers across all Linux distributions!

---

## ⚖️ Legal Disclaimer

**FlixDesk** is an open-source unofficial desktop wrapper for `netflix.com` and is **NOT** affiliated with, endorsed by, or sponsored by Netflix, Inc.

Netflix and all associated trademarks, logos, and brand elements are the intellectual property of Netflix, Inc. This project does not distribute copyrighted media streams, proprietary keys, or circumvention tools.

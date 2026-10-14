#!/bin/bash
set -e

# ==============================================================================
# FlixDesk - Desktop Shortcut Installer for Linux Desktops (GNOME, KDE, COSMIC)
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "=================================================="
echo " Installing FlixDesk Desktop Launcher..."
echo " Project Directory: $DIR"
echo "=================================================="

# 1. Install application icons
ICON_DIR="${HOME}/.local/share/icons/hicolor"
mkdir -p "${ICON_DIR}/512x512/apps"
cp "${DIR}/assets/icons/512x512.png" "${ICON_DIR}/512x512/apps/flixdesk.png"

for size in 16 32 48 64 128 256; do
    if [ -f "${DIR}/assets/icons/${size}x${size}.png" ]; then
        mkdir -p "${ICON_DIR}/${size}x${size}/apps"
        cp "${DIR}/assets/icons/${size}x${size}.png" "${ICON_DIR}/${size}x${size}/apps/flixdesk.png"
    fi
done

# 2. Install desktop entry
APP_DIR="${HOME}/.local/share/applications"
mkdir -p "$APP_DIR"
DESKTOP_FILE="${APP_DIR}/flixdesk.desktop"

cat << EOF > "$DESKTOP_FILE"
[Desktop Entry]
Name=FlixDesk
GenericName=Netflix Desktop Client
Comment=Unofficial Netflix desktop client for Linux with Widevine DRM and MPRIS
Exec="${DIR}/run.sh" %U
Path=${DIR}
Icon=flixdesk
Type=Application
StartupNotify=true
StartupWMClass=FlixDesk
Categories=AudioVideo;Video;Player;TV;Network;
Keywords=netflix;stream;video;movie;tv;series;mpris;media;brave;chrome;firefox;
Actions=BrowserMode;NativeMode;

[Desktop Action BrowserMode]
Name=Launch in Browser App Mode
Exec="${DIR}/run_browser.sh"

[Desktop Action NativeMode]
Name=Launch Native Client
Exec="${DIR}/run.sh" --native
EOF

chmod +x "$DESKTOP_FILE"

# 3. Update desktop database
which update-desktop-database >/dev/null 2>&1 && update-desktop-database "$APP_DIR" 2>/dev/null || true
which gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -f -t "${HOME}/.local/share/icons/hicolor" 2>/dev/null || true

echo "✓ FlixDesk desktop shortcut installed successfully!"
echo "  Location: $DESKTOP_FILE"
echo "  You can now launch FlixDesk from your application menu or dock."
echo "=================================================="

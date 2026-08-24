#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo " Building Universal Flatpak Package for FlixDesk"
echo " App ID: io.github.Pak_Man926.FlixDesk"
echo "=================================================="

# Check if flatpak-builder is installed
if ! which flatpak-builder >/dev/null 2>&1; then
    echo "[Error] flatpak-builder is not installed on your system."
    echo "Install it via your package manager:"
    echo "  sudo apt install flatpak-builder   # Ubuntu / Pop!_OS / Debian"
    echo "  sudo dnf install flatpak-builder   # Fedora"
    echo "  sudo pacman -S flatpak-builder     # Arch Linux"
    exit 1
fi

# Build directory
BUILD_DIR="${DIR}/build-dir"
REPO_DIR="${DIR}/repo"
BUNDLE_FILE="${DIR}/FlixDesk.flatpak"

mkdir -p "$BUILD_DIR" "$REPO_DIR"

echo "[1/3] Building Flatpak application sandbox..."
flatpak-builder --force-clean --user --install-deps-from=flathub "$BUILD_DIR" packaging/flatpak/io.github.Pak_Man926.FlixDesk.yml --repo="$REPO_DIR"

echo "[2/3] Exporting standalone universal bundle (.flatpak)..."
flatpak build-bundle "$REPO_DIR" "$BUNDLE_FILE" io.github.Pak_Man926.FlixDesk

echo "[3/3] Build Complete!"
echo "=================================================="
echo " Universal Flatpak Bundle Created:"
echo " -> ${BUNDLE_FILE}"
echo ""
echo "To test your bundle locally:"
echo "  flatpak install --user --bundle ${BUNDLE_FILE}"
echo "  flatpak run io.github.Pak_Man926.FlixDesk"
echo "=================================================="

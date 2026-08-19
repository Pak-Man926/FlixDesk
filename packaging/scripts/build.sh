#!/bin/bash
set -e

echo "=================================================="
echo " Building FlixDesk for Linux"
echo " App ID: io.github.Pak_Man926.FlixDesk"
echo "=================================================="

# 1. Compile TypeScript / verify distribution assets
echo "[1/4] Preparing compiled assets in dist/..."
mkdir -p dist/main dist/preload dist/renderer

# Copy renderer assets
cp -r src/renderer/* dist/renderer/

# 2. Check and generate icons
echo "[2/4] Verifying application icons..."
if [ ! -f "assets/icons/512x512.png" ]; then
    which convert >/dev/null 2>&1 && {
        convert -background none -density 300 assets/icons/flixdesk.svg -resize 512x512 assets/icons/512x512.png
        for size in 16 32 48 64 128 256; do
            convert assets/icons/512x512.png -resize ${size}x${size} assets/icons/${size}x${size}.png
        done
    }
fi

# 3. Check for Widevine
echo "[3/4] Checking Widevine CDM availability..."
if [ -f "/opt/google/chrome/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so" ]; then
    echo " -> Detected Widevine in Google Chrome"
elif [ -f "/usr/lib/chromium/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so" ]; then
    echo " -> Detected Widevine in Chromium"
else
    echo " -> Note: Run ./packaging/scripts/extract-widevine.sh if you need local standalone Widevine."
fi

# 4. Packaging overview
echo "[4/4] FlixDesk build is ready!"
echo ""
echo "To run FlixDesk locally:"
echo "  npm start   (or npx electron .)"
echo ""
echo "To build Flatpak package:"
echo "  flatpak-builder --force-clean --user --install-deps-from=flathub build-dir packaging/flatpak/io.github.Pak_Man926.FlixDesk.yml"
echo ""
echo "To build AppImage / deb / tar.gz:"
echo "  npm run build"
echo "=================================================="

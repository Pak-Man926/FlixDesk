#!/bin/bash
set -e

echo "=================================================="
echo " Starting FlixDesk (Official Chrome DRM Engine)"
echo "=================================================="

CHROME_BIN="/opt/google/chrome/google-chrome"
if [ ! -f "$CHROME_BIN" ]; then
    CHROME_BIN=$(which google-chrome-stable || which google-chrome)
fi

PROFILE_DIR="$HOME/.config/FlixDesk/chrome_profile"
mkdir -p "$PROFILE_DIR"

# Launch in dedicated, frameless standalone app mode
exec "$CHROME_BIN" \
    --app="https://www.netflix.com/browse" \
    --user-data-dir="$PROFILE_DIR" \
    --class="FlixDesk" \
    --name="FlixDesk" \
    --window-size=1280,720 \
    --enable-features=VaapiVideoDecoder,VaapiVideoDecodeLinuxGL \
    --enable-accelerated-video-decode \
    --enable-gpu-rasterization \
    --ignore-gpu-blocklist \
    --autoplay-policy=no-user-gesture-required \
    "$@"

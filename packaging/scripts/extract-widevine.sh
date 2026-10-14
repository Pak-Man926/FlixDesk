#!/bin/bash
set -e

# Helper script to download and install Widevine CDM for local development/testing
TARGET_DIR="${HOME}/.config/FlixDesk/WidevineCdm"
PLATFORM_DIR="${TARGET_DIR}/_platform_specific/linux_x64"

echo "=================================================="
echo " FlixDesk - Widevine CDM Local Setup Utility"
echo "=================================================="

# Check if FlixDesk already has Widevine installed
if [ -f "$PLATFORM_DIR/libwidevinecdm.so" ] || [ -f "$TARGET_DIR/libwidevinecdm.so" ]; then
    echo "✓ Widevine CDM is already installed for FlixDesk at: $TARGET_DIR"
    exit 0
fi

# Check if an existing browser already has Widevine
CANDIDATE_DIRS=(
    "/opt/google/chrome/WidevineCdm"
    "/opt/google/chrome-beta/WidevineCdm"
    "/opt/brave.com/brave/WidevineCdm"
    "/usr/lib/chromium/WidevineCdm"
    "/usr/lib/chromium-browser/WidevineCdm"
    "/opt/microsoft/msedge/WidevineCdm"
    "/opt/vivaldi/WidevineCdm"
)

# Also check user component updater paths (Brave, Chrome, Chromium)
for comp_dir in "${HOME}/.config/BraveSoftware/Brave-Browser/WidevineCdm"/* \
                "${HOME}/.config/google-chrome/WidevineCdm"/* \
                "${HOME}/.config/chromium/WidevineCdm"/* \
                "${HOME}/.config/microsoft-edge/WidevineCdm"/*; do
    if [ -d "$comp_dir" ]; then
        CANDIDATE_DIRS+=("$comp_dir")
    fi
done

for dir in "${CANDIDATE_DIRS[@]}"; do
    if [ -f "$dir/_platform_specific/linux_x64/libwidevinecdm.so" ]; then
        echo "Found Widevine CDM from existing browser at: $dir"
        mkdir -p "$PLATFORM_DIR"
        cp -r "$dir"/* "$TARGET_DIR/"
        echo "Successfully copied Widevine to FlixDesk ($TARGET_DIR)."
        exit 0
    elif [ -f "$dir/libwidevinecdm.so" ]; then
        echo "Found Widevine CDM (flat) at: $dir"
        mkdir -p "$PLATFORM_DIR"
        cp -r "$dir"/* "$TARGET_DIR/"
        mkdir -p "$PLATFORM_DIR"
        cp "$dir/libwidevinecdm.so" "$PLATFORM_DIR/"
        echo "Successfully copied Widevine to FlixDesk ($TARGET_DIR)."
        exit 0
    fi
done

echo "Downloading official Google Chrome package to extract Widevine CDM..."
TMP_WORK_DIR=$(mktemp -d)
cd "$TMP_WORK_DIR"

curl -L -o chrome.deb "https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb"

echo "Extracting Widevine CDM..."
ar p chrome.deb data.tar.xz | tar -xJ ./opt/google/chrome/WidevineCdm 2>/dev/null || \
ar p chrome.deb data.tar.zst | tar -x --zstd ./opt/google/chrome/WidevineCdm 2>/dev/null || \
ar p chrome.deb data.tar.gz | tar -xz ./opt/google/chrome/WidevineCdm 2>/dev/null

if [ -d "opt/google/chrome/WidevineCdm" ]; then
    mkdir -p "$TARGET_DIR"
    cp -r opt/google/chrome/WidevineCdm/* "$TARGET_DIR/"
    echo "Widevine CDM successfully installed to: $TARGET_DIR"
else
    echo "Error: Could not locate WidevineCdm inside package."
    exit 1
fi

# Cleanup
cd /
rm -rf "$TMP_WORK_DIR"
echo "Done! FlixDesk is now ready for DRM playback."

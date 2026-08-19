#!/bin/bash
set -e

# Helper script to download and install Widevine CDM for local development/testing
TARGET_DIR="${HOME}/.config/FlixDesk/WidevineCdm"
PLATFORM_DIR="${TARGET_DIR}/_platform_specific/linux_x64"

echo "=================================================="
echo " FlixDesk - Widevine CDM Local Setup Utility"
echo "=================================================="

# Check if Google Chrome or Chromium already has Widevine
SYSTEM_WIDEVINE="/opt/google/chrome/WidevineCdm/_platform_specific/linux_x64/libwidevinecdm.so"
if [ -f "$SYSTEM_WIDEVINE" ]; then
    echo "Found system Google Chrome Widevine at: $SYSTEM_WIDEVINE"
    mkdir -p "$PLATFORM_DIR"
    cp -r /opt/google/chrome/WidevineCdm/* "$TARGET_DIR/"
    echo "Successfully linked system Widevine to FlixDesk."
    exit 0
fi

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

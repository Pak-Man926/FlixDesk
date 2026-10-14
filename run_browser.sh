#!/bin/bash
set -e

# ==============================================================================
# FlixDesk - Universal Multi-Browser Standalone Launcher
# Supports: Brave, Google Chrome, Mozilla Firefox, Chromium, Microsoft Edge, Vivaldi, Opera
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Helper functions
find_binary() {
    for cmd in "$@"; do
        if [ -x "$cmd" ]; then
            echo "$cmd"
            return 0
        fi
        local found
        found=$(command -v "$cmd" 2>/dev/null || true)
        if [ -n "$found" ] && [ -x "$found" ]; then
            echo "$found"
            return 0
        fi
    done
    return 1
}

# Browser candidate definitions
get_browser_bin() {
    local b_type="$1"
    case "$b_type" in
        chrome|google-chrome)
            find_binary "/opt/google/chrome/google-chrome" "google-chrome-stable" "google-chrome" "chrome"
            ;;
        brave|brave-browser)
            find_binary "/usr/bin/brave-browser" "/opt/brave.com/brave/brave-browser" "brave-browser" "brave" "/snap/bin/brave"
            ;;
        chromium)
            find_binary "/usr/bin/chromium" "/usr/bin/chromium-browser" "chromium" "chromium-browser" "/snap/bin/chromium"
            ;;
        edge|msedge)
            find_binary "/opt/microsoft/msedge/msedge" "microsoft-edge-stable" "microsoft-edge"
            ;;
        vivaldi)
            find_binary "/usr/bin/vivaldi-stable" "/opt/vivaldi/vivaldi" "vivaldi-stable" "vivaldi"
            ;;
        opera)
            find_binary "/usr/bin/opera" "opera" "opera-beta"
            ;;
        firefox|mozilla)
            find_binary "/usr/bin/firefox" "firefox" "/snap/bin/firefox"
            ;;
        *)
            return 1
            ;;
    esac
}

list_all_browsers() {
    echo "=================================================="
    echo " Detected Compatible Browsers for FlixDesk:"
    echo "=================================================="
    local types=("brave" "chrome" "firefox" "chromium" "edge" "vivaldi" "opera")
    local found_any=0
    for t in "${types[@]}"; do
        local bin
        bin=$(get_browser_bin "$t" || true)
        if [ -n "$bin" ]; then
            printf "  [INSTALLED] %-10s -> %s\n" "$t" "$bin"
            found_any=1
        else
            printf "  [NOT FOUND] %-10s\n" "$t"
        fi
    done
    echo "=================================================="
    if [ "$found_any" -eq 0 ]; then
        echo "No supported browsers found on PATH."
    fi
}

show_help() {
    echo "FlixDesk - Standalone Multi-Browser Launcher"
    echo ""
    echo "Usage: ./run_browser.sh [OPTIONS] [-- [BROWSER_FLAGS]]"
    echo ""
    echo "Options:"
    echo "  -b, --browser <name>  Specify browser: brave, chrome, firefox, chromium, edge, vivaldi, opera"
    echo "  -l, --list            List detected compatible browsers on this machine"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BROWSER=<name>        Override target browser (e.g. BROWSER=brave ./run_browser.sh)"
    echo ""
    echo "Examples:"
    echo "  ./run_browser.sh                  # Auto-detects and launches best available browser"
    echo "  ./run_browser.sh -b brave         # Launch in Brave Browser"
    echo "  ./run_browser.sh -b firefox       # Launch in Mozilla Firefox"
    echo "  ./run_browser.sh -b chrome        # Launch in Google Chrome"
}

# Parse Command Line Options
REQUESTED_BROWSER="${BROWSER:-}"
PASSTHROUGH_ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        -b|--browser)
            REQUESTED_BROWSER="$2"
            shift 2
            ;;
        --browser=*)
            REQUESTED_BROWSER="${1#*=}"
            shift
            ;;
        -l|--list|--list-browsers)
            list_all_browsers
            exit 0
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        --)
            shift
            PASSTHROUGH_ARGS+=("$@")
            break
            ;;
        *)
            PASSTHROUGH_ARGS+=("$1")
            shift
            ;;
    esac
done

SELECTED_TYPE=""
SELECTED_BIN=""

if [ -n "$REQUESTED_BROWSER" ]; then
    SELECTED_TYPE=$(echo "$REQUESTED_BROWSER" | tr '[:upper:]' '[:lower:]')
    SELECTED_BIN=$(get_browser_bin "$SELECTED_TYPE" || true)
    if [ -z "$SELECTED_BIN" ]; then
        echo "[FlixDesk Error] Requested browser '$REQUESTED_BROWSER' is not installed or executable."
        echo ""
        list_all_browsers
        exit 1
    fi
else
    # Auto-detection priority:
    # 1. Chrome
    # 2. Brave
    # 3. Chromium
    # 4. Microsoft Edge
    # 5. Vivaldi
    # 6. Firefox
    # 7. Opera
    SEARCH_ORDER=("chrome" "brave" "chromium" "edge" "vivaldi" "firefox" "opera")
    for b in "${SEARCH_ORDER[@]}"; do
        bin=$(get_browser_bin "$b" || true)
        if [ -n "$bin" ]; then
            SELECTED_TYPE="$b"
            SELECTED_BIN="$bin"
            break
        fi
    done
fi

if [ -z "$SELECTED_BIN" ]; then
    echo "[FlixDesk Error] No supported web browser could be found."
    echo "Please install one of the following browsers to run FlixDesk:"
    echo "  - Brave:            sudo apt install brave-browser (or https://brave.com)"
    echo "  - Google Chrome:    https://www.google.com/chrome/"
    echo "  - Mozilla Firefox:  sudo apt install firefox"
    echo "  - Chromium:         sudo apt install chromium-browser"
    exit 1
fi

echo "=================================================="
echo " Starting FlixDesk Standalone"
echo " Engine:  $SELECTED_TYPE"
echo " Binary:  $SELECTED_BIN"
echo "=================================================="

# Profile directories
BASE_CONFIG_DIR="${HOME}/.config/FlixDesk"
mkdir -p "$BASE_CONFIG_DIR"

# Widevine locator helper for Chromium profiles
setup_widevine_for_profile() {
    local profile_path="$1"
    local cdm_profile_dir="${profile_path}/WidevineCdm"
    mkdir -p "$cdm_profile_dir"

    # Search for available Widevine CDM
    local WIDEVINE_DIR=""
    local candidates=(
        "${BASE_CONFIG_DIR}/WidevineCdm"
        "/opt/google/chrome/WidevineCdm"
        "/opt/brave.com/brave/WidevineCdm"
        "/opt/brave.com/brave/resources/widevine_cdm"
        "/usr/lib/chromium/WidevineCdm"
        "/usr/lib/chromium-browser/WidevineCdm"
        "/opt/microsoft/msedge/WidevineCdm"
        "/opt/vivaldi/WidevineCdm"
    )

    # Check candidate directories
    for d in "${candidates[@]}"; do
        if [ -f "$d/_platform_specific/linux_x64/libwidevinecdm.so" ] || [ -f "$d/libwidevinecdm.so" ]; then
            WIDEVINE_DIR="$d"
            break
        fi
    done

    # Check versioned directories in browser configs
    if [ -z "$WIDEVINE_DIR" ]; then
        for comp in "${HOME}/.config/BraveSoftware/Brave-Browser/WidevineCdm"/* \
                    "${HOME}/.config/google-chrome/WidevineCdm"/* \
                    "${HOME}/.config/chromium/WidevineCdm"/* \
                    "${HOME}/.config/microsoft-edge/WidevineCdm"/*; do
            if [ -d "$comp" ] && ([ -f "$comp/_platform_specific/linux_x64/libwidevinecdm.so" ] || [ -f "$comp/libwidevinecdm.so" ]); then
                WIDEVINE_DIR="$comp"
                break
            fi
        done
    fi

    if [ -n "$WIDEVINE_DIR" ]; then
        echo "[FlixDesk DRM] Linking Widevine CDM from: $WIDEVINE_DIR"
        echo "{\"LastBundledVersion\":\"4.10.3050.0\",\"Path\":\"$WIDEVINE_DIR\"}" > "${cdm_profile_dir}/latest-component-updated-widevine-cdm"
    else
        echo "[FlixDesk DRM] Notice: System Widevine not yet linked."
        echo "               If playback prompts for DRM, run: ./packaging/scripts/extract-widevine.sh"
    fi
}

# Launch according to engine type
if [ "$SELECTED_TYPE" = "firefox" ]; then
    PROFILE_DIR="${BASE_CONFIG_DIR}/firefox_profile"
    mkdir -p "$PROFILE_DIR"

    # Configure DRM preferences in Firefox profile user.js
    cat << 'EOF' > "${PROFILE_DIR}/user.js"
user_pref("media.eme.enabled", true);
user_pref("media.gmp-widevinecdm.enabled", true);
user_pref("media.gmp-widevinecdm.visible", true);
user_pref("media.gmp-widevinecdm.autoupdate", true);
user_pref("media.autoplay.default", 0);
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
EOF

    echo "[FlixDesk] Launching dedicated Netflix window in Mozilla Firefox..."
    exec "$SELECTED_BIN" \
        --profile "$PROFILE_DIR" \
        --class "FlixDesk" \
        --name "FlixDesk" \
        --new-window "https://www.netflix.com/browse" \
        "${PASSTHROUGH_ARGS[@]}"

else
    # Chromium-based: Chrome, Brave, Chromium, Edge, Vivaldi, Opera
    PROFILE_DIR="${BASE_CONFIG_DIR}/browser_profile"

    # Migrate from old chrome_profile if it exists and browser_profile is empty
    if [ -d "${BASE_CONFIG_DIR}/chrome_profile" ] && [ ! -d "$PROFILE_DIR" ]; then
        echo "[FlixDesk] Migrating existing user session from chrome_profile..."
        cp -r "${BASE_CONFIG_DIR}/chrome_profile" "$PROFILE_DIR" 2>/dev/null || true
    fi
    mkdir -p "$PROFILE_DIR"

    # Setup Widevine component registration
    setup_widevine_for_profile "$PROFILE_DIR"

    if [ "$SELECTED_TYPE" = "brave" ]; then
        echo "[FlixDesk] Brave Browser Engine Active."
        echo "           Tip: If Netflix shows error M7701-1003 on first run, verify Widevine is toggled ON in brave://settings/extensions"
    fi

    # Launch Chromium in dedicated standalone App Mode
    exec "$SELECTED_BIN" \
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
        "${PASSTHROUGH_ARGS[@]}"
fi

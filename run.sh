#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

show_help() {
    echo "FlixDesk - Standalone Linux Launcher"
    echo ""
    echo "Usage: ./run.sh [MODE] [OPTIONS]"
    echo ""
    echo "Modes:"
    echo "  (default)             Run native desktop client (Python + QtWebEngine + MPRIS)"
    echo "  --browser, -b [NAME]  Run standalone browser mode (Brave, Chrome, Firefox, etc.)"
    echo "  --native              Force native Python client"
    echo "  --list, -l            List detected compatible browsers"
    echo "  --help, -h            Show this help dialog"
    echo ""
    echo "Examples:"
    echo "  ./run.sh                  # Launches native client (or browser if PySide6 unavailable)"
    echo "  ./run.sh --browser        # Launches universal browser app mode"
    echo "  ./run.sh -b brave         # Launches in Brave Browser"
    echo "  ./run.sh -b firefox       # Launches in Mozilla Firefox"
}

# Check for browser flags
if [ "$1" = "--browser" ] || [ "$1" = "-b" ] || [[ "$1" == --browser=* ]]; then
    exec "$DIR/run_browser.sh" "$@"
elif [ "$1" = "--list" ] || [ "$1" = "-l" ]; then
    exec "$DIR/run_browser.sh" --list
elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
elif [ "$1" = "--native" ]; then
    shift
fi

echo "=================================================="
echo " Starting FlixDesk (Native QtWebEngine Stack)"
echo "=================================================="

# Check if PySide6 is installed
if ! python3 -c "import PySide6" 2>/dev/null; then
    echo "[FlixDesk] PySide6 not found. Attempting to install PySide6..."
    if ! (pip3 install PySide6 --break-system-packages 2>/dev/null || pip3 install PySide6 2>/dev/null); then
        echo ""
        echo "[FlixDesk Notice] PySide6 could not be automatically installed via pip."
        echo "                  Switching seamlessly to Universal Browser App Mode..."
        echo "                  (To use the native client later, install PySide6 via your package manager or virtualenv)"
        echo ""
        exec "$DIR/run_browser.sh" "$@"
    fi
fi

# Run Native FlixDesk
python3 flixdesk.py "$@"

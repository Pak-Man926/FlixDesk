#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Check if Google Chrome is installed; otherwise fall back to any installed browser
if which google-chrome-stable >/dev/null 2>&1 || which google-chrome >/dev/null 2>&1 || [ -x "/opt/google/chrome/google-chrome" ]; then
    exec "$DIR/run_browser.sh" --browser chrome "$@"
else
    echo "[FlixDesk] Notice: Google Chrome is not installed. Auto-detecting available browser..."
    exec "$DIR/run_browser.sh" "$@"
fi

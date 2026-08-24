#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo " Starting FlixDesk (Python + QtWebEngine Stack)"
echo "=================================================="

# Check if PySide6 is installed
if ! python3 -c "import PySide6" 2>/dev/null; then
    echo "[FlixDesk] PySide6 not found. Installing PySide6..."
    pip3 install PySide6 --break-system-packages 2>/dev/null || pip3 install PySide6
fi

# Run FlixDesk
python3 flixdesk.py "$@"

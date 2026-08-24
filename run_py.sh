#!/bin/bash
set -e

echo "=================================================="
echo " Starting FlixDesk (Native QtWebEngine DRM Engine)"
echo "=================================================="

# Check if PySide6 is installed
if ! python3 -c "import PySide6" 2>/dev/null; then
    echo "Installing PySide6 (QtWebEngine)..."
    pip3 install PySide6 --break-system-packages 2>/dev/null || pip3 install PySide6
fi

# Run native FlixDesk
python3 flixdesk.py

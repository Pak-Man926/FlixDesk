"""
FlixDesk - Main Application Entry Point
"""

import sys
import os

# 1. Discover Widevine & Configure Chromium Environment Variables BEFORE initializing Qt
from .widevine import widevine
from .settings import settings

hw_accel = settings.get("enableHardwareAcceleration", True)
wayland = settings.get("enableWayland", True)
widevine.configure_environment(enable_hw_accel=hw_accel, enable_wayland=wayland)

# 2. Initialize Qt Application
try:
    from PySide6.QtWidgets import QApplication
    from PySide6.QtCore import Qt
    from .window import FlixDeskWindow
except ImportError as e:
    print(f"[FlixDesk] Error importing PySide6: {e}")
    print("[FlixDesk] Please install PySide6 using: pip3 install PySide6")
    sys.exit(1)


def main():
    # Set high-DPI scaling attributes if available
    app = QApplication(sys.argv)
    app.setApplicationName("FlixDesk")
    app.setApplicationDisplayName("FlixDesk")
    app.setOrganizationName("Pak-Man926")
    app.setOrganizationDomain("io.github.Pak_Man926")

    window = FlixDeskWindow()

    if not settings.get("startMinimized", False):
        window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()

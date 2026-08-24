"""
FlixDesk - System Tray Controller
Manages the Linux system tray icon and context menu actions.
"""

import os
from typing import Optional
from PySide6.QtCore import QObject, Signal
from PySide6.QtGui import QIcon, QAction
from PySide6.QtWidgets import QSystemTrayIcon, QMenu, QApplication


class TrayManager(QObject):
    action_triggered = Signal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.tray: Optional[QSystemTrayIcon] = None
        self.menu: Optional[QMenu] = None

    def init(self, icon_path: str) -> bool:
        if not QSystemTrayIcon.isSystemTrayAvailable():
            print("[Tray] System tray is not available on this desktop environment.")
            return False

        self.tray = QSystemTrayIcon(self)
        if os.path.exists(icon_path):
            self.tray.setIcon(QIcon(icon_path))
        self.tray.setToolTip("FlixDesk - Netflix Desktop")

        self.menu = QMenu()
        self.menu.setStyleSheet("""
            QMenu {
                background-color: #181818;
                color: #e5e5e5;
                border: 1px solid #333;
                padding: 4px;
            }
            QMenu::item {
                padding: 6px 20px;
                border-radius: 3px;
            }
            QMenu::item:selected {
                background-color: #e50914;
                color: #ffffff;
            }
            QMenu::separator {
                height: 1px;
                background: #333;
                margin: 4px 8px;
            }
        """)

        # Actions
        show_action = QAction("Show FlixDesk", self)
        show_action.triggered.connect(lambda: self.action_triggered.emit("show"))
        self.menu.addAction(show_action)

        play_action = QAction("Play / Pause", self)
        play_action.triggered.connect(lambda: self.action_triggered.emit("play_pause"))
        self.menu.addAction(play_action)

        next_action = QAction("Next Episode", self)
        next_action.triggered.connect(lambda: self.action_triggered.emit("next"))
        self.menu.addAction(next_action)

        self.menu.addSeparator()

        settings_action = QAction("Preferences...", self)
        settings_action.triggered.connect(lambda: self.action_triggered.emit("settings"))
        self.menu.addAction(settings_action)

        self.menu.addSeparator()

        quit_action = QAction("Quit FlixDesk", self)
        quit_action.triggered.connect(lambda: self.action_triggered.emit("quit"))
        self.menu.addAction(quit_action)

        self.tray.setContextMenu(self.menu)
        self.tray.activated.connect(self.on_tray_activated)
        self.tray.show()
        return True

    def on_tray_activated(self, reason):
        if reason == QSystemTrayIcon.ActivationReason.Trigger:
            self.action_triggered.emit("toggle_visibility")

    def hide(self):
        if self.tray:
            self.tray.hide()

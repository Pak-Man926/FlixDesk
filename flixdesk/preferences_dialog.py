"""
FlixDesk - Preferences Dialog
Modern dark-themed Qt settings interface for configuring streaming and desktop integrations.
"""

from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QIcon, QFont
from PySide6.QtWidgets import (
    QDialog,
    QVBoxLayout,
    QHBoxLayout,
    QTabWidget,
    QWidget,
    QLabel,
    QCheckBox,
    QPushButton,
    QGroupBox,
    QFormLayout,
    QScrollArea,
    QFrame,
)
from .settings import settings
from .widevine import widevine

DARK_STYLESHEET = """
QDialog {
    background-color: #141414;
    color: #e5e5e5;
    font-family: 'Segoe UI', 'Ubuntu', 'DejaVu Sans', sans-serif;
}
QTabWidget::pane {
    border: 1px solid #333;
    background-color: #181818;
    border-radius: 6px;
}
QTabBar::tab {
    background-color: #222;
    color: #aaa;
    padding: 10px 20px;
    margin-right: 4px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    font-weight: bold;
}
QTabBar::tab:selected {
    background-color: #e50914;
    color: #fff;
}
QGroupBox {
    color: #e5e5e5;
    font-weight: bold;
    border: 1px solid #333;
    border-radius: 6px;
    margin-top: 12px;
    padding-top: 16px;
    padding-bottom: 8px;
}
QGroupBox::title {
    subcontrol-origin: margin;
    left: 10px;
    padding: 0 4px;
    color: #e50914;
}
QCheckBox {
    color: #e5e5e5;
    spacing: 8px;
    font-size: 13px;
    padding: 4px 0;
}
QCheckBox::indicator {
    width: 18px;
    height: 18px;
    border-radius: 3px;
    border: 1px solid #555;
    background-color: #222;
}
QCheckBox::indicator:checked {
    background-color: #e50914;
    border-color: #e50914;
}
QPushButton {
    background-color: #333;
    color: #fff;
    border: 1px solid #444;
    border-radius: 4px;
    padding: 8px 18px;
    font-weight: bold;
    font-size: 13px;
}
QPushButton:hover {
    background-color: #444;
    border-color: #666;
}
QPushButton#saveBtn {
    background-color: #e50914;
    border-color: #e50914;
}
QPushButton#saveBtn:hover {
    background-color: #f40612;
}
QLabel {
    color: #bbb;
    font-size: 13px;
}
"""


class PreferencesDialog(QDialog):
    settings_saved = Signal(dict)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("FlixDesk Preferences")
        self.resize(560, 480)
        self.setStyleSheet(DARK_STYLESHEET)

        self.layout = QVBoxLayout(self)

        # Header Title
        title_label = QLabel("FlixDesk Settings")
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title_label.setFont(title_font)
        title_label.setStyleSheet("color: #e5e5e5; margin-bottom: 8px;")
        self.layout.addWidget(title_label)

        # Tab Widget
        self.tabs = QTabWidget()
        self.layout.addWidget(self.tabs)

        self.create_playback_tab()
        self.create_desktop_tab()
        self.create_about_tab()

        # Action Buttons
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()

        self.cancel_btn = QPushButton("Cancel")
        self.cancel_btn.clicked.connect(self.reject)
        btn_layout.addWidget(self.cancel_btn)

        self.save_btn = QPushButton("Save Preferences")
        self.save_btn.setObjectName("saveBtn")
        self.save_btn.clicked.connect(self.save_and_close)
        btn_layout.addWidget(self.save_btn)

        self.layout.addLayout(btn_layout)

    def create_playback_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        # Auto-Skip Group
        skip_group = QGroupBox("Smart Auto-Skip")
        skip_layout = QVBoxLayout(skip_group)

        self.chk_skip_intro = QCheckBox("Auto-Skip Show Intros")
        self.chk_skip_intro.setChecked(settings.get("autoSkipIntro", True))
        skip_layout.addWidget(self.chk_skip_intro)

        self.chk_skip_recap = QCheckBox("Auto-Skip Episode Recaps")
        self.chk_skip_recap.setChecked(settings.get("autoSkipRecap", True))
        skip_layout.addWidget(self.chk_skip_recap)

        self.chk_play_next = QCheckBox("Auto-Play Next Episode")
        self.chk_play_next.setChecked(settings.get("autoPlayNext", True))
        skip_layout.addWidget(self.chk_play_next)

        layout.addWidget(skip_group)

        # Video Profile Group
        video_group = QGroupBox("Stream Quality")
        video_layout = QVBoxLayout(video_group)

        self.chk_force_1080p = QCheckBox("Force 1080p Full HD Streams (Overrides 720p limit on Linux)")
        self.chk_force_1080p.setChecked(settings.get("force1080p", True))
        video_layout.addWidget(self.chk_force_1080p)

        layout.addWidget(video_group)
        layout.addStretch()

        self.tabs.addTab(tab, "Playback")

    def create_desktop_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        # Linux Integration Group
        integ_group = QGroupBox("Linux Desktop Integration")
        integ_layout = QVBoxLayout(integ_group)

        self.chk_mpris = QCheckBox("Enable Linux MPRIS D-Bus (Media Keys & Lock Screen controls)")
        self.chk_mpris.setChecked(settings.get("enableMpris", True))
        integ_layout.addWidget(self.chk_mpris)

        self.chk_tray = QCheckBox("Enable System Tray Icon")
        self.chk_tray.setChecked(settings.get("enableTray", True))
        integ_layout.addWidget(self.chk_tray)

        self.chk_close_tray = QCheckBox("Close window to System Tray (Keep running in background)")
        self.chk_close_tray.setChecked(settings.get("closeToTray", True))
        integ_layout.addWidget(self.chk_close_tray)

        layout.addWidget(integ_group)

        # Hardware Acceleration Group
        hw_group = QGroupBox("Hardware & Rendering")
        hw_layout = QVBoxLayout(hw_group)

        self.chk_hw_accel = QCheckBox("Enable Hardware Accelerated Video Decoding (VA-API / GPU)")
        self.chk_hw_accel.setChecked(settings.get("enableHardwareAcceleration", True))
        hw_layout.addWidget(self.chk_hw_accel)

        self.chk_wayland = QCheckBox("Enable Native Wayland Support")
        self.chk_wayland.setChecked(settings.get("enableWayland", True))
        hw_layout.addWidget(self.chk_wayland)

        layout.addWidget(hw_group)
        layout.addStretch()

        self.tabs.addTab(tab, "Desktop")

    def create_about_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        about_group = QGroupBox("FlixDesk Information")
        about_layout = QFormLayout(about_group)

        about_layout.addRow("Version:", QLabel("1.0.0 (Python + QtWebEngine)"))
        about_layout.addRow("Application ID:", QLabel("io.github.Pak_Man926.FlixDesk"))
        about_layout.addRow("Developer:", QLabel("Pak-Man926"))
        about_layout.addRow("License:", QLabel("GPL-3.0-or-later"))

        layout.addWidget(about_group)

        # Widevine Diagnostic Group
        wv_group = QGroupBox("Widevine DRM Status")
        wv_layout = QFormLayout(wv_group)

        info = widevine.discover()
        status_text = "Found & Loaded" if info.get("found") else "Not Detected"
        status_label = QLabel(status_text)
        status_label.setStyleSheet("color: #46d369; font-weight: bold;" if info.get("found") else "color: #e50914;")

        wv_layout.addRow("DRM Status:", status_label)
        wv_layout.addRow("CDM Source:", QLabel(str(info.get("source") or "None")))
        wv_layout.addRow("Library Path:", QLabel(str(info.get("path") or "None")))

        layout.addWidget(wv_group)
        layout.addStretch()

        self.tabs.addTab(tab, "About & Diagnostics")

    def save_and_close(self):
        new_settings = {
            "autoSkipIntro": self.chk_skip_intro.isChecked(),
            "autoSkipRecap": self.chk_skip_recap.isChecked(),
            "autoPlayNext": self.chk_play_next.isChecked(),
            "force1080p": self.chk_force_1080p.isChecked(),
            "enableMpris": self.chk_mpris.isChecked(),
            "enableTray": self.chk_tray.isChecked(),
            "closeToTray": self.chk_close_tray.isChecked(),
            "enableHardwareAcceleration": self.chk_hw_accel.isChecked(),
            "enableWayland": self.chk_wayland.isChecked(),
        }
        settings.update_all(new_settings)
        self.settings_saved.emit(new_settings)
        self.accept()

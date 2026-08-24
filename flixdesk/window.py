"""
FlixDesk - Main Window
Hosts the QWebEngineView for Netflix with injected streaming enhancements,
fullscreen handling, MPRIS synchronization, and window state persistence.
"""

import os
from pathlib import Path
from PySide6.QtCore import QUrl, Qt, QTimer
from PySide6.QtGui import QIcon, QKeySequence, QShortcut, QCloseEvent
from PySide6.QtWidgets import QMainWindow, QApplication
from PySide6.QtWebEngineCore import (
    QWebEngineProfile,
    QWebEngineSettings,
    QWebEnginePage,
    QWebEngineScript,
)
from PySide6.QtWebEngineWidgets import QWebEngineView

from .settings import settings
from .widevine import widevine
from .mpris import MprisManager
from .tray import TrayManager
from .preferences_dialog import PreferencesDialog

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
)


class NetflixWebPage(QWebEnginePage):
    """Custom WebEnginePage that automatically approves all media and DRM permissions"""

    def __init__(self, profile, parent=None):
        super().__init__(profile, parent)
        self.featurePermissionRequested.connect(self.handle_permission)

    def handle_permission(self, security_origin, feature):
        print(f"[FlixDesk Page] Auto-granting permission for feature: {feature} to {security_origin.toString()}")
        self.setFeaturePermission(security_origin, feature, QWebEnginePage.PermissionPolicy.PermissionGrantedByUser)


class FlixDeskWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("FlixDesk")
        self.is_quitting = False

        # Load icon
        self.icon_path = os.path.join(os.path.dirname(__file__), "..", "assets", "icons", "512x512.png")
        if os.path.exists(self.icon_path):
            self.setWindowIcon(QIcon(self.icon_path))

        # Restore saved window geometry
        self.restore_window_bounds()

        # Setup Profile & Persistent Storage
        storage_path = str(Path.home() / ".config" / "FlixDesk" / "qt_profile")
        os.makedirs(storage_path, exist_ok=True)

        self.profile = QWebEngineProfile("FlixDeskProfile", self)
        self.profile.setPersistentStoragePath(storage_path)
        self.profile.setPersistentCookiesPolicy(QWebEngineProfile.PersistentCookiesPolicy.AllowPersistentCookies)

        # Set User Agent
        ua = settings.get("customUserAgent") or DEFAULT_USER_AGENT
        self.profile.setHttpUserAgent(ua)

        # Configure WebEngine Settings
        web_settings = self.profile.settings()
        web_settings.setAttribute(QWebEngineSettings.WebAttribute.PluginsEnabled, True)
        web_settings.setAttribute(QWebEngineSettings.WebAttribute.FullScreenSupportEnabled, True)
        web_settings.setAttribute(QWebEngineSettings.WebAttribute.PlaybackRequiresUserGesture, False)
        web_settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptCanAccessClipboard, True)
        web_settings.setAttribute(QWebEngineSettings.WebAttribute.LocalStorageEnabled, True)

        # Inject Scripts
        self.inject_scripts()

        # Create Web View
        self.browser = QWebEngineView(self)
        self.page = NetflixWebPage(self.profile, self.browser)
        self.browser.setPage(self.page)
        self.setCentralWidget(self.browser)

        # Fullscreen handling from HTML5 video player
        self.page.fullScreenRequested.connect(self.handle_fullscreen_request)

        # Setup Shortcuts
        self.setup_shortcuts()

        # Setup MPRIS
        self.mpris = MprisManager(self.handle_app_action)
        if settings.get("enableMpris", True):
            self.mpris.init()

        # Setup Tray
        self.tray = TrayManager(self)
        if settings.get("enableTray", True):
            self.tray.init(self.icon_path)
            self.tray.action_triggered.connect(self.handle_app_action)

        # Setup State Polling Timer for MPRIS
        self.poll_timer = QTimer(self)
        self.poll_timer.setInterval(1000)
        self.poll_timer.timeout.connect(self.sync_player_state)
        self.poll_timer.start()

        # Load Netflix
        print(f"[FlixDesk] Loading Netflix...")
        self.browser.setUrl(QUrl("https://www.netflix.com"))

    def restore_window_bounds(self):
        bounds = settings.get("windowBounds", {})
        w = bounds.get("width", 1280)
        h = bounds.get("height", 720)
        x = bounds.get("x")
        y = bounds.get("y")

        self.resize(w, h)
        self.setMinimumSize(800, 500)

        if x is not None and y is not None:
            self.move(x, y)

        if bounds.get("isMaximized"):
            self.showMaximized()

    def save_window_bounds(self):
        if not self.isFullScreen() and not self.isMinimized():
            bounds = {
                "width": self.width(),
                "height": self.height(),
                "x": self.x(),
                "y": self.y(),
                "isMaximized": self.isMaximized(),
            }
            settings.set("windowBounds", bounds)

    def inject_scripts(self):
        scripts_dir = Path(__file__).parent / "scripts"

        # 1. Auto-Skip Script
        auto_skip_file = scripts_dir / "auto_skip.js"
        if auto_skip_file.exists():
            s = QWebEngineScript()
            s.setSourceCode(auto_skip_file.read_text(encoding="utf-8"))
            s.setName("FlixDeskAutoSkip")
            s.setWorldId(QWebEngineScript.ScriptWorldId.MainWorld)
            s.setInjectionPoint(QWebEngineScript.InjectionPoint.DocumentReady)
            s.setRunsOnSubFrames(True)
            self.profile.scripts().insert(s)

        # 2. 1080p Stream Enabler Script
        force_1080p_file = scripts_dir / "force_1080p.js"
        if force_1080p_file.exists():
            s = QWebEngineScript()
            s.setSourceCode(force_1080p_file.read_text(encoding="utf-8"))
            s.setName("FlixDeskForce1080p")
            s.setWorldId(QWebEngineScript.ScriptWorldId.MainWorld)
            s.setInjectionPoint(QWebEngineScript.InjectionPoint.DocumentCreation)
            s.setRunsOnSubFrames(True)
            self.profile.scripts().insert(s)

        # 3. Player Sync Script
        player_sync_file = scripts_dir / "player_sync.js"
        if player_sync_file.exists():
            s = QWebEngineScript()
            s.setSourceCode(player_sync_file.read_text(encoding="utf-8"))
            s.setName("FlixDeskPlayerSync")
            s.setWorldId(QWebEngineScript.ScriptWorldId.MainWorld)
            s.setInjectionPoint(QWebEngineScript.InjectionPoint.DocumentReady)
            s.setRunsOnSubFrames(True)
            self.profile.scripts().insert(s)

    def setup_shortcuts(self):
        # Fullscreen (F11)
        QShortcut(QKeySequence("F11"), self, self.toggle_fullscreen)

        # Reload (Ctrl+R, F5)
        QShortcut(QKeySequence("Ctrl+R"), self, self.browser.reload)
        QShortcut(QKeySequence("F5"), self, self.browser.reload)

        # Preferences (Ctrl+,)
        QShortcut(QKeySequence("Ctrl+,"), self, self.open_preferences)

    def toggle_fullscreen(self):
        if self.isFullScreen():
            self.showNormal()
        else:
            self.showFullScreen()

    def handle_fullscreen_request(self, request):
        if request.toggleOn():
            self.showFullScreen()
            request.accept()
        else:
            self.showNormal()
            request.accept()

    def open_preferences(self):
        dlg = PreferencesDialog(self)
        dlg.settings_saved.connect(self.on_settings_saved)
        dlg.exec()

    def on_settings_saved(self, new_settings):
        # Update dynamically injected flags
        skip_intro = new_settings.get("autoSkipIntro", True)
        skip_recap = new_settings.get("autoSkipRecap", True)
        play_next = new_settings.get("autoPlayNext", True)

        self.page.runJavaScript(f"""
            window.__flixdesk_skip_intro = {str(skip_intro).lower()};
            window.__flixdesk_skip_recap = {str(skip_recap).lower()};
            window.__flixdesk_play_next = {str(play_next).lower()};
        """)

    def sync_player_state(self):
        self.page.runJavaScript(
            "typeof window.__flixdesk_get_player_state === 'function' ? window.__flixdesk_get_player_state() : null;",
            self.on_player_state_received,
        )

    def on_player_state_received(self, state):
        if isinstance(state, dict):
            self.mpris.update_state(state)

    def handle_app_action(self, action: str):
        if action == "raise" or action == "show":
            self.show()
            self.raise_()
            self.activateWindow()
        elif action == "toggle_visibility":
            if self.isVisible() and not self.isMinimized():
                self.hide()
            else:
                self.show()
                self.raise_()
                self.activateWindow()
        elif action == "play_pause":
            self.page.runJavaScript("""
                const v = document.querySelector('video');
                if (v) { v.paused ? v.play() : v.pause(); }
            """)
        elif action == "play":
            self.page.runJavaScript("const v = document.querySelector('video'); if (v) v.play();")
        elif action == "pause":
            self.page.runJavaScript("const v = document.querySelector('video'); if (v) v.pause();")
        elif action == "next":
            self.page.runJavaScript("""
                const btn = document.querySelector('[data-uia="next-episode-seamless-button"], [data-uia="control-next"]');
                if (btn) btn.click();
            """)
        elif action == "previous":
            self.page.runJavaScript("const v = document.querySelector('video'); if (v) v.currentTime = 0;")
        elif action == "settings":
            self.open_preferences()
        elif action == "quit":
            self.is_quitting = True
            self.save_window_bounds()
            QApplication.instance().quit()

    def closeEvent(self, event: QCloseEvent):
        if not self.is_quitting and settings.get("closeToTray", True) and settings.get("enableTray", True):
            event.ignore()
            self.hide()
        else:
            self.save_window_bounds()
            event.accept()

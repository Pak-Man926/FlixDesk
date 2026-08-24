"""
FlixDesk - Linux MPRIS D-Bus Provider
Implements org.mpris.MediaPlayer2 and org.mpris.MediaPlayer2.Player
for native integration with GNOME, Pop!_OS COSMIC, KDE, and hardware media keys.
"""

from typing import Dict, Any, Optional

try:
    from PySide6.QtCore import QObject, Slot, Property, Signal
    from PySide6.QtDBus import (
        QDBusConnection,
        QDBusAbstractAdaptor,
    )
    QT_DBUS_AVAILABLE = True
except ImportError:
    QT_DBUS_AVAILABLE = False


class MprisRootAdaptor(QDBusAbstractAdaptor if QT_DBUS_AVAILABLE else object):
    if QT_DBUS_AVAILABLE:
        # Export org.mpris.MediaPlayer2
        def __init__(self, parent):
            super().__init__(parent)
            self._parent = parent

        @Slot()
        def Raise(self):
            self._parent.raise_window()

        @Slot()
        def Quit(self):
            self._parent.quit_app()

        @Property(bool)
        def CanQuit(self):
            return True

        @Property(bool)
        def CanRaise(self):
            return True

        @Property(bool)
        def HasTrackList(self):
            return False

        @Property(str)
        def Identity(self):
            return "FlixDesk"

        @Property(list)
        def SupportedUriSchemes(self):
            return ["https", "http"]

        @Property(list)
        def SupportedMimeTypes(self):
            return []


class MprisPlayerAdaptor(QDBusAbstractAdaptor if QT_DBUS_AVAILABLE else object):
    if QT_DBUS_AVAILABLE:
        def __init__(self, parent):
            super().__init__(parent)
            self._parent = parent

        @Slot()
        def Next(self):
            self._parent.command_next()

        @Slot()
        def Previous(self):
            self._parent.command_previous()

        @Slot()
        def Pause(self):
            self._parent.command_pause()

        @Slot()
        def PlayPause(self):
            self._parent.command_play_pause()

        @Slot()
        def Stop(self):
            self._parent.command_pause()

        @Slot()
        def Play(self):
            self._parent.command_play()

        @Property(str)
        def PlaybackStatus(self):
            return self._parent.playback_status

        @Property(dict)
        def Metadata(self):
            return self._parent.get_mpris_metadata()

        @Property(bool)
        def CanControl(self):
            return True

        @Property(bool)
        def CanPlay(self):
            return True

        @Property(bool)
        def CanPause(self):
            return True

        @Property(bool)
        def CanGoNext(self):
            return True

        @Property(bool)
        def CanGoPrevious(self):
            return True

        @Property(bool)
        def CanSeek(self):
            return False


class MprisManager(QObject if QT_DBUS_AVAILABLE else object):
    def __init__(self, window_callback=None):
        if QT_DBUS_AVAILABLE:
            super().__init__()
        self.window_callback = window_callback
        self.playback_status = "Stopped"
        self.current_title = "FlixDesk"
        self.current_episode = ""
        self.current_duration = 0.0
        self.bus: Optional[Any] = None

    def init(self) -> bool:
        if not QT_DBUS_AVAILABLE:
            print("[MPRIS] QtDBus module is not available on this system.")
            return False

        try:
            self.bus = QDBusConnection.sessionBus()
            if not self.bus.isConnected():
                print("[MPRIS] Could not connect to D-Bus session bus.")
                return False

            service_name = "org.mpris.MediaPlayer2.FlixDesk"
            if not self.bus.registerService(service_name):
                print(f"[MPRIS] Could not register D-Bus service {service_name}")
                return False

            self.root_adaptor = MprisRootAdaptor(self)
            self.player_adaptor = MprisPlayerAdaptor(self)

            if not self.bus.registerObject("/org/mpris/MediaPlayer2", self):
                print("[MPRIS] Could not register /org/mpris/MediaPlayer2 object")
                return False

            print("[MPRIS] Successfully registered org.mpris.MediaPlayer2.FlixDesk on D-Bus.")
            return True
        except Exception as e:
            print(f"[MPRIS] Initialization error: {e}")
            return False

    def update_state(self, state: Dict[str, Any]) -> None:
        playing = state.get("playing", False)
        self.playback_status = "Playing" if playing else "Paused"
        self.current_title = state.get("title") or "FlixDesk"
        self.current_episode = state.get("episode") or ""
        self.current_duration = float(state.get("duration") or 0)

    def get_mpris_metadata(self) -> Dict[str, Any]:
        meta = {
            "mpris:trackid": "/org/mpris/MediaPlayer2/Track/1",
            "xesam:title": f"{self.current_title} - {self.current_episode}" if self.current_episode else self.current_title,
            "xesam:artist": ["Netflix"],
            "xesam:album": self.current_title,
        }
        if self.current_duration > 0:
            meta["mpris:length"] = int(self.current_duration * 1_000_000)  # microseconds
        return meta

    def raise_window(self):
        if self.window_callback:
            self.window_callback("raise")

    def quit_app(self):
        if self.window_callback:
            self.window_callback("quit")

    def command_play_pause(self):
        if self.window_callback:
            self.window_callback("play_pause")

    def command_play(self):
        if self.window_callback:
            self.window_callback("play")

    def command_pause(self):
        if self.window_callback:
            self.window_callback("pause")

    def command_next(self):
        if self.window_callback:
            self.window_callback("next")

    def command_previous(self):
        if self.window_callback:
            self.window_callback("previous")

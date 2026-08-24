"""
FlixDesk - Settings Manager
Handles persistent JSON configuration for the Linux desktop client.
"""

import json
import os
from pathlib import Path
from typing import Any, Dict

DEFAULT_SETTINGS = {
    "autoSkipIntro": True,
    "autoSkipRecap": True,
    "autoPlayNext": True,
    "force1080p": True,
    "enableMpris": True,
    "enableTray": True,
    "closeToTray": True,
    "startMinimized": False,
    "enableHardwareAcceleration": True,
    "enableWayland": True,
    "customUserAgent": "",
    "windowBounds": {
        "width": 1280,
        "height": 720,
        "x": None,
        "y": None,
        "isMaximized": False,
    },
}


class SettingsManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SettingsManager, cls).__new__(cls)
            cls._instance._init()
        return cls._instance

    def _init(self):
        self.config_dir = Path.home() / ".config" / "FlixDesk"
        self.config_file = self.config_dir / "settings.json"
        self.settings: Dict[str, Any] = {}
        self.load()

    def load(self) -> None:
        self.config_dir.mkdir(parents=True, exist_ok=True)
        if self.config_file.exists():
            try:
                with open(self.config_file, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    self.settings = {**DEFAULT_SETTINGS, **saved}
            except Exception as e:
                print(f"[Settings] Error loading settings: {e}, using defaults.")
                self.settings = DEFAULT_SETTINGS.copy()
        else:
            self.settings = DEFAULT_SETTINGS.copy()
            self.save()

    def save(self) -> None:
        self.config_dir.mkdir(parents=True, exist_ok=True)
        try:
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(self.settings, f, indent=2)
        except Exception as e:
            print(f"[Settings] Error saving settings: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        return self.settings.get(key, default if default is not None else DEFAULT_SETTINGS.get(key))

    def set(self, key: str, value: Any) -> None:
        self.settings[key] = value
        self.save()

    def get_all(self) -> Dict[str, Any]:
        return self.settings.copy()

    def update_all(self, new_settings: Dict[str, Any]) -> None:
        self.settings.update(new_settings)
        self.save()


settings = SettingsManager()

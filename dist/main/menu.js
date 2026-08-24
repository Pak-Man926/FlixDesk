"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAppMenu = buildAppMenu;
const electron_1 = require("electron");
function buildAppMenu(mainWindow, onAction) {
    const isMac = process.platform === 'darwin';
    const template = [
        {
            label: 'FlixDesk',
            submenu: [
                {
                    label: 'Preferences...',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => onAction('openSettings'),
                },
                { type: 'separator' },
                {
                    label: 'Picture-in-Picture',
                    accelerator: 'CmdOrCtrl+P',
                    click: () => onAction('togglePip'),
                },
                {
                    label: 'Auto-Skip Intro / Recap',
                    type: 'checkbox',
                    checked: true,
                    click: (item) => onAction('toggleAutoSkip', item.checked),
                },
                { type: 'separator' },
                {
                    label: 'Hide FlixDesk',
                    accelerator: 'CmdOrCtrl+H',
                    click: () => mainWindow.hide(),
                },
                {
                    label: 'Quit FlixDesk',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => electron_1.app.quit(),
                },
            ],
        },
        {
            label: 'Playback',
            submenu: [
                {
                    label: 'Play / Pause',
                    accelerator: 'Space',
                    click: () => onAction('playpause'),
                },
                {
                    label: 'Next Episode',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => onAction('next'),
                },
                {
                    label: 'Previous / Restart',
                    accelerator: 'CmdOrCtrl+Shift+N',
                    click: () => onAction('previous'),
                },
                { type: 'separator' },
                {
                    label: 'Seek Backward 10s',
                    accelerator: 'Left',
                    click: () => onAction('seek', -10),
                },
                {
                    label: 'Seek Forward 10s',
                    accelerator: 'Right',
                    click: () => onAction('seek', 10),
                },
                { type: 'separator' },
                {
                    label: 'Mute / Unmute',
                    accelerator: 'CmdOrCtrl+M',
                    click: () => onAction('toggleMute'),
                },
            ],
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => mainWindow.webContents.reload(),
                },
                {
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => mainWindow.webContents.reloadIgnoringCache(),
                },
                { type: 'separator' },
                {
                    label: 'Toggle Full Screen',
                    accelerator: 'F11',
                    click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()),
                },
                {
                    label: 'Developer Tools',
                    accelerator: 'CmdOrCtrl+Shift+I',
                    click: () => mainWindow.webContents.toggleDevTools(),
                },
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About FlixDesk',
                    click: () => onAction('openAbout'),
                },
                {
                    label: 'FlixDesk GitHub Repository',
                    click: async () => {
                        const { shell } = require('electron');
                        await shell.openExternal('https://github.com/Pak-Man926/FlixDesk');
                    },
                },
            ],
        },
    ];
    return electron_1.Menu.buildFromTemplate(template);
}

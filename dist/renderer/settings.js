"use strict";
/**
 * FlixDesk Settings UI Controller
 */
document.addEventListener('DOMContentLoaded', async () => {
    const api = window.flixDeskAPI;
    if (!api) {
        console.error('FlixDesk API bridge not found.');
        return;
    }
    // DOM Elements
    const tabs = document.querySelectorAll('.nav-item');
    const panels = document.querySelectorAll('.tab-panel');
    const closeBtn = document.getElementById('closeBtn');
    const doneBtn = document.getElementById('doneBtn');
    const saveStatus = document.getElementById('saveStatus');
    // Input elements
    const autoSkipIntro = document.getElementById('autoSkipIntro');
    const autoSkipRecap = document.getElementById('autoSkipRecap');
    const autoPlayNext = document.getElementById('autoPlayNext');
    const force1080p = document.getElementById('force1080p');
    const enableMpris = document.getElementById('enableMpris');
    const enableTray = document.getElementById('enableTray');
    const closeToTray = document.getElementById('closeToTray');
    const enableHardwareAcceleration = document.getElementById('enableHardwareAcceleration');
    const enableWayland = document.getElementById('enableWayland');
    const enableDiscordRPC = document.getElementById('enableDiscordRPC');
    const showEpisodeInDiscord = document.getElementById('showEpisodeInDiscord');
    // Diagnostics elements
    const widevineStatus = document.getElementById('widevineStatus');
    const widevineSource = document.getElementById('widevineSource');
    const widevinePath = document.getElementById('widevinePath');
    const widevineVersion = document.getElementById('widevineVersion');
    const systemEnv = document.getElementById('systemEnv');
    // 1. Tab Switching
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('active'));
            panels.forEach((p) => p.classList.remove('active'));
            tab.classList.add('active');
            const targetId = `tab-${tab.getAttribute('data-tab')}`;
            const panel = document.getElementById(targetId);
            if (panel)
                panel.classList.add('active');
        });
    });
    // 2. Load Settings from Main Process
    try {
        const settings = await api.getAllSettings();
        if (autoSkipIntro)
            autoSkipIntro.checked = settings.autoSkipIntro;
        if (autoSkipRecap)
            autoSkipRecap.checked = settings.autoSkipRecap;
        if (autoPlayNext)
            autoPlayNext.checked = settings.autoPlayNext;
        if (force1080p)
            force1080p.checked = settings.force1080p;
        if (enableMpris)
            enableMpris.checked = settings.enableMpris;
        if (enableTray)
            enableTray.checked = settings.enableTray;
        if (closeToTray)
            closeToTray.checked = settings.closeToTray;
        if (enableHardwareAcceleration)
            enableHardwareAcceleration.checked = settings.enableHardwareAcceleration;
        if (enableWayland)
            enableWayland.checked = settings.enableWayland;
        if (enableDiscordRPC)
            enableDiscordRPC.checked = settings.enableDiscordRPC;
        if (showEpisodeInDiscord)
            showEpisodeInDiscord.checked = settings.showEpisodeInDiscord;
    }
    catch (err) {
        console.error('Failed to load settings:', err);
    }
    // 3. Bind Change Handlers with Auto-Save
    const bindToggle = (element, key) => {
        if (!element)
            return;
        element.addEventListener('change', async () => {
            try {
                await api.setSetting(key, element.checked);
                showSavedFeedback();
            }
            catch (err) {
                console.error(`Failed to save ${key}:`, err);
            }
        });
    };
    bindToggle(autoSkipIntro, 'autoSkipIntro');
    bindToggle(autoSkipRecap, 'autoSkipRecap');
    bindToggle(autoPlayNext, 'autoPlayNext');
    bindToggle(force1080p, 'force1080p');
    bindToggle(enableMpris, 'enableMpris');
    bindToggle(enableTray, 'enableTray');
    bindToggle(closeToTray, 'closeToTray');
    bindToggle(enableHardwareAcceleration, 'enableHardwareAcceleration');
    bindToggle(enableWayland, 'enableWayland');
    bindToggle(enableDiscordRPC, 'enableDiscordRPC');
    bindToggle(showEpisodeInDiscord, 'showEpisodeInDiscord');
    function showSavedFeedback() {
        if (!saveStatus)
            return;
        saveStatus.textContent = 'Saved!';
        saveStatus.style.color = '#46d369';
        setTimeout(() => {
            saveStatus.textContent = 'All changes saved automatically';
            saveStatus.style.color = '#999999';
        }, 1500);
    }
    // 4. Load Diagnostics & Widevine info
    try {
        const widevine = await api.getWidevineInfo();
        if (widevine && widevineStatus) {
            if (widevine.found) {
                widevineStatus.textContent = 'Active (Ready for DRM Playback)';
                widevineStatus.style.color = '#46d369';
                if (widevineSource)
                    widevineSource.textContent = widevine.source || 'Detected';
                if (widevinePath)
                    widevinePath.textContent = widevine.path || '-';
                if (widevineVersion)
                    widevineVersion.textContent = widevine.version || 'Unknown';
            }
            else {
                widevineStatus.textContent = 'Not Found (DRM video may not play)';
                widevineStatus.style.color = '#E50914';
                if (widevineSource)
                    widevineSource.textContent = 'Missing Widevine CDM';
                if (widevinePath)
                    widevinePath.textContent = 'Please install Chrome or chromium widevine package';
                if (widevineVersion)
                    widevineVersion.textContent = 'N/A';
            }
        }
        const appInfo = await api.getAppInfo();
        if (appInfo && systemEnv) {
            systemEnv.textContent = `${appInfo.desktopEnv} (${appInfo.sessionType}) | Chrome v${appInfo.chromeVersion}`;
        }
    }
    catch (err) {
        console.error('Failed to load diagnostics:', err);
    }
    // 5. Close / Done buttons
    const closeWindow = () => api.closeSettings();
    if (closeBtn)
        closeBtn.addEventListener('click', closeWindow);
    if (doneBtn)
        doneBtn.addEventListener('click', closeWindow);
});

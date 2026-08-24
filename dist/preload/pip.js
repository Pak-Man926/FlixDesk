"use strict";
/**
 * Picture-in-Picture (PiP) controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipController = void 0;
class PipController {
    static async togglePip() {
        try {
            const video = document.querySelector('video');
            if (!video) {
                console.warn('[FlixDesk PiP] No video element found to toggle PiP.');
                return false;
            }
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                console.log('[FlixDesk PiP] Exited Picture-in-Picture mode.');
                return false;
            }
            else {
                await video.requestPictureInPicture();
                console.log('[FlixDesk PiP] Entered Picture-in-Picture mode.');
                return true;
            }
        }
        catch (err) {
            console.warn('[FlixDesk PiP] Failed to toggle PiP:', err);
            return false;
        }
    }
}
exports.PipController = PipController;

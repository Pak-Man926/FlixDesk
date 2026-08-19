/**
 * Picture-in-Picture (PiP) controller
 */

export class PipController {
  public static async togglePip(): Promise<boolean> {
    try {
      const video = document.querySelector('video') as HTMLVideoElement | null;
      if (!video) {
        console.warn('[FlixDesk PiP] No video element found to toggle PiP.');
        return false;
      }

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        console.log('[FlixDesk PiP] Exited Picture-in-Picture mode.');
        return false;
      } else {
        await video.requestPictureInPicture();
        console.log('[FlixDesk PiP] Entered Picture-in-Picture mode.');
        return true;
      }
    } catch (err) {
      console.warn('[FlixDesk PiP] Failed to toggle PiP:', err);
      return false;
    }
  }
}

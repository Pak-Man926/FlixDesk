export class AutoSkipper {
  private observer: MutationObserver | null = null;
  private autoSkipIntro = true;
  private autoSkipRecap = true;
  private autoPlayNext = true;
  private lastSkipTimestamp = 0;

  constructor() {}

  public updateConfig(config: {
    autoSkipIntro?: boolean;
    autoSkipRecap?: boolean;
    autoPlayNext?: boolean;
  }): void {
    if (config.autoSkipIntro !== undefined) this.autoSkipIntro = config.autoSkipIntro;
    if (config.autoSkipRecap !== undefined) this.autoSkipRecap = config.autoSkipRecap;
    if (config.autoPlayNext !== undefined) this.autoPlayNext = config.autoPlayNext;
  }

  public start(): void {
    if (this.observer) return;

    this.observer = new MutationObserver(() => {
      this.checkAndSkip();
    });

    this.observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-uia', 'style'],
    });

    console.log('[FlixDesk] Auto-skip observer started.');
  }

  private checkAndSkip(): void {
    const now = Date.now();
    // Debounce checks to avoid rapid repeat clicks
    if (now - this.lastSkipTimestamp < 500) return;

    // 1. Skip Intro
    if (this.autoSkipIntro) {
      const skipIntroBtn = document.querySelector(
        '[data-uia="player-skip-intro"], button[aria-label="Skip Intro"], .watch-video--skip-content-button'
      ) as HTMLElement | null;

      if (skipIntroBtn && this.isElementVisible(skipIntroBtn)) {
        const text = skipIntroBtn.innerText.toLowerCase();
        if (!text.includes('recap')) {
          console.log('[FlixDesk] Auto-skipping Intro...');
          skipIntroBtn.click();
          this.lastSkipTimestamp = now;
          return;
        }
      }
    }

    // 2. Skip Recap
    if (this.autoSkipRecap) {
      const skipRecapBtn = document.querySelector(
        '[data-uia="player-skip-recap"], button[aria-label="Skip Recap"], .watch-video--skip-content-button'
      ) as HTMLElement | null;

      if (skipRecapBtn && this.isElementVisible(skipRecapBtn)) {
        console.log('[FlixDesk] Auto-skipping Recap...');
        skipRecapBtn.click();
        this.lastSkipTimestamp = now;
        return;
      }
    }

    // 3. Auto-play Next Episode
    if (this.autoPlayNext) {
      const nextEpBtn = document.querySelector(
        '[data-uia="next-episode-seamless-button"], [data-uia="next-episode-seamless-button-draining"]'
      ) as HTMLElement | null;

      if (nextEpBtn && this.isElementVisible(nextEpBtn)) {
        console.log('[FlixDesk] Auto-playing Next Episode...');
        nextEpBtn.click();
        this.lastSkipTimestamp = now;
        return;
      }
    }
  }

  private isElementVisible(el: HTMLElement): boolean {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

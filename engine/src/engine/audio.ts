// Music via HTMLAudio (local asset only, never committed).
// Browsers require a user gesture: playback starts on first key/click.
export class Music {
  private el: HTMLAudioElement | null = null;
  muted = false;
  private started = false;

  load(url: string) {
    const el = new Audio(url);
    el.loop = true;
    el.volume = 0.7;
    this.el = el;
    const kick = () => this.ensure();
    window.addEventListener('keydown', kick, { once: false });
    window.addEventListener('pointerdown', kick, { once: false });
  }

  ensure() {
    if (!this.el || this.started) {
      if (this.el && this.started && this.el.paused && !this.muted) {
        void this.el.play().catch(() => undefined);
      }
      return;
    }
    this.started = true;
    if (!this.muted) void this.el.play().catch(() => undefined);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (!this.el) return this.muted;
    if (this.muted) this.el.pause();
    else void this.el.play().catch(() => undefined);
    return this.muted;
  }
}

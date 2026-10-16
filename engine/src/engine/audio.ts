// Music via HTMLAudio (local assets only, never committed).
// Two tracks from forestcc.mod: forest (positions 39-53) loops in level,
// boss (positions 0-38) at the boss arena. Browsers require a user
// gesture: playback starts on first key/click. M toggles mute.
export class Music {
  private tracks = new Map<string, HTMLAudioElement>();
  private current: string | null = null;
  muted = false;
  private started = false;

  load(name: string, url: string) {
    const el = new Audio(url);
    el.loop = true;
    el.volume = 0.7;
    this.tracks.set(name, el);
    const kick = () => this.ensure();
    window.addEventListener('keydown', kick, { once: false });
    window.addEventListener('pointerdown', kick, { once: false });
  }

  private playCurrent() {
    const el = this.current ? this.tracks.get(this.current) ?? null : null;
    if (!el || this.muted) return;
    if (el.paused) void el.play().catch(() => undefined);
  }

  ensure() {
    if (!this.started) {
      this.started = true;
      if (!this.current) this.setTrack('forest');
      else this.playCurrent();
      return;
    }
    this.playCurrent();
  }

  setTrack(name: string) {
    if (this.current === name) return;
    const prev = this.current ? this.tracks.get(this.current) ?? null : null;
    if (prev) prev.pause();
    this.current = name;
    if (this.started) this.playCurrent();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      const el = this.current ? this.tracks.get(this.current) ?? null : null;
      if (el) el.pause();
    } else {
      this.playCurrent();
    }
    return this.muted;
  }
}

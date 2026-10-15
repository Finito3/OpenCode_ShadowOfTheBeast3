// Fixed-step game loop at 50 Hz (Amiga PAL rhythm), render decoupled.
export type StepFn = (dt: number) => void;

export class Game {
  private acc = 0;
  private last = 0;
  private readonly step = 1 / 50;
  constructor(private update: StepFn, private render: (alpha: number) => void) {}

  start() {
    this.last = performance.now() / 1000;
    const frame = (nowMs: number) => {
      const now = nowMs / 1000;
      let delta = now - this.last;
      if (delta > 0.25) delta = 0.25;
      this.last = now;
      this.acc += delta;
      while (this.acc >= this.step) {
        this.update(this.step);
        this.acc -= this.step;
      }
      this.render(this.acc / this.step);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

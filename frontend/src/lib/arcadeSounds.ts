// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/arcadeSounds.ts
// PURPOSE: Lightweight Web Audio API retro 8-bit sound generator for arcade games
// ============================================================================

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playTone(frequency: number, duration: number, type: OscillatorType = "square", endFreq?: number) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy or browser restriction
    }
  }

  // Preset Arcade FX
  blip() {
    this.playTone(480, 0.06, "square");
  }

  eat() {
    this.playTone(320, 0.08, "sine", 640);
  }

  golden() {
    this.playTone(523.25, 0.08, "triangle", 1046.5);
  }

  hit() {
    this.playTone(180, 0.07, "sawtooth", 80);
  }

  point() {
    this.playTone(600, 0.1, "sine", 900);
  }

  win() {
    if (!this.enabled) return;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.12, "triangle");
      }, idx * 100);
    });
  }

  gameOver() {
    if (!this.enabled) return;
    const notes = [400, 320, 240, 160];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, "sawtooth");
      }, idx * 120);
    });
  }
}

export const arcadeAudio = new SoundManager();

export const playBlipSound = () => arcadeAudio.blip();
export const playPointSound = () => arcadeAudio.point();
export const playHitSound = () => arcadeAudio.hit();
export const playWinSound = () => arcadeAudio.win();

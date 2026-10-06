// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/arcadeSounds.ts
// PURPOSE: Audio disabled per project requirements. Safe no-op implementations.
// ============================================================================

class SoundManager {
  public enabled: boolean = false;

  playTone(_frequency: number, _duration: number, _type: OscillatorType = "square", _endFreq?: number) {
    // Disabled
  }

  blip() {}
  eat() {}
  golden() {}
  hit() {}
  point() {}
  win() {}
  gameOver() {}
}

export const arcadeAudio = new SoundManager();

export const playBlipSound = () => {};
export const playPointSound = () => {};
export const playHitSound = () => {};
export const playWinSound = () => {};

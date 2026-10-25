// Web Audio API Sound Generator for ambient chimes, reminder bell, and completion sound
class SoundFX {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Soft zen bell chime (for reminders and timer end)
  playZenChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, now); // 528 Hz - Solfeggio frequency / transformation
    osc.frequency.exponentialRampToValueAtTime(520, now + 1.2);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.6);
  }

  // Crisp success chime (for habit completion or resisting temptation)
  playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 chord
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  }

  // Gentle breath cue chime for Urge Surfing
  playBreathCue(isExhale = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startFreq = isExhale ? 440 : 330;
    const endFreq = isExhale ? 330 : 440;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.4);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Gentle reminder alert double pulse
  playReminderAlert() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.22].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now + offset); // E5

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.25, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.4);
    });
  }

  private adhanAudio: HTMLAudioElement | null = null;
  private isAdhanPlayingState = false;

  // Plays authentic adhan MP3 with fallback to melodic call synthesizer
  playAdhan(onEnd?: () => void) {
    if (typeof window === 'undefined') return;

    this.stopAdhan();
    this.isAdhanPlayingState = true;

    try {
      // High quality adhan MP3 from reliable Islamic CDN
      const audio = new Audio('https://cdn.islamic.network/audio/adhan/ar.alafasy.mp3');
      this.adhanAudio = audio;
      audio.volume = 0.9;

      audio.onended = () => {
        this.isAdhanPlayingState = false;
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        // Fallback to offline web audio synthesized adhan
        this.playSynthesizedAdhanSequence(onEnd);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this.playSynthesizedAdhanSequence(onEnd);
        });
      }
    } catch {
      this.playSynthesizedAdhanSequence(onEnd);
    }
  }

  stopAdhan() {
    if (this.adhanAudio) {
      try {
        this.adhanAudio.pause();
        this.adhanAudio.currentTime = 0;
      } catch {}
      this.adhanAudio = null;
    }
    this.isAdhanPlayingState = false;
  }

  isAdhanPlaying(): boolean {
    return this.isAdhanPlayingState;
  }

  // Melodic synthesized Adhan call (Allah hu Akbar harmonic notes) for 100% offline reliability
  playSynthesizedAdhanSequence(onEnd?: () => void) {
    const ctx = this.getContext();
    if (!ctx) {
      this.isAdhanPlayingState = false;
      if (onEnd) onEnd();
      return;
    }

    const now = ctx.currentTime;
    // Harmonic notes evoking the traditional call to prayer (Maqam Bayati tones)
    const adhanNotes = [
      { freq: 440.00, dur: 1.2, delay: 0.0 },   // A4
      { freq: 493.88, dur: 1.0, delay: 1.3 },   // B4
      { freq: 523.25, dur: 1.8, delay: 2.4 },   // C5
      { freq: 493.88, dur: 1.2, delay: 4.3 },   // B4
      { freq: 440.00, dur: 2.2, delay: 5.6 }    // A4 (resolution)
    ];

    adhanNotes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.delay);

      gain.gain.setValueAtTime(0, now + note.delay);
      gain.gain.linearRampToValueAtTime(0.35, now + note.delay + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.delay);
      osc.stop(now + note.delay + note.dur);
    });

    setTimeout(() => {
      this.isAdhanPlayingState = false;
      if (onEnd) onEnd();
    }, 8000);
  }
}

export const sound = new SoundFX();

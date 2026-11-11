import { getNumberCallSpoken } from '../shared/tambola';

let audioCtx: AudioContext | null = null;
let isMuted = false;

export function getIsMuted(): boolean {
  return isMuted;
}

export function setIsMuted(muted: boolean): void {
  isMuted = muted;
  try {
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {}
}

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function triggerHaptic(pattern: number | number[] = 25): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {}
}

/**
 * Tactile pop sound when marking a number on the ticket
 */
export function playDabSound(): void {
  try {
    triggerHaptic(25);
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (err) {
    // Silently handle any browser audio policy or scheduling issues
  }
}

/**
 * Bell chime when a new number is drawn
 */
export function playNumberDrawnSound(): void {
  try {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (err) {
    // Silently handle any browser audio policy or scheduling issues
  }
}

/**
 * Celebration chime when a prize claim is accepted
 */
export function playWinSound(): void {
  try {
    triggerHaptic([100, 50, 100, 50, 200]);
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = ctx.currentTime + 0.02;

    notes.forEach((freq, idx) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const noteStart = startTime + idx * 0.12;
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.25, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.35);
      } catch {}
    });
  } catch (err) {
    // Silently handle any browser audio policy issues
  }
}

/**
 * Low buzzer sound for a bogey claim
 */
export function playBogeySound(): void {
  try {
    triggerHaptic([180, 80, 180]);
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (err) {
    // Silently handle any browser audio policy issues
  }
}

/**
 * Speaks the called number aloud without any tagline, e.g.:
 * "Six Four, 64" or "Single Seven, 7"
 */
export function speakNumber(num: number): void {
  try {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const text = getNumberCallSpoken(num);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Clear natural pacing
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    // Silently handle speech synthesis cancellation or permissions
  }
}

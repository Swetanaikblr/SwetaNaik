/** Web Speech API helpers. Everything degrades to text-only when unsupported or denied. */
import { VOICES } from '../data/echo';

// Minimal typing for SpeechRecognition (not in TS DOM lib everywhere).
interface SR {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> & { length: number } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try { window.speechSynthesis.getVoices(); } catch { /* preload voice list */ }
}

export function speechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function recognitionCtor(): (new () => SR) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speak(text: string, voiceId: string) {
  if (!speechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/•/g, ''));
    const v = VOICES.find((x) => x.id === voiceId) ?? VOICES[0];
    u.pitch = v.pitch;
    u.rate = v.rate;
    // Only on-device voices: remote voices would send text to a third party. No local voice = text only.
    const local = window.speechSynthesis.getVoices().filter((x) => x.localService);
    if (local.length === 0) return;
    u.voice = local.find((x) => x.lang.startsWith('en')) ?? local[0];
    window.speechSynthesis.speak(u);
  } catch {
    /* text-only fallback */
  }
}

export function stopSpeaking() {
  if (!speechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

export type ListenHandle = { stop: () => void };

/**
 * Starts one recognition pass. Calls onText with the final transcript.
 * onError receives 'denied' | 'unsupported' | 'other'.
 */
export function listenOnce(
  onText: (t: string) => void,
  onError: (kind: 'denied' | 'unsupported' | 'other') => void,
  onEnd: () => void,
): ListenHandle | null {
  const Ctor = recognitionCtor();
  if (!Ctor) {
    onError('unsupported');
    return null;
  }
  try {
    const r = new Ctor();
    r.lang = 'en-GB';
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const text = last?.[0]?.transcript;
      if (text) onText(text);
    };
    r.onerror = (e) => onError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : 'other');
    r.onend = onEnd;
    r.start();
    return { stop: () => { try { r.abort(); } catch { /* ignore */ } } };
  } catch {
    onError('other');
    return null;
  }
}

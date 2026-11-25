/**
 * @deprecated
 * NOTICE: speech.ts is deprecated. It is retained solely for legacy backwards-compatibility
 * and offline emergency Web Speech synthesis fallback.
 *
 * For all primary multimodal real-time voice, please use:
 * - src/voice/LiveVoiceSession.ts
 * - src/voice/AudioInput.ts (16kHz PCM capture)
 * - src/voice/AudioOutput.ts (24kHz Gemini Live streaming)
 * - src/voice/VoiceStateMachine.ts
 * - src/voice/AudioVisualizer.ts
 */

import { getActiveVoiceName } from '../voice/voiceRegistry';

export type CharacterVoice = 'robot' | 'fox' | 'owl' | 'star';

export interface VoiceProfile {
  id: CharacterVoice;
  name: string;
  avatar: string;
  title: string;
  pitch: number;
  rate: number;
  color: string;
}

export const CHARACTER_PROFILES: Record<CharacterVoice, VoiceProfile> = {
  robot: {
    id: 'robot',
    name: 'Echo',
    avatar: '🤖',
    title: 'Smart Robot',
    pitch: 1.15,
    rate: 1.0,
    color: 'from-blue-600 to-cyan-500',
  },
  fox: {
    id: 'fox',
    name: 'Sparky',
    avatar: '🦊',
    title: 'Playful Fox',
    pitch: 1.3,
    rate: 1.05,
    color: 'from-amber-500 to-orange-500',
  },
  owl: {
    id: 'owl',
    name: 'Athena',
    avatar: '🦉',
    title: 'Wise Owl',
    pitch: 0.9,
    rate: 0.92,
    color: 'from-emerald-600 to-teal-500',
  },
  star: {
    id: 'star',
    name: 'Nova',
    avatar: '⭐',
    title: 'Cosmic Guide',
    pitch: 1.1,
    rate: 1.02,
    color: 'from-purple-600 to-pink-500',
  },
};

let synth: SpeechSynthesis | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let activeAudioElement: HTMLAudioElement | null = null;
let activeAudioSource: AudioBufferSourceNode | null = null;
let sharedAudioCtx: AudioContext | null = null;
let speechResumeInterval: any = null;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  synth = window.speechSynthesis;

  const loadVoices = () => {
    if (synth) {
      cachedVoices = synth.getVoices();
    }
  };

  loadVoices();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
}

// Retain a persistent unlocked AudioContext across turns
export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      sharedAudioCtx = new AudioCtxClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// Map companion character to Gemini TTS voice name
export function getCharacterTtsVoice(character: CharacterVoice = 'robot'): string {
  switch (character) {
    case 'robot':
      return getActiveVoiceName(); // User's customized voice preference (Puck by default)
    case 'fox':
      return 'Fenrir'; // Energetic, bright
    case 'owl':
      return 'Charon'; // Calm, thoughtful
    case 'star':
      return 'Aoede'; // Melodious, gentle
    default:
      return getActiveVoiceName();
  }
}

// Global audio unlocker to satisfy browser autoplay policies on user interaction
export function unlockAudio(): void {
  if (typeof window === 'undefined') return;

  try {
    const ctx = getSharedAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      // Play a 10ms micro-silence buffer to unlock HTML5 audio and audio context
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(0.01);
    }
  } catch {}

  // Also wake up window.speechSynthesis
  if (synth) {
    try {
      synth.resume();
    } catch {}
  }
}

// Check if browser supports Speech Recognition
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

// Interactive Web Audio Sound Effects Synthesizer
export type SoundEffectType =
  | 'listen_start'
  | 'listen_stop'
  | 'reply_received'
  | 'avatar_boop'
  | 'celebrate'
  | 'coin_flip'
  | 'dice_roll'
  | 'breathe_in'
  | 'breathe_out'
  | 'pop';

export function playChime(type: SoundEffectType) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'listen_start') {
      // Ascending two-tone cheerful chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(440, now); // A4
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.14); // E5
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);
    } else if (type === 'listen_stop') {
      // Soft gentle finish tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15); // A4
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'reply_received') {
      // Welcoming pop chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (type === 'avatar_boop') {
      // Playful squeak / bubble bounce
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.16);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'celebrate') {
      // 3-note victory arpeggio: C5 - E5 - G5 - C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.09;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } else if (type === 'coin_flip') {
      // High-pitched spinning metallic ring
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.25);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'dice_roll') {
      // Rapid tumbling clicks
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const clickTime = now + i * 0.06;
        osc.frequency.setValueAtTime(300 + Math.random() * 200, clickTime);
        gain.gain.setValueAtTime(0.07, clickTime);
        gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(clickTime);
        osc.stop(clickTime + 0.04);
      }
    } else if (type === 'breathe_in') {
      // Soothing harmonic singing bowl swell
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.linearRampToValueAtTime(329.63, now + 2.5); // E4
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 2.0);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 3.0);
    } else if (type === 'breathe_out') {
      // Relaxing descending bowl release
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.linearRampToValueAtTime(220, now + 2.5); // A3
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 3.0);
    } else if (type === 'pop') {
      // Quick tactile click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  } catch {
    // Ignore audio context autoplay limitations silently
  }
}

// Play audio using Web Audio API buffer node (immune to autoplay blocks and iframe fetch restrictions) with HTMLAudioElement fallback
export async function playAudioUrl(audioUrl: string, onEnd?: () => void): Promise<boolean> {
  stopSpeaking();

  if (typeof window === 'undefined' || !audioUrl) {
    if (onEnd) onEnd();
    return false;
  }

  // 1. First & most reliable: Web Audio API buffer node (plays directly via AudioContext to hardware destination)
  const ctx = getSharedAudioContext();
  if (ctx) {
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      let arrayBuffer: ArrayBuffer;
      if (audioUrl.startsWith('data:')) {
        // Direct in-memory base64 decode (bypasses browser data-URL fetch blocks in cross-origin iframes)
        const base64Part = audioUrl.includes(',') ? audioUrl.split(',')[1] : audioUrl;
        const binaryString = window.atob(base64Part);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        const res = await fetch(audioUrl);
        arrayBuffer = await res.arrayBuffer();
      }

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      let finished = false;
      const cleanup = () => {
        if (!finished) {
          finished = true;
          activeAudioSource = null;
          if (onEnd) onEnd();
        }
      };

      source.onended = cleanup;
      activeAudioSource = source;
      source.start(0);
      return true;
    } catch (err) {
      console.warn('Web Audio buffer playback notice, trying HTML5 Audio element:', err);
    }
  }

  // 2. Fallback attempt: Standard HTML5 Audio element
  return new Promise((resolve) => {
    try {
      const audio = new Audio();
      activeAudioElement = audio;
      audio.volume = 1.0;
      audio.src = audioUrl;
      audio.preload = 'auto';

      let finished = false;
      const cleanup = (success: boolean) => {
        if (!finished) {
          finished = true;
          activeAudioElement = null;
          if (onEnd) onEnd();
          resolve(success);
        }
      };

      audio.onended = () => cleanup(true);
      audio.onerror = (e) => {
        console.warn('Audio element playback error:', e);
        cleanup(false);
      };

      // Watchdog in case audio hangs
      setTimeout(() => {
        if (!finished && audio.paused && audio.currentTime === 0) {
          cleanup(false);
        }
      }, 12000);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play was prevented by browser policy:', err);
          cleanup(false);
        });
      }
    } catch (err) {
      console.warn('Failed to initialize audio element:', err);
      activeAudioElement = null;
      if (onEnd) onEnd();
      resolve(false);
    }
  });
}

// Fetch natural spoken voice audio from Gemini TTS via /api/tts
export async function fetchNaturalSpeechAudio(
  text: string,
  character: CharacterVoice = 'robot'
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);

    const voice = getCharacterTtsVoice(character);
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    return data.audioUrl || null;
  } catch {
    return null;
  }
}

// Bulletproof Web Speech API synthesis with Chrome V8 GC prevention & auto-unfreeze
export function speakText(
  text: string,
  onEnd?: () => void,
  options?: { rate?: number; pitch?: number; character?: CharacterVoice }
) {
  if (typeof window === 'undefined') {
    if (onEnd) onEnd();
    return;
  }

  // Ensure synth is grabbed directly from window
  if (!synth && 'speechSynthesis' in window) {
    synth = window.speechSynthesis;
  }

  if (!synth) {
    console.warn('SpeechSynthesis is not supported in this environment');
    if (onEnd) onEnd();
    return;
  }

  // Clean text from emojis, markdown symbols, and excess whitespace
  const cleanText = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[*_#`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  // Clean cancellation of prior speech to prevent audio collision
  let hadActiveSpeech = false;
  try {
    if (synth.speaking || synth.pending) {
      hadActiveSpeech = true;
      synth.cancel();
    }
    synth.resume();
  } catch {}

  const triggerSpeak = () => {
    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // CRITICAL: Prevent V8 garbage collector from terminating speech prematurely
      (window as any).__echoUtterance = utterance;

      const charProfile = options?.character ? CHARACTER_PROFILES[options.character] : null;
      utterance.rate = options?.rate ?? (charProfile?.rate ?? 1.0);
      utterance.pitch = options?.pitch ?? (charProfile?.pitch ?? 1.05);
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      if (cachedVoices.length === 0 && synth.getVoices) {
        cachedVoices = synth.getVoices();
      }

      if (cachedVoices.length > 0) {
        const preferredVoice = cachedVoices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Victoria') ||
              v.name.includes('Karen') ||
              v.name.includes('Alex') ||
              v.name.includes('en-US'))
        );

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      let hasFinished = false;
      const finish = () => {
        if (!hasFinished) {
          hasFinished = true;
          (window as any).__echoUtterance = null;
          if (speechResumeInterval) {
            clearInterval(speechResumeInterval);
            speechResumeInterval = null;
          }
          if (onEnd) onEnd();
        }
      };

      utterance.onend = () => finish();
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        finish();
      };

      // Chrome 15-second speech freeze fix: repeatedly resume during speech
      if (speechResumeInterval) clearInterval(speechResumeInterval);
      speechResumeInterval = setInterval(() => {
        if (synth && synth.speaking) {
          if (synth.paused) {
            synth.resume();
          }
        } else if (synth && !synth.speaking && !synth.pending && !hasFinished) {
          // If browser completed speech without firing onend
          finish();
        }
      }, 500);

      // Extreme safety watchdog timer (never cut off active speech prematurely)
      const wordCount = cleanText.split(' ').length;
      const maxDuration = Math.max(30000, wordCount * 1200 + 15000);
      setTimeout(() => {
        if (!hasFinished && (!synth || (!synth.speaking && !synth.pending))) {
          finish();
        }
      }, maxDuration);

      // Speak utterance cleanly and resume engine
      synth.speak(utterance);
      synth.resume();
    } catch (err) {
      console.warn('Could not speak:', err);
      (window as any).__echoUtterance = null;
      if (onEnd) onEnd();
    }
  };

  // If cancellation was dispatched, wait 60ms for Chromium speech engine loop to reset
  if (hadActiveSpeech) {
    setTimeout(triggerSpeak, 60);
  } else {
    triggerSpeak();
  }
}

// Unified voice player: plays instant natural audio (via AudioContext & HTML5 Audio) with Web Speech fallback
export async function speakEcho(
  text: string,
  onEnd?: () => void,
  options?: {
    character?: CharacterVoice;
    audioUrl?: string | null;
  }
) {
  const character = options?.character || 'robot';

  // 1. If audioUrl is already provided, play it directly!
  if (options?.audioUrl) {
    const success = await playAudioUrl(options.audioUrl, onEnd);
    if (success) return;
  }

  // 2. Fetch natural Gemini voice audio from /api/tts
  try {
    const fetchedAudioUrl = await fetchNaturalSpeechAudio(text, character);
    if (fetchedAudioUrl) {
      const success = await playAudioUrl(fetchedAudioUrl, onEnd);
      if (success) return;
    }
  } catch (err) {
    console.warn('Could not fetch TTS audio:', err);
  }

  // 3. Fallback to native Web Speech API synthesis
  speakText(text, onEnd, { character });
}

export function stopSpeaking() {
  if (activeAudioSource) {
    try {
      activeAudioSource.stop();
      activeAudioSource.disconnect();
    } catch {}
    activeAudioSource = null;
  }

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
    activeAudioElement = null;
  }

  if (speechResumeInterval) {
    clearInterval(speechResumeInterval);
    speechResumeInterval = null;
  }

  (window as any).__echoUtterance = null;

  if (synth) {
    try {
      synth.cancel();
    } catch {}
  }
}

export interface SpeechRecognizerController {
  recognition: any;
  start: () => void;
  stop: () => void;
  commitNow: () => void;
}

// Alexa-style Speech Recognition with automatic turn detection & smart fallback
export function createSpeechRecognizer(
  onResult: (text: string, isFinal: boolean) => void,
  onEnd: () => void,
  onError: (err: any) => void
): SpeechRecognizerController | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true; // Stay active during conversational turn
  recognition.interimResults = true; // Real-time word streaming
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  let silenceTimer: any = null;
  let latestTranscript = '';
  let hasDispatchedFinal = false;

  const dispatchFinal = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    const textToSubmit = latestTranscript.trim();
    if (textToSubmit.length > 0 && !hasDispatchedFinal) {
      hasDispatchedFinal = true;
      latestTranscript = '';
      onResult(textToSubmit, true);
    }
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i];
      if (item.isFinal) {
        finalTranscript += item[0].transcript;
      } else {
        interimTranscript += item[0].transcript;
      }
    }

    const currentText = (finalTranscript || interimTranscript).trim();
    if (currentText) {
      latestTranscript = currentText;
      hasDispatchedFinal = false;
      onResult(currentText, false); // Stream live words to screen without cutting child off

      // Alexa-style pause detection: When child pauses for 800ms, dispatch final utterance
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        dispatchFinal();
      }, 800);
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition status:', event.error);
    if (event.error !== 'no-speech') {
      onError(event.error);
    }
  };

  recognition.onend = () => {
    // If the child was speaking and recognition closed, submit the speech!
    dispatchFinal();
    onEnd();
  };

  return {
    recognition,
    start: () => {
      try {
        recognition.start();
      } catch {}
    },
    stop: () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      try {
        recognition.stop();
      } catch {}
    },
    commitNow: () => {
      dispatchFinal();
    },
  };
}

// Safe visual audio analyzer that provides responsive waveforms without locking microphone hardware
export class LiveAudioMeter {
  private animId: number | null = null;
  private onLevelChange: (level: number, frequencies: number[]) => void;

  constructor(onLevelChange: (level: number, frequencies: number[]) => void) {
    this.onLevelChange = onLevelChange;
  }

  public async start(): Promise<boolean> {
    let tick = 0;
    const updateLoop = () => {
      tick++;
      const base = 25 + Math.sin(tick * 0.1) * 10;
      const freqs = [
        Math.round(base + Math.sin(tick * 0.15) * 15),
        Math.round(base + Math.cos(tick * 0.12) * 20),
        Math.round(base + Math.sin(tick * 0.18) * 25),
        Math.round(base + Math.cos(tick * 0.14) * 30),
        Math.round(base + Math.sin(tick * 0.16) * 25),
        Math.round(base + Math.cos(tick * 0.11) * 20),
        Math.round(base + Math.sin(tick * 0.13) * 15),
        Math.round(base + Math.cos(tick * 0.17) * 10),
      ];
      this.onLevelChange(Math.round(base), freqs);
      this.animId = requestAnimationFrame(updateLoop);
    };
    updateLoop();
    return true;
  }

  public stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}

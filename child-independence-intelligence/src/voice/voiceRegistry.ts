// Gemini Live & TTS Voice Registry for Childindi Companion
export type GeminiVoiceName = 'Puck' | 'Charon' | 'Fenrir' | 'Aoede' | 'Kore' | 'Zephyr';

export interface VoiceMetadata {
  id: GeminiVoiceName;
  name: string;
  tagline: string;
  description: string;
  timbre: string;
  energy: 'calm' | 'balanced' | 'energetic' | 'gentle';
  recommendedFor: string;
  samplePhrase: string;
  icon: string;
  accentColor: string;
  isDefault?: boolean;
}

export const AVAILABLE_VOICES: VoiceMetadata[] = [
  {
    id: 'Puck',
    name: 'Puck (Echo)',
    tagline: 'Clear, friendly & spirited British/older-sibling tone',
    description: 'The signature voice for Echo. Energetic yet gentle, patient, and easy for kids aged 10–15 to understand.',
    timbre: 'Crisp, youthful, supportive',
    energy: 'balanced',
    recommendedFor: 'Daily companion, study buddy & general chats',
    samplePhrase: "Hey Aarav! I'm Echo, and I'm ready to learn and chill with you today!",
    icon: '🤖',
    accentColor: '#3b82f6',
    isDefault: true,
  },
  {
    id: 'Charon',
    name: 'Charon (Athena)',
    tagline: 'Calm, deep, reassuring & contemplative tone',
    description: 'A deep, steady, thoughtful voice that excels at explaining science concepts, mathematics, and philosophy step-by-step.',
    timbre: 'Deep, warm, grounded',
    energy: 'calm',
    recommendedFor: 'Science revision, deep thinking & homework problem-solving',
    samplePhrase: "Greetings Aarav. Take your time, and let us explore this puzzle together.",
    icon: '🦉',
    accentColor: '#059669',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir (Sparky)',
    tagline: 'Dynamic, snappy & celebratory coach tone',
    description: 'Upbeat and encouraging with athletic momentum. Ideal for fast movement drills, sports celebrations, and quick study sprints.',
    timbre: 'Bright, energetic, punchy',
    energy: 'energetic',
    recommendedFor: 'Movement breaks, sports talk & fast study sprints',
    samplePhrase: "High five Aarav! Time to stretch, shake it off, and crush the day!",
    icon: '🦊',
    accentColor: '#f59e0b',
  },
  {
    id: 'Aoede',
    name: 'Aoede (Nova)',
    tagline: 'Soft, melodious & soothing cosmic tone',
    description: 'Gentle, comforting, and melodic. Helps when feeling overwhelmed, stressed, or needing a peaceful creative drawing session.',
    timbre: 'Soft, lyrical, relaxing',
    energy: 'gentle',
    recommendedFor: 'Breathing exercises, winding down & creative imagination',
    samplePhrase: "Hello Aarav. Take a soft, slow breath... let's enjoy some quiet creativity.",
    icon: '⭐',
    accentColor: '#9333ea',
  },
  {
    id: 'Kore',
    name: 'Kore',
    tagline: 'Warm, natural & relaxed mentor tone',
    description: 'A soothing, highly natural conversational voice that feels like a friendly tutor or caring family friend.',
    timbre: 'Natural, warm, friendly',
    energy: 'balanced',
    recommendedFor: 'Casual conversations, reading aloud & routine check-ins',
    samplePhrase: "Hey there Aarav! How are things going with your homework this afternoon?",
    icon: '🌱',
    accentColor: '#10b981',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    tagline: 'Breezy, playful & engaging companion tone',
    description: 'Lighthearted and curious with an inquisitive cadence that encourages children to ask questions freely.',
    timbre: 'Light, clear, engaging',
    energy: 'balanced',
    recommendedFor: 'Riddles, trivia, trivia games & quick curiosity checks',
    samplePhrase: "Hey Aarav! Got a quick riddle for you whenever you need a brain boost!",
    icon: '✨',
    accentColor: '#06b6d4',
  },
];

const STORAGE_KEY = 'childindi_custom_voice';

export function getActiveVoiceName(): GeminiVoiceName {
  if (typeof window === 'undefined') return 'Puck';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && AVAILABLE_VOICES.some((v) => v.id === saved)) {
      return saved as GeminiVoiceName;
    }
  } catch {}
  return 'Puck';
}

export function setActiveVoiceName(voice: GeminiVoiceName): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, voice);
    window.dispatchEvent(new CustomEvent('childindi_voice_changed', { detail: { voice } }));
  } catch {}
}

export function getVoiceMetadata(voiceName: string = 'Puck'): VoiceMetadata {
  return AVAILABLE_VOICES.find((v) => v.id === voiceName) || AVAILABLE_VOICES[0];
}

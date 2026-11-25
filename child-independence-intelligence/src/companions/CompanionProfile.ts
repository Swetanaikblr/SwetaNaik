// Companion Character Profile System

export type CompanionId = 'echo' | 'sparky' | 'athena' | 'nova';

export type GeminiLiveVoiceName = 'Puck' | 'Fenrir' | 'Charon' | 'Aoede' | 'Kore' | 'Zephyr';

export interface CompanionProfile {
  id: CompanionId;
  name: string;
  avatar: string;
  title: string;
  tagline: string;
  geminiVoice: GeminiLiveVoiceName;
  colorTheme: {
    primary: string;
    gradient: string;
    badgeBg: string;
    badgeBorder: string;
    textColor: string;
    orbGlow: string;
  };
  behavioralStyle: {
    energyLevel: 'calm' | 'high' | 'reflective' | 'gentle';
    pacing: 'relaxed' | 'snappy' | 'measured' | 'soothing';
    encouragementTone: string;
    listeningAttitude: string;
  };
  systemInstructionAddendum: string;
  greetingStarters: {
    afterSchool: string;
    morning: string;
    lateLogin: string;
    studyTime: string;
  };
  quickSuggestions: string[];
}

export { getCompanionProfile, COMPANION_PROFILES, DEFAULT_COMPANION_ID } from './companionProfiles';

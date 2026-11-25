import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  PhoneCall,
  Radio,
  RefreshCw,
  HelpCircle,
  Laugh,
  Coins,
  Dices,
  Wind,
  Smile,
  Activity,
  Zap,
} from 'lucide-react';
import { ChildProfile, ChatMessage, TimeScenario, DailyObservation } from '../../types';
import {
  speakText,
  stopSpeaking,
  createSpeechRecognizer,
  playChime,
  isSpeechRecognitionSupported,
  CharacterVoice,
  CHARACTER_PROFILES,
  LiveAudioMeter,
} from '../../utils/speech';
import {
  RIDDLES,
  MATH_CHALLENGES,
  KID_JOKES,
  AVATAR_BOOP_QUIPS,
} from '../../data/companionInteractions';
import { VerbalCallModal } from './VerbalCallModal';
import { VoiceSelectorModal } from '../voice/VoiceSelectorModal';
import { getActiveVoiceName, GeminiVoiceName } from '../../voice/voiceRegistry';

interface ConversationalGuideCardProps {
  childProfile: ChildProfile;
  timeScenario: TimeScenario;
  soundEnabled: boolean;
  onActivitySelect?: (activityId: 'study' | 'drawing' | 'youtube' | 'move' | 'chat' | 'explore') => void;
  onLogInteraction?: (title: string, details?: string) => void;
  onObservationRecorded?: (obs: Omit<DailyObservation, 'id'>) => void;
}

export const ConversationalGuideCard: React.FC<ConversationalGuideCardProps> = ({
  childProfile,
  timeScenario,
  soundEnabled,
  onActivitySelect,
  onLogInteraction,
  onObservationRecorded,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [localAudioMuted, setLocalAudioMuted] = useState(!soundEnabled);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<GeminiVoiceName>(getActiveVoiceName);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [selectedChar, setSelectedChar] = useState<CharacterVoice>('robot');

  // Interactive modes
  const [activeTab, setActiveTab] = useState<'chat' | 'games' | 'breathe'>('chat');
  const [riddleIndex, setRiddleIndex] = useState(0);
  const [showRiddleHint, setShowRiddleHint] = useState(false);
  const [showRiddleAnswer, setShowRiddleAnswer] = useState(false);
  const [mathIndex, setMathIndex] = useState(0);
  const [mathStatus, setMathStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [coinResult, setCoinResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [diceResult, setDiceResult] = useState<number | null>(null);

  // Breathing state
  const [breathePhase, setBreathePhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breatheCount, setBreatheCount] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  // Audio Equalizer State
  const [equalizerBars, setEqualizerBars] = useState<number[]>([25, 45, 60, 30, 75, 40, 65, 35]);
  const [micLevel, setMicLevel] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const audioMeterRef = useRef<LiveAudioMeter | null>(null);
  const isSpeechSupported = isSpeechRecognitionSupported();
  const currentChar = CHARACTER_PROFILES[selectedChar];

  // Sync with prop if parent toggles sound
  useEffect(() => {
    setLocalAudioMuted(!soundEnabled);
  }, [soundEnabled]);

  // Dynamic animation for speech synthesizer
  useEffect(() => {
    let animInterval: any = null;
    if (isSpeaking) {
      animInterval = setInterval(() => {
        setEqualizerBars([
          Math.floor(Math.random() * 60 + 20),
          Math.floor(Math.random() * 70 + 25),
          Math.floor(Math.random() * 85 + 15),
          Math.floor(Math.random() * 65 + 30),
          Math.floor(Math.random() * 80 + 20),
          Math.floor(Math.random() * 75 + 15),
          Math.floor(Math.random() * 60 + 35),
          Math.floor(Math.random() * 50 + 20),
        ]);
      }, 100);
    } else if (!isListening) {
      setEqualizerBars([20, 20, 20, 20, 20, 20, 20, 20]);
    }
    return () => {
      if (animInterval) clearInterval(animInterval);
    };
  }, [isSpeaking, isListening]);

  // Breathing cycle timer
  useEffect(() => {
    if (!isBreathingActive) return;

    let phaseTimer: any = null;
    let secondsLeft = 4;
    setBreatheCount(secondsLeft);

    const stepPhase = () => {
      setBreathePhase((current) => {
        if (current === 'Inhale') {
          playChime('pop');
          return 'Hold';
        } else if (current === 'Hold') {
          playChime('breathe_out');
          return 'Exhale';
        } else {
          playChime('breathe_in');
          return 'Inhale';
        }
      });
    };

    const countdown = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        secondsLeft = 4;
        stepPhase();
      }
      setBreatheCount(secondsLeft);
    }, 1000);

    return () => {
      clearInterval(countdown);
    };
  }, [isBreathingActive]);

  // Initialize conversation when time scenario changes
  useEffect(() => {
    let initialGreeting = `Hey ${childProfile.name}! Welcome back 😊 How was school today?`;
    let initialReplies = ['Good 👍', 'Tiring 😴', 'We had a football match ⚽', 'Tell me a riddle ❓'];

    if (timeScenario === 'morning') {
      initialGreeting = `Good morning ${childProfile.name}! ☀️ Ready for the day?`;
      initialReplies = ['Ready to roll! 🚀', 'Need 5 more mins 🥱', 'Packed my bag ✅', 'Joke of the day 😂'];
    } else if (timeScenario === 'after_school') {
      initialGreeting = `Hey ${childProfile.name} 👋 Welcome back! How was school today?`;
      initialReplies = ['Good 👍', 'Tiring 😴', 'We had a football match ⚽', 'Tell me a riddle ❓'];
    } else if (timeScenario === 'pre_study') {
      initialGreeting = `Maths is coming up in about 10 minutes. Ready to get started soon?`;
      initialReplies = ['Ready! 🚀', 'Need 10 min ⏳', 'Quick Math quiz ⚡', 'Open textbook 📖'];
    } else if (timeScenario === 'study_time') {
      initialGreeting = `Let's tackle Maths. Your task is Exercises 1–10 from Chapter 4. Let me know if you want a hint!`;
      initialReplies = ['Working on Q1-Q4 ✏️', 'Need hint on Q5 ❓', 'Done! ✅'];
    } else if (timeScenario === 'free_time') {
      initialGreeting = `Great job earlier! You've got some free time now. What are you in the mood for?`;
      initialReplies = ['🎨 Draw something', '▶️ Watch a video', '🏃 Stretch & move', '🪙 Flip a coin'];
    } else if (timeScenario === 'evening') {
      initialGreeting = `Hey ${childProfile.name}, you have Science revision today. Want to tackle it now or relax a bit first?`;
      initialReplies = ['Let’s do Science 🔬', 'Reviewing notes 📝', 'Need 10 mins'];
    } else if (timeScenario === 'bedtime') {
      initialGreeting = `Almost bedtime! Want to get tomorrow’s bag ready so the morning is super easy?`;
      initialReplies = ['Bag is packed! 🎒', 'Doing it now', 'All set! 😴'];
    }

    const firstMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: initialReplies,
    };

    setMessages([firstMsg]);

    if (!localAudioMuted) {
      setIsSpeaking(true);
      setSpeakingMessageId(firstMsg.id);
      speakText(
        initialGreeting,
        () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        },
        { character: selectedChar }
      );
    }

    return () => {
      stopSpeaking();
    };
  }, [timeScenario, childProfile.name]);

  // Voice recognition toggle for the input bar
  const toggleSpeechRecognition = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (audioMeterRef.current) {
        audioMeterRef.current.stop();
      }
      setIsListening(false);
      playChime('listen_stop');
      return;
    }

    if (!isSpeechSupported) {
      setSpeechNotice(
        'Microphone speech recognition is not supported in this browser. You can type or tap quick replies!'
      );
      setTimeout(() => setSpeechNotice(null), 4000);
      return;
    }

    stopSpeaking();
    setIsSpeaking(false);
    setSpeakingMessageId(null);

    playChime('listen_start');
    setIsListening(true);
    setSpeechNotice(null);

    // Attach live audio meter
    try {
      const meter = new LiveAudioMeter((lvl, freqs) => {
        setMicLevel(lvl);
        if (freqs.length >= 8) {
          setEqualizerBars(freqs.slice(0, 8).map((f) => Math.max(15, f)));
        }
      });
      const ok = await meter.start();
      if (ok) audioMeterRef.current = meter;
    } catch {}

    const rec = createSpeechRecognizer(
      (transcript, isFinal) => {
        setInputText(transcript);
        if (isFinal && transcript.trim().length > 0) {
          setIsListening(false);
          if (audioMeterRef.current) audioMeterRef.current.stop();
          playChime('listen_stop');
          handleSendMessage(transcript.trim());
        }
      },
      () => {
        setIsListening(false);
        if (audioMeterRef.current) audioMeterRef.current.stop();
      },
      (err) => {
        setIsListening(false);
        if (audioMeterRef.current) audioMeterRef.current.stop();
        console.warn('Voice input error:', err);
        if (err === 'not-allowed') {
          setSpeechNotice('Microphone access was blocked. Please grant microphone permission to talk.');
        } else {
          setSpeechNotice('Could not catch your voice. Please try speaking again!');
        }
        setTimeout(() => setSpeechNotice(null), 4000);
      }
    );

    if (rec) {
      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (e) {
        console.warn('Could not start recognition:', e);
        setIsListening(false);
      }
    }
  };

  const handleSpeakMessage = (text: string, msgId: string) => {
    if (isSpeaking && speakingMessageId === msgId) {
      stopSpeaking();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    stopSpeaking();
    setIsSpeaking(true);
    setSpeakingMessageId(msgId);
    speakText(
      text,
      () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      },
      { character: selectedChar }
    );
  };

  // Tap Avatar Reaction
  const handleAvatarTap = () => {
    playChime('avatar_boop');
    const quip = AVATAR_BOOP_QUIPS[Math.floor(Math.random() * AVATAR_BOOP_QUIPS.length)];
    const aiMsgId = `ai-boop-${Date.now()}`;
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: quip,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: ['Tell me a riddle ❓', 'Tell a joke 😂', 'Help with Maths 📚'],
    };

    setMessages((prev) => [...prev, aiMsg]);

    if (!localAudioMuted) {
      setIsSpeaking(true);
      setSpeakingMessageId(aiMsgId);
      speakText(
        quip,
        () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        },
        { character: selectedChar }
      );
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    playChime('pop');

    // Add user message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'child',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputText('');
    setIsLoading(true);

    if (onLogInteraction) {
      onLogInteraction('Conversational interaction with guide', `Child said: "${text}"`);
    }

    // Interactive Action triggers
    const lower = text.toLowerCase();
    if (lower.includes('riddle')) {
      setActiveTab('games');
      handleNextRiddle();
      setIsLoading(false);
      return;
    }
    if (lower.includes('joke')) {
      handleTellJoke();
      setIsLoading(false);
      return;
    }
    if (lower.includes('coin') || lower.includes('flip')) {
      setActiveTab('games');
      handleFlipCoin();
      setIsLoading(false);
      return;
    }
    if (lower.includes('dice') || lower.includes('roll')) {
      setActiveTab('games');
      handleRollDice();
      setIsLoading(false);
      return;
    }
    if (lower.includes('breathe') || lower.includes('chill') || lower.includes('calm')) {
      setActiveTab('breathe');
      setIsBreathingActive(true);
      setIsLoading(false);
      return;
    }
    if (lower.includes('draw') && onActivitySelect) {
      onActivitySelect('drawing');
    } else if (lower.includes('watch') && onActivitySelect) {
      onActivitySelect('youtube');
    } else if ((lower.includes('study') || lower.includes('maths')) && onActivitySelect) {
      onActivitySelect('study');
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: childProfile.name,
          userMessage: text,
          scenario: timeScenario,
          simulatedTime: getSimulatedTime(timeScenario),
          conversationHistory: updated.slice(-4),
        }),
      });

      const data = await res.json();
      const aiReply = data.reply || "Sounds good! Want to get started or chill for a bit?";
      const aiReplies = data.suggestedReplies || [
        '📚 Study',
        '🎨 Draw',
        '▶️ Watch',
        '❓ Tell a riddle',
      ];

      if (data.observationRecord && onObservationRecorded) {
        onObservationRecorded({
          time: data.observationRecord.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: (data.observationRecord.source as any) || 'child_reported',
          title: data.observationRecord.title,
          detail: data.observationRecord.detail,
          category: data.observationRecord.category || 'after_school',
        });
      }

      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: aiReplies,
      };

      setMessages((prev) => [...prev, aiMsg]);
      playChime('reply_received');

      if (!localAudioMuted) {
        setIsSpeaking(true);
        setSpeakingMessageId(aiMsgId);
        speakText(
          aiReply,
          () => {
            setIsSpeaking(false);
            setSpeakingMessageId(null);
          },
          { character: selectedChar }
        );
      }
    } catch (e) {
      console.error('Chat error:', e);
      const fallbackId = `ai-${Date.now()}`;
      const fallbackMsg: ChatMessage = {
        id: fallbackId,
        sender: 'ai',
        text: "Got it! I'm right here with you. What would you like to explore next?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: ['📚 Study', '🎨 Draw', '▶️ Watch', '❓ Riddle'],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (!localAudioMuted) {
        setIsSpeaking(true);
        setSpeakingMessageId(fallbackId);
        speakText(
          fallbackMsg.text,
          () => {
            setIsSpeaking(false);
            setSpeakingMessageId(null);
          },
          { character: selectedChar }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Interactive Games handlers
  const handleNextRiddle = () => {
    playChime('avatar_boop');
    const nextIdx = (riddleIndex + 1) % RIDDLES.length;
    setRiddleIndex(nextIdx);
    setShowRiddleHint(false);
    setShowRiddleAnswer(false);

    const r = RIDDLES[nextIdx];
    const speech = `Riddle time: ${r.question}`;
    if (!localAudioMuted) {
      setIsSpeaking(true);
      speakText(speech, () => setIsSpeaking(false), { character: selectedChar });
    }
  };

  const handleTellJoke = () => {
    playChime('reply_received');
    const joke = KID_JOKES[Math.floor(Math.random() * KID_JOKES.length)];
    const msgId = `ai-joke-${Date.now()}`;
    const jokeMsg: ChatMessage = {
      id: msgId,
      sender: 'ai',
      text: `${joke.setup} ... ${joke.punchline}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: ['Another joke! 😂', 'Tell a riddle ❓', 'Flip a coin 🪙'],
    };
    setMessages((prev) => [...prev, jokeMsg]);

    if (!localAudioMuted) {
      setIsSpeaking(true);
      setSpeakingMessageId(msgId);
      speakText(
        joke.setup,
        () => {
          setTimeout(() => {
            speakText(
              joke.punchline,
              () => {
                setIsSpeaking(false);
                setSpeakingMessageId(null);
              },
              { character: selectedChar }
            );
          }, 600);
        },
        { character: selectedChar }
      );
    }
  };

  const handleFlipCoin = () => {
    playChime('coin_flip');
    const res = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
    setCoinResult(res);

    const msg = `Flipped a coin... It landed on ${res}! 🪙`;
    if (!localAudioMuted) {
      setIsSpeaking(true);
      speakText(msg, () => setIsSpeaking(false), { character: selectedChar });
    }
  };

  const handleRollDice = () => {
    playChime('dice_roll');
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceResult(roll);

    const msg = `Rolled the dice... You got a ${roll}! 🎲`;
    if (!localAudioMuted) {
      setIsSpeaking(true);
      speakText(msg, () => setIsSpeaking(false), { character: selectedChar });
    }
  };

  const latestAiMessage = [...messages].reverse().find((m) => m.sender === 'ai');

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/70 to-white border border-blue-100 rounded-3xl p-4 sm:p-5 shadow-xs transition-all relative overflow-hidden">
        {/* Soft background radial glows */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

        {/* Companion Header: Avatar, Status, Character Selector & Call Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 relative z-10">
          <div className="flex items-center gap-3">
            {/* Interactive Tap-able Avatar with Equalizer Ring */}
            <div className="relative">
              <button
                onClick={handleAvatarTap}
                title="Tap me to play with your guide!"
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs transition-all cursor-pointer active:scale-90 hover:scale-105 ${
                  isSpeaking
                    ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 ring-4 ring-blue-300 scale-105 shadow-md'
                    : isListening
                    ? 'bg-gradient-to-tr from-red-500 to-amber-500 ring-4 ring-red-300 scale-105 animate-pulse'
                    : `bg-gradient-to-tr ${currentChar.color}`
                }`}
              >
                <span className="select-none animate-bounce">{currentChar.avatar}</span>
              </button>

              {/* Pulsing indicator if speaking */}
              {isSpeaking && (
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-white"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  {currentChar.name}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/90 text-blue-800">
                  {currentChar.title}
                </span>
              </div>

              {/* Live Status and Equalizer mini-bars */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                {isSpeaking ? (
                  <span className="text-blue-600 font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse text-blue-600" /> Speaking aloud...
                  </span>
                ) : isListening ? (
                  <span className="text-red-600 font-bold flex items-center gap-1">
                    <Mic className="w-3 h-3 animate-bounce text-red-600" /> Listening to you...
                  </span>
                ) : (
                  <span className="text-slate-500">Tap avatar to say hi!</span>
                )}

                {/* Equalizer animation */}
                <div className="flex items-end gap-0.5 h-3">
                  {equalizerBars.map((bar, i) => (
                    <div
                      key={i}
                      style={{ height: `${Math.max(15, bar)}%` }}
                      className={`w-0.5 rounded-full transition-all duration-75 ${
                        isSpeaking
                          ? 'bg-blue-600'
                          : isListening
                          ? 'bg-red-500'
                          : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Tools & Character Switcher */}
          <div className="flex items-center gap-1.5">
            {/* Quick Character Picker */}
            <div className="hidden sm:flex items-center gap-0.5 bg-white/80 p-0.5 rounded-xl border border-blue-100 shadow-2xs">
              {(Object.keys(CHARACTER_PROFILES) as CharacterVoice[]).map((cKey) => {
                const c = CHARACTER_PROFILES[cKey];
                const isSelected = selectedChar === cKey;
                return (
                  <button
                    key={cKey}
                    onClick={() => {
                      playChime('avatar_boop');
                      setSelectedChar(cKey);
                    }}
                    title={`Switch companion to ${c.name}`}
                    className={`p-1 rounded-lg text-sm transition-all cursor-pointer ${
                      isSelected ? 'bg-blue-100 scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {c.avatar}
                  </button>
                );
              })}
            </div>

            {/* Voice Customizer Studio Button */}
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              title="Change companion voice (Puck, Charon, Fenrir, Aoede, Kore)"
              className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Voice: {currentVoice}</span>
              <span className="sm:hidden">{currentVoice}</span>
            </button>

            {/* Launch Full Verbal Voice Call */}
            <button
              onClick={() => setIsCallModalOpen(true)}
              title="Open full interactive voice call"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Voice Call</span>
            </button>

            {/* Voice Mute / Unmute Button */}
            <button
              onClick={() => {
                const nextMute = !localAudioMuted;
                setLocalAudioMuted(nextMute);
                if (nextMute) {
                  stopSpeaking();
                  setIsSpeaking(false);
                  setSpeakingMessageId(null);
                } else if (latestAiMessage) {
                  handleSpeakMessage(latestAiMessage.text, latestAiMessage.id);
                }
              }}
              title={
                localAudioMuted
                  ? 'Voice is muted. Tap to hear companion speak aloud.'
                  : 'Voice is unmuted. Tap to mute.'
              }
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                localAudioMuted
                  ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  : 'text-blue-600 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/60'
              }`}
            >
              {localAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Speech Notice Toast */}
        {speechNotice && (
          <div className="mb-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center animate-fadeIn">
            {speechNotice}
          </div>
        )}

        {/* Interactive Mode Tabs: Chat vs. Brain Games vs. 1-Min Breathe */}
        <div className="flex items-center gap-1.5 mb-3 bg-white/70 p-1 rounded-2xl border border-blue-100/80">
          <button
            onClick={() => {
              playChime('pop');
              setActiveTab('chat');
              setIsBreathingActive(false);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-blue-50/60'
            }`}
          >
            <span>💬 Chat & Talk</span>
          </button>

          <button
            onClick={() => {
              playChime('pop');
              setActiveTab('games');
              setIsBreathingActive(false);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'games'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:bg-amber-50/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>🧩 Brain Games</span>
          </button>

          <button
            onClick={() => {
              playChime('breathe_in');
              setActiveTab('breathe');
              setIsBreathingActive(true);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'breathe'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-emerald-50/60'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>🧘 Breathe & Chill</span>
          </button>
        </div>

        {/* TAB 1: Chat & Talk Interface */}
        {activeTab === 'chat' && (
          <div>
            {/* Conversation Thread */}
            {messages.length > 1 ? (
              <div className="space-y-2 mb-3.5 max-h-52 overflow-y-auto pr-1">
                {messages.slice(-6).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'child' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed relative ${
                        msg.sender === 'child'
                          ? 'bg-blue-600 text-white rounded-br-xs shadow-2xs font-medium'
                          : 'bg-white text-slate-800 border border-blue-100/90 rounded-bl-xs shadow-2xs font-medium'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => handleSpeakMessage(msg.text, msg.id)}
                          title="Listen out loud"
                          className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                            isSpeaking && speakingMessageId === msg.id
                              ? 'text-blue-600 font-bold'
                              : 'text-slate-400 hover:text-blue-600'
                          }`}
                        >
                          <Volume2
                            className={`w-3.5 h-3.5 ${
                              isSpeaking && speakingMessageId === msg.id ? 'animate-pulse text-blue-600' : ''
                            }`}
                          />
                          <span>
                            {isSpeaking && speakingMessageId === msg.id ? 'Speaking aloud...' : 'Listen'}
                          </span>
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 px-1">{msg.timestamp}</span>
                  </div>
                ))}
              </div>
            ) : (
              latestAiMessage && (
                <div className="bg-white rounded-2xl p-4 border border-blue-100/90 shadow-xs mb-3 relative">
                  <p className="text-slate-800 text-[14px] sm:text-[15px] leading-relaxed font-medium">
                    {latestAiMessage.text}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleSpeakMessage(latestAiMessage.text, latestAiMessage.id)}
                      title="Speak out loud"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <Volume2
                        className={`w-3.5 h-3.5 ${
                          isSpeaking && speakingMessageId === latestAiMessage.id ? 'animate-pulse' : ''
                        }`}
                      />
                      <span>
                        {isSpeaking && speakingMessageId === latestAiMessage.id
                          ? 'Speaking aloud...'
                          : 'Hear out loud'}
                      </span>
                    </button>
                    <button
                      onClick={() => setIsCallModalOpen(true)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Start Voice Chat</span>
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Quick Reply Pills */}
            {latestAiMessage?.quickReplies && latestAiMessage.quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {latestAiMessage.quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(reply)}
                    disabled={isLoading}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 active:scale-95 transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex items-center gap-2"
            >
              <div className="flex-1 relative">
                <input
                  id="child-guide-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Listening to your voice... Speak now!'
                      : 'Ask anything, tell me a riddle, or tap the mic...'
                  }
                  disabled={isLoading}
                  className={`w-full text-xs sm:text-sm pl-3 pr-10 py-2.5 rounded-xl bg-white border transition-all outline-hidden ${
                    isListening
                      ? 'border-red-400 bg-red-50/60 text-red-900 placeholder:text-red-500 ring-2 ring-red-200 animate-pulse'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                />

                <button
                  type="button"
                  id="child-voice-mic"
                  onClick={toggleSpeechRecognition}
                  title={isListening ? 'Stop listening' : 'Tap to speak out loud'}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white animate-bounce shadow-md'
                      : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                id="child-guide-submit"
                disabled={!inputText.trim() || isLoading}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {isLoading ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Interactive Brain Games & Challenges */}
        {activeTab === 'games' && (
          <div className="space-y-3 animate-fadeIn">
            {/* Quick Game Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={handleNextRiddle}
                className="p-2.5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 text-amber-900 hover:bg-amber-50/60 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs"
              >
                <HelpCircle className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-xs font-bold">Riddle Me</span>
                <span className="text-[10px] text-slate-500">Brain Teasers</span>
              </button>

              <button
                onClick={handleTellJoke}
                className="p-2.5 rounded-2xl bg-white border border-purple-200 hover:border-purple-400 text-purple-900 hover:bg-purple-50/60 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs"
              >
                <Laugh className="w-5 h-5 text-purple-500 mb-1" />
                <span className="text-xs font-bold">Tell a Joke</span>
                <span className="text-[10px] text-slate-500">Laugh Out Loud</span>
              </button>

              <button
                onClick={handleFlipCoin}
                className="p-2.5 rounded-2xl bg-white border border-cyan-200 hover:border-cyan-400 text-cyan-900 hover:bg-cyan-50/60 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs"
              >
                <Coins className="w-5 h-5 text-cyan-500 mb-1" />
                <span className="text-xs font-bold">Flip a Coin</span>
                <span className="text-[10px] text-slate-500">Heads or Tails</span>
              </button>

              <button
                onClick={handleRollDice}
                className="p-2.5 rounded-2xl bg-white border border-pink-200 hover:border-pink-400 text-pink-900 hover:bg-pink-50/60 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-2xs"
              >
                <Dices className="w-5 h-5 text-pink-500 mb-1" />
                <span className="text-xs font-bold">Roll a Dice</span>
                <span className="text-[10px] text-slate-500">1 to 6 Roll</span>
              </button>
            </div>

            {/* Interactive Riddle Card */}
            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  Active Riddle #{riddleIndex + 1}
                </span>
                <button
                  onClick={handleNextRiddle}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                >
                  Next Riddle ➡️
                </button>
              </div>

              <p className="text-sm font-semibold text-slate-800 mb-2.5">
                "{RIDDLES[riddleIndex].question}"
              </p>

              {showRiddleHint && (
                <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 mb-2 animate-fadeIn">
                  💡 <span className="font-bold">Hint:</span> {RIDDLES[riddleIndex].hint}
                </div>
              )}

              {showRiddleAnswer && (
                <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/80 mb-2 animate-fadeIn">
                  🎉 <span className="font-bold">Answer:</span> {RIDDLES[riddleIndex].answer}
                  <span className="block text-[11px] font-normal text-emerald-700 mt-1">
                    {RIDDLES[riddleIndex].funFact}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                {!showRiddleHint && (
                  <button
                    onClick={() => {
                      playChime('pop');
                      setShowRiddleHint(true);
                      if (!localAudioMuted) {
                        speakText(`Here's a hint: ${RIDDLES[riddleIndex].hint}`, undefined, {
                          character: selectedChar,
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200 transition-all cursor-pointer"
                  >
                    Need a Hint 💡
                  </button>
                )}

                {!showRiddleAnswer && (
                  <button
                    onClick={() => {
                      playChime('celebrate');
                      setShowRiddleAnswer(true);
                      if (!localAudioMuted) {
                        speakText(`The answer is: ${RIDDLES[riddleIndex].answer}`, undefined, {
                          character: selectedChar,
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    Reveal Answer 🎉
                  </button>
                )}

                <button
                  onClick={() =>
                    speakText(RIDDLES[riddleIndex].question, undefined, {
                      character: selectedChar,
                    })
                  }
                  className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Read aloud</span>
                </button>
              </div>
            </div>

            {/* Quick Coin / Dice Result Banner if rolled */}
            {(coinResult || diceResult) && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  {coinResult && <span>🪙 Coin Result: <strong className="text-indigo-700">{coinResult}</strong></span>}
                  {diceResult && <span>🎲 Dice Result: <strong className="text-indigo-700">{diceResult}</strong></span>}
                </div>
                <button
                  onClick={() => {
                    setCoinResult(null);
                    setDiceResult(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Interactive 1-Min Guided Breathing */}
        {activeTab === 'breathe' && (
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-emerald-200 text-center animate-fadeIn">
            <div className="relative flex items-center justify-center w-36 h-36 my-2">
              {/* Expanding & Contracting Breathing Circle */}
              <div
                style={{
                  transform:
                    breathePhase === 'Inhale'
                      ? 'scale(1.3)'
                      : breathePhase === 'Hold'
                      ? 'scale(1.3)'
                      : 'scale(0.85)',
                  transition: 'transform 3.8s ease-in-out',
                }}
                className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-xl flex items-center justify-center text-white"
              >
                <div className="text-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider block">
                    {breathePhase}
                  </span>
                  <span className="text-2xl font-black">{breatheCount}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-emerald-800 font-medium mb-3">
              Box breathing helps calm your nervous system and reset focus in 60 seconds.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playChime('breathe_in');
                  setIsBreathingActive(!isBreathingActive);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isBreathingActive
                    ? 'bg-slate-800 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                {isBreathingActive ? 'Pause Exercise' : 'Start Breathing'}
              </button>

              <button
                onClick={() => {
                  setActiveTab('chat');
                  setIsBreathingActive(false);
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Two-Way Verbal Voice Call Modal */}
      <VerbalCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        childProfile={childProfile}
        timeScenario={timeScenario}
        initialTranscriptHistory={messages}
        onLogInteraction={onLogInteraction}
        onObservationRecorded={onObservationRecorded}
        onNewMessage={(msg) => setMessages((prev) => [...prev, msg])}
        onActivitySelect={onActivitySelect}
      />

      {/* Voice Customizer Studio Modal */}
      <VoiceSelectorModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        currentVoice={currentVoice}
        onVoiceChanged={(v) => setCurrentVoice(v)}
        childName={childProfile.name}
      />
    </>
  );
};

function getSimulatedTime(scenario: TimeScenario): string {
  switch (scenario) {
    case 'morning':
      return '07:30';
    case 'after_school':
      return '15:30';
    case 'pre_study':
      return '16:50';
    case 'study_time':
      return '17:05';
    case 'free_time':
      return '18:15';
    case 'evening':
      return '20:00';
    case 'bedtime':
      return '21:30';
  }
}

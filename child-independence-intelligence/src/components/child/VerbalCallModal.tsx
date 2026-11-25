import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Sparkles,
  RefreshCw,
  Radio,
  Zap,
  HelpCircle,
  Laugh,
  Coins,
  Dices,
  Palette,
  Play,
  Activity,
  BookOpen,
  CheckCircle2,
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

interface VerbalCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  childProfile: ChildProfile;
  timeScenario: TimeScenario;
  onLogInteraction?: (title: string, details?: string) => void;
  onObservationRecorded?: (obs: Omit<DailyObservation, 'id'>) => void;
  initialTranscriptHistory?: ChatMessage[];
  onNewMessage?: (msg: ChatMessage) => void;
  onActivitySelect?: (activityId: 'study' | 'drawing' | 'youtube' | 'move' | 'chat' | 'explore') => void;
}

export const VerbalCallModal: React.FC<VerbalCallModalProps> = ({
  isOpen,
  onClose,
  childProfile,
  timeScenario,
  onLogInteraction,
  onObservationRecorded,
  initialTranscriptHistory = [],
  onNewMessage,
  onActivitySelect,
}) => {
  const [selectedChar, setSelectedChar] = useState<CharacterVoice>('robot');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoListenEnabled, setAutoListenEnabled] = useState(true);
  const [soundMuted, setSoundMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [currentAiSpeech, setCurrentAiSpeech] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [avatarReaction, setAvatarReaction] = useState<string | null>(null);

  // Real-time audio reactive levels
  const [micLevel, setMicLevel] = useState<number>(0);
  const [freqBars, setFreqBars] = useState<number[]>(new Array(16).fill(15));

  // Interactive Mini-Game state
  const [activeInteractiveMode, setActiveInteractiveMode] = useState<
    'chat' | 'riddle' | 'math' | 'decision'
  >('chat');
  const [currentRiddleIdx, setCurrentRiddleIdx] = useState(0);
  const [showRiddleHint, setShowRiddleHint] = useState(false);
  const [showRiddleAnswer, setShowRiddleAnswer] = useState(false);
  const [currentMathIdx, setCurrentMathIdx] = useState(0);
  const [mathAnswerStatus, setMathAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [coinResult, setCoinResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [diceResult, setDiceResult] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioMeterRef = useRef<LiveAudioMeter | null>(null);
  const synthAnimRef = useRef<any>(null);

  const isSpeechSupported = isSpeechRecognitionSupported();
  const currentCharProfile = CHARACTER_PROFILES[selectedChar];

  // Call duration counter & Cleanup
  useEffect(() => {
    if (!isOpen) return;
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeaking();
      if (audioMeterRef.current) {
        audioMeterRef.current.stop();
      }
      if (synthAnimRef.current) {
        clearInterval(synthAnimRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [isOpen]);

  // Synthetic equalizer animation when AI is speaking
  useEffect(() => {
    if (isSpeaking) {
      synthAnimRef.current = setInterval(() => {
        setFreqBars((prev) =>
          prev.map(() => Math.floor(Math.random() * 70 + 25))
        );
        setMicLevel(Math.floor(Math.random() * 50 + 35));
      }, 120);
    } else if (!isListening) {
      if (synthAnimRef.current) clearInterval(synthAnimRef.current);
      setFreqBars(new Array(16).fill(15));
      setMicLevel(0);
    }
    return () => {
      if (synthAnimRef.current) clearInterval(synthAnimRef.current);
    };
  }, [isSpeaking, isListening]);

  // Initial call greeting
  useEffect(() => {
    if (!isOpen) return;

    const lastAiMsg = [...initialTranscriptHistory].reverse().find((m) => m.sender === 'ai');
    let welcomeText = `Hey ${childProfile.name}! I'm all ears. You can talk to me, try a riddle, or pick what you'd like to do!`;
    let startingReplies = [
      'Tell me a riddle ❓',
      'Quick Maths test ⚡',
      'Flip a coin 🪙',
      'How was your day? 😊',
    ];

    if (lastAiMsg) {
      welcomeText = lastAiMsg.text;
      if (lastAiMsg.quickReplies && lastAiMsg.quickReplies.length > 0) {
        startingReplies = lastAiMsg.quickReplies;
      }
    }

    setCurrentAiSpeech(welcomeText);
    setQuickReplies(startingReplies);

    if (!soundMuted) {
      speakCompanion(welcomeText, () => {
        if (autoListenEnabled && isSpeechSupported) {
          startListeningVoice();
        }
      });
    }
  }, [isOpen]);

  const speakCompanion = (text: string, onDone?: () => void) => {
    setIsSpeaking(true);
    speakText(
      text,
      () => {
        setIsSpeaking(false);
        if (onDone) onDone();
      },
      { character: selectedChar }
    );
  };

  const startListeningVoice = async () => {
    if (isListening) return;
    stopSpeaking();
    setIsSpeaking(false);

    if (!isSpeechSupported) {
      setMicNotice('Speech recognition is not supported in this browser. Tap any interactive option below to speak!');
      return;
    }

    playChime('listen_start');
    setLiveTranscript('');
    setIsListening(true);
    setMicNotice(null);

    // Start live microphone frequency analyser
    try {
      const meter = new LiveAudioMeter((level, freqs) => {
        setMicLevel(level);
        if (freqs.length > 0) {
          // Downsample or interpolate to 16 bars
          const sampled = Array.from({ length: 16 }, (_, i) => {
            const idx = Math.floor((i / 16) * freqs.length);
            return Math.max(15, freqs[idx] || 15);
          });
          setFreqBars(sampled);
        }
      });
      const started = await meter.start();
      if (started) {
        audioMeterRef.current = meter;
      }
    } catch {
      // Audio meter is non-blocking enhancement
    }

    const rec = createSpeechRecognizer(
      (transcript, isFinal) => {
        setLiveTranscript(transcript);
        if (isFinal && transcript.trim().length > 0) {
          stopListeningVoice();
          handleSendVoiceMessage(transcript.trim());
        }
      },
      () => {
        setIsListening(false);
        if (audioMeterRef.current) {
          audioMeterRef.current.stop();
        }
      },
      (err) => {
        setIsListening(false);
        if (audioMeterRef.current) {
          audioMeterRef.current.stop();
        }
        console.warn('Voice call mic error:', err);
        if (err === 'not-allowed') {
          setMicNotice('Microphone permission blocked. Please check browser settings or tap quick replies.');
        }
      }
    );

    if (rec) {
      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (e) {
        console.warn('Failed to start call mic:', e);
        setIsListening(false);
      }
    }
  };

  const stopListeningVoice = () => {
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
  };

  const handleSendVoiceMessage = async (text: string) => {
    if (!text.trim()) return;
    setIsLoadingReply(true);
    setLiveTranscript('');

    const childMsg: ChatMessage = {
      id: `call-child-${Date.now()}`,
      sender: 'child',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (onNewMessage) onNewMessage(childMsg);
    if (onLogInteraction) {
      onLogInteraction('Voice conversation with guide', `Child spoke: "${text}"`);
    }

    // Check for interactive triggers in spoken/typed text
    const lower = text.toLowerCase();
    if (lower.includes('riddle')) {
      triggerRiddleMode();
      setIsLoadingReply(false);
      return;
    }
    if (lower.includes('joke')) {
      triggerJoke();
      setIsLoadingReply(false);
      return;
    }
    if (lower.includes('flip') || lower.includes('coin')) {
      triggerCoinFlip();
      setIsLoadingReply(false);
      return;
    }
    if (lower.includes('dice') || lower.includes('roll')) {
      triggerDiceRoll();
      setIsLoadingReply(false);
      return;
    }
    if (lower.includes('draw') && onActivitySelect) {
      onClose();
      onActivitySelect('drawing');
      return;
    }
    if (lower.includes('study') || lower.includes('maths') && onActivitySelect) {
      onClose();
      onActivitySelect('study');
      return;
    }
    if (lower.includes('move') || lower.includes('stretch') && onActivitySelect) {
      onClose();
      onActivitySelect('move');
      return;
    }
    if (lower.includes('youtube') || lower.includes('video') && onActivitySelect) {
      onClose();
      onActivitySelect('youtube');
      return;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: childProfile.name,
          userMessage: text,
          scenario: timeScenario,
          simulatedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          conversationHistory: [{ text, sender: 'child' }],
        }),
      });

      const data = await res.json();
      const reply = data.reply || "I hear you loud and clear! What's next?";
      const nextReplies = data.suggestedReplies || [
        'Tell me a riddle ❓',
        'Tell me a joke 😂',
        'Help with homework 📚',
        'Draw something 🎨',
      ];

      if (data.observationRecord && onObservationRecorded) {
        onObservationRecorded({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: (data.observationRecord.source as any) || 'child_reported',
          title: data.observationRecord.title,
          detail: data.observationRecord.detail,
          category: data.observationRecord.category || 'after_school',
        });
      }

      const aiMsg: ChatMessage = {
        id: `call-ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: nextReplies,
      };

      if (onNewMessage) onNewMessage(aiMsg);
      setCurrentAiSpeech(reply);
      setQuickReplies(nextReplies);

      playChime('reply_received');

      if (!soundMuted) {
        speakCompanion(reply, () => {
          if (autoListenEnabled && isSpeechSupported) {
            setTimeout(() => {
              startListeningVoice();
            }, 400);
          }
        });
      }
    } catch (e) {
      console.error('Call voice API error:', e);
      const fallback = "I hear you! What would you like to do next?";
      setCurrentAiSpeech(fallback);
      if (!soundMuted) {
        speakCompanion(fallback);
      }
    } finally {
      setIsLoadingReply(false);
    }
  };

  // Interactive Game Trigger: Riddle
  const triggerRiddleMode = () => {
    setActiveInteractiveMode('riddle');
    const nextIdx = (currentRiddleIdx + 1) % RIDDLES.length;
    setCurrentRiddleIdx(nextIdx);
    setShowRiddleHint(false);
    setShowRiddleAnswer(false);

    const riddle = RIDDLES[nextIdx];
    const speech = `Here's a fun riddle for you: ${riddle.question}`;
    setCurrentAiSpeech(speech);
    setQuickReplies(['Give me a hint 💡', 'Reveal answer! 🔍', 'Next riddle ➡️', 'Back to chat 💬']);

    playChime('avatar_boop');
    if (!soundMuted) {
      speakCompanion(speech);
    }
  };

  // Interactive Game Trigger: Math Challenge
  const triggerMathMode = () => {
    setActiveInteractiveMode('math');
    const nextIdx = (currentMathIdx + 1) % MATH_CHALLENGES.length;
    setCurrentMathIdx(nextIdx);
    setMathAnswerStatus('idle');

    const mathItem = MATH_CHALLENGES[nextIdx];
    const speech = mathItem.question;
    setCurrentAiSpeech(speech);
    setQuickReplies(mathItem.options.map((opt) => `${opt}`));

    playChime('avatar_boop');
    if (!soundMuted) {
      speakCompanion(speech);
    }
  };

  // Interactive Game Trigger: Kid Joke
  const triggerJoke = () => {
    const joke = KID_JOKES[Math.floor(Math.random() * KID_JOKES.length)];
    const fullJoke = `${joke.setup} ... ${joke.punchline}`;
    setCurrentAiSpeech(fullJoke);
    setQuickReplies(['Haha tell another! 😂', 'Tell a riddle ❓', 'Flip a coin 🪙']);

    playChime('reply_received');
    if (!soundMuted) {
      speakCompanion(joke.setup, () => {
        setTimeout(() => {
          speakCompanion(joke.punchline);
        }, 700);
      });
    }
  };

  // Interactive Game Trigger: Coin Flip
  const triggerCoinFlip = () => {
    setActiveInteractiveMode('decision');
    playChime('coin_flip');
    const res = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
    setCoinResult(res);

    const msg = `Flipped a coin... and it landed on ${res}! 🪙`;
    setCurrentAiSpeech(msg);
    setQuickReplies(['Flip again! 🪙', 'Roll a dice 🎲', 'Tell a riddle ❓']);

    if (!soundMuted) {
      speakCompanion(msg);
    }
  };

  // Interactive Game Trigger: Dice Roll
  const triggerDiceRoll = () => {
    setActiveInteractiveMode('decision');
    playChime('dice_roll');
    const num = Math.floor(Math.random() * 6) + 1;
    setDiceResult(num);

    const msg = `Rolling the dice... You got a ${num}! 🎲`;
    setCurrentAiSpeech(msg);
    setQuickReplies(['Roll again 🎲', 'Flip a coin 🪙', 'Play a game 🧩']);

    if (!soundMuted) {
      speakCompanion(msg);
    }
  };

  // Tap Avatar Reaction
  const handleAvatarTap = () => {
    playChime('avatar_boop');
    const quip = AVATAR_BOOP_QUIPS[Math.floor(Math.random() * AVATAR_BOOP_QUIPS.length)];
    setAvatarReaction(quip);
    setCurrentAiSpeech(quip);

    if (!soundMuted) {
      speakCompanion(quip);
    }

    setTimeout(() => {
      setAvatarReaction(null);
    }, 4000);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-indigo-500/30 flex flex-col justify-between min-h-[620px] max-h-[92vh] overflow-y-auto">
        {/* Ambient background glows */}
        <div
          className={`absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
            isSpeaking
              ? 'bg-blue-500/30 scale-125'
              : isListening
              ? 'bg-red-500/30 scale-125'
              : 'bg-indigo-500/20'
          }`}
        />
        <div
          className={`absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
            isListening
              ? 'bg-amber-500/25 scale-125'
              : isSpeaking
              ? 'bg-cyan-500/25 scale-125'
              : 'bg-purple-500/20'
          }`}
        />

        {/* Top Bar: Call Status, Character Selector & End Call */}
        <div className="flex items-center justify-between z-10 gap-2 pb-2 border-b border-indigo-500/20">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase">
                Interactive Voice Call
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatDuration(callDuration)}
              </span>
            </div>
          </div>

          {/* Interactive Character Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
            {(Object.keys(CHARACTER_PROFILES) as CharacterVoice[]).map((charKey) => {
              const char = CHARACTER_PROFILES[charKey];
              const isSelected = selectedChar === charKey;
              return (
                <button
                  key={charKey}
                  onClick={() => {
                    setSelectedChar(charKey);
                    playChime('avatar_boop');
                    const intro = `Switched to ${char.name} the ${char.title}!`;
                    setCurrentAiSpeech(intro);
                    if (!soundMuted) {
                      speakText(intro, undefined, { character: charKey });
                    }
                  }}
                  title={`Switch to ${char.name} (${char.title})`}
                  className={`px-2 py-1 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? `bg-gradient-to-r ${char.color} text-white font-bold shadow-md scale-105`
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span>{char.avatar}</span>
                  <span className="hidden sm:inline text-[11px]">{char.name}</span>
                </button>
              );
            })}
          </div>

          {/* Sound & End Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const nextMute = !soundMuted;
                setSoundMuted(nextMute);
                if (nextMute) {
                  stopSpeaking();
                  setIsSpeaking(false);
                } else if (currentAiSpeech) {
                  speakCompanion(currentAiSpeech);
                }
              }}
              title={soundMuted ? 'Unmute companion voice' : 'Mute companion voice'}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                soundMuted
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              title="End Voice Call"
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/50 cursor-pointer active:scale-95 transition-all"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End</span>
            </button>
          </div>
        </div>

        {/* Center: Interactive Companion Avatar & Equalizer */}
        <div className="flex flex-col items-center justify-center my-auto py-3 z-10 text-center">
          {/* Avatar with click reaction */}
          <div className="relative mb-3">
            {/* Dynamic Pulsing Rings */}
            {isSpeaking && (
              <>
                <div className="absolute inset-0 -m-3 rounded-full border-2 border-blue-400/50 animate-ping" />
                <div className="absolute inset-0 -m-6 rounded-full border border-indigo-400/30 animate-pulse" />
              </>
            )}

            {isListening && (
              <>
                <div
                  style={{ transform: `scale(${1 + micLevel / 120})` }}
                  className="absolute inset-0 -m-3 rounded-full border-2 border-red-500/60 transition-transform duration-75"
                />
                <div className="absolute inset-0 -m-6 rounded-full border border-amber-400/30 animate-pulse" />
              </>
            )}

            {/* Tap-able Avatar */}
            <button
              onClick={handleAvatarTap}
              title="Tap me to play!"
              className={`w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl transition-all duration-200 cursor-pointer active:scale-90 hover:scale-105 ${
                isSpeaking
                  ? 'bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-blue-500/50 ring-4 ring-blue-400/40'
                  : isListening
                  ? 'bg-gradient-to-tr from-red-500 to-amber-500 shadow-red-500/50 ring-4 ring-red-400/40'
                  : `bg-gradient-to-tr ${currentCharProfile.color} shadow-indigo-600/40`
              }`}
            >
              <span className="select-none animate-bounce">{currentCharProfile.avatar}</span>
            </button>

            {/* Avatar Status Badge */}
            <div className="absolute -bottom-2 inset-x-0 flex justify-center">
              <span
                className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md border ${
                  isSpeaking
                    ? 'bg-blue-500 text-white border-blue-300'
                    : isListening
                    ? 'bg-red-500 text-white border-red-300 animate-pulse'
                    : isLoadingReply
                    ? 'bg-amber-500 text-slate-900 border-amber-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isSpeaking
                  ? `${currentCharProfile.name} speaking...`
                  : isListening
                  ? 'Listening to you...'
                  : isLoadingReply
                  ? 'Thinking...'
                  : 'Tap me to play!'}
              </span>
            </div>
          </div>

          {/* Real-time 16-Bar Audio Equalizer (Reacts to live voice or speech synthesis) */}
          <div className="flex items-end justify-center gap-1.5 h-10 my-2 px-4 w-full max-w-xs">
            {freqBars.map((h, i) => (
              <div
                key={i}
                style={{
                  height: `${Math.max(15, h)}%`,
                  transition: 'height 0.08s ease-out',
                }}
                className={`w-1.5 rounded-full ${
                  isSpeaking
                    ? 'bg-gradient-to-t from-blue-500 to-cyan-300'
                    : isListening
                    ? 'bg-gradient-to-t from-red-500 via-amber-400 to-yellow-300'
                    : 'bg-slate-700/60'
                }`}
              />
            ))}
          </div>

          {/* Interactive Mode Header: Quick Games & Tools */}
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <button
              onClick={triggerRiddleMode}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                activeInteractiveMode === 'riddle'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-800/80 text-amber-300 hover:bg-slate-700'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Riddle</span>
            </button>

            <button
              onClick={triggerMathMode}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                activeInteractiveMode === 'math'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-800/80 text-emerald-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Math</span>
            </button>

            <button
              onClick={triggerJoke}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 bg-slate-800/80 text-purple-300 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Laugh className="w-3.5 h-3.5" />
              <span>Joke</span>
            </button>

            <button
              onClick={triggerCoinFlip}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 bg-slate-800/80 text-cyan-300 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Coin</span>
            </button>

            <button
              onClick={triggerDiceRoll}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 bg-slate-800/80 text-pink-300 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Dice</span>
            </button>
          </div>

          {/* Subtitle / Spoken Text Card with Interactive Insets */}
          <div className="max-w-md w-full bg-slate-900/90 border border-indigo-500/25 rounded-2xl p-4 shadow-xl text-left min-h-[95px] flex flex-col justify-between">
            {isListening && liveTranscript ? (
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  You are saying:
                </span>
                <p className="text-sm font-medium text-white italic">"{liveTranscript}..."</p>
              </div>
            ) : (
              <div>
                <p className="text-sm sm:text-[15px] font-medium text-slate-100 leading-relaxed">
                  {currentAiSpeech}
                </p>

                {/* Interactive Riddle Inset */}
                {activeInteractiveMode === 'riddle' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1.5">
                    {showRiddleHint && (
                      <p className="text-xs text-amber-300 italic bg-amber-950/40 p-2 rounded-lg border border-amber-500/20">
                        💡 Hint: {RIDDLES[currentRiddleIdx].hint}
                      </p>
                    )}
                    {showRiddleAnswer && (
                      <div className="text-xs text-emerald-300 font-semibold bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
                        🎉 Answer: {RIDDLES[currentRiddleIdx].answer}
                        <span className="block text-[11px] font-normal text-slate-300 mt-0.5">
                          {RIDDLES[currentRiddleIdx].funFact}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      {!showRiddleHint && (
                        <button
                          onClick={() => {
                            playChime('pop');
                            setShowRiddleHint(true);
                            if (!soundMuted) speakCompanion(`Here's a hint: ${RIDDLES[currentRiddleIdx].hint}`);
                          }}
                          className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                        >
                          Show Hint 💡
                        </button>
                      )}
                      {!showRiddleAnswer && (
                        <button
                          onClick={() => {
                            playChime('celebrate');
                            setShowRiddleAnswer(true);
                            if (!soundMuted)
                              speakCompanion(`The answer is: ${RIDDLES[currentRiddleIdx].answer}`);
                          }}
                          className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                        >
                          Reveal Answer 🎉
                        </button>
                      )}
                      <button
                        onClick={triggerRiddleMode}
                        className="text-[11px] text-blue-400 hover:underline cursor-pointer ml-auto"
                      >
                        New Riddle ➡️
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Math Challenge Inset */}
                {activeInteractiveMode === 'math' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800">
                    <div className="flex flex-wrap gap-2 pt-1">
                      {MATH_CHALLENGES[currentMathIdx].options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            const isCorrect = opt === MATH_CHALLENGES[currentMathIdx].answer;
                            if (isCorrect) {
                              playChime('celebrate');
                              setMathAnswerStatus('correct');
                              const win = `Spot on! ${opt} is correct! 🎉`;
                              setCurrentAiSpeech(win);
                              if (!soundMuted) speakCompanion(win);
                            } else {
                              playChime('listen_stop');
                              setMathAnswerStatus('wrong');
                              const retry = `Almost! Give it another shot, or try ${MATH_CHALLENGES[currentMathIdx].hint}`;
                              setCurrentAiSpeech(retry);
                              if (!soundMuted) speakCompanion(retry);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 text-white font-bold text-xs border border-indigo-400/30 cursor-pointer active:scale-95 transition-all"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {mathAnswerStatus === 'correct' && (
                      <p className="text-xs text-emerald-300 font-bold mt-2">
                        🌟 Fantastic! You nailed it!
                      </p>
                    )}
                  </div>
                )}

                {/* Re-hear speech aloud button */}
                {currentAiSpeech && (
                  <button
                    onClick={() => speakCompanion(currentAiSpeech)}
                    title="Repeat aloud"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 mt-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Repeat out loud</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {micNotice && (
            <p className="text-xs text-amber-300 bg-amber-950/60 border border-amber-500/30 rounded-xl px-3 py-1.5 mt-2 max-w-xs">
              {micNotice}
            </p>
          )}
        </div>

        {/* Bottom Section: Verbal Interaction Controls, Quick Spoken Phrases & Direct Launchers */}
        <div className="z-10 space-y-2.5 pt-2">
          {/* Hands-free Auto-Listen & Direct Activity Shortcuts */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Hands-free Voice Loop</span>
            </span>
            <button
              onClick={() => setAutoListenEnabled(!autoListenEnabled)}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                autoListenEnabled
                  ? 'bg-indigo-600/60 text-indigo-200 border-indigo-400/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {autoListenEnabled ? 'ON (Auto-listens)' : 'OFF (Tap to talk)'}
            </button>
          </div>

          {/* Quick Voice Suggestion Pills (Empowering choices child can speak or tap) */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 max-h-20 overflow-y-auto">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => {
                  stopSpeaking();
                  handleSendVoiceMessage(reply);
                }}
                disabled={isLoadingReply}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-indigo-600/50 border border-indigo-400/20 text-indigo-200 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Direct Interactive Activity Launchers inside the Call */}
          {onActivitySelect && (
            <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
                Open with AI:
              </span>
              <button
                onClick={() => {
                  onClose();
                  onActivitySelect('drawing');
                }}
                className="px-2.5 py-1 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-medium flex items-center gap-1 border border-purple-500/30 cursor-pointer active:scale-95 transition-all"
              >
                <Palette className="w-3 h-3" />
                <span>Drawing</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onActivitySelect('study');
                }}
                className="px-2.5 py-1 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-medium flex items-center gap-1 border border-blue-500/30 cursor-pointer active:scale-95 transition-all"
              >
                <BookOpen className="w-3 h-3" />
                <span>Study</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onActivitySelect('move');
                }}
                className="px-2.5 py-1 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-medium flex items-center gap-1 border border-emerald-500/30 cursor-pointer active:scale-95 transition-all"
              >
                <Activity className="w-3 h-3" />
                <span>Move Break</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onActivitySelect('youtube');
                }}
                className="px-2.5 py-1 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-medium flex items-center gap-1 border border-red-500/30 cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-3 h-3" />
                <span>Video</span>
              </button>
            </div>
          )}

          {/* Main Push/Tap to Speak Button */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  stopListeningVoice();
                } else {
                  startListeningVoice();
                }
              }}
              disabled={isLoadingReply}
              className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-98 transition-all ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-950/60'
                  : isSpeaking
                  ? 'bg-blue-600/80 hover:bg-blue-600 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-indigo-950/50'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span>Listening... Tap to Stop & Send</span>
                </>
              ) : isSpeaking ? (
                <>
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span>Speaking... Tap to Interrupt & Talk</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>Tap to Speak Out Loud</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

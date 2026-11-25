import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  Square,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  Activity,
  Send,
} from 'lucide-react';
import {
  ChildProfile,
  ChatMessage,
  TimeScenario,
  DailyObservation,
  TaskItem,
  OtherScheduleItem,
} from '../../types';
import {
  LiveVoiceSession,
  StructuredToolCall,
} from '../../voice/LiveVoiceSession';
import { VoiceState } from '../../voice/VoiceStateMachine';
import { VisualizerFrame } from '../../voice/AudioVisualizer';
import {
  CompanionProfile,
  CompanionId,
} from '../../companions/CompanionProfile';
import {
  COMPANION_PROFILES,
  DEFAULT_COMPANION_ID,
  getCompanionProfile,
} from '../../companions/companionProfiles';
import { ReminderScheduler } from '../../wellness/ReminderScheduler';
import { ObservationStore } from '../../observations/ObservationStore';
import { VoiceSelectorModal } from '../voice/VoiceSelectorModal';
import { getActiveVoiceName, GeminiVoiceName } from '../../voice/voiceRegistry';
import { VoiceTimerManager, parseTimerCommand } from '../../wellness/VoiceTimerManager';

interface EchoRealtimeVoiceProps {
  childProfile: ChildProfile;
  timeScenario: TimeScenario;
  soundEnabled: boolean;
  tasks?: TaskItem[];
  otherSchedules?: OtherScheduleItem[];
  onActivitySelect?: (activityId: 'study' | 'drawing' | 'youtube' | 'move' | 'chat' | 'explore') => void;
  onLogInteraction?: (title: string, details?: string) => void;
  onObservationRecorded?: (obs: Omit<DailyObservation, 'id'>) => void;
}

export const EchoRealtimeVoice: React.FC<EchoRealtimeVoiceProps> = ({
  childProfile,
  timeScenario,
  soundEnabled,
  tasks = [],
  otherSchedules = [],
  onActivitySelect,
  onLogInteraction,
  onObservationRecorded,
}) => {
  // Companion profile state
  const [selectedCompanionId, setSelectedCompanionId] = useState<CompanionId>(DEFAULT_COMPANION_ID);
  const companion: CompanionProfile = getCompanionProfile(selectedCompanionId);

  // Live session and voice state
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMuted, setIsMuted] = useState(!soundEnabled);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Audio Visualizer data
  const [visualizerFrame, setVisualizerFrame] = useState<VisualizerFrame>({
    overallLevel: 0,
    frequencyBands: new Array(12).fill(12),
    waveform: [],
    isSpeaking: false,
  });

  // Dynamic contextual quick reply choices matching what was replied
  const getScenarioOptions = () => {
    if (timeScenario === 'morning') return ['Yes 👍', 'Around 6:45 😴', 'Ready for breakfast 🥣'];
    if (timeScenario === 'pre_study' || timeScenario === 'study_time')
      return ['Got home at 3:00 🕒', 'Watched TV 📺', 'Ready for Maths ✏️'];
    return ['Good 👍', 'We played football ⚽', 'Tiring 😴', 'Boring 🥱'];
  };

  // Conversation transcript & typed input fallback
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [currentAiReply, setCurrentAiReply] = useState<string>('');
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>(getScenarioOptions);
  const [textInput, setTextInput] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showCompanionPicker, setShowCompanionPicker] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<GeminiVoiceName>(getActiveVoiceName);
  const [lastExecutedTool, setLastExecutedTool] = useState<string | null>(null);

  const sessionRef = useRef<LiveVoiceSession | null>(null);
  const timerRef = useRef<any>(null);
  const currentAiAccumulatorRef = useRef<string>('');
  const currentUserAccumulatorRef = useRef<string>('');

  // Initialize or reconfigure LiveVoiceSession
  useEffect(() => {
    const session = new LiveVoiceSession({
      companionId: selectedCompanionId,
      childName: childProfile.name,
      timeScenario,
      onStateChange: (state) => {
        setVoiceState(state);
      },
      onVisualizerFrame: (frame) => {
        setVisualizerFrame(frame);
      },
      onSuggestedReplies: (replies) => {
        if (replies && Array.isArray(replies) && replies.length > 0) {
          setSuggestedReplies(replies);
        }
      },
      onAction: (action) => {
        if (action === 'open_study') onActivitySelect?.('study');
        else if (action === 'open_drawing') onActivitySelect?.('drawing');
        else if (action === 'open_youtube') onActivitySelect?.('youtube');
        else if (action === 'open_move' || action === 'demonstrate_exercise') onActivitySelect?.('move');
        else if (action === 'open_explore') onActivitySelect?.('explore');
        else if (action === 'end_session') handleStopSession();
      },
      onObservation: (obs) => {
        if (onObservationRecorded && obs) {
          onObservationRecorded({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            title: obs.title,
            detail: obs.detail,
            source: obs.source || 'child_reported',
            category: obs.category || 'after_school',
          });
        }
      },
      onTranscript: (text, isUser, isFinal) => {
        if (!isUser) {
          if (text) {
            currentAiAccumulatorRef.current += text;
            setCurrentAiReply(currentAiAccumulatorRef.current);
          }
        } else {
          if (text) {
            currentUserAccumulatorRef.current += text;
          }
        }

        if (isFinal) {
          if (isUser) {
            const userMsg = (currentUserAccumulatorRef.current || text).trim();
            if (userMsg) {
              setTranscript((prev) => [
                ...prev,
                {
                  id: 'msg-u-' + Date.now(),
                  sender: 'child',
                  text: userMsg,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            }
            currentUserAccumulatorRef.current = '';
          } else {
            const aiMsg = (currentAiAccumulatorRef.current || text).trim();
            if (aiMsg) {
              setTranscript((prev) => [
                ...prev,
                {
                  id: 'msg-a-' + Date.now(),
                  sender: 'echo',
                  text: aiMsg,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            }
            currentAiAccumulatorRef.current = '';
          }
        }
      },
      onToolCall: (tool: StructuredToolCall) => {
        handleToolExecution(tool);
      },
    });

    sessionRef.current = session;

    // Set initial greeting in speech bubble and transcript
    const getScenarioGreeting = () => {
      if (timeScenario === 'morning') return companion.greetingStarters.morning;
      if (timeScenario === 'pre_study' || timeScenario === 'study_time')
        return companion.greetingStarters.lateLogin || companion.greetingStarters.studyTime;
      return companion.greetingStarters.afterSchool;
    };
    const initialGreeting = getScenarioGreeting();
    setCurrentAiReply(initialGreeting);
    setSuggestedReplies(getScenarioOptions());
    setTranscript((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: 'msg-greeting-init',
            sender: 'echo',
            text: initialGreeting,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return prev;
    });

    return () => {
      session.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedCompanionId, childProfile.name, timeScenario]);

  // Session timer ticker
  useEffect(() => {
    if (isSessionActive) {
      timerRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSessionDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive]);

  // Handle structured tool call from Gemini Live
  const handleToolExecution = (tool: StructuredToolCall) => {
    setLastExecutedTool(tool.name);
    setTimeout(() => setLastExecutedTool(null), 4000);

    if (onLogInteraction) {
      onLogInteraction(`Gemini Live Tool: ${tool.name}`, JSON.stringify(tool.args));
    }

    switch (tool.name) {
      case 'openStudySession':
        if (onActivitySelect) onActivitySelect('study');
        break;
      case 'openDrawingStudio':
        if (onActivitySelect) onActivitySelect('drawing');
        break;
      case 'openMovementBreak':
        if (onActivitySelect) onActivitySelect('move');
        break;
      case 'openEducationalVideos':
        if (onActivitySelect) onActivitySelect('youtube');
        break;
      case 'openCuriosityExplorer':
        if (onActivitySelect) onActivitySelect('explore');
        break;
      case 'recordObservation':
        if (onObservationRecorded) {
          onObservationRecorded({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: 'ai_conversation',
            title: tool.args.title || 'Conversation check-in',
            detail: tool.args.detail || 'Factual statement shared during conversation',
            category: tool.args.category || 'routine',
          });
        }
        break;
      case 'endVoiceSession':
        handleStopSession();
        break;
    }
  };

  // Start live voice session
  const handleStartSession = async () => {
    if (!sessionRef.current) return;
    const ok = await sessionRef.current.start();
    if (ok) {
      setIsSessionActive(true);
      ReminderScheduler.setActivity('voice');
      if (onLogInteraction) {
        onLogInteraction('Live Voice Session Started', `Companion: ${companion.name} (${companion.geminiVoice})`);
      }
    }
  };

  // Stop live voice session
  const handleStopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.stop();
    }
    setIsSessionActive(false);
    ReminderScheduler.setActivity('idle');
    setVoiceState('idle');
  };

  // Barge-in interruption
  const handleInterrupt = () => {
    if (sessionRef.current) {
      sessionRef.current.interrupt();
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (sessionRef.current) {
      const nextMuted = !isMuted;
      sessionRef.current.setMute(nextMuted);
      setIsMuted(nextMuted);
    }
  };

  // Select companion character
  const handleSelectCompanion = (id: CompanionId) => {
    setSelectedCompanionId(id);
    setShowCompanionPicker(false);
    if (sessionRef.current) {
      sessionRef.current.setCompanion(id);
    }
    const newCompanion = getCompanionProfile(id);
    setCurrentAiReply(newCompanion.greetingStarters.afterSchool);
    setSuggestedReplies(getScenarioOptions());
  };

  // Switch voice dynamically
  const handleVoiceChanged = (newVoice: GeminiVoiceName) => {
    setCurrentVoice(newVoice);
    if (sessionRef.current) {
      sessionRef.current.setVoice(newVoice as any);
    }
    if (onLogInteraction) {
      onLogInteraction('Voice Changed', `Switched companion voice to ${newVoice}`);
    }
  };

  // Send typed prompt / quick chip
  const handleSendPrompt = (text: string) => {
    if (!text.trim() || !sessionRef.current) return;
    const parsedTimer = parseTimerCommand(text);
    if (parsedTimer) {
      VoiceTimerManager.setTimer(parsedTimer.durationSeconds, parsedTimer.label);
    }
    const lower = text.toLowerCase();
    if (
      lower.includes('exercise') ||
      lower.includes('jumping jack') ||
      lower.includes('demonstrat')
    ) {
      setTimeout(() => onActivitySelect?.('move'), 400);
    }
    sessionRef.current.sendTextMessage(text);
    setTextInput('');
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper for voice state badge
  const getStateBadge = () => {
    switch (voiceState) {
      case 'listening':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Listening to Aarav...
          </span>
        );
      case 'speaking':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs">
            <Volume2 className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
            {companion.name} is speaking
          </span>
        );
      case 'thinking':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" />
            Thinking...
          </span>
        );
      case 'interrupted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
            Listening closely...
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
            Connecting Live stream...
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Ready to chat
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
      {/* Top Companion Header & Character Selector Bar */}
      <div className="bg-slate-50/80 border-b border-slate-100 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-white/60 bg-gradient-to-br ${companion.colorTheme.gradient}`}
          >
            {companion.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {companion.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-all hover:scale-105 ${companion.colorTheme.badgeBg} ${companion.colorTheme.badgeBorder} ${companion.colorTheme.textColor}`}
                title="Click to customize companion voice"
              >
                <Volume2 className="w-2.5 h-2.5" />
                <span>Voice: {currentVoice}</span>
                <span className="text-[9px] underline opacity-75">Change</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              {companion.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls: Change Voice & Change Companion */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open Voice Studio to test or change voice"
          >
            <Volume2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Change Voice ({currentVoice})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCompanionPicker(!showCompanionPicker)}
            className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Companion</span>
            {showCompanionPicker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Companion Character Picker Menu */}
      {showCompanionPicker && (
        <div className="bg-slate-100/80 p-3 border-b border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-fadeIn">
          {(Object.keys(COMPANION_PROFILES) as CompanionId[]).map((id) => {
            const p = COMPANION_PROFILES[id];
            const isSelected = p.id === companion.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectCompanion(p.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{p.avatar}</span>
                  <div>
                    <span className="text-xs font-black text-slate-900 block leading-tight">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {p.geminiVoice}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                  {p.behavioralStyle.encouragementTone}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Interactive Stage */}
      <div className="p-6 text-center relative overflow-hidden">
        {/* Ambient Glow Background Effect */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-700"
          style={{
            background: isSessionActive ? companion.colorTheme.orbGlow : 'rgba(226, 232, 240, 0.5)',
          }}
        />

        {/* Status Badge & Session Duration */}
        <div className="flex items-center justify-center gap-3 mb-6 relative z-10">
          {getStateBadge()}
          {isSessionActive && (
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              {formatDuration(sessionDuration)}
            </span>
          )}
        </div>

        {/* Central Dynamic Equalizer / Orb Visualizer */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[120px] mb-4">
          <div className="flex items-end justify-center gap-1.5 h-16 mb-4">
            {visualizerFrame.frequencyBands.map((band, idx) => (
              <div
                key={idx}
                className={`w-2.5 rounded-full transition-all duration-75 ${
                  isSessionActive
                    ? voiceState === 'speaking'
                      ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-2xs'
                      : voiceState === 'listening'
                      ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-2xs'
                      : 'bg-indigo-400'
                    : 'bg-slate-200'
                }`}
                style={{
                  height: `${Math.max(8, isSessionActive ? band : 8)}px`,
                }}
              />
            ))}
          </div>

          {/* Current Spoken Speech Text / Reply */}
          <div className="max-w-lg mx-auto min-h-[48px] flex items-center justify-center px-4">
            <p className="text-base sm:text-lg font-medium text-slate-800 tracking-tight leading-relaxed">
              "{currentAiReply || companion.greetingStarters.afterSchool}"
            </p>
          </div>
        </div>

        {/* Executed Tool Notification Toast */}
        {lastExecutedTool && (
          <div className="relative z-10 mb-4 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold py-1.5 px-3.5 rounded-full animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>Structured Tool Executed: {lastExecutedTool}</span>
          </div>
        )}

        {/* Primary Live Voice Controls */}
        <div className="relative z-10 flex items-center justify-center gap-3 mt-4">
          {!isSessionActive ? (
            <button
              type="button"
              onClick={handleStartSession}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer active:scale-95"
            >
              <Mic className="w-5 h-5 animate-pulse" />
              <span>Start Live Audio Session</span>
            </button>
          ) : (
            <>
              {/* Barge-in Interruption Button */}
              {voiceState === 'speaking' && (
                <button
                  type="button"
                  onClick={handleInterrupt}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Interrupt model to speak now"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>I want to talk</span>
                </button>
              )}

              {/* Mute Mic Button */}
              <button
                type="button"
                onClick={handleToggleMute}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Conclude Session Button */}
              <button
                type="button"
                onClick={handleStopSession}
                className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Square className="w-4 h-4 fill-current text-rose-400" />
                <span>End Voice</span>
              </button>
            </>
          )}
        </div>

        {/* Dynamic Contextual Quick Reply Options (adapts dynamically to what was replied) */}
        <div className="relative z-10 flex flex-col items-center justify-center mt-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Suggested Replies
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {(suggestedReplies.length > 0 ? suggestedReplies : companion.quickSuggestions).map((suggestion, idx) => (
              <button
                key={`${idx}-${suggestion}`}
                type="button"
                onClick={() => handleSendPrompt(suggestion)}
                className="text-xs font-semibold text-slate-700 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 shadow-2xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Drawer: Typed Input Fallback & Live Transcript Accordion */}
      <div className="bg-slate-50/80 border-t border-slate-100 p-4">
        {/* Typed Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt(textInput);
          }}
          className="flex items-center gap-2 mb-3"
        >
          <input
            id="child-guide-input"
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`Ask ${companion.name} anything or type here...`}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          />
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Transcript Drawer Toggle */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Session Transcript ({transcript.length} turns)</span>
            {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <span className="text-[11px] text-slate-400">
            Powered by Gemini Live & Structured Function Calling
          </span>
        </div>

        {/* Scrollable Transcript */}
        {showTranscript && (
          <div className="mt-3 max-h-48 overflow-y-auto space-y-2 pr-1 text-xs animate-fadeIn">
            {transcript.length === 0 ? (
              <p className="text-slate-400 italic py-2">No conversation logged yet in this session.</p>
            ) : (
              transcript.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl ${
                    msg.sender === 'child'
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-100 ml-6'
                      : 'bg-white text-slate-800 border border-slate-200 mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>{msg.sender === 'child' ? childProfile.name : companion.name}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Voice Customization Studio Modal */}
      <VoiceSelectorModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        currentVoice={currentVoice}
        onVoiceChanged={handleVoiceChanged}
        childName={childProfile.name}
      />
    </div>
  );
};

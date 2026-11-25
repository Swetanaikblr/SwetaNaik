import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Clock,
  BookOpen,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Headphones,
  Edit3,
  Coffee,
  StopCircle,
} from 'lucide-react';
import { TaskItem, LearningMaterial, ChildProfile, DailyObservation } from '../../types';
import { speakText, stopSpeaking, createSpeechRecognizer } from '../../utils/speech';

interface StudySessionModalProps {
  task: TaskItem;
  materials: LearningMaterial[];
  childProfile: ChildProfile;
  soundEnabled: boolean;
  onClose: () => void;
  onCompleteTask: (task: TaskItem, startMode: 'independent' | 'one_prompt') => void;
  onPostponeTask: (task: TaskItem, minutes: number) => void;
  onLogHelpRequest: (question: string, subject: string) => void;
  onAddObservation?: (obs: Omit<DailyObservation, 'id'>) => void;
}

type ReadingMode = 'i_read' | 'you_read' | 'together';

export const StudySessionModal: React.FC<StudySessionModalProps> = ({
  task,
  materials,
  childProfile,
  soundEnabled,
  onClose,
  onCompleteTask,
  onPostponeTask,
  onLogHelpRequest,
  onAddObservation,
}) => {
  // Timer state (10-15 minute focused reading session)
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [readingMode, setReadingMode] = useState<ReadingMode>('i_read');
  const [isAiReadingAloud, setIsAiReadingAloud] = useState(false);

  // Active material selection
  const relevantMaterials = materials.filter(
    (m) => task.materialIds?.includes(m.id) || m.subjectId === task.subjectId
  );
  const [selectedMaterial, setSelectedMaterial] = useState<LearningMaterial>(
    relevantMaterials[0] || materials[0]
  );

  // AI Learning Help State
  const [questionInput, setQuestionInput] = useState('');
  const [isHelpLoading, setIsHelpLoading] = useState(false);
  const [helpHistory, setHelpHistory] = useState<
    Array<{ sender: 'child' | 'ai'; text: string; timestamp: string }>
  >([
    {
      sender: 'ai',
      text: `Hey ${childProfile.name}! We have "${selectedMaterial?.chapter || task.title}" open. Whenever you hit a tricky problem, want to read together, or need a hint, I'm right here!`,
      timestamp: 'Just now',
    },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false);

  // Handle timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((s) => s - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setSecondsRemaining(15 * 60);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAskQuestion = async (qText?: string) => {
    const question = (qText || questionInput).trim();
    if (!question) return;

    const childMsg = {
      sender: 'child' as const,
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setHelpHistory((prev) => [...prev, childMsg]);
    setQuestionInput('');
    setIsHelpLoading(true);

    onLogHelpRequest(question, task.category);

    try {
      const res = await fetch('/api/learning-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          subject: task.category,
          chapter: selectedMaterial?.chapter || task.title,
          topic: selectedMaterial?.topic || 'General',
          materialContext: selectedMaterial?.contentText || '',
          childName: childProfile.name,
        }),
      });

      const data = await res.json();
      const aiReply =
        data.answer ||
        "Let's break this down from your chapter! What is the very first step you'd take to set this problem up?";

      const aiMsg = {
        sender: 'ai' as const,
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setHelpHistory((prev) => [...prev, aiMsg]);

      if (soundEnabled) {
        speakText(aiReply);
      }
    } catch (e) {
      console.error('Error fetching learning help:', e);
      const fallbackMsg = {
        sender: 'ai' as const,
        text: "Let's check the hints in your chapter! What is the key concept or equation we should start with?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHelpHistory((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsHelpLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const rec = createSpeechRecognizer(
      (text) => {
        setIsListening(false);
        handleAskQuestion(text);
      },
      () => setIsListening(false),
      (err) => {
        setIsListening(false);
        console.warn(err);
      }
    );
    if (rec) {
      rec.start();
      setIsListening(true);
    }
  };

  // AI Reads Aloud handler
  const handleToggleAiReading = () => {
    if (isAiReadingAloud) {
      stopSpeaking();
      setIsAiReadingAloud(false);
      return;
    }

    if (selectedMaterial?.contentText) {
      setIsAiReadingAloud(true);
      // Read first 2 paragraphs for comfortable chunking
      const paragraphs = selectedMaterial.contentText.split('\n\n').slice(0, 2).join('. ');
      speakText(paragraphs, () => {
        setIsAiReadingAloud(false);
        // Ask gentle comprehension question
        const promptMsg = {
          sender: 'ai' as const,
          text: `I finished reading that section! In your own words, what did that part explain?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setHelpHistory((prev) => [...prev, promptMsg]);
      });
    }
  };

  // "I'm Bored" graceful empathetic handler
  const handleImBored = () => {
    if (onAddObservation) {
      onAddObservation({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'platform_observed',
        title: 'Session paused (child reported bored)',
        detail: `Child spent ${Math.round((15 * 60 - secondsRemaining) / 60)} minutes reading before requesting a break.`,
        category: 'learning',
      });
    }

    const aiMsg = {
      sender: 'ai' as const,
      text: "Fair enough! 😊 Studying the same thing for too long gets tiring. Want to take a 5-minute movement break, do a quick doodle, or switch to something else?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setHelpHistory((prev) => [...prev, aiMsg]);
  };

  // "I Want to Stop" respectful handler
  const handleIWantToStop = () => {
    if (onAddObservation) {
      onAddObservation({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'platform_observed',
        title: `Stopped study session on ${task.title}`,
        detail: `Child chose to stop after ${Math.round((15 * 60 - secondsRemaining) / 60)} minutes.`,
        category: 'learning',
      });
    }
    stopSpeaking();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl h-[92vh] max-h-[850px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Top Navigation Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              📚
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                {task.title}
              </h2>
              <p className="text-[11px] text-slate-500">{task.instructions || 'Interactive study & reading session'}</p>
            </div>
          </div>

          {/* Quick Timer & Reading Mode Pills */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-mono text-sm font-bold text-slate-800">
                {formatTimer(secondsRemaining)}
              </span>
              <button
                onClick={toggleTimer}
                title={isRunning ? 'Pause timer' : 'Start timer'}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-600 cursor-pointer"
              >
                {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
              </button>
              <button
                onClick={resetTimer}
                title="Reset timer"
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Finish Button */}
            <button
              id="btn-finish-study"
              onClick={() => setShowCompleteConfirmation(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done?</span>
            </button>

            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reading Mode Selector Banner */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-indigo-900">Reading Mode:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setReadingMode('i_read')}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                  readingMode === 'i_read'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                📖 I'll read
              </button>
              <button
                onClick={() => {
                  setReadingMode('you_read');
                  handleToggleAiReading();
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                  readingMode === 'you_read'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Headphones className="w-3 h-3" />
                <span>{isAiReadingAloud ? 'Pause Reading' : 'You read (AI)'}</span>
              </button>
              <button
                onClick={() => setReadingMode('together')}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                  readingMode === 'together'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                🤝 Let's read together
              </button>
            </div>
          </div>

          {/* Autonomy Actions: "I'm bored" & "I want to stop" */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleImBored}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 font-semibold cursor-pointer flex items-center gap-1"
            >
              <Coffee className="w-3 h-3 text-amber-500" />
              <span>I'm bored</span>
            </button>
            <button
              onClick={handleIWantToStop}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 font-semibold cursor-pointer flex items-center gap-1"
            >
              <StopCircle className="w-3 h-3 text-rose-500" />
              <span>I want to stop</span>
            </button>
          </div>
        </div>

        {/* Modal Body: Split view on desktop, tabbed/stacked on mobile */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Learning Material Reader */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 overflow-hidden bg-slate-50/50">
            {/* Material Selector Tabs */}
            {relevantMaterials.length > 1 && (
              <div className="flex items-center gap-1.5 p-2 bg-white border-b border-slate-200 overflow-x-auto">
                {relevantMaterials.map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => setSelectedMaterial(mat)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      selectedMaterial?.id === mat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mat.title}
                  </button>
                ))}
              </div>
            )}

            {/* Material Content View */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {selectedMaterial?.type.toUpperCase()} MATERIAL
                  </span>
                  {selectedMaterial?.url && (
                    <a
                      href={selectedMaterial.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                  {selectedMaterial?.title}
                </h3>
                <p className="text-xs text-slate-500 mb-3">{selectedMaterial?.chapter}</p>

                {/* Optional Photo or Diagram Preview */}
                {selectedMaterial?.imageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={selectedMaterial.imageUrl}
                      alt={selectedMaterial.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                {/* Readable textbook content */}
                <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed font-normal whitespace-pre-line bg-slate-50/70 p-4 rounded-xl border border-slate-100 font-sans">
                  {selectedMaterial?.contentText}
                </div>

                {/* "Write this in your notebook" Prompt */}
                <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3 text-xs">
                  <Edit3 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-amber-900">Write this in your notebook:</h5>
                    <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                      "In 1 or 2 sentences, write down what happens during this process in your notebook. When you're ready, explain it back to me!"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Socratic AI Learning Guide */}
          <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white overflow-hidden">
            {/* AI Assistant Header */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Ask for Help</h4>
                  <p className="text-[10px] text-slate-500">Socratic guidance, not answers</p>
                </div>
              </div>

              {/* Sample Prompt Shortcuts */}
              <button
                onClick={() => handleAskQuestion("I don't understand this part.")}
                className="text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
              >
                Hint 💡
              </button>
            </div>

            {/* Chat message thread */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {helpHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    item.sender === 'child' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                      item.sender === 'child'
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{item.text}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{item.timestamp}</span>
                </div>
              ))}
              {isHelpLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-slate-50 rounded-xl">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Looking at your chapter notes...</span>
                </div>
              )}
            </div>

            {/* Chat Input & Mic */}
            <div className="p-2.5 border-t border-slate-200 bg-slate-50 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskQuestion();
                }}
                className="flex items-center gap-1.5"
              >
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder={isListening ? 'Listening...' : 'Ask a question or for a hint...'}
                    className="w-full text-xs pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200 outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    title="Speak your question"
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-blue-600 ${
                      isListening ? 'text-red-500 animate-pulse' : ''
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!questionInput.trim() || isHelpLoading}
                  className="p-2 rounded-xl bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Completion Confirmation Dialog */}
        {showCompleteConfirmation && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Done with {task.title}?</h3>
              <p className="text-xs text-slate-500 mb-4">
                Great job focusing! How did it go?
              </p>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  id="btn-confirm-done"
                  onClick={() => {
                    onCompleteTask(task, 'independent');
                    setShowCompleteConfirmation(false);
                    onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  ✓ Done!
                </button>

                <button
                  onClick={() => {
                    onPostponeTask(task, 15);
                    setShowCompleteConfirmation(false);
                    onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  ⏰ Need 15 min
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowCompleteConfirmation(false);
                    handleAskQuestion('I still need help completing this task.');
                  }}
                  className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Need help</span>
                </button>

                <button
                  onClick={() => {
                    setShowCompleteConfirmation(false);
                    onClose();
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-semibold transition-all cursor-pointer"
                >
                  ↩️ Come back later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function formatTime12Hour(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

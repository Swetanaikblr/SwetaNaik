import React, { useState } from 'react';
import {
  User,
  School,
  Clock,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  Plus,
  Trash2,
  HelpCircle,
  Sun,
  Moon,
  Sparkles,
  Info,
  Calendar,
  Activity,
  MapPin,
  Volume2,
  Play,
  Loader2,
  Music,
} from 'lucide-react';
import {
  AVAILABLE_VOICES,
  getActiveVoiceName,
  setActiveVoiceName,
  GeminiVoiceName,
} from '../../voice/voiceRegistry';
import {
  ChildProfile,
  Subject,
  EverydayRoutineItem,
  OtherScheduleItem,
  OtherScheduleCategory,
} from '../../types';

interface ChildProfileTabProps {
  childProfile: ChildProfile;
  subjects: Subject[];
  onUpdateProfile: (updated: Partial<ChildProfile>) => void;
}

export const ChildProfileTab: React.FC<ChildProfileTabProps> = ({
  childProfile,
  subjects,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(childProfile.name);
  const [age, setAge] = useState(childProfile.age);
  const [grade, setGrade] = useState(childProfile.grade);
  const [schoolName, setSchoolName] = useState(childProfile.schoolName || (childProfile as any).school || '');
  const [schoolStartTime, setSchoolStartTime] = useState(childProfile.schoolStartTime);
  const [schoolEndTime, setSchoolEndTime] = useState(childProfile.schoolEndTime);
  const [wakeUpType, setWakeUpType] = useState<'exact' | 'approximate'>(
    childProfile.wakeUpType || 'approximate'
  );
  const [wakeUpTime, setWakeUpTime] = useState(childProfile.wakeUpTime || '06:30');
  const [wakeUpRange, setWakeUpRange] = useState(
    childProfile.wakeUpRange || 'Usually between 6:15 AM and 6:30 AM'
  );
  const [bedtime, setBedtime] = useState(childProfile.bedtime);
  const [normalDayDescription, setNormalDayDescription] = useState(
    childProfile.normalDayDescription ||
      'Aarav usually wakes up around 6:30. He gets ready for school himself but sometimes needs reminders to pack his bag. He likes football and drawing. He usually gets home around 3 PM. He tends to watch TV when he comes home and sometimes loses track of time. He prefers studying Maths before Science.'
  );

  const [routines, setRoutines] = useState<EverydayRoutineItem[]>(
    childProfile.everydayRoutines || []
  );

  // Add routine modal state
  const [showAddRoutineModal, setShowAddRoutineModal] = useState(false);
  const [newRoutineTask, setNewRoutineTask] = useState('');
  const [newRoutineCompleteBy, setNewRoutineCompleteBy] = useState('8:00 AM');
  const [newRoutineObservable, setNewRoutineObservable] = useState(false);
  const [newRoutineNotes, setNewRoutineNotes] = useState('');

  // Other schedules state (Sports, Tuitions, Arts, Swimming, etc.)
  const [otherSchedules, setOtherSchedules] = useState<OtherScheduleItem[]>(
    childProfile.otherSchedules || []
  );
  const [showAddOtherScheduleModal, setShowAddOtherScheduleModal] = useState(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleDays, setNewScheduleDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [newScheduleStartTime, setNewScheduleStartTime] = useState('16:00');
  const [newScheduleEndTime, setNewScheduleEndTime] = useState('17:15');
  const [newScheduleCategory, setNewScheduleCategory] = useState<OtherScheduleCategory>('Sports');
  const [newScheduleLocation, setNewScheduleLocation] = useState('');
  const [newScheduleNotes, setNewScheduleNotes] = useState('');

  // Companion voice preference state
  const [selectedVoice, setSelectedVoice] = useState<GeminiVoiceName>(getActiveVoiceName);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceLoadingId, setVoiceLoadingId] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Quick test voice audio using /api/tts
  const handleTestVoice = async (voiceId: GeminiVoiceName, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (playingVoiceId === voiceId) {
      setPlayingVoiceId(null);
      return;
    }

    setVoiceLoadingId(voiceId);

    try {
      const sampleText = `Hello! This is the ${voiceId} voice for Echo. Let's make learning exciting and steady!`;
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sampleText, voice: voiceId }),
      });

      if (!res.ok) throw new Error('Failed to fetch voice');
      const data = await res.json();

      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        setVoiceLoadingId(null);
        setPlayingVoiceId(voiceId);
        audio.onended = () => setPlayingVoiceId(null);
        audio.onerror = () => setPlayingVoiceId(null);
        await audio.play();
      } else {
        setVoiceLoadingId(null);
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(sampleText);
          utterance.pitch = voiceId === 'Fenrir' ? 1.2 : voiceId === 'Charon' ? 0.85 : 1.05;
          setPlayingVoiceId(voiceId);
          utterance.onend = () => setPlayingVoiceId(null);
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch {
      setVoiceLoadingId(null);
      setPlayingVoiceId(null);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveVoiceName(selectedVoice);
    onUpdateProfile({
      name,
      age,
      grade,
      schoolName,
      schoolStartTime,
      schoolEndTime,
      wakeUpType,
      wakeUpTime,
      wakeUpRange,
      bedtime,
      normalDayDescription,
      everydayRoutines: routines,
      otherSchedules,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleToggleRoutine = (id: string) => {
    const updated = routines.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setRoutines(updated);
    onUpdateProfile({ everydayRoutines: updated });
  };

  const handleDeleteRoutine = (id: string) => {
    const updated = routines.filter((r) => r.id !== id);
    setRoutines(updated);
    onUpdateProfile({ everydayRoutines: updated });
  };

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineTask.trim()) return;

    const newItem: EverydayRoutineItem = {
      id: `rt-${Date.now()}`,
      task: newRoutineTask.trim(),
      completeBy: newRoutineCompleteBy.trim() || '8:00 AM',
      frequency: 'Every day',
      isObservable: newRoutineObservable,
      enabled: true,
      notes: newRoutineNotes.trim() || undefined,
    };

    const updated = [...routines, newItem];
    setRoutines(updated);
    onUpdateProfile({ everydayRoutines: updated });

    setNewRoutineTask('');
    setNewRoutineNotes('');
    setShowAddRoutineModal(false);
  };

  // Other schedules handlers
  const handleToggleOtherSchedule = (id: string) => {
    const updated = otherSchedules.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setOtherSchedules(updated);
    onUpdateProfile({ otherSchedules: updated });
  };

  const handleDeleteOtherSchedule = (id: string) => {
    const updated = otherSchedules.filter((s) => s.id !== id);
    setOtherSchedules(updated);
    onUpdateProfile({ otherSchedules: updated });
  };

  const handleAddOtherSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleTitle.trim()) return;

    const newItem: OtherScheduleItem = {
      id: `sched-${Date.now()}`,
      title: newScheduleTitle.trim(),
      days: newScheduleDays.length > 0 ? newScheduleDays : ['Mon'],
      startTime: newScheduleStartTime,
      endTime: newScheduleEndTime,
      category: newScheduleCategory,
      locationOrDetail: newScheduleLocation.trim() || undefined,
      notes: newScheduleNotes.trim() || undefined,
      enabled: true,
    };

    const updated = [...otherSchedules, newItem];
    setOtherSchedules(updated);
    onUpdateProfile({ otherSchedules: updated });

    setNewScheduleTitle('');
    setNewScheduleLocation('');
    setNewScheduleNotes('');
    setShowAddOtherScheduleModal(false);
  };

  const toggleDayInNewSchedule = (day: string) => {
    if (newScheduleDays.includes(day)) {
      if (newScheduleDays.length > 1) {
        setNewScheduleDays(newScheduleDays.filter((d) => d !== day));
      }
    } else {
      setNewScheduleDays([...newScheduleDays, day]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
            Setup & Daily Rhythm
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          My Child's Routine & Rhythm
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          Define your child's natural daily schedule and habits. The AI guide uses this rhythm to understand when they wake up, when school finishes, and how to gently support them without nagging.
        </p>

        <form onSubmit={handleSave} className="mt-5 space-y-5 text-xs">
          {/* Basic Child Information */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Child's Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-slate-50/50"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-slate-50/50"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Grade</label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-slate-50/50"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">School Name</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-slate-50/50"
              />
            </div>
          </div>

          {/* Wake-Up Rhythm & School Schedule */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Daily Timing & Wake-up Rhythm
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Wake-up Time Format</label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setWakeUpType('approximate')}
                    className={`flex-1 py-2 px-2.5 rounded-xl font-semibold text-center cursor-pointer transition-all ${
                      wakeUpType === 'approximate'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Approximate
                  </button>
                  <button
                    type="button"
                    onClick={() => setWakeUpType('exact')}
                    className={`flex-1 py-2 px-2.5 rounded-xl font-semibold text-center cursor-pointer transition-all ${
                      wakeUpType === 'exact'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Exact Time
                  </button>
                </div>
              </div>

              {wakeUpType === 'approximate' ? (
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Typical Wake-up Window
                  </label>
                  <input
                    type="text"
                    value={wakeUpRange}
                    onChange={(e) => setWakeUpRange(e.target.value)}
                    placeholder="e.g. Usually between 6:15 AM and 6:30 AM"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Allows natural leeway so the child does not feel pressured by strict minutes
                  </span>
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Exact Wake-up Time</label>
                  <input
                    type="time"
                    value={wakeUpTime}
                    onChange={(e) => setWakeUpTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">School Starts</label>
                <input
                  type="time"
                  value={schoolStartTime}
                  onChange={(e) => setSchoolStartTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  School Finishes (Arrival Home)
                </label>
                <input
                  type="time"
                  value={schoolEndTime}
                  onChange={(e) => setSchoolEndTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Bedtime</label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white"
                />
              </div>
            </div>
          </div>

          {/* Companion Voice & Tone Setting */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Companion Voice & Tone Setting
                </h3>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
                Active: {selectedVoice}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Choose the default speech voice used by Echo and all companion activities. You can preview sample audio for each voice before saving.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {AVAILABLE_VOICES.map((v) => {
                const isSelected = selectedVoice === v.id;
                const isPlaying = playingVoiceId === v.id;
                const isLoading = voiceLoadingId === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-white border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{v.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">{v.name}</span>
                          {v.isDefault && (
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-blue-100 text-blue-800">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{v.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleTestVoice(v.id, e)}
                        disabled={isLoading}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-purple-600 text-white border-purple-600 animate-pulse'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                        title={`Test ${v.name} sample`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        ) : isPlaying ? (
                          <Music className="w-3 h-3 animate-bounce" />
                        ) : (
                          <Play className="w-2.5 h-2.5 fill-current text-blue-600" />
                        )}
                        <span>{isPlaying ? 'Playing' : 'Listen'}</span>
                      </button>

                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Free-text description for AI Guide */}
          <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <label className="font-bold text-slate-900 text-xs">
                Tell us about your child's normal day (for AI Guide context)
              </label>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Describe their personality, tendencies, after-school habits, and what they like or avoid. The conversational AI uses this to ask the right questions without sounding like an interrogation.
            </p>
            <textarea
              rows={4}
              value={normalDayDescription}
              onChange={(e) => setNormalDayDescription(e.target.value)}
              placeholder="e.g. Aarav usually wakes up around 6:30. He gets ready for school himself but sometimes needs reminders to pack his bag. He likes football and drawing. He usually gets home around 3 PM. He tends to watch TV when he comes home and sometimes loses track of time. He prefers studying Maths before Science."
              className="w-full p-3 rounded-xl border border-amber-200 bg-white text-xs leading-relaxed focus:border-amber-500 outline-hidden"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved successfully
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs transition-all active:scale-95"
            >
              Save Routine & Rhythm
            </button>
          </div>
        </form>
      </div>

      {/* 2. Everyday Routine (Recurring Daily Habits) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Recurring Everyday Habits
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Everyday Routine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Habits that happen naturally every day. Observable items can be checked directly by the platform; non-observable items rely on child self-report.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddRoutineModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Routine Habit</span>
          </button>
        </div>

        {/* Observable vs Non-Observable Legend */}
        <div className="flex flex-wrap items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">Platform Observed</span>
            <span className="text-slate-400 text-[11px]">(Tracked via app interactions/reading/timetable)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="font-semibold text-slate-700">Child Reported</span>
            <span className="text-slate-400 text-[11px]">(Mentioned naturally in conversation)</span>
          </div>
        </div>

        {/* Routines Table / List */}
        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="flex items-center justify-between p-3.5 sm:px-4 bg-white hover:bg-slate-50/50 transition-colors gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={routine.enabled !== false}
                  onChange={() => handleToggleRoutine(routine.id)}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  title="Enable or pause this routine"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {routine.task}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        routine.isObservable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {routine.isObservable ? 'Observable' : 'Non-observable (Reported)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                    <span>Complete by: {routine.completeBy}</span>
                    <span>•</span>
                    <span>{routine.frequency}</span>
                    {routine.notes && (
                      <>
                        <span>•</span>
                        <span className="italic text-slate-400 truncate max-w-xs">{routine.notes}</span>
                      </>
                    )}
                  </div>
                  {routine.reportedValue && (
                    <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                      💬 {routine.reportedValue}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteRoutine(routine.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove routine habit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Routine Modal */}
      {showAddRoutineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Everyday Routine Habit</h3>
            <p className="text-slate-500 mb-4 text-[11px]">
              Recurring habit expected every day (e.g. Pack school bag, Fold clothes, Breakfast).
            </p>

            <form onSubmit={handleAddRoutine} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Habit / Task Name</label>
                <input
                  type="text"
                  required
                  value={newRoutineTask}
                  onChange={(e) => setNewRoutineTask(e.target.value)}
                  placeholder="e.g. Prepare gym kit"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Complete By</label>
                  <input
                    type="text"
                    value={newRoutineCompleteBy}
                    onChange={(e) => setNewRoutineCompleteBy(e.target.value)}
                    placeholder="e.g. 8:30 AM"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tracking Type</label>
                  <select
                    value={newRoutineObservable ? 'observable' : 'reported'}
                    onChange={(e) => setNewRoutineObservable(e.target.value === 'observable')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden bg-white"
                  >
                    <option value="reported">Child Reported (Non-observable)</option>
                    <option value="observable">Platform Observed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Guidance (Optional)</label>
                <input
                  type="text"
                  value={newRoutineNotes}
                  onChange={(e) => setNewRoutineNotes(e.target.value)}
                  placeholder="e.g. Check for football boots and shin pads"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddRoutineModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Add Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Other Schedules & Weekly Activities (Sports, Tuitions, Arts, Hobbies) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                Weekly Extracurriculars & Tuitions
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Other Schedules & Recurring Activities
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Activities on specific days of the week (e.g. Football practice, Maths tuition, Swimming, Piano). ECHO naturally remembers these during conversations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddOtherScheduleModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Other Schedule</span>
          </button>
        </div>

        {/* Schedules List */}
        <div className="space-y-2.5 pt-1">
          {otherSchedules.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Calendar className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-600">No other schedules configured yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Add football practice, tuition, music lessons, or swimming.</p>
            </div>
          ) : (
            otherSchedules.map((schedule) => {
              const categoryColors: Record<string, string> = {
                'Sports': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                'Tuition / Academic': 'bg-blue-50 text-blue-700 border-blue-200',
                'Music & Arts': 'bg-purple-50 text-purple-700 border-purple-200',
                'Hobby': 'bg-amber-50 text-amber-700 border-amber-200',
                'Chores': 'bg-slate-100 text-slate-700 border-slate-200',
                'Other': 'bg-indigo-50 text-indigo-700 border-indigo-200',
              };

              return (
                <div
                  key={schedule.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    schedule.enabled
                      ? 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                      : 'bg-slate-50/60 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={schedule.enabled}
                      onChange={() => handleToggleOtherSchedule(schedule.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                          {schedule.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            categoryColors[schedule.category] || categoryColors['Other']
                          }`}
                        >
                          {schedule.category}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                        {/* Days Badges */}
                        <div className="flex items-center gap-1">
                          {schedule.days.map((day) => (
                            <span
                              key={day}
                              className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]"
                            >
                              {day}
                            </span>
                          ))}
                        </div>

                        <span>•</span>

                        {/* Times */}
                        <span className="font-medium text-slate-600">
                          {schedule.startTime} – {schedule.endTime}
                        </span>

                        {schedule.locationOrDetail && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {schedule.locationOrDetail}
                            </span>
                          </>
                        )}
                      </div>

                      {schedule.notes && (
                        <p className="text-[11px] text-slate-500 mt-1 italic">
                          "{schedule.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteOtherSchedule(schedule.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove schedule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Other Schedule Modal */}
      {showAddOtherScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Weekly Schedule / Activity</h3>
            <p className="text-slate-500 mb-4 text-[11px]">
              Recurring classes, practice sessions, or coaching on specific days.
            </p>

            <form onSubmit={handleAddOtherSchedule} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Activity Name</label>
                <input
                  type="text"
                  required
                  value={newScheduleTitle}
                  onChange={(e) => setNewScheduleTitle(e.target.value)}
                  placeholder="e.g. Football Practice, Maths Tuition, Swimming"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Days of Week Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Days of the Week</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const isSelected = newScheduleDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayInNewSchedule(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newScheduleCategory}
                    onChange={(e) => setNewScheduleCategory(e.target.value as OtherScheduleCategory)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden bg-white"
                  >
                    <option value="Sports">Sports</option>
                    <option value="Tuition / Academic">Tuition / Academic</option>
                    <option value="Music & Arts">Music & Arts</option>
                    <option value="Hobby">Hobby</option>
                    <option value="Chores">Chores</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Location / Venue</label>
                  <input
                    type="text"
                    value={newScheduleLocation}
                    onChange={(e) => setNewScheduleLocation(e.target.value)}
                    placeholder="e.g. School Ground / Online"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newScheduleStartTime}
                    onChange={(e) => setNewScheduleStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={newScheduleEndTime}
                    onChange={(e) => setNewScheduleEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Reminders for AI Guide (Optional)</label>
                <input
                  type="text"
                  value={newScheduleNotes}
                  onChange={(e) => setNewScheduleNotes(e.target.value)}
                  placeholder="e.g. Carry football cleats, drink plenty of water"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddOtherScheduleModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-2xs"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Privacy & Autonomy Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-xs text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 text-indigo-700 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Trust & Privacy Architecture</span>
        </div>
        <p className="leading-relaxed text-slate-600">
          The AI companion acts as a supportive friend, not a surveillance tool. Non-observable routines are reported naturally through casual conversation, not verified via invasive cameras or tracking.
        </p>
      </div>
    </div>
  );
};

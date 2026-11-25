import React, { useState } from 'react';
import {
  Plus,
  Clock,
  Calendar,
  BookOpen,
  Trash2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  Tag,
  ArrowRight,
} from 'lucide-react';
import {
  TaskItem,
  TaskCategory,
  LearningMaterial,
  Subject,
  DayResponsibility,
  ResponsibilitySchedule,
} from '../../types';

interface TasksManagerTabProps {
  tasks: TaskItem[];
  materials: LearningMaterial[];
  subjects: Subject[];
  responsibilitySchedule?: ResponsibilitySchedule;
  onAddTask: (newTask: Omit<TaskItem, 'id' | 'status' | 'remindersGiven' | 'isCompleted'>) => void;
  onDeleteTask: (id: string) => void;
  onUpdateSchedule?: (schedule: ResponsibilitySchedule) => void;
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DAYS: Array<{ key: DayKey; label: string; short: string }> = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

export const TasksManagerTab: React.FC<TasksManagerTabProps> = ({
  tasks,
  materials,
  subjects,
  responsibilitySchedule,
  onAddTask,
  onDeleteTask,
  onUpdateSchedule,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayKey>('monday');
  const [useSameWeekday, setUseSameWeekday] = useState<boolean>(
    responsibilitySchedule?.useSameWeekday || false
  );

  const [scheduleState, setScheduleState] = useState<ResponsibilitySchedule>(
    responsibilitySchedule || {
      useSameWeekday: false,
      weekdayResponsibilities: [],
      dayResponsibilities: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
    }
  );

  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Homework');
  const [targetDays, setTargetDays] = useState<DayKey[]>(['monday']);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [priority, setPriority] = useState<'Important' | 'Normal'>('Important');
  const [notesForAI, setNotesForAI] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || 'math');
  const [attachedMaterialId, setAttachedMaterialId] = useState<string>('');

  const categories: TaskCategory[] = [
    'Homework',
    'Study',
    'Chore',
    'School preparation',
    'Personal responsibility',
    'Exercise',
    'Other',
  ];

  const currentResponsibilities: DayResponsibility[] = useSameWeekday
    ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(selectedDay)
      ? scheduleState.weekdayResponsibilities || []
      : scheduleState.dayResponsibilities?.[selectedDay] || []
    : scheduleState.dayResponsibilities?.[selectedDay] || [];

  const handleToggleUseSameWeekday = (val: boolean) => {
    setUseSameWeekday(val);
    const updated = { ...scheduleState, useSameWeekday: val };
    setScheduleState(updated);
    if (onUpdateSchedule) onUpdateSchedule(updated);
  };

  const handleAddResponsibility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newResp: DayResponsibility = {
      id: `resp-${Date.now()}`,
      title: title.trim(),
      category,
      expectedStart: startTime,
      expectedCompletion: endTime,
      durationMinutes,
      priority,
      notesForAI: notesForAI.trim() || undefined,
      subjectId: selectedSubjectId,
      materialIds: attachedMaterialId ? [attachedMaterialId] : [],
      status: 'not_discussed',
    };

    let updatedSchedule = { ...scheduleState };

    if (useSameWeekday && targetDays.some((d) => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(d))) {
      updatedSchedule = {
        ...updatedSchedule,
        weekdayResponsibilities: [...(updatedSchedule.weekdayResponsibilities || []), newResp],
      };
    } else {
      const newDayResp = { ...updatedSchedule.dayResponsibilities };
      targetDays.forEach((day) => {
        newDayResp[day] = [...(newDayResp[day] || []), { ...newResp, id: `resp-${day}-${Date.now()}` }];
      });
      updatedSchedule = {
        ...updatedSchedule,
        dayResponsibilities: newDayResp,
      };
    }

    setScheduleState(updatedSchedule);
    if (onUpdateSchedule) onUpdateSchedule(updatedSchedule);

    // Also sync with parent tasks list for demo integration
    onAddTask({
      title: newResp.title,
      category: newResp.category,
      startTime: newResp.expectedStart || '17:00',
      endTime: newResp.expectedCompletion,
      frequency: useSameWeekday ? 'Weekdays' : 'Daily',
      instructions: newResp.notesForAI,
      subjectId: newResp.subjectId,
      materialIds: newResp.materialIds,
    });

    // Reset form
    setTitle('');
    setNotesForAI('');
    setAttachedMaterialId('');
    setShowAddModal(false);
  };

  const handleDeleteResponsibility = (id: string) => {
    let updatedSchedule = { ...scheduleState };
    if (useSameWeekday) {
      updatedSchedule = {
        ...updatedSchedule,
        weekdayResponsibilities: updatedSchedule.weekdayResponsibilities?.filter((r) => r.id !== id),
      };
    } else {
      const newDayResp = { ...updatedSchedule.dayResponsibilities };
      newDayResp[selectedDay] = newDayResp[selectedDay]?.filter((r) => r.id !== id);
      updatedSchedule = {
        ...updatedSchedule,
        dayResponsibilities: newDayResp,
      };
    }
    setScheduleState(updatedSchedule);
    if (onUpdateSchedule) onUpdateSchedule(updatedSchedule);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Day-Specific Expectations
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Responsibilities & AI Guidance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">
            Configure what needs to be done on each day. Instead of displaying a stressful checklist to your child, the AI companion uses these expected times and notes to naturally converse, nudge, and assist.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setTargetDays([selectedDay]);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Responsibility</span>
        </button>
      </div>

      {/* 2. Weekday vs Custom Schedule Selector */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">Schedule Mode:</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={useSameWeekday}
              onChange={(e) => handleToggleUseSameWeekday(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
            />
            <span>Use same schedule for Monday–Friday</span>
          </label>
        </div>

        {/* Days Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {DAYS.map((day) => {
            const isSelected = selectedDay === day.key;
            const count = useSameWeekday && ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day.key)
              ? scheduleState.weekdayResponsibilities?.length || 0
              : scheduleState.dayResponsibilities?.[day.key]?.length || 0;

            return (
              <button
                key={day.key}
                type="button"
                onClick={() => setSelectedDay(day.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{day.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Responsibilities Cards for Selected Day */}
      <div className="space-y-3">
        {currentResponsibilities.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 text-xl">
              📅
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              No responsibilities scheduled for {DAYS.find((d) => d.key === selectedDay)?.label}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add homework, revisions, reading, or chores. The AI guide will use the time window and your notes.
            </p>
            <button
              type="button"
              onClick={() => {
                setTargetDays([selectedDay]);
                setShowAddModal(true);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Responsibility for {DAYS.find((d) => d.key === selectedDay)?.label}</span>
            </button>
          </div>
        ) : (
          currentResponsibilities.map((resp) => {
            const attachedMaterial = materials.find((m) => resp.materialIds?.includes(m.id));

            return (
              <div
                key={resp.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        resp.priority === 'Important'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {resp.category === 'Homework' ? '📐' : resp.category === 'Study' ? '🔬' : '📋'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {resp.title}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {resp.category}
                        </span>
                        {resp.priority === 'Important' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            ★ Important
                          </span>
                        )}
                      </div>

                      {/* Time Window & Duration */}
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-semibold">
                            {resp.expectedStart ? `${formatTime(resp.expectedStart)} – ` : ''}
                            {formatTime(resp.expectedCompletion)}
                          </span>
                        </span>
                        {resp.durationMinutes && (
                          <>
                            <span>•</span>
                            <span>{resp.durationMinutes} mins expected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteResponsibility(resp.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove responsibility"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes for AI Prompting Box */}
                {resp.notesForAI && (
                  <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-indigo-900 block mb-0.5">
                        Instructions / Notes for AI Guide:
                      </span>
                      <p className="text-indigo-800/90 leading-relaxed font-normal">
                        "{resp.notesForAI}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Attached Learning Material */}
                {attachedMaterial && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-medium truncate">
                      Linked Material: {attachedMaterial.title} ({attachedMaterial.chapter})
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Add Responsibility Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add New Responsibility</h3>
            <p className="text-slate-500 mb-4 text-[11px] leading-relaxed">
              Define the activity, expected time, priority, and notes for the AI guide.
            </p>

            <form onSubmit={handleAddResponsibility} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Responsibility Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Maths homework: Linear Equations"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'Important' | 'Normal')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden bg-white"
                  >
                    <option value="Important">Important (Prompt if skipped)</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
              </div>

              {/* Target Days */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Scheduled Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => {
                    const isChecked = targetDays.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            if (targetDays.length > 1) {
                              setTargetDays(targetDays.filter((k) => k !== d.key));
                            }
                          } else {
                            setTargetDays([...targetDays, d.key]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timings */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expected Start</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Complete By</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>
              </div>

              {/* Notes for AI */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <label className="font-bold text-indigo-900 block">
                    Notes for AI Guide (Crucial for Natural Prompting)
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={notesForAI}
                  onChange={(e) => setNotesForAI(e.target.value)}
                  placeholder="e.g. Focus on exercises 1–10 from Chapter 4 in math notebook."
                  className="w-full p-2.5 rounded-xl border border-indigo-200 bg-white outline-hidden focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Subject & Attached Material */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Associated Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden bg-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Attached Textbook / Notes</label>
                  <select
                    value={attachedMaterialId}
                    onChange={(e) => setAttachedMaterialId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-hidden bg-white"
                  >
                    <option value="">None (General)</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.chapter})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Responsibility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function formatTime(time24?: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

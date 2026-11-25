import React, { useState } from 'react';
import { Play, Clock, BookOpen, AlertCircle, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { TaskItem, LearningMaterial } from '../../types';

interface NextUpCardProps {
  currentTask: TaskItem | undefined;
  materials: LearningMaterial[];
  onStartTask: (task: TaskItem) => void;
  onPostponeTask: (task: TaskItem, minutes: number) => void;
  onRequestHelp: (task: TaskItem) => void;
}

export const NextUpCard: React.FC<NextUpCardProps> = ({
  currentTask,
  materials,
  onStartTask,
  onPostponeTask,
  onRequestHelp,
}) => {
  const [showNudgeDialog, setShowNudgeDialog] = useState(false);

  if (!currentTask) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs text-center py-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">All caught up for now!</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          No immediate tasks pending. Feel free to explore, draw, or relax.
        </p>
      </div>
    );
  }

  const attachedMaterial = materials.find((m) => currentTask.materialIds?.includes(m.id));

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs relative overflow-hidden transition-all hover:border-blue-200">
      {/* Top Tag & Time badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
            Next Up
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatTime12Hour(currentTask.startTime)} – {formatTime12Hour(currentTask.endTime)}</span>
        </div>
      </div>

      {/* Main Title & Category */}
      <div className="mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
          {currentTask.title}
        </h2>
        {currentTask.instructions && (
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            "{currentTask.instructions}"
          </p>
        )}
      </div>

      {/* Attached Material Pill */}
      {attachedMaterial && (
        <div className="mb-4 flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
          <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="truncate">
            <span className="font-semibold text-slate-900">{attachedMaterial.title}</span>
            <span className="text-slate-400 mx-1">•</span>
            <span className="text-slate-500">{attachedMaterial.chapter}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          id="btn-start-task"
          onClick={() => onStartTask(currentTask)}
          className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start Now</span>
        </button>

        <button
          id="btn-nudge-options"
          onClick={() => setShowNudgeDialog(!showNudgeDialog)}
          className="py-3 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Need 10 min?</span>
        </button>
      </div>

      {/* Gentle Nudge Drawer (Empathetic freedom) */}
      {showNudgeDialog && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 animate-fadeIn">
          <p className="text-xs text-slate-600 mb-2">
            No pressure! Want to push this by 10 or 15 minutes to finish chilling?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                onPostponeTask(currentTask, 10);
                setShowNudgeDialog(false);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors"
            >
              +10 min break ⏳
            </button>
            <button
              onClick={() => {
                onPostponeTask(currentTask, 20);
                setShowNudgeDialog(false);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors"
            >
              +20 min ⏰
            </button>
            <button
              onClick={() => {
                onRequestHelp(currentTask);
                setShowNudgeDialog(false);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Ask a question first</span>
            </button>
          </div>
        </div>
      )}
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

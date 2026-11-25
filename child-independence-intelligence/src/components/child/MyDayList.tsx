import React from 'react';
import { CheckCircle2, Clock, Play, RotateCcw } from 'lucide-react';
import { TaskItem } from '../../types';

interface MyDayListProps {
  tasks: TaskItem[];
  onStartTask: (task: TaskItem) => void;
  onToggleComplete: (task: TaskItem) => void;
}

export const MyDayList: React.FC<MyDayListProps> = ({ tasks, onStartTask, onToggleComplete }) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            My Day
          </h3>
          <p className="text-xs text-slate-400">Keep it simple — one thing at a time</p>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
          {tasks.filter((t) => t.status === 'completed').length}/{tasks.length} done
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const isDone = task.status === 'completed';
          const isInProgress = task.status === 'in_progress';

          return (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                isDone
                  ? 'bg-slate-50 border-slate-200 text-slate-400'
                  : isInProgress
                  ? 'bg-blue-50/70 border-blue-200 text-slate-800'
                  : 'bg-white border-slate-200/80 text-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => onToggleComplete(task)}
                  title={isDone ? 'Mark as not done' : 'Mark as done'}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-slate-300 hover:border-blue-500'
                  }`}
                >
                  {isDone && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs sm:text-sm font-semibold truncate ${
                      isDone ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime12Hour(task.startTime)}</span>
                    <span>•</span>
                    <span>{task.category}</span>
                  </div>
                </div>
              </div>

              {/* Status or Start Button */}
              <div className="ml-2 shrink-0">
                {isDone ? (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                    Done ✓
                  </span>
                ) : (
                  <button
                    onClick={() => onStartTask(task)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span className="text-[11px] pr-1">Start</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
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

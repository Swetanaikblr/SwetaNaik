import React, { useState, useEffect } from 'react';
import { Timer, Pause, Play, Plus, X, Bell, CheckCircle2, Sparkles } from 'lucide-react';
import { VoiceTimerManager, ActiveTimer } from '../../wellness/VoiceTimerManager';

export const ActiveTimerBanner: React.FC = () => {
  const [timers, setTimers] = useState<ActiveTimer[]>([]);

  useEffect(() => {
    const unsub = VoiceTimerManager.subscribe((list) => {
      setTimers(list);
    });
    return unsub;
  }, []);

  const activeTimer = timers.find((t) => t.remainingSeconds > 0);
  const recentlyFinished = timers.find((t) => t.remainingSeconds <= 0);

  if (!activeTimer && !recentlyFinished) {
    return null;
  }

  if (activeTimer) {
    const mins = Math.floor(activeTimer.remainingSeconds / 60);
    const secs = activeTimer.remainingSeconds % 60;
    const progressPercent = Math.max(
      0,
      Math.min(100, ((activeTimer.totalSeconds - activeTimer.remainingSeconds) / activeTimer.totalSeconds) * 100)
    );

    return (
      <div className="mb-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-3.5 shadow-lg border border-indigo-700/50 animate-fadeIn">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Icon & Timer details */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 border border-white/20 shadow-inner">
              <Timer className="w-5 h-5 text-amber-300 animate-pulse" />
              <div
                className="absolute inset-0 rounded-xl border-2 border-amber-400 opacity-60"
                style={{ clipPath: `inset(0 0 ${100 - progressPercent}% 0)` }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Voice Timer Active
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-sm font-extrabold text-white">
                {activeTimer.label}
              </p>
            </div>
          </div>

          {/* Center: Digital Countdown */}
          <div className="text-center px-3 py-1.5 rounded-xl bg-black/25 border border-white/10">
            <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 tracking-wider">
              {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
            </span>
          </div>

          {/* Right: Quick Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (activeTimer.isRunning) {
                  VoiceTimerManager.pauseTimer(activeTimer.id);
                } else {
                  VoiceTimerManager.resumeTimer(activeTimer.id);
                }
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={activeTimer.isRunning ? 'Pause timer' : 'Resume timer'}
            >
              {activeTimer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => VoiceTimerManager.addMinutes(activeTimer.id, 1)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Add 1 minute"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>1m</span>
            </button>

            <button
              onClick={() => VoiceTimerManager.cancelTimer(activeTimer.id)}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/40 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Cancel timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-black/30 rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-400 to-emerald-400 h-1.5 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  // Celebratory Finished Banner
  return (
    <div className="mb-4 bg-emerald-600 text-white rounded-2xl p-4 shadow-xl border border-emerald-500 flex items-center justify-between gap-3 animate-bounce">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
          ⏰
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Timer Complete!</span>
          </div>
          <p className="text-sm font-extrabold text-white">
            {recentlyFinished?.label || 'Your reminder is up!'}
          </p>
        </div>
      </div>

      <button
        onClick={() => {
          if (recentlyFinished) VoiceTimerManager.cancelTimer(recentlyFinished.id);
        }}
        className="px-3 py-1.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-colors cursor-pointer shadow-sm"
      >
        Dismiss ✓
      </button>
    </div>
  );
};

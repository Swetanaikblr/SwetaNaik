import React, { useState, useEffect } from 'react';
import { Eye, Coffee, Activity, Droplets, CheckCircle2, Clock, X } from 'lucide-react';
import { ReminderScheduler, WellnessTriggerEvent } from '../../wellness/ReminderScheduler';

interface WellnessBreakModalProps {
  trigger: WellnessTriggerEvent | null;
  onClose: () => void;
}

export const WellnessBreakModal: React.FC<WellnessBreakModalProps> = ({
  trigger,
  onClose,
}) => {
  const [countdown, setCountdown] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setCountdown(trigger.suggestedDurationSeconds || 60);
      setTimerActive(true);
    }
  }, [trigger]);

  useEffect(() => {
    let timer: any = null;
    if (timerActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, countdown]);

  if (!trigger) return null;

  const getIcon = () => {
    switch (trigger.type) {
      case 'eye_rest_20':
        return <Eye className="w-8 h-8 text-cyan-600" />;
      case 'hydration':
        return <Droplets className="w-8 h-8 text-blue-600" />;
      case 'posture_stretch':
      case 'movement_recharge':
        return <Activity className="w-8 h-8 text-amber-600" />;
      case 'study_pause':
      default:
        return <Coffee className="w-8 h-8 text-indigo-600" />;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleComplete = () => {
    ReminderScheduler.completeBreak();
    onClose();
  };

  const handleSnooze = () => {
    ReminderScheduler.snoozeBreak(5);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-100 relative">
        <button
          type="button"
          onClick={handleSnooze}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          {getIcon()}
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          {trigger.title}
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed mb-5">
          {trigger.message}
        </p>

        {/* Visual Countdown Ring / Pill */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl py-3 px-4 mb-5 flex items-center justify-center gap-3">
          <Clock className="w-5 h-5 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="text-left">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Break Timer
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {formatTime(countdown)}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleComplete}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Finished My Break!</span>
          </button>

          {trigger.canSnooze && (
            <button
              type="button"
              onClick={handleSnooze}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Give me 5 more minutes (Snooze)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

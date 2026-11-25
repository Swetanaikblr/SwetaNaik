import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Calendar,
  RefreshCw,
  Award,
  BookOpen,
  Info,
  Check,
  Tag,
  Zap,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { TaskItem, ActivityLog, ChildProfile, DailyObservation } from '../../types';
import { ObservationStore, StructuredObservation } from '../../observations/ObservationStore';

interface TodaysSnapshotTabProps {
  childProfile: ChildProfile;
  tasks: TaskItem[];
  activityLogs: ActivityLog[];
  observations?: DailyObservation[];
  parentRemindersCount: number;
  onRefreshSummary?: () => void;
}

export const TodaysSnapshotTab: React.FC<TodaysSnapshotTabProps> = ({
  childProfile,
  tasks,
  activityLogs,
  parentRemindersCount,
}) => {
  const [filterSource, setFilterSource] = useState<string>('all');
  const [liveObservations, setLiveObservations] = useState<StructuredObservation[]>(() =>
    ObservationStore.getObservations()
  );

  useEffect(() => {
    const unsub = ObservationStore.subscribe((updated) => {
      setLiveObservations(updated);
    });
    return unsub;
  }, []);

  const handleAcknowledge = (id: string) => {
    ObservationStore.acknowledgeObservation(id);
  };

  const filteredObservations = liveObservations.filter((obs) => {
    if (filterSource === 'all') return true;
    return obs.source === filterSource;
  });

  const childReportedCount = liveObservations.filter((o) => o.source === 'child_reported').length;
  const routineCheckCount = liveObservations.filter((o) => o.source === 'routine_check').length;
  const timerTriggerCount = liveObservations.filter((o) => o.source === 'timer_trigger').length;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                Today's Snapshot
              </span>
              <span className="text-xs text-blue-100">
                Readable in under 2 minutes
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {childProfile.name}'s Day & Meaningful Observations
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl leading-relaxed">
              Provides real clarity on what happened without asking for raw chat transcripts or constantly reminding.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/15 text-center">
              <span className="text-[10px] uppercase tracking-wider text-blue-200 block font-bold">
                Parent Reminders
              </span>
              <span className="text-2xl font-black text-white">
                {parentRemindersCount}
              </span>
              <span className="text-[10px] text-emerald-300 block font-medium mt-0.5">
                Zero nagging needed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Three Metric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Child Reported summary */}
        <div className="bg-blue-50/80 border border-blue-200/90 rounded-3xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs">
              🏷️
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Child Reported
            </h4>
          </div>
          <p className="text-sm font-semibold text-blue-950 mt-1 leading-snug">
            {childProfile.name} naturally shared wake-up at 6:45 AM and after-school TV time.
          </p>
          <span className="text-[11px] text-blue-700 mt-2 block font-medium">
            Open, honest communication without fear of scolding
          </span>
        </div>

        {/* Platform Observed */}
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-3xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs">
              ⚡
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Platform Observed
            </h4>
          </div>
          <p className="text-sm font-semibold text-emerald-950 mt-1 leading-snug">
            Independently started Science reading (12 min, 2 comprehension answers).
          </p>
          <span className="text-[11px] text-emerald-700 mt-2 block font-medium">
            Verified study interaction telemetry
          </span>
        </div>

        {/* Parent Expectations */}
        <div className="bg-purple-50/80 border border-purple-200/90 rounded-3xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs">
              📋
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
              Parent Configured
            </h4>
          </div>
          <p className="text-sm font-semibold text-purple-950 mt-1 leading-snug">
            Maths homework window: 5:00–6:00 PM • Science review: 8:00–8:45 PM.
          </p>
          <span className="text-[11px] text-purple-700 mt-2 block font-medium">
            Guide gently introduces expectations at the right moment
          </span>
        </div>
      </div>

      {/* 3. Filterable Meaningful Observations Feed */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Meaningful Observations & Facts
            </h3>
            <p className="text-xs text-slate-500">
              Distinguishing verified facts from child-reported statements and scheduled expectations
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilterSource('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                filterSource === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({liveObservations.length})
            </button>
            <button
              onClick={() => setFilterSource('child_reported')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                filterSource === 'child_reported'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <span>🏷️ Child Reported</span>
              <span className="text-[10px] opacity-80">({childReportedCount})</span>
            </button>
            <button
              onClick={() => setFilterSource('routine_check')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                filterSource === 'routine_check'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <span>⚡ Routine Check</span>
              <span className="text-[10px] opacity-80">({routineCheckCount})</span>
            </button>
            <button
              onClick={() => setFilterSource('timer_trigger')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                filterSource === 'timer_trigger'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <span>⏰ Timer Triggers</span>
              <span className="text-[10px] opacity-80">({timerTriggerCount})</span>
            </button>
          </div>
        </div>

        {/* Observation Cards */}
        <div className="space-y-2.5">
          {filteredObservations.map((obs) => {
            const isChildReport = obs.source === 'child_reported';
            const isTimer = obs.source === 'timer_trigger';

            return (
              <div
                key={obs.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isChildReport
                    ? 'bg-blue-50/40 border-blue-200/80 hover:border-blue-300'
                    : isTimer
                    ? 'bg-purple-50/40 border-purple-200/80 hover:border-purple-300'
                    : 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 font-bold ${
                      isChildReport
                        ? 'bg-blue-100 text-blue-700'
                        : isTimer
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isChildReport ? '💬' : isTimer ? '⏰' : '⚡'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {obs.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isChildReport
                            ? 'bg-blue-100 text-blue-800'
                            : isTimer
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {obs.source.replace('_', ' ')}
                      </span>
                      {obs.verified && (
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{Math.round(obs.confidenceScore * 100)}% verified</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-normal">
                      {obs.detail}
                    </p>

                    {obs.rawChildQuote && (
                      <p className="text-[11px] text-slate-500 italic mt-1 bg-white/70 px-2 py-1 rounded-md border border-slate-200/60 inline-block">
                        "{obs.rawChildQuote}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                  <span className="text-[11px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                    {obs.timeDisplay}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAcknowledge(obs.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                      obs.parentAcknowledged
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {obs.parentAcknowledged ? '✓ Seen' : 'Mark Seen'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Meaningful Synthesis & Respecting Autonomy Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-xs text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center gap-2 text-indigo-700 font-bold">
          <Info className="w-4 h-4" />
          <span>Why observations instead of raw transcripts?</span>
        </div>
        <p className="leading-relaxed">
          Providing parents with raw chat transcripts breaks child trust and causes them to stop engaging. Distinguishing verified platform facts from child reports gives parents accurate situational awareness without making the child feel monitored.
        </p>
      </div>
    </div>
  );
};

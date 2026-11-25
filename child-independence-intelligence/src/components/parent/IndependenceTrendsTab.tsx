import React from 'react';
import { TrendingUp, ShieldCheck, Heart, Clock, ArrowDownRight, ArrowUpRight, Award, CheckCircle } from 'lucide-react';
import { InterventionStats, ChildProfile } from '../../types';

interface IndependenceTrendsTabProps {
  stats: InterventionStats;
  childProfile: ChildProfile;
}

export const IndependenceTrendsTab: React.FC<IndependenceTrendsTabProps> = ({ stats, childProfile }) => {
  const { lastWeekReminders, thisWeekReminders, days } = stats.weeklyTrend;
  const reductionPercentage = Math.round(
    ((lastWeekReminders - thisWeekReminders) / lastWeekReminders) * 100
  );

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Hero Achievement Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-2 backdrop-blur-xs">
              <Award className="w-3.5 h-3.5" />
              <span>Core Platform Outcome</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {reductionPercentage}% Reduction in Parent Reminders
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-lg leading-relaxed">
              {childProfile.name} is starting and managing tasks independently through contextual AI nudges rather than repeated parental checking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 sm:px-4 border border-white/20 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">Last Week</span>
              <span className="text-2xl font-extrabold text-white">{lastWeekReminders}</span>
              <span className="text-[10px] text-emerald-100 block">reminders</span>
            </div>
            <div className="text-xl text-white font-bold">→</div>
            <div className="bg-white text-emerald-800 rounded-2xl p-3 sm:px-4 shadow-md text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">This Week</span>
              <span className="text-2xl font-extrabold text-emerald-700">{thisWeekReminders}</span>
              <span className="text-[10px] text-emerald-600 block font-semibold">reminders</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Quantitative Metrics (Section 25) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Independent Starts</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900">78%</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +12%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Started with 0 or 1 nudge</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Completed On-Time</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900">84%</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +8%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Without parental escalation</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Parent Time Saved</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-blue-600">~4.5h</span>
            <span className="text-[11px] text-slate-500">/ week</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Less nagging & checking</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">AI Learning Queries</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-purple-600">8</span>
            <span className="text-[11px] text-slate-500">this wk</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Socratic textbook guidance</span>
        </div>
      </div>

      {/* Daily Independence vs. Parent Reminders Visualization */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">7-Day Independence Breakdown</h3>
            <p className="text-xs text-slate-500">
              Child-initiated activities (Green) vs. Parent reminders needed (Red)
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span className="text-slate-600">Child Initiated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-400" />
              <span className="text-slate-600">Parent Reminders</span>
            </div>
          </div>
        </div>

        {/* Bar visualization */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 pb-2">
          {days.map((d, idx) => {
            const maxVal = 6;
            const childHeightPct = Math.min(100, (d.childInitiated / maxVal) * 100);
            const reminderHeightPct = Math.min(100, (d.parentReminders / maxVal) * 100);

            return (
              <div key={idx} className="flex flex-col items-center">
                <div className="h-36 w-full flex items-end justify-center gap-1 bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
                  {/* Child Initiated Bar */}
                  <div
                    style={{ height: `${childHeightPct}%` }}
                    className="w-1/2 bg-emerald-500 rounded-lg transition-all hover:bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold shadow-2xs"
                    title={`${d.childInitiated} child-initiated tasks`}
                  >
                    {d.childInitiated > 0 ? d.childInitiated : ''}
                  </div>

                  {/* Parent Reminder Bar */}
                  <div
                    style={{ height: `${reminderHeightPct}%` }}
                    className="w-1/2 bg-rose-400 rounded-lg transition-all hover:bg-rose-500 flex items-center justify-center text-[10px] text-white font-bold shadow-2xs"
                    title={`${d.parentReminders} parent reminders`}
                  >
                    {d.parentReminders > 0 ? d.parentReminders : ''}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 mt-2">{d.day}</span>
              </div>
            );
          })}
        </div>

        {/* Safe Philosophy Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>
            This measures system effectiveness in reducing friction — not a behavioral grade or judgment of {childProfile.name}.
          </span>
        </div>
      </div>
    </div>
  );
};

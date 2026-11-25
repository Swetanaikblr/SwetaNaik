import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Volume2,
  VolumeX,
  Smartphone,
  Maximize2,
  Clock,
  Sun,
  School,
  BookOpen,
  Palette,
  Moon,
  Compass,
  Lock,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';
import { TimeScenario } from '../types';

interface HeaderNavProps {
  currentMode: 'child' | 'parent';
  onSwitchToChild: () => void;
  onRequestParentAccess: () => void;
  timeScenario: TimeScenario;
  onScenarioChange: (scenario: TimeScenario) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  mobileFrame: boolean;
  onToggleMobileFrame: () => void;
  childName: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentMode,
  onSwitchToChild,
  onRequestParentAccess,
  timeScenario,
  onScenarioChange,
  soundEnabled,
  onToggleSound,
  mobileFrame,
  onToggleMobileFrame,
  childName,
}) => {
  const scenarioLabels: Record<TimeScenario, { label: string; time: string; icon: any; color: string }> = {
    morning: { label: 'Morning Prep', time: '07:30 AM', icon: Sun, color: 'text-amber-500' },
    after_school: { label: 'After School', time: '03:30 PM', icon: School, color: 'text-emerald-500' },
    pre_study: { label: 'Pre-Study Buffer', time: '04:50 PM', icon: Clock, color: 'text-orange-500' },
    study_time: { label: 'Maths Homework', time: '05:05 PM', icon: BookOpen, color: 'text-blue-500' },
    free_time: { label: 'Free Time & Play', time: '06:15 PM', icon: Palette, color: 'text-purple-500' },
    evening: { label: 'Science Study', time: '08:00 PM', icon: Compass, color: 'text-cyan-500' },
    bedtime: { label: 'Bedtime Prep', time: '09:30 PM', icon: Moon, color: 'text-indigo-500' },
  };

  const currentConfig = scenarioLabels[timeScenario];
  const CurrentIcon = currentConfig.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Role Identity */}
        <div className="flex items-center gap-3">
          {currentMode === 'child' ? (
            /* CHILD EXPERIENCE: "Aarav's Space" ONLY */
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xs text-base">
                🚀
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {childName}'s Space
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    ECHO Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <CurrentIcon className={`w-3 h-3 ${currentConfig.color}`} />
                  <span>{currentConfig.time} — {currentConfig.label}</span>
                </p>
              </div>
            </div>
          ) : (
            /* PARENT EXPERIENCE: "Parent Dashboard" with return option */
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Parent Dashboard
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <UserCheck className="w-3 h-3" />
                    Authenticated
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Monitoring & Routines for {childName}
                </p>
              </div>

              {/* Clear Switch back to Child Space */}
              <button
                id="return-to-child-space"
                onClick={onSwitchToChild}
                className="ml-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Switch to {childName}'s Space</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Context Controls & Parent Access */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Time Context Simulator (for demonstration across routines) */}
          <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-xl px-2 py-1 gap-1.5">
            <CurrentIcon className={`w-3.5 h-3.5 ${currentConfig.color}`} />
            <select
              id="select-scenario-time"
              value={timeScenario}
              onChange={(e) => onScenarioChange(e.target.value as TimeScenario)}
              className="bg-transparent text-xs font-semibold text-slate-800 border-none outline-hidden cursor-pointer pr-1"
            >
              <option value="after_school">3:30 PM — After School</option>
              <option value="pre_study">4:50 PM — Pre-Study Buffer</option>
              <option value="study_time">5:05 PM — Maths Homework</option>
              <option value="free_time">6:15 PM — Free Time & Play</option>
              <option value="evening">8:00 PM — Science Study</option>
              <option value="bedtime">9:30 PM — Bedtime Routine</option>
              <option value="morning">7:30 AM — Morning Readiness</option>
            </select>
          </div>

          {/* Voice sound toggle */}
          <button
            id="toggle-sound"
            onClick={onToggleSound}
            title={soundEnabled ? 'Voice guide audio enabled' : 'Voice guide muted'}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Device viewport frame toggle */}
          <button
            id="toggle-mobile-frame"
            onClick={onToggleMobileFrame}
            title={mobileFrame ? 'Switch to responsive view' : 'Switch to mobile phone frame'}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              mobileFrame
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
          >
            {mobileFrame ? <Smartphone className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Protected Parent Access Button (Shown in Child Space only) */}
          {currentMode === 'child' && (
            <button
              id="open-parent-access"
              onClick={onRequestParentAccess}
              title="Parent Access (Requires PIN)"
              className="ml-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Parent Access</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

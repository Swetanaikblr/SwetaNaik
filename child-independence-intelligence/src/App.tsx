import React, { useState } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { ChildSpace } from './components/child/ChildSpace';
import { ParentDashboard } from './components/parent/ParentDashboard';
import { ParentPinModal } from './components/parent/ParentPinModal';
import { ParentAuthService } from './auth/ParentAuthService';
import {
  initialChildProfile,
  initialSubjects,
  initialMaterials,
  initialTasks,
  initialApprovedApps,
  initialActivityLogs,
  initialInterventionStats,
  initialResponsibilitySchedule,
  initialDailyObservations,
} from './data/initialData';
import {
  ChildProfile,
  TaskItem,
  LearningMaterial,
  ApprovedApp,
  TimeScenario,
  ActivityLog,
  InterventionStats,
  ResponsibilitySchedule,
  DailyObservation,
} from './types';
import { Sparkles, Info, X } from 'lucide-react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'child' | 'parent'>('child');
  const [parentAccessModalOpen, setParentAccessModalOpen] = useState<boolean>(false);
  const [timeScenario, setTimeScenario] = useState<TimeScenario>('after_school');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [mobileFrame, setMobileFrame] = useState<boolean>(false);
  const [showDemoGuide, setShowDemoGuide] = useState<boolean>(true);

  // Core platform states
  const [childProfile, setChildProfile] = useState<ChildProfile>(initialChildProfile);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [responsibilitySchedule, setResponsibilitySchedule] =
    useState<ResponsibilitySchedule>(initialResponsibilitySchedule);
  const [dailyObservations, setDailyObservations] =
    useState<DailyObservation[]>(initialDailyObservations);
  const [materials, setMaterials] = useState<LearningMaterial[]>(initialMaterials);
  const [subjects] = useState(initialSubjects);
  const [approvedApps, setApprovedApps] = useState<ApprovedApp[]>(initialApprovedApps);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [interventionStats] = useState<InterventionStats>(initialInterventionStats);
  const [parentRemindersCount, setParentRemindersCount] = useState<number>(0);

  const handleAddTask = (
    newTaskData: Omit<TaskItem, 'id' | 'status' | 'remindersGiven' | 'isCompleted'>
  ) => {
    const newTask: TaskItem = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      status: 'pending',
      remindersGiven: 0,
      isCompleted: false,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddMaterial = (newMatData: Omit<LearningMaterial, 'id' | 'createdAt'>) => {
    const newMat: LearningMaterial = {
      ...newMatData,
      id: `mat-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setMaterials((prev) => [newMat, ...prev]);
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleApp = (id: string, isAllowed: boolean) => {
    setApprovedApps((prev) =>
      prev.map((app) => (app.id === id ? { ...app, isAllowed } : app))
    );
  };

  const handleUpdateProfile = (updated: Partial<ChildProfile>) => {
    setChildProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleLogActivity = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const handleAddObservation = (obs: Omit<DailyObservation, 'id'>) => {
    const newObs: DailyObservation = {
      ...obs,
      id: `obs-${Date.now()}`,
    };
    setDailyObservations((prev) => [newObs, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Universal App Navigation & Time Simulator */}
      <HeaderNav
        currentMode={currentMode}
        onSwitchToChild={() => {
          ParentAuthService.lock();
          setCurrentMode('child');
        }}
        onRequestParentAccess={() => setParentAccessModalOpen(true)}
        timeScenario={timeScenario}
        onScenarioChange={setTimeScenario}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        mobileFrame={mobileFrame}
        onToggleMobileFrame={() => setMobileFrame(!mobileFrame)}
        childName={childProfile.name}
      />

      {/* Quick Demo Scenario Banner */}
      {showDemoGuide && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs py-2 px-4 shadow-xs relative">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                MVP Demo Guide
              </span>
              <span className="hidden sm:inline">
                Test the core conversational & parent flows:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => {
                    setCurrentMode('child');
                    setTimeScenario('after_school');
                  }}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                    timeScenario === 'after_school' ? 'bg-white text-blue-900 font-bold' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  1. After School (3:30 PM)
                </button>
                <button
                  onClick={() => {
                    setCurrentMode('child');
                    setTimeScenario('pre_study');
                  }}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                    timeScenario === 'pre_study' ? 'bg-white text-blue-900 font-bold' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  2. Late Arrival / TV (5:00 PM)
                </button>
                <button
                  onClick={() => {
                    setCurrentMode('child');
                    setTimeScenario('study_time');
                  }}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                    timeScenario === 'study_time' ? 'bg-white text-blue-900 font-bold' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  3. Maths / Study Prompt (5:05 PM)
                </button>
                <button
                  onClick={() => {
                    if (currentMode === 'parent') {
                      setCurrentMode('child');
                    } else {
                      setParentAccessModalOpen(true);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                    currentMode === 'parent' ? 'bg-white text-indigo-900 font-bold' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {currentMode === 'parent' ? 'Back to Aarav\'s Space' : '4. Parent Snapshot (PIN 2026)'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowDemoGuide(false)}
              className="p-1 rounded-md hover:bg-white/20 text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto py-2">
        {currentMode === 'child' ? (
          <ChildSpace
            childProfile={childProfile}
            tasks={tasks}
            materials={materials}
            approvedApps={approvedApps}
            timeScenario={timeScenario}
            soundEnabled={soundEnabled}
            onUpdateTasks={setTasks}
            onLogActivity={handleLogActivity}
            onAddObservation={handleAddObservation}
            mobileFrame={mobileFrame}
          />
        ) : (
          <ParentDashboard
            childProfile={childProfile}
            tasks={tasks}
            materials={materials}
            subjects={subjects}
            activityLogs={activityLogs}
            observations={dailyObservations}
            responsibilitySchedule={responsibilitySchedule}
            interventionStats={interventionStats}
            approvedApps={approvedApps}
            parentRemindersCount={parentRemindersCount}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onAddMaterial={handleAddMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onToggleApp={handleToggleApp}
            onUpdateProfile={handleUpdateProfile}
            onUpdateSchedule={setResponsibilitySchedule}
          />
        )}
      </main>

      {/* Protected Parent Access PIN Modal */}
      <ParentPinModal
        isOpen={parentAccessModalOpen}
        onClose={() => setParentAccessModalOpen(false)}
        onSuccess={() => {
          setParentAccessModalOpen(false);
          setCurrentMode('parent');
        }}
        childName={childProfile.name}
      />

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/50 mt-auto">
        <p className="font-medium">
          Child Independence Intelligence Platform • Freedom within parent-defined boundaries
        </p>
      </footer>
    </div>
  );
}

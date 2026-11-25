import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import {
  ChildProfile,
  TaskItem,
  LearningMaterial,
  ApprovedApp,
  TimeScenario,
  ActivityLog,
  DailyObservation,
} from '../../types';
import { EchoRealtimeVoice } from './EchoRealtimeVoice';
import { ActivityChoicesGrid } from './ActivityChoicesGrid';
import { StudySessionModal } from './StudySessionModal';
import { DrawingStudioModal } from './DrawingStudioModal';
import { YouTubeModal } from './YouTubeModal';
import { MoveBreakModal } from './MoveBreakModal';
import { ExploreAppsModal } from './ExploreAppsModal';
import { ReminderScheduler, WellnessTriggerEvent } from '../../wellness/ReminderScheduler';
import { WellnessBreakModal } from './WellnessBreakModal';
import { ActiveTimerBanner } from './ActiveTimerBanner';

interface ChildSpaceProps {
  childProfile: ChildProfile;
  tasks: TaskItem[];
  materials: LearningMaterial[];
  approvedApps: ApprovedApp[];
  timeScenario: TimeScenario;
  soundEnabled: boolean;
  onUpdateTasks: (tasks: TaskItem[]) => void;
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onAddObservation?: (obs: Omit<DailyObservation, 'id'>) => void;
  mobileFrame: boolean;
}

export const ChildSpace: React.FC<ChildSpaceProps> = ({
  childProfile,
  tasks,
  materials,
  approvedApps,
  timeScenario,
  soundEnabled,
  onUpdateTasks,
  onLogActivity,
  onAddObservation,
  mobileFrame,
}) => {
  // Modal states for child activities
  const [activeModal, setActiveModal] = useState<
    'study' | 'drawing' | 'youtube' | 'move' | 'explore' | 'finish_choice' | null
  >(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('jumping_jacks');
  const [activeTaskForStudy, setActiveTaskForStudy] = useState<TaskItem | null>(null);
  const [wellnessTrigger, setWellnessTrigger] = useState<WellnessTriggerEvent | null>(null);

  useEffect(() => {
    const unsub = ReminderScheduler.subscribe((trigger) => {
      setWellnessTrigger(trigger);
    });
    return unsub;
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    ReminderScheduler.setActivity('idle');
  };

  // Suggested focus task (friendly suggestion, not an intimidating countdown)
  const currentTask =
    tasks.find((t) => t.status === 'in_progress') ||
    (timeScenario === 'study_time' || timeScenario === 'pre_study'
      ? tasks.find((t) => t.id === 'task-math') || tasks.find((t) => t.status !== 'completed')
      : tasks.find((t) => t.status !== 'completed'));

  const handleStartTask = (task: TaskItem) => {
    ReminderScheduler.setActivity('study');
    setActiveTaskForStudy(task);
    setActiveModal('study');

    const updated = tasks.map((t) =>
      t.id === task.id ? { ...t, status: 'in_progress' as const } : t
    );
    onUpdateTasks(updated);

    onLogActivity({
      type: 'task_start',
      title: `Started: ${task.title}`,
      details: `Started via child action at ${getScenarioTimeString(timeScenario)}`,
    });

    if (onAddObservation) {
      onAddObservation({
        time: getScenarioTimeString(timeScenario),
        source: 'platform_observed',
        title: `Started ${task.title}`,
        detail: `Child initiated session independently at ${getScenarioTimeString(timeScenario)}`,
        category: 'learning',
      });
    }
  };

  const handlePostponeTask = (task: TaskItem, minutes: number) => {
    const updated = tasks.map((t) =>
      t.id === task.id ? { ...t, status: 'postponed' as const } : t
    );
    onUpdateTasks(updated);

    onLogActivity({
      type: 'task_postpone',
      title: `Requested ${minutes} min pause on ${task.title}`,
      details: 'Gentle buffer provided without penalty',
    });
  };

  const handleCompleteTask = (task: TaskItem, startMode: 'independent' | 'one_prompt') => {
    const updated = tasks.map((t) =>
      t.id === task.id
        ? {
            ...t,
            status: 'completed' as const,
            isCompleted: true,
            startMode,
            actualEndTime: '17:40',
          }
        : t
    );
    onUpdateTasks(updated);

    onLogActivity({
      type: 'task_complete',
      title: `Completed: ${task.title}`,
      details: `Finished ${startMode === 'independent' ? 'independently' : 'with gentle prompt'}`,
    });

    if (onAddObservation) {
      onAddObservation({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'platform_observed',
        title: `Completed ${task.title}`,
        detail: `Session completed (${startMode === 'independent' ? 'independent start' : 'assisted'})`,
        category: 'learning',
      });
    }
  };

  const handleSelectActivity = (
    act: 'study' | 'drawing' | 'youtube' | 'move' | 'chat' | 'explore' | 'finish',
    exerciseId?: string
  ) => {
    if (act === 'study') {
      ReminderScheduler.setActivity('study');
      const targetTask = currentTask || tasks[0];
      setActiveTaskForStudy(targetTask);
      setActiveModal('study');
    } else if (act === 'finish') {
      setActiveModal('finish_choice');
    } else if (act === 'drawing') {
      ReminderScheduler.setActivity('drawing');
      setActiveModal('drawing');
      onLogActivity({
        type: 'free_activity',
        title: 'Drawing Studio opened',
        details: 'Creative sketching time',
      });
    } else if (act === 'youtube') {
      ReminderScheduler.setActivity('youtube');
      setActiveModal('youtube');
      onLogActivity({
        type: 'free_activity',
        title: 'Approved YouTube opened',
        details: 'Educational videos',
      });
    } else if (act === 'move') {
      if (exerciseId) setSelectedExerciseId(exerciseId);
      ReminderScheduler.setActivity('movement');
      setActiveModal('move');
      onLogActivity({
        type: 'free_activity',
        title: 'Exercise Demonstration & Movement Break started',
        details: 'Visual movement demonstration and active break',
      });
    } else if (act === 'explore') {
      ReminderScheduler.setActivity('study');
      setActiveModal('explore');
    } else if (act === 'chat') {
      ReminderScheduler.setActivity('voice');
      // Focus guide input
      const el = document.getElementById('child-guide-input');
      el?.focus();
    }
  };

  return (
    <div
      className={`mx-auto transition-all ${
        mobileFrame
          ? 'max-w-[430px] my-4 rounded-[40px] border-[10px] border-slate-900 bg-slate-100/90 shadow-2xl p-3 pb-8 overflow-hidden min-h-[780px]'
          : 'max-w-3xl px-4 py-5'
      }`}
    >
      {/* Mobile Frame Speaker / Camera Notch if mobile frame */}
      {mobileFrame && (
        <div className="w-32 h-4 bg-slate-900 rounded-full mx-auto mb-3 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-800" />
        </div>
      )}

      {/* Child Space Header */}
      <div className="flex items-center justify-between gap-3 mb-4 px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>Hey {childProfile.name}!</span>
            <span className="inline-block animate-wave">👋</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {getScenarioGreeting(timeScenario)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2.5 py-1 rounded-2xl shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-bold text-slate-800">
            {getScenarioTimeString(timeScenario)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Active Voice Timer Banner (Displays 1-minute reminders, countdowns, pause/cancel) */}
        <ActiveTimerBanner />

        {/* 1. Real-Time AI Voice Conversation Experience (Primary Interaction Hub) */}
        <EchoRealtimeVoice
          childProfile={childProfile}
          timeScenario={timeScenario}
          soundEnabled={soundEnabled}
          tasks={tasks}
          otherSchedules={childProfile.otherSchedules || []}
          onActivitySelect={handleSelectActivity}
          onLogInteraction={(title, details) =>
            onLogActivity({ type: 'ai_voice', title, details })
          }
          onObservationRecorded={onAddObservation}
        />

        {/* 2. Fun Creative & Break Spaces (Empowering the child with choice, not chore checklists) */}
        <ActivityChoicesGrid onSelectActivity={handleSelectActivity} />
      </div>

      {/* Activity Modals */}
      {activeModal === 'study' && activeTaskForStudy && (
        <StudySessionModal
          task={activeTaskForStudy}
          materials={materials}
          childProfile={childProfile}
          soundEnabled={soundEnabled}
          onClose={closeModal}
          onCompleteTask={handleCompleteTask}
          onPostponeTask={handlePostponeTask}
          onAddObservation={onAddObservation}
          onLogHelpRequest={(question, subject) =>
            onLogActivity({
              type: 'help_request',
              title: `Asked help: "${question}"`,
              details: `Subject: ${subject}`,
            })
          }
        />
      )}

      {activeModal === 'drawing' && (
        <DrawingStudioModal
          onClose={closeModal}
          onLogDrawing={(minutes) =>
            onLogActivity({
              type: 'free_activity',
              title: 'Drawing Studio completed',
              details: `Doodled for ${minutes} minutes`,
            })
          }
        />
      )}

      {activeModal === 'youtube' && (
        <YouTubeModal
          onClose={closeModal}
          onLogWatch={(title) =>
            onLogActivity({
              type: 'free_activity',
              title: `Watched: ${title}`,
              details: 'Approved YouTube Channel',
            })
          }
        />
      )}

      {activeModal === 'move' && (
        <MoveBreakModal
          initialExerciseId={selectedExerciseId}
          onClose={closeModal}
          onLogMove={(minutes) =>
            onLogActivity({
              type: 'free_activity',
              title: 'Brain & Movement Break',
              details: `Active break for ${minutes} minutes`,
            })
          }
        />
      )}

      {activeModal === 'explore' && (
        <ExploreAppsModal
          onClose={closeModal}
          approvedApps={approvedApps}
        />
      )}

      {/* Wellness & Activity-Aware Break Trigger Modal */}
      <WellnessBreakModal
        trigger={wellnessTrigger}
        onClose={() => setWellnessTrigger(null)}
      />
    </div>
  );
};

function getScenarioTimeString(scenario: TimeScenario): string {
  switch (scenario) {
    case 'morning':
      return '7:30 AM';
    case 'after_school':
      return '3:30 PM';
    case 'pre_study':
      return '4:50 PM';
    case 'study_time':
      return '5:05 PM';
    case 'free_time':
      return '6:15 PM';
    case 'evening':
      return '8:00 PM';
    case 'bedtime':
      return '9:30 PM';
  }
}

function getScenarioGreeting(scenario: TimeScenario): string {
  switch (scenario) {
    case 'morning':
      return 'Morning readiness & school prep';
    case 'after_school':
      return 'Welcome home from school! Relax or recharge.';
    case 'pre_study':
      return 'Maths is coming up soon at 5:00 PM.';
    case 'study_time':
      return 'Time for Chapter 4 Maths exercises.';
    case 'free_time':
      return 'Free time! Draw, watch approved videos, or unwind.';
    case 'evening':
      return 'Evening Science chapter revision.';
    case 'bedtime':
      return 'Winding down for peaceful sleep.';
  }
}

import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  BookOpen,
  CheckSquare,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  ChildProfile,
  TaskItem,
  LearningMaterial,
  Subject,
  ActivityLog,
  InterventionStats,
  ApprovedApp,
  DailyObservation,
  ResponsibilitySchedule,
} from '../../types';
import { TodaysSnapshotTab } from './TodaysSnapshotTab';
import { IndependenceTrendsTab } from './IndependenceTrendsTab';
import { LearningMaterialsTab } from './LearningMaterialsTab';
import { TasksManagerTab } from './TasksManagerTab';
import { ApprovedAppsTab } from './ApprovedAppsTab';
import { ChildProfileTab } from './ChildProfileTab';

interface ParentDashboardProps {
  childProfile: ChildProfile;
  tasks: TaskItem[];
  materials: LearningMaterial[];
  subjects: Subject[];
  activityLogs: ActivityLog[];
  observations?: DailyObservation[];
  responsibilitySchedule?: ResponsibilitySchedule;
  interventionStats: InterventionStats;
  approvedApps: ApprovedApp[];
  parentRemindersCount: number;
  onAddTask: (newTask: Omit<TaskItem, 'id' | 'status' | 'remindersGiven' | 'isCompleted'>) => void;
  onDeleteTask: (id: string) => void;
  onAddMaterial: (newMat: Omit<LearningMaterial, 'id' | 'createdAt'>) => void;
  onDeleteMaterial: (id: string) => void;
  onToggleApp: (id: string, isAllowed: boolean) => void;
  onUpdateProfile: (updated: Partial<ChildProfile>) => void;
  onUpdateSchedule?: (schedule: ResponsibilitySchedule) => void;
}

type ParentTab = 'snapshot' | 'trends' | 'materials' | 'tasks' | 'apps' | 'profile';

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  childProfile,
  tasks,
  materials,
  subjects,
  activityLogs,
  observations = [],
  responsibilitySchedule,
  interventionStats,
  approvedApps,
  parentRemindersCount,
  onAddTask,
  onDeleteTask,
  onAddMaterial,
  onDeleteMaterial,
  onToggleApp,
  onUpdateProfile,
  onUpdateSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<ParentTab>('snapshot');

  const tabs: Array<{ id: ParentTab; label: string; icon: any }> = [
    { id: 'snapshot', label: "Today's Snapshot", icon: LayoutDashboard },
    { id: 'trends', label: 'Independence Trends', icon: TrendingUp },
    { id: 'materials', label: 'Learning Materials', icon: BookOpen },
    { id: 'tasks', label: 'Responsibilities', icon: CheckSquare },
    { id: 'apps', label: 'Approved Apps', icon: ShieldCheck },
    { id: 'profile', label: "My Child's Routine & Rhythm", icon: User },
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`parent-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'snapshot' && (
        <TodaysSnapshotTab
          childProfile={childProfile}
          tasks={tasks}
          activityLogs={activityLogs}
          observations={observations}
          parentRemindersCount={parentRemindersCount}
        />
      )}

      {activeTab === 'trends' && (
        <IndependenceTrendsTab
          stats={interventionStats}
          childProfile={childProfile}
        />
      )}

      {activeTab === 'materials' && (
        <LearningMaterialsTab
          materials={materials}
          subjects={subjects}
          onAddMaterial={onAddMaterial}
          onDeleteMaterial={onDeleteMaterial}
        />
      )}

      {activeTab === 'tasks' && (
        <TasksManagerTab
          tasks={tasks}
          materials={materials}
          subjects={subjects}
          responsibilitySchedule={responsibilitySchedule}
          onAddTask={onAddTask}
          onDeleteTask={onDeleteTask}
          onUpdateSchedule={onUpdateSchedule}
        />
      )}

      {activeTab === 'apps' && (
        <ApprovedAppsTab
          approvedApps={approvedApps}
          onToggleApp={onToggleApp}
        />
      )}

      {activeTab === 'profile' && (
        <ChildProfileTab
          childProfile={childProfile}
          subjects={subjects}
          onUpdateProfile={onUpdateProfile}
        />
      )}
    </div>
  );
};

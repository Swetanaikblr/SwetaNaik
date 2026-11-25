export const DEMO_PARENT_PIN = '1234';

export interface EverydayRoutineItem {
  id: string;
  task: string;
  completeBy: string; // e.g. "07:00 AM"
  frequency: string;  // e.g. "Every day"
  isObservable: boolean; // Can platform observe this directly?
  enabled: boolean;
  notes?: string;
  reportedStatus?: 'pending' | 'child_reported' | 'platform_observed';
  reportedValue?: string; // e.g. "Reported by child: 6:45 AM"
}

export type OtherScheduleCategory =
  | 'Sports'
  | 'Tuition / Academic'
  | 'Music & Arts'
  | 'Hobby'
  | 'Chores'
  | 'Other';

export interface OtherScheduleItem {
  id: string;
  title: string;          // e.g. "Football Practice", "Maths Tuition"
  days: string[];         // e.g. ["Mon", "Wed", "Fri"]
  startTime: string;      // e.g. "16:00" / "4:00 PM"
  endTime: string;        // e.g. "17:15" / "5:15 PM"
  category: OtherScheduleCategory;
  locationOrDetail?: string; // e.g. "Oakridge School Grounds"
  notes?: string;         // e.g. "Carry football boots and water bottle"
  enabled: boolean;
}

export interface ChildProfile {
  name: string;
  age: number;
  grade: string;
  schoolName?: string;
  schoolStartTime: string; // e.g. "08:00"
  schoolEndTime: string;   // e.g. "15:00"
  wakeUpType: 'exact' | 'approximate';
  wakeUpTime: string;      // e.g. "06:30"
  wakeUpRange?: string;    // e.g. "Usually between 6:15 AM and 6:30 AM"
  bedtime: string;         // e.g. "22:00"
  avatar: string;
  normalDayDescription?: string; // Parent free-text description of child's day & habits
  everydayRoutines?: EverydayRoutineItem[];
  otherSchedules?: OtherScheduleItem[];
}

export interface ConversationSessionState {
  sessionId: string;
  sessionActive: boolean;
  sessionStartedAt: string;
  turnNumber: number;
  currentTimeContext: string;
  scenario: TimeScenario;
  currentTopic: string | null;
  currentSubTopic: string | null;
  currentIntent: string | null;
  currentActivity: string | null;
  currentSubject: string | null;
  currentMood: string | null;
  lastChildUtterance: string | null;
  lastAIResponse: string | null;
  lastAIQuestion: string | null;
  knownFacts: string[];
  discussedTopics: string[];
  questionsAsked: string[];
  questionsAnswered: string[];
  unresolvedTopics: string[];
  recentAIResponses: string[];
  childPreferences: string[];
  sessionOutcome: string | null;
  openingDelivered: boolean;
}

export interface UnifiedChildContext {
  profile: ChildProfile;
  age: number;
  grade: string;
  currentActivity: string | null;
  currentModule: 'CHAT' | 'LEARN' | 'TASKS' | 'PLAY' | 'DRAW' | 'EXPLORE' | 'MOVE';
  tasks: TaskItem[];
  routines: EverydayRoutineItem[];
  otherSchedules: OtherScheduleItem[];
  learningContext?: {
    activeSubject?: string;
    activeTopic?: string;
    materials?: LearningMaterial[];
  };
  recentActivity: ActivityLog[];
  independenceSignals: {
    selfInitiatedCount: number;
    parentRemindersCount: number;
  };
  conversationState: ConversationSessionState;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  iconName: string;
}

export type MaterialType = 'link' | 'pdf' | 'photo' | 'notes';

export interface LearningMaterial {
  id: string;
  subjectId: string;
  chapter: string;
  topic: string;
  type: MaterialType;
  title: string;
  url?: string;
  contentText: string;
  summary?: string;
  imageUrl?: string;
  createdAt: string;
}

export type TaskCategory =
  | 'Homework'
  | 'Study'
  | 'Exercise'
  | 'Chore'
  | 'Personal responsibility'
  | 'School preparation'
  | 'Other';

export type TaskPriority = 'Important' | 'Normal' | 'Optional';

export interface DayResponsibility {
  id: string;
  title: string;
  category: TaskCategory;
  expectedStart?: string; // e.g. "17:00" / "5:00 PM"
  expectedCompletion: string; // e.g. "18:00" / "6:00 PM"
  durationMinutes?: number; // e.g. 45
  priority: TaskPriority;
  notesForAI?: string; // Private instructions for AI guide, not shown to child
  subjectId?: string;
  materialIds?: string[];
  status: 'not_discussed' | 'started' | 'completed' | 'postponed' | 'child_reported';
  outcomeNote?: string;
  actualDuration?: number;
}

export interface ResponsibilitySchedule {
  useSameWeekday: boolean; // Option 1: same Monday to Friday
  weekdayResponsibilities: DayResponsibility[];
  dayResponsibilities: {
    monday: DayResponsibility[];
    tuesday: DayResponsibility[];
    wednesday: DayResponsibility[];
    thursday: DayResponsibility[];
    friday: DayResponsibility[];
    saturday: DayResponsibility[];
    sunday: DayResponsibility[];
  };
}

export type TaskFrequency =
  | 'Once'
  | 'Daily'
  | 'Weekdays'
  | 'Weekly'
  | 'Custom';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'postponed';

export type TaskStartMode =
  | 'independent'
  | 'one_prompt'
  | 'multiple_prompts'
  | 'parent_intervention';

export interface TaskItem {
  id: string;
  title: string;
  subjectId?: string;
  category: TaskCategory;
  startTime: string; // "17:00"
  endTime: string;   // "18:00"
  frequency: TaskFrequency;
  instructions?: string;
  notesForAI?: string;
  materialIds?: string[];
  status: TaskStatus;
  isCompleted?: boolean;
  startMode?: TaskStartMode;
  completedAt?: string;
  actualEndTime?: string;
  postponedReason?: string;
  remindersGiven: number;
  durationMinutes?: number;
}

export interface ApprovedApp {
  id: string;
  name: string;
  category: string;
  iconName?: string;
  icon?: string;
  allowed?: boolean;
  isAllowed?: boolean;
  description: string;
  url?: string;
  timeLimitMinutes?: number;
  internalTool?: 'drawing' | 'youtube' | 'chat' | 'calculator' | 'reading';
}

export interface YouTubeItem {
  id: string;
  title: string;
  channel: string;
  videoId: string;
  thumbnail: string;
  duration: string;
  subject?: string;
  allowed?: boolean;
}

export type ObservationSource = 'child_reported' | 'platform_observed' | 'parent_configured';

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  details?: string;
  durationMinutes?: number;
  initiatedBy?: 'child' | 'prompt' | 'parent';
  sourceCategory?: ObservationSource;
}

export interface DailyObservation {
  id: string;
  time: string;
  source: ObservationSource;
  title: string;
  detail: string;
  category: 'routine' | 'after_school' | 'learning' | 'responsibility' | 'mood';
}

export interface InterventionStats {
  todayParentReminders: number;
  todayChildInitiated: number;
  todayCompleted: number;
  weeklyTrend: {
    lastWeekReminders: number;
    thisWeekReminders: number;
    days: Array<{
      day: string;
      childInitiated: number;
      parentReminders: number;
    }>;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'child' | 'system';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  audioPlayed?: boolean;
}

export type TimeScenario =
  | 'morning'        // 07:30 AM Ready for school
  | 'after_school'   // 03:30 PM Just got home
  | 'pre_study'      // 04:50 PM 10 mins before Maths
  | 'study_time'     // 05:05 PM Active Maths homework
  | 'free_time'      // 06:15 PM Draw / move / relax
  | 'evening'        // 08:00 PM Science study
  | 'bedtime';       // 09:30 PM Prep school bag

export interface TimeContext {
  simulatedTime: string; // "15:30"
  scenario: TimeScenario;
  label: string;
  isSimulated: boolean;
}

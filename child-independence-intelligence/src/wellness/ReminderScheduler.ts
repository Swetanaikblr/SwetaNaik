// Stateful ReminderScheduler with Smart Activity-Aware Break Triggers
import { ObservationStore } from '../observations/ObservationStore';

export type ActivityMode =
  | 'idle'
  | 'study'
  | 'drawing'
  | 'youtube'
  | 'movement'
  | 'voice';

export type BreakType =
  | 'eye_rest_20'
  | 'posture_stretch'
  | 'hydration'
  | 'movement_recharge'
  | 'study_pause';

export interface WellnessTriggerEvent {
  id: string;
  type: BreakType;
  title: string;
  message: string;
  suggestedDurationSeconds: number;
  activityContext: ActivityMode;
  timestamp: string;
  canSnooze: boolean;
}

export interface ReminderSchedulerConfig {
  studyPomodoroMinutes: number; // default: 25
  screenTimeMaxMinutes: number; // default: 35
  hydrationIntervalMinutes: number; // default: 45
  eyeRestIntervalMinutes: number; // default: 20
}

const DEFAULT_CONFIG: ReminderSchedulerConfig = {
  studyPomodoroMinutes: 25,
  screenTimeMaxMinutes: 35,
  hydrationIntervalMinutes: 45,
  eyeRestIntervalMinutes: 20,
};

const STORAGE_KEY = 'childindi_reminder_scheduler_v2';

class ReminderSchedulerImpl {
  private config: ReminderSchedulerConfig = DEFAULT_CONFIG;
  private currentActivity: ActivityMode = 'idle';
  private activityStartTime: number = Date.now();
  private accumulatedScreenSeconds: number = 0;
  private continuousStudySeconds: number = 0;
  private lastEyeRestTime: number = Date.now();
  private lastHydrationTime: number = Date.now();

  private activeTrigger: WellnessTriggerEvent | null = null;
  private listeners: Set<(event: WellnessTriggerEvent | null) => void> = new Set();
  private timerInterval: any = null;

  constructor() {
    this.loadState();
    this.startHeartbeat();
  }

  private loadState(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.accumulatedScreenSeconds = parsed.accumulatedScreenSeconds || 0;
        this.continuousStudySeconds = parsed.continuousStudySeconds || 0;
      }
    } catch {}
  }

  private persistState(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          accumulatedScreenSeconds: this.accumulatedScreenSeconds,
          continuousStudySeconds: this.continuousStudySeconds,
          lastUpdated: Date.now(),
        })
      );
    } catch {}
  }

  private startHeartbeat(): void {
    if (typeof window === 'undefined') return;
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Called on every heartbeat tick to calculate fatigue and check triggers
   */
  private tick(): void {
    if (this.currentActivity === 'idle') return;

    // Weight factor based on activity
    let multiplier = 1.0;
    if (this.currentActivity === 'youtube') multiplier = 1.4; // Screen-heavy video
    if (this.currentActivity === 'study') multiplier = 1.2; // Intense cognitive load
    if (this.currentActivity === 'drawing') multiplier = 1.1; // Visual focus
    if (this.currentActivity === 'movement') multiplier = 0.0; // Restorative

    const elapsedSeconds = 5;
    this.accumulatedScreenSeconds += elapsedSeconds * multiplier;

    if (this.currentActivity === 'study') {
      this.continuousStudySeconds += elapsedSeconds;
    } else {
      this.continuousStudySeconds = Math.max(0, this.continuousStudySeconds - elapsedSeconds * 0.5);
    }

    // 1. Check Pomodoro study duration limit (25 minutes)
    const studyThresholdSec = this.config.studyPomodoroMinutes * 60;
    if (this.continuousStudySeconds >= studyThresholdSec && !this.activeTrigger) {
      this.dispatchTrigger({
        id: 'trigger-pomodoro-' + Date.now(),
        type: 'study_pause',
        title: '25-Minute Study Milestone 🌟',
        message:
          'Great focus on your studies! Want to stand up, stretch your arms, and give your brain a quick 2-minute refresh?',
        suggestedDurationSeconds: 120,
        activityContext: this.currentActivity,
        timestamp: new Date().toISOString(),
        canSnooze: true,
      });
      return;
    }

    // 2. Check 20-20-20 Eye Rest Rule
    const eyeRestThreshold = this.config.eyeRestIntervalMinutes * 60 * 1000;
    if (Date.now() - this.lastEyeRestTime > eyeRestThreshold && !this.activeTrigger) {
      this.dispatchTrigger({
        id: 'trigger-eye-' + Date.now(),
        type: 'eye_rest_20',
        title: 'Eye Relaxation Pause (20-20-20)',
        message: 'Rest your eyes! Look at an object 20 feet away out of the window for 20 seconds.',
        suggestedDurationSeconds: 20,
        activityContext: this.currentActivity,
        timestamp: new Date().toISOString(),
        canSnooze: true,
      });
      return;
    }

    // 3. Check Overall Continuous Screen Time (35 minutes)
    const maxScreenSec = this.config.screenTimeMaxMinutes * 60;
    if (this.accumulatedScreenSeconds >= maxScreenSec && !this.activeTrigger) {
      this.dispatchTrigger({
        id: 'trigger-screen-' + Date.now(),
        type: 'movement_recharge',
        title: 'Recharge Time! 🏃',
        message:
          'You’ve had a great active screen session. How about a 5-minute movement break or quick water refill?',
        suggestedDurationSeconds: 300,
        activityContext: this.currentActivity,
        timestamp: new Date().toISOString(),
        canSnooze: true,
      });
    }

    this.persistState();
  }

  /**
   * Sets current child activity
   */
  public setActivity(activity: ActivityMode): void {
    if (this.currentActivity === activity) return;

    // If switching to movement, relieve accumulated fatigue
    if (activity === 'movement') {
      this.accumulatedScreenSeconds = Math.max(0, this.accumulatedScreenSeconds - 600); // 10 min credit
      this.continuousStudySeconds = 0;
      ObservationStore.addObservation({
        title: 'Active movement break taken',
        detail: 'Child initiated physical movement break to recharge energy.',
        category: 'wellbeing',
        source: 'timer_trigger',
      });
    }

    this.currentActivity = activity;
    this.activityStartTime = Date.now();
  }

  public getActivity(): ActivityMode {
    return this.currentActivity;
  }

  /**
   * Schedules or dispatches a manual break trigger (e.g. via Gemini Live tool call)
   */
  public scheduleBreak(delayMinutes: number, reason: string, breakType: BreakType = 'movement_recharge'): void {
    if (delayMinutes <= 0) {
      this.dispatchTrigger({
        id: 'trigger-tool-' + Date.now(),
        type: breakType,
        title: 'Gentle Break Suggestion',
        message: reason,
        suggestedDurationSeconds: 180,
        activityContext: this.currentActivity,
        timestamp: new Date().toISOString(),
        canSnooze: true,
      });
    } else {
      setTimeout(() => {
        this.dispatchTrigger({
          id: 'trigger-tool-delay-' + Date.now(),
          type: breakType,
          title: 'Scheduled Wellness Pause',
          message: reason,
          suggestedDurationSeconds: 180,
          activityContext: this.currentActivity,
          timestamp: new Date().toISOString(),
          canSnooze: true,
        });
      }, delayMinutes * 60 * 1000);
    }
  }

  /**
   * Dispatches trigger event to UI listeners
   */
  private dispatchTrigger(event: WellnessTriggerEvent): void {
    this.activeTrigger = event;
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch (err) {
        console.error('Trigger listener error:', err);
      }
    });

    // Record observation for parent visibility
    ObservationStore.addObservation({
      title: event.title,
      detail: `${event.title} triggered after ${Math.round(this.accumulatedScreenSeconds / 60)} min active screen use.`,
      category: 'wellbeing',
      source: 'timer_trigger',
    });
  }

  /**
   * Accepts and completes the break
   */
  public completeBreak(): void {
    this.activeTrigger = null;
    this.accumulatedScreenSeconds = Math.max(0, this.accumulatedScreenSeconds - 900); // 15 min credit
    this.continuousStudySeconds = 0;
    this.lastEyeRestTime = Date.now();
    this.lastHydrationTime = Date.now();
    this.notify(null);
    this.persistState();

    ObservationStore.addObservation({
      title: 'Completed wellness break',
      detail: 'Child acknowledged and completed healthy screen pause independently.',
      category: 'wellbeing',
      source: 'timer_trigger',
    });
  }

  /**
   * Snoozes the trigger for 5 minutes (respecting child flow state)
   */
  public snoozeBreak(minutes = 5): void {
    this.activeTrigger = null;
    this.notify(null);

    setTimeout(() => {
      if (!this.activeTrigger && this.currentActivity !== 'idle') {
        this.dispatchTrigger({
          id: 'trigger-snoozed-' + Date.now(),
          type: 'movement_recharge',
          title: 'Ready for that gentle pause? 😊',
          message: 'Your 5-minute buffer is up. Want to take that quick stretch or water refill now?',
          suggestedDurationSeconds: 120,
          activityContext: this.currentActivity,
          timestamp: new Date().toISOString(),
          canSnooze: false,
        });
      }
    }, minutes * 60 * 1000);
  }

  public dismissTrigger(): void {
    this.activeTrigger = null;
    this.notify(null);
  }

  public getActiveTrigger(): WellnessTriggerEvent | null {
    return this.activeTrigger;
  }

  public getStats() {
    return {
      currentActivity: this.currentActivity,
      accumulatedScreenMinutes: Math.round(this.accumulatedScreenSeconds / 60),
      continuousStudyMinutes: Math.round(this.continuousStudySeconds / 60),
    };
  }

  public subscribe(listener: (event: WellnessTriggerEvent | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.activeTrigger);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: WellnessTriggerEvent | null): void {
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch {}
    });
  }
}

export const ReminderScheduler = new ReminderSchedulerImpl();

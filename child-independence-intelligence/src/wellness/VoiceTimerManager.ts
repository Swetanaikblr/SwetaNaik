// VoiceTimerManager: Reactive voice and text timer scheduler for child companion
import { ObservationStore } from '../observations/ObservationStore';
import { playChime, speakText } from '../utils/speech';

export interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  createdAt: number;
}

export interface VoiceTimerEvent {
  type: 'started' | 'tick' | 'paused' | 'resumed' | 'completed' | 'cancelled';
  timer: ActiveTimer;
}

class VoiceTimerManagerImpl {
  private timers: ActiveTimer[] = [];
  private tickerInterval: any = null;
  private listeners: Set<(timers: ActiveTimer[]) => void> = new Set();
  private childName: string = 'Aarav';

  constructor() {
    this.startTicker();
  }

  public setChildName(name: string) {
    if (name) this.childName = name;
  }

  /**
   * Sets a new voice timer
   * @param durationSeconds Duration in seconds (e.g. 60 for 1 min)
   * @param label Descriptive label like "1-minute reminder"
   */
  public setTimer(durationSeconds: number, label: string = 'Reminder'): ActiveTimer {
    const validSeconds = Math.max(5, Math.round(durationSeconds));
    const newTimer: ActiveTimer = {
      id: 'timer-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      label: label.trim() || `${Math.round(validSeconds / 60)} min reminder`,
      totalSeconds: validSeconds,
      remainingSeconds: validSeconds,
      isRunning: true,
      createdAt: Date.now(),
    };

    // Remove any previously expired timers, keep active ones
    this.timers = [newTimer, ...this.timers.filter((t) => t.remainingSeconds > 0)];
    this.notify();

    // Play cheerful confirmation chime
    try {
      playChime('listen_start');
    } catch {}

    // Record observation in Parent Dashboard
    ObservationStore.addObservation({
      title: `Set ${newTimer.label}`,
      detail: `Child requested a ${validSeconds}s voice timer (${newTimer.label}) independently.`,
      category: 'routine',
      source: 'child_reported',
    });

    return newTimer;
  }

  public pauseTimer(id: string): void {
    const timer = this.timers.find((t) => t.id === id);
    if (timer) {
      timer.isRunning = false;
      this.notify();
    }
  }

  public resumeTimer(id: string): void {
    const timer = this.timers.find((t) => t.id === id);
    if (timer && timer.remainingSeconds > 0) {
      timer.isRunning = true;
      this.notify();
    }
  }

  public addMinutes(id: string, minutes: number = 1): void {
    const timer = this.timers.find((t) => t.id === id);
    if (timer) {
      const added = minutes * 60;
      timer.totalSeconds += added;
      timer.remainingSeconds += added;
      timer.isRunning = true;
      this.notify();
    }
  }

  public cancelTimer(id: string): void {
    this.timers = this.timers.filter((t) => t.id !== id);
    this.notify();
  }

  public getTimers(): ActiveTimer[] {
    return [...this.timers];
  }

  public getActiveTimer(): ActiveTimer | null {
    return this.timers.find((t) => t.remainingSeconds > 0) || null;
  }

  public subscribe(listener: (timers: ActiveTimer[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.timers]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const list = [...this.timers];
    this.listeners.forEach((l) => {
      try {
        l(list);
      } catch {}
    });
  }

  private startTicker(): void {
    if (typeof window === 'undefined') return;
    if (this.tickerInterval) clearInterval(this.tickerInterval);

    this.tickerInterval = setInterval(() => {
      let changed = false;
      for (const timer of this.timers) {
        if (timer.isRunning && timer.remainingSeconds > 0) {
          timer.remainingSeconds -= 1;
          changed = true;

          if (timer.remainingSeconds <= 0) {
            timer.isRunning = false;
            this.handleTimerFinished(timer);
          }
        }
      }
      if (changed) {
        this.notify();
      }
    }, 1000);
  }

  private handleTimerFinished(timer: ActiveTimer): void {
    // Play celebratory bell alert chime
    try {
      playChime('celebrate');
    } catch {}

    // Companion voice announcement
    const message = `Ding ding! Time is up for your ${timer.label}, ${this.childName}! Great job staying on track!`;
    try {
      speakText(message);
    } catch {}

    // Record completed observation in parent dashboard
    ObservationStore.addObservation({
      title: `Completed ${timer.label}`,
      detail: `Voice timer finished successfully. Child was reminded by voice companion.`,
      category: 'routine',
      source: 'timer_trigger',
    });
  }
}

export const VoiceTimerManager = new VoiceTimerManagerImpl();

/**
 * Parses user speech or text for timer and reminder commands
 * Examples:
 * - "remind after 1 minute"
 * - "remind me in 1 minute"
 * - "set timer for 1 minute"
 * - "set a timer for 2 minutes"
 * - "timer 1 min"
 * - "remind after 30 seconds"
 */
export function parseTimerCommand(text: string): { durationSeconds: number; label: string; minutes: number } | null {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  // Pattern 1: seconds (e.g. "30 seconds", "45 secs")
  const secMatch = lower.match(/(?:timer|remind|alarm).*?(\d+)\s*(?:sec|second|seconds)/);
  if (secMatch) {
    const seconds = parseInt(secMatch[1], 10);
    if (!isNaN(seconds) && seconds > 0) {
      return {
        durationSeconds: seconds,
        minutes: Math.round((seconds / 60) * 10) / 10,
        label: `${seconds}-second reminder`,
      };
    }
  }

  // Pattern 2: minutes (e.g. "remind after 1 minute", "remind after 1 min", "set timer for 1 min", "in 2 minutes")
  const minMatch =
    lower.match(/(?:remind|timer|alarm).*?(\d+(?:\.\d+)?)\s*(?:min|minute|minutes)/) ||
    lower.match(/(\d+(?:\.\d+)?)\s*(?:min|minute|minutes)\s*(?:timer|reminder)?/);
  if (minMatch) {
    const mins = parseFloat(minMatch[1]);
    if (!isNaN(mins) && mins > 0) {
      const durationSeconds = Math.round(mins * 60);
      let label = `${mins === 1 ? '1 minute' : mins + ' min'} reminder`;
      if (lower.includes('study') || lower.includes('math')) label = `${mins} min study reminder`;
      else if (lower.includes('break') || lower.includes('move') || lower.includes('exercise')) label = `${mins} min exercise reminder`;
      else if (lower.includes('snack') || lower.includes('water')) label = `${mins} min snack reminder`;

      return {
        durationSeconds,
        minutes: mins,
        label,
      };
    }
  }

  // Pattern 3: phrases with 'a minute' or 'one minute' or '1 minute'
  if (
    lower.includes('a minute') ||
    lower.includes('one minute') ||
    lower.includes('1 minute') ||
    lower.includes('1 min') ||
    lower.includes('remind after 1') ||
    lower.includes('remind me in 1')
  ) {
    let label = '1 minute reminder';
    if (lower.includes('exercise') || lower.includes('move')) label = '1 min exercise reminder';
    else if (lower.includes('study')) label = '1 min study reminder';
    return {
      durationSeconds: 60,
      minutes: 1,
      label,
    };
  }

  // Pattern 4: word numbers like "two minutes", "five minutes"
  const wordMap: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    ten: 10,
    fifteen: 15,
  };
  for (const [word, val] of Object.entries(wordMap)) {
    if (
      lower.includes(`${word} minute`) ||
      lower.includes(`${word} min`) ||
      (lower.includes('remind') && lower.includes(word))
    ) {
      return {
        durationSeconds: val * 60,
        minutes: val,
        label: `${val === 1 ? '1 minute' : val + ' min'} reminder`,
      };
    }
  }

  return null;
}

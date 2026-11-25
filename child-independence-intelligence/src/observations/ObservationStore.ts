// Structured Observation Domain Store with Source Validation

export type ObservationSource =
  | 'child_reported'
  | 'behavioral_inference'
  | 'routine_check'
  | 'timer_trigger';

export type ObservationCategory =
  | 'routine'
  | 'learning'
  | 'wellbeing'
  | 'after_school'
  | 'responsibility';

export interface StructuredObservation {
  id: string;
  timestamp: string;
  timeDisplay: string;
  title: string;
  detail: string;
  category: ObservationCategory;
  source: ObservationSource;
  confidenceScore: number; // 0.0 - 1.0
  verified: boolean;
  parentAcknowledged: boolean;
  rawChildQuote?: string;
}

export interface NewObservationInput {
  title: string;
  detail: string;
  category: ObservationCategory;
  source: ObservationSource;
  rawChildQuote?: string;
  confidenceScore?: number;
  timeDisplay?: string;
}

const STORAGE_KEY = 'childindi_structured_observations_v2';

// Seed initial observations
const INITIAL_OBSERVATIONS: StructuredObservation[] = [
  {
    id: 'obs-seed-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    timeDisplay: '3:05 PM',
    title: 'School arrival reported',
    detail: 'Aarav mentioned arriving home at 3:00 PM and watching TV.',
    category: 'after_school',
    source: 'child_reported',
    confidenceScore: 0.95,
    verified: true,
    parentAcknowledged: true,
    rawChildQuote: 'I got back at 3 and watched TV',
  },
  {
    id: 'obs-seed-2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    timeDisplay: '5:00 PM',
    title: 'Independent login without prompt',
    detail: 'Logged into Child Space on own device at 5:00 PM.',
    category: 'routine',
    source: 'routine_check',
    confidenceScore: 1.0,
    verified: true,
    parentAcknowledged: false,
  },
  {
    id: 'obs-seed-3',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    timeDisplay: '5:05 PM',
    title: 'Initiated Chapter 4 Maths exercises',
    detail: 'Chose to open Homework Study session following gentle guide question.',
    category: 'learning',
    source: 'child_reported',
    confidenceScore: 0.98,
    verified: true,
    parentAcknowledged: false,
    rawChildQuote: 'I want to finish my maths notes',
  },
];

class ObservationStoreImpl {
  private observations: StructuredObservation[] = [];
  private listeners: Set<(observations: StructuredObservation[]) => void> = new Set();
  private isLoaded = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      this.observations = [...INITIAL_OBSERVATIONS];
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.observations = JSON.parse(stored);
      } else {
        this.observations = [...INITIAL_OBSERVATIONS];
        this.persist();
      }
    } catch {
      this.observations = [...INITIAL_OBSERVATIONS];
    }
    this.isLoaded = true;
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.observations));
    } catch {}
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.observations]);
      } catch (e) {
        console.error('Observation listener notification error:', e);
      }
    });
  }

  /**
   * Validates source, category and calculates confidence score
   */
  public validateObservation(input: NewObservationInput): {
    isValid: boolean;
    sanitized: StructuredObservation;
    validationNotes: string[];
  } {
    const notes: string[] = [];

    // Category validation
    const validCategories: ObservationCategory[] = [
      'routine',
      'learning',
      'wellbeing',
      'after_school',
      'responsibility',
    ];
    const category: ObservationCategory = validCategories.includes(input.category)
      ? input.category
      : 'routine';

    // Source validation & confidence calibration
    let confidence = input.confidenceScore ?? 0.85;
    let verified = false;

    switch (input.source) {
      case 'child_reported':
        // Direct child statements have high veracity but can be imprecise on exact minutes
        confidence = Math.max(confidence, 0.92);
        verified = true;
        notes.push('Source validated: Direct child disclosure');
        break;
      case 'timer_trigger':
        // Clock events are 100% deterministic
        confidence = 1.0;
        verified = true;
        notes.push('Source validated: Hardware timer deterministic trigger');
        break;
      case 'routine_check':
        confidence = Math.max(confidence, 0.95);
        verified = true;
        notes.push('Source validated: Routine threshold check');
        break;
      case 'behavioral_inference':
      default:
        confidence = Math.min(confidence, 0.82);
        verified = false;
        notes.push('Source validated: Inferred behavioral pattern');
        break;
    }

    const sanitizedTitle = (input.title || 'Routine observation')
      .slice(0, 80)
      .trim();

    const sanitizedDetail = (input.detail || 'Recorded during session')
      .slice(0, 300)
      .trim();

    const now = new Date();
    const timeDisplay =
      input.timeDisplay ||
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const observation: StructuredObservation = {
      id: 'obs-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: now.toISOString(),
      timeDisplay,
      title: sanitizedTitle,
      detail: sanitizedDetail,
      category,
      source: input.source,
      confidenceScore: Math.round(confidence * 100) / 100,
      verified,
      parentAcknowledged: false,
      rawChildQuote: input.rawChildQuote,
    };

    return {
      isValid: sanitizedTitle.length > 0,
      sanitized: observation,
      validationNotes: notes,
    };
  }

  /**
   * Adds and persists a new structured observation
   */
  public addObservation(input: NewObservationInput): StructuredObservation {
    const { sanitized } = this.validateObservation(input);

    // Prevent identical duplicates in close succession (< 30 seconds)
    const existing = this.observations.find(
      (o) =>
        o.title === sanitized.title &&
        Math.abs(new Date(o.timestamp).getTime() - new Date(sanitized.timestamp).getTime()) < 30000
    );

    if (existing) {
      return existing;
    }

    this.observations = [sanitized, ...this.observations.slice(0, 99)];
    this.persist();
    this.notify();
    return sanitized;
  }

  /**
   * Returns all current observations
   */
  public getObservations(): StructuredObservation[] {
    if (!this.isLoaded) this.loadFromStorage();
    return [...this.observations];
  }

  /**
   * Filter observations by category
   */
  public getByCategory(category: ObservationCategory): StructuredObservation[] {
    return this.getObservations().filter((o) => o.category === category);
  }

  /**
   * Filter observations by source
   */
  public getBySource(source: ObservationSource): StructuredObservation[] {
    return this.getObservations().filter((o) => o.source === source);
  }

  /**
   * Marks an observation as acknowledged by parent
   */
  public acknowledgeObservation(id: string): void {
    let changed = false;
    this.observations = this.observations.map((o) => {
      if (o.id === id && !o.parentAcknowledged) {
        changed = true;
        return { ...o, parentAcknowledged: true };
      }
      return o;
    });

    if (changed) {
      this.persist();
      this.notify();
    }
  }

  /**
   * Subscribes to observation updates
   */
  public subscribe(listener: (observations: StructuredObservation[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.observations]);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const ObservationStore = new ObservationStoreImpl();

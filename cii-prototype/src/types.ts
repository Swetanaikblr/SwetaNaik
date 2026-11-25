export type Category = 'study' | 'create' | 'watch' | 'move' | 'askGuide' | 'explore';
export const CATEGORIES: Category[] = ['study', 'create', 'watch', 'move', 'askGuide', 'explore'];

export type AgeBand = '8-10' | '11-14';
export type TimeContext = 'afterSchool' | 'evening' | 'weekend';
export type ScenarioId = 'afterSchool' | 'lateTv' | 'mathsStudy';
export type Mode = 'participant' | 'review';

export type ImportStatus = 'Imported' | 'Importing' | 'Unsupported' | 'Failed';
export interface Material {
  id: string;
  title: string;
  format: 'Textbook' | 'Notes' | 'PDF' | 'Reading list' | 'Other';
  fileType?: string;
  importStatus: ImportStatus;
  availableToChild: boolean;
  sampleContentId?: string; // links to local sample text; uploaded files have none
  isSample: boolean;
}

export type LaunchStatus = 'in-cii' | 'outside' | 'unavailable';
export interface SourceItem {
  id: string;
  title: string;
  emoji: string;
  hue: number;
  unavailable?: boolean;
}
export interface Source {
  id: string;
  name: string;
  kind: 'Video channel' | 'App' | 'Website';
  approvedInCII: boolean;
  launch: LaunchStatus;
  items: SourceItem[];
}

export type Tone = 'warm' | 'calm' | 'playful';
export type SuggestionFrequency = 'onlyWhenAsked' | 'startOfSession' | 'atTransitions';
export interface EchoSettings {
  tone: Tone;
  contextNote: string;
  frequency: SuggestionFrequency;
  greetingEnabled: boolean;
}

export interface Creation {
  id: string;
  kind: 'drawing' | 'story';
  createdAt: number;
  dataUrl?: string;
  text?: string;
  title: string;
}

export type EventName =
  | 'session_started'
  | 'home_viewed'
  | 'echo_session_started'
  | 'echo_session_ended'
  | 'echo_suggestion_shown'
  | 'echo_suggestion_accepted'
  | 'echo_suggestion_ignored'
  | 'category_opened'
  | 'activity_started'
  | 'activity_stopped'
  | 'activity_skipped'
  | 'returned_home'
  | 'watch_unavailable_shown'
  | 'external_interstitial_shown'
  | 'snapshot_viewed'
  | 'snapshot_feedback'
  | 'child_reported_tried'
  | 'material_opened';

/** Category-level data only. No free text from the child is ever stored here. */
export interface CIIEvent {
  id: string;
  name: EventName;
  at: number;
  category?: Category;
  /** how a category was opened: own tap with no recent suggestion, tap after a suggestion, or via an Echo chip */
  via?: 'tile' | 'tile_after_echo' | 'echo_chip';
  /** short, non-personal label such as an activity id, material id or source id */
  ref?: string;
}

export interface Feedback {
  id: string;
  at: number;
  useful: 'yes' | 'somewhat' | 'no' | '';
  remove: string;
}

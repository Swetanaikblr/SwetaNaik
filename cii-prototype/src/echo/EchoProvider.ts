import type { AgeBand, Category, ScenarioId, TimeContext, Tone } from '../types';

/**
 * Adapter interface for Echo. The prototype ships only MockEchoProvider (scripted).
 * A future real voice/LLM provider would implement this same interface.
 * Do not wire a real API key into this prototype.
 */
export interface EchoContext {
  childName: string;
  ageBand: AgeBand;
  tone: Tone;
  timeContext: TimeContext;
  scenario: ScenarioId | null;
  /** categories currently offered to the child (profile x rhythm) */
  availableCategories: Category[];
  /** titles of approved, in-CII watch items (used to recognise approved requests) */
  approvedTitles: string[];
}

export interface EchoReply {
  text: string;
  /** categories offered as options. The child must tap to open; Echo never opens anything itself. */
  suggestions?: Category[];
  /** quick-reply chips */
  chips?: string[];
  /** child asked Echo to stop */
  stop?: boolean;
}

export interface EchoProvider {
  readonly label: string;
  opening(ctx: EchoContext): EchoReply;
  respond(input: string, ctx: EchoContext): Promise<EchoReply>;
}

import type { Category, CIIEvent } from '../types';
import { CATEGORIES } from '../types';

/**
 * Phase 1 metrics, derived from the local event log.
 * These are PROTOTYPE VALUES ONLY: tiny local samples, no targets, no baselines.
 * More usage is not a goal; time spent is never shown as success.
 */
export function deriveMetrics(events: CIIEvent[]) {
  const opens = events.filter((e) => e.name === 'category_opened' && e.category);
  const voluntary = opens.filter((e) => e.via === 'tile');
  const prompted = opens.filter((e) => e.via !== 'tile');
  const distinct = new Set(opens.map((e) => e.category));

  // Repeat voluntary use: sessions (after the first) that contain at least one voluntary open.
  const sessions: CIIEvent[][] = [];
  for (const e of events) {
    if (e.name === 'session_started' || sessions.length === 0) sessions.push([]);
    sessions[sessions.length - 1].push(e);
  }
  const sessionsWithVoluntary = sessions.filter((s) => s.some((e) => e.name === 'category_opened' && e.via === 'tile'));

  const balance = Object.fromEntries(CATEGORIES.map((c) => [c, opens.filter((e) => e.category === c).length])) as Record<Category, number>;

  return {
    totalOpens: opens.length,
    voluntaryOpens: voluntary.length,
    promptedOpens: prompted.length,
    voluntaryRate: opens.length ? voluntary.length / opens.length : null,
    breadth: distinct.size,
    sessions: sessions.length,
    sessionsWithVoluntary: sessionsWithVoluntary.length,
    repeatVoluntarySessions: Math.max(0, sessionsWithVoluntary.length - 1),
    balance,
    suggestionsShown: events.filter((e) => e.name === 'echo_suggestion_shown').length,
    suggestionsAccepted: events.filter((e) => e.name === 'echo_suggestion_accepted').length,
    suggestionsIgnored: events.filter((e) => e.name === 'echo_suggestion_ignored').length,
  };
}

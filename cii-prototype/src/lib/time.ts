import { SCENARIOS } from '../data/scenarios';
import { useStore } from '../store/useStore';
import type { ScenarioId, TimeContext } from '../types';

export function realContext(d = new Date()): TimeContext {
  const day = d.getDay();
  if (day === 0 || day === 6) return 'weekend';
  return d.getHours() >= 17 ? 'evening' : 'afterSchool';
}

export interface TimeInfo {
  context: TimeContext;
  timeLabel: string;
  scenario: ScenarioId | null;
  fromDemo: boolean;
}

/** Demo Guide scenario wins; otherwise the real clock. */
export function useTimeInfo(): TimeInfo {
  const scenario = useStore((s) => s.scenario);
  if (scenario) {
    const sc = SCENARIOS[scenario];
    return { context: sc.context, timeLabel: sc.timeLabel, scenario, fromDemo: true };
  }
  const now = new Date();
  return {
    context: realContext(now),
    timeLabel: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    scenario: null,
    fromDemo: false,
  };
}

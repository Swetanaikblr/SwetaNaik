import type { ScenarioId, TimeContext } from '../types';

export interface Scenario {
  id: ScenarioId;
  label: string;
  timeLabel: string;
  context: TimeContext;
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  afterSchool: { id: 'afterSchool', label: 'After School', timeLabel: '3:30 PM', context: 'afterSchool' },
  lateTv: { id: 'lateTv', label: 'Late Arrival / TV', timeLabel: '6:00 PM', context: 'evening' },
  mathsStudy: { id: 'mathsStudy', label: 'Maths / Study Prompt', timeLabel: '5:05 PM', context: 'afterSchool' },
};

export const CONTEXT_LABEL: Record<TimeContext, string> = {
  afterSchool: 'After school',
  evening: 'Evening',
  weekend: 'Weekend',
};

/** Time-aware greeting line under "Hey <name>!" */
export const CONTEXT_LINE: Record<TimeContext, string> = {
  afterSchool: 'Welcome home from school! Relax or recharge.',
  evening: 'Evening time. Something cosy, or something fun?',
  weekend: "It's the weekend! What sounds good today?",
};

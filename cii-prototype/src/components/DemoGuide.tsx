import { useNavigate } from 'react-router-dom';
import { SCENARIOS } from '../data/scenarios';
import { useStore } from '../store/useStore';
import type { ScenarioId } from '../types';
import { useTimeInfo } from '../lib/time';

/** Prototype-only scenario bar. Hidden in Participant mode. */
export function DemoGuide() {
  const mode = useStore((s) => s.mode);
  const visible = useStore((s) => s.demoGuideVisible);
  const scenario = useStore((s) => s.scenario);
  const set = useStore((s) => s.set);
  const navigate = useNavigate();
  const time = useTimeInfo();
  if (mode !== 'review') return null;

  if (!visible) {
    return (
      <div className="border-b border-dashed border-note/40 bg-note-soft/60 px-4 py-1 text-right">
        <button className="text-xs font-bold text-note underline" onClick={() => set({ demoGuideVisible: true })}>Show demo controls</button>
      </div>
    );
  }

  const choose = (id: ScenarioId) => set({ scenario: id });
  return (
    <div className="border-b-2 border-dashed border-note/50 bg-note-soft px-4 py-2" role="region" aria-label="Demo controls">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-bold uppercase tracking-wide text-note">Demo controls: not part of the product</span>
        {(Object.keys(SCENARIOS) as ScenarioId[]).map((id, i) => (
          <button
            key={id}
            onClick={() => { choose(id); navigate('/child'); }}
            aria-pressed={scenario === id}
            className={`inline-flex min-h-[44px] items-center rounded-lg border px-3 text-sm font-semibold ${scenario === id ? 'border-note bg-note text-white' : 'border-note/40 bg-card text-note hover:bg-note-soft'}`}
          >
            {i + 1}) {SCENARIOS[id].label} ({SCENARIOS[id].timeLabel})
          </button>
        ))}
        <button
          onClick={() => navigate('/parent/snapshot')}
          className="inline-flex min-h-[44px] items-center rounded-lg border border-note/40 bg-card px-3 text-sm font-semibold text-note hover:bg-note-soft"
        >
          4) Parent Snapshot
        </button>
        <span className="ml-auto text-xs text-note">
          Now: {time.timeLabel} {time.fromDemo ? '(demo)' : '(real clock)'}
        </span>
        {scenario && (
          <button className="min-h-[44px] text-xs font-bold text-note underline" onClick={() => set({ scenario: null })}>Use real clock</button>
        )}
        <button
          className="min-h-[44px] text-xs font-bold text-note underline"
          onClick={() => set({ demoGuideVisible: false, scenario: null })}
          aria-label="Hide demo controls and use the real clock"
        >
          Hide
        </button>
      </div>
    </div>
  );
}

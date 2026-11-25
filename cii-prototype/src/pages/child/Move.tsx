import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildLayout } from '../../components/ChildLayout';
import { ReviewNote } from '../../components/Badges';
import { Toggle } from '../../components/Toggle';
import { SoftTimer } from '../../components/SoftTimer';
import { MOVE_ACTIVITIES, type MoveActivity } from '../../data/move';
import { useStore } from '../../store/useStore';

export default function Move() {
  const logEvent = useStore((s) => s.logEvent);
  const navigate = useNavigate();
  const [active, setActive] = useState<MoveActivity | null>(null);
  const [step, setStep] = useState(0);
  const [timerOn, setTimerOn] = useState(false);

  const start = (a: MoveActivity) => {
    setActive(a);
    setStep(0);
    logEvent('activity_started', { category: 'move', ref: a.id });
  };
  const stop = () => {
    if (!active) {
      logEvent('returned_home');
      navigate('/child');
      return;
    }
    logEvent('activity_stopped', { category: 'move', ref: active.id });
    setActive(null);
  };
  const skip = () => {
    if (!active) return;
    logEvent('activity_skipped', { category: 'move', ref: active.id });
    const i = MOVE_ACTIVITIES.findIndex((a) => a.id === active.id);
    const next = MOVE_ACTIVITIES[(i + 1) % MOVE_ACTIVITIES.length];
    setActive(next);
    setStep(0);
  };

  return (
    <ChildLayout title="Move">
      {!active ? (
        <>
          <p className="mb-4 text-lg text-muted">Want to wiggle a bit? Pick one, or don&rsquo;t. Your call.</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {MOVE_ACTIVITIES.map((a) => (
              <li key={a.id}>
                <button className="card flex w-full items-center gap-4 text-left hover:shadow-md" onClick={() => start(a)}>
                  <span className="text-6xl" aria-hidden>{a.emoji}</span>
                  <span>
                    <span className="block text-xl font-bold">{a.title}</span>
                    <span className="block text-sm text-muted">{a.length}, if you like</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mx-auto max-w-2xl">
          <div className="card text-center">
            <p className="text-8xl" aria-hidden>{active.emoji}</p>
            <h2 className="mt-2 text-2xl font-bold">{active.title}</h2>
            <p className="mt-4 text-xl" aria-live="polite">{active.steps[step]}</p>
            <p className="mt-1 text-sm text-muted">Step {step + 1} of {active.steps.length}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button className="btn-ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>← Back</button>
              {step < active.steps.length - 1 ? (
                <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>Next →</button>
              ) : (
                <button className="btn-primary" onClick={stop}>All done</button>
              )}
            </div>
          </div>
          <div className="mt-4 card">
            <Toggle checked={timerOn} onChange={setTimerOn} label="Soft timer" description="Optional. Off unless you want it." />
            {timerOn && <SoftTimer />}
          </div>
        </div>
      )}

      {/* Skip and Stop always visible */}
      <div className="sticky bottom-16 mt-6 flex justify-center gap-3">
        <button className="btn-ghost shadow" onClick={skip} disabled={!active} aria-label="Skip to a different move">⏭ Skip</button>
        <button className="btn-ghost shadow" onClick={stop} aria-label={active ? 'Stop moving' : 'Stop and go home'}>✋ Stop</button>
      </div>
      <ReviewNote>No body metrics, calories, fitness or medical claims. Skipping or stopping has no penalty and no nag.</ReviewNote>
    </ChildLayout>
  );
}

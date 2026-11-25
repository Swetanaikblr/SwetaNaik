import { Link } from 'react-router-dom';
import { Proposed } from '../components/Badges';
import { useStore } from '../store/useStore';

export default function RoleChooser() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const reset = useStore((s) => s.resetPrototype);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <h1 className="text-center text-3xl font-extrabold">Who&rsquo;s here?<Proposed /></h1>
      <p className="mt-2 text-center text-muted">CII prototype for research sessions.</p>
      <div className="mt-8 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Link to="/child" className="card flex flex-col items-center gap-2 py-10 text-center hover:shadow-md">
          <span className="text-6xl" aria-hidden>🧒</span>
          <span className="text-2xl font-bold">Child space</span>
          <span className="text-muted">Pick what you&rsquo;re in the mood for</span>
        </Link>
        <Link to="/parent/login" className="card flex flex-col items-center gap-2 py-10 text-center hover:shadow-md">
          <span className="text-6xl" aria-hidden>🧑‍🍼</span>
          <span className="text-2xl font-bold">Parent space</span>
          <span className="text-muted">Set up the space (PIN needed)</span>
        </Link>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
        <span className="text-muted">Mode:</span>
        <button className={mode === 'participant' ? 'btn-primary' : 'btn-ghost'} aria-pressed={mode === 'participant'} onClick={() => setMode('participant')}>Participant</button>
        <button className={mode === 'review' ? 'btn-primary' : 'btn-ghost'} aria-pressed={mode === 'review'} onClick={() => setMode('review')}>Review</button>
        {mode === 'review' && <Link to="/review" className="btn-soft">Review panel</Link>}
        <button className="btn-ghost" onClick={() => window.confirm('Reset the prototype to its starting state? This clears local settings, creations, events and feedback.') && reset()}>
          Reset prototype
        </button>
      </div>
    </div>
  );
}

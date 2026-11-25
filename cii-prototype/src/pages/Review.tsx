import { Link } from 'react-router-dom';
import { SampleLabel } from '../components/Badges';
import { Toggle } from '../components/Toggle';
import { CATEGORY_META } from '../data/categories';
import { ASSUMPTIONS, OPEN_QUESTIONS, SCREENS, UNVALIDATED, type ScreenStatus } from '../data/review';
import { deriveMetrics } from '../lib/metrics';
import { useStore } from '../store/useStore';
import { CATEGORIES } from '../types';

const STATUS_CLS: Record<ScreenStatus, string> = {
  'Existing prototype': 'bg-slate-100 text-slate-700',
  Proposed: 'bg-note-soft text-note',
  'Concept only': 'bg-ai-soft text-ai',
};

function pct(v: number | null) {
  return v === null ? 'n/a' : `${Math.round(v * 100)}%`;
}

export default function Review() {
  const events = useStore((s) => s.events);
  const feedback = useStore((s) => s.feedback);
  const recognition = useStore((s) => s.speechRecognitionAllowed);
  const set = useStore((s) => s.set);
  const reset = useStore((s) => s.resetPrototype);
  const clearEvents = useStore((s) => s.clearEvents);
  const m = deriveMetrics(events);
  const maxBal = Math.max(1, ...Object.values(m.balance));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), note: 'Local prototype data. Category-level events only; no transcripts.', feedback, events }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cii-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-20">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Review panel</h1>
        <span className="rounded-full bg-note-soft px-3 py-1 text-xs font-bold text-note">Product team only</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link to="/" className="btn-ghost">Role chooser</Link>
          <Link to="/child" className="btn-ghost">Child Home</Link>
        </div>
      </div>
      <p className="mt-1 text-muted">Nothing in this prototype is validated. Values below come from this browser only.</p>

      <section className="card mt-5" aria-labelledby="screens">
        <h2 id="screens" className="text-lg font-bold">(a) Screens and status</h2>
        <div className="mt-3 relative overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="text-muted"><th className="py-2">Screen</th><th>Route</th><th>Status</th><th>Note</th></tr></thead>
            <tbody>
              {SCREENS.map((s) => (
                <tr key={s.path} className="border-t border-line">
                  <td className="py-2 font-semibold"><Link className="underline decoration-dotted" to={s.path}>{s.name}</Link></td>
                  <td className="font-mono text-xs">{s.path}</td>
                  <td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_CLS[s.status]}`}>{s.status}</span></td>
                  <td className="text-muted">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card" aria-labelledby="oq">
          <h2 id="oq" className="text-lg font-bold">(b) Open questions (unresolved)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{OPEN_QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ul>
        </section>
        <section className="card" aria-labelledby="as">
          <h2 id="as" className="text-lg font-bold">(c) Assumptions</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{ASSUMPTIONS.map((q) => <li key={q}>{q}</li>)}</ul>
          <p className="mt-2 text-xs text-muted">Full list in ASSUMPTIONS.md.</p>
          <h2 className="mt-5 text-lg font-bold text-danger">(d) Unvalidated: do not claim</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{UNVALIDATED.map((q) => <li key={q}>{q}</li>)}</ul>
        </section>
      </div>

      <section className="card mt-5" aria-labelledby="metrics">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="metrics" className="text-lg font-bold">Phase 1 metrics</h2>
          <SampleLabel text="Prototype values only" />
        </div>
        <p className="text-sm text-muted">Derived from this browser&rsquo;s local event log. No targets or baselines. More usage is not a goal, and time spent is not a success measure.</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-paper p-4">
            <dt className="label">Voluntary discovery</dt>
            <dd className="mt-1 text-2xl font-bold">{pct(m.voluntaryRate)}</dd>
            <dd className="text-xs text-muted">{m.voluntaryOpens} opened without an Echo prompt · {m.promptedOpens} after/through one</dd>
          </div>
          <div className="rounded-xl bg-paper p-4">
            <dt className="label">Breadth of exploration</dt>
            <dd className="mt-1 text-2xl font-bold">{m.breadth} of {CATEGORIES.length}</dd>
            <dd className="text-xs text-muted">distinct categories opened</dd>
          </div>
          <div className="rounded-xl bg-paper p-4">
            <dt className="label">Repeat voluntary use</dt>
            <dd className="mt-1 text-2xl font-bold">{m.repeatVoluntarySessions}</dd>
            <dd className="text-xs text-muted">sessions after the first with ≥1 voluntary open ({m.sessions} sessions logged)</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">Echo suggestions: {m.suggestionsShown} shown · {m.suggestionsAccepted} accepted · {m.suggestionsIgnored} ignored.</p>

        <h3 className="mt-5 font-bold">Guardrail: balance of categories</h3>
        <ul className="mt-2 space-y-2" aria-label="Category balance">
          {CATEGORIES.map((c) => (
            <li key={c} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0">{CATEGORY_META[c].label}</span>
              <span className="h-3 flex-1 overflow-hidden rounded-full bg-paper">
                <span className="block h-full rounded-full bg-muted/60" style={{ width: `${(m.balance[c] / maxBal) * 100}%` }} />
              </span>
              <span className="w-8 text-right tabular-nums">{m.balance[c]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-5" aria-labelledby="fbk">
        <h2 id="fbk" className="text-lg font-bold">(e) Facilitator data</h2>
        <p className="text-sm text-muted">{feedback.length} Snapshot feedback entries · {events.length} events.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={exportJson}>Export feedback and events (JSON)</button>
          <button className="btn-ghost" onClick={() => window.confirm('Clear all local events and feedback?') && clearEvents()}>Clear events and feedback</button>
          <button className="btn-ghost text-danger" onClick={() => window.confirm('Reset the whole prototype to its starting state?') && reset()}>Reset prototype</button>
        </div>
        {feedback.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {feedback.map((f) => <li key={f.id}>{new Date(f.at).toLocaleString()}: useful = {f.useful || '—'}{f.remove && `; remove: "${f.remove}"`}</li>)}
          </ul>
        )}
        <div className="mt-5 max-w-xl">
          <Toggle
            checked={recognition}
            onChange={(v) => set({ speechRecognitionAllowed: v })}
            label="Allow browser speech recognition"
            description="Off by default. In some browsers, recognition audio is processed by the browser vendor's servers. Only turn on with consent for the session."
          />
        </div>
      </section>

      <section className="card mt-5" aria-labelledby="log">
        <h2 id="log" className="text-lg font-bold">Event log (latest 100)</h2>
        <p className="text-sm text-muted">Category-level only. Never contains what the child typed or said.</p>
        <div className="mt-3 max-h-80 overflow-y-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead><tr className="text-muted"><th className="py-1">Time</th><th>Event</th><th>Category</th><th>Via</th><th>Ref</th></tr></thead>
            <tbody>
              {[...events].reverse().slice(0, 100).map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="py-1">{new Date(e.at).toLocaleTimeString()}</td>
                  <td>{e.name}</td><td>{e.category ?? ''}</td><td>{e.via ?? ''}</td><td>{e.ref ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 && <p className="text-sm text-muted">No events yet.</p>}
        </div>
      </section>
    </div>
  );
}

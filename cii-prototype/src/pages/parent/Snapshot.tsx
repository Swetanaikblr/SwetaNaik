import { useEffect, useMemo, useState } from 'react';
import { ParentLayout } from '../../components/ParentLayout';
import { HonestNote, ReviewNote, SampleLabel, SourceTag, type SourceKind } from '../../components/Badges';
import { Toggle } from '../../components/Toggle';
import { CATEGORY_META } from '../../data/categories';
import { MOVE_ACTIVITIES } from '../../data/move';
import { OFFLINE_IDEAS } from '../../data/explore';
import { useStore } from '../../store/useStore';
import { CATEGORIES, type Category } from '../../types';

/** Clearly labelled sample pattern for earlier days. Not real activity. */
const SAMPLE_DAYS: { label: string; opened: Category[] }[] = [
  { label: '4 days ago', opened: ['create', 'watch'] },
  { label: '3 days ago', opened: ['watch', 'move', 'explore'] },
  { label: '2 days ago', opened: ['study', 'create'] },
  { label: 'Yesterday', opened: ['watch', 'explore', 'askGuide'] },
];

interface Item { text: string; tag: SourceKind }

export default function Snapshot() {
  const events = useStore((s) => s.events);
  const materials = useStore((s) => s.materials);
  const sources = useStore((s) => s.sources);
  const name = useStore((s) => s.child.name);
  const showDuration = useStore((s) => s.showDurationCard);
  const set = useStore((s) => s.set);
  const logEvent = useStore((s) => s.logEvent);
  const addFeedback = useStore((s) => s.addFeedback);
  const [useful, setUseful] = useState<'yes' | 'somewhat' | 'no' | ''>('');
  const [remove, setRemove] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => { logEvent('snapshot_viewed'); }, [logEvent]);

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return events.filter((e) => e.at >= start.getTime());
  }, [events]);

  const opened = CATEGORIES.filter((c) => today.some((e) => e.name === 'category_opened' && e.category === c));

  const topicsFor = (c: Category): string[] => {
    const refs = new Set(today.filter((e) => e.category === c && e.ref && (e.name === 'activity_started' || e.name === 'material_opened')).map((e) => e.ref!));
    if (c === 'study') return [...refs].map((r) => materials.find((m) => m.id === r)?.title).filter(Boolean) as string[];
    if (c === 'watch') return [...refs].map((r) => sources.find((s) => s.id === r)?.name).filter(Boolean) as string[];
    if (c === 'move') return [...refs].map((r) => MOVE_ACTIVITIES.find((m) => m.id === r)?.title).filter(Boolean) as string[];
    if (c === 'create') return ['Drawings and stories stay private to your child'];
    return [];
  };

  const materialsUsed = [...new Set(today.filter((e) => e.name === 'material_opened').map((e) => e.ref))]
    .map((r) => materials.find((m) => m.id === r)?.title)
    .filter(Boolean) as string[];

  const childReported: Item[] = [...new Set(today.filter((e) => e.name === 'child_reported_tried').map((e) => e.ref))]
    .map((r) => OFFLINE_IDEAS.find((o) => o.id === r))
    .filter(Boolean)
    .map((o) => ({ text: `Said they tried: "${o!.text}"`, tag: 'child' as const }));

  const inferred: Item[] = [];
  if (opened.length >= 3) inferred.push({ text: `Looked at ${opened.length} different areas today`, tag: 'inferred' });
  const createOpens = today.filter((e) => e.name === 'category_opened' && e.category === 'create').length;
  if (createOpens >= 2) inferred.push({ text: 'May be enjoying creative activities (came back to Draw)', tag: 'inferred' });

  const issues: string[] = [];
  const unavailableSeen = new Set(today.filter((e) => e.name === 'watch_unavailable_shown').map((e) => e.ref));
  for (const s of sources) for (const i of s.items) if (unavailableSeen.has(i.id)) issues.push(`Video unavailable: "${i.title}" (${s.name})`);
  for (const s of sources) if (s.approvedInCII && s.items.some((i) => i.unavailable) && !s.items.some((i) => unavailableSeen.has(i.id))) issues.push(`${s.name} has an item that may not play`);
  for (const m of materials) if (m.importStatus === 'Failed' || m.importStatus === 'Unsupported') issues.push(`Material "${m.title}" ${m.importStatus === 'Failed' ? "couldn't be imported" : 'is an unsupported file type'}`);
  if (today.some((e) => e.name === 'external_interstitial_shown')) issues.push('Something your child chose would open outside CII (they saw the "opens outside CII" message)');

  const days = [...SAMPLE_DAYS, { label: 'Today', opened }];

  return (
    <ParentLayout title="Today's Snapshot" status="proposed" intro={`What did ${name} explore in this environment?`}>
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-parent-soft px-4 py-2 text-sm font-bold text-parent">
        <span aria-hidden>🔍</span> Shows activity inside CII only.
      </p>

      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <section className="card">
          <h2 className="text-lg font-bold">Areas opened today</h2>
          {opened.length === 0 ? (
            <p className="mt-2 text-muted">Nothing opened in CII yet today.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {opened.map((c) => (
                <li key={c} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{CATEGORY_META[c].icon} {CATEGORY_META[c].label}</p>
                    {topicsFor(c).length > 0 && <p className="text-sm text-muted">{topicsFor(c).join(' · ')}</p>}
                  </div>
                  <SourceTag kind="observed" />
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-6 text-lg font-bold">Learning materials accessed</h2>
          {materialsUsed.length === 0 ? (
            <p className="mt-2 text-muted">None today.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {materialsUsed.map((m) => (
                <li key={m} className="flex items-center justify-between gap-3"><span>{m}</span><SourceTag kind="observed" /></li>
              ))}
            </ul>
          )}

          {(childReported.length > 0 || inferred.length > 0) && (
            <>
              <h2 className="mt-6 text-lg font-bold">Other notes</h2>
              <ul className="mt-2 space-y-2">
                {[...childReported, ...inferred].map((i) => (
                  <li key={i.text} className="flex items-center justify-between gap-3"><span>{i.text}</span><SourceTag kind={i.tag} /></li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Pattern over a few days</h2>
            <SampleLabel text="Earlier days: sample data" />
          </div>
          <p className="text-sm text-muted">A dot means the area was opened that day. It isn&rsquo;t a score, and more isn&rsquo;t better.</p>
          <div className="mt-3 relative overflow-x-auto">
            <table className="w-full min-w-[420px] text-center text-sm">
              <caption className="sr-only">Areas opened per day</caption>
              <thead>
                <tr>
                  <th scope="col" className="py-1 text-left">Day</th>
                  {CATEGORIES.map((c) => <th key={c} scope="col" className="px-1 py-1" title={CATEGORY_META[c].label}><span aria-hidden>{CATEGORY_META[c].icon}</span><span className="sr-only">{CATEGORY_META[c].label}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.label} className="border-t border-line">
                    <th scope="row" className="py-2 text-left font-semibold">
                      {d.label}
                      {d.label !== 'Today' && <span className="ml-1 text-[10px] font-bold uppercase text-slate-500">sample</span>}
                    </th>
                    {CATEGORIES.map((c) => (
                      <td key={c} className="px-1 py-2">
                        {d.opened.includes(c) ? <span className="inline-block h-3 w-3 rounded-full bg-parent" aria-label="opened" /> : <span className="inline-block h-3 w-3 rounded-full bg-slate-200" aria-label="not opened" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs"><SourceTag kind="observed" /><span className="text-muted">Today&rsquo;s row is observed in this browser.</span></div>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Issues needing attention</h2>
          {issues.length === 0 ? (
            <p className="mt-2 text-muted">Nothing needs attention.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {issues.map((i) => <li key={i} className="flex items-start gap-2"><span aria-hidden>⚠️</span><span>{i}</span></li>)}
            </ul>
          )}
        </section>

        <section className="card">
          <Toggle checked={showDuration} onChange={(v) => set({ showDurationCard: v })} label="Show experimental duration card" description="Off by default." />
          {showDuration && (
            <div className="mt-3 rounded-xl border-2 border-dashed border-note/50 bg-note-soft p-4">
              <p className="font-bold text-note">Duration capture is untested</p>
              <p className="mt-1 text-sm text-note">CII can&rsquo;t reliably tell how long something was used (screens left open, other apps, breaks). This card shows illustrative values only.</p>
              <ul className="mt-2 text-sm">
                <li>Draw: roughly 10–15 min <SampleLabel /></li>
                <li>Watch: roughly 15–20 min <SampleLabel /></li>
              </ul>
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 card border-dashed" aria-labelledby="fb">
        <h2 id="fb" className="text-lg font-bold">Was this useful?</h2>
        <p className="text-sm text-muted">For the research session. Saved only in this browser for the facilitator.</p>
        {sent ? (
          <p role="status" className="mt-3 font-semibold text-accent">Thanks, noted.</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['yes', 'somewhat', 'no'] as const).map((u) => (
                <button key={u} className={useful === u ? 'btn-parent' : 'btn-ghost'} aria-pressed={useful === u} onClick={() => setUseful(u)}>
                  {u === 'yes' ? 'Yes' : u === 'somewhat' ? 'Somewhat' : 'Not really'}
                </button>
              ))}
            </div>
            <label htmlFor="remove" className="mt-4 block font-semibold">What would you remove?</label>
            <textarea id="remove" className="input mt-1 min-h-[80px]" maxLength={500} value={remove} onChange={(e) => setRemove(e.target.value)} />
            <button
              className="btn-parent mt-3"
              disabled={!useful && !remove.trim()}
              onClick={() => { addFeedback({ useful, remove: remove.trim() }); logEvent('snapshot_feedback'); setSent(true); }}
            >
              Save feedback
            </button>
          </>
        )}
      </section>

      <HonestNote>No scores, no judgments, no transcripts, no minute-by-minute logs. Echo conversations are never shown here.</HonestNote>
      <ReviewNote>"Observed" = derived from local events in this browser. "Child-reported" = the child&rsquo;s own "I tried this" taps. "Inferred" = simple prototype rules, likely wrong. Telemetry reliability is unvalidated.</ReviewNote>
    </ParentLayout>
  );
}

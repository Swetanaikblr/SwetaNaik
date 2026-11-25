import { useEffect, useState } from 'react';
import { ChildLayout } from '../../components/ChildLayout';
import { HonestNote, Proposed, ReviewNote } from '../../components/Badges';
import { Toggle } from '../../components/Toggle';
import { STUDY_CONTENT } from '../../data/study';
import { useStore } from '../../store/useStore';
import { SoftTimer } from '../../components/SoftTimer';

export default function Study() {
  const materials = useStore((s) => s.materials);
  const logEvent = useStore((s) => s.logEvent);
  const usable = materials.filter((m) => m.availableToChild && m.importStatus === 'Imported');
  const [openId, setOpenId] = useState<string | null>(null);
  const [timerOn, setTimerOn] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const current = usable.find((m) => m.id === openId) ?? null;
  const content = current?.sampleContentId ? STUDY_CONTENT[current.sampleContentId] : null;

  useEffect(() => setHintsShown(0), [openId]);

  const open = (id: string) => {
    setOpenId(id);
    logEvent('material_opened', { category: 'study', ref: id });
    logEvent('activity_started', { category: 'study', ref: id });
  };

  return (
    <ChildLayout title="Study">
      <div className="mb-4 rounded-xl border border-ai/30 bg-ai-soft px-4 py-3 text-sm text-ai">
        <span aria-hidden>💡</span> Hints from Ask Guide are optional help, not the textbook.
      </div>
      <div className="grid gap-5 md:grid-cols-12">
        <aside className="md:col-span-4">
          <h2 className="label mb-2">From your parent&rsquo;s materials</h2>
          {usable.length === 0 ? (
            <div className="card text-center">
              <p className="text-4xl" aria-hidden>📭</p>
              <p className="mt-2 font-semibold">No materials here yet.</p>
              <p className="text-sm text-muted">That&rsquo;s okay! Your parent can add some. You could explore something else for now.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {usable.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => open(m.id)}
                    aria-current={openId === m.id}
                    className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-3 text-left ${openId === m.id ? 'border-brand bg-brand-soft' : 'border-line bg-card hover:bg-paper'}`}
                  >
                    <span aria-hidden className="text-2xl">{m.format === 'Reading list' ? '📖' : m.format === 'Notes' ? '📝' : '📘'}</span>
                    <span>
                      <span className="block font-semibold">{m.title}</span>
                      <span className="block text-xs text-muted">{m.format}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <HonestNote>Only materials your parent added are here.</HonestNote>
          <div className="mt-4 card">
            <Toggle checked={timerOn} onChange={setTimerOn} label="Use a timer" description="Optional. Off unless you want it." />
            {timerOn && <SoftTimer />}
          </div>
        </aside>

        <section className="md:col-span-8" aria-live="polite">
          {!current ? (
            <div className="card text-muted">Pick something from the list when you feel like it. No rush.</div>
          ) : !content ? (
            <div className="card">
              <h2 className="text-xl font-bold">{current.title}</h2>
              <p className="mt-2 text-muted">This file was added by your parent, but the prototype can&rsquo;t show its contents.</p>
            </div>
          ) : (
            <>
              <article className="card" aria-label="Source material">
                <p className="label">Source material</p>
                <h2 className="mt-1 text-2xl font-bold">{content.title}</h2>
                <p className="text-xs text-muted">{content.attribution}</p>
                {content.sections.map((s) => (
                  <section key={s.heading} className="mt-4">
                    <h3 className="text-lg font-bold">{s.heading}</h3>
                    <p className="mt-1 leading-relaxed">{s.body}</p>
                  </section>
                ))}
              </article>

              <aside className="mt-4 rounded-2xl border-2 border-dashed border-ai/40 bg-ai-soft p-5" aria-label="AI help (prototype)">
                <p className="text-xs font-bold uppercase tracking-wide text-ai">AI help (prototype)<Proposed /></p>
                <p className="mt-1 text-sm text-ai">Optional hints. Scripted examples, not part of the material.</p>
                <ul className="mt-3 space-y-2">
                  {content.hints.slice(0, hintsShown).map((h) => (
                    <li key={h} className="rounded-xl bg-card px-3 py-2 text-ink">{h}</li>
                  ))}
                </ul>
                {hintsShown < content.hints.length && (
                  <button className="btn mt-3 bg-ai text-white hover:bg-ai/90" onClick={() => setHintsShown((n) => n + 1)}>
                    {hintsShown === 0 ? 'Show a hint' : 'Another hint'}
                  </button>
                )}
              </aside>
            </>
          )}
          <ReviewNote>No subject or timer is forced. Source text and AI help use different containers and labels. CII makes no claim of curriculum coverage.</ReviewNote>
        </section>
      </div>
    </ChildLayout>
  );
}

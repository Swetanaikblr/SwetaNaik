import { useEffect, useState } from 'react';
import { ChildLayout } from '../../components/ChildLayout';
import { EchoCard } from '../../components/EchoCard';
import { Proposed, ReviewNote } from '../../components/Badges';
import { CATEGORY_META } from '../../data/categories';
import { CONTEXT_LABEL, CONTEXT_LINE } from '../../data/scenarios';
import { useCategoryStates } from '../../lib/availability';
import { useOpenCategory } from '../../lib/openCategory';
import { useTimeInfo } from '../../lib/time';
import { useStore } from '../../store/useStore';
import { CATEGORIES } from '../../types';

export default function ChildHome() {
  const child = useStore((s) => s.child);
  const logEvent = useStore((s) => s.logEvent);
  const responsibilitiesEnabled = useStore((s) => s.responsibilitiesEnabled);
  const responsibilities = useStore((s) => s.responsibilities);
  const time = useTimeInfo();
  const states = useCategoryStates();
  const openCategory = useOpenCategory();
  const [thingsOpen, setThingsOpen] = useState(false);
  const band = child.ageBand === '8-10' ? 'young' : 'older';

  useEffect(() => {
    logEvent('home_viewed');
  }, [logEvent]);

  const visible = CATEGORIES.filter((c) => states[c] !== 'hidden');

  return (
    <ChildLayout>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Hey {child.name}!</h1>
          <p className="mt-1 text-lg text-muted">{CONTEXT_LINE[time.context]}</p>
        </div>
        <div className="text-right text-sm text-muted">
          <span className="block">{CONTEXT_LABEL[time.context]} · {time.timeLabel}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">
            <span aria-hidden>🛡️</span> Safe personal space
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <EchoCard />
        </div>

        <section className="lg:col-span-7" aria-labelledby="mood-title">
          <h2 id="mood-title" className="label mb-3 text-sm">What are you in the mood for?</h2>
          {visible.length === 0 ? (
            <p className="card text-muted">Nothing is set up here right now. You can ask your parent.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visible.map((c) => {
                const m = CATEGORY_META[c];
                const notNow = states[c] === 'notNow';
                return (
                  <li key={c}>
                    <button
                      onClick={() => !notNow && openCategory(c)}
                      disabled={notNow}
                      aria-label={notNow ? `${m.label}: not available right now` : `${m.label}: ${m.caption[band]}`}
                      className={`flex h-full min-h-[140px] w-full flex-col items-start gap-1 rounded-2xl border border-line p-4 text-left shadow-sm transition ${notNow ? 'cursor-not-allowed bg-slate-50 opacity-70' : `${m.hue} hover:-translate-y-0.5 hover:shadow-md`}`}
                    >
                      <span className="text-4xl" aria-hidden>{m.icon}</span>
                      <span className="text-lg font-bold">
                        {m.label}
                        {c === 'askGuide' && <Proposed />}
                      </span>
                      <span className="text-sm text-muted">{notNow ? 'Not available right now' : m.caption[band]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <ReviewNote>Tiles are in a fixed neutral order and none is highlighted. Echo can suggest, but only the child opens a tile.</ReviewNote>

          {responsibilitiesEnabled && responsibilities.length > 0 && (
            <div className="mt-5 rounded-2xl border border-line bg-card/60 p-3">
              <button
                className="flex min-h-[44px] w-full items-center justify-between text-left text-sm font-semibold text-muted"
                aria-expanded={thingsOpen}
                onClick={() => setThingsOpen((o) => !o)}
              >
                <span>Things I might do <Proposed /></span>
                <span aria-hidden>{thingsOpen ? '▲' : '▼'}</span>
              </button>
              {thingsOpen && (
                <ul className="mt-1 list-disc space-y-1 pl-6 text-sm text-ink">
                  {responsibilities.map((r) => <li key={r}>{r}</li>)}
                </ul>
              )}
              {thingsOpen && <p className="mt-2 text-xs text-muted">Ideas from your parent. Whenever suits you.</p>}
            </div>
          )}
        </section>
      </div>
    </ChildLayout>
  );
}

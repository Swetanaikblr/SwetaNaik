import { ParentLayout } from '../../components/ParentLayout';
import { HonestNote, ReviewNote, SampleLabel } from '../../components/Badges';
import { Toggle } from '../../components/Toggle';
import { useStore } from '../../store/useStore';
import type { LaunchStatus } from '../../types';

const LAUNCH: Record<LaunchStatus, string> = {
  'in-cii': 'Yes, inside CII (mock player)',
  outside: 'Opens outside CII',
  unavailable: 'Unavailable',
};

function Info({ text, id }: { text: string; id: string }) {
  return (
    <span className="group relative inline-block">
      <button type="button" className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700" aria-describedby={id} aria-label="What does this mean?">?</button>
      <span id={id} role="tooltip" className="pointer-events-none absolute left-1/2 top-7 z-20 hidden w-64 -translate-x-1/2 rounded-lg bg-ink p-3 text-xs font-normal normal-case tracking-normal text-white shadow-lg group-focus-within:block group-hover:block">
        {text}
      </span>
    </span>
  );
}

export default function Sources() {
  const sources = useStore((s) => s.sources);
  const updateSource = useStore((s) => s.updateSource);
  return (
    <ParentLayout title="Approved Apps, Sources and Channels" status="existing" intro="Each source has three separate statuses. Approving something here does not mean CII can control it.">
      <div className="card mb-4 grid gap-3 text-sm sm:grid-cols-3">
        <p><span className="font-bold">Approved in CII</span><Info id="tt-a" text="You said this is okay. It appears in your child's Watch or Explore lists." /><br /><span className="text-muted">Your decision.</span></p>
        <p><span className="font-bold">Available to launch</span><Info id="tt-b" text="Whether it can open right now: inside CII's mock player, outside CII (another app or site), or unavailable." /><br /><span className="text-muted">Whether it opens.</span></p>
        <p><span className="font-bold">Technically restricted or controlled</span><Info id="tt-c" text="Whether CII can actually limit what happens inside that source (links, recommendations, autoplay). Not tested for any source." /><br /><span className="text-muted">Whether CII can enforce limits.</span></p>
      </div>

      <ul className="space-y-3">
        {sources.map((s) => {
          const unavailableItems = s.items.filter((i) => i.unavailable).length;
          return (
            <li key={s.id} className="card">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-bold">{s.name}</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{s.kind}</span>
                <SampleLabel text="Placeholder" />
              </div>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="label">Approved in CII</dt>
                  <dd><Toggle checked={s.approvedInCII} onChange={(v) => updateSource(s.id, { approvedInCII: v })} label={s.approvedInCII ? 'Approved' : 'Not approved'} /></dd>
                </div>
                <div>
                  <dt className="label">Available to launch</dt>
                  <dd className="mt-2 font-semibold">{LAUNCH[s.launch]}</dd>
                  {unavailableItems > 0 && <dd className="text-sm text-note">{unavailableItems} item unavailable</dd>}
                </div>
                <div>
                  <dt className="label">Technically restricted or controlled</dt>
                  <dd className="mt-2"><span className="rounded-full bg-note-soft px-3 py-1 text-sm font-bold text-note">Not tested</span></dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
      <HonestNote>External apps and sites have their own links and recommendations. CII cannot currently control what happens inside them.</HonestNote>
      <ReviewNote>Source enforcement and third-party player control are unvalidated. All sources are fake placeholders: no real channels, brands or videos.</ReviewNote>
    </ParentLayout>
  );
}

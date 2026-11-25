import { ParentLayout } from '../../components/ParentLayout';
import { HonestNote, Proposed, ReviewNote } from '../../components/Badges';
import { Toggle } from '../../components/Toggle';
import { useStore } from '../../store/useStore';
import type { SuggestionFrequency, Tone } from '../../types';

const TONES: { id: Tone; label: string; desc: string }[] = [
  { id: 'warm', label: 'Warm', desc: 'Friendly and encouraging' },
  { id: 'calm', label: 'Calm', desc: 'Quiet and unhurried' },
  { id: 'playful', label: 'Playful', desc: 'Light and a bit silly' },
];
const FREQ: { id: SuggestionFrequency; label: string; desc: string }[] = [
  { id: 'onlyWhenAsked', label: 'Only when asked (default)', desc: 'Echo offers ideas only when your child asks.' },
  { id: 'startOfSession', label: 'Once at the start of a chat', desc: 'One optional set of ideas when your child starts talking. Never repeated.' },
];

export default function EchoSettings() {
  const es = useStore((s) => s.echoSettings);
  const update = useStore((s) => s.updateEcho);
  return (
    <ParentLayout title="Echo guidance settings" status="existing" intro="Echo is child-initiated by default. It doesn't nag or send reminders.">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-lg font-bold">Tone</h2>
          <div className="mt-3 grid gap-2">
            {TONES.map((t) => (
              <label key={t.id} className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 ${es.tone === t.id ? 'border-parent bg-parent-soft' : 'border-line'}`}>
                <input type="radio" name="tone" checked={es.tone === t.id} onChange={() => update({ tone: t.id })} className="h-5 w-5" />
                <span><span className="block font-semibold">{t.label}</span><span className="text-sm text-muted">{t.desc}</span></span>
              </label>
            ))}
          </div>

          <h2 className="mt-6 text-lg font-bold">Optional suggestions</h2>
          <div className="mt-3 grid gap-2">
            {FREQ.map((f) => (
              <label key={f.id} className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 ${es.frequency === f.id ? 'border-parent bg-parent-soft' : 'border-line'}`}>
                <input type="radio" name="freq" checked={es.frequency === f.id} onChange={() => update({ frequency: f.id })} className="h-5 w-5" />
                <span><span className="block font-semibold">{f.label}</span><span className="text-sm text-muted">{f.desc}</span></span>
              </label>
            ))}
          </div>
          <HonestNote>CII should not replace frequent parent reminders with frequent AI reminders.</HonestNote>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Context</h2>
          <label htmlFor="ctx" className="mt-2 block text-sm text-muted">Anything that helps Echo pitch ideas well (optional). Avoid personal details.</label>
          <textarea id="ctx" className="input mt-2 min-h-[100px]" maxLength={200} value={es.contextNote} onChange={(e) => update({ contextNote: e.target.value })} placeholder="For example: likes drawing and space; prefers calm things in the evening." />
          <p className="mt-1 text-xs text-muted">Prototype: stored in this browser only; the scripted Echo doesn&rsquo;t use it yet.</p>

          <div className="mt-5">
            <Toggle checked={es.greetingEnabled} onChange={(v) => update({ greetingEnabled: v })} label="Single opening greeting" description="One soft hello on Home. Turn off for a fully silent Echo until your child speaks." />
          </div>
          <p className="mt-4 text-sm"><span className="font-semibold">Mode:</span> Companion<Proposed /></p>
          <p className="text-xs text-muted">Only one mode exists in this prototype.</p>
        </section>
      </div>
      <ReviewNote>No reminder or nudge schedule exists by design. Whether any suggestion frequency above "only when asked" helps or nags is an open question.</ReviewNote>
    </ParentLayout>
  );
}

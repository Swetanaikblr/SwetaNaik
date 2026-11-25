import { useState } from 'react';
import { ParentLayout } from '../../components/ParentLayout';
import { ReviewNote } from '../../components/Badges';
import { Toggle } from '../../components/Toggle';
import { useStore } from '../../store/useStore';

export default function Responsibilities() {
  const enabled = useStore((s) => s.responsibilitiesEnabled);
  const items = useStore((s) => s.responsibilities);
  const set = useStore((s) => s.set);
  const [draft, setDraft] = useState('');

  return (
    <ParentLayout title="Optional Responsibilities" status="proposed" intro="Off by default. If on, your child sees a small, secondary 'Things I might do' note on Home. It never replaces the choices and is not a checklist.">
      <div className="card">
        <Toggle checked={enabled} onChange={(v) => set({ responsibilitiesEnabled: v })} label="Show 'Things I might do' on Home" description="Collapsed by default. No ticks, no reminders, nothing tracked." />
      </div>
      {enabled && (
        <div className="card mt-4">
          <h2 className="text-lg font-bold">Ideas to show</h2>
          <ul className="mt-2 space-y-2">
            {items.map((r) => (
              <li key={r} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                <span>{r}</span>
                <button className="btn-ghost text-sm" onClick={() => set({ responsibilities: items.filter((x) => x !== r) })} aria-label={`Remove ${r}`}>Remove</button>
              </li>
            ))}
          </ul>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const t = draft.trim(); if (t && !items.includes(t) && items.length < 5) { set({ responsibilities: [...items, t] }); setDraft(''); } }}>
            <label htmlFor="resp" className="sr-only">New idea</label>
            <input id="resp" className="input" value={draft} maxLength={60} onChange={(e) => setDraft(e.target.value)} placeholder="Short and friendly, up to 5" />
            <button className="btn-parent" disabled={!draft.trim() || items.length >= 5}>Add</button>
          </form>
        </div>
      )}
      <ReviewNote>Research must establish whether this helps or distracts.</ReviewNote>
    </ParentLayout>
  );
}

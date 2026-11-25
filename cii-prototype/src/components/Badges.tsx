import type { ReactNode } from 'react';
import { useStore } from '../store/useStore';

/** "Proposed" badge: shown only in Review mode. Marks anything not in the original prototype. */
export function Proposed({ className = '' }: { className?: string }) {
  const mode = useStore((s) => s.mode);
  if (mode !== 'review') return null;
  return (
    <span className={`ml-2 inline-flex items-center rounded-full border border-note/40 bg-note-soft px-2 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wide text-note ${className}`}>
      Proposed
    </span>
  );
}

/** "Existing prototype" badge: shown only in Review mode. */
export function Existing({ className = '' }: { className?: string }) {
  const mode = useStore((s) => s.mode);
  if (mode !== 'review') return null;
  return (
    <span className={`ml-2 inline-flex items-center rounded-full border border-line bg-paper px-2 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wide text-muted ${className}`}>
      Existing prototype
    </span>
  );
}

/** Review note for the product team: hidden in Participant mode. */
export function ReviewNote({ children }: { children: ReactNode }) {
  const mode = useStore((s) => s.mode);
  if (mode !== 'review') return null;
  return (
    <aside role="note" className="my-3 rounded-xl border border-dashed border-note/50 bg-note-soft px-4 py-3 text-sm text-note">
      <span className="font-bold">Review note: </span>
      {children}
    </aside>
  );
}

/** Always visible: labels seeded / invented content. */
export function SampleLabel({ text = 'Sample data' }: { text?: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-700">
      {text}
    </span>
  );
}

/** Honest limitation note shown to everyone (not review-only). */
export function HonestNote({ children }: { children: ReactNode }) {
  return <p className="mt-2 flex gap-2 text-sm text-muted"><span aria-hidden>ℹ️</span><span>{children}</span></p>;
}

export type SourceKind = 'observed' | 'child' | 'inferred';
const TAG: Record<SourceKind, { label: string; cls: string }> = {
  observed: { label: 'Observed in CII', cls: 'bg-accent-soft text-accent border-accent/30' },
  child: { label: 'Child-reported', cls: 'bg-sky-50 text-sky-800 border-sky-300' },
  inferred: { label: 'Inferred (prototype)', cls: 'bg-ai-soft text-ai border-ai/30' },
};
export function SourceTag({ kind }: { kind: SourceKind }) {
  const t = TAG[kind];
  return <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${t.cls}`}>{t.label}</span>;
}

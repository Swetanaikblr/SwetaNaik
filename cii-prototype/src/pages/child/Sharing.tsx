import { useState } from 'react';
import { ChildLayout } from '../../components/ChildLayout';
import { ReviewNote } from '../../components/Badges';
import { useStore } from '../../store/useStore';
import type { AgeBand } from '../../types';

const COPY: Record<AgeBand, { shared: string[]; notShared: string[]; intro: string }> = {
  '8-10': {
    intro: 'Your parent can see a little bit about what you did in CII. Here is what they can and can’t see.',
    shared: ['Which areas you opened, like Draw or Watch', 'Topics you looked at', 'Which books or notes you used'],
    notShared: ['What you said to Echo', 'Anything outside CII', 'Your drawings and stories (unless you show them)'],
  },
  '11-14': {
    intro: 'CII shows your parent a simple overview of activity inside CII. It’s meant to help them set things up, not to watch you.',
    shared: [
      'Which areas you opened (for example Study, Draw, Watch)',
      'Topics you explored, where CII knows them',
      'Which learning materials you opened',
      'Things you chose to tap, like "I tried this"',
      'Problems such as a video that wouldn’t play',
    ],
    notShared: [
      'A transcript of your Echo chats. There isn’t one for parents',
      'Anything you do outside CII, including other apps and sites',
      'Your drawings and stories, unless you choose to show them',
      'Minute-by-minute logs, scores or "good day / bad day" ratings',
    ],
  },
};

export default function Sharing() {
  const band = useStore((s) => s.child.ageBand);
  const [view, setView] = useState<AgeBand>(band);
  const c = COPY[view];
  return (
    <ChildLayout title="What my parent can see" status="proposed">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex gap-2" role="tablist" aria-label="Reading level">
          {(['8-10', '11-14'] as AgeBand[]).map((b) => (
            <button key={b} role="tab" aria-selected={view === b} className={view === b ? 'btn-primary' : 'btn-ghost'} onClick={() => setView(b)}>
              {b === '8-10' ? 'Short version' : 'Longer version'}
            </button>
          ))}
        </div>
        <p className="text-lg">{c.intro}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <section className="card border-accent/30 bg-accent-soft/50">
            <h2 className="text-xl font-bold">👀 Your parent can see</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">{c.shared.map((s) => <li key={s}>{s}</li>)}</ul>
          </section>
          <section className="card">
            <h2 className="text-xl font-bold">🔒 Your parent can&rsquo;t see</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">{c.notShared.map((s) => <li key={s}>{s}</li>)}</ul>
          </section>
        </div>
        <p className="mt-4 text-muted">Questions? It&rsquo;s okay to ask your parent about this.</p>
        <ReviewNote>Version defaults to the child&rsquo;s age band ({band}). Exact wording of what children are told about sharing is an open research question.</ReviewNote>
      </div>
    </ChildLayout>
  );
}

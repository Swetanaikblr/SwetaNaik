import { Link } from 'react-router-dom';
import { ParentLayout } from '../../components/ParentLayout';
import { ReviewNote } from '../../components/Badges';
import { useStore } from '../../store/useStore';

type Status = 'Set up' | 'Needs attention' | 'Optional';
const STATUS_CLS: Record<Status, string> = {
  'Set up': 'bg-accent-soft text-accent',
  'Needs attention': 'bg-note-soft text-note',
  Optional: 'bg-slate-100 text-slate-700',
};

export default function Overview() {
  const s = useStore();
  const materialsIssue = s.materials.some((m) => m.importStatus === 'Failed' || m.importStatus === 'Unsupported');
  const anyMaterial = s.materials.some((m) => m.availableToChild && m.importStatus === 'Imported');
  const sourceIssue = s.sources.some((x) => x.approvedInCII && (x.launch === 'unavailable' || x.items.some((i) => i.unavailable)));

  const cards: { to: string; title: string; desc: string; status: Status }[] = [
    { to: '/parent/child', title: 'Child profile', desc: `${s.child.name}, ages ${s.child.ageBand}`, status: s.child.name ? 'Set up' : 'Needs attention' },
    { to: '/parent/rhythm', title: 'Daily rhythm', desc: 'Which options are offered after school, evening, weekend', status: 'Set up' },
    { to: '/parent/materials', title: 'Learning Materials', desc: 'Books, notes and reading lists for Study', status: materialsIssue || !anyMaterial ? 'Needs attention' : 'Set up' },
    { to: '/parent/sources', title: 'Approved Apps, Sources & Channels', desc: 'What appears in Watch and Explore', status: sourceIssue ? 'Needs attention' : 'Set up' },
    { to: '/parent/echo', title: 'Echo guidance', desc: `Tone: ${s.echoSettings.tone}. Suggestions: ${s.echoSettings.frequency === 'onlyWhenAsked' ? 'only when asked' : 'occasional'}`, status: 'Set up' },
    { to: '/parent/snapshot', title: "Today's Snapshot", desc: 'What your child explored inside CII', status: 'Optional' },
    { to: '/parent/responsibilities', title: 'Optional Responsibilities', desc: s.responsibilitiesEnabled ? 'On' : 'Off (default)', status: 'Optional' },
  ];

  return (
    <ParentLayout title="Overview" status="proposed" intro="Set up the space your child chooses from. Everything here stays in this browser.">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <li key={c.to}>
            <Link to={c.to} className="card flex h-full flex-col gap-2 hover:shadow-md">
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLS[c.status]}`}>{c.status}</span>
              <span className="text-lg font-bold text-ink">{c.title}</span>
              <span className="text-sm text-muted">{c.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
      <ReviewNote>Overview is a proposed concept page. Status labels are computed from local settings only.</ReviewNote>
    </ParentLayout>
  );
}

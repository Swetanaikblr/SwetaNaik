import type { ReactNode } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { DemoGuide } from './DemoGuide';
import { Existing, Proposed, ReviewNote } from './Badges';

const NAV: { to: string; label: string; proposed: boolean; needsFlag?: boolean }[] = [
  { to: '/parent', label: 'Overview', proposed: true },
  { to: '/parent/child', label: 'Child profile', proposed: true },
  { to: '/parent/rhythm', label: 'Daily rhythm', proposed: true },
  { to: '/parent/materials', label: 'Learning Materials', proposed: false },
  { to: '/parent/sources', label: 'Apps, Sources & Channels', proposed: false },
  { to: '/parent/echo', label: 'Echo guidance', proposed: false },
  { to: '/parent/snapshot', label: "Today's Snapshot", proposed: true },
  { to: '/parent/responsibilities', label: 'Responsibilities', proposed: true },
];

export function RequireParent({ children }: { children: ReactNode }) {
  const unlocked = useStore((s) => s.parentUnlocked);
  const loc = useLocation();
  if (!unlocked) return <Navigate to="/parent/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

export function ParentLayout({
  title, children, status, intro,
}: { title: string; children: ReactNode; status: 'existing' | 'proposed'; intro?: ReactNode }) {
  const set = useStore((s) => s.set);
  const navigate = useNavigate();
  const lock = () => {
    set({ parentUnlocked: false });
    navigate('/child');
  };
  return (
    <div className="flex min-h-screen flex-col bg-parent-soft/40">
      <DemoGuide />
      <header className="sticky top-0 z-30 border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2">
          <span className="text-lg font-bold text-parent">Parent space</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
            <span aria-hidden>🔓</span> Unlocked
          </span>
          <div className="ml-auto flex gap-2">
            <Link to="/child" className="btn-ghost text-sm">Back to child space</Link>
            <button onClick={lock} className="btn-parent text-sm"><span aria-hidden>🔒</span> Lock</button>
          </div>
        </div>
        <nav aria-label="Parent pages" className="mx-auto flex max-w-6xl gap-1 relative overflow-x-auto px-4 pb-2">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end
              className={({ isActive }) =>
                `inline-flex min-h-[44px] shrink-0 items-center rounded-lg px-3 text-sm font-semibold ${isActive ? 'bg-parent text-white' : 'text-parent hover:bg-parent-soft'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <h1 className="text-2xl font-bold text-ink">
          {title}
          {status === 'proposed' ? <Proposed /> : <Existing />}
        </h1>
        {intro && <div className="mt-1 text-muted">{intro}</div>}
        <div className="mt-5">{children}</div>
      </main>
      <footer className="py-4 pb-16 text-center text-xs text-muted">CII prototype. Settings are stored only in this browser.</footer>
    </div>
  );
}

export function ParentAuthNote() {
  return <ReviewNote>Real parent authentication and child-session separation are untested.</ReviewNote>;
}

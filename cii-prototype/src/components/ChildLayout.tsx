import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { DemoGuide } from './DemoGuide';
import { Existing, Proposed } from './Badges';

export function ChildLayout({
  children, title, status = 'existing',
}: { children: ReactNode; title?: string; status?: 'existing' | 'proposed' }) {
  const name = useStore((s) => s.child.name);
  const logEvent = useStore((s) => s.logEvent);
  const navigate = useNavigate();
  const loc = useLocation();
  const atHome = loc.pathname === '/child';

  const goHome = () => {
    if (!atHome) logEvent('returned_home');
    navigate('/child');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DemoGuide />
      <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <button onClick={goHome} className="btn-primary text-base" aria-label="Home">
            <span aria-hidden>🏠</span> Home
          </button>
          <div className="min-w-0 flex-1 truncate text-center text-lg font-bold" aria-live="polite">
            {title ? (
              <>
                {title}
                {status === 'proposed' ? <Proposed /> : <Existing />}
              </>
            ) : (
              <span>{name}&rsquo;s space</span>
            )}
          </div>
          <Link to="/child/sharing" className="btn-ghost hidden text-sm sm:inline-flex" aria-label="What my parent can see">
            <span aria-hidden>👀</span> What my parent sees
          </Link>
          <Link to="/parent/login" className="btn-ghost text-sm" aria-label="Parent Access">
            <span aria-hidden>🔒</span> Parent Access
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">{children}</main>
      <footer className="border-t border-line py-4 pb-16 text-center text-sm text-muted">
        Freedom within parent-defined boundaries.
      </footer>
    </div>
  );
}

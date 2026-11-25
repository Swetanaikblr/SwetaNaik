import { useEffect } from 'react';
import { Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { ExternalInterstitial } from './components/ExternalInterstitial';
import { ModeCorner } from './components/ModeCorner';
import { RequireParent } from './components/ParentLayout';
import { safeSessionGet, safeSessionSet } from './lib/storage';
import { useStore } from './store/useStore';
import RoleChooser from './pages/RoleChooser';
import Review from './pages/Review';
import ChildHome from './pages/child/Home';
import Study from './pages/child/Study';
import Create from './pages/child/Create';
import Watch from './pages/child/Watch';
import Move from './pages/child/Move';
import Explore from './pages/child/Explore';
import AskGuide from './pages/child/AskGuide';
import Sharing from './pages/child/Sharing';
import ParentLogin from './pages/parent/Login';
import Overview from './pages/parent/Overview';
import ChildProfile from './pages/parent/ChildProfile';
import Rhythm from './pages/parent/Rhythm';
import Materials from './pages/parent/Materials';
import Sources from './pages/parent/Sources';
import EchoSettings from './pages/parent/EchoSettings';
import Snapshot from './pages/parent/Snapshot';
import Responsibilities from './pages/parent/Responsibilities';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="p-10 text-center">
      <p className="text-xl font-bold">That page isn&rsquo;t here.</p>
      <Link to="/child" className="btn-primary mt-4">🏠 Home</Link>
    </div>
  );
}

export default function App() {
  const [params] = useSearchParams();
  const setMode = useStore((s) => s.setMode);
  const logEvent = useStore((s) => s.logEvent);
  const loc = useLocation();

  useEffect(() => {
    const m = params.get('mode');
    if (m === 'review' || m === 'participant') setMode(m);
  }, [params, setMode]);

  useEffect(() => {
    if (!safeSessionGet('cii-session')) {
      safeSessionSet('cii-session', '1');
      logEvent('session_started');
    }
  }, [logEvent]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  const p = (el: JSX.Element) => <RequireParent>{el}</RequireParent>;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2">Skip to content</a>
      <Routes>
        <Route path="/" element={<RoleChooser />} />
        <Route path="/child" element={<ChildHome />} />
        <Route path="/child/study" element={<Study />} />
        <Route path="/child/create" element={<Create />} />
        <Route path="/child/watch" element={<Watch />} />
        <Route path="/child/move" element={<Move />} />
        <Route path="/child/explore" element={<Explore />} />
        <Route path="/child/ask-guide" element={<AskGuide />} />
        <Route path="/child/sharing" element={<Sharing />} />
        <Route path="/parent/login" element={<ParentLogin />} />
        <Route path="/parent" element={p(<Overview />)} />
        <Route path="/parent/child" element={p(<ChildProfile />)} />
        <Route path="/parent/rhythm" element={p(<Rhythm />)} />
        <Route path="/parent/materials" element={p(<Materials />)} />
        <Route path="/parent/sources" element={p(<Sources />)} />
        <Route path="/parent/echo" element={p(<EchoSettings />)} />
        <Route path="/parent/snapshot" element={p(<Snapshot />)} />
        <Route path="/parent/responsibilities" element={p(<Responsibilities />)} />
        <Route path="/review" element={<Review />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ExternalInterstitial />
      <ModeCorner />
    </>
  );
}

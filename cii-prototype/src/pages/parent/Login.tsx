import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ReviewNote } from '../../components/Badges';
import { DemoGuide } from '../../components/DemoGuide';
import { useStore } from '../../store/useStore';

const DEMO_PIN = '2026';
const COOLDOWN_MS = 30_000;

export default function ParentLogin() {
  const unlocked = useStore((s) => s.parentUnlocked);
  const failures = useStore((s) => s.pinFailures);
  const cooldownUntil = useStore((s) => s.pinCooldownUntil);
  const set = useStore((s) => s.set);
  const navigate = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? '/parent';
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (unlocked) navigate(from, { replace: true });
  }, [unlocked, from, navigate]);

  const cooling = cooldownUntil > now;
  useEffect(() => {
    if (!cooling) return;
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [cooling]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooling) return;
    if (pin === DEMO_PIN) {
      set({ parentUnlocked: true, pinFailures: 0, pinCooldownUntil: 0 });
      return;
    }
    const f = failures + 1;
    setPin('');
    if (f >= 3) {
      set({ pinFailures: 0, pinCooldownUntil: Date.now() + COOLDOWN_MS });
      setNow(Date.now());
      setError('Too many tries. Please wait a moment and try again.');
    } else {
      set({ pinFailures: f });
      setError(`That PIN didn't match. ${3 - f} ${3 - f === 1 ? 'try' : 'tries'} left before a short pause.`);
    }
  };

  const remaining = Math.ceil((cooldownUntil - now) / 1000);

  return (
    <div className="min-h-screen bg-parent-soft/50">
      <DemoGuide />
      <div className="mx-auto flex max-w-md flex-col px-4 py-12">
        <Link to="/child" className="btn-ghost mb-6 self-start" aria-label="Home">🏠 Back to child space</Link>
        <div className="card">
          <p className="text-5xl" aria-hidden>🔒</p>
          <h1 className="mt-2 text-2xl font-bold">Parent Access</h1>
          <p className="text-muted">Locked. Enter the parent PIN to change settings.</p>
          <form onSubmit={submit} className="mt-5">
            <label htmlFor="pin" className="label">PIN</label>
            <input
              id="pin"
              className="input mt-1 text-center font-mono text-2xl tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              disabled={cooling}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              aria-describedby="pin-msg"
            />
            <div id="pin-msg" role="alert" className="mt-2 min-h-[1.5rem] text-sm text-danger">
              {cooling ? `Short pause: try again in ${remaining}s.` : error}
            </div>
            <button className="btn-parent mt-2 w-full" disabled={cooling || pin.length < 4}>Unlock</button>
          </form>
          <DemoPinHint />
        </div>
        <ReviewNote>Real parent authentication and child-session separation are untested. Three wrong PINs trigger a 30 second cooldown.</ReviewNote>
      </div>
    </div>
  );
}

function DemoPinHint() {
  const mode = useStore((s) => s.mode);
  if (mode !== 'review') return null;
  return <p className="mt-4 rounded-lg bg-note-soft px-3 py-2 text-sm text-note">Demo mode: the PIN is <span className="font-mono font-bold">2026</span>.</p>;
}

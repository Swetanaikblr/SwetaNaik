import { useEffect, useState } from 'react';

/** Optional, child-controlled count-up timer. No targets, nothing recorded. */
export function SoftTimer() {
  const [running, setRunning] = useState(false);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setSec((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [running]);
  return (
    <div className="mt-3 flex items-center gap-3">
      <span className="font-mono text-2xl" aria-live="off">{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}</span>
      <button className="btn-soft" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Start'}</button>
      <button className="btn-ghost" onClick={() => { setRunning(false); setSec(0); }}>Reset</button>
      <span className="text-xs text-muted">Just for you. Not saved.</span>
    </div>
  );
}

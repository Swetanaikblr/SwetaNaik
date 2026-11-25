import { useState } from 'react';
import { ChildLayout } from '../../components/ChildLayout';
import { ReviewNote } from '../../components/Badges';
import { ASK_GUIDE_EXAMPLES, askGuideReply } from '../../data/askGuide';
import { useStore } from '../../store/useStore';

export default function AskGuide() {
  const logEvent = useStore((s) => s.logEvent);
  const [q, setQ] = useState('');
  const [thread, setThread] = useState<{ q: string; a: string[] }[]>([]);

  const ask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    if (thread.length === 0) logEvent('activity_started', { category: 'askGuide' });
    setThread((th) => [...th, { q: t, a: askGuideReply(t) }]);
    setQ('');
  };

  return (
    <ChildLayout title="Ask Guide" status="proposed">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border-2 border-dashed border-ai/40 bg-ai-soft px-4 py-3 text-sm font-semibold text-ai">
          AI help (prototype), scripted examples only.
        </div>
        <p className="mt-4 text-lg text-muted">Stuck on something? Ask Guide helps you think it through with questions and hints, not answers.</p>

        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
          <label htmlFor="ask" className="sr-only">Your question</label>
          <input id="ask" className="input text-lg" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your question…" maxLength={200} autoComplete="off" />
          <button className="btn bg-ai text-white hover:bg-ai/90" disabled={!q.trim()}>Ask</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="label self-center">Try:</span>
          {ASK_GUIDE_EXAMPLES.map((e) => <button key={e} className="chip" onClick={() => ask(e)}>{e}</button>)}
        </div>

        <ol className="mt-6 space-y-4" aria-live="polite">
          {thread.map((t, i) => (
            <li key={i}>
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl bg-accent-soft px-4 py-2">{t.q}</p>
              <div className="mt-2 max-w-[90%] rounded-2xl border border-ai/30 bg-ai-soft p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ai">AI help (prototype)</p>
                <ul className="mt-1 space-y-1">
                  {t.a.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ol>
        {thread.length > 0 && (
          <button className="btn-ghost mt-4" onClick={() => { setThread([]); logEvent('activity_stopped', { category: 'askGuide' }); }}>Clear and start over</button>
        )}
        <ReviewNote>Bounded AI explanations or hints are a potential future capability and not verified. Do not represent as implemented.</ReviewNote>
      </div>
    </ChildLayout>
  );
}

import { useState } from 'react';
import { ChildLayout } from '../../components/ChildLayout';
import { Proposed, ReviewNote, SampleLabel } from '../../components/Badges';
import { CURIOSITY_PROMPTS, OFFLINE_IDEAS, QUICK_FACTS, READING_NOOK } from '../../data/explore';
import { useStore } from '../../store/useStore';

function Calculator() {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string>('0');
  const press = (k: string) => {
    if (k === 'C') { setExpr(''); setResult('0'); return; }
    if (k === '⌫') { setExpr((e) => e.slice(0, -1)); return; }
    if (k === '=') {
      try {
        // Safe evaluation: digits, operators, parentheses and dots only.
        const clean = expr.replace(/×/g, '*').replace(/÷/g, '/');
        if (!/^[\d+\-*/.() ]+$/.test(clean)) throw new Error('bad');
        // eslint-disable-next-line no-new-func
        const v = Function(`"use strict"; return (${clean});`)() as number;
        if (!Number.isFinite(v)) throw new Error('bad');
        setResult(String(Math.round(v * 1e8) / 1e8));
      } catch {
        setResult('Hmm, try again');
      }
      return;
    }
    setExpr((e) => (e + k).slice(0, 40));
  };
  const keys = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '(', '+', ')', '⌫', 'C', '='];
  return (
    <div className="card">
      <h2 className="text-xl font-bold">🧮 Calculator</h2>
      <div className="mt-3 rounded-xl bg-paper p-3 text-right font-mono" aria-live="polite">
        <div className="min-h-[1.5rem] text-sm text-muted" aria-label="Expression">{expr || ' '}</div>
        <div className="text-3xl" aria-label="Result">{result}</div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            aria-label={k === '⌫' ? 'Delete' : k === 'C' ? 'Clear' : k === '×' ? 'times' : k === '÷' ? 'divide' : k}
            className={`min-h-[52px] rounded-xl text-xl font-bold ${k === '=' ? 'bg-brand text-white' : /[÷×\-+]/.test(k) ? 'bg-brand-soft text-brand' : 'bg-paper hover:bg-line'}`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReadingNook() {
  const [size, setSize] = useState(20);
  return (
    <div className="card bg-amber-50/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">📖 Reading Nook</h2>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={() => setSize((s) => Math.max(14, s - 2))} aria-label="Smaller text">A−</button>
          <button className="btn-ghost text-lg" onClick={() => setSize((s) => Math.min(32, s + 2))} aria-label="Bigger text">A+</button>
        </div>
      </div>
      <article className="mt-3" style={{ fontSize: size, lineHeight: 1.6 }}>
        <h3 className="font-bold">{READING_NOOK.title}</h3>
        {READING_NOOK.paragraphs.map((p) => <p key={p} className="mt-3">{p}</p>)}
      </article>
      <p className="mt-3 text-xs text-muted">{READING_NOOK.attribution}</p>
    </div>
  );
}

export default function Explore() {
  const tried = useStore((s) => s.triedIdeas);
  const set = useStore((s) => s.set);
  const logEvent = useStore((s) => s.logEvent);
  const [fact, setFact] = useState(0);
  const [prompt, setPrompt] = useState(0);

  const markTried = (id: string) => {
    set({ triedIdeas: { ...tried, [id]: Date.now() } });
    logEvent('child_reported_tried', { category: 'explore', ref: id });
  };
  const unmark = (id: string) => {
    const next = { ...tried };
    delete next[id];
    set({ triedIdeas: next });
  };

  return (
    <ChildLayout title="Explore & Tools">
      <div className="grid gap-5 md:grid-cols-2">
        <Calculator />
        <ReadingNook />

        <div className="card bg-teal-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">✨ Quick fact</h2>
            <SampleLabel text="Sample" />
          </div>
          <p className="mt-3 text-lg" aria-live="polite">{QUICK_FACTS[fact]}</p>
          <button className="btn-soft mt-3" onClick={() => setFact((f) => (f + 1) % QUICK_FACTS.length)}>Another fact</button>
        </div>

        <div className="card bg-violet-50">
          <h2 className="text-xl font-bold">🤔 Curiosity prompt</h2>
          <p className="mt-3 text-lg" aria-live="polite">{CURIOSITY_PROMPTS[prompt]}</p>
          <button className="btn-soft mt-3" onClick={() => setPrompt((p) => (p + 1) % CURIOSITY_PROMPTS.length)}>Another one</button>
        </div>

        <div className="card md:col-span-2">
          <h2 className="text-xl font-bold">🌳 Ideas away from the screen</h2>
          <p className="text-sm text-muted">Just ideas. CII can&rsquo;t see what you do offline.</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {OFFLINE_IDEAS.map((o) => (
              <li key={o.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <span className="text-3xl" aria-hidden>{o.emoji}</span>
                <span className="flex-1">{o.text}</span>
                {tried[o.id] ? (
                  <button className="chip bg-sky-50 text-sky-800" onClick={() => unmark(o.id)} aria-label={`You said you tried this. Tap to undo.`}>
                    You said you tried it 👍
                  </button>
                ) : (
                  <button className="chip" onClick={() => markTried(o.id)}>I tried this</button>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">"I tried this" is <span className="font-semibold">child-reported</span>: only you tap it, and it&rsquo;s optional.<Proposed /></p>
        </div>
      </div>
      <ReviewNote>Offline ideas are never marked completed by the app. The optional "I tried this" tap is child-reported and shows as such in the parent Snapshot.</ReviewNote>
    </ChildLayout>
  );
}

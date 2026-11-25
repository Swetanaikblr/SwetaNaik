import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildLayout } from '../../components/ChildLayout';
import { Proposed, ReviewNote } from '../../components/Badges';
import { newId, useStore } from '../../store/useStore';

const COLORS = [
  { name: 'Black', v: '#1e293b' },
  { name: 'Red', v: '#dc2626' },
  { name: 'Orange', v: '#ea580c' },
  { name: 'Green', v: '#16a34a' },
  { name: 'Blue', v: '#2563eb' },
  { name: 'Purple', v: '#9333ea' },
];
const PROMPTS = [
  'Draw a creature that lives in a library.',
  'Draw your dream treehouse.',
  'Draw a robot that helps with one silly job.',
  'Draw what the weather looks like inside a cloud.',
  'Draw a map of an island nobody has found yet.',
];
const STARTERS = [
  'The door at the end of the hallway had never been open before, until today…',
  'My pet woke up one morning and could talk. The first thing it said was…',
  'The map was old and torn, but one corner showed a big red X…',
];

function Canvas({ onSave }: { onSave: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const history = useRef<ImageData[]>([]);
  const [color, setColor] = useState(COLORS[0].v);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const pos = (e: React.PointerEvent) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  const snapshot = () => {
    const c = ref.current!;
    history.current.push(c.getContext('2d')!.getImageData(0, 0, c.width, c.height));
    if (history.current.length > 20) history.current.shift();
    setCanUndo(true);
  };
  const down = (e: React.PointerEvent) => {
    snapshot();
    drawing.current = true;
    ref.current!.setPointerCapture(e.pointerId);
    const ctx = ref.current!.getContext('2d')!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext('2d')!;
    const p = pos(e);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#fff' : color;
    ctx.lineWidth = tool === 'eraser' ? 24 : 6;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const up = () => { drawing.current = false; };
  const undo = () => {
    const img = history.current.pop();
    if (img) ref.current!.getContext('2d')!.putImageData(img, 0, 0);
    setCanUndo(history.current.length > 0);
  };
  const clear = () => {
    snapshot();
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2" role="toolbar" aria-label="Drawing tools">
        <button className={tool === 'pen' ? 'btn-primary' : 'btn-ghost'} aria-pressed={tool === 'pen'} onClick={() => setTool('pen')}>✏️ Pen</button>
        <button className={tool === 'eraser' ? 'btn-primary' : 'btn-ghost'} aria-pressed={tool === 'eraser'} onClick={() => setTool('eraser')}>🧽 Eraser</button>
        <span className="mx-1 h-8 w-px bg-line" aria-hidden />
        {COLORS.map((c) => (
          <button
            key={c.v}
            aria-label={`Colour ${c.name}`}
            aria-pressed={color === c.v && tool === 'pen'}
            onClick={() => { setColor(c.v); setTool('pen'); }}
            className={`h-11 w-11 rounded-full border-4 ${color === c.v && tool === 'pen' ? 'border-ink' : 'border-white shadow'}`}
            style={{ background: c.v }}
          />
        ))}
        <span className="mx-1 h-8 w-px bg-line" aria-hidden />
        <button className="btn-ghost" onClick={undo} disabled={!canUndo}>↩️ Undo</button>
        <button className="btn-ghost" onClick={clear}>🗑️ Clear</button>
        <button className="btn-soft ml-auto" onClick={() => onSave(ref.current!.toDataURL('image/jpeg', 0.6))}>💾 Save to My creations</button>
      </div>
      <canvas
        ref={ref}
        width={900}
        height={560}
        aria-label="Drawing canvas"
        className="w-full touch-none rounded-2xl border border-line bg-white shadow-inner"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      />
    </div>
  );
}

export default function Create() {
  const navigate = useNavigate();
  const logEvent = useStore((s) => s.logEvent);
  const creations = useStore((s) => s.creations);
  const addCreation = useStore((s) => s.addCreation);
  const removeCreation = useStore((s) => s.removeCreation);
  const [mode, setMode] = useState<'draw' | 'story'>('draw');
  const [promptIdx, setPromptIdx] = useState<number | null>(null);
  const [story, setStory] = useState('');
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    logEvent('activity_started', { category: 'create', ref: 'draw' });
  }, [logEvent]);

  const flash = (t: string) => { setSaved(t); window.setTimeout(() => setSaved(null), 2500); };
  const stop = () => { logEvent('activity_stopped', { category: 'create' }); logEvent('returned_home'); navigate('/child'); };

  return (
    <ChildLayout title="Draw & Create" status="proposed">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Create mode" className="flex gap-2">
          <button role="tab" aria-selected={mode === 'draw'} className={mode === 'draw' ? 'btn-primary' : 'btn-ghost'} onClick={() => setMode('draw')}>🎨 Draw</button>
          <button role="tab" aria-selected={mode === 'story'} className={mode === 'story' ? 'btn-primary' : 'btn-ghost'} onClick={() => setMode('story')}>📝 Story starter</button>
        </div>
        <button className="btn-ghost ml-auto" onClick={stop} aria-label="Stop and go back home">✋ Stop</button>
      </div>

      <div className="mb-4 card flex flex-wrap items-center gap-3 bg-rose-50">
        <span className="text-2xl" aria-hidden>🃏</span>
        <p className="flex-1 font-semibold">
          {promptIdx === null ? 'Want an idea? Pick a prompt card, or just draw anything.' : PROMPTS[promptIdx]}
        </p>
        <button className="btn-soft" onClick={() => setPromptIdx((i) => (i === null ? 0 : i))}>
          {promptIdx === null ? 'Give me a prompt' : 'Keep this one'}
        </button>
        {promptIdx !== null && (
          <button className="btn-ghost" onClick={() => { logEvent('activity_skipped', { category: 'create', ref: 'prompt' }); setPromptIdx((promptIdx + 1) % PROMPTS.length); }}>
            ⏭ Skip
          </button>
        )}
      </div>

      {mode === 'draw' ? (
        <Canvas onSave={(d) => { addCreation({ id: newId(), kind: 'drawing', createdAt: Date.now(), dataUrl: d, title: promptIdx !== null ? PROMPTS[promptIdx] : 'My drawing' }); flash('Saved to My creations'); }} />
      ) : (
        <div className="card">
          <p className="label mb-2">Pick a starter, or write your own</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {STARTERS.map((s) => <button key={s} className="chip text-left" onClick={() => setStory(s + ' ')}>{s.slice(0, 40)}…</button>)}
          </div>
          <label htmlFor="story" className="sr-only">Your story</label>
          <textarea id="story" className="input min-h-[200px] text-lg leading-relaxed" value={story} onChange={(e) => setStory(e.target.value)} placeholder="Once upon a time…" />
          <div className="mt-3 flex justify-end">
            <button className="btn-soft" disabled={!story.trim()} onClick={() => { addCreation({ id: newId(), kind: 'story', createdAt: Date.now(), text: story, title: story.slice(0, 40) }); flash('Saved to My creations'); }}>
              💾 Save to My creations
            </button>
          </div>
        </div>
      )}
      {saved && <p role="status" className="mt-3 text-center font-semibold text-accent">{saved}</p>}

      <section className="mt-6" aria-labelledby="gallery">
        <h2 id="gallery" className="text-xl font-bold">My creations</h2>
        <p className="text-sm text-muted">Only you can see these. They stay on this device.<Proposed /></p>
        {creations.length === 0 ? (
          <p className="mt-2 text-muted">Nothing saved yet. No rush.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {creations.map((c) => (
              <li key={c.id} className="card p-2">
                {c.kind === 'drawing' ? (
                  <img src={c.dataUrl} alt={`Drawing: ${c.title}`} className="aspect-[900/560] w-full rounded-lg object-cover" />
                ) : (
                  <p className="line-clamp-4 h-24 overflow-hidden rounded-lg bg-paper p-2 text-sm">{c.text}</p>
                )}
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span className="truncate text-xs text-muted">{c.title}</span>
                  <button className="min-h-[44px] min-w-[44px] text-sm" aria-label={`Delete ${c.title}`} onClick={() => removeCreation(c.id)}>🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <ReviewNote>No scoring, no skill gate, nothing to finish first. Gallery is child-only; drawings are not shared with the parent view.</ReviewNote>
    </ChildLayout>
  );
}

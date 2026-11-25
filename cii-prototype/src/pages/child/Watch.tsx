import { useState } from 'react';
import { ChildLayout } from '../../components/ChildLayout';
import { ReviewNote, SampleLabel } from '../../components/Badges';
import { useStore } from '../../store/useStore';
import type { Source, SourceItem } from '../../types';

function Thumb({ item, big = false }: { item: SourceItem; big?: boolean }) {
  return (
    <div
      className={`flex w-full items-center justify-center rounded-xl ${big ? 'aspect-video text-8xl' : 'aspect-video text-5xl'}`}
      style={{ background: `linear-gradient(135deg, hsl(${item.hue} 70% 88%), hsl(${(item.hue + 40) % 360} 70% 78%))` }}
      aria-hidden
    >
      {item.emoji}
    </div>
  );
}

export default function Watch() {
  const sources = useStore((s) => s.sources);
  const logEvent = useStore((s) => s.logEvent);
  const openExternal = useStore((s) => s.openExternal);
  const [playing, setPlaying] = useState<{ item: SourceItem; source: Source } | null>(null);
  const [paused, setPaused] = useState(false);

  const approved = sources.filter((s) => s.approvedInCII);
  const entries = approved.flatMap((s) => s.items.map((item) => ({ item, source: s })));

  const choose = (item: SourceItem, source: Source) => {
    if (source.launch === 'outside') {
      openExternal(source.name);
      return;
    }
    setPlaying({ item, source });
    setPaused(false);
    if (item.unavailable || source.launch === 'unavailable') logEvent('watch_unavailable_shown', { category: 'watch', ref: item.id });
    else logEvent('activity_started', { category: 'watch', ref: source.id });
  };

  const back = (stopped: boolean) => {
    if (stopped && playing && !playing.item.unavailable) logEvent('activity_stopped', { category: 'watch' });
    setPlaying(null);
  };

  if (playing) {
    const unavailable = playing.item.unavailable || playing.source.launch === 'unavailable';
    return (
      <ChildLayout title="Watch">
        <div className="mx-auto max-w-3xl">
          <button className="btn-ghost mb-3" onClick={() => back(true)}>← Back to Watch</button>
          {unavailable ? (
            <div className="card text-center" role="status">
              <p className="text-5xl" aria-hidden>📼</p>
              <h2 className="mt-2 text-xl font-bold">This video isn&rsquo;t available right now</h2>
              <p className="mt-1 text-muted">Not your fault! Want to pick another one?</p>
              <button className="btn-primary mt-4" onClick={() => back(false)}>Back to Watch</button>
            </div>
          ) : (
            <div className="card">
              <div className="relative">
                <Thumb item={playing.item} big />
                {paused && <span className="absolute inset-0 flex items-center justify-center text-6xl" aria-hidden>⏸</span>}
              </div>
              <h2 className="mt-3 text-xl font-bold">{playing.item.title}</h2>
              <p className="text-sm text-muted">{playing.source.name} <SampleLabel text="Mock player" /></p>
              <div className="mt-3 flex gap-2">
                <button className="btn-primary" onClick={() => setPaused((p) => !p)} aria-pressed={!paused}>{paused ? '▶ Play' : '⏸ Pause'}</button>
                <button className="btn-ghost" onClick={() => back(true)}>⏹ Stop</button>
              </div>
            </div>
          )}
          <ReviewNote>Controls inside third-party players are untested. Do not claim universal control.</ReviewNote>
        </div>
      </ChildLayout>
    );
  }

  return (
    <ChildLayout title="Watch">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold">Approved by your parent</h2>
        <SampleLabel text="Placeholder titles" />
      </div>
      {entries.length === 0 ? (
        <p className="card text-muted">Nothing here yet. Your parent can add videos.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {entries.map(({ item, source }) => (
            <li key={item.id}>
              <button className="card w-full p-3 text-left hover:shadow-md" onClick={() => choose(item, source)}>
                <Thumb item={item} />
                <span className="mt-2 block font-semibold">{item.title}</span>
                <span className="block text-xs text-muted">
                  {source.name}
                  {source.launch === 'outside' && <span className="ml-1 font-semibold text-note">· opens outside CII ↗</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <ReviewNote>
        "How bees talk" is seeded as unavailable to show the friendly error. "Puzzle Garden" opens the external interstitial. Asking Echo for something not on this list shows: "That one isn't in your approved list."
      </ReviewNote>
    </ChildLayout>
  );
}

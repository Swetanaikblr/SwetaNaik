import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

/** Small corner control for facilitators: Participant / Review mode. */
export function ModeCorner() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const review = mode === 'review';
  return (
    <div className="fixed bottom-3 right-3 z-40 flex items-center gap-2 rounded-full border border-line bg-card/95 px-2 py-1 text-xs shadow-md backdrop-blur">
      {review && (
        <Link to="/review" className="inline-flex min-h-[36px] items-center rounded-full px-3 font-bold text-note hover:bg-note-soft">
          Review panel
        </Link>
      )}
      <button
        role="switch"
        aria-checked={review}
        aria-label="Review mode"
        onClick={() => setMode(review ? 'participant' : 'review')}
        className="inline-flex min-h-[36px] items-center gap-2 rounded-full px-3 font-semibold text-muted hover:bg-paper"
      >
        <span className={`inline-block h-3 w-3 rounded-full ${review ? 'bg-note' : 'bg-slate-300'}`} aria-hidden />
        Review mode {review ? 'on' : 'off'}
      </button>
    </div>
  );
}

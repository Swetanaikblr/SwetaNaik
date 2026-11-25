import { ParentLayout } from '../../components/ParentLayout';
import { HonestNote, ReviewNote } from '../../components/Badges';
import { CATEGORY_META } from '../../data/categories';
import { CONTEXT_LABEL } from '../../data/scenarios';
import { useStore } from '../../store/useStore';
import { CATEGORIES, type TimeContext } from '../../types';

const CONTEXTS: TimeContext[] = ['afterSchool', 'evening', 'weekend'];

export default function Rhythm() {
  const rhythm = useStore((s) => s.rhythm);
  const enabled = useStore((s) => s.child.categoriesEnabled);
  const toggle = useStore((s) => s.toggleRhythm);
  return (
    <ParentLayout title="Daily rhythm" status="proposed" intro="Broad parts of the day only. Choose which options are offered in each.">
      <div className="card relative overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <caption className="sr-only">Categories offered per part of the day</caption>
          <thead>
            <tr>
              <th scope="col" className="py-2 pr-4">Category</th>
              {CONTEXTS.map((c) => <th key={c} scope="col" className="px-2 py-2 text-center">{CONTEXT_LABEL[c]}</th>)}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => (
              <tr key={cat} className="border-t border-line">
                <th scope="row" className="py-2 pr-4 font-semibold">
                  {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
                  {!enabled[cat] && <span className="ml-2 text-xs font-normal text-muted">(off in profile)</span>}
                </th>
                {CONTEXTS.map((ctx) => (
                  <td key={ctx} className="px-2 py-1 text-center">
                    <button
                      role="switch"
                      aria-checked={rhythm[ctx][cat]}
                      aria-label={`${CATEGORY_META[cat].label} during ${CONTEXT_LABEL[ctx]}`}
                      onClick={() => toggle(ctx, cat)}
                      disabled={!enabled[cat]}
                      className={`min-h-[44px] min-w-[96px] rounded-lg px-3 text-sm font-bold disabled:opacity-40 ${rhythm[ctx][cat] ? 'bg-accent-soft text-accent' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {rhythm[ctx][cat] ? 'Offered' : 'Not now'}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <HonestNote>Rhythm influences which options are offered, not a rigid timetable. "Not now" shows the tile as "Not available right now" on Home.</HonestNote>
      <ReviewNote>No minute-by-minute scheduler by design. Context is taken from the Demo Guide scenario, or the real clock (weekday before 5 PM = After school, after = Evening, Sat/Sun = Weekend).</ReviewNote>
    </ParentLayout>
  );
}

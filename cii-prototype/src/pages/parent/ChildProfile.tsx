import { useState } from 'react';
import { ParentLayout } from '../../components/ParentLayout';
import { ReviewNote } from '../../components/Badges';
import { Toggle } from '../../components/Toggle';
import { CATEGORY_META } from '../../data/categories';
import { useStore } from '../../store/useStore';
import { CATEGORIES, type AgeBand } from '../../types';

function Why({ children }: { children: string }) {
  return <p className="mt-1 text-xs text-muted">Why we ask: {children}</p>;
}

const INTEREST_OPTIONS = ['Space', 'Animals', 'Drawing', 'Football', 'Music', 'Building', 'Stories', 'Science'];

export default function ChildProfile() {
  const child = useStore((s) => s.child);
  const updateChild = useStore((s) => s.updateChild);
  const toggleCategory = useStore((s) => s.toggleCategory);
  const [name, setName] = useState(child.name);

  const toggleInterest = (i: string) =>
    updateChild({ interests: child.interests.includes(i) ? child.interests.filter((x) => x !== i) : [...child.interests, i] });

  return (
    <ParentLayout title="Child profile and age band" status="proposed" intro="Only what's needed to shape the space. No birthdays, photos or school names.">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card">
          <label htmlFor="cname" className="font-semibold">Name or nickname</label>
          <div className="mt-1 flex gap-2">
            <input id="cname" className="input" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
            <button className="btn-parent" onClick={() => updateChild({ name: name.trim() || 'Friend' })}>Save</button>
          </div>
          <Why>shown in the child's greeting. A nickname is fine.</Why>

          <fieldset className="mt-5">
            <legend className="font-semibold">Age band</legend>
            <div className="mt-2 flex gap-2">
              {(['8-10', '11-14'] as AgeBand[]).map((b) => (
                <button key={b} className={child.ageBand === b ? 'btn-parent' : 'btn-ghost'} aria-pressed={child.ageBand === b} onClick={() => updateChild({ ageBand: b })}>
                  {b}
                </button>
              ))}
            </div>
            <Why>sets the reading level of Echo and screen text, and which version of "What my parent can see" is shown.</Why>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="font-semibold">Interests (optional)</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((i) => (
                <button key={i} className={`chip ${child.interests.includes(i) ? 'border-parent bg-parent-soft text-parent' : ''}`} aria-pressed={child.interests.includes(i)} onClick={() => toggleInterest(i)}>
                  {i}
                </button>
              ))}
            </div>
            <Why>may shape which ideas are offered first. Not used for anything else in this prototype.</Why>
          </fieldset>
        </section>

        <section className="card space-y-3">
          <h2 className="text-lg font-bold">Content preferences</h2>
          <Toggle checked={child.contentPrefs.calmerContent} onChange={(v) => updateChild({ contentPrefs: { ...child.contentPrefs, calmerContent: v } })} label="Prefer calmer content" description="Why: some children wind down better with slower videos." />
          <Toggle checked={child.contentPrefs.includeScience} onChange={(v) => updateChild({ contentPrefs: { ...child.contentPrefs, includeScience: v } })} label="Include science and nature" description="Why: helps pick facts and prompts." />
          <Toggle checked={child.contentPrefs.includeStories} onChange={(v) => updateChild({ contentPrefs: { ...child.contentPrefs, includeStories: v } })} label="Include stories" description="Why: helps pick Reading Nook items." />
          <p className="text-xs text-muted">Prototype: these preferences are stored but only lightly used.</p>

          <h2 className="pt-3 text-lg font-bold">Available categories</h2>
          <p className="text-sm text-muted">Turning one off removes its tile from your child&rsquo;s Home.</p>
          {CATEGORIES.map((c) => (
            <Toggle key={c} checked={child.categoriesEnabled[c]} onChange={() => toggleCategory(c)} label={`${CATEGORY_META[c].icon} ${CATEGORY_META[c].label}`} />
          ))}
        </section>
      </div>
      <ReviewNote>Single child only. Multi-child support is out of scope.</ReviewNote>
    </ParentLayout>
  );
}

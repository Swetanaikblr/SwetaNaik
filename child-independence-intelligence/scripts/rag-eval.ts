/**
 * Retrieval evaluation for the Study tutor (no API calls, no cost).
 *
 *   npx tsx scripts/rag-eval.ts             # retrieval only, against the sample materials (free)
 *   npx tsx scripts/rag-eval.ts --generate  # also ask Claude each question (needs ANTHROPIC_API_KEY;
 *                                           # ~30 Claude Opus 5.5 calls at low effort, a few cents)
 *
 * Each case says which passage should come back (by a phrase it must contain), or that nothing
 * should (questions the sample materials don't cover). Reports hit@1, hit@3 and how many
 * out-of-scope questions were correctly left without sources.
 */
import os from 'os';
import path from 'path';

process.env.RAG_STORE_PATH = path.join(os.tmpdir(), `rag-eval-${process.pid}.json`); // always start from samples

type Case = { q: string; subjectId?: string; expect: string | null; note?: string };

const CASES: Case[] = [
  // Maths, chapter 4
  { q: 'How do I solve question 5?', subjectId: 'math', expect: 'Question 5' },
  { q: 'a number added to its two thirds is 35', expect: 'two-thirds' },
  { q: 'what is transposing a term', subjectId: 'math', expect: 'Transposition' },
  { q: 'what happens if I move a plus term to the other side', expect: 'Transposing a term with (+)' },
  { q: "help with Ravi's age question", expect: "Ravi's age" },
  { q: 'what is a linear equation', expect: 'linear equation has the highest power' },
  { q: 'consecutive multiples of 8', expect: 'consecutive multiples of 8' },
  { q: 'rectangle perimeter question', expect: 'perimeter of a rectangle' },
  { q: 'can I divide both sides by a number', expect: 'dividing both sides' },
  // Science, chapter 6 (photo page)
  { q: 'what is the equation for photosynthesis', expect: '6 CO2 + 6 H2O' },
  { q: 'what do guard cells do', expect: 'Guard cells' },
  { q: 'what does chlorophyll do', subjectId: 'science', expect: 'chlorophyll' },
  { q: 'what are stomata for', expect: 'stomatal pores' },
  { q: 'what is photolysis', expect: 'photolysis' },
  // Science notes (digestion)
  { q: 'what does saliva do to starch', expect: 'Salivary Amylase' },
  { q: 'why is there acid in the stomach', expect: 'Hydrochloric acid' },
  { q: 'what does bile do', expect: 'bile' },
  { q: 'what are villi', expect: 'Villi' },
  { q: 'what happens in the large intestine', expect: 'Large Intestine' },
  { q: 'what is peristalsis', expect: 'peristaltic' },
  // Child phrasing that doesn't share words with the notes (needs query expansion with Claude)
  { q: 'how do plants make their food', expect: 'Photosynthesis', note: 'paraphrase' },
  { q: 'where does food get absorbed into the blood', expect: 'Villi', note: 'paraphrase' },
  // Not in the materials: should return nothing
  { q: 'who was the first prime minister of India', expect: null },
  { q: 'how do volcanoes erupt', expect: null },
  { q: 'what is the past tense of run', expect: null },
  { q: 'how many players are in a football team', expect: null },
  // Off-topic but sharing words with the notes: retrieval may return something; the tutor prompt
  // then has to say it isn't covered. Tracked separately.
  { q: 'what is the formula for the area of a circle', expect: null, note: 'near-miss' },
  { q: 'how does the heart pump blood', expect: null, note: 'near-miss' },
];

// Multi-turn follow-ups, run through the full tutor retrieval (no model call needed for these).
const FOLLOW_UPS: { history: string; q: string; expect: string | null }[] = [
  { history: 'How do I solve question 5?', q: 'and question 6?', expect: 'Question 6' },
  { history: 'How do I solve question 5?', q: 'what about the next one', expect: 'Question 6' },
  { history: 'How do I solve question 5?', q: 'why does that work', expect: 'Question 5' },
  { history: 'How do I solve question 5?', q: 'how do volcanoes erupt', expect: null },
  { history: 'what does bile do', q: 'and what about the stomach?', expect: 'Stomach' },
];

async function main() {
  const { loadStore, search, getChunk } = await import('../server/rag/store');
  const { tutor } = await import('../server/rag/tutor');
  const generate = process.argv.includes('--generate');
  if (!generate) {
    // Retrieval-only run: make sure no model is called (query expansion included).
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_AUTH_TOKEN;
  }
  loadStore();
  let hit1 = 0, hit3 = 0, pos = 0, negOk = 0, neg = 0;
  const misses: string[] = [];
  for (const c of CASES) {
    const hits = search(c.q, { subjectId: c.subjectId, k: 3 });
    if (c.expect === null) {
      neg++;
      if (hits.length === 0) negOk++;
      else misses.push(`  [should be empty${c.note ? `, ${c.note}` : ''}] "${c.q}" -> ${hits[0].id} (${hits[0].score.toFixed(2)})`);
      continue;
    }
    pos++;
    const want = c.expect.toLowerCase();
    const rank = hits.findIndex((h) => (h.text + ' ' + h.section).toLowerCase().includes(want));
    if (rank === 0) hit1++;
    if (rank >= 0) hit3++;
    else misses.push(`  [miss${c.note ? `, ${c.note}` : ''}] "${c.q}" -> ${hits.map((h) => `${h.id}(${h.score.toFixed(2)})`).join(', ') || 'no hits'}`);
  }
  console.log(`Answerable questions: hit@1 ${hit1}/${pos}, hit@3 ${hit3}/${pos}`);
  console.log(`Out-of-scope questions with no sources: ${negOk}/${neg}`);

  let fuOk = 0;
  for (const f of FOLLOW_UPS) {
    const r = await tutor({ question: f.q, childName: 'Aarav', history: [{ sender: 'child', text: f.history }, { sender: 'ai', text: '…' }] });
    const top = r.sources[0];
    const topText = top ? `${top.section}\n${getChunk(top.chunkId)?.text ?? ''}`.toLowerCase() : '';
    const ok = f.expect === null ? r.sources.length === 0 : topText.includes(f.expect.toLowerCase());
    if (ok) fuOk++;
    else misses.push(`  [follow-up] "${f.history}" -> "${f.q}" -> ${top ? top.section : 'no sources'}`);
  }
  console.log(`Follow-up questions resolved: ${fuOk}/${FOLLOW_UPS.length}`);
  if (misses.length) console.log('Misses:\n' + misses.join('\n'));

  if (!generate) return;
  // Generation check: answerable questions should come back grounded with citations;
  // out-of-scope ones should say they aren't in the notes (grounded: false).
  console.log('\nGeneration (Claude):');
  let gOk = 0;
  for (const c of CASES) {
    const r = await tutor({ question: c.q, childName: 'Aarav', subjectId: c.subjectId });
    const ok = c.expect === null ? !r.grounded : r.grounded && r.citations.length > 0;
    if (ok) gOk++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} [${r.mode}, ${r.citations.length} citations] ${c.q}\n       ${r.answer.replace(/\n/g, ' ').slice(0, 200)}`);
  }
  console.log(`Generation checks passed: ${gOk}/${CASES.length}  (read the answers too: this only checks grounding)`);
}
main();

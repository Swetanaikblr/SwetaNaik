import { answerFromSources, ClaudeUnavailableError, expandQuery, getClaude, type Citation, type TutorTurn } from './claude';
import { search } from './store';
import type { RetrievedChunk } from './types';

export interface TutorRequest {
  question: string;
  childName: string;
  subjectId?: string;
  materialId?: string;
  history?: TutorTurn[];
}

export interface TutorResponse {
  answer: string;
  /** passages the answer cites */
  citations: Citation[];
  /** passages that were retrieved and given to the model */
  sources: { chunkId: string; materialTitle: string; chapter: string; section: string; score: number }[];
  /** true when the answer is based on the child's materials */
  grounded: boolean;
  /** how the answer was produced */
  mode: 'claude' | 'claude_no_sources' | 'extractive' | 'unavailable';
  retrieval: 'direct' | 'expanded' | 'none';
  note?: string;
}

/** Short questions that lean on the previous turn: "what about the next one?", "and question 6?", "why?" */
const FOLLOW_UP = /^(and|but|so|what about|how about|then|why|why not|really|ok|okay)\b|\b(it|that|this|these|those|next|same|again|one|another|previous|last one)\b/i;

async function retrieve(req: TutorRequest): Promise<{ hits: RetrievedChunk[]; how: TutorResponse['retrieval'] }> {
  const scope = { subjectId: req.subjectId, materialId: req.materialId };

  const prevChild = [...(req.history ?? [])].reverse().find((t) => t.sender === 'child')?.text;
  const isFollowUp = Boolean(prevChild) && req.question.trim().split(/\s+/).length <= 8 && FOLLOW_UP.test(req.question);

  // 1. "the next one" / "the previous one" after "question 5": go to question 6 / 4.
  if (isFollowUp && /\b(next|previous|last one|before)\b/i.test(req.question)) {
    const n = prevChild!.match(/\b(?:question|q|exercise|problem)\s*\.?\s*(\d+)\b/i);
    if (n) {
      const target = Number(n[1]) + (/\bnext\b/i.test(req.question) ? 1 : -1);
      const hits = search(`question ${target}`, scope);
      if (hits.length) return { hits, how: 'direct' };
    }
  }

  // 2. The question on its own.
  let hits = search(req.question, scope);
  if (hits.length && !isFollowUp) return { hits, how: 'direct' };

  // 3. A short follow-up: add the previous child question so "and why?" still finds its passage.
  //    Only for follow-up wording, so an unrelated new question doesn't inherit the old topic.
  if (isFollowUp) {
    const combined = search(`${req.question} ${prevChild}`, scope);
    if (combined.length) return { hits: combined, how: 'direct' };
    if (hits.length) return { hits, how: 'direct' };
  }

  // 4. Nothing matched literally: ask Claude for textbook keywords and search again.
  const keywords = await expandQuery(req.question);
  if (keywords.length) {
    hits = search(`${req.question} ${keywords.join(' ')}`, scope);
    if (hits.length) return { hits, how: 'expanded' };
  }
  return { hits: [], how: 'none' };
}

const toSources = (hits: RetrievedChunk[]) =>
  hits.map((h) => ({ chunkId: h.id, materialTitle: h.materialTitle, chapter: h.chapter, section: h.section, score: Math.round(h.score * 100) / 100 }));

export async function tutor(req: TutorRequest): Promise<TutorResponse> {
  const { hits, how } = await retrieve(req);

  if (getClaude()) {
    try {
      const r = await answerFromSources({ question: req.question, childName: req.childName, sources: hits, history: req.history ?? [] });
      return {
        answer: r.answer,
        citations: r.citations,
        sources: toSources(hits),
        grounded: hits.length > 0 && r.citations.length > 0,
        mode: hits.length ? 'claude' : 'claude_no_sources',
        retrieval: how,
      };
    } catch (err) {
      const reason = err instanceof ClaudeUnavailableError ? err.message : String(err);
      console.error('[RAG] Tutor generation failed:', reason);
      return extractive(hits, how, `AI helper unavailable: ${reason}`);
    }
  }
  return extractive(hits, how, 'AI helper not configured (ANTHROPIC_API_KEY is not set)');
}

/**
 * No model available: show the best-matching passage from the child's own material instead of
 * pretending to answer. Clearly worded so it isn't mistaken for an AI explanation.
 */
function extractive(hits: RetrievedChunk[], how: TutorResponse['retrieval'], note: string): TutorResponse {
  if (!hits.length) {
    return {
      answer: "The AI helper isn't available right now, and I couldn't find that in your notes. Try asking your teacher or a grown-up.",
      citations: [],
      sources: [],
      grounded: false,
      mode: 'unavailable',
      retrieval: how,
      note,
    };
  }
  const top = hits[0];
  return {
    answer: `The AI helper isn't available right now, but this part of your notes looks related:\n\n${top.text}`,
    citations: [
      { chunkId: top.id, materialId: top.materialId, materialTitle: top.materialTitle, chapter: top.chapter, section: top.section, citedText: top.text },
    ],
    sources: toSources(hits),
    grounded: true,
    mode: 'extractive',
    retrieval: how,
    note,
  };
}

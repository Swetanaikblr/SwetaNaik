import Anthropic from '@anthropic-ai/sdk';
import { EXPAND_SYSTEM, EXTRACT_SYSTEM, NO_SOURCES_NOTE, TUTOR_SYSTEM } from './prompts';
import type { RetrievedChunk } from './types';

/**
 * Claude calls for the RAG pipeline: answer generation (with citations), text extraction from
 * uploaded pages, and keyword expansion when the child's wording doesn't match the textbook.
 */
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';

// Server-side refusal fallback: if the model declines for policy reasons, the API retries the
// same request on the model's default fallback inside the same call.
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

let client: Anthropic | null = null;
export function getClaude(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return null;
  if (!client) client = new Anthropic();
  return client;
}

export class ClaudeUnavailableError extends Error {}

function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return 'Anthropic API key was rejected';
  if (err instanceof Anthropic.RateLimitError) return 'Anthropic API rate limit reached';
  if (err instanceof Anthropic.BadRequestError) return `Anthropic API rejected the request: ${err.message}`;
  if (err instanceof Anthropic.APIError) return `Anthropic API error ${err.status}: ${err.message}`;
  return err instanceof Error ? err.message : String(err);
}

export interface Citation {
  chunkId: string;
  materialId: string;
  materialTitle: string;
  chapter: string;
  section: string;
  citedText: string;
}

export interface TutorTurn {
  sender: 'child' | 'ai';
  text: string;
}

export interface TutorAnswer {
  answer: string;
  citations: Citation[];
  refused: boolean;
}

/** One `search_result` block per retrieved passage; Claude cites them natively. */
function toSearchResult(c: RetrievedChunk): Anthropic.Beta.BetaSearchResultBlockParam {
  const where = [c.chapter, c.section].filter(Boolean).join(' › ');
  return {
    type: 'search_result',
    source: c.id,
    title: `${c.materialTitle}${where ? ` — ${where}` : ''}`,
    content: [{ type: 'text', text: c.text }],
    citations: { enabled: true },
  };
}

export async function answerFromSources(params: {
  question: string;
  childName: string;
  sources: RetrievedChunk[];
  history: TutorTurn[];
}): Promise<TutorAnswer> {
  const claude = getClaude();
  if (!claude) throw new ClaudeUnavailableError('ANTHROPIC_API_KEY is not set');

  // Earlier turns as plain text (no sources), so follow-ups like "and question 6?" make sense.
  const history: Anthropic.Beta.BetaMessageParam[] = [];
  for (const t of params.history.slice(-6)) {
    const role = t.sender === 'child' ? 'user' : 'assistant';
    if (!history.length && role === 'assistant') continue; // must start with a user turn
    history.push({ role, content: t.text });
  }

  const latest: Anthropic.Beta.BetaContentBlockParam[] = [
    ...params.sources.map(toSearchResult),
    {
      type: 'text',
      text: params.sources.length
        ? `${params.childName} asks: ${params.question}`
        : `${NO_SOURCES_NOTE}\n\n${params.childName} asks: ${params.question}`,
    },
  ];

  try {
    const response = await claude.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      output_config: { effort: 'low' }, // short tutoring replies; keeps the child's wait low
      system: TUTOR_SYSTEM,
      messages: [...history, { role: 'user', content: latest }],
    });

    if (response.stop_reason === 'refusal') {
      return {
        answer: "I can't help with that one here. You could ask your teacher or a grown-up you trust.",
        citations: [],
        refused: true,
      };
    }

    let answer = '';
    const citations: Citation[] = [];
    const seen = new Set<string>();
    for (const block of response.content) {
      if (block.type !== 'text') continue;
      answer += block.text;
      for (const cit of block.citations ?? []) {
        if (cit.type !== 'search_result_location') continue;
        const src = params.sources[cit.search_result_index];
        if (!src) continue;
        const key = `${src.id}|${cit.cited_text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        citations.push({
          chunkId: src.id,
          materialId: src.materialId,
          materialTitle: src.materialTitle,
          chapter: src.chapter,
          section: src.section,
          citedText: cit.cited_text,
        });
      }
    }
    return { answer: answer.trim(), citations, refused: false };
  } catch (err) {
    throw new ClaudeUnavailableError(describeError(err));
  }
}

export type ExtractableMime = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
export const EXTRACTABLE_TYPES: ExtractableMime[] = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export interface Extraction {
  subject: string;
  chapter: string;
  topic: string;
  title: string;
  text: string;
}

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    subject: { type: 'string', description: 'Mathematics, Science, English, Social Studies, or Other' },
    chapter: { type: 'string', description: 'Chapter title as printed, or empty string' },
    topic: { type: 'string', description: 'Main topic of the page in a few words' },
    title: { type: 'string', description: 'Short title for this material' },
    text: { type: 'string', description: 'Full transcription of the readable text, in reading order' },
  },
  required: ['subject', 'chapter', 'topic', 'title', 'text'],
  additionalProperties: false,
};

/** Transcribes an uploaded PDF or photo of a page with Claude (vision / PDF input). */
export async function extractText(base64: string, mimeType: ExtractableMime): Promise<Extraction> {
  const claude = getClaude();
  if (!claude) throw new ClaudeUnavailableError('ANTHROPIC_API_KEY is not set');

  const fileBlock: Anthropic.Beta.BetaContentBlockParam =
    mimeType === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
      : { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } };

  try {
    // Streaming: a multi-page PDF can produce a long transcription.
    const message = await claude.beta.messages
      .stream({
        model: CLAUDE_MODEL,
        max_tokens: 64000,
        betas: [FALLBACK_BETA],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: EXTRACTION_SCHEMA } },
        system: EXTRACT_SYSTEM,
        messages: [{ role: 'user', content: [fileBlock, { type: 'text', text: 'Transcribe this study material.' }] }],
      })
      .finalMessage();

    if (message.stop_reason === 'refusal') throw new ClaudeUnavailableError('The model declined to read this file.');
    if (message.stop_reason === 'max_tokens') throw new ClaudeUnavailableError('This file is too long to transcribe in one go. Try uploading fewer pages.');
    const text = message.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text ?? '';
    return JSON.parse(text) as Extraction;
  } catch (err) {
    if (err instanceof ClaudeUnavailableError) throw err;
    if (err instanceof SyntaxError) throw new ClaudeUnavailableError('The transcription came back incomplete.');
    throw new ClaudeUnavailableError(describeError(err));
  }
}

/**
 * Rewrites a child's question into textbook keywords. Only used when the direct search finds
 * nothing, so most questions cost one model call, not two.
 */
export async function expandQuery(question: string): Promise<string[]> {
  const claude = getClaude();
  if (!claude) return [];
  try {
    const message = await claude.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      output_config: {
        effort: 'low',
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: { keywords: { type: 'array', items: { type: 'string' } } },
            required: ['keywords'],
            additionalProperties: false,
          },
        },
      },
      system: EXPAND_SYSTEM,
      messages: [{ role: 'user', content: question }],
    });
    if (message.stop_reason !== 'end_turn') return [];
    const text = message.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text ?? '{}';
    const parsed = JSON.parse(text) as { keywords?: string[] };
    return (parsed.keywords ?? []).slice(0, 12);
  } catch (err) {
    console.warn('[RAG] Query expansion skipped:', describeError(err));
    return [];
  }
}

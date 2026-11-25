import fs from 'fs';
import path from 'path';
import { initialMaterials } from '../../src/data/initialData';
import type { LearningMaterial } from '../../src/types';
import { Bm25Index } from './bm25';
import { chunkMaterial } from './chunker';
import type { Chunk, RetrievedChunk, StoredMaterial } from './types';

/**
 * Server-side store for learning materials and their retrievable passages.
 * Persists to a JSON file so uploads survive restarts. The BM25 index is rebuilt in memory
 * whenever materials change (cheap at family scale: hundreds of passages, not millions).
 */
const STORE_PATH = process.env.RAG_STORE_PATH || path.join(process.cwd(), 'data', 'rag-store.json');

let materials: StoredMaterial[] = [];
let chunks: Chunk[] = [];
let chunkById = new Map<string, Chunk>();
let bodyIndex = new Bm25Index([]);
let metaIndex = new Bm25Index([]);

/**
 * Two fields per passage: the body (section heading + passage text) and the metadata
 * (material title + chapter). Metadata matches count for less, so a question that only
 * repeats the chapter name ("linear equations") doesn't outrank the passage that explains it.
 */
const META_WEIGHT = 0.3;
const bodyText = (c: Chunk) => `${c.section}\n${c.text}`;
const metaText = (c: Chunk) => `${c.materialTitle}\n${c.chapter}`;

function ingest(m: LearningMaterial): StoredMaterial {
  const indexedAt = new Date().toISOString();
  if (m.type === 'link') {
    return {
      ...m,
      ingest: { status: 'not_searchable', chunkCount: 0, indexedAt, note: "Links aren't read; only uploaded text is searchable." },
    };
  }
  const text = (m.contentText || '').trim();
  if (text.length < 20) {
    return { ...m, ingest: { status: 'failed', chunkCount: 0, indexedAt, note: 'No readable text to index.' } };
  }
  const count = chunkMaterial(m).length;
  return { ...m, ingest: { status: 'indexed', chunkCount: count, indexedAt } };
}

function rebuild() {
  chunks = materials.filter((m) => m.ingest.status === 'indexed').flatMap((m) => chunkMaterial(m));
  chunkById = new Map(chunks.map((c) => [c.id, c]));
  bodyIndex = new Bm25Index(chunks.map((c) => ({ id: c.id, text: bodyText(c) })));
  metaIndex = new Bm25Index(chunks.map((c) => ({ id: c.id, text: metaText(c) })));
}

function save() {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify({ version: 1, materials }, null, 2));
  } catch (err) {
    console.error('[RAG] Could not save material store:', err);
  }
}

export function loadStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as { materials: LearningMaterial[] };
      materials = raw.materials.map(ingest);
    } else {
      materials = initialMaterials.map(ingest);
      save();
    }
  } catch (err) {
    console.error('[RAG] Store unreadable, starting from sample materials:', err);
    materials = initialMaterials.map(ingest);
  }
  rebuild();
  console.log(`[RAG] ${materials.length} materials, ${chunks.length} passages indexed`);
}

export function listMaterials(): StoredMaterial[] {
  return [...materials].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getMaterial(id: string): StoredMaterial | undefined {
  return materials.find((m) => m.id === id);
}

export function addMaterial(data: Omit<LearningMaterial, 'id' | 'createdAt'>): StoredMaterial {
  const m = ingest({ ...data, id: `mat-${Date.now()}`, createdAt: new Date().toISOString() });
  materials.push(m);
  rebuild();
  save();
  return m;
}

export function deleteMaterial(id: string): boolean {
  const before = materials.length;
  materials = materials.filter((m) => m.id !== id);
  if (materials.length === before) return false;
  rebuild();
  save();
  return true;
}

export function getChunk(id: string): Chunk | undefined {
  return chunkById.get(id);
}

export interface SearchOptions {
  /** Restrict to one subject (e.g. 'math'). */
  subjectId?: string;
  /** The material the child has open: searched with a boost, never exclusively. */
  materialId?: string;
  k?: number;
  /** Minimum BM25 score for a passage to count as relevant. */
  minScore?: number;
}

export const DEFAULT_MIN_SCORE = 1.0;

export function search(query: string, opts: SearchOptions = {}): RetrievedChunk[] {
  const k = opts.k ?? 4;
  const minScore = opts.minScore ?? DEFAULT_MIN_SCORE;
  const filter = opts.subjectId ? (id: string) => chunkById.get(id)?.subjectId === opts.subjectId : undefined;

  const scores = new Map<string, number>();
  for (const h of bodyIndex.search(query, filter)) scores.set(h.id, h.score);
  // Metadata only adds to passages whose body already matched.
  for (const h of metaIndex.search(query, filter)) if (scores.has(h.id)) scores.set(h.id, scores.get(h.id)! + META_WEIGHT * h.score);

  // "question 5", "Q5", "exercise 3": jump straight to that numbered exercise.
  const numbered = query.match(/\b(?:question|q|exercise|ex|problem|example)\s*\.?\s*(\d+[a-z]?)\b/i);
  if (numbered) {
    const re = new RegExp(`^(question|q|exercise|example)\\s*${numbered[1]}\\b`, 'i');
    for (const c of chunks) {
      if (filter && !filter(c.id)) continue;
      if (re.test(c.section)) scores.set(c.id, (scores.get(c.id) ?? 0) + 10);
    }
  }

  const hits: RetrievedChunk[] = [];
  for (const [id, raw] of scores) {
    const c = chunkById.get(id)!;
    const score = c.materialId === opts.materialId ? raw * 1.25 : raw;
    if (score >= minScore) hits.push({ ...c, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, k);
}

export function stats() {
  return { materials: materials.length, passages: chunks.length };
}

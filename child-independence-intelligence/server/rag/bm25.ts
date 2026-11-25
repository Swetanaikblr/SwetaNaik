/**
 * Small BM25 index over passages. Runs in-process, no external service.
 * Each passage is indexed together with its material title, chapter and section heading
 * ("contextual" headers), so a question about "chapter 4" or "stomata" finds the right passage.
 */
const STOPWORDS = new Set(
  ('a an and are as at be but by can do does did for from had has have how i if in into is it its ' +
    'me my of on or our so than that the their them then there these they this to was we were what ' +
    'when where which who why will with you your about would could should just like get got im dont ' +
    'please help explain tell show mean means')
    .split(' '),
);

/** Very light English stemmer: enough to match plural/verb forms without a dependency. */
export function stem(w: string): string {
  if (w.length <= 3 || /\d/.test(w)) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('sses')) return w.slice(0, -2);
  if (w.endsWith('es') && /(ch|sh|x|ss|z)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) w = w.slice(0, -1);
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  return w;
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().normalize('NFKD').match(/[a-z0-9]+/g) ?? [])
    .filter((t) => !STOPWORDS.has(t))
    .map(stem)
    .filter((t) => t.length > 1 || /\d/.test(t));
}

export interface Bm25Doc {
  id: string;
  text: string;
}

export class Bm25Index {
  private readonly k1 = 1.2;
  private readonly b = 0.75;
  private docs: { id: string; tf: Map<string, number>; len: number }[] = [];
  private df = new Map<string, number>();
  private avgLen = 0;

  constructor(docs: Bm25Doc[]) {
    for (const d of docs) {
      const tokens = tokenize(d.text);
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      this.docs.push({ id: d.id, tf, len: tokens.length });
    }
    this.avgLen = this.docs.reduce((n, d) => n + d.len, 0) / Math.max(1, this.docs.length);
  }

  get size() {
    return this.docs.length;
  }

  private idf(term: string): number {
    const n = this.docs.length;
    const df = this.df.get(term) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  /** Returns every document with a positive score, best first. */
  search(query: string, filter?: (id: string) => boolean): { id: string; score: number }[] {
    const terms = Array.from(new Set(tokenize(query)));
    if (!terms.length) return [];
    const out: { id: string; score: number }[] = [];
    for (const d of this.docs) {
      if (filter && !filter(d.id)) continue;
      let score = 0;
      for (const t of terms) {
        const f = d.tf.get(t);
        if (!f) continue;
        score += this.idf(t) * ((f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * d.len) / this.avgLen)));
      }
      if (score > 0) out.push({ id: d.id, score });
    }
    return out.sort((a, b) => b.score - a.score);
  }
}

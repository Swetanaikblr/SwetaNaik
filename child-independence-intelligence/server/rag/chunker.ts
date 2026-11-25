import type { Chunk } from './types';

/**
 * Splits material text into passages for retrieval.
 *
 * 1. Lines that look like headings start a new section ("4.2 Rules of ...:", "CHAPTER 6: ...",
 *    "Question 5: ...", markdown "#" headings, short ALL-CAPS lines).
 * 2. Each section is packed into passages of roughly TARGET_CHARS, breaking on line boundaries,
 *    with one line of overlap between consecutive passages of the same section.
 * Every passage keeps its section heading so it can be read (and cited) on its own.
 */
const TARGET_CHARS = 700;
const MAX_CHARS = 1100;

const HEADING_PATTERNS: RegExp[] = [
  /^#{1,6}\s+\S/, // markdown heading
  /^(chapter|unit|lesson|section|part)\s+[\w.]+\b/i, // CHAPTER 4 ...
  /^\d+(\.\d+)+\s+\S.{0,80}$/, // 4.2 Rules of Transposition
  /^(question|q|exercise|example)\s*\d+[a-z]?\s*[:.)]/i, // Question 5:
  /^note\b.{0,60}:$/i, // Note on Stomata:
];

function isHeading(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 120) return false;
  if (HEADING_PATTERNS.some((re) => re.test(t))) return true;
  // Short ALL-CAPS line (at least 3 letters, no lowercase)
  const letters = t.replace(/[^A-Za-z]/g, '');
  return letters.length >= 3 && t.length <= 80 && letters === letters.toUpperCase();
}

function headingLabel(line: string): string {
  return line.trim().replace(/^#+\s*/, '').replace(/[:\s]+$/, '').slice(0, 120);
}

interface Section {
  heading: string;
  lines: string[];
}

function splitSections(text: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { heading: '', lines: [] };
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    if (isHeading(line)) {
      if (current.lines.length || current.heading) sections.push(current);
      // A heading line can also carry content ("Question 1: Solve for x: 3x - 5 = 16").
      current = { heading: headingLabel(line), lines: [line.trim()] };
    } else if (line.trim()) {
      current.lines.push(line.trim());
    }
  }
  if (current.lines.length) sections.push(current);
  return sections;
}

/** Splits a very long line on sentence boundaries so no passage exceeds MAX_CHARS. */
function splitLongLine(line: string): string[] {
  if (line.length <= MAX_CHARS) return [line];
  const sentences = line.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [line];
  const out: string[] = [];
  let buf = '';
  for (const s of sentences) {
    if ((buf + s).length > TARGET_CHARS && buf) {
      out.push(buf.trim());
      buf = '';
    }
    buf += s;
  }
  if (buf.trim()) out.push(buf.trim());
  return out.flatMap((p) => (p.length > MAX_CHARS ? p.match(new RegExp(`.{1,${TARGET_CHARS}}`, 'g')) ?? [p] : [p]));
}

export function chunkMaterial(m: {
  id: string;
  subjectId: string;
  title: string;
  chapter: string;
  contentText: string;
}): Chunk[] {
  const chunks: Chunk[] = [];
  const push = (section: string, lines: string[]) => {
    const text = lines.join('\n').trim();
    if (!text) return;
    chunks.push({
      id: `${m.id}#${chunks.length}`,
      materialId: m.id,
      subjectId: m.subjectId,
      materialTitle: m.title,
      chapter: m.chapter,
      section,
      index: chunks.length,
      text,
    });
  };

  for (const sec of splitSections(m.contentText)) {
    const lines = sec.lines.flatMap(splitLongLine);
    let buf: string[] = [];
    let len = 0;
    for (const line of lines) {
      if (len + line.length > TARGET_CHARS && buf.length) {
        push(sec.heading, buf);
        const overlap = buf[buf.length - 1];
        buf = overlap.length < TARGET_CHARS / 2 ? [overlap] : [];
        len = buf.reduce((n, l) => n + l.length + 1, 0);
      }
      buf.push(line);
      len += line.length + 1;
    }
    push(sec.heading, buf);
  }
  return chunks;
}

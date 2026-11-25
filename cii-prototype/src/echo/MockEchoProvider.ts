import type { Category } from '../types';
import type { EchoContext, EchoProvider, EchoReply } from './EchoProvider';
import { CATEGORY_OFFER, DEFAULT_CHIPS, FACTS, LINES, MOOD_OPTIONS, OPENING, SCENARIO_OPENING, pick } from '../data/echo';

const STOP = /\b(stop|be quiet|quiet|shut up|leave me alone|go away|bye|goodbye)\b|don'?t want to talk|do not want to talk|no more talking/;
const PERSONAL = /\b(address|phone number|my number|password|where i live|where do i live|my school is|postcode|zip code|email)\b/;
const UNSAFE = /\b(hurt me|hurting|hit me|kill|die|suicide|weapon|knife|gun|bully|bullied|abuse|scared of|touch me|run away)\b/;
const UNAPPROVED_HINT = /\b(youtube|tiktok|netflix|stream|trailer|horror|scary movie|grown[- ]up show|cartoon channel)\b/;
const GENERIC_WATCH = /^(something|anything|a video|videos|a show|shows|tv|telly|cartoons?|now)?\s*$/;

function offer(pool: Category[], ctx: EchoContext, n = 3): Category[] {
  const avail = pool.filter((c) => ctx.availableCategories.includes(c));
  // de-duplicate and keep categories distinct (each option is a different category)
  return Array.from(new Set(avail)).slice(0, n);
}

function optionsText(cats: Category[], ctx: EchoContext) {
  return cats.map((c) => `• ${pick(CATEGORY_OFFER[c], ctx.ageBand)}`).join('\n');
}

function moodReply(mood: string, ctx: EchoContext): EchoReply {
  const cats = offer(MOOD_OPTIONS[mood], ctx);
  if (cats.length === 0) return { text: pick(LINES.unavailableAll, ctx.ageBand) };
  return {
    text: `${pick(LINES.moodIntro[mood], ctx.ageBand)}\n${optionsText(cats, ctx)}\n${pick(LINES.whichSoundsGood, ctx.ageBand)}`,
    suggestions: cats,
  };
}

export class MockEchoProvider implements EchoProvider {
  readonly label = 'Prototype assistant (scripted)';

  opening(ctx: EchoContext): EchoReply {
    if (ctx.scenario) {
      const s = SCENARIO_OPENING[ctx.scenario];
      return { text: pick(s.line, ctx.ageBand), chips: s.chips };
    }
    return { text: pick(OPENING[ctx.tone], ctx.ageBand), chips: DEFAULT_CHIPS };
  }

  async respond(raw: string, ctx: EchoContext): Promise<EchoReply> {
    const t = raw.toLowerCase().trim();
    const b = ctx.ageBand;

    // Guardrails first.
    if (STOP.test(t)) return { text: pick(LINES.stop, b), stop: true };
    if (UNSAFE.test(t)) return { text: pick(LINES.unsafe, b) };
    if (PERSONAL.test(t)) return { text: pick(LINES.personal, b) };

    // Watching requests: approved, generic or unapproved.
    const watchMatch = t.match(/\b(?:watch|see|put on|play)\b\s*(.*)$/);
    if (UNAPPROVED_HINT.test(t)) {
      return { text: pick(LINES.notApproved, b), suggestions: offer(['watch', 'create', 'explore'], ctx) };
    }
    if (watchMatch || /\b(tv|telly|video|videos|cartoon)\b/.test(t)) {
      const rest = (watchMatch?.[1] ?? '').replace(/\b(tv|the|a|some|please|to|i want)\b/g, ' ').trim();
      const approved = ctx.approvedTitles.find((title) =>
        rest.length > 2 && title.toLowerCase().includes(rest.split(' ')[0]),
      );
      if (approved) {
        return { text: `"${approved}" is in your Watch list. Want to open Watch?`, suggestions: offer(['watch'], ctx, 1) };
      }
      if (rest && !GENERIC_WATCH.test(rest)) {
        return { text: pick(LINES.notApproved, b), suggestions: offer(['watch', 'create', 'explore'], ctx) };
      }
      const cats = offer(['watch', 'create', 'move'], ctx);
      return { text: `${pick(LINES.watchGeneric, b)}\n${optionsText(cats.filter((c) => c !== 'watch'), ctx)}`, suggestions: cats };
    }

    // Moods and requests for ideas.
    if (/\bbored\b|nothing to do/.test(t)) return moodReply('bored', ctx);
    if (/\btired\b|sleepy|exhausted|long day/.test(t)) return moodReply('tired', ctx);
    if (/just played|played (football|outside|a game)|was playing|after playing/.test(t)) return moodReply('played', ctx);
    if (/something else/.test(t)) return moodReply('something_else', ctx);
    if (/idea|options|what can i do|suggest|show me/.test(t)) return moodReply('ideas', ctx);

    // Study and homework: offered, never pushed.
    if (/math|homework|study|fraction|sum|times table|revision/.test(t)) {
      return { text: pick(LINES.maths, b), suggestions: offer(['study', 'askGuide', 'move'], ctx) };
    }

    for (const f of FACTS) if (f.match.test(t)) return { text: pick(f.answer, b) };
    if (/^(why|what|how|who|when|where)\b|\?$/.test(t)) return { text: pick(LINES.dontKnow, b) };
    if (/^(hi|hey|hello|yo|hiya)\b/.test(t)) return { text: pick(LINES.hello, b), chips: DEFAULT_CHIPS };
    if (/thank/.test(t)) return { text: pick(LINES.thanks, b) };
    if (/^(no|nah|none|not really|nope)\b/.test(t)) return { text: b === '8-10' ? 'Okay! Just tap if you want anything.' : 'No problem. Just say if you want anything.' };

    return { text: pick(LINES.fallback, b), chips: DEFAULT_CHIPS };
  }
}

export const echoProvider: EchoProvider = new MockEchoProvider();

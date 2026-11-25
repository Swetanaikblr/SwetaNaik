import type { AgeBand, Category, ScenarioId, TimeContext, Tone } from '../types';

/**
 * Scripted copy for the mock Echo provider.
 * Rules: invitations not instructions; no "should"; no scores; no guilt; never sounds like reporting to parents;
 * honest when it does not know; short and age-appropriate.
 */
type Variant = { young: string; older: string };
export const pick = (v: Variant, band: AgeBand) => (band === '8-10' ? v.young : v.older);

export const VOICES = [
  { id: 'calm', label: 'Echo: Calm', pitch: 1.0, rate: 0.95 },
  { id: 'bright', label: 'Echo: Bright', pitch: 1.25, rate: 1.05 },
  { id: 'soft', label: 'Echo: Soft', pitch: 0.9, rate: 0.85 },
];

export const OPENING: Record<Tone, Variant> = {
  warm: { young: "Hi! I'm here if you want ideas. What are you in the mood for?", older: "Hey. I'm around if you want ideas. What are you in the mood for?" },
  calm: { young: "Hello. No rush. Want to hear a few ideas?", older: "Hi. No rush at all. Want a few ideas, or just browse?" },
  playful: { young: "Boop! Echo here. Want some ideas?", older: "Echo here. Got a few ideas if you're curious." },
};

/** Scenario-specific opening lines and chips (driven by the Demo Guide). */
export const SCENARIO_OPENING: Record<ScenarioId, { line: Variant; chips: string[] }> = {
  afterSchool: {
    line: { young: 'Welcome back! Want to relax, make something, or move about?', older: 'Welcome back. Want to unwind, make something, or move a bit?' },
    chips: ["I'm bored", "I'm tired", 'Show me ideas'],
  },
  lateTv: {
    line: { young: "Hi! Long day? You could watch something, or try something cosy.", older: 'Hey, late one today? You could watch something, or try something calmer.' },
    chips: ['I want to watch TV', "I'm tired", 'Show me ideas'],
  },
  mathsStudy: {
    line: { young: 'Hi! Your maths book is in Study if you want it. Lots of other things too.', older: 'Hey. Your maths materials are in Study if you want them, and plenty else too.' },
    chips: ['Help me with maths', 'Something else first', 'I just played'],
  },
};

export const DEFAULT_CHIPS = ["I'm bored", "I'm tired", 'I just played', 'Show me ideas'];

export const CATEGORY_OFFER: Record<Category, Variant> = {
  study: { young: 'look at your books in Study', older: 'open your materials in Study' },
  create: { young: 'draw a silly creature', older: 'sketch something or start a story' },
  watch: { young: 'watch one of your videos', older: 'watch something from your approved list' },
  move: { young: 'do a quick stretch or dance', older: 'try a quick stretch or freeze dance' },
  askGuide: { young: 'get a hint from Ask Guide', older: 'think a question through with Ask Guide' },
  explore: { young: 'read a short story in the Reading Nook', older: 'browse the Reading Nook or some fun facts' },
};

/** Mood → preferred categories (always from different categories). */
export const MOOD_OPTIONS: Record<string, Category[]> = {
  bored: ['create', 'move', 'explore', 'watch'],
  tired: ['watch', 'explore', 'move', 'create'],
  played: ['explore', 'create', 'watch', 'study'],
  ideas: ['create', 'move', 'watch', 'explore', 'study'],
  something_else: ['create', 'move', 'explore', 'watch'],
};

export const LINES = {
  moodIntro: {
    bored: { young: 'Bored, huh? Here are a few ideas:', older: 'Fair enough. A few ideas:' },
    tired: { young: 'Sounds like a cosy moment. Maybe:', older: 'Low energy is okay. Maybe:' },
    played: { young: 'Fun! Want something different now? Maybe:', older: 'Nice. Want a change of pace? Maybe:' },
    ideas: { young: 'Here are some ideas:', older: 'Here are a few options:' },
    something_else: { young: 'Sure! How about:', older: 'Sure. How about:' },
  } as Record<string, Variant>,
  whichSoundsGood: { young: 'Which sounds good? Or none, that is fine too.', older: 'Any of those sound good? Or none, totally fine.' },
  maths: {
    young: 'Your maths notes are in Study. Ask Guide can give hints if you get stuck. Or something else first, your choice.',
    older: 'Your maths materials are in Study, and Ask Guide can give hints. Or do something else first. Up to you.',
  },
  stop: { young: "Okay! I'll be quiet now. Tap me any time.", older: "Got it. I'll stop here. I'm around if you want me." },
  personal: {
    young: "Let's keep things like addresses, phone numbers and passwords private. You don't need to tell me those.",
    older: "Let's keep personal stuff private: addresses, phone numbers, passwords, school name. You don't need to share those with me.",
  },
  unsafe: {
    young: "That sounds really important. Please talk to a grown-up you trust right now. I'm only a simple helper and can't help with this properly.",
    older: "That sounds important, and you deserve real help. Please talk to a grown-up you trust, like a family member or teacher. I'm a simple prototype helper and can't help with this properly.",
  },
  notApproved: { young: "That one isn't in your approved list. Want to pick another?", older: "That one isn't in your approved list. Want to pick something else?" },
  watchGeneric: { young: 'Sure! Your videos are in Watch. Or maybe:', older: 'Sure. Your approved videos are in Watch. Or maybe:' },
  dontKnow: {
    young: "Hmm, I'm not sure about that one. I'm a simple scripted helper. You could look in Explore or ask a grown-up.",
    older: "I honestly don't know that one. I'm a scripted prototype, so I only know a little. Explore or a grown-up might help.",
  },
  hello: { young: 'Hi there! Want some ideas, or just chatting?', older: 'Hey! Want some ideas, or just saying hi?' },
  thanks: { young: "You're welcome!", older: 'Anytime.' },
  fallback: { young: "I'm not sure I understood. Want a few ideas?", older: "I didn't quite catch that. Want a few ideas?" },
  unavailableAll: { young: "Hmm, those aren't available right now. You can still look around Home.", older: "Those aren't available right now. Feel free to look around Home." },
};

/** Tiny fact table so Echo can answer a few questions and say "I don't know" otherwise. */
export const FACTS: { match: RegExp; answer: Variant }[] = [
  { match: /why.*sky.*blue/, answer: { young: 'Sunlight has lots of colours. Blue light bounces around the air the most, so we see blue!', older: 'Air scatters short blue wavelengths of sunlight more than red ones, so the sky looks blue.' } },
  { match: /how many planets/, answer: { young: 'There are 8 planets going round our Sun.', older: 'Our solar system has 8 planets.' } },
  { match: /octopus/, answer: { young: 'An octopus has three hearts! Cool, right?', older: 'Octopuses have three hearts and blue blood.' } },
];

export const CONTEXT_FOR_TIME: Record<TimeContext, string> = {
  afterSchool: 'after school',
  evening: 'this evening',
  weekend: 'this weekend',
};

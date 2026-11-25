/** Scripted Socratic examples only. Not a real AI and not verified for accuracy. */
export const ASK_GUIDE_EXAMPLES = [
  'How do I find 3/4 of 20?',
  'Why do things float?',
  'How do I start a story?',
];

export function askGuideReply(q: string): string[] {
  const t = q.toLowerCase();
  if (/fraction|\/|of \d|half|quarter/.test(t))
    return [
      'Let\'s think it through together.',
      'What does the bottom number of a fraction tell you?',
      'If you split 20 into 4 equal groups, how many are in each group? Then how many groups do you need?',
    ];
  if (/float|sink|boat/.test(t))
    return [
      'Good question! What things have you seen float?',
      'Are they heavy for their size, or light for their size?',
      'Try a small test with a bowl of water and a few objects. What pattern do you notice?',
    ];
  if (/story|write|essay/.test(t))
    return [
      'Who is your story about?',
      'What do they want more than anything?',
      'What gets in their way? That problem could be your first line.',
    ];
  return [
    "I'm a scripted example, so I only know a few questions.",
    'What do you already know about this?',
    'You could also check your materials in Study or ask a grown-up.',
  ];
}

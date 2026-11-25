/**
 * Sample study content. All text is original to this prototype or public domain
 * (Aesop's fables, traditional). It is NOT a curriculum and claims no coverage.
 */
export interface StudyContent {
  id: string;
  title: string;
  attribution: string;
  sections: { heading: string; body: string }[];
  hints: string[]; // scripted "AI help (prototype)" hints, kept separate from source text
}

export const STUDY_CONTENT: Record<string, StudyContent> = {
  fractions: {
    id: 'fractions',
    title: 'Fractions: sample practice notes',
    attribution: 'Sample notes written for this prototype.',
    sections: [
      {
        heading: 'What is a fraction?',
        body: 'A fraction shows part of a whole. In 3/4, the bottom number (4) says how many equal parts the whole is cut into. The top number (3) says how many of those parts we are talking about.',
      },
      {
        heading: 'Equivalent fractions',
        body: '1/2, 2/4 and 4/8 all show the same amount. If you multiply the top and bottom by the same number, the amount does not change.',
      },
      {
        heading: 'Try these',
        body: '1) Shade 2/3 of a rectangle.  2) Which is bigger: 3/5 or 1/2?  3) Write two fractions equal to 1/3.',
      },
    ],
    hints: [
      'For question 2, what happens if you turn both fractions into tenths?',
      'Think of a pizza cut into 5 slices. Is 3 slices more or less than half?',
      'For question 3, what could you multiply the top and bottom of 1/3 by?',
    ],
  },
  fables: {
    id: 'fables',
    title: 'Two fables (public domain)',
    attribution: "Adapted from Aesop's Fables, public domain.",
    sections: [
      {
        heading: 'The Tortoise and the Hare',
        body: 'A Hare laughed at the Tortoise for being slow. "Let us race," said the Tortoise. The Hare ran far ahead, then lay down for a nap. The Tortoise kept going, step by step, and crossed the line while the Hare still slept.',
      },
      {
        heading: 'The Lion and the Mouse',
        body: 'A Lion caught a little Mouse, then let it go. Later the Lion was trapped in a hunter\'s net. The Mouse heard him roar, came running and nibbled the ropes until the Lion was free.',
      },
    ],
    hints: [
      'What do you think each story is trying to say?',
      'Which character would you most like to be? Why?',
      'Can you think of a time something small turned out to matter a lot?',
    ],
  },
  waterCycle: {
    id: 'waterCycle',
    title: 'The water cycle: sample notes',
    attribution: 'Sample notes written for this prototype.',
    sections: [
      { heading: 'Evaporation', body: 'The sun warms water in seas, lakes and puddles. Some of it turns into water vapour and rises into the air.' },
      { heading: 'Condensation', body: 'High up, the air is cooler. The vapour cools and turns into tiny droplets that make clouds.' },
      { heading: 'Precipitation', body: 'When droplets join and get heavy, they fall as rain, snow or hail. Then the cycle starts again.' },
    ],
    hints: [
      'Where have you seen condensation at home? (Hint: think of a cold glass.)',
      'Can you draw the cycle as a circle with three arrows?',
    ],
  },
};

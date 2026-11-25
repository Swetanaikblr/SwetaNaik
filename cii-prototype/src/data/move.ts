export interface MoveActivity {
  id: string;
  title: string;
  emoji: string;
  length: string; // a suggestion, never a requirement
  steps: string[];
}

/** Original movement invitations. No body metrics, no fitness or medical claims. */
export const MOVE_ACTIVITIES: MoveActivity[] = [
  {
    id: 'stretch',
    title: 'Big cat stretch',
    emoji: '🐈',
    length: 'about 2 min',
    steps: ['Reach your arms up high like a cat waking up.', 'Bend slowly to one side, then the other.', 'Roll your shoulders back three times.', 'Shake out your hands. Done whenever you like.'],
  },
  {
    id: 'dance',
    title: 'Freeze dance',
    emoji: '💃',
    length: '2–5 min',
    steps: ['Put on a song you like (or hum one).', 'Dance any way you want.', 'When the song pauses, freeze like a statue!', 'Make up your silliest statue pose.'],
  },
  {
    id: 'animal',
    title: 'Animal moves game',
    emoji: '🦘',
    length: '2–4 min',
    steps: ['Hop like a kangaroo.', 'Waddle like a penguin.', 'Stomp like an elephant.', 'Invent your own animal move.'],
  },
  {
    id: 'balance',
    title: 'Balance challenge',
    emoji: '🦩',
    length: 'about 3 min',
    steps: ['Stand on one foot like a flamingo.', 'Switch feet.', 'Try it with your eyes closed (near something to hold).', 'Balance a soft toy on your head and walk slowly.'],
  },
];

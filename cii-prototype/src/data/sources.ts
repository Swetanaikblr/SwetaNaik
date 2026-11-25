import type { Source } from '../types';

/** Clearly fake placeholder sources. No real channels, brands or videos. */
export const SEED_SOURCES: Source[] = [
  {
    id: 's1',
    name: 'Wonder Lab Shorts (placeholder)',
    kind: 'Video channel',
    approvedInCII: true,
    launch: 'in-cii',
    items: [
      { id: 'v1', title: 'Why is the sky blue? (placeholder)', emoji: '🌤️', hue: 200 },
      { id: 'v2', title: 'Volcano in a bottle (placeholder)', emoji: '🌋', hue: 15 },
      { id: 'v3', title: 'How bees talk (placeholder)', emoji: '🐝', hue: 45, unavailable: true },
    ],
  },
  {
    id: 's2',
    name: 'Draw-Along Studio (placeholder)',
    kind: 'Video channel',
    approvedInCII: true,
    launch: 'in-cii',
    items: [
      { id: 'v4', title: 'Draw a sleepy fox (placeholder)', emoji: '🦊', hue: 25 },
      { id: 'v5', title: 'Doodle a robot (placeholder)', emoji: '🤖', hue: 260 },
    ],
  },
  {
    id: 's3',
    name: 'Story Time Corner (placeholder)',
    kind: 'Video channel',
    approvedInCII: true,
    launch: 'in-cii',
    items: [{ id: 'v6', title: 'The lighthouse cat (placeholder)', emoji: '🐈', hue: 330 }],
  },
  {
    id: 's4',
    name: 'Puzzle Garden app (placeholder)',
    kind: 'App',
    approvedInCII: true,
    launch: 'outside',
    items: [{ id: 'a1', title: 'Open Puzzle Garden (placeholder)', emoji: '🧩', hue: 140 }],
  },
  {
    id: 's5',
    name: 'Space Facts site (placeholder)',
    kind: 'Website',
    approvedInCII: false,
    launch: 'outside',
    items: [{ id: 'w1', title: 'Planets page (placeholder)', emoji: '🪐', hue: 280 }],
  },
];

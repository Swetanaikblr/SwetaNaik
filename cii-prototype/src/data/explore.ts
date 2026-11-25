export const QUICK_FACTS = [
  'An octopus has three hearts.',
  'Honey kept sealed can stay edible for a very long time.',
  'A group of flamingos is sometimes called a "flamboyance".',
  'Sound travels faster in water than in air.',
];

export const CURIOSITY_PROMPTS = [
  'If you could shrink to the size of an ant, where would you explore first?',
  'What would a city on the Moon need?',
  'Why do you think leaves change colour?',
  'Invent a new holiday. What do people do on it?',
];

export interface OfflineIdea {
  id: string;
  text: string;
  emoji: string;
}
export const OFFLINE_IDEAS: OfflineIdea[] = [
  { id: 'o1', text: 'Build a fort from cushions and blankets.', emoji: '🏰' },
  { id: 'o2', text: 'Look out of a window and spot five different colours.', emoji: '🪟' },
  { id: 'o3', text: 'Make a paper aeroplane and test how far it flies.', emoji: '✈️' },
  { id: 'o4', text: 'Help make a snack with a grown-up.', emoji: '🥪' },
];

export const READING_NOOK = {
  title: 'The Wind and the Sun (public domain)',
  attribution: "Adapted from Aesop's Fables, public domain.",
  paragraphs: [
    'The Wind and the Sun were arguing about who was stronger. Just then a traveller came down the road wrapped in a warm cloak.',
    '"Let us see who can make him take off his cloak," said the Sun. The Wind went first. He blew and blew, but the harder he blew, the tighter the traveller held his cloak.',
    'Then the Sun came out and shone gently. The traveller grew warm, smiled, and took off his cloak to sit in the sunshine.',
    'Sometimes being gentle works better than being forceful.',
  ],
};

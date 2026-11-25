// Interactive content for companion games, verbal challenges, and voice activities

export interface Riddle {
  id: string;
  question: string;
  hint: string;
  answer: string;
  funFact: string;
}

export const RIDDLES: Riddle[] = [
  {
    id: 'r1',
    question: 'What has hands, but cannot clap?',
    hint: 'Look at your wrist or on the classroom wall!',
    answer: 'A clock! ⏰',
    funFact: 'The first mechanical clocks were invented over 700 years ago!',
  },
  {
    id: 'r2',
    question: 'What gets wetter the more it dries?',
    hint: 'You grab one right after taking a shower or bath.',
    answer: 'A towel! 🛁',
    funFact: 'Microfiber towels can absorb up to 7 times their weight in water!',
  },
  {
    id: 'r3',
    question: 'What has keys, but no locks; space, but no room; and you can enter, but cannot go inside?',
    hint: 'You are using one right now on your computer or phone!',
    answer: 'A computer keyboard! ⌨️',
    funFact: 'The QWERTY keyboard layout was created in 1873 to prevent typewriter jams!',
  },
  {
    id: 'r4',
    question: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?',
    hint: 'Explorers and travelers unfold me to find their way.',
    answer: 'A map! 🗺️',
    funFact: 'The oldest known surviving world map was carved into a clay tablet in Babylon in 600 BC!',
  },
  {
    id: 'r5',
    question: 'What can you catch, but never throw?',
    hint: 'Achoo! Make sure you grab a tissue!',
    answer: 'A cold! 🤧',
    funFact: 'A sneeze can travel out of your nose at up to 100 miles per hour!',
  },
  {
    id: 'r6',
    question: 'What has many teeth, but can never bite?',
    hint: 'You use it to tame messy hair in the morning.',
    answer: 'A comb! 💇',
    funFact: 'Ancient combs made from bone and tortoiseshell date back over 5,000 years!',
  },
  {
    id: 'r7',
    question: 'What goes up, but never ever comes down?',
    hint: 'It increases by one every single birthday.',
    answer: 'Your age! 🎂',
    funFact: 'If you lived on Neptune, one year would take 165 Earth years!',
  },
];

export interface MathChallenge {
  id: string;
  problem: string;
  question: string;
  answer: number;
  options: number[];
  hint: string;
}

export const MATH_CHALLENGES: MathChallenge[] = [
  {
    id: 'm1',
    problem: '8 × 7',
    question: 'Quick fire! What is 8 multiplied by 7?',
    answer: 56,
    options: [54, 56, 58, 64],
    hint: 'Think: 8 × 5 is 40, then add two more 8s (16)!',
  },
  {
    id: 'm2',
    problem: '120 - 45',
    question: 'Mental speed check! What is 120 minus 45?',
    answer: 75,
    options: [65, 70, 75, 85],
    hint: 'Subtract 40 first to get 80, then take away 5 more.',
  },
  {
    id: 'm3',
    problem: '9 × 9 + 9',
    question: 'Lightning challenge! What is 9 × 9 plus 9?',
    answer: 90,
    options: [81, 89, 90, 99],
    hint: '9 × 9 is 81. Now add 9!',
  },
  {
    id: 'm4',
    problem: '15 × 4',
    question: 'Quick calculation! What is 15 times 4?',
    answer: 60,
    options: [45, 50, 60, 65],
    hint: 'Double 15 is 30, and double 30 is...!',
  },
  {
    id: 'm5',
    problem: '250 ÷ 5',
    question: 'Speed division! What is 250 divided by 5?',
    answer: 50,
    options: [45, 50, 55, 60],
    hint: '25 divided by 5 is 5, then bring the zero over!',
  },
];

export interface KidJoke {
  id: string;
  setup: string;
  punchline: string;
}

export const KID_JOKES: KidJoke[] = [
  {
    id: 'j1',
    setup: "Why don't scientists trust atoms?",
    punchline: 'Because they make up everything! ⚛️😆',
  },
  {
    id: 'j2',
    setup: 'What do you call a fake noodle?',
    punchline: 'An impasta! 🍝😂',
  },
  {
    id: 'j3',
    setup: 'Why did the math book look so sad?',
    punchline: 'Because it had way too many problems! 📐🤣',
  },
  {
    id: 'j4',
    setup: 'What kind of tea is hard to swallow?',
    punchline: 'Realit-tea! ☕😄',
  },
  {
    id: 'j5',
    setup: 'Why did the bicycle fall over?',
    punchline: 'Because it was two-tired! 🚲😆',
  },
  {
    id: 'j6',
    setup: 'What do you call a sleeping dinosaur?',
    punchline: 'A dino-snore! 🦖💤',
  },
];

export const AVATAR_BOOP_QUIPS = [
  "Boop! 🤖 I'm listening! What's on your mind?",
  "Hehehe, that tickles! ⚡ Ready for a riddle, or working on something?",
  "High five! ✋ You are doing awesome today.",
  "Beep boop! All circuits energized! 🚀 What's our next adventure?",
  "Did someone poke me? 🦊 Ask me anything or let's play a brain game!",
  "Ready when you are! 🌟 Freedom and independence unlocked!",
];

import type { Category } from '../types';

export interface CategoryMeta {
  id: Category;
  label: string;
  caption: { young: string; older: string };
  icon: string;
  path: string;
  hue: string; // tailwind-safe class for the tile accent
}

/** Fixed, neutral order. No tile is highlighted by default. */
export const CATEGORY_META: Record<Category, CategoryMeta> = {
  study: {
    id: 'study',
    label: 'Study',
    caption: { young: 'Look at your books and notes', older: 'Your books, notes and reading' },
    icon: '📚',
    path: '/child/study',
    hue: 'bg-sky-50',
  },
  create: {
    id: 'create',
    label: 'Draw',
    caption: { young: 'Draw or make up a story', older: 'Sketch, doodle or start a story' },
    icon: '🎨',
    path: '/child/create',
    hue: 'bg-rose-50',
  },
  watch: {
    id: 'watch',
    label: 'Watch',
    caption: { young: 'Videos your parent picked', older: 'Your approved videos and channels' },
    icon: '📺',
    path: '/child/watch',
    hue: 'bg-violet-50',
  },
  move: {
    id: 'move',
    label: 'Move',
    caption: { young: 'Stretch, dance, wiggle', older: 'Quick stretches, dance or a game' },
    icon: '🤸',
    path: '/child/move',
    hue: 'bg-emerald-50',
  },
  askGuide: {
    id: 'askGuide',
    label: 'Ask Guide',
    caption: { young: 'Get a hint when you are stuck', older: 'Think through a question with hints' },
    icon: '💡',
    path: '/child/ask-guide',
    hue: 'bg-amber-50',
  },
  explore: {
    id: 'explore',
    label: 'Explore',
    caption: { young: 'Calculator, stories and facts', older: 'Calculator, Reading Nook, facts and ideas' },
    icon: '🧭',
    path: '/child/explore',
    hue: 'bg-teal-50',
  },
};

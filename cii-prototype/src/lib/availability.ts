import { useStore } from '../store/useStore';
import { CATEGORIES, type Category } from '../types';
import { useTimeInfo } from './time';

export type TileState = 'available' | 'notNow' | 'hidden';

/**
 * Profile toggle off  -> tile hidden.
 * Rhythm off for this context -> "Not available right now".
 */
export function useCategoryStates(): Record<Category, TileState> {
  const enabled = useStore((s) => s.child.categoriesEnabled);
  const rhythm = useStore((s) => s.rhythm);
  const { context } = useTimeInfo();
  const out = {} as Record<Category, TileState>;
  for (const c of CATEGORIES) {
    out[c] = !enabled[c] ? 'hidden' : rhythm[context][c] ? 'available' : 'notNow';
  }
  return out;
}

export function useAvailableCategories(): Category[] {
  const st = useCategoryStates();
  return CATEGORIES.filter((c) => st[c] === 'available');
}

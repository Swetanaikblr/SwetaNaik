import type { StateStorage } from 'zustand/middleware';

/** localStorage that never throws (private windows, blocked storage, quota errors). */
const memory = new Map<string, string>();
export const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return memory.get(k) ?? null;
    }
  },
  setItem: (k, v) => {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      memory.set(k, v);
    }
  },
  removeItem: (k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      memory.delete(k);
    }
  },
};

export function safeSessionGet(k: string): string | null {
  try {
    return window.sessionStorage.getItem(k);
  } catch {
    return null;
  }
}
export function safeSessionSet(k: string, v: string) {
  try {
    window.sessionStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
}

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '../lib/storage';
import { SEED_MATERIALS } from '../data/materials';
import { SEED_SOURCES } from '../data/sources';
import type {
  AgeBand, Category, CIIEvent, Creation, EchoSettings, EventName, Feedback, Material, Mode,
  ScenarioId, Source, TimeContext,
} from '../types';
import { CATEGORIES } from '../types';

const allOn = (): Record<Category, boolean> =>
  Object.fromEntries(CATEGORIES.map((c) => [c, true])) as Record<Category, boolean>;

const DEFAULT_RHYTHM: Record<TimeContext, Record<Category, boolean>> = {
  afterSchool: allOn(),
  evening: { ...allOn(), move: true },
  weekend: allOn(),
};

export interface ChildProfile {
  name: string;
  ageBand: AgeBand;
  interests: string[];
  contentPrefs: { calmerContent: boolean; includeScience: boolean; includeStories: boolean };
  categoriesEnabled: Record<Category, boolean>;
}

interface PersistedState {
  mode: Mode;
  demoGuideVisible: boolean;
  scenario: ScenarioId | null;
  child: ChildProfile;
  rhythm: Record<TimeContext, Record<Category, boolean>>;
  materials: Material[];
  sources: Source[];
  echoSettings: EchoSettings;
  echoVoice: string;
  speechRecognitionAllowed: boolean;
  responsibilitiesEnabled: boolean;
  responsibilities: string[];
  creations: Creation[];
  triedIdeas: Record<string, number>;
  events: CIIEvent[];
  feedback: Feedback[];
  /** last categories Echo offered, used to tell voluntary from prompted opens */
  lastEchoOffer: { categories: Category[]; at: number } | null;
  showDurationCard: boolean;
}

interface EphemeralState {
  parentUnlocked: boolean;
  pinFailures: number;
  pinCooldownUntil: number;
  external: { name: string } | null;
}

interface Actions {
  set: (patch: Partial<PersistedState & EphemeralState>) => void;
  setMode: (m: Mode) => void;
  setScenario: (s: ScenarioId | null) => void;
  updateChild: (patch: Partial<ChildProfile>) => void;
  toggleCategory: (c: Category) => void;
  toggleRhythm: (ctx: TimeContext, c: Category) => void;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  addMaterial: (m: Material) => void;
  removeMaterial: (id: string) => void;
  updateSource: (id: string, patch: Partial<Source>) => void;
  updateEcho: (patch: Partial<EchoSettings>) => void;
  addCreation: (c: Creation) => boolean;
  removeCreation: (id: string) => void;
  logEvent: (name: EventName, data?: Omit<CIIEvent, 'id' | 'name' | 'at'>) => void;
  addFeedback: (f: Omit<Feedback, 'id' | 'at'>) => void;
  openExternal: (name: string) => void;
  resetPrototype: () => void;
  clearEvents: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const initialPersisted = (): PersistedState => ({
  mode: 'participant',
  demoGuideVisible: true,
  scenario: null,
  child: {
    name: 'Aarav',
    ageBand: '8-10',
    interests: ['Space', 'Drawing'],
    contentPrefs: { calmerContent: true, includeScience: true, includeStories: true },
    categoriesEnabled: allOn(),
  },
  rhythm: JSON.parse(JSON.stringify(DEFAULT_RHYTHM)),
  materials: JSON.parse(JSON.stringify(SEED_MATERIALS)),
  sources: JSON.parse(JSON.stringify(SEED_SOURCES)),
  echoSettings: { tone: 'warm', contextNote: '', frequency: 'onlyWhenAsked', greetingEnabled: true },
  echoVoice: 'calm',
  speechRecognitionAllowed: false,
  responsibilitiesEnabled: false,
  responsibilities: ['Put your school bag by the door', 'Water the plant'],
  creations: [],
  triedIdeas: {},
  events: [],
  feedback: [],
  lastEchoOffer: null,
  showDurationCard: false,
});

const initialEphemeral = (): EphemeralState => ({
  parentUnlocked: false,
  pinFailures: 0,
  pinCooldownUntil: 0,
  external: null,
});

export const useStore = create<PersistedState & EphemeralState & Actions>()(
  persist(
    (set, get) => ({
      ...initialPersisted(),
      ...initialEphemeral(),
      set: (patch) => set(patch),
      setMode: (mode) => set({ mode }),
      setScenario: (scenario) => set({ scenario }),
      updateChild: (patch) => set({ child: { ...get().child, ...patch } }),
      toggleCategory: (c) => {
        const ch = get().child;
        set({ child: { ...ch, categoriesEnabled: { ...ch.categoriesEnabled, [c]: !ch.categoriesEnabled[c] } } });
      },
      toggleRhythm: (ctx, c) => {
        const r = get().rhythm;
        set({ rhythm: { ...r, [ctx]: { ...r[ctx], [c]: !r[ctx][c] } } });
      },
      updateMaterial: (id, patch) => set({ materials: get().materials.map((m) => (m.id === id ? { ...m, ...patch } : m)) }),
      addMaterial: (m) => set({ materials: [...get().materials, m] }),
      removeMaterial: (id) => set({ materials: get().materials.filter((m) => m.id !== id) }),
      updateSource: (id, patch) => set({ sources: get().sources.map((s) => (s.id === id ? { ...s, ...patch } : s)) }),
      updateEcho: (patch) => set({ echoSettings: { ...get().echoSettings, ...patch } }),
      addCreation: (c) => {
        const next = [c, ...get().creations].slice(0, 12);
        try {
          set({ creations: next });
          return true;
        } catch {
          return false;
        }
      },
      removeCreation: (id) => set({ creations: get().creations.filter((c) => c.id !== id) }),
      logEvent: (name, data) => {
        const ev: CIIEvent = { id: uid(), name, at: Date.now(), ...data };
        const last = get().events[get().events.length - 1];
        // de-duplicate double-fires (e.g. React StrictMode effects in dev)
        if (last && last.name === name && last.category === ev.category && last.ref === ev.ref && ev.at - last.at < 400) return;
        // keep the local log bounded
        set({ events: [...get().events, ev].slice(-2000) });
      },
      addFeedback: (f) => set({ feedback: [...get().feedback, { ...f, id: uid(), at: Date.now() }] }),
      openExternal: (name) => {
        set({ external: { name } });
        get().logEvent('external_interstitial_shown');
      },
      resetPrototype: () => set({ ...initialPersisted(), ...initialEphemeral(), mode: get().mode }),
      clearEvents: () => set({ events: [], feedback: [] }),
    }),
    {
      name: 'cii-prototype-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => {
        // never persist parent unlock state or interstitials
        const { parentUnlocked: _a, pinFailures: _b, pinCooldownUntil: _c, external: _d, ...rest } = s;
        void _a; void _b; void _c; void _d;
        const out: Partial<typeof s> = {};
        for (const [k, v] of Object.entries(rest)) if (typeof v !== 'function') (out as Record<string, unknown>)[k] = v;
        return out as PersistedState;
      },
    },
  ),
);

export const newId = uid;

# CII Phase 1 validation prototype: plan

Purpose: a clickable, local-only prototype for parent and child concept-testing sessions.
It helps answer one question: **do children voluntarily choose this ecosystem, and do parents find the activity overview useful?**
Nothing here is production code, and nothing here is validated.

## Stack
Vite + React 18 + TypeScript + Tailwind CSS 3, React Router 6, Zustand (persisted to `localStorage` through a try/catch storage wrapper).
No backend, no accounts, no analytics SDKs, no web fonts, no network calls to third parties.

## File structure
```
src/
  main.tsx, App.tsx            entry + routes
  index.css                    design tokens (CSS variables) + base styles
  store/useStore.ts            single Zustand store (settings, content state, local events, feedback)
  lib/
    time.ts                    time context (After school / Evening / Weekend) from Demo Guide or real clock
    events.ts                  logEvent helper + Phase 1 metric derivation (prototype values only)
    availability.ts            which categories are offered (profile toggles x daily rhythm)
    storage.ts                 safe localStorage wrapper
  echo/
    EchoProvider.ts            adapter interface (swap point for a future real provider)
    MockEchoProvider.ts        scripted, keyword-matched provider (default and only provider)
    speech.ts                  Web Speech API helpers with graceful text-only fallback
  data/                        all local content (sample / original / public-domain)
    categories.ts echo.ts materials.ts sources.ts move.ts explore.ts study.ts askGuide.ts review.ts
  components/                  shell, badges, review notes, modals, toggles, demo guide, Echo card
  pages/child/*                Home, Study, Create, Watch, Move, Explore, AskGuide, Sharing
  pages/parent/*               Login, Overview, ChildProfile, Rhythm, Materials, Sources, EchoSettings,
                               Snapshot, Responsibilities
  pages/RoleChooser.tsx, pages/Review.tsx
```

## Components
`ChildLayout` (header: Home, child name, Parent Access; footer), `ParentLayout` (nav, lock),
`Proposed` / `ExistingBadge` (review mode only), `ReviewNote` (review mode only), `SampleLabel`,
`ModeCorner` (Participant / Review switch), `DemoGuide` (scenario bar), `ExternalInterstitial` (global modal),
`Toggle`, `Modal`, `EchoCard`, `CategoryTile`, `SourceTag` (Observed / Child-reported / Inferred).

## Data model (store)
- `mode`: `participant | review`; `demoGuideVisible`; `scenario` (After School, Late Arrival/TV, Maths/Study, or none = real clock)
- `child`: name, ageBand (`8-10 | 11-14`), interests, contentPrefs, `categoriesEnabled` per category
- `rhythm`: per context (`afterSchool | evening | weekend`) x category on/off
- `materials`: id, title, format, importStatus, availableToChild, sampleContentId
- `sources`: id, name, kind, approvedInCII, launch (`in-cii | outside | unavailable`), restricted (always `Not tested`), items
- `echoSettings`: tone, context note, suggestion frequency (default `onlyWhenAsked`), greeting on/off, voice
- `responsibilitiesEnabled` (default false), `responsibilities` list
- `creations` (child-only gallery), `triedIdeas` (child-reported taps)
- `events` (category-level only), `feedback` (facilitator notes from Snapshot)
- Parent unlock state, PIN attempts and cooldown are in memory only (not persisted).

## What is mocked
| Area | Mock |
|---|---|
| Echo | Scripted keyword replies (`MockEchoProvider`). No LLM, no API key. |
| Voice | Browser `speechSynthesis` / `SpeechRecognition` when present; text-only fallback. |
| Ask Guide / AI hints | Scripted examples only. |
| Video player | Static frame with play/pause; no real video. |
| File import | Stores file name and type only; status simulated; nothing parsed. |
| Parent auth | Demo PIN `2026`, in-memory unlock. |
| Snapshot | Today = derived from local events; earlier days = labelled sample data. |
| Metrics | Derived from local events; shown as prototype values only. |
| Third-party control | Not built. Shown as "Not tested". |

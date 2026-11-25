# Assumptions and choices

Choices made without asking, so the build could proceed. None of these is validated; each one is a candidate for discussion.

## Project
- The repository already holds unrelated personal pages, so the prototype lives in its own folder, `cii-prototype/`, instead of the repo root.
- Single child, named "Aarav", age band 8-10 by default. Multi-child support is out of scope.
- No web fonts are loaded (a Google Fonts request would be a third-party network call). The UI uses the system rounded / UI font stack.
- Light theme only; colours are defined as tokens in `src/index.css` and checked for WCAG AA body-text contrast.

## Modes and demo controls
- Default mode is **Participant**. `?mode=review` or `?mode=participant` in any URL switches it; the corner switch does the same.
- The Demo Guide bar is shown only in Review mode. A selected scenario stays active after switching to Participant mode, so a facilitator can set a scenario and then hand the tablet over.
- With no scenario selected, the real clock is used: weekday before 5 PM = After school, 5 PM or later = Evening, Saturday/Sunday = Weekend. Pressing **Hide** on the bar also clears the scenario (falls back to the real clock), as the brief asks.
- Scenario 4 (Parent Snapshot) navigates to `/parent/snapshot`; if the parent space is locked, the PIN gate appears first and then continues to the Snapshot.
- The demo PIN (2026) is printed on the PIN screen only in Review ("demo") mode. In Participant sessions the facilitator tells the parent the PIN.

## Echo
- Echo is a scripted keyword matcher (`src/echo/MockEchoProvider.ts`) behind an `EchoProvider` interface. No LLM, no API key.
- A single optional greeting is shown by default (parent can turn it off). The opening quick-reply chips are replies the child can tap, not suggestions.
- Suggestion frequency offers two settings: "Only when asked" (default) and "Once at the start of a chat" (one set of ideas per session, never repeated). A third "at transitions" option was left out because it moves towards reminders.
- Category options from Echo are buttons the child must tap ("Open Draw"). Echo never navigates on its own.
- "Voluntary" open = the child tapped a tile with no Echo suggestion for that category in the last 3 minutes. "Tile after Echo" and "via Echo chip" both count as prompted.
- The transcript is held in component memory only. It is never written to `localStorage` and is cleared when the child leaves Home.
- **Speech recognition is off by default.** Chromium-based browsers send recognition audio to the vendor's servers, which conflicts with "no network calls to third parties". A facilitator can turn it on in `/review` for a consented session. With it off (or unsupported, or mic denied) the live audio session still runs: Echo speaks, and the child types or taps.
- Speech output uses on-device voices only (`localService`). If the browser has none, Echo replies as text.
- Voice picker options change pitch and rate of the on-device voice; they are not distinct voice models.
- The parent "Context" note is stored but not used by the scripted Echo.

## Categories and availability
- Turning a category off in the Child profile removes its tile. Turning it to "Not now" in Daily rhythm shows the tile greyed out with "Not available right now".
- Ask Guide is marked **Concept only** in the Review table (the AI capability is not verified), and Proposed on its tile.
- Optional timers (Study, Move) count up, are off by default, and are not saved anywhere.

## Content
- All titles, channels and apps are invented placeholders. Study texts are original sample notes or public-domain Aesop fables (adapted).
- Seeded learning materials, sources and the Snapshot's earlier days are labelled "Sample" / "Placeholder" on screen.
- File upload stores only the file name and MIME type. Supported types (PDF, text, Markdown, PNG, JPEG) go "Importing" then "Imported" after a short simulated delay; others show "Unsupported". One seeded item shows "Failed".
- Uploaded files are not available to the child until the parent turns them on, and Study says it cannot show their contents.

## Snapshot and metrics
- Today's Snapshot uses local events since midnight. The four earlier days are fixed sample data.
- "Inferred (prototype)" items come from two deliberately simple rules (3+ areas opened; Draw opened twice). They are expected to be wrong at times.
- The duration card shows illustrative ranges labelled Sample, behind a toggle labelled "Duration capture is untested".
- Phase 1 metrics in `/review` are computed from this browser's event log only. No targets or baselines are shown.
- A "session" for metrics starts once per browser tab (`sessionStorage`).

## Parent access
- Parent unlock state is in memory only; reloading the page locks the parent space again.
- Three wrong PINs trigger a 30-second cooldown.

## Responsibilities
- Off by default. When on, Home shows a collapsed "Things I might do" panel below the tiles: plain text, no ticks, no tracking, up to five items.

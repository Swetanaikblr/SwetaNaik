# CII Phase 1 validation prototype

A clickable web prototype of the Child Independence Intelligence (CII) Phase 1 experience, for parent and child concept-testing sessions.

It exists to help answer one question: **do children voluntarily choose this ecosystem, and do parents find the activity overview useful?**

This is not a production app. Nothing in it is validated. Echo and Ask Guide are scripted, video is a mock player, file import is simulated, and all content is sample or placeholder.

## Run it

Requires Node 18 or later.

```bash
cd cii-prototype
npm install
npm run dev          # http://localhost:5173
```

Other scripts: `npm run build` (type-check + production build to `dist/`), `npm run preview` (serve the build).

Useful URLs:

| URL | What |
|---|---|
| `/` | Role chooser (Child space / Parent space), mode switch, Reset prototype |
| `/child?mode=review` | Child Home with Review mode on (badges, notes, Demo Guide) |
| `/child?mode=participant` | Child Home as participants see it |
| `/review` | Review panel: screen status, open questions, assumptions, metrics, event log, JSON export |

Demo parent PIN: **2026** (shown on the PIN screen in Review mode only).

All state lives in this browser's `localStorage` under `cii-prototype-v1`. **Reset prototype** (on `/` and `/review`) restores the starting state. There is no backend and the app makes no network calls beyond the local dev server.

## Modes

- **Participant mode** (default): no Demo Guide, no Proposed badges, no review notes. Use this in front of participants.
- **Review mode**: shows Proposed / Existing prototype badges, dashed amber review notes, the Demo Guide bar and the Review panel link.

Switch with the small corner control (bottom right), the buttons on `/`, or `?mode=review` / `?mode=participant` on any URL.

## Demo script: the 4 scenarios

Turn Review mode on to see the Demo Guide bar ("Demo controls: not part of the product"). Pick a scenario, then switch to Participant mode before handing over the device; the scenario stays set. Press **Use real clock** or **Hide** to go back to the real time.

1. **After School (3:30 PM)**
   Home says "Welcome home from school! Relax or recharge." Echo opens with an invitation and the chips *I'm bored / I'm tired / Show me ideas*.
   Try: tap *I'm bored*; Echo offers three options from different categories plus "None of these". Watch whether the child picks one of Echo's options or goes straight to a tile.
2. **Late Arrival / TV (6:00 PM)**
   Evening greeting. Echo: "Long day? You could watch something, or try something cosy." Chips include *I want to watch TV*.
   Try: ask Echo for something not on the list ("can I watch a scary movie"), and you get "That one isn't in your approved list. Want to pick something else?" In Watch, open *How bees talk* (unavailable state) and *Puzzle Garden* (the "This opens outside CII" interstitial).
3. **Maths / Study Prompt (5:05 PM)**
   Echo mentions that the maths materials are in Study "if you want them", with plenty else too. Chips: *Help me with maths / Something else first / I just played*.
   Try: open Study and note the separate "AI help (prototype)" hint box, which is kept apart from the source text. Check whether the child chooses Study or something else first.
4. **Parent Snapshot**
   Opens the PIN gate (2026), then Today's Snapshot. It shows the areas opened today (Observed in CII), "I tried this" taps (Child-reported) and simple guesses (Inferred). Earlier days are sample data. Ask the parent the feedback questions at the bottom.

## Facilitator checklist

Before the session
- [ ] `npm run dev` running; open `/` on the tablet (primary sizes 1024×768 landscape, 820×1180 portrait).
- [ ] Press **Reset prototype** on `/` (clears the previous participant's events, creations and feedback).
- [ ] Decide on voice. Speech recognition is **off by default** because some browsers send audio to the vendor's servers. Turn it on in `/review` only with consent. With it off, Echo can still speak (on-device voices only) and the child types or taps.
- [ ] Set the age band (Parent space → Child profile) to match the child: 8-10 or 11-14.
- [ ] Choose a scenario in Review mode, then switch to **Participant mode**.

During the child session
- [ ] Start on Child Home. Don't point at Echo or any tile; let the child choose.
- [ ] Note what the child opens first, and whether they use Echo at all.
- [ ] Check that the child can always get back with the Home button, and can Skip or Stop in Move, Create and Echo.
- [ ] Optionally show "What my parent sees" (header link) and ask what they think about it.

During the parent session
- [ ] Parent Access → PIN 2026 → Overview.
- [ ] Walk through Child profile, Daily rhythm, Learning Materials (try a simulated upload), Sources (three separate statuses), Echo guidance.
- [ ] Today's Snapshot: ask "Was this useful? What would you remove?" and record it with the on-page control.
- [ ] Optional: turn on Responsibilities and show the child Home's secondary "Things I might do".

After the session
- [ ] Turn Review mode on → `/review` → **Export feedback and events (JSON)**.
- [ ] Treat the metrics as prototype values from one browser, not findings.
- [ ] Reset prototype before the next participant.

## What is mocked

| Area | How it works here |
|---|---|
| Echo | Scripted keyword replies (`src/echo/MockEchoProvider.ts`) behind the `EchoProvider` interface (`src/echo/EchoProvider.ts`), so a real provider could be added later. Labelled "Prototype assistant (scripted)". |
| Voice | Browser `speechSynthesis` (on-device voices only) and `SpeechRecognition` (off by default). Falls back to text. |
| Ask Guide and Study hints | Scripted examples only. |
| Watch | Placeholder titles, emoji thumbnails, static mock player. |
| Learning Materials upload | Keeps the file name and type only. The file is never read. Import status is simulated. |
| Parent authentication | Demo PIN; unlock state kept in memory only. |
| Today's Snapshot | Today comes from local events; earlier days are labelled sample data. |
| Metrics | Derived from the local event log; shown as prototype values. |
| Third-party control | Not built. Every source shows "Technically restricted or controlled: Not tested". |

## Event tracking

Events are stored locally (category level only, never what the child typed or said) and listed in `/review`:
`session_started`, `home_viewed`, `echo_session_started` / `echo_session_ended`, `echo_suggestion_shown` / `accepted` / `ignored`, `category_opened` (with `via`: `tile`, `tile_after_echo` or `echo_chip`), `activity_started` / `stopped` / `skipped`, `returned_home`, `watch_unavailable_shown`, `external_interstitial_shown`, `snapshot_viewed`, `snapshot_feedback`, plus `material_opened` and `child_reported_tried` for the Snapshot.

Phase 1 metrics shown in `/review` (prototype values only, no targets or baselines):
- Voluntary discovery rate: categories opened with no Echo prompt, compared with those opened after or through one.
- Breadth of exploration: distinct categories opened.
- Repeat voluntary use: sessions after the first that include at least one voluntary open.
- Guardrail: balance of opens across categories. More usage is not a goal, and time spent is never shown as success.

## Project layout

See `PLAN.md` for the file structure, components and data model, and `ASSUMPTIONS.md` for the choices made while building.

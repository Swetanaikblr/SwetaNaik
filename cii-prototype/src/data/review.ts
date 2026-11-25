export type ScreenStatus = 'Existing prototype' | 'Proposed' | 'Concept only';

export const SCREENS: { path: string; name: string; status: ScreenStatus; note?: string }[] = [
  { path: '/', name: 'Role chooser', status: 'Proposed', note: 'Prototype entry point for sessions' },
  { path: '/child', name: 'Child Home (time-aware, Echo, tiles)', status: 'Existing prototype', note: 'Rebuilt closely; typos fixed. Transcript privacy line is Proposed.' },
  { path: '/child/study', name: 'Study / Selected Textbook', status: 'Existing prototype', note: 'AI help container is Proposed' },
  { path: '/child/create', name: 'Create / Draw', status: 'Proposed' },
  { path: '/child/watch', name: 'Watch / Approved Video', status: 'Existing prototype', note: 'Mock player only' },
  { path: '/child/move', name: 'Move / Exercise Activity', status: 'Existing prototype' },
  { path: '/child/explore', name: 'Explore / Calculator & Reading Nook', status: 'Existing prototype', note: '"I tried this" (child-reported) is Proposed' },
  { path: '/child/ask-guide', name: 'Ask Guide (AI help)', status: 'Concept only', note: 'Scripted examples; capability not verified' },
  { path: '/child/sharing', name: 'What my parent can see', status: 'Proposed' },
  { path: '/parent/login', name: 'Parent PIN gate', status: 'Existing prototype', note: 'Demo PIN 2026; real auth untested' },
  { path: '/parent', name: 'Parent Overview', status: 'Proposed' },
  { path: '/parent/child', name: 'Child profile and age band', status: 'Proposed' },
  { path: '/parent/rhythm', name: 'Daily rhythm', status: 'Proposed' },
  { path: '/parent/materials', name: 'Learning Materials', status: 'Existing prototype', note: 'Upload simulated' },
  { path: '/parent/sources', name: 'Approved Apps, Sources and Channels', status: 'Existing prototype', note: 'Three-status split is Proposed' },
  { path: '/parent/echo', name: 'Echo guidance settings', status: 'Existing prototype' },
  { path: '/parent/snapshot', name: "Today's Snapshot", status: 'Proposed' },
  { path: '/parent/responsibilities', name: 'Optional Responsibilities', status: 'Proposed', note: 'Off by default' },
  { path: '/review', name: 'Review panel', status: 'Proposed', note: 'Product team only' },
];

export const OPEN_QUESTIONS = [
  'What does "healthy option" mean to children and parents?',
  'What category breadth is enough, and which categories appeal at 8-10 vs 11-14?',
  'Does Echo add value beyond a visual catalogue?',
  'Should voice, touch and text all be supported from the start?',
  'How much parent visibility is useful before it feels intrusive?',
  'What should the child be told about sharing?',
  'Which activity signals can be captured reliably?',
  'Is a restricted environment needed, and on which exact device?',
  'Which external sources can be controlled?',
  'Is Responsibilities useful or distracting?',
  'Which capabilities are core vs paid?',
  'How will content curation, licensing and moderation work?',
  'What safeguards are needed for voice AI and child data?',
];

export const ASSUMPTIONS = [
  'One child per household; name "Aarav", age band 8-10 by default.',
  'Time context comes from the Demo Guide scenario; with no scenario the real clock is used (weekday < 5 PM = After school, later = Evening, Sat/Sun = Weekend).',
  'A category is "voluntary" when the child taps its tile with no Echo suggestion for it in the last 3 minutes.',
  'Profile category off = tile hidden; rhythm "Not now" = tile shown as "Not available right now".',
  'Echo transcript lives in memory only and is cleared when the child leaves Home.',
  'Browser speech recognition is off by default because some browsers send audio to vendor servers.',
  'Earlier days in the Snapshot pattern are sample data; only today is derived from local events.',
];

export const UNVALIDATED = [
  'Device lockdown / kiosk mode',
  'Source enforcement and control inside third-party apps or players',
  'Telemetry reliability (what was opened, and especially duration)',
  'AI accuracy, safety and reading-level fit (Echo and Ask Guide are scripted)',
  'Curriculum coverage of learning materials',
  'Automatic understanding of uploaded files',
  'Real parent authentication and child-session separation',
];

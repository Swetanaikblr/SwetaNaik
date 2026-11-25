import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { echoProvider } from '../echo/MockEchoProvider';
import type { EchoContext, EchoReply } from '../echo/EchoProvider';
import { listenOnce, recognitionCtor, speak, speechSynthesisSupported, stopSpeaking, type ListenHandle } from '../echo/speech';
import { CATEGORY_META } from '../data/categories';
import { VOICES, CATEGORY_OFFER, pick } from '../data/echo';
import { useStore } from '../store/useStore';
import { useAvailableCategories } from '../lib/availability';
import { useOpenCategory } from '../lib/openCategory';
import { useTimeInfo } from '../lib/time';
import { Proposed, ReviewNote } from './Badges';
import type { Category } from '../types';

interface Msg { id: number; from: 'echo' | 'child'; text: string; suggestions?: Category[]; chips?: string[] }

function fmt(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export function EchoCard() {
  const child = useStore((s) => s.child);
  const echoSettings = useStore((s) => s.echoSettings);
  const sources = useStore((s) => s.sources);
  const voice = useStore((s) => s.echoVoice);
  const recognitionAllowed = useStore((s) => s.speechRecognitionAllowed);
  const set = useStore((s) => s.set);
  const logEvent = useStore((s) => s.logEvent);
  const time = useTimeInfo();
  const available = useAvailableCategories();
  const openCategory = useOpenCategory();

  const ctx: EchoContext = useMemo(
    () => ({
      childName: child.name,
      ageBand: child.ageBand,
      tone: echoSettings.tone,
      timeContext: time.context,
      scenario: time.scenario,
      availableCategories: available,
      approvedTitles: sources
        .filter((s) => s.approvedInCII && s.launch === 'in-cii' && s.kind === 'Video channel')
        .flatMap((s) => s.items.filter((i) => !i.unavailable).map((i) => i.title.replace(' (placeholder)', ''))),
    }),
    [child.name, child.ageBand, echoSettings.tone, time.context, time.scenario, available, sources],
  );

  const idRef = useRef(1);
  const makeOpening = useCallback((): Msg[] => {
    if (!echoSettings.greetingEnabled) return [];
    const o = echoProvider.opening(ctx);
    return [{ id: idRef.current++, from: 'echo', text: o.text, chips: o.chips }];
  }, [ctx, echoSettings.greetingEnabled]);

  const [messages, setMessages] = useState<Msg[]>(makeOpening);
  const [input, setInput] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const listenRef = useRef<ListenHandle | null>(null);
  const sessionRef = useRef(false);
  const offeredOnceRef = useRef(false);

  // Scenario / age band changes reset the conversation to a fresh opening line.
  useEffect(() => {
    setMessages(makeOpening());
    setQuiet(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time.scenario, child.ageBand, echoSettings.tone, echoSettings.greetingEnabled]);

  useEffect(() => {
    if (!voiceActive) return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [voiceActive]);

  const endSession = useCallback(() => {
    listenRef.current?.stop();
    listenRef.current = null;
    setListening(false);
    stopSpeaking();
    if (sessionRef.current) {
      logEvent('echo_session_ended');
      const offer = useStore.getState().lastEchoOffer;
      if (offer) {
        logEvent('echo_suggestion_ignored');
        set({ lastEchoOffer: null });
      }
    }
    sessionRef.current = false;
    setSessionActive(false);
    setVoiceActive(false);
    setElapsed(0);
  }, [logEvent, set]);

  // End cleanly when leaving Home.
  useEffect(() => () => endSession(), [endSession]);

  const ensureSession = () => {
    if (!sessionRef.current) {
      sessionRef.current = true;
      setSessionActive(true);
      logEvent('echo_session_started');
      return true;
    }
    return false;
  };

  const say = (text: string) => {
    if (voiceActive && !muted) speak(text, voice);
  };

  const pushEcho = (r: EchoReply) => {
    setMessages((m) => [...m, { id: idRef.current++, from: 'echo', text: r.text, suggestions: r.suggestions, chips: r.chips }]);
    if (r.suggestions?.length) {
      r.suggestions.forEach((c) => logEvent('echo_suggestion_shown', { category: c }));
      set({ lastEchoOffer: { categories: r.suggestions, at: Date.now() } });
    }
    say(r.text);
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setQuiet(false);
    const fresh = ensureSession();
    const pending = useStore.getState().lastEchoOffer;
    if (pending) {
      logEvent('echo_suggestion_ignored');
      set({ lastEchoOffer: null });
    }
    setMessages((m) => [...m, { id: idRef.current++, from: 'child', text }]);
    setInput('');
    const r = await echoProvider.respond(text, ctx);
    pushEcho(r);
    if (fresh && !r.suggestions && echoSettings.frequency !== 'onlyWhenAsked' && !offeredOnceRef.current && !r.stop) {
      // Parent allowed ONE optional suggestion at the start of a session. Never repeated.
      offeredOnceRef.current = true;
      const cats = available.slice(0, 3);
      if (cats.length)
        pushEcho({ text: `If you want ideas: ${cats.map((c) => pick(CATEGORY_OFFER[c], child.ageBand)).join(', or ')}.`, suggestions: cats });
    }
    if (r.stop) {
      setQuiet(true);
      endSession();
    }
  };

  const startVoice = () => {
    ensureSession();
    setVoiceActive(true);
    setQuiet(false);
    setElapsed(0);
    if (!speechSynthesisSupported()) setMicNote("Echo can't speak out loud in this browser, so replies show as text.");
    if (!recognitionAllowed) setMicNote('Listening is off in this prototype. You can type or tap a reply instead.');
    else if (!recognitionCtor()) setMicNote("This browser can't listen, so you can type or tap a reply instead.");
    else setMicNote(null);
    const last = [...messages].reverse().find((m) => m.from === 'echo');
    if (last && !muted) speak(last.text, voice);
  };

  const talk = () => {
    if (!recognitionAllowed || listening) return;
    setListening(true);
    listenRef.current = listenOnce(
      (t) => void send(t),
      (kind) => {
        setListening(false);
        setMicNote(
          kind === 'denied'
            ? "The microphone isn't allowed, and that's okay. You can type or tap a reply instead."
            : kind === 'unsupported'
              ? "This browser can't listen, so you can type or tap a reply instead."
              : "I couldn't hear that. You can try again, or type instead.",
        );
      },
      () => setListening(false),
    );
  };

  const toggleMute = () => {
    if (!muted) stopSpeaking();
    setMuted(!muted);
  };

  const stopAll = () => {
    endSession();
    setQuiet(true);
  };

  const latestEcho = [...messages].reverse().find((m) => m.from === 'echo');
  const status = quiet ? 'Quiet' : voiceActive ? (muted ? 'Muted' : 'Live') : 'Ready to chat';

  return (
    <section aria-labelledby="echo-title" className="card flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-3xl">🌀</div>
        <div className="min-w-0 flex-1">
          <h2 id="echo-title" className="text-xl font-bold">Echo</h2>
          <p className="text-sm text-muted">Your idea buddy. Only when you want.</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ai">Prototype assistant (scripted)</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${status === 'Live' ? 'bg-accent text-white' : status === 'Ready to chat' ? 'bg-accent-soft text-accent' : 'bg-slate-100 text-slate-700'}`}
          aria-live="polite"
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="label">Voice</span>
          <select className="input mt-1" value={voice} onChange={(e) => set({ echoVoice: e.target.value })} aria-label="Echo voice">
            {VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="label">Mode</span>
          <select className="input mt-1" value="companion" onChange={() => undefined} aria-label="Echo mode">
            <option value="companion">Companion</option>
          </select>
        </label>
      </div>

      {/* Latest Echo line */}
      {!quiet && latestEcho ? (
        <div className="rounded-2xl bg-brand-soft p-4">
          <p className="whitespace-pre-line text-ink">{latestEcho.text}</p>
          {latestEcho.suggestions && latestEcho.suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Options Echo offered">
              {latestEcho.suggestions.map((c) => (
                <button key={c} className="chip border-brand/30" onClick={() => { endSession(); openCategory(c, true); }}>
                  <span aria-hidden className="mr-1">{CATEGORY_META[c].icon}</span> Open {CATEGORY_META[c].label}
                </button>
              ))}
              <button className="chip" onClick={() => void send('none')}>None of these</button>
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-2xl bg-paper p-4 text-muted">{quiet ? "Echo is quiet. Say hi any time." : 'Say hi whenever you like.'}</p>
      )}

      {/* Voice controls */}
      <div className="flex flex-wrap items-center gap-2">
        {!voiceActive ? (
          <button className="btn-primary" onClick={startVoice}><span aria-hidden>🎙️</span> Start Live Audio Session</button>
        ) : (
          <>
            <button className="btn bg-danger text-white hover:bg-danger/90" onClick={endSession}>
              <span aria-hidden>⏹</span> End Voice <span className="font-mono text-sm">{fmt(elapsed)}</span>
            </button>
            <div className="flex h-8 items-center gap-1" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={`h-full w-1.5 rounded bg-brand ${muted ? 'opacity-30' : 'wave-bar'}`} style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
            {recognitionAllowed && recognitionCtor() && (
              <button className="btn-soft" onClick={talk} disabled={listening} aria-label="Tap to talk">
                <span aria-hidden>🎤</span> {listening ? 'Listening…' : 'Tap to talk'}
              </button>
            )}
          </>
        )}
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Unmute Echo' : 'Mute Echo'}>
            <span aria-hidden>{muted ? '🔇' : '🔈'}</span> {muted ? 'Unmute' : 'Mute'}
          </button>
          <button className="btn-ghost" onClick={stopAll} aria-label="Stop Echo">
            <span aria-hidden>✋</span> Stop
          </button>
        </div>
      </div>
      {micNote && voiceActive && <p className="text-sm text-muted" role="status">{micNote}</p>}

      {/* Quick replies */}
      {!quiet && latestEcho?.chips && (
        <div className="flex flex-wrap gap-2" aria-label="Suggested replies">
          {latestEcho.chips.map((c) => <button key={c} className="chip" onClick={() => void send(c)}>{c}</button>)}
        </div>
      )}

      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <label htmlFor="echo-input" className="sr-only">Message Echo</label>
        <input id="echo-input" className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type to Echo…" autoComplete="off" maxLength={200} />
        <button type="submit" className="btn-primary" aria-label="Send" disabled={!input.trim()}>Send</button>
      </form>

      {/* Transcript: child only, never persisted, never shown to parent */}
      <div className="rounded-xl border border-line">
        <button
          className="flex min-h-[44px] w-full items-center justify-between px-4 text-left text-sm font-bold"
          aria-expanded={transcriptOpen}
          onClick={() => setTranscriptOpen((o) => !o)}
        >
          Session transcript <span aria-hidden>{transcriptOpen ? '▲' : '▼'}</span>
        </button>
        {transcriptOpen && (
          <ol className="max-h-60 space-y-2 overflow-y-auto px-4 pb-3 text-sm" aria-label="Session transcript">
            {messages.length === 0 && <li className="text-muted">Nothing yet.</li>}
            {messages.map((m) => (
              <li key={m.id} className={m.from === 'child' ? 'text-right' : ''}>
                <span className={`inline-block max-w-[85%] whitespace-pre-line rounded-xl px-3 py-2 ${m.from === 'child' ? 'bg-accent-soft' : 'bg-paper'}`}>
                  <span className="sr-only">{m.from === 'child' ? 'You: ' : 'Echo: '}</span>
                  {m.text}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <p className="-mt-2 text-xs text-muted">
        Only you see this. Your parent doesn&rsquo;t get a transcript.<Proposed />
      </p>
      {sessionActive && <span className="sr-only">Echo session active</span>}
      <ReviewNote>
        Echo is scripted (keyword matching). It is child-initiated by default and never opens a category on its own. Transcripts are kept in memory only and cleared when leaving Home. Browser speech recognition may send audio to the browser vendor, so it is off by default (enable in the Review panel). Only on-device voices are used for speaking.
      </ReviewNote>
    </section>
  );
}

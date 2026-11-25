// LiveVoiceSession: Full Multimodal Voice Session Coordinator
import { VoiceStateMachine, VoiceState } from './VoiceStateMachine';
import { AudioInput } from './AudioInput';
import { AudioOutput } from './AudioOutput';
import { AudioVisualizer, VisualizerFrame } from './AudioVisualizer';
import { CompanionProfile, getCompanionProfile, CompanionId, GeminiLiveVoiceName } from '../companions/CompanionProfile';
import { COMPANION_PROFILES } from '../companions/companionProfiles';
import { ObservationStore } from '../observations/ObservationStore';
import { ReminderScheduler } from '../wellness/ReminderScheduler';
import { getActiveVoiceName } from './voiceRegistry';

import { speakText } from '../utils/speech';
import { VoiceTimerManager, parseTimerCommand } from '../wellness/VoiceTimerManager';

export interface StructuredToolCall {
  callId?: string;
  name: string;
  args: Record<string, any>;
}

export interface LiveVoiceSessionOptions {
  companionId?: CompanionId;
  childName?: string;
  timeScenario?: string;
  onStateChange?: (state: VoiceState) => void;
  onVisualizerFrame?: (frame: VisualizerFrame) => void;
  onTranscript?: (text: string, isUser: boolean, isFinal: boolean) => void;
  onToolCall?: (tool: StructuredToolCall) => void;
  onSuggestedReplies?: (replies: string[]) => void;
  onAction?: (action: string) => void;
  onObservation?: (observation: any) => void;
  onSetTimer?: (timer: { durationSeconds: number; label: string }) => void;
}

export class LiveVoiceSession {
  private stateMachine = new VoiceStateMachine('idle');
  private audioInput = new AudioInput({ sampleRate: 16000 });
  private audioOutput = new AudioOutput(24000);
  private visualizer = new AudioVisualizer(12);

  private ws: WebSocket | null = null;
  private companion: CompanionProfile;
  private childName: string;
  private timeScenario: string;
  private history: { sender: string; text: string }[] = [];

  private onStateChangeCb: ((state: VoiceState) => void) | null = null;
  private onVisualizerFrameCb: ((frame: VisualizerFrame) => void) | null = null;
  private onTranscriptCb: ((text: string, isUser: boolean, isFinal: boolean) => void) | null = null;
  private onToolCallCb: ((tool: StructuredToolCall) => void) | null = null;
  private onSuggestedRepliesCb: ((replies: string[]) => void) | null = null;
  private onActionCb: ((action: string) => void) | null = null;
  private onObservationCb: ((observation: any) => void) | null = null;
  private onSetTimerCb: ((timer: { durationSeconds: number; label: string }) => void) | null = null;

  private isConnected = false;
  private isConnecting = false;
  private useFallbackChat = false;
  private speechRecognizer: any = null;

  constructor(options?: LiveVoiceSessionOptions) {
    this.companion = getCompanionProfile(options?.companionId || 'echo');
    // If user has chosen a custom voice preference, apply it to the companion profile
    const savedVoice = getActiveVoiceName();
    if (savedVoice) {
      this.companion = {
        ...this.companion,
        geminiVoice: savedVoice,
      };
    }
    this.childName = options?.childName || 'Aarav';
    this.timeScenario = options?.timeScenario || 'after_school';
    VoiceTimerManager.setChildName(this.childName);

    // Seed conversation history with initial scenario greeting so LLM knows opening turn
    const initialGreeting =
      this.timeScenario === 'morning'
        ? this.companion.greetingStarters.morning
        : this.timeScenario === 'pre_study' || this.timeScenario === 'study_time'
        ? this.companion.greetingStarters.lateLogin || this.companion.greetingStarters.studyTime
        : this.companion.greetingStarters.afterSchool;
    this.history.push({ sender: this.companion.name, text: initialGreeting });

    if (options?.onStateChange) this.onStateChangeCb = options.onStateChange;
    if (options?.onVisualizerFrame) this.onVisualizerFrameCb = options.onVisualizerFrame;
    if (options?.onTranscript) this.onTranscriptCb = options.onTranscript;
    if (options?.onToolCall) this.onToolCallCb = options.onToolCall;
    if (options?.onSuggestedReplies) this.onSuggestedRepliesCb = options.onSuggestedReplies;
    if (options?.onAction) this.onActionCb = options.onAction;
    if (options?.onObservation) this.onObservationCb = options.onObservation;
    if (options?.onSetTimer) this.onSetTimerCb = options.onSetTimer;

    this.setupStateMachineListeners();
    this.setupAudioListeners();
  }

  private setupStateMachineListeners(): void {
    this.stateMachine.subscribe((state) => {
      // Connect visualizer to active audio stream
      if (state === 'speaking') {
        this.visualizer.attachAnalyser(this.audioOutput.getAnalyserNode());
      } else if (state === 'listening' || state === 'thinking') {
        this.visualizer.attachAnalyser(this.audioInput.getAnalyserNode());
      }

      if (this.onStateChangeCb) {
        this.onStateChangeCb(state);
      }
    });
  }

  private setupAudioListeners(): void {
    // Client-side VAD listener: does not trigger barge-in from speaker audio bleed
    this.audioInput.onSpeechStart(() => {
      // Speech detected
    });

    this.audioInput.onSpeechEnd(() => {
      // Speech ended
    });

    // When output starts/stops speaking
    this.audioOutput.onPlaybackChange((isPlaying) => {
      if (isPlaying) {
        this.stateMachine.transition('MODEL_SPEAKING_START');
      } else {
        this.stateMachine.transition('MODEL_SPEAKING_STOP');
      }
    });

    // Start visualizer pump
    this.visualizer.start((frame) => {
      if (this.onVisualizerFrameCb) {
        this.onVisualizerFrameCb(frame);
      }
    });
  }

  /**
   * Starts the Live Voice Session: opens WebSocket connection and mic
   */
  public async start(): Promise<boolean> {
    if (this.isConnected || this.isConnecting) return true;
    this.isConnecting = true;
    this.stateMachine.transition('CONNECT_REQUEST');

    try {
      await this.audioOutput.ensureContext();

      // Connect to WebSocket Live API bridge
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/live`;

      let wsConnected = false;

      try {
        await new Promise<void>((resolve, reject) => {
          const socket = new WebSocket(wsUrl);
          this.ws = socket;

          const timer = setTimeout(() => {
            if (!wsConnected) {
              socket.close();
              reject(new Error('WebSocket connection timeout'));
            }
          }, 4000);

          socket.onopen = () => {
            clearTimeout(timer);
            wsConnected = true;
            this.isConnected = true;
            this.isConnecting = false;

            // Send session initialization payload
            socket.send(
              JSON.stringify({
                type: 'init',
                companionId: this.companion.id,
                voiceName: this.companion.geminiVoice,
                childName: this.childName,
                timeScenario: this.timeScenario,
                systemInstructionAddendum: this.companion.systemInstructionAddendum,
              })
            );

            this.stateMachine.transition('CONNECTION_ESTABLISHED');
            resolve();
          };

          socket.onmessage = (event) => {
            this.handleServerMessage(event.data);
          };

          socket.onerror = (err) => {
            console.warn('Live WebSocket error:', err);
            if (!wsConnected) reject(err);
          };

          socket.onclose = () => {
            this.isConnected = false;
            this.stateMachine.transition('DISCONNECT');
          };
        });
      } catch (wsErr) {
        console.warn('Live WebSocket unavailable, enabling structured API fallback:', wsErr);
        this.useFallbackChat = true;
        this.isConnected = true;
        this.isConnecting = false;
        this.stateMachine.transition('CONNECTION_ESTABLISHED');
      }

      // Start mic audio capture
      await this.audioInput.start((pcmBase64, rms) => {
        const isSpeaking = this.audioOutput.getIsPlaying() || this.stateMachine.getState() === 'speaking';

        // Critical: Do not send mic audio while the assistant is actively speaking out of speakers!
        // This prevents acoustic feedback loops where Gemini Live hears itself and stops in between.
        if (isSpeaking) {
          // If child deliberately speaks loud enough to override speaker audio (intentional barge-in)
          if (rms > 0.14) {
            console.log('[LiveVoiceSession] Deliberate loud speech detected during playback, interrupting');
            this.interrupt();
          }
          return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: 'audio',
              audio: pcmBase64,
            })
          );
        }
      });

      // Start optional speech recognition in browser for instant voice command parsing
      this.startSpeechRecognizer();

      return true;
    } catch (err) {
      console.error('Failed to initialize LiveVoiceSession:', err);
      this.isConnecting = false;
      this.stateMachine.transition('SESSION_ERROR');
      return false;
    }
  }

  /**
   * Browser SpeechRecognition listener for voice command parsing (reminders, exercise demo, etc.)
   */
  private startSpeechRecognizer(): void {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      this.speechRecognizer = new SpeechRec();
      this.speechRecognizer.continuous = true;
      this.speechRecognizer.interimResults = false;
      this.speechRecognizer.lang = 'en-US';

      this.speechRecognizer.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult && lastResult.isFinal) {
          const spoken = lastResult[0]?.transcript?.trim();
          if (spoken) {
            console.log('[LiveVoiceSession Voice Recognized]:', spoken);
            this.sendTextMessage(spoken);
          }
        }
      };

      this.speechRecognizer.onerror = (e: any) => {
        // Non-blocking notice
        console.warn('SpeechRecognition notice:', e?.error);
      };

      this.speechRecognizer.start();
    } catch (recErr) {
      console.warn('SpeechRecognition initialization notice:', recErr);
    }
  }

  /**
   * Handles incoming message from Gemini Live WebSocket Bridge
   */
  private handleServerMessage(rawData: string): void {
    try {
      const msg = JSON.parse(rawData);

      // 1. Audio stream from model (24kHz PCM)
      if (msg.audio) {
        this.audioOutput.playPcmChunk(msg.audio);
      }

      // 2. Barge-in interruption acknowledgment
      if (msg.interrupted) {
        this.audioOutput.stopPlayback();
        this.stateMachine.transition('INTERRUPTED');
      }

      // 3. Streaming transcript
      if (msg.transcript) {
        if (this.onTranscriptCb) {
          this.onTranscriptCb(msg.transcript, msg.isUser ?? false, false);
        }
      }

      // 4. Turn complete acknowledgment
      if (msg.turnComplete) {
        if (this.onTranscriptCb) {
          this.onTranscriptCb('', false, true);
        }
      }

      // 5. Dynamic Contextual Suggested Replies, Actions & Timers
      if (msg.suggestedReplies && this.onSuggestedRepliesCb) {
        this.onSuggestedRepliesCb(msg.suggestedReplies);
      }
      if (msg.action) {
        if (msg.action === 'demonstrate_exercise' && this.onActionCb) {
          this.onActionCb('open_move');
        } else if (this.onActionCb) {
          this.onActionCb(msg.action);
        }
      }
      if (msg.observationRecord && this.onObservationCb) {
        this.onObservationCb(msg.observationRecord);
      }
      if (msg.timerData) {
        VoiceTimerManager.setTimer(msg.timerData.durationSeconds, msg.timerData.label);
        if (this.onSetTimerCb) {
          this.onSetTimerCb(msg.timerData);
        }
      }

      // 6. Structured Tool Call Execution
      if (msg.type === 'tool_call' || msg.toolCall) {
        const tool: StructuredToolCall = msg.toolCall || {
          name: msg.name,
          args: msg.args || {},
          callId: msg.callId,
        };
        this.executeStructuredTool(tool);
      }
    } catch (err) {
      console.warn('Error parsing server message:', err);
    }
  }

  /**
   * Executes structured tools received via Gemini Live function declaration
   */
  public executeStructuredTool(tool: StructuredToolCall): void {
    console.log('[Gemini Structured Tool Execution]:', tool.name, tool.args);

    if (this.onToolCallCb) {
      this.onToolCallCb(tool);
    }

    switch (tool.name) {
      case 'setTimer':
        if (tool.args.durationSeconds || tool.args.minutes) {
          const secs = tool.args.durationSeconds || Math.round((tool.args.minutes || 1) * 60);
          const label = tool.args.label || `${Math.round(secs / 60)} min reminder`;
          VoiceTimerManager.setTimer(secs, label);
          if (this.onSetTimerCb) {
            this.onSetTimerCb({ durationSeconds: secs, label });
          }
        }
        break;

      case 'demonstrateExercise':
        if (this.onActionCb) {
          this.onActionCb('open_move');
        }
        break;

      case 'openStudySession':
        if (this.onActionCb) this.onActionCb('open_study');
        break;

      case 'openDrawingStudio':
        if (this.onActionCb) this.onActionCb('open_drawing');
        break;

      case 'openMovementBreak':
        if (this.onActionCb) this.onActionCb('open_move');
        break;

      case 'openEducationalVideos':
        if (this.onActionCb) this.onActionCb('open_youtube');
        break;

      case 'openCuriosityExplorer':
        if (this.onActionCb) this.onActionCb('open_explore');
        break;

      case 'recordObservation':
        // Record structured observation in domain store
        ObservationStore.addObservation({
          title: tool.args.title || 'Conversational check-in',
          detail: tool.args.detail || 'Recorded via structured Gemini tool declaration',
          category: tool.args.category || 'routine',
          source: tool.args.source || 'child_reported',
          confidenceScore: tool.args.confidence || 0.95,
          rawChildQuote: tool.args.rawChildQuote,
        });
        break;

      case 'scheduleWellnessBreak':
        // Schedule or trigger wellness break
        ReminderScheduler.scheduleBreak(
          tool.args.delayMinutes || 0,
          tool.args.reason || 'Time for a quick stretch and water pause!',
          tool.args.breakType || 'movement_recharge'
        );
        break;

      case 'endVoiceSession':
        // Conclude current speaking turn smoothly; do not kill the session so child can continue talking
        console.log('[LiveVoiceSession] Turn complete, continuing in ready listening state');
        break;

      default:
        console.info('Custom tool executed:', tool.name);
    }
  }

  /**
   * Sends user text prompt or simulated utterance (used for starter chips or fallback)
   */
  public async sendTextMessage(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    // 1. Immediately detect and execute timer/reminder commands locally
    const timerCmd = parseTimerCommand(trimmed);
    if (timerCmd) {
      VoiceTimerManager.setTimer(timerCmd.durationSeconds, timerCmd.label);
      if (this.onSetTimerCb) {
        this.onSetTimerCb(timerCmd);
      }
    }

    // 2. Immediately detect exercise demonstration commands
    const lower = trimmed.toLowerCase();
    if (
      lower.includes('demonstrat') ||
      lower.includes('show exercise') ||
      lower.includes('exercise demo') ||
      lower.includes('jumping jack') ||
      lower.includes('how to do')
    ) {
      if (this.onActionCb) {
        this.onActionCb('open_move');
      }
    }

    // Record user message in session history
    this.history.push({ sender: this.childName, text: trimmed });

    if (this.onTranscriptCb) {
      this.onTranscriptCb(trimmed, true, true);
    }

    this.stateMachine.transition('MODEL_THINKING');

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'text',
          text: trimmed,
        })
      );
      return;
    }

    // High-speed fallback via structured /api/chat endpoint
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: trimmed,
          message: trimmed,
          text: trimmed,
          prompt: trimmed,
          companionId: this.companion.id,
          companionVoice: this.companion.geminiVoice,
          childName: this.childName,
          scenario: this.timeScenario,
          timeScenario: this.timeScenario,
          conversationHistory: this.history.slice(-8),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          // Record companion reply in conversation history
          this.history.push({ sender: this.companion.name, text: data.reply });
          if (this.onTranscriptCb) {
            this.onTranscriptCb(data.reply, false, true);
          }

          // Voice playback: Try audioUrl, then audioBase64 PCM, then browser SpeechSynthesis
          if (data.audioUrl) {
            const audio = new Audio(data.audioUrl);
            audio.play().catch(() => {});
          } else if (data.audioBase64) {
            this.audioOutput.playPcmChunk(data.audioBase64);
          } else {
            speakText(data.reply);
          }
        }

        // Forward suggested dynamic quick replies matching what was replied
        if (data.suggestedReplies && Array.isArray(data.suggestedReplies) && this.onSuggestedRepliesCb) {
          this.onSuggestedRepliesCb(data.suggestedReplies);
        }

        // Forward interactive action triggers
        if (data.action) {
          if (data.action === 'demonstrate_exercise' && this.onActionCb) {
            this.onActionCb('open_move');
          } else if (this.onActionCb) {
            this.onActionCb(data.action);
          }
        }

        // Handle timer data from chat API
        if (data.timerData) {
          VoiceTimerManager.setTimer(data.timerData.durationSeconds, data.timerData.label);
          if (this.onSetTimerCb) {
            this.onSetTimerCb(data.timerData);
          }
        }

        // Forward quiet parent observation record
        if (data.observationRecord && this.onObservationCb) {
          this.onObservationCb(data.observationRecord);
        }

        if (data.toolCalls && Array.isArray(data.toolCalls)) {
          for (const tool of data.toolCalls) {
            this.executeStructuredTool(tool);
          }
        }
      }
    } catch (err) {
      console.warn('Chat endpoint error:', err);
    } finally {
      if (this.stateMachine.getState() === 'thinking') {
        this.stateMachine.transition('MODEL_SPEAKING_STOP');
      }
    }
  }

  /**
   * Barge-in interruption: immediately stops model speech and notifies server
   */
  public interrupt(): void {
    this.audioOutput.stopPlayback();
    this.stateMachine.transition('INTERRUPTED');

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'interrupt' }));
    }
  }

  /**
   * Switches companion profile dynamically
   */
  public setCompanion(companionId: CompanionId): void {
    const profile = COMPANION_PROFILES[companionId];
    if (profile) {
      this.companion = profile;
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: 'set_companion',
            companionId: profile.id,
            voiceName: profile.geminiVoice,
            systemInstructionAddendum: profile.systemInstructionAddendum,
          })
        );
      }
    }
  }

  public getCompanion(): CompanionProfile {
    return this.companion;
  }

  /**
   * Switches voice model dynamically (e.g. Puck, Charon, Fenrir, Aoede, Kore, Zephyr)
   */
  public setVoice(voiceName: GeminiLiveVoiceName): void {
    this.companion = {
      ...this.companion,
      geminiVoice: voiceName,
    };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'set_voice',
          voiceName,
          companionId: this.companion.id,
        })
      );
    }
  }

  public setMute(muted: boolean): void {
    this.audioInput.setMute(muted);
  }

  public isMuted(): boolean {
    return this.audioInput.isMutedState();
  }

  public getState(): VoiceState {
    return this.stateMachine.getState();
  }

  /**
   * Stops the live voice session and frees resources
   */
  public stop(): void {
    this.audioInput.stop();
    this.audioOutput.stopPlayback();
    this.visualizer.stop();

    if (this.speechRecognizer) {
      try {
        this.speechRecognizer.stop();
      } catch {}
      this.speechRecognizer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.stateMachine.transition('DISCONNECT');
  }
}

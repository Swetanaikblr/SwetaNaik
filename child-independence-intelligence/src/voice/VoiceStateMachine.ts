// Strongly Typed Voice State Machine for Multimodal Live Audio

export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'interrupted'
  | 'error';

export type VoiceEvent =
  | 'CONNECT_REQUEST'
  | 'CONNECTION_ESTABLISHED'
  | 'MIC_ACTIVE'
  | 'USER_SPEECH_START'
  | 'USER_SPEECH_STOP'
  | 'MODEL_THINKING'
  | 'MODEL_SPEAKING_START'
  | 'MODEL_SPEAKING_STOP'
  | 'INTERRUPTED'
  | 'SESSION_ERROR'
  | 'DISCONNECT';

export interface StateTransition {
  from: VoiceState;
  to: VoiceState;
  event: VoiceEvent;
  timestamp: number;
}

export class VoiceStateMachine {
  private currentState: VoiceState = 'idle';
  private listeners: Set<(state: VoiceState, transition: StateTransition) => void> = new Set();
  private history: StateTransition[] = [];

  constructor(initialState: VoiceState = 'idle') {
    this.currentState = initialState;
  }

  public getState(): VoiceState {
    return this.currentState;
  }

  public transition(event: VoiceEvent, payload?: any): boolean {
    const from = this.currentState;
    let to: VoiceState = from;

    switch (event) {
      case 'CONNECT_REQUEST':
        if (from === 'idle' || from === 'error') to = 'connecting';
        break;

      case 'CONNECTION_ESTABLISHED':
        if (from === 'connecting') to = 'listening';
        break;

      case 'MIC_ACTIVE':
      case 'USER_SPEECH_START':
        if (from === 'speaking' || from === 'thinking') {
          to = 'interrupted';
        } else if (from === 'listening' || from === 'interrupted') {
          to = 'listening';
        }
        break;

      case 'USER_SPEECH_STOP':
      case 'MODEL_THINKING':
        if (from === 'listening' || from === 'interrupted') {
          to = 'thinking';
        }
        break;

      case 'MODEL_SPEAKING_START':
        to = 'speaking';
        break;

      case 'MODEL_SPEAKING_STOP':
        if (from === 'speaking') {
          to = 'listening';
        }
        break;

      case 'INTERRUPTED':
        to = 'interrupted';
        break;

      case 'SESSION_ERROR':
        to = 'error';
        break;

      case 'DISCONNECT':
        to = 'idle';
        break;

      default:
        return false;
    }

    if (to !== from) {
      this.currentState = to;
      const record: StateTransition = {
        from,
        to,
        event,
        timestamp: Date.now(),
      };
      this.history.push(record);
      if (this.history.length > 50) this.history.shift();

      this.notify(to, record);
      return true;
    }

    return false;
  }

  public subscribe(listener: (state: VoiceState, transition: StateTransition) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(state: VoiceState, transition: StateTransition): void {
    this.listeners.forEach((l) => {
      try {
        l(state, transition);
      } catch (err) {
        console.error('VoiceStateMachine listener error:', err);
      }
    });
  }

  public getHistory(): StateTransition[] {
    return [...this.history];
  }

  public reset(): void {
    this.currentState = 'idle';
    this.history = [];
  }
}

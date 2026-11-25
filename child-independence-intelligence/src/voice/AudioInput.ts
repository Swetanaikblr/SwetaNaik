// AudioInput: Microphone capture, 16kHz resampling, 16-bit linear PCM conversion

export interface AudioInputConfig {
  sampleRate?: number; // 16000 required by Gemini Live
  bufferSize?: number; // 2048 or 4096
  vadThreshold?: number; // RMS energy threshold
}

export class AudioInput {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  private isCapturing = false;
  private isMuted = false;
  private sampleRate = 16000;
  private bufferSize = 4096;
  private vadThreshold = 0.015;

  private onAudioChunkCallback: ((pcmBase64: string, rms: number) => void) | null = null;
  private onSpeechStartCallback: (() => void) | null = null;
  private onSpeechEndCallback: (() => void) | null = null;

  private isSpeaking = false;
  private silenceCounter = 0;

  constructor(config?: AudioInputConfig) {
    if (config?.sampleRate) this.sampleRate = config.sampleRate;
    if (config?.bufferSize) this.bufferSize = config.bufferSize;
    if (config?.vadThreshold) this.vadThreshold = config.vadThreshold;
  }

  /**
   * Initializes microphone access and starts 16kHz PCM audio stream
   */
  public async start(
    onChunk: (pcmBase64: string, rms: number) => void
  ): Promise<boolean> {
    if (this.isCapturing) return true;
    this.onAudioChunkCallback = onChunk;

    try {
      if (typeof window === 'undefined') return false;

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext not supported');
      }

      // Input audio MUST be 16kHz for Gemini Live
      this.audioCtx = new AudioContextClass({ sampleRate: this.sampleRate });
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: this.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;

      // ScriptProcessor handles raw PCM conversion
      this.processorNode = this.audioCtx.createScriptProcessor(
        this.bufferSize,
        1,
        1
      );

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isCapturing || this.isMuted) return;

        const inputChannel = e.inputBuffer.getChannelData(0);
        const { pcmBase64, rms } = this.convertFloat32ToLinearPcm16(inputChannel);

        // Voice Activity Detection (VAD)
        if (rms > this.vadThreshold) {
          this.silenceCounter = 0;
          if (!this.isSpeaking) {
            this.isSpeaking = true;
            if (this.onSpeechStartCallback) this.onSpeechStartCallback();
          }
        } else {
          this.silenceCounter++;
          // ~400ms of consecutive silence
          if (this.silenceCounter > 4 && this.isSpeaking) {
            this.isSpeaking = false;
            if (this.onSpeechEndCallback) this.onSpeechEndCallback();
          }
        }

        if (this.onAudioChunkCallback && pcmBase64) {
          this.onAudioChunkCallback(pcmBase64, rms);
        }
      };

      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.processorNode);
      this.processorNode.connect(this.audioCtx.destination);

      this.isCapturing = true;
      return true;
    } catch (err) {
      console.error('Failed to start AudioInput:', err);
      this.stop();
      return false;
    }
  }

  /**
   * Converts Float32 AudioBuffer channel data into 16-bit linear PCM little-endian Base64
   */
  private convertFloat32ToLinearPcm16(float32Array: Float32Array): {
    pcmBase64: string;
    rms: number;
  } {
    const l = float32Array.length;
    const buffer = new ArrayBuffer(l * 2);
    const view = new DataView(buffer);

    let sumSquares = 0;

    for (let i = 0; i < l; i++) {
      let sample = Math.max(-1, Math.min(1, float32Array[i]));
      sumSquares += sample * sample;

      // Scale to 16-bit signed integer [-32768, 32767]
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(i * 2, int16, true); // true = Little Endian
    }

    const rms = Math.sqrt(sumSquares / l);

    // Convert ArrayBuffer to Base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const pcmBase64 = btoa(binary);

    return { pcmBase64, rms };
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public isMutedState(): boolean {
    return this.isMuted;
  }

  public isActive(): boolean {
    return this.isCapturing;
  }

  public getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  public onSpeechStart(cb: () => void): void {
    this.onSpeechStartCallback = cb;
  }

  public onSpeechEnd(cb: () => void): void {
    this.onSpeechEndCallback = cb;
  }

  /**
   * Stops audio capture and frees hardware resources
   */
  public stop(): void {
    this.isCapturing = false;

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {}
      this.processorNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch {}
      this.analyserNode = null;
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      } catch {}
      this.mediaStream = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }

    this.isSpeaking = false;
  }
}

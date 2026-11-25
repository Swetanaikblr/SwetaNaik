// AudioOutput: 24kHz Gemini Live output PCM streaming with gapless scheduled playback and interruption handling

export class AudioOutput {
  private audioCtx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;

  private sampleRate = 24000; // Gemini Live model audio output rate
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaying = false;
  private playbackEndTimeout: any = null;

  private onPlaybackStateChange: ((isPlaying: boolean) => void) | null = null;
  private checkPlaybackInterval: any = null;

  constructor(sampleRate = 24000) {
    this.sampleRate = sampleRate;
  }

  /**
   * Initializes or unlocks the 24kHz AudioContext
   */
  public async ensureContext(): Promise<AudioContext> {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass({ sampleRate: this.sampleRate });

      this.gainNode = this.audioCtx.createGain();
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;

      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  /**
   * Schedules a raw 24kHz 16-bit linear PCM chunk received from Gemini Live
   */
  public async playPcmChunk(base64Pcm: string): Promise<void> {
    if (!base64Pcm) return;

    try {
      const ctx = await this.ensureContext();

      // Decode base64 to binary ArrayBuffer
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit linear PCM to Float32 [-1.0, 1.0]
      const int16View = new Int16Array(bytes.buffer);
      const numSamples = int16View.length;
      const float32Data = new Float32Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        float32Data[i] = int16View[i] / 32768.0;
      }

      // Create AudioBuffer
      const audioBuffer = ctx.createBuffer(1, numSamples, this.sampleRate);
      audioBuffer.copyToChannel(float32Data, 0);

      // Create SourceNode
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.gainNode) {
        source.connect(this.gainNode);
      } else {
        source.connect(ctx.destination);
      }

      // Clear any pending completion timeout since we have fresh audio
      if (this.playbackEndTimeout) {
        clearTimeout(this.playbackEndTimeout);
        this.playbackEndTimeout = null;
      }

      // Gapless scheduling math:
      // If nextStartTime is in the past, schedule starting from now with a smooth 50ms lead
      const now = ctx.currentTime;
      if (this.nextStartTime < now) {
        this.nextStartTime = now + 0.05;
      }

      source.start(this.nextStartTime);
      this.activeSources.push(source);

      // Advance schedule pointer by duration of this chunk
      this.nextStartTime += audioBuffer.duration;

      if (!this.isPlaying) {
        this.isPlaying = true;
        if (this.onPlaybackStateChange) this.onPlaybackStateChange(true);
        this.monitorPlayback();
      }

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        // Hysteresis window: if active sources are 0 and time reached, don't drop isPlaying immediately!
        // Wait 300ms for consecutive streaming chunks from the network before concluding speech.
        if (this.activeSources.length === 0 && this.audioCtx && ctx.currentTime >= this.nextStartTime - 0.02) {
          if (this.playbackEndTimeout) clearTimeout(this.playbackEndTimeout);
          this.playbackEndTimeout = setTimeout(() => {
            if (this.activeSources.length === 0 && (!this.audioCtx || this.audioCtx.currentTime >= this.nextStartTime - 0.02)) {
              this.isPlaying = false;
              if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
            }
          }, 300);
        }
      };
    } catch (err) {
      console.warn('AudioOutput: error playing PCM chunk:', err);
    }
  }

  private monitorPlayback(): void {
    if (this.checkPlaybackInterval) clearInterval(this.checkPlaybackInterval);

    this.checkPlaybackInterval = setInterval(() => {
      if (!this.audioCtx) {
        clearInterval(this.checkPlaybackInterval);
        return;
      }

      if (this.activeSources.length === 0 && this.audioCtx.currentTime >= this.nextStartTime) {
        if (!this.playbackEndTimeout) {
          this.playbackEndTimeout = setTimeout(() => {
            if (this.activeSources.length === 0 && (!this.audioCtx || this.audioCtx.currentTime >= this.nextStartTime)) {
              if (this.isPlaying) {
                this.isPlaying = false;
                if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
              }
              clearInterval(this.checkPlaybackInterval);
              this.checkPlaybackInterval = null;
            }
          }, 300);
        }
      }
    }, 100);
  }

  /**
   * CRITICAL: Immediately cuts off playback when user interrupts (barge-in)
   */
  public stopPlayback(): void {
    if (this.playbackEndTimeout) {
      clearTimeout(this.playbackEndTimeout);
      this.playbackEndTimeout = null;
    }

    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    this.activeSources = [];

    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    } else {
      this.nextStartTime = 0;
    }

    if (this.isPlaying) {
      this.isPlaying = false;
      if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
    }

    if (this.checkPlaybackInterval) {
      clearInterval(this.checkPlaybackInterval);
      this.checkPlaybackInterval = null;
    }
  }

  public setVolume(vol: number): void {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(
        Math.max(0, Math.min(1, vol)),
        this.audioCtx.currentTime
      );
    }
  }

  public getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  public onPlaybackChange(cb: (isPlaying: boolean) => void): void {
    this.onPlaybackStateChange = cb;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public close(): void {
    this.stopPlayback();
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }
}

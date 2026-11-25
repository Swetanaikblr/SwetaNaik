// AudioVisualizer: Real-time frequency analyzer & waveform generator for mic and model audio

export interface VisualizerFrame {
  overallLevel: number; // 0 to 100
  frequencyBands: number[]; // Array of 8-16 normalized heights (0 to 100)
  waveform: number[]; // Raw waveform points (-1 to 1)
  isSpeaking: boolean;
}

export class AudioVisualizer {
  private analyserNode: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private bandCount = 12;
  private smoothedBands: number[] = [];
  private onFrameCallback: ((frame: VisualizerFrame) => void) | null = null;

  constructor(bandCount = 12) {
    this.bandCount = bandCount;
    this.smoothedBands = new Array(bandCount).fill(10);
  }

  public attachAnalyser(node: AnalyserNode | null): void {
    this.analyserNode = node;
  }

  public start(onFrame: (frame: VisualizerFrame) => void): void {
    this.onFrameCallback = onFrame;
    if (this.animFrameId) return;

    const bufferLength = this.analyserNode ? this.analyserNode.frequencyBinCount : 128;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    let syntheticTick = 0;

    const renderLoop = () => {
      syntheticTick++;

      if (this.analyserNode) {
        this.analyserNode.getByteFrequencyData(freqData);
        this.analyserNode.getByteTimeDomainData(timeData);

        // Calculate overall RMS level
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) {
          sum += freqData[i];
        }
        const avg = sum / freqData.length;
        const overallLevel = Math.min(100, Math.round((avg / 255) * 160));

        // Group into bandCount bins
        const binSize = Math.floor(freqData.length / this.bandCount);
        const bands: number[] = [];

        for (let b = 0; b < this.bandCount; b++) {
          let bandSum = 0;
          const start = b * binSize;
          const end = start + binSize;
          for (let i = start; i < end; i++) {
            bandSum += freqData[i];
          }
          const rawVal = Math.min(100, Math.round(((bandSum / binSize) / 255) * 140));

          // Apply exponential smoothing
          const currentSmoothed = this.smoothedBands[b] || 10;
          const smoothed = currentSmoothed * 0.65 + rawVal * 0.35;
          this.smoothedBands[b] = Math.max(8, smoothed);
          bands.push(Math.round(this.smoothedBands[b]));
        }

        // Downsample waveform
        const waveform: number[] = [];
        const waveStep = Math.max(1, Math.floor(timeData.length / 32));
        for (let i = 0; i < timeData.length; i += waveStep) {
          waveform.push((timeData[i] - 128) / 128);
        }

        if (this.onFrameCallback) {
          this.onFrameCallback({
            overallLevel,
            frequencyBands: bands,
            waveform,
            isSpeaking: overallLevel > 15,
          });
        }
      } else {
        // Idle ambient breathing animation
        const pulse = Math.sin(syntheticTick * 0.05) * 8;
        const bands = this.smoothedBands.map((_, i) => {
          const wave = Math.sin(syntheticTick * 0.08 + i * 0.5) * 6;
          return Math.max(10, Math.round(18 + pulse + wave));
        });

        if (this.onFrameCallback) {
          this.onFrameCallback({
            overallLevel: Math.round(18 + pulse),
            frequencyBands: bands,
            waveform: [0, 0.1, -0.1, 0.05, -0.05, 0],
            isSpeaking: false,
          });
        }
      }

      this.animFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }

  public stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}

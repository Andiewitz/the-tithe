
export class AudioService {
  private ctx: AudioContext | null = null;
  private cricketNode: GainNode | null = null;
  private isRunning = false;

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public async startCrickets() {
    this.initContext();
    if (!this.ctx || this.isRunning) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    const ctx = this.ctx;
    
    // 1. Create White Noise
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // 2. Filter for "Chirp" Timbre (High frequency bandpass)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4500;
    filter.Q.value = 5;

    // 3. Modulate Gain for Rhythmic Chirping
    const amp = ctx.createGain();
    amp.gain.value = 0;

    // We use a periodic LFO to create the "pulse" of the crickets
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 4; // 4 chirps per second

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05; // Low volume for atmosphere

    lfo.connect(lfoGain);
    lfoGain.connect(amp.gain);

    // Chain: Noise -> Filter -> Controlled Amp -> Destination
    noise.connect(filter);
    filter.connect(amp);
    amp.connect(ctx.destination);

    noise.start();
    lfo.start();

    this.cricketNode = amp;
    this.isRunning = true;
  }

  public stopCrickets() {
    if (this.cricketNode) {
      this.cricketNode.disconnect();
      this.cricketNode = null;
    }
    this.isRunning = false;
  }

  public toggle(shouldPlay: boolean) {
    if (shouldPlay) this.startCrickets();
    else this.stopCrickets();
  }
}

export const audioManager = new AudioService();

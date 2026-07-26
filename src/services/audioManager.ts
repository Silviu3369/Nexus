// VAD integration removed to fix issues

/**
 * Multi-Threaded Audio Manager for NEXUS Core
 * Handles 16kHz PCM16 extraction and 24kHz gapless playback.
 */
export class AudioManager {
  private recordingCtx: AudioContext | null = null;
  private playbackCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private worklet: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  public analyser: AnalyserNode | null = null;
  public frequencyData: Uint8Array | null = null;
  public userAnalyser: AnalyserNode | null = null;
  public userFrequencyData: Uint8Array | null = null;
  
  private nextPlayTime: number = 0;
  private activeNodes: AudioBufferSourceNode[] = [];
  private recording: boolean = false;
  
  public onPlaybackStateChange?: (isPlaying: boolean) => void;
  public onSpeechStart?: () => void;
  private playStateTimer: any = null;
  private _isPlaying: boolean = false;

  private setPlayingState(state: boolean) {
    clearTimeout(this.playStateTimer);
    if (state) {
      if (!this._isPlaying) {
        this._isPlaying = true;
        this.onPlaybackStateChange?.(true);
      }
    } else {
      // Increased debounce to 1500ms to prevent flickering/stopping during network micro-gaps
      this.playStateTimer = setTimeout(() => {
        if (this.activeNodes.length === 0) {
          this._isPlaying = false;
          this.onPlaybackStateChange?.(false);
        }
      }, 1500);
    }
  }

  public isPlaying() {
    return this._isPlaying;
  }

  public getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.frequencyData) return null;
    this.analyser.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  public getUserFrequencyData(): Uint8Array | null {
    if (!this.userAnalyser || !this.userFrequencyData) return null;
    this.userAnalyser.getByteFrequencyData(this.userFrequencyData);
    return this.userFrequencyData;
  }

  async init(): Promise<void> {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!this.recordingCtx || this.recordingCtx.state === 'closed') {
      // 16kHz strictly required for GenAI formulation
      this.recordingCtx = new Ctx({ sampleRate: 16000 });
    }
    if (this.recordingCtx.state === 'suspended') {
      await this.recordingCtx.resume();
    }

    if (!this.playbackCtx || this.playbackCtx.state === 'closed') {
      // Let the browser choose its native sample rate to avoid PC hardware lock errors
      this.playbackCtx = new Ctx();
      this.analyser = this.playbackCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (this.playbackCtx.state === 'suspended') {
      await this.playbackCtx.resume();
    }
  }

  async startRecording(onChunk: (base64PCM: string) => void): Promise<void> {
    try {
      await this.init();
      if (!this.recordingCtx) throw new Error("Audio context failed to mount.");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone API unavailable. Please ensure secure context and permissions.");
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          channelCount: 1, 
          echoCancellation: true, 
          autoGainControl: true, 
          noiseSuppression: true 
        } 
      });

      // VAD logic removed.

      this.source = this.recordingCtx.createMediaStreamSource(this.micStream);

      // Create analyser for user voice
      this.userAnalyser = this.recordingCtx.createAnalyser();
      this.userAnalyser.fftSize = 64;
      this.userFrequencyData = new Uint8Array(this.userAnalyser.frequencyBinCount);
      this.source.connect(this.userAnalyser);

      // Raw PCM16 processor injected into AudioWorklet
      // We process into larger chunks (e.g. 2048 or 4096 frames) to avoid WebSocket spam and network delay.
      const workletCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.buffer = new Int16Array(4096); // ~256ms at 16kHz to avoid WebSocket spam delay
            this.bufferIndex = 0;
          }

          process(inputs) {
            const channel = inputs[0]?.[0];
            if (!channel) return true;
            
            for (let i = 0; i < channel.length; i++) {
              let s = Math.max(-1, Math.min(1, channel[i]));
              this.buffer[this.bufferIndex++] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              
              if (this.bufferIndex >= this.buffer.length) {
                 this.port.postMessage(this.buffer.buffer.slice(0)); // copy buffer and send
                 this.bufferIndex = 0;
              }
            }
            return true;
          }
        }
        registerProcessor('pcm-processor', PCMProcessor);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      
      await this.recordingCtx.audioWorklet.addModule(url);
      
      this.worklet = new AudioWorkletNode(this.recordingCtx, 'pcm-processor');
      this.worklet.port.onmessage = (e) => {
        if (!this.recording) return;
        
        const bytes = new Uint8Array(e.data);
        let binaryStr = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binaryStr += String.fromCharCode(bytes[i]);
        }
        onChunk(btoa(binaryStr));
      };

      this.source.connect(this.worklet);
      this.worklet.connect(this.recordingCtx.destination);
      this.recording = true;

    } catch (e) {
      this.stopRecording();
      throw e;
    }
  }

  stopRecording() {
    this.recording = false;
    // VAD removed
    if (this.worklet) { this.worklet.disconnect(); this.worklet = null; }
    if (this.source) { this.source.disconnect(); this.source = null; }
    if (this.micStream) { this.micStream.getTracks().forEach(t => t.stop()); this.micStream = null; }
  }

  async playPCM16(base64PCM: string) {
    if (!this.playbackCtx) await this.init();
    if (!this.playbackCtx) return;

    try {
      const binary = atob(base64PCM);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF);
      }

      // Pro-level DSP: Apply microscopic boundary fade-ins and fade-outs (linear edge ramping)
      // to completely eliminate click/pop noise in gapless live PCM streams.
      const rampSize = Math.min(64, Math.floor(float32.length * 0.05)); // up to 64 samples (~2.6ms buffer)
      if (rampSize > 0) {
        for (let i = 0; i < rampSize; i++) {
          const factor = i / rampSize;
          float32[i] *= factor;
          float32[float32.length - 1 - i] *= factor;
        }
      }

      // Output from Gemini arrives in 24kHz encoding.
      const buffer = this.playbackCtx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const src = this.playbackCtx.createBufferSource();
      src.buffer = buffer;
      
      if (this.analyser) {
        src.connect(this.analyser);
        this.analyser.connect(this.playbackCtx.destination);
      } else {
        src.connect(this.playbackCtx.destination);
      }

      const now = this.playbackCtx.currentTime;
      // Slightly larger jitter buffer (100ms) to reduce voice latency stutter on bad connections
      if (this.nextPlayTime < now + 0.1) this.nextPlayTime = now + 0.1;
      
      src.start(this.nextPlayTime);
      this.nextPlayTime += buffer.duration;
      
      this.activeNodes.push(src);
      this.setPlayingState(true);
      src.onended = () => { 
        this.activeNodes = this.activeNodes.filter(n => n !== src); 
        this.setPlayingState(false);
      };

    } catch(e) {
      console.error("Link Audio Decoding Error:", e);
    }
  }

  interrupt() {
    this.activeNodes.forEach(n => { try { n.stop(); } catch(e){} });
    this.activeNodes = [];
    this.setPlayingState(false);
    if (this.playbackCtx) this.nextPlayTime = this.playbackCtx.currentTime;
  }
}

export const audioManager = new AudioManager();

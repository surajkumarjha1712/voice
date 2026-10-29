import { AudioTrack, MasteringSettings } from '../types';

class StudioAudioEngine {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentAudioBuffer: AudioBuffer | null = null;
  private analyser: AnalyserNode | null = null;

  // Mastering filters
  private bassFilter: BiquadFilterNode | null = null;
  private clarityFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private masterGain: GainNode | null = null;

  // Ambience generator
  private ambienceSource: AudioNode | null = null;
  private ambienceGain: GainNode | null = null;
  private currentAmbienceType: string = 'none';

  // State
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private pauseOffset: number = 0;
  private playbackRate: number = 1.0;
  private isLooping: boolean = false;
  private currentTrack: AudioTrack | null = null;

  // Listeners
  private onTimeUpdateCallback: ((currentTime: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private rafId: number | null = null;

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.85;

      // Bass LowShelf
      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 180;
      this.bassFilter.gain.value = 0;

      // Vocal Clarity Peaking
      this.clarityFilter = this.audioCtx.createBiquadFilter();
      this.clarityFilter.type = 'peaking';
      this.clarityFilter.frequency.value = 2500;
      this.clarityFilter.Q.value = 1.2;
      this.clarityFilter.gain.value = 0;

      // Treble HighShelf
      this.trebleFilter = this.audioCtx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 8000;
      this.trebleFilter.gain.value = 0;

      // Panner
      if (this.audioCtx.createStereoPanner) {
        this.pannerNode = this.audioCtx.createStereoPanner();
      }

      // Master Gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 1.0;

      // Chain: Filters -> Panner -> Analyser -> Master Gain -> Destination
      this.bassFilter.connect(this.clarityFilter);
      this.clarityFilter.connect(this.trebleFilter);

      let lastNode: AudioNode = this.trebleFilter;
      if (this.pannerNode) {
        lastNode.connect(this.pannerNode);
        lastNode = this.pannerNode;
      }

      lastNode.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public async loadTrack(track: AudioTrack): Promise<number[]> {
    this.initContext();
    this.stop();
    this.currentTrack = track;
    this.pauseOffset = 0;

    const binaryString = atob(track.audioBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    if (!this.audioCtx) throw new Error('AudioContext unavailable');

    const audioBuffer = await this.audioCtx.decodeAudioData(bytes.buffer.slice(0));
    this.currentAudioBuffer = audioBuffer;

    // Extract precise waveform peaks if not already present
    return this.extractPeaks(audioBuffer, 64);
  }

  public extractPeaks(buffer: AudioBuffer, count: number): number[] {
    const channelData = buffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / count);
    const peaks: number[] = [];

    for (let i = 0; i < count; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > max) max = val;
      }
      peaks.push(Math.max(0.08, Math.min(1.0, max)));
    }
    return peaks;
  }

  public play() {
    this.initContext();
    if (!this.audioCtx || !this.currentAudioBuffer) return;

    if (this.isPlaying) return;

    const source = this.audioCtx.createBufferSource();
    source.buffer = this.currentAudioBuffer;
    source.playbackRate.value = this.playbackRate;
    source.loop = this.isLooping;

    if (this.bassFilter) {
      source.connect(this.bassFilter);
    } else if (this.masterGain) {
      source.connect(this.masterGain);
    }

    const offset = Math.min(this.pauseOffset, this.currentAudioBuffer.duration);
    source.start(0, offset);

    this.currentSource = source;
    this.startTime = this.audioCtx.currentTime - (offset / this.playbackRate);
    this.isPlaying = true;

    source.onended = () => {
      if (!this.isLooping && this.isPlaying) {
        this.isPlaying = false;
        this.pauseOffset = 0;
        this.stopTimeTracking();
        if (this.onEndedCallback) this.onEndedCallback();
      }
    };

    this.startTimeTracking();
  }

  public pause() {
    if (!this.isPlaying || !this.audioCtx) return;

    this.pauseOffset = this.getCurrentTime();
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // Source already ended
      }
      this.currentSource = null;
    }

    this.isPlaying = false;
    this.stopTimeTracking();
  }

  public stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // Ignored
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.pauseOffset = 0;
    this.stopTimeTracking();
  }

  public seek(seconds: number) {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.pauseOffset = Math.max(0, Math.min(seconds, this.getDuration()));
    if (wasPlaying) {
      this.play();
    } else if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.pauseOffset, this.getDuration());
    }
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = Math.max(0.25, Math.min(3.0, rate));
    if (this.currentSource) {
      this.currentSource.playbackRate.value = this.playbackRate;
    }
  }

  public setLoop(loop: boolean) {
    this.isLooping = loop;
    if (this.currentSource) {
      this.currentSource.loop = loop;
    }
  }

  public setVolume(vol: number) {
    this.initContext();
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(
        Math.max(0, Math.min(1.0, vol)),
        this.audioCtx.currentTime
      );
    }
  }

  public applyMastering(settings: MasteringSettings) {
    this.initContext();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;

    if (this.bassFilter) {
      this.bassFilter.gain.setTargetAtTime(settings.bassBoost, t, 0.05);
    }
    if (this.clarityFilter) {
      this.clarityFilter.gain.setTargetAtTime(settings.vocalClarity * 0.8, t, 0.05);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.setTargetAtTime(settings.trebleBoost, t, 0.05);
    }
    if (this.pannerNode) {
      this.pannerNode.pan.setTargetAtTime(settings.spatialPan, t, 0.05);
    }

    this.updateAmbience(settings.ambienceType, settings.ambienceVolume);
  }

  private updateAmbience(type: 'none' | 'rain' | 'vinyl' | 'coffee' | 'whitenoise', volume: number) {
    if (!this.audioCtx) return;

    if (type === 'none' || volume <= 0) {
      if (this.ambienceGain && this.audioCtx) {
        this.ambienceGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.1);
      }
      return;
    }

    if (this.currentAmbienceType !== type || !this.ambienceSource) {
      // Re-create ambience node
      this.stopAmbience();
      this.createAmbienceGenerator(type);
    }

    if (this.ambienceGain && this.audioCtx) {
      this.ambienceGain.gain.setTargetAtTime(volume * 0.25, this.audioCtx.currentTime, 0.1);
    }
  }

  private stopAmbience() {
    if (this.ambienceSource) {
      try {
        (this.ambienceSource as any).stop?.();
        this.ambienceSource.disconnect();
      } catch {
        // Ignored
      }
      this.ambienceSource = null;
    }
    if (this.ambienceGain) {
      this.ambienceGain.disconnect();
      this.ambienceGain = null;
    }
    this.currentAmbienceType = 'none';
  }

  private createAmbienceGenerator(type: string) {
    if (!this.audioCtx) return;

    const sampleRate = this.audioCtx.sampleRate;
    const bufferSize = sampleRate * 3; // 3-second loop
    const buffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastVal = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'rain') {
        // Pink-ish filtered noise with random rain spatters
        lastVal = (lastVal + 0.03 * white) / 1.03;
        const spatter = Math.random() > 0.992 ? (Math.random() * 2 - 1) * 0.4 : 0;
        data[i] = lastVal * 0.8 + spatter;
      } else if (type === 'vinyl') {
        // Warm low rumble + random vinyl needle clicks
        lastVal = (lastVal + 0.05 * white) / 1.05;
        const click = Math.random() > 0.998 ? (Math.random() > 0.5 ? 0.35 : -0.35) : 0;
        data[i] = lastVal * 0.5 + click;
      } else if (type === 'coffee') {
        // Soft brown noise drone
        lastVal = (lastVal + 0.02 * white) / 1.02;
        data[i] = lastVal * 0.6;
      } else {
        // Pure gentle white/pink noise
        lastVal = (lastVal + 0.04 * white) / 1.04;
        data[i] = lastVal * 0.5;
      }
    }

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Filter
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = type === 'rain' ? 'bandpass' : 'lowpass';
    filter.frequency.value = type === 'rain' ? 1200 : 800;

    const gain = this.audioCtx.createGain();
    gain.gain.value = 0.05;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || this.audioCtx.destination);

    source.start(0);

    this.ambienceSource = source;
    this.ambienceGain = gain;
    this.currentAmbienceType = type;
  }

  public getVisualizerData(): { frequencyData: Uint8Array; timeDomainData: Uint8Array } {
    if (!this.analyser) {
      return {
        frequencyData: new Uint8Array(64),
        timeDomainData: new Uint8Array(64),
      };
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);

    this.analyser.getByteFrequencyData(frequencyData);
    this.analyser.getByteTimeDomainData(timeDomainData);

    return { frequencyData, timeDomainData };
  }

  public getCurrentTime(): number {
    if (!this.audioCtx) return this.pauseOffset;
    if (this.isPlaying) {
      const elapsed = (this.audioCtx.currentTime - this.startTime) * this.playbackRate;
      return Math.min(elapsed, this.getDuration());
    }
    return this.pauseOffset;
  }

  public getDuration(): number {
    return this.currentAudioBuffer?.duration || this.currentTrack?.duration || 0;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): AudioTrack | null {
    return this.currentTrack;
  }

  public onTimeUpdate(callback: (currentTime: number, duration: number) => void) {
    this.onTimeUpdateCallback = callback;
  }

  public onEnded(callback: () => void) {
    this.onEndedCallback = callback;
  }

  private startTimeTracking() {
    this.stopTimeTracking();
    const update = () => {
      if (this.isPlaying && this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.getCurrentTime(), this.getDuration());
      }
      this.rafId = requestAnimationFrame(update);
    };
    this.rafId = requestAnimationFrame(update);
  }

  private stopTimeTracking() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public cleanup() {
    this.stop();
    this.stopAmbience();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    this.audioCtx = null;
  }
}

export const audioEngine = new StudioAudioEngine();

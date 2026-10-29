import { AudioTrack, VoiceName } from '../types';
import { generateWaveformPeaks } from './offlineStorage';

/**
 * Creates an offline-synthesized AudioTrack using Web Audio and browser speech
 * Allows offline speech generation when completely disconnected from API
 */
export async function generateOfflineSpeechTrack(
  text: string,
  voice: VoiceName = 'Kore',
  style: string = 'Offline Speech'
): Promise<AudioTrack> {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const estimatedDuration = Math.max(2.5, words.length * 0.45);
  const sampleRate = 24000;

  // Synthesize musical tones with pitch aligned to selected voice
  const voiceFrequencies: Record<VoiceName, number[]> = {
    Charon: [110, 130.81, 146.83, 164.81], // Deep baritone
    Fenrir: [130.81, 155.56, 174.61, 196.0], // Husky tenor
    Kore: [220, 261.63, 293.66, 329.63], // Luminous warm alto
    Puck: [261.63, 329.63, 392.0, 440.0], // Crisp youth
    Zephyr: [196.0, 246.94, 293.66, 349.23], // Smooth neutral
  };

  const freqs = voiceFrequencies[voice] || [220, 277, 330, 440];

  // Try to use window.speechSynthesis to speak concurrently if supported
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const utter = new SpeechSynthesisUtterance(text.replace(/<[^>]+>|\|[^|]+\|/g, ' '));
      utter.rate = 1.0;
      utter.pitch = voice === 'Charon' ? 0.7 : voice === 'Puck' ? 1.2 : 1.0;
      window.speechSynthesis.speak(utter);
    } catch {
      // Speech synthesis error handled gracefully
    }
  }

  // Generate high-resolution audio WAV buffer for offline playback & saving
  const totalSamples = Math.floor(sampleRate * estimatedDuration);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  // RIFF header
  writeStr(view, 0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeStr(view, 8, 'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(view, 36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const progress = t / estimatedDuration;

    // Word cadence modulation
    const cadence = 0.5 + 0.5 * Math.sin(t * 12);
    const freqIdx = Math.floor(progress * freqs.length);
    const freq = freqs[Math.min(freqIdx, freqs.length - 1)];

    // Syllable burst envelope
    const attack = Math.min(1, (i % (sampleRate * 0.3)) / (sampleRate * 0.04));
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.5 +
                   Math.sin(4 * Math.PI * freq * t) * 0.25;

    const envelope = attack * cadence * (1 - progress * 0.2);
    const int16Val = Math.max(-32768, Math.min(32767, Math.floor(sample * envelope * 22000)));
    view.setInt16(offset, int16Val, true);
    offset += 2;
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const audioBase64 = btoa(binary);

  const titleWords = words.slice(0, 5).join(' ');
  const title = titleWords.length > 0 ? titleWords : 'Offline Synthesized Track';

  return {
    id: `track_offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    text,
    audioBase64,
    mimeType: 'audio/wav',
    voice,
    style,
    duration: estimatedDuration,
    sampleRate,
    createdAt: Date.now(),
    sizeBytes: buffer.byteLength,
    peaks: generateWaveformPeaks(64),
    isFavorite: false,
    isOfflineReady: true,
    tags: ['Offline Mode', voice],
    mode: 'single',
  };
}

function writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

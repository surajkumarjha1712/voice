import { AudioTrack, VoiceName } from '../types';

const DB_NAME = 'voxstudio_offline_vault';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('voice', 'voice', { unique: false });
        store.createIndex('isFavorite', 'isFavorite', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves or updates an AudioTrack in IndexedDB
 */
export async function saveTrack(track: AudioTrack): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(track);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves all saved audio tracks ordered by creation date descending
 */
export async function getAllTracks(): Promise<AudioTrack[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = (request.result as AudioTrack[]) || [];
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves a single track by its ID
 */
export async function getTrackById(id: string): Promise<AudioTrack | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Deletes a track from IndexedDB
 */
export async function deleteTrack(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Toggles favorite flag for a track
 */
export async function toggleFavorite(id: string): Promise<boolean> {
  const track = await getTrackById(id);
  if (!track) return false;
  track.isFavorite = !track.isFavorite;
  await saveTrack(track);
  return track.isFavorite;
}

/**
 * Returns estimated offline storage usage in bytes & formatted string
 */
export async function getStorageEstimate(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  usedFormatted: string;
  percentUsed: number;
}> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedBytes = estimate.usage || 0;
      const quotaBytes = estimate.quota || 1024 * 1024 * 1024;
      const percentUsed = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;
      const usedFormatted =
        usedBytes < 1024 * 1024
          ? `${(usedBytes / 1024).toFixed(1)} KB`
          : `${(usedBytes / (1024 * 1024)).toFixed(2)} MB`;

      return {
        usedBytes,
        quotaBytes,
        usedFormatted,
        percentUsed: Math.min(100, Math.round(percentUsed * 10) / 10),
      };
    } catch {
      // Fallback
    }
  }

  return {
    usedBytes: 0,
    quotaBytes: 1024 * 1024 * 1024,
    usedFormatted: '0.0 MB',
    percentUsed: 0,
  };
}

/**
 * Generates a standard WAV file blob from base64 string
 */
export function base64ToWavBlob(base64: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: 'audio/wav' });
}

/**
 * Initiates direct download of track as .wav file
 */
export function downloadWavFile(track: AudioTrack): void {
  try {
    const blob = base64ToWavBlob(track.audioBase64);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedTitle = track.title
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 32);
    a.download = `${sanitizedTitle}_${track.voice.toLowerCase()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
    console.error('Failed to download audio file:', err);
  }
}

/**
 * Utility: Synthesizes a melodic harmonic tone audio WAV in base64
 * Used for offline demonstration tracks so users have offline-ready audio immediately.
 */
function createSyntheticWav(sampleRate: number, durationSeconds: number, frequencyNotes: number[]): string {
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Synthesize musical tones with envelope
  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const noteIdx = Math.floor((t / durationSeconds) * frequencyNotes.length);
    const freq = frequencyNotes[Math.min(noteIdx, frequencyNotes.length - 1)];

    // Envelope: smooth attack, sustain, decay
    const attack = Math.min(1, (i % (sampleRate * 0.8)) / (sampleRate * 0.05));
    const release = Math.max(0, 1 - (t / durationSeconds));
    const envelope = attack * (0.8 + 0.2 * Math.sin(t * 4)) * release;

    // Harmonic blend
    const sampleVal =
      0.6 * Math.sin(2 * Math.PI * freq * t) +
      0.25 * Math.sin(4 * Math.PI * freq * t) +
      0.15 * Math.sin(6 * Math.PI * freq * t);

    const int16Val = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * envelope * 24000)));
    view.setInt16(offset, int16Val, true);
    offset += 2;
  }

  // Convert arraybuffer to base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Seed initial sample tracks if database is empty so offline playback is ready
 */
export async function seedSampleTracksIfEmpty(): Promise<void> {
  const existing = await getAllTracks();
  if (existing.length > 0) return;

  const sample1Base64 = createSyntheticWav(24000, 7.5, [220, 277.18, 329.63, 440]);
  const sample2Base64 = createSyntheticWav(24000, 6.0, [196, 246.94, 293.66, 392]);
  const sample3Base64 = createSyntheticWav(24000, 8.2, [146.83, 174.61, 220, 293.66]);

  const sample1: AudioTrack = {
    id: 'offline_sample_kore_cosmos',
    title: 'The Architecture of Deep Space',
    text: 'Beyond the orbit of Neptune, voyager carries humanity’s quietest questions into the interstellar silence. <breath> Every signal received is a gentle echo from our distant past.',
    audioBase64: sample1Base64,
    mimeType: 'audio/wav',
    voice: 'Kore',
    style: 'Deep, serene documentary narration with measured cadence',
    duration: 7.5,
    sampleRate: 24000,
    createdAt: Date.now() - 3600000 * 2,
    sizeBytes: Math.round(sample1Base64.length * 0.75),
    peaks: generateWaveformPeaks(64),
    isFavorite: true,
    isOfflineReady: true,
    tags: ['Offline Ready', 'Documentary', 'Kore'],
    mode: 'single',
  };

  const sample2: AudioTrack = {
    id: 'offline_sample_puck_tech',
    title: 'Silicon Dawn: Audio AI Engine',
    text: 'Welcome back to Tech Pulse! <laugh> Today, we are breaking down the fastest real-time speech generation architectures yet engineered.',
    audioBase64: sample2Base64,
    mimeType: 'audio/wav',
    voice: 'Puck',
    style: 'Energetic, crisp tech podcast host',
    duration: 6.0,
    sampleRate: 24000,
    createdAt: Date.now() - 3600000 * 6,
    sizeBytes: Math.round(sample2Base64.length * 0.75),
    peaks: generateWaveformPeaks(64),
    isFavorite: false,
    isOfflineReady: true,
    tags: ['Offline Ready', 'Podcast', 'Puck'],
    mode: 'single',
  };

  const sample3: AudioTrack = {
    id: 'offline_sample_charon_cinematic',
    title: 'Chronicles of the Obsidian Coast',
    text: 'The ocean does not remember ships. It only remembers the wind that drove them. <breath> When the lighthouse went dark, the fleet knew.',
    audioBase64: sample3Base64,
    mimeType: 'audio/wav',
    voice: 'Charon',
    style: 'Gravelly, cinematic trailer narrator',
    duration: 8.2,
    sampleRate: 24000,
    createdAt: Date.now() - 3600000 * 18,
    sizeBytes: Math.round(sample3Base64.length * 0.75),
    peaks: generateWaveformPeaks(64),
    isFavorite: true,
    isOfflineReady: true,
    tags: ['Offline Ready', 'Cinematic', 'Charon'],
    mode: 'single',
  };

  await saveTrack(sample1);
  await saveTrack(sample2);
  await saveTrack(sample3);
}

/**
 * Helper to compute or generate peak arrays for instant waveform rendering
 */
export function generateWaveformPeaks(count: number = 64): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    // Realistic audio waveform shape with peaks and lulls
    const phase = (i / count) * Math.PI * 4;
    const base = 0.2 + 0.6 * Math.abs(Math.sin(phase) * Math.cos(phase * 2.3));
    const noise = 0.15 * Math.random();
    peaks.push(Math.min(1, Math.max(0.08, base + noise)));
  }
  return peaks;
}

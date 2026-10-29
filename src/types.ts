export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface VoiceInfo {
  id: VoiceName;
  name: string;
  gender: string;
  timbre: string;
  description: string;
  recommendedStyles: string[];
}

export interface StylePreset {
  id: string;
  label: string;
  prompt: string;
  category: 'Cinematic' | 'Broadcast' | 'Narrative' | 'Lifestyle' | 'Dramatic';
}

export interface DialogueLine {
  id: string;
  speaker: string;
  voice: VoiceName;
  style: string;
  text: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  text: string;
  audioBase64: string;
  mimeType: string;
  voice: string;
  style: string;
  duration: number; // in seconds
  sampleRate: number;
  createdAt: number;
  sizeBytes: number;
  peaks: number[]; // normalized waveform peaks (0 to 1)
  isFavorite: boolean;
  isOfflineReady: boolean;
  tags: string[];
  mode: 'single' | 'dialogue';
  dialogueLines?: { speaker: string; text: string; voice: string }[];
}

export interface MasteringSettings {
  bassBoost: number; // -12 to +12 dB
  trebleBoost: number; // -12 to +12 dB
  vocalClarity: number; // 0 to 10
  spatialPan: number; // -1 to 1
  ambienceType: 'none' | 'rain' | 'vinyl' | 'coffee' | 'whitenoise';
  ambienceVolume: number; // 0 to 1
}

export interface PresetScript {
  id: string;
  title: string;
  category: string;
  mode: 'single' | 'dialogue';
  voice: VoiceName;
  style: string;
  content: string;
  dialogueLines?: { speaker: string; voice: VoiceName; style: string; text: string }[];
}

import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { StudioEditor } from './components/StudioEditor';
import { AudioVisualizer } from './components/AudioVisualizer';
import { MasterPlayer } from './components/MasterPlayer';
import { OfflineLibrary } from './components/OfflineLibrary';
import { MasteringRack } from './components/MasteringRack';
import { VoiceShowcase } from './components/VoiceShowcaseModal';
import {
  AudioTrack,
  VoiceName,
  DialogueLine,
  MasteringSettings,
} from './types';
import { audioEngine } from './services/audioEngine';
import {
  getAllTracks,
  saveTrack,
  deleteTrack,
  toggleFavorite,
  getStorageEstimate,
  seedSampleTracksIfEmpty,
  generateWaveformPeaks,
} from './services/offlineStorage';
import { generateOfflineSpeechTrack } from './services/browserSpeechFallback';
import { STYLE_PRESETS, VOICES_CATALOG } from './constants/presets';
import { Activity, BarChart2, Waves, AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'editor' | 'library' | 'mastering' | 'voices'>('editor');

  // Network state
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Storage & Tracks state
  const [offlineTracks, setOfflineTracks] = useState<AudioTrack[]>([]);
  const [storageEstimate, setStorageEstimate] = useState({
    usedFormatted: '0.0 MB',
    percentUsed: 0,
  });

  // Player state
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.9);
  const [visualMode, setVisualMode] = useState<'waveform' | 'spectrum' | 'oscilloscope'>('waveform');

  // Mastering Rack state
  const [isMasteringOpen, setIsMasteringOpen] = useState<boolean>(false);
  const [masteringSettings, setMasteringSettings] = useState<MasteringSettings>({
    bassBoost: 1.5,
    trebleBoost: 1.0,
    vocalClarity: 2.0,
    spatialPan: 0,
    ambienceType: 'none',
    ambienceVolume: 0.35,
  });

  // Editor state
  const [text, setText] = useState<string>(
    'Welcome to VoxStudio. <breath> You are listening to high-fidelity text-to-speech audio with full offline playback support. <breath> Customize voice tones, direct expressive pauses and vocal bursts, and preserve every generated file in your local vault.'
  );
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [selectedPresetStyle, setSelectedPresetStyle] = useState<string>('cinematic-documentary');
  const [customStylePrompt, setCustomStylePrompt] = useState<string>(
    STYLE_PRESETS[0].prompt
  );
  const [editorMode, setEditorMode] = useState<'single' | 'dialogue'>('single');
  const [speaker1, setSpeaker1] = useState<{ name: string; voice: VoiceName; style: string }>({
    name: 'Alex',
    voice: 'Puck',
    style: 'Enthusiastic podcast host',
  });
  const [speaker2, setSpeaker2] = useState<{ name: string; voice: VoiceName; style: string }>({
    name: 'Sam',
    voice: 'Kore',
    style: 'Warm, articulate co-host',
  });
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([
    {
      id: 'd1',
      speaker: 'Alex',
      voice: 'Puck',
      style: 'Excited',
      text: 'Sam, this offline text-to-audio engine is incredible! <laugh> Everything is cached straight in the browser.',
    },
    {
      id: 'd2',
      speaker: 'Sam',
      voice: 'Kore',
      style: 'Articulate',
      text: '|mhm| Exactly. No latency on replay, and the 24kHz unary audio format preserves crisp vocal clarity.',
    },
  ]);

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Load and refresh offline storage
  const refreshStorage = useCallback(async () => {
    try {
      const tracks = await getAllTracks();
      setOfflineTracks(tracks);
      const est = await getStorageEstimate();
      setStorageEstimate({
        usedFormatted: est.usedFormatted,
        percentUsed: est.percentUsed,
      });
      return tracks;
    } catch (err) {
      console.error('Failed to load offline tracks:', err);
      return [];
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    // Online / Offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Seed sample tracks if empty and load
    (async () => {
      await seedSampleTracksIfEmpty();
      const tracks = await refreshStorage();
      if (tracks.length > 0 && !currentTrack) {
        // Preload first track into player
        handleLoadAndPlayTrack(tracks[0], false);
      }
    })();

    // Audio Engine callbacks
    audioEngine.onTimeUpdate((curr, dur) => {
      setCurrentTime(curr);
      setDuration(dur);
    });

    audioEngine.onEnded(() => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      audioEngine.cleanup();
    };
  }, [refreshStorage]);

  // Spacebar Play/Pause shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        e.preventDefault();
        handlePlayToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTrack]);

  // Load track into engine
  const handleLoadAndPlayTrack = async (track: AudioTrack, autoPlay: boolean = true) => {
    try {
      setCurrentTrack(track);
      const peaks = await audioEngine.loadTrack(track);
      if (peaks && (!track.peaks || track.peaks.length === 0)) {
        track.peaks = peaks;
        await saveTrack(track);
      }
      setDuration(track.duration);
      setCurrentTime(0);

      // Apply active mastering
      audioEngine.applyMastering(masteringSettings);
      audioEngine.setPlaybackRate(playbackRate);
      audioEngine.setLoop(isLooping);
      audioEngine.setVolume(volume);

      if (autoPlay) {
        audioEngine.play();
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Failed to load audio track:', err);
    }
  };

  // Play / Pause toggle
  const handlePlayToggle = () => {
    if (!currentTrack) {
      if (offlineTracks.length > 0) {
        handleLoadAndPlayTrack(offlineTracks[0], true);
      }
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play();
      setIsPlaying(true);
    }
  };

  // Seek
  const handleSeek = (seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
  };

  // Playback rate
  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    audioEngine.setPlaybackRate(rate);
  };

  // Loop
  const handleLoopToggle = () => {
    const next = !isLooping;
    setIsLooping(next);
    audioEngine.setLoop(next);
  };

  // Volume
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
  };

  // Mastering change
  const handleMasteringChange = (newSettings: MasteringSettings) => {
    setMasteringSettings(newSettings);
    audioEngine.applyMastering(newSettings);
  };

  const handleResetMastering = () => {
    const defaultSettings: MasteringSettings = {
      bassBoost: 0,
      trebleBoost: 0,
      vocalClarity: 0,
      spatialPan: 0,
      ambienceType: 'none',
      ambienceVolume: 0.35,
    };
    setMasteringSettings(defaultSettings);
    audioEngine.applyMastering(defaultSettings);
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(id);
    await refreshStorage();
    if (currentTrack && currentTrack.id === id) {
      setCurrentTrack((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  // Delete track
  const handleDeleteTrack = async (id: string) => {
    if (currentTrack && currentTrack.id === id) {
      audioEngine.stop();
      setIsPlaying(false);
      setCurrentTrack(null);
    }
    await deleteTrack(id);
    await refreshStorage();
    setStatusNotification({
      type: 'success',
      message: 'Track removed from offline storage.',
    });
  };

  // Save current track to offline vault toggle
  const handleSaveOfflineToggle = async () => {
    if (!currentTrack) return;
    const isAlreadySaved = offlineTracks.some((t) => t.id === currentTrack.id);
    if (isAlreadySaved) {
      await deleteTrack(currentTrack.id);
      await refreshStorage();
      setStatusNotification({
        type: 'success',
        message: 'Track removed from offline cache.',
      });
    } else {
      await saveTrack(currentTrack);
      await refreshStorage();
      setStatusNotification({
        type: 'success',
        message: 'Track saved to Offline Vault.',
      });
    }
  };

  // Generate Audio via Server API
  const handleGenerateAudio = async () => {
    if (editorMode === 'single' && text.trim().length === 0) {
      setStatusNotification({
        type: 'error',
        message: 'Please enter text to synthesize.',
      });
      return;
    }

    if (editorMode === 'dialogue' && dialogueLines.length === 0) {
      setStatusNotification({
        type: 'error',
        message: 'Please add at least one dialogue line to synthesize.',
      });
      return;
    }

    setIsGenerating(true);
    setStatusNotification(null);

    try {
      if (!isOnline) {
        // Fallback directly to offline synthesizer when offline
        await handleGenerateOffline();
        return;
      }

      const payload = {
        text: text.trim(),
        voice: selectedVoice,
        style: customStylePrompt,
        mode: editorMode,
        speakers: [
          { speaker: speaker1.name, voice: speaker1.voice, style: speaker1.style },
          { speaker: speaker2.name, voice: speaker2.voice, style: speaker2.style },
        ],
        dialogueLines: editorMode === 'dialogue' ? dialogueLines : undefined,
      };

      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Speech generation failed.');
      }

      // Title derivation
      const snippet = editorMode === 'single'
        ? text.trim().split(/\s+/).slice(0, 5).join(' ')
        : `${speaker1.name} & ${speaker2.name} Dialogue`;
      const title = snippet.length > 0 ? snippet : 'Generated Speech Clip';

      // Estimate duration from word count
      const wordCount = editorMode === 'single'
        ? text.trim().split(/\s+/).filter(Boolean).length
        : dialogueLines.reduce((acc, l) => acc + l.text.trim().split(/\s+/).filter(Boolean).length, 0);
      const estDuration = Math.max(2.5, Math.round(wordCount * 0.42 * 10) / 10);

      const newTrack: AudioTrack = {
        id: `vox_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title,
        text: editorMode === 'single' ? text : dialogueLines.map((l) => `${l.speaker}: ${l.text}`).join('\n'),
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        voice: data.voice || selectedVoice,
        style: customStylePrompt || 'Studio Direct',
        duration: estDuration,
        sampleRate: data.sampleRate || 24000,
        createdAt: Date.now(),
        sizeBytes: Math.round(data.audioBase64.length * 0.75),
        peaks: generateWaveformPeaks(64),
        isFavorite: false,
        isOfflineReady: true,
        tags: [data.voice || selectedVoice, editorMode === 'dialogue' ? 'Dialogue' : 'Narration'],
        mode: editorMode,
      };

      // Automatically store in IndexedDB for immediate offline availability
      await saveTrack(newTrack);
      await refreshStorage();

      // Play immediately in player
      await handleLoadAndPlayTrack(newTrack, true);

      setStatusNotification({
        type: 'success',
        message: 'High-fidelity audio generated and saved for offline playback!',
      });
    } catch (err: any) {
      console.warn('API generation failed, attempting local fallback:', err);
      setStatusNotification({
        type: 'error',
        message: err.message || 'Speech generation failed. You can use "Synthesize Offline" to generate local audio.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Offline Audio (Browser synthesis fallback)
  const handleGenerateOffline = async () => {
    setIsGenerating(true);
    setStatusNotification(null);
    try {
      const offlineTrack = await generateOfflineSpeechTrack(
        editorMode === 'single' ? text : dialogueLines.map((l) => `${l.speaker}: ${l.text}`).join(' '),
        selectedVoice,
        customStylePrompt
      );

      await saveTrack(offlineTrack);
      await refreshStorage();
      await handleLoadAndPlayTrack(offlineTrack, true);

      setStatusNotification({
        type: 'success',
        message: 'Offline audio synthesized and saved locally to IndexedDB.',
      });
    } catch (err: any) {
      setStatusNotification({
        type: 'error',
        message: err.message || 'Offline synthesis encountered an issue.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Audition voice preview
  const handleAuditionVoice = async (voice: VoiceName) => {
    const sampleTrack = offlineTracks.find((t) => t.voice === voice);
    if (sampleTrack) {
      handleLoadAndPlayTrack(sampleTrack, true);
    } else {
      // Synthesize short test tone for that voice
      const test = await generateOfflineSpeechTrack(
        `Previewing the voice timbre and tonal presence of ${voice}.`,
        voice,
        'Voice preview'
      );
      handleLoadAndPlayTrack(test, true);
    }
  };

  const isCurrentTrackSavedOffline = Boolean(
    currentTrack && offlineTracks.some((t) => t.id === currentTrack.id)
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-400 selection:text-neutral-950">
      {/* Top Bar Navigation */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        offlineCount={offlineTracks.length}
        onGenerateClick={activeTab === 'editor' ? handleGenerateAudio : undefined}
        isGenerating={isGenerating}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Status Notification Toast */}
        {statusNotification && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
              statusNotification.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusNotification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusNotification.message}</span>
            </div>
            <button
              onClick={() => setStatusNotification(null)}
              className="p-1 hover:opacity-80 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Visualizer & Studio Deck Strip */}
        <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-white">
                Audio Visualizer & Waveform Transport
              </span>
              {currentTrack && (
                <span className="text-xs text-neutral-400 font-mono">
                  [{currentTrack.voice} · {currentTrack.sampleRate}Hz]
                </span>
              )}
            </div>

            {/* Visualizer Mode Tabs */}
            <div className="flex items-center gap-1 p-0.5 bg-neutral-950 rounded-lg border border-neutral-800 text-xs">
              <button
                onClick={() => setVisualMode('waveform')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  visualMode === 'waveform'
                    ? 'bg-neutral-800 text-amber-300 font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Waves className="w-3 h-3" />
                <span>Waveform</span>
              </button>
              <button
                onClick={() => setVisualMode('spectrum')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  visualMode === 'spectrum'
                    ? 'bg-neutral-800 text-amber-300 font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                <span>Spectrum</span>
              </button>
              <button
                onClick={() => setVisualMode('oscilloscope')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  visualMode === 'oscilloscope'
                    ? 'bg-neutral-800 text-amber-300 font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>Trace</span>
              </button>
            </div>
          </div>

          {/* Interactive Canvas Visualizer */}
          <AudioVisualizer
            track={currentTrack}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={handleSeek}
            visualMode={visualMode}
          />
        </div>

        {/* Tab Views */}
        {activeTab === 'editor' && (
          <StudioEditor
            text={text}
            setText={setText}
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            customStylePrompt={customStylePrompt}
            setCustomStylePrompt={setCustomStylePrompt}
            selectedPresetStyle={selectedPresetStyle}
            setSelectedPresetStyle={setSelectedPresetStyle}
            editorMode={editorMode}
            setEditorMode={setEditorMode}
            dialogueLines={dialogueLines}
            setDialogueLines={setDialogueLines}
            speaker1={speaker1}
            setSpeaker1={setSpeaker1}
            speaker2={speaker2}
            setSpeaker2={setSpeaker2}
            onGenerate={handleGenerateAudio}
            onGenerateOffline={handleGenerateOffline}
            isGenerating={isGenerating}
            isOnline={isOnline}
            onAuditionVoice={handleAuditionVoice}
          />
        )}

        {activeTab === 'library' && (
          <OfflineLibrary
            tracks={offlineTracks}
            currentTrackId={currentTrack?.id || null}
            isPlaying={isPlaying}
            onPlayTrack={(track) => {
              if (currentTrack?.id === track.id) {
                handlePlayToggle();
              } else {
                handleLoadAndPlayTrack(track, true);
              }
            }}
            onDeleteTrack={handleDeleteTrack}
            onToggleFavorite={handleToggleFavorite}
            onRefreshStorage={refreshStorage}
            storageEstimate={storageEstimate}
            onSeedSamples={async () => {
              await seedSampleTracksIfEmpty();
              await refreshStorage();
              setStatusNotification({
                type: 'success',
                message: 'Offline demonstration sample audio loaded.',
              });
            }}
            onNewAudioClick={() => setActiveTab('editor')}
          />
        )}

        {activeTab === 'mastering' && (
          <MasteringRack
            settings={masteringSettings}
            onChange={handleMasteringChange}
            onReset={handleResetMastering}
          />
        )}

        {activeTab === 'voices' && (
          <VoiceShowcase
            selectedVoice={selectedVoice}
            onSelectVoice={(v) => {
              setSelectedVoice(v);
              setActiveTab('editor');
              setStatusNotification({
                type: 'success',
                message: `Active voice set to ${v}.`,
              });
            }}
            onAuditionVoice={handleAuditionVoice}
          />
        )}
      </main>

      {/* Docked Master Studio Player Bar */}
      <MasterPlayer
        track={currentTrack}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
        onSeek={handleSeek}
        playbackRate={playbackRate}
        onRateChange={handleRateChange}
        isLooping={isLooping}
        onLoopToggle={handleLoopToggle}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onOpenMastering={() => {
          if (activeTab === 'mastering') {
            setActiveTab('editor');
          } else {
            setActiveTab('mastering');
          }
        }}
        isMasteringOpen={activeTab === 'mastering'}
        isSavedOffline={isCurrentTrackSavedOffline}
        onSaveOfflineToggle={handleSaveOfflineToggle}
      />
    </div>
  );
}

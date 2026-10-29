import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Repeat,
  Volume2,
  VolumeX,
  Download,
  Sliders,
  HardDriveDownload,
  Check,
} from 'lucide-react';
import { AudioTrack } from '../types';
import { downloadWavFile } from '../services/offlineStorage';

interface MasterPlayerProps {
  track: AudioTrack | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onSeek: (seconds: number) => void;
  playbackRate: number;
  onRateChange: (rate: number) => void;
  isLooping: boolean;
  onLoopToggle: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onOpenMastering: () => void;
  isMasteringOpen: boolean;
  isSavedOffline: boolean;
  onSaveOfflineToggle: () => void;
}

export const MasterPlayer: React.FC<MasterPlayerProps> = ({
  track,
  currentTime,
  duration,
  isPlaying,
  onPlayToggle,
  onSeek,
  playbackRate,
  onRateChange,
  isLooping,
  onLoopToggle,
  volume,
  onVolumeChange,
  onOpenMastering,
  isMasteringOpen,
  isSavedOffline,
  onSaveOfflineToggle,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isRateMenuOpen, setIsRateMenuOpen] = useState(false);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVolume || 0.8);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const handleSkip = (deltaSeconds: number) => {
    const target = Math.max(0, Math.min(currentTime + deltaSeconds, duration));
    onSeek(target);
  };

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <footer className="w-full bg-neutral-950 border-t border-neutral-800/80 px-4 md:px-8 py-3 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Track Information */}
        <div className="flex items-center gap-3.5 min-w-0 w-full md:w-1/4">
          <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
            {track ? (
              <span className="font-mono text-xs font-semibold text-amber-400">
                {track.voice.slice(0, 2).toUpperCase()}
              </span>
            ) : (
              <span className="text-neutral-600 text-xs font-mono">--</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white truncate">
              {track ? track.title : 'No audio loaded'}
            </h4>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="truncate">{track ? track.voice : 'Select or generate speech'}</span>
              {track && (
                <>
                  <span aria-hidden="true" className="text-neutral-700">·</span>
                  <span className="truncate max-w-[120px]">{track.style}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Main Playback Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
          <div className="flex items-center gap-4">
            {/* Loop button */}
            <button
              onClick={onLoopToggle}
              title={isLooping ? 'Loop enabled' : 'Loop disabled'}
              className={`p-1.5 rounded-md transition-colors ${
                isLooping
                  ? 'text-amber-400 bg-amber-400/10'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>

            {/* Skip back 5s */}
            <button
              onClick={() => handleSkip(-5)}
              disabled={!track}
              title="Rewind 5 seconds"
              className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Play / Pause primary button */}
            <button
              onClick={onPlayToggle}
              disabled={!track}
              title={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-950 flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-amber-500/20"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-neutral-950" />
              ) : (
                <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />
              )}
            </button>

            {/* Skip forward 5s */}
            <button
              onClick={() => handleSkip(5)}
              disabled={!track}
              title="Fast forward 5 seconds"
              className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Speed selector */}
            <div className="relative">
              <button
                onClick={() => setIsRateMenuOpen(!isRateMenuOpen)}
                className="px-2 py-0.5 text-xs font-mono font-medium rounded text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 transition-colors tabular-nums"
              >
                {playbackRate}x
              </button>
              {isRateMenuOpen && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl p-1 flex flex-col gap-0.5 z-50 min-w-[70px]">
                  {speedOptions.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onRateChange(rate);
                        setIsRateMenuOpen(false);
                      }}
                      className={`px-2 py-1 text-xs text-left rounded font-mono tabular-nums transition-colors ${
                        playbackRate === rate
                          ? 'bg-amber-400/20 text-amber-300 font-semibold'
                          : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Progress line & timestamps */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[11px] font-mono text-neutral-500 tabular-nums w-9 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              onClick={(e) => {
                if (!track || duration <= 0) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                onSeek(pos * duration);
              }}
              className="relative flex-1 h-1.5 bg-neutral-800 hover:h-2.5 rounded-full cursor-pointer transition-all overflow-hidden group"
            >
              <div
                className="absolute top-0 left-0 bottom-0 bg-amber-400 rounded-full"
                style={{
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-[11px] font-mono text-neutral-500 tabular-nums w-9 text-left">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Actions, Volume & Mastering */}
        <div className="flex items-center justify-end gap-3 w-full md:w-1/4">
          {/* Offline Save button */}
          {track && (
            <button
              onClick={onSaveOfflineToggle}
              title={isSavedOffline ? 'Cached in Offline Vault' : 'Save for offline playback'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isSavedOffline
                  ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {isSavedOffline ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline">Cached Offline</span>
                </>
              ) : (
                <>
                  <HardDriveDownload className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline">Save Offline</span>
                </>
              )}
            </button>
          )}

          {/* Download WAV button */}
          {track && (
            <button
              onClick={() => downloadWavFile(track)}
              title="Download high-quality .wav audio file"
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors border border-transparent hover:border-neutral-800"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Mastering & FX Toggle */}
          <button
            onClick={onOpenMastering}
            title="Audio Mastering & Studio Effects Rack"
            className={`p-2 rounded-lg transition-colors border ${
              isMasteringOpen
                ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleMuteToggle}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (isMuted && val > 0) setIsMuted(false);
                onVolumeChange(val);
              }}
              className="w-16 h-1 accent-amber-400 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

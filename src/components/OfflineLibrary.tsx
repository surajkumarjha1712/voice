import React, { useState } from 'react';
import {
  Play,
  Pause,
  Search,
  Star,
  Download,
  Trash2,
  HardDrive,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { AudioTrack, VoiceName } from '../types';
import { downloadWavFile } from '../services/offlineStorage';

interface OfflineLibraryProps {
  tracks: AudioTrack[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayTrack: (track: AudioTrack) => void;
  onDeleteTrack: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRefreshStorage: () => void;
  storageEstimate: { usedFormatted: string; percentUsed: number };
  onSeedSamples: () => void;
  onNewAudioClick: () => void;
}

export const OfflineLibrary: React.FC<OfflineLibraryProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onDeleteTrack,
  onToggleFavorite,
  onRefreshStorage,
  storageEstimate,
  onSeedSamples,
  onNewAudioClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceFilter, setVoiceFilter] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Filtered tracks
  const filteredTracks = tracks.filter((t) => {
    if (onlyFavorites && !t.isFavorite) return false;
    if (voiceFilter !== 'all' && t.voice !== voiceFilter) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.text.toLowerCase().includes(q) ||
        t.style.toLowerCase().includes(q) ||
        t.voice.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const voicesList = ['all', 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  return (
    <div className="space-y-6">
      {/* Storage Header & Quota bar */}
      <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Offline Audio Vault</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Tracks stored locally in IndexedDB for instantaneous zero-latency playback even with no internet connection.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Storage usage indicator */}
          <div className="space-y-1 w-full md:w-48 text-right">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-mono tabular-nums">
              <span>Local Storage:</span>
              <span className="text-white font-semibold">{storageEstimate.usedFormatted}</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.max(2, storageEstimate.percentUsed)}%` }}
              />
            </div>
          </div>

          <button
            onClick={onRefreshStorage}
            title="Refresh local storage info"
            className="p-2 text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-700/60"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audio titles, scripts, or voice styles..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Voice Filter Pills */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800">
            {voicesList.map((v) => (
              <button
                key={v}
                onClick={() => setVoiceFilter(v)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  voiceFilter === v
                    ? 'bg-amber-400 text-neutral-950 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {v === 'all' ? 'All Voices' : v}
              </button>
            ))}
          </div>

          {/* Favorites Filter */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            title="Show only favorites"
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              onlyFavorites
                ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Starred</span>
          </button>
        </div>

        {/* New Track Button */}
        <button
          onClick={onNewAudioClick}
          className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Audio Track</span>
        </button>
      </div>

      {/* Tracks Table */}
      {filteredTracks.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900/40 rounded-xl border border-neutral-800 space-y-4">
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white">No tracks match your filter</h4>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Generate audio in the Studio Editor or load the offline sample audio tracks to start listening.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onSeedSamples}
              className="px-4 py-2 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors"
            >
              Load Offline Demo Samples
            </button>
            <button
              onClick={onNewAudioClick}
              className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              Create New Audio
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900/70 rounded-xl border border-neutral-800 overflow-hidden">
          <div className="divide-y divide-neutral-800/80">
            {filteredTracks.map((track) => {
              const isCurrent = currentTrackId === track.id;
              const isCurrentlyPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  className={`p-3.5 sm:px-4 flex items-center justify-between gap-4 transition-colors ${
                    isCurrent ? 'bg-amber-400/5' : 'hover:bg-neutral-800/40'
                  }`}
                >
                  {/* Left: Play button and metadata */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onPlayTrack(track)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                        isCurrentlyPlaying
                          ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          onClick={() => onPlayTrack(track)}
                          className={`text-xs sm:text-sm font-semibold truncate cursor-pointer transition-colors ${
                            isCurrent ? 'text-amber-400' : 'text-white hover:text-amber-300'
                          }`}
                        >
                          {track.title}
                        </h4>

                        {/* Offline badge */}
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Offline Ready</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                        <span className="font-medium text-neutral-300">{track.voice}</span>
                        <span aria-hidden="true" className="text-neutral-700">·</span>
                        <span className="truncate max-w-[200px]">{track.style}</span>
                        <span aria-hidden="true" className="text-neutral-700">·</span>
                        <span className="font-mono text-neutral-500 tabular-nums">
                          {formatDate(track.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Metrics & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden md:block">
                      <div className="text-xs font-mono font-medium text-neutral-300 tabular-nums">
                        {formatDuration(track.duration)}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-500 tabular-nums">
                        {formatFileSize(track.sizeBytes)}
                      </div>
                    </div>

                    {/* Star Favorite */}
                    <button
                      onClick={() => onToggleFavorite(track.id)}
                      title={track.isFavorite ? 'Unstar' : 'Star track'}
                      className="p-1.5 text-neutral-400 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          track.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>

                    {/* Download WAV */}
                    <button
                      onClick={() => downloadWavFile(track)}
                      title="Download .wav file"
                      className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteTrack(track.id)}
                      title="Delete from offline storage"
                      className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

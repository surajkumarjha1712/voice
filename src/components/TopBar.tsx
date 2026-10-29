import React from 'react';
import { Wifi, WifiOff, Sparkles, HardDrive } from 'lucide-react';

interface TopBarProps {
  activeTab: 'editor' | 'library' | 'mastering' | 'voices';
  setActiveTab: (tab: 'editor' | 'library' | 'mastering' | 'voices') => void;
  isOnline: boolean;
  offlineCount: number;
  onGenerateClick?: () => void;
  isGenerating?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  isOnline,
  offlineCount,
  onGenerateClick,
  isGenerating = false,
}) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      {/* Zone 1: Brand wordmark in clean display face */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('editor');
          }}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <span className="font-mono text-neutral-950 text-sm font-extrabold tracking-tighter">VX</span>
          </div>
          <span className="text-white font-semibold tracking-tight text-base">VoxStudio</span>
        </a>

        {/* Quiet unboxed offline status indicator */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-neutral-800 text-xs text-neutral-400">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Wifi className="w-3.5 h-3.5" />
              <span>Studio Cloud</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Mode</span>
            </span>
          )}
          <span aria-hidden="true" className="text-neutral-700">·</span>
          <span className="flex items-center gap-1 font-mono text-neutral-400 tabular-nums">
            <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
            <span>{offlineCount} {offlineCount === 1 ? 'track' : 'tracks'} cached</span>
          </span>
        </div>
      </div>

      {/* Zone 2: 4 single-line nav links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
        <button
          onClick={() => setActiveTab('editor')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'editor'
              ? 'text-white border-b-2 border-amber-400 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          Studio Editor
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'library'
              ? 'text-white border-b-2 border-amber-400 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          <span>Offline Vault</span>
          {offlineCount > 0 && (
            <span className="text-xs font-mono tabular-nums text-neutral-400">
              ({offlineCount})
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('mastering')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'mastering'
              ? 'text-white border-b-2 border-amber-400 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          Mastering & FX
        </button>
        <button
          onClick={() => setActiveTab('voices')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'voices'
              ? 'text-white border-b-2 border-amber-400 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          Voice Gallery
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        {onGenerateClick && (
          <button
            onClick={onGenerateClick}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm font-semibold active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Synthesizing...' : 'Generate Audio'}</span>
          </button>
        )}
      </div>
    </header>
  );
};

import React from 'react';
import { Play, Sparkles, Check, Mic2 } from 'lucide-react';
import { VoiceName } from '../types';
import { VOICES_CATALOG } from '../constants/presets';

interface VoiceShowcaseProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  onAuditionVoice: (voice: VoiceName) => void;
}

export const VoiceShowcase: React.FC<VoiceShowcaseProps> = ({
  selectedVoice,
  onSelectVoice,
  onAuditionVoice,
}) => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Gemini TTS Neural Voice Gallery</h3>
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Explore all five prebuilt voice personas engineered with 24kHz unary audio synthesis. Test timbre, dynamic range, and vocal characteristics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {VOICES_CATALOG.map((voice) => {
          const isSelected = selectedVoice === voice.id;

          return (
            <div
              key={voice.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-amber-400/10 border-amber-400 shadow-lg shadow-amber-500/10'
                  : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{voice.name}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-400 text-neutral-950">
                          Active
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-neutral-400">{voice.gender}</span>
                  </div>

                  <button
                    onClick={() => onAuditionVoice(voice.id)}
                    title={`Audition ${voice.name} sample audio`}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition-colors shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <div className="p-2.5 bg-neutral-950/70 rounded-lg border border-neutral-800/80">
                  <span className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider block mb-1">
                    Vocal Timbre Profile
                  </span>
                  <p className="text-xs text-neutral-200 font-medium">{voice.timbre}</p>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  {voice.description}
                </p>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] text-neutral-400 font-medium">Recommended Styles:</span>
                  <div className="flex flex-wrap gap-1">
                    {voice.recommendedStyles.map((style) => (
                      <span
                        key={style}
                        className="px-2 py-0.5 rounded bg-neutral-800 text-[11px] text-neutral-300 font-mono"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-800 flex items-center justify-between">
                <button
                  onClick={() => onAuditionVoice(voice.id)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Preview Audio</span>
                </button>

                <button
                  onClick={() => onSelectVoice(voice.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-400 text-neutral-950'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selected</span>
                    </>
                  ) : (
                    <span>Use {voice.name}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

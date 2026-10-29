import React from 'react';
import { Sliders, Volume2, RotateCcw, CloudRain, Disc, Coffee, Wind } from 'lucide-react';
import { MasteringSettings } from '../types';

interface MasteringRackProps {
  settings: MasteringSettings;
  onChange: (newSettings: MasteringSettings) => void;
  onReset: () => void;
}

export const MasteringRack: React.FC<MasteringRackProps> = ({
  settings,
  onChange,
  onReset,
}) => {
  const updateSetting = <K extends keyof MasteringSettings>(key: K, val: MasteringSettings[K]) => {
    onChange({ ...settings, [key]: val });
  };

  const ambienceOptions: { id: MasteringSettings['ambienceType']; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'none', label: 'None', icon: <Volume2 className="w-3.5 h-3.5" />, desc: 'Dry clean master' },
    { id: 'rain', label: 'Gentle Rain', icon: <CloudRain className="w-3.5 h-3.5" />, desc: 'Soothing rain drops' },
    { id: 'vinyl', label: 'Vinyl Warmth', icon: <Disc className="w-3.5 h-3.5" />, desc: 'Analog needle crackle' },
    { id: 'coffee', label: 'Café Ambience', icon: <Coffee className="w-3.5 h-3.5" />, desc: 'Warm room acoustic' },
    { id: 'whitenoise', label: 'Pink Noise', icon: <Wind className="w-3.5 h-3.5" />, desc: 'Soft focusing drone' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-neutral-900/60 rounded-xl border border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Audio Mastering & Acoustic Rack</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time Web Audio parametric equalization, spatial panning, and offline ambient soundscape generator.
          </p>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700/60 transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Rack</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equalizer Controls */}
        <div className="p-5 bg-neutral-900/50 rounded-xl border border-neutral-800 space-y-5">
          <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
            Parametric Equalizer
          </h4>

          {/* Bass Warmth */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium">Bass Warmth (180 Hz Lowshelf)</span>
              <span className="font-mono tabular-nums text-amber-400">
                {settings.bassBoost > 0 ? `+${settings.bassBoost}` : settings.bassBoost} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={settings.bassBoost}
              onChange={(e) => updateSetting('bassBoost', parseFloat(e.target.value))}
              className="w-full h-1.5 accent-amber-400 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Vocal Clarity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium">Vocal Presence (2.5 kHz Peaking)</span>
              <span className="font-mono tabular-nums text-amber-400">
                {settings.vocalClarity > 0 ? `+${settings.vocalClarity}` : settings.vocalClarity} dB
              </span>
            </div>
            <input
              type="range"
              min="-6"
              max="10"
              step="0.5"
              value={settings.vocalClarity}
              onChange={(e) => updateSetting('vocalClarity', parseFloat(e.target.value))}
              className="w-full h-1.5 accent-amber-400 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Treble & Air */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium">Air & Crispness (8 kHz Highshelf)</span>
              <span className="font-mono tabular-nums text-amber-400">
                {settings.trebleBoost > 0 ? `+${settings.trebleBoost}` : settings.trebleBoost} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={settings.trebleBoost}
              onChange={(e) => updateSetting('trebleBoost', parseFloat(e.target.value))}
              className="w-full h-1.5 accent-amber-400 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Spatial Pan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium">Stereo Spatial Panning</span>
              <span className="font-mono tabular-nums text-amber-400">
                {settings.spatialPan === 0
                  ? 'Center'
                  : settings.spatialPan < 0
                  ? `L ${Math.abs(Math.round(settings.spatialPan * 100))}%`
                  : `R ${Math.round(settings.spatialPan * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={settings.spatialPan}
              onChange={(e) => updateSetting('spatialPan', parseFloat(e.target.value))}
              className="w-full h-1.5 accent-amber-400 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Ambient Soundscape Generator */}
        <div className="p-5 bg-neutral-900/50 rounded-xl border border-neutral-800 space-y-5">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
              Offline Ambient Soundscape
            </h4>
            <p className="text-xs text-neutral-400">
              Blends organic background ambience beneath speech (synthesized on-device, zero internet required).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ambienceOptions.map((opt) => {
              const isSelected = settings.ambienceType === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => updateSetting('ambienceType', opt.id)}
                  className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                    isSelected
                      ? 'bg-amber-400/10 border-amber-400 text-white shadow-sm'
                      : 'bg-neutral-950/70 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className={`mt-0.5 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {opt.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[10px] text-neutral-400">{opt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {settings.ambienceType !== 'none' && (
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium">Ambience Blend Level</span>
                <span className="font-mono tabular-nums text-amber-400">
                  {Math.round(settings.ambienceVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={settings.ambienceVolume}
                onChange={(e) => updateSetting('ambienceVolume', parseFloat(e.target.value))}
                className="w-full h-1.5 accent-amber-400 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

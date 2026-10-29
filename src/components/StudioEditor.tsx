import React, { useRef, useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Users,
  Mic,
  Plus,
  Trash2,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { VoiceName, VoiceInfo, StylePreset, PresetScript, DialogueLine } from '../types';
import { VOICES_CATALOG, STYLE_PRESETS, VOCAL_EXPRESSION_TAGS, PRESET_SCRIPTS } from '../constants/presets';

interface StudioEditorProps {
  text: string;
  setText: (val: string) => void;
  selectedVoice: VoiceName;
  setSelectedVoice: (voice: VoiceName) => void;
  customStylePrompt: string;
  setCustomStylePrompt: (val: string) => void;
  selectedPresetStyle: string;
  setSelectedPresetStyle: (val: string) => void;
  editorMode: 'single' | 'dialogue';
  setEditorMode: (mode: 'single' | 'dialogue') => void;
  dialogueLines: DialogueLine[];
  setDialogueLines: React.Dispatch<React.SetStateAction<DialogueLine[]>>;
  speaker1: { name: string; voice: VoiceName; style: string };
  setSpeaker1: React.Dispatch<React.SetStateAction<{ name: string; voice: VoiceName; style: string }>>;
  speaker2: { name: string; voice: VoiceName; style: string };
  setSpeaker2: React.Dispatch<React.SetStateAction<{ name: string; voice: VoiceName; style: string }>>;
  onGenerate: () => void;
  onGenerateOffline: () => void;
  isGenerating: boolean;
  isOnline: boolean;
  onAuditionVoice: (voice: VoiceName) => void;
}

export const StudioEditor: React.FC<StudioEditorProps> = ({
  text,
  setText,
  selectedVoice,
  setSelectedVoice,
  customStylePrompt,
  setCustomStylePrompt,
  selectedPresetStyle,
  setSelectedPresetStyle,
  editorMode,
  setEditorMode,
  dialogueLines,
  setDialogueLines,
  speaker1,
  setSpeaker1,
  speaker2,
  setSpeaker2,
  onGenerate,
  onGenerateOffline,
  isGenerating,
  isOnline,
  onAuditionVoice,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showTagHelp, setShowTagHelp] = useState(false);

  // Word & reading time calculations
  const wordCount = editorMode === 'single'
    ? text.trim().split(/\s+/).filter(Boolean).length
    : dialogueLines.reduce((acc, l) => acc + l.text.trim().split(/\s+/).filter(Boolean).length, 0);

  const charCount = editorMode === 'single'
    ? text.length
    : dialogueLines.reduce((acc, l) => acc + l.text.length, 0);

  const estimatedSeconds = Math.max(1, Math.round(wordCount / (140 / 60)));

  // Insert tag at cursor position in textarea
  const insertTagAtCursor = (tag: string) => {
    if (!textareaRef.current) {
      setText(text + ' ' + tag);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newText = text.substring(0, start) + tag + ' ' + text.substring(end);
    setText(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + tag.length + 1, start + tag.length + 1);
      }
    }, 0);
  };

  // Load a preset script
  const handleLoadScript = (script: PresetScript) => {
    if (script.mode === 'single') {
      setEditorMode('single');
      setText(script.content);
      setSelectedVoice(script.voice);
      setCustomStylePrompt(script.style);
      setSelectedPresetStyle('custom');
    } else if (script.mode === 'dialogue' && script.dialogueLines) {
      setEditorMode('dialogue');
      setSpeaker1({ name: 'Alex', voice: 'Puck', style: 'Dynamic, curious podcast host' });
      setSpeaker2({ name: 'Sam', voice: 'Kore', style: 'Insightful, articulate expert' });
      setDialogueLines(
        script.dialogueLines.map((line, idx) => ({
          id: `line_${idx}_${Date.now()}`,
          speaker: line.speaker,
          voice: line.voice,
          style: line.style,
          text: line.text,
        }))
      );
    }
  };

  // Dialogue line handlers
  const addDialogueLine = (speakerName: string, defaultVoice: VoiceName) => {
    setDialogueLines((prev) => [
      ...prev,
      {
        id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        speaker: speakerName,
        voice: defaultVoice,
        style: '',
        text: '',
      },
    ]);
  };

  const removeDialogueLine = (id: string) => {
    setDialogueLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateDialogueLine = (id: string, field: 'text' | 'speaker' | 'style', val: string) => {
    setDialogueLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: val } : l))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Mode switcher & Preset Scripts */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800/80">
          <button
            onClick={() => setEditorMode('single')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              editorMode === 'single'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Single Speaker</span>
          </button>
          <button
            onClick={() => setEditorMode('dialogue')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              editorMode === 'dialogue'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Dual Speaker Screenplay</span>
          </button>
        </div>

        {/* Preset Scripts Library */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 hidden sm:inline">Templates:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_SCRIPTS.map((script) => (
              <button
                key={script.id}
                onClick={() => handleLoadScript(script)}
                className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/70 hover:bg-neutral-800 rounded-md border border-neutral-700/60 transition-colors whitespace-nowrap shrink-0"
              >
                {script.title.split(':')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      {editorMode === 'single' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <span>Speech Script</span>
              <span className="text-neutral-500 font-normal">
                (Type or paste your text to generate studio-grade audio)
              </span>
            </label>

            {/* Word & Duration Metrology */}
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums">
              <span>{wordCount} words</span>
              <span aria-hidden="true" className="text-neutral-700">·</span>
              <span>{charCount} chars</span>
              <span aria-hidden="true" className="text-neutral-700">·</span>
              <span className="text-amber-400">~{estimatedSeconds}s audio</span>
            </div>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to synthesize into high-fidelity speech. You can direct expressiveness with natural punctuation, or click tags below like <breath> or <laugh> to shape human cadence..."
              rows={7}
              className="w-full p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 transition-colors resize-y font-normal leading-relaxed"
            />
          </div>

          {/* Expressive Vocal Bursts Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-neutral-900/40 rounded-lg border border-neutral-800/60 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-neutral-400 font-medium mr-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Expressive Directing:</span>
              </span>
              {VOCAL_EXPRESSION_TAGS.map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => insertTagAtCursor(t.tag)}
                  title={t.desc}
                  className="px-2 py-0.5 rounded bg-neutral-800/80 hover:bg-neutral-800 text-amber-300 border border-neutral-700/60 font-mono text-xs transition-colors"
                >
                  {t.tag}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTagHelp(!showTagHelp)}
              className="text-neutral-400 hover:text-neutral-200 flex items-center gap-1 text-[11px]"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Directing Guide</span>
            </button>
          </div>

          {showTagHelp && (
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-400 space-y-1.5">
              <p className="font-semibold text-neutral-200">How to Direct High-Quality Gemini Speech:</p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-neutral-400">
                <li>Use <code className="text-amber-400 font-mono">&lt;breath&gt;</code> before thoughtful assertions to simulate human inhalation.</li>
                <li>Use <code className="text-amber-400 font-mono">&lt;laugh&gt;</code> or <code className="text-amber-400 font-mono">&lt;gasp&gt;</code> for spontaneous emotional bursts.</li>
                <li>Use backchannel words like <code className="text-amber-400 font-mono">|mhm|</code> or <code className="text-amber-400 font-mono">|yeah|</code> for conversational agreement.</li>
                <li>Use ellipses <code className="text-amber-400 font-mono">...</code> or commas for cinematic pauses and dramatic pacing.</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        /* Dialogue Screenplay Mode */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-900/60 rounded-xl border border-neutral-800">
            {/* Speaker 1 Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
                <span>Speaker 1</span>
                <span className="font-mono text-amber-400">{speaker1.voice}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={speaker1.name}
                  onChange={(e) => setSpeaker1({ ...speaker1, name: e.target.value })}
                  placeholder="Speaker Name"
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white"
                />
                <select
                  value={speaker1.voice}
                  onChange={(e) => setSpeaker1({ ...speaker1, voice: e.target.value as VoiceName })}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white"
                >
                  {VOICES_CATALOG.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender.split('/')[0]})
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={speaker1.style}
                onChange={(e) => setSpeaker1({ ...speaker1, style: e.target.value })}
                placeholder="Speaker Persona / Vocal Style"
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300"
              />
            </div>

            {/* Speaker 2 Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
                <span>Speaker 2</span>
                <span className="font-mono text-cyan-400">{speaker2.voice}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={speaker2.name}
                  onChange={(e) => setSpeaker2({ ...speaker2, name: e.target.value })}
                  placeholder="Speaker Name"
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white"
                />
                <select
                  value={speaker2.voice}
                  onChange={(e) => setSpeaker2({ ...speaker2, voice: e.target.value as VoiceName })}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white"
                >
                  {VOICES_CATALOG.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender.split('/')[0]})
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={speaker2.style}
                onChange={(e) => setSpeaker2({ ...speaker2, style: e.target.value })}
                placeholder="Speaker Persona / Vocal Style"
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300"
              />
            </div>
          </div>

          {/* Dialogue Lines Screenplay */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300">
                Screenplay Lines ({dialogueLines.length} turns)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addDialogueLine(speaker1.name, speaker1.voice)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add {speaker1.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => addDialogueLine(speaker2.name, speaker2.voice)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add {speaker2.name}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {dialogueLines.map((line, idx) => (
                <div
                  key={line.id}
                  className="flex items-start gap-2 p-3 bg-neutral-900/80 rounded-lg border border-neutral-800"
                >
                  <div className="w-24 shrink-0 space-y-1">
                    <select
                      value={line.speaker}
                      onChange={(e) => updateDialogueLine(line.id, 'speaker', e.target.value)}
                      className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs font-semibold text-amber-400"
                    >
                      <option value={speaker1.name}>{speaker1.name}</option>
                      <option value={speaker2.name}>{speaker2.name}</option>
                    </select>
                    <span className="text-[10px] font-mono text-neutral-500 block text-center">
                      Line {idx + 1}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1">
                    <textarea
                      value={line.text}
                      onChange={(e) => updateDialogueLine(line.id, 'text', e.target.value)}
                      placeholder="Line text (support tags like <laugh>, |yeah|, <breath>)..."
                      rows={2}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded-md text-xs text-white focus:outline-none focus:border-amber-500/60"
                    />
                  </div>

                  <button
                    onClick={() => removeDialogueLine(line.id)}
                    title="Remove line"
                    className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voice Selection Section (for single speaker mode) */}
      {editorMode === 'single' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-300">
              Select Voice Persona
            </label>
            <span className="text-xs text-neutral-500">
              High-Fidelity 24kHz Unary Neural Voices
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {VOICES_CATALOG.map((v) => {
              const isSelected = selectedVoice === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-400/10 border-amber-400/80 shadow-lg shadow-amber-500/10'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{v.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAuditionVoice(v.id);
                        }}
                        title={`Audition sample of ${v.name}`}
                        className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>

                    <div className="text-[11px] text-neutral-400 leading-tight">
                      {v.gender}
                    </div>

                    <p className="text-xs text-neutral-300 line-clamp-2 pt-1">
                      {v.timbre}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500 font-mono">
                      {v.recommendedStyles[0]}
                    </span>
                    {isSelected && (
                      <span className="text-amber-400 font-semibold text-[11px]">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Voice Style Customization */}
      <div className="space-y-3 p-4 bg-neutral-900/60 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-300">
            Voice Style & Delivery Tone
          </label>
          <span className="text-xs text-neutral-500">
            Direct cadence, persona, and emotional weight
          </span>
        </div>

        {/* Style Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STYLE_PRESETS.map((style) => {
            const isSelected = selectedPresetStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => {
                  setSelectedPresetStyle(style.id);
                  setCustomStylePrompt(style.prompt);
                }}
                className={`px-3 py-1 text-xs rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-amber-400 text-neutral-950 border-amber-400 font-semibold shadow-sm'
                    : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {style.label}
              </button>
            );
          })}
        </div>

        {/* Custom Persona Prompt */}
        <div className="pt-2">
          <input
            type="text"
            value={customStylePrompt}
            onChange={(e) => {
              setCustomStylePrompt(e.target.value);
              setSelectedPresetStyle('custom');
            }}
            placeholder="Custom style prompt (e.g. 'Solemn documentary narrator with cosmic reverence' or 'Fast, upbeat radio commercial')..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* Primary Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-neutral-400">
          Output: <span className="font-mono text-neutral-200">24kHz 16-bit Mono WAV</span> · Zero compression degradation
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Fallback Offline Synthesizer */}
          <button
            type="button"
            onClick={onGenerateOffline}
            disabled={isGenerating}
            title="Synthesize audio locally in browser without calling remote API"
            className="px-3.5 py-2.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg border border-neutral-800 transition-colors whitespace-nowrap shrink-0"
          >
            Synthesize Offline
          </button>

          {/* Primary Generate CTA */}
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-neutral-950" />
            <span>{isGenerating ? 'Synthesizing Studio Audio...' : 'Synthesize Audio'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

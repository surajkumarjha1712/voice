import React, { useRef, useEffect, useState, useCallback } from 'react';
import { audioEngine } from '../services/audioEngine';
import { AudioTrack } from '../types';

interface AudioVisualizerProps {
  track: AudioTrack | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  visualMode?: 'waveform' | 'spectrum' | 'oscilloscope';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  track,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  visualMode = 'waveform',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Formatting helper
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

    if (visualMode === 'waveform') {
      // Draw interactive multi-bar waveform
      const peaks = track?.peaks && track.peaks.length > 0
        ? track.peaks
        : Array.from({ length: 64 }, () => 0.2);

      const totalBars = peaks.length;
      const barSpacing = 3;
      const totalSpacing = (totalBars - 1) * barSpacing;
      const barWidth = Math.max(2, (width - totalSpacing) / totalBars);

      const midY = height / 2;

      for (let i = 0; i < totalBars; i++) {
        const barX = i * (barWidth + barSpacing);
        const barNorm = i / totalBars;
        const isPlayed = barNorm <= progress;

        const peak = peaks[i];
        const barHeight = Math.max(4, peak * (height * 0.78));

        // Color gradient
        if (isPlayed) {
          ctx.fillStyle = '#fbbf24'; // Amber-400
        } else {
          ctx.fillStyle = '#334155'; // Slate-700
        }

        // Rounded bar
        const x = barX;
        const y = midY - barHeight / 2;
        const r = Math.min(barWidth / 2, 2);

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + barWidth - r, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
        ctx.lineTo(x + barWidth, y + barHeight - r);
        ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - r, y + barHeight);
        ctx.lineTo(x + r, y + barHeight);
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
      }

      // Draw active playhead line
      const playheadX = progress * width;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Playhead top marker
      ctx.beginPath();
      ctx.arc(playheadX, 4, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
    } else if (visualMode === 'spectrum') {
      // Real-time frequency spectrum bars
      const { frequencyData } = audioEngine.getVisualizerData();
      const barsToDraw = Math.min(frequencyData.length, 64);
      const barWidth = (width / barsToDraw) - 2;

      for (let i = 0; i < barsToDraw; i++) {
        const val = frequencyData[i] / 255;
        const barHeight = Math.max(4, val * (height - 8));
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Gradient from amber to cyan
        const grad = ctx.createLinearGradient(0, height, 0, y);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = isPlaying ? grad : '#475569';

        ctx.fillRect(x, y, barWidth, barHeight);
      }
    } else {
      // Oscilloscope wave
      const { timeDomainData } = audioEngine.getVisualizerData();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isPlaying ? '#38bdf8' : '#64748b';
      ctx.beginPath();

      const sliceWidth = width / timeDomainData.length;
      let x = 0;

      for (let i = 0; i < timeDomainData.length; i++) {
        const v = timeDomainData[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }
  }, [track, currentTime, duration, isPlaying, visualMode]);

  // Resize observer
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      draw();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  // Animation frame loop for continuous visualization during playback
  useEffect(() => {
    let animId: number;
    const loop = () => {
      draw();
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  // Handle seeking interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || duration <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const seekTarget = (clickX / rect.width) * duration;
    setIsDragging(true);
    onSeek(seekTarget);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || duration <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const t = (currX / rect.width) * duration;

    setHoverX(currX);
    setHoverTime(t);

    if (isDragging) {
      onSeek(t);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const handlePointerLeave = () => {
    setHoverTime(null);
    setHoverX(null);
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-24 bg-neutral-900/80 rounded-xl border border-neutral-800 p-2 overflow-hidden select-none cursor-pointer"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />

      {/* Hover timestamp tooltip */}
      {hoverTime !== null && hoverX !== null && (
        <div
          className="absolute top-1 pointer-events-none -translate-x-1/2 px-2 py-0.5 rounded bg-neutral-950/90 border border-neutral-700 text-[11px] font-mono tabular-nums text-amber-300 shadow-md"
          style={{ left: hoverX }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      {/* Corner indicators */}
      <div className="absolute bottom-1.5 left-3 pointer-events-none text-[10px] font-mono text-neutral-500 tabular-nums">
        {formatTime(currentTime)}
      </div>
      <div className="absolute bottom-1.5 right-3 pointer-events-none text-[10px] font-mono text-neutral-500 tabular-nums">
        {formatTime(duration)}
      </div>
    </div>
  );
};

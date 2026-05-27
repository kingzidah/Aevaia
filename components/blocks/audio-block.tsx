"use client";

import { useRef, useState, useEffect } from "react";
import { Music2, Play, Pause } from "lucide-react";

interface Props {
  audioUrl?: string;
  audioVolume?: number; // 0–100
  onVolumeChange?: (vol: number) => void;
}

export default function AudioBlock({ audioUrl, audioVolume = 80, onVolumeChange }: Props) {
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const [playing,   setPlaying]   = useState(false);
  const [localVol,  setLocalVol]  = useState(audioVolume);
  const [progress,  setProgress]  = useState(0);   // 0–1
  const [duration,  setDuration]  = useState(0);   // seconds

  useEffect(() => { setLocalVol(audioVolume); }, [audioVolume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = localVol / 100;
  }, [localVol]);

  useEffect(() => {
    // Pause when the URL changes (new source loaded)
    setPlaying(false);
    setProgress(0);
    setDuration(0);
  }, [audioUrl]);

  // Track playback position
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      if (el.duration > 0) setProgress(el.currentTime / el.duration);
    };
    const onLoaded = () => setDuration(el.duration);
    el.addEventListener('timeupdate',       onTime);
    el.addEventListener('loadedmetadata',   onLoaded);
    el.addEventListener('durationchange',   onLoaded);
    return () => {
      el.removeEventListener('timeupdate',     onTime);
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('durationchange', onLoaded);
    };
  }, [audioUrl]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    if (playing) { el.pause(); setPlaying(false); }
    else         { el.play().catch(() => {}); setPlaying(true); }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const v = Number(e.target.value);
    setLocalVol(v);
    if (audioRef.current) audioRef.current.volume = v / 100;
    onVolumeChange?.(v);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  if (!audioUrl) {
    return (
      <div className="w-full px-4 py-3 rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.06] flex items-center justify-center shrink-0">
          <Music2 className="w-4 h-4 text-white/30" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/40">No audio source</p>
          <p className="text-[10px] text-white/20">Upload or paste a URL in the Style panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl flex items-center gap-3">
      <audio ref={audioRef} src={audioUrl} loop preload="metadata" className="hidden" />

      {/* Play / Pause */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 bg-white/10 hover:bg-white/20 border border-white/10"
      >
        {playing
          ? <Pause className="w-3.5 h-3.5 text-white/80" />
          : <Play  className="w-3.5 h-3.5 ml-0.5 text-white/80" />
        }
      </button>

      {/* Timeline + volume */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Progress track — click/drag to seek */}
        <div className="relative h-2 rounded-full bg-white/10 group">
          {/* Visual fill (pointer-events:none so the input above handles clicks) */}
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/50 group-hover:bg-white/70 transition-colors pointer-events-none" style={{ width: `${progress * 100}%` }} />
          {/* Native range input — transparent overlay, fully accessible */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => {
              e.stopPropagation();
              const ratio = Number(e.target.value);
              const el = audioRef.current;
              if (!el || !duration) return;
              el.currentTime = ratio * duration;
              setProgress(ratio);
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label="Seek audio"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Time + label row */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-white/40 truncate flex items-center gap-1">
            <Music2 className="w-3 h-3 shrink-0" />
            Ambient Audio
          </p>
          {duration > 0 && (
            <span className="text-[9px] text-white/30 tabular-nums shrink-0">
              {fmt(progress * duration)} / {fmt(duration)}
            </span>
          )}
        </div>

        {/* Volume */}
        <input
          type="range"
          min={0}
          max={100}
          value={localVol}
          onChange={handleVolumeChange}
          onClick={(e) => e.stopPropagation()}
          aria-label="Volume"
          className="w-full h-1 accent-white/60 cursor-pointer"
        />
      </div>
    </div>
  );
}

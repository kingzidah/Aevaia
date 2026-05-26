'use client';

import { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Upload } from 'lucide-react';

const SPEED_OPTIONS: { label: string; value: number }[] = [
  { label: '0.5×', value: 0.5 },
  { label: '1×',   value: 1   },
  { label: '1.5×', value: 1.5 },
  { label: '2×',   value: 2   },
];

interface AudioBlockPanelProps {
  audioUrl: string;
  audioVolume: number;  // 0–100
  audioSpeed: number;   // 0.5 | 1 | 1.5 | 2
  onAudioUrlChange: (url: string) => void;
  onVolumeChange: (vol: number) => void;
  onSpeedChange: (speed: number) => void;
}

export default function AudioBlockPanel({
  audioUrl,
  audioVolume,
  audioSpeed,
  onAudioUrlChange,
  onVolumeChange,
  onSpeedChange,
}: AudioBlockPanelProps) {
  const [localUrl,  setLocalUrl]  = useState(audioUrl);
  const [fileName,  setFileName]  = useState<string | null>(null);
  const [wsPlaying, setWsPlaying] = useState(false);
  const [wsReady,   setWsReady]   = useState(false);
  const [wsError,   setWsError]   = useState(false);

  const wsLoading  = !!audioUrl && !wsReady && !wsError;
  const isFileMode = !!fileName && audioUrl.startsWith('blob:');

  const waveformRef  = useRef<HTMLDivElement>(null);
  const wsRef        = useRef<WaveSurfer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // File upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setFileName(file.name);
    setLocalUrl('');
    onAudioUrlChange(url);
    e.target.value = '';
  };

  const commitUrl = () => {
    if (localUrl.trim() !== audioUrl) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setFileName(null);
      onAudioUrlChange(localUrl.trim());
    }
  };

  const handleClear = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setFileName(null);
    setLocalUrl('');
    onAudioUrlChange('');
  };

  // WaveSurfer lifecycle
  useEffect(() => {
    if (!waveformRef.current) return;
    if (wsRef.current) { wsRef.current.destroy(); wsRef.current = null; }
    setWsReady(false);
    setWsPlaying(false);
    setWsError(false);
    if (!audioUrl) return;

    const ws = WaveSurfer.create({
      container:     waveformRef.current,
      waveColor:     'rgba(168, 85, 247, 0.28)',
      progressColor: 'rgba(168, 85, 247, 0.88)',
      cursorColor:   'rgba(168, 85, 247, 0.65)',
      barWidth: 2, barGap: 1, barRadius: 3, height: 56, normalize: true,
    });

    ws.load(audioUrl);
    ws.on('ready', () => { ws.setVolume(audioVolume / 100); ws.setPlaybackRate(audioSpeed); setWsReady(true); });
    ws.on('play',   () => setWsPlaying(true));
    ws.on('pause',  () => setWsPlaying(false));
    ws.on('finish', () => ws.play());
    ws.on('error',  () => { setWsError(true); setWsReady(false); });

    wsRef.current = ws;
    return () => { ws.destroy(); wsRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  useEffect(() => {
    if (wsRef.current && wsReady) wsRef.current.setVolume(audioVolume / 100);
  }, [audioVolume, wsReady]);

  useEffect(() => {
    if (wsRef.current && wsReady) wsRef.current.setPlaybackRate(audioSpeed);
  }, [audioSpeed, wsReady]);

  const handlePlayPause = () => {
    if (!wsRef.current || !wsReady) return;
    wsRef.current.playPause();
  };

  return (
    <div className="space-y-4 w-full">

      {/* Upload button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 hover:border-purple-500/60 hover:bg-purple-500/5 text-neutral-400 hover:text-purple-300 text-xs font-medium transition-all duration-200"
      >
        <Upload className="w-3.5 h-3.5" />
        Upload Audio File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        aria-label="Upload audio file"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Filename chip */}
      {isFileMode && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/25">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-purple-400 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
          <span className="text-[11px] text-purple-300 truncate flex-1 min-w-0">{fileName}</span>
          <button type="button" aria-label="Remove file" onClick={handleClear} className="text-neutral-500 hover:text-red-400 transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* URL input */}
      {!isFileMode && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-[10px] text-neutral-600">or paste URL</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>
          <input
            type="text"
            value={localUrl}
            onChange={e => setLocalUrl(e.target.value)}
            onBlur={commitUrl}
            onKeyDown={e => e.key === 'Enter' && commitUrl()}
            placeholder="https://example.com/audio.mp3"
            className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-neutral-600"
          />
        </>
      )}

      {/* Waveform editor */}
      {audioUrl && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-purple-500 shadow-[0_0_6px_#a855f7]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Waveform</span>
            <button type="button" onClick={handleClear} className="ml-auto text-[10px] text-neutral-600 hover:text-red-400 transition-colors">
              Remove
            </button>
          </div>

          {/* Waveform */}
          <div className="relative min-h-14 rounded-xl bg-neutral-900 overflow-hidden">
            {wsLoading && (
              <div className="absolute inset-0 flex items-end justify-center gap-0.5 px-4 pb-2">
                {(["h-3","h-5","h-8","h-6","h-10","h-7","h-4","h-9","h-6","h-5",
                   "h-8","h-10","h-5","h-7","h-4","h-9","h-6","h-8","h-5","h-3"] as const).map((h, i) => (
                  <div key={i} className={`flex-1 rounded-full bg-neutral-700 animate-pulse ${h}`} />
                ))}
              </div>
            )}
            {wsError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500/60">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                </svg>
                <span className="text-[10px] text-red-400/70 text-center">Unable to load waveform.</span>
              </div>
            )}
            <div ref={waveformRef} className={`w-full transition-opacity duration-500 ${wsReady ? 'opacity-100' : 'opacity-0'}`} />
          </div>

          {/* Play/Pause + Speed */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePlayPause}
              disabled={!wsReady}
              aria-label={wsPlaying ? 'Pause' : 'Play'}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                !wsReady ? 'bg-neutral-900 border border-neutral-800 opacity-40 cursor-not-allowed'
                : wsPlaying ? 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_14px_rgba(168,85,247,0.5)]'
                : 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-700'
              }`}
            >
              {wsPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 ml-0.5 text-neutral-300">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-1 ml-auto">
              {SPEED_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSpeedChange(opt.value)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    audioSpeed === opt.value
                      ? 'bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.35)]'
                      : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700 hover:text-neutral-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider">Volume</label>
              <span className="text-[10px] text-neutral-400 tabular-nums">{audioVolume}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={audioVolume}
              onChange={e => onVolumeChange(Number(e.target.value))}
              aria-label="Audio volume"
              className="w-full accent-purple-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useRef, useCallback, useMemo, useEffect, memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft, Sparkles, Shapes, Type, Music, Mic, Film,
  Check, X, Loader2, Download, Zap, Copy, RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCredits } from '@/context/CreditContext';
import type {
  AgentKey, ProjectContext, OrchestrationPayload,
  VectorResult, CopywritingResult, AudioResult, VoiceResult, VideoResult, SubAgentResult,
} from '@/types/orchestrator';

// ── Types ─────────────────────────────────────────────────────────────────────

type PipelineStage =
  | 'idle'
  | 'context_injection'
  | 'routing'
  | 'generating_assets'
  | 'verifying'
  | 'complete'
  | 'error';

type PipelineNodeId = 'context_injection' | 'routing' | 'generating_assets' | 'verifying';
type NodeStatus     = 'pending' | 'active' | 'done' | 'error';

// ── Agent display metadata ────────────────────────────────────────────────────

interface AgentMeta {
  label:  string;
  Icon:   LucideIcon;
  color:  string;
  bg:     string;
  border: string;
}

const AGENT_META: Record<AgentKey, AgentMeta> = {
  vector:     { label: 'Vector Art',  Icon: Shapes, color: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30' },
  copywriter: { label: 'Copywriting', Icon: Type,   color: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
  audio:      { label: 'Audio Track', Icon: Music,  color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  voice:      { label: 'Voice',       Icon: Mic,    color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
  video:      { label: 'Video',       Icon: Film,   color: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30' },
};

// ── Pipeline constants ────────────────────────────────────────────────────────

const PIPELINE_ORDER: PipelineNodeId[] = [
  'context_injection',
  'routing',
  'generating_assets',
  'verifying',
];

const MAX_CHARS = 1000;

// ── Shared animation preset ───────────────────────────────────────────────────

const fadeUp = {
  initial:    { opacity: 0, y: 14 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -8 },
  transition: { duration: 0.32, ease: 'easeOut' as const },
};

// ── Pure helpers ──────────────────────────────────────────────────────────────

function getNodeStatus(
  nodeId:   PipelineNodeId,
  stage:    PipelineStage,
  lastGood: PipelineNodeId | null,
): NodeStatus {
  if (stage === 'idle')     return 'pending';
  if (stage === 'complete') return 'done';

  if (stage === 'error') {
    const lastIdx = lastGood ? PIPELINE_ORDER.indexOf(lastGood) : -1;
    const nodeIdx = PIPELINE_ORDER.indexOf(nodeId);
    if (nodeIdx < lastIdx)   return 'done';
    if (nodeIdx === lastIdx) return 'error';
    return 'pending';
  }

  const stageIdx = PIPELINE_ORDER.indexOf(stage as PipelineNodeId);
  const nodeIdx  = PIPELINE_ORDER.indexOf(nodeId);
  if (stageIdx === -1)        return 'pending';
  if (nodeIdx < stageIdx)     return 'done';
  if (nodeIdx === stageIdx)   return 'active';
  return 'pending';
}

function sanitizeSvg(raw: string): string {
  if (!raw.includes('<svg')) return '';
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=/gi, ' data-blocked=')
    .replace(/javascript:/gi, 'blocked:');
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function ThemeBadge({ theme }: { theme: string }) {
  const map = {
    dark:   { dot: 'bg-neutral-400',  label: 'Dark' },
    light:  { dot: 'bg-yellow-300',   label: 'Light' },
    custom: { dot: 'bg-purple-400',   label: 'Custom' },
  } as const;
  const v = map[theme as keyof typeof map] ?? map.dark;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-[11px] font-medium text-neutral-300">
      <span className={`w-2 h-2 rounded-full shrink-0 ${v.dot}`} />
      {v.label}
    </span>
  );
}

function HexSwatch({ hex }: { hex: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [hex]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : hex}
      className="group flex items-center gap-2 text-[11px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors w-full"
    >
      <span
        className="w-6 h-6 rounded-md ring-1 ring-white/10 shrink-0 group-hover:ring-white/25 transition-all bg-[var(--swatch-color)]"
        style={{ '--swatch-color': hex } as React.CSSProperties}
      />
      <span className="truncate">{hex}</span>
      {copied && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
    </button>
  );
}

function ToneBadge({ tone }: { tone: string }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] italic text-purple-300">
      {tone}
    </span>
  );
}

interface SidebarProps {
  context:        ProjectContext;
  injectedStyles: Record<string, string> | undefined;
}

const ContextSidebar = memo(function ContextSidebar({ context, injectedStyles }: SidebarProps) {
  const hasInjected = injectedStyles && Object.keys(injectedStyles).length > 0;
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-neutral-800/80 overflow-hidden bg-neutral-950/60">
      <div className="p-4 border-b border-neutral-800/60 shrink-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Workspace Context</p>
      </div>
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        <section className="space-y-2">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-neutral-600">Theme</p>
          <ThemeBadge theme={context.current_theme} />
        </section>
        <section className="space-y-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-neutral-600">Brand Colors</p>
          {context.brand_colors.length > 0 ? (
            <div className="space-y-2">
              {context.brand_colors.map(hex => <HexSwatch key={hex} hex={hex} />)}
            </div>
          ) : (
            <p className="text-[11px] text-neutral-700 italic">No palette configured</p>
          )}
        </section>
        <section className="space-y-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-neutral-600">Typography</p>
          <p className="text-xs font-semibold text-neutral-300 font-mono">{context.typography_style.fontFamily}</p>
          <div className="flex flex-wrap gap-1">
            {context.typography_style.weights.map(w => (
              <span key={w} className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700/80 text-[10px] font-mono text-neutral-500">
                {w}
              </span>
            ))}
          </div>
        </section>
        <section className="space-y-2">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-neutral-600">Brand Tone</p>
          <ToneBadge tone={context.existing_page_tone} />
        </section>
        <div className="border-t border-neutral-800/60" />
        <section className="space-y-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-neutral-600 flex items-center gap-1.5">
            <Zap className="w-2.5 h-2.5 text-yellow-500/70" />
            Injected Styles
          </p>
          {hasInjected ? (
            <div className="space-y-1.5">
              {Object.entries(injectedStyles!).map(([token, value]) => (
                <div key={token} className="rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2">
                  <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-wide mb-0.5">{token}</p>
                  <p className="text-[11px] text-neutral-300 font-medium truncate">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-neutral-700 italic">Populated after generation</p>
          )}
        </section>
      </div>
    </aside>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// IDLE HINT
// ─────────────────────────────────────────────────────────────────────────────

const IdleHint = memo(function IdleHint() {
  return (
    <motion.div {...fadeUp} className="flex flex-col items-center py-14 text-center">
      <motion.div
        animate={{ scale: [1, 1.07, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut' }}
        className="w-14 h-14 rounded-full bg-violet-500/5 border border-violet-500/15 flex items-center justify-center mb-5"
      >
        <Sparkles className="w-5 h-5 text-violet-500/50" />
      </motion.div>
      <p className="text-sm font-medium text-neutral-600">Ready to orchestrate</p>
      <p className="text-xs text-neutral-700 mt-1.5 max-w-xs leading-relaxed">
        Describe your creative vision above — the AI routes your request to the right generation agents automatically
      </p>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION TRACKER
// ─────────────────────────────────────────────────────────────────────────────

const PipelineNode = memo(function PipelineNode({ label, status }: { label: string; status: NodeStatus }) {
  const ringClass = {
    done:    'bg-emerald-500/15 border-emerald-500 text-emerald-400',
    active:  'bg-violet-500/15 border-violet-500 text-violet-300',
    error:   'bg-red-500/15 border-red-500 text-red-400',
    pending: 'bg-neutral-900 border-neutral-800 text-neutral-700',
  }[status];

  const labelClass = {
    done: 'text-emerald-400', active: 'text-violet-300', error: 'text-red-400', pending: 'text-neutral-600',
  }[status];

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <motion.div
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${ringClass}`}
        animate={
          status === 'active'
            ? {
                scale:     [1, 1.1, 1],
                boxShadow: ['0 0 0px rgba(139,92,246,0)', '0 0 18px rgba(139,92,246,0.35)', '0 0 0px rgba(139,92,246,0)'],
              }
            : { scale: 1, boxShadow: '0 0 0px rgba(0,0,0,0)' }
        }
        transition={
          status === 'active'
            ? { repeat: Infinity, duration: 1.7, ease: 'easeInOut' }
            : { duration: 0.25 }
        }
      >
        {status === 'done'    && <Check   className="w-4 h-4" />}
        {status === 'active'  && <Loader2 className="w-4 h-4 animate-spin" />}
        {status === 'error'   && <X       className="w-4 h-4" />}
        {status === 'pending' && <span    className="w-2 h-2 rounded-full bg-neutral-700" />}
      </motion.div>
      <span className={`text-[9px] font-semibold uppercase tracking-wide text-center leading-tight max-w-16 transition-colors duration-300 ${labelClass}`}>
        {label}
      </span>
    </div>
  );
});

const PipelineConnector = memo(function PipelineConnector({ lit }: { lit: boolean }) {
  return (
    <div className="relative h-px flex-1 min-w-4 rounded-full mt-5 bg-neutral-800 overflow-hidden">
      <motion.div
        className="absolute inset-0 rounded-full bg-linear-to-r from-violet-500/60 to-violet-400/20 origin-left"
        animate={{ scaleX: lit ? 1 : 0 }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
      />
    </div>
  );
});

const AgentNode = memo(function AgentNode({ agent, status }: { agent: AgentKey; status: NodeStatus }) {
  const m = AGENT_META[agent];
  const ringClass =
    status === 'done'   ? 'bg-emerald-500/15 border-emerald-500' :
    status === 'active' ? `${m.bg} ${m.border}` :
    'bg-neutral-900 border-neutral-800';
  const iconClass  = status === 'done' ? 'text-emerald-400' : status === 'active' ? m.color : 'text-neutral-700';
  const labelClass = status === 'done' ? 'text-emerald-400' : status === 'active' ? m.color : 'text-neutral-600';

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <motion.div
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${ringClass}`}
        animate={status === 'active' ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={status === 'active' ? { repeat: Infinity, duration: 1.7, ease: 'easeInOut' } : { duration: 0.25 }}
      >
        {status === 'done'
          ? <Check className="w-4 h-4 text-emerald-400" />
          : <m.Icon className={`w-4 h-4 transition-colors ${iconClass}`} />}
      </motion.div>
      <span className={`text-[9px] font-semibold uppercase tracking-wide text-center leading-tight max-w-16 transition-colors duration-300 ${labelClass}`}>
        {m.label}
      </span>
    </div>
  );
});

interface TrackerProps {
  stage:        PipelineStage;
  activeAgents: AgentKey[];
  lastGood:     PipelineNodeId | null;
}

const ExecutionTracker = memo(function ExecutionTracker({ stage, activeAgents, lastGood }: TrackerProps) {
  const afterRouting = ['generating_assets', 'verifying', 'complete'].includes(stage);
  const afterAgents  = ['verifying', 'complete'].includes(stage);
  const agentStatus: NodeStatus =
    stage === 'complete'          ? 'done'   :
    stage === 'generating_assets' ? 'active' :
    'pending';

  return (
    <motion.div {...fadeUp} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
      <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mb-5">Pipeline Execution</p>

      <div className="flex items-start gap-1.5 overflow-x-auto pb-1">
        <PipelineNode label="Context Injection" status={getNodeStatus('context_injection', stage, lastGood)} />
        <PipelineConnector lit={['routing', 'generating_assets', 'verifying', 'complete', 'error'].includes(stage)} />
        <PipelineNode label="Router Eval"       status={getNodeStatus('routing', stage, lastGood)} />

        {activeAgents.length > 0 && (
          <>
            <PipelineConnector lit={afterRouting} />
            <div className="flex items-start gap-3">
              {activeAgents.map(a => <AgentNode key={a} agent={a} status={agentStatus} />)}
            </div>
            <PipelineConnector lit={afterAgents} />
          </>
        )}

        <PipelineNode label="Verifying" status={getNodeStatus('verifying', stage, lastGood)} />
      </div>

      {activeAgents.length > 0 && afterRouting && (
        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-wrap gap-2">
          {activeAgents.map(agent => {
            const m = AGENT_META[agent];
            return (
              <span key={agent} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${m.bg} ${m.border} ${m.color}`}>
                <m.Icon className="w-3 h-3" />
                {m.label}
              </span>
            );
          })}
        </div>
      )}
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ERROR BANNER
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorBannerProps {
  error:   string;
  onRetry: () => void;
}

const ErrorBanner = memo(function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/5 px-4 py-4"
    >
      <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-red-300 mb-0.5">Generation Failed</p>
        <p className="text-[11px] text-red-400/80 leading-relaxed">{error}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[10px] font-medium text-red-300 hover:text-red-200 transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        Retry
      </button>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// RESULT CARDS
// ─────────────────────────────────────────────────────────────────────────────

const VectorCard = memo(function VectorCard({ result }: { result: VectorResult }) {
  const safe = sanitizeSvg(result.svg);

  const handleDownload = useCallback(() => {
    const blob = new Blob([result.svg], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'heartcraft-vector.svg' });
    a.click();
    URL.revokeObjectURL(url);
  }, [result.svg]);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Shapes className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-neutral-300">Vector Art</span>
          <span className="px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-[9px] font-mono text-violet-400 uppercase tracking-wide">SVG</span>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[11px] text-neutral-300 hover:text-neutral-100 transition-colors"
        >
          <Download className="w-3 h-3" />
          Download
        </button>
      </div>
      <div className="p-8 bg-[radial-gradient(ellipse_at_center,#15131f_0%,#0a0a0a_100%)] flex items-center justify-center min-h-72">
        {safe ? (
          // isolate creates a new stacking context; overflow-hidden hard-clips any bleeding layout
          <div
            className="isolate overflow-hidden w-full max-w-xs aspect-square rounded-xl [&>svg]:block [&>svg]:w-full [&>svg]:h-full drop-shadow-2xl"
            dangerouslySetInnerHTML={{ __html: safe }}
          />
        ) : (
          <p className="text-sm text-neutral-600 italic">SVG could not be rendered safely</p>
        )}
      </div>
    </div>
  );
});

const CopyCard = memo(function CopyCard({ result, tone }: { result: CopywritingResult; tone: string }) {
  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(result.content);
    toast.success('Copied to clipboard', { duration: 1800 });
  }, [result.content]);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800">
        <Type className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold text-neutral-300">Copywriting</span>
        <ToneBadge tone={tone} />
        <button
          type="button"
          onClick={handleCopy}
          title="Copy to clipboard"
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
      </div>
      <div className="p-5 flex-1">
        <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap font-light">{result.content}</p>
      </div>
    </div>
  );
});

const AudioCard = memo(function AudioCard({ result }: { result: AudioResult }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800">
        <Music className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-neutral-300">Audio Track</span>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400">
          Replicate · MusicGen
        </span>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-neutral-200 line-clamp-2">{result.title}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">{result.durationSec}s · MP3 · Stereo</p>
        </div>
        <audio
          controls
          src={result.url}
          className="w-full h-10 rounded-lg accent-emerald-500"
        />
        <a
          href={result.url}
          download="heartcraft-track.mp3"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[11px] text-neutral-300 hover:text-neutral-100 transition-colors"
        >
          <Download className="w-3 h-3" />
          Download MP3
        </a>
      </div>
    </div>
  );
});

const VoiceCard = memo(function VoiceCard({ result }: { result: VoiceResult }) {
  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(result.script);
    toast.success('Script copied', { duration: 1800 });
  }, [result.script]);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-neutral-300">Voice Narration</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono text-amber-400">
            Replicate · Bark
          </span>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy script"
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[9px] text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <Copy className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap font-light">{result.script}</p>
        <audio
          controls
          src={result.url}
          className="w-full h-10 rounded-lg accent-amber-500"
        />
        <a
          href={result.url}
          download="heartcraft-narration.wav"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[11px] text-neutral-300 hover:text-neutral-100 transition-colors"
        >
          <Download className="w-3 h-3" />
          Download WAV
        </a>
      </div>
    </div>
  );
});

const VideoCard = memo(function VideoCard({ result }: { result: VideoResult }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800">
        <Film className="w-4 h-4 text-rose-400" />
        <span className="text-xs font-semibold text-neutral-300">Generated Video</span>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-mono text-rose-400">
          Replicate · Minimax
        </span>
      </div>
      <div className="p-5 space-y-4">
        {result.description && (
          <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-3">{result.description}</p>
        )}
        <video
          controls
          src={result.url}
          playsInline
          className="w-full rounded-xl bg-black aspect-video"
        />
        <a
          href={result.url}
          download="heartcraft-video.mp4"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[11px] text-neutral-300 hover:text-neutral-100 transition-colors"
        >
          <Download className="w-3 h-3" />
          Download MP4
        </a>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ASSET CANVAS
// ─────────────────────────────────────────────────────────────────────────────

interface AssetCanvasProps {
  payload: OrchestrationPayload;
  tone:    string;
}

const AssetCanvas = memo(function AssetCanvas({ payload, tone }: AssetCanvasProps) {
  const entries = useMemo(
    () => (Object.entries(payload.agent_results ?? {}) as [AgentKey, SubAgentResult][]),
    [payload.agent_results],
  );
  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600">Generated Assets</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map(([key, result], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.09, ease: 'easeOut' }}
            className={result.agent === 'vector' ? 'md:col-span-2' : ''}
          >
            {result.agent === 'vector'     && <VectorCard result={result} />}
            {result.agent === 'copywriter' && <CopyCard   result={result} tone={tone} />}
            {result.agent === 'audio'      && <AudioCard  result={result} />}
            {result.agent === 'voice'      && <VoiceCard  result={result} />}
            {result.agent === 'video'      && <VideoCard  result={result} />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

interface WorkspaceClientProps {
  projectId:      string;
  projectTitle:   string;
  projectContext: ProjectContext;
}

export default function WorkspaceClient({ projectTitle, projectContext }: WorkspaceClientProps) {
  const { credits, deductCredits } = useCredits();

  const [prompt,       setPrompt]       = useState('');
  const [stage,        setStage]        = useState<PipelineStage>('idle');
  const [activeAgents, setActiveAgents] = useState<AgentKey[]>([]);
  const [payload,      setPayload]      = useState<OrchestrationPayload | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const lastGoodRef = useRef<PipelineNodeId | null>(null);
  const abortRef    = useRef<AbortController | null>(null);

  // Abort in-flight fetch if the component unmounts mid-generation.
  useEffect(() => { return () => { abortRef.current?.abort(); }; }, []);

  const isProcessing = !['idle', 'complete', 'error'].includes(stage);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isProcessing) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setPayload(null);
    setActiveAgents([]);

    // ── Stage 1: Context injection (cosmetic delay while signals propagate) ─
    setStage('context_injection');
    lastGoodRef.current = 'context_injection';
    await sleep(700);
    if (controller.signal.aborted) return;

    // ── Stage 2: Router call ───────────────────────────────────────────────
    setStage('routing');
    lastGoodRef.current = 'routing';

    try {
      const res = await fetch('/api/orchestrate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rawPrompt: prompt, projectContext }),
        signal:  controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Server responded ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = await res.json() as OrchestrationPayload & { error?: string };

      if (!data.success) {
        setError(data.error ?? 'The router could not determine a valid generation plan.');
        setStage('error');
        return;
      }

      // ── Stage 3: Animate asset generation ─────────────────────────────────
      setActiveAgents(data.target_agents ?? []);
      setStage('generating_assets');
      lastGoodRef.current = 'generating_assets';
      await sleep(700);
      if (controller.signal.aborted) return;

      // ── Stage 4: Verification pass ─────────────────────────────────────────
      setStage('verifying');
      lastGoodRef.current = 'verifying';
      await sleep(450);
      if (controller.signal.aborted) return;

      // Credits deducted only on a successful generation.
      deductCredits(10);
      setPayload(data);
      setStage('complete');

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setStage('error');
    }
  }, [prompt, projectContext, isProcessing, deductCredits]);

  const handleReset = useCallback(() => {
    setStage('idle');
    setError(null);
    setActiveAgents([]);
    setPayload(null);
  }, []);

  const charCount   = prompt.length;
  const charPct     = Math.min(charCount / MAX_CHARS, 1);
  const isNearLimit = charPct > 0.8;

  return (
    <>
      <Toaster theme="dark" position="bottom-right" />

      <div className="h-screen bg-neutral-950 text-neutral-200 flex flex-col">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="h-12 shrink-0 border-b border-neutral-800/80 flex items-center px-4 gap-3 bg-neutral-950/90 backdrop-blur-sm z-20">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>

          <div className="w-px h-3.5 bg-neutral-800 shrink-0" />
          <p className="text-xs font-semibold text-neutral-300 truncate flex-1 min-w-0">{projectTitle}</p>

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-neutral-600">
            <span className="px-1.5 py-0.5 rounded bg-neutral-800/80 border border-neutral-700/60 font-mono">
              Gemini 2.5 Flash
            </span>
            <span className="text-neutral-700">·</span>
            <span className="px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 font-mono text-violet-500/70">
              OpenRouter
            </span>
          </div>

          <div className="w-px h-3.5 bg-neutral-800 shrink-0" />

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] shrink-0">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="font-semibold text-neutral-300">{credits}</span>
            <span className="text-neutral-600">credits</span>
          </div>
        </header>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <ContextSidebar context={projectContext} injectedStyles={payload?.injected_styles} />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

              {/* ── Studio Command Input ──────────────────────────────────── */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
                <div className="px-4 pt-4 pb-3 space-y-3">
                  <h1 className="text-sm font-semibold text-neutral-200">Studio Command</h1>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleGenerate();
                    }}
                    placeholder="Describe your creative vision — the orchestrator automatically routes it to the right agents…"
                    rows={5}
                    maxLength={MAX_CHARS}
                    disabled={isProcessing}
                    className="w-full bg-neutral-900 border border-neutral-700/80 text-neutral-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  />

                  {/* Character progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-0.5 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full origin-left ${isNearLimit ? 'bg-amber-500' : 'bg-violet-500/40'}`}
                        animate={{ scaleX: charPct }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </div>
                    <span className={`text-[10px] font-mono transition-colors shrink-0 ${isNearLimit ? 'text-amber-500' : 'text-neutral-700'}`}>
                      {charCount}/{MAX_CHARS}
                    </span>
                    <span className="text-[10px] text-neutral-700 hidden sm:block">⌘ + Enter</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 pb-4 gap-3">
                  {(stage === 'complete' || stage === 'error') && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs text-neutral-300 hover:text-neutral-100 transition-colors"
                    >
                      New Generation
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleGenerate()}
                    disabled={!prompt.trim() || isProcessing}
                    className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-purple-900/25 hover:shadow-purple-800/35 hover:shadow-xl shrink-0"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate
                        <span className="px-1.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold tracking-wide">10 ✦</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ── Pipeline Tracker ─────────────────────────────────────── */}
              <AnimatePresence>
                {stage !== 'idle' && (
                  <ExecutionTracker
                    key="tracker"
                    stage={stage}
                    activeAgents={activeAgents}
                    lastGood={lastGoodRef.current}
                  />
                )}
              </AnimatePresence>

              {/* ── Error Banner ──────────────────────────────────────────── */}
              <AnimatePresence>
                {stage === 'error' && error && (
                  <ErrorBanner
                    key="error"
                    error={error}
                    onRetry={() => void handleGenerate()}
                  />
                )}
              </AnimatePresence>

              {/* ── Idle Hint / Asset Canvas (mutually exclusive) ─────────── */}
              <AnimatePresence mode="wait">
                {stage === 'idle' && <IdleHint key="idle" />}
                {stage === 'complete' && payload && (
                  <AssetCanvas key="assets" payload={payload} tone={projectContext.existing_page_tone} />
                )}
              </AnimatePresence>

            </div>
          </main>
        </div>

      </div>
    </>
  );
}

'use client';

interface AudioBlockPlayerProps {
  audioUrl?: string;
  isSelected?: boolean;
}

function getTrackLabel(url?: string): string {
  if (!url) return 'No audio loaded';
  if (url.startsWith('blob:')) return 'Uploaded Audio';
  try {
    const path = new URL(url).pathname;
    const name = path.split('/').pop()?.split('?')[0];
    return name ? decodeURIComponent(name) : 'Audio Track';
  } catch {
    return 'Audio Track';
  }
}

export default function AudioBlockPlayer({ audioUrl, isSelected }: AudioBlockPlayerProps) {
  const trackLabel = getTrackLabel(audioUrl);
  const hasAudio = !!audioUrl;

  return (
    <div
      className={`w-full cursor-pointer rounded-2xl border transition-all duration-300 ${
        isSelected
          ? 'border-purple-500/50 shadow-[0_0_24px_rgba(168,85,247,0.2)]'
          : 'border-white/8 hover:border-white/15'
      }`}
    >
      {/* Glassmorphism card */}
      <div className="bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4">

        {/* Play button visual */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
          hasAudio
            ? 'bg-purple-600/85 border border-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
            : 'bg-neutral-800/80 border border-neutral-700/50'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
            className={`w-4 h-4 ml-0.5 ${hasAudio ? 'text-white' : 'text-neutral-600'}`}
          >
            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0 space-y-2">
          <p className={`text-xs font-semibold truncate ${hasAudio ? 'text-white/90' : 'text-neutral-500'}`}>
            {trackLabel}
          </p>
          {/* Progress bar visual */}
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${
              hasAudio ? 'w-2/5 bg-purple-500/70' : 'w-0'
            }`} />
          </div>
          {/* Mini waveform dots */}
          <div className="flex items-end gap-px h-3">
            {[2,4,6,3,5,4,6,3,4,5,3,6,4,3,5,4,6,3,5,4,3,6,4,5].map((h, i) => (
              <div
                key={i}
                className={`w-px rounded-full flex-none transition-all ${
                  hasAudio
                    ? i < 10 ? 'bg-purple-400/60' : 'bg-white/15'
                    : 'bg-white/10'
                }`}
                style={{ height: `${h * 2}px` }}
              />
            ))}
          </div>
        </div>

        {/* Duration placeholder */}
        <div className="shrink-0 text-right">
          <span className="text-[10px] text-white/25 tabular-nums block">0:00</span>
          {hasAudio && (
            <span className="text-[9px] text-purple-400/60 uppercase tracking-wider mt-0.5 block">
              Audio
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

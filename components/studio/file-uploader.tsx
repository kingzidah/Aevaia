"use client";

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FileUploaderProps {
  /** Called with an array of blob object-URLs for each accepted file */
  onFiles:    (urls: string[]) => void;
  multiple?:  boolean;
  /** Tailwind classes forwarded to the root drop-zone div */
  className?: string;
  /** Compact variant — smaller padding, used when embedded inside other components */
  compact?:   boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function filesToObjectUrls(files: FileList | File[]): string[] {
  return Array.from(files)
    .filter(f => f.type.startsWith("image/"))
    .map(f => URL.createObjectURL(f));
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function FileUploader({
  onFiles,
  multiple  = true,
  className = "",
  compact   = false,
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const urls = filesToObjectUrls(files);
    if (urls.length > 0) onFiles(urls);
  }, [onFiles]);

  // ── Drag events ───────────────────────────────────────────────────────────

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate when leaving the drop-zone itself, not a child
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragActive(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  // ── File picker ───────────────────────────────────────────────────────────

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      e.target.value = ""; // allow re-selecting the same files
    }
  };

  const padClass = compact ? "py-4 px-3" : "py-8 px-6";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload images — drag and drop or click to browse"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      className={[
        "relative w-full flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed transition-all duration-200 cursor-pointer select-none outline-none",
        isDragActive
          ? "border-emerald-500/60 bg-emerald-500/8 scale-[1.01]"
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900/80",
        padClass,
        className,
      ].join(" ")}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept="image/*"
        onChange={onChange}
        className="sr-only"
        tabIndex={-1}
      />

      {/* Upload icon */}
      <div className={`flex items-center justify-center rounded-full transition-colors ${
        compact ? "w-10 h-10" : "w-14 h-14"
      } ${
        isDragActive
          ? "bg-emerald-500/15 border border-emerald-500/30"
          : "bg-zinc-800 border border-zinc-700"
      }`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.6}
          stroke="currentColor"
          className={`${compact ? "w-5 h-5" : "w-6 h-6"} ${isDragActive ? "text-emerald-400" : "text-zinc-500"} transition-colors`}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>

      {/* Copy */}
      <div className="text-center space-y-1">
        <p className={`font-semibold ${compact ? "text-xs" : "text-sm"} ${isDragActive ? "text-emerald-300" : "text-zinc-300"} transition-colors`}>
          {isDragActive ? "Release to upload" : "Drop images here"}
        </p>
        {!compact && (
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            or <span className="text-emerald-400/80 underline underline-offset-2">click to browse</span>
            {" "}— JPG, PNG, WebP, GIF
          </p>
        )}
      </div>

      {/* Drag-active shimmer ring */}
      {isDragActive && (
        <div className="absolute inset-0 rounded-2xl border border-emerald-500/40 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Block {
  id: string;
  type: string;
  content?: string;
  targetDate?: string;
  images?: string[];
}

interface Scene {
  id: string;
  name: string;
  blocks: Block[];
}

interface SceneNavigatorProps {
  scenes: Scene[];
  activeSceneId: string;
  onSceneChange: (sceneId: string) => void;
  onAddScene: () => void;
  onDeleteScene: (sceneId: string) => void;
  onRenameScene: (sceneId: string, newName: string) => void;
  onDuplicateScene: (sceneId: string) => void;
}

export default function SceneNavigator({
  scenes,
  activeSceneId,
  onSceneChange,
  onAddScene,
  onDeleteScene,
  onRenameScene,
  onDuplicateScene,
}: SceneNavigatorProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  // Portal: anchor position captured at click-time via getBoundingClientRect()
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  // createPortal is client-only; this guard prevents calling it during SSR.
  // No state needed — portals don't affect the hydrated HTML tree.
  const canPortal = typeof window !== "undefined";

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Close menu if the navigator is scrolled (anchor becomes stale)
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenuId]);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, sceneId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuAnchor({ top: rect.top, right: window.innerWidth - rect.right });
    setOpenMenuId(prev => (prev === sceneId ? null : sceneId));
  };

  const startRename = (scene: Scene) => {
    setOpenMenuId(null);
    setRenameValue(scene.name);
    setRenamingId(scene.id);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameScene(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  // Derive the scene whose menu is open (used inside the portal)
  const openMenuScene = scenes.find(s => s.id === openMenuId) ?? null;

  return (
    <div className="relative w-full h-32 bg-zinc-950 border-t border-zinc-800 flex items-center px-6 gap-4 overflow-x-auto shrink-0">

      {/* ── Portal: context menu rendered at document.body level ── */}
      {canPortal && createPortal(
        <>
          {/* Invisible full-screen backdrop to close menu on outside click */}
          {openMenuId && (
            <div
              className="fixed inset-0 z-9998"
              onClick={() => setOpenMenuId(null)}
            />
          )}

          {/* The floating menu — z-9999, positioned above the navigator */}
          <AnimatePresence>
            {openMenuId && menuAnchor && openMenuScene && (
              <motion.div
                key={openMenuId}
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 8 }}
                transition={{ duration: 0.13, ease: [0.32, 0.72, 0, 1] }}
                style={{
                  position: "fixed",
                  // Open ABOVE the button (navigator is at screen bottom)
                  bottom: window.innerHeight - menuAnchor.top + 6,
                  right: menuAnchor.right,
                  zIndex: 9999,
                  width: 148,
                }}
                className="bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-[0_-4px_40px_rgba(0,0,0,0.7),0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Rename */}
                <button
                  type="button"
                  onClick={() => startRename(openMenuScene)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                  Rename
                </button>

                {/* Duplicate */}
                <button
                  type="button"
                  onClick={() => { onDuplicateScene(openMenuScene.id); setOpenMenuId(null); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                  Duplicate
                </button>

                {/* Delete — only when more than one scene exists */}
                {scenes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => { onDeleteScene(openMenuScene.id); setOpenMenuId(null); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border-t border-neutral-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}

      {/* ── Scene thumbnails ── */}
      <div className="flex gap-3 items-center">
        {scenes.map((scene, index) => (
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="relative group"
          >
            {/* Thumbnail: div (rename mode) or button (idle mode) */}
            {renamingId === scene.id ? (
              <div
                className={`relative w-40 h-20 rounded-xl border-2 flex flex-col items-center justify-center overflow-hidden ${
                  activeSceneId === scene.id
                    ? "border-purple-500 bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    : "border-neutral-800 bg-neutral-900"
                }`}
              >
                <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold select-none ${activeSceneId === scene.id ? "bg-purple-500 text-white" : "bg-neutral-700 text-neutral-400"}`}>
                  {index + 1}
                </div>
                <div className="flex flex-col items-center justify-center gap-1 px-7 w-full">
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    aria-label="Scene name"
                    title="Scene name"
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="w-full text-center text-xs bg-black/60 border border-purple-500 rounded-md px-1 py-0.5 text-white outline-none"
                  />
                </div>
                {activeSceneId === scene.id && (
                  <motion.div layoutId="activeScene" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSceneChange(scene.id)}
                className={`relative w-40 h-20 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden ${
                  activeSceneId === scene.id
                    ? "border-purple-500 bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    : "border-neutral-800 bg-neutral-900 hover:border-neutral-700 hover:bg-neutral-800/80"
                }`}
              >
                <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold select-none ${activeSceneId === scene.id ? "bg-purple-500 text-white" : "bg-neutral-700 text-neutral-400"}`}>
                  {index + 1}
                </div>
                <div className="flex flex-col items-center justify-center gap-1 px-7 w-full">
                  <span className={`text-xs font-medium truncate max-w-25 select-none ${activeSceneId === scene.id ? "text-purple-200" : "text-neutral-400"}`}>
                    {scene.name}
                  </span>
                  <span className="text-[10px] text-neutral-600 select-none">
                    {scene.blocks.length} block{scene.blocks.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {activeSceneId === scene.id && (
                  <motion.div layoutId="activeScene" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                )}
              </button>
            )}

            {/* Three-dot trigger — z-40 keeps it above the thumbnail but below the portal */}
            <div className="absolute top-1.5 right-1.5 z-40">
              <button
                type="button"
                onClick={e => openMenu(e, scene.id)}
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all bg-black/50 hover:bg-neutral-700 border border-transparent hover:border-neutral-600 text-neutral-500 hover:text-white ${
                  openMenuId === scene.id
                    ? "opacity-100 bg-neutral-700 border-neutral-600 text-white"
                    : "opacity-0 group-hover:opacity-100"
                }`}
                aria-label="Scene options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}

        {/* Add scene */}
        <motion.button
          type="button"
          onClick={onAddScene}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="w-40 h-20 rounded-xl border-2 border-dashed border-neutral-800 bg-neutral-900/40 hover:border-purple-500/60 hover:bg-purple-500/8 transition-all duration-300 flex flex-col items-center justify-center gap-2 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-neutral-600 group-hover:text-purple-400 transition-colors">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-xs text-neutral-600 group-hover:text-purple-400 transition-colors font-medium select-none">
            Add Scene
          </span>
        </motion.button>
      </div>

      {/* Timeline info */}
      <div className="ml-auto flex items-center gap-3 text-xs text-neutral-600 shrink-0">
        <span>{scenes.length} Scene{scenes.length !== 1 ? "s" : ""}</span>
        <span className="text-neutral-800">·</span>
        <span className="text-[10px]">Hover for options</span>
      </div>
    </div>
  );
}

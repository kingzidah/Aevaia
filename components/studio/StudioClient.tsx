"use client";

import { useState, useCallback, useEffect } from "react";
import TopNav        from "@/components/studio/TopNav";
import LeftSidebar   from "@/components/studio/LeftSidebar";
import CanvasArea    from "@/components/studio/CanvasArea";
import RightSidebar  from "@/components/studio/RightSidebar";
import BottomToolbar from "@/components/studio/BottomToolbar";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tool = "select" | "hand" | "comment";

export interface CanvasElement {
  id:               string;
  type:             string;
  name:             string;
  backgroundColor?: string;
  borderRadius?:    string;
  paddingTop?:      string;
  paddingRight?:    string;
  paddingBottom?:   string;
  paddingLeft?:     string;
  text?:            string;
  fontSize?:        string;
  fontWeight?:      string;
  textAlign?:       string;
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function StudioClient() {
  const [activeItem,     setActiveItem]     = useState<string | null>(null);
  const [zoom,           setZoom]           = useState(100);
  const [activeTool,     setActiveTool]     = useState<Tool>("select");
  const [theme,          setTheme]          = useState<"dark" | "light">("dark");
  const [canvasElements,   setCanvasElements]   = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const handleAddElement = useCallback((type: string) => {
    setCanvasElements(prev => [
      ...prev,
      { id: crypto.randomUUID(), type, name: `${type} Block` },
    ]);
  }, []);

  const updateElement = useCallback((id: string, newProperties: Partial<CanvasElement>) => {
    setCanvasElements(prev =>
      prev.map(el => el.id === id ? { ...el, ...newProperties } : el)
    );
  }, []);

  const selectedElement = canvasElements.find(el => el.id === selectedElementId) ?? null;

  const handleDelete = useCallback(() => {
    setCanvasElements(prev => prev.filter(el => el.id !== selectedElementId));
    setSelectedElementId(null);
  }, [selectedElementId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      if (!selectedElementId) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      handleDelete();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedElementId, handleDelete]);

  return (
    <div className="flex flex-col h-screen bg-[#111111] overflow-hidden">
      <TopNav />

      <div className="flex flex-1 min-h-0">
        <LeftSidebar
          activeItem={activeItem}
          onItemClick={setActiveItem}
          onAddElement={handleAddElement}
        />
        <CanvasArea
          zoom={zoom}
          onZoomChange={setZoom}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          theme={theme}
          onThemeToggle={() => setTheme(t => t === "dark" ? "light" : "dark")}
          canvasElements={canvasElements}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
        />
        <RightSidebar
          selectedElement={selectedElement}
          updateElement={updateElement}
        />
      </div>

      <BottomToolbar />
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved";

export function useAutoSave({
  projectId,
  payload,
  enabled,
}: {
  projectId: string | null;
  payload: string;
  enabled: boolean;
}): { saveStatus: SaveStatus } {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Tracks whether we have already performed the "first enable" handshake.
  const hasEnabledRef      = useRef(false);
  // Payload value at the time of the last successful save (or first enable).
  const lastSyncedRef      = useRef("");
  // Debounce timer for the actual network request.
  const debounceRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timer that fades "saved" → "idle" after a short display window.
  const savedFadeRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      // When the hook is disabled (e.g. no projectId yet, or not loaded)
      // reset the "has enabled" flag so the next enable gets the skip treatment.
      hasEnabledRef.current = false;
      return;
    }

    // ── First enable: current payload is what's already on the server (loaded
    //    from DB by the hydration effect). Record it as synced and show "saved"
    //    briefly so the user gets a confirmation, then idle out.
    if (!hasEnabledRef.current) {
      hasEnabledRef.current  = true;
      lastSyncedRef.current  = payload;
      setSaveStatus("saved");
      savedFadeRef.current = setTimeout(() => setSaveStatus("idle"), 2500);
      return;
    }

    // ── Payload unchanged since last save — nothing to do.
    if (payload === lastSyncedRef.current) return;

    // ── Payload changed — mark as unsaved and start the debounce timer.
    setSaveStatus("unsaved");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (savedFadeRef.current) clearTimeout(savedFadeRef.current);

    debounceRef.current = setTimeout(() => {
      if (!projectId) return;
      setSaveStatus("saving");

      fetch("/api/project/save", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ projectId, canvasState: payload }),
      })
        .then((r) => {
          if (r.ok) {
            lastSyncedRef.current = payload;
            setSaveStatus("saved");
            savedFadeRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
          } else {
            setSaveStatus("unsaved");
          }
        })
        .catch(() => setSaveStatus("unsaved"));
    }, 2000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [payload, enabled, projectId]);

  return { saveStatus };
}

// ─────────────────────────────────────────────────────────────────────────────
// HeartCraft Canvas — Database Schema Types
//
// Defines the canonical shape that is persisted as JSONB in PostgreSQL and
// consumed by the viewer. These are the ground-truth types for the save/load
// contract between the editor and the database.
// ─────────────────────────────────────────────────────────────────────────────

export interface CanvasEnvironment {
  theme:       'dark' | 'light';
  aspectRatio: 'mobile' | 'desktop' | 'square';
  activeEffect: string | null;
  audioTrack:   string | null;
}

export interface CanvasBlock {
  id:        string;
  type:      'text' | 'image' | 'icon' | 'shape';
  x:         number;
  y:         number;
  width?:    number;
  height?:   number;
  rotation?: number;
  content:   string;
  styles: {
    color?:      string;
    fontSize?:   number;
    fontFamily?: string;
    opacity?:    number;
    blendMode?:  string;
  };
}

export interface MasterPayload {
  designId:    string;
  userId:      string;
  title:       string;
  isPublished: boolean;
  environment: CanvasEnvironment;
  blocks:      CanvasBlock[];
  createdAt:   string;
  updatedAt:   string;
}

// ── Default canvas state ───────────────────────────────────────────────────────

export const DEFAULT_CANVAS_STATE: MasterPayload = {
  designId:    "",
  userId:      "",
  title:       "Untitled Design",
  isPublished: false,
  environment: {
    theme:       "dark",
    aspectRatio: "mobile",
    activeEffect: null,
    audioTrack:   null,
  },
  blocks:    [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

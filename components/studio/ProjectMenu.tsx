"use client";

import { motion } from "framer-motion";
import {
  FilePlus,
  FolderOpen,
  Settings,
  Download,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

// ── Menu data ─────────────────────────────────────────────────────────────────

type MenuItem = {
  type:        "item";
  id:          string;
  label:       string;
  Icon:        React.ComponentType<{ className?: string }>;
  shortcut?:   string;
  SuffixIcon?: React.ComponentType<{ className?: string }>;
};

type MenuDivider = { type: "divider" };

type MenuEntry = MenuItem | MenuDivider;

const ENTRIES: MenuEntry[] = [
  { type: "item",    id: "new",      label: "New Project",     Icon: FilePlus,    shortcut: "Ctrl+N"  },
  { type: "item",    id: "open",     label: "Open...",         Icon: FolderOpen,  shortcut: "Ctrl+O"  },
  { type: "divider" },
  { type: "item",    id: "settings", label: "Settings",        Icon: Settings                         },
  { type: "item",    id: "export",   label: "Export",          Icon: Download,    shortcut: "Ctrl+E"  },
  { type: "divider" },
  { type: "item",    id: "help",     label: "Help & Feedback", Icon: HelpCircle,  SuffixIcon: ExternalLink },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProjectMenuProps {
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
// Outside-click is handled by TopNav (menuRef) — this component is purely visual.

export default function ProjectMenu({ onClose }: ProjectMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5,  scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 5,  scale: 0.97 }}
      transition={{ duration: 0.13, ease: [0.32, 0.72, 0, 1] }}
      className="absolute top-[calc(100%+6px)] left-0 w-56 bg-[#151515] border border-neutral-800 rounded-lg shadow-2xl p-1.5 z-50"
    >
      {ENTRIES.map((entry, i) => {
        if (entry.type === "divider") {
          return <div key={i} className="border-b border-neutral-800 my-1" />;
        }

        const { id, label, Icon, shortcut, SuffixIcon } = entry;

        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              console.log("[ProjectMenu]", label);
              onClose();
            }}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs text-neutral-300 hover:bg-[#222222] hover:text-white transition-colors cursor-pointer"
          >
            {/* Left: icon + label */}
            <div className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span>{label}</span>
            </div>

            {/* Right: shortcut text or suffix icon */}
            {shortcut && (
              <span className="text-[11px] font-mono text-neutral-600 ml-3">
                {shortcut}
              </span>
            )}
            {SuffixIcon && !shortcut && (
              <SuffixIcon className="w-3 h-3 text-neutral-600 ml-3 shrink-0" />
            )}
          </button>
        );
      })}
    </motion.div>
  );
}

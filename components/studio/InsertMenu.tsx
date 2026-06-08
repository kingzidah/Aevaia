"use client";

import { motion } from "framer-motion";
import {
  Search,
  Package,
  Wrench,
  Table2,
  Layers,
} from "lucide-react";

// ── Menu data ─────────────────────────────────────────────────────────────────

type MenuItem = {
  id:        string;
  label:     string;
  Icon?:     React.ComponentType<{ className?: string }>;
  iconBg?:   string;
  shortcut?: string;
};

type MenuSection = {
  heading: string;
  items:   MenuItem[];
};

const SECTIONS: MenuSection[] = [
  {
    heading: "Plugins",
    items: [
      { id: "browse-all",    label: "Browse All",    Icon: Package, iconBg: "bg-blue-600" },
      { id: "workshop",      label: "Workshop",      Icon: Wrench                          },
      { id: "google-sheets", label: "Google Sheets", Icon: Table2                          },
      { id: "dither",        label: "Dither",        Icon: Layers                          },
    ],
  },
  {
    heading: "Project",
    items: [
      { id: "create-page",      label: "Create Web Page"                              },
      { id: "create-component", label: "Create Component...", shortcut: "Ctrl+Alt+K"  },
      { id: "publish",          label: "Publish Website",     shortcut: "Ctrl+Shift+P" },
    ],
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface InsertMenuProps {
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
// Outside-click is intentionally handled by TopNav (via insertRef) to avoid
// the double-toggle race where clicking Insert would re-open the menu.

export default function InsertMenu({ onClose }: InsertMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6,  scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 6,  scale: 0.97 }}
      transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
      className="absolute top-[calc(100%+6px)] left-0 w-80 bg-[#151515] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50"
    >
      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-neutral-800/80">
        <Search size={13} className="text-neutral-500 shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          autoFocus
          className="flex-1 bg-transparent text-[13px] text-white placeholder:text-neutral-600 outline-none"
        />
      </div>

      {/* ── Sections ─────────────────────────────────────────────────────── */}
      <div className="p-1.5">
        {SECTIONS.map((section, si) => (
          <div
            key={section.heading}
            className={si > 0 ? "mt-1.5 pt-1 border-t border-neutral-800/50" : ""}
          >
            {/* Heading */}
            <div className="text-[10px] text-neutral-500 font-medium px-2 py-1 uppercase tracking-wide select-none">
              {section.heading}
            </div>

            {/* Items */}
            {section.items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  console.log("[InsertMenu]", item.label);
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-neutral-800/50 transition-colors cursor-pointer"
              >
                {/* Icon block — only rendered when Icon is defined */}
                {item.Icon && (
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      item.iconBg ?? "bg-neutral-800"
                    }`}
                  >
                    <item.Icon
                      className={`w-3.5 h-3.5 ${item.iconBg ? "text-white" : "text-neutral-400"}`}
                    />
                  </div>
                )}

                {/* Label */}
                <span className="flex-1 text-[13px] text-neutral-200 text-left leading-none">
                  {item.label}
                </span>

                {/* Keyboard shortcut */}
                {item.shortcut && (
                  <span className="text-[11px] font-mono text-neutral-600 shrink-0">
                    {item.shortcut}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

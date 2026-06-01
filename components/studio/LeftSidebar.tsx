"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ChevronRight, Plus, Play, Star } from "lucide-react";

// ── Sidebar data ──────────────────────────────────────────────────────────────

interface SidebarItem {
  id:          string;
  label:       string;
  iconBg:      string;
  iconContent: React.ReactNode;
}

interface SidebarGroup {
  label:   string;
  items:   SidebarItem[];
  divider: boolean;
}

const GROUPS: SidebarGroup[] = [
  {
    label: "Start",
    items: [
      {
        id: "wireframer", label: "Wireframer",
        iconBg: "bg-white",
        iconContent: <Plus size={11} className="text-neutral-900" strokeWidth={2.5} />,
      },
    ],
    divider: true,
  },
  {
    label: "Basics",
    items: [
      {
        id: "sections", label: "Sections",
        iconBg: "bg-neutral-700",
        iconContent: (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <rect x="0" y="0" width="11" height="1.5" rx="0.75" fill="white" />
            <rect x="0" y="3.5" width="11" height="1.5" rx="0.75" fill="white" />
            <rect x="0" y="7"   width="11" height="1.5" rx="0.75" fill="white" />
          </svg>
        ),
      },
      {
        id: "navigation", label: "Navigation",
        iconBg: "bg-neutral-700",
        iconContent: (
          <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
            <path d="M1 1.5L5.5 5.5L10 1.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        id: "menus", label: "Menus",
        iconBg: "bg-neutral-700",
        iconContent: (
          <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
            <rect x="0" y="0"   width="11" height="1.5" rx="0.75" fill="white" />
            <rect x="2" y="3.2" width="9"  height="1.5" rx="0.75" fill="white" />
            <rect x="4" y="6.5" width="7"  height="1.5" rx="0.75" fill="white" />
          </svg>
        ),
      },
    ],
    divider: true,
  },
  {
    label: "CMS",
    items: [
      {
        id: "collections", label: "Collections",
        iconBg: "bg-blue-500",
        iconContent: (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="1" y="1"   width="9" height="3" rx="1" fill="white" opacity="0.9" />
            <rect x="1" y="5.5" width="9" height="3" rx="1" fill="white" opacity="0.6" />
          </svg>
        ),
      },
      {
        id: "fields", label: "Fields",
        iconBg: "bg-blue-600",
        iconContent: <span className="text-[11px] font-bold text-white leading-none">T</span>,
      },
    ],
    divider: true,
  },
  {
    label: "Elements",
    items: [
      {
        id: "icons", label: "Icons",
        iconBg: "bg-blue-500",
        iconContent: <Star size={10} fill="white" className="text-white" />,
      },
      {
        id: "shaders", label: "Shaders",
        iconBg: "bg-indigo-500",
        iconContent: (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <circle cx="5.5" cy="5.5" r="1.8" fill="white" opacity="0.9" />
            <circle cx="2"   cy="2"   r="1"   fill="white" opacity="0.4" />
            <circle cx="9"   cy="2"   r="1"   fill="white" opacity="0.4" />
            <circle cx="2"   cy="9"   r="1"   fill="white" opacity="0.4" />
            <circle cx="9"   cy="9"   r="1"   fill="white" opacity="0.4" />
          </svg>
        ),
      },
      {
        id: "media", label: "Media",
        iconBg: "bg-emerald-500",
        iconContent: <Play size={10} fill="white" className="text-white" />,
      },
      {
        id: "forms", label: "Forms",
        iconBg: "bg-green-600",
        iconContent: (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="1" y="1"   width="9" height="2" rx="1"   fill="white" opacity="0.9" />
            <rect x="1" y="4.5" width="6" height="2" rx="1"   fill="white" opacity="0.9" />
            <rect x="8" y="4.5" width="2" height="2" rx="0.5" fill="white" opacity="0.5" />
            <rect x="1" y="8"   width="9" height="2" rx="1"   fill="white" opacity="0.6" />
          </svg>
        ),
      },
    ],
    divider: false,
  },
];

// ── Section preview cards ─────────────────────────────────────────────────────

interface CardProps {
  dark: boolean;
}

function HeroShapesCard({ dark }: CardProps) {
  const bg     = dark ? "bg-neutral-900"   : "bg-white";
  const border = dark ? "border-neutral-800" : "border-neutral-200";
  const title  = dark ? "text-white"       : "text-neutral-900";
  const sub    = dark ? "text-neutral-500" : "text-neutral-400";
  const img    = dark ? "bg-neutral-800"   : "bg-neutral-100";
  const shape  = dark ? "bg-neutral-700"   : "bg-neutral-300";

  return (
    <div className={`w-full rounded-xl border ${border} ${bg} p-3 overflow-hidden`}>
      <p className={`text-[8px] font-bold ${title}`}>Meet Aevaia</p>
      <p className={`text-[7px] ${sub} mb-2`}>Internet canvas.</p>
      <div className={`w-full rounded-lg ${img} flex items-center justify-center gap-3 py-4`}>
        <div className={`w-5 h-5 rounded-[3px] ${shape}`} />
        <div className={`w-5 h-5 rounded-full ${shape}`} />
        <div
          style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: dark ? "17px solid #404040" : "17px solid #d1d5db" }}
        />
      </div>
    </div>
  );
}

function HeroButtonsCard({ dark }: CardProps) {
  const bg     = dark ? "bg-neutral-900"   : "bg-white";
  const border = dark ? "border-neutral-800" : "border-neutral-200";
  const title  = dark ? "text-white"       : "text-neutral-900";
  const sub    = dark ? "text-neutral-500" : "text-neutral-400";
  const btnFill   = dark ? "bg-white text-neutral-900"   : "bg-neutral-900 text-white";
  const btnOutline = dark ? "border-neutral-700 text-neutral-300" : "border-neutral-300 text-neutral-700";

  return (
    <div className={`w-full rounded-xl border ${border} ${bg} p-3`}>
      <p className={`text-[8px] font-bold ${title}`}>Meet Aevaia</p>
      <p className={`text-[7px] ${sub} mb-2`}>Internet canvas.</p>
      <div className="flex items-center gap-1.5">
        <div className={`text-[7px] font-semibold px-2 py-0.5 rounded-full ${btnFill}`}>Sign Up</div>
        <div className={`text-[7px] font-medium px-2 py-0.5 rounded-full border ${btnOutline}`}>Download</div>
      </div>
    </div>
  );
}

function LogoRowCard({ dark }: CardProps) {
  const bg     = dark ? "bg-neutral-900"   : "bg-white";
  const border = dark ? "border-neutral-800" : "border-neutral-200";
  const text   = dark ? "text-neutral-400" : "text-neutral-500";
  const shape  = dark ? "bg-neutral-700"   : "bg-neutral-300";

  return (
    <div className={`w-full rounded-xl border ${border} ${bg} px-3 py-2.5 flex items-center justify-around`}>
      {[["rect","Logo"], ["circle","Logo"], ["tri","Logo"]].map(([t, lbl]) => (
        <div key={t} className="flex items-center gap-1">
          {t === "rect"   && <div className={`w-2.5 h-2.5 rounded-[2px] ${shape}`} />}
          {t === "circle" && <div className={`w-2.5 h-2.5 rounded-full ${shape}`} />}
          {t === "tri"    && (
            <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: dark ? "9px solid #404040" : "9px solid #d1d5db" }} />
          )}
          <span className={`text-[7px] font-medium ${text}`}>{lbl}</span>
        </div>
      ))}
    </div>
  );
}

function SplitCard({ dark }: CardProps) {
  const bg     = dark ? "bg-neutral-900"   : "bg-white";
  const border = dark ? "border-neutral-800" : "border-neutral-200";
  const title  = dark ? "text-white"       : "text-neutral-900";
  const sub    = dark ? "text-neutral-500" : "text-neutral-400";
  const imgBg  = dark ? "bg-neutral-800"   : "bg-neutral-100";

  return (
    <div className={`w-full rounded-xl border ${border} ${bg} p-3 flex gap-2`}>
      <div className="flex-1">
        <p className={`text-[7px] font-bold ${title} leading-tight`}>Infinite canvas.</p>
        <p className={`text-[6px] ${sub} leading-tight mt-0.5`}>Design pages on our Canvas with world-class layout tools.</p>
      </div>
      <div className={`w-10 rounded-lg ${imgBg} flex-shrink-0`} />
    </div>
  );
}

function FeatureTwoColCard({ dark }: CardProps) {
  const bg     = dark ? "bg-neutral-900"   : "bg-white";
  const border = dark ? "border-neutral-800" : "border-neutral-200";
  const title  = dark ? "text-white"       : "text-neutral-900";
  const sub    = dark ? "text-neutral-500" : "text-neutral-400";
  const col    = dark ? "border-neutral-800" : "border-neutral-200";

  return (
    <div className={`w-full rounded-xl border ${border} ${bg} p-3 flex gap-2`}>
      {[["Canvas.", "Design pages on our Canvas."], ["Publish.", "Ready to go? Publish your web pages in minutes."]].map(([t, d]) => (
        <div key={t} className={`flex-1 border-r last:border-r-0 ${col} pr-2 last:pr-0`}>
          <p className={`text-[7px] font-bold ${title}`}>{t}</p>
          <p className={`text-[6px] ${sub} leading-tight mt-0.5`}>{d}</p>
        </div>
      ))}
    </div>
  );
}

function ThreeColCard({ dark }: CardProps) {
  const bg     = dark ? "bg-neutral-900"   : "bg-white";
  const border = dark ? "border-neutral-800" : "border-neutral-200";
  const title  = dark ? "text-white"       : "text-neutral-900";
  const shape  = dark ? "bg-neutral-700"   : "bg-neutral-200";

  return (
    <div className={`w-full rounded-xl border ${border} ${bg} p-3 flex gap-2`}>
      {["Design", "Write", "Publish"].map(lbl => (
        <div key={lbl} className="flex-1 flex flex-col items-center gap-1">
          <div className={`w-4 h-4 rounded-[3px] ${shape}`} />
          <span className={`text-[6px] font-medium ${title}`}>{lbl}</span>
        </div>
      ))}
    </div>
  );
}

function StatsCard({ dark }: CardProps) {
  const bg     = dark ? "bg-neutral-900"   : "bg-white";
  const border = dark ? "border-neutral-800" : "border-neutral-200";
  const title  = dark ? "text-white"       : "text-neutral-900";
  const sub    = dark ? "text-neutral-500" : "text-neutral-400";

  return (
    <div className={`w-full rounded-xl border ${border} ${bg} p-3 flex justify-around`}>
      {[["30+", "Awards"], ["32+", "Investments"], ["10K", "Customers"]].map(([n, l]) => (
        <div key={l} className="text-center">
          <p className={`text-[9px] font-bold ${title}`}>{n}</p>
          <p className={`text-[6px] ${sub}`}>{l}</p>
        </div>
      ))}
    </div>
  );
}

function TestimonialCard({ dark }: CardProps) {
  const bg     = dark ? "bg-neutral-900"   : "bg-white";
  const border = dark ? "border-neutral-800" : "border-neutral-200";
  const text   = dark ? "text-neutral-300" : "text-neutral-700";
  const name   = dark ? "text-neutral-500" : "text-neutral-400";

  return (
    <div className={`w-full rounded-xl border ${border} ${bg} p-3`}>
      <p className={`text-[6.5px] leading-tight ${text} italic`}>
        &ldquo;Aevaia is one of the best web design builders I have ever tried. It&apos;s like magic.&rdquo;
      </p>
      <p className={`text-[6px] font-semibold ${name} mt-1.5`}>Daniela</p>
    </div>
  );
}

function PricingCard({ dark }: CardProps) {
  const bg     = dark ? "bg-neutral-900"   : "bg-white";
  const border = dark ? "border-neutral-800" : "border-neutral-200";
  const title  = dark ? "text-white"       : "text-neutral-900";
  const sub    = dark ? "text-neutral-500" : "text-neutral-400";
  const cardBg = dark ? "bg-neutral-800"   : "bg-neutral-50";
  const cardBorder = dark ? "border-neutral-700" : "border-neutral-200";

  return (
    <div className={`w-full rounded-xl border ${border} ${bg} p-3`}>
      <p className={`text-[7px] font-bold ${title} mb-0.5`}>Pricing</p>
      <p className={`text-[6px] ${sub} mb-2`}>Subtitle</p>
      <div className="flex gap-1.5">
        {["$0", "$20", "$40"].map(price => (
          <div key={price} className={`flex-1 rounded-lg border ${cardBorder} ${cardBg} py-1.5 text-center`}>
            <p className={`text-[8px] font-bold ${title}`}>{price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const CARD_COMPONENTS: Array<React.ComponentType<CardProps>> = [
  HeroShapesCard,
  HeroButtonsCard,
  LogoRowCard,
  SplitCard,
  FeatureTwoColCard,
  ThreeColCard,
  StatsCard,
  TestimonialCard,
  PricingCard,
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface LeftSidebarProps {
  activeItem:  string | null;
  onItemClick: (id: string | null) => void;
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function LeftSidebar({ activeItem, onItemClick }: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTab,  setPreviewTab]  = useState<"light" | "dark">("light");

  function handleItemClick(id: string) {
    onItemClick(activeItem === id ? null : id);
  }

  const isExpanded = activeItem !== null;

  return (
    <div className="flex h-full shrink-0">

      {/* ── Main sidebar ───────────────────────────────────────────────── */}
      <div className="w-64 h-full flex flex-col bg-[#111111] border-r border-neutral-800 overflow-hidden shrink-0">

        {/* Search */}
        <div className="p-3 pb-2 shrink-0">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-800/60 border border-neutral-700/50 rounded-lg pl-7 pr-3 py-1.5 text-[12px] text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:bg-neutral-800 transition-colors"
            />
          </div>
        </div>

        {/* Accordion groups */}
        <div className="flex-1 overflow-y-auto pb-4" style={{ scrollbarWidth: "none" }}>
          {GROUPS.map(group => (
            <div key={group.label}>
              {/* Section header */}
              <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold text-neutral-500 tracking-wider uppercase">
                {group.label}
              </p>

              {/* Items */}
              {group.items
                .filter(item => searchQuery === "" || item.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors ${
                      activeItem === item.id
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                    }`}
                  >
                    {/* Icon square */}
                    <div
                      className={`w-5 h-5 rounded-[5px] flex items-center justify-center flex-shrink-0 ${item.iconBg}`}
                    >
                      {item.iconContent}
                    </div>
                    <span className="text-[13px] flex-1 text-left font-medium">{item.label}</span>
                    <ChevronRight size={12} className="text-neutral-600 flex-shrink-0" />
                  </button>
                ))
              }

              {group.divider && <div className="border-t border-neutral-800 my-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Secondary panel (slides in when item is active) ────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="sections-panel"
            initial={{ width: 0 }}
            animate={{ width: 230 }}
            exit={{    width: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="h-full overflow-hidden shrink-0 border-r border-neutral-800"
          >
            {/* Fixed-width inner container (gets clipped by the animated parent) */}
            <div className="w-[230px] h-full flex flex-col bg-[#111111]">

              {/* Light / Dark tabs */}
              <div className="px-3 pt-3 pb-2 shrink-0">
                <div className="flex bg-neutral-800/60 rounded-lg p-0.5 border border-neutral-700/40">
                  {(["light", "dark"] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setPreviewTab(tab)}
                      className={`flex-1 py-1 text-[12px] font-medium rounded-md transition-all capitalize ${
                        previewTab === tab
                          ? "bg-neutral-700 text-white shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview cards scroll */}
              <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2" style={{ scrollbarWidth: "none" }}>
                {CARD_COMPONENTS.map((Card, i) => (
                  <div
                    key={i}
                    className="cursor-pointer rounded-xl transition-all hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 hover:ring-offset-[#111111]"
                    onClick={() => console.log("[LeftSidebar] section card selected:", i)}
                  >
                    <Card dark={previewTab === "dark"} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

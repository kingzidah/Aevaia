"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, ChevronRight, Plus, Play, Star,
  Monitor, LayoutGrid, Layers, Type, MousePointer2,
  Eye, Lock,
} from "lucide-react";

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
        <svg width="20" height="17" viewBox="0 0 20 17" aria-hidden>
          <polygon points="0,17 20,17 10,0" className={dark ? "fill-neutral-700" : "fill-gray-300"} />
        </svg>
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
            <svg width="10" height="9" viewBox="0 0 10 9" aria-hidden>
              <polygon points="0,9 10,9 5,0" className={dark ? "fill-neutral-700" : "fill-gray-300"} />
            </svg>
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

const CARD_LABELS: string[] = [
  "Hero Section",
  "Hero Buttons",
  "Logo Row",
  "Split Section",
  "Feature Two Col",
  "Three Column",
  "Stats",
  "Testimonial",
  "Pricing",
];

// ── Layer tree data ───────────────────────────────────────────────────────────

type LayerNode = {
  id:    string;
  label: string;
  Icon:  React.ComponentType<{ className?: string }>;
  depth: 0 | 1 | 2 | 3;
};

// Static Tailwind classes — one per depth level (8px + depth * 12px)
const DEPTH_PL = ["pl-2", "pl-5", "pl-8", "pl-11"] as const;

const LAYER_TREE: LayerNode[] = [
  { id: "page",    label: "Page: Home",    Icon: Monitor,       depth: 0 },
  { id: "hero",    label: "Hero Section",  Icon: LayoutGrid,    depth: 1 },
  { id: "stack",   label: "Main Stack",    Icon: Layers,        depth: 2 },
  { id: "heading", label: "Heading Text",  Icon: Type,          depth: 3 },
  { id: "button",  label: "Action Button", Icon: MousePointer2, depth: 3 },
];

// ── Layer row ─────────────────────────────────────────────────────────────────

function LayerRow({
  node,
  selected,
  onSelect,
}: {
  node:     LayerNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const { Icon, label, depth } = node;
  return (
    // Plain div — not role="button" so nested <button> elements are valid
    <div
      onClick={onSelect}
      className={`group flex items-center gap-1.5 h-7 pr-1.5 rounded-md cursor-pointer transition-colors ${DEPTH_PL[depth]} ${
        selected
          ? "bg-neutral-800 text-white"
          : "hover:bg-neutral-800/50 text-neutral-300"
      }`}
    >
      <Icon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
      <span className="flex-1 text-xs truncate leading-none">{label}</span>

      {/* Hover action icons */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          title="Toggle visibility"
          onClick={e => { e.stopPropagation(); console.log("[Layers] toggle visibility", label); }}
          className="p-0.5 rounded text-neutral-600 hover:text-neutral-300 transition-colors"
        >
          <Eye size={11} />
        </button>
        <button
          type="button"
          title="Lock layer"
          onClick={e => { e.stopPropagation(); console.log("[Layers] lock", label); }}
          className="p-0.5 rounded text-neutral-600 hover:text-neutral-300 transition-colors"
        >
          <Lock size={11} />
        </button>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface LeftSidebarProps {
  activeItem:    string | null;
  onItemClick:   (id: string | null) => void;
  onAddElement?: (type: string) => void;
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function LeftSidebar({ activeItem, onItemClick, onAddElement }: LeftSidebarProps) {
  const [searchQuery,    setSearchQuery]    = useState("");
  const [previewTab,     setPreviewTab]     = useState<"light" | "dark">("dark");
  const [sidebarTab,     setSidebarTab]     = useState<"Layers" | "Components" | "Assets">("Components");
  const [selectedLayer,  setSelectedLayer]  = useState<string | null>("hero");

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

        {/* Mode tabs */}
        <div className="flex items-center gap-0.5 px-2 pb-2 shrink-0">
          {(["Layers", "Components", "Assets"] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setSidebarTab(tab)}
              className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                sidebarTab === tab
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Layers tree (Layers tab) ─────────────────────────────────── */}
        {sidebarTab === "Layers" && (
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 scrollbar-none">
            {LAYER_TREE.map(node => (
              <LayerRow
                key={node.id}
                node={node}
                selected={selectedLayer === node.id}
                onSelect={() => setSelectedLayer(node.id)}
              />
            ))}
          </div>
        )}

        {/* ── Component categories (Components / Assets tabs) ──────────── */}
        {sidebarTab !== "Layers" && (
        <div className="flex-1 overflow-y-auto pb-4 scrollbar-none">
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
        )}
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
              <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 scrollbar-none">
                {CARD_COMPONENTS.map((Card, i) => (
                  <div
                    key={i}
                    className="cursor-grab active:cursor-grabbing rounded-xl select-none
                               transition-all duration-200 ease-in-out
                               hover:-translate-y-0.5 hover:shadow-lg hover:border-neutral-600
                               hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 hover:ring-offset-[#111111]"
                    onClick={() => onAddElement?.(CARD_LABELS[i] ?? "Component")}
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

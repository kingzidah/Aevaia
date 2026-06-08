"use client";

import { useState } from "react";
import type { CanvasElement } from "@/components/studio/StudioClient";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Minus,
  ChevronDown,
  RotateCw,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalDistributeCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalDistributeCenter,
} from "lucide-react";

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  collapsible,
  expanded,
  onToggle,
  onAdd,
}: {
  label:       string;
  collapsible: boolean;
  expanded:    boolean;
  onToggle:    () => void;
  onAdd?:      () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-[12px] font-semibold text-neutral-200 tracking-tight">{label}</span>
      <div className="flex items-center gap-1">
        {onAdd && (
          <button
            type="button"
            title={`Add ${label}`}
            onClick={onAdd}
            className="w-5 h-5 flex items-center justify-center rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Plus size={12} />
          </button>
        )}
        {collapsible && (
          <button
            type="button"
            title={expanded ? `Collapse ${label}` : `Expand ${label}`}
            onClick={onToggle}
            className="w-5 h-5 flex items-center justify-center rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Minus size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  labelWidth = "w-20",
}: {
  label:       string;
  children:    React.ReactNode;
  labelWidth?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <span className={`text-[11px] text-neutral-500 shrink-0 ${labelWidth}`}>{label}</span>
      <div className="flex-1 flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function SmallInput({
  value,
  onChange,
  className = "",
  label,
}: {
  value:     string | number;
  onChange?: (v: string) => void;
  className?: string;
  label?:    string;
}) {
  return (
    <input
      type="text"
      aria-label={label ?? String(value)}
      defaultValue={String(value)}
      onChange={e => onChange?.(e.target.value)}
      className={`h-[26px] bg-neutral-800 border border-neutral-700/60 rounded-md px-1.5 text-[12px] text-white outline-none focus:border-neutral-500 transition-colors ${className}`}
    />
  );
}

function SmallSelect({
  value,
  options,
  className = "",
}: {
  value:    string;
  options:  string[];
  className?: string;
}) {
  return (
    <div className={`relative flex items-center h-[26px] bg-neutral-800 border border-neutral-700/60 rounded-md px-1.5 pr-5 ${className}`}>
      <span className="text-[12px] text-white">{value}</span>
      <ChevronDown size={10} className="absolute right-1.5 text-neutral-500 pointer-events-none" />
    </div>
  );
}

function PillToggle({
  options,
  active,
  onChange,
}: {
  options:  string[];
  active:   string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex w-full gap-0.5 p-0.5 bg-neutral-900 border border-neutral-700/40 rounded-lg">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex flex-1 items-center justify-center h-5.5 rounded-md text-[11px] font-medium transition-all ${
            active === opt
              ? "bg-neutral-700 text-white shadow-sm"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-neutral-800 my-1" />;
}

function CollapseSection({
  expanded,
  children,
}: {
  expanded: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Padding side descriptors ──────────────────────────────────────────────────

const PADDING_SIDES = [
  { key: "paddingTop"    as const, label: "T" },
  { key: "paddingRight"  as const, label: "R" },
  { key: "paddingBottom" as const, label: "B" },
  { key: "paddingLeft"   as const, label: "L" },
];

// ── Quick-select alignment tools (top bar) ────────────────────────────────────

const ALIGN_TOOLS: { Icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { Icon: AlignLeft,                       label: "Align Left"        },
  { Icon: AlignCenter,                     label: "Align Center H"    },
  { Icon: AlignRight,                      label: "Align Right"       },
  { Icon: AlignHorizontalDistributeCenter, label: "Distribute H"      },
  { Icon: AlignVerticalJustifyStart,       label: "Align Top"         },
  { Icon: AlignVerticalJustifyCenter,      label: "Align Center V"    },
  { Icon: AlignVerticalJustifyEnd,         label: "Align Bottom"      },
  { Icon: AlignVerticalDistributeCenter,   label: "Distribute V"      },
];

// ── Slider ────────────────────────────────────────────────────────────────────

function PropSlider({
  value,
  min = 0,
  max = 100,
  onChange,
  label,
}: {
  value:    number;
  min?:     number;
  max?:     number;
  onChange: (v: number) => void;
  label?:   string;
}) {
  return (
    <input
      type="range"
      aria-label={label ?? "Slider"}
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="flex-1 h-[3px] rounded-full appearance-none bg-neutral-700 cursor-pointer
                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
    />
  );
}


// ── Main export ───────────────────────────────────────────────────────────────

export default function RightSidebar({
  selectedElement = null,
  updateElement,
}: {
  selectedElement?: CanvasElement | null;
  updateElement?:   (id: string, props: Partial<CanvasElement>) => void;
}) {
  // Collapsed state per section
  const [expanded, setExpanded] = useState({
    position:      true,
    size:          true,
    layout:        true,
    cursor:        false,
    styles:        true,
    selection:     false,
    transforms:    false,
    codeOverrides: false,
  });

  // Placeholder value states
  const [layoutType,    setLayoutType]    = useState("Stack");
  const [wrap,          setWrap]          = useState("No");
  const [visible,       setVisible]       = useState("Yes");
  const [gap,           setGap]           = useState(80);
  const [opacity,       setOpacity]       = useState(100);

  function toggle(key: keyof typeof expanded) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <aside className="w-[240px] shrink-0 h-full flex flex-col bg-[#111111] border-l border-neutral-800 overflow-y-auto text-xs scrollbar-none">

      {/* ── Alignment quick-select bar ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-neutral-800">
        {ALIGN_TOOLS.map(({ Icon, label }) => (
          <button
            key={label}
            type="button"
            title={label}
            className="w-7 h-7 flex items-center justify-center rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={() => console.log("[RightSidebar]", label)}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!selectedElement && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 pb-8">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-neutral-700">
            <rect x="1" y="1" width="26" height="26" rx="5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 3" />
            <path d="M9 14h10M14 9v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="text-sm text-neutral-400 font-medium">No selection</span>
          <span className="text-xs text-neutral-500 text-center px-4 leading-relaxed">
            Click an element on the canvas to edit its properties.
          </span>
        </div>
      )}

      {/* ── Inspector (shown only when an element is selected) ──────────── */}
      {selectedElement && <>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENT
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          label="Content"
          collapsible={false}
          expanded={true}
          onToggle={() => {}}
        />
        <div className="px-3 pb-3">
          <textarea
            value={selectedElement?.text ?? ''}
            aria-label="Block text content"
            onChange={e => updateElement?.(selectedElement!.id, { text: e.target.value })}
            className="bg-[#111111] border border-neutral-800 focus:border-neutral-600 text-neutral-300 text-xs rounded-md w-full p-2 min-h-15 resize-none outline-none transition-colors"
          />
        </div>
      </div>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════
          TYPOGRAPHY
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          label="Typography"
          collapsible={false}
          expanded={true}
          onToggle={() => {}}
        />
        <div className="px-3 pb-3 flex flex-col gap-2">

          {/* Size + Weight */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-500 shrink-0">Size</span>
            <input
              type="number"
              value={parseInt(selectedElement?.fontSize ?? '16') || 16}
              aria-label="Font size"
              onChange={e => updateElement?.(selectedElement!.id, { fontSize: e.target.value + 'px' })}
              className="w-14 h-6 bg-neutral-900 border border-neutral-800 rounded-md px-1.5 text-xs text-white text-right outline-none focus:border-neutral-600 transition-colors"
            />
            <select
              value={selectedElement?.fontWeight ?? '400'}
              aria-label="Font weight"
              onChange={e => updateElement?.(selectedElement!.id, { fontWeight: e.target.value })}
              className="flex-1 h-6 bg-neutral-900 border border-neutral-800 rounded-md px-1.5 text-xs text-neutral-300 outline-none focus:border-neutral-600 transition-colors appearance-none cursor-pointer"
            >
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="700">Bold</option>
            </select>
          </div>

          {/* Alignment segmented toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-500 shrink-0">Align</span>
            <div className="flex gap-0.5">
              {[
                { value: "left",   Icon: AlignLeft   },
                { value: "center", Icon: AlignCenter },
                { value: "right",  Icon: AlignRight  },
              ].map(({ value, Icon }) => {
                const active = (selectedElement?.textAlign ?? 'left') === value;
                return (
                  <button
                    key={value}
                    type="button"
                    title={`Align ${value}`}
                    onClick={() => updateElement?.(selectedElement!.id, { textAlign: value })}
                    className={`w-8 h-6 flex items-center justify-center rounded-md border transition-colors ${
                      active
                        ? 'bg-neutral-700 border-neutral-600 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <Icon size={12} />
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════
          POSITION
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          label="Position"
          collapsible={false}
          expanded={expanded.position}
          onToggle={() => toggle("position")}
        />
        <Row label="Type">
          <SmallSelect value="Relative" options={["Relative", "Absolute", "Fixed", "Sticky"]} className="flex-1" />
        </Row>
        <div className="pb-1" />
      </div>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════
          SIZE
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          label="Size"
          collapsible={false}
          expanded={expanded.size}
          onToggle={() => toggle("size")}
          onAdd={() => console.log("[RightSidebar] size add")}
        />
        <CollapseSection expanded={expanded.size}>
          <Row label="Width">
            <SmallInput value={960} className="w-12 text-right shrink-0" />
            <div className="flex items-center gap-0.5 h-5.5 px-1.5 bg-neutral-900 border border-neutral-700/40 rounded-md cursor-pointer hover:border-neutral-600 transition-colors group">
              <span className="text-[10px] font-medium text-neutral-300 leading-none whitespace-nowrap">Fixed</span>
              <ChevronDown size={7} className="text-neutral-600 group-hover:text-neutral-400 shrink-0 transition-colors" />
            </div>
          </Row>
          <Row label="Height">
            <SmallInput value={895} className="w-12 text-right shrink-0" />
            <div className="flex items-center gap-0.5 h-5.5 px-1.5 bg-neutral-900 border border-neutral-700/40 rounded-md cursor-pointer hover:border-neutral-600 transition-colors group">
              <span className="text-[10px] font-medium text-neutral-300 leading-none whitespace-nowrap">Fit</span>
              <ChevronDown size={7} className="text-neutral-600 group-hover:text-neutral-400 shrink-0 transition-colors" />
            </div>
          </Row>
          <Row label="Min Max">
            <button
              type="button"
              className="text-[11px] text-neutral-400 hover:text-white transition-colors"
              onClick={() => console.log("[RightSidebar] add min max")}
            >
              Add...
            </button>
          </Row>
          <div className="pb-1" />
        </CollapseSection>
      </div>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════
          LAYOUT
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          label="Layout"
          collapsible
          expanded={expanded.layout}
          onToggle={() => toggle("layout")}
        />
        <CollapseSection expanded={expanded.layout}>

          {/* Type: Stack / Grid */}
          <Row label="Type">
            <PillToggle
              options={["Stack", "Grid"]}
              active={layoutType}
              onChange={setLayoutType}
            />
          </Row>

          {/* Direction arrows */}
          <Row label="Direction">
            <div className="flex gap-1">
              {/* Horizontal ← → */}
              <button
                type="button"
                title="Horizontal layout"
                className="flex items-center justify-center h-6.5 w-10.5 bg-neutral-800 border border-neutral-700/60 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                onClick={() => console.log("[RightSidebar] direction H")}
              >
                <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                  <path d="M1 5h14M11 1l4 4-4 4M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {/* Vertical ↑ ↓ */}
              <button
                type="button"
                title="Vertical layout"
                className="flex items-center justify-center h-6.5 w-10.5 bg-neutral-800 border border-neutral-700/60 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-700 transition-colors"
                onClick={() => console.log("[RightSidebar] direction V")}
              >
                <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                  <path d="M5 1v14M1 5l4-4 4 4M1 11l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </Row>

          {/* Distribute */}
          <Row label="Distribute">
            <SmallSelect value="Center" options={["Center", "Start", "End", "Space Between", "Space Around"]} className="flex-1" />
          </Row>

          {/* Align */}
          <Row label="Align">
            <div className="flex gap-1">
              {[
                <svg key="l" width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="4" height="10" rx="1" fill="currentColor" opacity="0.7"/><rect x="6" y="4" width="7" height="6" rx="1" fill="currentColor" opacity="0.4"/><line x1="1" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1.2"/></svg>,
                <svg key="c" width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="4" height="10" rx="1" fill="currentColor" opacity="0.7"/><rect x="8" y="3" width="4" height="8" rx="1" fill="currentColor" opacity="0.4"/><line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.2"/></svg>,
                <svg key="r" width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="4" width="7" height="6" rx="1" fill="currentColor" opacity="0.4"/><rect x="9" y="2" width="4" height="10" rx="1" fill="currentColor" opacity="0.7"/><line x1="13" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2"/></svg>,
              ].map((icon, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-8 h-6.5 flex items-center justify-center bg-neutral-800 border border-neutral-700/60 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                  onClick={() => console.log("[RightSidebar] align", i)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </Row>

          {/* Wrap */}
          <Row label="Wrap">
            <PillToggle options={["Yes", "No"]} active={wrap} onChange={setWrap} />
          </Row>

          {/* Gap */}
          <Row label="Gap">
            <SmallInput value={gap} label="Gap" className="w-10 text-right" />
            <PropSlider value={gap} max={200} onChange={setGap} label="Gap" />
          </Row>

          {/* Padding */}
          <div className="px-3 pt-0.5 pb-1">
            <span className="block text-[10px] text-neutral-500 mb-1.5 select-none">Padding</span>
            <div className="grid grid-cols-4 gap-1.5">
              {PADDING_SIDES.map(({ key, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <input
                    type="text"
                    value={parseInt(selectedElement?.[key] ?? '16') || 0}
                    aria-label={`Padding ${label}`}
                    title={`Padding ${label}`}
                    onChange={e => updateElement?.(selectedElement!.id, { [key]: e.target.value + 'px' })}
                    className="w-full h-6.5 bg-neutral-800 border border-neutral-700/60 rounded-md text-[11px] text-white text-center outline-none focus:border-neutral-500 transition-colors"
                  />
                  <span className="text-[10px] text-neutral-500 select-none">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pb-1" />
        </CollapseSection>
      </div>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════
          CURSOR
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          label="Cursor"
          collapsible={false}
          expanded={expanded.cursor}
          onToggle={() => toggle("cursor")}
          onAdd={() => console.log("[RightSidebar] cursor add")}
        />
      </div>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════
          STYLES
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          label="Styles"
          collapsible
          expanded={expanded.styles}
          onToggle={() => toggle("styles")}
          onAdd={() => console.log("[RightSidebar] styles add")}
        />
        <CollapseSection expanded={expanded.styles}>

          {/* Opacity */}
          <Row label="Opacity">
            <SmallInput value={1} label="Opacity" className="w-10 text-right" />
            <PropSlider value={opacity} onChange={setOpacity} label="Opacity" />
          </Row>

          {/* Visible */}
          <Row label="Visible">
            <PillToggle options={["Yes", "No"]} active={visible} onChange={setVisible} />
          </Row>

          {/* Fill */}
          <Row label="Fill">
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="color"
                aria-label="Pick fill color"
                value={selectedElement?.backgroundColor ?? '#262626'}
                onChange={e => updateElement?.(selectedElement!.id, { backgroundColor: e.target.value })}
                className="w-6 h-6 rounded border border-neutral-700 shrink-0 cursor-pointer p-0 bg-transparent overflow-hidden"
              />
              <input
                type="text"
                value={selectedElement?.backgroundColor ?? '#262626'}
                aria-label="Fill color hex"
                onChange={e => updateElement?.(selectedElement!.id, { backgroundColor: e.target.value })}
                className="flex-1 h-6 bg-neutral-900 border border-neutral-800 rounded-md px-1.5 text-xs text-white font-mono outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </Row>

          {/* Overflow */}
          <Row label="Overflow">
            <SmallSelect value="Hidden" options={["Hidden", "Visible", "Scroll", "Auto"]} className="flex-1" />
          </Row>

          {/* Radius */}
          <Row label="Radius">
            <div className="flex items-center gap-1.5">
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                aria-hidden
                className="shrink-0 text-neutral-500"
              >
                <path
                  d="M3 11V5a2 2 0 0 1 2-2h6"
                  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
                />
              </svg>
              <input
                type="text"
                value={parseInt(selectedElement?.borderRadius ?? '0') || 0}
                aria-label="Border radius"
                onChange={e => updateElement?.(selectedElement!.id, { borderRadius: e.target.value + 'px' })}
                className="w-12 h-6 bg-neutral-900 border border-neutral-800 rounded-md px-1.5 text-xs text-white text-right outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </Row>

          {/* Border */}
          <Row label="Border">
            <button
              type="button"
              className="flex items-center gap-1 h-6 px-2 rounded-md border border-neutral-800 bg-neutral-900 text-[11px] text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
              onClick={() => console.log("[RightSidebar] add border")}
            >
              <Plus size={10} />
              Add...
            </button>
          </Row>

          {/* Shadows */}
          <Row label="Shadows">
            <button
              type="button"
              className="flex items-center gap-1 h-6 px-2 rounded-md border border-neutral-800 bg-neutral-900 text-[11px] text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
              onClick={() => console.log("[RightSidebar] add shadow")}
            >
              <Plus size={10} />
              Add...
            </button>
          </Row>

          <div className="pb-1" />
        </CollapseSection>
      </div>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════
          SELECTION
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          label="Selection"
          collapsible={false}
          expanded={expanded.selection}
          onToggle={() => toggle("selection")}
          onAdd={() => console.log("[RightSidebar] selection add")}
        />
        <div className="px-3 pb-2">
          <div className="text-[11px] text-neutral-500 mb-1.5">Colors</div>
          <div className="flex items-center gap-1.5">
            {[
              { hex: "111111", cls: "bg-neutral-900"  },
              { hex: "ffffff", cls: "bg-white"         },
              { hex: "3b82f6", cls: "bg-blue-500"      },
              { hex: "8b5cf6", cls: "bg-violet-500"    },
            ].map(({ hex, cls }) => (
              <div
                key={hex}
                className={`w-5 h-5 rounded-full border-2 border-neutral-700 cursor-pointer hover:border-neutral-400 transition-colors ${cls}`}
                onClick={() => console.log("[RightSidebar] color selected:", hex)}
              />
            ))}
            <span className="text-[10px] text-neutral-500 ml-1">+1</span>
          </div>
        </div>
      </div>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════
          TRANSFORMS
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          label="Transforms"
          collapsible
          expanded={expanded.transforms}
          onToggle={() => toggle("transforms")}
          onAdd={() => console.log("[RightSidebar] transforms add")}
        />
        <CollapseSection expanded={expanded.transforms}>

          {/* Rotate */}
          <Row label="Rotate">
            <div className="flex items-center gap-1.5">
              <RotateCw size={13} className="text-neutral-500 shrink-0" />
              <SmallInput value={0} className="w-12 text-right" />
            </div>
          </Row>

          {/* Scale */}
          <Row label="Scale">
            <div className="flex items-center gap-1.5">
              <Maximize2 size={13} className="text-neutral-500 shrink-0" />
              <SmallInput value={1} className="w-12 text-right" />
            </div>
          </Row>

          <div className="pb-1" />
        </CollapseSection>
      </div>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════
          CODE OVERRIDES
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          label="Code Overrides"
          collapsible
          expanded={expanded.codeOverrides}
          onToggle={() => toggle("codeOverrides")}
          onAdd={() => console.log("[RightSidebar] code overrides add")}
        />
        <CollapseSection expanded={expanded.codeOverrides}>
          <div className="px-3 pb-2">
            <button
              type="button"
              className="flex items-center gap-1 h-6 px-2 rounded-md border border-neutral-800 bg-neutral-900 text-[11px] text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
              onClick={() => console.log("[RightSidebar] add override")}
            >
              <Plus size={10} />
              Add Override
            </button>
          </div>
        </CollapseSection>
      </div>

      {/* Bottom spacer */}
      <div className="flex-1" />

      </>}
    </aside>
  );
}

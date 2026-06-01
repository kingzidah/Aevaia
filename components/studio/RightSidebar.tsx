"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Minus,
  ChevronDown,
  X,
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
            onClick={onAdd}
            className="w-5 h-5 flex items-center justify-center rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Plus size={12} />
          </button>
        )}
        {collapsible && (
          <button
            type="button"
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
      <span className={`text-[11px] text-neutral-500 flex-shrink-0 ${labelWidth}`}>{label}</span>
      <div className="flex-1 flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function SmallInput({
  value,
  onChange,
  className = "",
}: {
  value:    string | number;
  onChange?: (v: string) => void;
  className?: string;
}) {
  return (
    <input
      type="text"
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
          style={{ overflow: "hidden" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Quick-select constraint icons (top row) ───────────────────────────────────

const QUICK_ICONS = [
  // Align left, center-h, right, distribute-h, top, center-v, bottom, distribute-v
  <svg key="al"  width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="5" height="10" rx="1" fill="currentColor" opacity="0.8"/><rect x="7" y="4" width="6" height="6" rx="1" fill="currentColor" opacity="0.4"/><line x1="1.5" y1="1" x2="1.5" y2="13" stroke="currentColor" strokeWidth="1.2"/></svg>,
  <svg key="ac"  width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="4" height="8" rx="1" fill="currentColor" opacity="0.8"/><rect x="8" y="4" width="4" height="6" rx="1" fill="currentColor" opacity="0.4"/><line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.2"/></svg>,
  <svg key="ar"  width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="4" width="6" height="6" rx="1" fill="currentColor" opacity="0.4"/><rect x="8" y="2" width="5" height="10" rx="1" fill="currentColor" opacity="0.8"/><line x1="12.5" y1="1" x2="12.5" y2="13" stroke="currentColor" strokeWidth="1.2"/></svg>,
  <svg key="dh"  width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="3" height="8" rx="1" fill="currentColor" opacity="0.6"/><rect x="5.5" y="3" width="3" height="8" rx="1" fill="currentColor" opacity="0.6"/><rect x="10" y="3" width="3" height="8" rx="1" fill="currentColor" opacity="0.6"/></svg>,
  <svg key="at"  width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="5" rx="1" fill="currentColor" opacity="0.8"/><rect x="4" y="8" width="6" height="4" rx="1" fill="currentColor" opacity="0.4"/><line x1="1" y1="1.5" x2="13" y2="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  <svg key="avc" width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="5" rx="1" fill="currentColor" opacity="0.8"/><rect x="4" y="8" width="6" height="5" rx="1" fill="currentColor" opacity="0.4"/><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.2"/></svg>,
  <svg key="ab"  width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="2" width="6" height="4" rx="1" fill="currentColor" opacity="0.4"/><rect x="2" y="7" width="10" height="5" rx="1" fill="currentColor" opacity="0.8"/><line x1="1" y1="12.5" x2="13" y2="12.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  <svg key="dv"  width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="1" width="8" height="3" rx="1" fill="currentColor" opacity="0.6"/><rect x="3" y="5.5" width="8" height="3" rx="1" fill="currentColor" opacity="0.6"/><rect x="3" y="10" width="8" height="3" rx="1" fill="currentColor" opacity="0.6"/></svg>,
];

// ── Slider ────────────────────────────────────────────────────────────────────

function PropSlider({
  value,
  min = 0,
  max = 100,
  onChange,
}: {
  value:    number;
  min?:     number;
  max?:     number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
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

// ── Color swatch input ────────────────────────────────────────────────────────

function ColorInput({
  hex,
  onClear,
}: {
  hex:     string;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 h-[26px] bg-neutral-800 border border-neutral-700/60 rounded-md px-1.5 flex-1">
      <div
        className="w-3.5 h-3.5 rounded-[3px] border border-neutral-600 flex-shrink-0"
        style={{ backgroundColor: `#${hex}` }}
      />
      <span className="text-[12px] text-white font-mono flex-1">{hex}</span>
      <button type="button" onClick={onClear} className="text-neutral-500 hover:text-white transition-colors">
        <X size={10} />
      </button>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function RightSidebar() {
  // Collapsed state per section
  const [expanded, setExpanded] = useState({
    position:   true,
    size:       true,
    layout:     true,
    cursor:     false,
    styles:     true,
    transforms: false,
    selection:  false,
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
    <aside className="w-[240px] shrink-0 h-full flex flex-col bg-[#111111] border-l border-neutral-800 overflow-y-auto text-xs"
      style={{ scrollbarWidth: "none" }}>

      {/* ── Quick-select alignment row ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-neutral-800">
        {QUICK_ICONS.map((icon, i) => (
          <button
            key={i}
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded text-neutral-600 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            onClick={() => console.log("[RightSidebar] quick-align", i)}
          >
            {icon}
          </button>
        ))}
      </div>

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
            <SmallInput value={960} className="w-14 text-right" />
            <SmallSelect value="Fixed" options={["Fixed", "Fill", "Auto"]} className="w-[72px]" />
          </Row>
          <Row label="Height">
            <SmallInput value={895} className="w-14 text-right" />
            <SmallSelect value="Fit" options={["Fit", "Fill", "Fixed"]} className="w-[72px]" />
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
                className="flex items-center justify-center h-[26px] w-[42px] bg-neutral-800 border border-neutral-700/60 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                onClick={() => console.log("[RightSidebar] direction H")}
              >
                <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                  <path d="M1 5h14M11 1l4 4-4 4M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {/* Vertical ↑ ↓ */}
              <button
                type="button"
                className="flex items-center justify-center h-[26px] w-[42px] bg-neutral-800 border border-neutral-700/60 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-700 transition-colors"
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
                  className="w-8 h-[26px] flex items-center justify-center bg-neutral-800 border border-neutral-700/60 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
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
            <SmallInput value={gap} className="w-10 text-right" />
            <PropSlider value={gap} max={200} onChange={setGap} />
          </Row>

          {/* Padding */}
          <Row label="Padding">
            <div className="flex flex-col gap-1 flex-1">
              {/* Top row buttons */}
              <div className="flex items-center justify-between gap-0.5">
                {/* Sides icon */}
                <div className="flex gap-0.5">
                  <button type="button" className="w-5 h-5 flex items-center justify-center rounded text-neutral-500 hover:text-white transition-colors">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
                      <rect x="1" y="1" width="10" height="1.5" rx="0.5" fill="currentColor" opacity="0.6"/>
                      <rect x="1" y="9.5" width="10" height="1.5" rx="0.5" fill="currentColor" opacity="0.6"/>
                    </svg>
                  </button>
                  <button type="button" className="w-5 h-5 flex items-center justify-center rounded text-neutral-500 hover:text-white transition-colors">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
                      <rect x="1" y="1" width="1.5" height="10" rx="0.5" fill="currentColor" opacity="0.6"/>
                      <rect x="9.5" y="1" width="1.5" height="10" rx="0.5" fill="currentColor" opacity="0.6"/>
                    </svg>
                  </button>
                </div>
              </div>
              {/* T/R/B/L inputs */}
              <div className="grid grid-cols-4 gap-1">
                {[["80","T"],["20","R"],["80","B"],["20","L"]].map(([v, side]) => (
                  <div key={side} className="flex flex-col items-center gap-0.5">
                    <SmallInput value={v} className="w-full text-center text-[11px] px-0.5" />
                    <span className="text-[9px] text-neutral-600">{side}</span>
                  </div>
                ))}
              </div>
            </div>
          </Row>

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
            <SmallInput value={1} className="w-10 text-right" />
            <PropSlider value={opacity} onChange={setOpacity} />
          </Row>

          {/* Visible */}
          <Row label="Visible">
            <PillToggle options={["Yes", "No"]} active={visible} onChange={setVisible} />
          </Row>

          {/* Fill */}
          <Row label="Fill">
            <ColorInput hex="000000" onClear={() => console.log("[RightSidebar] clear fill")} />
          </Row>

          {/* Overflow */}
          <Row label="Overflow">
            <SmallSelect value="Hidden" options={["Hidden", "Visible", "Scroll", "Auto"]} className="flex-1" />
          </Row>

          {/* Radius */}
          <Row label="Radius">
            <SmallInput value={0} className="w-14 text-right" />
          </Row>

          {/* Border */}
          <Row label="Border">
            <button
              type="button"
              className="text-[11px] text-neutral-400 hover:text-white transition-colors"
              onClick={() => console.log("[RightSidebar] add border")}
            >
              Add...
            </button>
          </Row>

          {/* Shadows */}
          <Row label="Shadows">
            <button
              type="button"
              className="text-[11px] text-neutral-400 hover:text-white transition-colors"
              onClick={() => console.log("[RightSidebar] add shadow")}
            >
              Add...
            </button>
          </Row>

          <div className="pb-1" />
        </CollapseSection>
      </div>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════
          TRANSFORMS
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          label="Transforms"
          collapsible={false}
          expanded={expanded.transforms}
          onToggle={() => toggle("transforms")}
          onAdd={() => console.log("[RightSidebar] transforms add")}
        />
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
            {["111111", "ffffff", "3b82f6", "8b5cf6"].map(c => (
              <div
                key={c}
                className="w-5 h-5 rounded-full border-2 border-neutral-700 cursor-pointer hover:border-neutral-400 transition-colors"
                style={{ backgroundColor: `#${c}` }}
                onClick={() => console.log("[RightSidebar] color selected:", c)}
              />
            ))}
            <span className="text-[10px] text-neutral-500 ml-1">+1</span>
          </div>
        </div>
      </div>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════
          CODE OVERRIDES
      ════════════════════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          label="Code Overrides"
          collapsible={false}
          expanded={false}
          onToggle={() => {}}
          onAdd={() => console.log("[RightSidebar] code overrides add")}
        />
      </div>

      {/* Bottom spacer */}
      <div className="flex-1" />
    </aside>
  );
}

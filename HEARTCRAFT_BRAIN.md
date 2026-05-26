# 🧭 HEARTCRAFT: CORE ARCHITECTURE & SYSTEM MEMORY
**DO NOT IGNORE THIS FILE.** You are Claude Code, the Lead Developer for HeartCraft. Read this file to understand the context, constraints, and architecture of the platform before executing any complex tasks.

## 1. The Vision & Benchmark
HeartCraft is a professional, responsive website builder designed to create "Cinematic Interactive Experiences" (often used for high-end digital gifts, portfolios, or immersive stories). 
* **The Benchmark:** The output must feel like an Apple product launch or an award-winning Awwwards site.
* **The Vibe:** Fluid, bouncy, highly polished, emotional. 
* **The Rule:** "Complex Power, Simple UI." We orchestrate powerful open-source tools to give the user a magical editing experience without charging them for SaaS API editing tools.

## 2. The Tech Stack (The "Frankenstein" Orchestrator)
We do NOT build tools from scratch if an open-source standard exists. We are the "Glue."
* **Framework:** Next.js 15 (React) + Tailwind CSS.
* **Physics & UI Motion:** `framer-motion`. (Rule: Do NOT use standard CSS transitions for layout changes. Use Framer Motion springs and `layout` props for buttery smoothness).
* **Text Engine:** `Tiptap` (Headless). Allows micro-level, word-by-word formatting.
* **Spatial Engine:** `@dnd-kit`. Blocks must be sortable using smooth drag-and-drop.
* **State Management:** Complex React state (eventually moving to Zustand or similar if it gets too heavy).

## 3. Core Architectural Paradigms
1. **Multi-Scene, Not Single Page:** HeartCraft websites act like a slide deck or a movie. Users build distinct "Scenes" and transition between them. State is structured as an array of scenes, each containing an array of blocks.
2. **Responsive, Not Phone-Locked:** The editing Canvas is fluid and responsive. Do not hardcode mobile widths (e.g., 320px). Use responsive max-widths so it previews correctly for desktop and mobile.
3. **The Sensory Engine:** The web experiences must support Audio (Background music, Voice Notes) and Haptics (`navigator.vibrate`).
4. **Left / Center / Right Layout:** - *Left Panel:* Precision Manual Tools (Sliders, colors, typography). Must stretch dynamically when resized.
   - *Center:* The Live Canvas.
   - *Right Panel:* The AI Co-Pilot (Generating images/rewriting text).

## 4. Strict Engineering Directives
* **Zero Destruction:** NEVER delete existing features to make room for new ones. If adding a new feature, carefully integrate it with the existing `dnd-kit` wrappers and `framer-motion` layouts.
* **No Lazy Coding:** Do NOT use placeholders like `// ... existing code here`. Write out the complete necessary logic so the app does not break.
* **UI Polish:** Always ensure drag handles, borders, and buttons look premium ("Adobe Standard"). Hide advanced tools (like drag grips) behind hover states to keep the UI clean.

# HEARTCRAFT: Master Project Blueprint & Architecture

## Document Purpose
To provide complete, unwavering context to AI developers operating within this codebase.  
Read this document thoroughly to understand the business goals, user psychology, and strict technical constraints before writing or modifying any code.

---

## 1. App Overview

**HeartCraft** is a professional-grade, AI-driven **Spatial Web Editor** designed to create cinematic, interactive digital experiences.

### Core Use Cases:
- High-end digital gifts  
- Dynamic letters  
- Interactive portfolios  

> ❗ It is NOT a static image editor or a simple e-card generator.

### Core Philosophy
**"Complex Power, Simple UI."**

The platform uses a **Council of AIs** to handle:
- Writing
- Asset generation

While giving users:
- Micro-level control (Adobe-level precision)
- Full customization over:
  - Physics
  - Layout
  - Text nodes
  - Sensory outputs (audio + haptics)

---

## 2. Target Users

### Primary Persona
**The Everyday Romantic / Thoughtful Friend**

- Wants to create something deeply personal
- Lacks design or coding skills

### User Psychology
- Wants a **"Magic Button"** → instant beautiful result  
- Also wants a **"Precision Mixer"** → fine control

### Example Needs
- Rewrite a single sentence
- Make one word bold + red
- Change background music

---

## 3. Core Features (Current Phase)

### Multi-Scene Architecture
- Experiences are built as **cinematic scenes**
- NOT a single scrolling page
- Similar to a modern slide deck

---

### Dual-Panel Studio Interface

#### Left Panel (Manual Precision)
- Typography controls
- Color pickers
- Global themes

#### Center (Canvas)
- Live preview
- Fully responsive (NOT mobile-locked)

#### Right Panel (AI Co-Pilot)
- AI prompt inputs
- Image generation
- Text rewriting

---

### Micro-Level Text Editing
- Headless inline editing
- Highlight individual words
- Apply precise formatting

---

### Fluid Block Sorting
- Drag-and-drop elements:
  - Text
  - Images
  - Buttons
- Smooth and precise movement

---

### The Sensory Engine
- Global background music
- Scene-specific voice notes
- Haptic feedback (`navigator.vibrate`)

---

### The Vault (Publishing)
- One-click deployment
- Saves:
  - State
  - Themes
  - Assets
- Generates shareable URL:

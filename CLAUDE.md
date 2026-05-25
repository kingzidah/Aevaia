# HeartCraft Studio — Project Guide & Architecture Map

## 🚀 Quick Start Commands
* **Development Server:** `npm run dev`
* **Production Build:** `npm run build`
* **Linting Checks:** `npm run lint`
* **Database Studio:** `npx prisma studio`
* **Database Migration:** `npx prisma migrate dev`

## 🏗️ Core Application Architecture
HeartCraft is built as a highly responsive, professional, context-aware 3-column workspace layout.

### 1. Left Sidebar (`components/left-sidebar.tsx`)
* Fixed width of `w-80` (320px). Fully collapsible to `w-0` using smooth Tailwind transitions.
* Uses a Master Tab Navigation system at the top:
  * **Insert Tab:** Houses an accordion folder system (`Basics`, `Media & Galleries`, `Atmosphere`, `Event Utilities`, `Art & Vectors`) with search filtering capabilities. All blocks contain `draggable={true}` attributes.
  * **Style Tab:** Houses the granular inspector tools (Transforms, Scales, Color Pickers) dynamically bound to the selected block.
  * **World Tab:** Houses global environmental controllers (Particle states, atmospheric sound loops).

### 2. Center Stage Canvas (`app/studio/page.tsx` & `components/studio/center-canvas.tsx`)
* An infinite panning and zoomable design workspace workspace layout container.
* Overlaid with absolute hardware-accelerated tracking layers mapping coordinate plots (`x`, `y`) for dropped nodes.
* Contains absolute edge handles (`left-0`, `right-0`) pinned vertically to seamlessly toggle the collapsible parameters of the surrounding sidebars into full-viewport "Zen Mode".
* Anchored at the bottom center is a collapsible semicircle drawer button which toggles the `Scene Selector` display over the background viewport without layout clipping.

### 3. Right Sidebar AI Orchestrator (`components/right-sidebar.tsx`)
* Fixed width of `w-80`. Fully collapsible.
* Aligned horizontally with the left sidebar tabs via a static header component (`✨ AI Workspace`).
* Runs a context-aware morphing interface connected to a live streaming API endpoint (`/api/chat`):
  * **Default State:** Renders the full-screen global `HeartCraft AI` agent.
  * **Active State:** Collapses the global prompt window to a tight strip at the top, mounting custom specialized AI controls (Copywriting, Visual Art Direction, Sound Engineering) depending on `activeElementType`.

## 💾 State & Persistence Data Flow
* Local state management coordinates interactions through unified stores, tracking canvas array changes alongside context parameters (`activeElementId`, `activeElementType`).
* **Cloud Auto-Save Sync:** Monitored via a debounced, 2000ms background hook checking serialization changes and writing directly to the database via `/api/project/save` route.
* **Production Viewer Gateway:** Deployed projects render cleanly on `/p/[projectId]` routes, stripping out all editor UI frames and enforcing entry validation via a gated "Digital Bouncer" welcome card overlay.

## 🛠️ Code Quality & Typing Enforcement
* Strict type-safety parameters are declared globally. Every canvas block must fully adhere to type metrics detailing unique `id`, `type`, coordinates, and deep optional `properties` dictionaries.
* Never leave open instances of loose `any` properties inside canvas mapping operations or event callback chains.

## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy,
/canary, /benchmark, /browse, /open-gstack-browser, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /setup-gbrain, /sync-gbrain, /retro, /investigate,
/document-release, /document-generate, /codex, /cso, /autoplan, /pair-agent, /careful, /freeze,
/guard, /unfreeze, /gstack-upgrade, /learn.
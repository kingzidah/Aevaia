# HeartCraft Scene-Based Architecture

## Overview

HeartCraft has been upgraded from a single-page block system to a **cinematic multi-scene experience**. Websites are no longer single scrollable pages—they are now "Cinematic Experiences" broken into discrete "Scenes" (like slides in a presentation or frames in a video editor).

## Architecture Changes

### 1. State Structure Upgrade

**Before:**
```typescript
const [blocks, setBlocks] = useState<Block[]>([...]);
```

**After:**
```typescript
interface Scene {
  id: string;
  name: string;
  blocks: Block[];
}

const [scenes, setScenes] = useState<Scene[]>([...]);
const [activeSceneId, setActiveSceneId] = useState('scene-1');
```

### 2. Key Features

#### Scene Management
- **Multiple Scenes**: Create unlimited scenes for your cinematic experience
- **Active Scene Tracking**: Only one scene is visible and editable at a time
- **Scene Navigation**: Switch between scenes using the bottom timeline navigator

#### Scene Navigator UI
- **Location**: Bottom of the Studio screen (below the Canvas)
- **Visual Design**: Video editor timeline / slide deck sorter aesthetic
- **Features**:
  - Thumbnail preview for each scene
  - Scene number badges
  - Block count display
  - Active scene indicator with animated underline
  - Add new scene button
  - Delete scene (when more than 1 exists)
  - Rename scene (double-click)

#### Cinematic Transitions
- **Technology**: Framer Motion's `<AnimatePresence mode="wait">`
- **Effect**: When switching scenes:
  - Old scene fades out (opacity: 0)
  - New scene scales in smoothly (scale: 0.95 → 1)
  - Duration: 400ms with easeInOut easing
- **User Experience**: Mimics professional video editing software

#### Drag-and-Drop Preservation
- **dnd-kit Integration**: Fully functional within each scene
- **Scope**: Blocks can only be reordered within their parent scene
- **Implementation**: Drag handler updates only the active scene's blocks

### 3. Component Structure

```
app/studio/page.tsx (Main Studio)
├── Left Panel (Design Tools)
├── Middle Panel (Canvas)
│   └── AnimatePresence (Scene Transitions)
│       └── DndContext (Active Scene Blocks)
│           └── SortableContext
│               └── SortableBlock[]
├── Right Panel (AI Co-Pilot)
└── SceneNavigator (Bottom Timeline)
```

### 4. New Component: SceneNavigator

**File**: `components/canvas/SceneNavigator.tsx`

**Props**:
- `scenes`: Array of all scenes
- `activeSceneId`: Currently visible scene ID
- `onSceneChange`: Handler for switching scenes
- `onAddScene`: Handler for creating new scenes
- `onDeleteScene`: Handler for removing scenes
- `onRenameScene`: Handler for renaming scenes

**Features**:
- Horizontal scrollable timeline
- Animated scene thumbnails
- Active scene highlighting with purple glow
- Delete button (hover to reveal)
- Double-click to rename
- Scene statistics display

### 5. Data Persistence

**LocalStorage Keys**:
- `hc_scenes`: JSON stringified array of all scenes
- `hc_activeSceneId`: Currently active scene ID
- `hc_theme`: Global theme setting

**Auto-save**: Changes are automatically saved to localStorage whenever:
- Scenes are added, deleted, or renamed
- Active scene changes
- Blocks are reordered within a scene
- Theme is changed

### 6. Scene Management Functions

#### Add Scene
```typescript
const handleAddScene = () => {
  const newScene: Scene = {
    id: `scene-${Date.now()}`,
    name: `Scene ${scenes.length + 1}`,
    blocks: [
      { id: `block-${Date.now()}-1`, type: 'headline', content: 'New Scene' },
      { id: `block-${Date.now()}-2`, type: 'paragraph', content: 'Start creating...' }
    ]
  };
  setScenes([...scenes, newScene]);
  setActiveSceneId(newScene.id);
};
```

#### Delete Scene
```typescript
const handleDeleteScene = (sceneId: string) => {
  if (scenes.length <= 1) return; // Prevent deleting last scene
  const newScenes = scenes.filter(s => s.id !== sceneId);
  setScenes(newScenes);
  if (activeSceneId === sceneId) {
    setActiveSceneId(newScenes[0].id); // Switch to first scene
  }
};
```

#### Rename Scene
```typescript
const handleRenameScene = (sceneId: string, newName: string) => {
  setScenes(scenes.map(scene => 
    scene.id === sceneId ? { ...scene, name: newName } : scene
  ));
};
```

#### Switch Scene
```typescript
const handleSceneChange = (sceneId: string) => {
  setActiveSceneId(sceneId);
  setSelectedItem('none'); // Deselect any selected blocks
};
```

### 7. Drag-and-Drop Within Scenes

The drag handler now updates only the active scene:

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    setScenes((currentScenes) => {
      return currentScenes.map((scene) => {
        if (scene.id === activeSceneId) {
          const oldIndex = scene.blocks.findIndex((item) => item.id === active.id);
          const newIndex = scene.blocks.findIndex((item) => item.id === over.id);
          return {
            ...scene,
            blocks: arrayMove(scene.blocks, oldIndex, newIndex)
          };
        }
        return scene;
      });
    });
  }
};
```

## Usage Guide

### Creating a Multi-Scene Experience

1. **Start with Default Scene**: The app initializes with one "Landing" scene
2. **Add New Scenes**: Click the "+ Add Scene" button in the bottom timeline
3. **Switch Between Scenes**: Click any scene thumbnail to make it active
4. **Edit Scene Content**: Drag blocks, edit text, generate images within the active scene
5. **Rename Scenes**: Double-click a scene thumbnail and enter a new name
6. **Delete Scenes**: Hover over a scene and click the red X button (only if 2+ scenes exist)

### Best Practices

- **Scene Organization**: Use scenes to tell a story (e.g., Scene 1: Introduction, Scene 2: Main Message, Scene 3: Call to Action)
- **Naming Convention**: Give scenes descriptive names for easy navigation
- **Content Balance**: Keep each scene focused on one main idea
- **Transitions**: The automatic fade/scale transitions create a professional feel

## Technical Notes

### Performance
- Only the active scene is rendered in the Canvas
- Inactive scenes are stored in state but not in the DOM
- Transitions are GPU-accelerated via Framer Motion

### Compatibility
- Works with all existing HeartCraft features (themes, AI tools, text editor)
- Backward compatible with localStorage (gracefully handles old data format)
- Fully responsive design

### Future Enhancements
- Scene reordering via drag-and-drop in the timeline
- Scene duplication
- Scene-specific themes
- Scene preview thumbnails with actual content
- Scene transition customization (fade, slide, zoom, etc.)
- Scene duration settings for auto-play mode
- Export as video or animated GIF

## File Changes Summary

### New Files
- `components/canvas/SceneNavigator.tsx` - Timeline UI component

### Modified Files
- `app/studio/page.tsx` - Complete architectural upgrade

### Key Imports Added
- `SceneNavigator` component
- Scene and Block interfaces moved to top level

## Testing Checklist

- [x] Create new scenes
- [x] Switch between scenes with smooth transitions
- [x] Drag-and-drop blocks within active scene
- [x] Rename scenes via double-click
- [x] Delete scenes (with protection for last scene)
- [x] LocalStorage persistence across page reloads
- [x] Theme changes apply globally
- [x] AI tools work within each scene
- [x] Text editor functions correctly per scene
- [x] Responsive layout with scene navigator

## Conclusion

HeartCraft now offers a **cinematic, multi-scene experience** that transforms simple gift pages into professional, story-driven presentations. The scene-based architecture provides:

✅ **Scalability**: Unlimited scenes per project  
✅ **Organization**: Clear separation of content  
✅ **Polish**: Smooth cinematic transitions  
✅ **Flexibility**: Full control over scene management  
✅ **Persistence**: Auto-save to localStorage  
✅ **Compatibility**: Works with all existing features  

The drag-and-drop system remains fully functional within each scene, maintaining the intuitive block-based editing experience while adding powerful multi-scene capabilities.

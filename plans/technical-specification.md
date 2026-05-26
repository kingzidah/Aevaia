# Samsung Notes Text Editor - Technical Specification

## Executive Summary

This document provides detailed technical specifications for integrating a Samsung Notes-style advanced text editor into the HeartCraft studio application. The implementation will use **Tiptap** as the rich text editor foundation and will be integrated into the existing left panel design controls.

---

## 1. Architecture Overview

### 1.1 Component Hierarchy

```
app/studio/page.tsx (existing)
├── LeftPanel (enhanced)
│   ├── DesignHeader
│   └── TextEditorPanel (NEW)
│       ├── FontControls
│       │   ├── FontFamilySelector
│       │   └── FontSizeControl
│       ├── TextStyleToolbar
│       │   ├── BoldButton
│       │   ├── ItalicButton
│       │   ├── UnderlineButton
│       │   └── StrikethroughButton
│       ├── AlignmentToolbar
│       │   ├── AlignLeftButton
│       │   ├── AlignCenterButton
│       │   ├── AlignRightButton
│       │   └── JustifyButton
│       ├── ColorPalette
│       │   ├── PaletteGrid
│       │   ├── CustomColorSlots
│       │   └── ColorPickerModal
│       ├── BackgroundColorPicker
│       └── ListControls
│           ├── BulletListButton
│           ├── OrderedListButton
│           └── ChecklistButton
├── CenterPanel (existing - enhanced)
│   └── PhoneMockup
│       ├── ImageArea
│       └── TextArea (NEW - Tiptap Editor)
└── RightPanel (existing)
    └── AICouncil
```

### 1.2 State Management Architecture

```typescript
// New state additions to app/studio/page.tsx

interface TextEditorState {
  // Tiptap editor instance
  editor: Editor | null;
  
  // Text formatting
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  textColor: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  
  // List formatting
  isBulletList: boolean;
  isOrderedList: boolean;
  isTaskList: boolean;
  
  // Custom colors
  customColors: string[];
  
  // UI state
  showColorPicker: boolean;
  colorPickerMode: 'text' | 'background';
  activeColorRow: number | null;
}
```

---

## 2. Component Specifications

### 2.1 FontFamilySelector Component

**File**: `components/text-editor/FontFamilySelector.tsx`

```typescript
interface FontFamilySelectorProps {
  value: string;
  onChange: (font: string) => void;
  editor: Editor | null;
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter', category: 'sans-serif' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'serif' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
  { value: 'Montserrat', label: 'Montserrat', category: 'sans-serif' },
  { value: 'Roboto', label: 'Roboto', category: 'sans-serif' },
  { value: 'Lora', label: 'Lora', category: 'serif' },
];
```

**Styling**:
- Dark background: `bg-neutral-900`
- Border: `border border-neutral-800`
- Text: `text-neutral-300`
- Focus: `focus:border-purple-500`
- Height: `40px`
- Padding: `px-3 py-2`
- Border radius: `rounded-lg`

**Behavior**:
- Dropdown opens on click
- Shows font preview in each option
- Updates Tiptap editor on selection
- Keyboard navigation support

---

### 2.2 FontSizeControl Component

**File**: `components/text-editor/FontSizeControl.tsx`

```typescript
interface FontSizeControlProps {
  value: number;
  onChange: (size: number) => void;
  editor: Editor | null;
  min?: number;
  max?: number;
}

const FONT_SIZE_PRESETS = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
```

**Layout**:
```
┌─────────────────────────┐
│  -  │   24   │  ▼  │  + │
└─────────────────────────┘
```

**Features**:
- Decrement button (min: 8px)
- Number input (editable)
- Dropdown for presets
- Increment button (max: 72px)
- Keyboard shortcuts: Ctrl+Shift+> / Ctrl+Shift+<

---

### 2.3 TextStyleToolbar Component

**File**: `components/text-editor/TextStyleToolbar.tsx`

```typescript
interface TextStyleToolbarProps {
  editor: Editor | null;
}
```

**Layout**:
```
┌───┬───┬───┬───┐
│ B │ I │ U │ S │
└───┴───┴───┴───┘
```

**Button Specifications**:
- Size: `32px × 32px`
- Background (inactive): `transparent`
- Background (active): `bg-purple-500/20`
- Background (hover): `hover:bg-neutral-800`
- Text (inactive): `text-neutral-400`
- Text (active): `text-purple-400`
- Border radius: `rounded`
- Transition: `transition-colors duration-200`

**Keyboard Shortcuts**:
- Bold: `Ctrl+B` / `Cmd+B`
- Italic: `Ctrl+I` / `Cmd+I`
- Underline: `Ctrl+U` / `Cmd+U`
- Strikethrough: `Ctrl+Shift+X` / `Cmd+Shift+X`

---

### 2.4 AlignmentToolbar Component

**File**: `components/text-editor/AlignmentToolbar.tsx`

```typescript
interface AlignmentToolbarProps {
  editor: Editor | null;
  value: 'left' | 'center' | 'right' | 'justify';
  onChange: (align: string) => void;
}
```

**Icons** (using Heroicons or Lucide):
- Left: `AlignLeft` icon
- Center: `AlignCenter` icon
- Right: `AlignRight` icon
- Justify: `AlignJustify` icon

**Layout**:
```
┌───┬───┬───┬───┐
│ ← │ ≡ │ → │ ≣ │
└───┴───┴───┴───┘
```

**Styling**: Same as TextStyleToolbar

---

### 2.5 ColorPalette Component

**File**: `components/text-editor/ColorPalette.tsx`

```typescript
interface ColorPaletteProps {
  onColorSelect: (color: string) => void;
  selectedColor: string;
  customColors: string[];
  onCustomColorAdd: (color: string) => void;
  mode: 'text' | 'background';
}

const COLOR_PALETTE = {
  row1: ['#FF5F5F', '#FFD700', '#00CED1', '#5F7FFF', '#9F5FFF', '#000000', '#FFFFFF'],
  row2: ['#FF7F7F', '#2F2F2F', '#2F7F7F', '#2F2F7F', '#7F5F3F', '#F5E6D3'],
  row3: ['#FFFF7F', '#FF7F9F', '#7FFF9F', '#9F9FFF', '#AAAAAA', '#FFFFFF', '#FFA500', '#00FF7F'],
  row4: ['#7F9FFF', '#9F9FDF', '#D4AF37', '#C8A2C8', '#9F7FBF', '#D2B48C']
};
```

**Color Swatch Specifications**:
- Size: `28px × 28px`
- Border radius: `rounded-full`
- Border: `border border-white/10`
- Hover: `hover:scale-110 transition-transform`
- Selected: `ring-2 ring-purple-500`
- Cursor: `cursor-pointer`

**Layout**:
```
Row 1: ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤
Row 2: ⬤ ⬤ ⬤ ⬤ ⬤ ⬤
Row 3: ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤
Row 4: ⬤ ⬤ ⬤ ⬤ ⬤ ⬤

Custom: ⬤ ⬤ ⬤ ⬤ 🎨 ⊞
```

**Custom Color Slots**:
- 4 slots for user-saved colors
- Eyedropper icon to open color picker
- Grid icon for advanced color selector

---

### 2.6 BackgroundColorPicker Component

**File**: `components/text-editor/BackgroundColorPicker.tsx`

```typescript
interface BackgroundColorPickerProps {
  onColorSelect: (color: string) => void;
  selectedColor: string;
  enabled: boolean;
  onToggle: () => void;
}
```

**Layout**:
```
┌─────────────────────────────┐
│ ☐ Background Highlight      │
│ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤            │
└─────────────────────────────┘
```

**Features**:
- Toggle checkbox to enable/disable
- Same color palette as text color
- Checkmark indicator on selected color
- Applies Tiptap highlight extension

---

### 2.7 ListControls Component

**File**: `components/text-editor/ListControls.tsx`

```typescript
interface ListControlsProps {
  editor: Editor | null;
}
```

**Layout**:
```
┌───┬───┬───┐
│ ☑ │ • │ 1 │
└───┴───┴───┘
```

**Icons**:
- Checklist: Checkbox icon
- Bullet list: Bullet point icon
- Ordered list: Numbered list icon

**Behavior**:
- Toggle list formatting
- Mutually exclusive (only one active)
- Indent/outdent support (Tab/Shift+Tab)

---

## 3. Tiptap Configuration

### 3.1 Extensions Required

```typescript
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: false, // Disable headings for simplicity
    }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    TextAlign.configure({
      types: ['paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    FontFamily.configure({
      types: ['textStyle'],
    }),
    Underline,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
  ],
  content: '<p>Your text here...</p>',
  editorProps: {
    attributes: {
      class: 'prose prose-sm focus:outline-none',
    },
  },
});
```

### 3.2 Custom Font Size Extension

```typescript
import { Extension } from '@tiptap/core';

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace('px', ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: (fontSize: number) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});
```

---

## 4. Integration with Existing HeartCraft Studio

### 4.1 Modified State Structure

```typescript
// app/studio/page.tsx - Enhanced state

const [selectedItem, setSelectedItem] = useState<'none' | 'headline' | 'paragraph' | 'image'>('none');

// NEW: Separate editor instances for headline and paragraph
const [headlineEditor, setHeadlineEditor] = useState<Editor | null>(null);
const [paragraphEditor, setHeadlineEditor] = useState<Editor | null>(null);

// NEW: Text formatting state
const [textFormatting, setTextFormatting] = useState({
  fontFamily: 'Inter',
  fontSize: 24,
  textColor: '#000000',
  backgroundColor: 'transparent',
  customColors: [],
});
```

### 4.2 Left Panel Enhancement

**Current Width**: 320px  
**New Width**: 380px (to accommodate more controls)

**Layout Changes**:
```typescript
// Replace existing text precision controls with:
{isTextSelected && (
  <TextEditorPanel
    editor={selectedItem === 'headline' ? headlineEditor : paragraphEditor}
    onFontChange={(font) => {
      editor?.chain().focus().setFontFamily(font).run();
    }}
    onSizeChange={(size) => {
      editor?.chain().focus().setFontSize(size).run();
    }}
    // ... other props
  />
)}
```

### 4.3 Center Panel (Canvas) Enhancement

**Replace simple text elements with Tiptap EditorContent**:

```typescript
// Before:
<h2 className={...}>{headlineText}</h2>

// After:
<EditorContent 
  editor={headlineEditor}
  className={`tiptap-editor ${currentTheme.headline}`}
/>
```

**Styling for EditorContent**:
```css
.tiptap-editor {
  outline: none;
  min-height: 40px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.tiptap-editor:focus-within {
  ring: 2px solid rgb(168 85 247);
  background: rgb(168 85 247 / 0.1);
}

.tiptap-editor p {
  margin: 0;
}

.tiptap-editor ul,
.tiptap-editor ol {
  padding-left: 1.5rem;
}

.tiptap-editor ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0;
}

.tiptap-editor li[data-type="taskItem"] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
```

---

## 5. Data Persistence

### 5.1 Local Storage Structure

```typescript
interface SavedTextContent {
  headline: {
    html: string;
    json: JSONContent; // Tiptap JSON format
  };
  paragraph: {
    html: string;
    json: JSONContent;
  };
  formatting: {
    customColors: string[];
  };
}

// Save to localStorage
const saveContent = () => {
  const content: SavedTextContent = {
    headline: {
      html: headlineEditor?.getHTML() || '',
      json: headlineEditor?.getJSON() || {},
    },
    paragraph: {
      html: paragraphEditor?.getHTML() || '',
      json: paragraphEditor?.getJSON() || {},
    },
    formatting: {
      customColors: textFormatting.customColors,
    },
  };
  
  localStorage.setItem('hc_text_content', JSON.stringify(content));
};
```

### 5.2 Supabase Database Schema Update

```sql
-- Add new columns to gift_pages table
ALTER TABLE gift_pages
ADD COLUMN headline_html TEXT,
ADD COLUMN headline_json JSONB,
ADD COLUMN message_html TEXT,
ADD COLUMN message_json JSONB,
ADD COLUMN custom_colors TEXT[];

-- Keep existing columns for backward compatibility
-- headline (plain text)
-- message (plain text)
```

### 5.3 Save/Load Functions

```typescript
// Load from database
const loadGiftPage = async (id: string) => {
  const { data, error } = await supabase
    .from('gift_pages')
    .select('*')
    .eq('id', id)
    .single();
  
  if (data) {
    // Load into Tiptap editors
    headlineEditor?.commands.setContent(data.headline_json || data.headline);
    paragraphEditor?.commands.setContent(data.message_json || data.message);
  }
};

// Save to database
const saveGiftPage = async () => {
  const { data, error } = await supabase
    .from('gift_pages')
    .insert([{
      theme: theme,
      headline: headlineEditor?.getText() || '', // Plain text fallback
      headline_html: headlineEditor?.getHTML() || '',
      headline_json: headlineEditor?.getJSON() || {},
      message: paragraphEditor?.getText() || '',
      message_html: paragraphEditor?.getHTML() || '',
      message_json: paragraphEditor?.getJSON() || {},
      image_url: imageUrl,
      custom_colors: textFormatting.customColors,
    }])
    .select();
  
  return data;
};
```

---

## 6. Styling System

### 6.1 Dark Theme Palette

```typescript
const darkTheme = {
  background: {
    primary: '#000000',      // Main panel background
    secondary: '#181818',    // Right panel background
    tertiary: '#1F1F1F',     // Card/section background
    elevated: '#2B2B2B',     // Elevated elements
  },
  border: {
    default: '#2F2F2F',      // Standard borders
    hover: '#3F3F3F',        // Hover state
    focus: '#A855F7',        // Focus/active (purple)
  },
  text: {
    primary: '#FFFFFF',      // Main text
    secondary: '#A3A3A3',    // Secondary text
    tertiary: '#737373',     // Disabled/placeholder
    accent: '#A855F7',       // Purple accent
  },
  button: {
    inactive: {
      bg: 'transparent',
      text: '#737373',
      border: '#2F2F2F',
    },
    active: {
      bg: 'rgba(168, 85, 247, 0.2)',
      text: '#C084FC',
      border: '#A855F7',
    },
    hover: {
      bg: '#2B2B2B',
      text: '#FFFFFF',
    },
  },
};
```

### 6.2 Component-Specific Styles

```css
/* components/text-editor/styles.css */

.text-editor-panel {
  @apply space-y-6;
}

.text-editor-section {
  @apply space-y-2;
}

.text-editor-label {
  @apply text-[10px] text-neutral-500 uppercase tracking-wider font-semibold;
}

.text-editor-toolbar {
  @apply flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800;
}

.text-editor-button {
  @apply p-2 rounded transition-colors duration-200;
  @apply text-neutral-400 hover:bg-neutral-800 hover:text-white;
}

.text-editor-button.active {
  @apply bg-purple-500/20 text-purple-400;
}

.text-editor-input {
  @apply w-full bg-neutral-900 border border-neutral-800 text-neutral-300;
  @apply rounded-lg p-2 text-sm;
  @apply focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500;
  @apply transition-all;
}

.text-editor-select {
  @apply text-editor-input;
  @apply cursor-pointer;
}

.color-swatch {
  @apply w-7 h-7 rounded-full cursor-pointer;
  @apply border border-white/10;
  @apply hover:scale-110 transition-transform duration-200;
}

.color-swatch.selected {
  @apply ring-2 ring-purple-500 ring-offset-2 ring-offset-black;
}

.font-size-control {
  @apply flex items-center bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden;
}

.font-size-button {
  @apply px-3 py-2 hover:bg-neutral-800 text-neutral-400;
  @apply border-neutral-800 transition-colors;
}

.font-size-input {
  @apply w-full bg-transparent text-center text-sm text-white outline-none;
}
```

---

## 7. Performance Optimization

### 7.1 Debouncing Strategy

```typescript
import { useDebouncedCallback } from 'use-debounce';

// Debounce auto-save
const debouncedSave = useDebouncedCallback(() => {
  const content = {
    headline: headlineEditor?.getJSON(),
    paragraph: paragraphEditor?.getJSON(),
  };
  localStorage.setItem('hc_text_content', JSON.stringify(content));
}, 1000); // Save 1 second after user stops typing

// Attach to editor update
useEffect(() => {
  if (!headlineEditor || !paragraphEditor) return;
  
  const handleUpdate = () => {
    debouncedSave();
  };
  
  headlineEditor.on('update', handleUpdate);
  paragraphEditor.on('update', handleUpdate);
  
  return () => {
    headlineEditor.off('update', handleUpdate);
    paragraphEditor.off('update', handleUpdate);
  };
}, [headlineEditor, paragraphEditor, debouncedSave]);
```

### 7.2 Lazy Loading

```typescript
// Lazy load color picker modal
const ColorPickerModal = lazy(() => import('./ColorPickerModal'));

// Use with Suspense
<Suspense fallback={<div>Loading...</div>}>
  {showColorPicker && (
    <ColorPickerModal
      color={currentColor}
      onChange={handleColorChange}
      onClose={() => setShowColorPicker(false)}
    />
  )}
</Suspense>
```

### 7.3 Memoization

```typescript
// Memoize color palette to prevent re-renders
const ColorPalette = memo(({ onColorSelect, selectedColor }: ColorPaletteProps) => {
  return (
    <div className="space-y-2">
      {Object.values(COLOR_PALETTE).map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2">
          {row.map((color) => (
            <ColorSwatch
              key={color}
              color={color}
              selected={selectedColor === color}
              onClick={() => onColorSelect(color)}
            />
          ))}
        </div>
      ))}
    </div>
  );
});
```

---

## 8. Accessibility

### 8.1 Keyboard Shortcuts

```typescript
const KEYBOARD_SHORTCUTS = {
  // Text formatting
  'Mod-b': 'Bold',
  'Mod-i': 'Italic',
  'Mod-u': 'Underline',
  'Mod-Shift-x': 'Strikethrough',
  
  // Alignment
  'Mod-Shift-l': 'Align Left',
  'Mod-Shift-e': 'Align Center',
  'Mod-Shift-r': 'Align Right',
  'Mod-Shift-j': 'Justify',
  
  // Lists
  'Mod-Shift-8': 'Bullet List',
  'Mod-Shift-7': 'Ordered List',
  'Mod-Shift-9': 'Task List',
  
  // Font size
  'Mod-Shift-.': 'Increase Font Size',
  'Mod-Shift-,': 'Decrease Font Size',
  
  // Undo/Redo
  'Mod-z': 'Undo',
  'Mod-Shift-z': 'Redo',
};
```

### 8.2 ARIA Labels

```typescript
<button
  aria-label="Bold text"
  aria-pressed={editor?.isActive('bold')}
  onClick={() => editor?.chain().focus().toggleBold().run()}
>
  <b>B</b>
</button>

<select
  aria-label="Font family"
  value={fontFamily}
  onChange={(e) => handleFontChange(e.target.value)}
>
  {/* options */}
</select>

<div
  role="radiogroup"
  aria-label="Text alignment"
>
  <button role="radio" aria-checked={textAlign === 'left'}>
    Left
  </button>
  {/* other alignment buttons */}
</div>
```

### 8.3 Focus Management

```typescript
// Ensure editor receives focus after formatting change
const handleFormatting = (command: () => void) => {
  command();
  editor?.commands.focus();
};

// Trap focus in color picker modal
const ColorPickerModal = ({ onClose }: Props) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  return <div ref={modalRef} role="dialog" aria-modal="true">{/* content */}</div>;
};
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// __tests__/FontSizeControl.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import FontSizeControl from '@/components/text-editor/FontSizeControl';

describe('FontSizeControl', () => {
  it('increments font size', () => {
    const onChange = jest.fn();
    render(<FontSizeControl value={16} onChange={onChange} />);
    
    const incrementButton = screen.getByLabelText('Increase font size');
    fireEvent.click(incrementButton);
    
    expect(onChange).toHaveBeenCalledWith(17);
  });
  
  it('respects max limit', () => {
    const onChange = jest.fn();
    render(<FontSizeControl value={72} onChange={onChange} max={72} />);
    
    const incrementButton = screen.getByLabelText('Increase font size');
    fireEvent.click(incrementButton);
    
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

### 9.2 Integration Tests

```typescript
// __tests__/TextEditorPanel.test.tsx
describe('TextEditorPanel Integration', () => {
  it('applies formatting to editor', () => {
    const { editor } = setupEditor();
    render(<TextEditorPanel editor={editor} />);
    
    // Type text
    editor.commands.setContent('Hello World');
    
    // Click bold button
    const boldButton = screen.getByLabelText('Bold text');
    fireEvent.click(boldButton);
    
    // Verify editor state
    expect(editor.isActive('bold')).toBe(true);
    expect(editor.getHTML()).toContain('<strong>');
  });
});
```

### 9.3 E2E Tests (Playwright)

```typescript
// e2e/text-editor.spec.ts
import { test, expect } from '@playwright/test';

test('complete text formatting workflow', async ({ page }) => {
  await page.goto('/studio');
  
  // Click headline to select
  await page.click('text=Happy Anniversary!');
  
  // Change font size
  await page.click('[aria-label="Font size"]');
  await page.fill('[aria-label="Font size"]', '32');
  
  // Apply bold
  await page.click('[aria-label="Bold text"]');
  
  // Change color
  await page.click('[aria-label="Text color"]');
  await page.click('[data-color="#FF5F5F"]');
  
  // Verify changes
  const headline = page.locator('.tiptap-editor').first();
  await expect(headline).toHaveCSS('font-size', '32px');
  await expect(headline.locator('strong')).toBeVisible();
});
```

---

## 10. Migration Plan

### 10.1 Phase 1: Foundation (Week 1)

**Tasks**:
1. Install dependencies
2. Create base component structure
3. Set up Tiptap editors
4. Implement basic font controls

**Deliverables**:
- Working font family selector
- Working font size control
- Basic text styling (B, I, U)

**Testing**:
- Unit tests for each component
- Manual testing in studio

---

### 10.2 Phase 2: Color System (Week 2)

**Tasks**:
1. Build color palette component
2. Implement text color picker
3. Add background color/highlight
4. Create custom color slots

**Deliverables**:
- Full color palette with 4 rows
- Custom color persistence
- Color picker modal

**Testing**:
- Color selection accuracy
- Custom color save/load
- Visual regression tests

---

### 10.3 Phase 3: Advanced Features (Week 3)

**Tasks**:
1. Implement alignment controls
2. Add list formatting
3. Create keyboard shortcuts
4. Add undo/redo

**Deliverables**:
- Complete text formatting toolbar
- List controls (bullet, ordered, task)
- Keyboard shortcut system

**Testing**:
-
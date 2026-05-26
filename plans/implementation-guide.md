# Samsung Notes Text Editor - Implementation Guide

## 🚀 Quick Start

This guide provides step-by-step instructions for implementing the Samsung Notes-style text editor in HeartCraft.

---

## Prerequisites

- Node.js 18+ installed
- Existing HeartCraft project running
- Basic understanding of React, TypeScript, and Tiptap
- Familiarity with Tailwind CSS

---

## Step 1: Install Dependencies

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-highlight @tiptap/extension-text-align @tiptap/extension-font-family @tiptap/extension-underline @tiptap/extension-task-list @tiptap/extension-task-item

# Optional: For advanced color picker
npm install react-colorful

# Optional: For debouncing
npm install use-debounce
```

---

## Step 2: Create Component Structure

Create the following directory structure:

```
components/
└── text-editor/
    ├── TextEditorPanel.tsx          # Main panel component
    ├── FontFamilySelector.tsx       # Font dropdown
    ├── FontSizeControl.tsx          # Size input with +/-
    ├── TextStyleToolbar.tsx         # B, I, U, S buttons
    ├── AlignmentToolbar.tsx         # Alignment buttons
    ├── ColorPalette.tsx             # Color grid
    ├── ColorSwatch.tsx              # Individual color button
    ├── BackgroundColorPicker.tsx    # Highlight color
    ├── ListControls.tsx             # List formatting
    ├── ColorPickerModal.tsx         # Advanced color picker
    ├── types.ts                     # TypeScript interfaces
    ├── constants.ts                 # Color palettes, fonts
    ├── hooks/
    │   ├── useTextEditor.ts         # Editor state hook
    │   └── useColorPicker.ts        # Color picker logic
    └── styles.css                   # Component styles
```

---

## Step 3: Define Constants

**File**: [`components/text-editor/constants.ts`](components/text-editor/constants.ts)

```typescript
export const COLOR_PALETTE = {
  row1: ['#FF5F5F', '#FFD700', '#00CED1', '#5F7FFF', '#9F5FFF', '#000000', '#FFFFFF'],
  row2: ['#FF7F7F', '#2F2F2F', '#2F7F7F', '#2F2F7F', '#7F5F3F', '#F5E6D3'],
  row3: ['#FFFF7F', '#FF7F9F', '#7FFF9F', '#9F9FFF', '#AAAAAA', '#FFFFFF', '#FFA500', '#00FF7F'],
  row4: ['#7F9FFF', '#9F9FDF', '#D4AF37', '#C8A2C8', '#9F7FBF', '#D2B48C']
};

export const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter', category: 'sans-serif' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'serif' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
  { value: 'Montserrat', label: 'Montserrat', category: 'sans-serif' },
  { value: 'Roboto', label: 'Roboto', category: 'sans-serif' },
  { value: 'Lora', label: 'Lora', category: 'serif' },
];

export const FONT_SIZE_PRESETS = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

export const FONT_SIZE_LIMITS = {
  min: 8,
  max: 72,
  default: 16,
};
```

---

## Step 4: Create Custom Font Size Extension

**File**: [`components/text-editor/extensions/FontSize.ts`](components/text-editor/extensions/FontSize.ts)

```typescript
import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

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
      setFontSize: (fontSize: string) => ({ chain }) => {
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

## Step 5: Create useTextEditor Hook

**File**: [`components/text-editor/hooks/useTextEditor.ts`](components/text-editor/hooks/useTextEditor.ts)

```typescript
import { useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { FontSize } from '../extensions/FontSize';

interface UseTextEditorProps {
  content?: string;
  onUpdate?: (editor: Editor) => void;
  editable?: boolean;
}

export const useTextEditor = ({ 
  content = '', 
  onUpdate,
  editable = true 
}: UseTextEditorProps = {}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextStyle,
      FontSize,
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
    content,
    editable,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[40px] p-2',
      },
    },
  });

  return editor;
};
```

---

## Step 6: Build Core Components

### 6.1 ColorSwatch Component

**File**: [`components/text-editor/ColorSwatch.tsx`](components/text-editor/ColorSwatch.tsx)

```typescript
interface ColorSwatchProps {
  color: string;
  selected?: boolean;
  onClick: () => void;
}

export const ColorSwatch = ({ color, selected, onClick }: ColorSwatchProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-7 h-7 rounded-full cursor-pointer
        border border-white/10
        hover:scale-110 transition-transform duration-200
        ${selected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : ''}
      `}
      style={{ backgroundColor: color }}
      aria-label={`Select color ${color}`}
      aria-pressed={selected}
    />
  );
};
```

### 6.2 FontSizeControl Component

**File**: [`components/text-editor/FontSizeControl.tsx`](components/text-editor/FontSizeControl.tsx)

```typescript
import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { FONT_SIZE_LIMITS, FONT_SIZE_PRESETS } from './constants';

interface FontSizeControlProps {
  editor: Editor | null;
}

export const FontSizeControl = ({ editor }: FontSizeControlProps) => {
  const [showPresets, setShowPresets] = useState(false);
  
  const currentSize = editor?.getAttributes('textStyle').fontSize || FONT_SIZE_LIMITS.default;
  
  const handleSizeChange = (size: number) => {
    if (size < FONT_SIZE_LIMITS.min || size > FONT_SIZE_LIMITS.max) return;
    editor?.chain().focus().setFontSize(`${size}`).run();
  };
  
  const increment = () => handleSizeChange(parseInt(currentSize) + 1);
  const decrement = () => handleSizeChange(parseInt(currentSize) - 1);
  
  return (
    <div className="relative">
      <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={decrement}
          disabled={parseInt(currentSize) <= FONT_SIZE_LIMITS.min}
          className="px-3 py-2 hover:bg-neutral-800 text-neutral-400 border-r border-neutral-800 disabled:opacity-50"
          aria-label="Decrease font size"
        >
          −
        </button>
        
        <input
          type="number"
          value={currentSize}
          onChange={(e) => handleSizeChange(parseInt(e.target.value))}
          className="w-16 bg-transparent text-center text-sm text-white outline-none"
          min={FONT_SIZE_LIMITS.min}
          max={FONT_SIZE_LIMITS.max}
          aria-label="Font size"
        />
        
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="px-2 py-2 hover:bg-neutral-800 text-neutral-400 border-l border-neutral-800"
          aria-label="Font size presets"
        >
          ▼
        </button>
        
        <button
          type="button"
          onClick={increment}
          disabled={parseInt(currentSize) >= FONT_SIZE_LIMITS.max}
          className="px-3 py-2 hover:bg-neutral-800 text-neutral-400 border-l border-neutral-800 disabled:opacity-50"
          aria-label="Increase font size"
        >
          +
        </button>
      </div>
      
      {showPresets && (
        <div className="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {FONT_SIZE_PRESETS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => {
                handleSizeChange(size);
                setShowPresets(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800"
            >
              {size}px
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 6.3 TextStyleToolbar Component

**File**: [`components/text-editor/TextStyleToolbar.tsx`](components/text-editor/TextStyleToolbar.tsx)

```typescript
import { Editor } from '@tiptap/react';

interface TextStyleToolbarProps {
  editor: Editor | null;
}

export const TextStyleToolbar = ({ editor }: TextStyleToolbarProps) => {
  if (!editor) return null;
  
  const buttons = [
    { 
      label: 'Bold', 
      format: 'bold', 
      icon: <b>B</b>,
      shortcut: 'Ctrl+B'
    },
    { 
      label: 'Italic', 
      format: 'italic', 
      icon: <i>I</i>,
      shortcut: 'Ctrl+I'
    },
    { 
      label: 'Underline', 
      format: 'underline', 
      icon: <u>U</u>,
      shortcut: 'Ctrl+U'
    },
    { 
      label: 'Strike', 
      format: 'strike', 
      icon: <s>S</s>,
      shortcut: 'Ctrl+Shift+X'
    },
  ];
  
  return (
    <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
      {buttons.map(({ label, format, icon, shortcut }) => (
        <button
          key={format}
          type="button"
          onClick={() => editor.chain().focus().toggleMark(format).run()}
          className={`
            p-2 rounded transition-colors duration-200
            ${editor.isActive(format) 
              ? 'bg-purple-500/20 text-purple-400' 
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }
          `}
          aria-label={`${label} (${shortcut})`}
          aria-pressed={editor.isActive(format)}
          title={`${label} (${shortcut})`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};
```

### 6.4 AlignmentToolbar Component

**File**: [`components/text-editor/AlignmentToolbar.tsx`](components/text-editor/AlignmentToolbar.tsx)

```typescript
import { Editor } from '@tiptap/react';

interface AlignmentToolbarProps {
  editor: Editor | null;
}

export const AlignmentToolbar = ({ editor }: AlignmentToolbarProps) => {
  if (!editor) return null;
  
  const alignments = [
    { value: 'left', icon: '←', label: 'Align left' },
    { value: 'center', icon: '≡', label: 'Align center' },
    { value: 'right', icon: '→', label: 'Align right' },
    { value: 'justify', icon: '≣', label: 'Justify' },
  ];
  
  return (
    <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
      {alignments.map(({ value, icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => editor.chain().focus().setTextAlign(value).run()}
          className={`
            p-2 rounded transition-colors duration-200
            ${editor.isActive({ textAlign: value })
              ? 'bg-purple-500/20 text-purple-400'
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }
          `}
          aria-label={label}
          aria-pressed={editor.isActive({ textAlign: value })}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};
```

### 6.5 ColorPalette Component

**File**: [`components/text-editor/ColorPalette.tsx`](components/text-editor/ColorPalette.tsx)

```typescript
import { Editor } from '@tiptap/react';
import { ColorSwatch } from './ColorSwatch';
import { COLOR_PALETTE } from './constants';

interface ColorPaletteProps {
  editor: Editor | null;
  mode: 'text' | 'background';
}

export const ColorPalette = ({ editor, mode }: ColorPaletteProps) => {
  if (!editor) return null;
  
  const currentColor = mode === 'text' 
    ? editor.getAttributes('textStyle').color 
    : editor.getAttributes('highlight').color;
  
  const handleColorSelect = (color: string) => {
    if (mode === 'text') {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
  };
  
  return (
    <div className="space-y-2">
      {Object.values(COLOR_PALETTE).map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2 flex-wrap">
          {row.map((color) => (
            <ColorSwatch
              key={color}
              color={color}
              selected={currentColor === color}
              onClick={() => handleColorSelect(color)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
```

### 6.6 ListControls Component

**File**: [`components/text-editor/ListControls.tsx`](components/text-editor/ListControls.tsx)

```typescript
import { Editor } from '@tiptap/react';

interface ListControlsProps {
  editor: Editor | null;
}

export const ListControls = ({ editor }: ListControlsProps) => {
  if (!editor) return null;
  
  const lists = [
    { type: 'taskList', icon: '☑', label: 'Task list' },
    { type: 'bulletList', icon: '•', label: 'Bullet list' },
    { type: 'orderedList', icon: '1.', label: 'Numbered list' },
  ];
  
  return (
    <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
      {lists.map(({ type, icon, label }) => (
        <button
          key={type}
          type="button"
          onClick={() => editor.chain().focus().toggleList(type, 'listItem').run()}
          className={`
            p-2 rounded transition-colors duration-200
            ${editor.isActive(type)
              ? 'bg-purple-500/20 text-purple-400'
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }
          `}
          aria-label={label}
          aria-pressed={editor.isActive(type)}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};
```

---

## Step 7: Create Main TextEditorPanel

**File**: [`components/text-editor/TextEditorPanel.tsx`](components/text-editor/TextEditorPanel.tsx)

```typescript
import { Editor } from '@tiptap/react';
import { FontSizeControl } from './FontSizeControl';
import { TextStyleToolbar } from './TextStyleToolbar';
import { AlignmentToolbar } from './AlignmentToolbar';
import { ColorPalette } from './ColorPalette';
import { ListControls } from './ListControls';
import { FONT_FAMILIES } from './constants';

interface TextEditorPanelProps {
  editor: Editor | null;
}

export const TextEditorPanel = ({ editor }: TextEditorPanelProps) => {
  if (!editor) return null;
  
  const currentFont = editor.getAttributes('textStyle').fontFamily || 'Inter';
  
  return (
    <div className="space-y-6">
      {/* Font Controls */}
      <div className="space-y-2">
        <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
          Font Family
        </label>
        <select
          value={currentFont}
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg p-2 text-sm focus:outline-none focus:border-purple-500"
        >
          {FONT_FAMILIES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
          Font Size
        </label>
        <FontSizeControl editor={editor} />
      </div>
      
      {/* Text Styling */}
      <div className="space-y-2">
        <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
          Text Style
        </label>
        <TextStyleToolbar editor={editor} />
      </div>
      
      {/* Alignment */}
      <div className="space-y-2">
        <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
          Alignment
        </label>
        <AlignmentToolbar editor={editor} />
      </div>
      
      {/* Text Color */}
      <div className="space-y-2">
        <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
          Text Color
        </label>
        <ColorPalette editor={editor} mode="text" />
      </div>
      
      {/* Background Color */}
      <div className="space-y-2">
        <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
          Background Highlight
        </label>
        <ColorPalette editor={editor} mode="background" />
      </div>
      
      {/* Lists */}
      <div className="space-y-2">
        <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
          Lists
        </label>
        <ListControls editor={editor} />
      </div>
    </div>
  );
};
```

---

## Step 8: Integrate into HeartCraft Studio

**File**: [`app/studio/page.tsx`](app/studio/page.tsx) (modifications)

```typescript
"use client";

import { useState, useEffect } from "react";
import { EditorContent } from '@tiptap/react';
import { useTextEditor } from '@/components/text-editor/hooks/useTextEditor';
import { TextEditorPanel } from '@/components/text-editor/TextEditorPanel';
// ... other imports

export default function Studio() {
  // ... existing state
  
  // NEW: Initialize Tiptap editors
  const headlineEditor = useTextEditor({
    content: '<p>Happy Anniversary!</p>',
    onUpdate: (editor) => {
      // Auto-save
      localStorage.setItem('hc_headline_html', editor.getHTML());
    },
  });
  
  const paragraphEditor = useTextEditor({
    content: '<p>Thank you for the best year of my life. I love you more than words can say.</p>',
    onUpdate: (editor) => {
      localStorage.setItem('hc_paragraph_html', editor.getHTML());
    },
  });
  
  // Load saved content
  useEffect(() => {
    const savedHeadline = localStorage.getItem('hc_headline_html');
    const savedParagraph = localStorage.getItem('hc_paragraph_html');
    
    if (savedHeadline && headlineEditor) {
      headlineEditor.commands.setContent(savedHeadline);
    }
    if (savedParagraph && paragraphEditor) {
      paragraphEditor.commands.setContent(savedParagraph);
    }
  }, [headlineEditor, paragraphEditor]);
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-700">
      {/* LEFT PANEL - Enhanced */}
      <div style={{ width: leftOpen ? 380 : 0 }} className="bg-black flex flex-col relative z-20 shrink-0">
        {/* ... existing panel header */}
        
        <div className="p-6 w-full h-full overflow-y-auto">
          <p className="text-white text-lg font-bold tracking-widest uppercase mb-8">Design</p>
          
          {/* NEW: Show TextEditorPanel when text is selected */}
          {isTextSelected && (
            <TextEditorPanel 
              editor={selectedItem === 'headline' ? headlineEditor : paragraphEditor}
            />
          )}
          
          {/* Keep existing global themes panel */}
          {isNoneSelected && (
            // ... existing theme selector
          )}
        </div>
      </div>
      
      {/* CENTER PANEL - Enhanced */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="w-[320px] h-[650px] rounded-[2.5rem] shadow-2xl border-[6px] overflow-hidden flex flex-col">
          {/* ... image area */}
          
          <div className="p-6 flex flex-col gap-4 text-center mt-4">
            {/* NEW: Replace simple text with Tiptap editor */}
            <div
              onClick={() => setSelectedItem('headline')}
              className={`cursor-pointer rounded-lg px-2 py-1 transition-all duration-300 ${
                selectedItem === 'headline' 
                  ? 'ring-2 ring-purple-500 bg-purple-500/10' 
                  : 'hover:bg-black/5'
              }`}
            >
              <EditorContent 
                editor={headlineEditor}
                className={`tiptap-headline ${currentTheme.headline}`}
              />
            </div>
            
            <div
              onClick={() => setSelectedItem('paragraph')}
              className={`cursor-pointer rounded-lg px-2 py-1 transition-all duration-300 ${
                selectedItem === 'paragraph'
                  ? 'ring-2 ring-purple-500 bg-purple-500/10'
                  : 'hover:bg-black/5'
              }`}
            >
              <EditorContent 
                editor={paragraphEditor}
                className={`tiptap-paragraph ${currentTheme.paragraph}`}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* RIGHT PANEL - Keep existing */}
      {/* ... */}
    </div>
  );
}
```

---

## Step 9: Add Tiptap Styles

**File**: [`app/globals.css`](app/globals.css)

```css
@import "tailwindcss";

/* Tiptap Editor Styles */
.tiptap-headline,
.tiptap-paragraph {
  outline: none;
  min-height: 40px;
}

.tiptap-headline p,
.tiptap-paragraph p {
  margin: 0;
}

.tiptap-headline ul,
.tiptap-headline ol,
.tiptap-paragraph ul,
.tiptap-paragraph ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.tiptap-headline ul[data-type="taskList"],
.tiptap-paragraph ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0;
}

.tiptap-headline li[data-type="taskItem"],
.tiptap-paragraph li[data-type="taskItem"] {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.tiptap-headline li[data-type="taskItem"] > label,
.tiptap-paragraph li[data-type="taskItem"] > label {
  flex-shrink: 0;
  margin-top: 0.2rem;
}

.tiptap-headline li[data-type="taskItem"] > div,
.tiptap-paragraph li[data-type="taskItem"] > div {
  flex: 1;
}

/* Placeholder */
.tiptap-headline p.is-editor-empty:first-child::before,
.tiptap-paragraph p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
```

---

## Step 10: Update Database Schema

Run this SQL migration in your Supabase dashboard:

```sql
-- Add new columns for rich text content
ALTER TABLE gift_pages
ADD COLUMN IF NOT EXISTS headline_html TEXT,
ADD COLUMN IF NOT EXISTS headline_json JSONB,
ADD COLUMN IF NOT EXISTS message_html TEXT,
ADD COLUMN IF NOT EXISTS message_json JSONB;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_gift_pages_created_at ON gift_pages(created_at DESC);
```

---

## Step 11: Update Publish Function

**File**: [`app/studio/page.tsx`](app/studio/page.tsx)

```typescript
const handlePublish = async () => {
  setIsPublishing(true);
  try {
    const { data, error } = await supabase
      .from('gift_pages')
      .insert([
        { 
          theme: theme,
          // Plain text fallback
          headline: headlineEditor?.getText() || '',
          message: paragraphEditor?.getText() || '',
          // Rich text content
          headline_html: headlineEditor?.getHTML() || '',
          headline_json: headlineEditor?.getJSON() || {},
          message_html: paragraphEditor?.getHTML() || '',
          message_json: paragraphEditor?.getJSON() || {},
          image_url: imageUrl,
        }
      ])
      .select();

    if (error) throw error;

    const newPageId = data[0].id;
    setPublishedId(newPageId);
    setShowShareModal(true);
    
  } catch (error) {
    console.error("Publish Error:", error);
    alert("Failed to save to database.");
  } finally {
    setIsPublishing(false);
  }
};
```

---

## Step 12: Update Gift Display Page

**File**: [`app/gift/[id]/page.tsx`](app/gift/[id]/page.tsx)

```typescript
export default async function GiftPage({ params }: { params: { id: string } }) {
  const { data: gift } = await supabase
    .from('gift_pages')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!gift) {
    return <div>Gift not found</div>;
  }

  return (
    <div className="min-h-screen flex items-
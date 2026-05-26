'use client';

import { useState } from 'react';
import { Palette } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import FontFamilySelector from './FontFamilySelector';
import FontSizeControl from './FontSizeControl';
import TextStyleToolbar from './TextStyleToolbar';
import AlignmentToolbar from './AlignmentToolbar';
import ColorPalette from './ColorPalette';
import BackgroundColorPicker from './BackgroundColorPicker';
import ListControls from './ListControls';

interface TextEditorPanelProps {
  editor: Editor | null;
}

export default function TextEditorPanel({ editor }: TextEditorPanelProps) {
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFF7F');

  const handleFontFamilyChange = (font: string) => {
    setFontFamily(font);
    editor?.chain().focus().setFontFamily(font).run();
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    editor?.chain().focus().setFontSize(`${size}px`).run();
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    editor?.chain().focus().setColor(color).run();
  };

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
  };

  if (!editor) {
    return (
      <div className="space-y-6 p-4">
        <div className="text-neutral-500 text-sm">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Section Label */}
      <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
        Text Precision
      </div>

      {/* Font Controls */}
      <div className="space-y-3 w-full">
        <label className="text-xs text-neutral-400">Font Family</label>
        <FontFamilySelector
          value={fontFamily}
          onChange={handleFontFamilyChange}
          editor={editor}
        />
      </div>

      <div className="space-y-3 w-full">
        <label className="text-xs text-neutral-400">Font Size</label>
        <FontSizeControl
          value={fontSize}
          onChange={handleFontSizeChange}
          editor={editor}
        />
      </div>

      {/* Text Style Toolbar */}
      <div className="space-y-3 w-full">
        <label className="text-xs text-neutral-400">Text Style</label>
        <TextStyleToolbar editor={editor} />
      </div>

      {/* Alignment Toolbar */}
      <div className="space-y-3 w-full">
        <label className="text-xs text-neutral-400">Alignment</label>
        <AlignmentToolbar editor={editor} />
      </div>

      {/* Text Color */}
      <div className="space-y-3 w-full">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-neutral-400" />
          <label className="text-xs text-neutral-400">Text Color</label>
        </div>
        <ColorPalette
          onColorSelect={handleTextColorChange}
          selectedColor={textColor}
          mode="text"
        />
      </div>

      {/* Background Color */}
      <div className="space-y-3 w-full">
        <BackgroundColorPicker
          editor={editor}
          selectedColor={backgroundColor}
          onColorChange={handleBackgroundColorChange}
        />
      </div>

      {/* List Controls */}
      <div className="space-y-3 w-full">
        <label className="text-xs text-neutral-400">Lists</label>
        <ListControls editor={editor} />
      </div>
    </div>
  );
}

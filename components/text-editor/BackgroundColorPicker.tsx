'use client';

import { useState } from 'react';
import { Highlighter } from 'lucide-react';
import ColorPalette from './ColorPalette';
import type { Editor } from '@tiptap/react';

interface BackgroundColorPickerProps {
  editor: Editor | null;
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export default function BackgroundColorPicker({ 
  editor, 
  selectedColor, 
  onColorChange 
}: BackgroundColorPickerProps) {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    
    if (!newEnabled) {
      editor?.chain().focus().unsetHighlight().run();
    } else if (selectedColor) {
      editor?.chain().focus().setHighlight({ color: selectedColor }).run();
    }
  };

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    if (enabled) {
      editor?.chain().focus().setHighlight({ color }).run();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            enabled
              ? 'bg-purple-500/20 border-purple-500 text-purple-400'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
          }`}
          aria-label="Toggle background highlight"
        >
          <Highlighter className="w-4 h-4" />
          <span className="text-sm">Background</span>
        </button>
      </div>

      {enabled && (
        <ColorPalette
          onColorSelect={handleColorSelect}
          selectedColor={selectedColor}
          mode="background"
        />
      )}
    </div>
  );
}

'use client';

import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';

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
  { value: 'Open Sans', label: 'Open Sans', category: 'sans-serif' },
  { value: 'Merriweather', label: 'Merriweather', category: 'serif' },
];

export default function FontFamilySelector({ value, onChange, editor }: FontFamilySelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFontSelect = (font: string) => {
    onChange(font);
    setShowDropdown(false);
    editor?.commands.focus();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center justify-between bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg px-3 py-2 hover:border-neutral-700 focus:border-purple-500 focus:outline-none transition-colors"
        aria-label="Font family"
      >
        <span className="text-sm truncate" style={{ fontFamily: value }}>
          {value}
        </span>
        <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 py-1 max-h-80 overflow-y-auto">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.value}
              onClick={() => handleFontSelect(font.value)}
              className={`w-full px-4 py-3 text-left hover:bg-neutral-800 transition-colors ${
                font.value === value ? 'bg-purple-500/20 text-purple-400' : 'text-neutral-300'
              }`}
              style={{ fontFamily: font.value }}
            >
              <div className="flex flex-col">
                <span className="text-sm">{font.label}</span>
                <span className="text-xs text-neutral-500">{font.category}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

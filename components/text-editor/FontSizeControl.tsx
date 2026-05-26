'use client';

import { Minus, Plus, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';

interface FontSizeControlProps {
  value: number;
  onChange: (size: number) => void;
  editor: Editor | null;
  min?: number;
  max?: number;
}

const FONT_SIZE_PRESETS = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

export default function FontSizeControl({ 
  value, 
  onChange, 
  editor,
  min = 8, 
  max = 72 
}: FontSizeControlProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
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

  const handleIncrement = () => {
    const newSize = Math.min(value + 1, max);
    onChange(newSize);
    setInputValue(newSize.toString());
  };

  const handleDecrement = () => {
    const newSize = Math.max(value - 1, min);
    onChange(newSize);
    setInputValue(newSize.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
      setInputValue(clampedValue.toString());
    } else {
      setInputValue(value.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      editor?.commands.focus();
    }
  };

  const handlePresetSelect = (size: number) => {
    onChange(size);
    setInputValue(size.toString());
    setShowDropdown(false);
    editor?.commands.focus();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <button
          onClick={handleDecrement}
          disabled={value <= min}
          className="px-3 py-2 hover:bg-neutral-800 text-neutral-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease font size"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="w-12 bg-transparent text-center text-sm text-white outline-none"
          aria-label="Font size"
        />
        
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-2 py-2 hover:bg-neutral-800 text-neutral-400 transition-colors border-l border-neutral-800"
          aria-label="Font size presets"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className="px-3 py-2 hover:bg-neutral-800 text-neutral-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-l border-neutral-800"
          aria-label="Increase font size"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
          {FONT_SIZE_PRESETS.map((size) => (
            <button
              key={size}
              onClick={() => handlePresetSelect(size)}
              className={`w-full px-4 py-2 text-left hover:bg-neutral-800 transition-colors ${
                size === value ? 'bg-purple-500/20 text-purple-400' : 'text-neutral-300'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

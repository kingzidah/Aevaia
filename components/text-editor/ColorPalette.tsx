'use client';

import { Check } from 'lucide-react';

interface ColorPaletteProps {
  onColorSelect: (color: string) => void;
  selectedColor: string;
  mode?: 'text' | 'background';
}

// Samsung Notes exact color palette
const COLOR_PALETTE = {
  row1: ['#FF5F5F', '#FFD700', '#00CED1', '#5F7FFF', '#9F5FFF', '#000000', '#FFFFFF'],
  row2: ['#FF7F7F', '#2F2F2F', '#2F7F7F', '#2F2F7F', '#7F5F3F', '#F5E6D3'],
  row3: ['#FFFF7F', '#FF7F9F', '#7FFF9F', '#9F9FFF', '#AAAAAA', '#FFFFFF', '#FFA500', '#00FF7F'],
  row4: ['#7F9FFF', '#9F9FDF', '#D4AF37', '#C8A2C8', '#9F7FBF', '#D2B48C'],
};

export default function ColorPalette({ onColorSelect, selectedColor, mode = 'text' }: ColorPaletteProps) {
  return (
    <div className="space-y-2">
      {Object.values(COLOR_PALETTE).map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2 justify-start">
          {row.map((color) => (
            <button
              key={color}
              onClick={() => onColorSelect(color)}
              className="relative w-7 h-7 rounded-full cursor-pointer border border-white/10 hover:scale-110 transition-transform duration-200 flex items-center justify-center"
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
              title={color}
            >
              {selectedColor === color && (
                <Check 
                  className="w-4 h-4" 
                  style={{ 
                    color: color === '#FFFFFF' || color === '#FFFF7F' || color === '#FFD700' ? '#000000' : '#FFFFFF',
                    strokeWidth: 3
                  }} 
                />
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

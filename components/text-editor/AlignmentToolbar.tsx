'use client';

import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import type { Editor } from '@tiptap/react';

interface AlignmentToolbarProps {
  editor: Editor | null;
}

export default function AlignmentToolbar({ editor }: AlignmentToolbarProps) {
  if (!editor) return null;

  const alignments = [
    {
      icon: AlignLeft,
      label: 'Align Left',
      value: 'left',
      action: () => editor.chain().focus().setTextAlign('left').run(),
    },
    {
      icon: AlignCenter,
      label: 'Align Center',
      value: 'center',
      action: () => editor.chain().focus().setTextAlign('center').run(),
    },
    {
      icon: AlignRight,
      label: 'Align Right',
      value: 'right',
      action: () => editor.chain().focus().setTextAlign('right').run(),
    },
    {
      icon: AlignJustify,
      label: 'Justify',
      value: 'justify',
      action: () => editor.chain().focus().setTextAlign('justify').run(),
    },
  ];

  return (
    <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
      {alignments.map((alignment) => {
        const Icon = alignment.icon;
        const isActive = editor.isActive({ textAlign: alignment.value });
        
        return (
          <button
            key={alignment.value}
            onClick={alignment.action}
            className={`p-2 rounded transition-colors duration-200 ${
              isActive
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
            aria-label={alignment.label}
            title={alignment.label}
            aria-pressed={isActive}
          >
            <Icon className="w-4 h-4" strokeWidth={2.5} />
          </button>
        );
      })}
    </div>
  );
}

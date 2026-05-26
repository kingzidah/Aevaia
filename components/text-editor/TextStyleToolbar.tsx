'use client';

import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';
import type { Editor } from '@tiptap/react';

interface TextStyleToolbarProps {
  editor: Editor | null;
}

export default function TextStyleToolbar({ editor }: TextStyleToolbarProps) {
  if (!editor) return null;

  const buttons = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      shortcut: 'Ctrl+B',
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      shortcut: 'Ctrl+I',
    },
    {
      icon: Underline,
      label: 'Underline',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive('underline'),
      shortcut: 'Ctrl+U',
    },
    {
      icon: Strikethrough,
      label: 'Strikethrough',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
      shortcut: 'Ctrl+Shift+X',
    },
  ];

  return (
    <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
      {buttons.map((button) => {
        const Icon = button.icon;
        return (
          <button
            key={button.label}
            onClick={button.action}
            className={`p-2 rounded transition-colors duration-200 ${
              button.isActive
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
            aria-label={button.label}
            title={`${button.label} (${button.shortcut})`}
            aria-pressed={button.isActive}
          >
            <Icon className="w-4 h-4" strokeWidth={2.5} />
          </button>
        );
      })}
    </div>
  );
}

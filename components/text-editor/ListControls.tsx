'use client';

import { List, ListOrdered, CheckSquare } from 'lucide-react';
import type { Editor } from '@tiptap/react';

interface ListControlsProps {
  editor: Editor | null;
}

export default function ListControls({ editor }: ListControlsProps) {
  if (!editor) return null;

  const lists = [
    {
      icon: CheckSquare,
      label: 'Task List',
      action: () => editor.chain().focus().toggleTaskList().run(),
      isActive: editor.isActive('taskList'),
    },
    {
      icon: List,
      label: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
  ];

  return (
    <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
      {lists.map((list) => {
        const Icon = list.icon;
        return (
          <button
            key={list.label}
            onClick={list.action}
            className={`p-2 rounded transition-colors duration-200 ${
              list.isActive
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
            aria-label={list.label}
            title={list.label}
            aria-pressed={list.isActive}
          >
            <Icon className="w-4 h-4" strokeWidth={2.5} />
          </button>
        );
      })}
    </div>
  );
}

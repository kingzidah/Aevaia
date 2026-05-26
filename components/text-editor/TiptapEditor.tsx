'use client';

import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';

interface TiptapEditorProps {
  editor: Editor | null;
  className?: string;
}

export default function TiptapEditor({ editor, className = '' }: TiptapEditorProps) {
  if (!editor) {
    return null;
  }

  return (
    <EditorContent 
      editor={editor} 
      className={`tiptap-editor ${className}`}
    />
  );
}

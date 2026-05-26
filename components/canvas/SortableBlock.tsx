"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { useState } from "react";

interface SortableBlockProps {
  id: string;
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

export function SortableBlock({ id, children, isSelected, onClick }: SortableBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`relative ${isDragging ? 'z-50 opacity-60 shadow-2xl' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle - appears on hover (Notion-style) */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: isHovered || isDragging ? 1 : 0, x: isHovered || isDragging ? 0 : -10 }}
        transition={{ duration: 0.2 }}
        className="absolute -left-8 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <div className={`p-1 rounded border backdrop-blur-sm transition-all ${
          isDragging
            ? 'bg-purple-600 border-purple-500 shadow-lg'
            : 'bg-neutral-800/80 hover:bg-neutral-700 border-neutral-600/50'
        }`}>
          <GripVertical className={`w-4 h-4 ${isDragging ? 'text-white' : 'text-neutral-400'}`} />
        </div>
      </motion.div>

      {/* Block Content */}
      <div onClick={onClick}>
        {children}
      </div>
    </motion.div>
  );
}

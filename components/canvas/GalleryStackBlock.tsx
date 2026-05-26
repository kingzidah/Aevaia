'use client';

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { MouseEvent } from 'react';
import { ImageIcon } from 'lucide-react';

interface GalleryStackBlockProps {
  images: string[];
  filterString?: string;
}

function TiltCard({
  src,
  index,
  total,
  isTop,
  filterString,
}: {
  src: string;
  index: number;
  total: number;
  isTop: boolean;
  filterString?: string;
}) {
  const midpoint = Math.floor(total / 2);
  const baseRotate = (index - midpoint) * 5;
  const baseY = Math.abs(index - midpoint) * -2;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-60, 60], [12, -12]), { stiffness: 200, damping: 22 });
  const rotateY = useSpring(useTransform(mx, [-60, 60], [-12, 12]), { stiffness: 200, damping: 22 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isTop) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - rect.left - rect.width / 2);
    my.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      className="absolute inset-0 rounded-2xl overflow-hidden border border-white/10 cursor-pointer"
      style={{
        zIndex: index,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
        rotateX: isTop ? rotateX : 0,
        rotateY: isTop ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      initial={{ rotate: baseRotate, y: baseY }}
      whileHover={
        isTop
          ? { scale: 1.05, rotate: 0, y: -10, zIndex: 99 }
          : {}
      }
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {src ? (
        <img
          src={src}
          alt={`Gallery image ${index + 1}`}
          className="w-full h-full object-cover"
          style={filterString ? { filter: filterString } : undefined}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-neutral-600 to-neutral-800 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 opacity-30 text-neutral-400" />
        </div>
      )}

      {/* Glossy highlight */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
    </motion.div>
  );
}

export default function GalleryStackBlock({ images, filterString }: GalleryStackBlockProps) {
  const cards = (images.length > 0 ? images : ['', '', '']).slice(0, 5);

  return (
    <div className="w-full py-8 flex items-center justify-center">
      <div className="relative w-60 h-40" style={{ perspective: '800px' }}>
        {cards.map((src, i) => (
          <TiltCard
            key={i}
            src={src}
            index={i}
            total={cards.length}
            isTop={i === cards.length - 1}
            filterString={filterString}
          />
        ))}
      </div>
    </div>
  );
}

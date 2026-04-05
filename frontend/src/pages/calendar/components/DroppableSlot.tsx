// ---------------------------------------------------------------------------
// DroppableSlot.tsx  --  Area droppable per il drag-and-drop del calendario
// ---------------------------------------------------------------------------
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DroppableSlotProps {
  id: string;
  date: string;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DroppableSlot({ id, date, children }: DroppableSlotProps) {
  const { isOver, setNodeRef, active } = useDroppable({
    id,
    data: { date },
  });

  const style: React.CSSProperties = {
    position: 'relative',
    transition: 'background 0.15s ease, outline 0.15s ease',
    ...(isOver && active
      ? {
          background: 'rgba(22, 119, 255, 0.06)',
          outline: '2px dashed #1677ff',
          outlineOffset: -2,
          borderRadius: 6,
        }
      : {}),
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}

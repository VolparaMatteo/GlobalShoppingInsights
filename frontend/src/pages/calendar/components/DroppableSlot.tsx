// ---------------------------------------------------------------------------
// DroppableSlot.tsx  --  Droppable area for calendar drag-and-drop
// ---------------------------------------------------------------------------
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DroppableSlotProps {
  /** Unique droppable identifier -- typically a date or datetime string. */
  id: string;
  /** The date this droppable represents (YYYY-MM-DD). */
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
    transition: 'background 0.15s ease',
    ...(isOver && active
      ? {
          background: 'rgba(22, 119, 255, 0.06)',
          outline: '2px dashed #1677ff',
          outlineOffset: -2,
          borderRadius: 4,
        }
      : {}),
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}

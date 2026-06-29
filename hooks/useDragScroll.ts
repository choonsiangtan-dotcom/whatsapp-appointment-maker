import React from 'react';

export function useDragScroll() {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const isDown = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);
  const hasDragged = React.useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    isDown.current = true;
    ref.current.classList.add('cursor-grabbing');
    ref.current.classList.remove('cursor-grab');
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
    hasDragged.current = false;
  };

  const onMouseLeave = () => {
    if (!isDown.current) return;
    isDown.current = false;
    if (ref.current) {
      ref.current.classList.remove('cursor-grabbing');
      ref.current.classList.add('cursor-grab');
    }
  };

  const onMouseUp = () => {
    if (!isDown.current) return;
    isDown.current = false;
    if (ref.current) {
      ref.current.classList.remove('cursor-grabbing');
      ref.current.classList.add('cursor-grab');
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Scroll speed modifier
    if (Math.abs(walk) > 8) {
      hasDragged.current = true;
    }
    ref.current.scrollLeft = scrollLeft.current - walk;
  };

  // Wrap item click events to prevent selecting when dragging
  const handleItemClick = (e: React.MouseEvent | React.TouchEvent, callback: () => void) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged.current = false; // Reset
      return;
    }
    callback();
  };

  return {
    ref,
    bind: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
      className: 'cursor-grab select-none'
    },
    handleItemClick,
    isDragging: isDown.current
  };
}

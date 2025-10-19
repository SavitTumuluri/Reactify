// src/components/ui/draggable.jsx
import React, { useEffect, useRef, useState } from "react";

function useRafState(initial) {
  const frame = useRef(null);
  const [state, setState] = useState(initial);
  const queued = useRef(initial);
  const set = (next) => {
    queued.current = next;
    if (frame.current == null) {
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        setState(queued.current);s
      });
    }
  };
  useEffect(() => {
    return () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, []);
  return [state, set];
}

export default function Draggable({
  children,
  initial = { x: 0, y: 0 },
  constrainToParent = false,
  handleSelector,
  grid = null,
  axis = "both",
  onDrag,
  onDragEnd,
  className,
  style,
}) {
  const ref = useRef(null);
  const [pos, setPos] = useRafState(initial);
  const [dragging, setDragging] = useState(false);
  const origin = useRef({ x: 0, y: 0 });
  const start = useRef({ x: initial.x, y: initial.y });

  const applyConstraints = (p) => {
    if (!constrainToParent || !ref.current || !ref.current.parentElement) return p;
    const parent = ref.current.parentElement.getBoundingClientRect();
    const self = ref.current.getBoundingClientRect();
    const x = Math.min(Math.max(p.x, 0), parent.width - self.width);
    const y = Math.min(Math.max(p.y, 0), parent.height - self.height);
    return { x, y };
  };

  const snap = (p) => {
    if (!grid) return p;
    const gx = grid.x || 1;
    const gy = grid.y || 1;
    return { x: Math.round(p.x / gx) * gx, y: Math.round(p.y / gy) * gy };
  };

  const onPointerDown = (e) => {
    const el = ref.current;
    if (!el) return;
    if (handleSelector && !e.target.closest(handleSelector)) return;
    e.target.setPointerCapture?.(e.pointerId);
    setDragging(true);
    origin.current = { x: e.clientX, y: e.clientY };
    start.current = { ...pos };
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    let next = {
      x: axis === "y" ? start.current.x : start.current.x + dx,
      y: axis === "x" ? start.current.y : start.current.y + dy,
    };
    next = applyConstraints(snap(next));
    setPos(next);
    onDrag && onDrag(next);
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    onDragEnd && onDragEnd(pos);
  };

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 1;
    let delta = null;
    if (e.key === "ArrowLeft") delta = { x: -step, y: 0 };
    if (e.key === "ArrowRight") delta = { x: step, y: 0 };
    if (e.key === "ArrowUp") delta = { x: 0, y: -step };
    if (e.key === "ArrowDown") delta = { x: 0, y: step };
    if (delta) {
      e.preventDefault();
      const next = applyConstraints(
        snap({
          x: axis === "y" ? pos.x : pos.x + delta.x,
          y: axis === "x" ? pos.y : pos.y + delta.y,
        })
      );
      setPos(next);
      onDrag && onDrag(next);
    }
  };

  const wrapperStyle = {
    transform: `translate(${pos.x}px, ${pos.y}px)`,
    touchAction: "none",
    ...style,
  };

  const content =
    typeof children === "function"
      ? children({ dragging, position: pos })
      : children;

  return (
    <div
      ref={ref}
      className={["inline-block select-none", className].filter(Boolean).join(" ")}
      style={wrapperStyle}
      role="button"
      tabIndex={0}
      aria-grabbed={dragging}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {content}
    </div>
  );
}



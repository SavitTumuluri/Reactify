// src/components/ui/DragResize.jsx
import React, { useEffect, useRef, useState } from "react";
import { IR } from "./test"; // <-- adjust if your path differs

/** IR record for a rectangle: position + size + angle */
class IRRect extends IR {
  constructor(init = {}) {
    super({
      pos: { x: 24, y: 24 },
      size: { w: 220, h: 120 },
      angle: 0, // degrees
      ...init,
    });
  }
}

/**
 * Drag + Resize + Rotate wrapper (IR-backed).
 * Children: node | ({ dragging, resizing, rotating, pos, size, angle }) => node
 */
export default function DragResize({
  initialPos = { x: 24, y: 24 },
  initialSize = { w: 220, h: 120 },
  minSize = { w: 60, h: 40 },
  constrainToParent = true,
  grid = null,                 // {x,y} to snap pos/size
  rotationSnap = 15,           // degrees when Shift is held
  className,
  style,
  children,
}) {
  const [ir] = useState(() => new IRRect({ pos: initialPos, size: initialSize }));
  const [pos, setPos] = ir.useState("pos", initialPos);
  const [size, setSize] = ir.useState("size", initialSize);
  const [angle, setAngle] = ir.useState("angle", 0);

  const wrapRef = useRef(null);
  const boxRef  = useRef(null);

  // drag state
  const draggingRef = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const dragStart  = useRef({ x: pos.x, y: pos.y });

  // resize state
  const resizingRef = useRef(null); // "n","ne","e","se","s","sw","w","nw" | null
  const resizeStartPos  = useRef({ x: pos.x, y: pos.y });
  const resizeStartSize = useRef({ w: size.w, h: size.h });

  // rotate state
  const rotatingRef = useRef(false);
  const rotateCenter = useRef({ x: 0, y: 0 });
  const rotateStartAngleDeg = useRef(0);
  const rotateStartPointerRad = useRef(0);

  // ---------- helpers ----------
  const rad = (deg) => (deg * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;

  const snapAll = (x, y, w, h) => {
    if (!grid) return { x, y, w, h };
    const sx = grid.x || 1, sy = grid.y || 1;
    return {
      x: Math.round(x / sx) * sx,
      y: Math.round(y / sy) * sy,
      w: Math.max(minSize.w, Math.round(w / sx) * sx),
      h: Math.max(minSize.h, Math.round(h / sy) * sy),
    };
  };

  const clampToParent = (x, y, w, h) => {
    if (!constrainToParent || !wrapRef.current?.parentElement) return { x, y, w, h };
    const parent = wrapRef.current.parentElement.getBoundingClientRect();
    const maxX = Math.max(parent.width - w, 0);
    const maxY = Math.max(parent.height - h, 0);
    return {
      x: Math.min(Math.max(x, 0), maxX),
      y: Math.min(Math.max(y, 0), maxY),
      w, h,
    };
  };

  // convert global delta to the box's local (unrotated) coords
  const globalToLocalDelta = (gdx, gdy) => {
    const th = rad(angle);
    const c = Math.cos(th), s = Math.sin(th);
    // R(-θ) * [gdx,gdy]
    return { dx:  c * gdx + s * gdy, dy: -s * gdx + c * gdy };
    // (x points east, y points south)
  };

  // ---------- drag ----------
  const onDragDown = (e) => {
    if (e.target.dataset.handle || e.target.dataset.rotate) return; // ignore when starting from a handle
    e.currentTarget.setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    dragOrigin.current = { x: e.clientX, y: e.clientY };
    dragStart.current = { ...pos };
  };

  const onDragMove = (e) => {
    if (!draggingRef.current || resizingRef.current || rotatingRef.current) return;
    const dx = e.clientX - dragOrigin.current.x;
    const dy = e.clientY - dragOrigin.current.y;
    let nx = dragStart.current.x + dx;
    let ny = dragStart.current.y + dy;
    const snapped = grid ? snapAll(nx, ny, size.w, size.h) : { x: nx, y: ny, w: size.w, h: size.h };
    const clamped = clampToParent(snapped.x, snapped.y, size.w, size.h);
    setPos({ x: clamped.x, y: clamped.y });
  };

  const onDragUp = () => { draggingRef.current = false; };

  // ---------- resize ----------
  const startResize = (handle) => (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    resizingRef.current = handle;
    dragOrigin.current = { x: e.clientX, y: e.clientY };
    resizeStartPos.current  = { ...pos };
    resizeStartSize.current = { ...size };
  };

  const doResize = (e) => {
    const h = resizingRef.current;
    if (!h) return;

    const gdx = e.clientX - dragOrigin.current.x;
    const gdy = e.clientY - dragOrigin.current.y;
    const { dx, dy } = globalToLocalDelta(gdx, gdy); // local deltas aligned to box axes

    let x = resizeStartPos.current.x;
    let y = resizeStartPos.current.y;
    let w = resizeStartSize.current.w;
    let ht = resizeStartSize.current.h;

    // local-axis adjustments
    if (h.includes("e")) w = resizeStartSize.current.w + dx;
    if (h.includes("s")) ht = resizeStartSize.current.h + dy;
    if (h.includes("w")) { w = resizeStartSize.current.w - dx; x = resizeStartPos.current.x + dx; }
    if (h.includes("n")) { ht = resizeStartSize.current.h - dy; y = resizeStartPos.current.y + dy; }

    // min size (if we clamp on W/N, move origin back so the opposite edge stays fixed)
    if (w < minSize.w) { if (h.includes("w")) x -= (minSize.w - w); w = minSize.w; }
    if (ht < minSize.h) { if (h.includes("n")) y -= (minSize.h - ht); ht = minSize.h; }

    const snapped = snapAll(x, y, w, ht);
    const clamped = clampToParent(snapped.x, snapped.y, snapped.w, snapped.h);
    setPos({ x: clamped.x, y: clamped.y });
    setSize({ w: clamped.w, h: clamped.h });
  };

  const endResize = () => { resizingRef.current = null; };

  // ---------- rotate ----------
  const onRotateDown = (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    rotatingRef.current = true;

    const rect = boxRef.current.getBoundingClientRect();
    rotateCenter.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    rotateStartAngleDeg.current = angle;
    rotateStartPointerRad.current = Math.atan2(
      e.clientY - rotateCenter.current.y,
      e.clientX - rotateCenter.current.x
    );
  };

  const doRotate = (e) => {
    if (!rotatingRef.current) return;
    const now = Math.atan2(
      e.clientY - rotateCenter.current.y,
      e.clientX - rotateCenter.current.x
    );
    let nextDeg = rotateStartAngleDeg.current + deg(now - rotateStartPointerRad.current);
    // snap with Shift
    if (e.shiftKey && rotationSnap > 0) {
      nextDeg = Math.round(nextDeg / rotationSnap) * rotationSnap;
    }
    setAngle(((nextDeg % 360) + 360) % 360); // keep in [0,360)
  };

  const endRotate = () => { rotatingRef.current = false; };

  // ---------- global-ish listeners on wrapper ----------
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const move = (e) => { doResize(e); onDragMove(e); doRotate(e); };
    const up = () => { endResize(); onDragUp(); endRotate(); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [pos, size, angle]);

  // ---------- styles ----------
  const handleStyle = (name) => {
    const base = {
      position: "absolute",
      width: 10,
      height: 10,
      background: "#3b82f6",
      border: "1px solid #fff",
      borderRadius: 2,
      boxShadow: "0 0 0 1px rgba(0,0,0,.15)",
      touchAction: "none",
      cursor: ({
        n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
        ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize",
      })[name],
    };
    const pad = -5;
    const posMap = {
      n:  { left: "50%", top: pad, transform: "translate(-50%, 0)" },
      s:  { left: "50%", bottom: pad, transform: "translate(-50%, 0)" },
      e:  { right: pad, top: "50%", transform: "translate(0, -50%)" },
      w:  { left: pad, top: "50%", transform: "translate(0, -50%)" },
      ne: { right: pad, top: pad },
      se: { right: pad, bottom: pad },
      nw: { left: pad, top: pad },
      sw: { left: pad, bottom: pad },
    };
    return { ...base, ...posMap[name] };
  };

  const rotateHandleStyle = {
    position: "absolute",
    left: "50%",
    top: -24,
    transform: "translate(-50%, 0)",
    width: 14,
    height: 14,
    borderRadius: "999px",
    background: "#10b981",
    border: "1px solid #fff",
    boxShadow: "0 0 0 1px rgba(0,0,0,.15)",
    touchAction: "none",
    cursor: "grab",
  };

  const outerStyle = {
    position: "absolute",
    transform: `translate(${pos.x}px, ${pos.y}px)`,
    width: size.w,
    height: size.h,
    boxSizing: "border-box",
    touchAction: "none",
    ...style,
  };

  const boxInnerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 16px rgba(0,0,0,.06)",
    overflow: "hidden",
    transform: `rotate(${angle}deg)`,
    transformOrigin: "50% 50%",
  };

  const content =
    typeof children === "function"
      ? children({
          dragging: draggingRef.current,
          resizing: !!resizingRef.current,
          rotating: rotatingRef.current,
          pos,
          size,
          angle,
        })
      : children;

  return (
    <div ref={wrapRef} className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <div data-draggable onPointerDown={onDragDown} style={outerStyle}>
        {/* rotated content box */}
        <div ref={boxRef} style={boxInnerStyle}>
          {content}
        </div>

        {/* rotate handle (top-center, follows rotation visually because it’s inside the rotated box’s stacking context) */}
        <div data-rotate style={rotateHandleStyle} onPointerDown={onRotateDown} />

        {/* 8 resize handles */}
        {["n","ne","e","se","s","sw","w","nw"].map((h) => (
          <div key={h} data-handle={h} style={handleStyle(h)} onPointerDown={startResize(h)} />
        ))}
      </div>
    </div>
  );
}
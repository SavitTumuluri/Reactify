// src/components/ui/DragResize.jsx
import React, { useEffect, useRef } from "react";
import { IR, IRView } from "./IR";

/** IR record (relative pos/size + rotation) */
export class IRRect extends IRView {
  constructor(parent, init = {}) {
    super(parent, {
      // Optional config that used to be props:
      config: {
        minSize: { w: 60, h: 40 },
        grid: null, // e.g. { x: 10, y: 10 } in px
        rotationSnap: 15,
        className: "",
        style: {},
        selected: false,
      },
      ...init,
    });
  }
  toComponent() {
    return DragResize;
  }
  toReact() {
    const posRel = this.get("posRel");
    const sizeRel = this.get("sizeRel");
    const angle = this.get("angle");
    const body = this.children.map((c) => c.toReact()).join("\n");
    return `<DragResizeStatic posRel={{x:${posRel.x}, y:${posRel.y}}} sizeRel={{w:${sizeRel.w}, h:${sizeRel.h}}} angle={${angle}}>${body}\n</DragResizeStatic>`;
  }
  toImports() {
    return ['import DragResizeStatic from "./DragResizeStatic"'];
  }
}

/**
 * DragResize — API: { ir, bounds }
 * - robust transform strings
 * - global listeners on window (not a pointer-events:none wrapper)
 * - safe init when bounds are known; prefer IR state
 * - no behavior change to resize/rotate/snap/clamp
 */
export default function DragResize({ ir, bounds }) {

  // --- Config (optional) stored in IR; safe fallbacks ---
  const cfg = ir?.get?.("config") ?? {};
  const minSize = cfg.minSize ?? { w: 60, h: 40 };
  const grid = cfg.grid ?? null;
  const rotationSnap = Number.isFinite(cfg.rotationSnap) ? cfg.rotationSnap : 15;
  const className = typeof cfg.className === "string" ? cfg.className : "";
  const style = typeof cfg.style === "object" && cfg.style ? cfg.style : {};
  const selected = !!cfg.selected;
  const onSelect = typeof cfg.onSelect === "function" ? cfg.onSelect : () => {};

  // --- Bounds ---
  const bwRaw = bounds?.w ?? bounds?.width ?? 0;
  const bhRaw = bounds?.h ?? bounds?.height ?? 0;
  const hasBounds = bwRaw > 0 && bhRaw > 0;
  // When unknown, keep 1 to avoid NaN/Infinity, but also avoid re-deriving initial rel state
  const bw = hasBounds ? bwRaw : 1;
  const bh = hasBounds ? bhRaw : 1;

  const toRel = (v, total) => (total > 0 ? v / total : 0);
  const toPx = (v, total) => Math.round(v * total);

  // --- Initial px defaults (only used if IR has no value AND bounds are known) ---
  const _initialPosPx = { x: 24, y: 24 };
  const _initialSizePx = { w: 220, h: 120 };

  // Prefer IR existing state; otherwise derive sensible defaults when bounds are known
  const initialPosRelFallback = hasBounds
    ? { x: toRel(_initialPosPx.x, bw), y: toRel(_initialPosPx.y, bh) }
    : { x: 0, y: 0 };

  const initialSizeRelFallback = hasBounds
    ? { w: toRel(_initialSizePx.w, bw), h: toRel(_initialSizePx.h, bh) }
    : { w: 0.1, h: 0.1 }; // minimal safe default until bounds arrive

  // --- IR-backed state (do not fight existing IR values) ---
  const [posRel, setPosRel] = ir.useState("posRel", initialPosRelFallback);
  const [sizeRel, setSizeRel] = ir.useState("sizeRel", initialSizeRelFallback);
  const [angle, setAngle] = ir.useState("angle", 0);

  const wrapRef = useRef(null);
  const rotatedRef = useRef(null);

  // drag
  const draggingRef = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const dragStartRel = useRef({ x: posRel.x, y: posRel.y });

  // resize
  const resizingRef = useRef(null);
  const resizeStartPosRel = useRef({ x: posRel.x, y: posRel.y });
  const resizeStartSizeRel = useRef({ w: sizeRel.w, h: sizeRel.h });

  // rotate
  const rotatingRef = useRef(false);
  const rotateCenter = useRef({ x: 0, y: 0 });
  const rotateStartAngleDeg = useRef(0);
  const rotateStartPointerRad = useRef(0);

  const rad = (d) => (d * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;

  const globalToLocalDelta = (gdx, gdy) => {
    const th = rad(angle);
    const c = Math.cos(th), s = Math.sin(th);
    return { dx: c * gdx + s * gdy, dy: -s * gdx + c * gdy };
  };

  const snapRel = (x, y, w, h) => {
    if (!grid) return { x, y, w, h };
    const sx = grid.x ? grid.x / bw : null;
    const sy = grid.y ? grid.y / bh : null;
    return {
      x: sx ? Math.round(x / sx) * sx : x,
      y: sy ? Math.round(y / sy) * sy : y,
      w: sx ? Math.round(w / sx) * sx : w,
      h: sy ? Math.round(h / sy) * sy : h,
    };
  };

  const minRel = { w: Math.min(minSize.w / bw, 1), h: Math.min(minSize.h / bh, 1) };
  const clampRel = (x, y, w, h) => {
    w = Math.max(w, minRel.w);
    h = Math.max(h, minRel.h);
    const maxX = Math.max(1 - w, 0);
    const maxY = Math.max(1 - h, 0);
    x = Math.min(Math.max(x, 0), maxX);
    y = Math.min(Math.max(y, 0), maxY);
    return { x, y, w, h };
  };

  // --- drag ---
  const onDragDown = (e) => {
    if (e.target.dataset.handle || e.target.dataset.rotate) return;
    onSelect();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    dragOrigin.current = { x: e.clientX, y: e.clientY };
    // capture current rel at the moment of pointer down
    dragStartRel.current = { x: posRel.x, y: posRel.y };
  };
  const onDragMove = (e) => {
    if (!draggingRef.current || resizingRef.current || rotatingRef.current) return;
    const dxRel = (e.clientX - dragOrigin.current.x) / bw;
    const dyRel = (e.clientY - dragOrigin.current.y) / bh;
    const snapped = snapRel(
      dragStartRel.current.x + dxRel,
      dragStartRel.current.y + dyRel,
      sizeRel.w,
      sizeRel.h
    );
    const c = clampRel(snapped.x, snapped.y, sizeRel.w, sizeRel.h);
    setPosRel({ x: c.x, y: c.y });
  };
  const onDragUp = () => (draggingRef.current = false);

  // --- resize ---
  const startResize = (handle) => (e) => {
    onSelect();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    resizingRef.current = handle;
    dragOrigin.current = { x: e.clientX, y: e.clientY };
    resizeStartPosRel.current = { x: posRel.x, y: posRel.y };
    resizeStartSizeRel.current = { w: sizeRel.w, h: sizeRel.h };
  };
  const doResize = (e) => {
    const h = resizingRef.current;
    if (!h) return;
    const gdx = e.clientX - dragOrigin.current.x;
    const gdy = e.clientY - dragOrigin.current.y;
    const { dx, dy } = globalToLocalDelta(gdx, gdy);
    const dxRel = dx / bw;
    const dyRel = dy / bh;

    let x = resizeStartPosRel.current.x;
    let y = resizeStartPosRel.current.y;
    let w = resizeStartSizeRel.current.w;
    let ht = resizeStartSizeRel.current.h;

    if (h.includes("e")) w = resizeStartSizeRel.current.w + dxRel;
    if (h.includes("s")) ht = resizeStartSizeRel.current.h + dyRel;
    if (h.includes("w")) { w = resizeStartSizeRel.current.w - dxRel; x = resizeStartPosRel.current.x + dxRel; }
    if (h.includes("n")) { ht = resizeStartSizeRel.current.h - dyRel; y = resizeStartPosRel.current.y + dyRel; }

    if (w < minRel.w) { if (h.includes("w")) x -= minRel.w - w; w = minRel.w; }
    if (ht < minRel.h) { if (h.includes("n")) y -= minRel.h - ht; ht = minRel.h; }

    const snapped = snapRel(x, y, w, ht);
    const c = clampRel(snapped.x, snapped.y, snapped.w, snapped.h);
    setPosRel({ x: c.x, y: c.y });
    setSizeRel({ w: c.w, h: c.h });
  };
  const endResize = () => (resizingRef.current = null);

  // --- rotate ---
  const onRotateDown = (e) => {
    onSelect();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    rotatingRef.current = true;

    const rect = rotatedRef.current.getBoundingClientRect();
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
    let next = rotateStartAngleDeg.current + deg(now - rotateStartPointerRad.current);
    if (e.shiftKey && rotationSnap > 0) next = Math.round(next / rotationSnap) * rotationSnap;
    setAngle(((next % 360) + 360) % 360);
  };
  const endRotate = () => (rotatingRef.current = false);

  // --- global listeners on window (robust) ---
  useEffect(() => {
    const move = (e) => {
      doResize(e);
      onDragMove(e);
      doRotate(e);
    };
    const up = () => {
      endResize();
      onDragUp();
      endRotate();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posRel, sizeRel, angle, bw, bh]);

  // --- render in px (state is relative) ---
  const px = {
    x: toPx(posRel.x, bw),
    y: toPx(posRel.y, bh),
    w: toPx(sizeRel.w, bw),
    h: toPx(sizeRel.h, bh),
  };

  // active when selected or interacting
  const isActive = selected || draggingRef.current || !!resizingRef.current || rotatingRef.current;

  // --- styles (valid transform strings!) ---
  const outerStyle = {
    position: "absolute",
    transform: `translate(${px.x}px, ${px.y}px)`,
    width: px.w,
    height: px.h,
    boxSizing: "border-box",
    touchAction: "none",
    overflow: "visible",
    outline: "none",
    ...style,
  };

  const rotatedStyle = {
    position: "absolute",
    inset: 0,
    transform: `rotate(${angle}deg)`,
    transformOrigin: "50% 50%",
  };

  const contentBoxStyle = {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 16px rgba(0,0,0,.06)",
    overflow: "hidden",
  };

  const selectionFrameStyle = {
    position: "absolute",
    inset: 0,
    borderRadius: 12,
    border: "2px solid rgba(59,130,246,.45)",
    pointerEvents: "none",
  };

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
      cursor: (
        {
          n: "ns-resize",
          s: "ns-resize",
          e: "ew-resize",
          w: "ew-resize",
          ne: "nesw-resize",
          sw: "nesw-resize",
          nw: "nwse-resize",
          se: "nwse-resize",
        }
      )[name],
    };
    const pad = -5;
    const posMap = {
      n: { left: "50%", top: pad, transform: "translate(-50%, 0)" },
      s: { left: "50%", bottom: pad, transform: "translate(-50%, 0)" },
      e: { right: pad, top: "50%", transform: "translate(0, -50%)" },
      w: { left: pad, top: "50%", transform: "translate(0, -50%)" },
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

  // render children from IR (if any)
  const renderedChildren = (ir.children ?? []).map((child, i) => {
    const Comp = child.toComponent();
    return <Comp key={child.key ?? i} ir={child} bounds={{ w: px.w, h: px.h }} />;
  });

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-selected={selected}
    >
      <div
        data-draggable
        onPointerDown={onDragDown}
        style={{ ...outerStyle, pointerEvents: "auto" }}
        tabIndex={0}
      >
        <div ref={rotatedRef} style={rotatedStyle}>
          {isActive && <div aria-hidden style={selectionFrameStyle} />}
          <div style={contentBoxStyle}>{renderedChildren}</div>

          {isActive && (
            <>
              <div data-rotate style={rotateHandleStyle} onPointerDown={onRotateDown} />
              {["n", "ne", "e", "se", "s", "sw", "w", "nw"].map((h) => (
                <div key={h} data-handle={h} style={handleStyle(h)} onPointerDown={startResize(h)} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
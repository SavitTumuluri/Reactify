// src/components/ui/DragResize.jsx
import React, { useEffect, useRef } from "react";
import { RegisterComponent } from "../state/ComponentRegistry";

/**
 * DragResize — API: { ir, bounds, onElementSelect, isSelected, elementId }
 * - Uses IR.styles for visual CSS only
 * - Non-CSS behavior knobs use hardcoded defaults (minSize, grid, rotationSnap)
 */
export default function DragResize({ ir, bounds, onElementSelect, isSelected, elementId }) {
  ir.init();

  // Simple component - no special shape detection

  // ---- Hardcoded behavior defaults (replacing former cfg) ----
  const minSize = { w: 60, h: 40 };
  const grid = null;               // e.g. { x: 10, y: 10 }
  const rotationSnap = 15;         // degrees
  const className = "";            // no className in styles; keep empty

  // Checkpoint logger (integration hint for history saves)
  const checkpoint = () => {
    // Single, consistent message for the theoretical refactor
    console.log("Detected a reasonable checkpoint: This would save state here!");
  };

  // Float comparison helpers to avoid noise
  const approxEq = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
  const posChanged = (a, b) => !(approxEq(a.x, b.x) && approxEq(a.y, b.y));
  const sizeChanged = (a, b) => !(approxEq(a.w, b.w) && approxEq(a.h, b.h));
  const angleChanged = (a, b) => {
    // Normalize to [0, 360)
    const norm = (t) => ((t % 360) + 360) % 360;
    return !approxEq(norm(a), norm(b));
  };

  // no generic "style" bag; visual tweaks come from ir.styles only
  const [styles, setStyles] = ir.useState("styles", {});
  // Ensure styles object exists with sensible defaults (immutably)
  useEffect(() => {
    const existing = ir.get?.("styles") ?? {};
    const defaults = {
      backgroundColor: "#ffffff",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "#e5e7eb",
      borderRadius: isCircle ? "50%" : isTriangle || isStar ? "0px" : "12px",
      boxShadow: "0 6px 16px rgba(0,0,0,.06)",
      overflow: "hidden",
      ...(isTriangle && { clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }),
      ...(isStar && { clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }),
    };
    const needsMerge = Object.keys(defaults).some((k) => existing[k] === undefined);
    if (needsMerge) ir.set("styles", { ...defaults, ...existing });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ir, isCircle, isTriangle, isStar]);

  // helper to read from styles with fallback
  const readStyle = (key, fallback) => {
    const s = ir.get?.("styles") ?? {};
    return s[key] ?? fallback;
  };

  // ---- Bounds ----
  const bwRaw = bounds?.w ?? bounds?.width ?? 0;
  const bhRaw = bounds?.h ?? bounds?.height ?? 0;
  const hasBounds = bwRaw > 0 && bhRaw > 0;
  const bw = hasBounds ? bwRaw : 1;
  const bh = hasBounds ? bhRaw : 1;

  const toRel = (v, total) => (total > 0 ? v / total : 0);
  const toPx = (v, total) => Math.round(v * total);

  // ---- Initial px defaults (only used if IR has no value AND bounds are known) ----
  const _initialPosPx = { x: 24, y: 24 };
  const _initialSizePx = { w: 220, h: 120 };

  const initialPosRelFallback = hasBounds
    ? { x: toRel(_initialPosPx.x, bw), y: toRel(_initialPosPx.y, bh) }
    : { x: 0, y: 0 };

  const initialSizeRelFallback = hasBounds
    ? { w: toRel(_initialSizePx.w, bw), h: toRel(_initialSizePx.h, bh) }
    : { w: 0.1, h: 0.1 };

  // ---- IR-backed state ----
  const [posRel, setPosRel] = ir.useState("posRel", initialPosRelFallback);
  const [sizeRel, setSizeRel] = ir.useState("sizeRel", initialSizeRelFallback);
  const [angle, setAngle] = ir.useState("angle", 0);

  const wrapRef = useRef(null);
  const rotatedRef = useRef(null);

  // drag
  const draggingRef = useRef(false);
  const pressingRef = useRef(false);
  const pressDownAt = useRef({ x: 0, y: 0 });
  const downTargetRef = useRef(null);
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

  // ---- drag ----
  const isEditableTarget = (el) => {
    if (!el) return false;
    const tag = (el.tagName || "").toUpperCase();
    if (el.isContentEditable) return true;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    return false;
  };

  const onDragDown = (e) => {
    if (e.target?.dataset?.handle || e.target?.dataset?.rotate) return;
    if ((e.detail ?? 1) >= 2) return;
    if (isEditableTarget(e.target)) return;
    onElementSelect?.(ir);
    pressDownAt.current = { x: e.clientX, y: e.clientY };
    dragOrigin.current  = { x: e.clientX, y: e.clientY };
    dragStartRel.current = { x: posRel.x, y: posRel.y };
    pressingRef.current = true;
    downTargetRef.current = e.currentTarget;
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
  const onDragUp = () => {
    // Only consider a drag "checkpoint" if we were actually dragging and position changed
    if (draggingRef.current) {
      const changed = posChanged(posRel, dragStartRel.current);
      if (changed) checkpoint();
    }
    draggingRef.current = false;
    pressingRef.current = false;
    downTargetRef.current = null;
  };

  // ---- resize ----
  const startResize = (handle) => (e) => {
    onElementSelect?.(ir);
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

    // For circles, maintain square aspect ratio only if Shift key is held
    if (isCircle && e.shiftKey) {
      const maxSize = Math.max(w, ht);
      w = maxSize;
      ht = maxSize;
    }

    const snapped = snapRel(x, y, w, ht);
    const c = clampRel(snapped.x, snapped.y, snapped.w, snapped.h);
    setPosRel({ x: c.x, y: c.y });
    setSizeRel({ w: c.w, h: c.h });
  };
  const endResize = () => {
    if (resizingRef.current) {
      const posDidChange = posChanged({ x: posRel.x, y: posRel.y }, resizeStartPosRel.current);
      const sizeDidChange = sizeChanged({ w: sizeRel.w, h: sizeRel.h }, resizeStartSizeRel.current);
      if (posDidChange || sizeDidChange) checkpoint();
    }
    resizingRef.current = null;
  };

  // ---- rotate ----
  const onRotateDown = (e) => {
    onElementSelect?.(ir);
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
  const endRotate = () => {
    if (rotatingRef.current) {
      if (angleChanged(angle, rotateStartAngleDeg.current)) checkpoint();
    }
    rotatingRef.current = false;
  };

  // ---- global listeners on window ----
  useEffect(() => {
    const move = (e) => {
      doResize(e);
      doRotate(e);

      if (!draggingRef.current && pressingRef.current) {
        const dx = Math.abs(e.clientX - pressDownAt.current.x);
        const dy = Math.abs(e.clientY - pressDownAt.current.y);
        const threshold = 3;
        if (dx > threshold || dy > threshold) {
          draggingRef.current = true;
          downTargetRef.current?.setPointerCapture?.(e.pointerId);
        }
      }

      onDragMove(e);
    };
    const up = () => {
      // Only one of these should have been active; call all safely in an order that avoids double-logging.
      // Each end* function guards itself and logs at most once if it was actually active.
      endResize();
      endRotate();
      onDragUp();
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

  // ---- render in px ----
  const px = {
    x: toPx(posRel.x, bw),
    y: toPx(posRel.y, bh),
    w: toPx(sizeRel.w, bw),
    h: toPx(sizeRel.h, bh),
  };

  const isActive =
    !!isSelected || draggingRef.current || !!resizingRef.current || rotatingRef.current;

  // ---- styles (compose from IR.styles) ----
  const outerStyle = {
    position: "absolute",
    transform: `translate(${px.x}px, ${px.y}px)`,
    width: px.w,
    height: px.h,
    boxSizing: "border-box",
    touchAction: "none",
    overflow: "visible",
    outline: "none",
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
    borderRadius: readStyle("borderRadius", isCircle ? "50%" : isTriangle || isStar ? "0px" : "12px"),
    background: readStyle("backgroundColor", "#fff"),
    border: `${readStyle("borderWidth", "1px")} ${readStyle("borderStyle", "solid")} ${readStyle(
      "borderColor",
      "#e5e7eb"
    )}`,
    boxShadow: readStyle("boxShadow", "0 6px 16px rgba(0,0,0,.06)"),
    overflow: readStyle("overflow", "hidden"),
    ...(isTriangle && { clipPath: readStyle("clipPath", "polygon(50% 0%, 0% 100%, 100% 100%)") }),
    ...(isStar && { clipPath: readStyle("clipPath", "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)") }),
  };

  const selectionFrameStyle = {
    position: "absolute",
    inset: 0,
    borderRadius: readStyle("borderRadius", isCircle ? "50%" : isTriangle || isStar ? "0px" : "12px"),
    border: "2px solid rgba(59,130,246,.45)",
    pointerEvents: "none",
    ...(isTriangle && { clipPath: readStyle("clipPath", "polygon(50% 0%, 0% 100%, 100% 100%)") }),
    ...(isStar && { clipPath: readStyle("clipPath", "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)") }),
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
      cursor:
        {
          n: "ns-resize",
          s: "ns-resize",
          e: "ew-resize",
          w: "ew-resize",
          ne: "nesw-resize",
          sw: "nesw-resize",
          nw: "nwse-resize",
          se: "nwse-resize",
        }[name],
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
      aria-selected={!!isSelected}
    >
      <div
        data-draggable
        onPointerDownCapture={onDragDown}
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

// Link IR classes to this interactive component without creating circular imports
IRRect.prototype.toComponent = function() { return DragResize };
IRCircle.prototype.toComponent = function() { return DragResize };
IRTriangle.prototype.toComponent = function() { return DragResize };
IRStar.prototype.toComponent = function() { return DragResize };

// Re-export for existing import sites
export { IRRect } from "../ir/IRRect";
export { IRCircle } from "../ir/IRCircle";
export { IRTriangle } from "../ir/IRTriangle";
export { IRStar } from "../ir/IRStar";

RegisterComponent(IRRect);
RegisterComponent(IRCircle);
RegisterComponent(IRTriangle);
RegisterComponent(IRStar);

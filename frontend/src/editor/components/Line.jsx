import React, { useEffect, useMemo, useRef, useState } from "react";
import { RegisterComponent } from "../state/ComponentRegistry";
import { IRLine } from "../ir/IRLine";

// Link IR to this interactive component without circular import
IRLine.prototype.toComponent = function () { return Line };

export default function Line({ ir, bounds, onElementSelect, isSelected }) {
  ir.init();

  // Persistent IR states
  const [posRel, setPosRel] = ir.useState("posRel", { x: 0.2, y: 0.2 });
  const [sizeRel, setSizeRel] = ir.useState("sizeRel", { w: 0.4, h: 0.1 });
  const [angle, setAngle] = ir.useState("angle", 0);

  const [start, setStart] = ir.useState("start", { x: 0, y: 0.5 });
  const [end, setEnd] = ir.useState("end", { x: 1, y: 0.5 });
  const [curved, setCurved] = ir.useState("curved", false);
  const [cp1, setCp1] = ir.useState("cp1", { x: 0.33, y: 0.5 });
  const [cp2, setCp2] = ir.useState("cp2", { x: 0.66, y: 0.5 });
  const [curvePartitions, setCurvePartitions] = ir.useState("curvePartitions", 2);
  const [styles] = ir.useState("styles", { stroke: "#111827", strokeWidth: 2, strokeOpacity: 1 });

  // Merge defaults exactly once
  useEffect(() => {
    const existing = ir.get?.("styles") ?? {};
    const defaults = { stroke: "#111827", strokeWidth: 2, strokeOpacity: 1 };
    const needs = Object.keys(defaults).some((k) => existing[k] === undefined);
    if (needs) ir.set("styles", { ...defaults, ...existing });
  }, [ir]);

  const bw = Math.max(1, bounds?.w ?? bounds?.width ?? 0);
  const bh = Math.max(1, bounds?.h ?? bounds?.height ?? 0);
  const px = {
    x: Math.round((posRel?.x ?? 0) * bw),
    y: Math.round((posRel?.y ?? 0) * bh),
    w: Math.round((sizeRel?.w ?? 0.4) * bw),
    h: Math.round((sizeRel?.h ?? 0.001) * bh) || 1,
  };

  // Drag container to move position
  const wrapRef = useRef(null);
  const dragRef = useRef({ active: false, origin: { x: 0, y: 0 }, start: { x: 0, y: 0 } });
  const onContainerDown = (e) => {
    if (e.target.dataset.handle) return; // ignore handle drags
    onElementSelect?.(ir);
    dragRef.current = {
      active: true,
      origin: { x: e.clientX, y: e.clientY },
      start: { x: posRel.x, y: posRel.y },
    };
    window.addEventListener("pointermove", onContainerMove);
    window.addEventListener("pointerup", onContainerUp, { once: true });
  };
  const onContainerMove = (e) => {
    if (!dragRef.current.active) return;
    const dxRel = (e.clientX - dragRef.current.origin.x) / bw;
    const dyRel = (e.clientY - dragRef.current.origin.y) / bh;
    setPosRel({ x: clamp01(dragRef.current.start.x + dxRel), y: clamp01(dragRef.current.start.y + dyRel) });
  };
  const onContainerUp = () => {
    dragRef.current.active = false;
    window.removeEventListener("pointermove", onContainerMove);
  };

  // Handle drags for endpoints and control points
  const rectRef = useRef(null);
  const makeHandleDrag = (which) => (e) => {
    onElementSelect?.(ir);
    e.stopPropagation();
    const onMove = (ev) => {
      const r = rectRef.current?.getBoundingClientRect();
      if (!r) return;
      // allow control points beyond box for extreme curvature
      const x = (ev.clientX - r.left) / Math.max(1, r.width);
      const y = (ev.clientY - r.top) / Math.max(1, r.height);
      if (which === "start") setStart({ x, y });
      else if (which === "end") setEnd({ x, y });
      else if (which === "cp1") setCp1({ x, y });
      else if (which === "cp2") setCp2({ x, y });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  const stroke = styles.stroke ?? "#111827";
  const strokeWidth = Number.isFinite(parseFloat(styles.strokeWidth)) ? parseFloat(styles.strokeWidth) : 2;
  const strokeOpacity = Number.isFinite(parseFloat(styles.strokeOpacity)) ? parseFloat(styles.strokeOpacity) : 1;

  const outerStyle = {
    position: "absolute",
    transform: `translate(${px.x}px, ${px.y}px)`,
    width: px.w,
    height: Math.max(px.h, 1),
    pointerEvents: "auto",
    touchAction: "none",
  };

  const rotatedStyle = {
    position: "absolute",
    inset: 0,
    transform: `rotate(${angle}deg)`,
    transformOrigin: "50% 50%",
    overflow: "visible",
  };

  const handleStyle = (cx, cy) => ({
    position: "absolute",
    left: `${cx * 100}%`,
    top: `${cy * 100}%`,
    width: 12,
    height: 12,
    transform: "translate(-50%, -50%)",
    borderRadius: 999,
    background: "#3b82f6",
    border: "1px solid #fff",
    boxShadow: "0 0 0 1px rgba(0,0,0,.15)",
    cursor: "pointer",
  });

  // rotation handle similar to DragResize
  const rotateHandleStyle = {
    position: "absolute",
    left: "50%",
    top: -24,
    transform: "translate(-50%, 0)",
    width: 14,
    height: 14,
    borderRadius: 999,
    background: "#10b981",
    border: "1px solid #fff",
    boxShadow: "0 0 0 1px rgba(0,0,0,.15)",
    touchAction: "none",
    cursor: "grab",
  };

  const rotateRef = useRef({ startAngle: 0, originAngle: 0 });
  const onRotateDown = (e) => {
    e.stopPropagation();
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const cx = r.left + px.x + px.w / 2;
    const cy = r.top + px.y + px.h / 2;
    const a0 = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    rotateRef.current = { startAngle: angle || 0, originAngle: a0 };
    const onMove = (ev) => {
      const a1 = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI;
      let a = rotateRef.current.startAngle + (a1 - rotateRef.current.originAngle);
      // snap when shift key pressed
      if (ev.shiftKey) {
        const snap = 15;
        a = Math.round(a / snap) * snap;
      }
      setAngle(a);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={outerStyle} onPointerDown={onContainerDown}>
        <div ref={rectRef} style={rotatedStyle}>
          {/* the line */}
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }} onPointerDown={onContainerDown}>
            {/* Invisible hit path for easier selection */}
            {curved ? (
              <path d={`M ${start.x * 100} ${start.y * 100} C ${cp1.x * 100} ${cp1.y * 100}, ${cp2.x * 100} ${cp2.y * 100}, ${end.x * 100} ${end.y * 100}`} fill="none" stroke="transparent" strokeWidth={Math.max(strokeWidth * 4, 12)} style={{ pointerEvents: "stroke" }} />
            ) : (
              <line x1={start.x * 100} y1={start.y * 100} x2={end.x * 100} y2={end.y * 100} stroke="transparent" strokeWidth={Math.max(strokeWidth * 4, 12)} style={{ pointerEvents: "stroke" }} />
            )}
            {curved ? (
              <>
                {curvePartitions === 1 ? (
                  <path d={`M ${start.x * 100} ${start.y * 100} Q ${cp1.x * 100} ${cp1.y * 100}, ${end.x * 100} ${end.y * 100}`} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                ) : (
                  <path d={`M ${start.x * 100} ${start.y * 100} C ${cp1.x * 100} ${cp1.y * 100}, ${cp2.x * 100} ${cp2.y * 100}, ${end.x * 100} ${end.y * 100}`} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                )}
                {isSelected && (
                  <>
                    {/* helper lines for visual guidance (no pointer events) */}
                    {curvePartitions === 1 ? (
                      <>
                        <line x1={start.x * 100} y1={start.y * 100} x2={cp1.x * 100} y2={cp1.y * 100} stroke="#60a5fa" strokeWidth={1} strokeDasharray="3 3" style={{ pointerEvents: "none" }} />
                        <line x1={end.x * 100} y1={end.y * 100} x2={cp1.x * 100} y2={cp1.y * 100} stroke="#60a5fa" strokeWidth={1} strokeDasharray="3 3" style={{ pointerEvents: "none" }} />
                      </>
                    ) : (
                      <>
                        <line x1={start.x * 100} y1={start.y * 100} x2={cp1.x * 100} y2={cp1.y * 100} stroke="#60a5fa" strokeWidth={1} strokeDasharray="3 3" style={{ pointerEvents: "none" }} />
                        <line x1={end.x * 100} y1={end.y * 100} x2={cp2.x * 100} y2={cp2.y * 100} stroke="#60a5fa" strokeWidth={1} strokeDasharray="3 3" style={{ pointerEvents: "none" }} />
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <line x1={start.x * 100} y1={start.y * 100} x2={end.x * 100} y2={end.y * 100} stroke={stroke} strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
            )}
          </svg>

          {/* handles */}
          {isSelected && (
            <>
              {/* rotate handle */}
              <div data-rotate style={rotateHandleStyle} onPointerDown={onRotateDown} />
              <div data-handle="start" style={handleStyle(start.x, start.y)} onPointerDown={makeHandleDrag("start")} />
              <div data-handle="end" style={handleStyle(end.x, end.y)} onPointerDown={makeHandleDrag("end")} />
              {curved && (
                <>
                  <div data-handle="cp1" style={handleStyle(cp1.x, cp1.y)} onPointerDown={makeHandleDrag("cp1")} />
                  {curvePartitions === 2 && (
                    <div data-handle="cp2" style={handleStyle(cp2.x, cp2.y)} onPointerDown={makeHandleDrag("cp2")} />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

// Re-export for existing import sites
export { IRLine } from "../ir/IRLine";

RegisterComponent(IRLine);



// src/components/ui/DragResizeStatic.jsx
import React from "react";

/**
 * DragResizeStatic
 * Renders content at a fixed position/size/angle with advanced styling support.
 * Supports different shape types: rectangle, circle, triangle, star.
 *
 * You can provide absolute pixel values OR relative values:
 *   - Absolute: pos {x,y} in px, size {w,h} in px
 *   - Relative: posRel {x,y} in [0..1], sizeRel {w,h} in [0..1] + bounds {w,h}
 *
 * If posRel/sizeRel are given, bounds is used to compute pixel layout.
 *
 * Props:
 *  - bounds?: { w: number, h: number }    // required if using posRel/sizeRel
 *  - pos?:    { x: number, y: number }    // px
 *  - size?:   { w: number, h: number }    // px
 *  - posRel?: { x: number, y: number }    // 0..1
 *  - sizeRel?:{ w: number, h: number }    // 0..1
 *  - angle?:  number (degrees)
 *  - shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star'  // shape type
 *  - className?, style?, showFrame?, borderRadius?
 *  - styles?: object with backgroundColor, borderWidth, borderStyle, borderColor, borderRadius, boxShadow, overflow, clipPath
 *  - children: node | ({ posRel, sizeRel, posPx, sizePx, angle }) => node
 */
export default function DragResizeStatic({
  bounds,
  pos,
  size,
  posRel,
  sizeRel,
  angle = 0,
  shapeType = 'rectangle',
  className,
  style,
  showFrame = true,
  borderRadius = 12,
  styles = {},
  children,
}) {
  const bw = Math.max(1, bounds?.w ?? bounds?.width ?? 0);
  const bh = Math.max(1, bounds?.h ?? bounds?.height ?? 0);

  // Shape type detection
  const isCircle = shapeType === 'circle';
  const isTriangle = shapeType === 'triangle';
  const isStar = shapeType === 'star';
  const isRect = shapeType === 'rectangle';

  // Derive pixel layout from either relative or absolute props
  const hasRel = posRel || sizeRel;
  if (hasRel && !(bw && bh)) {
    console.warn(
      "DragResizeStatic: posRel/sizeRel provided but bounds is missing or zero-sized."
    );
  }

  const px = {
    x: hasRel ? Math.round((posRel?.x ?? 0) * bw) : (pos?.x ?? 0),
    y: hasRel ? Math.round((posRel?.y ?? 0) * bh) : (pos?.y ?? 0),
    w: hasRel ? Math.round((sizeRel?.w ?? 0.2) * bw) : (size?.w ?? 200),
    h: hasRel ? Math.round((sizeRel?.h ?? 0.12) * bh) : (size?.h ?? 120),
  };

  // Helper to read from styles with fallback (matching DragResize)
  const readStyle = (key, fallback) => {
    return styles[key] ?? fallback;
  };

  const outerStyle = {
    position: "absolute",
    transform: `translate(${px.x}px, ${px.y}px)`,
    width: px.w,
    height: px.h,
    boxSizing: "border-box",
    pointerEvents: "auto",
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
    borderRadius: readStyle("borderRadius", isCircle ? "50%" : isTriangle || isStar ? "0px" : borderRadius),
    background: readStyle("backgroundColor", "#ffffff"),
    border: `${readStyle("borderWidth", "1px")} ${readStyle("borderStyle", "solid")} ${readStyle("borderColor", "#e5e7eb")}`,
    boxShadow: readStyle("boxShadow", "0 6px 16px rgba(0,0,0,.06)"),
    overflow: readStyle("overflow", "hidden"),
    ...(isTriangle && { clipPath: readStyle("clipPath", "polygon(50% 0%, 0% 100%, 100% 100%)") }),
    ...(isStar && { clipPath: readStyle("clipPath", "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)") }),
  };

  const content =
    typeof children === "function"
      ? children({
          posRel: posRel ?? { x: px.x / (bw || 1), y: px.y / (bh || 1) },
          sizeRel: sizeRel ?? { w: px.w / (bw || 1), h: px.h / (bh || 1) },
          posPx: { x: px.x, y: px.y },
          sizePx: { w: px.w, h: px.h },
          angle,
        })
      : children;

  return (
    <div className={className} style={outerStyle}>
      <div style={rotatedStyle}>
        <div style={contentBoxStyle}>{content}</div>
      </div>
    </div>
  );
}

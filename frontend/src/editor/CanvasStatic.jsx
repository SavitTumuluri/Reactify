// src/components/ui/GraphicBox.jsx
import React, { Children, cloneElement, isValidElement } from "react";

/**
 * GraphicBox
 *
 * Lightweight runtime canvas container (no IR).
 * - Centers a fixed-size "document" in a scrollable workspace.
 * - Injects `{ bounds: { w, h } }` into child elements so interactive/static
 *   items (e.g., DragResize / DragResizeStatic) can render consistently.
 *
 * Props:
 *  - size:          { w:number, h:number }   // required-ish; defaults provided
 *  - workplaceBg:   string                   // outer workspace background
 *  - componentName: string                   // label/id metadata (optional)
 *  - className?:    string
 *  - style?:        React.CSSProperties      // applied to the outer workspace
 *  - children:      ReactNode | (args:{bounds:{w,h}})=>ReactNode
 *
 * Note: The inner document background uses a good-looking default (#fff).
 * If you want it configurable, pass a styled wrapper as a child or extend props.
 */
export default function GraphicBox({
  size = { w: 1200, h: 800 },
  workplaceBg = "#f3f4f6",
  componentName = "GraphicBox",
  className,
  style,
  children,
}) {
  const bw = Math.max(1, size?.w ?? size?.width ?? 0);
  const bh = Math.max(1, size?.h ?? size?.height ?? 0);
  const bounds = { w: bw, h: bh };

  // Outer scrollable workspace that centers the document
  const workspaceStyle = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "auto",
    background: workplaceBg,
    display: "grid",
    placeItems: "center",
    padding: 24,
    ...style,
  };

  // The actual "document" area (absolute children position against this box)
  const canvasStyle = {
    position: "relative",
    width: bounds.w,
    height: bounds.h,
    background: "#ffffff", // document background (good default)
    borderRadius: 16,
    boxShadow: "0 12px 28px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.06)",
    border: "1px solid rgba(0,0,0,.06)",
    overflow: "hidden",
  };

  // Render children:
  // - If function-as-children, call with {bounds}
  // - If elements, clone and inject {bounds}
  const renderChildren = () => {
    if (typeof children === "function") {
      return children({ bounds });
    }
    return Children.map(children, (child) =>
      isValidElement(child) ? cloneElement(child, { bounds }) : child
    );
  };

  return (
    <div
      className={className}
      style={workspaceStyle}
      data-component={componentName}
    >
      <div id="canvas" data-canvas style={canvasStyle}>
        {renderChildren()}
      </div>
    </div>
  );
}
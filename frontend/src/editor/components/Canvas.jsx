// src/components/ui/CanvasContainer.jsx
import React, {
  useMemo,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { IRRoot } from "../core/IR";
import { RegisterComponent } from "../state/ComponentRegistry";

export class IRCanvasContainer extends IRRoot {
  constructor(parent, init = {}) {
    // keep non-visual stuff in top-level IR; visuals in styles
    const defaultStyles = {
      canvasBackground: "#ffffff", // Use separate property for canvas background
      backgroundColor: "#ffffff",  // Keep for compatibility
      borderRadius: "16px",
      boxShadow: "0 12px 28px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.06)",
      border: "1px solid rgba(0,0,0,.06)",
      overflow: "hidden",
    };
    super(null, {
      size: { w: 1200, h: 800 },
      componentName: init.componentName || "Canvas",
      ...init,
      styles: { ...defaultStyles, ...(init.styles ?? {}) },
    });
  }
  toComponent() { return CanvasContainer; }
  toReact() {
    /** @type {Set<string>} */ const effects = new Set()
    /** @type {Set<string>} */ const imports = new Set()

    const Explorer = (ir) => {
      for (const e of ir.toEffects()) effects.add(e)
      for (const im of ir.toImports()) imports.add(im)
      for (const child of ir.children) Explorer(child)
    }
    Explorer(this)

    let importString = ""
    for (const im of imports) importString += im + "\n"

    let effectString = ""
    for (const e of effects) effectString += e + "\n"

    let divString = ""
    for (const child of this.children) divString += child.toReact() + "\n"

    // Get canvas background color from styles
    const styles = this.get("styles") ?? {};
    const canvasBackground = styles.canvasBackground ?? styles.backgroundColor ?? "#ffffff";

    return `
${importString}
export const ${this._data.componentName} = (props) => {
  ${effectString}
  const canvasBackground = "${canvasBackground}";
  return <GraphicBox canvasBackground={canvasBackground}>${divString}</GraphicBox>
}
    `
  }

  toImports() {
    return [
      `import {useState,useRef,useEffect} from "react"`,
      `import GraphicBox from "./GraphicBox.jsx"`,
      `import DragResizeStatic from "./DragResizeStatic.jsx"`,
    ]
  }
}

/**
 * Imperative handle (for parent/toolbar):
 *  - getExportNode(): HTMLElement
 *  - getViewportState(): { zoom:number, panX:number, panY:number }
 *  - getCanvasSize(): { width:number, height:number }
 *  - setExporting(flag:boolean): void
 *
 * Props:
 *  - ir: IRCanvasContainer
 *  - className?: string
 *  - style?: React.CSSProperties          // merged into the canvas root
 *  - onElementSelect?: (node: IR|null) => void
 *  - selected?: IR|null
 */
const CanvasContainer = forwardRef(function CanvasContainer(
  {
    ir,
    className,
    style,
    onElementSelect,
    selected,
    onCheckpoint,
  },
  ref
) {
  ir.init?.();

  // IR root: doc size stays as IR state (not in styles)
  ir.useState("styles", {});
  const [docSize] = ir.useState("size", { w: 1200, h: 800 });
  
  // Component name is managed by Editor.jsx, no need to fetch here
  const componentName = ir?.get?.("componentName") || "Canvas";

  // Ensure styles object exists + defaults (merge without clobber)
  useEffect(() => {
    const existing = ir.get?.("styles") ?? {};
    const defaults = {
      canvasBackground: "#ffffff",
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 12px 28px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.06)",
      border: "1px solid rgba(0,0,0,.06)",
      overflow: "hidden",
    };
    const needsMerge = Object.keys(defaults).some((k) => existing[k] === undefined);
    if (needsMerge) ir.set("styles", { ...defaults, ...existing });
  }, [ir]);

  const bounds = useMemo(() => ({ w: docSize.w, h: docSize.h }), [docSize.w, docSize.h]);
  const s = ir.get?.("styles") ?? {};

  const exportRootRef = useRef(null);
  const [exporting, setExporting] = useState(false); // local, non-serialized

  // Optionally read viewport/pan/zoom stored in IR (if your pan/zoom hook syncs it there)
  const getViewportFromIR = () => {
    // Try multiple conventional keys to be resilient
    const vp =
      ir.get?.("viewport") ??
      ir.get?.("panzoom") ??
      ir.get?.("view") ??
      {};
    return {
      zoom: Number.isFinite(vp.zoom) ? vp.zoom : 1,
      panX: Number.isFinite(vp.panX) ? vp.panX : 0,
      panY: Number.isFinite(vp.panY) ? vp.panY : 0,
    };
  };

  useImperativeHandle(
    ref,
    () => ({
      getExportNode: () => exportRootRef.current,
      getViewportState: () => getViewportFromIR(),
      getCanvasSize: () => ({ width: bounds.w, height: bounds.h }),
      setExporting: (flag) => setExporting(!!flag),
    }),
    [bounds.w, bounds.h] // viewport is accessed lazily
  );

  const canvasStyle = {
    position: "relative",
    width: bounds.w,
    height: bounds.h,
    background: s.canvasBackground ?? s.backgroundColor ?? "#ffffff",
    borderRadius: s.borderRadius ?? "16px",
    boxShadow: s.boxShadow ?? "0 12px 28px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.06)",
    border: s.border ?? "1px solid rgba(0,0,0,.06)",
    overflow: s.overflow ?? "hidden",
    ...style, // allow parent to override if desired
  };

  const elements = ir.children.map((node, index) => {
    const Comp = node.toComponent();
    const key = node.get?.("elementId") || `element-${index}`;
    return (
      <Comp
        key={key}
        ir={node}
        bounds={bounds}
        onElementSelect={onElementSelect}
        isSelected={selected === node}
        onCheckpoint={onCheckpoint}
      />
    );
  });

  return (
    <div
      id="canvas"
      ref={exportRootRef}
      data-canvas
      data-export-root
      data-exporting={exporting ? "true" : undefined}
      className={className}
      style={canvasStyle}
    >
      {elements}
    </div>
  );
});

export default CanvasContainer;
RegisterComponent(IRCanvasContainer);

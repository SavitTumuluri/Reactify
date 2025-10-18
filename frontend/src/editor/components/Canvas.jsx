// src/components/ui/CanvasContainer.jsx
import React, { useMemo, useEffect } from "react";
import { IRRoot } from "../core/IR";
import { RegisterComponent } from "../state/ComponentRegistry";

export class IRCanvasContainer extends IRRoot {
  constructor(parent, init = {}) {
    // keep non-visual stuff in top-level IR; visuals in styles
    const defaultStyles = {
      canvasBackground: "#ffffff", // Use separate property for canvas background
      backgroundColor: "#ffffff", // Keep for compatibility
      borderRadius: "16px",
      boxShadow: "0 12px 28px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.06)",
      border: "1px solid rgba(0,0,0,.06)",
      overflow: "hidden",
    };
    super(null, {
      size: { w: 1200, h: 800 },
      componentName: "NewComponent",
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
    return [`import {useState,useRef,useEffect} from "react"`, `import GraphicBox from "./GraphicBox.jsx"`]
  }
}

/**
 * Props:
 *  - ir: IRCanvasContainer
 *  - background?: string     // still supported; syncs into ir.styles.backgroundColor
 *  - workspaceBg?: string
 *  - className?: string
 *  - style?: React.CSSProperties (applies to workspace wrapper)
 *  - onElementSelect?: (node: IR|null) => void
 *  - selected?: IR|null
 */
export default function CanvasContainer({
  ir,
  className,
  style,
  onElementSelect,
  selected,
}) {
  ir.init?.();

  // IR root: doc size stays as IR state (not in styles)
  ir.useState("styles",{})
  const [docSize] = ir.useState("size", { w: 1200, h: 800 });
  ir.useState("componentName", "NewComponent");

  // Ensure styles object exists + defaults (merge without clobber)
  useEffect(() => {
    const existing = ir.get?.("styles") ?? {};
    const defaults = {
      canvasBackground: "#ffffff", // Use separate property for canvas background
      backgroundColor: "#ffffff", // Keep for compatibility
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
  
  const canvasStyle = {
    position: "relative",
    width: bounds.w,
    height: bounds.h,
    background: s.canvasBackground ?? s.backgroundColor ?? "#ffffff", // Use canvasBackground first
    borderRadius: s.borderRadius ?? "16px",
    boxShadow: s.boxShadow ?? "0 12px 28px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.06)",
    border: s.border ?? "1px solid rgba(0,0,0,.06)",
    overflow: s.overflow ?? "hidden",
  };

  const elements = ir.children.map((node, index) => {
    const Comp = node.toComponent();
    // Use the stable elementId from the node's _data
    const key = node.get?.("elementId") || `element-${index}`;
    return (
      <Comp
        key={key}
        ir={node}
        bounds={bounds}
        onElementSelect={onElementSelect}
        isSelected={selected === node}
      />
    );
  });

  return (
      <div id="canvas" data-canvas style={canvasStyle}>
        {elements}
      </div>
  );
}

RegisterComponent(IRCanvasContainer);

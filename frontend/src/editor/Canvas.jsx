// src/components/ui/CanvasContainer.jsx
import React, { Children, cloneElement, isValidElement, useMemo, useState } from "react";
import {IRRoot} from "./IR"

export class IRCanvasContainer extends IRRoot {
    constructor(parent,init = {}) {
        super(null,{
        ...init,
        });
    }
  toComponent() {
    return CanvasContainer
  }
  toReact() {
    
    /**
     * @type {Set<String>}
     */
    let effects = new Set()
    /**
     * @type {Set<String>}
     */
    let imports = new Set()


    /**
     * 
     * @param {IR} ir 
     */
    let Explorer = (ir) => {
      let effectList = ir.toEffects()
      let importList = ir.toImports()
      for(let effect of effectList) {
        effects.add(effect)
      }
      for(let imp of importList) {
        imports.add(imp)
      }

      for(let child of ir.children) {
        Explorer(child)
      }
    }

    Explorer(this)

    let importString = ""
    for(let imp of imports) {
      importString += imp + "\n"
    }

    let effectString = ""
    for(let effect of effectString) {
      effectString += effect + "\n"
    }

    let divString = ""
    for(let child of this.children) {
      divString += child.toReact() + "\n"
    }
    let size = this.get("size")
    let background = this.get("background")
    let componentName = this.get("componentName")
    return `
${importString}
export default function ${componentName}(props) {
  ${effectString}
  return <GraphicBox size = {{w: ${size.w}, h: ${size.h}}} background = {"${background}"}>${divString}</GraphicBox>
}
    `
  }

}
/**
 * CanvasContainer
 *
 * A fixed-size "document" canvas (like Canva) that centers in a scrollable workspace.
 * - Provides a shared coordinate space for absolute-positioned children.
 * - Injects `{bounds: {w, h}}` into each child element so components like DragResize/DragResizeStatic
 *   can render/behave correctly without prop-drilling.
 * - Lets you set the document size and background color.
 * - For now, size/background are stored in state once and never changed.
 *
 * Props:
 *  - size?:       { w:number, h:number }   // document size in px (defaults: 1200x800)
 *  - background?: string                   // document background color (default: "#ffffff")
 *  - workspaceBg?: string                  // outer workspace color (default: subtle gray)
 *  - className?:  string
 *  - style?:      React.CSSProperties      // applied to outer workspace
 *  - children:    ReactNode | (args:{bounds:{w,h}})=>ReactNode
 */

/**
 * 
 * @param {{ir:IRCanvasContainer}} props 
 * @returns 
 */
export default function CanvasContainer({
  ir,
  background = "#ffffff",
  workspaceBg = "#f3f4f6", // subtle gray
  className,
  style,
}) {
  // Register once (never updated later)
  const [docSize,setDocSize] = ir.useState("size",{w:1200,h:800});
  console.log({docSize})

  const [bgColor,setBgColor] = ir.useState("background",() => background);
  const [name,setName] = ir.useState("componentName","NewComponent");
  console.log({docSize})

  const bounds = useMemo(() => ({ w: docSize.w, h: docSize.h }), [docSize.w, docSize.h]);

  // Outer scrollable workspace that centers the document
  const workspaceStyle = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "auto",
    background: workspaceBg,
    // center the canvas nicely
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
    background: bgColor,
    borderRadius: 16,
    boxShadow: "0 12px 28px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.06)",
    border: "1px solid rgba(0,0,0,.06)",
    overflow: "hidden",
  };

  
  const elements = ir.children.map((node) => {
  const Comp = node.toComponent(); // should be a stable component type
  const key =
    node.id ?? node.uid ?? node.path?.join?.("/") ?? String(node.get?.("id") ?? node);

  return <Comp key={key} ir={node} bounds={bounds} />;
});


  return (
    <div className={className} style={workspaceStyle} onClick = {() => console.log(ir.toReact())}>
      <div id="canvas" data-canvas style={canvasStyle}>
        {elements}
      </div>
    </div>
  );
}
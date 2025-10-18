import { IRView } from "../core/IR";
import getStateManager from "../state/GlobalStateManager";

const history = getStateManager().history;

export class IRCircle extends IRView {
  constructor(parent, init = {}) {
    const defaultStyles = {
      backgroundColor: "#ffffff",
      borderWidth: "0px",
      borderStyle: "solid",
      borderColor: "transparent",
      borderRadius: "50%", // Makes it a circle
      boxShadow: "0 6px 16px rgba(0,0,0,.06)",
      overflow: "hidden",
    };
    const mergedInit = {
      ...init,
      styles: { ...defaultStyles, ...(init.styles ?? {}) },
    };
    super(parent, mergedInit);
    
  }

  toComponent() {
    return DragResize;
  }

  toReact() {
    const posRel = this.get("posRel");
    const sizeRel = this.get("sizeRel");
    const angle = this.get("angle");

    const styles = this.get("styles") ?? {};
    const backgroundColor = styles.backgroundColor ?? "#ffffff";
    const borderWidth = styles.borderWidth ?? "0px";
    const borderStyle = styles.borderStyle ?? "solid";
    const borderColor = styles.borderColor ?? "transparent";
    const borderRadius = styles.borderRadius ?? "50%";
    const boxShadow = styles.boxShadow ?? "0 6px 16px rgba(0,0,0,.06)";
    const overflow = styles.overflow ?? "hidden";

    const body = this.children.map((c) => c.toReact()).join("\n");

    return `<DragResizeStatic 
      posRel={{x:${posRel.x}, y:${posRel.y}}} 
      sizeRel={{w:${sizeRel.w}, h:${sizeRel.h}}} 
      angle={${angle}}
      shapeType="circle"
      styles={{
        backgroundColor: "${backgroundColor}",
        borderWidth: "${borderWidth}",
        borderStyle: "${borderStyle}",
        borderColor: "${borderColor}",
        borderRadius: "${borderRadius}",
        boxShadow: "${boxShadow}",
        overflow: "${overflow}"
      }}
    >${body}</DragResizeStatic>`;
  }

  toImports() {
    return [`import DragResizeStatic from "./DragResizeStatic.jsx"`];
  }

  toEffects() {
    return [];
  }
}

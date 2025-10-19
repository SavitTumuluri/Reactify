import { IRView } from "../core/IR";
import getStateManager from "../state/GlobalStateManager";

const history = getStateManager().history;

export class IRRect extends IRView {
  constructor(parent, init = {}) {
    const defaultStyles = {
      backgroundColor: "#ffffff",
      borderWidth: "0px",
      borderStyle: "solid",
      borderColor: "transparent",
      borderRadius: "12px",
      boxShadow: "0 6px 16px rgba(0,0,0,.06)",
      overflow: "hidden",
    };
    const mergedInit = { ...init, styles: { ...defaultStyles, ...(init.styles ?? {}) } };
    super(parent, mergedInit);
  }

  toComponent() { return DragResize; }

  toReact() {
    const posRel = this.get("posRel") ?? { x: 0, y: 0 };
    const sizeRel = this.get("sizeRel") ?? { w: 0.2, h: 0.2 };
    const angle = this.get("angle") ?? 0;

    const styles = this.get("styles") ?? {};
    const backgroundColor = styles.backgroundColor ?? "#ffffff";
    const borderWidth     = styles.borderWidth ?? "0px";
    const borderStyle     = styles.borderStyle ?? "solid";
    const borderColor     = styles.borderColor ?? "transparent";
    const borderRadius    = styles.borderRadius ?? "12px";
    const boxShadow       = styles.boxShadow ?? "0 6px 16px rgba(0,0,0,.06)";
    
    // Check if this rectangle contains an image - if so, use visible overflow
    const hasImage = this.children.some(child => child.constructor.name === 'IRImage');
    const overflow = hasImage ? "visible" : (styles.overflow ?? "hidden");

    const body = this.children.map((c) => c.toReact()).join("\n");

    return `<DragResizeStatic 
      posRel={{x:${posRel.x}, y:${posRel.y}}} 
      sizeRel={{w:${sizeRel.w}, h:${sizeRel.h}}} 
      angle={${angle}}
      shapeType="rectangle"
      styles={{
        backgroundColor: "${backgroundColor}",
        borderWidth: "${borderWidth}",
        borderStyle: "${borderStyle}",
        borderColor: "${borderColor}",
        borderRadius: "${borderRadius}",
        boxShadow: "${boxShadow}",
        overflow: "${overflow}"
      }}
    >${body}
</DragResizeStatic>`;
  }

  toImports() {
    return [``];
  }
  /**
   * Compute this node's axis-aligned bounding box in px, relative to its parent container.
   * If no parent bounding box is
   * @param {{w:number,h:number}|{width:number,height:number}} parentBoundsPx  Parent size in pixels.
   * @returns {{left:number, top:number, right:number, bottom:number, x:number, y:number, w:number, h:number}} | null
   */
  getBoundingBox() {
    let parentBoundsPx = this.parent.get("size")
    const bw = parentBoundsPx?.w;
    const bh = parentBoundsPx?.h;
    if (!(bw > 0 && bh > 0)) return null;

    const posRel  = this.get("posRel") ?? { x: 0, y: 0 };
    const sizeRel = this.get("sizeRel") ?? { w: 0, h: 0 };
    const angleDeg = (this.get("angle") ?? 0);
    const angle = ((angleDeg % 360) + 360) % 360 * Math.PI / 180;

    // Unrotated box in px
    const x = posRel.x * bw;
    const y = posRel.y * bh;
    const w = sizeRel.w * bw;
    const h = sizeRel.h * bh;

    // If no rotation, fast path
    if (angle === 0) {
      const left = x, top = y, right = x + w, bottom = y + h;
      return { left, top, right, bottom, x: left, y: top, w: right - left, h: bottom - top };
    }

    // Rotate corners around center, then take AABB
    const cx = x + w / 2;
    const cy = y + h / 2;
    const hw = w / 2;
    const hh = h / 2;
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    // 4 corners relative to center
    const corners = [
      { dx:  hw, dy:  hh },
      { dx:  hw, dy: -hh },
      { dx: -hw, dy:  hh },
      { dx: -hw, dy: -hh },
    ].map(({ dx, dy }) => {
      return {
        x: cx + c * dx - s * dy,
        y: cy + s * dx + c * dy,
      };
    });

    const xs = corners.map(p => p.x);
    const ys = corners.map(p => p.y);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);

    return { left, top, right, bottom, x: left, y: top, w: right - left, h: bottom - top };
  }

  /**
   * Static helper: do two AABBs (as returned by getBoundingBox) intersect?
   * Optional padding expands each box by `padding` px (use negative to shrink).
   */
  static boxesIntersect(a, b, padding = 0) {
    if (!a || !b) return false;
    const ax1 = a.left   - padding, ay1 = a.top    - padding;
    const ax2 = a.right  + padding, ay2 = a.bottom + padding;
    const bx1 = b.left   - padding, by1 = b.top    - padding;
    const bx2 = b.right  + padding, by2 = b.bottom + padding;

    // Separating axis for AABB
    const noOverlap =
      ax2 < bx1 || bx2 < ax1 ||  // separated horizontally
      ay2 < by1 || by2 < ay1;    // separated vertically

    return !noOverlap;
  }
}

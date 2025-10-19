import { IRRect } from "../components/DragResize";

/**
 * Pure action with explicit deps; keeps Editor as the caller.
 */
export default function reorderByOverlap({ ir, history, setSelected }, node, dir /* "backward"|"forward" */) {
  if (!node) return;

  const parent = node.parent ?? ir;
  const list = parent?.children ?? [];
  const fromIdx = list.indexOf(node);
  if (fromIdx < 0) return;

  const myBox = node.getBoundingBox?.();
  if (!myBox) return;

  const intersects = (other) => {
    if (!other || other === node || typeof other.getBoundingBox !== "function") return false;
    const ob = other.getBoundingBox();
    return !!ob && IRRect.boxesIntersect(myBox, ob);
  };

  let targetIdx = -1;
  if (dir === "forward") {
    for (let j = fromIdx + 1; j < list.length; j++) if (intersects(list[j])) { targetIdx = j; break; }
  } else {
    for (let j = fromIdx - 1; j >= 0; j--) if (intersects(list[j])) { targetIdx = j; break; }
  }
  if (targetIdx === -1) return;

  const finalIdx = Math.max(0, Math.min(targetIdx, list.length));
  if (finalIdx === fromIdx) return;

  history.moveWithHistory(node, parent, finalIdx);
  setSelected(node);
}

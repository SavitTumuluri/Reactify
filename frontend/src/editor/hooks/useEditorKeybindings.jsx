import { useEffect } from "react";
import { Save, Load } from "../state/Save";
import getStateManager from "../state/GlobalStateManager";

const stateman = getStateManager();

/**
 * Attaches keydown listeners to window.
 * `selectedRef.current` must be kept up to date in Editor to avoid stale closures.
 */
export default function useEditorKeybindings({
  history,
  selectedRef,
  deleteSelected,        // () => void
  addElement,            // (type) => void
  reorderBackward,       // () => void
  reorderForward,          // () => void
  setSelected
}) {
  useEffect(() => {
    const isEditable = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      return el.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };

    // Small helper to attempt JSON parsing safely
    const tryParseJSON = (text) => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    const onKeyDown = async (e) => {
      const editable = isEditable(e.target);
      const selected = selectedRef.current;
      const key = (e.key || "").toLowerCase();
      const hasCmd = e.ctrlKey || e.metaKey;

      // Undo / Redo
      if (hasCmd && !e.repeat && !editable) {
        if (key === "z" && !e.shiftKey) {
          e.preventDefault();
          history.undo?.();
          return;
        }
        if (key === "y" || (key === "z" && e.shiftKey)) {
          e.preventDefault();
          history.redo?.();
          return;
        }
        if (key === "s") {
          e.preventDefault();
          try {
            await stateman.save();
          } catch (err) {
            // Fallback to console only; UI surfaces connection state elsewhere
            console.warn("Manual save failed:", err);
          }
          return;
        }
      }

      // Delete / Escape / Quick add / Reorder
      if ((e.key === "Delete" || e.key === "Backspace") && !editable) {
        e.preventDefault();
        deleteSelected();
        return;
      } else if (e.key === "Escape") {
        e.preventDefault();
        deleteSelected(); // treat as deselect if you prefer
        return;
      } else if (e.key === "r" && !editable) {
        e.preventDefault();
        addElement("rectangle");
        return;
      } else if (e.key === "t" && !editable) {
        e.preventDefault();
        addElement("text");
        return;
      } else if (e.key === "[" && selected) {
        e.preventDefault();
        e.stopPropagation();
        reorderBackward();
        return;
      } else if (e.key === "]" && selected) {
        e.preventDefault();
        e.stopPropagation();
        reorderForward();
        return;
      }

      // ---- Ctrl/Cmd + C (Copy selected IR as JSON) ----
      if (hasCmd && key === "c" && !editable) {
        if (!selected) return; // nothing to copy
        e.preventDefault();
        e.stopPropagation();
        try {
          // Serialize the selected node
          const snapshot = Save(selected); // assumes returns plain serializable object
          const text = JSON.stringify(snapshot);
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            // Fallback: create a temporary textarea
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
          }
        } catch (err) {
          // Silent failure to avoid noisy UX
          // console.warn("Copy failed:", err);
        }
        return;
      }

      // ---- Ctrl/Cmd + V (Paste JSON as new IR under root) ----
      if (hasCmd && key === "v" && !editable) {
        e.preventDefault();
        e.stopPropagation();
        try {
          let raw = "";
          if (navigator?.clipboard?.readText) {
            raw = await navigator.clipboard.readText();
          } else {
            // Without readText, we can't access clipboard synchronously here; abort quietly
            return;
          }

          const parsed = tryParseJSON(raw);
          if (!parsed) return; // not our JSON
          delete parsed._data.elementId
          const ir = stateman.root;
          
          // Attempt to load into the current root
          const elem = Load(parsed, ir);
          //created.resetElementId()
          // Handle possible return shapes
          if (elem) {
            // Push history entry for the creation
              const parent = elem.parent;
              const idx = parent?.children ? parent.children.length - 1 : 0;
              history.pushUndoCreate(elem, parent, idx);

                // Try to select newly created element (non-breaking; no API change)
                setSelected(elem); 

                // Force a rerender so the new element appears
             ir.forceReRender?.();
          }
        } catch (err) {
          console.warn("Paste failed:", err);
        }
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [history, selectedRef, deleteSelected, addElement, reorderBackward, reorderForward]);
}

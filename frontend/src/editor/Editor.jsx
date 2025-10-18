// src/editor/Editor.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import DragResize from "./components/DragResize";
import CanvasContainer, { IRCanvasContainer } from "./components/Canvas";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ImageGallery from "./components/ImageGallery";

import { Save, Load } from "./state/Save";
import { IRText } from "./components/NewEditableText";
import StateMan from "./state/GlobalStateManager";
import { useNavigate, useParams } from "react-router-dom";

import usePanZoom from "./hooks/usePanZoom";
import useMediaSelection from "./hooks/useMediaSelection";
import useEditorKeybindings from "./hooks/useEditorKeybindings";
import useSidebarResize from "./hooks/useSidebarResize";
import reorderByOverlap from "./actions/reorderByOverlap";

const stateman = StateMan();
const history = stateman.history;

export default function EditorPage() {
  const navigate = useNavigate();
  const { canvasId } = useParams();

  // ---- Core IR state (Editor remains owner) ----
  const [ir, setIR] = useState(() => new IRCanvasContainer());
  const [selected, setSelected] = useState(null);
  const [irVersion, setIrVersion] = useState(0);

  // Keep GlobalStateManager wired to IR; bump version when it swaps
  stateman.init(ir, (next) => {
    setIR(next);
    setIrVersion((v) => v + 1);
  });

  // ---- UI state ----
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // ---- Pan/Zoom ----
  const {
    workspaceRef,
    viewportStyle,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    reset: resetView,
    zoomTo,
  } = usePanZoom({ initial: { x: 0, y: 0, scale: 1 }, minScale: 0.25, maxScale: 6 });

  // ---- Add element (kept in Editor) ----
  const addElement = useCallback(
    async (type) => {
      let elem = null;
      if (type === "text") {
        // Create a simple text element
        elem = new IRText(ir);
      }

      if (elem) {
        history.pushUndoCreate(elem, elem.parent, elem.parent.children.length - 1);
        try { setSelected(elem); } catch {}
        try { ir.forceReRender?.(); } catch {}
      }
    },
    [ir, selected]
  );

  // ---- Delete selected ----
  const deleteSelectedElement = useCallback(() => {
    if (!selected) { setSelected(null); return; }
    selected.unlink?.();
    setSelected(null);
  }, [selected]);

  // ---- Overlap-based reordering (like Canva) ----
  const doReorderBackward = useCallback(
    () => reorderByOverlap({ ir, history, setSelected }, selected, "backward"),
    [ir, history, setSelected, selected]
  );
  const doReorderForward = useCallback(
    () => reorderByOverlap({ ir, history, setSelected }, selected, "forward"),
    [ir, history, setSelected, selected]
  );

  // ---- Keybindings (extracted effect, Editor supplies fresh refs & callbacks) ----
  const selectedRef = useRef(null);
  selectedRef.current = selected;

  useEditorKeybindings({
    history,
    selectedRef,
    deleteSelected: deleteSelectedElement,
    addElement,
    reorderBackward: doReorderBackward,
    reorderForward: doReorderForward,
    setSelected: setSelected,
  });

  // ---- Sidebar resizer (extracted effect) ----
  const { sidebarWidth, isResizing, onHandleMouseDown } = useSidebarResize(280, { min: 200, max: 400 });

  // ---- Image/Video selection (extracted, with local media helpers) ----
  const onSelectMedia = useMediaSelection({ ir, selected, setSelected, setIsGalleryOpen });

  // ---- Preview / Export ----
  const previewAndExportCode = async () => {
    try {
      await stateman.save();
      if (canvasId) navigate(`/preview/${canvasId}`);
      else console.error("No canvasId available for preview");
    } catch (error) {
      console.error("Error saving canvas:", error);
    }
  };

  // ---- Workspace style ----
  const workspaceStyle = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "#ffffff",
    cursor: "default",
    userSelect: "none",
  };

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden">
      <Header
        selected={selected}
        onDeleteElement={deleteSelectedElement}
        onPreviewAndExport={previewAndExportCode}
        isConnected={stateman.connected}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onAddElement={addElement}
      />

      <div className="flex h-full">
        <Sidebar
          sidebarWidth={sidebarWidth}
          selected={selected}
          ir={ir}
          onAddElement={addElement}
        />

        <div
          className={`w-1 bg-gray-600 hover:bg-gray-500 cursor-col-resize flex-shrink-0 ${isResizing ? "bg-gray-500" : ""}`}
          onMouseDown={onHandleMouseDown}
        />

        <div className="flex-1 min-w-0 h-full bg-gray-900">
          <div className="h-full p-4">
            <div
              id="workspace"
              ref={workspaceRef}
              style={workspaceStyle}
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onClick={(e) => {
                const el = e.target;
                if (el?.id === "canvas" || el?.getAttribute?.("data-canvas")) {
                  setSelected(null);
                }
              }}
            >
              <div className="absolute right-3 top-3 z-10 flex gap-2">
                <button
                  className="px-2 py-1 rounded bg-gray-800/70 hover:bg-gray-700"
                  onClick={() => resetView()}
                  title="Reset view"
                >
                  Reset
                </button>
                <button
                  className="px-2 py-1 rounded bg-gray-800/70 hover:bg-gray-700"
                  onClick={() => zoomTo(1)}
                  title="Zoom 100%"
                >
                  100%
                </button>
              </div>

              <div
                id="canvas-viewport"
                style={{ position: "absolute", left: 0, top: 0, ...viewportStyle }}
              >
                <CanvasContainer
                  id="reactify-canvas"
                  ir={ir}
                  key={irVersion}
                  onElementSelect={(node) => setSelected(node)}
                  selected={selected}
                />
              </div>
            </div>
          </div>

          <ImageGallery
            isOpen={isGalleryOpen}
            onClose={() => setIsGalleryOpen(false)}
            onSelectImage={onSelectMedia}
          />
        </div>
      </div>
    </div>
  );
}

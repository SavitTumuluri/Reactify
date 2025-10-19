// src/editor/Editor.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import DragResize, { IRRect, IRCircle, IRTriangle, IRStar } from "./components/DragResize";
import { IRLine } from "./components/Line";
import CanvasContainer, { IRCanvasContainer } from "./components/Canvas";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ImageGallery from "./components/ImageGallery";

import { Save, Load } from "./state/Save";
import { IRText } from "./components/NewEditableText";
import { IRAIComponent } from "./components/AIComponent";
import { generateAISVG, rewriteIRWithAgent } from "../lib/aiService";
import AgentPanel from "./components/AgentPanel";
import StateMan from "./state/GlobalStateManager";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useCanvasAutoSave } from "../lib/useCanvasAutoSave";
import { authService } from "../lib/authService";

import usePanZoom from "./hooks/usePanZoom";
import useMediaSelection from "./hooks/useMediaSelection";
import useEditorKeybindings from "./hooks/useEditorKeybindings";
import useSidebarResize from "./hooks/useSidebarResize";
import reorderByOverlap from "./actions/reorderByOverlap";

// ⭐ NEW: client-side DOM → PNG
import { toPng } from "html-to-image";

const stateman = StateMan();
const history = stateman.history;

export default function EditorPage() {
  const navigate = useNavigate();
  const { canvasId } = useParams();
  const { user } = useAuth();
  const userId = user?.sub;

  // ---- Core IR state (Editor remains owner) ----
  const [ir, forceSetIR] = useState(() => new IRCanvasContainer());
  const [selected, setSelected] = useState(null);
  const [irVersion, setIrVersion] = useState(0);
  
  // Separate state for canvas name to avoid triggering autosave
  const [canvasName, setCanvasName] = useState(null);

  // Keep GlobalStateManager wired to IR; bump version when it swaps
  const setIR = stateman.init(ir, forceSetIR,setIrVersion);

  // ---- Autosave + checkpoint logs ----
  const canvasDataPayload = { ir: Save(ir) };
  // Don't send canvasName during autosave - let backend preserve existing name
  const { manualSave } = useCanvasAutoSave(userId, canvasId, canvasDataPayload, null, {
    debounceDelay: 800,
  });

  useEffect(() => {
    // Whenever history records a new change, bump version to notify autosave hook
    stateman.history.onChange = () => {
      setIrVersion(v => v + 1);
    };
    return () => { stateman.history.onChange = null; };
  }, []);

  // Update component name when canvasId changes (for new canvases)
  useEffect(() => {
    if (canvasId) {
      // Fetch canvas name from backend
      const fetchCanvasName = async () => {
        try {
          const accessToken = authService.getAccessToken();
          if (!accessToken) {
            return;
          }
          
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/canvas/${canvasId}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (response.ok) {
            const canvasData = await response.json();
            
            if (canvasData.canvas && canvasData.canvas.name) {
              setCanvasName(canvasData.canvas.name);
              // Only update IR componentName if it's different to avoid unnecessary autosave triggers
              if (ir?.get?.('componentName') !== canvasData.canvas.name) {
                ir.set('componentName', canvasData.canvas.name);
              }
            }
          }
        } catch (error) {
          console.warn('Could not fetch canvas name:', error);
        }
      };
      
      // Add a small delay to ensure the canvas is fully saved
      setTimeout(fetchCanvasName, 1000);
    }
  }, [canvasId, ir]);


  // ---- UI state ----
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentMsgs, setAgentMsgs] = useState([]);

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
      if (type === "rectangle") {
        elem = new IRRect(ir);
      } else if (type === "circle") {
        elem = new IRCircle(ir);
      } else if (type === "triangle") {
        elem = new IRTriangle(ir);
      } else if (type === "star") {
        elem = new IRStar(ir);
      } else if (type === "line") {
        elem = new IRLine(ir);
      } else if (type === "text") {
        const rect = new IRRect(ir);
        elem = new IRText(rect);
      } else if (type === "aiComponent") {
        const rectStyles = {
          backgroundColor: "transparent",
          borderStyle: "none",
          borderWidth: "0px",
          borderColor: "transparent",
          boxShadow: "none",
          overflow: "visible",
        };
        const rect = selected instanceof IRRect ? selected : new IRRect(ir, { styles: rectStyles });
        if (!(selected instanceof IRRect)) {
          rect.set?.("styles", { ...(rect.get?.("styles") ?? {}), ...rectStyles });
        }
        const ai = new IRAIComponent(rect, { title: "Generating…", loading: true });
        elem = ai;
        const description =
          window.prompt("Describe what to draw (e.g., 'star', 'make a circle')", "star") || "star";
        try {
          const svg = await generateAISVG(description);
          ai.set("code", svg);
          ai.set("title", description);
          ai.set("loading", false);
        } catch (e) {
          ai.set("error", e?.message || String(e));
          ai.set("loading", false);
        }
        setSelected(rect);
      }

      if (elem) {
        history.pushUndoCreate(elem, elem.parent, elem.parent.children.length - 1);
        try { setSelected(elem); } catch {}
        try { ir.forceReRender?.(); } catch {}
      }
    },
    [ir, selected]
  );

  // Removed plan executor — we now exclusively use full IR rewrite

  const submitAgent = useCallback(async (text) => {
    setAgentMsgs((m) => [...m, { role: "user", text }]);
    setAgentBusy(true);
    try {
      const state = Save(ir);
      const resp = await rewriteIRWithAgent(text, state);
      const { ir: newIr } = resp || {};
      if (newIr) {
        const sanitize = (node) => {
          if (!node || typeof node !== "object") return node;
          const name = node.name;
          node._data = node._data ?? {};
          node._data.styles = node._data.styles ?? {};
          const s = node._data.styles;
          // Canvas background normalization
          if (name === "IRCanvasContainer") {
            if (s.backgroundColor && !s.canvasBackground) s.canvasBackground = s.backgroundColor;
          }
          // Filled shapes: map color -> backgroundColor
          const filled = name === "IRRect" || name === "IRCircle" || name === "IRTriangle" || name === "IRStar";
          if (filled) {
            if (s.color && !s.backgroundColor) s.backgroundColor = s.color;
          }
          // Lines: map color/backgroundColor -> stroke
          if (name === "IRLine") {
            if (!s.stroke) {
              if (s.color) s.stroke = s.color;
              else if (s.backgroundColor) s.stroke = s.backgroundColor;
            }
            if (typeof s.strokeWidth !== "number") {
              const n = parseFloat(s.strokeWidth);
              s.strokeWidth = Number.isFinite(n) ? n : 2;
            }
          }
          // Recurse
          if (Array.isArray(node.children)) node.children.forEach(sanitize);
          return node;
        };
        const normalized = sanitize(JSON.parse(JSON.stringify(newIr)));
        const loaded = Load(normalized);
        if (loaded) {
          stateman.history.clear();
          stateman.setRoot?.(loaded);
        }
        setAgentMsgs((m) => [...m, { role: "agent", text: "Rewrote IR" }]);
      } else {
        setAgentMsgs((m) => [...m, { role: "agent", text: "No IR returned" }]);
      }
    } catch (e) {
      console.error(e);
      setAgentMsgs((m) => [...m, { role: "agent", text: `Error: ${e?.message || String(e)}` }]);
    } finally {
      setAgentBusy(false);
    }
  }, []);

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

  // ---- Preview / Export (existing preview route) ----
  const previewAndExportCode = async () => {
    try {
      await stateman.save();
      if (canvasId) navigate(`/preview/${canvasId}`);
      else console.error("No canvasId available for preview");
    } catch (error) {
      console.error("Error saving canvas:", error);
    }
  };

  // ⭐ NEW: Export to PNG orchestration (uses CanvasContainer's imperative API)
  const canvasRef = useRef(null);

  const exportCanvasToPNG = useCallback(
    async (opts = {}) => {
      try {
        const handle = canvasRef.current;
        if (!handle) {
          console.error("Canvas handle not available for export.");
          return;
        }

        // Optional: freeze UI adornments (selectors, guides) while capturing
        handle.setExporting?.(true);

        // Ensure webfonts are ready before rasterization
        if (document.fonts && document.fonts.ready) {
          try { await document.fonts.ready; } catch {}
        }

        const { width, height } = handle.getCanvasSize?.() || { width: 1200, height: 800 };
        const scale = Number.isFinite(opts.scale) ? opts.scale : 1; // crisp 2× by default
        const node = handle.getExportNode?.();
        if (!node) {
          console.error("Export node not found.");
          return;
        }

        // Build a clean filename from componentName
        const baseName = (ir.get?.("componentName") || "Canvas").toString().replace(/[^\w\-]+/g, "_");
        const fileName = `${baseName}.png`;

        // Render the DOM node → PNG data URL at desired size/scale
        const dataUrl = await toPng(node, {
          cacheBust: true,
          width: Math.round(width * scale),
          height: Math.round(height * scale),
          style: {
            // neutralize any transforms on the node itself (if any)
            transform: "scale(1)",
            transformOrigin: "top left",
            width: `${Math.round(width * scale)}px`,
            height: `${Math.round(height * scale)}px`,
          },
          // If you later mark elements with data attributes to exclude from export:
          // filter: (domNode) => !domNode.closest?.("[data-selection],[data-guides]")
        });

        // Trigger a download
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Export to PNG failed:", err);
      } finally {
        // Always unfreeze UI
        try { canvasRef.current?.setExporting?.(false); } catch {}
      }
    },
    [ir]
  );

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
        onOpenAgent={() => setAgentOpen(true)}
        // ⭐ NEW: hook up "Export to PNG" button in Header
        onExportPNG={() => exportCanvasToPNG({ scale: 1 })}
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

              {agentOpen && (
                <AgentPanel
                  onSubmit={submitAgent}
                  messages={agentMsgs}
                  busy={agentBusy}
                  onClose={() => setAgentOpen(false)}
                />
              )}

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
                  onCheckpoint={() => {
                    // Trigger save when a checkpoint-worthy interaction completes
                    try { stateman.save(); } catch {}
                  }}
                  // ⭐ NEW: attach imperative API for export
                  ref={canvasRef}
                />
              </div>
            </div>
          </div>

          <ImageGallery
            open={isGalleryOpen}
            onClose={() => setIsGalleryOpen(false)}
            onSelect={onSelectMedia}
          />
        </div>
      </div>
    </div>
  );
}

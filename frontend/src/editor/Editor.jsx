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
// Import all components to ensure they're registered
import "./components/ImageView";
import "./components/VideoView";
import { generateAISVG, rewriteIRWithAgent } from "../lib/aiService";
import AgentPanel from "./components/AgentPanel";
import AIPromptModal from "./components/AIPromptModal";
import AIComponentSelector from "./components/AIComponentSelector";
import StateMan from "./state/GlobalStateManager";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useCanvasAutoSave } from "../lib/useCanvasAutoSave";
import { authService } from "../lib/authService";
import { canvaService } from "../lib/canvaService";

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
    onSaveSuccess: async (data) => {
      // Only capture preview on manual saves, not on every autosave
      // This prevents the expensive html-to-image operation from running constantly
    }
  });

  // Throttled preview capture - only runs every 60 seconds max
  const lastPreviewCaptureRef = useRef(0);
  const isCapturingPreviewRef = useRef(false);
  const PREVIEW_THROTTLE_MS = 60000; // 60 seconds (1 minute)

  const handleCapturePreview = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Prevent multiple simultaneous captures
    if (isCapturingPreviewRef.current) {
      console.log('Preview capture already in progress, skipping...');
      return;
    }
    
    // Throttle preview captures to prevent performance issues
    if (!force && (now - lastPreviewCaptureRef.current) < PREVIEW_THROTTLE_MS) {
      console.log('Preview capture throttled, skipping...');
      return;
    }

    try {
      isCapturingPreviewRef.current = true;
      
      // Find canvas element
      const canvasElement = document.getElementById('canvas') || 
                           document.querySelector('[data-canvas]') || 
                           document.querySelector('[data-export-root]');
      
      
      if (canvasElement && canvasId) {
        console.log('Starting preview capture...');
        await canvaService.captureCanvasPreview(canvasElement, canvasId);
        lastPreviewCaptureRef.current = now;
        console.log('Preview capture completed successfully');
      } else {
        console.warn('Canvas element or canvasId not found:', { canvasElement, canvasId });
      }
    } catch (error) {
      console.error('Failed to capture canvas preview:', error);
    } finally {
      isCapturingPreviewRef.current = false;
    }
  }, [canvasId, userId]);

  // Delayed preview capture - only after user stops editing for 30 seconds
  const previewTimeoutRef = useRef(null);
  const PREVIEW_DELAY_MS = 30000; // 30 seconds after last change

  useEffect(() => {
    // Whenever history records a new change, bump version to notify autosave hook
    stateman.history.onChange = () => {
      setIrVersion(v => v + 1);
      
      // Clear existing timeout and set new one for delayed preview capture
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      
      previewTimeoutRef.current = setTimeout(() => {
        handleCapturePreview();
      }, PREVIEW_DELAY_MS);
    };
    
    return () => { 
      stateman.history.onChange = null;
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [handleCapturePreview]);


  // Update canvas name state when IR component name changes
  useEffect(() => {
    if (ir?.get?.('componentName')) {
      setCanvasName(ir.get('componentName'));
    }
  }, [ir]);


  // ---- UI state ----
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentMsgs, setAgentMsgs] = useState([]);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [pendingAiComponent, setPendingAiComponent] = useState(null);
  const [aiSelectorOpen, setAiSelectorOpen] = useState(false);

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
        // Open the AI component selector instead of directly creating
        setAiSelectorOpen(true);
        return; // Don't create element yet, wait for selector
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
      
      if (resp?.action === "conversation") {
        setAgentMsgs((m) => [...m, { role: "assistant", text: resp.message || "I'm here to help! How can I assist you with your canvas?" }]);
      } else if (resp?.action === "modify_ir" && resp.ir) {
        const newIr = resp.ir;
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
        setAgentMsgs((m) => [...m, { role: "assistant", text: resp.message || "I've updated your canvas as requested." }]);
      } else {
        // Fallback for old format or unexpected response
        setAgentMsgs((m) => [...m, { role: "assistant", text: "I didn't understand that request. Could you please try rephrasing it? For example, you can ask me to 'add a blue rectangle' or 'what does this application do?'" }]);
      }
    } catch (e) {
      console.error("Agent error:", e);
      let errorMessage = "Sorry, I encountered an error. Please try again!";
      
      if (e?.message?.includes("JSON")) {
        errorMessage = "I had trouble processing that request. Could you try rephrasing it? For example, ask 'What does this application do?' or 'Add a blue rectangle'.";
      } else if (e?.message?.includes("fetch")) {
        errorMessage = "I'm having trouble connecting. Please check your internet connection and try again.";
      } else if (e?.message) {
        errorMessage = `Sorry, I encountered an error: ${e.message}. Please try again or ask me something else!`;
      }
      
      setAgentMsgs((m) => [...m, { role: "assistant", text: errorMessage }]);
    } finally {
      setAgentBusy(false);
    }
  }, []);

  const handleAiPromptSubmit = useCallback(async (description) => {
    if (!pendingAiComponent) return;
    
    setAiPromptOpen(false);
    
    try {
      const svg = await generateAISVG(description);
      pendingAiComponent.set("code", svg);
      pendingAiComponent.set("title", description);
      pendingAiComponent.set("loading", false);
    } catch (e) {
      pendingAiComponent.set("error", e?.message || String(e));
      pendingAiComponent.set("loading", false);
    } finally {
      setPendingAiComponent(null);
    }
  }, [pendingAiComponent]);

  const handleAiComponentSelect = useCallback(async (type, description) => {
    setAiSelectorOpen(false);
    
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
    
    // Add to history and select
    history.pushUndoCreate(ai, ai.parent, ai.parent.children.length - 1);
    setSelected(rect);
    ir.forceReRender?.();
    
    try {
      const svg = await generateAISVG(description);
      ai.set("code", svg);
      ai.set("title", description);
      ai.set("loading", false);
    } catch (e) {
      ai.set("error", e?.message || String(e));
      ai.set("loading", false);
    }
  }, [ir, selected, history]);

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

  const handleManualSave = useCallback(async () => {
    try {
      await manualSave();
      await handleCapturePreview(true);
    } catch (error) {
      console.error("Error during manual save:", error);
    }
  }, [manualSave, handleCapturePreview]);

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
    manualSave: handleManualSave, // Pass the new manual save function
  });

  // ---- Sidebar resizer (extracted effect) ----
  const { sidebarWidth, isResizing, onHandleMouseDown } = useSidebarResize(280, { min: 200, max: 400 });

  // ---- Image/Video selection (extracted, with local media helpers) ----
  const onSelectMedia = useMediaSelection({ ir, selected, setSelected, setIsGalleryOpen });

  // ---- Preview / Export (existing preview route) ----
  const previewAndExportCode = async () => {
    try {
      await stateman.save();
      // Force preview capture when user explicitly requests preview
      await handleCapturePreview(true);
      if (canvasId) navigate(`/preview/${canvasId}`);
      else console.error("No canvasId available for preview");
    } catch (error) {
      console.error("Error saving canvas:", error);
    }
  };

  const canvasRef = useRef(null);

  const exportCanvasToPNG = useCallback(
    async (opts = {}) => {
      try {
        const handle = canvasRef.current;
        if (!handle) {
          console.error("Canvas handle not available for export.");
          return;
        }

        handle.setExporting?.(true);

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

        const baseName = (ir.get?.("componentName") || "Canvas").toString().replace(/[^\w\-]+/g, "_");
        const fileName = `${baseName}.png`;

        const dataUrl = await toPng(node, {
          cacheBust: true,
          width: Math.round(width * scale),
          height: Math.round(height * scale),
          style: {
            transform: "scale(1)",
            transformOrigin: "top left",
            width: `${Math.round(width * scale)}px`,
            height: `${Math.round(height * scale)}px`,
          },

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
        onExportPNG={() => exportCanvasToPNG({ scale: 1 })}
        onCapturePreview={handleCapturePreview}
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
                    try { stateman.save(); } catch {}
                  }}
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

          <AIPromptModal
            isOpen={aiPromptOpen}
            onClose={() => {
              setAiPromptOpen(false);
              setPendingAiComponent(null);
            }}
            onSubmit={handleAiPromptSubmit}
          />

          <AIComponentSelector
            isOpen={aiSelectorOpen}
            onClose={() => setAiSelectorOpen(false)}
            onSelect={handleAiComponentSelect}
          />
        </div>
      </div>
    </div>
  );
}

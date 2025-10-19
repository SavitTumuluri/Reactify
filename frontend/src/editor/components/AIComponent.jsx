import React, { useEffect, useRef } from "react";
import { IRView } from "../core/IR";
import { RegisterComponent } from "../state/ComponentRegistry";

export class IRAIComponent extends IRView {
  constructor(parent, init = {}) {
    super(parent, {
      title: "AI Component",
      code: "",      // SVG or JSX string
      loading: false,
      error: null,
      ...init
    });
  }
  toComponent() { return AIComponentView; }
  toReact() {
    // For export: just inline whatever code we captured.
    // If it’s SVG: wrap in a div.
    // If it’s React JSX (DragResizeStatic children), emit as-is.
    const code = this.get("code") ?? "";
    const isSVG = /<svg[\s\S]*<\/svg>/i.test(code);
    if (isSVG) {
      const safe = JSON.stringify(code);
      return `<div dangerouslySetInnerHTML={{__html: ${safe}}} />`;
    }
    // Assume it's valid JSX fragment (DragResizeStatic tree)
    return code;
  }
}

export default function AIComponentView({ ir }) {
  ir.init();
  const [title] = ir.useState("title", "AI Component");
  const [code] = ir.useState("code", "");
  const [loading] = ir.useState("loading", false);
  const [error] = ir.useState("error", null);
  const containerRef = useRef(null);

  // Normalize embedded SVG so it scales with its parent container
  useEffect(() => {
    if (!code || !/<svg[\s\S]*<\/svg>/i.test(code)) return;
    const host = containerRef.current;
    if (!host) return;
    host.innerHTML = code;
    const svg = host.querySelector("svg");
    if (!svg) return;

    // Capture original width/height before overriding
    const rawW = svg.getAttribute("width");
    const rawH = svg.getAttribute("height");
    let w = rawW ? parseFloat(String(rawW).replace(/[^0-9.]/g, "")) : NaN;
    let h = rawH ? parseFloat(String(rawH).replace(/[^0-9.]/g, "")) : NaN;

    // Make responsive
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    if (!svg.getAttribute("preserveAspectRatio")) {
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }
    // Ensure display block to avoid inline gaps
    svg.style.display = "block";

    // If viewBox missing, derive from numeric width/height or fallback to bbox
    if (!svg.getAttribute("viewBox")) {
      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
        try {
          const bbox = svg.getBBox?.();
          if (bbox && bbox.width > 0 && bbox.height > 0) {
            w = bbox.width;
            h = bbox.height;
          }
        } catch {}
      }
      if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      }
    }
  }, [code]);

  return (
    <div className="w-full h-full">
      {loading && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-4">
            <div className="relative">
              <div className="w-14 h-14 relative">
                <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 border-r-fuchsia-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-2 border-transparent border-t-pink-500 border-l-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <div className="absolute inset-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-sm text-gray-200">Generating AI component…</div>
          </div>
        </div>
      )}
      {error && (
        <div className="p-3 text-sm text-red-400">
          {String(error)}
        </div>
      )}
      {!loading && !error && code && /<svg[\s\S]*<\/svg>/i.test(code) && (
        <div ref={containerRef} className="w-full h-full" />
      )}
      {!loading && !error && code && !/<svg[\s\S]*<\/svg>/i.test(code) && (
        // You could live-evaluate JSX with a sandbox, but simplest is preview-only text.
        <pre className="text-xs p-2 overflow-auto">{code}</pre>
      )}
    </div>
  );
}

RegisterComponent(IRAIComponent);



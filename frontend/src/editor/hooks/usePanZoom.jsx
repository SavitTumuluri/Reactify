import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ---------- Device-independent wheel normalization ---------- */
function normalizeWheel(e) {
  const LINE = 40, PAGE = 800;
  let pX = e.deltaX, pY = e.deltaY;
  if (e.deltaMode === 1) { pX *= LINE; pY *= LINE; }
  else if (e.deltaMode === 2) { pX *= PAGE; pY *= PAGE; }
  return { pixelX: pX || 0, pixelY: pY || 0 };
}

/* ---------- Tunables (feel) ---------- */
const PAN_FRICTION_16MS  = 0.75;   // per 16ms frame
const ZOOM_FRICTION_16MS = 0.75;   // per 16ms frame
const PAN_GAIN           = 0.3;    // pan speed multiplier
const ZOOM_GAIN_WHEEL    = 0.005; // ↑ slightly larger than before (was ~0.0015)
const ZOOM_GAIN_GESTURE  = 1.0;    // scale factor -> ln(scale)^1.0
const EPS_PAN            = 0.05;   // stop threshold (px/frame)
const EPS_ZOOM           = 0.00015;// stop threshold (log-scale/frame)

export default function usePanZoom({
  minScale = 0.25,
  maxScale = 6,
  initial   = { x: 0, y: 0, scale: 1 },
} = {}) {
  const [view, setView] = useState(initial);
  const workspaceRef    = useRef(null);

  // Pending impulses from input events (wheel/drag) — applied next frame
  const pending = useRef({ dx: 0, dy: 0, dz: 0, ax: 0, ay: 0, doZoom: false });

  // Inertial velocities (persist across frames)
  const vel     = useRef({ vx: 0, vy: 0, vz: 0 });    // vz is in log-scale units per frame
  const anchor  = useRef({ x: 0, y: 0 });             // zoom anchor (workspace coords)

  // rAF loop
  const rafId   = useRef(0);
  const lastTs  = useRef(0);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const schedule = useCallback(() => { if (!rafId.current) rafId.current = requestAnimationFrame(step); }, []);
  const cancel   = useCallback(() => { if (rafId.current) cancelAnimationFrame(rafId.current); rafId.current = 0; }, []);

  // Main frame step
  const step = useCallback((ts) => {
    rafId.current = 0;
    if (!lastTs.current) lastTs.current = ts;
    const dt = Math.max(1, ts - lastTs.current);       // ms
    lastTs.current = ts;

    // Convert per-16ms friction to per-dt
    const panF  = Math.pow(PAN_FRICTION_16MS,  dt / 16.0);
    const zoomF = Math.pow(ZOOM_FRICTION_16MS, dt / 16.0);

    let { vx, vy, vz } = vel.current;

    // Consume pending impulses (from wheel/drag since last frame)
    const p = pending.current;
    if (p.dx || p.dy) { vx += p.dx; vy += p.dy; }
    if (p.doZoom)     { vz += p.dz; anchor.current = { x: p.ax, y: p.ay }; }
    pending.current = { dx: 0, dy: 0, dz: 0, ax: 0, ay: 0, doZoom: false };

    // Early exit if everything is still
    const stillPan  = Math.abs(vx) < EPS_PAN && Math.abs(vy) < EPS_PAN;
    const stillZoom = Math.abs(vz) < EPS_ZOOM;
    if (stillPan && stillZoom) return;

    // Apply velocities to view (single setState per frame)
    setView((v) => {
      let { x, y, scale } = v;

      if (!stillZoom) {
        const nextScale = clamp(scale * Math.exp(vz), minScale, maxScale);
        if (nextScale !== scale) {
          const k = nextScale / scale;
          const ax = anchor.current.x;
          const ay = anchor.current.y;
          x = ax - (ax - x) * k;
          y = ay - (ay - y) * k;
          scale = nextScale;
        }
      }

      if (!stillPan) {
        x += vx;
        y += vy;
      }

      return { x, y, scale };
    });

    // Apply friction
    vx *= panF;
    vy *= panF;
    vz *= zoomF;

    // Zero-out small velocities
    if (Math.abs(vx) < EPS_PAN)  vx = 0;
    if (Math.abs(vy) < EPS_PAN)  vy = 0;
    if (Math.abs(vz) < EPS_ZOOM) vz = 0;

    vel.current = { vx, vy, vz };

    // Keep animating while there is motion
    if (vx || vy || vz) schedule();
  }, [minScale, maxScale, schedule]);

  /* ---------- Wheel/pinch/scroll ---------- */
  const wheelHandler = useCallback((e) => {
    e.preventDefault(); // stop page scroll/zoom
    const el = workspaceRef.current; if (!el) return;

    const { pixelX, pixelY } = normalizeWheel(e);
    const rect = el.getBoundingClientRect();
    const ax = e.clientX - rect.left;
    const ay = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      // Pinch/ctrl+wheel -> zoom impulse (log-scale)
      const dz = -pixelY * ZOOM_GAIN_WHEEL;
      pending.current.dz += dz;
      pending.current.ax = ax;
      pending.current.ay = ay;
      pending.current.doZoom = true;
      // Add a bit to velocity for inertia
      vel.current.vz += dz * 0.25;
      schedule();
      return;
    }

    // Two-finger scroll / wheel panning impulse
    const dx = -pixelX * PAN_GAIN;
    const dy = -pixelY * PAN_GAIN;
    pending.current.dx += dx;
    pending.current.dy += dy;
    // Add inertia
    vel.current.vx += dx * 0.15;
    vel.current.vy += dy * 0.15;
    schedule();
  }, [schedule]);

  // Safari gesture events for trackpad pinch
  useEffect(() => {
    const el = workspaceRef.current; if (!el) return;
    const start = (e) => { e.preventDefault(); };
    const change = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const ax = e.clientX - rect.left;
      const ay = e.clientY - rect.top;
      const dz = Math.log(e.scale) * ZOOM_GAIN_GESTURE; // ln(scale)
      pending.current.dz += dz;
      pending.current.ax = ax;
      pending.current.ay = ay;
      pending.current.doZoom = true;
      vel.current.vz += dz * 0.25;
      schedule();
    };
    const end = (e) => { e.preventDefault(); };
    el.addEventListener("gesturestart", start,  { passive: false });
    el.addEventListener("gesturechange", change,{ passive: false });
    el.addEventListener("gestureend", end,      { passive: false });
    return () => {
      el.removeEventListener("gesturestart", start);
      el.removeEventListener("gesturechange", change);
      el.removeEventListener("gestureend", end);
    };
  }, [schedule]);

  // Attach wheel with passive:false (React synthetic is passive)
  useEffect(() => {
    const el = workspaceRef.current; if (!el) return;
    el.addEventListener("wheel", wheelHandler, { passive: false });
    return () => el.removeEventListener("wheel", wheelHandler);
  }, [wheelHandler]);

  /* ---------- Space/middle-mouse drag to pan ---------- */
  const spaceDown = useRef(false);
  useEffect(() => {
    const kd = (e) => { if (e.code === "Space") spaceDown.current = true; };
    const ku = (e) => { if (e.code === "Space") spaceDown.current = false; };
    window.addEventListener("keydown", kd, { passive: true });
    window.addEventListener("keyup", ku, { passive: true });
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  const onPointerDown = useCallback((e) => {
    const canPan = e.button === 1 || spaceDown.current;
    if (!canPan) return;
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture?.(e.pointerId);
    anchor.current = { x: e.clientX, y: e.clientY }; // reuse as last pointer
  }, []);

  const onPointerMove = useCallback((e) => {
    const el = e.currentTarget;
    if (!el.hasPointerCapture?.(e.pointerId)) return;
    e.preventDefault();
    const { x, y } = anchor.current;
    const dx = e.clientX - x;
    const dy = e.clientY - y;
    anchor.current = { x: e.clientX, y: e.clientY };
    pending.current.dx += dx;
    pending.current.dy += dy;
    vel.current.vx += dx * 0.10; // small inertia while dragging
    vel.current.vy += dy * 0.10;
    schedule();
  }, [schedule]);

  const onPointerUp = useCallback((e) => {
    const el = e.currentTarget;
    if (!el.hasPointerCapture?.(e.pointerId)) return;
    e.preventDefault();
    el.releasePointerCapture?.(e.pointerId);
    schedule(); // continue inertia
  }, [schedule]);

  /* ---------- Public helpers ---------- */
  const reset = useCallback(() => {
    cancel();
    lastTs.current = 0;
    vel.current = { vx: 0, vy: 0, vz: 0 };
    setView({ x: 0, y: 0, scale: 1 });
  }, [cancel]);

  const zoomTo = useCallback((nextScale) => {
    const el = workspaceRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const target = clamp(nextScale, minScale, maxScale);
    const dz = Math.log(target / view.scale);
    if (!dz) return;
    pending.current.dz += dz;
    pending.current.ax = rect.width / 2;
    pending.current.ay = rect.height / 2;
    pending.current.doZoom = true;
    vel.current.vz += dz * 0.20; // inertia
    schedule();
  }, [view.scale, minScale, maxScale, schedule]);

  // Transform style for your viewport wrapper
  const viewportStyle = useMemo(() => ({
    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
    transformOrigin: "0 0",
    willChange: "transform",
  }), [view.x, view.y, view.scale]);

  // Grid helpers (world-aligned, crisp)
  const grid = useMemo(() => {
    const base = 40; // world units between minor lines
    const majorEvery = 5;
    const minor = base * view.scale;
    const major = base * majorEvery * view.scale;

    // Align grid to world origin using background-position
    const offX = ((view.x * view.scale) % minor + minor) % minor;
    const offY = ((view.y * view.scale) % minor + minor) % minor;

    return {
      minorSize: `${minor}px ${minor}px`,
      majorSize: `${major}px ${major}px`,
      offset: `${offX}px ${offY}px`,
    };
  }, [view.x, view.y, view.scale]);

  return {
    workspaceRef,
    view,
    viewportStyle,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    reset,
    zoomTo,
    setView,
    grid, // expose for crisp grid styling
  };
}

import { useCallback, useEffect, useState } from "react";

export default function useSidebarResize(initial = 280, { min = 200, max = 400 } = {}) {
  const [sidebarWidth, setSidebarWidth] = useState(initial);
  const [isResizing, setIsResizing] = useState(false);

  const onHandleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const onDocMouseMove = useCallback((e) => {
    if (!isResizing) return;
    const w = Math.max(min, Math.min(max, e.clientX));
    setSidebarWidth(w);
  }, [isResizing, min, max]);

  const onDocMouseUp = useCallback(() => setIsResizing(false), []);

  useEffect(() => {
    if (!isResizing) return;
    document.addEventListener("mousemove", onDocMouseMove);
    document.addEventListener("mouseup", onDocMouseUp);
    return () => {
      document.removeEventListener("mousemove", onDocMouseMove);
      document.removeEventListener("mouseup", onDocMouseUp);
    };
  }, [isResizing, onDocMouseMove, onDocMouseUp]);

  return { sidebarWidth, isResizing, onHandleMouseDown };
}

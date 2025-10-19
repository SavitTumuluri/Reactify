import { useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

export const useCanvasAutoSave = (
  userId,
  canvasId,
  canvasData,
  canvasName = null,
  options = {}
) => {
  const {
    autoSaveInterval = 2000, // (unused for now; debounce governs)
    debounceDelay = 500,     // 500ms debounce
    enabled = true,
    onSaveSuccess,
    onSaveError,
    onSaveStart,
  } = options;

  const {
    isConnected,
    saveCanvasData,
    lastSaveStatus,
    lastError,
  } = useWebSocket();

  const saveTimeoutRef = useRef(null);
  const lastSavedDataRef = useRef(null);   // JSON string of last saved canvasData
  const lastSavedNameRef = useRef(null);   // last saved canvasName
  const isSavingRef = useRef(false);

  // Dedup: prevent multiple onSaveSuccess calls for the same logical save
  // This stores an identifier representing the last processed success payload.
  const lastSuccessRef = useRef(null);

  // ---- Perform the actual save (stable, with fresh canvasName) ----
  const performSave = useCallback(() => {
    // Debug: track when a save attempt occurs
    // console.log("[useCanvasAutoSave] performSave()")
    if (isSavingRef.current) return;
    if (!enabled || !isConnected || !userId || !canvasId || !canvasData) return;

    isSavingRef.current = true;
    onSaveStart?.();

    const success = saveCanvasData(userId, canvasId, canvasData, canvasName);

    if (success) {
      // On synchronous success return, optimistically record what we attempted to save
      try {
        lastSavedDataRef.current = JSON.stringify(canvasData);
      } catch {
        // If serialization fails, don't update the ref to avoid false positives
      }
      lastSavedNameRef.current = canvasName || lastSavedNameRef.current;
    } else {
      onSaveError?.(lastError || 'Failed to save canvas data');
    }

    isSavingRef.current = false;
  }, [
    enabled,
    isConnected,
    userId,
    canvasId,
    canvasData,
    canvasName,
    saveCanvasData,
    onSaveStart,
    onSaveError,
    lastError,
  ]);

  // ---- Debounced save for content/data changes ----
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (enabled && isConnected && canvasData && userId && canvasId) {
        let currentDataString = null;
        try {
          currentDataString = JSON.stringify(canvasData);
        } catch {
          // If serialization fails, attempt to save anyway to avoid losing data
          currentDataString = null;
        }
        if (currentDataString === null || currentDataString !== lastSavedDataRef.current) {
          performSave();
        }
      }
    }, debounceDelay);
  }, [
    enabled,
    isConnected,
    canvasData,
    userId,
    canvasId,
    debounceDelay,
    performSave,
  ]);

  // ---- Trigger debounced save whenever the data changes ----
  useEffect(() => {
    if (enabled && canvasData && userId && canvasId) {
      debouncedSave();
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [canvasData, userId, canvasId, enabled, debouncedSave]);

  // ---- Save on name change if data is dirty relative to last saved ----
  useEffect(() => {
    if (!enabled || !isConnected || !userId || !canvasId) return;

    if (canvasName && canvasName !== lastSavedNameRef.current && canvasData) {
      let currentDataString = null;
      try {
        currentDataString = JSON.stringify(canvasData);
      } catch {
        // If serialization fails, treat as dirty
        currentDataString = null;
      }
      if (currentDataString === null || currentDataString !== lastSavedDataRef.current) {
        performSave();
      }
    }
  }, [canvasName, enabled, isConnected, userId, canvasId, canvasData, performSave]);

  // ---- Manual save (e.g., Ctrl+S or button) ----
  const manualSave = useCallback(() => {
    if (enabled && isConnected && canvasData && userId && canvasId) {
      performSave();
    }
  }, [enabled, isConnected, canvasData, userId, canvasId, performSave]);

  // ---- Propagate save status to callers (with dedup of successes) ----
  useEffect(() => {
    if (!lastSaveStatus) return;

    if (lastSaveStatus.type === 'saved') {
      // Create a lightweight, stable identifier for the success payload.
      // If your backend includes a saveId/version/timestamp, prefer that.
      let id;
      try {
        // Avoid large payloads if needed; adjust as appropriate.
        id = JSON.stringify(lastSaveStatus.data);
      } catch {
        // Fallback: if we cannot serialize, always treat as new.
        id = Symbol('unspecified-save');
      }

      if (id !== lastSuccessRef.current) {
        lastSuccessRef.current = id;
        onSaveSuccess?.(lastSaveStatus.data);
      }
    } else if (lastSaveStatus.type === 'error') {
      onSaveError?.(lastSaveStatus.error);
    }
  }, [lastSaveStatus, onSaveSuccess, onSaveError]);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    isSaving: isSavingRef.current, // note: ref won't re-render the caller
    lastSaveStatus,
    lastError,
    manualSave,
  };
};

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

  // ---- Perform the actual save (stable, with fresh canvasName) ----
  const performSave = useCallback(() => {
    if (isSavingRef.current) return;
    if (!enabled || !isConnected || !userId || !canvasId || !canvasData) return;

    isSavingRef.current = true;
    onSaveStart?.();

    const success = saveCanvasData(userId, canvasId, canvasData, canvasName);

    if (success) {
      // On synchronous success return, optimistically record what we attempted to save
      lastSavedDataRef.current = JSON.stringify(canvasData);
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
        const currentDataString = JSON.stringify(canvasData);
        if (currentDataString !== lastSavedDataRef.current) {
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

  // ---- One-time save when the name first becomes available/changes ----
  // Ensures the *first* save persists the display name on the backend
  useEffect(() => {
    if (!enabled || !isConnected || !userId || !canvasId) return;

    // If we just received a name (or it changed) and it differs from what we've recorded,
    // push a save so the backend stores it (using if_not_exists(name, :nm) server-side).
    if (canvasName && canvasName !== lastSavedNameRef.current) {
      performSave();
    }
  }, [canvasName, enabled, isConnected, userId, canvasId, performSave]);

  // ---- Manual save (e.g., Ctrl+S or button) ----
  const manualSave = useCallback(() => {
    if (enabled && isConnected && canvasData && userId && canvasId) {
      performSave();
    }
  }, [enabled, isConnected, canvasData, userId, canvasId, performSave]);

  // ---- Propagate save status to callers ----
  useEffect(() => {
    if (lastSaveStatus) {
      if (lastSaveStatus.type === 'saved') {
        onSaveSuccess?.(lastSaveStatus.data);
      } else if (lastSaveStatus.type === 'error') {
        onSaveError?.(lastSaveStatus.error);
      }
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

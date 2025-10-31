import { useCallback, useRef, useEffect } from 'react';
import { UseMutateFunction } from '@tanstack/react-query';

export interface AutoSaveOptions<T> {
  debounceMs?: number;
  onSave?: (data: T) => void;
  onError?: (error: Error) => void;
  onSaveSuccess?: () => void;
  compareFn?: (prev: T, current: T) => boolean;
}

export function useAutoSave<T>(
  saveMutation: UseMutateFunction<void, Error, T, unknown>,
  options: AutoSaveOptions<T> = {}
) {
  const {
    debounceMs = 1000,
    onSave,
    onError,
    onSaveSuccess,
    compareFn = (prev, current) => JSON.stringify(prev) === JSON.stringify(current),
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<T | null>(null);
  const isMountedRef = useRef(true);

  // Clear timeout and handle cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const triggerAutoSave = useCallback(
    (data: T) => {
      // Check if data has actually changed from last saved
      if (lastSavedDataRef.current && compareFn(lastSavedDataRef.current, data)) {
        return;
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for auto-save
      timeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return;

        try {
          onSave?.(data);
          await saveMutation(data);

          if (isMountedRef.current) {
            lastSavedDataRef.current = data;
            onSaveSuccess?.();
          }
        } catch (error) {
          if (isMountedRef.current) {
            onError?.(error as Error);
          }
        }
      }, debounceMs);
    },
    [saveMutation, debounceMs, onSave, onError, onSaveSuccess, compareFn]
  );

  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetLastSaved = useCallback(() => {
    lastSavedDataRef.current = null;
  }, []);

  return {
    triggerAutoSave,
    cancelAutoSave,
    resetLastSaved,
  };
}
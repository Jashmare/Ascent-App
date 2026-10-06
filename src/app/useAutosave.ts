import { useEffect, useRef } from 'react';

/**
 * Saves a value a moment after it stops changing, and immediately when the component
 * unmounts with a change still pending, so closing a sheet never loses an edit.
 */
export function useAutosave<T>(value: T, save: (value: T) => void, delayMs = 500): void {
  const saveRef = useRef(save);
  const saved = useRef(value);
  const latest = useRef(value);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    latest.current = value;
    if (Object.is(value, saved.current)) return;
    const timer = setTimeout(() => {
      saved.current = value;
      saveRef.current(value);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  useEffect(
    () => () => {
      if (!Object.is(latest.current, saved.current)) {
        saved.current = latest.current;
        saveRef.current(latest.current);
      }
    },
    [],
  );
}

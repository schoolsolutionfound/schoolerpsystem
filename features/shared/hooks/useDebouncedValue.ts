import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it has been stable for `delayMs` milliseconds.
 * Used to debounce text input before hitting a server-side search endpoint.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

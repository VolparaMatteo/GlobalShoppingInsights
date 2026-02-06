import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of the provided value.
 * The returned value only updates after the specified delay has elapsed
 * since the last change to the input value.
 *
 * @param value - The value to debounce.
 * @param delay - Debounce delay in milliseconds (default 300ms).
 *
 * @example
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 400);
 *   // use debouncedSearch in query filters
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

import { useEffect, useState } from 'react';

/**
 * Staggered chart loading.
 * - Default: first almost immediately, then +stepMs per index.
 * - With firstDelayMs: first waits that long, then each next +stepMs.
 */
export function useShortChartLoading(
  index = 0,
  resetKey = 'default',
  stepMs = 100,
  firstDelayMs
) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const delay =
      firstDelayMs != null
        ? firstDelayMs + index * stepMs
        : index <= 0
          ? Math.min(40, stepMs)
          : index * stepMs;
    const timer = window.setTimeout(() => setLoading(false), delay);
    return () => window.clearTimeout(timer);
  }, [index, resetKey, stepMs, firstDelayMs]);

  return loading;
}

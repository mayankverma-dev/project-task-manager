import { useRef, useCallback, useEffect, useState } from "react";

/**
 * useThrottle - throttles a value (leading edge).
 * The returned value updates at most once per `delay` ms.
 *
 * @param {*} value - The value to throttle
 * @param {number} delay - Throttle window in milliseconds
 * @returns {*} Throttled value
 */
export const useThrottle = (value, delay) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(null);

  useEffect(() => {
    const now = Date.now();
    if (lastUpdated.current === null || now - lastUpdated.current >= delay) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const remaining = delay - (now - lastUpdated.current);
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
};

/**
 * useThrottledCallback - returns a stable throttled version of `fn`.
 * The callback fires at most once per `delay` ms (leading edge).
 * Subsequent calls within the window are silently dropped.
 *
 * @param {Function} fn - The function to throttle
 * @param {number} delay - Throttle window in milliseconds
 * @returns {Function} Throttled callback (stable reference via useCallback)
 */
export const useThrottledCallback = (fn, delay) => {
  const lastCalledAt = useRef(null);
  const timeoutRef = useRef(null);
  const fnRef = useRef(fn);

  // Keep fnRef current without resetting the throttle window
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  // Cleanup pending timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    (...args) => {
      const now = Date.now();
      if (lastCalledAt.current === null || now - lastCalledAt.current >= delay) {
        // Leading edge - call immediately
        lastCalledAt.current = now;
        fnRef.current(...args);
      }
      // Calls within the throttle window are intentionally dropped.
    },
    [delay]
  );
};

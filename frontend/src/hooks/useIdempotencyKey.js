import { useRef, useCallback } from 'react';

export function useIdempotencyKey() {
  const keyRef = useRef(null);

  if (!keyRef.current) {
    keyRef.current = crypto.randomUUID();
  }

  const resetKey = useCallback(() => {
    keyRef.current = crypto.randomUUID();
  }, []);

  return { idempotencyKey: keyRef.current, resetKey };
}

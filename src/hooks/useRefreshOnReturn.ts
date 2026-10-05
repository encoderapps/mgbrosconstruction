import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Calls `refresh` each time the user comes back to this screen (not on its
 * first focus, which already loads), so changes made on screens above it, e.g.
 * signing a PO, show up. `refresh` must be stable.
 */
export function useRefreshOnReturn(refresh: () => void): void {
  const isFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      refresh();
    }, [refresh]),
  );
}

import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/**
 * The on-screen keyboard's current height (0 when hidden). With edge-to-edge
 * on Android the window doesn't resize for the keyboard, so fixed (non-
 * scrolling) layouts use this to lift their content above it.
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => setKeyboardHeight(event.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return keyboardHeight;
}

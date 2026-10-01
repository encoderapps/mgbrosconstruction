import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  ViewStyle,
} from 'react-native';

type KeyboardAwareScrollViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  /**
   * Pad the content by however much the keyboard overlaps this scroll view, so
   * the last inputs can scroll above it. Turn off when the screen already
   * lifts its whole layout above the keyboard.
   */
  padForKeyboard?: boolean;
};

// Space kept between the focused input and the top of the keyboard.
const KEYBOARD_GAP = 24;
// Lets layout changes (extra padding, a lifted screen) render before scrolling.
const LAYOUT_SETTLE_MS = 50;

const ScrollFocusedInputContext = createContext<(() => void) | null>(null);

/**
 * Inputs call this on focus so that moving between fields while the keyboard
 * is already open still scrolls the newly focused field into view.
 */
export function useScrollFocusedInputIntoView(): (() => void) | null {
  return useContext(ScrollFocusedInputContext);
}

/**
 * A ScrollView that keeps the focused text input visible above the keyboard.
 * (With edge-to-edge on Android the window no longer resizes for the
 * keyboard, so this is handled here rather than by adjustResize.)
 */
export function KeyboardAwareScrollView({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  padForKeyboard = true,
}: KeyboardAwareScrollViewProps): React.JSX.Element {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollOffset = useRef(0);
  const keyboardTop = useRef<number | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const scrollFocusedInputIntoView = useCallback((): void => {
    const input = TextInput.State.currentlyFocusedInput();
    const scrollView = scrollRef.current;
    const nativeScrollView = scrollView?.getNativeScrollRef();
    const kbTop = keyboardTop.current;
    if (!input || !scrollView || !nativeScrollView || kbTop === null) {
      return;
    }

    nativeScrollView.measureInWindow((_sx, scrollY, _sw, scrollHeight) => {
      input.measureInWindow((_ix, inputY, _iw, inputHeight) => {
        const visibleTop = scrollY + KEYBOARD_GAP;
        const visibleBottom = Math.min(scrollY + scrollHeight, kbTop) - KEYBOARD_GAP;
        let delta = 0;
        if (inputY + inputHeight > visibleBottom) {
          delta = inputY + inputHeight - visibleBottom;
        } else if (inputY < visibleTop) {
          delta = inputY - visibleTop;
        }
        if (delta !== 0) {
          scrollView.scrollTo({ y: Math.max(0, scrollOffset.current + delta), animated: true });
        }
      });
    });
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardTop.current = event.endCoordinates.screenY;

      // Pad the scroll content by however much the keyboard actually overlaps
      // the scroll view (0 if the window resized or the screen lifted itself).
      if (padForKeyboard && Platform.OS === 'android') {
        scrollRef.current?.getNativeScrollRef()?.measureInWindow((_x, y, _w, height) => {
          setKeyboardInset(Math.max(0, y + height - event.endCoordinates.screenY));
          setTimeout(scrollFocusedInputIntoView, LAYOUT_SETTLE_MS);
        });
      } else {
        setTimeout(scrollFocusedInputIntoView, LAYOUT_SETTLE_MS);
      }
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
      setKeyboardInset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [padForKeyboard, scrollFocusedInputIntoView]);

  // Added on top of the content's own bottom padding.
  const basePaddingBottom = Number(StyleSheet.flatten(contentContainerStyle)?.paddingBottom ?? 0) || 0;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
  };

  return (
    <ScrollFocusedInputContext.Provider value={scrollFocusedInputIntoView}>
      <ScrollView
        ref={scrollRef}
        style={style}
        contentContainerStyle={[contentContainerStyle, keyboardInset > 0 && { paddingBottom: basePaddingBottom + keyboardInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
    </ScrollFocusedInputContext.Provider>
  );
}

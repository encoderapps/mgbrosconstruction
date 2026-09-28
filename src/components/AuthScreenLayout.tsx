import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { welcomeColors } from '../theme';

type AuthScreenLayoutProps = {
  children: React.ReactNode;
  /** Keeps the focused text input visible above the keyboard, for screens with text inputs. */
  withKeyboardAvoiding?: boolean;
};

// Space kept between the focused input and the top of the keyboard.
const KEYBOARD_GAP = 24;
// Lets the extra bottom padding render before scrolling into it.
const LAYOUT_SETTLE_MS = 50;

const ScrollFocusedInputContext = createContext<(() => void) | null>(null);

/**
 * Inputs call this on focus so that moving between fields while the keyboard
 * is already open still scrolls the newly focused field into view.
 */
export function useScrollFocusedInputIntoView(): (() => void) | null {
  return useContext(ScrollFocusedInputContext);
}

export function AuthScreenLayout({
  children,
  withKeyboardAvoiding = false,
}: AuthScreenLayoutProps): React.JSX.Element {
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
    if (!withKeyboardAvoiding) {
      return;
    }

    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardTop.current = event.endCoordinates.screenY;

      // With edge-to-edge on Android the window no longer resizes for the
      // keyboard, so pad the scroll content by however much the keyboard
      // actually overlaps the scroll view (0 if the window did resize).
      if (Platform.OS === 'android') {
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
  }, [withKeyboardAvoiding, scrollFocusedInputIntoView]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
  };

  const scrollView = (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[styles.container, keyboardInset > 0 && { paddingBottom: 20 + keyboardInset }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {withKeyboardAvoiding ? (
        <ScrollFocusedInputContext.Provider value={scrollFocusedInputIntoView}>
          {Platform.OS === 'ios' ? (
            <KeyboardAvoidingView style={styles.flex} behavior="padding">
              {scrollView}
            </KeyboardAvoidingView>
          ) : (
            scrollView
          )}
        </ScrollFocusedInputContext.Provider>
      ) : (
        scrollView
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: welcomeColors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    gap: 24,
  },
});

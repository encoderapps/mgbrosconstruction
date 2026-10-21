import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

const APP_BACKGROUND = require('../assets/images/app-background.png');

/**
 * The app's background image behind a screen. Used as the stack's
 * `screenLayout`, so each screen carries its own copy and slide transitions
 * stay opaque; screens keep their own containers transparent to show it.
 */
export function ScreenBackground({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <ImageBackground source={APP_BACKGROUND} resizeMode="cover" style={styles.background}>
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});

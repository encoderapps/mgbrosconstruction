import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { welcomeColors } from '../theme';
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';

export { useScrollFocusedInputIntoView } from './KeyboardAwareScrollView';

type AuthScreenLayoutProps = {
  children: React.ReactNode;
  /** Keeps the focused text input visible above the keyboard, for screens with text inputs. */
  withKeyboardAvoiding?: boolean;
};

export function AuthScreenLayout({
  children,
  withKeyboardAvoiding = false,
}: AuthScreenLayoutProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {withKeyboardAvoiding ? (
        Platform.OS === 'ios' ? (
          <KeyboardAvoidingView style={styles.flex} behavior="padding">
            <KeyboardAwareScrollView contentContainerStyle={styles.container}>{children}</KeyboardAwareScrollView>
          </KeyboardAvoidingView>
        ) : (
          <KeyboardAwareScrollView contentContainerStyle={styles.container}>{children}</KeyboardAwareScrollView>
        )
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
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

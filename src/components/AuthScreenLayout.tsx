import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { welcomeColors } from '../theme';

type AuthScreenLayoutProps = {
  children: React.ReactNode;
  /** Wraps content in a KeyboardAvoidingView for screens with text inputs. */
  withKeyboardAvoiding?: boolean;
};

export function AuthScreenLayout({
  children,
  withKeyboardAvoiding = false,
}: AuthScreenLayoutProps): React.JSX.Element {
  const scrollView = (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {withKeyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {scrollView}
        </KeyboardAvoidingView>
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

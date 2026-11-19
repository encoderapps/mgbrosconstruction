import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EyeIcon, LockIcon } from '../assets/icons';
import { fontFamily, portalColors, radius, welcomeColors } from '../theme';
import { LoginInput } from './LoginInput';

type DeleteAccountModalProps = {
  visible: boolean;
  /** The registered email whose password is asked for. */
  email: string;
  /** Deletes the account; rejects with an Error whose message is shown (e.g. a wrong password). */
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
};

/** Asks for the account's password before deleting it, showing the API's error (e.g. a wrong password) inline. */
export function DeleteAccountModal({ visible, email, onConfirm, onClose }: DeleteAccountModalProps): React.JSX.Element {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const reset = (): void => {
    setPassword('');
    setShowPassword(false);
    setError(null);
  };

  const close = (): void => {
    if (isDeleting) {
      return;
    }
    reset();
    onClose();
  };

  const confirm = async (): Promise<void> => {
    if (isDeleting) {
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError(null);
    setIsDeleting(true);
    try {
      await onConfirm(password);
      reset();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete your account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Delete Account</Text>
          <Text style={styles.message}>
            This permanently deletes your account. Enter the password for <Text style={styles.email}>{email}</Text> to
            confirm.
          </Text>

          <LoginInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!isDeleting}
            leftIcon={<LockIcon width={22} height={14} color={welcomeColors.inputPlaceholder} />}
            rightIcon={<EyeIcon width={20} height={14} color={welcomeColors.inputPlaceholder} visible={showPassword} />}
            onRightIconPress={() => setShowPassword((prev) => !prev)}
          />
          {!!error && (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          )}

          <View style={styles.buttons}>
            <Pressable
              onPress={close}
              disabled={isDeleting}
              style={({ pressed }) => [styles.button, styles.cancelButton, (pressed || isDeleting) && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={isDeleting}
              style={({ pressed }) => [styles.button, styles.deleteButton, (pressed || isDeleting) && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
            >
              {isDeleting ? (
                <ActivityIndicator color={welcomeColors.cardBackground} />
              ) : (
                <Text style={styles.deleteText}>Delete</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialog: {
    backgroundColor: welcomeColors.cardBackground,
    borderRadius: radius.md,
    padding: 20,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontWeight: '700',
    fontSize: 17,
    color: welcomeColors.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 19,
    color: welcomeColors.textSecondary,
    marginBottom: 16,
  },
  email: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: welcomeColors.textPrimary,
  },
  error: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    color: portalColors.danger,
    marginTop: -6,
    marginBottom: 10,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: welcomeColors.loginButton,
    backgroundColor: welcomeColors.cardBackground,
  },
  cancelText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: welcomeColors.loginButton,
  },
  deleteButton: {
    backgroundColor: portalColors.danger,
  },
  deleteText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    fontSize: 15,
    color: welcomeColors.cardBackground,
  },
  pressed: {
    opacity: 0.85,
  },
});

export const PASSWORD_REQUIREMENTS = [
  'At least 12 characters long',
  'Includes uppercase and lowercase letters',
  'Includes at least one number',
  'Includes at least one special character (e.g., !, @, #)',
];

export function meetsPasswordRequirements(password: string): boolean {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

type PasswordValidationError = { title: string; message: string };

/**
 * Shared by the registration Create Password and forgot-password Change
 * Password screens. Returns the first problem found, or null when valid.
 */
export function validateNewPassword(
  password: string,
  confirmPassword: string,
): PasswordValidationError | null {
  if (!password) {
    return { title: 'Missing password', message: 'Please enter a password.' };
  }
  if (!meetsPasswordRequirements(password)) {
    return {
      title: 'Password does not meet requirements',
      message: 'Please make sure your password meets all the listed requirements.',
    };
  }
  if (!confirmPassword) {
    return { title: 'Missing confirmation', message: 'Please re-enter your password.' };
  }
  if (password !== confirmPassword) {
    return { title: 'Passwords do not match', message: 'Please make sure both passwords match.' };
  }
  return null;
}

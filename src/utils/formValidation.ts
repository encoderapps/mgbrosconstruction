export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export interface RequiredFieldCheck {
  value: string;
  title: string;
  message: string;
}

export function findMissingRequiredField(
  fields: RequiredFieldCheck[],
): RequiredFieldCheck | undefined {
  return fields.find((field) => !field.value.trim());
}

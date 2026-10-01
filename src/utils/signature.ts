/**
 * Initials from a full name: the first letter of the first name and of the
 * last name, e.g. "Deepak Rathore" → "DR", "Michael J. Anderson" → "MA".
 * A single name gives a single initial ("Deepak" → "D").
 */
export function getInitials(fullName: string): string {
  const names = fullName.trim().split(/\s+/).filter(Boolean);
  if (names.length === 0) {
    return '';
  }
  const firstLetter = (name: string): string => Array.from(name)[0] ?? '';
  const first = firstLetter(names[0]);
  const last = names.length > 1 ? firstLetter(names[names.length - 1]) : '';
  return `${first}${last}`.toUpperCase();
}

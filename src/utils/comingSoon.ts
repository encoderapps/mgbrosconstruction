import { Alert } from 'react-native';

/** Placeholder for an action whose API isn't available yet. */
export function showComingSoon(feature: string): void {
  Alert.alert(feature, `${feature} is coming soon.`);
}

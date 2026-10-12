import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * While `isBusy` (e.g. saving), stops the user leaving the screen with the
 * Android back button or the iOS swipe-back gesture, so the request's result
 * always lands on the screen that made it. On-screen back buttons must be
 * disabled separately.
 */
export function useBlockBackWhile(isBusy: boolean): void {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isBusy });
    if (!isBusy) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [isBusy, navigation]);
}

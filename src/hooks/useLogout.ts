import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSubcontractorSession } from '../context/SubcontractorSessionContext';
import { AuthStackParamList } from '../navigation/types';

interface Logout {
  /** Ends the session and shows the login screen, with nothing to go back to but Welcome. */
  logout: () => void;
  /** Asks first ("Log out?" / Cancel), then logs out. */
  confirmLogout: (message?: string) => void;
}

/** Logging out of the subcontractor portal, from Profile or by going back from Home. */
export function useLogout(): Logout {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { setCompany } = useSubcontractorSession();

  const logout = useCallback((): void => {
    // Clearing the session also clears the account's contacts (ContactsContext follows it).
    setCompany(null);
    navigation.reset({ index: 1, routes: [{ name: 'Welcome' }, { name: 'SubcontractorLogin' }] });
  }, [navigation, setCompany]);

  const confirmLogout = useCallback(
    (message = 'Are you sure you want to log out?'): void => {
      Alert.alert('Log out', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: logout },
      ]);
    },
    [logout],
  );

  return { logout, confirmLogout };
}

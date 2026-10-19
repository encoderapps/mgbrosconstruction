import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ContactsProvider } from './src/context/ContactsContext';
import { SubcontractorSessionProvider } from './src/context/SubcontractorSessionContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { fetchSalesforceAccessToken } from './src/services/salesforceAuthService';

function App(): React.JSX.Element {
  useEffect(() => {
    fetchSalesforceAccessToken().catch((error) => {
      console.warn('Unable to fetch Salesforce access token', error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      {/* The app is light-themed even in system dark mode, so keep the status bar icons dark. */}
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <SubcontractorSessionProvider>
          <ContactsProvider>
            <RootNavigator />
          </ContactsProvider>
        </SubcontractorSessionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;

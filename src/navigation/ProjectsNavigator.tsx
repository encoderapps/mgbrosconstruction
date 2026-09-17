import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProjectsStackParamList } from './types';
import { ProjectsListScreen } from '../screens/Projects/ProjectsListScreen';
import { ProjectDetailsScreen } from '../screens/Projects/ProjectDetailsScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<ProjectsStackParamList>();

export function ProjectsNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
      }}
    >
      <Stack.Screen name="ProjectsList" component={ProjectsListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} options={{ title: 'Project Details' }} />
    </Stack.Navigator>
  );
}

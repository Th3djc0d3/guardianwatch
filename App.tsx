// App.tsx
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, Users, Settings as SettingsIcon } from 'lucide-react-native';

import MapScreen from './app/screens/MapScreen';
import GroupScreen from './app/screens/GroupScreen';
import SettingsScreen from './app/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DefaultTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: { height: 72, paddingBottom: 10 },
            tabBarIcon: ({ focused, size }) => {
              const color = focused ? '#2563eb' : '#94a3b8';
              if (route.name === 'Navigation') return <Home color={color} size={size} />;
              if (route.name === 'Group')      return <Users color={color} size={size} />;
              if (route.name === 'Settings')   return <SettingsIcon color={color} size={size} />;
              return null;
            },
          })}
        >
          <Tab.Screen name="Navigation" component={MapScreen} />
          <Tab.Screen name="Group"      component={GroupScreen} />
          <Tab.Screen name="Settings"   component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

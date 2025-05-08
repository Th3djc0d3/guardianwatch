import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Users, Settings as SettingsIcon } from 'lucide-react-native';

import MapScreen from './app/screens/MapScreen';
import GroupScreen from './app/screens/GroupScreen';
import SettingsScreen from './app/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer
      theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#fff' } }}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: { height: 72, paddingBottom: 10 },
          tabBarIcon: ({ focused, size }) => {
            const color = focused ? '#2563eb' : '#94a3b8';
            switch (route.name) {
              case 'Navigation':
                return <Home size={size} color={color} />;
              case 'Group':
                return <Users size={size} color={color} />;
              case 'Settings':
                return <SettingsIcon size={size} color={color} />;
              default:
                return null;
            }
          },
        })}
      >
        <Tab.Screen name="Navigation" component={MapScreen} />
        <Tab.Screen name="Group" component={GroupScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

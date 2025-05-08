import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingsScreen = () => (
  <SafeAreaView className="flex-1 bg-white p-4 gap-y-4">
    <Text className="text-xl font-semibold">Settings</Text>
    <Text className="text-base">• Manage API Keys</Text>
    <Text className="text-base">• Notification Preferences</Text>
    <Text className="text-base">• Join / Create Group</Text>
  </SafeAreaView>
);

export default SettingsScreen;

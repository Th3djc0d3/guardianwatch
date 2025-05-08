import React from 'react';
import { View, Text } from 'react-native';

const SettingsScreen = () => (
  <View className="flex-1 bg-white p-4 gap-y-4">
    <Text className="text-xl font-semibold">Settings</Text>
    <Text className="text-base">• Manage API Keys</Text>
    <Text className="text-base">• Notification Preferences</Text>
    <Text className="text-base">• Join / Create Group</Text>
  </View>
);

export default SettingsScreen;

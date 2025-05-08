import React from 'react';
import { View, Text } from 'react-native';

const GroupScreen = () => {
  const riders = [
    { id: '1', name: 'Rider A', status: 'On route' },
    { id: '2', name: 'Rider B', status: 'Parked' },
  ];

  return (
    <View className="flex-1 bg-white p-4 gap-y-2">
      <Text className="text-xl font-semibold mb-2">Group Members</Text>
      {riders.map(r => (
        <View key={r.id} className="p-4 rounded-2xl bg-slate-100 shadow">
          <Text className="text-base font-medium">{r.name}</Text>
          <Text className="text-sm text-gray-500">{r.status}</Text>
        </View>
      ))}
    </View>
  );
};

export default GroupScreen;

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const GroupScreen = () => {
  const riders = [
    { id: '1', name: 'Rider A', status: 'On route' },
    { id: '2', name: 'Rider B', status: 'Parked' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Group Members</Text>
      {riders.map(r => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.name}>{r.name}</Text>
          <Text style={styles.status}>{r.status}</Text>
        </View>
      ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  heading: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: { fontSize: 16, fontWeight: '500' },
  status: { fontSize: 13, color: '#64748b' },
});

export default GroupScreen;

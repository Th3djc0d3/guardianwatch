// app/screens/GroupScreen.tsx
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const riders = [
  { id: '1', name: 'Alice', status: 'On route' },
  { id: '2', name: 'Bob',   status: 'Parked'  },
];

export default function GroupScreen() {
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  heading:   { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  card:      { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, marginBottom: 10 },
  name:      { fontSize: 16, fontWeight: '500' },
  status:    { fontSize: 14, color: '#475569', marginTop: 4 },
});

import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Settings</Text>
      <Text style={styles.item}>• Manage API Keys</Text>
      <Text style={styles.item}>• Notification Preferences</Text>
      <Text style={styles.item}>• Join / Create Group</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  heading: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  item: { fontSize: 16, marginBottom: 6 },
});

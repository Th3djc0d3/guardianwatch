// app/screens/MapScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';
import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GOOGLE_KEY = 'AIzaSyC4gwLyToZsfJJM1Go4EychdKZwbcN-9ec';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);

  // ── Ask permission and fetch one-time position ─────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  // ── Loading / error view ───────────────────────────────────────────────
  if (!location) {
    return (
      <SafeAreaView style={styles.center}>
        {errorMsg ? (
          <Text style={styles.error}>{errorMsg}</Text>
        ) : (
          <ActivityIndicator size="large" />
        )}
      </SafeAreaView>
    );
  }

  // ── Main map & overlays ────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <GooglePlacesAutocomplete
        placeholder="Where to?"
        fetchDetails
        predefinedPlaces={[]}
        currentLocation={false}
        query={{ key: GOOGLE_KEY, language: 'en' }}
        onPress={(_, details) => {
          const { lat, lng } = details!.geometry.location;
          setDestination({ latitude: lat, longitude: lng });
        }}
        onFail={e => console.warn('Places error', e)}
        styles={{
          container: { position: 'absolute', top: 10, width: '100%', zIndex: 1 },
          textInput: { height: 44, borderRadius: 8, paddingHorizontal: 10 },
          listView: { backgroundColor: '#fff' },
        }}
      />

      <MapView
        {...(Platform.OS === 'android' ? { provider: PROVIDER_GOOGLE } : {})}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        followsUserLocation
        region={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* 7.5-mile radius */}
        <Circle
          center={location.coords}
          radius={12070}
          strokeWidth={1}
          strokeColor="#1e3a8a55"
        />

        {/* Route polyline */}
        {destination && (
          <MapViewDirections
            origin={location.coords}
            destination={destination}
            apikey={GOOGLE_KEY}
            strokeWidth={4}
            strokeColor="#2563eb"
            onReady={({ distance, duration }) =>
              console.log(
                `Route: ${distance.toFixed(1)} km, ${duration.toFixed(0)} min`
              )
            }
          />
        )}

        {/* Example group-member marker (replace with real data) */}
        {/* <Marker
          coordinate={{ latitude: 47.62, longitude: -122.35 }}
          title="Rider A"
          description="Group member"
        /> */}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  error: { color: 'red', fontSize: 16 },
});

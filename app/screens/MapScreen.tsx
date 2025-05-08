// app/screens/MapScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
} from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import 'react-native-get-random-values';              // crypto polyfill for uuid v9

const GOOGLE_KEY = 'AIzaSyC4gwLyToZsfJJM1Go4EychdKZwbcN-9ec';

export default function MapScreen() {
  const insets = useSafeAreaInsets();                // safe-area for notch
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(
    null
  );

  /* ── ask permission & grab location once ──────────────────────────── */
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

  /* ── loading / error fallback ─────────────────────────────────────── */
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

  /* ── main map & overlays ──────────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.container}>
      {/* ── SEARCH BAR ──────────────────────────────────────────────── */}
      <GooglePlacesAutocomplete
        placeholder="Where to?"
        fetchDetails
        query={{ key: GOOGLE_KEY, language: 'en' }}
        predefinedPlaces={[]}          // avoid undefined.filter crash
        currentLocation={false}
        textInputProps={{ onFocus: () => {} }}  // avoid undefined.onFocus crash
        onPress={(_, details) => {
          const { lat, lng } = details!.geometry.location;
          setDestination({ lat, lng });
        }}
        onFail={err => console.warn('Places error →', err)}   // prints API errors
        styles={{
          container: {
            position: 'absolute',
            top: insets.top + 10,       // below notch / Dynamic Island
            left: 0,
            right: 0,
            zIndex: 1,
            pointerEvents: 'box-none',  // let map receive touches
          },
          textInput: {
            height: 44,
            marginHorizontal: 16,
            borderRadius: 8,
            paddingHorizontal: 10,
            backgroundColor: '#fff',
            elevation: 3,
          },
          listView: {
            marginHorizontal: 16,
            elevation: 4,
            pointerEvents: 'auto',
          },
        }}
      />

      {/* ── MAP ─────────────────────────────────────────────────────── */}
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
        {/* user radius 7.5 mi */}
        <Circle
          center={location.coords}
          radius={12070}
          strokeWidth={1}
          strokeColor="#1e3a8a55"
        />

        {/* route polyline */}
        {destination && (
          <MapViewDirections
            origin={location.coords}
            destination={destination}
            apikey={GOOGLE_KEY}
            strokeWidth={4}
            strokeColor="#2563eb"
            onReady={({ distance, duration }) =>
              console.log(
                `Route: ${distance.toFixed(1)} km • ${duration.toFixed(0)} min`
              )
            }
          />
        )}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  error: { color: 'red', fontSize: 16 },
});

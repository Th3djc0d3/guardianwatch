// app/screens/MapScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, {
  Circle,
  PROVIDER_GOOGLE,
  LatLng,
} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import 'react-native-get-random-values';

const GOOGLE_KEY = 'AIzaSyC4gwLyToZsfJJM1Go4EychdKZwbcN-9ec';

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const placesRef = useRef<GooglePlacesAutocomplete>(null);
  const insets = useSafeAreaInsets();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [destination, setDestination] = useState<
    | null
    | {
        latlng: LatLng;
        description: string;
      }
  >(null);

  /* ───────────────────────── current position ───────────────────────── */
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

  /* ────────────────── fallback: Geocode or Text Search ───────────────── */
  async function manualLookup(query: string) {
    if (!query) return;
    try {
      const geoURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${GOOGLE_KEY}`;
      const geo = await (await fetch(geoURL)).json();
      if (geo.results?.[0]) {
        const { lat, lng } = geo.results[0].geometry.location;
        setDestination({ latlng: { latitude: lat, longitude: lng }, description: query });
        return;
      }
      const textURL = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query
      )}&key=${GOOGLE_KEY}`;
      const txt = await (await fetch(textURL)).json();
      if (txt.results?.[0]) {
        const { lat, lng } = txt.results[0].geometry.location;
        setDestination({ latlng: { latitude: lat, longitude: lng }, description: txt.results[0].name });
      } else {
        showToast('Nothing found for that search.');
      }
    } catch {
      showToast('Search failed – check your network or API key.');
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  /* ───────────────────────── loading / error ───────────────────────── */
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

  /* ─────────────────────────── main screen ─────────────────────────── */
  return (
    <SafeAreaView style={styles.container}>
      {/* ▸▸ SEARCH BAR */}
      <GooglePlacesAutocomplete
        ref={placesRef}
        placeholder="Where to?"
        minLength={2}
        fetchDetails
        enablePoweredByContainer={false}
        query={{ key: GOOGLE_KEY, language: 'en' }}
        predefinedPlaces={[]}
        currentLocation={false}
        textInputProps={{
          returnKeyType: 'search',
          onSubmitEditing: e => manualLookup(e.nativeEvent.text),
        }}
        onPress={(data, details) => {
          const { lat, lng } = details!.geometry.location;
          setDestination({
            latlng: { latitude: lat, longitude: lng },
            description: data.description,
          });
          Keyboard.dismiss();
        }}
        onFail={err => console.warn('Places error →', err)}
        styles={{
          container: {
            position: 'absolute',
            top: insets.top + 10,
            left: 0,
            right: 0,
            zIndex: 3,
            pointerEvents: 'box-none',
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
            backgroundColor: '#fff',
            elevation: 5,
            borderRadius: 8,
            zIndex: 3,
            pointerEvents: 'auto',
          },
        }}
      />

      {/* ▸▸ MAP */}
      <MapView
        ref={mapRef}
        {...(Platform.OS === 'android' ? { provider: PROVIDER_GOOGLE } : {})}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        followsUserLocation
        initialRegion={{
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
            destination={destination.latlng}
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

      {/* ▸▸ START NAVIGATION BUTTON */}
      {destination && (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => {
            // Zoom map to fit both points
            mapRef.current?.fitToCoordinates(
              [
                destination.latlng,
                {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                },
              ],
              { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true }
            );
            console.log('Navigation started to', destination.description);
          }}
        >
          <Text style={styles.buttonText}>Start Navigation</Text>
        </Pressable>
      )}

      {/* ▸▸ TOAST */}
      {toast && (
        <View style={[styles.toast, { top: insets.top + 60 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
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
  button: {
    position: 'absolute',
    bottom: 40,
    left: '18%',
    right: '18%',
    backgroundColor: '#2563eb',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    elevation: 4,
  },
  toastText: { color: '#fff' },
});

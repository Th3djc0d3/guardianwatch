// app/screens/MapScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<{
    latlng: LatLng;
    description: string;
  } | null>(null);

  const [navigating, setNavigating] = useState(false);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /* ───────────────────── location permission + watch ────────────────── */
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    async function ensurePermission() {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }
      if (status !== 'granted') {
        Alert.alert(
          'Location needed',
          'Guardian Watch needs your location to suggest nearby places.',
          [{ text: 'Try Again', onPress: ensurePermission }]
        );
        return;
      }

      const initial = await Location.getCurrentPositionAsync({});
      setOrigin({
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
      });

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        pos => {
          setOrigin({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        }
      );
    }

    ensurePermission();
    return () => sub?.remove();
  }, []);

  /* ────────────────── fallback manual lookup (Return key) ───────────── */
  async function handleManualLookup(query: string) {
    if (!query) return;
    Keyboard.dismiss();

    const endpoints = [
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${GOOGLE_KEY}`,
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query
      )}&key=${GOOGLE_KEY}`,
    ];

    for (const url of endpoints) {
      try {
        const json = await (await fetch(url)).json();
        const loc = json.results?.[0]?.geometry?.location;
        if (loc) {
          setDestination({
            latlng: { latitude: loc.lat, longitude: loc.lng },
            description: query,
          });
          setNavigating(true);
          return;
        }
      } catch {}
    }
    showToast('Place not found.');
  }

  /* ───────────────────────── toast helper ───────────────────────────── */
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  /* ───────────────────────── loading spinner ───────────────────────── */
  if (!origin) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  /* ───────────────────────── main screen ──────────────────────────── */
  return (
    <SafeAreaView style={styles.container}>
      {/* ▸▸ SEARCH BAR */}
      <GooglePlacesAutocomplete
        ref={placesRef}
        placeholder="Where to?"
        minLength={2}
        fetchDetails
        enablePoweredByContainer={false}
        query={{
          key: GOOGLE_KEY,
          language: 'en',
          location: `${origin.latitude},${origin.longitude}`,
          radius: 50000, // 50 km bias toward user
        }}
        predefinedPlaces={[]}
        currentLocation={true}
        currentLocationLabel="Use Current Location"
        textInputProps={{
          returnKeyType: 'search',
          editable: !navigating,
          onSubmitEditing: e => handleManualLookup(e.nativeEvent.text),
        }}
        onPress={(data, details) => {
          if (data.description === 'Use Current Location') {
            setDestination({
              latlng: origin,
              description: 'Current location',
            });
          } else {
            const { lat, lng } = details!.geometry.location;
            setDestination({
              latlng: { latitude: lat, longitude: lng },
              description: data.description,
            });
            placesRef.current?.setAddressText(data.description);
          }
          Keyboard.dismiss();
          setNavigating(true);
        }}
        onFail={err => console.warn('Places error →', err)}
        styles={{
          container: {
            position: 'absolute',
            top: insets.top + 10,
            left: 0,
            right: 0,
            zIndex: 3,
            pointerEvents: navigating ? 'none' : 'box-none',
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
        {...(Platform.OS === 'android'
          ? { provider: PROVIDER_GOOGLE }
          : {})}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        followsUserLocation
        region={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Circle
          center={origin}
          radius={12070}
          strokeWidth={1}
          strokeColor="#1e3a8a55"
        />

        {destination && (
          <MapViewDirections
            origin={origin}
            destination={destination.latlng}
            apikey={GOOGLE_KEY}
            strokeWidth={4}
            strokeColor="#2563eb"
            onReady={({ distance, duration, coordinates }) => {
              setDistanceKm(distance);
              setEtaMin(duration);
              mapRef.current?.fitToCoordinates(coordinates, {
                edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                animated: true,
              });
            }}
          />
        )}
      </MapView>

      {/* ▸▸ NAV CONTROLS */}
      {!navigating && destination && (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => setNavigating(true)}
        >
          <Text style={styles.buttonText}>Start Navigation</Text>
        </Pressable>
      )}

      {navigating && destination && (
        <>
          <Pressable
            style={({ pressed }) => [
              styles.buttonEnd,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => {
              setNavigating(false);
              setDestination(null);
              setEtaMin(null);
              setDistanceKm(null);
              placesRef.current?.setAddressText('');
            }}
          >
            <Text style={styles.buttonText}>End Navigation</Text>
          </Pressable>

          <View style={[styles.etaCard, { top: insets.top + 60 }]}>
            <Text style={styles.etaText}>
              {distanceKm?.toFixed(1)} km • {Math.round(etaMin ?? 0)} min
            </Text>
            <Text style={styles.etaSub}>{destination.description}</Text>
          </View>
        </>
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
  buttonEnd: {
    position: 'absolute',
    bottom: 40,
    left: '18%',
    right: '18%',
    backgroundColor: '#dc2626',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  etaCard: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
  },
  etaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  etaSub: { color: '#dbeafe', fontSize: 12, marginTop: 2 },

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

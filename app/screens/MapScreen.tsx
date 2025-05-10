// app/screens/MapScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import MapView, {
  Marker,
  Circle,
  Polyline,
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
import { Ionicons } from '@expo/vector-icons';
import 'react-native-get-random-values';

// your ENV key
const GOOGLE_KEY = process.env.EXPO_PUBLIC_PLACES_KEY!;
if (!GOOGLE_KEY) throw new Error('Missing EXPO_PUBLIC_PLACES_KEY');

// dummy data
const GROUP = [
  { id: '1', name: 'Alice', latlng: { latitude: 47.61, longitude: -122.335 }, status: 'On route' },
  { id: '2', name: 'Bob',   latlng: { latitude: 47.615, longitude: -122.340 }, status: 'Parked' },
];
const POLICE_PLANES: LatLng[] = [
  { latitude: 47.650, longitude: -122.300 },
  { latitude: 47.580, longitude: -122.360 },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const placesRef = useRef<GooglePlacesAutocomplete>(null);

  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [destDesc, setDestDesc] = useState<string>('');
  const [navigating, setNavigating] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [followUser, setFollowUser] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  // live gps
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setOrigin(loc);
      mapRef.current?.animateToRegion({ ...loc, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 1000);

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        p => {
          const newLoc = { latitude: p.coords.latitude, longitude: p.coords.longitude };
          setOrigin(newLoc);
          if (followUser) {
            mapRef.current?.animateToRegion({ ...newLoc, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500);
          }
        }
      );
    })();
    return () => sub?.remove();
  }, [followUser]);

  if (!origin) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // fetch directions + steps
  const startRoute = async (dest: LatLng, description: string) => {
    setDestination(dest);
    setDestDesc(description);
    setNavigating(true);
    Keyboard.dismiss();
    try {
      const url =
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}` +
        `&destination=${dest.latitude},${dest.longitude}&key=${GOOGLE_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      const leg = json.routes?.[0]?.legs?.[0];
      const raw = leg?.steps ?? [];
      const parsed = raw.map((s: any) => s.html_instructions.replace(/<[^>]+>/g, ''));
      setSteps(parsed);
      setDistanceKm(leg.distance.value / 1000);
      setEtaMin(leg.duration.value / 60);
      mapRef.current?.fitToCoordinates([origin, dest], {
        edgePadding: { top: 80, right: 80, bottom: 160, left: 80 },
        animated: true,
      });
    } catch {
      showToast('Unable to load directions.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search */}
      <GooglePlacesAutocomplete
        ref={placesRef}
        placeholder="Where to?"
        fetchDetails
        debounce={200}
        listViewDisplayed={showList}
        onFail={() => showToast('Autocomplete error')}
        query={{
          key: GOOGLE_KEY,
          language: 'en',
          location: `${origin.latitude},${origin.longitude}`,
          radius: 50000,
        }}
        GooglePlacesDetailsQuery={{ fields: 'geometry' }}
        onPress={(data, details) => {
          const loc = details?.geometry?.location;
          if (loc) startRoute({ latitude: loc.lat, longitude: loc.lng }, data.description);
          else showToast('Coordinates unavailable');
        }}
        styles={{
          container: {
            position: 'absolute',
            top: insets.top,
            left: 0,
            right: 0,
            zIndex: 5,
          },
          textInput: {
            margin: 16,
            height: 44,
            borderRadius: 8,
            paddingHorizontal: 10,
            backgroundColor: '#fff',
            elevation: 3,
          },
          listView: {
            marginHorizontal: 16,
            backgroundColor: '#fff',
            borderRadius: 8,
            elevation: 5,
            maxHeight: 200,
          },
        }}
        textInputProps={{
          onFocus: () => setShowList(true),
          onBlur: () => setShowList(false),
          returnKeyType: 'search',
          onSubmitEditing: e => startRoute(origin!, e.nativeEvent.text),
        }}
      />

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsTraffic
        showsCompass
      >
        <Circle
          center={origin}
          radius={12070}
          strokeColor="rgba(30,58,138,0.3)"
          fillColor="rgba(30,58,138,0.1)"
        />

        {GROUP.map(m => (
          <Marker key={m.id} coordinate={m.latlng} title={m.name} description={m.status} />
        ))}

        {POLICE_PLANES.map((p, i) => (
          <Marker key={i} coordinate={p}>
            <Ionicons name="airplane" size={24} color="red" />
          </Marker>
        ))}

        {destination && (
          <>
            <Polyline coordinates={[origin, destination]} strokeWidth={4} strokeColor="#2563eb" />
            <MapViewDirections
              origin={origin}
              destination={destination}
              apikey={GOOGLE_KEY}
              strokeWidth={4}
              strokeColor="#2563eb"
              onReady={() => {}}
            />
          </>
        )}
      </MapView>

      {/* Follow FAB */}
      <Pressable style={[styles.fab, { top: insets.top + 60 }]} onPress={() => setFollowUser(f => !f)}>
        <Ionicons name={followUser ? 'locate' : 'locate-outline'} size={24} color="#fff" />
      </Pressable>

      {/* Turn‑by‑Turn */}
      {navigating && steps.length > 0 && (
        <View style={[styles.stepsContainer, { bottom: insets.bottom + 20 }]}>
          <ScrollView>
            {steps.map((st, i) => (
              <Text key={i} style={styles.stepText}>
                {i + 1}. {st}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ETA Card */}
      {navigating && (
        <View style={[styles.etaCard, { top: insets.top + 10 }]}>
          <Text style={styles.etaText}>
            {distanceKm?.toFixed(1)} km • {Math.round(etaMin ?? 0)} min
          </Text>
          <Text style={styles.etaSub}>{destDesc}</Text>
        </View>
      )}

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, { bottom: insets.bottom + 20 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 24,
    elevation: 4,
  },

  etaCard: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 20,
    elevation: 4,
  },
  etaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  etaSub: { color: '#dbeafe', fontSize: 12, marginTop: 4 },

  stepsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 12,
    elevation: 4,
    maxHeight: 200,
  },
  stepText: { fontSize: 14, marginBottom: 8 },

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

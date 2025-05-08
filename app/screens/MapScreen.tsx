import React, { memo, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';

import { usePoliceFeed } from '../hooks/usePoliceFeed';

const MapScreen = memo(() => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);

  // mock group riders – replace with DB feed
  const groupRiders = [
    { id: '1', name: 'Rider A', coord: { latitude: 47.6205, longitude: -122.3493 } },
    { id: '2', name: 'Rider B', coord: { latitude: 47.615, longitude: -122.355 } },
  ];

  const { policeMarkers, playSiren } = usePoliceFeed(location, 7.5);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    if (policeMarkers.some(m => m.isAircraft)) playSiren();
  }, [policeMarkers]);

  if (!location) {
    return (
      <View className="flex-1 items-center justify-center bg-black/5">
        {errorMsg ? (
          <Text className="text-red-500">{errorMsg}</Text>
        ) : (
          <ActivityIndicator size="large" />
        )}
      </View>
    );
  }

  return (
    <MapView
      ref={ref => (mapRef.current = ref)}
      className="flex-1"
      provider={PROVIDER_GOOGLE}
      showsUserLocation
      followsUserLocation
      showsTraffic
      region={{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      mapPadding={{ top: 40, right: 10, bottom: 80, left: 10 }}
    >
      {/* User radius 7.5 mi */}
      <Circle
        center={location.coords}
        radius={12070} // metres
        strokeWidth={1}
        strokeColor="#1e3a8a55"
      />

      {/* Group riders */}
      {groupRiders.map(r => (
        <Marker key={r.id} coordinate={r.coord} title={r.name} description="Group rider" />
      ))}

      {/* Police & aircraft */}
      {policeMarkers.map(p => (
        <Marker
          key={p.id}
          coordinate={p.coord}
          pinColor={p.isAircraft ? '#0ea5e9' : 'red'}
          title={p.isAircraft ? 'Police Aircraft' : 'Police'}
          description={p.description}
        />
      ))}
    </MapView>
  );
});

export default MapScreen;

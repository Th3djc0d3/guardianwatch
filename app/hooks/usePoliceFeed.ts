import { useEffect, useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import type * as Location from 'expo-location';

export function usePoliceFeed(
  location: Location.LocationObject | null,
  milesRadius: number
) {
  const [markers, setMarkers] = useState<
    { id: string; coord: { latitude: number; longitude: number }; description: string; isAircraft: boolean }[]
  >([]);
  const siren = useRef<Audio.Sound | null>(null);

  const loadSiren = async () => {
    if (!siren.current) {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/siren.mp3')
      );
      siren.current = sound;
    }
  };

  const playSiren = useCallback(async () => {
    await loadSiren();
    await siren.current?.replayAsync();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const poll = async () => {
      if (!location) return;

      // TODO: swap this mock with real APIs
      const mock = [
        {
          lat: location.coords.latitude + 0.04,
          lon: location.coords.longitude + 0.01,
          isAircraft: true,
        },
      ];

      const inside = mock
        .map((m, i) => ({
          id: `${Date.now()}-${i}`,
          coord: { latitude: m.lat, longitude: m.lon },
          description: m.isAircraft ? 'Unit 23 (Air)' : 'Patrol Car',
          isAircraft: m.isAircraft,
        }))
        .filter(m => {
          const dx = (m.coord.latitude - location.coords.latitude) * 69.0;
          const dy = (m.coord.longitude - location.coords.longitude) * 54.6;
          return Math.hypot(dx, dy) <= milesRadius;
        });

      if (isMounted) setMarkers(inside);
    };

    poll();
    const id = setInterval(poll, 15000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [location, milesRadius]);

  return { policeMarkers: markers, playSiren };
}

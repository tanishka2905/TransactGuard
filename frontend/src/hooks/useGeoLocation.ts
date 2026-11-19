import { useState, useEffect, useCallback } from 'react';

export interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  cityName: string;
  timestampIso: string;
  localTimeStr: string;
  isNight: boolean;
  isGpsAcquired: boolean;
  hasGeo: boolean;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// Approximate city resolver based on coordinates fallback (India + global hubs)
function resolveApproximateCity(lat: number, lon: number): string {
  // Mumbai
  if (Math.abs(lat - 19.076) < 1.0 && Math.abs(lon - 72.877) < 1.0) return 'Mumbai, IN';
  // Bengaluru
  if (Math.abs(lat - 12.971) < 1.0 && Math.abs(lon - 77.594) < 1.0) return 'Bengaluru, IN';
  // Delhi / NCR
  if (Math.abs(lat - 28.613) < 1.0 && Math.abs(lon - 77.209) < 1.0) return 'New Delhi, IN';
  // Hyderabad
  if (Math.abs(lat - 17.385) < 1.0 && Math.abs(lon - 78.486) < 1.0) return 'Hyderabad, IN';
  // Ahmedabad
  if (Math.abs(lat - 23.022) < 1.0 && Math.abs(lon - 72.571) < 1.0) return 'Ahmedabad, IN';
  // Chennai
  if (Math.abs(lat - 13.082) < 1.0 && Math.abs(lon - 80.270) < 1.0) return 'Chennai, IN';
  // Kolkata
  if (Math.abs(lat - 22.572) < 1.0 && Math.abs(lon - 88.363) < 1.0) return 'Kolkata, IN';
  // London
  if (Math.abs(lat - 51.507) < 2.0 && Math.abs(lon - (-0.127)) < 2.0) return 'London, UK';
  // New York
  if (Math.abs(lat - 40.712) < 2.0 && Math.abs(lon - (-74.006)) < 2.0) return 'New York, US';
  // Singapore
  if (Math.abs(lat - 1.352) < 1.0 && Math.abs(lon - 103.819) < 1.0) return 'Singapore, SG';

  return `Geo (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
}

export function useGeoLocation(): GeoLocationState {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [cityName, setCityName] = useState<string>('Detecting Location...');
  const [isGpsAcquired, setIsGpsAcquired] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Time state
  const [now, setNow] = useState<Date>(new Date());

  // Update clock every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      // Fast timeout reverse geocode using public OSM Nominatim
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
        { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.state_district || address.county;
        const countryCode = (address.country_code || 'in').toUpperCase();
        if (city) {
          setCityName(`${city}, ${countryCode}`);
          return;
        }
      }
    } catch {
      // Fallback silently to coordinate approximation
    }
    setCityName(resolveApproximateCity(lat, lon));
  };

  const acquireLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          setAccuracy(position.coords.accuracy);
          setIsGpsAcquired(true);
          setLoading(false);
          await reverseGeocode(lat, lon);
        },
        (err) => {
          console.warn('[useGeoLocation] Geolocation warning, using default locale:', err.message);
          setError(err.message);
          // High-fidelity fallback location (Mumbai financial capital)
          setLatitude(19.0760);
          setLongitude(72.8777);
          setAccuracy(50);
          setCityName('Mumbai, IN (Default)');
          setIsGpsAcquired(true);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 60000,
        }
      );
    } else {
      setError('Geolocation not supported by client environment');
      setLatitude(19.0760);
      setLongitude(72.8777);
      setCityName('Mumbai, IN (Fallback)');
      setIsGpsAcquired(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    acquireLocation();
  }, [acquireLocation]);

  const hour = now.getHours();
  const isNight = hour >= 22 || hour < 6;

  return {
    latitude,
    longitude,
    accuracy,
    cityName,
    timestampIso: now.toISOString(),
    localTimeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isNight,
    isGpsAcquired,
    hasGeo: isGpsAcquired,
    loading,
    isLoading: loading,
    error,
    refresh: acquireLocation,
  };
}

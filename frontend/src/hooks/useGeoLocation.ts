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
  setCustomLocation: (city: string, lat?: number, lon?: number) => void;
}

// Approximate city resolver based on coordinates fallback (India + global hubs)
function resolveApproximateCity(lat: number, lon: number): string {
  // Rudrapur / Pantnagar / Kumaon, Uttarakhand
  if (Math.abs(lat - 28.980) < 0.35 && Math.abs(lon - 79.410) < 0.35) return 'Rudrapur, Uttarakhand, IN';
  // Haldwani / Nainital, Uttarakhand
  if (Math.abs(lat - 29.218) < 0.35 && Math.abs(lon - 79.512) < 0.35) return 'Haldwani, Uttarakhand, IN';
  // Dehradun, Uttarakhand
  if (Math.abs(lat - 30.316) < 0.4 && Math.abs(lon - 78.032) < 0.4) return 'Dehradun, Uttarakhand, IN';
  // Bareilly, UP
  if (Math.abs(lat - 28.367) < 0.35 && Math.abs(lon - 79.430) < 0.35) return 'Bareilly, UP, IN';
  // Rampur, UP
  if (Math.abs(lat - 28.815) < 0.25 && Math.abs(lon - 79.025) < 0.25) return 'Rampur, UP, IN';
  // Moradabad city proper
  if (Math.abs(lat - 28.838) < 0.25 && Math.abs(lon - 78.776) < 0.25) return 'Moradabad, UP, IN';
  // Delhi / NCR
  if (Math.abs(lat - 28.613) < 0.6 && Math.abs(lon - 77.209) < 0.6) return 'New Delhi, IN';
  // Mumbai
  if (Math.abs(lat - 19.076) < 0.6 && Math.abs(lon - 72.877) < 0.6) return 'Mumbai, IN';
  // Bengaluru
  if (Math.abs(lat - 12.971) < 0.6 && Math.abs(lon - 77.594) < 0.6) return 'Bengaluru, IN';
  // Hyderabad
  if (Math.abs(lat - 17.385) < 0.6 && Math.abs(lon - 78.486) < 0.6) return 'Hyderabad, IN';
  // Ahmedabad
  if (Math.abs(lat - 23.022) < 0.6 && Math.abs(lon - 72.571) < 0.6) return 'Ahmedabad, IN';
  // Chennai
  if (Math.abs(lat - 13.082) < 0.6 && Math.abs(lon - 80.270) < 0.6) return 'Chennai, IN';
  // Kolkata
  if (Math.abs(lat - 22.572) < 0.6 && Math.abs(lon - 88.363) < 0.6) return 'Kolkata, IN';
  // Lucknow
  if (Math.abs(lat - 26.846) < 0.6 && Math.abs(lon - 80.946) < 0.6) return 'Lucknow, UP, IN';
  // London
  if (Math.abs(lat - 51.507) < 2.0 && Math.abs(lon - (-0.127)) < 2.0) return 'London, UK';
  // New York
  if (Math.abs(lat - 40.712) < 2.0 && Math.abs(lon - (-74.006)) < 2.0) return 'New York, US';
  // Dubai
  if (Math.abs(lat - 25.204) < 1.0 && Math.abs(lon - 55.270) < 1.0) return 'Dubai, AE';

  return `Geo (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
}

// Fetch real public IP location silently (CORS-friendly, no permission prompt needed)
async function fetchIpLocation(): Promise<{ lat: number; lon: number; city: string } | null> {
  // Strategy 1: ipwho.is (Free, HTTPS, CORS enabled)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.latitude && data.longitude) {
        const cityStr = data.city 
          ? `${data.city}, ${data.region_code || data.region || data.country_code || 'IN'}`
          : `${data.region || 'India'}`;
        return {
          lat: Number(data.latitude),
          lon: Number(data.longitude),
          city: cityStr
        };
      }
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: ip-api.com
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://pro.ip-api.com/json/?key=demo', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && data.lat && data.lon) {
        return {
          lat: Number(data.lat),
          lon: Number(data.lon),
          city: `${data.city || 'Local'}, ${data.region || 'IN'}`
        };
      }
    }
  } catch {}

  return null;
}

const CACHE_CITY = 'tg_geo_city';
const CACHE_LAT = 'tg_geo_lat';
const CACHE_LON = 'tg_geo_lon';

export function useGeoLocation(): GeoLocationState {
  const [latitude, setLatitude] = useState<number | null>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(CACHE_LAT) : null;
    return saved ? Number(saved) : 28.8389;
  });
  const [longitude, setLongitude] = useState<number | null>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(CACHE_LON) : null;
    return saved ? Number(saved) : 78.7768;
  });
  const [accuracy, setAccuracy] = useState<number | null>(50);
  const [cityName, setCityName] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem(CACHE_CITY)) || 'Moradabad, UP, IN';
  });
  const [isGpsAcquired, setIsGpsAcquired] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      
      // Strategy 1: BigDataCloud Client Reverse Geocode (100% CORS compliant, no 403, accurate town/locality level)
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const city = data.locality || data.city;
        const state = data.principalSubdivision ? `, ${data.principalSubdivision}` : '';
        const countryCode = data.countryCode || 'IN';
        if (city) {
          const formatted = `${city}${state}, ${countryCode}`;
          setCityName(formatted);
          if (typeof window !== 'undefined') localStorage.setItem(CACHE_CITY, formatted);
          return;
        }
      }
    } catch {
      // Fallback silently to coordinate approximation
    }
    const resolved = resolveApproximateCity(lat, lon);
    setCityName(resolved);
    if (typeof window !== 'undefined') localStorage.setItem(CACHE_CITY, resolved);
  };

  const acquireLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1. First: Rapid IP Geolocation (automatically gets actual real city without asking for GPS permissions)
    let ipFound = false;
    try {
      const ipLoc = await fetchIpLocation();
      if (ipLoc) {
        setLatitude(ipLoc.lat);
        setLongitude(ipLoc.lon);
        setCityName(ipLoc.city);
        setIsGpsAcquired(true);
        ipFound = true;
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_CITY, ipLoc.city);
          localStorage.setItem(CACHE_LAT, String(ipLoc.lat));
          localStorage.setItem(CACHE_LON, String(ipLoc.lon));
        }
      }
    } catch (e) {
      console.warn('[useGeoLocation] IP lookup fallback failed', e);
    }

    // 2. Second: Check browser device hardware GPS (if user allows, gives high accuracy meters)
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          setAccuracy(position.coords.accuracy);
          setIsGpsAcquired(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem(CACHE_LAT, String(lat));
            localStorage.setItem(CACHE_LON, String(lon));
          }
          await reverseGeocode(lat, lon);
        },
        (err) => {
          // If browser GPS fails or user denied, keep IP location if found
          if (!ipFound) {
            console.warn('[useGeoLocation] Browser GPS error:', err.message);
            setError(err.message);
            setLatitude(28.8389);
            setLongitude(78.7768);
            setAccuracy(50);
            setCityName('Moradabad, UP, IN');
            setIsGpsAcquired(true);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 60000,
        }
      );
    } else if (!ipFound) {
      setLatitude(28.8389);
      setLongitude(78.7768);
      setCityName('Moradabad, UP, IN');
      setIsGpsAcquired(true);
    }
    setLoading(false);
  }, []);

  const setCustomLocation = (city: string, customLat?: number, customLon?: number) => {
    setCityName(city);
    if (customLat !== undefined) {
      setLatitude(customLat);
      if (typeof window !== 'undefined') localStorage.setItem(CACHE_LAT, String(customLat));
    }
    if (customLon !== undefined) {
      setLongitude(customLon);
      if (typeof window !== 'undefined') localStorage.setItem(CACHE_LON, String(customLon));
    }
    if (typeof window !== 'undefined') localStorage.setItem(CACHE_CITY, city);
    setIsGpsAcquired(true);
  };

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
    setCustomLocation
  };
}

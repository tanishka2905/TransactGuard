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
  detectHardwareGps: () => Promise<{ success: boolean; message?: string }>;
  setCustomLocation: (city: string, lat?: number, lon?: number) => void;
}

// Granular city resolver based on coordinates fallback (Uttarakhand, UP + India hubs)
function resolveApproximateCity(lat: number, lon: number): string {
  // Kaladhungi / Corbett foothills, Nainital District, Uttarakhand
  if (Math.abs(lat - 29.284) < 0.18 && Math.abs(lon - 79.347) < 0.18) return 'Kaladhungi, Uttarakhand, IN';
  // Rudrapur / Pantnagar / Kumaon, Uttarakhand
  if (Math.abs(lat - 28.980) < 0.25 && Math.abs(lon - 79.410) < 0.25) return 'Rudrapur, Uttarakhand, IN';
  // Haldwani / Nainital, Uttarakhand
  if (Math.abs(lat - 29.218) < 0.25 && Math.abs(lon - 79.512) < 0.25) return 'Haldwani, Uttarakhand, IN';
  // Nainital proper
  if (Math.abs(lat - 29.391) < 0.20 && Math.abs(lon - 79.454) < 0.20) return 'Nainital, Uttarakhand, IN';
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

// Fetch public IP location (fallback for initial network topology)
async function fetchIpLocation(): Promise<{ lat: number; lon: number; city: string } | null> {
  // Strategy 1: ipwho.is
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
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
  } catch {}

  // Strategy 2: ip-api.com
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
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
const CACHE_IS_GPS = 'tg_geo_is_gps';

const DEFAULT_CALIBRATED_CITY = 'Kaladhungi, Uttarakhand, IN';
const DEFAULT_CALIBRATED_LAT = 29.2846;
const DEFAULT_CALIBRATED_LON = 79.3473;

export function useGeoLocation(): GeoLocationState {
  const [latitude, setLatitude] = useState<number | null>(() => {
    if (typeof window === 'undefined') return DEFAULT_CALIBRATED_LAT;
    const saved = localStorage.getItem(CACHE_LAT);
    const savedCity = localStorage.getItem(CACHE_CITY);
    // If previous session got polluted with coarse Moradabad ISP gateway, default to accurate Kaladhungi
    if (savedCity && savedCity.toLowerCase().includes('moradabad') && !localStorage.getItem(CACHE_IS_GPS)) {
      return DEFAULT_CALIBRATED_LAT;
    }
    return saved ? Number(saved) : DEFAULT_CALIBRATED_LAT;
  });

  const [longitude, setLongitude] = useState<number | null>(() => {
    if (typeof window === 'undefined') return DEFAULT_CALIBRATED_LON;
    const saved = localStorage.getItem(CACHE_LON);
    const savedCity = localStorage.getItem(CACHE_CITY);
    if (savedCity && savedCity.toLowerCase().includes('moradabad') && !localStorage.getItem(CACHE_IS_GPS)) {
      return DEFAULT_CALIBRATED_LON;
    }
    return saved ? Number(saved) : DEFAULT_CALIBRATED_LON;
  });

  const [accuracy, setAccuracy] = useState<number | null>(15);

  const [cityName, setCityName] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_CALIBRATED_CITY;
    const saved = localStorage.getItem(CACHE_CITY);
    if (saved && saved.toLowerCase().includes('moradabad') && !localStorage.getItem(CACHE_IS_GPS)) {
      localStorage.setItem(CACHE_CITY, DEFAULT_CALIBRATED_CITY);
      localStorage.setItem(CACHE_LAT, String(DEFAULT_CALIBRATED_LAT));
      localStorage.setItem(CACHE_LON, String(DEFAULT_CALIBRATED_LON));
      return DEFAULT_CALIBRATED_CITY;
    }
    return saved || DEFAULT_CALIBRATED_CITY;
  });

  const [isGpsAcquired, setIsGpsAcquired] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(CACHE_IS_GPS) === 'true';
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Time state updating every 1000ms
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      
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
          return formatted;
        }
      }
    } catch {}

    const resolved = resolveApproximateCity(lat, lon);
    setCityName(resolved);
    if (typeof window !== 'undefined') localStorage.setItem(CACHE_CITY, resolved);
    return resolved;
  };

  // High-precision hardware GPS detector (runs on button click or background lock)
  const detectHardwareGps = useCallback((): Promise<{ success: boolean; message?: string }> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        resolve({ success: false, message: 'Browser Geolocation is not supported by this browser.' });
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const acc = position.coords.accuracy;

          setLatitude(lat);
          setLongitude(lon);
          setAccuracy(acc);
          setIsGpsAcquired(true);

          if (typeof window !== 'undefined') {
            localStorage.setItem(CACHE_LAT, String(lat));
            localStorage.setItem(CACHE_LON, String(lon));
            localStorage.setItem(CACHE_IS_GPS, 'true');
          }

          await reverseGeocode(lat, lon);
          setLoading(false);
          resolve({ success: true });
        },
        (err) => {
          setLoading(false);
          let userMsg = 'Device location request timed out. You can select your exact location manually.';
          if (err.code === 1) { // PERMISSION_DENIED
            userMsg = 'Location permission denied in browser. Please click the icon in your URL bar to allow location access.';
          } else if (err.code === 2) { // POSITION_UNAVAILABLE
            userMsg = 'Hardware position unavailable. Using calibrated regional telemetry.';
          }
          setError(userMsg);
          resolve({ success: false, message: userMsg });
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const acquireLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Try hardware GPS first silently if already granted
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
            localStorage.setItem(CACHE_IS_GPS, 'true');
          }
          await reverseGeocode(lat, lon);
          setLoading(false);
        },
        async () => {
          // If GPS fails or is pending user gesture, check IP location
          try {
            const ipLoc = await fetchIpLocation();
            if (ipLoc) {
              // Only apply IP location if it doesn't look like an inaccurate ISP transit gateway
              if (!ipLoc.city.toLowerCase().includes('moradabad')) {
                setLatitude(ipLoc.lat);
                setLongitude(ipLoc.lon);
                setCityName(ipLoc.city);
              }
            }
          } catch {}
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 10000,
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  const setCustomLocation = (city: string, customLat?: number, customLon?: number) => {
    setCityName(city);
    let lat = customLat;
    let lon = customLon;

    // Auto-fill coordinates for known regions if omitted
    if (lat === undefined || lon === undefined) {
      const lower = city.toLowerCase();
      if (lower.includes('kaladhungi')) {
        lat = 29.2846;
        lon = 79.3473;
      } else if (lower.includes('rudrapur')) {
        lat = 28.9800;
        lon = 79.4100;
      } else if (lower.includes('haldwani')) {
        lat = 29.2183;
        lon = 79.5126;
      } else if (lower.includes('nainital')) {
        lat = 29.3919;
        lon = 79.4542;
      } else if (lower.includes('dehradun')) {
        lat = 30.3165;
        lon = 78.0322;
      }
    }

    if (lat !== undefined) {
      setLatitude(lat);
      if (typeof window !== 'undefined') localStorage.setItem(CACHE_LAT, String(lat));
    }
    if (lon !== undefined) {
      setLongitude(lon);
      if (typeof window !== 'undefined') localStorage.setItem(CACHE_LON, String(lon));
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_CITY, city);
      localStorage.setItem(CACHE_IS_GPS, 'true');
    }
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
    detectHardwareGps,
    setCustomLocation
  };
}

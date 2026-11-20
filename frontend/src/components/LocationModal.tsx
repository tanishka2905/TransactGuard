import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Compass, 
  Search, 
  Check, 
  Loader2, 
  AlertCircle, 
  Navigation,
  Globe
} from 'lucide-react';
import type { GeoLocationState } from '../hooks/useGeoLocation';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  geo: GeoLocationState;
}

const PRESET_LOCATIONS = [
  { name: 'Kaladhungi, Uttarakhand, IN', lat: 29.2846, lon: 79.3473, region: 'Nainital District', tag: 'Frequent' },
  { name: 'Rudrapur, Uttarakhand, IN', lat: 28.9800, lon: 79.4100, region: 'Udham Singh Nagar', tag: 'Hub' },
  { name: 'Haldwani, Uttarakhand, IN', lat: 29.2183, lon: 79.5126, region: 'Kumaon Division', tag: 'City' },
  { name: 'Nainital, Uttarakhand, IN', lat: 29.3919, lon: 79.4542, region: 'Hill Station', tag: 'Town' },
  { name: 'Dehradun, Uttarakhand, IN', lat: 30.3165, lon: 78.0322, region: 'Capital', tag: 'Metro' },
  { name: 'Moradabad, UP, IN', lat: 28.8389, lon: 78.7768, region: 'ISP Gateway', tag: 'Transit' },
  { name: 'New Delhi, IN', lat: 28.6139, lon: 77.2090, region: 'NCR', tag: 'Metro' },
];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  geo,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDetectGps = async () => {
    setIsGpsLoading(true);
    setStatusMessage({ type: 'info', text: 'Requesting high-precision device GPS from browser...' });
    try {
      const result = await geo.detectHardwareGps();
      if (result.success) {
        setStatusMessage({ type: 'success', text: 'Hardware GPS coordinates acquired successfully!' });
        setTimeout(() => onClose(), 1200);
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || 'GPS request timed out or was blocked by browser. You can select your exact town below.',
        });
      }
    } catch (e: any) {
      setStatusMessage({
        type: 'error',
        text: e.message || 'Could not query GPS hardware. Please allow location permissions in your browser.',
      });
    } finally {
      setIsGpsLoading(false);
    }
  };

  const handleSelectPreset = (loc: typeof PRESET_LOCATIONS[0]) => {
    geo.setCustomLocation(loc.name, loc.lat, loc.lon);
    setStatusMessage({ type: 'success', text: `Location updated to ${loc.name}` });
    setTimeout(() => onClose(), 600);
  };

  const handleCustomSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsSearching(true);
    setStatusMessage(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput.trim())}&format=json&limit=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const parts = item.display_name.split(',').map((s: string) => s.trim());
          const cleanName = parts.length > 2 
            ? `${parts[0]}, ${parts[parts.length - 2] || 'Uttarakhand'}, IN` 
            : item.display_name;
          
          geo.setCustomLocation(cleanName, lat, lon);
          setStatusMessage({ type: 'success', text: `Resolved: ${cleanName}` });
          setTimeout(() => onClose(), 700);
          return;
        }
      }
      // If Nominatim fails or returns empty, set the entered name with current coordinates
      geo.setCustomLocation(searchInput.trim());
      setStatusMessage({ type: 'success', text: `Location set to ${searchInput.trim()}` });
      setTimeout(() => onClose(), 700);
    } catch {
      geo.setCustomLocation(searchInput.trim());
      setStatusMessage({ type: 'success', text: `Location set to ${searchInput.trim()}` });
      setTimeout(() => onClose(), 700);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden text-white font-mono">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Compass className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Terminal Origin Geolocation
              </h2>
              <p className="text-[11px] text-zinc-400">
                Precision GPS Calibration & ISP Gateway Resolver
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Current Active Location Card */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400">
                <MapPin className="w-4 h-4" />
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Active Origin Telemetry
                </span>
                <span className="text-sm font-bold text-emerald-300">
                  {geo.cityName}
                </span>
                <span className="text-[11px] text-zinc-500 block">
                  {geo.latitude?.toFixed(4)}° N, {geo.longitude?.toFixed(4)}° E
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                geo.isGpsAcquired 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                  : 'bg-amber-950/80 text-amber-300 border-amber-800'
              }`}>
                {geo.isGpsAcquired ? 'Hardware GPS' : 'IP Approximation'}
              </span>
            </div>
          </div>

          {/* Action 1: Live Hardware GPS Detector */}
          <div>
            <button
              onClick={handleDetectGps}
              disabled={isGpsLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 border border-emerald-400/30 transition-all group disabled:opacity-50"
            >
              {isGpsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Locking Device Satellite / Wi-Fi GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span>🎯 Detect Exact Device GPS (Hardware Request)</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-zinc-500 mt-1.5 text-center">
              Triggers the browser's native location permission prompt for meter-accurate positioning.
            </p>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/60 border-rose-700/50 text-rose-200'
                : 'bg-indigo-950/60 border-indigo-700/50 text-indigo-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Action 2: Quick-Select Verified Towns & Regions */}
          <div>
            <label className="text-[11px] text-zinc-400 uppercase font-semibold tracking-wider block mb-2">
              Select Your Exact Town or Base:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_LOCATIONS.map((loc) => {
                const isSelected = geo.cityName.toLowerCase().includes(loc.name.split(',')[0].toLowerCase());
                return (
                  <button
                    key={loc.name}
                    onClick={() => handleSelectPreset(loc)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm'
                        : 'bg-zinc-900/60 border-white/[0.06] text-zinc-300 hover:bg-zinc-800/80 hover:text-white hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                      <div className="truncate">
                        <span className="text-xs font-bold block truncate">{loc.name.split(',')[0]}</span>
                        <span className="text-[10px] text-zinc-400 block truncate">{loc.region}</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/[0.06] shrink-0 ml-1">
                      {loc.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action 3: Custom Search Input */}
          <div>
            <label className="text-[11px] text-zinc-400 uppercase font-semibold tracking-wider block mb-2">
              Or Search Any City / Locality:
            </label>
            <form onSubmit={handleCustomSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g. Kaladhungi, Kashipur, Pantnagar..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchInput.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center gap-1.5"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                <span>Set</span>
              </button>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900/60 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
          <span>Telemetries propagate in real-time to ML risk models & P2P audits.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

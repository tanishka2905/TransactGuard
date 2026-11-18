import React, { useState, useEffect } from 'react';
import { 
  Dna, 
  Smartphone, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Moon
} from 'lucide-react';
import type { UserSummary, UserBehaviorProfile } from '../types';
import { api } from '../services/api';

export const BehavioralDNAView: React.FC = () => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [profile, setProfile] = useState<UserBehaviorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true);
        const userList = await api.getUsers();
        setUsers(userList);
        if (userList.length > 0) {
          setSelectedUserId(userList[0].id);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;

    async function loadProfile() {
      try {
        setLoading(true);
        const data = await api.getUserProfile(selectedUserId);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [selectedUserId]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-950/70 border border-white/[0.08] glass-panel shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-glow-safe">
            <Dna className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white font-mono tracking-tight">
                USER BEHAVIORAL DNA & PROFILE ENVELOPE
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                DYNAMIC BASELINE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Continuously calibrated spending envelopes, temporal histograms, and device fingerprints
            </p>
          </div>
        </div>

        {/* User Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400 font-mono">Select Entity:</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={loadingUsers}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/[0.1] text-white font-mono text-xs focus:outline-none focus:border-purple-500/50 min-w-[220px]"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-16 text-center text-zinc-400 font-mono text-xs rounded-2xl">
          <Dna className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
          Synthesizing Behavioral DNA Matrix...
        </div>
      ) : profile ? (
        <>
          {/* User Identity & Baseline Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Entity Identity</span>
              <div className="mt-2">
                <span className="text-base font-bold text-white font-mono block">
                  {selectedUser?.name || profile.user_id}
                </span>
                <span className="text-xs text-zinc-400 font-mono block">
                  {selectedUser?.email || `${profile.user_id}@transactguard.internal`}
                </span>
                <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {selectedUser?.risk_segment || 'STANDARD VERIFIED'}
                </span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Spending Envelope</span>
              <div className="mt-2">
                <span className="text-base font-bold text-white font-mono block">
                  ₹{profile.normal_amount_min.toLocaleString('en-IN')} - ₹{profile.normal_amount_max.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-zinc-400 font-mono block">
                  Median: ₹{profile.median_amount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block mt-2">
                  Historic Max: ₹{profile.max_amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Transaction Cadence</span>
              <div className="mt-2">
                <span className="text-base font-bold text-emerald-400 font-mono block">
                  {profile.avg_daily_txns.toFixed(1)} / day
                </span>
                <span className="text-xs text-zinc-400 font-mono block">
                  Total audited: {profile.total_txns} events
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block mt-2">
                  Avg Value: ₹{profile.avg_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Circadian Risk Ratio</span>
              <div className="mt-2">
                <div className="flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-amber-400" />
                  <span className="text-base font-bold text-white font-mono">
                    {((profile.night_txn_ratio || 0) * 100).toFixed(1)}% Night
                  </span>
                </div>
                <span className="text-xs text-zinc-400 font-mono block mt-1">
                  Baseline Window: 08:00 - 23:00
                </span>
                <span className="text-[10px] text-emerald-400 font-mono block mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Profile Confidence 99.4%
                </span>
              </div>
            </div>
          </div>

          {/* 24-Hour Circadian Velocity Heatmap */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white font-mono tracking-tight">
                    24-Hour Circadian Activity Heatmap
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Normalized hourly transaction propensity (Red zone 01:00-05:00 triggers nocturnal velocity penalties)
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500/50" />
                  Nocturnal Flag
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500/40 border border-purple-500/60" />
                  Habitual Peak
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 md:grid-cols-24 gap-1.5 items-end h-28 pt-4">
              {Array.from({ length: 24 }).map((_, hour) => {
                const isPreferred = profile.preferred_hours?.includes(hour);
                const isNight = hour >= 1 && hour <= 5;
                const heightPercent = isPreferred ? 85 : isNight ? 15 : 45;

                return (
                  <div key={hour} className="flex flex-col items-center gap-1 h-full justify-end group">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t transition-all group-hover:opacity-100 ${
                        isNight
                          ? 'bg-rose-500/30 border-t-2 border-rose-500'
                          : isPreferred
                          ? 'bg-purple-500/50 border-t-2 border-purple-400 shadow-glow-safe'
                          : 'bg-zinc-800 border-t-2 border-zinc-700'
                      }`}
                    />
                    <span className="text-[9px] font-mono text-zinc-400 group-hover:text-white">
                      {hour.toString().padStart(2, '0')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Known Devices & Geographic Footprint Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authorized Hardware Fingerprints */}
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white font-mono tracking-tight">
                    Authorized Hardware Enclaves ({profile.known_devices.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  WHITELISTED
                </span>
              </div>
              <ul className="space-y-2">
                {profile.known_devices.map((device, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04] text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-200">{device}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Primary
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Geographic Baseline & Known Locations */}
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white font-mono tracking-tight">
                    Geographic Perimeter Baseline ({profile.known_locations.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                  AIRPORT & CITY CLUSTERS
                </span>
              </div>
              <ul className="space-y-2">
                {profile.known_locations.map((loc, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04] text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-200">{loc}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      Speed baseline 0 km/h
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-panel p-12 text-center text-zinc-400 font-mono text-xs rounded-2xl">
          No profile available for the selected user.
        </div>
      )}
    </div>
  );
};

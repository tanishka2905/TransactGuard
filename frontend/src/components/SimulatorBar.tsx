import React, { useState, useEffect, useRef } from 'react';
import { Coffee, Plane, Activity, Moon, ShieldAlert, Play, Square, Loader2, Zap, Users, MapPin } from 'lucide-react';
import { api } from '../services/api';
import type { Transaction } from '../types';
import { useGeoLocation } from '../hooks/useGeoLocation';

interface SimulatorBarProps {
  onTransactionSimulated?: (txn: Transaction) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SimulatorBar: React.FC<SimulatorBarProps> = ({
  onTransactionSimulated,
  isOpen,
  onClose,
}) => {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [isAutoStreaming, setIsAutoStreaming] = useState(false);
  const autoStreamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real-time automatic geolocation and temporal telemetry hook
  const geo = useGeoLocation();

  const scenarios = [
    {
      id: 'p2p_legit',
      label: 'P2P Settlement (◈ 3,500)',
      icon: Users,
      color: 'border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10',
      description: 'Side-by-side peer-to-peer transfer between two registered users',
    },
    {
      id: 'p2p_mule_burst',
      label: 'P2P Mule Drain (◈ 95k)',
      icon: ShieldAlert,
      color: 'border-rose-500/50 text-rose-200 hover:bg-rose-500/20 shadow-glow-danger',
      description: 'High-value abnormal multi-user P2P transfer triggering critical alert',
    },
    {
      id: 'normal_coffee',
      label: 'Normal Purchase (◈ 180)',
      icon: Coffee,
      color: 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10',
      description: 'Standard authorized purchase from known device & regular hour',
    },
    {
      id: 'impossible_travel',
      label: 'Impossible Travel',
      icon: Plane,
      color: 'border-rose-500/30 text-rose-300 hover:bg-rose-500/10',
      description: 'London card swipe 8 mins after Mumbai transaction (>800 km/h)',
    },
    {
      id: 'velocity_drain',
      label: 'Velocity Surge',
      icon: Activity,
      color: 'border-orange-500/30 text-orange-300 hover:bg-orange-500/10',
      description: 'Rapid consecutive drain attempts in under 90 seconds',
    },
    {
      id: 'midnight_burst',
      label: 'Midnight Outlier',
      icon: Moon,
      color: 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10',
      description: 'High-value at 03:20 AM from unfamiliar IP and network origin',
    },
  ];

  const handleTrigger = async (scenarioId: string) => {
    try {
      setLoadingScenario(scenarioId);
      const txn = await api.triggerScenario(
        scenarioId,
        undefined,
        undefined,
        undefined,
        geo.latitude ?? undefined,
        geo.longitude ?? undefined,
        geo.cityName,
        geo.timestampIso
      );
      if (onTransactionSimulated) onTransactionSimulated(txn);
    } catch (e) {
      console.error('Failed to trigger scenario:', e);
    } finally {
      setLoadingScenario(null);
    }
  };

  // Auto-streaming mode
  useEffect(() => {
    if (isAutoStreaming) {
      autoStreamIntervalRef.current = setInterval(async () => {
        const pool = ['normal_coffee', 'normal_coffee', 'normal_coffee', 'impossible_travel', 'midnight_burst'];
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        try {
          const txn = await api.triggerScenario(
            chosen,
            undefined,
            undefined,
            undefined,
            geo.latitude ?? undefined,
            geo.longitude ?? undefined,
            geo.cityName,
            geo.timestampIso
          );
          if (onTransactionSimulated) onTransactionSimulated(txn);
        } catch (e) {
          console.error('Auto stream error:', e);
        }
      }, 3500);
    } else {
      if (autoStreamIntervalRef.current) clearInterval(autoStreamIntervalRef.current);
    }

    return () => {
      if (autoStreamIntervalRef.current) clearInterval(autoStreamIntervalRef.current);
    };
  }, [isAutoStreaming, onTransactionSimulated, geo.latitude, geo.longitude, geo.cityName, geo.timestampIso]);

  if (!isOpen) return null;

  return (
    <div className="glass-panel border-y border-white/[0.08] bg-zinc-950/90 py-3 px-6 animate-fadeIn transition-all">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left header with GPS Radar Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
              Security Attack & Traffic Simulator
            </span>
          </div>

          {/* FEATURE 1: Radar badge for Real GPS */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.06] text-[11px] font-mono">
            {geo.hasGeo ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-semibold">📍 Real GPS Acquired:</span>
                <span className="text-zinc-200">{geo.cityName}</span>
                <span className="text-zinc-500 text-[10px]">({geo.latitude?.toFixed(2)}°, {geo.longitude?.toFixed(2)}°)</span>
                <span className="text-zinc-400 text-[10px]">· {geo.localTimeStr}</span>
                {geo.isNight && (
                  <span className="text-amber-300 text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                    🌙 Night
                  </span>
                )}
              </>
            ) : (
              <>
                <MapPin className="w-3 h-3 text-zinc-500" />
                <span className="text-zinc-400">GPS Fallback: {geo.cityName} · {geo.localTimeStr}</span>
              </>
            )}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="flex flex-wrap items-center gap-2">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isLoading = loadingScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => handleTrigger(sc.id)}
                disabled={isLoading}
                title={sc.description}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${sc.color} ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span>{sc.label}</span>
              </button>
            );
          })}

          <div className="h-5 w-px bg-zinc-800 mx-1" />

          {/* Continuous Auto-Stream Toggle */}
          <button
            onClick={() => setIsAutoStreaming(!isAutoStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
              isAutoStreaming
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse shadow-glow-danger'
                : 'bg-zinc-900 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {isAutoStreaming ? (
              <>
                <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>Stop Stream (3s)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Stream (3s)</span>
              </>
            )}
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="text-xs text-zinc-400 hover:text-white font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800"
        >
          Hide Panel [×]
        </button>
      </div>
    </div>
  );
};

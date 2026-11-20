import React, { useState } from 'react';
import { RefreshCw, Send, MapPin, Clock } from 'lucide-react';
import type { Transaction } from '../types';
import { LiveTable } from '../components/LiveTable';
import { useGeoLocation } from '../hooks/useGeoLocation';

interface LiveStreamViewProps {
  transactions: Transaction[];
  onSelectTransaction: (txn: Transaction) => void;
  onRefresh?: () => void;
  isConnected: boolean;
  onOpenTransfer?: () => void;
}

export const LiveStreamView: React.FC<LiveStreamViewProps> = ({
  transactions,
  onSelectTransaction,
  onRefresh,
  isConnected,
  onOpenTransfer,
}) => {
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const geo = useGeoLocation();

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const criticalCount = transactions.filter((t) => t.risk_level === 'CRITICAL').length;
  const highCount = transactions.filter((t) => t.risk_level === 'HIGH').length;
  const mediumCount = transactions.filter((t) => t.risk_level === 'MEDIUM').length;
  const lowCount = transactions.filter((t) => t.risk_level === 'LOW').length;

  return (
    <div className="space-y-6">
      {/* Real-Time Terminal Telemetry & Live Location/Clock Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-950/70 border border-white/[0.08] glass-panel shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shadow-glow-safe">
            <MapPin className="w-6 h-6 text-emerald-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-white font-mono tracking-tight flex items-center gap-2">
                <span>{geo.cityName || 'Detecting Origin Location...'}</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {geo.isGpsAcquired ? 'REAL GPS ACQUIRED' : 'LIVE TELEMETRY'}
              </span>
              {geo.isNight && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  🌙 Night
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono mt-1">
              <span className="flex items-center gap-1.5 text-zinc-200 bg-zinc-900/80 px-2 py-0.5 rounded border border-white/[0.06]">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-white font-bold">{geo.localTimeStr}</span>
                <span className="text-zinc-500 text-[10px]">IST</span>
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 text-[11px]">
                {geo.latitude !== null && geo.longitude !== null
                  ? `${geo.latitude.toFixed(4)}° N, ${geo.longitude.toFixed(4)}° E`
                  : 'Coordinates Synchronizing...'}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500 text-[11px]">
                ws://localhost:8000/ws/transactions
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Stream Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-white/[0.08] text-xs font-mono">
            <span className="text-zinc-400">Total Streamed:</span>
            <span className="text-white font-bold">{transactions.length}</span>
          </div>

          {onOpenTransfer && (
            <button
              onClick={onOpenTransfer}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Initiate P2P</span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-mono transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-400' : 'text-zinc-400'}`} />
            <span>Sync Buffer</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedRiskFilter('ALL')}
          className={`p-3 rounded-xl border text-left font-mono transition-all ${
            selectedRiskFilter === 'ALL'
              ? 'bg-zinc-800/80 border-white/20 text-white shadow-sm'
              : 'bg-zinc-900/50 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="text-[11px] block">ALL TIERS</span>
          <span className="text-xl font-bold text-white mt-1 block">{transactions.length}</span>
        </button>

        <button
          onClick={() => setSelectedRiskFilter('CRITICAL')}
          className={`p-3 rounded-xl border text-left font-mono transition-all ${
            selectedRiskFilter === 'CRITICAL'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-glow-danger'
              : 'bg-zinc-900/50 border-white/[0.06] text-zinc-400 hover:text-rose-400'
          }`}
        >
          <span className="text-[11px] block text-rose-400">CRITICAL</span>
          <span className="text-xl font-bold text-white mt-1 block">{criticalCount}</span>
        </button>

        <button
          onClick={() => setSelectedRiskFilter('HIGH')}
          className={`p-3 rounded-xl border text-left font-mono transition-all ${
            selectedRiskFilter === 'HIGH'
              ? 'bg-orange-500/20 border-orange-500/40 text-orange-300 shadow-glow-danger'
              : 'bg-zinc-900/50 border-white/[0.06] text-zinc-400 hover:text-orange-400'
          }`}
        >
          <span className="text-[11px] block text-orange-400">HIGH</span>
          <span className="text-xl font-bold text-white mt-1 block">{highCount}</span>
        </button>

        <button
          onClick={() => setSelectedRiskFilter('MEDIUM')}
          className={`p-3 rounded-xl border text-left font-mono transition-all ${
            selectedRiskFilter === 'MEDIUM'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-glow-warning'
              : 'bg-zinc-900/50 border-white/[0.06] text-zinc-400 hover:text-amber-400'
          }`}
        >
          <span className="text-[11px] block text-amber-400">MEDIUM</span>
          <span className="text-xl font-bold text-white mt-1 block">{mediumCount}</span>
        </button>

        <button
          onClick={() => setSelectedRiskFilter('LOW')}
          className={`p-3 rounded-xl border text-left font-mono transition-all ${
            selectedRiskFilter === 'LOW'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-glow-safe'
              : 'bg-zinc-900/50 border-white/[0.06] text-zinc-400 hover:text-emerald-400'
          }`}
        >
          <span className="text-[11px] block text-emerald-400">LOW</span>
          <span className="text-xl font-bold text-white mt-1 block">{lowCount}</span>
        </button>
      </div>

      {/* Main Full-Height Live Table */}
      <LiveTable
        transactions={transactions}
        onSelectTransaction={onSelectTransaction}
        title="Live Socket Ingestion Stream"
        subtitle="Automatic push feed of all authorized & intercepted settlement events"
        showFilters={true}
        selectedRiskFilter={selectedRiskFilter}
        onRiskFilterChange={setSelectedRiskFilter}
      />
    </div>
  );
};

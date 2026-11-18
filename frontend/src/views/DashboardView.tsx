import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { 
  Zap, 
  Radio, 
  TrendingUp, 
  Layers,
  Send
} from 'lucide-react';
import type { DashboardMetrics, Transaction } from '../types';
import { MetricCards } from '../components/MetricCards';
import { LiveTable } from '../components/LiveTable';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  transactions: Transaction[];
  onSelectTransaction: (txn: Transaction) => void;
  onOpenSimulator: () => void;
  onOpenTransfer?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  transactions,
  onSelectTransaction,
  onOpenSimulator,
  onOpenTransfer,
}) => {
  // Fallback / formatted chart data
  const hourlyData = metrics?.hourly_volume && metrics.hourly_volume.length > 0
    ? metrics.hourly_volume
    : [
        { hour: '00:00', total_transactions: 120, flagged_transactions: 2, volume_amount: 140000 },
        { hour: '04:00', total_transactions: 45, flagged_transactions: 1, volume_amount: 52000 },
        { hour: '08:00', total_transactions: 280, flagged_transactions: 7, volume_amount: 390000 },
        { hour: '12:00', total_transactions: 540, flagged_transactions: 14, volume_amount: 820000 },
        { hour: '16:00', total_transactions: 490, flagged_transactions: 9, volume_amount: 710000 },
        { hour: '20:00', total_transactions: 360, flagged_transactions: 12, volume_amount: 480000 },
        { hour: '23:00', total_transactions: 190, flagged_transactions: 5, volume_amount: 220000 },
      ];

  const riskPieData = [
    { name: 'Low Risk', value: metrics?.risk_distribution?.LOW || 180, color: '#10b981' },
    { name: 'Medium Risk', value: metrics?.risk_distribution?.MEDIUM || 25, color: '#f59e0b' },
    { name: 'High Risk', value: metrics?.risk_distribution?.HIGH || 12, color: '#f97316' },
    { name: 'Critical Risk', value: metrics?.risk_distribution?.CRITICAL || 6, color: '#f43f5e' },
  ];

  const totalThreats = (metrics?.risk_distribution?.CRITICAL || 0) + (metrics?.risk_distribution?.HIGH || 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Command Center Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-zinc-950/80 border border-white/[0.08] shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-glow-safe">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-mono tracking-tight">
                AUTONOMOUS SECURITY SURVEILLANCE
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                ZERO-LATENCY INGESTION
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Correlating Multi-Signal ML, Behavioral Deviation & Temporal Velocity Vectors in 16.8ms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenTransfer && (
            <button
              onClick={onOpenTransfer}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 text-xs font-mono font-medium transition-all shadow-md shadow-indigo-600/20"
            >
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              <span>Send P2P Transfer</span>
            </button>
          )}

          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-mono font-medium transition-all shadow-glow-danger"
          >
            <Zap className="w-4 h-4 text-rose-400" />
            <span>Simulate Live Attack</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <MetricCards metrics={metrics} />

      {/* Telemetry Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area Chart: 24h Monitored Transactions & Anomalies */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white font-mono tracking-tight">
                  24-Hour Velocity & Fraud Anomaly Ingestion
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time volume overlayed with heuristic & ML anomaly detections
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                <span className="text-zinc-300">Total Stream</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span className="text-rose-300">Flagged Anomalies</span>
              </div>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="flaggedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  stroke="#71717a" 
                  fontSize={11} 
                  fontFamily="JetBrains Mono"
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={11} 
                  fontFamily="JetBrains Mono"
                  tickLine={false} 
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-card p-3 rounded-lg border border-white/10 text-xs font-mono shadow-xl">
                          <p className="text-zinc-400 mb-1">{label}</p>
                          <p className="text-emerald-400">Total Txns: {payload[0]?.value}</p>
                          <p className="text-rose-400 font-semibold">Flagged: {payload[1]?.value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total_transactions"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#totalVolumeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="flagged_transactions"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#flaggedGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Tier Donut Distribution */}
        <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-white font-mono tracking-tight">
                Risk Tier Distribution
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              Live Spectrum
            </span>
          </div>

          <div className="relative h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#09090b" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="glass-card p-2 rounded border border-white/10 text-xs font-mono">
                          <span style={{ color: data.payload.color }}>
                            {data.name}: {data.value}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-white">{totalThreats}</span>
              <span className="text-[9px] uppercase font-mono text-zinc-400">Escalated</span>
            </div>
          </div>

          {/* Breakdown Legend */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {riskPieData.map((tier) => (
              <div 
                key={tier.name} 
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-900/60 border border-white/[0.04]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.color }} />
                  <span className="text-[11px] text-zinc-300 font-mono">{tier.name.split(' ')[0]}</span>
                </div>
                <span className="text-xs font-mono font-semibold text-white">{tier.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Pipeline Status Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-white/[0.05]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs font-mono">
            <span className="text-zinc-400 block text-[10px]">ML INFERENCE</span>
            <span className="text-white font-medium">LightGBM v2.4 (Active)</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-white/[0.05]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs font-mono">
            <span className="text-zinc-400 block text-[10px]">ANOMALY DETECTOR</span>
            <span className="text-white font-medium">Isolation Forest (99.8%)</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-white/[0.05]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs font-mono">
            <span className="text-zinc-400 block text-[10px]">BEHAVIORAL DNA</span>
            <span className="text-white font-medium">10 User Profiles Tracked</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-white/[0.05]">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <div className="text-xs font-mono">
            <span className="text-zinc-400 block text-[10px]">RULE MATRIX</span>
            <span className="text-white font-medium">Speed, Envelope, Night</span>
          </div>
        </div>
      </div>

      {/* Latest Live Stream Feed Table */}
      <LiveTable
        transactions={transactions}
        onSelectTransaction={onSelectTransaction}
        title="Live Monitored Security Feed"
        subtitle="Real-time transaction stream scored by the autonomous threat engine"
        maxRows={15}
        showFilters={true}
      />
    </div>
  );
};

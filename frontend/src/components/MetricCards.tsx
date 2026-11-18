import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Activity, Coins } from 'lucide-react';
import type { DashboardMetrics, CurrencyConfig } from '../types';
import { formatCurrencyShort, getStoredCurrency } from '../utils/currency';

interface MetricCardsProps {
  metrics: DashboardMetrics | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  const [currency, setCurrency] = useState<CurrencyConfig>(getStoredCurrency());

  useEffect(() => {
    const handler = (e: any) => {
      setCurrency(e.detail || getStoredCurrency());
    };
    window.addEventListener('currency_change', handler);
    return () => window.removeEventListener('currency_change', handler);
  }, []);

  if (!metrics) return null;

  const cards = [
    {
      title: 'Live Stream Ingestion (<24h)',
      value: metrics.live_transactions_count.toLocaleString(),
      subtext: `${metrics.transactions_today_count} processed today`,
      icon: Activity,
      badge: '+100% realtime',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      glow: 'shadow-glow-safe',
    },
    {
      title: "Today's Monitored Volume",
      value: formatCurrencyShort(metrics.total_volume_today, currency),
      subtext: `Avg ${formatCurrencyShort(metrics.avg_transaction_value, currency)} / txn`,
      icon: Coins,
      badge: `${currency.code} Settlement`,
      badgeColor: 'text-indigo-300 bg-indigo-950/60 border-indigo-500/30',
      glow: '',
    },
    {
      title: 'Autonomous Intercept Rate',
      value: `${metrics.fraud_rate_percentage}%`,
      subtext: `${metrics.risk_distribution.CRITICAL + metrics.risk_distribution.HIGH} threats isolated`,
      icon: ShieldCheck,
      badge: 'Active Heuristics + ML',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      glow: 'shadow-glow-danger',
    },
    {
      title: 'Active Critical Alerts',
      value: metrics.active_critical_alerts.toString(),
      subtext: `${metrics.total_fraud_alerts} total logged alerts`,
      icon: AlertTriangle,
      badge: metrics.active_critical_alerts > 0 ? 'Requires Triage' : 'Nominal',
      badgeColor:
        metrics.active_critical_alerts > 0
          ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      glow: metrics.active_critical_alerts > 0 ? 'shadow-glow-warning' : '',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`glass-card rounded-xl p-4 transition-all duration-200 hover:border-white/[0.15] relative overflow-hidden group ${card.glow}`}
          >
            {/* Top row */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-400 font-medium tracking-tight">
                {card.title}
              </span>
              <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.06] text-zinc-300 group-hover:text-white transition-colors">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Value */}
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold tracking-tight font-mono text-white">
                {card.value}
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded border ${card.badgeColor}`}
              >
                {card.badge}
              </span>
            </div>

            {/* Subtext */}
            <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};

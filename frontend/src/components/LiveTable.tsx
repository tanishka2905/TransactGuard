import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  CreditCard, 
  Search, 
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Users
} from 'lucide-react';
import type { Transaction, RiskLevel } from '../types';
import { formatCurrencyAmount } from '../utils/currency';
import { formatLocalTime, formatRelativeTime } from '../utils/date';

interface LiveTableProps {
  transactions: Transaction[];
  onSelectTransaction: (txn: Transaction) => void;
  title?: string;
  subtitle?: string;
  maxRows?: number;
  showFilters?: boolean;
  selectedRiskFilter?: string;
  onRiskFilterChange?: (filter: string) => void;
}

export const LiveTable: React.FC<LiveTableProps> = ({
  transactions,
  onSelectTransaction,
  title,
  subtitle,
  maxRows,
  showFilters = true,
  selectedRiskFilter: controlledRiskFilter,
  onRiskFilterChange,
}) => {
  const [internalRiskFilter, setInternalRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentRiskFilter = controlledRiskFilter !== undefined ? controlledRiskFilter : internalRiskFilter;
  const setRiskFilter = (filter: string) => {
    if (onRiskFilterChange) {
      onRiskFilterChange(filter);
    } else {
      setInternalRiskFilter(filter);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // Risk filter
      if (currentRiskFilter !== 'ALL' && txn.risk_level !== currentRiskFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = txn.id.toLowerCase().includes(query);
        const matchUser = txn.user_id.toLowerCase().includes(query);
        const matchLocation = txn.location_name?.toLowerCase().includes(query) ?? false;
        const matchMethod = txn.payment_method.toLowerCase().includes(query);
        const matchMerchant = txn.merchant_category?.toLowerCase().includes(query) ?? false;
        if (!matchId && !matchUser && !matchLocation && !matchMethod && !matchMerchant) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, currentRiskFilter, searchQuery]);

  const displayedTransactions = maxRows 
    ? filteredTransactions.slice(0, maxRows) 
    : filteredTransactions;

  const getRiskBadge = (level: RiskLevel, score: number) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/40 shadow-glow-danger animate-pulse-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping-slow" />
            CRITICAL ({score})
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/40 shadow-glow-danger">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            HIGH ({score})
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            MEDIUM ({score})
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            LOW ({score})
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BLOCKED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-950/80 text-rose-300 border border-rose-800">
            BLOCKED
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950/80 text-amber-300 border border-amber-800">
            FLAGGED
          </span>
        );
      case 'APPROVED':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            APPROVED
          </span>
        );
    }
  };

  const formatTime = (isoString: string) => formatLocalTime(isoString);

  return (
    <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col">
      {/* Header and Control Bar */}
      {(title || showFilters) && (
        <div className="p-4 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 bg-zinc-950/40">
          <div>
            {title && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-white font-mono tracking-tight">{title}</h3>
                <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  {filteredTransactions.length} events
                </span>
              </div>
            )}
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter ID, user, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs rounded-lg bg-zinc-900 border border-white/[0.08] text-white placeholder-zinc-400 focus:outline-none focus:border-white/20 font-mono w-48 transition-all"
                />
              </div>

              {/* Quick Filter Badges */}
              <div className="flex items-center bg-zinc-900/90 p-1 rounded-lg border border-white/[0.06] gap-1">
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => {
                  const isActive = currentRiskFilter === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => setRiskFilter(lvl)}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-all ${
                        isActive
                          ? lvl === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40'
                            : lvl === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-300 font-semibold border border-orange-500/40'
                            : lvl === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                            : lvl === 'LOW'
                            ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                            : 'bg-zinc-800 text-white font-semibold border border-white/10'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* High-density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] bg-zinc-900/60 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              <th className="py-2.5 px-4 font-medium">Time (Local)</th>
              <th className="py-2.5 px-4 font-medium">Transaction ID</th>
              <th className="py-2.5 px-4 font-medium">User Profile</th>
              <th className="py-2.5 px-4 font-medium text-right">Amount</th>
              <th className="py-2.5 px-4 font-medium">Channel</th>
              <th className="py-2.5 px-4 font-medium">Origin Telemetry</th>
              <th className="py-2.5 px-4 font-medium">Risk Score</th>
              <th className="py-2.5 px-4 font-medium">Status</th>
              <th className="py-2.5 px-4 font-medium text-right">Inspection</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {displayedTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-zinc-600" />
                    <span className="text-zinc-400 font-mono text-xs">No transactions match current filters</span>
                    <span className="text-[11px] text-zinc-400">Trigger simulated traffic or clear search filters</span>
                  </div>
                </td>
              </tr>
            ) : (
              displayedTransactions.map((txn) => {
                const isCritical = txn.risk_level === 'CRITICAL';
                return (
                  <tr
                    key={txn.id}
                    onClick={() => onSelectTransaction(txn)}
                    className={`group cursor-pointer transition-colors duration-150 ${
                      isCritical
                        ? 'bg-rose-950/20 hover:bg-rose-950/30'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="py-2.5 px-4 font-mono text-zinc-300 tabular-nums whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white tracking-tight">
                          {formatTime(txn.timestamp)}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {formatRelativeTime(txn.timestamp)}
                        </span>
                      </div>
                    </td>

                    {/* Transaction ID */}
                    <td className="py-2.5 px-4 font-mono font-medium text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-200 group-hover:text-rose-400 transition-colors">
                          {txn.id.length > 14 ? `${txn.id.slice(0, 12)}...` : txn.id}
                        </span>
                      </div>
                    </td>

                    {/* User ID / Dual P2P Profile */}
                    <td className="py-2.5 px-4 font-mono text-zinc-300 whitespace-nowrap">
                      {txn.transaction_type === 'P2P_TRANSFER' || txn.beneficiary_user_id || txn.beneficiary_name ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-semibold text-xs">
                            <span className="text-rose-300 font-mono">{txn.user_id}</span>
                            <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="text-emerald-300 font-mono truncate max-w-[120px]">
                              {txn.beneficiary_name || txn.beneficiary_user_id || txn.beneficiary_id}
                            </span>
                          </div>
                          <span className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            <span>P2P Transfer</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-xs text-zinc-200">{txn.user_id}</span>
                          {txn.merchant_category && (
                            <span className="text-[10px] text-zinc-400 font-sans">
                              {txn.merchant_category}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-4 font-mono font-semibold text-right tabular-nums whitespace-nowrap text-white">
                      {formatCurrencyAmount(txn.amount, { code: txn.currency })}
                    </td>

                    {/* Payment Method */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06] text-zinc-300 font-mono text-[11px]">
                        <CreditCard className="w-3 h-3 text-zinc-400" />
                        {txn.payment_method}
                      </span>
                    </td>

                    {/* Location & Network */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-zinc-300 font-mono text-[11px]">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span>{txn.location_name || 'Geo Cluster Alpha'}</span>
                        </div>
                        {txn.network_type && (
                          <span className={`text-[10px] font-mono pl-4 ${txn.network_type === 'VPN/Tor' ? 'text-rose-400' : 'text-zinc-400'}`}>
                            {txn.network_type}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {getRiskBadge(txn.risk_level, txn.risk_score)}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {getStatusBadge(txn.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(txn);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                          txn.transaction_type === 'P2P_TRANSFER' || txn.beneficiary_user_id
                            ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-500/30'
                            : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-white/[0.08]'
                        }`}
                      >
                        <span>{txn.transaction_type === 'P2P_TRANSFER' || txn.beneficiary_user_id ? 'Side-by-Side' : 'XAI'}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

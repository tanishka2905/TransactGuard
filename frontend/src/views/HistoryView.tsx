import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Download, 
  SlidersHorizontal,
  MapPin
} from 'lucide-react';
import type { Transaction, RiskLevel } from '../types';
import { api } from '../services/api';
import { formatLocalDateTime } from '../utils/date';

interface HistoryViewProps {
  onSelectTransaction: (txn: Transaction) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectTransaction }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('ALL');
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
      };

      if (riskLevel !== 'ALL') params.risk_level = riskLevel;
      if (paymentMethod !== 'ALL') params.payment_method = paymentMethod;
      if (search.trim()) params.search = search.trim();

      const data = await api.getTransactionHistory(params);
      setTransactions(data);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, riskLevel, paymentMethod, search]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const resetFilters = () => {
    setSearch('');
    setRiskLevel('ALL');
    setPaymentMethod('ALL');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  };

  // Client-side amount filtering
  const displayedTransactions = transactions.filter((txn) => {
    if (minAmount && txn.amount < parseFloat(minAmount)) return false;
    if (maxAmount && txn.amount > parseFloat(maxAmount)) return false;
    return true;
  });

  const getRiskBadge = (level: RiskLevel, score: number) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/40 shadow-glow-danger">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            CRITICAL ({score})
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/40">
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

  const exportCSV = () => {
    if (displayedTransactions.length === 0) return;
    const headers = ['id', 'user_id', 'amount', 'currency', 'timestamp', 'payment_method', 'location', 'risk_score', 'risk_level', 'status'];
    const rows = displayedTransactions.map(t => [
      t.id,
      t.user_id,
      t.amount,
      t.currency,
      t.timestamp,
      t.payment_method,
      t.location_name || '',
      t.risk_score,
      t.risk_level,
      t.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactguard_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-950/70 border border-white/[0.08] glass-panel shadow-xl">
        <div>
          <h1 className="text-lg font-bold text-white font-mono tracking-tight">
            TRANSACTION AUDIT & FORENSIC ARCHIVE
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Query permanent cold & warm storage indexed with temporal velocity and feature vectors
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-mono transition-all"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-400 hover:text-white text-xs font-mono transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix Card */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] glass-panel space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
          <span>Multi-Parametric Forensic Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {/* Search Query */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search user, ID, or city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-white placeholder-zinc-400 focus:outline-none focus:border-white/20 font-mono transition-all"
            />
          </div>

          {/* Payment Method Dropdown */}
          <div>
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-zinc-200 focus:outline-none focus:border-white/20 font-mono"
            >
              <option value="ALL">Payment: All Channels</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Wire Transfer">Wire Transfer</option>
              <option value="Crypto">Crypto</option>
            </select>
          </div>

          {/* Risk Level Dropdown */}
          <div>
            <select
              value={riskLevel}
              onChange={(e) => {
                setRiskLevel(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-zinc-200 focus:outline-none focus:border-white/20 font-mono"
            >
              <option value="ALL">Risk Tier: All Levels</option>
              <option value="CRITICAL">CRITICAL (80-100)</option>
              <option value="HIGH">HIGH (60-79)</option>
              <option value="MEDIUM">MEDIUM (30-59)</option>
              <option value="LOW">LOW (0-29)</option>
            </select>
          </div>

          {/* Min Amount */}
          <div>
            <input
              type="number"
              placeholder="Min Amount (₹)"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-white placeholder-zinc-400 focus:outline-none focus:border-white/20 font-mono"
            />
          </div>

          {/* Max Amount */}
          <div>
            <input
              type="number"
              placeholder="Max Amount (₹)"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-white placeholder-zinc-400 focus:outline-none focus:border-white/20 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-zinc-900/60 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                <th className="py-2.5 px-4 font-medium">Timestamp</th>
                <th className="py-2.5 px-4 font-medium">Transaction ID</th>
                <th className="py-2.5 px-4 font-medium">User Profile</th>
                <th className="py-2.5 px-4 font-medium text-right">Amount</th>
                <th className="py-2.5 px-4 font-medium">Method</th>
                <th className="py-2.5 px-4 font-medium">Location Telemetry</th>
                <th className="py-2.5 px-4 font-medium">Risk Score</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400 font-mono">
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Querying forensic historical databases...
                  </td>
                </tr>
              ) : displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400 font-mono">
                    No historical logs found for the applied criteria.
                  </td>
                </tr>
              ) : (
                displayedTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    onClick={() => onSelectTransaction(txn)}
                    className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono text-zinc-400 tabular-nums whitespace-nowrap">
                      {formatLocalDateTime(txn.timestamp)}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-white font-medium whitespace-nowrap">
                      {txn.id}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-zinc-300 whitespace-nowrap">
                      {txn.user_id}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-right tabular-nums whitespace-nowrap text-white">
                      ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-zinc-300 whitespace-nowrap">
                      {txn.payment_method}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-zinc-300 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-400" />
                        <span>{txn.location_name || 'Standard Region'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {getRiskBadge(txn.risk_level, txn.risk_score)}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {getStatusBadge(txn.status)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(txn);
                        }}
                        className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/[0.08] text-[11px] font-mono transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-400 bg-zinc-950/40">
          <div>
            Showing <strong className="text-white">{displayedTransactions.length}</strong> records on Page <strong className="text-white">{page}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.08] text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={displayedTransactions.length < pageSize || loading}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.08] text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

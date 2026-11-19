import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  Loader2 
} from 'lucide-react';
import type { FraudAlert, AlertStatus, Transaction } from '../types';
import { api } from '../services/api';

interface AlertsViewProps {
  onSelectTransaction: (txn: Transaction) => void;
  onAlertUpdated?: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  onSelectTransaction,
  onAlertUpdated,
}) => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts(
        statusFilter !== 'ALL' ? statusFilter : undefined,
        riskFilter !== 'ALL' ? riskFilter : undefined
      );
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, riskFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // FEATURE 3: Real-Time Alert Resolution Synchrony on Self-Healing Unblock
  useEffect(() => {
    const handleAlertResolved = (e: any) => {
      const payload = e.detail;
      const resolvedTxnId = payload?.transaction_id || payload?.id;
      const resolvedAlertId = payload?.alert_id;

      setAlerts((prev) => {
        // If filtering by NEW or active alerts, filter it out immediately
        if (statusFilter === 'NEW' || statusFilter === 'REVIEWING') {
          return prev.filter(
            (a) => a.id !== resolvedAlertId && a.transaction_id !== resolvedTxnId
          );
        }
        // Otherwise, mark its status as RESOLVED
        return prev.map((a) => {
          if (a.id === resolvedAlertId || a.transaction_id === resolvedTxnId) {
            return {
              ...a,
              status: 'RESOLVED' as AlertStatus,
              analyst_notes: 'Self-healing resolved: User verified and confirmed as genuine.'
            };
          }
          return a;
        });
      });

      if (onAlertUpdated) onAlertUpdated();
    };

    window.addEventListener('alert_resolved', handleAlertResolved);
    window.addEventListener('transaction_unblocked', handleAlertResolved);

    return () => {
      window.removeEventListener('alert_resolved', handleAlertResolved);
      window.removeEventListener('transaction_unblocked', handleAlertResolved);
    };
  }, [statusFilter, onAlertUpdated]);

  const handleStatusChange = async (alertId: string, newStatus: AlertStatus) => {
    try {
      setUpdatingId(alertId);
      await api.updateAlertStatus(alertId, newStatus, `Analyst marked as ${newStatus}`);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
      );
      if (onAlertUpdated) onAlertUpdated();
    } catch (err) {
      console.error('Failed to update alert status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInspect = async (alert: FraudAlert) => {
    if (alert.transaction) {
      onSelectTransaction(alert.transaction);
    } else {
      try {
        const txn = await api.getTransactionDetails(alert.transaction_id);
        onSelectTransaction(txn);
      } catch (e) {
        console.error('Could not fetch transaction for alert:', e);
      }
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            NEW INCIDENT
          </span>
        );
      case 'REVIEWING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
            IN REVIEW
          </span>
        );
      case 'CONFIRMED_FRAUD':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700 shadow-glow-danger">
            CONFIRMED THREAT
          </span>
        );
      case 'FALSE_POSITIVE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
            FALSE POSITIVE
          </span>
        );
      case 'RESOLVED':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            RESOLVED
          </span>
        );
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = alert.id.toLowerCase().includes(q);
      const matchTxn = alert.transaction_id.toLowerCase().includes(q);
      const matchUser = alert.user_id.toLowerCase().includes(q);
      if (!matchId && !matchTxn && !matchUser) return false;
    }
    return true;
  });

  const newCount = alerts.filter((a) => a.status === 'NEW').length;
  const reviewingCount = alerts.filter((a) => a.status === 'REVIEWING').length;
  const confirmedCount = alerts.filter((a) => a.status === 'CONFIRMED_FRAUD').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED' || a.status === 'FALSE_POSITIVE').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-950/70 border border-white/[0.08] glass-panel shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shadow-glow-danger">
            <Bell className="w-5 h-5 text-rose-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white font-mono tracking-tight">
                FRAUD INCIDENT TRIAGE QUEUE
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                ACTIVE AUDIT PIPELINE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Autonomous escalation queue requiring human-in-the-loop validation or automated settlement hold
            </p>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-400' : 'text-zinc-400'}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Triage Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] font-mono">
          <span className="text-[11px] text-zinc-400 block">NEW INCIDENTS</span>
          <span className="text-2xl font-bold text-rose-400 mt-1 block">{newCount}</span>
          <span className="text-[10px] text-zinc-400">Needs immediate review</span>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] font-mono">
          <span className="text-[11px] text-zinc-400 block">UNDER INVESTIGATION</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">{reviewingCount}</span>
          <span className="text-[10px] text-zinc-400">Assigned to analysts</span>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] font-mono">
          <span className="text-[11px] text-zinc-400 block">CONFIRMED FRAUD</span>
          <span className="text-2xl font-bold text-rose-300 mt-1 block">{confirmedCount}</span>
          <span className="text-[10px] text-zinc-400">Blocked & card frozen</span>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] font-mono">
          <span className="text-[11px] text-zinc-400 block">CLOSED / RESOLVED</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">{resolvedCount}</span>
          <span className="text-[10px] text-zinc-400">Settled or false positive</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search Alert ID, Transaction ID, or User ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-white placeholder-zinc-400 focus:outline-none focus:border-white/20 text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-zinc-300 text-xs font-mono focus:outline-none"
          >
            <option value="ALL">Status: All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="REVIEWING">REVIEWING</option>
            <option value="CONFIRMED_FRAUD">CONFIRMED FRAUD</option>
            <option value="FALSE_POSITIVE">FALSE POSITIVE</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-zinc-300 text-xs font-mono focus:outline-none"
          >
            <option value="ALL">Risk: All Tiers</option>
            <option value="CRITICAL">CRITICAL (80-100)</option>
            <option value="HIGH">HIGH (60-79)</option>
            <option value="MEDIUM">MEDIUM (30-59)</option>
            <option value="LOW">LOW (0-29)</option>
          </select>
        </div>
      </div>

      {/* Alerts Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-panel p-12 text-center text-zinc-400 font-mono text-xs rounded-2xl">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-400" />
            Loading fraud incidents...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="glass-panel p-12 text-center text-zinc-400 font-mono text-xs rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
            No active incidents matching the selected criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isUpdating = updatingId === alert.id;
            return (
              <div
                key={alert.id}
                className="glass-panel rounded-2xl p-4 border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-white text-sm">
                          {alert.id}
                        </span>
                        {getStatusBadge(alert.status)}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          {alert.risk_level} ({alert.risk_score} pts)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        Target User: <strong className="text-zinc-200">{alert.user_id}</strong> · Ref Txn: <strong className="text-zinc-300">{alert.transaction_id}</strong> · Reported: {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Forensic Inspect Button */}
                  <button
                    onClick={() => handleInspect(alert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-mono border border-white/[0.08] transition-colors"
                  >
                    <span>Inspect XAI Telemetry</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Reason Pills */}
                {alert.reasons && alert.reasons.length > 0 && (
                  <div className="mb-3 p-2.5 rounded-xl bg-zinc-950/60 border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">
                      Causal Trigger Factors
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {alert.reasons.map((r, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-mono"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions / Triage Workflow Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06] text-xs font-mono">
                  <span className="text-zinc-400">
                    Analyst Actions:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {alert.status !== 'REVIEWING' && (
                      <button
                        onClick={() => handleStatusChange(alert.id, 'REVIEWING')}
                        disabled={isUpdating}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-white/[0.06] text-[11px] transition-colors"
                      >
                        Start Review
                      </button>
                    )}

                    {alert.status !== 'CONFIRMED_FRAUD' && (
                      <button
                        onClick={() => handleStatusChange(alert.id, 'CONFIRMED_FRAUD')}
                        disabled={isUpdating}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition-colors"
                      >
                        Confirm Fraud (Block User)
                      </button>
                    )}

                    {alert.status !== 'FALSE_POSITIVE' && (
                      <button
                        onClick={() => handleStatusChange(alert.id, 'FALSE_POSITIVE')}
                        disabled={isUpdating}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-white/[0.06] text-[11px] transition-colors"
                      >
                        False Positive
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleStatusChange(alert.id, 'RESOLVED')}
                        disabled={isUpdating}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

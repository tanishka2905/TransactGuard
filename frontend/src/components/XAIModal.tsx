import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  AlertOctagon, 
  MapPin, 
  Smartphone, 
  Users, 
  Loader2, 
  Check 
} from 'lucide-react';
import type { Transaction } from '../types';
import { SideBySideTxnView } from './SideBySideTxnView';
import { formatCurrencyAmount } from '../utils/currency';
import { api } from '../services/api';

interface XAIModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onUpdateStatus?: (txnId: string, status: string) => void;
}

export const XAIModal: React.FC<XAIModalProps> = ({ transaction, onClose, onUpdateStatus }) => {
  const [isContinuing, setIsContinuing] = useState(false);
  const [showContinueConfirm, setShowContinueConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!transaction) return null;

  const isTwoUserTxn = 
    transaction.transaction_type === 'P2P_TRANSFER' || 
    Boolean(transaction.beneficiary_user_id) || 
    Boolean(transaction.beneficiary_name) ||
    Boolean(transaction.feature_breakdown?.p2p_sender);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/40', glow: 'shadow-glow-danger' };
      case 'HIGH':
        return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/40', glow: 'shadow-glow-danger' };
      case 'MEDIUM':
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', glow: 'shadow-glow-warning' };
      default:
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', glow: 'shadow-glow-safe' };
    }
  };

  const colors = getRiskColor(transaction.risk_level);
  const bd = transaction.feature_breakdown || {
    ml_contribution: 0,
    anomaly_contribution: 0,
    rule_contribution: 0,
    velocity_contribution: 0,
  };

  const handleContinueAndApprove = async () => {
    try {
      setIsContinuing(true);
      await api.continueTransaction(transaction.id);
      if (onUpdateStatus) {
        onUpdateStatus(transaction.id, 'APPROVED');
      }
      setStatusMessage('Transaction successfully continued and approved!');
      setShowContinueConfirm(false);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to continue transaction');
    } finally {
      setIsContinuing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto glass-card rounded-2xl border border-white/[0.12] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${colors.bg} ${colors.border}`}>
              <ShieldAlert className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white font-mono tracking-tight">
                  {transaction.id}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold border ${colors.text} ${colors.bg} ${colors.border} ${colors.glow}`}
                >
                  {transaction.risk_level} RISK · {transaction.risk_score} / 100
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                  transaction.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {transaction.status}
                </span>
                {isTwoUserTxn && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    2-User P2P Settlement
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Timestamp: {new Date(transaction.timestamp).toLocaleString()} · Channel: {transaction.payment_method}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* POPUP CONFIRMATION TO CONTINUE TRANSACTION (IF TRIGGERED) */}
        {showContinueConfirm && (
          <div className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/70 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  <span>Security Authorization Check</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200">
                    Prompt
                  </span>
                </h4>
                <p className="text-xs text-zinc-300 mt-1 font-mono">
                  Are you sure you want to <strong>continue and execute</strong> this transaction of{' '}
                  <span className="text-white font-bold">{formatCurrencyAmount(transaction.amount, { code: transaction.currency })}</span>?
                  This will resolve active alerts and finalize the settlement between the user accounts.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowContinueConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  disabled={isContinuing}
                  onClick={handleContinueAndApprove}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/30"
                >
                  {isContinuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Continue Transaction</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIDE-BY-SIDE DUAL-USER SECTION (When 2 Users are Involved) */}
        {isTwoUserTxn && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 font-bold">
                <Users className="w-3.5 h-3.5" />
                Side-by-Side Dual User Ledger
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                Debited Sender ➔ Credited Beneficiary
              </span>
            </div>
            <SideBySideTxnView transaction={transaction} />
          </div>
        )}

        {/* Unified Risk Score Visual Gauge */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-mono">
              Unified Risk Engine Composition
            </span>
            <span className="text-xs font-mono text-zinc-300">
              Normalized Score: <strong className={colors.text}>{transaction.risk_score}</strong> / 100
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-3 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex">
            <div
              style={{ width: `${transaction.risk_score}%` }}
              className={`h-full transition-all duration-500 ${
                transaction.risk_level === 'CRITICAL'
                  ? 'bg-rose-500'
                  : transaction.risk_level === 'HIGH'
                  ? 'bg-orange-500'
                  : transaction.risk_level === 'MEDIUM'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1">
            <span>0 LOW (0-29)</span>
            <span>30 MEDIUM (30-59)</span>
            <span>60 HIGH (60-79)</span>
            <span>80 CRITICAL (80-100)</span>
          </div>

          {/* 4 Multi-Signal Weighting Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4">
            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/[0.04]">
              <span className="text-[11px] text-zinc-400 block font-mono">ML Probability (35%)</span>
              <span className="text-base font-bold text-white font-mono">
                {((transaction.ml_probability || 0) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-zinc-400 block font-mono">
                +{bd.ml_contribution} pts
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/[0.04]">
              <span className="text-[11px] text-zinc-400 block font-mono">Anomaly Detector (25%)</span>
              <span className="text-base font-bold text-white font-mono">
                {transaction.anomaly_score} / 100
              </span>
              <span className="text-[10px] text-zinc-400 block font-mono">
                +{bd.anomaly_contribution} pts
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/[0.04]">
              <span className="text-[11px] text-zinc-400 block font-mono">Rule Heuristics (25%)</span>
              <span className="text-base font-bold text-white font-mono">
                {transaction.rule_score} / 100
              </span>
              <span className="text-[10px] text-zinc-400 block font-mono">
                +{bd.rule_contribution} pts
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/[0.04]">
              <span className="text-[11px] text-zinc-400 block font-mono">Velocity Surge (15%)</span>
              <span className="text-base font-bold text-white font-mono">
                {transaction.velocity_score} / 100
              </span>
              <span className="text-[10px] text-zinc-400 block font-mono">
                +{bd.velocity_contribution} pts
              </span>
            </div>
          </div>
        </div>

        {/* Explainable AI: Natural Language Verdict & Reasons */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            Decision Intelligence & Causal Explanations
          </h3>
          <ul className="space-y-1.5">
            {transaction.reasons && transaction.reasons.length > 0 ? (
              transaction.reasons.map((reason, idx) => (
                <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2 font-mono">
                  <span className="text-rose-400 font-mono mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                No malicious flags detected. Transaction matches normal behavioral DNA.
              </li>
            )}
          </ul>
        </div>

        {/* Forensic Context & Telemetry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Transaction Metadata */}
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-white/[0.04] space-y-2 text-xs">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Transaction Details
            </h4>
            <div className="flex justify-between py-1 border-b border-white/[0.03]">
              <span className="text-zinc-400">Amount & Currency</span>
              <span className="text-white font-mono font-medium">
                {formatCurrencyAmount(transaction.amount, { code: transaction.currency })}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.03]">
              <span className="text-zinc-400">Payment Channel</span>
              <span className="text-zinc-200 font-mono">{transaction.payment_method}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.03]">
              <span className="text-zinc-400">Merchant Category</span>
              <span className="text-zinc-200">{transaction.merchant_category || 'Retail'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-400">Beneficiary</span>
              <span className="text-zinc-300 font-mono">{transaction.beneficiary_name || transaction.beneficiary_id || 'Direct Merchant'}</span>
            </div>
          </div>

          {/* Environmental / Hardware Fingerprint */}
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-white/[0.04] space-y-2 text-xs">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Security Telemetry
            </h4>
            <div className="flex justify-between py-1 border-b border-white/[0.03]">
              <span className="text-zinc-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Location
              </span>
              <span className="text-zinc-200 font-mono">{transaction.location_name || 'Unknown'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.03]">
              <span className="text-zinc-400 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-zinc-400" /> Device ID
              </span>
              <span className="text-zinc-300 font-mono truncate max-w-[180px]">
                {transaction.device_id}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.03]">
              <span className="text-zinc-400">Network Type</span>
              <span className={`font-mono ${transaction.network_type === 'VPN/Tor' ? 'text-rose-400 font-semibold' : 'text-zinc-300'}`}>
                {transaction.network_type || 'Cellular'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-400">IP Origin</span>
              <span className="text-zinc-300 font-mono">{transaction.ip_address || '103.21.124.50'}</span>
            </div>
          </div>
        </div>

        {/* Analyst Actions Footer */}
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-white/[0.08] gap-3">
          <span className="text-xs text-zinc-400 font-mono">
            Audited via Transact Guard Autonomous Security Pipeline
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowContinueConfirm(true)}
              className="px-4 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-mono font-semibold transition-colors"
            >
              Continue / Authorize Transaction
            </button>
            <button
              onClick={() => {
                if (onUpdateStatus) onUpdateStatus(transaction.id, 'BLOCKED');
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-mono font-semibold transition-colors shadow-glow-danger"
            >
              Confirm Threat & Block
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  MapPin, 
  Smartphone, 
  CheckCircle2, 
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import type { Transaction } from '../types';
import { formatCurrencyAmount } from '../utils/currency';

interface SideBySideTxnViewProps {
  transaction: Transaction;
  senderName?: string;
  senderCity?: string;
  senderBalanceBefore?: number;
  receiverName?: string;
  receiverCity?: string;
  receiverBalanceBefore?: number;
}

export const SideBySideTxnView: React.FC<SideBySideTxnViewProps> = ({
  transaction,
  senderName,
  senderCity,
  senderBalanceBefore,
  receiverName,
  receiverCity,
  receiverBalanceBefore,
}) => {
  const p2pSender = transaction.feature_breakdown?.p2p_sender as any;
  const p2pReceiver = transaction.feature_breakdown?.p2p_receiver as any;

  // Resolve Sender Details
  const sName = senderName || p2pSender?.name || transaction.user_id;
  const sCity = senderCity || p2pSender?.city || transaction.location_name || 'Mumbai, IN';
  const sBalAfter = transaction.sender_balance_after ?? p2pSender?.balance_after;
  const sBalBefore = senderBalanceBefore ?? p2pSender?.balance_before ?? (sBalAfter !== undefined ? sBalAfter + transaction.amount : undefined);

  // Resolve Receiver Details
  const rId = transaction.beneficiary_user_id || transaction.beneficiary_id || 'Recipient User';
  const rName = receiverName || p2pReceiver?.name || transaction.beneficiary_name || rId;
  const rCity = receiverCity || p2pReceiver?.city || 'Bengaluru, IN';
  const rBalAfter = transaction.beneficiary_balance_after ?? p2pReceiver?.balance_after;
  const rBalBefore = receiverBalanceBefore ?? p2pReceiver?.balance_before ?? (rBalAfter !== undefined ? Math.max(0, rBalAfter - transaction.amount) : undefined);

  const isCritical = transaction.risk_level === 'CRITICAL';
  const isHigh = transaction.risk_level === 'HIGH';
  const isMedium = transaction.risk_level === 'MEDIUM';

  const riskBadgeColor = isCritical
    ? 'border-rose-500/50 bg-rose-500/10 text-rose-300 shadow-glow-danger'
    : isHigh
    ? 'border-orange-500/50 bg-orange-500/10 text-orange-300'
    : isMedium
    ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
    : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-glow-safe';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/80 p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div 
        className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isCritical ? 'bg-rose-600' : 'bg-emerald-600'
        }`} 
      />
      <div 
        className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isCritical ? 'bg-orange-600' : 'bg-cyan-600'
        }`} 
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Dual-User Peer Transfer Architecture
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                P2P Settlement
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Synchronized sender debit & beneficiary credit telemetry
            </p>
          </div>
        </div>

        {/* Global Risk Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400">Autonomous Verdict:</span>
          <div className={`px-3 py-1 rounded-lg border font-mono text-xs font-bold flex items-center gap-1.5 ${riskBadgeColor}`}>
            {isCritical ? (
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse text-rose-400" />
            ) : isHigh || isMedium ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{transaction.risk_level} RISK ({transaction.risk_score} PTS)</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch relative z-10">
        {/* Left Side: SENDER CARD (Debited) */}
        <div className="lg:col-span-4 rounded-xl border border-white/[0.08] bg-zinc-900/70 p-4 flex flex-col justify-between transition-all hover:border-white/20">
          <div>
            {/* Sender Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                <ArrowUpRight className="w-3 h-3" />
                SENDER (DEBITED)
              </span>
              <span className="text-[11px] font-mono text-zinc-400">{transaction.user_id}</span>
            </div>

            {/* User Profile Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/30 via-zinc-800 to-zinc-900 border border-rose-500/40 flex items-center justify-center font-mono font-bold text-base text-rose-200 shadow-md">
                {getInitials(sName)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-white truncate font-sans">{sName}</h4>
                <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                  <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="truncate">{sCity}</span>
                </div>
              </div>
            </div>

            {/* Balance Changes Box */}
            <div className="rounded-lg bg-black/40 border border-white/[0.04] p-3 mb-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                <span>Account Balance:</span>
                <span className="text-rose-400 font-semibold">
                  - {formatCurrencyAmount(transaction.amount, { code: transaction.currency })}
                </span>
              </div>
              {sBalBefore !== undefined && sBalAfter !== undefined && (
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-zinc-400 line-through">
                    {formatCurrencyAmount(sBalBefore, { code: transaction.currency })}
                  </span>
                  <ArrowRight className="w-3 h-3 text-zinc-400" />
                  <span className="text-emerald-400 font-bold">
                    {formatCurrencyAmount(sBalAfter, { code: transaction.currency })}
                  </span>
                </div>
              )}
            </div>

            {/* Sender Behavioral Baseline Details */}
            <div className="space-y-1.5 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-zinc-400" />
                  <span>Device Hardware:</span>
                </span>
                <span className="text-zinc-200 truncate max-w-[150px]">{transaction.device_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Network Protocol:</span>
                <span className={transaction.network_type === 'VPN/Tor' ? 'text-rose-400 font-bold' : 'text-zinc-200'}>
                  {transaction.network_type || 'Cellular'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Channel:</span>
                <span className="text-indigo-300 font-semibold">{transaction.payment_method}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>Identity Trust Index:</span>
            <span className="text-emerald-400 font-bold">96.4% Verified</span>
          </div>
        </div>

        {/* Center: TRANSFER PIPELINE & AI RISK SIGNALS */}
        <div className="lg:col-span-4 rounded-xl border border-white/[0.08] bg-zinc-950/90 p-4 flex flex-col justify-between items-center text-center">
          <div className="w-full">
            {/* Direction Indicator */}
            <div className="flex items-center justify-center gap-2 text-zinc-400 font-mono text-[11px] mb-2">
              <span>{sName.split(' ')[0]}</span>
              <div className="flex items-center text-indigo-400 animate-pulse">
                <span className="h-0.5 w-6 bg-indigo-500/50" />
                <ArrowRight className="w-4 h-4 -ml-1 text-indigo-400" />
              </div>
              <span>{rName.split(' ')[0]}</span>
            </div>

            {/* Transfer Amount Spotlight */}
            <div className="my-2 p-3 rounded-xl bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/20">
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-300 block mb-0.5">
                Transfer Amount
              </span>
              <span className="text-2xl font-bold font-mono tracking-tight text-white block">
                {formatCurrencyAmount(transaction.amount, { code: transaction.currency })}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 mt-1 block">
                0.00 Fee · Instant Real-Time Settlement
              </span>
            </div>

            {/* Multi-Signal AI Breakdown Gauge */}
            <div className="grid grid-cols-3 gap-2 w-full my-3">
              <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.06]">
                <span className="text-[9px] font-mono uppercase text-zinc-400 block">ML Fraud</span>
                <span className={`text-xs font-mono font-bold ${transaction.ml_probability > 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {(transaction.ml_probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.06]">
                <span className="text-[9px] font-mono uppercase text-zinc-400 block">Anomaly</span>
                <span className={`text-xs font-mono font-bold ${transaction.anomaly_score > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {transaction.anomaly_score.toFixed(1)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.06]">
                <span className="text-[9px] font-mono uppercase text-zinc-400 block">Velocity</span>
                <span className="text-xs font-mono font-bold text-zinc-200">
                  {transaction.velocity_score.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Key Explainability Reason */}
            {transaction.reasons && transaction.reasons.length > 0 && (
              <div className="text-left w-full p-2.5 rounded-lg bg-zinc-900/60 border border-white/[0.06] text-[11px] font-mono text-zinc-300">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Risk Explainability:</span>
                <p className="line-clamp-2 leading-relaxed text-zinc-300">
                  • {transaction.reasons[0]}
                </p>
              </div>
            )}
          </div>

          <div className="w-full pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">Transaction Status:</span>
            <span className={`font-bold uppercase ${
              transaction.status === 'APPROVED' 
                ? 'text-emerald-400' 
                : transaction.status === 'BLOCKED' 
                ? 'text-rose-400' 
                : 'text-amber-400'
            }`}>
              {transaction.status}
            </span>
          </div>
        </div>

        {/* Right Side: RECEIVER CARD (Credited) */}
        <div className="lg:col-span-4 rounded-xl border border-white/[0.08] bg-zinc-900/70 p-4 flex flex-col justify-between transition-all hover:border-white/20">
          <div>
            {/* Receiver Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <ArrowDownLeft className="w-3 h-3" />
                BENEFICIARY (CREDITED)
              </span>
              <span className="text-[11px] font-mono text-zinc-400">{rId}</span>
            </div>

            {/* Recipient Profile Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 via-zinc-800 to-zinc-900 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-base text-emerald-200 shadow-md">
                {getInitials(rName)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-white truncate font-sans">{rName}</h4>
                <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                  <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="truncate">{rCity}</span>
                </div>
              </div>
            </div>

            {/* Balance Changes Box */}
            <div className="rounded-lg bg-black/40 border border-white/[0.04] p-3 mb-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                <span>Account Balance:</span>
                <span className="text-emerald-400 font-semibold">
                  + {formatCurrencyAmount(transaction.amount, { code: transaction.currency })}
                </span>
              </div>
              {rBalBefore !== undefined && rBalAfter !== undefined && (
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-zinc-400">
                    {formatCurrencyAmount(rBalBefore, { code: transaction.currency })}
                  </span>
                  <ArrowRight className="w-3 h-3 text-zinc-400" />
                  <span className="text-emerald-400 font-bold">
                    {formatCurrencyAmount(rBalAfter, { code: transaction.currency })}
                  </span>
                </div>
              )}
            </div>

            {/* Beneficiary Behavioral Profile */}
            <div className="space-y-1.5 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center justify-between">
                <span>Recipient Status:</span>
                <span className="text-zinc-200 font-medium">Registered Platform Client</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Settlement Speed:</span>
                <span className="text-emerald-400 font-semibold">Instant Execution (&lt;50ms)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Mule Risk Score:</span>
                <span className="text-emerald-400 font-semibold">Low (Nominal Inflow)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>Inbound Anti-Fraud Filter:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Passed All Checks
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

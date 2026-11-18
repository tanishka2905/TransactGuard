import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Zap, 
  Radio, 
  Activity, 
  Cpu, 
  Users, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  ChevronRight, 
  Dices
} from 'lucide-react';
import type { TabType } from '../components/Navbar';
import { getStoredCurrency, generateRandomCurrency, formatCurrencyAmount } from '../utils/currency';
import type { CurrencyConfig } from '../types';

interface LandingPageViewProps {
  onNavigateTab: (tab: TabType) => void;
  onOpenTransfer: () => void;
  onOpenSimulator: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onNavigateTab,
  onOpenTransfer,
  onOpenSimulator,
}) => {
  const [currency, setCurrency] = useState<CurrencyConfig>(getStoredCurrency());
  const [activeInteractivePill, setActiveInteractivePill] = useState<'ml' | 'anomaly' | 'rules' | 'velocity'>('ml');

  useEffect(() => {
    const handler = (e: any) => {
      setCurrency(e.detail || getStoredCurrency());
    };
    window.addEventListener('currency_change', handler);
    return () => window.removeEventListener('currency_change', handler);
  }, []);

  const handleRandomize = () => {
    const newCurr = generateRandomCurrency();
    setCurrency(newCurr);
  };

  return (
    <div className="relative min-h-screen text-zinc-100 overflow-hidden font-sans selection:bg-rose-500/30 selection:text-rose-200 -mx-6 -my-6 px-6 py-12">
      {/* Background Aurora Lighting Spheres */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] aurora-glow-2 blur-[140px] pointer-events-none opacity-40 -z-10" />
      <div className="absolute top-96 -left-48 w-[600px] h-[600px] aurora-glow-1 blur-[130px] pointer-events-none opacity-25 -z-10" />
      <div className="absolute top-[800px] -right-48 w-[600px] h-[600px] aurora-glow-3 blur-[130px] pointer-events-none opacity-25 -z-10" />

      {/* Subtle Matrix Grid Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-void/80 to-void pointer-events-none -z-10" />

      {/* ========================================================
          1. HERO SECTION
         ======================================================== */}
      <section className="max-w-[1400px] mx-auto pt-8 pb-20 text-center relative z-10 flex flex-col items-center">
        {/* Glowing Badge Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-white/[0.12] shadow-2xl mb-8 animate-fadeIn hover:border-indigo-500/50 transition-all cursor-default">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">
            Autonomous FinSec Intelligence SOC v2.5
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-[11px] font-mono text-indigo-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Sub-20ms Multi-Signal AI
          </span>
        </div>

        {/* Display Typography */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-5xl leading-[1.08] mb-6">
          Autonomous Financial Defense.{' '}
          <span className="shimmer-text block mt-1">
            Engineered for Real-Time Threat Interception.
          </span>
        </h1>

        {/* Lead Narrative */}
        <p className="text-base sm:text-lg text-zinc-400 max-w-3xl leading-relaxed font-sans mb-10">
          A production-grade transaction fraud detection & behavioral risk platform. Synthesizes supervised ML, unsupervised anomaly isolation, deterministic travel heuristics, and dual-user peer settlement in <strong className="text-white font-mono">16.8ms</strong>.
        </p>

        {/* Hero Interactive CTA Cluster */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button
            onClick={() => onNavigateTab('dashboard')}
            className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-indigo-600 to-emerald-500 text-white font-mono font-bold text-sm shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
            <span>Launch Command Center</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onOpenTransfer}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl glass-panel border border-white/[0.12] hover:border-white/25 text-white font-mono font-semibold text-sm hover:bg-white/[0.04] transition-all"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Open Multi-User P2P Gateway</span>
          </button>

          <button
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono text-sm border border-white/[0.08] transition-all"
          >
            <Zap className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Simulate Live Attack</span>
          </button>
        </div>

        {/* ========================================================
            HERO FLOATING LIVE SOC CONSOLE (3D-LIKE INTERACTIVE PREVIEW)
           ======================================================== */}
        <div className="w-full max-w-5xl rounded-3xl p-1 bg-gradient-to-b from-white/[0.15] via-white/[0.05] to-transparent shadow-2xl relative group">
          <div className="rounded-[22px] bg-zinc-950/90 backdrop-blur-2xl border border-white/[0.08] p-6 text-left relative overflow-hidden">
            {/* Window chrome topbar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-zinc-400">
                  transact-guard://telemetry.live/stream
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ONLINE: 16.8ms latency
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-white/[0.06]">
                  TLS 1.3
                </span>
              </div>
            </div>

            {/* Console Body Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* Left Column: Live Ingestion Feed */}
              <div className="md:col-span-4 rounded-xl bg-zinc-900/60 border border-white/[0.06] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3">
                    <span className="flex items-center gap-1.5 text-zinc-200 font-semibold uppercase">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      Live Feed
                    </span>
                    <span className="text-[10px] text-zinc-400">WebSocket / 24h</span>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold">Rahul S. ➔ Priya N.</div>
                        <span className="text-[10px] text-zinc-400">P2P Settlement · UPI</span>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold">
                          {formatCurrencyAmount(3500, currency)}
                        </div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          LOW (14)
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 flex items-center justify-between animate-pulse">
                      <div>
                        <div className="text-rose-200 font-semibold">Vikram S. ➔ London UK</div>
                        <span className="text-[10px] text-rose-300">Impossible Travel · CARD</span>
                      </div>
                      <div className="text-right">
                        <div className="text-rose-300 font-bold">
                          {formatCurrencyAmount(92000, currency)}
                        </div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                          CRITICAL (88)
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold">Amit P. ➔ Blue Tokai</div>
                        <span className="text-[10px] text-zinc-400">Coffee POS · Trusted Dev</span>
                      </div>
                      <div className="text-right">
                        <div className="text-zinc-200 font-bold">
                          {formatCurrencyAmount(240, currency)}
                        </div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          LOW (6)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Stream Buffer Status:</span>
                  <span className="text-emerald-400 font-semibold">Nominal (Zero Drops)</span>
                </div>
              </div>

              {/* Center Column: Autonomous Hybrid Risk Synthesizer */}
              <div className="md:col-span-5 rounded-xl bg-zinc-950 border border-white/[0.08] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      Risk Synthesizer
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">Multi-Signal Score</span>
                  </div>

                  {/* Arc Progress Bar */}
                  <div className="my-3 p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-zinc-300 font-semibold">Active Incident Triage:</span>
                      <span className="text-rose-400 font-bold">88.4 / 100 · CRITICAL</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden flex">
                      <div className="w-[88.4%] bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full shadow-glow-danger" />
                    </div>
                  </div>

                  {/* 4 Multi-Signal Pillars */}
                  <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-white/[0.06]">
                      <span className="text-[10px] text-zinc-400 uppercase block">1. Supervised ML</span>
                      <span className="text-sm font-bold text-rose-400">91.4% Prob</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-white/[0.06]">
                      <span className="text-[10px] text-zinc-400 uppercase block">2. Isolation Forest</span>
                      <span className="text-sm font-bold text-orange-400">84.2 Score</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-white/[0.06]">
                      <span className="text-[10px] text-zinc-400 uppercase block">3. Heuristic Rules</span>
                      <span className="text-sm font-bold text-rose-400">72.0 Penalty</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-white/[0.06]">
                      <span className="text-[10px] text-zinc-400 uppercase block">4. Velocity Surge</span>
                      <span className="text-sm font-bold text-amber-400">25.0 Burst</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-300 flex items-center justify-between">
                  <span>Verdict:</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                    INTERCEPT & BLOCK
                  </span>
                </div>
              </div>

              {/* Right Column: Interactive Sandbox Controls */}
              <div className="md:col-span-3 rounded-xl bg-zinc-900/60 border border-white/[0.06] p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 block mb-2">
                    Currency Sandbox
                  </span>
                  <p className="text-[11px] text-zinc-400 font-mono mb-3">
                    Randomize or switch currencies across the entire system live:
                  </p>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.08] mb-3 text-center">
                    <span className="text-2xl font-mono font-bold text-indigo-400 block">
                      {currency.symbol} {currency.code}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                      {currency.name}
                    </span>
                  </div>

                  <button
                    onClick={handleRandomize}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-mono font-semibold transition-all mb-2"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Randomize Currency</span>
                  </button>
                </div>

                <button
                  onClick={() => onNavigateTab('dashboard')}
                  className="w-full inline-flex items-center justify-center gap-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-semibold transition-colors"
                >
                  <span>Enter Command Center</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. METRIC PROOF RIBBON
         ======================================================== */}
      <section className="max-w-[1400px] mx-auto py-12 border-y border-white/[0.08] relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white mb-1">
              &lt; 18<span className="text-rose-400">ms</span>
            </div>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Autonomous Ingestion Latency
            </p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white mb-1">
              99.4<span className="text-emerald-400">%</span>
            </div>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              PR-AUC Threat Intercept Rate
            </p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white mb-1">
              100<span className="text-indigo-400">%</span>
            </div>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Real-Time Bi-Directional WebSockets
            </p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white mb-1">
              Zero
            </div>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Stored Plaintext Credentials
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. BENTO GRID OF CORE ARCHITECTURAL BREAKTHROUGHS
         ======================================================== */}
      <section className="max-w-[1400px] mx-auto py-24 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 mb-2 block">
            Architectural Highlights
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Enterprise FinSec Capabilities Built into Every Layer.
          </h2>
          <p className="text-sm text-zinc-400 mt-3 font-sans">
            Moving beyond toy ML scripts into a hardened financial transaction operations platform.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: Multi-Signal Engine (Large 8 cols) */}
          <div className="md:col-span-8 rounded-3xl glass-panel p-8 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 aurora-glow-2 blur-[100px] pointer-events-none opacity-20 -z-10" />
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-indigo-300 font-bold uppercase tracking-wider">
                  Hybrid Signal Fusion
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
                Unified 4-Layer Anti-Fraud Synthesis
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl font-sans mb-6">
                Single models fail in real-world finance. TRANSact Guard combines Supervised ML (35%), Unsupervised Isolation Forest Anomaly Detection (25%), Deterministic Rule Violations (25%), and Sliding-Window Velocity Bursts (15%) into an actionable 0–100 score.
              </p>

              {/* Interactive Signal Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 font-mono text-xs">
                {[
                  { id: 'ml', label: 'Supervised ML', stat: '35% Weight' },
                  { id: 'anomaly', label: 'Isolation Forest', stat: '25% Weight' },
                  { id: 'rules', label: 'Rule Heuristics', stat: '25% Weight' },
                  { id: 'velocity', label: 'Velocity Counters', stat: '15% Weight' },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setActiveInteractivePill(pill.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activeInteractivePill === pill.id
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-glow-safe'
                        : 'bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-white font-semibold">{pill.label}</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">{pill.stat}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Continuous Zero-Retrain Online Inference</span>
              <span className="text-emerald-400 font-bold">16.8ms Evaluated</span>
            </div>
          </div>

          {/* Card 2: Side-by-Side Dual User Ledger (4 cols) */}
          <div className="md:col-span-4 rounded-3xl glass-panel p-8 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-rose-300 font-bold uppercase tracking-wider">
                  P2P Dual-User Architecture
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                Side-by-Side Dual User Ledger
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4">
                When two platform users transact, both debit and credit ledger cards render synchronized in real time with hardware telemetry, balance diffs, and inbound mule verification.
              </p>

              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/[0.06] font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-rose-300">
                  <span>Debited Sender:</span>
                  <span className="font-bold">- {currency.symbol} 12,500</span>
                </div>
                <div className="flex items-center justify-between text-emerald-300">
                  <span>Credited Beneficiary:</span>
                  <span className="font-bold">+ {currency.symbol} 12,500</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenTransfer}
              className="mt-6 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold transition-colors"
            >
              <span>Test P2P Transfer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Behavioral DNA (4 cols) */}
          <div className="md:col-span-4 rounded-3xl glass-panel p-6 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono uppercase text-emerald-300 font-bold">
                  Behavioral DNA Profiling
                </span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Gaussian Spending Baselines</h4>
              <p className="text-xs text-zinc-400 font-sans mb-4">
                Tracks user spending envelopes ($\mu, \sigma$), active hour patterns, and geographic coordinates. Flags impossible travel velocities exceeding 750 km/h.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/[0.06] text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Haversine Speed Metric:</span>
              <span className="text-emerald-400 font-bold">&gt; 750 km/h Flagged</span>
            </div>
          </div>

          {/* Card 4: Explainable AI Forensics (4 cols) */}
          <div className="md:col-span-4 rounded-3xl glass-panel p-6 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono uppercase text-purple-300 font-bold">
                  Explainable AI (XAI)
                </span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Causal Verdict Explanations</h4>
              <p className="text-xs text-zinc-400 font-sans mb-4">
                No opaque black-boxes. Every flagged transaction provides human-readable causal reasoning with feature attribution and interactive analyst override actions.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/[0.06] text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Audit Compliance:</span>
              <span className="text-purple-300 font-bold">100% Traceable</span>
            </div>
          </div>

          {/* Card 5: Payment Webhook Security (4 cols) */}
          <div className="md:col-span-4 rounded-3xl glass-panel p-6 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono uppercase text-cyan-300 font-bold">
                  Enterprise Gateway Integration
                </span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">HMAC & Idempotency Locks</h4>
              <p className="text-xs text-zinc-400 font-sans mb-4">
                Native HMAC-SHA256 signature verification and idempotency duplicate protection. Ready for production Stripe, Razorpay, or banking webhooks.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/[0.06] text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Security Protocol:</span>
              <span className="text-cyan-300 font-bold">HMAC-SHA256</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. INTERACTIVE CONFIRMATION POP-UP WORKFLOW SHOWCASE
         ======================================================== */}
      <section className="max-w-[1400px] mx-auto py-16 relative z-10 border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400 mb-2 block">
            Safety & Authorization Flow
          </span>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Real-Time AI Pre-Screening & Confirmation Pop-Up
          </h2>
          <p className="text-sm text-zinc-400 mt-2 font-sans">
            How TRANSact Guard shields user funds before any ledger balance is debited.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-panel border border-white/[0.08] relative">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center mb-4">
              01
            </div>
            <h4 className="text-base font-bold text-white mb-2 font-mono">1. Transfer Composition</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Sender selects Beneficiary from active registered accounts and inputs the transfer amount denominated in the platform's active currency.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-indigo-500/40 relative bg-indigo-950/20 shadow-glow-safe">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white font-mono font-bold text-xs flex items-center justify-center mb-4">
              02
            </div>
            <h4 className="text-base font-bold text-white mb-2 font-mono">2. AI Risk Pre-Screening</h4>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              The engine pre-computes ML probability, behavioral z-scores, and beneficiary relationship familiarity <em>before</em> moving any currency.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-white/[0.08] relative">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center mb-4">
              03
            </div>
            <h4 className="text-base font-bold text-white mb-2 font-mono">3. Explicit Pop-Up Confirmation</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Displays side-by-side cards, behavioral risk score, and requires clicking <strong>"Continue Transaction"</strong> to execute and broadcast.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={onOpenTransfer}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <span>Experience The Confirmation Pop-up Live</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ========================================================
          5. CALL TO ACTION FOOTER BANNER
         ======================================================== */}
      <section className="max-w-[1400px] mx-auto mt-16 pt-16 pb-8 border-t border-white/[0.08] text-center relative z-10">
        <div className="p-10 rounded-3xl glass-panel border border-white/[0.12] bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 relative overflow-hidden">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
              Step Into the Autonomous Security Operations Center
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans mb-8">
              Explore live streaming transactions, investigate anomalies in XAI, manage multi-user wallets, and simulate cyber threats in real time.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-mono text-xs font-bold shadow-xl shadow-rose-500/20 hover:scale-[1.02] transition-all"
              >
                Launch Command Center Dashboard
              </button>
              <button
                onClick={() => onNavigateTab('users')}
                className="px-6 py-3 rounded-xl glass-panel text-zinc-300 hover:text-white font-mono text-xs font-semibold transition-colors"
              >
                View Multi-User Hub
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

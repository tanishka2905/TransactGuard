import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Radio, 
  Cpu, 
  Bell, 
  Users, 
  History, 
  Zap, 
  Dices, 
  Send,
  ChevronDown,
  Globe,
  Share2,
  MapPin,
  Clock
} from 'lucide-react';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { LocationModal } from './LocationModal';
import { 
  getStoredCurrency, 
  saveStoredCurrency, 
  generateRandomCurrency, 
  PRESET_CURRENCIES 
} from '../utils/currency';
import type { CurrencyConfig } from '../types';

export type TabType = 'landing' | 'dashboard' | 'live' | 'graph' | 'users' | 'history' | 'alerts' | 'dna' | 'model';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isConnected: boolean;
  alertCount: number;
  onOpenSimulator: () => void;
  onOpenTransfer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isConnected,
  alertCount,
  onOpenSimulator,
  onOpenTransfer,
}) => {
  const [currency, setCurrency] = useState<CurrencyConfig>(getStoredCurrency());
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const geo = useGeoLocation();

  useEffect(() => {
    const handler = (e: any) => {
      setCurrency(e.detail || getStoredCurrency());
    };
    window.addEventListener('currency_change', handler);
    return () => window.removeEventListener('currency_change', handler);
  }, []);

  const handleRandomizeCurrency = () => {
    const newCurr = generateRandomCurrency();
    setCurrency(newCurr);
  };

  const handleSelectPreset = (curr: CurrencyConfig) => {
    saveStoredCurrency(curr);
    setCurrency(curr);
    setShowCurrencyDropdown(false);
  };

  const tabs = [
    { id: 'landing' as TabType, label: 'Platform', icon: Globe },
    { id: 'dashboard' as TabType, label: 'Command Center', icon: Activity },
    { id: 'live' as TabType, label: 'Live Stream (<24h)', icon: Radio },
    { id: 'graph' as TabType, label: 'Graph Intelligence', icon: Share2 },
    { id: 'users' as TabType, label: 'Multi-User P2P', icon: Users },
    { id: 'history' as TabType, label: 'Audit History', icon: History },
    { id: 'alerts' as TabType, label: 'Fraud Alerts', icon: Bell, badge: alertCount },
    { id: 'dna' as TabType, label: 'Behavioral DNA', icon: Cpu },
    { id: 'model' as TabType, label: 'Model Intelligence', icon: Zap },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/[0.08] px-6 py-2.5 backdrop-blur-xl">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <button 
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 via-zinc-900 to-indigo-500/20 border border-white/10 shadow-glow-danger group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-white font-mono group-hover:text-rose-200 transition-colors">
                TRANS<span className="text-rose-400">act</span> GUARD
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                SOC v2.5
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 tracking-tight">Real-Time Autonomous Risk Engine</p>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/[0.06]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-zinc-800/90 text-white shadow-sm border border-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Widgets */}
        <div className="flex items-center gap-3">
          {/* DYNAMIC RANDOM CURRENCY WIDGET */}
          <div className="relative">
            <div className="flex items-center rounded-xl bg-zinc-900/90 border border-white/[0.08] p-0.5 text-xs font-mono">
              <button
                onClick={() => setShowCurrencyDropdown((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-zinc-200 hover:text-white transition-colors"
                title="Select Platform Currency"
              >
                <span className="text-indigo-400 font-bold">{currency.symbol}</span>
                <span className="font-semibold">{currency.code}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              <button
                onClick={handleRandomizeCurrency}
                className="p-1 px-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 transition-all"
                title="Randomize Platform Currency"
              >
                <Dices className="w-3.5 h-3.5 animate-spin-slow" />
                <span className="text-[10px] font-bold">Random</span>
              </button>
            </div>

            {/* Currency Dropdown Menu */}
            {showCurrencyDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-zinc-950 border border-white/[0.1] shadow-2xl p-2 z-50 text-xs font-mono animate-scaleUp">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider px-2 py-1 font-semibold border-b border-white/[0.04]">
                  Active Currencies
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1 py-1">
                  {PRESET_CURRENCIES.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => handleSelectPreset(curr)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                        currency.code === curr.code
                          ? 'bg-indigo-500/20 text-indigo-200 font-bold'
                          : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-indigo-400 font-bold">{curr.symbol}</span>
                        <span>{curr.code}</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate max-w-[100px]">
                        {curr.name}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="pt-1.5 border-t border-white/[0.04]">
                  <button
                    onClick={() => {
                      handleRandomizeCurrency();
                      setShowCurrencyDropdown(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 font-semibold text-center transition-colors"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Generate Random Currency</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Transfer Button */}
          {onOpenTransfer && (
            <button
              onClick={() => onOpenTransfer()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send P2P</span>
            </button>
          )}

          {/* Top Real Location & Live Clock Telemetry Pill */}
          <button 
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] hover:border-emerald-500/40 text-xs font-mono shadow-sm transition-all cursor-pointer group"
            title="Click to Calibrate Device GPS or Select Exact City"
          >
            <div className="flex items-center gap-1.5 text-zinc-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-zinc-100 max-w-[140px] truncate group-hover:text-emerald-300 transition-colors">
                {geo.cityName.split(',')[0]}
              </span>
            </div>
            <span className="text-zinc-600">|</span>
            <div className="flex items-center gap-1.5 text-indigo-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-white font-bold tracking-tight">{geo.localTimeStr}</span>
            </div>
          </button>

          {/* Live Telemetry Ping */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/[0.06] text-xs">
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="font-mono text-[11px] text-zinc-300 hidden md:inline">
              {isConnected ? 'LIVE' : 'RECONNECTING'}
            </span>
          </div>

          {/* Quick Simulator CTA */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-orange-500/20 hover:from-rose-500/30 hover:to-orange-500/30 border border-rose-500/40 text-rose-200 text-xs font-mono font-medium shadow-glow-danger transition-all duration-150"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Simulator</span>
          </button>
        </div>
      </div>

      {/* Geolocation Calibration & Modal Picker */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        geo={geo}
      />
    </header>
  );
};

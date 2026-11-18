import type { CurrencyConfig } from '../types';

export const PRESET_CURRENCIES: CurrencyConfig[] = [
  { code: 'TGX', symbol: '◈', name: 'TRANSact Guard Coin', rateToInr: 1.0 },
  { code: 'SOLX', symbol: '⬡', name: 'Solaris Cyber-Credit', rateToInr: 2.5 },
  { code: 'NOVA', symbol: '⚡', name: 'Nova Quantum Token', rateToInr: 0.8 },
  { code: 'VAL', symbol: '💎', name: 'Valora Gold Unit', rateToInr: 10.0 },
  { code: 'AURA', symbol: '₳', name: 'Aura Protocol Coin', rateToInr: 5.0 },
  { code: 'CYB', symbol: '🪙', name: 'CyberPulse Shard', rateToInr: 0.25 },
  { code: 'ZETA', symbol: '§', name: 'Zeta Financial Credit', rateToInr: 1.5 },
  { code: 'NEO', symbol: '✦', name: 'NeoMatrix Unit', rateToInr: 3.2 },
];

const CURRENCY_STORAGE_KEY = 'transact_guard_active_currency';

export function getStoredCurrency(): CurrencyConfig {
  try {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return PRESET_CURRENCIES[0]; // Default TGX
}

export function saveStoredCurrency(currency: CurrencyConfig): void {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(currency));
    window.dispatchEvent(new CustomEvent('currency_change', { detail: currency }));
  } catch {}
}

const RANDOM_NAMES = [
  'Vortex Protocol',
  'Nexus Shard',
  'Pulse Credit',
  'Kronos Coin',
  'Zenith Token',
  'Apex Liquid',
  'Elysium Spark',
  'Aether Coin',
  'Quantum Bit',
  'CyberDollar'
];

const RANDOM_SYMBOLS = ['◈', '⬡', '⚡', '💎', '₳', '🪙', '§', '✦', '⟠', '❂', '❖'];

export function generateRandomCurrency(): CurrencyConfig {
  const codePrefixes = ['VTX', 'NEX', 'PLS', 'KRN', 'ZNT', 'APX', 'ELY', 'ATH', 'QBT', 'CBD', 'LUM', 'ORB'];
  const code = codePrefixes[Math.floor(Math.random() * codePrefixes.length)] + Math.floor(Math.random() * 90 + 10);
  const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  const symbol = RANDOM_SYMBOLS[Math.floor(Math.random() * RANDOM_SYMBOLS.length)];
  const rateToInr = Number((Math.random() * 8 + 0.5).toFixed(2));

  const newCurrency: CurrencyConfig = {
    code,
    symbol,
    name,
    rateToInr,
  };

  saveStoredCurrency(newCurrency);
  return newCurrency;
}

export function formatCurrencyAmount(
  amount: number,
  currency?: CurrencyConfig | { symbol?: string; code?: string }
): string {
  const curr = currency || getStoredCurrency();
  const symbol = curr.symbol || '◈';
  const code = curr.code || 'TGX';
  const formattedNum = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${formattedNum} ${code}`;
}

export function formatCurrencyShort(
  amount: number,
  currency?: CurrencyConfig | { symbol?: string; code?: string }
): string {
  const curr = currency || getStoredCurrency();
  const symbol = curr.symbol || '◈';
  const formattedNum = Number(amount || 0).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
  return `${symbol} ${formattedNum}`;
}

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Send, 
  Plus, 
  ArrowRight, 
  RefreshCw, 
  Coins, 
  History 
} from 'lucide-react';
import type { UserSummary, Transaction, CurrencyConfig } from '../types';
import { api } from '../services/api';
import { formatCurrencyAmount, getStoredCurrency } from '../utils/currency';

interface MultiUserViewProps {
  onOpenTransfer: (senderId?: string, receiverId?: string) => void;
  onSelectTransaction: (txn: Transaction) => void;
}

export const MultiUserView: React.FC<MultiUserViewProps> = ({
  onOpenTransfer,
  onSelectTransaction,
}) => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [p2pTxns, setP2pTxns] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCity, setNewUserCity] = useState('Mumbai, IN');
  const [newUserBalance, setNewUserBalance] = useState('100000');
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>(getStoredCurrency());
  const [depositUserId, setDepositUserId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('25000');

  useEffect(() => {
    const handler = (e: any) => {
      setCurrencyConfig(e.detail || getStoredCurrency());
    };
    window.addEventListener('currency_change', handler);
    return () => window.removeEventListener('currency_change', handler);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersData, historyTxns] = await Promise.all([
        api.getUsers(),
        api.getTransactionHistory({ limit: 40 }),
      ]);
      setUsers(usersData);
      const p2p = historyTxns.filter(
        (t) => t.transaction_type === 'P2P_TRANSFER' || Boolean(t.beneficiary_user_id) || Boolean(t.beneficiary_name)
      );
      setP2pTxns(p2p);
    } catch (err) {
      console.error('Failed to load multi-user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    try {
      const id = `usr_${newUserName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;
      await api.createUser({
        id,
        name: newUserName,
        email: newUserEmail,
        city: newUserCity,
        balance: parseFloat(newUserBalance) || 50000,
        currency: currencyConfig.code,
      });
      setIsAddingUser(false);
      setNewUserName('');
      setNewUserEmail('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleDeposit = async (userId: string) => {
    try {
      const amt = parseFloat(depositAmount) || 25000;
      await api.depositFunds(userId, amt, currencyConfig.code);
      setDepositUserId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to deposit');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-mono text-white tracking-tight">
                  Multi-User Financial Accounts & Peer Network
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {users.length} Active Accounts
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Inspect user accounts, balances in <strong className="text-indigo-300">{currencyConfig.code}</strong> ({currencyConfig.symbol}), and initiate peer-to-peer transfers with real-time risk pre-screening.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingUser(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-semibold border border-white/[0.08] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add User Account</span>
            </button>
            <button
              onClick={() => onOpenTransfer()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Initiate P2P Transfer</span>
            </button>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-950 border border-white/[0.1] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <h3 className="text-sm font-mono font-bold text-white">Create New Platform User</h3>
              <button onClick={() => setIsAddingUser(false)} className="text-zinc-400 hover:text-white">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Ananya Desai"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.1] text-white font-mono text-xs focus:outline-none focus:border-indigo-500/60"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="ananya.desai@company.io"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.1] text-white font-mono text-xs focus:outline-none focus:border-indigo-500/60"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={newUserCity}
                    onChange={(e) => setNewUserCity(e.target.value)}
                    placeholder="Mumbai, IN"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.1] text-white font-mono text-xs focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Initial Balance ({currencyConfig.code})</label>
                  <input
                    type="number"
                    value={newUserBalance}
                    onChange={(e) => setNewUserBalance(e.target.value)}
                    placeholder="100000"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.1] text-white font-mono text-xs focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="glass-card rounded-2xl p-5 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between group relative overflow-hidden"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 via-zinc-800 to-zinc-900 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-sm text-indigo-300">
                    {user.avatar || user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-sans truncate">{user.name}</h3>
                    <p className="text-[11px] font-mono text-zinc-400 truncate">{user.email}</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  {user.risk_segment} RISK
                </span>
              </div>

              {/* Balance Card */}
              <div className="rounded-xl bg-zinc-950/80 border border-white/[0.04] p-3 mb-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-0.5">
                  <span>Available Balance:</span>
                  <span className="text-[10px] text-indigo-400 uppercase font-mono">{currencyConfig.code} Ledger</span>
                </div>
                <div className="text-xl font-bold font-mono text-white tracking-tight">
                  {formatCurrencyAmount(user.balance, { code: currencyConfig.code })}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-1 flex items-center justify-between">
                  <span>Acc: {user.account_number || user.id}</span>
                  <span>{user.city}</span>
                </div>
              </div>

              {/* Spending baselines */}
              <div className="space-y-1 text-[11px] font-mono text-zinc-400 mb-4">
                <div className="flex items-center justify-between">
                  <span>Historical Average:</span>
                  <span className="text-zinc-200">
                    {formatCurrencyAmount(user.avg_amount, { code: currencyConfig.code })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Known Devices:</span>
                  <span className="text-zinc-200">{user.known_devices_count} active</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
              <button
                onClick={() => onOpenTransfer(user.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-medium transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Money</span>
              </button>
              <button
                onClick={() => setDepositUserId(user.id)}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-medium transition-colors"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Deposit</span>
              </button>
            </div>

            {/* Deposit Box Dropdown */}
            {depositUserId === user.id && (
              <div className="mt-3 p-3 rounded-xl bg-zinc-900 border border-white/[0.1] text-xs font-mono space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">Deposit to {user.name}</span>
                  <button onClick={() => setDepositUserId(null)} className="text-zinc-400 hover:text-white">
                    ✕
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-zinc-950 border border-white/[0.1] text-white text-xs font-mono"
                  />
                  <button
                    onClick={() => handleDeposit(user.id)}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* P2P Recent Transactions List with Side-by-Side Indicators */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold font-mono text-white uppercase tracking-wider">
              Recent Dual-User P2P Settlement Stream
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {p2pTxns.length} Recorded Peer Transfers
          </span>
        </div>

        {p2pTxns.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-zinc-400">
            No P2P transfers recorded yet. Click "Initiate P2P Transfer" above to execute a peer-to-peer transfer.
          </div>
        ) : (
          <div className="space-y-3">
            {p2pTxns.map((txn) => {
              const sender = users.find((u) => u.id === txn.user_id);
              const receiver = users.find((u) => u.id === (txn.beneficiary_user_id || txn.beneficiary_id));
              const sName = sender?.name || txn.user_id;
              const rName = receiver?.name || txn.beneficiary_name || txn.beneficiary_id || 'Beneficiary';

              return (
                <div
                  key={txn.id}
                  onClick={() => onSelectTransaction(txn)}
                  className="p-4 rounded-xl bg-zinc-950/70 border border-white/[0.06] hover:border-white/20 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4"
                >
                  {/* Left: Sender ➔ Receiver Side by Side */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <div className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-semibold flex items-center gap-1.5">
                        <span>{sName}</span>
                      </div>
                      <div className="flex items-center text-indigo-400">
                        <span className="h-0.5 w-4 bg-indigo-500/50" />
                        <ArrowRight className="w-4 h-4 text-indigo-400 -ml-1" />
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1.5">
                        <span>{rName}</span>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-zinc-400">
                      ID: {txn.id.slice(0, 14)} · {new Date(txn.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Right: Amount & Risk */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono font-bold text-white">
                      {formatCurrencyAmount(txn.amount, { code: txn.currency })}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${
                      txn.risk_level === 'CRITICAL'
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                        : txn.risk_level === 'HIGH'
                        ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
                        : txn.risk_level === 'MEDIUM'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    }`}>
                      {txn.risk_level} ({txn.risk_score})
                    </span>

                    <span className="text-xs font-mono text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2">
                      Side-by-Side View →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

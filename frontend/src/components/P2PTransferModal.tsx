import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Send, 
  Users, 
  Info,
  ChevronRight
} from 'lucide-react';
import type { UserSummary, P2PPreScreenResult, Transaction, CurrencyConfig } from '../types';
import { api } from '../services/api';
import { SideBySideTxnView } from './SideBySideTxnView';
import { formatCurrencyAmount, getStoredCurrency } from '../utils/currency';

interface P2PTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionCompleted?: (txn: Transaction) => void;
  onViewForensics?: (txn: Transaction) => void;
  initialSenderId?: string;
  initialReceiverId?: string;
}

export const P2PTransferModal: React.FC<P2PTransferModalProps> = ({
  isOpen,
  onClose,
  onTransactionCompleted,
  onViewForensics,
  initialSenderId,
  initialReceiverId,
}) => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [senderId, setSenderId] = useState<string>('');
  const [receiverId, setReceiverId] = useState<string>('');
  const [amount, setAmount] = useState<string>('3500');
  const [paymentMethod, setPaymentMethod] = useState<string>('P2P_TRANSFER');
  const [note, setNote] = useState<string>('Instant P2P settlement');
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>(getStoredCurrency());

  // Multi-step modal state: 'compose' | 'confirm_popup' | 'success'
  const [step, setStep] = useState<'compose' | 'confirm_popup' | 'success'>('compose');
  const [isLoadingPreScreen, setIsLoadingPreScreen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [preScreenData, setPreScreenData] = useState<P2PPreScreenResult | null>(null);
  const [completedTxn, setCompletedTxn] = useState<Transaction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync currency changes
  useEffect(() => {
    const handler = (e: any) => {
      setCurrencyConfig(e.detail || getStoredCurrency());
    };
    window.addEventListener('currency_change', handler);
    return () => window.removeEventListener('currency_change', handler);
  }, []);

  // Fetch users on open
  useEffect(() => {
    if (isOpen) {
      setStep('compose');
      setErrorMessage(null);
      setCompletedTxn(null);
      setPreScreenData(null);
      api.getUsers()
        .then((data) => {
          setUsers(data);
          if (data.length >= 2) {
            const validInitSender = typeof initialSenderId === 'string' && data.some((u) => u.id === initialSenderId) 
              ? initialSenderId 
              : data[0].id;
            setSenderId(validInitSender);
            const validInitReceiver = typeof initialReceiverId === 'string' && data.some((u) => u.id === initialReceiverId && u.id !== validInitSender) 
              ? initialReceiverId 
              : (data.find((u) => u.id !== validInitSender)?.id || data[1].id);
            setReceiverId(validInitReceiver);
          }
        })
        .catch((err) => console.error('Failed to fetch users:', err));
    }
  }, [isOpen, initialSenderId, initialReceiverId]);

  if (!isOpen) return null;

  const sender = users.find((u) => u.id === senderId);
  const receiver = users.find((u) => u.id === receiverId);
  const numericAmount = parseFloat(amount) || 0;

  // Step 1 -> Step 2: Trigger Pre-Screening to open the Confirmation Message Pop-up
  const handleReviewTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const sId = String(senderId || '');
    const rId = String(receiverId || '');

    if (!sId || !rId) {
      setErrorMessage('Please select both a sender and a recipient account.');
      return;
    }
    if (sId === rId) {
      setErrorMessage('Sender and recipient must be different user accounts.');
      return;
    }
    if (numericAmount <= 0) {
      setErrorMessage('Transfer amount must be greater than zero.');
      return;
    }
    if (sender && sender.balance < numericAmount) {
      setErrorMessage(
        `Insufficient sender balance. Available: ${formatCurrencyAmount(sender.balance, { code: currencyConfig.code })}`
      );
      return;
    }

    try {
      setIsLoadingPreScreen(true);
      const preScreen = await api.preScreenP2PTransfer({
        sender_id: sId,
        receiver_id: rId,
        amount: Number(numericAmount),
        currency: String(currencyConfig?.code || 'TGX'),
        payment_method: String(paymentMethod || 'P2P_TRANSFER'),
        note: String(note || ''),
      });
      setPreScreenData(preScreen);
      // Advance to the message pop-up confirmation modal!
      setStep('confirm_popup');
    } catch (err: any) {
      setErrorMessage(err.message || 'Pre-screen risk evaluation failed.');
    } finally {
      setIsLoadingPreScreen(false);
    }
  };

  // Step 2 Action: "Continue Transaction"
  const handleContinueTransaction = async () => {
    try {
      setIsExecuting(true);
      setErrorMessage(null);

      const txn = await api.executeP2PTransfer({
        sender_id: String(senderId),
        receiver_id: String(receiverId),
        amount: Number(numericAmount),
        currency: String(currencyConfig?.code || 'TGX'),
        payment_method: String(paymentMethod || 'P2P_TRANSFER'),
        note: String(note || ''),
      });

      setCompletedTxn(txn);
      setStep('success');

      // Update local users balances
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === senderId) {
            return { ...u, balance: Math.max(0, u.balance - numericAmount) };
          }
          if (u.id === receiverId) {
            return { ...u, balance: u.balance + numericAmount };
          }
          return u;
        })
      );

      if (onTransactionCompleted) {
        onTransactionCompleted(txn);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete transaction.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className={`w-full max-w-4xl bg-zinc-950 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          step === 'confirm_popup' ? 'max-w-5xl' : 'max-w-3xl'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white font-mono flex items-center gap-2">
                <span>P2P Multi-User Transfer Gateway</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currencyConfig.code} ({currencyConfig.symbol})
                </span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Real-time dual-user credit transfer with autonomous risk pre-screening
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================
            STEP 1: COMPOSE TRANSFER FORM
           ======================================================== */}
        {step === 'compose' && (
          <form onSubmit={handleReviewTransfer} className="p-6 space-y-6">
            {/* Sender & Receiver Pickers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sender Box */}
              <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-900/60">
                <label className="block text-xs font-mono font-semibold text-rose-300 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>1. Select Sender (From)</span>
                  {sender && (
                    <span className="text-[11px] text-zinc-400 lowercase font-normal">
                      bal: {formatCurrencyAmount(sender.balance, { code: currencyConfig.code })}
                    </span>
                  )}
                </label>
                <select
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-white/[0.1] text-white font-mono text-xs focus:outline-none focus:border-rose-500/60 transition-colors"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {formatCurrencyAmount(u.balance, { code: currencyConfig.code })} ({u.city})
                    </option>
                  ))}
                </select>

                {sender && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04] text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                    <span>Account: {sender.account_number || sender.id}</span>
                    <span className="text-zinc-300">{sender.city}</span>
                  </div>
                )}
              </div>

              {/* Receiver Box */}
              <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-900/60">
                <label className="block text-xs font-mono font-semibold text-emerald-300 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>2. Select Beneficiary (To)</span>
                  {receiver && (
                    <span className="text-[11px] text-zinc-400 lowercase font-normal">
                      bal: {formatCurrencyAmount(receiver.balance, { code: currencyConfig.code })}
                    </span>
                  )}
                </label>
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-white/[0.1] text-white font-mono text-xs focus:outline-none focus:border-emerald-500/60 transition-colors"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id} disabled={u.id === senderId}>
                      {u.name} · {formatCurrencyAmount(u.balance, { code: currencyConfig.code })} ({u.city}) {u.id === senderId ? '(Sender)' : ''}
                    </option>
                  ))}
                </select>

                {receiver && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04] text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                    <span>Account: {receiver.account_number || receiver.id}</span>
                    <span className="text-zinc-300">{receiver.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transfer Amount & Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 p-4 rounded-xl border border-white/[0.08] bg-zinc-900/40">
                <label className="block text-xs font-mono font-semibold text-zinc-300 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>Transfer Amount</span>
                  <span className="text-[11px] text-indigo-400 font-normal">
                    Denominated in {currencyConfig.code}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-mono text-indigo-400 font-bold">
                    {currencyConfig.symbol}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-zinc-950 border border-white/[0.1] text-white font-mono text-lg font-bold focus:outline-none focus:border-indigo-500/60"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 font-semibold">
                    {currencyConfig.code}
                  </span>
                </div>

                {/* Quick Percentage Chips */}
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-[10px] font-mono text-zinc-400">Quick:</span>
                  {[500, 2500, 10000, 50000].map((quickAmt) => (
                    <button
                      key={quickAmt}
                      type="button"
                      onClick={() => setAmount(String(quickAmt))}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    >
                      {currencyConfig.symbol} {quickAmt.toLocaleString()}
                    </button>
                  ))}
                  {sender && (
                    <button
                      type="button"
                      onClick={() => setAmount(String(Math.floor(sender.balance * 0.5)))}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors ml-auto"
                    >
                      50% Balance
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Channel */}
              <div className="p-4 rounded-xl border border-white/[0.08] bg-zinc-900/40">
                <label className="block text-xs font-mono font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
                  Transfer Rail
                </label>
                <div className="space-y-1.5">
                  {['P2P_TRANSFER', 'UPI', 'WIRE'].map((method) => (
                    <label
                      key={method}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs font-mono transition-colors ${
                        paymentMethod === method
                          ? 'border-indigo-500/60 bg-indigo-500/10 text-white font-semibold'
                          : 'border-white/[0.04] bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="method"
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        className="sr-only"
                      />
                      <span>{method.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Transfer Memo Note */}
            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-400 mb-1">
                Transaction Memo / Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Instant P2P settlement"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-indigo-500/60"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Next: AI multi-signal risk pre-screening and confirmation message pop-up</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoadingPreScreen}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white font-mono font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {isLoadingPreScreen ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Pre-Screening Risk...</span>
                    </>
                  ) : (
                    <>
                      <span>Review & Pre-Screen Transfer</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================
            STEP 2: MESSAGE POP-UP MODAL TO ACTUALLY CONTINUE TRANSACTION!
           ======================================================== */}
        {step === 'confirm_popup' && preScreenData && (
          <div className="p-6 space-y-5 animate-scaleUp">
            {/* Pop-up Alert Banner */}
            <div 
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-lg ${
                preScreenData.risk_level === 'CRITICAL'
                  ? 'border-rose-500/50 bg-rose-950/40 text-rose-200'
                  : preScreenData.risk_level === 'HIGH'
                  ? 'border-orange-500/50 bg-orange-950/40 text-orange-200'
                  : preScreenData.risk_level === 'MEDIUM'
                  ? 'border-amber-500/50 bg-amber-950/40 text-amber-200'
                  : 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
              }`}
            >
              <div className="p-2 rounded-lg bg-black/40 mt-0.5">
                {preScreenData.risk_level === 'CRITICAL' || preScreenData.risk_level === 'HIGH' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                ) : preScreenData.risk_level === 'MEDIUM' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {preScreenData.risk_level} Risk Verification Check ({preScreenData.risk_score} pts)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40">
                    ML Fraud Prob: {(preScreenData.ml_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs mt-1 font-mono">
                  {preScreenData.requires_confirmation
                    ? 'Security Notice: This transaction triggered behavioral deviation flags or exceeds standard thresholds. Confirmation is required to proceed.'
                    : 'Security Notice: Transaction parameters are consistent with legitimate behavioral baselines.'}
                </p>
                {preScreenData.warnings.length > 0 && (
                  <div className="mt-2 space-y-0.5 text-[11px] font-mono opacity-90">
                    {preScreenData.warnings.map((w, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SIDE-BY-SIDE TRANSACTION DISPLAY */}
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Side-by-Side Settlement Preview</span>
              <span>2 Users Involved in Transaction</span>
            </div>

            <SideBySideTxnView
              transaction={{
                id: 'TXN-PREVIEW',
                user_id: preScreenData.sender_id,
                amount: preScreenData.amount,
                currency: preScreenData.currency,
                timestamp: new Date().toISOString(),
                payment_method: paymentMethod,
                device_id: 'dev_authorized_terminal',
                location_name: preScreenData.sender_city,
                beneficiary_id: preScreenData.receiver_id,
                beneficiary_name: preScreenData.receiver_name,
                beneficiary_user_id: preScreenData.receiver_id,
                sender_balance_after: preScreenData.sender_balance_after,
                beneficiary_balance_after: preScreenData.receiver_balance_after,
                transaction_type: 'P2P_TRANSFER',
                status: preScreenData.risk_level === 'CRITICAL' ? 'FLAGGED' : 'APPROVED',
                risk_score: preScreenData.risk_score,
                risk_level: preScreenData.risk_level,
                ml_probability: preScreenData.ml_probability,
                anomaly_score: preScreenData.anomaly_score,
                rule_score: preScreenData.rule_score,
                velocity_score: preScreenData.velocity_score,
                reasons: preScreenData.reasons,
                feature_breakdown: {
                  ml_contribution: preScreenData.ml_probability * 35,
                  anomaly_contribution: preScreenData.anomaly_score * 0.25,
                  rule_contribution: preScreenData.rule_score * 0.25,
                  velocity_contribution: preScreenData.velocity_score * 0.15,
                  p2p_sender: {
                    id: preScreenData.sender_id,
                    name: preScreenData.sender_name,
                    balance_before: preScreenData.sender_balance,
                    balance_after: preScreenData.sender_balance_after,
                    city: preScreenData.sender_city,
                  },
                  p2p_receiver: {
                    id: preScreenData.receiver_id,
                    name: preScreenData.receiver_name,
                    balance_before: preScreenData.receiver_balance,
                    balance_after: preScreenData.receiver_balance_after,
                    city: preScreenData.receiver_city,
                  },
                },
                source: 'P2P_PORTAL',
                is_live: true,
              }}
              senderName={preScreenData.sender_name}
              senderCity={preScreenData.sender_city}
              senderBalanceBefore={preScreenData.sender_balance}
              receiverName={preScreenData.receiver_name}
              receiverCity={preScreenData.receiver_city}
              receiverBalanceBefore={preScreenData.receiver_balance}
            />

            {/* THE EXPLICIT MESSAGE POP-UP PROMPT TO CONTINUE */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white">
                    Confirm to Execute Transfer of {formatCurrencyAmount(preScreenData.amount, { code: preScreenData.currency })}
                  </h4>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Do you want to proceed and continue this transaction between <span className="text-white font-semibold">{preScreenData.sender_name}</span> and <span className="text-white font-semibold">{preScreenData.receiver_name}</span>?
                  </p>
                </div>
              </div>

              {/* Action Buttons: Continue vs Cancel */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setStep('compose')}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.04] transition-colors"
                >
                  Back / Edit
                </button>
                <button
                  type="button"
                  disabled={isExecuting}
                  onClick={handleContinueTransaction}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono font-bold text-xs shadow-xl transition-all ${
                    preScreenData.risk_level === 'CRITICAL'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Settling Ledger...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Continue Transaction</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: SUCCESS CONFIRMATION RECEIPT
           ======================================================== */}
        {step === 'success' && completedTxn && (
          <div className="p-6 space-y-5 animate-scaleUp">
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-mono font-bold text-emerald-200">
                    Transaction Successfully Executed & Broadcasted!
                  </h4>
                  <p className="text-xs font-mono text-zinc-400">
                    Transaction ID: <span className="text-white font-semibold">{completedTxn.id}</span> · Status:{' '}
                    <span className="text-emerald-400 font-bold uppercase">{completedTxn.status}</span>
                  </p>
                </div>
              </div>

              <span className="text-xl font-mono font-bold text-white">
                {formatCurrencyAmount(completedTxn.amount, { code: completedTxn.currency })}
              </span>
            </div>

            {/* Side-by-Side Completed View */}
            <SideBySideTxnView
              transaction={completedTxn}
              senderName={sender?.name}
              senderCity={sender?.city}
              receiverName={receiver?.name}
              receiverCity={receiver?.city}
            />

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
              <span className="text-xs font-mono text-zinc-400">
                Balances updated in real-time across both user ledgers.
              </span>
              <div className="flex items-center gap-3">
                {onViewForensics && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewForensics(completedTxn);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-semibold border border-white/[0.08] transition-colors"
                  >
                    <span>Launch Explainable AI Forensics</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

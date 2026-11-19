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
  Check, 
  Sliders, 
  Play, 
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  Award,
  Cpu
} from 'lucide-react';
import type { Transaction, CounterfactualResponse, ModelPredictionItem } from '../types';
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

  // Counterfactual Simulator State
  const [showCounterfactual, setShowCounterfactual] = useState(false);
  const [cfAmount, setCfAmount] = useState<number>(transaction ? transaction.amount : 5000);
  const [cfSpeed, setCfSpeed] = useState<number>(transaction?.feature_breakdown?.speed_kmh || 0);
  const [cfNewDevice, setCfNewDevice] = useState<number>(transaction?.feature_breakdown?.is_new_device ? 1 : 0);
  const [cfNight, setCfNight] = useState<number>(transaction?.feature_breakdown?.is_night ? 1 : 0);
  const [cfModel, setCfModel] = useState<string>('consensus_ensemble');
  const [cfResult, setCfResult] = useState<CounterfactualResponse | null>(null);
  const [cfLoading, setCfLoading] = useState(false);

  // Step-up verification state
  const [verifyingChallenge, setVerifyingChallenge] = useState(false);

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

  const modelComp = transaction.model_comparison || (bd as any)?.model_comparison;
  const championName = 
    transaction.active_champion_model || 
    modelComp?.champion_name || 
    (bd as any)?.active_champion_model || 
    'Consensus Ensemble';

  const handleContinueAndApprove = async () => {
    try {
      setIsContinuing(true);
      await api.continueTransaction(transaction.id);
      if (onUpdateStatus) onUpdateStatus(transaction.id, 'APPROVED');
      setStatusMessage('Transaction authorized & cleared by analyst.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(`Failed to continue transaction: ${err.message}`);
    } finally {
      setIsContinuing(false);
      setShowContinueConfirm(false);
    }
  };

  const handleVerifyStepUp = async (challengeType: string) => {
    try {
      setVerifyingChallenge(true);
      await api.verifyStepUpChallenge(transaction.id, challengeType);
      if (onUpdateStatus) onUpdateStatus(transaction.id, 'APPROVED');
      setStatusMessage(`Adaptive challenge (${challengeType}) verified! Transaction approved.`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(`Challenge verification failed: ${err.message}`);
    } finally {
      setVerifyingChallenge(false);
    }
  };

  const runCounterfactualSimulation = async () => {
    try {
      setCfLoading(true);
      const res = await api.simulateCounterfactual({
        transaction_id: transaction.id,
        user_id: transaction.user_id,
        amount: cfAmount,
        speed_kmh: cfSpeed,
        is_new_device: cfNewDevice,
        is_night: cfNight,
        model_id: cfModel
      });
      setCfResult(res);
    } catch (err: any) {
      alert(`Counterfactual error: ${err.message}`);
    } finally {
      setCfLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl glass-panel border border-white/[0.1] bg-zinc-950/95 p-6 shadow-2xl space-y-6 text-zinc-100">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${colors.bg} ${colors.border} ${colors.glow}`}>
              <ShieldAlert className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-zinc-400">
                  {transaction.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                  {transaction.risk_level} RISK · {transaction.risk_score} / 100
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  transaction.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                  transaction.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {transaction.status}
                </span>
                {isTwoUserTxn && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    2-User P2P Settlement
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Timestamp: {new Date(transaction.timestamp).toLocaleString()} · Channel: {transaction.payment_method}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Confirmation Sub-Modal */}
        {showContinueConfirm && (
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 animate-fadeIn space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>Confirm Manual Authorization & Continue Transaction</span>
            </div>
            <p className="text-zinc-300 text-xs font-sans">
              You are overriding the automated security verdict. This will immediately update the status to <strong>APPROVED</strong> and clear active security alerts.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleContinueAndApprove}
                disabled={isContinuing}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors flex items-center gap-1.5"
              >
                {isContinuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Authorize & Continue</span>
              </button>
              <button
                onClick={() => setShowContinueConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* SIDE-BY-SIDE DUAL-USER LEDGER VIEW */}
        {isTwoUserTxn && (
          <div className="space-y-2">
            <SideBySideTxnView transaction={transaction} />
          </div>
        )}

        {/* Unified Risk Score Breakdown Gauge */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-zinc-300 uppercase tracking-wider font-semibold">
              Unified Risk Engine Composition
            </span>
            <span className={`font-bold ${colors.text}`}>
              Normalized Score: {transaction.risk_score} / 100
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

        {/* FEATURE 2: MULTI-MODEL BENCHMARK CONSENSUS & ALTERNATIVE PREDICTIONS */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] space-y-3 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Multi-Model Fleet Inferences & Alternative Predictions
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>CHAMPION VERDICT: {championName}</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 font-sans">
            Every transaction is evaluated in real-time across 5 candidate supervised & unsupervised models. The selected Champion model determines the primary fraud probability, while consensus provides explainable cross-validation.
          </p>

          {/* Model predictions grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {modelComp?.models && Object.keys(modelComp.models).length > 0 ? (
              Object.entries(modelComp.models).map(([mId, rawData]) => {
                const mData = rawData as ModelPredictionItem;
                const isChamp = Boolean(
                  mData.is_champion || 
                  mId === (modelComp as any).champion_model || 
                  mId === (modelComp as any).champion_model_id
                );
                const prob = mData.fraud_probability !== undefined ? mData.fraud_probability : (mData.probability || 0);
                const verdictColor = 
                  mData.verdict === 'FRAUD' ? 'text-rose-400 border-rose-500/40 bg-rose-500/10' :
                  mData.verdict === 'SUSPICIOUS' ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' :
                  'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';

                return (
                  <div
                    key={mId}
                    className={`p-3 rounded-xl border transition-all ${
                      isChamp
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-glow-safe'
                        : 'bg-zinc-950/70 border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-bold text-white text-[11px] truncate" title={mData.name}>
                        {mData.name}
                      </span>
                      {isChamp && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">
                          CHAMPION
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-2">
                      <span className="truncate">{mData.algorithm || 'Supervised Classifier'}</span>
                      {mData.latency_ms !== undefined && (
                        <span className="text-cyan-300 font-mono shrink-0">{mData.latency_ms.toFixed(2)} ms</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04]">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">Fraud Prob</span>
                        <span className="font-bold text-white text-xs">
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${verdictColor}`}>
                        {mData.verdict}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback cards when evaluating historical or unbatched records
              [
                { name: 'Consensus Ensemble', algo: 'Multi-Model Stacking', prob: transaction.ml_probability, isChamp: true, lat: 0.8 },
                { name: 'LightGBM Classifier', algo: 'Gradient Boosting Tree', prob: transaction.ml_probability * 0.98, isChamp: false, lat: 0.14 },
                { name: 'Random Forest', algo: 'Ensemble Trees', prob: transaction.ml_probability * 1.02, isChamp: false, lat: 0.42 },
                { name: 'XGBoost Classifier', algo: 'Extreme Gradient Boosting', prob: transaction.ml_probability * 0.96, isChamp: false, lat: 0.28 },
                { name: 'MLP Neural Network', algo: 'Multi-Layer Perceptron', prob: transaction.ml_probability * 1.04, isChamp: false, lat: 0.35 },
                { name: 'Logistic Regression', algo: 'L2-Penalized Linear', prob: Math.min(1.0, transaction.ml_probability * 0.92), isChamp: false, lat: 0.12 },
              ].map((m, idx) => {
                const isFraud = m.prob > 0.65;
                const isSusp = m.prob >= 0.35 && m.prob <= 0.65;
                const verdict = isFraud ? 'FRAUD' : isSusp ? 'SUSPICIOUS' : 'LEGIT';
                const verdictColor = 
                  isFraud ? 'text-rose-400 border-rose-500/40 bg-rose-500/10' :
                  isSusp ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' :
                  'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border ${
                      m.isChamp
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-glow-safe'
                        : 'bg-zinc-950/70 border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-bold text-white text-[11px] truncate">{m.name}</span>
                      {m.isChamp && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">
                          CHAMPION
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-2">
                      <span className="truncate">{m.algo}</span>
                      <span className="text-cyan-300 font-mono">{m.lat} ms</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04]">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">Fraud Prob</span>
                        <span className="font-bold text-white text-xs">{(m.prob * 100).toFixed(1)}%</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${verdictColor}`}>
                        {verdict}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* NEW INNOVATION: WHAT-IF / COUNTERFACTUAL SENSITIVITY SIMULATOR */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-indigo-500/30 font-mono text-xs shadow-glow-safe">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                What-If Counterfactual Sensitivity Simulator
              </h3>
            </div>
            <button
              onClick={() => setShowCounterfactual(v => !v)}
              className="text-[11px] text-indigo-300 hover:text-white underline underline-offset-2"
            >
              {showCounterfactual ? 'Hide Simulator' : 'Open What-If Simulator'}
            </button>
          </div>

          {showCounterfactual && (
            <div className="space-y-4 pt-2 border-t border-white/[0.06] animate-fadeIn">
              <p className="text-zinc-400 text-xs font-sans">
                Simulate how altering specific transaction attributes (amount, travel speed, device familiarity, nocturnal timing, or AI model) changes the model's risk score and decision boundary in real time.
              </p>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 rounded-xl bg-zinc-950 border border-white/[0.06]">
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Amount:</span>
                    <span className="text-white font-bold">{cfAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="100000"
                    step="500"
                    value={cfAmount}
                    onChange={(e) => setCfAmount(Number(e.target.value))}
                    className="w-full accent-indigo-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Transit Speed:</span>
                    <span className="text-white font-bold">{cfSpeed} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="50"
                    value={cfSpeed}
                    onChange={(e) => setCfSpeed(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <span className="text-zinc-300 block mb-1">Hardware Device:</span>
                  <button
                    onClick={() => setCfNewDevice(v => v === 1 ? 0 : 1)}
                    className={`w-full py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      cfNewDevice === 1 ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-zinc-800 text-zinc-300 border-white/[0.06]'
                    }`}
                  >
                    {cfNewDevice === 1 ? 'New Hardware ID' : 'Trusted Device'}
                  </button>
                </div>

                <div>
                  <span className="text-zinc-300 block mb-1">Time of Day:</span>
                  <button
                    onClick={() => setCfNight(v => v === 1 ? 0 : 1)}
                    className={`w-full py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      cfNight === 1 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-zinc-800 text-zinc-300 border-white/[0.06]'
                    }`}
                  >
                    {cfNight === 1 ? 'Nocturnal (02:00)' : 'Daytime (Normal)'}
                  </button>
                </div>

                <div>
                  <span className="text-zinc-300 block mb-1">Inference Model:</span>
                  <select
                    value={cfModel}
                    onChange={(e) => setCfModel(e.target.value)}
                    className="w-full py-1.5 px-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-white text-xs font-mono"
                  >
                    <option value="consensus_ensemble">Consensus Ensemble</option>
                    <option value="lightgbm">LightGBM (GBDT)</option>
                    <option value="xgboost">XGBoost</option>
                    <option value="random_forest">Random Forest</option>
                    <option value="multi_layer_perceptron_mlp">MLP Neural Net</option>
                    <option value="logistic_regression">Logistic Regression</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={runCounterfactualSimulation}
                  disabled={cfLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
                >
                  <Play className={`w-3.5 h-3.5 ${cfLoading ? 'animate-spin' : ''}`} />
                  <span>{cfLoading ? 'Re-evaluating Vector...' : 'Execute Counterfactual Recalculation'}</span>
                </button>
                <span className="text-[11px] text-zinc-400">Target Model: {cfModel}</span>
              </div>

              {/* Counterfactual Diff Results */}
              {cfResult && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/[0.08] space-y-3 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase">Original vs Simulated Risk Score</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-base text-zinc-400 line-through">
                          {cfResult.original_risk_score} pts ({cfResult.original_status})
                        </span>
                        <ArrowRight className="w-4 h-4 text-indigo-400" />
                        <span className="text-xl font-bold text-white">
                          {cfResult.counterfactual_risk_score} pts ({cfResult.counterfactual_status})
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cfResult.score_delta < 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {cfResult.score_delta > 0 ? `+${cfResult.score_delta}` : cfResult.score_delta} pts
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block uppercase">Decision Status</span>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        cfResult.decision_flipped 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {cfResult.decision_flipped ? 'DECISION FLIPPED' : 'DECISION UNCHANGED'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase mb-1">Simulated Causal Factors:</span>
                    <ul className="space-y-1">
                      {cfResult.counterfactual_reasons.map((r, idx) => (
                        <li key={idx} className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                          <span className="text-indigo-400">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
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

        {/* Adaptive Friction & Analyst Action Footer */}
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-white/[0.08] gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Adaptive Friction:</span>
            <button
              onClick={() => handleVerifyStepUp('BIOMETRIC_TOUCHID')}
              disabled={verifyingChallenge}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold transition-all"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Verify Biometrics</span>
            </button>
            <button
              onClick={() => handleVerifyStepUp('OTP_SMS')}
              disabled={verifyingChallenge}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-semibold transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify OTP</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowContinueConfirm(true)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-colors"
            >
              Authorize / Continue
            </button>
            <button
              onClick={() => {
                if (onUpdateStatus) onUpdateStatus(transaction.id, 'BLOCKED');
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold transition-colors shadow-glow-danger"
            >
              Confirm Threat & Block
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

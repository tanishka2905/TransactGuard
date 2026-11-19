import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import type { TabType } from './components/Navbar';
import { SimulatorBar } from './components/SimulatorBar';
import { XAIModal } from './components/XAIModal';
import { P2PTransferModal } from './components/P2PTransferModal';
import { DashboardView } from './views/DashboardView';
import { LiveStreamView } from './views/LiveStreamView';
import { HistoryView } from './views/HistoryView';
import { AlertsView } from './views/AlertsView';
import { BehavioralDNAView } from './views/BehavioralDNAView';
import { ModelTelemetryView } from './views/ModelTelemetryView';
import { MultiUserView } from './views/MultiUserView';
import { LandingPageView } from './views/LandingPageView';
import { GraphIntelligenceView } from './views/GraphIntelligenceView';
import type { Transaction, DashboardMetrics } from './types';
import { api } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  risk_level: string;
  risk_score: number;
  transaction?: Transaction;
  timestamp: Date;
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isP2POpen, setIsP2POpen] = useState(false);
  const [p2pSenderId, setP2pSenderId] = useState<string | undefined>();
  const [p2pReceiverId, setP2pReceiverId] = useState<string | undefined>();
  
  const handleOpenTransfer = (sId?: unknown, rId?: unknown) => {
    setP2pSenderId(typeof sId === 'string' ? sId : undefined);
    setP2pReceiverId(typeof rId === 'string' ? rId : undefined);
    setIsP2POpen(true);
  };
  
  // Data state
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  // Refresh dashboard metrics & initial transactions
  const loadInitialData = useCallback(async () => {
    try {
      const [metricsData, liveTxns, alertsData] = await Promise.allSettled([
        api.getDashboardMetrics(),
        api.getLiveTransactions(60),
        api.getAlerts('NEW')
      ]);

      if (metricsData.status === 'fulfilled') {
        setMetrics(metricsData.value);
      }
      if (liveTxns.status === 'fulfilled') {
        setTransactions(liveTxns.value);
      }
      if (alertsData.status === 'fulfilled') {
        setActiveAlertsCount(alertsData.value.length);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle incoming live transactions via WebSocket
  const handleNewTransaction = useCallback((newTxn: Transaction) => {
    setTransactions((prev) => {
      // Prevent duplicate insertion
      const exists = prev.some((t) => t.id === newTxn.id);
      if (exists) return prev;
      return [newTxn, ...prev.slice(0, 99)];
    });

    // Update real-time metrics
    setMetrics((prev) => {
      if (!prev) return prev;
      const updatedDist = {
        ...prev.risk_distribution,
        [newTxn.risk_level]: (prev.risk_distribution[newTxn.risk_level] || 0) + 1,
      };

      return {
        ...prev,
        live_transactions_count: prev.live_transactions_count + 1,
        transactions_today_count: prev.transactions_today_count + 1,
        total_volume_today: prev.total_volume_today + newTxn.amount,
        active_critical_alerts:
          newTxn.risk_level === 'CRITICAL'
            ? prev.active_critical_alerts + 1
            : prev.active_critical_alerts,
        risk_distribution: updatedDist,
      };
    });

    // Spawn Toast if Critical or High Risk
    if (newTxn.risk_level === 'CRITICAL') {
      const toastId = `${newTxn.id}-${Date.now()}`;
      const newToast: ToastAlert = {
        id: toastId,
        title: `CRITICAL THREAT DETECTED (${newTxn.risk_score} pts)`,
        message: `${newTxn.reasons?.[0] || 'Unusual behavioral anomaly'} · ₹${newTxn.amount.toLocaleString('en-IN')}`,
        risk_level: newTxn.risk_level,
        risk_score: newTxn.risk_score,
        transaction: newTxn,
        timestamp: new Date(),
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
      setActiveAlertsCount((c) => c + 1);

      // Auto-dismiss after 7 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 7000);
    }
  }, []);

  // Handle incoming alerts via WebSocket
  const handleNewAlert = useCallback(() => {
    setActiveAlertsCount((c) => c + 1);
  }, []);

  // FEATURE 3: Real-Time State Synchrony on Self-Healing Unblock
  useEffect(() => {
    const handleUnblocked = (e: any) => {
      const payload = e.detail;
      const unblockedTxnId = payload?.transaction_id || payload?.id;

      if (unblockedTxnId) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === unblockedTxnId ? { ...t, status: 'APPROVED' as any } : t))
        );
        setActiveAlertsCount((c) => Math.max(0, c - 1));
        // Dismiss any active toast notifications for this transaction
        setToasts((prev) => prev.filter((t) => t.transaction?.id !== unblockedTxnId));
      }
    };

    window.addEventListener('transaction_unblocked', handleUnblocked);
    window.addEventListener('alert_resolved', handleUnblocked);

    return () => {
      window.removeEventListener('transaction_unblocked', handleUnblocked);
      window.removeEventListener('alert_resolved', handleUnblocked);
    };
  }, []);

  // Connect WebSocket
  const { isConnected } = useWebSocket(handleNewTransaction, handleNewAlert);

  // Manual transaction simulation handling
  const handleTransactionSimulated = (txn: Transaction) => {
    handleNewTransaction(txn);
  };

  // Transaction Status Override (Approve / Block)
  const handleUpdateTransactionStatus = (txnId: string, status: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === txnId ? { ...t, status: status as any } : t))
    );
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-void text-zinc-100 flex flex-col font-sans antialiased selection:bg-rose-500/30 selection:text-rose-200">
      {/* Sticky Global Cyber-SOC Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        alertCount={activeAlertsCount}
        onOpenSimulator={() => setIsSimulatorOpen((v) => !v)}
        onOpenTransfer={() => handleOpenTransfer()}
      />

      {/* Security Attack & Live Traffic Simulator Bar */}
      <SimulatorBar
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onTransactionSimulated={handleTransactionSimulated}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-6 py-6">
        {activeTab === 'landing' && (
          <LandingPageView
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenTransfer={() => handleOpenTransfer()}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            transactions={transactions}
            onSelectTransaction={setSelectedTransaction}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
            onOpenTransfer={() => handleOpenTransfer()}
          />
        )}

        {activeTab === 'live' && (
          <LiveStreamView
            transactions={transactions}
            onSelectTransaction={setSelectedTransaction}
            onRefresh={loadInitialData}
            isConnected={isConnected}
            onOpenTransfer={() => handleOpenTransfer()}
          />
        )}

        {activeTab === 'graph' && (
          <GraphIntelligenceView />
        )}

        {activeTab === 'users' && (
          <MultiUserView
            onOpenTransfer={handleOpenTransfer}
            onSelectTransaction={setSelectedTransaction}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView onSelectTransaction={setSelectedTransaction} />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            onSelectTransaction={setSelectedTransaction}
            onAlertUpdated={loadInitialData}
          />
        )}

        {activeTab === 'dna' && <BehavioralDNAView />}

        {activeTab === 'model' && <ModelTelemetryView />}
      </main>

      {/* P2P Multi-User Transfer Gateway & Confirmation Pop-up Modal */}
      <P2PTransferModal
        isOpen={isP2POpen}
        onClose={() => setIsP2POpen(false)}
        onTransactionCompleted={handleTransactionSimulated}
        onViewForensics={(t) => setSelectedTransaction(t)}
        initialSenderId={p2pSenderId}
        initialReceiverId={p2pReceiverId}
      />

      {/* Forensic XAI Modal Drawer */}
      {selectedTransaction && (
        <XAIModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdateStatus={handleUpdateTransactionStatus}
        />
      )}

      {/* Floating Real-time CRITICAL Incident Notification Toasts */}
      <aside aria-label="Security Incident Notifications" className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto p-4 rounded-2xl glass-card border border-rose-500/40 bg-zinc-950/95 shadow-glow-danger animate-fadeIn flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mt-0.5">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-rose-300">
                    {toast.title}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {toast.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1 font-mono">
                  {toast.message}
                </p>
                {toast.transaction && (
                  <button
                    onClick={() => {
                      if (toast.transaction) setSelectedTransaction(toast.transaction);
                      dismissToast(toast.id);
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-2"
                  >
                    <span>Launch Explainable AI Forensics</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </aside>

      {/* Ambient Footer */}
      <footer className="border-t border-white/[0.06] py-4 px-6 text-center text-xs font-mono text-zinc-400">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            TRANSACT GUARD SOC v2.4 · Autonomous Multi-Signal Financial Defense
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Inference Engine: Nominal (16.8ms)
            </span>
            <span>Security Protocol: TLS 1.3 / E2EE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

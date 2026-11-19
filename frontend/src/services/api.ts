import type { 
  DashboardMetrics, 
  Transaction, 
  FraudAlert, 
  UserBehaviorProfile, 
  UserSummary,
  P2PPreScreenResult,
  ModelRegistryResponse,
  CounterfactualRequest,
  CounterfactualResponse,
  GraphNetworkResponse
} from '../types';

const API_BASE = 'http://localhost:8000/api/v1';

export const api = {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${API_BASE}/dashboard/metrics`);
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  async getLiveTransactions(limit = 60): Promise<Transaction[]> {
    const res = await fetch(`${API_BASE}/transactions/live?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch live transactions');
    return res.json();
  },

  async getTransactionHistory(params: {
    skip?: number;
    limit?: number;
    risk_level?: string;
    payment_method?: string;
    user_id?: string;
    search?: string;
  } = {}): Promise<Transaction[]> {
    const q = new URLSearchParams();
    if (params.skip) q.append('skip', String(params.skip));
    if (params.limit) q.append('limit', String(params.limit));
    if (params.risk_level) q.append('risk_level', params.risk_level);
    if (params.payment_method) q.append('payment_method', params.payment_method);
    if (params.user_id) q.append('user_id', params.user_id);
    if (params.search) q.append('search', params.search);

    const res = await fetch(`${API_BASE}/transactions/history?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch transaction history');
    return res.json();
  },

  async getTransactionDetails(id: string): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch transaction details');
    return res.json();
  },

  async continueTransaction(txnId: string): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions/${txnId}/continue`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to continue transaction');
    return res.json();
  },

  async preScreenP2PTransfer(payload: {
    sender_id: string;
    receiver_id: string;
    amount: number;
    currency?: string;
    payment_method?: string;
    note?: string;
  }): Promise<P2PPreScreenResult> {
    const cleanPayload = {
      sender_id: String(payload.sender_id || ''),
      receiver_id: String(payload.receiver_id || ''),
      amount: Number(payload.amount || 0),
      currency: String(payload.currency || 'TGX'),
      payment_method: String(payload.payment_method || 'P2P_TRANSFER'),
      note: String(payload.note || '')
    };
    const res = await fetch(`${API_BASE}/transactions/p2p/pre-screen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Pre-screen error' }));
      throw new Error(err.detail || 'Pre-screen validation failed');
    }
    return res.json();
  },

  async executeP2PTransfer(payload: {
    sender_id: string;
    receiver_id: string;
    amount: number;
    currency?: string;
    payment_method?: string;
    note?: string;
  }): Promise<Transaction> {
    const cleanPayload = {
      sender_id: String(payload.sender_id || ''),
      receiver_id: String(payload.receiver_id || ''),
      amount: Number(payload.amount || 0),
      currency: String(payload.currency || 'TGX'),
      payment_method: String(payload.payment_method || 'P2P_TRANSFER'),
      note: String(payload.note || '')
    };
    const res = await fetch(`${API_BASE}/transactions/p2p`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Transfer failed' }));
      throw new Error(err.detail || 'Transfer failed to execute');
    }
    return res.json();
  },

  async getAlerts(status?: string, risk_level?: string): Promise<FraudAlert[]> {
    const q = new URLSearchParams();
    if (status) q.append('status', status);
    if (risk_level) q.append('risk_level', risk_level);

    const res = await fetch(`${API_BASE}/alerts?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async updateAlertStatus(id: string, status: string, notes?: string): Promise<FraudAlert> {
    const res = await fetch(`${API_BASE}/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, analyst_notes: notes }),
    });
    if (!res.ok) throw new Error('Failed to update alert');
    return res.json();
  },

  async getUsers(): Promise<UserSummary[]> {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async createUser(payload: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    city?: string;
    balance?: number;
    currency?: string;
  }): Promise<UserSummary> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create user' }));
      throw new Error(err.detail || 'Failed to create user');
    }
    return res.json();
  },

  async depositFunds(userId: string, amount: number, currency = 'TGX'): Promise<{
    user_id: string;
    name: string;
    new_balance: number;
    currency: string;
  }> {
    const res = await fetch(`${API_BASE}/users/${userId}/deposit?amount=${amount}&currency=${currency}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to deposit funds');
    return res.json();
  },

  async getUserProfile(userId: string): Promise<UserBehaviorProfile> {
    const res = await fetch(`${API_BASE}/users/${userId}/profile`);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async triggerScenario(
    scenario: string, 
    userId?: string, 
    customAmount?: number,
    currency?: string
  ): Promise<Transaction> {
    const q = new URLSearchParams({ scenario });
    if (userId) q.append('user_id', userId);
    if (customAmount) q.append('custom_amount', String(customAmount));
    if (currency) q.append('currency', currency);

    const res = await fetch(`${API_BASE}/simulator/scenarios?${q.toString()}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to trigger simulator scenario');
    return res.json();
  },

  async getModelRegistry(): Promise<ModelRegistryResponse> {
    const res = await fetch(`${API_BASE}/models/registry`);
    if (!res.ok) throw new Error('Failed to fetch model registry');
    return res.json();
  },

  async selectChampionModel(model_id: string): Promise<{
    status: string;
    message: string;
    champion_model_id: string;
    champion_model_name: string;
  }> {
    const res = await fetch(`${API_BASE}/models/select-champion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_id })
    });
    if (!res.ok) throw new Error('Failed to switch champion model');
    return res.json();
  },

  async compareModelInferences(features: Record<string, any>): Promise<any> {
    const res = await fetch(`${API_BASE}/models/compare-inference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features)
    });
    if (!res.ok) throw new Error('Failed to compare model inferences');
    return res.json();
  },

  async triggerPipelineRetrain(): Promise<any> {
    const res = await fetch(`${API_BASE}/models/retrain`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to trigger pipeline retraining');
    return res.json();
  },

  async simulateCounterfactual(payload: CounterfactualRequest): Promise<CounterfactualResponse> {
    const res = await fetch(`${API_BASE}/transactions/counterfactual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to execute counterfactual simulation');
    return res.json();
  },

  async verifyStepUpChallenge(txnId: string, challengeType = 'OTP_VERIFICATION'): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions/${txnId}/verify-challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_type: challengeType, verification_code: '123456' })
    });
    if (!res.ok) throw new Error('Failed to verify step-up challenge');
    return res.json();
  },

  async getTransactionGraph(limit = 150): Promise<GraphNetworkResponse> {
    const res = await fetch(`${API_BASE}/graph/network?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch transaction graph');
    return res.json();
  },

  async getUserMuleAnalysis(userId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/graph/mule-analysis/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user mule analysis');
    return res.json();
  }
};

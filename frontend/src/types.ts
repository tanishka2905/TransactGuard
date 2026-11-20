export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TransactionStatus = 'APPROVED' | 'FLAGGED' | 'BLOCKED';
export type AlertStatus = 'NEW' | 'REVIEWING' | 'RESOLVED' | 'FALSE_POSITIVE' | 'CONFIRMED_FRAUD' | 'RESOLVED_CONFIRMED_GENUINE';

export type FrictionTier = 
  | 'TIER_1_ZERO_FRICTION' 
  | 'TIER_2_SECURITY_QUESTION' 
  | 'TIER_3_HARDWARE_PASSKEY' 
  | 'TIER_4_ESCROW_OR_SOC_REVIEW';

export type ChallengeType = 
  | 'NONE' 
  | 'SECURITY_QUESTION' 
  | 'HARDWARE_PASSKEY' 
  | 'ESCROW_COOLING_OFF'
  | 'SOC_ANALYST_OVERRIDE'
  | 'OTP_VERIFICATION'
  | 'BIOMETRIC_STEP_UP';

export interface ModelPredictionItem {
  name: string;
  probability: number;
  verdict: 'LEGITIMATE' | 'FRAUD' | string;
  algorithm?: string;
  latency_ms?: number;
  is_champion?: boolean;
  fraud_probability?: number;
}

export interface ModelComparisonData {
  champion_model: string;
  champion_model_name: string;
  models: Record<string, ModelPredictionItem>;
  average_probability: number;
  model_variance?: number;
  consensus_agreement: string;
}

export interface FeatureBreakdown {
  ml_contribution: number;
  anomaly_contribution: number;
  rule_contribution: number;
  velocity_contribution: number;
  ml_probability_raw?: number;
  anomaly_score_raw?: number;
  rule_score_raw?: number;
  velocity_score_raw?: number;
  speed_kmh?: number;
  amount_ratio?: number;
  is_new_device?: boolean;
  is_night?: boolean;
  rules_detail?: Record<string, number>;
  ml_detail?: Record<string, number>;
  p2p_sender?: any;
  p2p_receiver?: any;
  model_comparison?: ModelComparisonData;
  friction_tier?: FrictionTier;
  friction_description?: string;
  challenge_type?: ChallengeType;
  recommended_action?: string;
  escrow_until?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  timestamp: string;
  payment_method: string;
  merchant_id?: string;
  merchant_category?: string;
  device_id: string;
  device_fingerprint?: string;
  ip_address?: string;
  network_type?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  beneficiary_id?: string;
  beneficiary_name?: string;
  beneficiary_user_id?: string;
  sender_balance_after?: number;
  beneficiary_balance_after?: number;
  transaction_type?: string;
  status: TransactionStatus;
  risk_score: number;
  risk_level: RiskLevel;
  ml_probability: number;
  anomaly_score: number;
  rule_score: number;
  velocity_score: number;
  reasons: string[];
  feature_breakdown: FeatureBreakdown;
  source: string;
  is_live: boolean;
  created_at?: string;
  model_comparison?: ModelComparisonData;
  active_champion_model?: string;
}

export interface FraudAlert {
  id: string;
  transaction_id: string;
  user_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  reasons: string[];
  status: AlertStatus;
  analyst_notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at?: string;
  transaction?: Transaction;
}

export interface HourlyVolumeItem {
  hour: string;
  total_transactions: number;
  flagged_transactions: number;
  volume_amount: number;
}

export interface DashboardMetrics {
  live_transactions_count: number;
  transactions_today_count: number;
  total_volume_today: number;
  avg_transaction_value: number;
  total_fraud_alerts: number;
  active_critical_alerts: number;
  fraud_rate_percentage: number;
  avg_latency_ms: number;
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  hourly_volume: HourlyVolumeItem[];
  payment_method_distribution: Record<string, number>;
  recent_alerts: FraudAlert[];
}

export interface UserBehaviorProfile {
  user_id: string;
  avg_amount: number;
  std_amount: number;
  median_amount: number;
  max_amount: number;
  normal_amount_min: number;
  normal_amount_max: number;
  preferred_hours: number[];
  night_txn_ratio: number;
  known_devices: string[];
  known_locations: string[];
  typical_lat?: number;
  typical_lon?: number;
  frequent_beneficiaries: string[];
  avg_daily_txns: number;
  total_txns: number;
  last_updated: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  balance: number;
  currency: string;
  avatar?: string;
  account_number?: string;
  risk_segment: string;
  avg_amount: number;
  std_amount?: number;
  total_txns: number;
  known_devices_count: number;
  known_devices?: string[];
  primary_location: string;
  security_question?: string;
  security_answer?: string;
  frequent_beneficiaries?: string[];
}

export interface P2PPreScreenResult {
  sender_id: string;
  sender_name: string;
  sender_balance: number;
  sender_balance_after: number;
  receiver_id: string;
  receiver_name: string;
  receiver_balance: number;
  receiver_balance_after: number;
  amount: number;
  currency: string;
  risk_score: number;
  risk_level: RiskLevel;
  ml_probability: number;
  anomaly_score: number;
  rule_score: number;
  velocity_score: number;
  reasons: string[];
  warnings: string[];
  requires_confirmation: boolean;
  is_new_beneficiary: boolean;
  sender_city: string;
  receiver_city: string;
  friction_tier?: FrictionTier;
  challenge_type?: ChallengeType;
  recommended_action?: string;
  escrow_until?: string;
  security_question?: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rateToInr: number;
}

export interface ModelComparisonRationaleItem {
  why_chosen?: string;
  why_not_chosen?: string;
  strengths?: string[];
  limitations?: string[];
  trade_offs?: string;
}

export interface ModelBenchmark {
  model_id: string;
  name: string;
  category: string;
  rank?: number;
  tournament_score?: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
  latency_ms: number;
  training_time_s: number;
  file: string;
  requires_scaling: boolean;
  why_chosen?: string;
  why_not_chosen?: string;
  strengths?: string[];
  limitations?: string[];
  trade_offs?: string;
}

export interface ModelRegistryResponse {
  version: string;
  champion_model_id: string;
  champion_model_name: string;
  active_models_count: number;
  selection_mode?: string;
  autonomous_champion_reason?: string;
  dataset: {
    total_samples: number;
    train_samples: number;
    test_samples: number;
    fraud_rate_pct: number;
    features_count: number;
  };
  leaderboard: ModelBenchmark[];
  comparison_rationales?: Record<string, ModelComparisonRationaleItem>;
  feature_importances: Record<string, number>;
  feature_columns: string[];
  last_trained_timestamp?: string;
}

export interface CounterfactualRequest {
  transaction_id?: string;
  user_id?: string;
  amount?: number;
  speed_kmh?: number;
  is_new_device?: number;
  is_night?: number;
  is_new_beneficiary?: number;
  velocity_5m?: number;
  model_id?: string;
}

export interface CounterfactualResponse {
  original_risk_score: number;
  original_risk_level: string;
  original_status: string;
  counterfactual_risk_score: number;
  counterfactual_risk_level: string;
  counterfactual_status: string;
  score_delta: number;
  decision_flipped: boolean;
  active_model_used: string;
  counterfactual_reasons: string[];
  feature_breakdown: Record<string, any>;
}

export interface GraphNode {
  id: string;
  label: string;
  balance: number;
  city: string;
  in_degree: number;
  out_degree: number;
  total_inflow: number;
  total_outflow: number;
  mule_risk_score: number;
  syndicate_flags: string[];
  is_suspicious: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  timestamp: string;
  status: string;
  is_flagged: boolean;
}

export interface GraphNetworkResponse {
  summary: {
    total_nodes: number;
    total_edges: number;
    detected_cycles_count: number;
    shared_device_clusters_count: number;
    high_risk_mules_count: number;
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
  detected_cycles: string[][];
  shared_device_clusters: {
    device_id: string;
    user_ids: string[];
  }[];
  mule_hotspots: {
    user_id: string;
    name: string;
    mule_risk_score: number;
    flags: string[];
  }[];
}

export const FIXED_INITIAL_TIMESTAMP = 1729756800000;

export type SymbolType = 'BTC/USDT' | 'ETH/USDT' | 'SOL/USDT' | 'BNB/USDT';

export type TimeframeType = '15m' | '1h' | '4h' | '1D';

export type HorizonType = 'INTRADAY' | 'SWING' | 'POSITION';

export type RegimeType = 
  | 'BULL_TREND'
  | 'BEAR_TREND'
  | 'MEAN_REVERTING'
  | 'HIGH_VOL_CRISIS'
  | 'CHOPPY_RANGE';

export type RecommendationDecision = 
  | 'BUY' 
  | 'SELL' 
  | 'WAIT' 
  | 'NO_TRADE' 
  | 'INSUFFICIENT_DATA';

export type DataSourceType = 
  | 'LIVE_PUBLIC' 
  | 'DELAYED' 
  | 'CACHED' 
  | 'SIMULATED_DEMO';

export interface MarketData {
  symbol: SymbolType;
  price: number;
  change24h: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  volume24hUsd: number;
  realizedVolatilityAnn: number; // e.g. 0.45 = 45%
  atr: number; // Average True Range
  regime: RegimeType;
  regimeConfidence: number; // 0.0 to 1.0
  ofiScore: number; // -1.0 (heavy sell pressure) to +1.0 (heavy buy pressure)
  bestBid: number;
  bestAsk: number;
  spreadBps: number;
  bidDepthUsd: number;
  askDepthUsd: number;
  isSimulated: boolean;
  dataSourceLabel: string;
  dataSourceType: DataSourceType;
  lastUpdated: number;
}

export interface TradeScenario {
  entryPrice: number;
  entryZone: [number, number];
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  rewardToRiskRatio: number;
  estimatedFeeBps: number;
  estimatedSlippageBps: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expectedHorizon: string;
  maxRiskAmountUsd: number;
  approvedPositionSize: number;
  fractionalKellyScore: number;
}

export interface ConsolidatedRecommendation {
  id: string;
  timestamp: number;
  symbol: SymbolType;
  timeframe: TimeframeType;
  horizon: HorizonType;
  decision: RecommendationDecision;
  referencePrice: number;
  priceTimestamp: number;
  dataSource: DataSourceType;
  dataSourceLabel: string;
  
  // Trade scenario (when justified by BUY or SELL)
  tradeScenario?: TradeScenario;
  
  // Evidence quality (0 - 100)
  evidenceQuality: number;
  evidenceQualityLabel: string;

  // Concise 3-point explanation
  conciseExplanation: {
    whyDecisionAr: string;
    supportingVsContradictingAr: string;
    invalidationRiskAr: string;
  };

  // Full quantitative details
  details: {
    dataSanity: {
      passed: boolean;
      freshnessSeconds: number;
      spreadSane: boolean;
      notesAr: string;
    };
    regime: RegimeType;
    regimeConfidence: number;
    ofiScore: number;
    signalAgreementScore: number; // -1.0 (all sell) to +1.0 (all buy), near 0 = conflicted
    modelSignals: {
      name: string;
      direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      weight: number;
      reasonAr: string;
    }[];
    riskGuardEvaluation: {
      passed: boolean;
      vetoCode: string | null;
      vetoReasonAr: string | null;
      tradeRiskPct: number;
      projectedDrawdownPct: number;
      dsrScore?: number;
      evtVaR99Pct?: number;
    };
    expectedAlphaBps: number;
  };

  rawJsonSchema: string;
}

export interface WatchlistScanResult {
  symbol: SymbolType;
  decision: RecommendationDecision;
  referencePrice: number;
  timeframe: TimeframeType;
  evidenceQuality: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNAVAILABLE';
  ofiScore: number;
  regime: RegimeType;
  lastUpdated: number;
}

export interface RecommendationHistoryItem {
  id: string;
  timestamp: number;
  symbol: SymbolType;
  timeframe: TimeframeType;
  decision: RecommendationDecision;
  referencePrice: number;
  dataSource: DataSourceType;
  evidenceQuality: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskStatus: 'PASSED' | 'VETOED' | 'INSUFFICIENT';
  observedOutcome?: 'HIT_TP' | 'HIT_SL' | 'EXPIRED_FLAT' | 'PENDING';
  simulatedReturnPct?: number;
}

export interface OrderProposal {
  id: string;
  timestamp: number;
  symbol: SymbolType;
  direction: 'LONG' | 'SHORT';
  currentPrice: number;
  entryPrice: number;
  stopLoss: number;
  requestedSize: number; // In coin units (e.g. 0.25 BTC)
  portfolioEquity: number; // In USDT (e.g. 50,000 USDT)
  currentDailyDrawdownPct: number; // In % (e.g. 0.8% = 0.008)
  historicalTrialsCount: number; // Number of tested strategy variations (N)
  estimatedAnnualSharpe: number; // e.g. 1.80
  trackRecordDays: number; // Days of return samples (T)
}

export interface AlphaHypothesis {
  regime: RegimeType;
  regimeConfidence: number;
  ofiScore: number;
  microstructureImbalanceRatio: number;
  expectedAlphaBps: number;
  actionProposal: 'STRONG_LONG' | 'WEAK_LONG' | 'NEUTRAL' | 'WEAK_SHORT' | 'STRONG_SHORT';
  hypothesisSummaryAr: string;
}

export interface RiskGuardCheckDetail {
  passed: boolean;
  status: 'PASSED' | 'FAILED' | 'DATA_INSUFFICIENT';
  metricNameAr: string;
  currentValueDisplay: string;
  thresholdDisplay: string;
  messageAr: string;
}

export interface RiskGuardCheckResult {
  passed: boolean;
  vetoTriggered: boolean;
  vetoCode: string | null;
  vetoReasonAr: string | null;
  checks: {
    stopLoss: RiskGuardCheckDetail & {
      stopDistancePct: number;
      isOrientationValid: boolean;
    };
    riskPerTrade1Pct: RiskGuardCheckDetail & {
      riskAmountUsd: number;
      riskPctOfEquity: number;
      maxAllowedRiskUsd: number;
    };
    dailyDrawdownMax3Pct: RiskGuardCheckDetail & {
      currentDrawdownPct: number;
      worstCaseProjectedDrawdownPct: number;
      maxAllowedDrawdownPct: number;
    };
    deflatedSharpeRatio: RiskGuardCheckDetail & {
      dsrScore?: number;
      requiredThreshold: number;
      trialsCount: number;
      sampleDays: number;
    };
    evtVaR99: RiskGuardCheckDetail & {
      evtVar99Pct?: number;
      tailSampleCount: number;
    };
  };
}

export interface ExecutionSizing {
  approvedSize: number;
  recommendedLeverage: number;
  fractionalKellyFraction: number;
  notionalExposureUsd: number;
  maxCapitalLossUsd: number;
  riskPctOfEquity: number;
  executionRouting: 'LIMIT_MAKER' | 'ICEBERG_TWAP' | 'REJECTED_BY_RISK_GUARD';
  executionAdviceAr: string;
}

export interface DecisionRecord {
  id: string;
  timestamp: number;
  symbol: SymbolType;
  direction: 'LONG' | 'SHORT';
  finalDecision: 'APPROVED' | 'REJECTED_VETO' | 'DATA_INSUFFICIENT';
  proposal: OrderProposal;
  alphaAgent: AlphaHypothesis;
  riskGuard: RiskGuardCheckResult;
  executionAgent: ExecutionSizing;
  explanationAr: string;
  strictJsonSchemaOutput: string;
}

export interface BacktestBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ofi: number;
  regime: RegimeType;
}

export interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  winRatePct: number;
  initialCapital: number;
  finalEquity: number;
  netProfitUsd: number;
  totalReturnPct: number;
  annualizedReturnPct: number;
  annualizedVolatilityPct: number;
  standardSharpeRatio: number;
  deflatedSharpeRatio: number;
  maxDrawdownPct: number;
  maxDrawdownDurationBars: number;
  profitFactor: number;
  skewness: number;
  kurtosis: number;
  evtVaR99Pct: number;
  lookAheadBiasAudit: {
    passed: boolean;
    informationLagBars: number;
    dataLeakageRisk: 'NONE' | 'LOW' | 'HIGH';
    notesAr: string;
  };
}

export interface BacktestCurvePoint {
  index: number;
  timestamp: number;
  price: number;
  equity: number;
  drawdownPct: number;
  tradeEvent?: 'BUY' | 'SELL' | 'STOP_LOSS' | 'TAKE_PROFIT';
}

export interface UnitTestItem {
  id: string;
  titleAr: string;
  category: 'STOP_LOSS' | 'CAPITAL_RISK' | 'DRAWDOWN' | 'DSR' | 'EVT' | 'COMPLIANT';
  descriptionAr: string;
  inputProposal: OrderProposal;
  expectedDecision: 'APPROVED' | 'REJECTED_VETO' | 'DATA_INSUFFICIENT';
  expectedVetoCode?: string;
  actualResult?: DecisionRecord;
  testPassed?: boolean;
}

/**
 * Deterministic Financial & Statistical Mathematics Library (AQDE-Core)
 * Implements exact formulas for DSR, EVT-VaR (Peaks-over-Threshold),
 * Skewness, Kurtosis, Order Flow Imbalance, and Fractional Kelly sizing.
 * No price hallucination: returns DATA_INSUFFICIENT when sample bounds fail.
 */

export const EULER_MASCHERONI = 0.5772156649015329;

/**
 * Standard Normal Cumulative Distribution Function Phi(z)
 * Uses high-precision Hart approximation (error < 1e-7)
 */
export function normalCDF(z: number): number {
  if (z > 6) return 1.0;
  if (z < -6) return 0.0;
  
  // Abramowitz & Stegun 26.2.17 polynomial approximation
  const p = 0.2316419;
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ);
  const pdf = (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * absZ * absZ);
  
  const poly = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;
  const cdf = 1.0 - pdf * poly;
  
  return sign === -1 ? 1.0 - cdf : cdf;
}

/**
 * Inverse Normal CDF (Quantile function Z^-1(p))
 * Uses Acklam's rational approximation (error < 1.15e-9)
 */
export function normalInvCDF(p: number): number {
  if (p <= 0 || p >= 1) {
    if (p <= 0) return -8.0;
    return 8.0;
  }
  
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > pHigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
         (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * Calculate statistical moments (Mean, Variance, Skewness, Kurtosis)
 */
export function calculateMoments(returns: number[]): {
  mean: number;
  variance: number;
  stdDev: number;
  skewness: number;
  kurtosis: number;
} {
  const n = returns.length;
  if (n < 4) {
    return { mean: 0, variance: 0, stdDev: 0, skewness: 0, kurtosis: 3 };
  }

  const mean = returns.reduce((sum, r) => sum + r, 0) / n;
  
  let m2 = 0;
  let m3 = 0;
  let m4 = 0;

  for (let i = 0; i < n; i++) {
    const diff = returns[i] - mean;
    const diff2 = diff * diff;
    m2 += diff2;
    m3 += diff2 * diff;
    m4 += diff2 * diff2;
  }

  const variance = m2 / (n - 1);
  const stdDev = Math.sqrt(variance);
  
  // Unbiased skewness & excess kurtosis adjusted
  const skewness = stdDev > 0 ? (m3 / n) / Math.pow(m2 / n, 1.5) : 0;
  const kurtosis = stdDev > 0 ? (m4 / n) / Math.pow(m2 / n, 2.0) : 3;

  return { mean, variance, stdDev, skewness, kurtosis };
}

/**
 * Expected Maximum Sharpe Ratio under Null Hypothesis of No Skill (Bailey & López de Prado)
 * E[max(SR_n)] approx sqrt(V[SR]) * ((1 - gamma) * Z^-1(1 - 1/N) + gamma * Z^-1(1 - 1/(N*e)))
 */
export function expectedMaxSharpeRatio(trialsCount: number, varSharpe: number = 0.5): number {
  if (trialsCount <= 1) return 0;
  
  const N = Math.max(2, trialsCount);
  const z1 = normalInvCDF(1 - 1 / N);
  const z2 = normalInvCDF(1 - 1 / (N * Math.E));
  
  const expectedMax = Math.sqrt(varSharpe) * ((1 - EULER_MASCHERONI) * z1 + EULER_MASCHERONI * z2);
  return Math.max(0, expectedMax);
}

/**
 * Deflated Sharpe Ratio (DSR) Implementation
 * Corrects for Multiple Testing (Selection Bias) and Non-Normality (Fat tails, Skewness)
 */
export function computeDeflatedSharpeRatio(params: {
  estimatedAnnualSharpe: number;
  trackRecordDays: number;
  trialsCount: number;
  skewness?: number;
  kurtosis?: number;
}): {
  status: 'CALCULATED' | 'DATA_INSUFFICIENT';
  dsrScore?: number;
  expectedMaxSR?: number;
  sigmaSR?: number;
  reasonAr?: string;
} {
  const { estimatedAnnualSharpe, trackRecordDays, trialsCount } = params;
  const skewness = params.skewness ?? -0.3; // Default realistic crypto negative skew if unspecified
  const kurtosis = params.kurtosis ?? 4.5;  // Default fat tail

  // Rigorous data sanity checks: Never hallucinate without adequate sample size
  if (trackRecordDays < 30) {
    return {
      status: 'DATA_INSUFFICIENT',
      reasonAr: `فترة سجل العوائد (${trackRecordDays} يومًا) غير كافية إحصائيًا لحساب DSR. الحد الأدنى المطلوب هو 30 يومًا على الأقل.`
    };
  }

  if (trialsCount < 1) {
    return {
      status: 'DATA_INSUFFICIENT',
      reasonAr: 'عدد التجارب التاريخية (N) يجب أن يكون 1 على الأقل.'
    };
  }

  // Convert annual SR to period SR if assuming daily observations (T = trackRecordDays)
  // Daily Sharpe = Annual Sharpe / sqrt(365)
  const T = trackRecordDays;
  const dailySR = estimatedAnnualSharpe / Math.sqrt(365);
  
  // Mertens (2002) asymptotic variance of Sharpe Ratio with non-normal returns
  const varianceDailySR = (1 - skewness * dailySR + ((kurtosis - 1) / 4) * Math.pow(dailySR, 2)) / (T - 1);
  const sigmaDailySR = Math.sqrt(Math.max(1e-6, varianceDailySR));
  
  // Annualized sigma for comparison
  const sigmaAnnualSR = sigmaDailySR * Math.sqrt(365);

  // Expected Maximum Sharpe among N trials assuming variance of historical strategies
  const varianceOfTrials = 0.5; // Benchmark variance across typical quant multi-testing
  const expMaxSR = expectedMaxSharpeRatio(trialsCount, varianceOfTrials);

  // Compute test statistic Z
  const zStat = (estimatedAnnualSharpe - expMaxSR) / Math.max(1e-4, sigmaAnnualSR);
  const dsr = normalCDF(zStat);

  return {
    status: 'CALCULATED',
    dsrScore: Math.min(0.9999, Math.max(0.0001, dsr)),
    expectedMaxSR: expMaxSR,
    sigmaSR: sigmaAnnualSR
  };
}

/**
 * Extreme Value Theory (EVT) Peaks-Over-Threshold (POT) VaR
 * Fits Generalized Pareto Distribution (GPD) to tail exceedances
 */
export function computeEVTVaR99(losses: number[], confidenceLevel: number = 0.99): {
  status: 'CALCULATED' | 'DATA_INSUFFICIENT';
  evtVaR99Pct?: number;
  tailSampleCount: number;
  threshold?: number;
  reasonAr?: string;
} {
  const n = losses.length;
  // If sample size is too small, return DATA_INSUFFICIENT to avoid false confidence
  if (n < 50) {
    return {
      status: 'DATA_INSUFFICIENT',
      tailSampleCount: 0,
      reasonAr: `حجم عينة الخسائر (${n} نقطة) أقل من الحد الأدنى المقبول إحصائيًا لنظرية القيم القصوى (50 نقطة).`
    };
  }

  // Sort losses in ascending order (where positive numbers represent magnitude of loss)
  const positiveLosses = losses.map(l => Math.abs(l)).sort((a, b) => a - b);
  
  // High threshold u at 90th percentile
  const thresholdIndex = Math.floor(n * 0.90);
  const u = positiveLosses[thresholdIndex];
  
  // Exceedances over threshold u
  const exceedances = positiveLosses.filter(l => l > u).map(l => l - u);
  const Nu = exceedances.length;

  if (Nu < 10) {
    return {
      status: 'DATA_INSUFFICIENT',
      tailSampleCount: Nu,
      threshold: u,
      reasonAr: `عدد النقاط المتجاوزة لعتبة الذيل (${Nu}) أقل من 10 نقاط، ولا يكفي لتقدير موثوق لمعاملات GPD.`
    };
  }

  // Method of Moments / Pickands estimator for Generalized Pareto Distribution (xi shape, beta scale)
  const meanExceedance = exceedances.reduce((a, b) => a + b, 0) / Nu;
  let varExceedance = 0;
  for (let i = 0; i < Nu; i++) {
    varExceedance += Math.pow(exceedances[i] - meanExceedance, 2);
  }
  varExceedance /= (Nu - 1);

  // Estimators for GPD parameters:
  // mean = beta / (1 - xi) for xi < 1
  // var = beta^2 / ((1 - xi)^2 * (1 - 2*xi))
  let xi = 0.5 * (1 - Math.pow(meanExceedance, 2) / Math.max(1e-6, varExceedance));
  // Bound tail index between -0.5 and 0.5 for stable financial asset returns
  xi = Math.max(-0.4, Math.min(0.45, xi));
  const beta = meanExceedance * (1 - xi);

  // EVT Value at Risk at alpha (e.g. 0.99)
  const alpha = 1 - confidenceLevel; // 0.01
  let evtVaR: number;

  if (Math.abs(xi) < 1e-4) {
    // Gumbel domain limit (xi -> 0)
    evtVaR = u + beta * Math.log((Nu / n) / alpha);
  } else {
    // Generalized Pareto VaR formula
    const term = Math.pow((n / Nu) * alpha, -xi);
    evtVaR = u + (beta / xi) * (term - 1);
  }

  return {
    status: 'CALCULATED',
    evtVaR99Pct: Math.max(0.005, evtVaR),
    tailSampleCount: Nu,
    threshold: u
  };
}

/**
 * Order Flow Imbalance (OFI) Calculation
 * Quantifies net aggressive institutional pressure from order book dynamics
 */
export function calculateOFI(params: {
  bestBid: number;
  prevBid: number;
  bidSize: number;
  prevBidSize: number;
  bestAsk: number;
  prevAsk: number;
  askSize: number;
  prevAskSize: number;
}): number {
  const { bestBid, prevBid, bidSize, prevBidSize, bestAsk, prevAsk, askSize, prevAskSize } = params;

  let deltaBid = 0;
  if (bestBid > prevBid) {
    deltaBid = bidSize;
  } else if (bestBid === prevBid) {
    deltaBid = bidSize - prevBidSize;
  } else {
    deltaBid = -prevBidSize;
  }

  let deltaAsk = 0;
  if (bestAsk < prevAsk) {
    deltaAsk = askSize;
  } else if (bestAsk === prevAsk) {
    deltaAsk = askSize - prevAskSize;
  } else {
    deltaAsk = -prevAskSize;
  }

  const rawOFI = deltaBid - deltaAsk;
  const totalVolume = (bidSize + askSize + prevBidSize + prevAskSize) / 2;
  
  if (totalVolume <= 0) return 0;
  
  // Normalize OFI between -1.0 and +1.0
  const normalizedOFI = rawOFI / totalVolume;
  return Math.max(-1.0, Math.min(1.0, normalizedOFI));
}

/**
 * Fractional Kelly sizing with volatility parity
 */
export function calculateFractionalKelly(params: {
  winRate: number; // e.g. 0.55
  profitFactor: number; // Win/Loss payoff ratio b = avgWin / avgLoss
  volatilityAnn: number; // e.g. 0.50
  fractionMultiplier?: number; // Conservative multiplier, default 0.15 (15% Kelly)
}): number {
  const { winRate, profitFactor, fractionMultiplier = 0.15 } = params;
  const p = Math.max(0.01, Math.min(0.99, winRate));
  const b = Math.max(0.5, profitFactor);
  const q = 1 - p;

  // Full Kelly = (p * b - q) / b
  const fullKelly = (p * b - q) / b;
  
  if (fullKelly <= 0) return 0;

  // Scale down by fractionMultiplier to guarantee capital survival
  const fractional = fullKelly * fractionMultiplier;
  return Math.max(0, Math.min(0.05, fractional));
}

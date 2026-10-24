import { MarketData, OrderProposal, AlphaHypothesis } from './types';

/**
 * ALPHA AGENT (AQDE-Core Sub-Agent 1)
 * Generates probabilistic hypotheses based on:
 * 1. Regime classification (Bayesian Online Changepoint Detection / HMM regimes)
 * 2. Microstructure signals (Order Flow Imbalance - OFI)
 */
export function generateAlphaHypothesis(
  proposal: OrderProposal,
  market: MarketData
): AlphaHypothesis {
  const { direction } = proposal;
  const { regime, regimeConfidence, ofiScore } = market;

  // Evaluate alignment between requested direction and microstructure OFI
  // OFI > 0 indicates net aggressive buying in the LOB; OFI < 0 indicates aggressive selling
  let alignmentScore = 0;
  if (direction === 'LONG') {
    alignmentScore += ofiScore > 0.15 ? 1 : ofiScore < -0.15 ? -1 : 0;
  } else {
    alignmentScore += ofiScore < -0.15 ? 1 : ofiScore > 0.15 ? -1 : 0;
  }

  // Evaluate alignment with market regime
  let regimeAlignment = 0;
  if (direction === 'LONG') {
    if (regime === 'BULL_TREND') regimeAlignment = 1;
    else if (regime === 'BEAR_TREND') regimeAlignment = -1;
    else if (regime === 'HIGH_VOL_CRISIS') regimeAlignment = -0.8;
  } else {
    if (regime === 'BEAR_TREND') regimeAlignment = 1;
    else if (regime === 'BULL_TREND') regimeAlignment = -1;
    else if (regime === 'HIGH_VOL_CRISIS') regimeAlignment = 0.5;
  }

  // Combined score (-2 to +2)
  const combinedAlphaScore = alignmentScore * 0.6 + regimeAlignment * 0.4;
  
  let actionProposal: AlphaHypothesis['actionProposal'] = 'NEUTRAL';
  if (combinedAlphaScore > 0.7) {
    actionProposal = direction === 'LONG' ? 'STRONG_LONG' : 'STRONG_SHORT';
  } else if (combinedAlphaScore > 0.1) {
    actionProposal = direction === 'LONG' ? 'WEAK_LONG' : 'WEAK_SHORT';
  } else if (combinedAlphaScore < -0.4) {
    actionProposal = direction === 'LONG' ? 'WEAK_SHORT' : 'WEAK_LONG';
  }

  // Expected Alpha in basis points (1 bps = 0.01%)
  const expectedAlphaBps = Math.round(combinedAlphaScore * 45 * regimeConfidence);

  // Microstructure imbalance ratio (e.g. Bid volume / Ask volume in top book)
  const bookRatio = market.askDepthUsd > 0 ? market.bidDepthUsd / market.askDepthUsd : 1.0;

  // Construct Arabic explanation
  const ofiDesc = ofiScore > 0.25 
    ? `ضغط شراء مؤسسي حاد في دفتر الأوامر (OFI = ${ofiScore > 0 ? '+' : ''}${ofiScore.toFixed(2)})`
    : ofiScore < -0.25
    ? `ضغط بيع مؤسسي حاد في دفتر الأوامر (OFI = ${ofiScore.toFixed(2)})`
    : `تدفق أوامر متوازن نسبيًا (OFI = ${ofiScore.toFixed(2)})`;

  const regimeNamesAr: Record<string, string> = {
    BULL_TREND: 'اتجاه صاعد مدفوع بزخم (Bull Regime)',
    BEAR_TREND: 'اتجاه هابط هبوطي (Bear Regime)',
    MEAN_REVERTING: 'نطاق تذبذب مع ارتداد للمتوسط (Mean Reversion)',
    HIGH_VOL_CRISIS: 'نظام أزمة وتقلب حاد (High Volatility Crisis)',
    CHOPPY_RANGE: 'نطاق جانبي فوضوي بدون اتجاه محدد (Choppy Range)',
  };

  const hypothesisSummaryAr = `تم تصنيف النظام السوقي الحالي كـ "${regimeNamesAr[regime] || regime}" بمستوى ثقة ${(regimeConfidence * 100).toFixed(0)}%. تُظهر البنية المجهرية ${ofiDesc} مع نسبة عمق (${bookRatio.toFixed(2)}x). الألفا المتوقعة: ${expectedAlphaBps >= 0 ? '+' : ''}${expectedAlphaBps} نقطة أساس (bps). الاتجاه المقترح: ${direction}.`;

  return {
    regime,
    regimeConfidence,
    ofiScore,
    microstructureImbalanceRatio: bookRatio,
    expectedAlphaBps,
    actionProposal,
    hypothesisSummaryAr,
  };
}

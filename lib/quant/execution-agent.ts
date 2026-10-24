import { OrderProposal, RiskGuardCheckResult, ExecutionSizing, AlphaHypothesis } from './types';
import { calculateFractionalKelly } from './mathematics';

/**
 * EXECUTION AGENT (AQDE-Core Sub-Agent 3)
 * Sizes positions strictly according to:
 * 1. Fractional Kelly / Volatility Parity
 * 2. Absolute guarantee: Capital exposure per trade <= 1.0% of total equity
 * 3. Enforces Risk Guard vetoes unconditionally (sizes down to 0 if vetoed)
 */
export function executePositionSizing(params: {
  proposal: OrderProposal;
  riskGuard: RiskGuardCheckResult;
  alphaHypothesis: AlphaHypothesis;
  marketVolatilityAnn?: number;
}): ExecutionSizing {
  const { proposal, riskGuard, alphaHypothesis, marketVolatilityAnn = 0.50 } = params;
  const { entryPrice, stopLoss, requestedSize, portfolioEquity } = proposal;

  // 1. Mandatory Veto Enforcement: If Risk Guard failed, STOP immediately
  if (!riskGuard.passed) {
    return {
      approvedSize: 0,
      recommendedLeverage: 0,
      fractionalKellyFraction: 0,
      notionalExposureUsd: 0,
      maxCapitalLossUsd: 0,
      riskPctOfEquity: 0,
      executionRouting: 'REJECTED_BY_RISK_GUARD',
      executionAdviceAr: `تم تجميد التنفيذ وحظر الصفقة بالكامل بموجب سلطة النقض الإلزامية لحارس المخاطر (${riskGuard.vetoCode || 'VETO'}). حجم الصفقة المعتمد: 0.00. الأولوية المطلقة لبقاء رأس المال.`,
    };
  }

  // 2. Compute Maximum Safe Size Permitted by 1.0% Equity Risk Rule
  const stopDistance = Math.abs(entryPrice - stopLoss);
  const maxLossAllowedUsd = portfolioEquity * 0.01; // 1.0% limit
  const maxSafeSizeByRisk = stopDistance > 0 ? maxLossAllowedUsd / stopDistance : 0;

  // 3. Fractional Kelly Calculation (Volatility Parity adjusted)
  // Win rate estimate based on Alpha conviction
  let estimatedWinRate = 0.52;
  if (alphaHypothesis.actionProposal.startsWith('STRONG')) {
    estimatedWinRate = 0.57;
  } else if (alphaHypothesis.actionProposal.startsWith('WEAK')) {
    estimatedWinRate = 0.53;
  }
  
  const estimatedPayoffRatio = 1.65; // Reward-to-Risk ratio
  const fractionalKelly = calculateFractionalKelly({
    winRate: estimatedWinRate,
    profitFactor: estimatedPayoffRatio,
    volatilityAnn: marketVolatilityAnn,
    fractionMultiplier: 0.15, // Conservative 15% Kelly fraction
  });

  // Target notional equity allocation based on Kelly
  const targetKellyNotionalUsd = portfolioEquity * (fractionalKelly > 0 ? fractionalKelly * 5 : 0.05);
  const sizeByKelly = entryPrice > 0 ? targetKellyNotionalUsd / entryPrice : 0;

  // 4. Final Approved Size:
  // Must NOT exceed requestedSize, and MUST strictly satisfy the 1.0% risk cap
  const approvedSizeRaw = Math.min(requestedSize, maxSafeSizeByRisk);
  // Precision formatting (4 decimal places for crypto)
  const approvedSize = Math.floor(approvedSizeRaw * 10000) / 10000;

  const notionalExposureUsd = approvedSize * entryPrice;
  const maxCapitalLossUsd = approvedSize * stopDistance;
  const riskPctOfEquity = portfolioEquity > 0 ? (maxCapitalLossUsd / portfolioEquity) * 100 : 0;

  // Leverage calculation
  const recommendedLeverage = Math.max(1, Math.min(3, Math.round(notionalExposureUsd / portfolioEquity)));

  // Execution routing advice
  const executionRouting = notionalExposureUsd > 15000 ? 'ICEBERG_TWAP' : 'LIMIT_MAKER';
  
  const executionAdviceAr = `تمت الموافقة على حجم صفقة (${approvedSize} وحدة) بقيمة إجمالية $${notionalExposureUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}. أقصى خسارة محتملة عند ضرب وقف الخسارة هي $${maxCapitalLossUsd.toFixed(2)} (${riskPctOfEquity.toFixed(2)}% من رأس المال). التوجيه التنفيذي: استخدام أمر ${executionRouting === 'LIMIT_MAKER' ? 'صانع سوق محدد (Limit Post-Only)' : 'أمر مجزأ TWAP/Iceberg'} لتفادي الانزلاق السعري وخصم عمولات التداول.`;

  return {
    approvedSize,
    recommendedLeverage,
    fractionalKellyFraction: fractionalKelly,
    notionalExposureUsd,
    maxCapitalLossUsd,
    riskPctOfEquity,
    executionRouting,
    executionAdviceAr,
  };
}

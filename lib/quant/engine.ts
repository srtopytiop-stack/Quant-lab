import { OrderProposal, MarketData, DecisionRecord } from './types';
import { generateAlphaHypothesis } from './alpha-agent';
import { evaluateRiskGuard } from './risk-guard';
import { executePositionSizing } from './execution-agent';

/**
 * AQDE-Core Quantitative Agentic Decision Engine
 * Deterministic multi-agent coordinator for mobile & embedded environments.
 */
export function processTradeProposal(params: {
  proposal: OrderProposal;
  marketData: MarketData;
  historicalLossSamples?: number[];
}): DecisionRecord {
  const { proposal, marketData, historicalLossSamples } = params;

  // 1. Alpha Agent: Probabilistic Hypothesis
  const alphaAgent = generateAlphaHypothesis(proposal, marketData);

  // 2. Risk Guard: Mandatory Veto Evaluation
  const riskGuard = evaluateRiskGuard(proposal, historicalLossSamples);

  // 3. Execution Agent: Sizing & Routing
  const executionAgent = executePositionSizing({
    proposal,
    riskGuard,
    alphaHypothesis: alphaAgent,
    marketVolatilityAnn: marketData.realizedVolatilityAnn,
  });

  // Determine final status
  let finalDecision: DecisionRecord['finalDecision'] = 'APPROVED';
  if (riskGuard.vetoTriggered) {
    if (riskGuard.vetoCode?.startsWith('DATA_INSUFFICIENT')) {
      finalDecision = 'DATA_INSUFFICIENT';
    } else {
      finalDecision = 'REJECTED_VETO';
    }
  }

  // Construct structured Arabic explanation for the mobile user
  let explanationAr = '';
  if (finalDecision === 'APPROVED') {
    explanationAr = `✅ تمت الموافقة على مقترح الصفقة (${proposal.direction} على ${proposal.symbol}). 
حارس المخاطر تحقق من وجود وقف خسارة صريح عند $${proposal.stopLoss.toLocaleString()}، مع تحديد حجم المخاطرة بنسبة ${executionAgent.riskPctOfEquity.toFixed(2)}% (أقل من سقف 1.00%).
تم اعتماد حجم صفقة ${executionAgent.approvedSize} وحدة بقيمة اسمية $${executionAgent.notionalExposureUsd.toFixed(2)} وفقًا لنموذج فراكشنال كيلي (Fractional Kelly).`;
  } else if (finalDecision === 'REJECTED_VETO') {
    explanationAr = `⛔ تم رفض الصفقة بموجب سلطة النقض (Veto) لحارس المخاطر البرمجي.
السبب: ${riskGuard.vetoReasonAr}
كود الحظر: [${riskGuard.vetoCode}].
تم خفض حجم الصفقة إلى الصفر فورًا لحماية رأس المال ومنع خرق حدود المخاطر المقررة.`;
  } else {
    explanationAr = `⚠️ حالة: بيانات غير كافية (DATA_INSUFFICIENT).
تعذر التحقق الإحصائي الكامل بنظرية القيم القصوى أو نسبة DSR بسبب قصر سجل البيانات التاريخية.
التزامًا بالقواعد الصارمة: لم يتم اختلاق أي أرقام أو عوائد افتراضية وتم إيقاف الموافقة حتى توفر بيانات كافية.`;
  }

  // Build strict JSON schema payload
  const strictJsonOutput = {
    protocol_version: 'AQDE-CORE-v2.4-DETERMINISTIC',
    applet_id: 'b2732065-2644-4afa-97c4-e2062b7c802b',
    timestamp: new Date(proposal.timestamp).toISOString(),
    symbol: proposal.symbol,
    action: proposal.direction,
    decision_status: finalDecision,
    alpha_agent: {
      regime_classified: alphaAgent.regime,
      regime_confidence: alphaAgent.regimeConfidence,
      order_flow_imbalance_ofi: alphaAgent.ofiScore,
      expected_alpha_bps: alphaAgent.expectedAlphaBps,
      recommendation: alphaAgent.actionProposal,
    },
    risk_guard: {
      veto_authority_triggered: riskGuard.vetoTriggered,
      veto_code: riskGuard.vetoCode,
      veto_reason: riskGuard.vetoReasonAr,
      stop_loss_check: {
        passed: riskGuard.checks.stopLoss.passed,
        distance_pct: riskGuard.checks.stopLoss.stopDistancePct,
      },
      capital_risk_1pct_check: {
        passed: riskGuard.checks.riskPerTrade1Pct.passed,
        risk_pct_equity: riskGuard.checks.riskPerTrade1Pct.riskPctOfEquity,
        max_allowed_pct: 1.0,
      },
      daily_drawdown_3pct_check: {
        passed: riskGuard.checks.dailyDrawdownMax3Pct.passed,
        current_drawdown_pct: riskGuard.checks.dailyDrawdownMax3Pct.currentDrawdownPct,
        projected_drawdown_pct: riskGuard.checks.dailyDrawdownMax3Pct.worstCaseProjectedDrawdownPct,
        max_allowed_pct: 3.0,
      },
      deflated_sharpe_ratio: {
        status: riskGuard.checks.deflatedSharpeRatio.status,
        dsr_score: riskGuard.checks.deflatedSharpeRatio.dsrScore ?? null,
        required_threshold: 0.95,
      },
      evt_var_99: {
        status: riskGuard.checks.evtVaR99.status,
        tail_var_99_pct: riskGuard.checks.evtVaR99.evtVar99Pct ?? null,
      },
    },
    execution_agent: {
      approved_units: executionAgent.approvedSize,
      notional_exposure_usd: executionAgent.notionalExposureUsd,
      max_loss_usd: executionAgent.maxCapitalLossUsd,
      risk_equity_pct: executionAgent.riskPctOfEquity,
      routing: executionAgent.executionRouting,
    },
    human_explanation_ar: explanationAr,
  };

  return {
    id: proposal.id,
    timestamp: proposal.timestamp,
    symbol: proposal.symbol,
    direction: proposal.direction,
    finalDecision,
    proposal,
    alphaAgent,
    riskGuard,
    executionAgent,
    explanationAr,
    strictJsonSchemaOutput: JSON.stringify(strictJsonOutput, null, 2),
  };
}

import { UnitTestItem, OrderProposal, MarketData, FIXED_INITIAL_TIMESTAMP } from './types';
import { processTradeProposal } from './engine';

const defaultTestMarket: MarketData = {
  symbol: 'BTC/USDT',
  price: 67450,
  change24h: 1250,
  change24hPct: 1.88,
  high24h: 68100,
  low24h: 66200,
  volume24hUsd: 1420000000,
  realizedVolatilityAnn: 0.48,
  atr: 1550,
  regime: 'BULL_TREND',
  regimeConfidence: 0.84,
  ofiScore: 0.38,
  bestBid: 67448,
  bestAsk: 67452,
  spreadBps: 0.59,
  bidDepthUsd: 4850000,
  askDepthUsd: 2900000,
  isSimulated: true,
  dataSourceType: 'SIMULATED_DEMO',
  dataSourceLabel: 'بيانات تجريبية مصنفة لاختبار المحرك (AQDE-Simulated)',
  lastUpdated: FIXED_INITIAL_TIMESTAMP,
};

export const INITIAL_UNIT_TESTS: UnitTestItem[] = [
  {
    id: 'TEST_01_MISSING_SL',
    titleAr: 'حالة سلبية: صفقة بدون أمر وقف خسارة (Missing Stop-Loss)',
    category: 'STOP_LOSS',
    descriptionAr: 'محاولة إرسال اقتراح شراء بدون تحديد وقف خسارة. يجب أن يتدخل حارس المخاطر فورًا برفض قاطع (VETO).',
    inputProposal: {
      id: 'prop-test-01',
      timestamp: FIXED_INITIAL_TIMESTAMP,
      symbol: 'BTC/USDT',
      direction: 'LONG',
      currentPrice: 67450,
      entryPrice: 67450,
      stopLoss: 0, // Missing
      requestedSize: 0.1,
      portfolioEquity: 50000,
      currentDailyDrawdownPct: 0.005,
      historicalTrialsCount: 15,
      estimatedAnnualSharpe: 2.1,
      trackRecordDays: 120,
    },
    expectedDecision: 'REJECTED_VETO',
    expectedVetoCode: 'MISSING_EXPLICIT_STOP_LOSS',
  },
  {
    id: 'TEST_02_INVERTED_SL_LONG',
    titleAr: 'حالة سلبية: اتجاه وقف الخسارة معكوس في صفقة شراء (Inverted Stop-Loss)',
    category: 'STOP_LOSS',
    descriptionAr: 'إرسال وقف خسارة أعلى من سعر الدخول في صفقة شراء Long (مثال: دخول 67450 ووقف خسارة 69000). يجب تفعيل الفيتو لمنع أخطاء التوجيه.',
    inputProposal: {
      id: 'prop-test-02',
      timestamp: FIXED_INITIAL_TIMESTAMP,
      symbol: 'BTC/USDT',
      direction: 'LONG',
      currentPrice: 67450,
      entryPrice: 67450,
      stopLoss: 69000, // Invalid: higher than entry
      requestedSize: 0.1,
      portfolioEquity: 50000,
      currentDailyDrawdownPct: 0.005,
      historicalTrialsCount: 15,
      estimatedAnnualSharpe: 2.1,
      trackRecordDays: 120,
    },
    expectedDecision: 'REJECTED_VETO',
    expectedVetoCode: 'INVALID_STOP_LOSS_DIRECTION',
  },
  {
    id: 'TEST_03_EXCESSIVE_RISK',
    titleAr: 'حالة سلبية: مخاطرة تتجاوز سقف 1.0% من رأس المال (Excessive Risk per Trade)',
    category: 'CAPITAL_RISK',
    descriptionAr: 'حجم الصفقة ومسافة وقف الخسارة ينتجان خسارة محتملة قدرها $1,300 على محفظة $50,000 (أي 2.60% > 1.00%). يجب الرفض الفوري لحماية رأس المال.',
    inputProposal: {
      id: 'prop-test-03',
      timestamp: FIXED_INITIAL_TIMESTAMP,
      symbol: 'BTC/USDT',
      direction: 'LONG',
      currentPrice: 67450,
      entryPrice: 67450,
      stopLoss: 64850, // Diff = $2600
      requestedSize: 0.5, // Total risk = $1300 = 2.6% of $50,000
      portfolioEquity: 50000,
      currentDailyDrawdownPct: 0.004,
      historicalTrialsCount: 10,
      estimatedAnnualSharpe: 2.2,
      trackRecordDays: 150,
    },
    expectedDecision: 'REJECTED_VETO',
    expectedVetoCode: 'EXCEEDS_1_PERCENT_EQUITY_RISK',
  },
  {
    id: 'TEST_04_DAILY_DRAWDOWN_BREACH',
    titleAr: 'حالة سلبية: خرق سقف التراجع اليومي الأقصى 3.0% (Daily Drawdown Breach)',
    category: 'DRAWDOWN',
    descriptionAr: 'المحفظة عانت بالفعل من تراجع يومي 2.40%، وهذه الصفقة تعرض المحفظة لمخاطرة 0.85% إضافية (المجموع 3.25% > 3.00%). يجب وقف الصفقة لمنع تدهور رأس المال.',
    inputProposal: {
      id: 'prop-test-04',
      timestamp: FIXED_INITIAL_TIMESTAMP,
      symbol: 'BTC/USDT',
      direction: 'LONG',
      currentPrice: 67450,
      entryPrice: 67450,
      stopLoss: 66600, // Diff = 850
      requestedSize: 0.5, // Risk = $425 = 0.85% of $50,000
      portfolioEquity: 50000,
      currentDailyDrawdownPct: 0.024, // 2.4% already down today!
      historicalTrialsCount: 10,
      estimatedAnnualSharpe: 2.3,
      trackRecordDays: 180,
    },
    expectedDecision: 'REJECTED_VETO',
    expectedVetoCode: 'DAILY_DRAWDOWN_BREACH_PROJECTED',
  },
  {
    id: 'TEST_05_LOW_DSR_OVERFITTING',
    titleAr: 'حالة سلبية: فشل اختبار نسبة شارب المخفضة (DSR < 0.95 Failure)',
    category: 'DSR',
    descriptionAr: 'الاستراتيجية تعرض نسبة شارب اسمية مقبولة ظاهريًا (1.45)، لكن تم استخلاصها بعد تجربة N=85 استراتيجية مختلفة على مدار 45 يومًا فقط، مما يثبت الملاءمة الزائدة (Overfitting). يجب حظرها بفيتو إحصائي.',
    inputProposal: {
      id: 'prop-test-05',
      timestamp: FIXED_INITIAL_TIMESTAMP,
      symbol: 'BTC/USDT',
      direction: 'LONG',
      currentPrice: 67450,
      entryPrice: 67450,
      stopLoss: 66950,
      requestedSize: 0.5,
      portfolioEquity: 50000,
      currentDailyDrawdownPct: 0.005,
      historicalTrialsCount: 85, // Very high trial count
      estimatedAnnualSharpe: 1.45,
      trackRecordDays: 45, // Low sample
    },
    expectedDecision: 'REJECTED_VETO',
    expectedVetoCode: 'DSR_BELOW_0_95_THRESHOLD',
  },
  {
    id: 'TEST_06_DATA_INSUFFICIENT',
    titleAr: 'حالة احترازية: بيانات غير كافية لتقييم المخاطر (DATA_INSUFFICIENT)',
    category: 'DSR',
    descriptionAr: 'سجل العوائد المرفق يحتوي على 14 يومًا فقط (< 30 يومًا كحد أدنى إحصائي). يرفض المحرك اختلاق أرقام ويصنف الحالة كـ DATA_INSUFFICIENT تماشيًا مع المبادئ الصارمة.',
    inputProposal: {
      id: 'prop-test-06',
      timestamp: FIXED_INITIAL_TIMESTAMP,
      symbol: 'BTC/USDT',
      direction: 'LONG',
      currentPrice: 67450,
      entryPrice: 67450,
      stopLoss: 66950,
      requestedSize: 0.2,
      portfolioEquity: 50000,
      currentDailyDrawdownPct: 0.002,
      historicalTrialsCount: 5,
      estimatedAnnualSharpe: 2.5,
      trackRecordDays: 14, // Under 30 days!
    },
    expectedDecision: 'DATA_INSUFFICIENT',
    expectedVetoCode: 'DATA_INSUFFICIENT_FOR_DSR',
  },
  {
    id: 'TEST_07_COMPLIANT_PERFECT_TRADE',
    titleAr: 'حالة إيجابية كاملة: صفقة مطابقة لجميع المعايير الصارمة (Full Compliant Trade)',
    category: 'COMPLIANT',
    descriptionAr: 'وقف خسارة سليم (66,750)، مخاطرة محسوبة 0.70% (أقل من سقف 1.0%)، تراجع يومي متوقع 1.10% (أقل من 3.0%)، DSR = 98.2%، EVT-VaR سليم. تتم الموافقة ويحدد وكيل التنفيذ الحجم والرافعة المالية المناسبة.',
    inputProposal: {
      id: 'prop-test-07',
      timestamp: FIXED_INITIAL_TIMESTAMP,
      symbol: 'BTC/USDT',
      direction: 'LONG',
      currentPrice: 67450,
      entryPrice: 67450,
      stopLoss: 66750, // Diff = $700
      requestedSize: 0.5, // Risk = $350 = 0.70% of $50,000
      portfolioEquity: 50000,
      currentDailyDrawdownPct: 0.004, // Current DD = 0.4%
      historicalTrialsCount: 8, // Low trials
      estimatedAnnualSharpe: 2.45,
      trackRecordDays: 180, // Healthy sample
    },
    expectedDecision: 'APPROVED',
  },
];

/**
 * Execute all automated programmatic unit tests
 */
export function runAllUnitTests(marketData: MarketData = defaultTestMarket): UnitTestItem[] {
  return INITIAL_UNIT_TESTS.map((test) => {
    const actualResult = processTradeProposal({
      proposal: test.inputProposal,
      marketData,
    });

    const isDecisionMatch = actualResult.finalDecision === test.expectedDecision;
    let isVetoCodeMatch = true;
    if (test.expectedVetoCode) {
      isVetoCodeMatch = actualResult.riskGuard.vetoCode === test.expectedVetoCode;
    }

    const testPassed = isDecisionMatch && isVetoCodeMatch;

    return {
      ...test,
      actualResult,
      testPassed,
    };
  });
}

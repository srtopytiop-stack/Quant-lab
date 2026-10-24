'use client';

import React, { useState, useMemo } from 'react';
import { runStrategyBacktest, BacktestParams } from '@/lib/quant/backtester';
import { SymbolType } from '@/lib/quant/types';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  Play, 
  Settings2, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Zap, 
  BarChart3 
} from 'lucide-react';

const SVG_WIDTH = 800;
const SVG_HEIGHT = 220;
const PADDING = { top: 20, right: 30, bottom: 30, left: 50 };

export const BacktestScreen: React.FC = () => {
  const [strategy, setStrategy] = useState<'OFI_BOCPD' | 'EMA_CROSS' | 'BOLLINGER_REVERSION'>('OFI_BOCPD');
  const [symbol, setSymbol] = useState<SymbolType>('BTC/USDT');
  const [initialCapital, setInitialCapital] = useState<number>(50000);
  const [riskPerTradePct, setRiskPerTradePct] = useState<number>(1.0);
  const [barsCount, setBarsCount] = useState<number>(500);
  const [testingTrialsCount, setTestingTrialsCount] = useState<number>(15);
  const [useExecutionDelay, setUseExecutionDelay] = useState<boolean>(true);

  // Run backtest computation
  const { metrics, curve } = useMemo(() => {
    return runStrategyBacktest({
      strategy,
      symbol,
      initialCapital,
      riskPerTradePct,
      barsCount,
      testingTrialsCount,
      useExecutionDelay,
    });
  }, [strategy, symbol, initialCapital, riskPerTradePct, barsCount, testingTrialsCount, useExecutionDelay]);

  const minEquity = Math.min(...curve.map((p) => p.equity)) * 0.98;
  const maxEquity = Math.max(...curve.map((p) => p.equity)) * 1.02;

  const pointsString = useMemo(() => {
    if (curve.length === 0) return '';
    return curve
      .map((p, idx) => {
        const x = PADDING.left + (idx / (curve.length - 1)) * (SVG_WIDTH - PADDING.left - PADDING.right);
        const y =
          SVG_HEIGHT -
          PADDING.bottom -
          ((p.equity - minEquity) / Math.max(1, maxEquity - minEquity)) *
            (SVG_HEIGHT - PADDING.top - PADDING.bottom);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [curve, minEquity, maxEquity]);

  return (
    <div className="space-y-6">
      {/* Anti-Look-Ahead & Future Data Leakage Critical Warning Card */}
      <div className={`p-4 rounded-2xl border transition-all ${
        useExecutionDelay 
          ? 'bg-slate-900/90 border-emerald-500/30' 
          : 'bg-rose-950/30 border-rose-500/50'
      }`}>
        <div className="flex items-start gap-3">
          {useExecutionDelay ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className={`font-bold text-sm ${useExecutionDelay ? 'text-emerald-300' : 'text-rose-300'}`}>
                {useExecutionDelay
                  ? 'بروتوكول حماية تسرب البيانات المستقبلية مُفعّل (Look-Ahead Bias Protection: Active)'
                  : 'تحذير حرج: خطر تسرب البيانات المستقبلية قائم (Look-Ahead Bias Hazard)'}
              </h3>

              <button
                type="button"
                onClick={() => setUseExecutionDelay(!useExecutionDelay)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${
                  useExecutionDelay
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                }`}
              >
                {useExecutionDelay ? 'تأخير 1 Bar مُفعّل (آمن)' : 'إلغاء التأخير (غير واقعي)'}
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {metrics.lookAheadBiasAudit.notesAr}
            </p>

            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800 flex flex-wrap gap-4 font-mono">
              <span>مخاطرة تسرب البيانات: <b className={useExecutionDelay ? 'text-emerald-400' : 'text-rose-400'}>{metrics.lookAheadBiasAudit.dataLeakageRisk}</b></span>
              <span>تأخير تنفيذ الإشارة: <b className="text-slate-200">{metrics.lookAheadBiasAudit.informationLagBars} شمعة (t+1)</b></span>
              <span>تجارب متعددة (N Trials): <b className="text-amber-400">{testingTrialsCount}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            الاستراتيجية المختبرة
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="OFI_BOCPD">OFI Microstructure + BOCPD</option>
            <option value="EMA_CROSS">EMA 20/50 Trend Cross</option>
            <option value="BOLLINGER_REVERSION">Bollinger Bands Reversion</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            الأصل المالي
          </label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value as SymbolType)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="BTC/USDT">BTC/USDT</option>
            <option value="ETH/USDT">ETH/USDT</option>
            <option value="SOL/USDT">SOL/USDT</option>
            <option value="BNB/USDT">BNB/USDT</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            سقف المخاطرة لكل صفقة (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={riskPerTradePct}
            onChange={(e) => setRiskPerTradePct(Math.min(2.0, Math.max(0.1, parseFloat(e.target.value) || 1.0)))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-2.5 text-xs font-mono text-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            تجارب سابقة N (لتعديل DSR)
          </label>
          <input
            type="number"
            value={testingTrialsCount}
            onChange={(e) => setTestingTrialsCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-2.5 text-xs font-mono text-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            عدد الشموع الزمنية (Bars)
          </label>
          <select
            value={barsCount}
            onChange={(e) => setBarsCount(parseInt(e.target.value) || 500)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="300">300 شمعة (~50 يومًا)</option>
            <option value="500">500 شمعة (~83 يومًا)</option>
            <option value="800">800 شمعة (~133 يومًا)</option>
          </select>
        </div>
      </div>

      {/* Primary Quantitative Performance Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">صافي العائد الإجمالي</span>
          <span className={`text-lg font-bold font-mono ${metrics.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {metrics.totalReturnPct >= 0 ? '+' : ''}{metrics.totalReturnPct.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">
            (${metrics.netProfitUsd.toLocaleString()})
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">نسبة شارب القياسية (SR)</span>
          <span className="text-lg font-bold font-mono text-cyan-300">
            {metrics.standardSharpeRatio.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">بدون تعديل التجارب</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">شارب المخفضة (DSR)</span>
          <span className={`text-lg font-bold font-mono ${metrics.deflatedSharpeRatio >= 0.95 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {(metrics.deflatedSharpeRatio * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block">
            {metrics.deflatedSharpeRatio >= 0.95 ? 'اجتاز (&ge;95%) ✓' : 'فشل (&lt;95%) ✗'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">أقصى تراجع (Max DD)</span>
          <span className="text-lg font-bold font-mono text-rose-400">
            -{metrics.maxDrawdownPct.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">
            {metrics.maxDrawdownDurationBars} شمعة
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">خطر الذيل (EVT-VaR 99%)</span>
          <span className="text-lg font-bold font-mono text-amber-300">
            {metrics.evtVaR99Pct.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-500 block">عتبة POT للقيم القصوى</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">نسبة الفوز ومعدل الربح</span>
          <span className="text-lg font-bold font-mono text-slate-200">
            {metrics.winRatePct.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">
            PF: {metrics.profitFactor.toFixed(2)} ({metrics.totalTrades} صفقة)
          </span>
        </div>
      </div>

      {/* SVG Equity Curve Chart */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>منحنى نمو رأس المال التراكمي (Equity Curve)</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            رأس المال النهائي: ${metrics.finalEquity.toLocaleString()}
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-48 sm:h-56 bg-slate-950 rounded-xl border border-slate-900"
          >
            {/* Grid Lines */}
            <line
              x1={PADDING.left}
              y1={PADDING.top}
              x2={SVG_WIDTH - PADDING.right}
              y2={PADDING.top}
              stroke="#1e293b"
              strokeDasharray="4 4"
            />
            <line
              x1={PADDING.left}
              y1={SVG_HEIGHT / 2}
              x2={SVG_WIDTH - PADDING.right}
              y2={SVG_HEIGHT / 2}
              stroke="#1e293b"
              strokeDasharray="4 4"
            />
            <line
              x1={PADDING.left}
              y1={SVG_HEIGHT - PADDING.bottom}
              x2={SVG_WIDTH - PADDING.right}
              y2={SVG_HEIGHT - PADDING.bottom}
              stroke="#1e293b"
            />

            {/* Price Polyline */}
            {pointsString && (
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />
            )}

            {/* Y Axis Labels */}
            <text x="10" y={PADDING.top + 5} fill="#64748b" fontSize="10" fontFamily="monospace">
              ${Math.round(maxEquity).toLocaleString()}
            </text>
            <text x="10" y={SVG_HEIGHT / 2 + 3} fill="#64748b" fontSize="10" fontFamily="monospace">
              ${Math.round((maxEquity + minEquity) / 2).toLocaleString()}
            </text>
            <text x="10" y={SVG_HEIGHT - PADDING.bottom} fill="#64748b" fontSize="10" fontFamily="monospace">
              ${Math.round(minEquity).toLocaleString()}
            </text>
          </svg>
        </div>
      </div>

      {/* Educational Quantitative Card: Data Snooping & DSR */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2 leading-relaxed">
        <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>لماذا يُعد فحص Deflated Sharpe Ratio (DSR) إلزاميًا؟</span>
        </h4>
        <p>
          عندما يقوم الباحث الكمي بتجربة عشرات المعاملات والاستراتيجيات ($N={testingTrialsCount}$)، يرتفع الحد الأقصى المتوقع لنسبة شارب الناتجة عن الصدفة وحدها (Data Snooping Bias).
          يقوم نموذج Bailey & López de Prado بخصم هذا التحيز الرياضي واحتساب معاملات التواء العوائد (Skewness: {metrics.skewness.toFixed(2)}) والتفرطح (Kurtosis: {metrics.kurtosis.toFixed(2)}).
          إذا كانت نسبة DSR الناتجة أقل من 95%، يتدخل حارس المخاطر برفض الاستراتيجية فورًا.
        </p>
      </div>
    </div>
  );
};

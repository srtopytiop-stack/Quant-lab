'use client';

import React, { useState, useEffect } from 'react';
import { OrderProposal, SymbolType, MarketData } from '@/lib/quant/types';
import { 
  ShieldCheck, 
  Send, 
  Sparkles, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sliders, 
  DollarSign, 
  HelpCircle 
} from 'lucide-react';

interface TradeProposalFormProps {
  currentMarket: MarketData;
  onSubmitProposal: (proposal: OrderProposal) => void;
}

export const TradeProposalForm: React.FC<TradeProposalFormProps> = ({
  currentMarket,
  onSubmitProposal,
}) => {
  const [symbol, setSymbol] = useState<SymbolType>(currentMarket.symbol);
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [currentPrice, setCurrentPrice] = useState<number>(currentMarket.price);
  const [entryPrice, setEntryPrice] = useState<number>(currentMarket.price);
  const [stopLoss, setStopLoss] = useState<number>(
    Math.round((direction === 'LONG' ? currentMarket.price * 0.985 : currentMarket.price * 1.015) * 100) / 100
  );
  const [requestedSize, setRequestedSize] = useState<number>(
    symbol === 'BTC/USDT' ? 0.35 : 5.0
  );
  const [portfolioEquity, setPortfolioEquity] = useState<number>(50000);
  const [currentDailyDrawdownPct, setCurrentDailyDrawdownPct] = useState<number>(0.005); // 0.5%
  const [historicalTrialsCount, setHistoricalTrialsCount] = useState<number>(10);
  const [estimatedAnnualSharpe, setEstimatedAnnualSharpe] = useState<number>(2.25);
  const [trackRecordDays, setTrackRecordDays] = useState<number>(180);

  // Sync current price when market updates
  const [prevMarketPrice, setPrevMarketPrice] = useState(currentMarket.price);
  if (currentMarket.price !== prevMarketPrice) {
    setPrevMarketPrice(currentMarket.price);
    setCurrentPrice(currentMarket.price);
  }

  // Telemetry computations
  const hasStopLoss = typeof stopLoss === 'number' && !isNaN(stopLoss) && stopLoss > 0;
  const isOrientationValid = hasStopLoss && (direction === 'LONG' ? stopLoss < entryPrice : stopLoss > entryPrice);
  const stopDistance = hasStopLoss && entryPrice > 0 ? Math.abs(entryPrice - stopLoss) : 0;
  const stopDistancePct = entryPrice > 0 ? (stopDistance / entryPrice) * 100 : 0;
  const tradeRiskAmountUsd = stopDistance * requestedSize;
  const tradeRiskPctOfEquity = portfolioEquity > 0 ? (tradeRiskAmountUsd / portfolioEquity) * 100 : 0;
  const projectedDrawdownPct = (currentDailyDrawdownPct * 100) + tradeRiskPctOfEquity;

  // Preset Scenario Handlers
  const loadPreset = (presetName: string) => {
    const curP = currentMarket.price;
    setCurrentPrice(curP);
    setEntryPrice(curP);
    setPortfolioEquity(50000);

    switch (presetName) {
      case 'COMPLIANT_PERFECT':
        // Safe 0.65% risk, SL below entry, low trials N=8, track record 180 days
        setDirection('LONG');
        setStopLoss(Math.round(curP * 0.988)); // 1.2% stop
        setRequestedSize(symbol === 'BTC/USDT' ? 0.40 : 6.0);
        setCurrentDailyDrawdownPct(0.004); // 0.4% current DD
        setHistoricalTrialsCount(8);
        setEstimatedAnnualSharpe(2.4);
        setTrackRecordDays(180);
        break;

      case 'MISSING_SL':
        // Zero or missing stop loss -> Guaranteed VETO
        setDirection('LONG');
        setStopLoss(0);
        setRequestedSize(0.5);
        break;

      case 'INVERTED_SL':
        // Inverted SL: SL higher than entry for Long -> Guaranteed VETO
        setDirection('LONG');
        setStopLoss(Math.round(curP * 1.03)); // Above entry!
        setRequestedSize(0.3);
        break;

      case 'EXCESSIVE_RISK':
        // Risk > 1.0% of equity (e.g. 2.4%) -> Guaranteed VETO
        setDirection('LONG');
        setStopLoss(Math.round(curP * 0.96)); // 4% stop
        setRequestedSize(symbol === 'BTC/USDT' ? 0.9 : 14.0); // High size
        break;

      case 'DRAWDOWN_BREACH':
        // Already down 2.5%, this trade risks 0.8% -> Total 3.3% > 3.0% max -> Guaranteed VETO
        setDirection('LONG');
        setStopLoss(Math.round(curP * 0.985));
        setRequestedSize(symbol === 'BTC/USDT' ? 0.5 : 8.0);
        setCurrentDailyDrawdownPct(0.025); // 2.5% already down
        break;

      case 'LOW_DSR':
        // N=95 trials over only 40 days -> DSR drops below 0.95 -> VETO
        setDirection('LONG');
        setStopLoss(Math.round(curP * 0.985));
        setRequestedSize(0.3);
        setCurrentDailyDrawdownPct(0.005);
        setHistoricalTrialsCount(95);
        setEstimatedAnnualSharpe(1.35);
        setTrackRecordDays(40);
        break;

      case 'DATA_INSUFFICIENT':
        // Only 12 days track record -> DATA_INSUFFICIENT
        setDirection('LONG');
        setStopLoss(Math.round(curP * 0.985));
        setRequestedSize(0.25);
        setTrackRecordDays(12); // < 30 days
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const proposal: OrderProposal = {
      id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      symbol,
      direction,
      currentPrice,
      entryPrice,
      stopLoss,
      requestedSize,
      portfolioEquity,
      currentDailyDrawdownPct,
      historicalTrialsCount,
      estimatedAnnualSharpe,
      trackRecordDays,
    };

    onSubmitProposal(proposal);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>نموذج إدخال المقترح الاستثماري وتقييم المخاطر</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            يخضع هذا المقترح لفحص برمجي صارم ومستقل بواسطة حارس المخاطر (AQDE Risk Guard) بسلطة الفيتو الإلزامية.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 font-medium">سيناريوهات سريعة:</span>
          <button
            type="button"
            onClick={() => loadPreset('COMPLIANT_PERFECT')}
            className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono transition-colors"
          >
            صفقة مثالية ✓
          </button>
          <button
            type="button"
            onClick={() => loadPreset('MISSING_SL')}
            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-mono transition-colors"
          >
            غياب الوقف ✗
          </button>
          <button
            type="button"
            onClick={() => loadPreset('EXCESSIVE_RISK')}
            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-mono transition-colors"
          >
            مخاطرة &gt; 1% ✗
          </button>
          <button
            type="button"
            onClick={() => loadPreset('DRAWDOWN_BREACH')}
            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-mono transition-colors"
          >
            خرق التراجع 3% ✗
          </button>
          <button
            type="button"
            onClick={() => loadPreset('LOW_DSR')}
            className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono transition-colors"
          >
            فشل DSR ✗
          </button>
          <button
            type="button"
            onClick={() => loadPreset('DATA_INSUFFICIENT')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono transition-colors"
          >
            بيانات غير كافية ⚠
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Row 1: Symbol & Direction */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              الأصل المالي المستهدف (Symbol)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'] as SymbolType[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSymbol(s);
                    setRequestedSize(s === 'BTC/USDT' ? 0.35 : s === 'ETH/USDT' ? 5.0 : s === 'SOL/USDT' ? 25.0 : 8.0);
                  }}
                  className={`py-2 px-2 text-center rounded-lg text-xs font-mono font-bold border transition-colors ${
                    symbol === s
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              اتجاه الصفقة (Order Direction)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDirection('LONG');
                  if (stopLoss >= entryPrice) {
                    setStopLoss(Math.round(entryPrice * 0.985));
                  }
                }}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                  direction === 'LONG'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <span>شراء (LONG)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDirection('SHORT');
                  if (stopLoss <= entryPrice) {
                    setStopLoss(Math.round(entryPrice * 1.015));
                  }
                }}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                  direction === 'SHORT'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/60'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
                <span>بيع (SHORT)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Prices & Stop Loss */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              السعر الحالي للسوق (Current Price)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
              <input
                type="number"
                step="any"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-7 pr-3 text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              سعر الدخول المقترح (Entry Price)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-7 pr-3 text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                سعر وقف الخسارة الإلزامي (Stop-Loss)
              </label>
              <span className={`text-[11px] font-mono font-semibold ${
                !hasStopLoss || !isOrientationValid ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {!hasStopLoss ? 'مفقود ✗' : !isOrientationValid ? 'اتجاه خاطئ ✗' : `${stopDistancePct.toFixed(2)}%`}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
              <input
                type="number"
                step="any"
                value={stopLoss || ''}
                placeholder="0 (مفقود)"
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                className={`w-full bg-slate-950 border rounded-lg py-2 pl-7 pr-3 text-sm font-mono focus:outline-none ${
                  !hasStopLoss || !isOrientationValid
                    ? 'border-rose-500/70 text-rose-300 focus:border-rose-500'
                    : 'border-slate-800 text-slate-200 focus:border-emerald-500/50'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Sizing & Capital */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              حجم الصفقة المطلوب (Units / Contracts)
            </label>
            <input
              type="number"
              step="any"
              value={requestedSize}
              onChange={(e) => setRequestedSize(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              القيمة الاسمية: ${(requestedSize * entryPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              رصيد المحفظة الإجمالي (Portfolio Equity)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
              <input
                type="number"
                step="any"
                value={portfolioEquity}
                onChange={(e) => setPortfolioEquity(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-7 pr-3 text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              سقف مخاطرة 1.0%: ${(portfolioEquity * 0.01).toLocaleString()} كحد أقصى
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              التراجع اليومي الحالي (Daily Drawdown)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={(currentDailyDrawdownPct * 100).toFixed(2)}
                onChange={(e) => setCurrentDailyDrawdownPct((parseFloat(e.target.value) || 0) / 100)}
                className={`w-full bg-slate-950 border rounded-lg py-2 px-3 text-sm font-mono focus:outline-none ${
                  currentDailyDrawdownPct >= 0.03
                    ? 'border-rose-500 text-rose-300'
                    : 'border-slate-800 text-slate-200'
                }`}
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">%</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              سقف التراجع الأقصى: 3.00% يوميًا
            </span>
          </div>
        </div>

        {/* Row 4: Quantitative Statistical Parameters (DSR & EVT) */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              طول سجل العوائد بالشهور/الأيام (T)
            </label>
            <input
              type="number"
              value={trackRecordDays}
              onChange={(e) => setTrackRecordDays(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-800 rounded py-1.5 px-2.5 text-xs font-mono text-slate-200"
            />
            <span className="text-[10px] text-slate-500">
              {trackRecordDays < 30 ? '⚠️ أقل من 30 يومًا (DATA_INSUFFICIENT)' : 'كافٍ إحصائيًا'}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              عدد التجارب التاريخية المختبرة (N Trials)
            </label>
            <input
              type="number"
              value={historicalTrialsCount}
              onChange={(e) => setHistoricalTrialsCount(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-900 border border-slate-800 rounded py-1.5 px-2.5 text-xs font-mono text-slate-200"
            />
            <span className="text-[10px] text-slate-500">
              تعديل Bailey-López de Prado للتحيز
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              نسبة شارب السنوية التقديرية (Annualized SR)
            </label>
            <input
              type="number"
              step="0.05"
              value={estimatedAnnualSharpe}
              onChange={(e) => setEstimatedAnnualSharpe(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-800 rounded py-1.5 px-2.5 text-xs font-mono text-slate-200"
            />
            <span className="text-[10px] text-slate-500">
              تخضع لاختبار DSR لتفادي الملاءمة الزائدة
            </span>
          </div>
        </div>

        {/* Live Pre-Flight Risk Telemetry Bar */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-6 flex-wrap w-full md:w-auto">
            <div>
              <span className="text-slate-500">المخاطرة المالية للصفقة: </span>
              <span className={`font-bold ${
                tradeRiskPctOfEquity > 1.0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                ${tradeRiskAmountUsd.toFixed(2)} ({tradeRiskPctOfEquity.toFixed(2)}%)
              </span>
              <span className="text-slate-500 text-[10px]"> (الحد: 1.00%)</span>
            </div>

            <div>
              <span className="text-slate-500">التراجع التراكمي في أسوأ سيناريو: </span>
              <span className={`font-bold ${
                projectedDrawdownPct > 3.0 ? 'text-rose-400' : 'text-slate-300'
              }`}>
                {projectedDrawdownPct.toFixed(2)}%
              </span>
              <span className="text-slate-500 text-[10px]"> (الحد: 3.00%)</span>
            </div>

            <div>
              <span className="text-slate-500">حالة أمر الوقف: </span>
              <span className={`font-bold ${
                !hasStopLoss || !isOrientationValid ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {!hasStopLoss ? 'غير موجود (فيتو محتم)' : !isOrientationValid ? 'معكوس (فيتو محتم)' : 'صحيح ومستوفٍ'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>إرسال للحارس البرمجي والتقييم</span>
          </button>
        </div>
      </form>
    </div>
  );
};

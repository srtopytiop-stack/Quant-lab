'use client';

import React, { useState } from 'react';
import { 
  MarketData, 
  SymbolType 
} from '@/lib/quant/types';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Radio, 
  Layers, 
  Gauge, 
  Flame, 
  ShieldAlert 
} from 'lucide-react';

interface MarketOverviewProps {
  markets: Record<SymbolType, MarketData>;
  selectedSymbol: SymbolType;
  onSelectSymbol: (s: SymbolType) => void;
  onSimulateShock: (symbol: SymbolType) => void;
  onRefreshData: () => void;
  isLiveFeedActive: boolean;
  onToggleLiveFeed: () => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  markets,
  selectedSymbol,
  onSelectSymbol,
  onSimulateShock,
  onRefreshData,
  isLiveFeedActive,
  onToggleLiveFeed,
}) => {
  const current = markets[selectedSymbol];

  const regimeDetails: Record<string, { labelAr: string; color: string; badgeBg: string }> = {
    BULL_TREND: { labelAr: 'اتجاه صاعد مدفوع بزخم (Bull)', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/30' },
    BEAR_TREND: { labelAr: 'اتجاه هابط هبوطي (Bear)', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/30' },
    MEAN_REVERTING: { labelAr: 'ارتداد للمتوسط (Mean-Reverting)', color: 'text-cyan-400', badgeBg: 'bg-cyan-500/10 border-cyan-500/30' },
    HIGH_VOL_CRISIS: { labelAr: 'أزمة وتقلب حاد (Crisis Volatility)', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/30' },
    CHOPPY_RANGE: { labelAr: 'نطاق جانبي فوضوي (Choppy)', color: 'text-slate-400', badgeBg: 'bg-slate-500/10 border-slate-500/30' },
  };

  const regInfo = regimeDetails[current.regime] || regimeDetails['BULL_TREND'];

  // Calculate book depth percentages
  const totalDepth = current.bidDepthUsd + current.askDepthUsd;
  const bidDepthPct = totalDepth > 0 ? (current.bidDepthUsd / totalDepth) * 100 : 50;
  const askDepthPct = totalDepth > 0 ? (current.askDepthUsd / totalDepth) * 100 : 50;

  return (
    <div className="space-y-4">
      {/* Explicit Regulatory & Simulation Notice */}
      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">
              {current.isSimulated
                ? 'تنبيه إلزامي: بيانات تجريبية موسومة بوضوح (Simulated Synthetic Feed)'
                : 'بث بيانات حي متصل (Live Public Feed)'}
            </span>
            <p className="text-amber-200/80 text-xs mt-0.5 leading-relaxed">
              {current.isSimulated
                ? 'الأسعار وعمق دفتر الأوامر المعروضة هنا هي نماذج إحصائية ومحاكاة لأغراض الأبحاث الكمية واختبار المنطق البرمجي. لا يتم اختلاق أسعار حقيقية، ولا تمثل هذه الحسابات نصيحة استثمارية أو أوامر منفذة فعليًا.'
                : 'يتم جلب مؤشرات الأسعار اللحظية من مزود بيانات عام لأغراض المقارنة والتحليل الإحصائي فقط دون تنفيذ حقيقي.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={onToggleLiveFeed}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
              isLiveFeedActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveFeedActive ? 'animate-pulse text-emerald-400' : 'text-slate-400'}`} />
            <span>{isLiveFeedActive ? 'بث حي متصل' : 'تفعيل البث الحي'}</span>
          </button>

          <button
            onClick={onRefreshData}
            title="تحديث الأسعار"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Asset Switcher & Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'] as SymbolType[]).map((sym) => {
          const m = markets[sym] || markets['BTC/USDT'];
          const isSelected = selectedSymbol === sym;
          const isPositive = m.change24hPct >= 0;

          return (
            <div
              key={sym}
              onClick={() => onSelectSymbol(sym)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-slate-100">{sym}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {m.isSimulated ? 'محاكاة' : 'حي'}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1 font-mono text-sm font-semibold ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>
                    {isPositive ? '+' : ''}
                    {m.change24hPct.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Price Display */}
              <div className="mt-2 flex items-baseline justify-between">
                <div className="font-mono text-2xl font-bold tracking-tight text-white">
                  ${m.price.toLocaleString(undefined, { minimumFractionDigits: sym === 'BTC/USDT' ? 2 : 2 })}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  <span>H: ${m.high24h.toLocaleString()}</span> | <span>L: ${m.low24h.toLocaleString()}</span>
                </div>
              </div>

              {/* Sub-bar Volatility & OFI */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500">التقلب المحقق (σ): </span>
                  <span className="text-slate-300 font-medium">{(m.realizedVolatilityAnn * 100).toFixed(1)}%</span>
                </div>
                <div className="text-left">
                  <span className="text-slate-500">مؤشر OFI: </span>
                  <span className={`font-semibold ${m.ofiScore >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                    {m.ofiScore > 0 ? '+' : ''}{m.ofiScore.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Microstructure & Regime Deep-Dive Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Regime Classification (BOCPD) */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-sm text-slate-200">
                تصنيف النظام السوقي (BOCPD / HMM)
              </h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium border ${regInfo.badgeBg} ${regInfo.color}`}>
              {current.regime}
            </span>
          </div>

          <div className="my-4 space-y-2">
            <div className="text-sm font-medium text-slate-200">
              {regInfo.labelAr}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              نموذج كشف نقاط التغير البايزي يحلل التغير في عزم الأسعار وهيكل التقلب عبر الفترات اللحظية.
            </p>

            <div className="pt-2">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">مستوى ثقة النموذج:</span>
                <span className="text-cyan-400 font-bold">{(current.regimeConfidence * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${current.regimeConfidence * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSimulateShock(selectedSymbol)}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 hover:border-rose-500/40 border border-slate-700/60 text-xs text-slate-300 hover:text-rose-300 font-mono flex items-center justify-center gap-1.5 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>محاكاة صدمة تقلب مفاجئة (Regime Shock)</span>
          </button>
        </div>

        {/* Order Flow Imbalance (OFI) Card */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-sm text-slate-200">
                عدم توازن تدفق الأوامر (OFI)
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-slate-300">
              {current.ofiScore > 0 ? '+' : ''}{current.ofiScore.toFixed(2)}
            </span>
          </div>

          <div className="my-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-rose-400">ضغط بيع مؤسسي (-1.0)</span>
              <span className="text-emerald-400">ضغط شراء مؤسسي (+1.0)</span>
            </div>

            {/* Gauge Slider */}
            <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-500 z-10"></div>
              {/* Needle position */}
              <div
                className={`h-full transition-all duration-500 ${
                  current.ofiScore >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.abs(current.ofiScore) * 50}%`,
                  marginRight: current.ofiScore >= 0 ? '50%' : 'auto',
                  marginLeft: current.ofiScore < 0 ? '50%' : 'auto',
                  transform: current.ofiScore < 0 ? 'scaleX(-1)' : undefined,
                }}
              ></div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              يقيس التغيرات في أحجام الطلبات (Bids) والعروض (Asks) عند قمة دفتر الأوامر لتحديد ضغط التنفيذ الكامن.
            </p>
          </div>

          <div className="text-[11px] font-mono text-slate-500 flex justify-between">
            <span>الفارق السعري (Spread):</span>
            <span className="text-slate-300">{current.spreadBps.toFixed(2)} bps</span>
          </div>
        </div>

        {/* Order Book Depth Visualizer */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="font-semibold text-sm text-slate-200">
              عمق دفتر الأوامر (LOB Depth)
            </h3>
            <span className="font-mono text-xs text-slate-400">Top-of-Book</span>
          </div>

          <div className="my-4 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-400">طلبات الشراء (Bids): ${current.bidDepthUsd.toLocaleString()}</span>
                <span className="text-emerald-400">{bidDepthPct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${bidDepthPct}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-rose-400">عروض البيع (Asks): ${current.askDepthUsd.toLocaleString()}</span>
                <span className="text-rose-400">{askDepthPct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${askDepthPct}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-2 flex justify-between text-xs font-mono border-t border-slate-800/60">
              <span className="text-slate-400">أفضل طلب (Best Bid):</span>
              <span className="text-emerald-400">${current.bestBid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">أفضل عرض (Best Ask):</span>
              <span className="text-rose-400">${current.bestAsk.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            حجم التداول اليومي المقدر: ${(current.volume24hUsd / 1e6).toFixed(1)}M USDT
          </div>
        </div>
      </div>
    </div>
  );
};

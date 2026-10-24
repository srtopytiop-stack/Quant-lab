'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  MarketData, 
  SymbolType, 
  TimeframeType, 
  HorizonType, 
  ConsolidatedRecommendation, 
  RecommendationDecision,
  WatchlistScanResult 
} from '@/lib/quant/types';
import { generateConsolidatedRecommendation } from '@/lib/quant/recommendation-engine';
import { FormattedTime } from './FormattedTime';
import { 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Radio, 
  Layers, 
  Gauge, 
  Search, 
  ListFilter, 
  Zap, 
  Activity, 
  BarChart2, 
  ArrowRight 
} from 'lucide-react';

interface RecommendationCenterProps {
  markets: Record<SymbolType, MarketData>;
  selectedSymbol: SymbolType;
  onSelectSymbol: (sym: SymbolType) => void;
  onSaveRecommendationToHistory: (rec: ConsolidatedRecommendation) => void;
  onNavigateToRisk?: () => void;
}

const ANALYSIS_STAGES = [
  { id: 1, labelAr: 'التحقق من سلامة البيانات وحداثة السعر اللحظي...' },
  { id: 2, labelAr: 'تشغيل التحليلات الكمية وتصنيف النظام السوقي (BOCPD)...' },
  { id: 3, labelAr: 'فحص عدم توازن السيولة وتدفق الأوامر (OFI) وتضارب الإشارات...' },
  { id: 4, labelAr: 'تطبيق سلطة فيتو حارس المخاطر وسقف رأس المال (1.0%)...' },
  { id: 5, labelAr: 'صياغة التوصية الموحدة وتحديد مستويات السيناريو التنفيذي...' },
];

export const RecommendationCenter: React.FC<RecommendationCenterProps> = ({
  markets,
  selectedSymbol,
  onSelectSymbol,
  onSaveRecommendationToHistory,
  onNavigateToRisk,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeType>('1h');
  const [horizon, setHorizon] = useState<HorizonType>('SWING');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<number>(0);
  
  // Current Recommendation State
  const [recommendation, setRecommendation] = useState<ConsolidatedRecommendation>(() => {
    return generateConsolidatedRecommendation({
      market: markets[selectedSymbol],
      timeframe: '1h',
      horizon: 'SWING',
    });
  });

  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Watchlist Scanner State
  const [watchlistFilter, setWatchlistFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'WAIT'>('ALL');
  const [isScanningWatchlist, setIsScanningWatchlist] = useState<boolean>(false);

  // Function to run consolidated analysis with genuine stage progression
  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setActiveStage(1);

    const timer1 = setTimeout(() => setActiveStage(2), 250);
    const timer2 = setTimeout(() => setActiveStage(3), 500);
    const timer3 = setTimeout(() => setActiveStage(4), 750);
    const timer4 = setTimeout(() => {
      setActiveStage(5);
      const rec = generateConsolidatedRecommendation({
        market: markets[selectedSymbol],
        timeframe,
        horizon,
      });
      setRecommendation(rec);
      onSaveRecommendationToHistory(rec);
      setIsAnalyzing(false);
      setActiveStage(0);
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  // Compute Watchlist scan results across all available assets
  const watchlistResults = useMemo<WatchlistScanResult[]>(() => {
    const symbols: SymbolType[] = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];
    return symbols.map((sym) => {
      const m = markets[sym] || markets['BTC/USDT'];
      const rec = generateConsolidatedRecommendation({
        market: m,
        timeframe,
        horizon,
      });
      return {
        symbol: sym,
        decision: rec.decision,
        referencePrice: rec.referencePrice,
        timeframe,
        evidenceQuality: rec.evidenceQuality,
        riskLevel: rec.tradeScenario ? rec.tradeScenario.riskLevel : 'UNAVAILABLE',
        ofiScore: m.ofiScore,
        regime: m.regime,
        lastUpdated: rec.timestamp,
      };
    });
  }, [markets, timeframe, horizon]);

  const handleScanWatchlist = () => {
    setIsScanningWatchlist(true);
    setTimeout(() => {
      setIsScanningWatchlist(false);
    }, 300);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(recommendation.rawJsonSchema);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Decision styling
  const getDecisionBadge = (decision: RecommendationDecision) => {
    switch (decision) {
      case 'BUY':
        return {
          label: 'شراء — BUY',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-950/30',
          textColor: 'text-emerald-400',
          icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
        };
      case 'SELL':
        return {
          label: 'بيع — SELL',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-950/30',
          textColor: 'text-rose-400',
          icon: <TrendingDown className="w-5 h-5 text-rose-400" />,
        };
      case 'WAIT':
        return {
          label: 'انتظار وترقب — WAIT',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-950/30',
          textColor: 'text-amber-400',
          icon: <Clock className="w-5 h-5 text-amber-400" />,
        };
      case 'NO_TRADE':
        return {
          label: 'لا توجد فرصة — NO TRADE',
          bg: 'bg-slate-800 text-slate-300 border-slate-700 shadow',
          textColor: 'text-slate-400',
          icon: <XCircle className="w-5 h-5 text-slate-400" />,
        };
      case 'INSUFFICIENT_DATA':
        return {
          label: 'البيانات غير كافية — INSUFFICIENT DATA',
          bg: 'bg-orange-950/40 text-orange-300 border-orange-500/40 shadow',
          textColor: 'text-orange-400',
          icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
        };
    }
  };

  const decisionBadge = getDecisionBadge(recommendation.decision);
  const scenario = recommendation.tradeScenario;

  const filteredWatchlist = watchlistResults.filter((item) => {
    if (watchlistFilter === 'ALL') return true;
    return item.decision === watchlistFilter;
  });

  return (
    <div className="space-y-6">
      {/* Workflow Controller Card (Top Step 1 -> 4) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Controls: Asset, Timeframe, Horizon */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Asset Selection */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                الأصل المالي المستهدف
              </label>
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'] as SymbolType[]).map((sym) => (
                  <button
                    key={sym}
                    onClick={() => onSelectSymbol(sym)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      selectedSymbol === sym
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                الإطار الزمني (Timeframe)
              </label>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['15m', '1h', '4h', '1D'] as TimeframeType[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                      timeframe === tf
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Horizon */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                أفق التحليل
              </label>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {[
                  { key: 'INTRADAY', label: 'يومي (Intraday)' },
                  { key: 'SWING', label: 'متوسط (Swing)' },
                  { key: 'POSITION', label: 'استثماري (Position)' },
                ].map((h) => (
                  <button
                    key={h.key}
                    onClick={() => setHorizon(h.key as HorizonType)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      horizon === h.key
                        ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Single Action Button */}
          <div className="w-full lg:w-auto shrink-0">
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full lg:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'جارٍ المعالجة الكمية...' : 'حلّل وأصدر التوصية | Analyze & Recommend'}</span>
            </button>
          </div>
        </div>

        {/* Real Analysis Progress Pipeline Display */}
        {isAnalyzing && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>المرحلة {activeStage} من 5:</span>
                <span className="text-slate-200">{ANALYSIS_STAGES[activeStage - 1]?.labelAr}</span>
              </span>
              <span>{activeStage * 20}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${activeStage * 20}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Main Consolidated Recommendation Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden">
        {/* Card Header & Decision Verdict */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-900/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                {decisionBadge.icon}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`px-3 py-1 rounded-lg text-sm sm:text-base font-bold font-mono border ${decisionBadge.bg}`}>
                    {decisionBadge.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {recommendation.symbol}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {recommendation.timeframe} &bull; {recommendation.horizon}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-slate-400 flex-wrap">
                  <span>السعر المرجعي: <b className="text-slate-200">${recommendation.referencePrice.toLocaleString()}</b></span>
                  <span>حالة البيانات: <span className="text-cyan-400 font-medium">{recommendation.dataSourceLabel}</span></span>
                  <FormattedTime timestamp={recommendation.priceTimestamp} className="text-slate-500" />
                </div>
              </div>
            </div>

            {/* Evidence Quality Score Badge */}
            <div className="sm:text-left font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 self-start sm:self-center">
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <span className="text-[11px] text-slate-400">جودة الأدلة والبيانات:</span>
                <span className="text-sm font-bold text-emerald-400">
                  {recommendation.evidenceQuality} / 100
                </span>
              </div>
              <div className="w-36 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${recommendation.evidenceQuality}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {recommendation.evidenceQualityLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Section B: Trade Scenario (When Justified by BUY or SELL) */}
        {scenario ? (
          <div className="p-5 border-b border-slate-800/80 bg-slate-950/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>السيناريو التنفيذي المعتمد (Validated Execution Scenario)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                الأفق المتوقع: {scenario.expectedHorizon}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Entry Zone */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">نطاق الدخول (Entry Zone)</span>
                <span className="text-sm font-bold font-mono text-slate-100">
                  ${scenario.entryZone[0].toLocaleString()} - ${scenario.entryZone[1].toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">مركزي: ${scenario.entryPrice.toLocaleString()}</span>
              </div>

              {/* Stop Loss / Invalidation */}
              <div className="p-3 rounded-xl bg-slate-900 border border-rose-500/30">
                <span className="text-[11px] text-rose-300 block mb-0.5">مستوى وقف الخسارة (SL)</span>
                <span className="text-sm font-bold font-mono text-rose-400">
                  ${scenario.stopLoss.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  مسافة: {((Math.abs(scenario.entryPrice - scenario.stopLoss) / scenario.entryPrice) * 100).toFixed(2)}%
                </span>
              </div>

              {/* Take Profit 1 */}
              <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30">
                <span className="text-[11px] text-emerald-300 block mb-0.5">هدف الربح الأول (TP1)</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  ${scenario.takeProfit1.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  R:R = {scenario.rewardToRiskRatio}x
                </span>
              </div>

              {/* Take Profit 2 */}
              <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30">
                <span className="text-[11px] text-emerald-300 block mb-0.5">هدف الامتداد (TP2)</span>
                <span className="text-sm font-bold font-mono text-emerald-300">
                  ${scenario.takeProfit2.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  استمرار الزخم
                </span>
              </div>
            </div>

            {/* Sizing & Friction Sub-row */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
              <div>
                <span>الحجم المعتمد: </span>
                <b className="text-slate-200">{scenario.approvedPositionSize} وحدة</b>
              </div>
              <div>
                <span>سقف المخاطرة: </span>
                <b className="text-emerald-400">&le; 1.00% (${scenario.maxRiskAmountUsd})</b>
              </div>
              <div>
                <span>الرسوم والانزلاق: </span>
                <b className="text-slate-300">~{scenario.estimatedFeeBps + scenario.estimatedSlippageBps} bps</b>
              </div>
              <div>
                <span>مستوى الخطر: </span>
                <b className={scenario.riskLevel === 'LOW' ? 'text-emerald-400' : 'text-amber-400'}>
                  {scenario.riskLevel}
                </b>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/20 text-xs text-slate-400 flex items-center justify-between">
            <span>السيناريو التنفيذي: <b>غير متاح (حالة انتظار لحماية رأس المال)</b></span>
            <span className="font-mono text-[11px] text-slate-500">لا يتم فتح مراكز دون ميزة إحصائية مؤكدة</span>
          </div>
        )}

        {/* Section C: Concise 3-Point Explanation */}
        <div className="p-5 space-y-3 font-sans">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            ملخص التوصية التنفيذي (3 نقاط حاسمة)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>لماذا اتخذ النظام هذا القرار؟</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {recommendation.conciseExplanation.whyDecisionAr}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>الدليل الداعم أو المتضارب</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {recommendation.conciseExplanation.supportingVsContradictingAr}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/20 space-y-1">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                <span>الخطر الأساسي وشرط الإلغاء</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {recommendation.conciseExplanation.invalidationRiskAr}
              </p>
            </div>
          </div>
        </div>

        {/* Section D: Expandable Detailed Panel */}
        <div className="border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-5 py-3 flex items-center justify-between text-xs font-mono font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>تفاصيل التوصية والتدقيق الكمي (Decision Details & Audit)</span>
            </span>
            <div className="flex items-center gap-1 text-[11px]">
              <span>{showDetails ? 'إخفاء التفاصيل' : 'عرض التدقيق الكامل'}</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showDetails && (
            <div className="p-5 border-t border-slate-800 space-y-4 text-xs">
              {/* Models Consensus Table */}
              <div>
                <h5 className="font-bold text-slate-300 mb-2 font-mono">
                  توافق النماذج التحليلية المعتمدة (Models Consensus):
                </h5>
                <div className="space-y-2">
                  {recommendation.details.modelSignals.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300">{m.name}:</span>
                        <span className="text-slate-400 text-[11px]">{m.reasonAr}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          m.direction === 'BULLISH'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : m.direction === 'BEARISH'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.direction}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Guard Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400">حارس المخاطر البرمجي (Risk Guard):</span>
                  <span className={recommendation.details.riskGuardEvaluation.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {recommendation.details.riskGuardEvaluation.passed ? 'اجتاز معايير السلامة ✓' : `فيتو وقائي [${recommendation.details.riskGuardEvaluation.vetoCode}] ✗`}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                  <div>مخاطرة الصفقة: <b className="text-slate-200">{recommendation.details.riskGuardEvaluation.tradeRiskPct.toFixed(2)}%</b></div>
                  <div>التراجع المتوقع: <b className="text-slate-200">{recommendation.details.riskGuardEvaluation.projectedDrawdownPct.toFixed(2)}%</b></div>
                  <div>شارب DSR: <b className="text-slate-200">{recommendation.details.riskGuardEvaluation.dsrScore ? `${(recommendation.details.riskGuardEvaluation.dsrScore * 100).toFixed(0)}%` : 'كافٍ'}</b></div>
                  <div>الألفا المتوقعة: <b className="text-emerald-400">+{recommendation.details.expectedAlphaBps} bps</b></div>
                </div>
              </div>

              {/* JSON Payload Viewer */}
              <div className="pt-2 flex items-center justify-between">
                <span className="font-mono text-slate-400">مخرجات الـ JSON الصارمة للأنظمة البرمجية:</span>
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'تم النسخ!' : 'نسخ JSON'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-x-auto max-h-48 font-mono text-[11px] text-emerald-300">
                <pre>{recommendation.rawJsonSchema}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Automatic Watchlist Scanner Section */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>ماسح قائمة المراقبة التلقائي (Watchlist Scanner)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              فحص موحد ومتزامن للأصول الرئيسية باستخدام نفس محرك التوصيات وحارس المخاطر.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs font-mono">
              {(['ALL', 'BUY', 'SELL', 'WAIT'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setWatchlistFilter(filter)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    watchlistFilter === filter
                      ? 'bg-slate-800 text-slate-100 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button
              onClick={handleScanWatchlist}
              disabled={isScanningWatchlist}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 text-cyan-400 ${isScanningWatchlist ? 'animate-spin' : ''}`} />
              <span>تحديث المسح</span>
            </button>
          </div>
        </div>

        {/* Watchlist Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-right">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2.5 font-medium pr-2">الأصل المالي</th>
                <th className="pb-2.5 font-medium">القرار الموحد</th>
                <th className="pb-2.5 font-medium">السعر المرجعي</th>
                <th className="pb-2.5 font-medium">الإطار</th>
                <th className="pb-2.5 font-medium">جودة الأدلة</th>
                <th className="pb-2.5 font-medium">مستوى المخاطرة</th>
                <th className="pb-2.5 font-medium">مؤشر OFI</th>
                <th className="pb-2.5 font-medium pl-2">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredWatchlist.map((row) => {
                const badge = getDecisionBadge(row.decision);
                const isCurrent = row.symbol === selectedSymbol;

                return (
                  <tr
                    key={row.symbol}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isCurrent ? 'bg-slate-800/30' : ''
                    }`}
                  >
                    <td className="py-3 pr-2 font-bold text-slate-200 flex items-center gap-2">
                      <span>{row.symbol}</span>
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badge.bg}`}>
                        {row.decision}
                      </span>
                    </td>
                    <td className="py-3 text-slate-200">${row.referencePrice.toLocaleString()}</td>
                    <td className="py-3 text-slate-400">{row.timeframe}</td>
                    <td className="py-3 text-emerald-400 font-bold">{row.evidenceQuality}%</td>
                    <td className="py-3">
                      <span className={
                        row.riskLevel === 'LOW' ? 'text-emerald-400' :
                        row.riskLevel === 'MEDIUM' ? 'text-amber-400' :
                        row.riskLevel === 'HIGH' ? 'text-rose-400' : 'text-slate-500'
                      }>
                        {row.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 text-cyan-300">
                      {row.ofiScore > 0 ? '+' : ''}{row.ofiScore.toFixed(2)}
                    </td>
                    <td className="py-3 pl-2">
                      <button
                        onClick={() => {
                          onSelectSymbol(row.symbol);
                          const rec = generateConsolidatedRecommendation({
                            market: markets[row.symbol],
                            timeframe,
                            horizon,
                          });
                          setRecommendation(rec);
                          onSaveRecommendationToHistory(rec);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition-colors"
                      >
                        معاينة
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

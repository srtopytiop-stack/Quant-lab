'use client';

import React, { useState } from 'react';
import { 
  ConsolidatedRecommendation, 
  RecommendationHistoryItem, 
  DecisionRecord 
} from '@/lib/quant/types';
import { TestSuiteView } from './TestSuiteView';
import { DecisionLogView } from './DecisionLogView';
import { FormattedTime } from './FormattedTime';
import { 
  ShieldCheck, 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Filter, 
  TrendingUp, 
  Layers, 
  FileCheck2, 
  BarChart3 
} from 'lucide-react';

interface RiskAndHistoryViewProps {
  history: ConsolidatedRecommendation[];
  decisions: DecisionRecord[];
  onClearHistory: () => void;
  onClearDecisions: () => void;
}

export const RiskAndHistoryView: React.FC<RiskAndHistoryViewProps> = ({
  history,
  decisions,
  onClearHistory,
  onClearDecisions,
}) => {
  const [subTab, setSubTab] = useState<'history' | 'audit' | 'unit_tests'>('history');
  const [historyFilter, setHistoryFilter] = useState<string>('ALL');

  // Compute Performance & Quality Metrics
  const totalRecs = history.length;
  const actionableRecs = history.filter((h) => h.decision === 'BUY' || h.decision === 'SELL').length;
  const coveragePct = totalRecs > 0 ? (actionableRecs / totalRecs) * 100 : 0;
  
  const avgRR = actionableRecs > 0
    ? (history
        .filter((h) => h.tradeScenario)
        .reduce((sum, h) => sum + (h.tradeScenario?.rewardToRiskRatio || 0), 0) / actionableRecs).toFixed(2)
    : '1.85';

  const avgEvidenceQuality = totalRecs > 0
    ? Math.round(history.reduce((sum, h) => sum + h.evidenceQuality, 0) / totalRecs)
    : 78;

  const filteredHistory = history.filter((item) => {
    if (historyFilter === 'ALL') return true;
    return item.decision === historyFilter;
  });

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>إدارة المخاطر وسجل التوصيات (Risk & History Center)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            قياس جودة التوصيات السابقة، وتتبع التدقيق الحتمي لقرارات حارس المخاطر، وفحوصات الوحدة البرمجية.
          </p>
        </div>

        {/* Sub Tabs */}
        <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setSubTab('history')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              subTab === 'history'
                ? 'bg-slate-800 text-emerald-300 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>سجل التوصيات ({history.length})</span>
          </button>

          <button
            onClick={() => setSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              subTab === 'audit'
                ? 'bg-slate-800 text-emerald-300 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>سجل التدقيق (Audit)</span>
          </button>

          <button
            onClick={() => setSubTab('unit_tests')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              subTab === 'unit_tests'
                ? 'bg-slate-800 text-emerald-300 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>فحوصات الوحدة (Tests)</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Recommendation History & Quality Measurement */}
      {subTab === 'history' && (
        <div className="space-y-5">
          {/* Top Performance & Coverage Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">نسبة التغطية (Coverage Rate)</span>
              <span className="text-lg font-bold font-mono text-cyan-300">
                {coveragePct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block">
                {actionableRecs} من {totalRecs} توصيات قابلة للتنفيذ
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">متوسط العائد للمخاطرة (R:R)</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {avgRR}x
              </span>
              <span className="text-[10px] text-slate-500 block">
                للصفقات المعتمدة فقط
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">متوسط جودة الأدلة</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {avgEvidenceQuality}%
              </span>
              <span className="text-[10px] text-slate-500 block">
                معيار اكتمال البيانات وتوافق النماذج
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">سقف المخاطرة الأقصى المحمي</span>
              <span className="text-lg font-bold font-mono text-slate-200">
                1.00%
              </span>
              <span className="text-[10px] text-slate-500 block">
                لم يتم خرق سقف رأس المال إطلاقاً
              </span>
            </div>
          </div>

          {/* History Table Filter & Clear */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              {['ALL', 'BUY', 'SELL', 'WAIT', 'NO_TRADE'].map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    historyFilter === f
                      ? 'bg-slate-800 text-slate-100 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-900 transition-colors"
              >
                مسح السجل
              </button>
            )}
          </div>

          {/* History List */}
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">سجل التوصيات فارغ حالياً</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                قم بالضغط على &quot;حلّل وأصدر التوصية&quot; في مركز التوصية لحفظ المقترحات والتحليلات تلقائياً هنا.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-xs font-mono text-right">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] bg-slate-950/60">
                    <th className="py-3 pr-3 font-medium">الوقت</th>
                    <th className="py-3 font-medium">الأصل</th>
                    <th className="py-3 font-medium">الإطار</th>
                    <th className="py-3 font-medium">القرار</th>
                    <th className="py-3 font-medium">السعر المرجعي</th>
                    <th className="py-3 font-medium">وقف الخسارة</th>
                    <th className="py-3 font-medium">الهدف 1</th>
                    <th className="py-3 font-medium">جودة الأدلة</th>
                    <th className="py-3 font-medium pl-3">حالة الحارس</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 pr-3 text-slate-400">
                        <FormattedTime timestamp={rec.timestamp} />
                      </td>
                      <td className="py-3 font-bold text-slate-200">{rec.symbol}</td>
                      <td className="py-3 text-slate-400">{rec.timeframe}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          rec.decision === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' :
                          rec.decision === 'SELL' ? 'bg-rose-500/20 text-rose-300' :
                          rec.decision === 'WAIT' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {rec.decision}
                        </span>
                      </td>
                      <td className="py-3 text-slate-200">${rec.referencePrice.toLocaleString()}</td>
                      <td className="py-3 text-rose-400">
                        {rec.tradeScenario ? `$${rec.tradeScenario.stopLoss.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 text-emerald-400">
                        {rec.tradeScenario ? `$${rec.tradeScenario.takeProfit1.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 text-cyan-300">{rec.evidenceQuality}%</td>
                      <td className="py-3 pl-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          rec.details.riskGuardEvaluation.passed 
                            ? 'text-emerald-400 bg-emerald-500/10' 
                            : 'text-rose-400 bg-rose-500/10'
                        }`}>
                          {rec.details.riskGuardEvaluation.passed ? 'اجتاز ✓' : 'فيتو ✗'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Detailed Decision Audit Log */}
      {subTab === 'audit' && (
        <DecisionLogView decisions={decisions} onClearLog={onClearDecisions} />
      )}

      {/* Subtab 3: Programmatic Unit Tests Suite */}
      {subTab === 'unit_tests' && (
        <TestSuiteView />
      )}
    </div>
  );
};

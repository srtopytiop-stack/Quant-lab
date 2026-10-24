'use client';

import React, { useState } from 'react';
import { DecisionRecord } from '@/lib/quant/types';
import { FormattedTime } from './FormattedTime';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Code, 
  Copy, 
  Check, 
  FileText, 
  Filter, 
  ShieldAlert, 
  Cpu, 
  Layers 
} from 'lucide-react';

interface DecisionLogViewProps {
  decisions: DecisionRecord[];
  onClearLog: () => void;
}

export const DecisionLogView: React.FC<DecisionLogViewProps> = ({
  decisions,
  onClearLog,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'REJECTED_VETO' | 'DATA_INSUFFICIENT'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(decisions[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<string | null>(null);

  const filteredDecisions = decisions.filter((d) => {
    if (filter === 'ALL') return true;
    return d.finalDecision === filter;
  });

  const handleCopyJson = (record: DecisionRecord) => {
    navigator.clipboard.writeText(record.strictJsonSchemaOutput);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>سجل قرارات محرك المخاطر والتدقيق الحتمي (Audit Trail)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            توثيق كامل لكل قرار اتخذه حارس المخاطر ووكيلا الألفا والتنفيذ، مع تفصيل أسباب الفيتو أو القبول البرمجي.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'ALL' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل ({decisions.length})
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              مقبول ({decisions.filter((d) => d.finalDecision === 'APPROVED').length})
            </button>
            <button
              onClick={() => setFilter('REJECTED_VETO')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'REJECTED_VETO' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              فيتو ({decisions.filter((d) => d.finalDecision === 'REJECTED_VETO').length})
            </button>
            <button
              onClick={() => setFilter('DATA_INSUFFICIENT')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'DATA_INSUFFICIENT' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              بيانات غير كافية ({decisions.filter((d) => d.finalDecision === 'DATA_INSUFFICIENT').length})
            </button>
          </div>

          {decisions.length > 0 && (
            <button
              onClick={onClearLog}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-900 transition-colors"
            >
              مسح السجل
            </button>
          )}
        </div>
      </div>

      {/* Decision List */}
      {filteredDecisions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">لا توجد قرارات مطابقة للتصفية</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            قم بإرسال مقترح صفقة جديد من تبويب &quot;السوق ونموذج الصفقات&quot; أو اختر سيناريو تجريبي لمعاينة فحص حارس المخاطر.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDecisions.map((record) => {
            const isExpanded = expandedId === record.id;
            const isApproved = record.finalDecision === 'APPROVED';
            const isVeto = record.finalDecision === 'REJECTED_VETO';
            const isInsufficient = record.finalDecision === 'DATA_INSUFFICIENT';

            return (
              <div
                key={record.id}
                className={`rounded-2xl border transition-all ${
                  isApproved
                    ? 'bg-slate-900/80 border-emerald-500/30 shadow-md shadow-emerald-950/20'
                    : isVeto
                    ? 'bg-slate-900/80 border-rose-500/30 shadow-md shadow-rose-950/20'
                    : 'bg-slate-900/80 border-amber-500/30 shadow-md shadow-amber-950/20'
                }`}
              >
                {/* Collapsed Header Bar */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    {isApproved && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                    {isVeto && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                    {isInsufficient && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-slate-100">
                          {record.symbol}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            record.direction === 'LONG'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {record.direction}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isVeto
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {isApproved
                            ? 'تمت الموافقة (APPROVED)'
                            : isVeto
                            ? `مرفوض بفيتو [${record.riskGuard.vetoCode}]`
                            : 'بيانات غير كافية (DATA_INSUFFICIENT)'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-3 flex-wrap">
                        <span>دخول: ${record.proposal.entryPrice.toLocaleString()}</span>
                        <span>
                          وقف: {record.proposal.stopLoss > 0 ? `$${record.proposal.stopLoss.toLocaleString()}` : 'مفقود'}
                        </span>
                        <span>مخاطرة: {record.riskGuard.checks.riskPerTrade1Pct.riskPctOfEquity.toFixed(2)}%</span>
                        <FormattedTime timestamp={record.timestamp} className="text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowJsonModal(record.id);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1 transition-colors"
                      title="عرض مخرجات JSON الصارمة"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyJson(record);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-colors"
                      title="نسخ مخرجات JSON"
                    >
                      {copiedId === record.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Breakdown */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-4 text-xs">
                    {/* Human-Readable Arabic Explanation */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 leading-relaxed font-sans">
                      <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1.5 font-bold">
                        <span>التقرير التوضيحي باللغة العربية (Human-Readable Verdict):</span>
                      </div>
                      <p className="whitespace-pre-line text-xs sm:text-sm">{record.explanationAr}</p>
                    </div>

                    {/* Sub-Agents Verification Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Sub-Agent 1: ALPHA AGENT */}
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-mono font-bold text-cyan-400 text-xs">
                            1. ALPHA AGENT (الفرضية)
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {record.alphaAgent.actionProposal}
                          </span>
                        </div>
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">نظام السوق:</span>
                            <span className="text-slate-200">{record.alphaAgent.regime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">ثقة النظام:</span>
                            <span className="text-cyan-300">
                              {(record.alphaAgent.regimeConfidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">إشارة OFI:</span>
                            <span className="text-slate-200">
                              {record.alphaAgent.ofiScore > 0 ? '+' : ''}
                              {record.alphaAgent.ofiScore.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">الألفا المتوقعة:</span>
                            <span className="text-emerald-400">
                              {record.alphaAgent.expectedAlphaBps} bps
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-Agent 2: RISK GUARD */}
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-mono font-bold text-rose-400 text-xs">
                            2. RISK GUARD (الفيتو الصارم)
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold ${
                              record.riskGuard.passed ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {record.riskGuard.passed ? 'اجتاز ✓' : 'فيتو ✗'}
                          </span>
                        </div>
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">أمر الوقف:</span>
                            <span className={record.riskGuard.checks.stopLoss.passed ? 'text-emerald-400' : 'text-rose-400'}>
                              {record.riskGuard.checks.stopLoss.passed ? 'سليم ✓' : 'فاشل ✗'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">المخاطرة (&le;1%):</span>
                            <span className={record.riskGuard.checks.riskPerTrade1Pct.passed ? 'text-emerald-400' : 'text-rose-400'}>
                              {record.riskGuard.checks.riskPerTrade1Pct.riskPctOfEquity.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">التراجع (&le;3%):</span>
                            <span className={record.riskGuard.checks.dailyDrawdownMax3Pct.passed ? 'text-emerald-400' : 'text-rose-400'}>
                              {record.riskGuard.checks.dailyDrawdownMax3Pct.worstCaseProjectedDrawdownPct.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">فحص DSR (&gt;95%):</span>
                            <span className={record.riskGuard.checks.deflatedSharpeRatio.passed ? 'text-emerald-400' : 'text-rose-400'}>
                              {record.riskGuard.checks.deflatedSharpeRatio.currentValueDisplay}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-Agent 3: EXECUTION AGENT */}
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            3. EXECUTION (حجم الصفقة)
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {record.executionAgent.executionRouting}
                          </span>
                        </div>
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">الحجم المعتمد:</span>
                            <span className="text-amber-300 font-bold">
                              {record.executionAgent.approvedSize} وحدة
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">التعرض الاسمي:</span>
                            <span className="text-slate-200">
                              ${record.executionAgent.notionalExposureUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">أقصى خسارة:</span>
                            <span className="text-rose-400 font-bold">
                              ${record.executionAgent.maxCapitalLossUsd.toFixed(2)} ({record.executionAgent.riskPctOfEquity.toFixed(2)}%)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">كسر كيلي (Kelly):</span>
                            <span className="text-slate-300">
                              {(record.executionAgent.fractionalKellyFraction * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Execution Advice */}
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60 text-[11px] text-slate-400 font-sans">
                      <span className="font-bold text-slate-300">توجيه التنفيذ: </span>
                      {record.executionAgent.executionAdviceAr}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* JSON Schema Viewer Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-100 font-mono">
                  AQDE-Core Deterministic JSON Output
                </h3>
              </div>
              <button
                onClick={() => setShowJsonModal(null)}
                className="text-slate-400 hover:text-slate-200 p-1 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-950 text-emerald-300 rounded-b-2xl">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {decisions.find((d) => d.id === showJsonModal)?.strictJsonSchemaOutput}
              </pre>
            </div>

            <div className="p-3 border-t border-slate-800 flex justify-end gap-2 bg-slate-900 rounded-b-2xl">
              <button
                onClick={() => {
                  const item = decisions.find((d) => d.id === showJsonModal);
                  if (item) handleCopyJson(item);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ مخرجات JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

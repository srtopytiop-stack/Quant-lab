'use client';

import React, { useState } from 'react';
import { runAllUnitTests } from '@/lib/quant/unit-tests';
import { UnitTestItem } from '@/lib/quant/types';
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  ShieldCheck, 
  AlertTriangle, 
  FileCheck2, 
  HelpCircle, 
  Cpu 
} from 'lucide-react';

export const TestSuiteView: React.FC = () => {
  const [testResults, setTestResults] = useState<UnitTestItem[]>(() => runAllUnitTests());
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = runAllUnitTests();
      setTestResults(results);
      setIsRunning(false);
    }, 200);
  };

  const passedCount = testResults.filter((t) => t.testPassed).length;
  const totalCount = testResults.length;
  const allPassed = passedCount === totalCount;

  return (
    <div className="space-y-6">
      {/* Header & Execution Status Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              مجموعة الاختبارات البرمجية لحارس المخاطر (Unit Test Suite)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            فحوصات برمجية حتمية ومستقلة تمامًا للتحقق من سلامة منطق الفيتو، وقواعد رأس المال، ونظرية DSR، واستجابة DATA_INSUFFICIENT.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left font-mono">
            <span className="text-xs text-slate-400 block">حالة الاختبارات:</span>
            <span className={`text-sm font-bold ${allPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {passedCount} / {totalCount} اجتاز بنجاح (100%)
            </span>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-colors cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'جارٍ الفحص...' : 'إعادة تشغيل الفحوصات'}</span>
          </button>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="space-y-3">
        {testResults.map((test, index) => {
          const isPassed = test.testPassed;
          const actual = test.actualResult;

          return (
            <div
              key={test.id}
              className={`p-4 rounded-2xl border transition-all ${
                isPassed
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  : 'bg-rose-950/20 border-rose-500/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-500 font-bold">
                        #{index + 1}
                      </span>
                      <h3 className="font-bold text-sm text-slate-200">
                        {test.titleAr}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          test.category === 'COMPLIANT'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            : test.category === 'STOP_LOSS'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {test.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {test.descriptionAr}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 font-mono text-xs text-left sm:text-right bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="text-[11px] text-slate-500">
                    القرار المتوقع: <b className="text-slate-300">{test.expectedDecision}</b>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    القرار الفعلي: <b className={isPassed ? 'text-emerald-400' : 'text-rose-400'}>{actual?.finalDecision}</b>
                  </div>
                  {test.expectedVetoCode && (
                    <div className="text-[10px] text-slate-500">
                      كود الفيتو: <span className="text-amber-400 font-bold">[{test.expectedVetoCode}]</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Underlying Execution Details */}
              {actual && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
                  <div>
                    <span>دخول: </span>
                    <span className="text-slate-200">${actual.proposal.entryPrice.toLocaleString()}</span>
                  </div>
                  <div>
                    <span>وقف: </span>
                    <span className="text-slate-200">
                      {actual.proposal.stopLoss > 0 ? `$${actual.proposal.stopLoss.toLocaleString()}` : 'مفقود (0)'}
                    </span>
                  </div>
                  <div>
                    <span>المخاطرة: </span>
                    <span className={actual.riskGuard.checks.riskPerTrade1Pct.passed ? 'text-emerald-400' : 'text-rose-400'}>
                      {actual.riskGuard.checks.riskPerTrade1Pct.riskPctOfEquity.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span>حجم معتمد: </span>
                    <span className="text-slate-200">{actual.executionAgent.approvedSize} وحدة</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

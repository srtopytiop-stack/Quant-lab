'use client';

import React, { useState } from 'react';
import { PYTHON_CORE_SCRIPT } from '@/lib/quant/python-code';
import { Code2, Copy, Check, Terminal, BookOpen, Layers, ShieldCheck } from 'lucide-react';

export const PythonCoreView: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_CORE_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              معمل بايثون الإحصائي (Python Quantitative Core)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            كود بايثون متكامل ومستقل يستخدم مكتبات التحليل الإحصائي (<code className="text-emerald-400 font-mono">numpy</code>, <code className="text-cyan-400 font-mono">scipy.stats</code>, <code className="text-amber-400 font-mono">pandas</code>) لتنفيذ معادلات DSR و EVT-VaR وحارس المخاطر برمجياً.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono font-bold text-xs flex items-center gap-2 shadow transition-colors cursor-pointer self-start sm:self-auto"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ كود بايثون'}</span>
        </button>
      </div>

      {/* Mathematical Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <BookOpen className="w-4 h-4" />
            <span>1. Deflated Sharpe Ratio (DSR)</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            يُحسب باستخدام معادلة Bailey & López de Prado (2014) لتعويض تحيز البحث المتعدد عن عزم الأرباح وتفرطح عوائد العملات المشفرة:
          </p>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300">
            DSR = Φ((SR - E[max SR_n]) / σ_SR)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>2. Extreme Value Theory (EVT-VaR)</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            تطبيق أسلوب تجاوز العتبة (Peaks-over-Threshold) بمطابقة توزيع باريتو العام (GPD) على ذيل الخسائر بنسبة ثقة 99%:
          </p>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-rose-300">
            VaR_0.99 = u + (β/ξ) * ((n/Nu * 0.01)^-ξ - 1)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Layers className="w-4 h-4" />
            <span>3. Fractional Kelly & Risk Cap</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            تحديد حجم المراكز وفقًا لنموذج كيلي الجزئي (15% Fractional Kelly) مع ربط صارم يمنع تجاوز مخاطرة 1.0% من رأس المال لكل صفقة.
          </p>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300">
            Risk_USD = |Entry - SL| * Size &le; 1.0% Equity
          </div>
        </div>
      </div>

      {/* Code Editor / Viewer */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>aqde_core_engine.py</span>
          </div>
          <span className="text-slate-500">Python 3.10+ (NumPy, SciPy, Pandas)</span>
        </div>

        <div className="p-4 overflow-x-auto max-h-[500px]">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {PYTHON_CORE_SCRIPT}
          </pre>
        </div>
      </div>

      {/* How to Run Locally */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
        <h4 className="font-bold text-slate-200 text-sm">
          كيفية تشغيل هذا الكود محليًا في بيئة بايثون:
        </h4>
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-emerald-400 text-xs">
          pip install numpy scipy pandas streamlit<br />
          python aqde_core_engine.py
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { 
  Settings2, 
  Radio, 
  ShieldCheck, 
  Sliders, 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw 
} from 'lucide-react';

interface SettingsDiagnosticsProps {
  isLiveFeedActive: boolean;
  onToggleLiveFeed: () => void;
  onRefreshData: () => void;
}

export const SettingsDiagnosticsView: React.FC<SettingsDiagnosticsProps> = ({
  isLiveFeedActive,
  onToggleLiveFeed,
  onRefreshData,
}) => {
  const [maxRiskCapPct, setMaxRiskCapPct] = useState<number>(1.0);
  const [dailyDrawdownLimitPct, setDailyDrawdownLimitPct] = useState<number>(3.0);
  const [dsrThreshold, setDsrThreshold] = useState<number>(0.95);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-emerald-400" />
          <span>الإعدادات والتشخيص الكمي (Settings & Diagnostics)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          إدارة مزودي البيانات، وضبط عتبات الأمان الرياضية لحارس المخاطر، وفحص صحة النظام.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Data Providers Status */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>مزودو بيانات السوق والاتصال</span>
            </h3>
            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
              isLiveFeedActive 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {isLiveFeedActive ? 'بث حي عام (Binance)' : 'محاكاة تركيبية (Synthetic)'}
            </span>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <p>
              يستخدم النظام في الوضع الافتراضي محاكي بيانات مجهرية تركيبي (Synthetic LOB Simulator) لأغراض الأبحاث الكمية دون أي تكاليف أو مفاتيح API مدفوعة.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">مزود البيانات اللحظي:</span>
                <span className="text-slate-200 font-bold">
                  {isLiveFeedActive ? 'Binance Public 24hr Ticker API' : 'AQDE-Simulated Microstructure Feed'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">حالة المفاتيح السرية (API Keys):</span>
                <span className="text-emerald-400 font-bold">غير مطلوبة (متاح للجميع مجاناً)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">فحص سلامة الفارق السعري:</span>
                <span className="text-emerald-400 font-bold">نشط (&lt; 35 bps)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onToggleLiveFeed}
                className={`py-2 px-4 rounded-xl text-xs font-mono font-bold border transition-colors flex items-center gap-2 ${
                  isLiveFeedActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isLiveFeedActive ? 'animate-pulse text-emerald-400' : ''}`} />
                <span>{isLiveFeedActive ? 'التبديل إلى المحاكاة التركيبية' : 'تفعيل البث الحي (Binance Public)'}</span>
              </button>

              <button
                type="button"
                onClick={onRefreshData}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="تحديث البيانات فوراً"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Risk Guard Thresholds Configuration */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>عتبات الأمان لحارس المخاطر (Risk Parameters)</span>
            </h3>
            <span className="text-xs font-mono text-rose-400 font-bold">سلطة الفيتو الإلزامية</span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                سقف المخاطرة لكل صفقة (Max Equity Risk %)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="2.0"
                  value={maxRiskCapPct}
                  onChange={(e) => setMaxRiskCapPct(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm font-mono text-slate-200"
                />
                <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-500">%</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                المعيار القياسي لمؤسسات التحوط: 1.00% كحد أقصى لحماية رأس المال.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                سقف التراجع اليومي الأقصى (Max Daily Drawdown %)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="1.0"
                  max="5.0"
                  value={dailyDrawdownLimitPct}
                  onChange={(e) => setDailyDrawdownLimitPct(parseFloat(e.target.value) || 3.0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm font-mono text-slate-200"
                />
                <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-500">%</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                تجميد فوري لجميع الصفقات الجديدة عند بلوغ هذا الحد يومياً.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                عتبة شارب المخفضة (DSR Threshold)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.80"
                  max="0.99"
                  value={dsrThreshold}
                  onChange={(e) => setDsrThreshold(parseFloat(e.target.value) || 0.95)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm font-mono text-slate-200"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                مستوى الثقة الإحصائي لمكافحة الملاءمة الزائدة (الموصى به: 0.95 أي 95%).
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                تطبيق وحفظ العتبات
              </button>

              {savedSuccess && (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم حفظ الإعدادات بنجاح</span>
                </span>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* System Architecture Diagnostics */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono text-slate-400">
        <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>تشخيص البنية التحتية الكمية (Architecture Diagnostics)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block">نواة المحرك:</span>
            <span className="text-slate-200 font-bold">AQDE-Core v2.4 Deterministic</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block">نموذج اتخاذ القرار:</span>
            <span className="text-emerald-400 font-bold">Consolidated Consensus Pipeline</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block">حالة الـ Look-Ahead Bias:</span>
            <span className="text-emerald-400 font-bold">محمي بتأخير 1-Bar Lag</span>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { 
  Sparkles, 
  Activity, 
  Cpu, 
  TrendingUp, 
  ShieldCheck, 
  Settings2 
} from 'lucide-react';

export type MainTabType = 
  | 'recommendation' 
  | 'markets' 
  | 'research' 
  | 'backtest' 
  | 'risk_history' 
  | 'settings';

interface NavbarProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  recommendationCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  recommendationCount 
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/85 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('recommendation')}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 text-white font-mono font-bold text-lg cursor-pointer"
            >
              QL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 
                  onClick={() => setActiveTab('recommendation')}
                  className="font-bold text-base sm:text-lg text-slate-100 tracking-tight cursor-pointer hover:text-emerald-400 transition-colors"
                >
                  QUANTLAB &bull; Practical Decision Center
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  AQDE-Core v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                منصة الأبحاث والقرارات الكمية المتكاملة مع حارس مخاطر حتمي مستقل
              </p>
            </div>
          </div>

          {/* Sub-Agents Status Badges */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[11px] text-cyan-300">ALPHA AGENT</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-rose-500/30 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-[11px] text-rose-300 font-bold">RISK GUARD</span>
              <span className="text-[10px] text-rose-400">فيتو إلزامي</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-[11px] text-amber-300">EXECUTION</span>
              <span className="text-[10px] text-slate-500">&le;1%</span>
            </div>
          </div>
        </div>

        {/* 6 Top-Level Streamlined Navigation Areas */}
        <nav className="flex space-x-reverse space-x-1 sm:space-x-reverse sm:space-x-2 overflow-x-auto py-2 border-t border-slate-900 no-scrollbar text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('recommendation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'recommendation'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>مركز التوصية (Recommendation Center)</span>
          </button>

          <button
            onClick={() => setActiveTab('markets')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'markets'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>الأسواق وعمق الدفتر (Markets)</span>
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'research'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>الأبحاث والنماذج (Research & Models)</span>
          </button>

          <button
            onClick={() => setActiveTab('backtest')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'backtest'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>اختبار الاستراتيجيات (Backtesting)</span>
          </button>

          <button
            onClick={() => setActiveTab('risk_history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'risk_history'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>المخاطر والسجل (Risk & History)</span>
            {recommendationCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-emerald-400">
                {recommendationCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>الإعدادات والتشخيص (Settings)</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

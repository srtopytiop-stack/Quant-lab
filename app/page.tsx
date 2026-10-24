'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, MainTabType } from '@/components/Navbar';
import { RecommendationCenter } from '@/components/RecommendationCenter';
import { MarketOverview } from '@/components/MarketOverview';
import { TradeProposalForm } from '@/components/TradeProposalForm';
import { BacktestScreen } from '@/components/BacktestScreen';
import { RiskAndHistoryView } from '@/components/RiskAndHistoryView';
import { SettingsDiagnosticsView } from '@/components/SettingsDiagnosticsView';
import { PythonCoreView } from '@/components/PythonCoreView';
import { 
  MarketData, 
  SymbolType, 
  OrderProposal, 
  DecisionRecord, 
  ConsolidatedRecommendation,
  FIXED_INITIAL_TIMESTAMP 
} from '@/lib/quant/types';
import { processTradeProposal } from '@/lib/quant/engine';
import { generateConsolidatedRecommendation } from '@/lib/quant/recommendation-engine';
import { runAllUnitTests } from '@/lib/quant/unit-tests';
import { ShieldCheck, Cpu, Code2, Sliders } from 'lucide-react';

const INITIAL_MARKETS: Record<SymbolType, MarketData> = {
  'BTC/USDT': {
    symbol: 'BTC/USDT',
    price: 68420.5,
    change24h: 1450.5,
    change24hPct: 2.16,
    high24h: 69150.0,
    low24h: 66800.0,
    volume24hUsd: 1850000000,
    realizedVolatilityAnn: 0.46,
    atr: 1650,
    regime: 'BULL_TREND',
    regimeConfidence: 0.82,
    ofiScore: 0.34,
    bestBid: 68418.0,
    bestAsk: 68423.0,
    spreadBps: 0.73,
    bidDepthUsd: 6200000,
    askDepthUsd: 4100000,
    isSimulated: true,
    dataSourceType: 'SIMULATED_DEMO',
    dataSourceLabel: 'بيانات تجريبية موسومة للأبحاث الكمية (Simulated)',
    lastUpdated: FIXED_INITIAL_TIMESTAMP,
  },
  'ETH/USDT': {
    symbol: 'ETH/USDT',
    price: 3512.2,
    change24h: -42.8,
    change24hPct: -1.20,
    high24h: 3620.0,
    low24h: 3480.0,
    volume24hUsd: 820000000,
    realizedVolatilityAnn: 0.58,
    atr: 110,
    regime: 'MEAN_REVERTING',
    regimeConfidence: 0.76,
    ofiScore: -0.18,
    bestBid: 3511.5,
    bestAsk: 3512.8,
    spreadBps: 3.70,
    bidDepthUsd: 2800000,
    askDepthUsd: 3400000,
    isSimulated: true,
    dataSourceType: 'SIMULATED_DEMO',
    dataSourceLabel: 'بيانات تجريبية موسومة للأبحاث الكمية (Simulated)',
    lastUpdated: FIXED_INITIAL_TIMESTAMP,
  },
  'SOL/USDT': {
    symbol: 'SOL/USDT',
    price: 184.6,
    change24h: 6.8,
    change24hPct: 3.82,
    high24h: 188.0,
    low24h: 176.5,
    volume24hUsd: 490000000,
    realizedVolatilityAnn: 0.68,
    atr: 7.8,
    regime: 'BULL_TREND',
    regimeConfidence: 0.88,
    ofiScore: 0.46,
    bestBid: 184.55,
    bestAsk: 184.65,
    spreadBps: 5.41,
    bidDepthUsd: 1950000,
    askDepthUsd: 1200000,
    isSimulated: true,
    dataSourceType: 'SIMULATED_DEMO',
    dataSourceLabel: 'بيانات تجريبية موسومة للأبحاث الكمية (Simulated)',
    lastUpdated: FIXED_INITIAL_TIMESTAMP,
  },
  'BNB/USDT': {
    symbol: 'BNB/USDT',
    price: 596.4,
    change24h: 4.2,
    change24hPct: 0.71,
    high24h: 602.0,
    low24h: 588.5,
    volume24hUsd: 280000000,
    realizedVolatilityAnn: 0.38,
    atr: 13.5,
    regime: 'CHOPPY_RANGE',
    regimeConfidence: 0.65,
    ofiScore: 0.04,
    bestBid: 596.3,
    bestAsk: 596.5,
    spreadBps: 3.35,
    bidDepthUsd: 1100000,
    askDepthUsd: 1050000,
    isSimulated: true,
    dataSourceType: 'SIMULATED_DEMO',
    dataSourceLabel: 'بيانات تجريبية موسومة للأبحاث الكمية (Simulated)',
    lastUpdated: FIXED_INITIAL_TIMESTAMP,
  },
};

export default function DashboardPage() {
  // Recommendation Center is the primary default landing screen
  const [activeTab, setActiveTab] = useState<MainTabType>('recommendation');
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolType>('BTC/USDT');
  const [markets, setMarkets] = useState<Record<SymbolType, MarketData>>(INITIAL_MARKETS);
  const [isLiveFeedActive, setIsLiveFeedActive] = useState<boolean>(false);
  
  // Research Sub-tab state
  const [researchSubTab, setResearchSubTab] = useState<'proposal_evaluator' | 'python_core'>('proposal_evaluator');

  // Recommendation History state
  const [recommendationHistory, setRecommendationHistory] = useState<ConsolidatedRecommendation[]>(() => {
    // Generate initial initial recommendation for BTC
    const initialRec = generateConsolidatedRecommendation({
      market: INITIAL_MARKETS['BTC/USDT'],
      timeframe: '1h',
      horizon: 'SWING',
    });
    return [initialRec];
  });

  // Decision Audit state (from custom proposals)
  const [decisions, setDecisions] = useState<DecisionRecord[]>(() => {
    const seedTests = runAllUnitTests(INITIAL_MARKETS['BTC/USDT']);
    return seedTests
      .map((t) => t.actualResult)
      .filter((r): r is DecisionRecord => r !== undefined);
  });

  // Periodic Microstructure Simulation Update (Every 4 seconds if in simulated mode)
  useEffect(() => {
    if (isLiveFeedActive) return;

    const interval = setInterval(() => {
      setMarkets((prev) => {
        const next = { ...prev };
        (['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'] as SymbolType[]).forEach((sym) => {
          const m = prev[sym];
          if (!m) return;
          const deltaPrice = (Math.random() - 0.49) * (
            sym === 'BTC/USDT' ? 45 : sym === 'ETH/USDT' ? 3.5 : sym === 'SOL/USDT' ? 0.35 : 0.8
          );
          const newPrice = Math.round((m.price + deltaPrice) * 100) / 100;
          
          const deltaOFI = (Math.random() - 0.5) * 0.08;
          const newOFI = Math.max(-0.95, Math.min(0.95, m.ofiScore + deltaOFI));
          
          const newBidDepth = Math.round(m.bidDepthUsd * (1 + (Math.random() - 0.5) * 0.04));
          const newAskDepth = Math.round(m.askDepthUsd * (1 + (Math.random() - 0.5) * 0.04));

          next[sym] = {
            ...m,
            price: newPrice,
            bestBid: newPrice - (sym === 'BTC/USDT' ? 2 : 0.2),
            bestAsk: newPrice + (sym === 'BTC/USDT' ? 2 : 0.2),
            ofiScore: Math.round(newOFI * 100) / 100,
            bidDepthUsd: newBidDepth,
            askDepthUsd: newAskDepth,
            lastUpdated: Date.now(),
          };
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveFeedActive]);

  // Fetch Public Live Feed from Binance public REST ticker when enabled
  const fetchLiveTicker = useCallback(async () => {
    try {
      const [btcRes, ethRes, solRes, bnbRes] = await Promise.all([
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT'),
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT'),
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BNBUSDT'),
      ]);
      
      if (btcRes.ok && ethRes.ok) {
        const [btcData, ethData, solData, bnbData] = await Promise.all([
          btcRes.json(),
          ethRes.json(),
          solRes.ok ? solRes.json() : null,
          bnbRes.ok ? bnbRes.json() : null,
        ]);

        setMarkets((prev) => ({
          'BTC/USDT': {
            ...prev['BTC/USDT'],
            price: parseFloat(btcData.lastPrice),
            change24h: parseFloat(btcData.priceChange),
            change24hPct: parseFloat(btcData.priceChangePercent),
            high24h: parseFloat(btcData.highPrice),
            low24h: parseFloat(btcData.lowPrice),
            volume24hUsd: parseFloat(btcData.quoteVolume),
            bestBid: parseFloat(btcData.bidPrice),
            bestAsk: parseFloat(btcData.askPrice),
            isSimulated: false,
            dataSourceType: 'LIVE_PUBLIC',
            dataSourceLabel: 'بث حي عام (Binance Public 24h Ticker)',
            lastUpdated: Date.now(),
          },
          'ETH/USDT': {
            ...prev['ETH/USDT'],
            price: parseFloat(ethData.lastPrice),
            change24h: parseFloat(ethData.priceChange),
            change24hPct: parseFloat(ethData.priceChangePercent),
            high24h: parseFloat(ethData.highPrice),
            low24h: parseFloat(ethData.lowPrice),
            volume24hUsd: parseFloat(ethData.quoteVolume),
            bestBid: parseFloat(ethData.bidPrice),
            bestAsk: parseFloat(ethData.askPrice),
            isSimulated: false,
            dataSourceType: 'LIVE_PUBLIC',
            dataSourceLabel: 'بث حي عام (Binance Public 24h Ticker)',
            lastUpdated: Date.now(),
          },
          'SOL/USDT': solData ? {
            ...prev['SOL/USDT'],
            price: parseFloat(solData.lastPrice),
            change24h: parseFloat(solData.priceChange),
            change24hPct: parseFloat(solData.priceChangePercent),
            high24h: parseFloat(solData.highPrice),
            low24h: parseFloat(solData.lowPrice),
            volume24hUsd: parseFloat(solData.quoteVolume),
            bestBid: parseFloat(solData.bidPrice),
            bestAsk: parseFloat(solData.askPrice),
            isSimulated: false,
            dataSourceType: 'LIVE_PUBLIC',
            dataSourceLabel: 'بث حي عام (Binance Public 24h Ticker)',
            lastUpdated: Date.now(),
          } : prev['SOL/USDT'],
          'BNB/USDT': bnbData ? {
            ...prev['BNB/USDT'],
            price: parseFloat(bnbData.lastPrice),
            change24h: parseFloat(bnbData.priceChange),
            change24hPct: parseFloat(bnbData.priceChangePercent),
            high24h: parseFloat(bnbData.highPrice),
            low24h: parseFloat(bnbData.lowPrice),
            volume24hUsd: parseFloat(bnbData.quoteVolume),
            bestBid: parseFloat(bnbData.bidPrice),
            bestAsk: parseFloat(bnbData.askPrice),
            isSimulated: false,
            dataSourceType: 'LIVE_PUBLIC',
            dataSourceLabel: 'بث حي عام (Binance Public 24h Ticker)',
            lastUpdated: Date.now(),
          } : prev['BNB/USDT'],
        }));
      }
    } catch (err) {
      console.warn('Live API unavailable, continuing with calibrated synthetic feed:', err);
    }
  }, []);

  const handleToggleLiveFeed = () => {
    if (!isLiveFeedActive) {
      setIsLiveFeedActive(true);
      fetchLiveTicker();
    } else {
      setIsLiveFeedActive(false);
      setMarkets((prev) => ({
        'BTC/USDT': { ...prev['BTC/USDT'], isSimulated: true, dataSourceType: 'SIMULATED_DEMO', dataSourceLabel: 'بيانات تجريبية موسومة للأبحاث الكمية (Simulated)' },
        'ETH/USDT': { ...prev['ETH/USDT'], isSimulated: true, dataSourceType: 'SIMULATED_DEMO', dataSourceLabel: 'بيانات تجريبية موسومة للأبحاث الكمية (Simulated)' },
        'SOL/USDT': { ...prev['SOL/USDT'], isSimulated: true, dataSourceType: 'SIMULATED_DEMO', dataSourceLabel: 'بيانات تجريبية موسومة للأبحاث الكمية (Simulated)' },
        'BNB/USDT': { ...prev['BNB/USDT'], isSimulated: true, dataSourceType: 'SIMULATED_DEMO', dataSourceLabel: 'بيانات تجريبية موسومة للأبحاث الكمية (Simulated)' },
      }));
    }
  };

  const handleSimulateShock = (sym: SymbolType) => {
    setMarkets((prev) => ({
      ...prev,
      [sym]: {
        ...prev[sym],
        regime: 'HIGH_VOL_CRISIS',
        regimeConfidence: 0.94,
        realizedVolatilityAnn: 0.88,
        ofiScore: -0.78,
        change24hPct: prev[sym].change24hPct - 4.5,
        price: Math.round(prev[sym].price * 0.965 * 100) / 100,
        lastUpdated: Date.now(),
      },
    }));
  };

  const handleRefreshData = () => {
    if (isLiveFeedActive) {
      fetchLiveTicker();
    } else {
      setMarkets((prev) => {
        const next = { ...prev };
        (['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'] as SymbolType[]).forEach((sym) => {
          if (next[sym]) {
            next[sym] = {
              ...next[sym],
              price: Math.round((next[sym].price + (Math.random() - 0.48) * 15) * 100) / 100,
              lastUpdated: Date.now(),
            };
          }
        });
        return next;
      });
    }
  };

  const handleSaveRecommendation = (rec: ConsolidatedRecommendation) => {
    setRecommendationHistory((prev) => [rec, ...prev.slice(0, 49)]);
  };

  const handleCustomProposalSubmit = (proposal: OrderProposal) => {
    const market = markets[proposal.symbol] || markets['BTC/USDT'];
    const decision = processTradeProposal({
      proposal,
      marketData: market,
    });
    setDecisions((prev) => [decision, ...prev]);
    setActiveTab('risk_history');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" suppressHydrationWarning>
      {/* Streamlined Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        recommendationCount={recommendationHistory.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Recommendation Center (Primary Landing Page) */}
        {activeTab === 'recommendation' && (
          <RecommendationCenter
            markets={markets}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            onSaveRecommendationToHistory={handleSaveRecommendation}
            onNavigateToRisk={() => setActiveTab('risk_history')}
          />
        )}

        {/* 2. Markets & Order Book Depth */}
        {activeTab === 'markets' && (
          <div className="space-y-6">
            <MarketOverview
              markets={markets}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
              onSimulateShock={handleSimulateShock}
              onRefreshData={handleRefreshData}
              isLiveFeedActive={isLiveFeedActive}
              onToggleLiveFeed={handleToggleLiveFeed}
            />
          </div>
        )}

        {/* 3. Research & Models */}
        {activeTab === 'research' && (
          <div className="space-y-6">
            {/* Sub-navigation inside Research */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <span>الأبحاث والنماذج الكمية المتقدمة (Research & Models)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  تقييم المقترحات اليدوية عبر حارس المخاطر ومعمل بايثون الإحصائي.
                </p>
              </div>

              <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setResearchSubTab('proposal_evaluator')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    researchSubTab === 'proposal_evaluator'
                      ? 'bg-slate-800 text-emerald-300 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>مُقيِّم المقترحات اليدوية</span>
                </button>
                <button
                  onClick={() => setResearchSubTab('python_core')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    researchSubTab === 'python_core'
                      ? 'bg-slate-800 text-emerald-300 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>معمل بايثون (Python Core)</span>
                </button>
              </div>
            </div>

            {researchSubTab === 'proposal_evaluator' ? (
              <TradeProposalForm
                currentMarket={markets[selectedSymbol] || markets['BTC/USDT']}
                onSubmitProposal={handleCustomProposalSubmit}
              />
            ) : (
              <PythonCoreView />
            )}
          </div>
        )}

        {/* 4. Backtesting & Anti-Look-Ahead Validation */}
        {activeTab === 'backtest' && <BacktestScreen />}

        {/* 5. Risk & History Center */}
        {activeTab === 'risk_history' && (
          <RiskAndHistoryView
            history={recommendationHistory}
            decisions={decisions}
            onClearHistory={() => setRecommendationHistory([])}
            onClearDecisions={() => setDecisions([])}
          />
        )}

        {/* 6. Settings & Diagnostics */}
        {activeTab === 'settings' && (
          <SettingsDiagnosticsView
            isLiveFeedActive={isLiveFeedActive}
            onToggleLiveFeed={handleToggleLiveFeed}
            onRefreshData={handleRefreshData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>QUANTLAB &bull; Deterministic Decision & Risk Framework (AQDE-Core v2.4)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Decision Support Only</span>
            <span>No Uncontrolled Live Execution</span>
            <span>Risk Veto Mandatory</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

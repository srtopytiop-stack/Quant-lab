/**
 * Python Reference Implementations for Quantitative Researchers & Algorithmic Engineers
 * Uses NumPy, SciPy.stats, and Pandas for high-precision quantitative execution.
 */

export const PYTHON_CORE_SCRIPT = `"""
Quantitative Research & Risk Engine (AQDE-Core)
Deterministic Multi-Agent Financial Decision Engine
Libraries: numpy, scipy, pandas
Author: Quantitative Agentic Core
"""

import numpy as np
import pandas as pd
from scipy import stats
from dataclasses import dataclass
from typing import Dict, Any, Tuple, Optional

# Constants
EULER_MASCHERONI = 0.5772156649015329


class DeflatedSharpeRatio:
    """
    Computes Bailey & López de Prado (2014) Deflated Sharpe Ratio (DSR)
    Corrects for Multiple Testing (Selection Bias) and Non-Normality (Skewness, Kurtosis)
    """
    @staticmethod
    def expected_max_sharpe(n_trials: int, var_trials: float = 0.5) -> float:
        if n_trials <= 1:
            return 0.0
        z1 = stats.norm.ppf(1.0 - 1.0 / n_trials)
        z2 = stats.norm.ppf(1.0 - 1.0 / (n_trials * np.e))
        expected_max = np.sqrt(var_trials) * ((1.0 - EULER_MASCHERONI) * z1 + EULER_MASCHERONI * z2)
        return float(max(0.0, expected_max))

    @classmethod
    def calculate(
        cls,
        estimated_annual_sharpe: float,
        track_record_days: int,
        trials_count: int,
        skewness: float = -0.3,
        kurtosis: float = 4.5
    ) -> Dict[str, Any]:
        # Strict sanity bounds: Never hallucinate without adequate sample size
        if track_record_days < 30:
            return {
                "status": "DATA_INSUFFICIENT",
                "reason": f"Sample days ({track_record_days}) < 30 minimum threshold."
            }
        
        daily_sr = estimated_annual_sharpe / np.sqrt(365.0)
        t = track_record_days
        
        # Mertens (2002) asymptotic variance with skewness and kurtosis
        var_daily_sr = (1.0 - skewness * daily_sr + ((kurtosis - 1.0) / 4.0) * (daily_sr ** 2)) / (t - 1)
        sigma_annual_sr = np.sqrt(max(1e-6, var_daily_sr)) * np.sqrt(365.0)
        
        exp_max_sr = cls.expected_max_sharpe(trials_count, var_trials=0.5)
        z_stat = (estimated_annual_sharpe - exp_max_sr) / max(1e-4, sigma_annual_sr)
        dsr = float(stats.norm.cdf(z_stat))
        
        return {
            "status": "CALCULATED",
            "dsr_score": round(dsr, 4),
            "exp_max_sr": round(exp_max_sr, 4),
            "sigma_sr": round(sigma_annual_sr, 4),
            "passed_95pct_gate": dsr >= 0.95
        }


class ExtremeValueTheoryVaR:
    """
    Peaks-over-Threshold (POT) VaR fitting Generalized Pareto Distribution (GPD)
    """
    @staticmethod
    def calculate_99(losses: np.ndarray, threshold_pct: float = 0.90) -> Dict[str, Any]:
        n = len(losses)
        if n < 50:
            return {
                "status": "DATA_INSUFFICIENT",
                "reason": f"Sample count ({n}) < 50 minimum observations for EVT."
            }
        
        pos_losses = np.sort(np.abs(losses))
        u = np.percentile(pos_losses, threshold_pct * 100)
        exceedances = pos_losses[pos_losses > u] - u
        nu = len(exceedances)
        
        if nu < 10:
            return {
                "status": "DATA_INSUFFICIENT",
                "reason": f"Tail exceedances ({nu}) < 10 points for reliable GPD fit."
            }
        
        # Fit Generalized Pareto Distribution via Scipy
        c, loc, scale = stats.genpareto.fit(exceedances, floc=0)
        xi = c  # Shape parameter
        beta = scale  # Scale parameter
        
        alpha = 0.01  # 99% confidence
        if abs(xi) < 1e-4:
            evt_var = u + beta * np.log((nu / n) / alpha)
        else:
            evt_var = u + (beta / xi) * (((n / nu) * alpha) ** (-xi) - 1.0)
            
        return {
            "status": "CALCULATED",
            "evt_var_99_pct": float(round(evt_var * 100, 2)),
            "tail_sample_count": nu,
            "threshold_u": float(round(u * 100, 2))
        }


@dataclass
class TradeProposal:
    symbol: str
    direction: str  # 'LONG' or 'SHORT'
    current_price: float
    entry_price: float
    stop_loss: float
    requested_size: float
    portfolio_equity: float
    current_daily_drawdown_pct: float  # e.g. 0.008 for 0.8%
    trials_count: int
    estimated_annual_sharpe: float
    track_record_days: int


class IndependentRiskGuard:
    """
    Mandatory Veto Authority: Strictly enforces capital survival
    1. Explicit Stop-Loss & Orientation
    2. Capital Risk per trade <= 1.0% of total equity
    3. Daily Drawdown limit <= 3.0%
    4. Deflated Sharpe Ratio >= 0.95
    """
    @staticmethod
    def evaluate(p: TradeProposal, historical_losses: Optional[np.ndarray] = None) -> Dict[str, Any]:
        # 1. Stop-Loss Check
        if not p.stop_loss or p.stop_loss <= 0 or np.isnan(p.stop_loss):
            return {
                "passed": False,
                "veto_code": "MISSING_EXPLICIT_STOP_LOSS",
                "reason_ar": "فيتو إلزامي: أمر وقف الخسارة غير محدد مسبقًا."
            }
            
        if p.direction == "LONG" and p.stop_loss >= p.entry_price:
            return {
                "passed": False,
                "veto_code": "INVALID_STOP_LOSS_DIRECTION",
                "reason_ar": f"فيتو إلزامي: وقف الخسارة ({p.stop_loss}) في الشراء يجب أن يكون أدنى من الدخول ({p.entry_price})."
            }
            
        if p.direction == "SHORT" and p.stop_loss <= p.entry_price:
            return {
                "passed": False,
                "veto_code": "INVALID_STOP_LOSS_DIRECTION",
                "reason_ar": f"فيتو إلزامي: وقف الخسارة ({p.stop_loss}) في البيع يجب أن يكون أعلى من الدخول ({p.entry_price})."
            }

        # 2. Risk Sizing <= 1.0% Equity
        stop_dist = abs(p.entry_price - p.stop_loss)
        risk_dollar = stop_dist * p.requested_size
        risk_pct_equity = (risk_dollar / p.portfolio_equity) * 100.0
        
        if risk_pct_equity > 1.001:
            return {
                "passed": False,
                "veto_code": "EXCEEDS_1_PERCENT_EQUITY_RISK",
                "reason_ar": f"فيتو إلزامي: المخاطرة ({risk_pct_equity:.2f}%) تتجاوز سقف 1.00% من رأس المال."
            }

        # 3. Daily Drawdown <= 3.0%
        current_dd = p.current_daily_drawdown_pct * 100.0
        projected_dd = current_dd + risk_pct_equity
        if projected_dd > 3.0:
            return {
                "passed": False,
                "veto_code": "DAILY_DRAWDOWN_BREACH_PROJECTED",
                "reason_ar": f"فيتو إلزامي: التراجع المتوقع في أسوأ سيناريو ({projected_dd:.2f}%) يتجاوز سقف 3.00% اليومي."
            }

        # 4. Deflated Sharpe Ratio
        dsr_res = DeflatedSharpeRatio.calculate(
            estimated_annual_sharpe=p.estimated_annual_sharpe,
            track_record_days=p.track_record_days,
            trials_count=p.trials_count
        )
        if dsr_res["status"] == "DATA_INSUFFICIENT":
            return {
                "passed": False,
                "veto_code": "DATA_INSUFFICIENT_FOR_DSR",
                "reason_ar": f"فيتو احترازي: {dsr_res['reason']}"
            }
        if not dsr_res["passed_95pct_gate"]:
            return {
                "passed": False,
                "veto_code": "DSR_BELOW_0_95_THRESHOLD",
                "reason_ar": f"فيتو إحصائي: DSR = {dsr_res['dsr_score'] * 100:.1f}% أقل من الحد الأدنى 95.0%."
            }

        return {
            "passed": True,
            "veto_code": None,
            "reason_ar": "تم اجتياز جميع فحوصات حارس المخاطر بنجاح.",
            "metrics": {
                "risk_pct_equity": round(risk_pct_equity, 2),
                "projected_drawdown": round(projected_dd, 2),
                "dsr_score": dsr_res.get("dsr_score")
            }
        }


# Quick Demonstration execution
if __name__ == "__main__":
    proposal = TradeProposal(
        symbol="BTC/USDT",
        direction="LONG",
        current_price=67450.0,
        entry_price=67450.0,
        stop_loss=66800.0,  # $650 stop distance
        requested_size=0.45,  # $292.5 risk on $50,000 equity (0.58% <= 1.0%)
        portfolio_equity=50000.0,
        current_daily_drawdown_pct=0.005,
        trials_count=10,
        estimated_annual_sharpe=2.35,
        track_record_days=180
    )
    
    result = IndependentRiskGuard.evaluate(proposal)
    print("Decision:", "APPROVED" if result["passed"] else "VETOED")
    print("Reason:", result["reason_ar"])
`;

export const PYTHON_GUI_STREAMLIT = `"""
Simple GUI runner for Quantitative Risk Engine using Streamlit
To run: pip install streamlit pandas numpy scipy
        streamlit run app_quant_gui.py
"""
import streamlit as st
# Imports the AQDE-Core logic above
`;

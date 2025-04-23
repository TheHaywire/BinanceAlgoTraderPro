import { StrategyType } from "./types";

export const BINANCE_API_URL = "https://testnet.binancefuture.com";
export const BINANCE_WS_URL = "wss://stream.binancefuture.com"; // For testnet: "wss://stream.binancefuture.com"
export const DEFAULT_TIMEFRAME = "4h";
export const AVAILABLE_TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];

export const STRATEGY_NAMES: Record<StrategyType, string> = {
  MOMENTUM_BREAKOUT: "Momentum Breakout",
  MEAN_REVERSION: "Mean Reversion",
  VOLATILITY_EXPANSION: "Volatility Expansion",
  LIQUIDATION_CASCADE: "Liquidation Cascade",
  FUNDING_ARBITRAGE: "Funding Arbitrage"
};

export const POPULAR_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "XRPUSDT",
  "DOTUSDT",
  "AVAXUSDT",
  "LINKUSDT"
];

export const MAX_POSITIONS = 10;
export const MAX_RISK_EXPOSURE = 30; // Percentage
export const MAX_DRAWDOWN_LIMIT = 15; // Percentage

export const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 25];

export const DEFAULT_CHART_COLORS = {
  candle: {
    up: "#00C897",
    down: "#FF3B69",
    wick: "#B0B0B0",
    border: "#B0B0B0"
  },
  volume: {
    up: "rgba(0, 200, 151, 0.5)",
    down: "rgba(255, 59, 105, 0.5)",
  },
  ma: {
    line: "#0095FF"
  },
  grid: {
    line: "#252D3D"
  }
};

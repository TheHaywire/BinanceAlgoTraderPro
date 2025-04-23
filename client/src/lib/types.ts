// API and market data types
export interface MarketData {
  symbol: string;
  price: string;
  priceChangePercent: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  highPrice: string;
  lowPrice: string;
}

export interface Candle {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
}

export interface Position {
  id: string;
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  marginType: string;
  isolatedMargin: string;
  isAutoAddMargin: string;
  positionSide: 'LONG' | 'SHORT' | 'BOTH';
  notional: string;
  isolatedWallet: string;
  updateTime: number;
}

// Trading types
export type StrategyType = 'MOMENTUM_BREAKOUT' | 'MEAN_REVERSION' | 'VOLATILITY_EXPANSION' | 'LIQUIDATION_CASCADE' | 'FUNDING_ARBITRAGE';

export interface TradingOpportunity {
  id: string;
  symbol: string;
  strategy: StrategyType;
  direction: 'LONG' | 'SHORT';
  entryPriceMin: string;
  entryPriceMax: string;
  targetPrice: string;
  stopLoss: string;
  score: number;
  detectedAt: number;
}

export interface ExecutionOrder {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP' | 'TAKE_PROFIT';
  quantity: string;
  price?: string;
  stopPrice?: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  reduceOnly?: boolean;
  leverage?: number;
}

// Analytics and performance types
export interface PerformanceMetrics {
  portfolioValue: string;
  portfolioChangePercent: string;
  dailyPnL: string;
  dailyPnLPercent: string;
  weeklyPnL: string;
  weeklyPnLPercent: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgProfit: string;
  avgLoss: string;
  maxDrawdown: string;
  sharpeRatio: string;
  sortino: string;
}

export interface RiskMetrics {
  totalRiskExposure: number;
  maxRiskLimit: number;
  currentDrawdown: string;
  maxDrawdownLimit: string;
  maxPositionSize: string;
  maxPositions: number;
  currentPositions: number;
  systemStatus: {
    api: boolean;
    execution: boolean;
    dataFeed: boolean;
  };
}

export interface StrategyPerformance {
  strategy: StrategyType;
  winRate: number;
  pnl: string;
  pnlPercent: string;
  trades: number;
}

// WebSocket message types
export interface WSMessage {
  type: string;
  data: any;
}

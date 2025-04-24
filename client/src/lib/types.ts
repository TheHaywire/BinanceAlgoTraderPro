// Strategy types
export type StrategyType = 
  | 'momentumBreakout'
  | 'meanReversion'
  | 'volatilityExpansion' 
  | 'liquidationCascade'
  | 'fundingRateArbitrage';

// Position types
export interface Position {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  maxNotionalValue: string;
  marginType: string;
  positionSide: string;
  notional: string;
  isolatedWallet: string;
  updateTime: number;
  breakEvenPrice?: string;
  marginCallPrice?: string;
  createdAt?: string;
  userId?: number;
}

// Trading opportunity
export interface TradingOpportunity {
  id: string;
  symbol: string;
  strategy: StrategyType;
  direction: 'LONG' | 'SHORT';
  entryPrice: string;
  targetPrice: string;
  stopLoss: string;
  riskRewardRatio: number;
  signalTime: string;
  confidence: number;
  score: number;
  description: string;
  createdAt?: string;
}

// Market data
export interface MarketData {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
  high: string;
  low: string;
  quoteVolume: string;
  count: number;
  price?: string; // For backward compatibility
}

// Candle data
export interface Candle {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignored: string;
}

// Order types
export interface Order {
  id: number;
  symbol: string;
  orderId: string;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  time: number;
  createdAt?: string;
  updatedAt?: string;
  userId?: number;
}

// For execution
export interface ExecutionOrder {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP' | 'STOP_MARKET';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  positionSide?: 'LONG' | 'SHORT' | 'BOTH';
}

// Performance metrics
export interface PerformanceMetrics {
  id?: number;
  portfolioValue: string;
  portfolioChangePercent: string;
  dailyPnL: string;
  dailyPnLPercent: string;
  weeklyPnL: string;
  weeklyPnLPercent: string;
  monthlyPnL: string;
  monthlyPnLPercent: string;
  totalPnL: string;
  totalPnLPercent: string;
  winRate: number;
  totalTrades: number;
  profitFactor: string;
  sharpeRatio: string;
  maxDrawdown: string;
  avgTradeDuration: number;
  createdAt?: string;
  updatedAt?: string;
  userId?: number;
}

// Risk metrics
export interface RiskMetrics {
  totalRiskExposure: number; // percentage
  maxRiskLimit: number; // percentage
  activePositions: number; // count
  maxPositions: number; // count
  currentDrawdown: number; // percentage
  maxDrawdownLimit: number; // percentage
  maxLeverage: number; // multiplier
  maxRiskPerTrade: number; // percentage
}

// Strategy interface
export interface Strategy {
  id: number;
  name: string;
  description: string;
  type: StrategyType;
  parameters: any; // JSON of parameters
  active: boolean;
  markets: string[]; // Array of markets to trade
  timeframes: string[]; // Array of timeframes to analyze
  createdAt?: string;
  updatedAt?: string;
  userId?: number;
}

// For account info
export interface AccountInfo {
  availableBalance: string;
  totalBalance: string;
  totalMarginBalance: string;
  totalPositionMargin: string;
  totalUnrealizedProfit: string;
  totalMaintenanceMargin: string;
}

// WebSocket message
export interface WSMessage {
  type: 'marketUpdate' | 'positionUpdate' | 'opportunityUpdate' | 'tradingStatus';
  data: any;
}
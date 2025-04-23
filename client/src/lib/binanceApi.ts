import { apiRequest } from "./queryClient";
import { MarketData, Candle, Position, ExecutionOrder } from "./types";

const API_BASE = "/api/binance";

/**
 * Fetches market data for all symbols or a specific symbol
 */
export async function getMarketData(symbol?: string): Promise<MarketData[]> {
  const response = await apiRequest("GET", `${API_BASE}/market${symbol ? `?symbol=${symbol}` : ""}`);
  return response.json();
}

/**
 * Fetches candles for a specific symbol and timeframe
 */
export async function getCandles(symbol: string, timeframe: string, limit: number = 100): Promise<Candle[]> {
  const response = await apiRequest(
    "GET", 
    `${API_BASE}/candles?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`
  );
  return response.json();
}

/**
 * Fetches current user positions
 */
export async function getPositions(): Promise<Position[]> {
  const response = await apiRequest("GET", `${API_BASE}/positions`);
  return response.json();
}

/**
 * Creates a new order
 */
export async function createOrder(order: ExecutionOrder): Promise<any> {
  const response = await apiRequest("POST", `${API_BASE}/order`, order);
  return response.json();
}

/**
 * Cancels an order by id
 */
export async function cancelOrder(symbol: string, orderId: string): Promise<any> {
  const response = await apiRequest(
    "DELETE", 
    `${API_BASE}/order?symbol=${symbol}&orderId=${orderId}`
  );
  return response.json();
}

/**
 * Sets leverage for a symbol
 */
export async function setLeverage(symbol: string, leverage: number): Promise<any> {
  const response = await apiRequest("POST", `${API_BASE}/leverage`, { symbol, leverage });
  return response.json();
}

/**
 * Gets account information including balance
 */
export async function getAccountInfo(): Promise<any> {
  const response = await apiRequest("GET", `${API_BASE}/account`);
  return response.json();
}

/**
 * Gets active trading opportunities
 */
export async function getTradingOpportunities(): Promise<any> {
  const response = await apiRequest("GET", `${API_BASE}/opportunities`);
  return response.json();
}

/**
 * Gets performance metrics
 */
export async function getPerformanceMetrics(): Promise<any> {
  const response = await apiRequest("GET", `${API_BASE}/performance`);
  return response.json();
}

/**
 * Gets risk metrics
 */
export async function getRiskMetrics(): Promise<any> {
  const response = await apiRequest("GET", `${API_BASE}/risk`);
  return response.json();
}

/**
 * Execute a trading opportunity
 */
export async function executeTradingOpportunity(opportunityId: string): Promise<any> {
  const response = await apiRequest("POST", `${API_BASE}/execute`, { opportunityId });
  return response.json();
}

/**
 * Close a position
 */
export async function closePosition(symbol: string, positionSide: 'LONG' | 'SHORT' | 'BOTH'): Promise<any> {
  const response = await apiRequest("POST", `${API_BASE}/close-position`, { symbol, positionSide });
  return response.json();
}

/**
 * Set take profit / stop loss for a position
 */
export async function setTPSL(
  symbol: string, 
  positionSide: 'LONG' | 'SHORT' | 'BOTH',
  stopPrice?: string,
  profitPrice?: string
): Promise<any> {
  const response = await apiRequest("POST", `${API_BASE}/tpsl`, { 
    symbol, 
    positionSide,
    stopPrice,
    profitPrice 
  });
  return response.json();
}

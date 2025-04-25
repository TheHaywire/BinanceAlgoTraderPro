import { apiRequest, apiMutations } from "./queryClient";
import { MarketData, Candle, Position, ExecutionOrder } from "./types";

const API_BASE = "/api/binance";

/**
 * Fetches market data for all symbols or a specific symbol
 */
export async function getMarketData(symbol?: string): Promise<MarketData[]> {
  const endpoint = `${API_BASE}/market${symbol ? `?symbol=${symbol}` : ""}`;
  const response = await apiRequest(endpoint, "GET");
  return response.json();
}

/**
 * Fetches candles for a specific symbol and timeframe
 */
export async function getCandles(symbol: string, timeframe: string, limit: number = 100): Promise<Candle[]> {
  const endpoint = `${API_BASE}/candles?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`;
  const response = await apiRequest(endpoint, "GET");
  return response.json();
}

/**
 * Fetches current user positions
 */
export async function getPositions(): Promise<Position[]> {
  const endpoint = `${API_BASE}/positions`;
  const response = await apiRequest(endpoint, "GET");
  return response.json();
}

/**
 * Creates a new order
 */
export async function createOrder(order: ExecutionOrder): Promise<any> {
  const endpoint = `${API_BASE}/order`;
  return apiMutations.post(endpoint, order);
}

/**
 * Cancels an order by id
 */
export async function cancelOrder(symbol: string, orderId: string): Promise<any> {
  const endpoint = `${API_BASE}/order?symbol=${symbol}&orderId=${orderId}`;
  return apiMutations.delete(endpoint);
}

/**
 * Sets leverage for a symbol
 */
export async function setLeverage(symbol: string, leverage: number): Promise<any> {
  const endpoint = `${API_BASE}/leverage`;
  return apiMutations.post(endpoint, { symbol, leverage });
}

/**
 * Gets account information including balance
 */
export async function getAccountInfo(): Promise<any> {
  const endpoint = `${API_BASE}/account`;
  const response = await apiRequest(endpoint, "GET");
  return response.json();
}

/**
 * Gets active trading opportunities
 */
export async function getTradingOpportunities(): Promise<any> {
  const endpoint = `${API_BASE}/opportunities`;
  const response = await apiRequest(endpoint, "GET");
  return response.json();
}

/**
 * Gets performance metrics
 */
export async function getPerformanceMetrics(): Promise<any> {
  const endpoint = `${API_BASE}/performance`;
  const response = await apiRequest(endpoint, "GET");
  return response.json();
}

/**
 * Gets risk metrics
 */
export async function getRiskMetrics(): Promise<any> {
  const endpoint = `${API_BASE}/risk`;
  const response = await apiRequest(endpoint, "GET");
  return response.json();
}

/**
 * Execute a trading opportunity
 */
export async function executeTradingOpportunity(opportunityId: string): Promise<any> {
  const endpoint = `${API_BASE}/execute`;
  console.log(`Executing opportunity: ${opportunityId} via ${endpoint}`);
  
  // Use apiMutations.post for better error handling and consistent API call format
  return apiMutations.post(endpoint, { opportunityId });
}

/**
 * Close a position
 */
export async function closePosition(symbol: string, positionSide: 'LONG' | 'SHORT' | 'BOTH'): Promise<any> {
  const endpoint = `${API_BASE}/close-position`;
  
  // Use apiMutations.post for better error handling and consistent API call format
  return apiMutations.post(endpoint, { symbol, positionSide });
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
  const endpoint = `${API_BASE}/tpsl`;
  
  // Use apiMutations.post for better error handling and consistent API call format
  return apiMutations.post(endpoint, { 
    symbol, 
    positionSide,
    stopPrice,
    profitPrice 
  });
}

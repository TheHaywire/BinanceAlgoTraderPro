import { apiRequest } from "./queryClient";
import { Strategy, PerformanceMetrics } from "./types";

const API_BASE = "/api/trading";

/**
 * Fetches all strategies 
 */
export async function getStrategies(): Promise<Strategy[]> {
  const endpoint = `${API_BASE}/strategies`;
  const response = await apiRequest(endpoint, "GET");
  return response.json();
}

/**
 * Fetches a specific strategy by ID
 */
export async function getStrategy(id: number): Promise<Strategy> {
  const endpoint = `${API_BASE}/strategies/${id}`;
  const response = await apiRequest(endpoint, "GET");
  return response.json();
}

/**
 * Creates a new strategy
 */
export async function createStrategy(strategy: {
  name: string;
  type: string;
  params: any;
  isActive: boolean;
}): Promise<Strategy> {
  const endpoint = `${API_BASE}/strategies`;
  const response = await apiRequest(endpoint, "POST", strategy);
  return response.json();
}

/**
 * Updates an existing strategy
 */
export async function updateStrategy(
  id: number,
  strategyUpdate: Partial<{
    name: string;
    type: string;
    params: any;
    isActive: boolean;
  }>
): Promise<Strategy> {
  const endpoint = `${API_BASE}/strategies/${id}`;
  const response = await apiRequest(endpoint, "PATCH", strategyUpdate);
  return response.json();
}

/**
 * Backtests a strategy
 */
export async function testStrategy(
  id: number,
  params: {
    symbol: string;
    timeframe: string;
    limit?: number;
  }
): Promise<any> {
  const endpoint = `${API_BASE}/strategies/${id}/test`;
  const response = await apiRequest(endpoint, "POST", params);
  return response.json();
}

/**
 * Gets performance metrics
 */
export async function getDbPerformanceMetrics(): Promise<PerformanceMetrics> {
  const endpoint = `${API_BASE}/performance`;
  const response = await apiRequest(endpoint, "GET");
  return response.json();
}

/**
 * Creates or updates performance metrics
 */
export async function updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): Promise<PerformanceMetrics> {
  const endpoint = `${API_BASE}/performance`;
  const response = await apiRequest(endpoint, "POST", metrics);
  return response.json();
}
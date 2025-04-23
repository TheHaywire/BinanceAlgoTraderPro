import { apiRequest } from "./queryClient";
import { Strategy, PerformanceMetrics } from "./types";

const API_BASE = "/api/trading";

/**
 * Fetches all strategies 
 */
export async function getStrategies(): Promise<Strategy[]> {
  const response = await apiRequest("GET", `${API_BASE}/strategies`);
  return response.json();
}

/**
 * Fetches a specific strategy by ID
 */
export async function getStrategy(id: number): Promise<Strategy> {
  const response = await apiRequest("GET", `${API_BASE}/strategies/${id}`);
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
  const response = await apiRequest("POST", `${API_BASE}/strategies`, strategy);
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
  const response = await apiRequest("PATCH", `${API_BASE}/strategies/${id}`, strategyUpdate);
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
  const response = await apiRequest("POST", `${API_BASE}/strategies/${id}/test`, params);
  return response.json();
}

/**
 * Gets performance metrics
 */
export async function getDbPerformanceMetrics(): Promise<PerformanceMetrics> {
  const response = await apiRequest("GET", `${API_BASE}/performance`);
  return response.json();
}

/**
 * Creates or updates performance metrics
 */
export async function updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): Promise<PerformanceMetrics> {
  const response = await apiRequest("POST", `${API_BASE}/performance`, metrics);
  return response.json();
}
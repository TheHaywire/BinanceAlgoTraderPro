import { useQuery } from "@tanstack/react-query";
import { PerformanceMetrics, RiskMetrics, StrategyPerformance } from "@/lib/types";
import { getPerformanceMetrics, getRiskMetrics } from "@/lib/binanceApi";

export function usePerformanceMetrics() {
  const { 
    data: metrics,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/binance/performance'],
    staleTime: 60000, // 1 minute
  });

  // Ensure we always have a metrics object with default values
  const performanceMetrics: PerformanceMetrics = metrics || {
    portfolioValue: "0",
    portfolioChangePercent: "0",
    dailyPnL: "0",
    dailyPnLPercent: "0",
    weeklyPnL: "0",
    weeklyPnLPercent: "0",
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    avgProfit: "0",
    avgLoss: "0",
    maxDrawdown: "0%",
    sharpeRatio: "0",
    sortino: "0"
  };

  const strategyPerformance: StrategyPerformance[] = metrics?.strategyPerformance || [];

  return {
    metrics: performanceMetrics,
    strategyPerformance,
    isLoading,
    error,
    refetch
  };
}

export function useRiskMetrics() {
  const { 
    data: metrics,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/binance/risk'],
    staleTime: 60000, // 1 minute
  });

  // Ensure we always have a metrics object with default values
  const riskMetrics: RiskMetrics = metrics || {
    totalRiskExposure: 0,
    maxRiskLimit: 30,
    currentDrawdown: "0%",
    maxDrawdownLimit: "-15%",
    maxPositionSize: "0",
    maxPositions: 10,
    currentPositions: 0,
    systemStatus: {
      api: true,
      execution: true,
      dataFeed: true
    }
  };

  return {
    metrics: riskMetrics,
    isLoading,
    error,
    refetch
  };
}

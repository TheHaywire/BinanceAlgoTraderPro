import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PerformanceMetrics } from "@/lib/types";
import * as tradingApi from "@/lib/tradingApi";

export function useDbPerformanceMetrics() {
  const { 
    data: metrics,
    isLoading,
    error,
    refetch
  } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/trading/performance'],
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

  return {
    metrics: performanceMetrics,
    isLoading,
    error,
    refetch
  };
}

export function useUpdatePerformanceMetrics() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (metrics: Partial<PerformanceMetrics>) => tradingApi.updatePerformanceMetrics(metrics),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading/performance'] });
    },
  });
}
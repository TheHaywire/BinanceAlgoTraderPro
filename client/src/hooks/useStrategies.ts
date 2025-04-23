import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Strategy } from "@/lib/types";
import * as tradingApi from "@/lib/tradingApi";

export function useStrategies() {
  const { 
    data: strategies = [],
    isLoading,
    error,
    refetch
  } = useQuery<Strategy[]>({
    queryKey: ['/api/trading/strategies'],
  });

  return {
    strategies,
    isLoading,
    error,
    refetch
  };
}

export function useStrategy(id: number) {
  const { 
    data: strategy,
    isLoading,
    error,
    refetch
  } = useQuery<Strategy>({
    queryKey: ['/api/trading/strategies', id],
    enabled: !!id,
  });

  return {
    strategy,
    isLoading,
    error,
    refetch
  };
}

export function useCreateStrategy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (strategy: {
      name: string;
      type: string;
      params: any;
      isActive: boolean;
    }) => tradingApi.createStrategy(strategy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading/strategies'] });
    },
  });
}

export function useUpdateStrategy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      id,
      strategy
    }: {
      id: number;
      strategy: Partial<{
        name: string;
        type: string;
        params: any;
        isActive: boolean;
      }>;
    }) => tradingApi.updateStrategy(id, strategy),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading/strategies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/strategies', variables.id] });
    },
  });
}

export function useTestStrategy() {
  return useMutation({
    mutationFn: ({
      id,
      params
    }: {
      id: number;
      params: {
        symbol: string;
        timeframe: string;
        limit?: number;
      };
    }) => tradingApi.testStrategy(id, params),
  });
}
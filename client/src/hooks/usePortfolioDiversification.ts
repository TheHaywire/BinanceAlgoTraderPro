import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
}

export interface VolatilityItem {
  symbol: string;
  volatility: number;
}

export interface CorrelationPair {
  symbolA: string;
  symbolB: string;
  correlation: number;
}

export interface SectorExposure {
  sector: string;
  exposure: number;
}

export interface AllocationRecommendation {
  symbol: string;
  currentAllocation: number;
  recommendedAllocation: number;
}

export interface PortfolioDiversificationRecommendations {
  overexposedSectors: SectorExposure[];
  highCorrelationPairs: CorrelationPair[];
  recommendedAllocations: AllocationRecommendation[];
  diversificationScore: number;
}

export function usePortfolioDiversification() {
  // Fetch correlation matrix data
  const { 
    data: correlationData, 
    isLoading: correlationLoading, 
    refetch: refetchCorrelation 
  } = useQuery<CorrelationMatrix>({
    queryKey: ["/api/portfolio/correlation"],
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch volatility data
  const { 
    data: volatilityData, 
    isLoading: volatilityLoading, 
    refetch: refetchVolatility 
  } = useQuery<VolatilityItem[]>({
    queryKey: ["/api/portfolio/volatility"],
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch recommendations
  const { 
    data: recommendationsData, 
    isLoading: recommendationsLoading, 
    refetch: refetchRecommendations 
  } = useQuery<PortfolioDiversificationRecommendations>({
    queryKey: ["/api/portfolio/recommendations"],
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Handler for manual update
  const updateAnalysis = async () => {
    try {
      await fetch("/api/portfolio/update", {
        method: "POST",
      });
      // Refetch all data
      await refetchCorrelation();
      await refetchVolatility();
      await refetchRecommendations();
      return true;
    } catch (error) {
      console.error("Error updating portfolio analysis data:", error);
      return false;
    }
  };

  return {
    correlation: {
      data: correlationData,
      isLoading: correlationLoading,
      refetch: refetchCorrelation
    },
    volatility: {
      data: volatilityData,
      isLoading: volatilityLoading,
      refetch: refetchVolatility
    },
    recommendations: {
      data: recommendationsData,
      isLoading: recommendationsLoading,
      refetch: refetchRecommendations
    },
    updateAnalysis,
    isLoading: correlationLoading || volatilityLoading || recommendationsLoading
  };
}
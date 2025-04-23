import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TradingOpportunity } from "@/lib/types";
import { getTradingOpportunities } from "@/lib/binanceApi";
import { 
  createWebSocketConnection, 
  subscribeToOpportunityUpdates 
} from "@/lib/websocket";

export function useOpportunities() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [realtimeOpportunities, setRealtimeOpportunities] = useState<TradingOpportunity[] | null>(null);

  // Fetch initial opportunities
  const { 
    data: opportunities = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/binance/opportunities'],
    staleTime: 30000, // 30 seconds
  });

  // Connect to WebSocket
  useEffect(() => {
    const ws = createWebSocketConnection();
    setSocket(ws);

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Subscribe to opportunity updates
  useEffect(() => {
    if (!socket) return;

    const unsubscribe = subscribeToOpportunityUpdates(socket, (data) => {
      setRealtimeOpportunities(data);
    });

    return unsubscribe;
  }, [socket]);

  // Use real-time data if available, otherwise use fetched data
  const currentOpportunities = realtimeOpportunities || opportunities;

  return {
    opportunities: currentOpportunities,
    isLoading,
    error,
    refetch
  };
}

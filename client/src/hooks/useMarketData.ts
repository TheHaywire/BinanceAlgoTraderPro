import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MarketData, Candle } from "@/lib/types";
import { getMarketData, getCandles } from "@/lib/binanceApi";
import { 
  createWebSocketConnection, 
  subscribeToMarketUpdates 
} from "@/lib/websocket";

export function useMarketData(symbol?: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [realtimeData, setRealtimeData] = useState<MarketData | null>(null);

  // Fetch initial market data
  const { 
    data: marketData = [],
    isLoading: isLoadingMarketData,
    error: marketDataError,
    refetch: refetchMarketData
  } = useQuery({
    queryKey: [`/api/binance/market${symbol ? `?symbol=${symbol}` : ""}`],
    staleTime: 30000, // 30 seconds
  });

  // Connect to WebSocket for real-time data
  useEffect(() => {
    const ws = createWebSocketConnection();
    setSocket(ws);

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Subscribe to market updates
  useEffect(() => {
    if (!socket) return;

    const symbols = symbol ? [symbol] : [];
    const unsubscribe = subscribeToMarketUpdates(socket, symbols, (data) => {
      setRealtimeData(data);
    });

    return unsubscribe;
  }, [socket, symbol]);

  // Combine initial data with real-time updates
  const currentMarketData = realtimeData || 
    (symbol && marketData.length > 0 
      ? marketData.find(item => item.symbol === symbol) 
      : null);

  return {
    marketData,
    currentMarketData,
    isLoading: isLoadingMarketData,
    error: marketDataError,
    refetch: refetchMarketData
  };
}

export function useCandles(symbol: string, timeframe: string, limit: number = 100) {
  const {
    data: candles = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/binance/candles?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`],
    staleTime: 60000, // 1 minute
  });

  return { candles, isLoading, error, refetch };
}

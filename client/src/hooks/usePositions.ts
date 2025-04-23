import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Position } from "@/lib/types";
import { getPositions } from "@/lib/binanceApi";
import { 
  createWebSocketConnection, 
  subscribeToPositionUpdates 
} from "@/lib/websocket";

export function usePositions() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [realtimePositions, setRealtimePositions] = useState<Position[] | null>(null);

  // Fetch initial positions
  const { 
    data: positions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/binance/positions'],
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

  // Subscribe to position updates
  useEffect(() => {
    if (!socket) return;

    const unsubscribe = subscribeToPositionUpdates(socket, (data) => {
      setRealtimePositions(data);
    });

    return unsubscribe;
  }, [socket]);

  // Use real-time data if available, otherwise use fetched data
  const currentPositions = realtimePositions || positions;

  return {
    positions: currentPositions,
    isLoading,
    error,
    refetch
  };
}

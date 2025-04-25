import { TradingOpportunity, Position, StrategyType, WSMessage } from "./types";

// Custom events for WebSocket status
const emitWsEvent = (eventName: string, detail = {}) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

export function createWebSocketConnection(): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  const socket = new WebSocket(wsUrl);
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // 2 seconds initial delay
  
  socket.onopen = () => {
    console.log("WebSocket connection established");
    reconnectAttempts = 0;
    emitWsEvent('ws:connected');
  };
  
  socket.onclose = (event) => {
    console.warn(`WebSocket closed: ${event.code} ${event.reason}`);
    
    // Auto-reconnect logic
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = reconnectDelay * reconnectAttempts;
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
      
      emitWsEvent('ws:reconnecting', { attempt: reconnectAttempts, maxAttempts: maxReconnectAttempts });
      
      setTimeout(() => {
        createWebSocketConnection();
      }, delay);
    } else {
      emitWsEvent('ws:disconnected', { permanent: true });
    }
  };
  
  socket.onmessage = () => {
    // Emit a general message received event for heartbeat monitoring
    emitWsEvent('ws:message_received');
  };
  
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    emitWsEvent('ws:error', { error });
  };
  
  return socket;
}

export function subscribeToMarketUpdates(
  socket: WebSocket, 
  symbols: string[] = [], 
  onMessage: (data: any) => void
): () => void {
  
  const handleMessage = (event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);
      
      if (message.type === 'marketUpdate' && 
          (symbols.length === 0 || symbols.includes(message.data.symbol))) {
        onMessage(message.data);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
  
  socket.addEventListener('message', handleMessage);
  
  // Subscribe to market updates
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'subscribe',
      channel: 'market',
      symbols: symbols.length > 0 ? symbols : undefined
    }));
  }
  
  // Return unsubscribe function
  return () => {
    socket.removeEventListener('message', handleMessage);
    
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'unsubscribe',
        channel: 'market',
        symbols: symbols.length > 0 ? symbols : undefined
      }));
    }
  };
}

export function subscribeToPositionUpdates(
  socket: WebSocket,
  onMessage: (data: any) => void
): () => void {
  
  const handleMessage = (event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);
      
      if (message.type === 'positionUpdate') {
        onMessage(message.data);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
  
  socket.addEventListener('message', handleMessage);
  
  // Subscribe to position updates
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'subscribe',
      channel: 'position'
    }));
  }
  
  // Return unsubscribe function
  return () => {
    socket.removeEventListener('message', handleMessage);
    
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'unsubscribe',
        channel: 'position'
      }));
    }
  };
}

export function subscribeToOpportunityUpdates(
  socket: WebSocket,
  onMessage: (data: any) => void
): () => void {
  
  const handleMessage = (event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);
      
      if (message.type === 'opportunityUpdate') {
        onMessage(message.data);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
  
  socket.addEventListener('message', handleMessage);
  
  // Subscribe to opportunity updates
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'subscribe',
      channel: 'opportunity'
    }));
  }
  
  // Return unsubscribe function
  return () => {
    socket.removeEventListener('message', handleMessage);
    
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'unsubscribe',
        channel: 'opportunity'
      }));
    }
  };
}

export interface TradingStatus {
  autoTradingEnabled: boolean;
  lastScanTime: number;
  opportunities?: TradingOpportunity[];
  positions?: Position[];
  regimes?: Array<{
    symbol: string;
    timeframe: string;
    regime: string;
  }>;
}

export function subscribeToTradingStatus(
  socket: WebSocket,
  onMessage: (data: TradingStatus) => void
): () => void {
  
  const handleMessage = (event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);
      
      if (message.type === 'tradingStatus') {
        onMessage(message.data as TradingStatus);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
  
  socket.addEventListener('message', handleMessage);
  
  // Subscribe to trading status updates
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'subscribe',
      channel: 'trading'
    }));
  }
  
  // Return unsubscribe function
  return () => {
    socket.removeEventListener('message', handleMessage);
    
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'unsubscribe',
        channel: 'trading'
      }));
    }
  };
}

// Command functions to control the trading system
export function sendTradingCommand(
  socket: WebSocket,
  command: 'enableAutoTrading' | 'scanMarket' | 'executeOpportunity',
  params: any = {}
): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'command',
      command,
      ...params
    }));
  } else {
    console.error('WebSocket is not connected');
  }
}

import { TradingOpportunity, Position, StrategyType, WSMessage } from "./types";

// WebSocket keepalive state
let lastMessageTime = Date.now();
let heartbeatInterval: number | null = null;
let reconnectTimeout: number | null = null;
let wsInstance: WebSocket | null = null;
let pendingSubscriptions: { type: string; channel: string; data?: any }[] = [];

// Custom events for WebSocket status
const emitWsEvent = (eventName: string, detail = {}) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

/**
 * WebSocket connection state singleton
 * Manages a single WebSocket connection with advanced reconnect logic
 */
export function createWebSocketConnection(): WebSocket {
  // If we already have a socket connection and it's open, return it
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    return wsInstance;
  }
  
  // If there's a pending reconnection, clear it
  if (reconnectTimeout) {
    window.clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  const socket = new WebSocket(wsUrl);
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10; // Increased reconnection attempts
  const baseReconnectDelay = 1000; // 1 second base delay
  const maxReconnectDelay = 30000; // Maximum delay of 30 seconds
  
  // Start at connected state until we're proven wrong
  emitWsEvent('ws:connecting');
  
  socket.onopen = () => {
    console.log("WebSocket connection established");
    reconnectAttempts = 0;
    lastMessageTime = Date.now();
    wsInstance = socket;
    emitWsEvent('ws:connected');
    
    // Resubscribe to any pending subscriptions
    if (pendingSubscriptions.length > 0) {
      console.log(`Resubscribing to ${pendingSubscriptions.length} channels...`);
      pendingSubscriptions.forEach(sub => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(sub));
        }
      });
    }
    
    // Set up heartbeat check to detect stale connections
    if (heartbeatInterval) {
      window.clearInterval(heartbeatInterval);
    }
    
    heartbeatInterval = window.setInterval(() => {
      const now = Date.now();
      const timeSinceLastMessage = now - lastMessageTime;
      
      // If no message received for more than 30 seconds, consider connection stale
      if (timeSinceLastMessage > 30000) {
        console.warn(`No WebSocket messages received for ${Math.floor(timeSinceLastMessage / 1000)}s, connection may be stale`);
        emitWsEvent('ws:stale', { lastMessageTime });
        
        // Send a ping to check if connection is still alive
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping', timestamp: now }));
        }
        
        // If extremely stale (over 2 minutes), force close and reconnect
        if (timeSinceLastMessage > 120000) {
          console.error("Connection extremely stale, forcing reconnection");
          socket.close();
        }
      }
    }, 10000); // Check every 10 seconds
  };
  
  socket.onclose = (event) => {
    console.warn(`WebSocket closed: ${event.code} ${event.reason}`);
    
    // Clean up heartbeat interval
    if (heartbeatInterval) {
      window.clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    
    // Implement exponential backoff for reconnections
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      // Exponential backoff with jitter to prevent thundering herd
      const exponentialDelay = Math.min(
        maxReconnectDelay, 
        baseReconnectDelay * Math.pow(1.5, reconnectAttempts - 1)
      );
      const jitter = 0.1 * exponentialDelay * Math.random();
      const delay = Math.floor(exponentialDelay + jitter);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
      emitWsEvent('ws:reconnecting', { 
        attempt: reconnectAttempts, 
        maxAttempts: maxReconnectAttempts,
        delay 
      });
      
      // Schedule reconnect
      reconnectTimeout = window.setTimeout(() => {
        reconnectTimeout = null;
        wsInstance = null;
        createWebSocketConnection();
      }, delay);
    } else {
      console.error(`WebSocket reconnection failed after ${maxReconnectAttempts} attempts`);
      emitWsEvent('ws:disconnected', { permanent: true });
    }
  };
  
  socket.onmessage = (event) => {
    // Update last message timestamp
    lastMessageTime = Date.now();
    
    // Process message
    try {
      const message = JSON.parse(event.data);
      
      // Handle heartbeat responses
      if (message.type === 'heartbeat') {
        // Silently acknowledge heartbeat
        emitWsEvent('ws:heartbeat', { timestamp: message.timestamp });
        return;
      }
      
      // Handle pong response
      if (message.type === 'pong') {
        console.log('Server responded to ping, connection alive');
        return;
      }
      
      // Handle system status messages
      if (message.type === 'systemStatus') {
        emitWsEvent('ws:system_status', message);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
    
    // Emit a general message received event for monitoring
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

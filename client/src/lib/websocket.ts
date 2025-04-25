import { TradingOpportunity, Position, StrategyType, WSMessage } from "./types";

// WebSocket connection state manager
let lastMessageTime = Date.now();
let lastPingTime = Date.now();
let heartbeatInterval: number | null = null;
let reconnectTimeout: number | null = null;
let pingTimeout: number | null = null;
let wsInstance: WebSocket | null = null;
let pendingSubscriptions: { type: string; channel: string; data?: any }[] = [];
let connectionAttempts = 0;
let connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting' = 'disconnected';
let isReconnecting = false;
let lastUpdateTime = Date.now();

// Connection Status interface
export interface ConnectionStatus {
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  lastUpdateTime: number;
  isReconnecting: boolean;
  reconnectAttempts: number;
}

// Get current WebSocket connection status
export function getConnectionStatus(): ConnectionStatus {
  return {
    status: connectionStatus,
    lastUpdateTime: lastUpdateTime,
    isReconnecting,
    reconnectAttempts: connectionAttempts
  };
}

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
  
  // Construct a stable WebSocket URL with proper path handling for Replit
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  // Ensure the path is correctly formatted for the Replit environment
  const wsUrl = `${protocol}//${host}/ws`;
  
  console.log(`Creating WebSocket connection to ${wsUrl}`);
  
  try {
    const socket = new WebSocket(wsUrl);
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 20; // Increased reconnection attempts
    const baseReconnectDelay = 1000; // 1 second base delay
    const maxReconnectDelay = 30000; // Maximum delay of 30 seconds
    
    // Start at connecting state
    emitWsEvent('ws:connecting');
    
    socket.onopen = () => {
      console.log("WebSocket connection established");
      
      // Reset connection tracking variables
      reconnectAttempts = 0;
      connectionAttempts = 0;
      isReconnecting = false;
      lastMessageTime = Date.now();
      lastPingTime = Date.now();
      lastUpdateTime = Date.now();
      connectionStatus = 'connected';
      wsInstance = socket;
      
      // Emit event that connection is established
      emitWsEvent('ws:open');
      
      // Immediately send an initial ping to verify connection is working both ways
      try {
        socket.send(JSON.stringify({ 
          type: 'ping', 
          timestamp: Date.now(),
          clientId: Math.random().toString(36).substring(2, 10) // Include a client identifier
        }));
      } catch (error) {
        console.error("Error sending initial ping:", error);
      }
      
      // Set up a ping timeout to verify we get a response
      if (pingTimeout) {
        clearTimeout(pingTimeout);
      }
      
      pingTimeout = window.setTimeout(() => {
        // If we haven't received any message after initial ping, connection might be half-open
        if (Date.now() - lastMessageTime > 5000) {
          console.warn("No response received after initial connection, server might not be responding");
          
          // Try one more ping
          try {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ 
                type: 'ping', 
                timestamp: Date.now(),
                retry: true
              }));
            }
          } catch (error) {
            console.error("Error sending verification ping:", error);
          }
        }
      }, 5000);
      
      // Resubscribe to any pending subscriptions with a slight delay
      // to ensure the connection is stable
      if (pendingSubscriptions.length > 0) {
        setTimeout(() => {
          if (socket.readyState === WebSocket.OPEN) {
            console.log(`Resubscribing to ${pendingSubscriptions.length} channels...`);
            
            // Clone and clear the pending subscriptions
            const subscriptionsToResend = [...pendingSubscriptions];
            pendingSubscriptions = [];
            
            // Resend each subscription
            subscriptionsToResend.forEach(sub => {
              try {
                socket.send(JSON.stringify(sub));
                console.log(`Resubscribed to: ${sub.channel}`);
              } catch (error) {
                console.error(`Failed to resubscribe to ${sub.channel}:`, error);
                // Put back in pending if failed
                pendingSubscriptions.push(sub);
              }
            });
          }
        }, 500);
      }
      
      // Set up heartbeat check to detect stale connections
      if (heartbeatInterval) {
        window.clearInterval(heartbeatInterval);
      }
      
      heartbeatInterval = window.setInterval(() => {
        const now = Date.now();
        const timeSinceLastMessage = now - lastMessageTime;
        
        // If no message received for more than 20 seconds, consider connection stale
        if (timeSinceLastMessage > 20000) {
          console.warn(`No WebSocket messages received for ${Math.floor(timeSinceLastMessage / 1000)}s, connection may be stale`);
          emitWsEvent('ws:stale', { lastMessageTime });
          
          // Send a ping to check if connection is still alive
          if (socket.readyState === WebSocket.OPEN) {
            try {
              socket.send(JSON.stringify({ type: 'ping', timestamp: now }));
            } catch (error) {
              console.error("Error sending ping:", error);
            }
          }
          
          // If extremely stale (over 1 minute), force close and reconnect
          if (timeSinceLastMessage > 60000) {
            console.error("Connection extremely stale, forcing reconnection");
            try {
              socket.close(1000, "Connection stale, forcing reconnect");
            } catch (error) {
              console.error("Error closing stale connection:", error);
              // Reset connection anyway
              wsInstance = null;
              createWebSocketConnection();
            }
          }
        }
      }, 5000); // Check every 5 seconds
    };
    
    socket.onclose = (event) => {
      console.warn(`WebSocket closed: ${event.code} ${event.reason || ''}`);
      connectionStatus = 'disconnected';
      lastUpdateTime = Date.now();
      
      // Special handling for code 1006 (abnormal closure) which happens frequently in Replit
      const isAbnormalClosure = event.code === 1006;
      
      // Clean up heartbeat interval
      if (heartbeatInterval) {
        window.clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      
      // Clear instance reference
      if (wsInstance === socket) {
        wsInstance = null;
      }
      
      // For abnormal closures (code 1006), use faster reconnection with less backoff
      const currentMaxAttempts = isAbnormalClosure 
        ? Math.max(30, maxReconnectAttempts) // More attempts for abnormal closures
        : maxReconnectAttempts;
      
      // Implement improved exponential backoff for reconnections
      if (reconnectAttempts < currentMaxAttempts) {
        reconnectAttempts++;
        
        // For abnormal closures, use faster reconnect initially
        let exponentialDelay;
        if (isAbnormalClosure && reconnectAttempts <= 3) {
          // Use very short delay for first few attempts with abnormal closures
          exponentialDelay = baseReconnectDelay;
        } else {
          // Standard exponential backoff with less aggressive growth
          exponentialDelay = Math.min(
            maxReconnectDelay, 
            baseReconnectDelay * Math.pow(1.3, reconnectAttempts - 1)
          );
        }
        
        // Add jitter to prevent reconnection thundering herd
        const jitter = 0.1 * exponentialDelay * Math.random();
        const delay = Math.floor(exponentialDelay + jitter);
        
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${currentMaxAttempts})`);
        connectionStatus = 'reconnecting';
        isReconnecting = true;
        lastUpdateTime = Date.now();
        emitWsEvent('ws:reconnecting', { 
          attempt: reconnectAttempts, 
          maxAttempts: currentMaxAttempts,
          delay,
          abnormalClosure: isAbnormalClosure
        });
        
        // Schedule reconnect with delay
        reconnectTimeout = window.setTimeout(() => {
          reconnectTimeout = null;
          // Try a fresh connection by clearing any old state
          createWebSocketConnection();
        }, delay);
      } else {
        console.error(`WebSocket reconnection failed after ${reconnectAttempts} attempts`);
        emitWsEvent('ws:disconnected', { permanent: true });
        
        // Last resort: try again after a longer delay
        reconnectTimeout = window.setTimeout(() => {
          reconnectAttempts = 0;
          // Force page refresh if we've been trying for a very long time
          if (isAbnormalClosure && Math.random() < 0.1) {
            // In 10% of cases, suggest a page reload to the user via an event
            emitWsEvent('ws:suggest_reload', {
              message: "Connection issues detected. Please reload the page for better performance."
            });
          }
          createWebSocketConnection();
        }, 30000); // Wait 30 seconds before trying again
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
        
        // Handle marketUpdate messages specifically
        if (message.type === 'marketUpdate') {
          emitWsEvent('ws:market_update', message.data);
        }
        
        // Handle positionUpdate messages specifically
        if (message.type === 'positionUpdate') {
          emitWsEvent('ws:position_update', message.data);
        }
        
        // Handle opportunityUpdate messages specifically
        if (message.type === 'opportunityUpdate') {
          emitWsEvent('ws:opportunity_update', message.data);
        }
        
        // Handle system_logs messages specifically
        if (message.type === 'system_logs') {
          emitWsEvent('system_logs', message.data);
        }
        
        // Handle system_log (individual log) messages
        if (message.type === 'system_log') {
          emitWsEvent('system_log', message.data);
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
      
      // Close the connection on error to trigger the reconnect logic
      try {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close(1006, "Connection error, triggering reconnect");
        }
      } catch (err) {
        console.error("Error closing socket after error:", err);
        // Force reset the connection state
        wsInstance = null;
        // Schedule a reconnection
        if (!reconnectTimeout) {
          reconnectTimeout = window.setTimeout(() => {
            reconnectTimeout = null;
            createWebSocketConnection();
          }, 2000);
        }
      }
    };
    
    return socket;
  } catch (error) {
    console.error("Error creating WebSocket:", error);
    
    // Schedule a retry
    reconnectTimeout = window.setTimeout(() => {
      reconnectTimeout = null;
      connectionAttempts++;
      if (connectionAttempts < 10) {
        createWebSocketConnection();
      } else {
        console.error("Failed to create WebSocket after multiple attempts");
        emitWsEvent('ws:failed', { error });
      }
    }, 2000);
    
    // Return a dummy WebSocket object that will queue messages until real connection
    const dummySocket = {
      readyState: WebSocket.CONNECTING,
      send: (data: string) => {
        console.log("Queuing message for when connection is established:", data);
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'subscribe') {
            pendingSubscriptions.push(parsed);
          }
        } catch (err) {
          console.error("Error parsing queued message:", err);
        }
      },
      close: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
      CONNECTING: WebSocket.CONNECTING,
      OPEN: WebSocket.OPEN,
      CLOSING: WebSocket.CLOSING,
      CLOSED: WebSocket.CLOSED,
      url: wsUrl,
      bufferedAmount: 0,
      extensions: "",
      protocol: "",
      binaryType: "blob" as BinaryType,
    };
    
    return dummySocket as unknown as WebSocket;
  }
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

// Event handlers registry for custom events
const eventHandlers: Record<string, Array<(data: any) => void>> = {};

/**
 * Subscribe to a specific WebSocket channel
 */
export function subscribe(channel: string): void {
  const socket = createWebSocketConnection();
  
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'subscribe',
      channel
    }));
  } else {
    // If socket is not open yet, add to pending subscriptions
    const pendingSubscription = {
      type: 'subscribe',
      channel
    };
    pendingSubscriptions.push(pendingSubscription);
  }
}

/**
 * Unsubscribe from a specific WebSocket channel
 */
export function unsubscribe(channel: string): void {
  const socket = createWebSocketConnection();
  
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'unsubscribe',
      channel
    }));
  }
  
  // Also remove from pending if it's there
  const index = pendingSubscriptions.findIndex(sub => 
    sub.type === 'subscribe' && sub.channel === channel
  );
  
  if (index > -1) {
    pendingSubscriptions.splice(index, 1);
  }
}

// Flag to track if we've already set up the global message listener
let globalMessageListenerSetup = false;

/**
 * Set up the global message listener only once
 */
function setupGlobalMessageListener() {
  if (!globalMessageListenerSetup) {
    window.addEventListener('ws:message', ((event: Event) => {
      const customEvent = event as CustomEvent;
      const message = customEvent.detail;
      
      if (message && message.type && eventHandlers[message.type]) {
        eventHandlers[message.type].forEach(handler => handler(message.data));
      }
    }) as EventListener);
    
    globalMessageListenerSetup = true;
  }
}

/**
 * Register a handler for a specific event type
 */
export function registerHandler(eventType: string, handler: (data: any) => void): void {
  if (!eventHandlers[eventType]) {
    eventHandlers[eventType] = [];
  }
  
  eventHandlers[eventType].push(handler);
  
  // Make sure we have the global listener set up
  setupGlobalMessageListener();
}

/**
 * Unregister a handler for a specific event type
 */
export function unregisterHandler(eventType: string, handler: (data: any) => void): void {
  if (eventHandlers[eventType]) {
    const index = eventHandlers[eventType].indexOf(handler);
    if (index > -1) {
      eventHandlers[eventType].splice(index, 1);
    }
  }
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

import { useState, useEffect, useCallback } from 'react';

export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'stale';

interface ConnectionStatus {
  state: ConnectionState;
  lastActivity: number;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
  timeSinceLastMessage: number;
}

/**
 * Hook for tracking WebSocket connection status and health
 * Listens for WebSocket events and provides real-time connection status information
 */
export function useConnectionStatus(): ConnectionStatus {
  const [state, setState] = useState<ConnectionState>('connecting');
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  const [maxReconnectAttempts, setMaxReconnectAttempts] = useState<number>(10);
  const [timeSinceLastMessage, setTimeSinceLastMessage] = useState<number>(0);

  // Update time since last message received
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      setTimeSinceLastMessage(elapsed);
      
      // Auto-update status based on activity
      if (state === 'connected' && elapsed > 30000) {
        setState('stale');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastActivity, state]);

  // Listen for WebSocket status events
  useEffect(() => {
    const handleConnected = () => {
      setState('connected');
      setLastActivity(Date.now());
      setReconnectAttempt(0);
    };
    
    const handleConnecting = () => {
      setState('connecting');
    };
    
    const handleReconnecting = (e: CustomEvent) => {
      setState('reconnecting');
      if (e.detail) {
        setReconnectAttempt(e.detail.attempt || 1);
        setMaxReconnectAttempts(e.detail.maxAttempts || 10);
      }
    };
    
    const handleDisconnected = () => {
      setState('disconnected');
    };
    
    const handleMessageReceived = () => {
      setLastActivity(Date.now());
      if (state === 'stale') {
        setState('connected');
      }
    };
    
    const handleError = () => {
      // Only change state if we're not already in a more severe state
      if (state === 'connected' || state === 'stale') {
        setState('stale');
      }
    };
    
    // Custom event listeners for WebSocket status updates
    window.addEventListener('ws:connected', handleConnected);
    window.addEventListener('ws:connecting', handleConnecting);
    window.addEventListener('ws:reconnecting', handleReconnecting as EventListener);
    window.addEventListener('ws:disconnected', handleDisconnected);
    window.addEventListener('ws:message_received', handleMessageReceived);
    window.addEventListener('ws:error', handleError);
    window.addEventListener('ws:stale', handleError);
    
    return () => {
      window.removeEventListener('ws:connected', handleConnected);
      window.removeEventListener('ws:connecting', handleConnecting);
      window.removeEventListener('ws:reconnecting', handleReconnecting as EventListener);
      window.removeEventListener('ws:disconnected', handleDisconnected);
      window.removeEventListener('ws:message_received', handleMessageReceived);
      window.removeEventListener('ws:error', handleError);
      window.removeEventListener('ws:stale', handleError);
    };
  }, [state]);

  // Trigger manual ping to check connection
  const pingServer = useCallback(() => {
    try {
      const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        setTimeout(() => socket.close(), 2000); // Close after 2 seconds if no response
      };
    } catch (error) {
      console.error('Failed to ping server:', error);
    }
  }, []);

  return {
    state,
    lastActivity,
    reconnectAttempt,
    maxReconnectAttempts,
    timeSinceLastMessage
  };
}
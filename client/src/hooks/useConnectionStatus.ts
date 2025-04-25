import { useState, useEffect } from 'react';

export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'stale';

interface ConnectionStatus {
  state: ConnectionState;
  lastActivity: number;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
  timeSinceLastMessage: number;
}

const STALE_THRESHOLD = 15000; // 15 seconds
const DISCONNECT_THRESHOLD = 30000; // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Hook for tracking WebSocket connection status and health
 * Listens for WebSocket events and provides real-time connection status information
 */
export function useConnectionStatus(): ConnectionStatus {
  const [state, setState] = useState<ConnectionState>('connecting');
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  const [timeSinceLastMessage, setTimeSinceLastMessage] = useState<number>(0);
  
  useEffect(() => {
    // Event listener for custom connection state events
    const handleOpen = () => {
      setState('connected');
      setLastActivity(Date.now());
      setReconnectAttempt(0);
    };
    
    const handleClose = () => {
      setState('disconnected');
      setLastActivity(Date.now());
    };
    
    const handleConnecting = () => {
      setState('connecting');
      setLastActivity(Date.now());
    };
    
    const handleReconnecting = (e: CustomEvent) => {
      setState('reconnecting');
      setLastActivity(Date.now());
      if (e.detail && e.detail.attempt) {
        setReconnectAttempt(e.detail.attempt);
      }
    };
    
    const handleMessage = () => {
      if (state !== 'connected') {
        setState('connected');
      }
      setLastActivity(Date.now());
    };
    
    // Setup timer to check connection staleness
    const intervalId = setInterval(() => {
      const now = Date.now();
      const timeSince = now - lastActivity;
      setTimeSinceLastMessage(timeSince);
      
      // Auto-detect stale or disconnected state
      if (state === 'connected' && timeSince > STALE_THRESHOLD) {
        setState('stale');
      }
      
      if ((state === 'connected' || state === 'stale') && timeSince > DISCONNECT_THRESHOLD) {
        setState('disconnected');
      }
    }, 1000);
    
    // Listen for custom WebSocket connection events
    window.addEventListener('ws:open', handleOpen);
    window.addEventListener('ws:close', handleClose);
    window.addEventListener('ws:connecting', handleConnecting);
    window.addEventListener('ws:reconnecting', handleReconnecting as EventListener);
    window.addEventListener('ws:message', handleMessage);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('ws:open', handleOpen);
      window.removeEventListener('ws:close', handleClose);
      window.removeEventListener('ws:connecting', handleConnecting);
      window.removeEventListener('ws:reconnecting', handleReconnecting as EventListener);
      window.removeEventListener('ws:message', handleMessage);
      clearInterval(intervalId);
    };
  }, [state, lastActivity]);
  
  return {
    state,
    lastActivity,
    reconnectAttempt,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    timeSinceLastMessage,
  };
}
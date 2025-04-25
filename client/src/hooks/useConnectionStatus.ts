import { useState, useEffect } from 'react';
import { getConnectionStatus } from '@/lib/websocket';

/**
 * Enhanced hook for tracking WebSocket connection status and health
 * Maps the raw WebSocket connection status to our application status format
 * Provides real-time connection status information
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'reconnecting'>('connecting');
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  
  useEffect(() => {
    // Function to synchronize state with global WebSocket status
    const syncStatus = () => {
      const connectionStatus = getConnectionStatus();
      setStatus(connectionStatus.status);
      setLastUpdateTime(connectionStatus.lastUpdateTime);
      setReconnectAttempts(connectionStatus.reconnectAttempts);
      setIsReconnecting(connectionStatus.isReconnecting);
    };
    
    // Initial sync
    syncStatus();
    
    // Event listeners for connection state changes
    const handleOpen = () => syncStatus();
    const handleClose = () => syncStatus();
    const handleConnecting = () => syncStatus();
    const handleReconnecting = () => syncStatus();
    const handleMessage = () => syncStatus();
    
    // Timer to periodically check connection status
    const intervalId = setInterval(syncStatus, 1000);
    
    // Listen for WebSocket events
    window.addEventListener('ws:open', handleOpen);
    window.addEventListener('ws:close', handleClose);
    window.addEventListener('ws:connecting', handleConnecting);
    window.addEventListener('ws:reconnecting', handleReconnecting);
    window.addEventListener('ws:message', handleMessage);
    window.addEventListener('ws:message_received', handleMessage);
    window.addEventListener('ws:heartbeat', handleMessage);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('ws:open', handleOpen);
      window.removeEventListener('ws:close', handleClose);
      window.removeEventListener('ws:connecting', handleConnecting);
      window.removeEventListener('ws:reconnecting', handleReconnecting);
      window.removeEventListener('ws:message', handleMessage);
      window.removeEventListener('ws:message_received', handleMessage);
      window.removeEventListener('ws:heartbeat', handleMessage);
      clearInterval(intervalId);
    };
  }, []);
  
  return {
    status,
    lastUpdateTime,
    reconnectAttempts,
    isReconnecting
  };
}
import { useState, useEffect } from "react";

// Status types
export type ConnectionStatus = "healthy" | "warning" | "error" | "connecting";

// Last price update time threshold (in milliseconds)
const STALE_THRESHOLD = 15000; // 15 seconds
const WARNING_THRESHOLD = 30000; // 30 seconds

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  
  // Function to check websocket health based on last update time
  const checkHealth = () => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;
    
    if (timeSinceLastUpdate < STALE_THRESHOLD) {
      setStatus("healthy");
    } else if (timeSinceLastUpdate < WARNING_THRESHOLD) {
      setStatus("warning");
    } else {
      setStatus("error");
    }
  };
  
  // Update last message time when we receive any websocket message
  useEffect(() => {
    const handleWebSocketMessage = () => {
      setLastUpdateTime(Date.now());
      setStatus("healthy");
    };
    
    // Listen for custom event that will be dispatched when we receive a websocket message
    window.addEventListener("ws:message_received", handleWebSocketMessage);
    
    // Set up health check interval
    const healthCheckInterval = setInterval(checkHealth, 5000);
    
    return () => {
      window.removeEventListener("ws:message_received", handleWebSocketMessage);
      clearInterval(healthCheckInterval);
    };
  }, [lastUpdateTime]);
  
  // Notify of websocket reconnection attempts
  useEffect(() => {
    const handleReconnect = () => {
      setStatus("connecting");
    };
    
    window.addEventListener("ws:reconnecting", handleReconnect);
    
    return () => {
      window.removeEventListener("ws:reconnecting", handleReconnect);
    };
  }, []);
  
  return {
    status,
    lastUpdateTime,
    isHealthy: status === "healthy",
    isWarning: status === "warning",
    isError: status === "error",
    isConnecting: status === "connecting"
  };
}
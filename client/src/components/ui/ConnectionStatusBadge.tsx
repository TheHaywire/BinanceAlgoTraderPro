import React, { useState, useEffect } from "react";
import { getConnectionStatus } from "@/lib/websocket";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

/**
 * Enhanced connection status badge with animation and detailed tooltip
 */
export const ConnectionStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'reconnecting'>('connecting');
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("");

  useEffect(() => {
    // Update connection status from WebSocket state
    const updateStatus = () => {
      const connStatus = getConnectionStatus();
      setStatus(connStatus.status);
      setLastUpdated(connStatus.lastUpdateTime);
      setReconnectAttempts(connStatus.reconnectAttempts);
    };

    // Set initial status
    updateStatus();

    // Listen for WebSocket state changes
    const handleWSChange = () => updateStatus();
    window.addEventListener('ws:open', handleWSChange);
    window.addEventListener('ws:reconnecting', handleWSChange);
    window.addEventListener('ws:disconnected', handleWSChange);
    window.addEventListener('ws:connecting', handleWSChange);
    window.addEventListener('ws:system_status', handleWSChange);

    // Update the time since last update periodically
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
      if (seconds < 60) {
        setTimeSinceUpdate(`${seconds}s ago`);
      } else if (seconds < 3600) {
        setTimeSinceUpdate(`${Math.floor(seconds / 60)}m ago`);
      } else {
        setTimeSinceUpdate(`${Math.floor(seconds / 3600)}h ago`);
      }
    }, 1000);

    // Cleanup
    return () => {
      window.removeEventListener('ws:open', handleWSChange);
      window.removeEventListener('ws:reconnecting', handleWSChange);
      window.removeEventListener('ws:disconnected', handleWSChange);
      window.removeEventListener('ws:connecting', handleWSChange);
      window.removeEventListener('ws:system_status', handleWSChange);
      clearInterval(interval);
    };
  }, [lastUpdated]);

  // Get color and text based on status
  const getStatusDetails = () => {
    switch (status) {
      case 'connected':
        return {
          color: "bg-[#00C897] border-[#00C897]/30",
          textColor: "text-[#00C897]",
          indicator: "bg-[#00C897] animate-pulse",
          text: "Connected",
          description: "Live connection to the trading server"
        };
      case 'connecting':
        return {
          color: "bg-[#FAD02C] border-[#FAD02C]/30",
          textColor: "text-[#FAD02C]",
          indicator: "bg-[#FAD02C] animate-ping opacity-75",
          text: "Connecting",
          description: "Establishing connection..."
        };
      case 'reconnecting':
        return {
          color: "bg-[#FF9900] border-[#FF9900]/30",
          textColor: "text-[#FF9900]",
          indicator: "bg-[#FF9900] animate-pulse opacity-75",
          text: "Reconnecting",
          description: `Attempt ${reconnectAttempts} - Restoring connection...`
        };
      case 'disconnected':
        return {
          color: "bg-[#FF3B69] border-[#FF3B69]/30",
          textColor: "text-[#FF3B69]",
          indicator: "bg-[#FF3B69] opacity-75",
          text: "Disconnected",
          description: "Connection lost to trading server"
        };
      default:
        return {
          color: "bg-[#6B7280] border-[#6B7280]/30",
          textColor: "text-[#6B7280]",
          indicator: "bg-[#6B7280] opacity-75",
          text: "Unknown",
          description: "Connection state unknown"
        };
    }
  };

  const { color, textColor, indicator, text, description } = getStatusDetails();

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <Badge 
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded 
                border ${color} ${status === 'connected' ? 'glow-badge-success' : status === 'disconnected' ? 'glow-badge-error' : ''}`}
            >
              <span className={`h-2 w-2 rounded-full ${indicator}`}></span>
              {text}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[rgba(24,29,49,0.95)] border border-[rgba(73,86,118,0.25)] p-2 rounded shadow-lg">
          <div className="p-1 text-xs">
            <p className={`font-semibold ${textColor}`}>{text}</p>
            <p className="text-[rgba(255,255,255,0.7)] mt-1">{description}</p>
            <p className="text-[rgba(255,255,255,0.5)] mt-2 text-[10px]">Updated {timeSinceUpdate}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionStatusBadge;
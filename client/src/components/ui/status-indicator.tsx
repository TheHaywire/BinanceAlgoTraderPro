import React from 'react';
import { useConnectionStatus, ConnectionState } from '../../hooks/useConnectionStatus';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { cn } from '../../lib/utils';
import { AlertTriangle, CheckCircle, RefreshCw, WifiOff, Activity } from 'lucide-react';

const StatusColors: Record<ConnectionState, string> = {
  'connected': 'bg-green-500',
  'connecting': 'bg-yellow-500',
  'reconnecting': 'bg-yellow-500',
  'disconnected': 'bg-red-500',
  'stale': 'bg-orange-500'
};

const StatusIcons: Record<ConnectionState, React.ReactNode> = {
  'connected': <CheckCircle className="h-4 w-4 text-green-500" />,
  'connecting': <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />,
  'reconnecting': <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />,
  'disconnected': <WifiOff className="h-4 w-4 text-red-500" />,
  'stale': <AlertTriangle className="h-4 w-4 text-orange-500" />
};

const StatusLabels: Record<ConnectionState, string> = {
  'connected': 'Connected',
  'connecting': 'Connecting',
  'reconnecting': 'Reconnecting',
  'disconnected': 'Disconnected',
  'stale': 'Connection stale'
};

interface StatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  showIcon?: boolean;
  showDot?: boolean;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusIndicator({
  className,
  showLabel = true,
  showIcon = true,
  showDot = true,
  tooltipPlacement = 'top',
  size = 'md'
}: StatusIndicatorProps) {
  const { state, lastActivity, reconnectAttempt, maxReconnectAttempts, timeSinceLastMessage } = useConnectionStatus();
  
  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3'
  };
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };
  
  const tooltipContent = (
    <div className="flex flex-col gap-1 p-1">
      <div className="font-semibold">Status: {StatusLabels[state]}</div>
      <div className="text-xs">Last activity: {new Date(lastActivity).toLocaleTimeString()}</div>
      <div className="text-xs">Time since last message: {formatTime(timeSinceLastMessage)}</div>
      {state === 'reconnecting' && (
        <div className="text-xs">Reconnect attempt: {reconnectAttempt} of {maxReconnectAttempts}</div>
      )}
    </div>
  );
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1.5", className)}>
            {showDot && (
              <div 
                className={cn(
                  "rounded-full animate-pulse", 
                  StatusColors[state],
                  dotSizes[size]
                )} 
              />
            )}
            {showIcon && StatusIcons[state]}
            {showLabel && (
              <span className={cn("font-medium", textSizes[size])}>
                {StatusLabels[state]}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side={tooltipPlacement} className="bg-background border-border">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, X, AlertCircle, AlertTriangle, Info, Download } from 'lucide-react';
import * as ws from '@/lib/websocket';

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  data?: any;
}

// Define badge colors for different log levels
const logLevelColors = {
  info: 'bg-blue-500',
  warn: 'bg-amber-500',
  error: 'bg-red-500',
  debug: 'bg-slate-500'
};

// Define badge colors for different sources
const sourceColors = {
  system: 'bg-purple-500',
  trading: 'bg-green-500',
  websocket: 'bg-cyan-500',
  binance: 'bg-amber-500',
  http: 'bg-blue-500',
  default: 'bg-slate-500'
};

const iconMap = {
  info: <Info className="h-4 w-4" />,
  warn: <AlertTriangle className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
  debug: <Info className="h-4 w-4" />
};

interface LogViewerProps {
  className?: string;
  maxEntries?: number;
}

export default function LogViewer({ className, maxEntries = 500 }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch logs from API
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/system/logs'],
    refetchInterval: 0, // We'll use WebSocket for real-time updates
  });

  // Subscribe to log updates via WebSocket
  useEffect(() => {
    // Initial subscription to logs
    ws.subscribe('system_logs');

    // Handle incoming logs
    const handleLogUpdate = (message: any) => {
      if (message.type === 'system_log') {
        setLogs(prevLogs => {
          // Avoid duplicates by checking IDs
          if (!prevLogs.some(log => log.id === message.data.id)) {
            const newLogs = [message.data, ...prevLogs];
            // Keep only maxEntries logs
            return newLogs.slice(0, maxEntries);
          }
          return prevLogs;
        });
      }
    };

    // Register message handler
    ws.registerHandler('system_log', handleLogUpdate);

    // Initial data load
    if (data) {
      setLogs(data);
    }

    // Cleanup
    return () => {
      ws.unsubscribe('system_logs');
      ws.unregisterHandler('system_log', handleLogUpdate);
    };
  }, [data, maxEntries]);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  // Handle clear logs
  const handleClearLogs = async () => {
    try {
      const response = await fetch('/api/system/logs/clear', {
        method: 'POST',
      });
      
      if (response.ok) {
        setLogs([]);
        toast({
          title: 'Logs cleared',
          description: 'All system logs have been cleared.',
        });
      } else {
        throw new Error('Failed to clear logs');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear logs.',
        variant: 'destructive',
      });
    }
  };

  // Filter logs based on activeFilter
  const filteredLogs = logs.filter(log => {
    if (activeFilter === 'all') return true;
    return log.level === activeFilter || log.source === activeFilter;
  });

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  // Export logs to file
  const exportLogs = () => {
    const logData = JSON.stringify(logs, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algotrader-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">System Logs</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => refetch()}
            title="Refresh logs"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={exportLogs}
            title="Export logs"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleClearLogs}
            title="Clear all logs"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="all" className="w-full">
          <div className="border-b px-6">
            <TabsList className="flex justify-start">
              <TabsTrigger 
                value="all" 
                onClick={() => setActiveFilter('all')}
                className="relative"
              >
                All
                <Badge className="ml-2 bg-slate-500">{logs.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="info" 
                onClick={() => setActiveFilter('info')}
                className="relative"
              >
                Info
                <Badge className="ml-2 bg-blue-500">
                  {logs.filter(log => log.level === 'info').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="warn" 
                onClick={() => setActiveFilter('warn')}
                className="relative"
              >
                Warnings
                <Badge className="ml-2 bg-amber-500">
                  {logs.filter(log => log.level === 'warn').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="error" 
                onClick={() => setActiveFilter('error')}
                className="relative"
              >
                Errors
                <Badge className="ml-2 bg-red-500">
                  {logs.filter(log => log.level === 'error').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="debug" 
                onClick={() => setActiveFilter('debug')}
                className="relative"
              >
                Debug
                <Badge className="ml-2 bg-slate-500">
                  {logs.filter(log => log.level === 'debug').length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="m-0">
            <ScrollArea 
              className="h-[400px] px-4" 
              ref={scrollAreaRef}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="flex items-center justify-center h-full text-red-500">
                  Error loading logs. Please try again.
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No logs to display.
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  {filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="border rounded p-2 text-sm hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-1 ${logLevelColors[log.level]}`}>
                            {iconMap[log.level]}
                          </span>
                          <span className="font-medium">{formatTimestamp(log.timestamp)}</span>
                        </div>
                        
                        <Badge 
                          className={`${logLevelColors[log.level]} ml-2`}
                          variant="secondary"
                        >
                          {log.level}
                        </Badge>
                        
                        {log.source && (
                          <Badge 
                            className={sourceColors[log.source as keyof typeof sourceColors] || sourceColors.default}
                            variant="secondary"
                          >
                            {log.source}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="ml-6">
                        <p>{log.message}</p>
                        {log.data && (
                          <pre className="mt-1 text-xs bg-accent/50 p-1 rounded overflow-x-auto">
                            {typeof log.data === 'object' 
                              ? JSON.stringify(log.data, null, 2)
                              : log.data.toString()}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          {/* Duplicate TabsContent for each tab just with different value */}
          <TabsContent value="info" className="m-0">
            <ScrollArea className="h-[400px] px-4" ref={scrollAreaRef}>
              {/* Same content as "all" tab */}
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No logs to display.
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  {filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="border rounded p-2 text-sm hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-1 ${logLevelColors[log.level]}`}>
                            {iconMap[log.level]}
                          </span>
                          <span className="font-medium">{formatTimestamp(log.timestamp)}</span>
                        </div>
                        
                        <Badge 
                          className={`${logLevelColors[log.level]} ml-2`}
                          variant="secondary"
                        >
                          {log.level}
                        </Badge>
                        
                        {log.source && (
                          <Badge 
                            className={sourceColors[log.source as keyof typeof sourceColors] || sourceColors.default}
                            variant="secondary"
                          >
                            {log.source}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="ml-6">
                        <p>{log.message}</p>
                        {log.data && (
                          <pre className="mt-1 text-xs bg-accent/50 p-1 rounded overflow-x-auto">
                            {typeof log.data === 'object' 
                              ? JSON.stringify(log.data, null, 2)
                              : log.data.toString()}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Repeat for other tabs */}
          <TabsContent value="warn" className="m-0">
            <ScrollArea className="h-[400px] px-4" ref={scrollAreaRef}>
              {/* Same content structure */}
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No logs to display.
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  {filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="border rounded p-2 text-sm hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-1 ${logLevelColors[log.level]}`}>
                            {iconMap[log.level]}
                          </span>
                          <span className="font-medium">{formatTimestamp(log.timestamp)}</span>
                        </div>
                        
                        <Badge 
                          className={`${logLevelColors[log.level]} ml-2`}
                          variant="secondary"
                        >
                          {log.level}
                        </Badge>
                        
                        {log.source && (
                          <Badge 
                            className={sourceColors[log.source as keyof typeof sourceColors] || sourceColors.default}
                            variant="secondary"
                          >
                            {log.source}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="ml-6">
                        <p>{log.message}</p>
                        {log.data && (
                          <pre className="mt-1 text-xs bg-accent/50 p-1 rounded overflow-x-auto">
                            {typeof log.data === 'object' 
                              ? JSON.stringify(log.data, null, 2)
                              : log.data.toString()}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="error" className="m-0">
            <ScrollArea className="h-[400px] px-4" ref={scrollAreaRef}>
              {/* Same content structure */}
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No logs to display.
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  {filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="border rounded p-2 text-sm hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-1 ${logLevelColors[log.level]}`}>
                            {iconMap[log.level]}
                          </span>
                          <span className="font-medium">{formatTimestamp(log.timestamp)}</span>
                        </div>
                        
                        <Badge 
                          className={`${logLevelColors[log.level]} ml-2`}
                          variant="secondary"
                        >
                          {log.level}
                        </Badge>
                        
                        {log.source && (
                          <Badge 
                            className={sourceColors[log.source as keyof typeof sourceColors] || sourceColors.default}
                            variant="secondary"
                          >
                            {log.source}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="ml-6">
                        <p>{log.message}</p>
                        {log.data && (
                          <pre className="mt-1 text-xs bg-accent/50 p-1 rounded overflow-x-auto">
                            {typeof log.data === 'object' 
                              ? JSON.stringify(log.data, null, 2)
                              : log.data.toString()}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="debug" className="m-0">
            <ScrollArea className="h-[400px] px-4" ref={scrollAreaRef}>
              {/* Same content structure */}
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No logs to display.
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  {filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="border rounded p-2 text-sm hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-1 ${logLevelColors[log.level]}`}>
                            {iconMap[log.level]}
                          </span>
                          <span className="font-medium">{formatTimestamp(log.timestamp)}</span>
                        </div>
                        
                        <Badge 
                          className={`${logLevelColors[log.level]} ml-2`}
                          variant="secondary"
                        >
                          {log.level}
                        </Badge>
                        
                        {log.source && (
                          <Badge 
                            className={sourceColors[log.source as keyof typeof sourceColors] || sourceColors.default}
                            variant="secondary"
                          >
                            {log.source}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="ml-6">
                        <p>{log.message}</p>
                        {log.data && (
                          <pre className="mt-1 text-xs bg-accent/50 p-1 rounded overflow-x-auto">
                            {typeof log.data === 'object' 
                              ? JSON.stringify(log.data, null, 2)
                              : log.data.toString()}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
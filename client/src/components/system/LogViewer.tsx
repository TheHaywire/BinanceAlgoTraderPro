import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Log entry interface
interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  data?: any;
}

interface LogViewerProps {
  className?: string;
  maxEntries?: number;
}

export default function LogViewer({ className, maxEntries = 500 }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Fetch initial logs
  useEffect(() => {
    fetch('/api/system/logs')
      .then(response => response.json())
      .then(data => {
        setLogs(data.logs || []);
      })
      .catch(error => {
        console.error("Failed to fetch logs:", error);
      });
  }, []);
  
  // Setup WebSocket subscription for real-time logs
  useEffect(() => {
    const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);
    
    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'system_logs'
      }));
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle system logs messages
        if (message.type === 'system_log') {
          if (!isPaused) {
            setLogs(prevLogs => {
              const newLogs = [...prevLogs, message.data];
              // Limit the number of logs to prevent memory issues
              return newLogs.slice(-maxEntries);
            });
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    return () => {
      socket.close();
    };
  }, [maxEntries, isPaused]);
  
  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollableElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableElement) {
        scrollableElement.scrollTop = scrollableElement.scrollHeight;
      }
    }
  }, [logs, autoScroll]);
  
  // Filter logs based on selected level
  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);
  
  // Clear logs
  const handleClearLogs = () => {
    setLogs([]);
    toast({
      title: "Logs Cleared",
      description: "All log entries have been cleared from the viewer",
    });
  };
  
  // Export logs
  const handleExportLogs = () => {
    const logText = logs.map(log => 
      `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.source ? `[${log.source}] ` : ''}${log.message}${log.data ? ' ' + JSON.stringify(log.data) : ''}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algotrader-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Logs Exported",
      description: "Log file has been downloaded to your device",
    });
  };
  
  return (
    <div className={`bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">System Logs</h3>
        <div className="flex space-x-2 items-center">
          <div className="flex items-center mr-4 space-x-2">
            <Switch 
              id="pause-logs" 
              checked={isPaused} 
              onCheckedChange={setIsPaused} 
            />
            <Label htmlFor="pause-logs" className="text-sm">{isPaused ? 'Paused' : 'Live'}</Label>
          </div>
          
          <div className="flex items-center mr-4 space-x-2">
            <Switch 
              id="auto-scroll" 
              checked={autoScroll} 
              onCheckedChange={setAutoScroll} 
            />
            <Label htmlFor="auto-scroll" className="text-sm">Auto-scroll</Label>
          </div>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warnings</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleClearLogs} className="h-8">
            Clear
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExportLogs} className="h-8">
            Export
          </Button>
        </div>
      </div>
      
      <div className="relative">
        <ScrollArea ref={scrollAreaRef} className="h-[400px] rounded-lg border border-[rgba(73,86,118,0.2)] bg-[rgba(10,15,28,0.4)]">
          <div className="p-2 space-y-1 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-neutral-400">
                No log entries to display
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex">
                  <div className="whitespace-nowrap text-neutral-400 mr-2">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  
                  <Badge className={`mr-2 ${
                    log.level === 'error' ? 'bg-[rgba(255,59,105,0.1)] text-[#FF3B69] border-[rgba(255,59,105,0.2)]' :
                    log.level === 'warn' ? 'bg-[rgba(255,187,0,0.1)] text-[#FFB800] border-[rgba(255,187,0,0.2)]' :
                    log.level === 'info' ? 'bg-[rgba(0,149,255,0.1)] text-[#0095FF] border-[rgba(0,149,255,0.2)]' :
                    'bg-[rgba(85,85,90,0.1)] text-neutral-400 border-[rgba(85,85,90,0.2)]'
                  }`}>
                    {log.level}
                  </Badge>
                  
                  {log.source && (
                    <div className="text-neutral-500 mr-2 truncate max-w-[100px]">
                      [{log.source}]
                    </div>
                  )}
                  
                  <div className="text-neutral-200 break-all">
                    {log.message}
                    {log.data && (
                      <span className="text-neutral-400 ml-1">
                        {typeof log.data === 'object' 
                          ? JSON.stringify(log.data) 
                          : log.data.toString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {isPaused && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-[rgba(255,187,0,0.1)] text-[#FFB800] border-[rgba(255,187,0,0.2)]">
              Logging Paused
            </Badge>
          </div>
        )}
        
        <div className="text-xs text-neutral-400 mt-2">
          Showing {filteredLogs.length} of {logs.length} log entries
        </div>
      </div>
    </div>
  );
}
import { Request, Response } from 'express';

// In-memory log storage (limited size)
const MAX_LOGS = 5000;
const systemLogs: any[] = [];

// Generate a unique ID for log entries
function generateLogId(): string {
  return Math.random().toString(36).substring(2, 10) + 
         Date.now().toString(36);
}

// Valid log levels
const logLevels = ['info', 'warn', 'error', 'debug'] as const;
type LogLevel = typeof logLevels[number];

// Add a log entry
export function addSystemLog(
  level: LogLevel,
  message: string,
  source?: string,
  data?: any
) {
  const logEntry = {
    id: generateLogId(),
    timestamp: Date.now(),
    level,
    message,
    source,
    data
  };
  
  systemLogs.push(logEntry);
  
  // Trim logs if they exceed the maximum number
  if (systemLogs.length > MAX_LOGS) {
    systemLogs.splice(0, systemLogs.length - MAX_LOGS);
  }
  
  // Broadcast to WebSocket clients
  return logEntry;
}

// Set up routes
export const setupLogRoutes = (app: any) => {
  // Get logs with optional filtering
  app.get('/api/system/logs', (req: Request, res: Response) => {
    try {
      // Apply filters from query parameters
      let filteredLogs = [...systemLogs];
      
      const level = req.query.level as LogLevel;
      if (level && logLevels.includes(level)) {
        filteredLogs = filteredLogs.filter(log => log.level === level);
      }
      
      const source = req.query.source as string;
      if (source) {
        filteredLogs = filteredLogs.filter(log => log.source === source);
      }
      
      // Get the most recent logs, limit by count
      const count = parseInt(req.query.count as string) || 1000;
      const recentLogs = filteredLogs.slice(-Math.min(count, MAX_LOGS));
      
      res.json({
        success: true,
        total: systemLogs.length,
        filtered: filteredLogs.length,
        logs: recentLogs
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch system logs'
      });
    }
  });
  
  // Clear logs
  app.post('/api/system/logs/clear', (req: Request, res: Response) => {
    try {
      // Clear all logs
      systemLogs.length = 0;
      
      // Add a log about clearing
      addSystemLog('info', 'System logs cleared', 'system');
      
      res.json({
        success: true,
        message: 'All logs have been cleared'
      });
    } catch (error) {
      console.error('Error clearing logs:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to clear system logs'
      });
    }
  });
  
  // Global logging middleware for API requests
  app.use((req: Request, res: Response, next: Function) => {
    // Record the start time
    const startTime = Date.now();
    
    // Save the original end method to wrap it
    const originalEnd = res.end;
    
    // Override the end method
    res.end = function(chunk?: any, encoding?: any) {
      // Calculate request duration
      const duration = Date.now() - startTime;
      
      // Log the request details
      if (!req.path.includes('/api/system/logs')) { // Avoid logging log requests
        addSystemLog(
          res.statusCode >= 400 ? 'error' : 'info',
          `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`,
          'api',
          { 
            method: req.method,
            path: req.path,
            query: req.query,
            status: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }
        );
      }
      
      // Call the original end method
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  });
};
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for system logs
const systemLogs: LogEntry[] = [];
const MAX_LOGS = 1000;

// Log levels
const logLevels = ['debug', 'info', 'warn', 'error'] as const;
type LogLevel = typeof logLevels[number];

// Log entry interface
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  source?: string;
  data?: any;
}

/**
 * Generate a unique log ID
 */
function generateLogId(): string {
  return uuidv4();
}

/**
 * Add a system log entry
 */
export function addSystemLog(
  level: LogLevel,
  message: string,
  source: string = 'system',
  data?: any
): LogEntry {
  // Create log entry
  const logEntry: LogEntry = {
    id: generateLogId(),
    timestamp: Date.now(),
    level,
    message,
    source,
    data
  };

  // Add to logs (maintain max size)
  systemLogs.unshift(logEntry);
  
  // Trim log size if needed
  if (systemLogs.length > MAX_LOGS) {
    systemLogs.splice(MAX_LOGS);
  }

  // For errors and warnings, also log to console
  if (level === 'error' || level === 'warn') {
    console[level](`[${source}] ${message}`, data || '');
  }

  return logEntry;
}

/**
 * Set up log routes
 */
export const setupLogRoutes = (app: any) => {
  // Get all logs with optional filtering
  app.get('/api/system/logs', (req: Request, res: Response) => {
    try {
      const { level, source, limit = '100', since } = req.query;
      let filteredLogs = [...systemLogs];
      
      // Filter by level
      if (level && logLevels.includes(level as LogLevel)) {
        filteredLogs = filteredLogs.filter(log => log.level === level);
      }
      
      // Filter by source
      if (source) {
        filteredLogs = filteredLogs.filter(log => log.source === source);
      }
      
      // Filter by timestamp
      if (since) {
        const sinceTimestamp = parseInt(since as string);
        if (!isNaN(sinceTimestamp)) {
          filteredLogs = filteredLogs.filter(log => log.timestamp > sinceTimestamp);
        }
      }
      
      // Apply limit
      const limitNum = parseInt(limit as string);
      if (!isNaN(limitNum) && limitNum > 0) {
        filteredLogs = filteredLogs.slice(0, limitNum);
      }
      
      res.json(filteredLogs);
    } catch (error) {
      console.error('Error retrieving logs:', error);
      res.status(500).json({ error: 'Error retrieving logs' });
    }
  });
  
  // Clear all logs
  app.post('/api/system/logs/clear', (req: Request, res: Response) => {
    try {
      systemLogs.length = 0;
      addSystemLog('info', 'System logs cleared', 'system');
      
      res.json({ success: true, message: 'Logs cleared' });
    } catch (error) {
      console.error('Error clearing logs:', error);
      res.status(500).json({ error: 'Error clearing logs' });
    }
  });
  
  // Add request logging middleware
  app.use((req: Request, res: Response, next: Function) => {
    // Only log API requests
    if (req.path.startsWith('/api/')) {
      const startTime = Date.now();
      
      // Log after response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // Only log requests that take more than 100ms or have error status
        if (duration > 100 || res.statusCode >= 400) {
          addSystemLog(
            res.statusCode >= 400 ? 'warn' : 'debug',
            `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`,
            'http'
          );
        }
      });
    }
    
    next();
  });
  
  // Initialize logs
  addSystemLog('info', 'Log system initialized', 'system');
  
  console.log('Log routes initialized');
};

// Export logs for testing
export const getLogs = () => systemLogs;
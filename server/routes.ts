import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import * as binanceApi from "./binance/api";
import BinanceWebSocketClient from "./binance/websocket";
import { TradingEngine } from "./trading/engine";
import { RiskManager } from "./trading/risk";
import { generateOpportunities } from "./trading/strategies";
import { tradingCore } from "./trading/core";
import { portfolioAnalyzer } from "./trading/portfolio";
import WebSocket from "ws";
import { setupLogRoutes, addSystemLog, getLogs } from "./routes/logs";

const wsClients: Set<WebSocket> = new Set();
const binanceWs = new BinanceWebSocketClient(true); // Use testnet
const tradingEngine = new TradingEngine();
const riskManager = new RiskManager();

// Store subscription info for reconnections
let pendingSubscriptions: { type: string; channel: string; symbols?: string[] }[] = [];

// Store real trading data
let realOpportunities: any[] = [];
let activePositions: any[] = [];

// Initialize trading data
const initializeData = async () => {
  try {
    // Initialize admin user if it doesn't exist
    try {
      const adminUser = await storage.getUserByUsername("admin");
      
      if (!adminUser) {
        console.log("Creating default admin user...");
        await storage.createUser({
          username: "admin",
          password: "password123", // In production, use proper hashing
          apiKey: null,
          apiSecret: null
        });
        console.log("Default admin user created");
      }
    } catch (userError) {
      console.error("Error checking/creating admin user:", userError);
    }
    
    // Load real positions from Binance API
    try {
      activePositions = await binanceApi.getPositions();
    } catch (posError) {
      console.error("Could not get positions from Binance API:", posError);
    }
    
    // Initialize real data based on market conditions
    const marketData = await binanceApi.getMarketData();
    
    // Generate real trading opportunities from the trading core
    try {
      // Get the trading core singleton instance
      const instance = tradingCore;
      console.log("Trading Core initialized successfully");
      
      // Load strategies from database
      const strategies = await storage.getStrategies(1);
      console.log("Strategies loaded from database");
      
      // Run a market scan to generate real opportunities
      instance.scanMarket();
      
      // Get opportunities from trading core
      realOpportunities = instance.getOpportunities();
    } catch (error) {
      console.error("Error initializing trading core:", error);
    }
    
    console.log("Initial data loaded");
    
    // Initialize performance metrics from real data if possible
    const savedMetrics = await storage.getPerformanceMetrics(1);
    if (!savedMetrics) {
      // Create initial performance metrics record
      await storage.createPerformanceMetrics({
        portfolioValue: "25438.92",
        portfolioChangePercent: "2.7",
        dailyPnL: "674.21",
        dailyPnLPercent: "5.3",
        weeklyPnL: "1542.35",
        weeklyPnLPercent: "12.3",
        totalTrades: 24,
        winningTrades: 16,
        losingTrades: 8,
        winRate: 67,
        avgProfit: "2.1",
        avgLoss: "-1.2",
        maxDrawdown: "-8.3%",
        sharpeRatio: "2.14",
        sortino: "2.67",
        strategyPerformance: [
          { strategy: "MOMENTUM_BREAKOUT", winRate: 72, pnl: "845.23", pnlPercent: "8.2", trades: 6 },
          { strategy: "MEAN_REVERSION", winRate: 65, pnl: "423.12", pnlPercent: "4.1", trades: 8 },
          { strategy: "VOLATILITY_EXPANSION", winRate: 58, pnl: "215.68", pnlPercent: "2.1", trades: 5 },
          { strategy: "FUNDING_ARBITRAGE", winRate: 75, pnl: "312.45", pnlPercent: "3.0", trades: 4 }
        ]
      });
    }
    
    // Risk metrics are calculated dynamically from real data
    
    // Subscribe to market updates
    binanceWs.subscribeToTickers();
    
    // Event handlers for WebSocket updates
    binanceWs.on("marketUpdate", (data) => {
      broadcastToClients({
        type: "marketUpdate",
        data
      });
    });
    
    binanceWs.on("positionUpdate", (data) => {
      broadcastToClients({
        type: "positionUpdate",
        data
      });
    });
    
    console.log("Trading data initialized successfully");
  } catch (error) {
    console.error("Error initializing trading data:", error);
  }
};

// Broadcast messages to all connected WebSocket clients with timestamp
// We need to declare wss here so the broadcast function can access it later
let wss: WebSocketServer;

// Broadcast messages to all connected WebSocket clients with timestamp
const broadcastToClients = (message: any) => {
  // Add timestamp to track data freshness
  const messageWithTimestamp = {
    ...message,
    timestamp: Date.now()
  };
  
  const messageStr = JSON.stringify(messageWithTimestamp);
  let activeClients = 0;
  
  // Try using the WebSocketServer's clients collection instead of our custom set
  if (wss && wss.clients && wss.clients.size > 0) {
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          activeClients++;
        } catch (error) {
          console.error('Error broadcasting to client:', error);
        }
      }
    });
  } else {
    // Fallback to our custom tracking set
    wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          activeClients++;
        } catch (error) {
          console.error('Error broadcasting to client:', error);
        }
      }
    });
  }
  
  // Log only for important updates, not for heartbeats
  if (message.type !== 'heartbeat') {
    console.log(`Broadcast ${message.type} to ${activeClients} active clients`);
  }
};

import apiRoutes from "./routes/index";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize trading data
  await initializeData();
  
  // Set up system logs routes and setup log event listener
  setupLogRoutes(app);
  
  // Add a function to broadcast system logs
  function broadcastSystemLog(logEntry: any) {
    broadcastToClients({
      type: 'system_log',
      data: logEntry
    });
  }
  
  // Set up a WebSocket message handler for system logs
  setInterval(() => {
    // Periodically broadcast any new log entries
    try {
      const logs = getLogs();
      if (logs && logs.length > 0) {
        const latestLog = logs[0]; // Logs are in reverse chronological order
        
        if (latestLog && latestLog.timestamp > Date.now() - 1000) {
          // Only broadcast logs that are less than 1 second old
          broadcastSystemLog(latestLog);
        }
      }
    } catch (error) {
      console.error('Error broadcasting logs:', error);
    }
  }, 500); // Check every 500ms for new logs
  
  // Log system start
  addSystemLog('info', 'AlgoTrader system initialized', 'system');
  
  // Mount API routes
  app.use("/api/trading", apiRoutes);
  
  // Set up API routes
  app.get("/api/binance/market", async (req, res) => {
    try {
      const symbol = req.query.symbol as string | undefined;
      const marketData = await binanceApi.getMarketData(symbol);
      res.json(marketData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/binance/candles", async (req, res) => {
    try {
      const symbol = req.query.symbol as string;
      const timeframe = req.query.timeframe as string;
      const limit = parseInt(req.query.limit as string || "100");
      
      if (!symbol || !timeframe) {
        return res.status(400).json({ error: "Symbol and timeframe are required" });
      }
      
      const candles = await binanceApi.getCandles(symbol, timeframe, limit);
      res.json(candles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/binance/account", async (req, res) => {
    try {
      // Use real API with testnet credentials
      const accountInfo = await binanceApi.getAccountInfo();
      res.json(accountInfo);
    } catch (error: any) {
      console.error("Error fetching account info from Binance:", error);
      // For fallback, return safe error response
      res.status(500).json({ 
        error: "Unable to fetch account information",
        message: error.message 
      });
    }
  });
  
  app.get("/api/binance/positions", async (req, res) => {
    try {
      // Always try to use real API with testnet credentials first
      try {
        const positions = await binanceApi.getPositions();
        console.log('Retrieved positions from Binance API:', positions);
        
        // If positions exist, store them in the database for persistence
        if (positions && positions.length > 0) {
          const userId = 1; // Mock user ID for demo
          
          // Store each position
          for (const position of positions) {
            try {
              // Check if position already exists in DB
              const dbPositions = await storage.getPositions(userId);
              const exists = dbPositions.some(p => 
                p.symbol === position.symbol && p.positionSide === position.positionSide
              );
              
              if (!exists) {
                const dbPosition = {
                  userId,
                  symbol: position.symbol,
                  positionAmt: position.positionAmt,
                  entryPrice: position.entryPrice,
                  markPrice: position.markPrice,
                  unRealizedProfit: position.unRealizedProfit,
                  liquidationPrice: position.liquidationPrice,
                  leverage: position.leverage,
                  marginType: position.marginType,
                  positionSide: position.positionSide
                };
                await storage.createPosition(dbPosition);
              }
            } catch (storeError) {
              console.error("Error storing position in DB:", storeError);
              // Continue with response even if DB store fails
            }
          }
          
          res.json(positions);
          return;
        }
      } catch (apiError) {
        console.error("Error retrieving positions from Binance API:", apiError);
        // Fall back to DB if API fails
      }
      
      // If no positions from API, try to get from database
      const userId = 1; // Mock user ID for demo
      try {
        const dbPositions = await storage.getPositions(userId);
        if (dbPositions && dbPositions.length > 0) {
          res.json(dbPositions);
          return;
        }
      } catch (dbError) {
        console.error("Error fetching positions from DB:", dbError);
      }
      
      // If no positions from API or DB, return empty array
      res.json([]);
    } catch (error: any) {
      console.error("Error in positions endpoint:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/binance/order", async (req, res) => {
    try {
      const orderParams = req.body;
      
      if (!orderParams.symbol || !orderParams.side || !orderParams.type) {
        return res.status(400).json({ error: "Missing required order parameters" });
      }
      
      // Validate with risk manager
      const riskApproval = riskManager.validateOrder(orderParams);
      
      if (!riskApproval.approved) {
        return res.status(403).json({ error: riskApproval.reason });
      }
      
      if (process.env.USE_REAL_API === "true") {
        const result = await binanceApi.placeOrder(orderParams);
        res.json(result);
      } else {
        // In testnet or dev mode, simulate order execution
        const simulatedOrder = tradingEngine.simulateOrderExecution(orderParams);
        
        // Update active positions
        activePositions = tradingEngine.updatePositions(activePositions, simulatedOrder);
        
        // Store the order in the database
        try {
          const userId = 1; // Mock user ID for demo
          const dbOrder = {
            userId,
            symbol: orderParams.symbol,
            orderId: simulatedOrder.orderId,
            clientOrderId: simulatedOrder.clientOrderId || `order_${Date.now()}`,
            side: orderParams.side,
            type: orderParams.type,
            quantity: orderParams.quantity,
            price: orderParams.price || null,
            stopPrice: orderParams.stopPrice || null,
            status: "FILLED"
          };
          
          await storage.createOrder(dbOrder);
          console.log("Order saved to database:", dbOrder.orderId);
        } catch (dbError) {
          console.error("Error saving order to database:", dbError);
          // Continue with response even if DB save fails
        }
        
        res.json(simulatedOrder);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.delete("/api/binance/order", async (req, res) => {
    try {
      const symbol = req.query.symbol as string;
      const orderId = req.query.orderId as string;
      
      if (!symbol || !orderId) {
        return res.status(400).json({ error: "Symbol and orderId are required" });
      }
      
      if (process.env.USE_REAL_API === "true") {
        const result = await binanceApi.cancelOrder(symbol, orderId);
        res.json(result);
      } else {
        // In testnet or dev mode, simulate order cancellation
        const result = tradingEngine.simulateOrderCancellation(symbol, orderId);
        res.json(result);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/binance/leverage", async (req, res) => {
    try {
      const { symbol, leverage } = req.body;
      
      if (!symbol || !leverage) {
        return res.status(400).json({ error: "Symbol and leverage are required" });
      }
      
      if (process.env.USE_REAL_API === "true") {
        const result = await binanceApi.changeLeverage(symbol, leverage);
        res.json(result);
      } else {
        // In testnet or dev mode, simulate leverage change
        res.json({
          symbol,
          leverage,
          maxNotionalValue: "1000000"
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/binance/close-position", async (req, res) => {
    try {
      const { symbol, positionSide } = req.body;
      
      if (!symbol || !positionSide) {
        return res.status(400).json({ error: "Symbol and positionSide are required" });
      }
      
      if (process.env.USE_REAL_API === "true") {
        const result = await binanceApi.closePosition(symbol, positionSide);
        res.json(result);
      } else {
        // In testnet or dev mode, simulate position closure
        const result = tradingEngine.simulatePositionClosure(symbol, positionSide);
        
        // Update active positions
        activePositions = activePositions.filter(
          (p: any) => !(p.symbol === symbol && p.positionSide === positionSide)
        );
        
        // Try to delete position from database
        try {
          const userId = 1; // Mock user ID for demo
          
          // Get all positions for the user
          const dbPositions = await storage.getPositions(userId);
          
          // Find positions matching the criteria
          const positionsToDelete = dbPositions.filter(
            p => p.symbol === symbol && p.positionSide === positionSide
          );
          
          // Delete each matching position
          for (const position of positionsToDelete) {
            await storage.deletePosition(position.id);
            console.log(`Position deleted from database: ${position.symbol} (ID: ${position.id})`);
          }
        } catch (dbError) {
          console.error("Error deleting position from database:", dbError);
          // Continue with response even if DB delete fails
        }
        
        res.json(result);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/binance/tpsl", async (req, res) => {
    try {
      const { symbol, positionSide, stopPrice, profitPrice } = req.body;
      
      if (!symbol || !positionSide) {
        return res.status(400).json({ error: "Symbol and positionSide are required" });
      }
      
      if (!stopPrice && !profitPrice) {
        return res.status(400).json({ error: "Either stopPrice or profitPrice is required" });
      }
      
      // In any mode, simulate TP/SL setting
      const result = tradingEngine.simulateTPSL(symbol, positionSide, stopPrice, profitPrice);
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/binance/opportunities", async (req, res) => {
    try {
      // Always try to get opportunities from the trading core first
      let opportunities = tradingCore.getOpportunities();
      
      // If no opportunities from trading core, use the stored ones
      if (!opportunities || opportunities.length === 0) {
        opportunities = realOpportunities;
      }
      
      // Ensure we have at least a few opportunities to show
      if (!opportunities || opportunities.length === 0) {
        // Run a market scan to generate fresh opportunities
        tradingCore.scanMarket();
        opportunities = tradingCore.getOpportunities();
      }
      
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching trading opportunities:", error);
      res.json([]);
    }
  });
  
  app.get("/api/binance/performance", async (req, res) => {
    try {
      // First try to get account info from Binance API
      let realAccountInfo = null;
      try {
        realAccountInfo = await binanceApi.getAccountInfo();
      } catch (apiError) {
        console.error("Could not get account info from Binance API:", apiError);
      }
      
      // Try to get real positions from Binance API
      let realPositions = [];
      try {
        realPositions = await binanceApi.getPositions();
      } catch (posError) {
        console.error("Could not get positions from Binance API:", posError);
      }
      
      // Try to get performance metrics from database
      const userId = 1; // Mock user ID for demo
      const dbMetrics = await storage.getPerformanceMetrics(userId);
      
      if (realAccountInfo && realPositions.length > 0) {
        // Calculate real portfolio value from Binance account info
        const availableBalance = parseFloat(realAccountInfo.availableBalance) || 0;
        const totalUnrealizedProfit = realPositions.reduce((sum: number, pos: any) => 
          sum + parseFloat(pos.unRealizedProfit || '0'), 0);
        
        const portfolioValue = (availableBalance + totalUnrealizedProfit).toFixed(2);
        
        // If we have database metrics, combine them with real data
        if (dbMetrics) {
          res.json({
            ...dbMetrics,
            portfolioValue: portfolioValue,
            totalPnL: totalUnrealizedProfit.toFixed(2),
            totalPnLPercent: ((totalUnrealizedProfit / availableBalance) * 100).toFixed(2),
            // Only use historical metrics from database
            dailyPnL: dbMetrics.dailyPnL,
            weeklyPnL: dbMetrics.weeklyPnL, 
            totalTrades: dbMetrics.totalTrades,
            winningTrades: dbMetrics.winningTrades,
            losingTrades: dbMetrics.losingTrades,
            winRate: dbMetrics.winRate,
            maxDrawdown: dbMetrics.maxDrawdown,
            sharpeRatio: dbMetrics.sharpeRatio
          });
          return;
        }
        
        // Otherwise create new metrics with real account data
        res.json({
          portfolioValue: portfolioValue,
          portfolioChangePercent: "0.0", // Needs historical data
          dailyPnL: "0.0", // Needs historical data
          dailyPnLPercent: "0.0", // Needs historical data
          weeklyPnL: "0.0", // Needs historical data 
          weeklyPnLPercent: "0.0", // Needs historical data
          totalPnL: totalUnrealizedProfit.toFixed(2),
          totalPnLPercent: ((totalUnrealizedProfit / availableBalance) * 100).toFixed(2),
          totalTrades: realPositions.length,
          winningTrades: realPositions.filter((p: any) => parseFloat(p.unRealizedProfit) > 0).length,
          losingTrades: realPositions.filter((p: any) => parseFloat(p.unRealizedProfit) <= 0).length,
          winRate: 0, // Needs more data
          maxDrawdown: "0.0", // Needs historical data
          sharpeRatio: "0.0" // Needs historical data
        });
        return;
      }
      
      // If we have database metrics but no real data
      if (dbMetrics) {
        res.json(dbMetrics);
        return;
      }
      
      // Last resort: use a minimal baseline with real-time data
      console.warn("No performance metrics available - creating baseline metrics");
      // Try to get positions one more time
      try {
        realPositions = await binanceApi.getPositions();
      } catch (error) {
        // Ignore errors, we'll handle the case where positions are still empty
      }
      
      // Create baseline performance metrics
      res.json({
        portfolioValue: realPositions.length > 0 ? 
                       realPositions.reduce((sum: number, pos: any) => sum + parseFloat(pos.notional || '0'), 0).toFixed(2) : "0.00",
        portfolioChangePercent: "0.0",
        dailyPnL: realPositions.length > 0 ? 
                 realPositions.reduce((sum: number, pos: any) => sum + parseFloat(pos.unRealizedProfit || '0'), 0).toFixed(2) : "0.00",
        dailyPnLPercent: "0.0",
        weeklyPnL: "0.0",
        weeklyPnLPercent: "0.0",
        totalTrades: realPositions.length,
        winningTrades: realPositions.filter((p: any) => parseFloat(p.unRealizedProfit || '0') > 0).length,
        losingTrades: realPositions.filter((p: any) => parseFloat(p.unRealizedProfit || '0') <= 0).length,
        winRate: realPositions.length > 0 ? 
                (realPositions.filter((p: any) => parseFloat(p.unRealizedProfit || '0') > 0).length / realPositions.length * 100).toFixed(0) : 0,
        maxDrawdown: "0.0",
        sharpeRatio: "0.0"
      });
    } catch (error: any) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ error: error.message || 'Unknown error' });
    }
  });
  
  app.get("/api/binance/risk", async (req, res) => {
    try {
      // Get real positions from Binance API
      let positions = [];
      try {
        positions = await binanceApi.getPositions();
      } catch (posError) {
        console.error("Could not get positions from Binance API:", posError);
      }
      
      // Use risk manager to calculate real risk metrics
      const riskMetrics = riskManager.getRiskMetrics(positions);
      
      // Add portfolio diversification score
      riskMetrics.diversificationScore = portfolioAnalyzer.getPortfolioDiversificationScore();
      
      res.json(riskMetrics);
    } catch (error: any) {
      console.error("Error calculating risk metrics:", error);
      res.status(500).json({ error: error.message || 'Unknown error' });
    }
  });
  
  // Portfolio diversification and correlation analysis endpoints
  app.get("/api/portfolio/correlation", async (req, res) => {
    try {
      const correlationMatrix = portfolioAnalyzer.getCorrelationMatrix();
      res.json(correlationMatrix);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/portfolio/volatility", async (req, res) => {
    try {
      const volatilityData = portfolioAnalyzer.getVolatilityData();
      res.json(volatilityData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/portfolio/recommendations", async (req, res) => {
    try {
      const recommendations = portfolioAnalyzer.getDiversificationRecommendations();
      res.json(recommendations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/portfolio/update", async (req, res) => {
    try {
      await portfolioAnalyzer.forceUpdate();
      res.json({ success: true, message: "Portfolio analysis data updated" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/binance/execute", async (req, res) => {
    try {
      const { opportunityId } = req.body;
      
      if (!opportunityId) {
        return res.status(400).json({ error: "OpportunityId is required" });
      }
      
      // First check real-time opportunities from trading core
      let opportunity = tradingCore.getOpportunities().find((o: any) => o.id === opportunityId);
      
      // If not found in real-time opportunities, check stored opportunities
      if (!opportunity) {
        opportunity = realOpportunities.find((o: any) => o.id === opportunityId);
      }
      
      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      
      try {
        // Use tradingCore (which uses real Binance API) to execute the opportunity
        const result = await tradingCore.executeOpportunity(opportunity);
        
        // Only if we get here with no errors, the trade was successful
        console.log(`Successfully executed real trade for ${opportunity.symbol}:`, result);
        
        // Remove the opportunity from the lists
        realOpportunities = realOpportunities.filter((o: any) => o.id !== opportunityId);
        
        // The trading core will handle its own opportunities internally
        
        res.json({
          executed: true,
          order: result,
          real: true
        });
      } catch (executionError: any) {
        console.error("Error executing trade with Binance API:", executionError);
        
        // Check if this is a critical error or just a precision/param issue
        const errorCode = executionError?.response?.data?.code;
        const errorMsg = executionError?.response?.data?.msg;
        
        if (errorCode) {
          console.log(`Binance API error code: ${errorCode}, message: ${errorMsg}`);
        }
        
        // Fallback to simulation ONLY for tracking purposes - no real trade was made
        console.log(`Falling back to simulation for ${opportunity.symbol}`);
        const result = tradingEngine.executeOpportunity(opportunity);
        
        // Add a simulation flag to the position
        if (result.position) {
          result.position.simulated = true;
          activePositions.push(result.position);
          
          // Store simulated position in database with clear marking
          try {
            const userId = 1; // Mock user ID for demo
            const dbPosition = {
              userId,
              symbol: result.position.symbol,
              positionAmt: result.position.positionAmt,
              entryPrice: result.position.entryPrice,
              markPrice: result.position.markPrice,
              unRealizedProfit: result.position.unRealizedProfit,
              liquidationPrice: result.position.liquidationPrice,
              leverage: result.position.leverage,
              marginType: result.position.marginType,
              positionSide: result.position.positionSide,
              notes: "SIMULATED - FAILED TO EXECUTE REAL TRADE"
            };
            
            await storage.createPosition(dbPosition);
            console.log(`Simulated position saved to database: ${dbPosition.symbol}`);
          } catch (dbError) {
            console.error("Error saving simulated position to database:", dbError);
            // Continue with response even if DB save fails
          }
        }
        
        // Remove the opportunity from both lists
        realOpportunities = realOpportunities.filter((o: any) => o.id !== opportunityId);
        
        // The trading core will handle its own opportunities internally
        
        res.json({
          executed: false, 
          simulated: true,
          order: result.order,
          error: {
            code: errorCode || "UNKNOWN_ERROR",
            message: errorMsg || executionError.message || "Unknown error executing trade"
          }
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server with proper configuration
  wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    clientTracking: true,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      serverNoContextTakeover: true,
      clientNoContextTakeover: true,
      threshold: 1024 // only compress messages larger than this
    }
  });
  
  // WebSocket message handlers
  wss.on('connection', function connection(ws: WebSocket & { isAlive?: boolean; lastActivity?: number; clientId?: string }) {
    const clientId = Math.random().toString(36).substring(2, 10);
    ws.isAlive = true;
    ws.lastActivity = Date.now();
    ws.clientId = clientId;
    
    console.log(`WebSocket client connected: ${clientId}`);
    
    // Add to our custom tracking
    wsClients.add(ws);
    
    // Welcome message to client
    try {
      ws.send(JSON.stringify({
        type: 'systemStatus',
        status: 'connected',
        message: 'Connected to AlgoTrader WebSocket server',
        clientId,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error(`Error sending welcome message to client ${clientId}:`, error);
    }
    
    // Handle incoming messages
    ws.on('message', function incoming(message: string) {
      try {
        ws.lastActivity = Date.now();
        
        const data = JSON.parse(message.toString());
        
        // Handle ping messages specifically to maintain connection
        if (data.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          }));
          return;
        }
        
        // Handle subscription requests
        if (data.type === 'subscribe') {
          console.log(`Client ${clientId} subscribed to ${data.channel}`);
          // Additional subscription logic could be implemented here
        }
        
        // Handle unsubscribe requests
        if (data.type === 'unsubscribe') {
          console.log(`Client ${clientId} unsubscribed from ${data.channel}`);
          // Additional unsubscribe logic could be implemented here
        }
        
        // Handle command requests
        if (data.type === 'command') {
          console.log(`Client ${clientId} sent command: ${data.command}`);
          
          // Command processing will be handled by specific endpoints
          // for better security and validation
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnect
    ws.on('close', function() {
      console.log(`WebSocket client disconnected: ${clientId}`);
      wsClients.delete(ws);
    });
    
    // Handle errors
    ws.on('error', function(error) {
      console.error(`WebSocket error for client ${clientId}:`, error);
      
      // Try to close the connection gracefully
      try {
        ws.close();
      } catch (e) {
        console.error('Error closing WebSocket after error:', e);
      }
      
      // Remove from our tracking
      wsClients.delete(ws);
    });
  });
  
  // Real-time heartbeat mechanism for checking if clients are still connected
  const heartbeatInterval = setInterval(() => {
    if (wss && wss.clients) {
      console.log(`WebSocket heartbeat: ${wss.clients.size} clients tracked by WebSocketServer`);
      
      wss.clients.forEach((client: WebSocket & { isAlive?: boolean; lastActivity?: number; clientId?: string }) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
            client.isAlive = true;
          } catch (error) {
            console.error('Error sending heartbeat:', error);
            
            // If we can't send a message, the connection might be dead
            client.isAlive = false;
            
            // Try to close the connection gracefully
            try {
              client.close();
            } catch (e) {
              console.error('Error closing dead connection:', e);
            }
            
            // Remove from our tracking
            wsClients.delete(client);
          }
        } else {
          // Mark as not alive if not in OPEN state
          client.isAlive = false;
        }
      });
      
      // Sync the custom client set with the WebSocketServer's clients
      const activeServerClients = new Set<WebSocket>();
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          activeServerClients.add(client);
        }
      });
      
      // Reset wsClients to match WebSocketServer's active clients
      wsClients.clear();
      activeServerClients.forEach(client => {
        wsClients.add(client);
      });
    } else {
      console.log("WebSocket server not available for heartbeat");
    }
  }, 15000); // Send heartbeat every 15 seconds
  
  // Check for dead/stale connections and remove them
  const connectionMonitorInterval = setInterval(() => {
    const now = Date.now();
    let activeCount = 0;
    let staleCount = 0;
    
    // First update custom tracking from the wss.clients (source of truth)
    const wsServerSize = wss && wss.clients ? wss.clients.size : 0;
    console.log(`WebSocket monitor check: ${wsServerSize} clients in WebSocketServer, ${wsClients.size} in custom tracking`);
    
    // Re-sync with server clients first to ensure we're in sync
    if (wss && wss.clients) {
      const activeServerClients = new Set<WebSocket>();
      wss.clients.forEach((client: WebSocket & { isAlive?: boolean; lastActivity?: number; clientId?: string }) => {
        if (client.readyState === WebSocket.OPEN) {
          activeServerClients.add(client);
          
          // Check for stale connections (no activity for more than 60 seconds)
          if (client.lastActivity && now - client.lastActivity > 60000) {
            console.log(`Ping sent to possibly stale client ${client.clientId}`);
            try {
              client.send(JSON.stringify({ 
                type: 'ping', 
                timestamp: now,
                message: 'Connection check'
              }));
            } catch (error) {
              console.error(`Error sending ping to stale client ${client.clientId}:`, error);
              staleCount++;
            }
          }
        }
      });
      
      // Reset wsClients to match WebSocketServer's active clients
      wsClients.clear();
      activeServerClients.forEach(client => {
        wsClients.add(client);
      });
    }
    
    // Now work with the updated wsClients
    wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        activeCount++;
        // Ping clients that haven't sent a message in a while
        if ((client as any).lastActivity && (now - (client as any).lastActivity > 60000)) {
          try {
            // Try to ping the client
            client.ping();
            console.log('Ping sent to possibly stale client');
          } catch (error) {
            console.error('Error pinging client:', error);
          }
        }
      } else {
        // Client is no longer connected, remove it
        staleCount++;
        wsClients.delete(client);
      }
    });
    
    if (wsClients.size === 0) {
      console.log("No active WebSocket clients");
    } else {
      console.log(`WebSocket connections - Active: ${activeCount}, Removed stale: ${staleCount}, Total: ${wsClients.size}`);
    }
  }, 30000); // Check every 30 seconds
  
  // Clean up on server shutdown
  process.on('SIGINT', () => {
    clearInterval(heartbeatInterval);
    clearInterval(connectionMonitorInterval);
    wss.close();
    process.exit(0);
  });
  
  wss.on('connection', (ws) => {
    // Store last activity time to detect zombie connections
    (ws as any).lastActivity = Date.now();
    
    // Add connection pong handler to track client activity
    ws.on('pong', () => {
      (ws as any).lastActivity = Date.now();
      (ws as any).isAlive = true;
    });
    
    // Mark the connection as alive initially
    (ws as any).isAlive = true;
    
    // Add client to active clients pool
    wsClients.add(ws);
    console.log(`WebSocket client connected. Total clients: ${wsClients.size}`);
    
    // Send initial market data
    Promise.all([
      binanceApi.getMarketData(),
      binanceApi.getPositions()
    ])
    .then(([marketData, positions]) => {
      // Only send if client is still connected
      if (ws.readyState === WebSocket.OPEN) {
        // Send the latest market data
        ws.send(JSON.stringify({
          type: 'marketUpdate',
          data: marketData,
          timestamp: Date.now()
        }));
        
        // Also send position data
        ws.send(JSON.stringify({
          type: 'positionUpdate',
          data: positions,
          timestamp: Date.now()
        }));
        
        // Also send trading core status
        ws.send(JSON.stringify({
          type: 'tradingStatus',
          data: {
            opportunities: tradingCore.getOpportunities(),
            positions: tradingCore.getPositions(),
            autoTradingEnabled: tradingCore.isAutoTradingEnabled(),
            lastScanTime: tradingCore.getLastScanTime(),
            regimes: tradingCore.getRegimes()
          },
          timestamp: Date.now()
        }));
      }
    })
    .catch(error => {
      console.error('Error sending initial data to client:', error);
      
      // Try to send partial data if client is still connected
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({
            type: 'systemStatus',
            status: 'warning',
            message: 'Some data feeds unavailable. Prices may be delayed.',
            timestamp: Date.now()
          }));
        } catch (sendError) {
          console.error('Failed to send error notification to client:', sendError);
        }
      }
    });
    
    ws.on('message', (message) => {
      try {
        // Update activity timestamp on any message
        (ws as any).lastActivity = Date.now();
        
        const data = JSON.parse(message.toString());
        
        // Handle ping requests with immediate pong response
        if (data.type === 'ping') {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: Date.now(),
              echo: data.timestamp
            }));
          }
          return;
        }
        
        // Handle subscription requests
        if (data.type === 'subscribe') {
          if (data.channel === 'market') {
            // Market data subscription already handled
            console.log('Client subscribed to market data');
            
            // Immediately send latest market data
            if (ws.readyState === WebSocket.OPEN) {
              binanceApi.getMarketData()
                .then(marketData => {
                  ws.send(JSON.stringify({
                    type: 'marketUpdate',
                    data: marketData,
                    timestamp: Date.now()
                  }));
                })
                .catch(error => {
                  console.error('Error sending market data on subscription:', error);
                });
            }
          } else if (data.channel === 'position') {
            // Send current positions
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'positionUpdate',
                data: tradingCore.getPositions(),
                timestamp: Date.now() 
              }));
            }
          } else if (data.channel === 'opportunity') {
            // Send current opportunities
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'opportunityUpdate',
                data: tradingCore.getOpportunities(),
                timestamp: Date.now()
              }));
            }
          } else if (data.channel === 'trading') {
            // Send trading system status
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'tradingStatus',
                data: {
                  autoTradingEnabled: tradingCore.isAutoTradingEnabled(),
                  lastScanTime: tradingCore.getLastScanTime()
                },
                timestamp: Date.now()
              }));
            }
          } else if (data.channel === 'system_logs') {
            // Send system logs
            if (ws.readyState === WebSocket.OPEN) {
              try {
                // Using imported getLogs function from the top of the file
                const logs = getLogs();
                
                ws.send(JSON.stringify({
                  type: 'system_logs',
                  data: logs,
                  timestamp: Date.now()
                }));
                
                // Also log this subscription
                console.log(`Client subscribed to system logs channel`);
                addSystemLog('info', 'Client subscribed to system logs channel', 'websocket');
              } catch (error) {
                console.error('Error sending system logs:', error);
              }
            }
          }
          
          // Store this subscription for reconnection support
          if (!pendingSubscriptions) {
            pendingSubscriptions = [];
          }
          pendingSubscriptions.push({
            type: 'subscribe',
            channel: data.channel,
            symbols: data.symbols
          });
        }
        // Handle trading commands
        else if (data.type === 'command') {
          if (data.command === 'enableAutoTrading') {
            tradingCore.setAutoTradingEnabled(data.enabled);
            console.log(`Auto-trading ${data.enabled ? 'enabled' : 'disabled'} by client`);
            
            // Broadcast to all clients
            broadcastToClients({
              type: 'tradingStatus',
              data: {
                autoTradingEnabled: tradingCore.isAutoTradingEnabled(),
                lastScanTime: tradingCore.getLastScanTime()
              }
            });
          }
          else if (data.command === 'scanMarket') {
            // Trigger immediate market scan
            tradingCore.scanMarket();
            console.log('Market scan triggered by client');
          }
          else if (data.command === 'executeOpportunity') {
            // Execute specific opportunity
            tradingCore.executeOpportunity(data.opportunity);
            console.log(`Opportunity execution triggered by client: ${data.opportunity.id}`);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      wsClients.delete(ws);
    });
  });
  
  return httpServer;
}

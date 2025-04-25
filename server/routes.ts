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

const wsClients: Set<WebSocket> = new Set();
const binanceWs = new BinanceWebSocketClient(true); // Use testnet
const tradingEngine = new TradingEngine();
const riskManager = new RiskManager();

// Mock data for positions, performance, etc.
let mockPositions: any[] = [];
let mockOpportunities: any[] = [];
let mockPerformanceMetrics: any = {};
let mockRiskMetrics: any = {};

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
    
    // Initialize mock data based on real market data
    const marketData = await binanceApi.getMarketData();
    
    // Generate mock trading opportunities
    mockOpportunities = generateOpportunities(marketData);
    
    // Initialize mock performance metrics
    mockPerformanceMetrics = {
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
    };
    
    // Initialize mock risk metrics
    mockRiskMetrics = {
      totalRiskExposure: 18.5,
      maxRiskLimit: 30,
      currentDrawdown: "-8.3%",
      maxDrawdownLimit: "-15%",
      maxPositionSize: "5000",
      maxPositions: 10,
      currentPositions: 4,
      systemStatus: {
        api: true,
        execution: true,
        dataFeed: true
      }
    };
    
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

// Broadcast messages to all connected WebSocket clients
const broadcastToClients = (message: any) => {
  const messageStr = JSON.stringify(message);
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
};

import apiRoutes from "./routes/index";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize trading data
  await initializeData();
  
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
        
        // Update mock positions
        mockPositions = tradingEngine.updatePositions(mockPositions, simulatedOrder);
        
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
        
        // Update mock positions
        mockPositions = mockPositions.filter(
          p => !(p.symbol === symbol && p.positionSide === positionSide)
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
  
  app.get("/api/binance/opportunities", (req, res) => {
    res.json(mockOpportunities);
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
        const totalUnrealizedProfit = realPositions.reduce((sum, pos) => 
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
          winningTrades: realPositions.filter(p => parseFloat(p.unRealizedProfit) > 0).length,
          losingTrades: realPositions.filter(p => parseFloat(p.unRealizedProfit) <= 0).length,
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
      
      // Last resort: use mock data
      console.warn("Using mock performance metrics - no real data available");
      res.json({
        portfolioValue: "25000.00",
        portfolioChangePercent: "0.0",
        dailyPnL: "0.0",
        dailyPnLPercent: "0.0",
        weeklyPnL: "0.0",
        weeklyPnLPercent: "0.0",
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        maxDrawdown: "0.0",
        sharpeRatio: "0.0"
      });
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ error: error.message });
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
    } catch (error) {
      console.error("Error calculating risk metrics:", error);
      res.status(500).json({ error: error.message });
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
      
      // Find the opportunity
      const opportunity = mockOpportunities.find(o => o.id === opportunityId);
      
      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      
      try {
        // Use tradingCore (which uses real Binance API) to execute the opportunity
        const result = await tradingCore.executeOpportunity(opportunity);
        
        // Only if we get here with no errors, the trade was successful
        console.log(`Successfully executed real trade for ${opportunity.symbol}:`, result);
        
        // Remove the opportunity from the list
        mockOpportunities = mockOpportunities.filter(o => o.id !== opportunityId);
        
        res.json({
          executed: true,
          order: result,
          real: true
        });
      } catch (executionError) {
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
          mockPositions.push(result.position);
          
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
        
        // Remove the opportunity from the list
        mockOpportunities = mockOpportunities.filter(o => o.id !== opportunityId);
        
        res.json({
          executed: false, 
          simulated: true,
          order: result.order,
          error: {
            code: errorCode,
            message: errorMsg
          }
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    wsClients.add(ws);
    
    // Send initial market data
    binanceApi.getMarketData()
      .then(data => {
        ws.send(JSON.stringify({
          type: 'marketUpdate',
          data
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
          }
        }));
      })
      .catch(error => {
        console.error('Error sending initial market data:', error);
      });
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle subscription requests
        if (data.type === 'subscribe') {
          if (data.channel === 'market') {
            // Market data subscription already handled
            console.log('Client subscribed to market data');
          } else if (data.channel === 'position') {
            // Send current positions
            ws.send(JSON.stringify({
              type: 'positionUpdate',
              data: tradingCore.getPositions() 
            }));
          } else if (data.channel === 'opportunity') {
            // Send current opportunities
            ws.send(JSON.stringify({
              type: 'opportunityUpdate',
              data: tradingCore.getOpportunities()
            }));
          } else if (data.channel === 'trading') {
            // Send trading system status
            ws.send(JSON.stringify({
              type: 'tradingStatus',
              data: {
                autoTradingEnabled: tradingCore.isAutoTradingEnabled(),
                lastScanTime: tradingCore.getLastScanTime()
              }
            }));
          }
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

import { Router } from "express";
import { storage } from "../storage";
import { getStrategyFunction } from "../trading/strategies";
import { StrategyType } from "../../client/src/lib/types";
import * as binanceApi from "../binance/api";

const router = Router();

// Get all strategies for a user
router.get("/", async (req, res) => {
  try {
    const userId = 1; // Mock user ID for demo
    
    const strategies = await storage.getStrategies(userId);
    res.json(strategies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific strategy
router.get("/:id", async (req, res) => {
  try {
    const strategyId = parseInt(req.params.id);
    
    if (isNaN(strategyId)) {
      return res.status(400).json({ error: "Invalid strategy ID" });
    }
    
    const strategy = await storage.getStrategy(strategyId);
    
    if (!strategy) {
      return res.status(404).json({ error: "Strategy not found" });
    }
    
    res.json(strategy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new strategy
router.post("/", async (req, res) => {
  try {
    const { name, type, params, isActive } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: "Name and type are required" });
    }
    
    // Validate strategy type
    try {
      getStrategyFunction(type);
    } catch (error) {
      return res.status(400).json({ error: `Invalid strategy type: ${type}` });
    }
    
    const userId = 1; // Mock user ID for demo
    
    const strategyData = {
      userId,
      name,
      type,
      params: params || {},
      isActive: isActive === undefined ? false : isActive
    };
    
    const strategy = await storage.createStrategy(strategyData);
    res.status(201).json(strategy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a strategy
router.patch("/:id", async (req, res) => {
  try {
    const strategyId = parseInt(req.params.id);
    
    if (isNaN(strategyId)) {
      return res.status(400).json({ error: "Invalid strategy ID" });
    }
    
    const { name, type, params, isActive } = req.body;
    
    // Validate strategy type if provided
    if (type) {
      try {
        getStrategyFunction(type);
      } catch (error) {
        return res.status(400).json({ error: `Invalid strategy type: ${type}` });
      }
    }
    
    const existingStrategy = await storage.getStrategy(strategyId);
    
    if (!existingStrategy) {
      return res.status(404).json({ error: "Strategy not found" });
    }
    
    const strategyData: any = {};
    
    if (name !== undefined) strategyData.name = name;
    if (type !== undefined) strategyData.type = type;
    if (params !== undefined) strategyData.params = params;
    if (isActive !== undefined) strategyData.isActive = isActive;
    
    const updatedStrategy = await storage.updateStrategy(strategyId, strategyData);
    res.json(updatedStrategy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test a strategy with historical data
router.post("/:id/test", async (req, res) => {
  try {
    const strategyId = parseInt(req.params.id);
    
    if (isNaN(strategyId)) {
      return res.status(400).json({ error: "Invalid strategy ID" });
    }
    
    const { symbol, timeframe, limit = 100 } = req.body;
    
    if (!symbol || !timeframe) {
      return res.status(400).json({ error: "Symbol and timeframe are required" });
    }
    
    const strategy = await storage.getStrategy(strategyId);
    
    if (!strategy) {
      return res.status(404).json({ error: "Strategy not found" });
    }
    
    // Get strategy function
    const strategyFunction = getStrategyFunction(strategy.type as StrategyType);
    
    // Fetch historical data
    try {
      const candles = await binanceApi.getCandles(symbol, timeframe, limit);
      
      // Run strategy backtest
      const results = strategyFunction(candles, strategy.params);
      
      res.json({
        strategy: strategy.name,
        type: strategy.type,
        symbol,
        timeframe,
        results
      });
    } catch (error: any) {
      res.status(500).json({ error: `Failed to fetch candles: ${error.message}` });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
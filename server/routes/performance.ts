import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Get performance metrics for a user
router.get("/", async (req, res) => {
  try {
    const userId = 1; // Mock user ID for demo
    
    const metrics = await storage.getPerformanceMetrics(userId);
    
    if (!metrics) {
      // If no metrics found in DB, return placeholder data
      return res.json({
        portfolioValue: "0.00",
        portfolioChangePercent: "0.00",
        dailyPnL: "0.00",
        dailyPnLPercent: "0.00",
        weeklyPnL: "0.00",
        weeklyPnLPercent: "0.00",
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        avgProfit: "0.00",
        avgLoss: "0.00",
        maxDrawdown: "0.00%",
        sharpeRatio: "0.00",
        sortino: "0.00",
        strategyPerformance: []
      });
    }
    
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update performance metrics
router.post("/", async (req, res) => {
  try {
    const {
      portfolioValue,
      dailyPnL,
      weeklyPnL,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      maxDrawdown,
      sharpeRatio
    } = req.body;
    
    if (!portfolioValue) {
      return res.status(400).json({ error: "Portfolio value is required" });
    }
    
    const userId = 1; // Mock user ID for demo
    
    // Check if metrics already exist for user
    const existingMetrics = await storage.getPerformanceMetrics(userId);
    
    const metricsData = {
      userId,
      portfolioValue,
      dailyPnL: dailyPnL || "0.00",
      weeklyPnL: weeklyPnL || "0.00",
      totalTrades: totalTrades || 0,
      winningTrades: winningTrades || 0,
      losingTrades: losingTrades || 0,
      winRate: winRate || 0,
      maxDrawdown: maxDrawdown || "0.00",
      sharpeRatio: sharpeRatio || "0.00",
      date: new Date()
    };
    
    let result;
    
    if (existingMetrics) {
      // Update existing metrics
      result = await storage.updatePerformanceMetrics(existingMetrics.id, metricsData);
    } else {
      // Create new metrics
      result = await storage.createPerformanceMetrics(metricsData);
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
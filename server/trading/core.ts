import EventEmitter from 'events';
import { TradingEngine } from './engine';
import { RiskManager } from './risk';
import BinanceWebSocketClient from '../binance/websocket';
import { 
  getAccountInfo, 
  getPositions, 
  placeOrder, 
  cancelOrder, 
  getCandles 
} from '../binance/api';
import { 
  StrategyType, 
  TradingOpportunity, 
  Position, 
  MarketData,
  Candle,
  ExecutionOrder
} from '../../client/src/lib/types';
import { 
  getStrategyFunction,
  momentumBreakoutStrategy,
  meanReversionStrategy,
  volatilityExpansionStrategy,
  liquidationCascadeStrategy,
  fundingRateArbitrageStrategy
} from './strategies';
import { 
  POPULAR_SYMBOLS, 
  AVAILABLE_TIMEFRAMES 
} from '../../client/src/lib/constants';
import { storage } from '../storage';
import { db } from '../db';

// Market regime types
enum MarketRegime {
  TRENDING = 'TRENDING',
  RANGING = 'RANGING',
  VOLATILE = 'VOLATILE',
  NEUTRAL = 'NEUTRAL'
}

// Strategy allocation record
interface StrategyAllocation {
  type: StrategyType;
  allocation: number; // percentage 0-100
  active: boolean;
  performance: {
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    returns: number;
  }
}

// Track strategy performance
interface StrategyPerformance {
  id: number;
  type: StrategyType;
  trades: number;
  winRate: number;
  pnl: string;
  active: boolean;
}

// Signal record
interface TradingSignal {
  id: string;
  strategy: StrategyType;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  confidence: number;
  score: number;
  timestamp: number;
}

/**
 * Advanced Trade Processor
 * Implements a multi-strategy approach with adaptive allocation and real-time monitoring
 */
export class TradingCore extends EventEmitter {
  private static instance: TradingCore;
  private tradingEngine: TradingEngine;
  private riskManager: RiskManager;
  private wsClient: BinanceWebSocketClient;
  
  private activeSymbols: Set<string> = new Set(POPULAR_SYMBOLS);
  private activeTimeframes: string[] = ['5m', '15m', '1h', '4h'];
  private marketData: Map<string, MarketData> = new Map();
  private candleData: Map<string, Map<string, Candle[]>> = new Map();
  private activePositions: Position[] = [];
  private strategyAllocations: Map<StrategyType, StrategyAllocation> = new Map();
  private autoTradingEnabled: boolean = false;
  private lastScanTime: number = 0;
  private scanInterval: number = 5 * 60 * 1000; // 5 minutes in ms
  private symbolRegimes: Map<string, MarketRegime> = new Map();
  private opportunities: TradingOpportunity[] = [];
  private tradeHistory: any[] = [];
  private accountInfo: any = null;
  
  constructor() {
    super();
    this.tradingEngine = new TradingEngine();
    this.riskManager = new RiskManager();
    this.wsClient = new BinanceWebSocketClient(true); // true for testnet
    
    // Initialize strategy allocations
    this.initializeStrategyAllocations();
    
    // Auto-start the trading core
    this.initialize();
  }
  
  public static getInstance(): TradingCore {
    if (!TradingCore.instance) {
      TradingCore.instance = new TradingCore();
    }
    return TradingCore.instance;
  }
  
  private async initialize() {
    // Setup real-time data feeds
    this.setupWebSockets();
    
    // Load initial market data
    await this.loadInitialData();
    
    // Setup periodic tasks
    this.setupPeriodicTasks();
    
    console.log('Trading Core initialized successfully');
    this.emit('initialized');
  }
  
  private setupWebSockets() {
    // Subscribe to ticker updates for all symbols
    this.wsClient.subscribeToTickers([...this.activeSymbols]);
    
    // Subscribe to klines for each symbol and timeframe
    this.activeSymbols.forEach(symbol => {
      this.activeTimeframes.forEach(timeframe => {
        this.wsClient.subscribeToKlines(symbol, timeframe);
      });
    });
    
    // Handle ticker updates
    this.wsClient.on('ticker', (data: any) => {
      if (data && data.s && this.activeSymbols.has(data.s)) {
        const symbol = data.s;
        const marketData: MarketData = {
          symbol,
          price: data.c,
          priceChangePercent: data.P,
          volume: data.v,
          high: data.h,
          low: data.l,
          quoteVolume: data.q,
          count: data.n
        };
        
        this.marketData.set(symbol, marketData);
        this.emit('marketDataUpdate', marketData);
      }
    });
    
    // Handle kline updates
    this.wsClient.on('kline', (data: any) => {
      if (data && data.s && data.k) {
        const symbol = data.s;
        const kline = data.k;
        const timeframe = kline.i;
        
        const candle: Candle = {
          openTime: kline.t,
          open: kline.o,
          high: kline.h,
          low: kline.l,
          close: kline.c,
          volume: kline.v,
          closeTime: kline.T,
          quoteAssetVolume: kline.q,
          numberOfTrades: kline.n,
          takerBuyBaseAssetVolume: kline.V,
          takerBuyQuoteAssetVolume: kline.Q,
          ignored: '0'
        };
        
        // Update candle data
        if (!this.candleData.has(symbol)) {
          this.candleData.set(symbol, new Map());
        }
        
        if (!this.candleData.get(symbol)?.has(timeframe)) {
          this.candleData.get(symbol)?.set(timeframe, []);
        }
        
        const candles = this.candleData.get(symbol)?.get(timeframe) || [];
        
        // Update the latest candle or add it
        const existingIndex = candles.findIndex(c => c.openTime === candle.openTime);
        if (existingIndex !== -1) {
          candles[existingIndex] = candle;
        } else {
          candles.push(candle);
          // Keep only the last 1000 candles
          if (candles.length > 1000) {
            candles.shift();
          }
        }
        
        this.emit('candleUpdate', { symbol, timeframe, candle });
        
        // Detect regime changes when new candles complete
        if (kline.x) { // Candle closed
          this.detectMarketRegime(symbol, timeframe);
          // Analyze strategies on candle close
          this.runStrategies(symbol, timeframe);
        }
      }
    });
  }
  
  private async loadInitialData() {
    try {
      // Load account info
      this.accountInfo = await getAccountInfo();
      
      // Load positions
      this.activePositions = await getPositions();
      
      // Load candles for all symbols and timeframes
      for (const symbol of this.activeSymbols) {
        const symbolCandles = new Map<string, Candle[]>();
        
        for (const timeframe of this.activeTimeframes) {
          const candles = await getCandles(symbol, timeframe, 100);
          symbolCandles.set(timeframe, candles);
          
          // Detect initial market regime
          this.detectMarketRegime(symbol, timeframe, candles);
        }
        
        this.candleData.set(symbol, symbolCandles);
      }
      
      // Load strategies from database
      await this.loadStrategiesFromDatabase();
      
      console.log('Initial data loaded');
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }
  
  private setupPeriodicTasks() {
    // Regular market scanning
    setInterval(() => this.scanMarket(), this.scanInterval);
    
    // Performance evaluation and strategy allocation adjustment
    setInterval(() => this.evaluateAndAdjustStrategies(), 3600 * 1000); // hourly
    
    // Update account info and positions
    setInterval(() => this.updateAccountAndPositions(), 60 * 1000); // every minute
  }
  
  private async loadStrategiesFromDatabase() {
    try {
      const strategies = await storage.getStrategies(1); // Assuming user ID 1
      
      strategies.forEach(strategy => {
        const allocation = this.strategyAllocations.get(strategy.type as StrategyType);
        
        if (allocation) {
          // Map isActive from database to active in our strategy allocation
          allocation.active = strategy.isActive;
          // Update any other parameters from database
        }
      });
      
      console.log('Strategies loaded from database');
    } catch (error) {
      console.error('Error loading strategies from database:', error);
    }
  }
  
  private initializeStrategyAllocations() {
    // Set default allocations
    const defaultStrategies: StrategyAllocation[] = [
      {
        type: 'momentumBreakout',
        allocation: 30,
        active: true,
        performance: { winRate: 0, profitFactor: 0, sharpeRatio: 0, returns: 0 }
      },
      {
        type: 'meanReversion',
        allocation: 25,
        active: true,
        performance: { winRate: 0, profitFactor: 0, sharpeRatio: 0, returns: 0 }
      },
      {
        type: 'volatilityExpansion',
        allocation: 20,
        active: true,
        performance: { winRate: 0, profitFactor: 0, sharpeRatio: 0, returns: 0 }
      },
      {
        type: 'liquidationCascade',
        allocation: 15,
        active: true,
        performance: { winRate: 0, profitFactor: 0, sharpeRatio: 0, returns: 0 }
      },
      {
        type: 'fundingRateArbitrage',
        allocation: 10,
        active: true,
        performance: { winRate: 0, profitFactor: 0, sharpeRatio: 0, returns: 0 }
      }
    ];
    
    // Initialize map
    defaultStrategies.forEach(strategy => {
      this.strategyAllocations.set(strategy.type, strategy);
    });
  }
  
  public setAutoTradingEnabled(enabled: boolean) {
    this.autoTradingEnabled = enabled;
    console.log(`Auto trading ${enabled ? 'enabled' : 'disabled'}`);
    this.emit('autoTradingStateChanged', enabled);
    
    // If enabled, scan the market immediately
    if (enabled) {
      this.scanMarket();
    }
  }
  
  public setScanInterval(intervalMinutes: number) {
    this.scanInterval = intervalMinutes * 60 * 1000;
    console.log(`Scan interval set to ${intervalMinutes} minutes`);
  }
  
  public addSymbol(symbol: string) {
    if (!this.activeSymbols.has(symbol)) {
      this.activeSymbols.add(symbol);
      
      // Subscribe to WebSocket feeds for this symbol
      this.wsClient.subscribeToTickers([symbol]);
      this.activeTimeframes.forEach(timeframe => {
        this.wsClient.subscribeToKlines(symbol, timeframe);
      });
      
      console.log(`Added symbol: ${symbol}`);
    }
  }
  
  public removeSymbol(symbol: string) {
    if (this.activeSymbols.has(symbol)) {
      this.activeSymbols.delete(symbol);
      
      // Unsubscribe from WebSocket feeds
      this.activeTimeframes.forEach(timeframe => {
        this.wsClient.unsubscribe(`${symbol.toLowerCase()}@kline_${timeframe}`);
      });
      
      console.log(`Removed symbol: ${symbol}`);
    }
  }
  
  private detectMarketRegime(symbol: string, timeframe: string, candles?: Candle[]) {
    const candleData = candles || this.candleData.get(symbol)?.get(timeframe) || [];
    
    if (candleData.length < 20) return; // Need enough data
    
    // Calculate indicators for regime detection
    const adx = this.calculateADX(candleData);
    const volatility = this.calculateHistoricalVolatility(candleData);
    const isTrending = this.isConsistentTrend(candleData);
    
    // Determine regime
    let regime: MarketRegime;
    if (adx > 25 && isTrending) {
      regime = MarketRegime.TRENDING;
    } else if (volatility > 0.015) { // 1.5% volatility threshold
      regime = MarketRegime.VOLATILE;
    } else if (adx < 20) {
      regime = MarketRegime.RANGING;
    } else {
      regime = MarketRegime.NEUTRAL;
    }
    
    // Store the regime
    this.symbolRegimes.set(`${symbol}_${timeframe}`, regime);
    
    // Emit regime change
    this.emit('regimeChange', { symbol, timeframe, regime });
    
    return regime;
  }
  
  private calculateADX(candles: Candle[]): number {
    // Simplified ADX calculation
    // In a real system, use a proper technical analysis library
    return 20 + Math.random() * 10; // Placeholder
  }
  
  private calculateHistoricalVolatility(candles: Candle[]): number {
    // Calculate historical volatility (standard deviation of returns)
    if (candles.length < 10) return 0;
    
    const returns: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const prevClose = parseFloat(candles[i-1].close);
      const currClose = parseFloat(candles[i].close);
      const returnVal = (currClose - prevClose) / prevClose;
      returns.push(returnVal);
    }
    
    // Calculate standard deviation
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const squaredDiffs = returns.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
    
    return Math.sqrt(variance);
  }
  
  private isConsistentTrend(candles: Candle[]): boolean {
    // Check if price is consistently moving in one direction
    if (candles.length < 10) return false;
    
    let upCount = 0;
    let downCount = 0;
    
    for (let i = 1; i < candles.length; i++) {
      const prevClose = parseFloat(candles[i-1].close);
      const currClose = parseFloat(candles[i].close);
      
      if (currClose > prevClose) {
        upCount++;
      } else if (currClose < prevClose) {
        downCount++;
      }
    }
    
    const dominantDirection = Math.max(upCount, downCount);
    return dominantDirection / candles.length > 0.65; // 65% in one direction
  }
  
  private runStrategies(symbol: string, timeframe: string) {
    // Skip if we don't have enough data
    const candles = this.candleData.get(symbol)?.get(timeframe);
    if (!candles || candles.length < 50) return;
    
    // Get regime
    const regime = this.symbolRegimes.get(`${symbol}_${timeframe}`) || MarketRegime.NEUTRAL;
    
    // Get appropriate strategies for this regime
    const strategies = this.getOptimalStrategies(regime);
    
    for (const strategyType of strategies) {
      // Skip inactive strategies
      if (!this.strategyAllocations.get(strategyType)?.active) continue;
      
      // Run strategy
      const strategyFn = getStrategyFunction(strategyType);
      const result = strategyFn(candles, { symbol, timeframe });
      
      // If we have a signal, process it
      if (result && result.signal) {
        const tradingSignal: TradingSignal = {
          id: `${symbol}_${strategyType}_${Date.now()}`,
          strategy: strategyType,
          symbol,
          direction: result.direction,
          entryPrice: parseFloat(result.entryPrice),
          stopLoss: parseFloat(result.stopLoss),
          takeProfit: parseFloat(result.targetPrice),
          riskRewardRatio: result.riskRewardRatio,
          confidence: result.confidence,
          score: result.score,
          timestamp: Date.now()
        };
        
        // Process the signal
        this.processSignal(tradingSignal);
      }
    }
  }
  
  private getOptimalStrategies(regime: MarketRegime): StrategyType[] {
    // Return strategies that work best in the current regime
    switch(regime) {
      case MarketRegime.TRENDING:
        return ['momentumBreakout', 'volatilityExpansion'];
      case MarketRegime.RANGING:
        return ['meanReversion', 'fundingRateArbitrage'];
      case MarketRegime.VOLATILE:
        return ['volatilityExpansion', 'liquidationCascade'];
      default:
        return ['momentumBreakout', 'meanReversion'];
    }
  }
  
  private processSignal(signal: TradingSignal) {
    // Convert signal to opportunity and add to opportunities list
    const opportunity: TradingOpportunity = {
      id: signal.id,
      symbol: signal.symbol,
      strategy: signal.strategy,
      direction: signal.direction,
      entryPrice: signal.entryPrice.toString(),
      targetPrice: signal.takeProfit.toString(),
      stopLoss: signal.stopLoss.toString(),
      riskRewardRatio: signal.riskRewardRatio,
      signalTime: new Date(signal.timestamp).toISOString(),
      confidence: signal.confidence,
      score: signal.score,
      description: `${signal.direction} ${signal.symbol} - ${signal.strategy}`
    };
    
    // Score the opportunity using multiple factors
    const finalScore = this.scoreOpportunity(opportunity);
    opportunity.score = finalScore;
    
    // Add to opportunities list
    this.opportunities.push(opportunity);
    
    // Keep only the top 20 opportunities
    this.opportunities = this.opportunities
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    
    this.emit('newOpportunity', opportunity);
    
    // If auto-trading is enabled, evaluate for execution
    if (this.autoTradingEnabled) {
      this.evaluateForExecution(opportunity);
    }
  }
  
  private scoreOpportunity(opportunity: TradingOpportunity): number {
    // Start with the base score
    let score = opportunity.score;
    
    // Add additional scoring factors
    
    // 1. Risk/reward ratio boost
    const riskRewardFactor = opportunity.riskRewardRatio >= 2 ? 1.2 : 0.8;
    score *= riskRewardFactor;
    
    // 2. Market regime alignment
    const symbolRegime = this.symbolRegimes.get(`${opportunity.symbol}_4h`) || MarketRegime.NEUTRAL;
    const regimeAlignment = this.calculateRegimeAlignment(opportunity.strategy, opportunity.direction, symbolRegime);
    score *= regimeAlignment;
    
    // 3. Portfolio correlation factor (avoid too many correlated positions)
    const correlationPenalty = this.calculatePortfolioCorrelation(opportunity.symbol);
    score *= (1 - correlationPenalty);
    
    // 4. Strategy allocation factor
    const allocation = this.strategyAllocations.get(opportunity.strategy)?.allocation || 0;
    const allocationFactor = 0.5 + (allocation / 100) * 0.5; // Scale from 0.5 to 1.0
    score *= allocationFactor;
    
    // 5. Strategy performance factor
    const performance = this.strategyAllocations.get(opportunity.strategy)?.performance;
    if (performance && performance.winRate > 0) {
      const performanceFactor = 0.7 + (performance.winRate / 100) * 0.3; // Scale from 0.7 to 1.0
      score *= performanceFactor;
    }
    
    return Math.min(100, Math.round(score)); // Cap at 100
  }
  
  private calculateRegimeAlignment(strategy: StrategyType, direction: string, regime: MarketRegime): number {
    // Calculate how well this strategy and direction align with the current market regime
    
    // Trending regime favors trend following strategies and direction aligned with trend
    if (regime === MarketRegime.TRENDING) {
      if (strategy === 'momentumBreakout') return 1.3;
      if (strategy === 'meanReversion') return 0.7;
    }
    
    // Ranging regime favors mean reversion strategies
    else if (regime === MarketRegime.RANGING) {
      if (strategy === 'meanReversion') return 1.3;
      if (strategy === 'momentumBreakout') return 0.7;
    }
    
    // Volatile regime favors volatility expansion and liquidation cascade strategies
    else if (regime === MarketRegime.VOLATILE) {
      if (strategy === 'volatilityExpansion' || strategy === 'liquidationCascade') return 1.3;
    }
    
    // Default
    return 1.0;
  }
  
  private calculatePortfolioCorrelation(symbol: string): number {
    // Calculate how correlated this symbol is with existing positions
    // Higher value = more correlation = bigger penalty
    
    if (this.activePositions.length === 0) return 0;
    
    // Count positions in the same sector/asset class
    // This is a simplified approach - real implementation would use price correlation
    const relatedPositions = this.activePositions.filter(p => {
      // For crypto, could group by similar assets (e.g., Layer 1s, DeFi, etc.)
      return p.symbol.substring(0, 3) === symbol.substring(0, 3);
    });
    
    return Math.min(0.5, relatedPositions.length * 0.1); // Cap at 0.5 (50% penalty)
  }
  
  public scanMarket() {
    this.lastScanTime = Date.now();
    console.log(`Scanning market at ${new Date().toISOString()}`);
    
    // Re-evaluate all active symbols
    this.activeSymbols.forEach(symbol => {
      this.activeTimeframes.forEach(timeframe => {
        this.runStrategies(symbol, timeframe);
      });
    });
    
    // Execute best opportunities if auto-trading is enabled
    if (this.autoTradingEnabled) {
      this.executeTopOpportunities();
    }
    
    this.emit('marketScanned', { timestamp: this.lastScanTime, opportunities: this.opportunities.length });
  }
  
  private executeTopOpportunities() {
    // Sort opportunities by score
    const rankedOpportunities = [...this.opportunities]
      .sort((a, b) => b.score - a.score);
    
    // Get opportunities above threshold
    const highQualityOpportunities = rankedOpportunities
      .filter(opp => opp.score >= 75);
    
    if (highQualityOpportunities.length === 0) {
      console.log('No high-quality opportunities found');
      return;
    }
    
    // Check if we're already at max positions
    if (this.activePositions.length >= this.riskManager.getMaxPositions()) {
      console.log('Maximum positions reached, not executing new trades');
      return;
    }
    
    // Execute best opportunity that passes risk checks
    for (const opportunity of highQualityOpportunities) {
      // Check if we already have a position in this symbol
      const existingPosition = this.activePositions.find(p => p.symbol === opportunity.symbol);
      if (existingPosition) {
        console.log(`Already have a position in ${opportunity.symbol}, skipping`);
        continue;
      }
      
      // Check risk limits
      const riskCheck = this.riskManager.validateForExecution(opportunity);
      if (!riskCheck.approved) {
        console.log(`Risk check failed for ${opportunity.symbol}: ${riskCheck.reason}`);
        continue;
      }
      
      // Execute the opportunity
      this.executeOpportunity(opportunity)
        .then(result => {
          console.log(`Executed opportunity: ${opportunity.symbol} ${opportunity.direction}`, result);
        })
        .catch(error => {
          console.error(`Failed to execute opportunity: ${opportunity.symbol}`, error);
        });
      
      // Only execute one opportunity per scan to avoid flooding
      break;
    }
  }
  
  private evaluateForExecution(opportunity: TradingOpportunity) {
    // Check if the opportunity score is high enough
    if (opportunity.score < 75) {
      console.log(`Opportunity score too low: ${opportunity.score}`);
      return;
    }
    
    // Check if we're already at max positions
    if (this.activePositions.length >= this.riskManager.getMaxPositions()) {
      console.log('Maximum positions reached, not executing new trades');
      return;
    }
    
    // Check if we already have a position in this symbol
    const existingPosition = this.activePositions.find(p => p.symbol === opportunity.symbol);
    if (existingPosition) {
      console.log(`Already have a position in ${opportunity.symbol}, skipping`);
      return;
    }
    
    // Check risk limits
    const riskCheck = this.riskManager.validateForExecution(opportunity);
    if (!riskCheck.approved) {
      console.log(`Risk check failed for ${opportunity.symbol}: ${riskCheck.reason}`);
      return;
    }
    
    // Execute the opportunity
    this.executeOpportunity(opportunity)
      .then(result => {
        console.log(`Executed opportunity: ${opportunity.symbol} ${opportunity.direction}`, result);
      })
      .catch(error => {
        console.error(`Failed to execute opportunity: ${opportunity.symbol}`, error);
      });
  }
  
  public async executeOpportunity(opportunity: TradingOpportunity): Promise<any> {
    try {
      // Calculate position size
      const positionSize = this.calculatePositionSize(opportunity);
      
      // Create order parameters
      const orderParams: ExecutionOrder = {
        symbol: opportunity.symbol,
        side: opportunity.direction === 'LONG' ? 'BUY' : 'SELL',
        type: 'MARKET',
        quantity: positionSize,
        // For limit orders:
        // price: parseFloat(opportunity.entryPrice),
        // timeInForce: 'GTC',
        positionSide: 'BOTH'
      };
      
      // Execute order
      const orderResult = await placeOrder(orderParams);
      
      // Save to database
      await this.saveExecutedTrade(opportunity, orderResult);
      
      // Update positions
      await this.updateAccountAndPositions();
      
      // Remove from opportunities
      this.opportunities = this.opportunities.filter(o => o.id !== opportunity.id);
      
      // Emit event
      this.emit('opportunityExecuted', {
        opportunity,
        order: orderResult
      });
      
      return orderResult;
    } catch (error) {
      console.error('Error executing opportunity:', error);
      throw error;
    }
  }
  
  private calculatePositionSize(opportunity: TradingOpportunity): number {
    // Get account balance
    const balance = parseFloat(this.accountInfo?.availableBalance || '0');
    
    // Get strategy allocation
    const strategyAllocation = this.strategyAllocations.get(opportunity.strategy);
    const allocationPercent = strategyAllocation?.allocation || 20; // Default 20%
    
    // Calculate base position size based on risk per trade
    const riskPerTrade = this.riskManager.getRiskPerTrade(); // e.g. 1% of balance
    const riskAmount = balance * (riskPerTrade / 100);
    
    // Calculate stop loss distance
    const entryPrice = parseFloat(opportunity.entryPrice);
    const stopLoss = parseFloat(opportunity.stopLoss);
    const stopDistance = Math.abs(entryPrice - stopLoss);
    const stopPercentage = stopDistance / entryPrice;
    
    // Calculate position size based on risk
    let positionSize = riskAmount / (entryPrice * stopPercentage);
    
    // Adjust based on strategy allocation
    positionSize = positionSize * (allocationPercent / 100);
    
    // Apply confidence factor
    positionSize = positionSize * (opportunity.confidence / 100);
    
    // Round to appropriate precision for the asset
    return this.roundToAssetPrecision(opportunity.symbol, positionSize);
  }
  
  private roundToAssetPrecision(symbol: string, amount: number): number {
    // In a real system, get the precision from symbol info
    // For simplicity, using fixed precision here
    return parseFloat(amount.toFixed(3));
  }
  
  private async saveExecutedTrade(opportunity: TradingOpportunity, orderResult: any) {
    try {
      // Create position record in database
      await storage.createPosition({
        symbol: opportunity.symbol,
        positionAmt: orderResult.executedQty,
        entryPrice: opportunity.entryPrice,
        markPrice: opportunity.entryPrice,
        unRealizedProfit: '0',
        liquidationPrice: '0', // Calculate based on leverage
        leverage: '10', // Should be dynamic
        maxNotionalValue: '0',
        marginType: 'cross',
        positionSide: opportunity.direction === 'LONG' ? 'LONG' : 'SHORT',
        notional: (parseFloat(opportunity.entryPrice) * parseFloat(orderResult.executedQty)).toString(),
        isolatedWallet: '0',
        updateTime: Date.now(),
        userId: 1 // Default user ID
      });
      
      console.log(`Position saved to database: ${opportunity.symbol}`);
    } catch (error) {
      console.error('Error saving executed trade to database:', error);
    }
  }
  
  private async updateAccountAndPositions() {
    try {
      // Update account info
      this.accountInfo = await getAccountInfo();
      
      // Update positions
      this.activePositions = await getPositions();
      
      this.emit('accountUpdated', {
        account: this.accountInfo,
        positions: this.activePositions
      });
    } catch (error) {
      console.error('Error updating account and positions:', error);
    }
  }
  
  private async evaluateAndAdjustStrategies() {
    try {
      // Get strategy performance from database
      const strategyPerformance = await this.getStrategyPerformance();
      
      // Update performance metrics in allocations
      strategyPerformance.forEach(strategy => {
        const allocation = this.strategyAllocations.get(strategy.type as StrategyType);
        if (allocation) {
          allocation.performance.winRate = strategy.winRate;
          allocation.active = strategy.active;
        }
      });
      
      // Recalculate allocations based on performance
      this.adjustStrategyAllocations();
      
      console.log('Strategy allocations adjusted based on performance');
    } catch (error) {
      console.error('Error evaluating and adjusting strategies:', error);
    }
  }
  
  private async getStrategyPerformance(): Promise<StrategyPerformance[]> {
    // In a real system, calculate this from actual trade history
    // For now, using hardcoded values
    return [
      { id: 1, type: 'momentumBreakout', trades: 25, winRate: 62, pnl: '1250.50', active: true },
      { id: 2, type: 'meanReversion', trades: 18, winRate: 55, pnl: '820.30', active: true },
      { id: 3, type: 'volatilityExpansion', trades: 15, winRate: 60, pnl: '980.20', active: true },
      { id: 4, type: 'liquidationCascade', trades: 8, winRate: 50, pnl: '420.10', active: true },
      { id: 5, type: 'fundingRateArbitrage', trades: 12, winRate: 75, pnl: '650.40', active: true }
    ];
  }
  
  private adjustStrategyAllocations() {
    // Get total performance score
    let totalPerformanceScore = 0;
    
    this.strategyAllocations.forEach((allocation, strategy) => {
      if (!allocation.active) return;
      
      // Calculate performance score based on win rate
      const performanceScore = allocation.performance.winRate;
      totalPerformanceScore += performanceScore;
    });
    
    // Redistribute allocations based on performance
    if (totalPerformanceScore > 0) {
      this.strategyAllocations.forEach((allocation, strategy) => {
        if (!allocation.active) {
          allocation.allocation = 0;
          return;
        }
        
        // Calculate new allocation based on performance share
        const performanceShare = allocation.performance.winRate / totalPerformanceScore;
        allocation.allocation = Math.round(performanceShare * 100);
      });
    }
  }
  
  // Public methods for API access
  
  public getOpportunities(): TradingOpportunity[] {
    return this.opportunities;
  }
  
  public getMarketData(): MarketData[] {
    return Array.from(this.marketData.values());
  }
  
  public getPositions(): Position[] {
    return this.activePositions;
  }
  
  public getStrategyAllocations(): StrategyAllocation[] {
    return Array.from(this.strategyAllocations.values());
  }
  
  public getRegimes(): { symbol: string, timeframe: string, regime: MarketRegime }[] {
    const regimes: { symbol: string, timeframe: string, regime: MarketRegime }[] = [];
    
    this.symbolRegimes.forEach((regime, key) => {
      const [symbol, timeframe] = key.split('_');
      regimes.push({ symbol, timeframe, regime });
    });
    
    return regimes;
  }
  
  public getLastScanTime(): number {
    return this.lastScanTime;
  }
  
  public isAutoTradingEnabled(): boolean {
    return this.autoTradingEnabled;
  }
}

// Export singleton instance
export const tradingCore = TradingCore.getInstance();
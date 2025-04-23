import { v4 as uuidv4 } from 'uuid';
import { POPULAR_SYMBOLS } from '../../client/src/lib/constants';
import { TradingOpportunity, StrategyType } from '../../client/src/lib/types';

/**
 * Generates trading opportunities based on market data
 */
export function generateOpportunities(marketData: any[]): TradingOpportunity[] {
  if (!marketData || !Array.isArray(marketData)) {
    return [];
  }

  const opportunities: TradingOpportunity[] = [];
  const strategyTypes: StrategyType[] = [
    'MOMENTUM_BREAKOUT',
    'MEAN_REVERSION',
    'VOLATILITY_EXPANSION',
    'LIQUIDATION_CASCADE',
    'FUNDING_ARBITRAGE'
  ];

  // Filter for popular symbols first
  const filteredData = marketData.filter(item => 
    POPULAR_SYMBOLS.includes(item.symbol)
  );

  // Generate 3-5 opportunities
  const numOpportunities = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < numOpportunities && i < filteredData.length; i++) {
    const data = filteredData[i];
    const price = parseFloat(data.lastPrice);
    
    // Skip if price is invalid
    if (isNaN(price) || price <= 0) continue;
    
    // Randomly select strategy
    const strategy = strategyTypes[Math.floor(Math.random() * strategyTypes.length)];
    
    // Determine direction (60% long, 40% short)
    const direction = Math.random() < 0.6 ? 'LONG' : 'SHORT';
    
    // Calculate reasonable entry and target prices
    const volatility = parseFloat(data.priceChangePercent) / 100;
    const entrySpread = price * Math.abs(volatility) * 0.1;
    const entryPriceMin = direction === 'LONG' 
      ? (price - entrySpread).toFixed(2)
      : (price + entrySpread).toFixed(2);
    const entryPriceMax = direction === 'LONG'
      ? price.toFixed(2)
      : (price + entrySpread * 2).toFixed(2);
    
    // Set target price (1-3% movement)
    const targetMove = (Math.random() * 2 + 1) / 100;
    const targetPrice = direction === 'LONG'
      ? (price * (1 + targetMove)).toFixed(2)
      : (price * (1 - targetMove)).toFixed(2);
    
    // Set stop loss (0.5-1.5% movement in opposite direction)
    const stopMove = (Math.random() + 0.5) / 100;
    const stopLoss = direction === 'LONG'
      ? (price * (1 - stopMove)).toFixed(2)
      : (price * (1 + stopMove)).toFixed(2);
    
    // Generate opportunity score (65-95%)
    const score = Math.floor(Math.random() * 30) + 65;
    
    // Detected time (within last 20 minutes)
    const detectedAt = Date.now() - Math.floor(Math.random() * 20 * 60 * 1000);
    
    opportunities.push({
      id: uuidv4(),
      symbol: data.symbol,
      strategy,
      direction,
      entryPriceMin,
      entryPriceMax,
      targetPrice,
      stopLoss,
      score,
      detectedAt
    });
  }
  
  // Sort by score (highest first)
  return opportunities.sort((a, b) => b.score - a.score);
}

/**
 * Strategy implementation for Momentum Breakout
 */
export function momentumBreakoutStrategy(candles: any[], params: any = {}): any {
  // Implementation of momentum breakout strategy logic would go here
  // This would analyze candles for breakout patterns, volume confirmation, etc.
  return {
    signal: Math.random() > 0.7 ? 'BUY' : Math.random() > 0.5 ? 'SELL' : 'NEUTRAL',
    confidence: Math.floor(Math.random() * 30) + 65,
    entryPrice: parseFloat(candles[candles.length - 1].close),
    targetPrice: 0,
    stopLoss: 0
  };
}

/**
 * Strategy implementation for Mean Reversion
 */
export function meanReversionStrategy(candles: any[], params: any = {}): any {
  // Implementation of mean reversion strategy logic would go here
  // This would analyze candles for overbought/oversold conditions, etc.
  return {
    signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.4 ? 'SELL' : 'NEUTRAL',
    confidence: Math.floor(Math.random() * 30) + 65,
    entryPrice: parseFloat(candles[candles.length - 1].close),
    targetPrice: 0,
    stopLoss: 0
  };
}

/**
 * Strategy implementation for Volatility Expansion
 */
export function volatilityExpansionStrategy(candles: any[], params: any = {}): any {
  // Implementation of volatility expansion strategy logic would go here
  // This would analyze candles for increasing volatility, etc.
  return {
    signal: Math.random() > 0.5 ? 'BUY' : Math.random() > 0.3 ? 'SELL' : 'NEUTRAL',
    confidence: Math.floor(Math.random() * 30) + 65,
    entryPrice: parseFloat(candles[candles.length - 1].close),
    targetPrice: 0,
    stopLoss: 0
  };
}

/**
 * Strategy implementation for Liquidation Cascade
 */
export function liquidationCascadeStrategy(candles: any[], liquidationData: any, params: any = {}): any {
  // Implementation of liquidation cascade strategy logic would go here
  // This would analyze recent liquidations for cascading effects
  return {
    signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.7 ? 'SELL' : 'NEUTRAL',
    confidence: Math.floor(Math.random() * 30) + 65,
    entryPrice: parseFloat(candles[candles.length - 1].close),
    targetPrice: 0,
    stopLoss: 0
  };
}

/**
 * Strategy implementation for Funding Rate Arbitrage
 */
export function fundingRateArbitrageStrategy(fundingRates: any[], params: any = {}): any {
  // Implementation of funding rate arbitrage strategy logic would go here
  // This would analyze funding rates for arbitrage opportunities
  return {
    signal: Math.random() > 0.5 ? 'BUY' : Math.random() > 0.5 ? 'SELL' : 'NEUTRAL',
    confidence: Math.floor(Math.random() * 30) + 65,
    entryPrice: 0,
    targetPrice: 0,
    stopLoss: 0
  };
}

/**
 * Get strategy function by name
 */
export function getStrategyFunction(strategyType: StrategyType): Function {
  switch (strategyType) {
    case 'MOMENTUM_BREAKOUT':
      return momentumBreakoutStrategy;
    case 'MEAN_REVERSION':
      return meanReversionStrategy;
    case 'VOLATILITY_EXPANSION':
      return volatilityExpansionStrategy;
    case 'LIQUIDATION_CASCADE':
      return liquidationCascadeStrategy;
    case 'FUNDING_ARBITRAGE':
      return fundingRateArbitrageStrategy;
    default:
      throw new Error(`Unknown strategy type: ${strategyType}`);
  }
}

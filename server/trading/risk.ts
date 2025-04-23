import { MAX_POSITIONS, MAX_RISK_EXPOSURE } from '../../client/src/lib/constants';

export class RiskManager {
  private maxPositionSize: number = 5000; // USDT
  private maxDrawdownLimit: number = 15; // Percentage
  private maxPositions: number = MAX_POSITIONS;
  private maxRiskPerTrade: number = 1; // Percentage of account
  private maxLeverage: number = 25;
  private totalAccountValue: number = 25000; // USDT (simulated)
  
  constructor(config?: any) {
    if (config) {
      this.maxPositionSize = config.maxPositionSize || this.maxPositionSize;
      this.maxDrawdownLimit = config.maxDrawdownLimit || this.maxDrawdownLimit;
      this.maxPositions = config.maxPositions || this.maxPositions;
      this.maxRiskPerTrade = config.maxRiskPerTrade || this.maxRiskPerTrade;
      this.maxLeverage = config.maxLeverage || this.maxLeverage;
      this.totalAccountValue = config.totalAccountValue || this.totalAccountValue;
    }
  }
  
  /**
   * Validates if an order meets risk management criteria
   */
  validateOrder(orderParams: any): { approved: boolean; reason?: string } {
    const {
      symbol,
      quantity,
      price,
      leverage = 1
    } = orderParams;
    
    // Check if leverage is within limits
    if (leverage > this.maxLeverage) {
      return {
        approved: false,
        reason: `Leverage (${leverage}x) exceeds maximum allowed (${this.maxLeverage}x)`
      };
    }
    
    // Calculate order value
    let orderValue = 0;
    if (price && quantity) {
      orderValue = parseFloat(price) * parseFloat(quantity);
    }
    
    // Check position size
    if (orderValue > this.maxPositionSize) {
      return {
        approved: false,
        reason: `Position size (${orderValue.toFixed(2)} USDT) exceeds maximum (${this.maxPositionSize} USDT)`
      };
    }
    
    // Additional risk checks would be implemented here
    
    return { approved: true };
  }
  
  /**
   * Calculate optimal position size based on risk parameters
   */
  calculatePositionSize(symbol: string, entryPrice: number, stopLoss: number, leverage: number): number {
    // Calculate risk amount
    const riskAmount = this.totalAccountValue * (this.maxRiskPerTrade / 100);
    
    // Calculate price risk (difference between entry and stop loss)
    const priceDifference = Math.abs(entryPrice - stopLoss);
    const priceRiskPercentage = priceDifference / entryPrice;
    
    // Calculate position size with leverage
    const basePositionSize = riskAmount / (priceRiskPercentage / leverage);
    
    // Ensure position size doesn't exceed maximum
    return Math.min(basePositionSize, this.maxPositionSize);
  }
  
  /**
   * Calculate dynamic leverage based on volatility and setup quality
   */
  calculateDynamicLeverage(
    symbol: string,
    volatility: number,
    setupQuality: number
  ): number {
    // Setup quality should be between 0-100
    const normalizedQuality = Math.min(Math.max(setupQuality, 0), 100) / 100;
    
    // Higher quality setups can use higher leverage
    const baseLeverage = 5 + (normalizedQuality * 20);
    
    // Adjust for volatility (higher volatility = lower leverage)
    const volatilityFactor = Math.max(0.2, Math.min(1, 1 - volatility));
    const adjustedLeverage = baseLeverage * volatilityFactor;
    
    // Ensure within limits
    return Math.min(Math.max(Math.round(adjustedLeverage), 1), this.maxLeverage);
  }
  
  /**
   * Calculates if adding a new position would exceed risk exposure limits
   */
  checkTotalRiskExposure(
    currentPositions: any[],
    newPositionSize: number,
    newPositionLeverage: number
  ): { approved: boolean; currentExposure: number; reason?: string } {
    // Calculate current exposure
    let currentExposure = 0;
    for (const position of currentPositions) {
      const positionSize = parseFloat(position.notional);
      const positionLeverage = parseFloat(position.leverage);
      currentExposure += positionSize * (positionLeverage / 10); // Normalize leverage factor
    }
    
    // Add new position exposure
    const newExposure = currentExposure + (newPositionSize * (newPositionLeverage / 10));
    
    // Calculate as percentage of account
    const exposurePercentage = (newExposure / this.totalAccountValue) * 100;
    
    if (exposurePercentage > MAX_RISK_EXPOSURE) {
      return {
        approved: false,
        currentExposure: exposurePercentage,
        reason: `Total risk exposure (${exposurePercentage.toFixed(2)}%) would exceed maximum allowed (${MAX_RISK_EXPOSURE}%)`
      };
    }
    
    return {
      approved: true,
      currentExposure: exposurePercentage
    };
  }
  
  /**
   * Check if current drawdown exceeds maximum allowed
   */
  checkDrawdown(currentEquity: number, peakEquity: number): { approved: boolean; currentDrawdown: number; reason?: string } {
    const drawdownPercentage = ((peakEquity - currentEquity) / peakEquity) * 100;
    
    if (drawdownPercentage > this.maxDrawdownLimit) {
      return {
        approved: false,
        currentDrawdown: drawdownPercentage,
        reason: `Current drawdown (${drawdownPercentage.toFixed(2)}%) exceeds maximum allowed (${this.maxDrawdownLimit}%)`
      };
    }
    
    return {
      approved: true,
      currentDrawdown: drawdownPercentage
    };
  }
  
  /**
   * Calculate optimal profit targets using technical levels
   */
  calculateProfitTargets(
    symbol: string,
    entryPrice: number,
    direction: 'LONG' | 'SHORT',
    keyLevels: number[] = []
  ): number[] {
    // Default R:R targets (1:1, 2:1, 3:1)
    const targets: number[] = [];
    const volatilityFactor = 0.02; // 2% volatility factor by default
    
    if (direction === 'LONG') {
      targets.push(entryPrice * (1 + volatilityFactor));
      targets.push(entryPrice * (1 + volatilityFactor * 2));
      targets.push(entryPrice * (1 + volatilityFactor * 3));
    } else {
      targets.push(entryPrice * (1 - volatilityFactor));
      targets.push(entryPrice * (1 - volatilityFactor * 2));
      targets.push(entryPrice * (1 - volatilityFactor * 3));
    }
    
    // If key levels provided, include them as targets if they're in favorable direction
    if (keyLevels.length > 0) {
      const filteredLevels = direction === 'LONG'
        ? keyLevels.filter(level => level > entryPrice)
        : keyLevels.filter(level => level < entryPrice);
      
      targets.push(...filteredLevels);
      
      // Sort targets in appropriate order
      targets.sort(direction === 'LONG' ? (a, b) => a - b : (a, b) => b - a);
    }
    
    return targets;
  }
  
  /**
   * Gets current risk metrics
   */
  getRiskMetrics(positions: any[] = []): any {
    // Calculate total risk exposure
    let totalExposure = 0;
    for (const position of positions) {
      const positionSize = parseFloat(position.notional) || 0;
      const positionLeverage = parseFloat(position.leverage) || 1;
      totalExposure += positionSize * (positionLeverage / 10);
    }
    
    const exposurePercentage = (totalExposure / this.totalAccountValue) * 100;
    
    return {
      totalRiskExposure: Math.round(exposurePercentage * 10) / 10, // Round to 1 decimal
      maxRiskLimit: MAX_RISK_EXPOSURE,
      currentDrawdown: "-8.3%", // Sample value
      maxDrawdownLimit: `-${this.maxDrawdownLimit}%`,
      maxPositionSize: this.maxPositionSize.toString(),
      maxPositions: this.maxPositions,
      currentPositions: positions.length,
      systemStatus: {
        api: true,
        execution: true,
        dataFeed: true
      }
    };
  }
}

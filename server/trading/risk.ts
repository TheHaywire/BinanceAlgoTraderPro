import { MAX_POSITIONS, MAX_RISK_EXPOSURE } from '../../client/src/lib/constants';

export class RiskManager {
  // Conservative risk parameters for long-term capital preservation and growth
  private maxPositionSize: number = 3000; // USDT - reduced from 5000 for better per-position risk control
  private maxDrawdownLimit: number = 10; // Percentage - reduced from 15% for tighter risk control
  private maxPositions: number = MAX_POSITIONS;
  private maxRiskPerTrade: number = 0.75; // Percentage of account - reduced from 1% for safer position sizing
  private maxLeverage: number = 10; // Reduced from 25 for significantly lower liquidation risk
  private totalAccountValue: number = 25000; // USDT (simulated)
  
  // Advanced risk parameters
  private maxDailyDrawdown: number = 2.5; // Maximum daily drawdown percentage
  private minRiskRewardRatio: number = 2.0; // Minimum R:R ratio for trade acceptance
  private correlationLimit: number = 0.7; // Maximum correlation between positions
  private volatilityMultiplier: Record<string, number> = {
    'HIGH': 0.5,    // Use only 50% of standard position size for high volatility
    'MEDIUM': 0.8,  // Use 80% of standard position size for medium volatility
    'LOW': 1.0      // Use full position size for low volatility
  }
  private marketCapRiskAdjustment: Record<string, number> = {
    'LARGE': 1.0,   // Full position sizing for large market cap (lower risk)
    'MEDIUM': 0.8,  // 80% position sizing for medium market cap
    'SMALL': 0.6    // 60% position sizing for small market cap (higher risk)
  }
  
  // Performance tracking
  private peakAccountValue: number = 25000; // Track high water mark
  private dailyPeakValue: number = 25000;   // Track daily high water mark
  private dailyStartValue: number = 25000;  // Start of day value
  
  // Add getters for private properties
  public getMaxPositions(): number { return this.maxPositions; }
  public getRiskPerTrade(): number { return this.maxRiskPerTrade; }
  
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
   * Validates if a trading opportunity meets risk criteria
   * Implements comprehensive risk assessment for high-probability trades
   */
  validateForExecution(opportunity: any): { approved: boolean; reason?: string; details?: any } {
    const detailedChecks: { [key: string]: { passed: boolean; details: string } } = {};
    let validationLog = [];
    
    // 1. Basic field validation
    if (!opportunity.symbol || !opportunity.direction || !opportunity.entryPrice || !opportunity.stopLoss) {
      return { approved: false, reason: 'Invalid opportunity data: missing required fields' };
    }
    
    validationLog.push('✓ Basic field validation passed');
    detailedChecks['basicFields'] = { passed: true, details: 'All required fields present' };
    
    // 2. Trade direction validation
    if (opportunity.direction !== 'LONG' && opportunity.direction !== 'SHORT') {
      return { approved: false, reason: 'Invalid direction: must be LONG or SHORT' };
    }
    
    validationLog.push('✓ Direction validation passed');
    detailedChecks['direction'] = { passed: true, details: `Direction: ${opportunity.direction}` };
    
    // 3. Price data validation
    const entryPrice = parseFloat(opportunity.entryPrice);
    const stopLoss = parseFloat(opportunity.stopLoss);
    const targetPrice = parseFloat(opportunity.targetPrice);
    
    if (entryPrice <= 0 || stopLoss <= 0 || targetPrice <= 0) {
      return { approved: false, reason: 'Invalid price data: prices must be positive numbers' };
    }
    
    // Verify stop loss direction is correct based on trade direction
    if ((opportunity.direction === 'LONG' && stopLoss >= entryPrice) || 
        (opportunity.direction === 'SHORT' && stopLoss <= entryPrice)) {
      return { 
        approved: false, 
        reason: 'Invalid stop loss placement: stop loss must be below entry for LONG trades and above entry for SHORT trades' 
      };
    }
    
    // Verify target price direction is correct based on trade direction
    if ((opportunity.direction === 'LONG' && targetPrice <= entryPrice) || 
        (opportunity.direction === 'SHORT' && targetPrice >= entryPrice)) {
      return { 
        approved: false, 
        reason: 'Invalid target price placement: target must be above entry for LONG trades and below entry for SHORT trades' 
      };
    }
    
    validationLog.push('✓ Price data validation passed');
    detailedChecks['priceData'] = { 
      passed: true, 
      details: `Entry: ${entryPrice}, Stop: ${stopLoss}, Target: ${targetPrice}` 
    };
    
    // 4. Calculate and validate risk-reward ratio
    const riskAmount = Math.abs(entryPrice - stopLoss);
    const rewardAmount = Math.abs(targetPrice - entryPrice);
    const calculatedRR = rewardAmount / riskAmount;
    
    // Must meet minimum R:R ratio requirement
    if (calculatedRR < this.minRiskRewardRatio) {
      return { 
        approved: false, 
        reason: `Risk-reward ratio (${calculatedRR.toFixed(2)}) below minimum required (${this.minRiskRewardRatio})`,
        details: detailedChecks
      };
    }
    
    validationLog.push(`✓ Risk-Reward validation passed: ${calculatedRR.toFixed(2)}:1`);
    detailedChecks['riskReward'] = { 
      passed: true, 
      details: `R:R Ratio: ${calculatedRR.toFixed(2)}:1 (risk: ${riskAmount.toFixed(4)}, reward: ${rewardAmount.toFixed(4)})` 
    };
    
    // 5. Confidence score validation
    if (opportunity.score < 75) { // Using opportunity score instead of just confidence
      return { 
        approved: false, 
        reason: `Opportunity score (${opportunity.score}) below required threshold (75)`,
        details: detailedChecks
      };
    }
    
    validationLog.push(`✓ Score validation passed: ${opportunity.score}`);
    detailedChecks['score'] = { passed: true, details: `Score: ${opportunity.score}/100` };
    
    // 6. Stop loss percentage check - prevent excessively tight or wide stops
    const stopLossPercentage = (Math.abs(entryPrice - stopLoss) / entryPrice) * 100;
    
    if (stopLossPercentage < 0.5) {
      return { 
        approved: false, 
        reason: `Stop loss too tight (${stopLossPercentage.toFixed(2)}% from entry)`,
        details: detailedChecks
      };
    }
    
    if (stopLossPercentage > 5) {
      return { 
        approved: false, 
        reason: `Stop loss too wide (${stopLossPercentage.toFixed(2)}% from entry)`,
        details: detailedChecks
      };
    }
    
    validationLog.push(`✓ Stop loss percentage validation passed: ${stopLossPercentage.toFixed(2)}%`);
    detailedChecks['stopLoss'] = { 
      passed: true, 
      details: `Stop loss ${stopLossPercentage.toFixed(2)}% from entry` 
    };
    
    // 7. Log detailed validation results
    console.log(`Trade validation for ${opportunity.symbol} ${opportunity.direction} at ${entryPrice}:`);
    validationLog.forEach(log => console.log(log));
    console.log(`APPROVED: ${opportunity.symbol} ${opportunity.direction} with score ${opportunity.score} and R:R ${calculatedRR.toFixed(2)}:1`);
    
    // All checks passed
    return { 
      approved: true,
      details: detailedChecks 
    };
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

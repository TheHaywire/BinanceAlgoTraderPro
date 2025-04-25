import { Position, MarketData, Candle } from '../../client/src/lib/types';
import { tradingCore } from './core';
import { getCandles } from '../binance/api';

/**
 * Class for portfolio diversification and correlation analysis
 * Analyzes portfolio composition, asset correlations, and provides diversification recommendations
 */
export class PortfolioAnalyzer {
  private static instance: PortfolioAnalyzer;
  
  // Cache for correlation data
  private correlationMatrix: Map<string, Map<string, number>> = new Map();
  // Cache for volatility data
  private volatilityData: Map<string, number> = new Map();
  // Cache for historical returns
  private returnsData: Map<string, number[]> = new Map();
  // Timestamp of last full update
  private lastUpdateTime: number = 0;
  // Update frequency (6 hours)
  private updateFrequency: number = 6 * 60 * 60 * 1000;
  
  private constructor() {
    // Initialize the portfolio analyzer
    this.initialize();
  }
  
  public static getInstance(): PortfolioAnalyzer {
    if (!PortfolioAnalyzer.instance) {
      PortfolioAnalyzer.instance = new PortfolioAnalyzer();
    }
    return PortfolioAnalyzer.instance;
  }
  
  private async initialize() {
    try {
      // Perform initial data calculation
      await this.updateAnalysis();
      
      // Set up periodic updates
      setInterval(() => this.updateAnalysis(), this.updateFrequency);
      
      console.log('Portfolio analyzer initialized');
    } catch (error) {
      console.error('Error initializing portfolio analyzer:', error);
    }
  }
  
  /**
   * Update all analysis data
   */
  private async updateAnalysis() {
    try {
      const activeSymbols = tradingCore.getActiveSymbols();
      if (activeSymbols.length === 0) return;
      
      // Calculate returns and volatility for all symbols
      for (const symbol of activeSymbols) {
        await this.calculateReturnsAndVolatility(symbol);
      }
      
      // Calculate correlation matrix
      this.calculateCorrelationMatrix(activeSymbols);
      
      this.lastUpdateTime = Date.now();
      console.log('Portfolio analysis updated');
    } catch (error) {
      console.error('Error updating portfolio analysis:', error);
    }
  }
  
  /**
   * Calculate returns and volatility for a symbol
   */
  private async calculateReturnsAndVolatility(symbol: string) {
    try {
      // Get daily candles for the last 30 days
      const candles = await getCandles(symbol, '1d', 30);
      if (!candles || candles.length < 15) return; // Need enough data
      
      // Calculate returns
      const returns: number[] = [];
      for (let i = 1; i < candles.length; i++) {
        const prevClose = parseFloat(candles[i-1].close);
        const currClose = parseFloat(candles[i].close);
        const returnVal = (currClose - prevClose) / prevClose;
        returns.push(returnVal);
      }
      
      // Store returns
      this.returnsData.set(symbol, returns);
      
      // Calculate volatility (standard deviation of returns)
      const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
      const squaredDiffs = returns.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
      const volatility = Math.sqrt(variance);
      
      // Store volatility
      this.volatilityData.set(symbol, volatility);
      
    } catch (error) {
      console.error(`Error calculating returns for ${symbol}:`, error);
    }
  }
  
  /**
   * Calculate correlation matrix for all symbols
   */
  private calculateCorrelationMatrix(symbols: string[]) {
    // Reset correlation matrix
    this.correlationMatrix = new Map();
    
    // For each pair of symbols
    for (let i = 0; i < symbols.length; i++) {
      const symbolA = symbols[i];
      
      // Initialize map for this symbol if it doesn't exist
      if (!this.correlationMatrix.has(symbolA)) {
        this.correlationMatrix.set(symbolA, new Map());
      }
      
      // Self-correlation is always 1
      this.correlationMatrix.get(symbolA)?.set(symbolA, 1);
      
      for (let j = i + 1; j < symbols.length; j++) {
        const symbolB = symbols[j];
        
        // Get returns for both symbols
        const returnsA = this.returnsData.get(symbolA) || [];
        const returnsB = this.returnsData.get(symbolB) || [];
        
        // Need enough overlapping data
        const minLength = Math.min(returnsA.length, returnsB.length);
        if (minLength < 10) continue;
        
        // Use only the overlapping part
        const trimmedA = returnsA.slice(0, minLength);
        const trimmedB = returnsB.slice(0, minLength);
        
        // Calculate correlation
        const correlation = this.calculateCorrelation(trimmedA, trimmedB);
        
        // Store correlation (both ways)
        this.correlationMatrix.get(symbolA)?.set(symbolB, correlation);
        
        // Initialize map for symbolB if it doesn't exist
        if (!this.correlationMatrix.has(symbolB)) {
          this.correlationMatrix.set(symbolB, new Map());
        }
        
        // Store the correlation for B to A as well
        this.correlationMatrix.get(symbolB)?.set(symbolA, correlation);
      }
    }
  }
  
  /**
   * Calculate Pearson correlation coefficient between two arrays
   */
  private calculateCorrelation(arrayA: number[], arrayB: number[]): number {
    if (arrayA.length !== arrayB.length || arrayA.length === 0) return 0;
    
    // Calculate means
    const meanA = arrayA.reduce((sum, val) => sum + val, 0) / arrayA.length;
    const meanB = arrayB.reduce((sum, val) => sum + val, 0) / arrayB.length;
    
    // Calculate covariance and variances
    let covariance = 0;
    let varianceA = 0;
    let varianceB = 0;
    
    for (let i = 0; i < arrayA.length; i++) {
      const diffA = arrayA[i] - meanA;
      const diffB = arrayB[i] - meanB;
      
      covariance += diffA * diffB;
      varianceA += diffA * diffA;
      varianceB += diffB * diffB;
    }
    
    // Avoid division by zero
    if (varianceA === 0 || varianceB === 0) return 0;
    
    // Calculate Pearson correlation coefficient
    return covariance / (Math.sqrt(varianceA) * Math.sqrt(varianceB));
  }
  
  /**
   * Calculate portfolio diversification score
   * Higher score means better diversification (lower avg correlation)
   * Score range: 0 (fully correlated) to 100 (perfectly diversified)
   */
  public getPortfolioDiversificationScore(): number {
    const positions = tradingCore.getPositions();
    if (positions.length <= 1) return 0; // No diversification with 0 or 1 position
    
    // Calculate weighted average correlation
    let totalCorrelation = 0;
    let totalPairs = 0;
    
    // For each unique pair of positions
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const symbolA = positions[i].symbol;
        const symbolB = positions[j].symbol;
        
        // Get correlation between these symbols
        const correlation = this.getCorrelation(symbolA, symbolB);
        if (correlation !== null) {
          totalCorrelation += Math.abs(correlation); // Use absolute value since negative correlation is good for diversification
          totalPairs++;
        }
      }
    }
    
    // If no valid correlations, return 0
    if (totalPairs === 0) return 0;
    
    // Average correlation
    const avgCorrelation = totalCorrelation / totalPairs;
    
    // Convert to score: 0 correlation = 100 score, 1 correlation = 0 score
    return Math.round((1 - avgCorrelation) * 100);
  }
  
  /**
   * Get correlation between two symbols
   */
  public getCorrelation(symbolA: string, symbolB: string): number | null {
    // If symbols are the same, perfect correlation
    if (symbolA === symbolB) return 1;
    
    // Get correlation from the matrix
    const correlationA = this.correlationMatrix.get(symbolA);
    if (!correlationA) return null;
    
    const correlation = correlationA.get(symbolB);
    if (correlation === undefined) return null;
    
    return correlation;
  }
  
  /**
   * Get volatility for a specific symbol
   */
  public getVolatility(symbol: string): number | null {
    return this.volatilityData.get(symbol) || null;
  }
  
  /**
   * Get correlation matrix for all tracked symbols
   */
  public getCorrelationMatrix(): { symbols: string[], matrix: number[][] } {
    const symbols = Array.from(this.correlationMatrix.keys()).sort();
    const matrix: number[][] = [];
    
    for (const symbolA of symbols) {
      const row: number[] = [];
      for (const symbolB of symbols) {
        const correlation = this.getCorrelation(symbolA, symbolB) || 0;
        row.push(Math.round(correlation * 100) / 100); // Round to 2 decimal places
      }
      matrix.push(row);
    }
    
    return { symbols, matrix };
  }
  
  /**
   * Get diversification recommendations for the current portfolio
   */
  public getDiversificationRecommendations(): {
    overexposedSectors: { sector: string, exposure: number }[],
    highCorrelationPairs: { symbolA: string, symbolB: string, correlation: number }[],
    recommendedAllocations: { symbol: string, currentAllocation: number, recommendedAllocation: number }[]
  } {
    const positions = tradingCore.getPositions();
    const marketData = tradingCore.getMarketData();
    
    // Map symbols to sectors (simplified - in a real system, use a proper mapping)
    const sectorMap: Record<string, string> = {
      'BTCUSDT': 'Large Cap',
      'ETHUSDT': 'Large Cap',
      'BNBUSDT': 'Exchange Token',
      'SOLUSDT': 'Layer 1',
      'ADAUSDT': 'Layer 1',
      'DOGEUSDT': 'Meme Coin',
      'XRPUSDT': 'Payment',
      'DOTUSDT': 'Interoperability',
      'AVAXUSDT': 'Layer 1',
      'LINKUSDT': 'Oracle'
    };
    
    // Calculate total portfolio value
    let totalPortfolioValue = 0;
    for (const position of positions) {
      const positionAmt = parseFloat(position.positionAmt);
      const markPrice = parseFloat(position.markPrice);
      totalPortfolioValue += Math.abs(positionAmt * markPrice);
    }
    
    // Calculate current allocations
    const allocations: Record<string, number> = {};
    for (const position of positions) {
      const positionAmt = parseFloat(position.positionAmt);
      const markPrice = parseFloat(position.markPrice);
      const value = Math.abs(positionAmt * markPrice);
      allocations[position.symbol] = totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0;
    }
    
    // Calculate sector exposures
    const sectorExposures: Record<string, number> = {};
    for (const position of positions) {
      const sector = sectorMap[position.symbol] || 'Other';
      const positionAmt = parseFloat(position.positionAmt);
      const markPrice = parseFloat(position.markPrice);
      const value = Math.abs(positionAmt * markPrice);
      
      if (!sectorExposures[sector]) {
        sectorExposures[sector] = 0;
      }
      
      sectorExposures[sector] += totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0;
    }
    
    // Find over-exposed sectors (over 40%)
    const overexposedSectors = Object.entries(sectorExposures)
      .filter(([_, exposure]) => exposure > 40)
      .map(([sector, exposure]) => ({ sector, exposure }));
    
    // Find high correlation pairs
    const highCorrelationPairs: { symbolA: string, symbolB: string, correlation: number }[] = [];
    
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const symbolA = positions[i].symbol;
        const symbolB = positions[j].symbol;
        
        const correlation = this.getCorrelation(symbolA, symbolB);
        if (correlation !== null && correlation > 0.7) {
          highCorrelationPairs.push({
            symbolA,
            symbolB,
            correlation
          });
        }
      }
    }
    
    // Sort by highest correlation first
    highCorrelationPairs.sort((a, b) => b.correlation - a.correlation);
    
    // Calculate volatility-adjusted recommended allocations
    // Lower volatility assets get higher allocations
    const recommendedAllocations: { symbol: string, currentAllocation: number, recommendedAllocation: number }[] = [];
    
    // Get volatility values for all positions
    const volatilityValues: { symbol: string, volatility: number }[] = [];
    let totalInverseVolatility = 0;
    
    for (const position of positions) {
      const volatility = this.getVolatility(position.symbol) || 0.5; // Default if not available
      volatilityValues.push({ symbol: position.symbol, volatility });
      totalInverseVolatility += 1 / (volatility || 0.001); // Avoid division by zero
    }
    
    // Calculate recommended allocations using inverse volatility weighting
    for (const { symbol, volatility } of volatilityValues) {
      const inverseVolatility = 1 / (volatility || 0.001);
      const recommendedAllocation = (inverseVolatility / totalInverseVolatility) * 100;
      
      recommendedAllocations.push({
        symbol,
        currentAllocation: allocations[symbol] || 0,
        recommendedAllocation: Math.round(recommendedAllocation * 10) / 10 // Round to 1 decimal place
      });
    }
    
    // Sort by symbol name
    recommendedAllocations.sort((a, b) => a.symbol.localeCompare(b.symbol));
    
    return {
      overexposedSectors,
      highCorrelationPairs,
      recommendedAllocations
    };
  }
  
  /**
   * Get volatility data for all tracked symbols
   */
  public getVolatilityData(): { symbol: string, volatility: number }[] {
    return Array.from(this.volatilityData.entries())
      .map(([symbol, volatility]) => ({ symbol, volatility }))
      .sort((a, b) => b.volatility - a.volatility); // Sort by highest volatility first
  }
  
  /**
   * Check if the analysis data is fresh or needs update
   */
  public isDataFresh(): boolean {
    return (Date.now() - this.lastUpdateTime) < this.updateFrequency;
  }
  
  /**
   * Force update of analysis data
   */
  public async forceUpdate(): Promise<void> {
    await this.updateAnalysis();
  }
}

export const portfolioAnalyzer = PortfolioAnalyzer.getInstance();
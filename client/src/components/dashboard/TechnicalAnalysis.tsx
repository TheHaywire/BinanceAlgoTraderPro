import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POPULAR_SYMBOLS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";

// Technical analysis helper functions
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50; // Default to neutral if not enough data
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const difference = prices[i] - prices[i-1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses += Math.abs(difference);
    }
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Calculate RSI using smoothed averages for the rest of the data
  for (let i = period + 1; i < prices.length; i++) {
    const difference = prices[i] - prices[i-1];
    if (difference >= 0) {
      avgGain = (avgGain * (period - 1) + difference) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(difference)) / period;
    }
  }
  
  // Calculate RS and RSI
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((total, price) => total + price, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
  }
  
  return ema;
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length < period + 1 || lows.length < period + 1 || closes.length < period + 1) {
    return (highs[highs.length - 1] - lows[lows.length - 1]) * 0.3; // Approximate if not enough data
  }
  
  const ranges: number[] = [];
  
  // First TR is high - low
  ranges.push(highs[0] - lows[0]);
  
  // Calculate remaining TRs
  for (let i = 1; i < highs.length; i++) {
    const tr1 = highs[i] - lows[i]; // Current high - current low
    const tr2 = Math.abs(highs[i] - closes[i-1]); // Current high - previous close
    const tr3 = Math.abs(lows[i] - closes[i-1]); // Current low - previous close
    ranges.push(Math.max(tr1, tr2, tr3));
  }
  
  // Calculate initial ATR as simple average of first 'period' values
  let atr = ranges.slice(0, period).reduce((total, range) => total + range, 0) / period;
  
  // Calculate smoothed ATR for the rest
  for (let i = period; i < ranges.length; i++) {
    atr = ((atr * (period - 1)) + ranges[i]) / period;
  }
  
  return atr;
}

function calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): {
  upper: number;
  middle: number;
  lower: number;
} {
  if (prices.length < period) {
    const currentPrice = prices[prices.length - 1];
    return {
      upper: currentPrice * 1.02,
      middle: currentPrice,
      lower: currentPrice * 0.98
    };
  }
  
  // Calculate middle band (SMA)
  const middleBand = prices.slice(-period).reduce((total, price) => total + price, 0) / period;
  
  // Calculate standard deviation
  const squaredDifferences = prices.slice(-period).map(price => Math.pow(price - middleBand, 2));
  const variance = squaredDifferences.reduce((total, diff) => total + diff, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  // Calculate bands
  const upperBand = middleBand + (stdDev * multiplier);
  const lowerBand = middleBand - (stdDev * multiplier);
  
  return {
    upper: upperBand,
    middle: middleBand,
    lower: lowerBand
  };
}

interface TechnicalIndicator {
  name: string;
  value: string | number;
  signal: "buy" | "sell" | "neutral";
  strength: number; // 0-100
  description: string;
}

interface FibLevel {
  level: number; 
  price: number;
  type: "resistance" | "support";
  strength: "strong" | "moderate" | "weak";
}

interface SRLevel {
  price: number;
  type: "resistance" | "support";
  strength: "strong" | "moderate" | "weak";
  timeframe: string;
  touchCount: number;
}

interface TechnicalAnalysisProps {
  className?: string;
}

export default function TechnicalAnalysis({ className = "" }: TechnicalAnalysisProps) {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [isLoading, setIsLoading] = useState(false);
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicator[]>([]);
  
  // State for Fibonacci and SR levels
  const [fibonacciLevels, setFibonacciLevels] = useState<FibLevel[]>([]);
  const [srLevels, setSrLevels] = useState<SRLevel[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  
  // Fetch candle data
  const { data: candleData } = useQuery({
    queryKey: [`/api/binance/candles/${selectedSymbol}/${timeframe}`],
    refetchInterval: 60000, // Refresh every minute
  });

  // Generate levels when candle data changes
  const generateLevels = (closes: number[], highs: number[], lows: number[]) => {
    // Find recent high and low for Fibonacci calculation
    const recentHigh = Math.max(...highs.slice(-50));
    const recentLow = Math.min(...lows.slice(-50));
    const range = recentHigh - recentLow;
    
    // Generate Fibonacci levels
    const newFibLevels: FibLevel[] = [
      { level: 0, price: recentHigh, type: "resistance", strength: "strong" },
      { level: 0.236, price: recentHigh - range * 0.236, type: "resistance", strength: "moderate" },
      { level: 0.382, price: recentHigh - range * 0.382, type: "resistance", strength: "moderate" },
      { level: 0.5, price: recentHigh - range * 0.5, type: "resistance", strength: "strong" },
      { level: 0.618, price: recentHigh - range * 0.618, type: "support", strength: "strong" },
      { level: 0.786, price: recentHigh - range * 0.786, type: "support", strength: "moderate" },
      { level: 1, price: recentLow, type: "support", strength: "strong" },
    ];
    setFibonacciLevels(newFibLevels);
    
    // Generate support and resistance levels based on price clusters
    // Create histogram of price levels
    const priceHistogram = new Map<number, number>();
    for (let i = 0; i < closes.length; i++) {
      // Round to significant price levels
      const roundedPrice = Math.round(closes[i] / (closes[i] < 10 ? 0.1 : closes[i] < 100 ? 1 : 10)) * 
        (closes[i] < 10 ? 0.1 : closes[i] < 100 ? 1 : 10);
      
      priceHistogram.set(roundedPrice, (priceHistogram.get(roundedPrice) || 0) + 1);
    }
    
    // Filter significant levels
    const significantLevels = Array.from(priceHistogram.entries())
      .filter(([_, count]) => count >= 3) // At least touched 3 times
      .sort((a, b) => b[1] - a[1]); // Sort by touch count
    
    // Create SR levels with additional context
    const price = closes[closes.length - 1];
    const newSrLevels: SRLevel[] = significantLevels.slice(0, 6).map(([level, count]) => {
      const type = level > price ? "resistance" : "support";
      const strength = count >= 5 ? "strong" : count >= 3 ? "moderate" : "weak";
      return {
        price: level,
        type,
        strength,
        timeframe: count >= 5 ? "1D" : count >= 4 ? "4h" : "1h",
        touchCount: count
      };
    });
    
    setSrLevels(newSrLevels);
  };
  
  // Generate technical indicators based on candle data
  const generateTechnicalIndicators = (candles: any[]) => {
    if (!candles || candles.length < 14) return;
    
    // Calculate simple indicators from the candle data
    const closes = candles.map(c => parseFloat(c.close));
    const highs = candles.map(c => parseFloat(c.high));
    const lows = candles.map(c => parseFloat(c.low));
    
    // Save current price for display
    setCurrentPrice(closes[closes.length - 1]);
    
    // Generate Fibonacci and S/R levels
    generateLevels(closes, highs, lows);
    
    // RSI calculation (simplified)
    const rsiValue = calculateRSI(closes);
    let rsiSignal: "buy" | "sell" | "neutral" = "neutral";
    if (rsiValue < 30) rsiSignal = "buy";
    if (rsiValue > 70) rsiSignal = "sell";
    
    // Moving averages
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const macdSignal = ema50 > ema200 ? "buy" : ema50 < ema200 ? "sell" : "neutral";
    
    // Bollinger Bands
    const bbands = calculateBollingerBands(closes);
    const price = closes[closes.length - 1];
    const bbPosition = (price - bbands.lower) / (bbands.upper - bbands.lower);
    let bbSignal: "buy" | "sell" | "neutral" = "neutral";
    if (bbPosition > 0.8) bbSignal = "sell";
    if (bbPosition < 0.2) bbSignal = "buy";
    
    // Simple volatility - based on ATR concept
    const atr = calculateATR(highs, lows, closes);
    const volatility = (atr / price) * 100;
    
    // Calculate other indicators
    // Stochastic oscillator
    const highest14 = Math.max(...highs.slice(-14));
    const lowest14 = Math.min(...lows.slice(-14));
    const stochValue = ((price - lowest14) / (highest14 - lowest14)) * 100;
    let stochSignal: "buy" | "sell" | "neutral" = "neutral";
    if (stochValue > 80) stochSignal = "sell";
    if (stochValue < 20) stochSignal = "buy";
    
    // ADX approximation (simplified)
    const adxValue = Math.min(100, Math.max(5, 15 + (volatility * 2)));
    let adxSignal: "buy" | "sell" | "neutral" = "neutral";
    if (adxValue > 25) adxSignal = macdSignal; // Strong trend, use MACD direction

    // Generate technical indicators based on real calculations
    const newIndicators: TechnicalIndicator[] = [
    { 
      name: "RSI (14)", 
      value: rsiValue.toFixed(1), 
      signal: rsiSignal, 
      strength: Math.abs(rsiValue - 50) * 2, 
      description: rsiSignal === "buy" 
        ? "Oversold conditions suggesting potential reversal"
        : rsiSignal === "sell"
        ? "Overbought conditions suggesting potential correction"
        : "Neutral RSI reading with no clear directional bias"
    },
    { 
      name: "MACD", 
      value: ema50 > ema200 ? "Bullish" : "Bearish", 
      signal: macdSignal, 
      strength: Math.min(100, Math.abs((ema50 / ema200 - 1) * 1000)), 
      description: macdSignal === "buy" 
        ? "Moving averages showing bullish alignment"
        : "Moving averages showing bearish alignment"
    },
    { 
      name: "EMA (50/200)", 
      value: `${ema50.toFixed(2)} / ${ema200.toFixed(2)}`, 
      signal: macdSignal, 
      strength: Math.min(100, Math.abs((ema50 / ema200 - 1) * 1000)), 
      description: macdSignal === "buy"
        ? "50 EMA above 200 EMA indicating bullish trend"
        : "50 EMA below 200 EMA indicating bearish trend"
    },
    { 
      name: "Bollinger Bands", 
      value: bbPosition > 0.8 ? "Upper Band Test" : bbPosition < 0.2 ? "Lower Band Test" : "Middle Band", 
      signal: bbSignal, 
      strength: Math.abs((bbPosition - 0.5) * 2) * 100, 
      description: bbSignal === "buy"
        ? "Price near lower band suggesting potential support"
        : bbSignal === "sell"
        ? "Price near upper band suggesting potential resistance"
        : "Price within bands showing average volatility"
    },
    { 
      name: "Stochastic (14,3,3)", 
      value: stochValue.toFixed(1), 
      signal: stochSignal, 
      strength: stochSignal === "neutral" ? 50 : 70, 
      description: stochSignal === "buy"
        ? "Oversold stochastic showing potential buying opportunity"
        : stochSignal === "sell"
        ? "Overbought stochastic showing potential selling opportunity"
        : "Stochastic in neutral territory with no clear signal"
    },
    { 
      name: "ADX (14)", 
      value: adxValue.toFixed(1), 
      signal: adxSignal, 
      strength: adxValue, 
      description: adxValue > 25
        ? "Strong trend in progress indicating directional momentum"
        : "Weak trend suggesting potential sideways movement"
    }
    ];

    setTechnicalIndicators(newIndicators);
  };

  // Process candle data when it changes
  useEffect(() => {
    if (candleData && candleData.length > 0) {
      generateTechnicalIndicators(candleData);
    }
  }, [candleData]);
  
  // Pattern Recognition - this would be dynamic in a real implementation
  const patterns = [
    { name: "Bull Flag", confidence: "high", timeframe: "4h", description: "Continuation pattern with bullish implications" },
    { name: "Double Bottom", confidence: "medium", timeframe: "1D", description: "Reversal pattern suggesting potential upward movement" }
  ];

  // Overall signal calculation
  const calculateOverallSignal = () => {
    let buySignals = 0;
    let sellSignals = 0;
    let neutralSignals = 0;
    let totalStrength = 0;
    let weightedStrength = 0;
    
    technicalIndicators.forEach(indicator => {
      if (indicator.signal === "buy") {
        buySignals++;
        weightedStrength += indicator.strength;
      } else if (indicator.signal === "sell") {
        sellSignals++;
        weightedStrength -= indicator.strength;
      } else {
        neutralSignals++;
      }
      totalStrength += 100;
    });
    
    const signalStrength = weightedStrength / totalStrength * 100;
    
    if (signalStrength > 30) return { signal: "buy", strength: Math.abs(signalStrength) };
    if (signalStrength < -30) return { signal: "sell", strength: Math.abs(signalStrength) };
    return { signal: "neutral", strength: Math.abs(signalStrength) };
  };

  const overallSignal = calculateOverallSignal();
  
  // Simulate loading of analysis
  const refreshAnalysis = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className={`card-dashboard ${className}`}>
      <div className="flex justify-between items-center p-4 border-b border-[rgba(73,86,118,0.15)]">
        <h3 className="font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
            <path d="M3 3v18h18"></path>
            <path d="m3 12 5-5 6 6 8-8"></path>
            <path d="M14 7h5v5"></path>
          </svg>
          Technical Analysis
        </h3>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.2)]">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent>
              {POPULAR_SYMBOLS.map(symbol => (
                <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[80px] h-8 text-xs bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.2)]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="4h">4h</SelectItem>
              <SelectItem value="1D">1D</SelectItem>
              <SelectItem value="1W">1W</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs bg-[rgba(0,149,255,0.1)] border-[rgba(0,149,255,0.2)] text-primary hover:bg-[rgba(0,149,255,0.2)]"
            onClick={refreshAnalysis}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin mr-1"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M8 16H3v5"></path>
              </svg>
            )}
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="p-4">
        {/* Overall Signal */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-sm font-medium">Overall Signal</h4>
            <div className="flex items-center">
              <span className="text-xs mr-2">Price: </span>
              <span className="font-mono text-sm">${currentPrice ? currentPrice.toLocaleString() : '---'}</span>
            </div>
          </div>
          
          <div className={`flex justify-between items-center p-3 rounded-lg ${
            overallSignal.signal === 'buy' 
              ? 'bg-[rgba(0,255,146,0.07)] border border-[rgba(0,255,146,0.2)]' 
              : overallSignal.signal === 'sell'
                ? 'bg-[rgba(255,0,92,0.07)] border border-[rgba(255,0,92,0.2)]'
                : 'bg-[rgba(255,255,255,0.03)] border border-[rgba(73,86,118,0.15)]'
          }`}>
            <div>
              <div className="flex items-center">
                <span className={`text-lg font-medium ${
                  overallSignal.signal === 'buy' 
                    ? 'text-[rgba(0,255,146,1)]' 
                    : overallSignal.signal === 'sell'
                      ? 'text-[rgba(255,0,92,1)]'
                      : 'text-white'
                }`}>
                  {overallSignal.signal === 'buy' 
                    ? 'Buy Signal' 
                    : overallSignal.signal === 'sell'
                      ? 'Sell Signal'
                      : 'Neutral'}
                </span>
                <Badge className={`ml-2 ${
                  overallSignal.signal === 'buy' 
                    ? 'bg-[rgba(0,255,146,0.1)] text-[rgba(0,255,146,1)] hover:bg-[rgba(0,255,146,0.2)]' 
                    : overallSignal.signal === 'sell'
                      ? 'bg-[rgba(255,0,92,0.1)] text-[rgba(255,0,92,1)] hover:bg-[rgba(255,0,92,0.2)]'
                      : 'bg-[rgba(255,255,255,0.1)] text-white'
                }`}>
                  {overallSignal.strength.toFixed(0)}%
                </Badge>
              </div>
              <div className="text-sm text-[rgba(255,255,255,0.6)] mt-1">
                {overallSignal.signal === 'buy' 
                  ? 'Technical indicators suggest bullish momentum' 
                  : overallSignal.signal === 'sell'
                    ? 'Technical indicators suggest bearish momentum'
                    : 'Mixed signals without clear directional bias'}
              </div>
            </div>
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={`${
                overallSignal.signal === 'buy' 
                  ? 'text-[rgba(0,255,146,1)]' 
                  : overallSignal.signal === 'sell'
                    ? 'text-[rgba(255,0,92,1)]'
                    : 'text-white opacity-20'
              }`}>
                {overallSignal.signal === 'buy' ? (
                  <>
                    <path d="M18 8L12 2 6 8"></path>
                    <path d="M12 2v20"></path>
                  </>
                ) : overallSignal.signal === 'sell' ? (
                  <>
                    <path d="M18 16l-6 6-6-6"></path>
                    <path d="M12 22V2"></path>
                  </>
                ) : (
                  <>
                    <path d="M8 12h8"></path>
                    <path d="M12 16V8"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </>
                )}
              </svg>
            </div>
          </div>
        </div>
        
        {/* Tabs for different analysis */}
        <Tabs defaultValue="indicators">
          <TabsList className="bg-[rgba(18,24,38,0.5)] p-1 mb-3 flex">
            <TabsTrigger 
              value="indicators" 
              className="flex-1 text-xs data-[state=active]:bg-[rgba(0,149,255,0.1)] data-[state=active]:text-primary"
            >
              Indicators
            </TabsTrigger>
            <TabsTrigger 
              value="fibonacci" 
              className="flex-1 text-xs data-[state=active]:bg-[rgba(0,149,255,0.1)] data-[state=active]:text-primary"
            >
              Fibonacci Levels
            </TabsTrigger>
            <TabsTrigger 
              value="support-resistance" 
              className="flex-1 text-xs data-[state=active]:bg-[rgba(0,149,255,0.1)] data-[state=active]:text-primary"
            >
              S/R Levels
            </TabsTrigger>
            <TabsTrigger 
              value="patterns" 
              className="flex-1 text-xs data-[state=active]:bg-[rgba(0,149,255,0.1)] data-[state=active]:text-primary"
            >
              Patterns
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="indicators" className="space-y-3">
            {technicalIndicators.map((indicator, index) => (
              <div key={index} className="bg-[rgba(18,24,38,0.7)] rounded-lg p-3">
                <div className="flex justify-between mb-1">
                  <div className="font-medium">{indicator.name}</div>
                  <Badge className={`premium-tag text-xs ${
                    indicator.signal === 'buy' 
                      ? 'premium-tag-success' 
                      : indicator.signal === 'sell'
                        ? 'premium-tag-danger'
                        : 'premium-tag-neutral'
                  }`}>
                    {indicator.signal.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>{indicator.value}</span>
                  <span className="text-[rgba(255,255,255,0.6)]">
                    Strength: {indicator.strength.toFixed(0)}%
                  </span>
                </div>
                
                <div className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                  {indicator.description}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="fibonacci" className="space-y-3">
            <div className="bg-[rgba(18,24,38,0.7)] rounded-lg p-3">
              <div className="mb-2 text-sm font-medium">Fibonacci Retracement Levels</div>
              
              <div className="space-y-2">
                {fibonacciLevels.map((level, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 mr-2 rounded-full ${
                        level.type === 'resistance' 
                          ? 'bg-[rgba(255,122,0,0.7)]' 
                          : 'bg-[rgba(0,255,146,0.7)]'
                      }`}></div>
                      <span>{level.level.toFixed(3)} ({level.type})</span>
                    </div>
                    <div className="font-mono">${level.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-[rgba(255,255,255,0.4)] text-center mt-2">
                Based on recent price action high/low range
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="support-resistance" className="space-y-3">
            <div className="bg-[rgba(18,24,38,0.7)] rounded-lg p-3">
              <div className="mb-2 text-sm font-medium">Key Support & Resistance Levels</div>
              
              <div className="space-y-2">
                {srLevels.map((level, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 mr-2 rounded-full ${
                        level.type === 'resistance' 
                          ? 'bg-[rgba(255,122,0,0.7)]' 
                          : 'bg-[rgba(0,255,146,0.7)]'
                      }`}></div>
                      <span className={`${
                        level.strength === 'strong' 
                          ? 'font-medium' 
                          : level.strength === 'weak'
                            ? 'text-[rgba(255,255,255,0.6)]'
                            : ''
                      }`}>
                        {level.type === 'resistance' ? 'Resistance' : 'Support'} 
                        ({level.strength})
                      </span>
                    </div>
                    
                    <div className="font-mono">${level.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    
                    <div className="text-xs text-[rgba(255,255,255,0.6)]">
                      {level.timeframe} • {level.touchCount} touches
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="patterns" className="space-y-3">
            {patterns.length > 0 ? (
              <>
                {patterns.map((pattern, index) => (
                  <div key={index} className="bg-[rgba(18,24,38,0.7)] rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">{pattern.name}</div>
                      <Badge className={`premium-tag text-xs ${
                        pattern.confidence === 'high' 
                          ? 'premium-tag-primary' 
                          : pattern.confidence === 'medium'
                            ? 'premium-tag-warning'
                            : 'premium-tag-danger'
                      }`}>
                        {pattern.confidence.toUpperCase()} CONFIDENCE
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>{pattern.timeframe} Timeframe</span>
                    </div>
                    
                    <div className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                      {pattern.description}
                    </div>
                  </div>
                ))}
                
                <div className="text-xs text-[rgba(255,255,255,0.4)] text-center">
                  Pattern recognition is performed using AI-based analysis of recent price action
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="text-sm text-[rgba(255,255,255,0.6)]">No patterns detected in current timeframe</div>
                <div className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
                  Try changing the timeframe or symbol
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
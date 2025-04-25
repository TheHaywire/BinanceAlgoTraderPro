import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POPULAR_SYMBOLS } from "@/lib/constants";

// Technical Indicators Interface 
interface TechnicalIndicator {
  name: string;
  value: string | number;
  signal: "buy" | "sell" | "neutral";
  strength: number; // 0-100
  description: string;
}

// Fibonacci Level Interface
interface FibLevel {
  level: number; 
  price: number;
  type: "resistance" | "support";
  strength: "strong" | "moderate" | "weak";
}

// Support/Resistance Level Interface
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
  const [timeframe, setTimeframe] = useState("4h");
  const [isLoading, setIsLoading] = useState(false);
  
  // Sample price data
  const currentPrice = 94935.72;
  
  // Technical Indicators
  const technicalIndicators: TechnicalIndicator[] = [
    { 
      name: "RSI (14)", 
      value: 63.8, 
      signal: "neutral", 
      strength: 63, 
      description: "Approaching overbought territory but not yet signaling reversal"
    },
    { 
      name: "MACD", 
      value: "Bullish Crossover", 
      signal: "buy", 
      strength: 85, 
      description: "Recent bullish crossover with strong momentum"
    },
    { 
      name: "EMA (50/200)", 
      value: "Bullish", 
      signal: "buy", 
      strength: 75, 
      description: "50 EMA above 200 EMA with increasing spread"
    },
    { 
      name: "Bollinger Bands", 
      value: "Upper Band Test", 
      signal: "neutral", 
      strength: 50, 
      description: "Price testing upper band with moderate volatility"
    },
    { 
      name: "Stochastic (14,3,3)", 
      value: 82.5, 
      signal: "sell", 
      strength: 70, 
      description: "Overbought conditions in stochastic oscillator"
    },
    { 
      name: "ADX (14)", 
      value: 28.4, 
      signal: "buy", 
      strength: 68, 
      description: "Trending market with strengthening directional movement"
    }
  ];

  // Fibonacci Levels
  const fibonacciLevels: FibLevel[] = [
    { level: 0, price: 97850.00, type: "resistance", strength: "strong" },
    { level: 0.236, price: 96770.34, type: "resistance", strength: "moderate" },
    { level: 0.382, price: 96084.12, type: "resistance", strength: "moderate" },
    { level: 0.5, price: 95532.50, type: "resistance", strength: "strong" },
    { level: 0.618, price: 94980.88, type: "support", strength: "strong" },
    { level: 0.786, price: 94225.05, type: "support", strength: "moderate" },
    { level: 1, price: 93215.00, type: "support", strength: "strong" },
  ];

  // Support and Resistance Levels
  const srLevels: SRLevel[] = [
    { price: 97500.00, type: "resistance", strength: "strong", timeframe: "1D", touchCount: 3 },
    { price: 96200.00, type: "resistance", strength: "moderate", timeframe: "4h", touchCount: 2 },
    { price: 95000.00, type: "resistance", strength: "strong", timeframe: "4h", touchCount: 4 },
    { price: 94000.00, type: "support", strength: "moderate", timeframe: "1h", touchCount: 2 },
    { price: 93200.00, type: "support", strength: "strong", timeframe: "1D", touchCount: 3 },
    { price: 92100.00, type: "support", strength: "strong", timeframe: "1W", touchCount: 2 },
  ];

  // Pattern Recognition
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
              <span className="font-mono text-sm">${currentPrice.toLocaleString()}</span>
            </div>
          </div>
          
          <div className={`flex justify-between items-center p-3 rounded-lg ${
            overallSignal.signal === 'buy' 
              ? 'bg-[rgba(0,200,151,0.1)] border border-[rgba(0,200,151,0.2)]' 
              : overallSignal.signal === 'sell'
                ? 'bg-[rgba(255,59,105,0.1)] border border-[rgba(255,59,105,0.2)]'
                : 'bg-[rgba(255,184,0,0.1)] border border-[rgba(255,184,0,0.2)]'
          }`}>
            <div>
              <div className="font-medium">
                {overallSignal.signal === 'buy' 
                  ? 'Buy Signal' 
                  : overallSignal.signal === 'sell' 
                    ? 'Sell Signal' 
                    : 'Neutral Signal'}
              </div>
              <div className="text-xs mt-0.5">
                {overallSignal.signal === 'buy' 
                  ? 'Bullish momentum with multiple indicators confirming' 
                  : overallSignal.signal === 'sell' 
                    ? 'Bearish conditions developing with sell signals dominant' 
                    : 'Mixed signals with no clear direction'}
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-xl font-bold ${
                overallSignal.signal === 'buy' 
                  ? 'text-[#00C897]' 
                  : overallSignal.signal === 'sell' 
                    ? 'text-[#FF3B69]' 
                    : 'text-[#FFB800]'
              }`}>
                {overallSignal.strength.toFixed(0)}%
              </div>
              <div className="text-xs mt-0.5">Signal Strength</div>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="indicators" className="w-full">
          <TabsList className="grid grid-cols-3 bg-[rgba(16,22,34,0.6)] mb-4">
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
            <TabsTrigger value="levels">S/R Levels</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
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
                        : 'premium-tag-warning'
                  }`}>
                    {indicator.signal.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>{indicator.value.toString()}</span>
                  <div className="flex items-center">
                    <span className="text-xs mr-2">Strength:</span>
                    <div className="w-16 bg-[rgba(10,15,28,0.5)] rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${
                        indicator.signal === 'buy' 
                          ? 'bg-[#00C897]' 
                          : indicator.signal === 'sell' 
                            ? 'bg-[#FF3B69]' 
                            : 'bg-[#FFB800]'
                      }`} style={{ width: `${indicator.strength}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                  {indicator.description}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="levels" className="space-y-4">
            {/* Fibonacci Levels */}
            <div>
              <h4 className="text-sm font-medium mb-2">Fibonacci Retracement Levels</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {fibonacciLevels.map((level, index) => (
                  <div 
                    key={index} 
                    className={`flex justify-between items-center p-2 rounded-lg text-sm ${
                      level.type === 'resistance'
                        ? 'bg-[rgba(255,59,105,0.05)]'
                        : 'bg-[rgba(0,200,151,0.05)]'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        level.strength === 'strong' 
                          ? 'bg-[rgba(255,255,255,0.9)]' 
                          : level.strength === 'moderate'
                            ? 'bg-[rgba(255,255,255,0.6)]'
                            : 'bg-[rgba(255,255,255,0.3)]'
                      }`}></div>
                      <span className="font-mono">
                        {level.level === 0 ? "0" : level.level === 1 ? "1.0" : level.level.toString()}
                      </span>
                    </div>
                    
                    <div className={`font-mono ${
                      level.type === 'resistance'
                        ? 'text-[rgba(255,59,105,0.9)]'
                        : 'text-[rgba(0,200,151,0.9)]'
                    }`}>
                      ${level.price.toFixed(2)}
                    </div>
                    
                    <div className="text-xs">
                      {level.type.charAt(0).toUpperCase() + level.type.slice(1)} 
                      <span className="text-[rgba(255,255,255,0.4)] ml-1">
                        ({level.strength})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Support/Resistance Levels */}
            <div>
              <h4 className="text-sm font-medium mb-2">Support & Resistance Levels</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {srLevels.map((level, index) => (
                  <div 
                    key={index} 
                    className={`flex justify-between items-center p-2 rounded-lg text-sm ${
                      level.type === 'resistance'
                        ? 'bg-[rgba(255,59,105,0.05)]'
                        : 'bg-[rgba(0,200,151,0.05)]'
                    }`}
                  >
                    <div className={`font-mono ${
                      level.type === 'resistance'
                        ? 'text-[rgba(255,59,105,0.9)]'
                        : 'text-[rgba(0,200,151,0.9)]'
                    }`}>
                      ${level.price.toFixed(2)}
                    </div>
                    
                    <div className="flex items-center">
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        level.strength === 'strong' 
                          ? 'bg-[rgba(255,255,255,0.9)]' 
                          : level.strength === 'moderate'
                            ? 'bg-[rgba(255,255,255,0.6)]'
                            : 'bg-[rgba(255,255,255,0.3)]'
                      }`}></div>
                      <span>
                        {level.type.charAt(0).toUpperCase() + level.type.slice(1)}
                      </span>
                    </div>
                    
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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { STRATEGY_NAMES } from "@/lib/constants";

interface StrategyParams {
  [key: string]: {
    name: string;
    value: number;
    min: number;
    max: number;
    step: number;
    description: string;
  }
}

// Strategy parameters for different strategy types
const strategyParameters: Record<string, StrategyParams> = {
  momentumBreakout: {
    lookbackPeriod: {
      name: "Lookback Period",
      value: 14,
      min: 5,
      max: 30,
      step: 1,
      description: "Number of candles to analyze for breakout patterns"
    },
    volatilityThreshold: {
      name: "Volatility Threshold",
      value: 1.5,
      min: 0.5,
      max: 3,
      step: 0.1,
      description: "Minimum volatility multiplier required for breakout confirmation"
    },
    volumeConfirmation: {
      name: "Volume Confirmation",
      value: 1.2,
      min: 0.8,
      max: 2,
      step: 0.1,
      description: "Volume increase factor required to confirm breakout"
    }
  },
  meanReversion: {
    overboughtLevel: {
      name: "Overbought Level",
      value: 70,
      min: 60,
      max: 90,
      step: 1,
      description: "RSI level indicating overbought conditions"
    },
    oversoldLevel: {
      name: "Oversold Level",
      value: 30,
      min: 10,
      max: 40,
      step: 1,
      description: "RSI level indicating oversold conditions"
    },
    meanPeriod: {
      name: "Mean Period",
      value: 20,
      min: 10,
      max: 50,
      step: 1,
      description: "Period for calculating the mean price"
    }
  },
  volatilityExpansion: {
    atrPeriod: {
      name: "ATR Period",
      value: 14,
      min: 7,
      max: 30,
      step: 1,
      description: "Period for calculating Average True Range"
    },
    atrMultiplier: {
      name: "ATR Multiplier",
      value: 2.5,
      min: 1,
      max: 5,
      step: 0.1,
      description: "Multiplier for ATR to determine volatility expansion"
    },
    entryDelay: {
      name: "Entry Delay",
      value: 2,
      min: 0,
      max: 5,
      step: 1,
      description: "Candles to wait after volatility expansion before entry"
    }
  },
  liquidationCascade: {
    leverageThreshold: {
      name: "Leverage Threshold",
      value: 20,
      min: 10,
      max: 50,
      step: 1,
      description: "Minimum average leverage to identify potential cascades"
    },
    openInterestChange: {
      name: "Open Interest Change",
      value: 10,
      min: 5,
      max: 30,
      step: 1,
      description: "Percentage change in open interest to trigger alert"
    },
    priceImpactThreshold: {
      name: "Price Impact Threshold",
      value: 2,
      min: 0.5,
      max: 5,
      step: 0.1,
      description: "Expected price impact percentage for cascade"
    }
  },
  fundingRateArbitrage: {
    fundingRateThreshold: {
      name: "Funding Rate Threshold",
      value: 0.1,
      min: 0.01,
      max: 0.5,
      step: 0.01,
      description: "Minimum funding rate differential to consider arbitrage"
    },
    holdingPeriod: {
      name: "Holding Period",
      value: 8,
      min: 1,
      max: 24,
      step: 1,
      description: "Number of funding periods to hold position"
    },
    minProfitTarget: {
      name: "Min Profit Target",
      value: 0.5,
      min: 0.1,
      max: 2,
      step: 0.1,
      description: "Minimum profit target percentage for the trade"
    }
  }
};

interface StrategyAnalyzerProps {
  onSave?: (strategy: any) => void;
  className?: string;
}

export default function StrategyAnalyzer({ onSave, className = "" }: StrategyAnalyzerProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string>("momentumBreakout");
  const [strategyName, setStrategyName] = useState("Custom Momentum Strategy");
  const [isActive, setIsActive] = useState(true);
  const [allocation, setAllocation] = useState(20);
  const [params, setParams] = useState<StrategyParams>(strategyParameters.momentumBreakout);
  const [backtestResults, setBacktestResults] = useState<any | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  // Handle strategy selection change
  const handleStrategyChange = (value: string) => {
    setSelectedStrategy(value);
    setParams(strategyParameters[value] || {});
  };

  // Handle parameter value change
  const handleParamChange = (paramKey: string, value: number) => {
    setParams(prev => ({
      ...prev,
      [paramKey]: {
        ...prev[paramKey],
        value
      }
    }));
  };

  // Mutation for saving strategy
  const saveStrategyMutation = useMutation({
    mutationFn: (strategy: any) => {
      return fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategy)
      }).then(res => {
        if (!res.ok) throw new Error('Failed to save strategy');
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Strategy Saved",
        description: "Your custom strategy has been saved and will now be included in trading assessments",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      if (onSave) onSave(buildStrategyObject());
    },
    onError: (error) => {
      toast({
        title: "Failed to save strategy",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation for backtesting strategy
  const backtestStrategyMutation = useMutation({
    mutationFn: (strategy: any) => {
      setIsBacktesting(true);
      return fetch('/api/strategies/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategy)
      }).then(res => {
        if (!res.ok) throw new Error('Failed to backtest strategy');
        return res.json();
      });
    },
    onSuccess: (data) => {
      setBacktestResults(data);
      toast({
        title: "Backtest Complete",
        description: "Strategy backtest completed successfully",
        variant: "default",
      });
      setIsBacktesting(false);
    },
    onError: (error) => {
      toast({
        title: "Backtest Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsBacktesting(false);
    }
  });

  // Build strategy object from current state
  const buildStrategyObject = () => {
    const paramValues: Record<string, number> = {};
    
    // Extract parameter values
    Object.entries(params).forEach(([key, param]) => {
      paramValues[key] = param.value;
    });
    
    return {
      name: strategyName,
      type: selectedStrategy,
      parameters: paramValues,
      active: isActive,
      allocation: allocation
    };
  };

  // Handle save button click
  const handleSave = () => {
    const strategy = buildStrategyObject();
    saveStrategyMutation.mutate(strategy);
  };

  // Handle backtest button click
  const handleBacktest = () => {
    const strategy = buildStrategyObject();
    backtestStrategyMutation.mutate(strategy);
  };

  // Generate sample backtest results (simulated for UI purposes)
  const generateSampleBacktestResults = () => {
    const winRate = Math.random() * 0.3 + 0.5; // 50% to 80%
    const trades = Math.floor(Math.random() * 50) + 30; // 30 to 80 trades
    const profitFactor = Math.random() * 1.5 + 1.2; // 1.2 to 2.7
    
    return {
      winRate,
      trades,
      profitFactor,
      averageWin: Math.random() * 3 + 1, // 1% to 4%
      averageLoss: Math.random() * 1.5 + 0.5, // 0.5% to 2%
      maxDrawdown: Math.random() * 10 + 5, // 5% to 15%
      sharpeRatio: Math.random() * 1.5 + 0.5, // 0.5 to 2.0
      returns: Math.random() * 30 + 10, // 10% to 40%
      timeInMarket: Math.random() * 40 + 20, // 20% to 60%
    };
  };

  return (
    <div className={`card-dashboard p-4 ${className}`}>
      <h3 className="font-medium mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
          <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2Z"></path>
          <path d="M10 14a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8Z"></path>
          <path d="M14 2h8"></path>
          <path d="M14 6h8"></path>
          <path d="M14 10h8"></path>
          <path d="M2 14h8"></path>
          <path d="M2 18h8"></path>
          <path d="M2 22h8"></path>
        </svg>
        Strategy Analyzer
      </h3>
      
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4 bg-[rgba(16,22,34,0.6)]">
          <TabsTrigger value="edit">Edit Strategy</TabsTrigger>
          <TabsTrigger value="backtest">Backtest Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="space-y-4">
          {/* Strategy Selection */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="strategyType" className="text-sm">Strategy Type</Label>
            <Select value={selectedStrategy} onValueChange={handleStrategyChange}>
              <SelectTrigger id="strategyType" className="w-full bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.2)]">
                <SelectValue placeholder="Select Strategy Type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STRATEGY_NAMES).map(([value, name]) => (
                  <SelectItem key={value} value={value}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Strategy Name Input */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="strategyName" className="text-sm">Strategy Name</Label>
            <input 
              id="strategyName"
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.2)] rounded-md px-3 py-2 text-sm"
            />
          </div>
          
          {/* Strategy Status */}
          <div className="flex justify-between items-center px-3 py-2 bg-[rgba(18,24,38,0.7)] border border-[rgba(73,86,118,0.15)] rounded-lg">
            <div>
              <Label htmlFor="strategyActive" className="text-sm font-medium">Active Status</Label>
              <p className="text-xs text-[rgba(255,255,255,0.5)]">Enable/disable strategy in algorithm</p>
            </div>
            <Switch
              id="strategyActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              className={isActive ? 'border-glow-success' : ''}
            />
          </div>
          
          {/* Capital Allocation */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Capital Allocation</Label>
              <span className="text-sm font-mono">{allocation}%</span>
            </div>
            <Slider
              value={[allocation]}
              min={5}
              max={50}
              step={5}
              onValueChange={(value) => setAllocation(value[0])}
              className="my-2"
            />
            <div className="flex justify-between text-xs text-[rgba(255,255,255,0.5)]">
              <span>5%</span>
              <span>50%</span>
            </div>
          </div>
          
          {/* Strategy Parameters */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Strategy Parameters</h4>
            
            {Object.entries(params).map(([key, param]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">{param.name}</Label>
                  <span className="text-sm font-mono">{param.value}</span>
                </div>
                <Slider
                  value={[param.value]}
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  onValueChange={(value) => handleParamChange(key, value[0])}
                  className="my-1"
                />
                <p className="text-xs text-[rgba(255,255,255,0.5)] italic">{param.description}</p>
              </div>
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              className="w-full btn-premium-primary" 
              onClick={handleSave}
              disabled={saveStrategyMutation.isPending}
            >
              {saveStrategyMutation.isPending ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Saving...</span>
                </div>
              ) : 'Save Strategy'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full bg-[rgba(0,149,255,0.1)] border-[rgba(0,149,255,0.2)] text-primary hover:bg-[rgba(0,149,255,0.2)]"
              onClick={handleBacktest}
              disabled={backtestStrategyMutation.isPending}
            >
              {backtestStrategyMutation.isPending ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Backtesting...</span>
                </div>
              ) : 'Backtest Strategy'}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="backtest">
          {isBacktesting ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Running backtest simulation...</p>
              <p className="text-xs text-[rgba(255,255,255,0.5)]">This may take a few moments</p>
            </div>
          ) : backtestResults ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[rgba(18,24,38,0.7)] rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gradient-blue">{(backtestResults.winRate * 100).toFixed(1)}%</div>
                  <div className="text-xs text-[rgba(255,255,255,0.7)]">Win Rate</div>
                </div>
                <div className="bg-[rgba(18,24,38,0.7)] rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gradient-blue">{backtestResults.profitFactor.toFixed(2)}</div>
                  <div className="text-xs text-[rgba(255,255,255,0.7)]">Profit Factor</div>
                </div>
                <div className="bg-[rgba(18,24,38,0.7)] rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gradient-blue">{backtestResults.returns.toFixed(1)}%</div>
                  <div className="text-xs text-[rgba(255,255,255,0.7)]">Total Return</div>
                </div>
              </div>
              
              {/* Detailed Metrics */}
              <div className="bg-[rgba(18,24,38,0.7)] rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center border-b border-[rgba(73,86,118,0.15)] pb-2">
                  <span className="text-sm">Total Trades</span>
                  <span className="text-sm font-mono">{backtestResults.trades}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[rgba(73,86,118,0.15)] pb-2">
                  <span className="text-sm">Average Win</span>
                  <span className="text-sm font-mono text-[#00C897]">+{backtestResults.averageWin.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-[rgba(73,86,118,0.15)] pb-2">
                  <span className="text-sm">Average Loss</span>
                  <span className="text-sm font-mono text-[#FF3B69]">-{backtestResults.averageLoss.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-[rgba(73,86,118,0.15)] pb-2">
                  <span className="text-sm">Max Drawdown</span>
                  <span className="text-sm font-mono text-[#FF3B69]">-{backtestResults.maxDrawdown.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-[rgba(73,86,118,0.15)] pb-2">
                  <span className="text-sm">Sharpe Ratio</span>
                  <span className="text-sm font-mono">{backtestResults.sharpeRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Time in Market</span>
                  <span className="text-sm font-mono">{backtestResults.timeInMarket.toFixed(1)}%</span>
                </div>
              </div>
              
              {/* Recommendation */}
              <div className={`p-3 rounded-lg ${
                backtestResults.profitFactor > 1.5 && backtestResults.winRate > 0.55
                  ? 'bg-[rgba(0,200,151,0.1)] border border-[rgba(0,200,151,0.2)]'
                  : backtestResults.profitFactor > 1.2
                    ? 'bg-[rgba(255,184,0,0.1)] border border-[rgba(255,184,0,0.2)]'
                    : 'bg-[rgba(255,59,105,0.1)] border border-[rgba(255,59,105,0.2)]'
              }`}>
                <div className="font-medium mb-1">
                  {backtestResults.profitFactor > 1.5 && backtestResults.winRate > 0.55
                    ? 'Recommend: Deploy Strategy'
                    : backtestResults.profitFactor > 1.2
                      ? 'Recommendation: Further Optimization Needed'
                      : 'Recommendation: Not Recommended for Live Trading'
                  }
                </div>
                <p className="text-xs">
                  {backtestResults.profitFactor > 1.5 && backtestResults.winRate > 0.55
                    ? 'This strategy shows promising results with good win rate and profit factor. Suitable for live trading.'
                    : backtestResults.profitFactor > 1.2
                      ? 'The strategy shows potential but needs further parameter optimization to improve performance.'
                      : 'This strategy does not meet minimum performance criteria for live trading. Consider different parameters.'
                  }
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  className="w-full btn-premium-primary" 
                  onClick={handleSave}
                  disabled={saveStrategyMutation.isPending}
                >
                  Save & Deploy Strategy
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.2)]"
                  onClick={() => setBacktestResults(null)}
                >
                  Reset & Edit
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-[rgba(255,255,255,0.2)]">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <h4 className="font-medium mt-4">No Backtest Results</h4>
              <p className="text-sm text-[rgba(255,255,255,0.5)]">Configure and run a backtest to see performance metrics</p>
              <Button 
                variant="outline" 
                className="mt-2 bg-[rgba(0,149,255,0.1)] border-[rgba(0,149,255,0.2)] text-primary hover:bg-[rgba(0,149,255,0.2)]"
                onClick={() => {
                  // Generate simulated results for demonstration
                  setBacktestResults(generateSampleBacktestResults());
                }}
              >
                Run Sample Backtest
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
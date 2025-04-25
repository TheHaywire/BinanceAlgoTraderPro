import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import MetricCard from "@/components/dashboard/MetricCard";
import ActivePositions from "@/components/dashboard/ActivePositions";
import TradingOpportunities from "@/components/dashboard/TradingOpportunities";
import PerformanceMetrics from "@/components/dashboard/PerformanceMetrics";
import RiskManagementBar from "@/components/dashboard/RiskManagementBar";
import PortfolioDiversification from "@/components/dashboard/PortfolioDiversification";
import LogViewer from "@/components/system/LogViewer";
import TechnicalAnalysis from "@/components/dashboard/TechnicalAnalysis";
import StrategyAnalyzer from "@/components/dashboard/StrategyAnalyzer";
import ParticleBackground from "@/components/ui/ParticleBackground";
import GlowingCard from "@/components/ui/GlowingCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMarketData } from "@/hooks/useMarketData";
import { usePositions } from "@/hooks/usePositions";
import { useOpportunities } from "@/hooks/useOpportunities";
import { usePerformanceMetrics, useRiskMetrics } from "@/hooks/usePerformance";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { executeTradingOpportunity } from "@/lib/binanceApi";
import { POPULAR_SYMBOLS, STRATEGY_NAMES } from "@/lib/constants";

// Connection status badge component
const ConnectionStatusBadge = () => {
  const { status, lastUpdateTime } = useConnectionStatus();
  
  const getStatusMessage = () => {
    switch (status) {
      case "healthy":
        return "Real-time data connection active";
      case "warning":
        return "Data connection delayed, some prices may be stale";
      case "error":
        return "Connection lost, prices may be outdated";
      case "connecting":
        return "Establishing data connection...";
      default:
        return "Unknown connection status";
    }
  };
  
  const getTimeSinceUpdate = () => {
    const now = Date.now();
    const diff = now - lastUpdateTime;
    if (diff < 10000) return "Updated just now";
    if (diff < 60000) return `Updated ${Math.floor(diff / 1000)}s ago`;
    return `Updated ${Math.floor(diff / 60000)}m ago`;
  };

  const getStatusColor = () => {
    switch (status) {
      case "healthy": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      case "error": return "bg-red-500";
      case "connecting": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2 rounded-full bg-[rgba(16,22,34,0.6)] border border-[rgba(73,86,118,0.2)] p-1.5 px-3">
            <StatusIndicator status={status} size="sm" className="flex-shrink-0" />
            <span className="text-xs text-[rgba(255,255,255,0.6)]">
              {getTimeSinceUpdate()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusMessage()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Market Regime Indicator
const MarketRegimeIndicator = ({ regime }) => {
  const getRegimeColor = () => {
    switch (regime) {
      case 'TRENDING': return 'bg-blue-500';
      case 'RANGING': return 'bg-amber-500';
      case 'VOLATILE': return 'bg-red-500';
      case 'NEUTRAL': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  const getRegimeDescription = () => {
    switch (regime) {
      case 'TRENDING': return 'Trending market - momentum strategies optimal';
      case 'RANGING': return 'Range-bound market - mean reversion strategies optimal';
      case 'VOLATILE': return 'High volatility - reduced position sizing recommended';
      case 'NEUTRAL': return 'Neutral market conditions';
      default: return 'Analyzing market conditions...';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="holographic-bg flex items-center space-x-2 p-2 px-4">
            <div className={`h-2.5 w-2.5 rounded-full ${getRegimeColor()}`}></div>
            <span className="text-sm font-medium">{regime || 'ANALYZING'}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getRegimeDescription()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Price Alert Component
const PriceAlertComponent = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [price, setPrice] = useState('');
  const [direction, setDirection] = useState('above');
  const [alerts, setAlerts] = useState([
    { id: 1, symbol: 'BTCUSDT', price: 95000, direction: 'above', active: true },
    { id: 2, symbol: 'ETHUSDT', price: 1800, direction: 'below', active: true }
  ]);

  const addAlert = () => {
    if (!price) return;
    const newAlert = {
      id: Date.now(),
      symbol,
      price: parseFloat(price),
      direction,
      active: true
    };
    setAlerts([...alerts, newAlert]);
    setPrice('');
    
    toast({
      title: "Price Alert Created",
      description: `Alert will trigger when ${symbol} moves ${direction} $${price}`,
      variant: "default",
    });
  };

  const toggleAlert = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? {...alert, active: !alert.active} : alert
    ));
  };

  const removeAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <div className="card-dashboard p-4">
      <h3 className="font-medium mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
          <path d="M10.42 13.89c-.8.36-1.9 1.10-1.9 1.10"></path>
          <path d="M3 10.9c0-.64.47-1.40 1.06-1.70l13.43-6.78c1.1-.58 2.10.57 1.65 1.73L14.5 14.89C13.57 16.73 11 16.7 10.7 17.5c-.2 1 .76 1.5 1.67 1.5 1.50 0 4.12-1 4.12-1"></path>
          <path d="M18 16v2a1 1 0 0 1-1 1h-1"></path>
          <path d="M11 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path>
        </svg>
        Price Alerts
      </h3>
      
      <div className="flex space-x-2 mb-4">
        <Select value={symbol} onValueChange={setSymbol}>
          <SelectTrigger className="w-[120px] bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.2)]">
            <SelectValue placeholder="Symbol" />
          </SelectTrigger>
          <SelectContent>
            {POPULAR_SYMBOLS.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={direction} onValueChange={setDirection}>
          <SelectTrigger className="w-[100px] bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.2)]">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="above">Above</SelectItem>
            <SelectItem value="below">Below</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="relative flex items-center">
          <span className="absolute left-3 text-sm text-muted-foreground">$</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="pl-7 h-10 rounded-md border border-[rgba(73,86,118,0.2)] bg-[rgba(16,22,34,0.6)] px-3 py-2 text-sm w-24"
          />
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={addAlert}
          className="bg-[rgba(0,149,255,0.1)] border-[rgba(0,149,255,0.2)] text-primary hover:bg-[rgba(0,149,255,0.2)]"
        >
          Add Alert
        </Button>
      </div>
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {alerts.map(alert => (
          <div key={alert.id} className="flex items-center justify-between bg-[rgba(18,24,38,0.5)] rounded-lg p-2">
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-2 ${alert.active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-sm font-medium">{alert.symbol}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${alert.direction === 'above' ? 'text-[#00C897]' : 'text-[#FF3B69]'}`}>
                {alert.direction === 'above' ? '>' : '<'} ${alert.price}
              </span>
              <div className="flex items-center space-x-1">
                <button onClick={() => toggleAlert(alert.id)} className="text-xs text-[rgba(255,255,255,0.6)] hover:text-white">
                  {alert.active ? 'Pause' : 'Resume'}
                </button>
                <button onClick={() => removeAlert(alert.id)} className="text-xs text-[#FF3B69] hover:text-[#FF6B8B]">
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="text-center py-2 text-sm text-[rgba(255,255,255,0.5)]">
            No price alerts set
          </div>
        )}
      </div>
    </div>
  );
};

// Strategy Allocation Component
const StrategyAllocation = ({ allocations = [] }) => {
  return (
    <div className="card-dashboard p-4">
      <h3 className="font-medium mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
        Strategy Allocation
      </h3>
      
      <div className="space-y-3">
        {allocations.map((item, i) => (
          <div key={i} className="bg-[rgba(18,24,38,0.5)] rounded-lg p-3">
            <div className="flex justify-between mb-1.5">
              <span className="text-sm font-medium">{STRATEGY_NAMES[item.type] || item.type}</span>
              <span className={`text-xs ${item.active ? 'text-[#00C897]' : 'text-[rgba(255,255,255,0.5)]'}`}>
                {item.active ? 'Active' : 'Disabled'}
              </span>
            </div>
            
            <div className="w-full bg-[rgba(10,15,28,0.5)] rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-[#0066CC] to-[#0095FF] h-2 rounded-full"
                style={{ width: `${item.allocation}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-[rgba(255,255,255,0.6)]">
              <span>{item.allocation}% Allocation</span>
              <span>Win Rate: {(item.performance.winRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Market Strength Indicator
const MarketStrength = ({ symbols = [] }) => {
  // Function to determine indicator color
  const getStrengthColor = (strength) => {
    if (strength > 70) return 'text-[#00C897]';
    if (strength > 40) return 'text-[#FFB800]';
    return 'text-[#FF3B69]';
  };

  // Function to determine signal
  const getSignalText = (strength) => {
    if (strength > 70) return 'Strong Buy';
    if (strength > 60) return 'Buy';
    if (strength > 50) return 'Mild Buy';
    if (strength > 40) return 'Neutral';
    if (strength > 30) return 'Mild Sell';
    if (strength > 20) return 'Sell';
    return 'Strong Sell';
  };

  return (
    <div className="card-dashboard p-4">
      <h3 className="font-medium mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
          <path d="M2 12h10"></path>
          <path d="M9 4v16"></path>
          <path d="M12 9h10"></path>
          <path d="M19 4v16"></path>
        </svg>
        Market Strength Indicators
      </h3>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {symbols.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-[rgba(18,24,38,0.5)] rounded-lg p-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-[#162253] to-[#0C1333] flex items-center justify-center mr-2">
                <span className="font-bold text-xs text-gradient-blue">
                  {item.symbol.replace(/USDT$/, "")}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium">{item.symbol}</div>
                <div className="flex items-center mt-0.5">
                  <div className="h-1 w-full bg-[rgba(10,15,28,0.5)] rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full ${item.strength > 50 ? 'bg-[#00C897]' : 'bg-[#FF3B69]'}`}
                      style={{ width: `${item.strength}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${getStrengthColor(item.strength)}`}>
                {item.strength}
              </div>
              <div className="text-xs text-[rgba(255,255,255,0.6)]">
                {getSignalText(item.strength)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DashboardEnhanced() {
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("all");
  const [dashboardView, setDashboardView] = useState("compact"); // "compact" or "expanded"
  const [marketRegime, setMarketRegime] = useState("RANGING");
  
  // Use custom hooks to fetch data
  const { data: marketData } = useMarketData();
  const { data: positions, isLoading: positionsLoading } = usePositions();
  const { data: opportunities, isLoading: opportunitiesLoading } = useOpportunities();
  const { data: performanceMetrics, isLoading: performanceLoading } = usePerformanceMetrics();
  const { data: riskMetrics, isLoading: riskLoading } = useRiskMetrics();
  
  const { data: account } = useQuery({
    queryKey: ['/api/binance/account'],
    staleTime: 30000,
  });
  
  const toggleAutoTradingMutation = useMutation({
    mutationFn: (enabled: boolean) => {
      return fetch('/api/binance/autotrading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update auto-trading status');
        return res.json();
      });
    },
    onSuccess: () => {
      setAutoTradingEnabled(!autoTradingEnabled);
      toast({
        title: `Auto-trading ${!autoTradingEnabled ? 'enabled' : 'disabled'}`,
        description: !autoTradingEnabled
          ? "The system will now automatically execute high-score opportunities"
          : "Auto-trading has been disabled. You'll need to manually execute trades",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update auto-trading",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleToggleAutoTrading = () => {
    toggleAutoTradingMutation.mutate(!autoTradingEnabled);
  };
  
  // Filter positions based on selected symbol
  const filteredPositions = positions && Array.isArray(positions) ? 
    (selectedSymbol === 'all' ? positions : positions.filter(p => p.symbol === selectedSymbol)) : 
    [];
  
  // Filter opportunities based on selected symbol and strategy
  const filteredOpportunities = opportunities && Array.isArray(opportunities) ? 
    opportunities.filter(opp => 
      (selectedSymbol === 'all' || opp.symbol === selectedSymbol) && 
      (selectedStrategy === 'all' || opp.strategy === selectedStrategy)
    ).sort((a, b) => b.score - a.score) : 
    [];
  
  // Get latest price for a symbol
  const getLatestPrice = (symbol: string) => {
    if (!marketData || !Array.isArray(marketData)) return null;
    const market = marketData.find(m => m.symbol === symbol);
    return market ? market.lastPrice || market.price : null;
  };
  
  // Calculate unrealized PnL
  const getTotalUnrealizedPnL = () => {
    if (!positions || !Array.isArray(positions)) return "0.00";
    let total = 0;
    positions.forEach(position => {
      if (position.unRealizedProfit) {
        total += parseFloat(position.unRealizedProfit);
      }
    });
    return total.toFixed(2);
  };
  
  // Calculate daily change
  const getDailyChange = () => {
    if (!positions || !Array.isArray(positions) || !marketData) return { value: "0.00", percentage: "0.00" };
    // Here we're just using the unrealized PnL for simplicity
    const unrealizedPnL = parseFloat(getTotalUnrealizedPnL());
    return {
      value: unrealizedPnL.toFixed(2),
      percentage: ((unrealizedPnL / 1000) * 100).toFixed(2) // Assuming a base of $1000
    };
  };

  // Sample strategy allocations data
  const strategyAllocations = [
    { 
      type: "momentumBreakout", 
      allocation: 35, 
      active: true, 
      performance: { winRate: 0.68, profitFactor: 1.87, sharpeRatio: 1.2, returns: 12.3 }
    },
    { 
      type: "meanReversion", 
      allocation: 30, 
      active: true, 
      performance: { winRate: 0.72, profitFactor: 1.65, sharpeRatio: 1.4, returns: 9.7 }
    },
    { 
      type: "volatilityExpansion", 
      allocation: 20, 
      active: true, 
      performance: { winRate: 0.61, profitFactor: 2.1, sharpeRatio: 1.1, returns: 14.2 }
    },
    { 
      type: "liquidationCascade", 
      allocation: 15, 
      active: false, 
      performance: { winRate: 0.55, profitFactor: 2.5, sharpeRatio: 0.9, returns: 18.5 }
    }
  ];

  // Sample market strength data
  const marketStrengthData = [
    { symbol: "BTCUSDT", strength: 72, regime: "TRENDING" },
    { symbol: "ETHUSDT", strength: 65, regime: "TRENDING" },
    { symbol: "BNBUSDT", strength: 58, regime: "RANGING" },
    { symbol: "SOLUSDT", strength: 74, regime: "TRENDING" },
    { symbol: "DOGEUSDT", strength: 45, regime: "RANGING" },
    { symbol: "ADAUSDT", strength: 38, regime: "VOLATILE" }
  ];

  // Helper function to format crypto balance
  const formatCrypto = (value, decimals = 2) => {
    if (!value) return "0";
    const num = parseFloat(value);
    if (num === 0) return "0";
    if (num < 0.0001) return "<0.0001";
    return num.toFixed(decimals);
  };

  // Extract total portfolio value
  const portfolioValue = performanceMetrics?.portfolioValue 
    ? parseFloat(performanceMetrics.portfolioValue).toFixed(2)
    : "0.00";

  return (
    <div className="relative min-h-screen bg-nebula bg-dashboard-grid">
      {/* Dashboard Header */}
      <header className="bg-dashboard-header py-3 px-6 sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-gradient-blue font-bold text-2xl mr-4">AlgoTrader</div>
            
            <div className="hidden md:flex items-center space-x-6 text-sm ml-8">
              <a href="/dashboard" className="text-primary border-b-2 border-primary pb-1">Dashboard</a>
              <a href="/markets" className="text-[rgba(255,255,255,0.6)] hover:text-white">Markets</a>
              <a href="/strategies" className="text-[rgba(255,255,255,0.6)] hover:text-white">Strategies</a>
              <a href="/analytics" className="text-[rgba(255,255,255,0.6)] hover:text-white">Analytics</a>
              <a href="/settings" className="text-[rgba(255,255,255,0.6)] hover:text-white">Settings</a>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ConnectionStatusBadge />
            
            <MarketRegimeIndicator regime={marketRegime} />
            
            <div className="holographic-bg p-2 px-4 text-sm">
              <span className="text-[rgba(255,255,255,0.6)] mr-2">Portfolio:</span>
              <span className="font-bold">${portfolioValue}</span>
            </div>
            
            <Button 
              size="sm" 
              className="btn-premium-primary"
              onClick={() => setDashboardView(dashboardView === "compact" ? "expanded" : "compact")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              {dashboardView === "compact" ? "Expanded View" : "Compact View"}
            </Button>
          </div>
        </div>
      </header>
      
      <main className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Strategy Control Panel */}
          <div className="col-span-12 md:col-span-3 space-y-6">
            {/* Trading Controls */}
            <div className="card-dashboard p-4 border-glow-primary">
              <h3 className="font-medium mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                  <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"></path>
                  <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path>
                  <path d="M12 2v2"></path>
                  <path d="M12 22v-2"></path>
                  <path d="m17 20.66-1-1.73"></path>
                  <path d="M11 10.27 7 3.34"></path>
                  <path d="m20.66 17-1.73-1"></path>
                  <path d="m3.34 7 1.73 1"></path>
                  <path d="M14 12h8"></path>
                  <path d="M2 12h2"></path>
                  <path d="m20.66 7-1.73 1"></path>
                  <path d="m3.34 17 1.73-1"></path>
                  <path d="m17 3.34-1 1.73"></path>
                  <path d="m7 20.66-1-1.73"></path>
                </svg>
                Trading Controls
              </h3>
              
              <div className="space-y-4">
                {/* Auto-trading toggle with enhanced UI */}
                <div className="bg-[rgba(18,24,38,0.7)] border border-[rgba(73,86,118,0.15)] rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <Label htmlFor="auto-trading" className="text-sm font-medium">Auto-Trading</Label>
                      <p className="text-xs text-[rgba(255,255,255,0.5)]">Execute trades automatically</p>
                    </div>
                    <Switch
                      id="auto-trading"
                      checked={autoTradingEnabled}
                      onCheckedChange={handleToggleAutoTrading}
                      disabled={toggleAutoTradingMutation.isPending}
                      className={autoTradingEnabled ? 'border-glow-success' : ''}
                    />
                  </div>
                  
                  <div className={`text-xs p-2 rounded ${autoTradingEnabled ? 'bg-[rgba(0,200,151,0.1)] text-[#00C897]' : 'bg-[rgba(255,59,105,0.1)] text-[#FF3B69]'}`}>
                    {autoTradingEnabled 
                      ? 'System is actively trading with optimal opportunities' 
                      : 'Auto-trading is disabled - manual execution required'}
                  </div>
                </div>
                
                {/* Strategy selection */}
                <div className="bg-[rgba(18,24,38,0.7)] border border-[rgba(73,86,118,0.15)] rounded-lg p-3">
                  <Label className="text-sm font-medium mb-2 block">Strategy Filter</Label>
                  <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                    <SelectTrigger className="w-full bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.2)]">
                      <SelectValue placeholder="Filter Strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Strategies</SelectItem>
                      {Object.entries(STRATEGY_NAMES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Symbol selection */}
                <div className="bg-[rgba(18,24,38,0.7)] border border-[rgba(73,86,118,0.15)] rounded-lg p-3">
                  <Label className="text-sm font-medium mb-2 block">Asset Filter</Label>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger className="w-full bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.2)]">
                      <SelectValue placeholder="Filter Symbol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assets</SelectItem>
                      {POPULAR_SYMBOLS.map(symbol => (
                        <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Scan Market Button */}
                <Button className="w-full btn-premium-primary" size="lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Scan Market
                </Button>
              </div>
            </div>
            
            {/* Strategy Allocation Panel */}
            <StrategyAllocation allocations={strategyAllocations} />
            
            {/* Market Strength Indicator */}
            <MarketStrength symbols={marketStrengthData} />
            
            {/* Price Alert Component */}
            <PriceAlertComponent />
          </div>
          
          {/* Main Content Area */}
          <div className="col-span-12 md:col-span-9 space-y-6">
            {/* Account Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Account Balance"
                value={account?.availableBalance ? `$${parseFloat(account.availableBalance).toFixed(2)}` : "-"}
                subtitle="Available Balance"
                trend="neutral"
                icon="wallet"
                isLoading={!account}
                className="card-dashboard dashboard-metric-pulse"
              />
              
              <MetricCard
                title="Unrealized PnL"
                value={`$${getTotalUnrealizedPnL()}`}
                subtitle="Across All Positions"
                trend={parseFloat(getTotalUnrealizedPnL()) >= 0 ? "up" : "down"}
                percentage={`${Math.abs(parseFloat(getTotalUnrealizedPnL()))}%`}
                icon="chart"
                isLoading={positionsLoading}
                className="card-dashboard dashboard-metric-pulse"
              />
              
              <MetricCard
                title="Trading Performance"
                value={performanceMetrics?.winRate ? `${(performanceMetrics.winRate * 100).toFixed(1)}%` : "-"}
                subtitle="Win Rate"
                trend="neutral"
                icon="activity"
                secondaryMetric={`${performanceMetrics?.totalTrades || 0} Trades`}
                isLoading={performanceLoading}
                className="card-dashboard dashboard-metric-pulse"
              />
            </div>
            
            {/* Risk Management Bar */}
            <div className="card-dashboard p-4">
              <h3 className="font-medium mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Risk Management
              </h3>
              <RiskManagementBar
                riskMetrics={riskMetrics}
                isLoading={riskLoading}
              />
            </div>
            
            {/* Main Tabs for content */}
            <Tabs defaultValue="opportunities" className="w-full">
              <TabsList className="grid grid-cols-3 bg-[rgba(16,22,34,0.6)] mb-6">
                <TabsTrigger value="opportunities">Trading Opportunities</TabsTrigger>
                <TabsTrigger value="positions">Active Positions</TabsTrigger>
                <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="opportunities">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <TradingOpportunities 
                      opportunities={filteredOpportunities} 
                      isLoading={opportunitiesLoading} 
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <TechnicalAnalysis className="h-full" />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="positions">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ActivePositions 
                      positions={filteredPositions} 
                      marketData={marketData || []} 
                      isLoading={positionsLoading} 
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <StrategyAnalyzer className="h-full" />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="performance" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PerformanceMetrics 
                  performanceMetrics={performanceMetrics} 
                  isLoading={performanceLoading} 
                />
                
                <PortfolioDiversification 
                  positions={positions || []} 
                  isLoading={positionsLoading} 
                />
              </TabsContent>
            </Tabs>
            
            {/* System Logs */}
            <div className="card-dashboard">
              <div className="flex justify-between items-center p-4 border-b border-[rgba(73,86,118,0.15)]">
                <h3 className="font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                    <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
                    <path d="M4 20a2 2 0 1 0 4 0 2 2 0 1 0-4 0"></path>
                    <circle cx="10" cy="6" r="2"></circle>
                    <path d="M10 10v4"></path>
                    <path d="M12 12h4"></path>
                  </svg>
                  System Logs & Monitoring
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-[rgba(0,149,255,0.1)] border-[rgba(0,149,255,0.2)] text-primary hover:bg-[rgba(0,149,255,0.2)]"
                >
                  Clear Logs
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <LogViewer />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
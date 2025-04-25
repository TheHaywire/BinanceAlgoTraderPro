import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import MetricCard from "@/components/dashboard/MetricCard";
import ActivePositions from "@/components/dashboard/ActivePositions";
import TradingOpportunities from "@/components/dashboard/TradingOpportunities";
import PerformanceMetrics from "@/components/dashboard/PerformanceMetrics";
import RiskManagementBar from "@/components/dashboard/RiskManagementBar";
import PortfolioDiversification from "@/components/dashboard/PortfolioDiversification";
import LogViewer from "@/components/system/LogViewer";
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
    const seconds = Math.floor((now - lastUpdateTime) / 1000);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    } else {
      return `${Math.floor(seconds / 3600)}h ago`;
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[rgba(16,22,34,0.4)] border border-[rgba(73,86,118,0.2)]">
            <StatusIndicator status={status} size="sm" className="mr-2" />
            <span className="text-xs font-medium">
              {status === "healthy" ? "Live" : status === "warning" ? "Delayed" : status === "error" ? "Disconnected" : "Connecting"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{getStatusMessage()}</p>
            <p className="text-xs text-neutral-light mt-1">Last update: {getTimeSinceUpdate()}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("24h");
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(true);
  const [scanInterval, setScanInterval] = useState(5); // Minutes
  const [activeTab, setActiveTab] = useState("market-scanner");
  const [lastScanTime, setLastScanTime] = useState(new Date());
  const [selectedMarkets, setSelectedMarkets] = useState(POPULAR_SYMBOLS);

  // Get market and trading data
  const { positions, isLoading: isLoadingPositions } = usePositions();
  const { opportunities, isLoading: isLoadingOpportunities } = useOpportunities();
  const { metrics: performanceMetrics, strategyPerformance, isLoading: isLoadingPerformance } = usePerformanceMetrics();
  const { metrics: riskMetrics, isLoading: isLoadingRisk } = useRiskMetrics();
  
  // Get account data
  const { data: accountInfo } = useQuery({
    queryKey: ['/api/binance/account'],
    staleTime: 60000, // 1 minute
  });

  // Get market data for multiple symbols
  const { data: allMarketData, isLoading: isLoadingMarketData } = useQuery({
    queryKey: ['/api/binance/market'],
    staleTime: 30000, // 30 seconds
  });

  // Auto trading execution mutation
  const executeTradeMutation = useMutation({
    mutationFn: (opportunityId: string) => executeTradingOpportunity(opportunityId),
    onSuccess: (data) => {
      toast({
        title: "Trade Executed Successfully",
        description: `${data.order.symbol} ${data.order.side} order placed`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/binance/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/binance/opportunities'] });
    },
    onError: (error) => {
      toast({
        title: "Trade Execution Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Portfolio metrics
  const portfolioValue = accountInfo?.availableBalance || "0.00";
  const portfolioChange = performanceMetrics?.portfolioChangePercent || "0.00";
  const dailyPnL = performanceMetrics?.dailyPnL || "0.00";
  const dailyPnLPercent = performanceMetrics?.dailyPnLPercent || "0.00";
  const winRate = performanceMetrics?.winRate || 0;

  // Auto-trading logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoTradingEnabled) {
      // Initial scan
      scanAndExecute();
      
      // Set up interval for regular scanning
      interval = setInterval(() => {
        scanAndExecute();
      }, scanInterval * 60 * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoTradingEnabled, scanInterval, opportunities]);

  // Scan market and execute best opportunities
  const scanAndExecute = () => {
    if (!opportunities || opportunities.length === 0) return;
    
    setLastScanTime(new Date());
    
    // Filter for high-quality opportunities (score >= 75)
    const highQualityOpportunities = opportunities
      .filter(opp => opp.score >= 75)
      .filter(opp => selectedMarkets.includes(opp.symbol))
      .sort((a, b) => b.score - a.score);
    
    // Execute the best opportunity if available
    if (highQualityOpportunities.length > 0 && autoTradingEnabled) {
      const bestOpportunity = highQualityOpportunities[0];
      
      // Check risk limits before executing
      if (positions.length < riskMetrics.maxPositions && 
          riskMetrics.totalRiskExposure < riskMetrics.maxRiskLimit) {
        executeTradeMutation.mutate(bestOpportunity.id);
      } else {
        toast({
          title: "Trade Not Executed",
          description: "Risk limits reached. Adjust risk parameters or close existing positions.",
          variant: "warning",
        });
      }
    }
  };

  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  return (
    <Container className="py-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Algorithmic Trading System</h1>
              <ConnectionStatusBadge />
            </div>
            <p className="text-neutral-light">AI-Powered Automated Trading & Strategy Execution</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0">
            <div className="card-metric p-3 flex items-center space-x-3">
              <Switch
                checked={autoTradingEnabled}
                onCheckedChange={setAutoTradingEnabled}
                className="data-[state=checked]:bg-success"
              />
              <div>
                <Label className="text-sm font-medium">Auto-Trading</Label>
                <p className="text-xs text-neutral-light">
                  {autoTradingEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.15)] text-white w-[160px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent className="bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.15)]">
                <SelectItem value="1h">Last 1 hour</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            title="Portfolio Value"
            value={portfolioValue}
            subtitle="USDT"
            icon="ri-funds-line"
            isLive={true}
            trend={{
              value: `${parseFloat(portfolioChange) >= 0 ? "+" : ""}${portfolioChange}%`,
              direction: parseFloat(portfolioChange) >= 0 ? "up" : "down",
              label: "from yesterday"
            }}
          />
          
          <MetricCard
            title="Active Positions"
            value={positions.length}
            subtitle={`/ ${riskMetrics.maxPositions} max`}
            icon="ri-exchange-funds-line"
            isLive={true}
            progress={{
              value: positions.length,
              max: riskMetrics.maxPositions
            }}
          />
          
          <MetricCard
            title="Today's P&L"
            value={`${parseFloat(dailyPnL) >= 0 ? "+" : ""}${dailyPnL}`}
            subtitle="USDT"
            icon="ri-line-chart-line"
            isLive={true}
            trend={{
              value: `${parseFloat(dailyPnLPercent) >= 0 ? "+" : ""}${dailyPnLPercent}%`,
              direction: parseFloat(dailyPnLPercent) >= 0 ? "up" : "down",
              label: "of portfolio"
            }}
          />
          
          <MetricCard
            title="Win Rate"
            value={`${winRate}%`}
            subtitle={`(${performanceMetrics.totalTrades || 0} trades)`}
            icon="ri-percent-line"
            trend={{
              value: "+3%",
              direction: "up",
              label: "from last week"
            }}
          />
          
          <MetricCard
            title="Auto-Trading Status"
            value={autoTradingEnabled ? "Active" : "Paused"}
            subtitle={`Last scan: ${formatTimestamp(lastScanTime)}`}
            icon="ri-robot-line"
            isLive={autoTradingEnabled}
            trend={{
              value: `${scanInterval}min intervals`,
              direction: "neutral",
              label: "scan frequency"
            }}
          />
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="space-y-6">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList className="bg-[rgba(16,22,34,0.6)] border border-[rgba(73,86,118,0.15)]">
              <TabsTrigger 
                value="market-scanner" 
                className="data-[state=active]:bg-[rgba(0,149,255,0.1)] data-[state=active]:text-primary"
              >
                Market Scanner
              </TabsTrigger>
              <TabsTrigger 
                value="active-positions" 
                className="data-[state=active]:bg-[rgba(0,149,255,0.1)] data-[state=active]:text-primary"
              >
                Active Positions
              </TabsTrigger>
              <TabsTrigger 
                value="strategy-performance" 
                className="data-[state=active]:bg-[rgba(0,149,255,0.1)] data-[state=active]:text-primary"
              >
                Strategy Performance
              </TabsTrigger>
              <TabsTrigger 
                value="system-logs" 
                className="data-[state=active]:bg-[rgba(0,149,255,0.1)] data-[state=active]:text-primary"
              >
                System Logs
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="scanInterval" className="text-sm">Scan Interval</Label>
              <Select 
                value={scanInterval.toString()} 
                onValueChange={(val) => setScanInterval(parseInt(val))}
              >
                <SelectTrigger className="bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.15)] text-white w-[100px]">
                  <SelectValue placeholder="Interval" />
                </SelectTrigger>
                <SelectContent className="bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.15)]">
                  <SelectItem value="1">1 min</SelectItem>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={scanAndExecute}
                className="bg-gradient-to-r from-[#0066CC] to-[#0095FF] hover:from-[#0077EE] hover:to-[#00A9FF] text-white border-none"
                disabled={executeTradeMutation.isPending}
              >
                {executeTradeMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Executing...</span>
                  </div>
                ) : (
                  <>
                    <i className="ri-radar-line mr-1.5"></i>
                    Scan Now
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <TabsContent value="market-scanner" className="mt-6 space-y-6">
            {/* Market Scanner Tab */}
            <div className="card-dashboard p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Market Opportunity Scanner</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-neutral-light">
                    {selectedMarkets.length} markets selected
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-[rgba(16,22,34,0.6)] border-[rgba(73,86,118,0.15)] text-white"
                  >
                    <i className="ri-settings-3-line mr-1.5"></i>
                    Configure
                  </Button>
                </div>
              </div>
              
              <div className="overflow-hidden border border-[rgba(73,86,118,0.15)] rounded-xl">
                <Table className="premium-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Symbol</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>24h Change</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Signal</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingOpportunities ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="relative h-12 w-12">
                              <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary animate-spin"></div>
                              <div className="absolute inset-3 rounded-full border-t-2 border-r-2 border-primary/60 animate-spin animation-delay-150"></div>
                            </div>
                            <p className="mt-4 text-neutral-light">Scanning market for opportunities...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : opportunities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <p className="text-neutral-light">No trading opportunities found</p>
                          <p className="text-neutral-light/60 text-sm mt-1">Try adjusting your scan parameters or adding more markets</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      opportunities
                        .sort((a, b) => b.score - a.score)
                        .map((opportunity) => {
                          const market = allMarketData?.find(m => m.symbol === opportunity.symbol) || {
                            price: "0",
                            priceChangePercent: "0"
                          };
                          
                          const priceChange = parseFloat(market.priceChangePercent);
                          const isPriceUp = priceChange >= 0;
                          
                          return (
                            <TableRow key={opportunity.id} className="group">
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-[#162253] to-[#0C1333] flex items-center justify-center mr-2 shadow-lg">
                                    <span className="font-bold text-xs">
                                      {opportunity.symbol.replace(/USDT$/, "")}
                                    </span>
                                  </div>
                                  <span>{opportunity.symbol}</span>
                                </div>
                              </TableCell>
                              
                              <TableCell className="font-mono font-medium">
                                ${parseFloat(market.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </TableCell>
                              
                              <TableCell>
                                <span className={`${isPriceUp ? 'text-[#00C897]' : 'text-[#FF3B69]'} flex items-center`}>
                                  <i className={`${isPriceUp ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-1`}></i>
                                  {isPriceUp ? "+" : ""}{priceChange.toFixed(2)}%
                                </span>
                              </TableCell>
                              
                              <TableCell>
                                <Badge variant="outline" className="bg-[rgba(0,149,255,0.1)] text-primary border-none">
                                  {STRATEGY_NAMES[opportunity.strategy]}
                                </Badge>
                              </TableCell>
                              
                              <TableCell>
                                <Badge className={`${
                                  opportunity.direction === 'LONG' 
                                    ? 'bg-[rgba(0,200,151,0.1)] text-[#00C897] border-[rgba(0,200,151,0.2)]' 
                                    : 'bg-[rgba(255,59,105,0.1)] text-[#FF3B69] border-[rgba(255,59,105,0.2)]'
                                }`}>
                                  {opportunity.direction}
                                </Badge>
                              </TableCell>
                              
                              <TableCell>
                                <div className="w-full bg-[rgba(28,34,48,0.4)] h-2 rounded-full">
                                  <div 
                                    className={`h-full rounded-full ${
                                      opportunity.confidence > 80 
                                        ? 'bg-[#00C897]' 
                                        : opportunity.confidence > 50 
                                          ? 'bg-[#FFB800]' 
                                          : 'bg-[#FF3B69]'
                                    }`}
                                    style={{ width: `${opportunity.confidence}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-neutral-light mt-1">{opportunity.confidence}%</div>
                              </TableCell>
                              
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full overflow-hidden relative mr-2">
                                    <div className="absolute inset-1 rounded-full bg-[rgba(28,34,48,0.5)]"></div>
                                    <svg width="100%" height="100%" viewBox="0 0 32 32">
                                      <circle 
                                        cx="16" cy="16" r="14" 
                                        fill="none" 
                                        stroke="rgba(73,86,118,0.2)" 
                                        strokeWidth="2" 
                                      />
                                      <circle 
                                        cx="16" cy="16" r="14" 
                                        fill="none" 
                                        stroke={
                                          opportunity.score > 80 
                                            ? '#00C897' 
                                            : opportunity.score > 50 
                                              ? '#FFB800' 
                                              : '#FF3B69'
                                        }
                                        strokeWidth="2" 
                                        strokeDasharray={`${(opportunity.score/100) * 88} 88`} 
                                        strokeDashoffset="22"
                                        transform="rotate(-90 16 16)"
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                                      {opportunity.score}
                                    </div>
                                  </div>
                                  <span className="text-sm">{opportunity.score >= 75 ? 'Strong' : opportunity.score >= 50 ? 'Moderate' : 'Weak'}</span>
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  className={`
                                    ${opportunity.direction === 'LONG' 
                                      ? 'bg-gradient-to-r from-[#00C897] to-[#00A57E]' 
                                      : 'bg-gradient-to-r from-[#FF3B69] to-[#DB2A69]'
                                    } text-white shadow-lg
                                  `}
                                  onClick={() => executeTradeMutation.mutate(opportunity.id)}
                                  disabled={executeTradeMutation.isPending}
                                >
                                  {executeTradeMutation.isPending ? 'Executing...' : 'Execute'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Opportunity Details */}
            <div className="card-dashboard p-4">
              <h3 className="text-lg font-bold mb-4">Market Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4 flex flex-col">
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <i className="ri-line-chart-line text-primary mr-1.5"></i>
                    Advanced Technical Analysis
                  </h4>
                  <p className="text-sm text-neutral-light/70 mb-2">Using ML-enhanced technical indicators to identify high-probability setups:</p>
                  <ul className="text-xs text-neutral-light space-y-1 mt-auto">
                    <li>• RSI Divergence Detection</li>
                    <li>• Volume Profile Analysis</li>
                    <li>• Support/Resistance Clustering</li>
                    <li>• Volatility Regime Detection</li>
                    <li>• Multi-timeframe Confluence</li>
                  </ul>
                </div>
                
                <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4 flex flex-col">
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <i className="ri-funds-box-line text-[#FFB800] mr-1.5"></i>
                    Order Flow Analysis
                  </h4>
                  <p className="text-sm text-neutral-light/70 mb-2">Real-time monitoring of market order flow for institutional footprints:</p>
                  <ul className="text-xs text-neutral-light space-y-1 mt-auto">
                    <li>• Large Order Detection</li>
                    <li>• Bid/Ask Imbalance Analysis</li>
                    <li>• Market Depth Visualization</li>
                    <li>• Liquidation Cascade Alerts</li>
                    <li>• Whale Wallet Monitoring</li>
                  </ul>
                </div>
                
                <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4 flex flex-col">
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <i className="ri-radar-line text-[#00C897] mr-1.5"></i>
                    Real-time Scanner
                  </h4>
                  <p className="text-sm text-neutral-light/70 mb-2">Continuously scanning {selectedMarkets.length} markets across timeframes for setups:</p>
                  <ul className="text-xs text-neutral-light space-y-1 mt-auto">
                    <li>• Next scan: {new Date(lastScanTime.getTime() + scanInterval * 60 * 1000).toLocaleTimeString()}</li>
                    <li>• Priority markets: BTC, ETH, SOL, BNB</li>
                    <li>• Active strategies: 5</li>
                    <li>• Scanning frequency: {scanInterval}min</li>
                    <li>• Auto-execution: {autoTradingEnabled ? 'Enabled' : 'Disabled'}</li>
                  </ul>
                </div>
                
                <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4 flex flex-col">
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <i className="ri-shield-check-line text-[#FF3B69] mr-1.5"></i>
                    Risk Management
                  </h4>
                  <p className="text-sm text-neutral-light/70 mb-2">AI-powered dynamic risk controls for portfolio protection:</p>
                  <ul className="text-xs text-neutral-light space-y-1 mt-auto">
                    <li>• Position sizing: {riskMetrics.maxRiskPerTrade}% per trade</li>
                    <li>• Current exposure: {riskMetrics.totalRiskExposure}%</li>
                    <li>• Max drawdown: {riskMetrics.maxDrawdownLimit}%</li>
                    <li>• Position correlation: Moderate</li>
                    <li>• Volatility adjustment: Active</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Active Positions Tab */}
          <TabsContent value="active-positions" className="space-y-6">
            <ActivePositions 
              positions={positions}
              isLoading={isLoadingPositions}
            />
          </TabsContent>
          
          {/* Strategy Performance Tab */}
          <TabsContent value="strategy-performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceMetrics 
                metrics={performanceMetrics}
                strategyPerformance={strategyPerformance}
                isLoading={isLoadingPerformance}
              />
              <PortfolioDiversification />
            </div>
          </TabsContent>
          
          {/* System Logs Tab */}
          <TabsContent value="system-logs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4">
                <h4 className="text-sm font-medium mb-3">System Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-light">Trading Engine:</span>
                    <span className="text-xs text-[#00C897] flex items-center">
                      <i className="ri-checkbox-circle-line mr-1"></i>
                      Running
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-light">API Connection:</span>
                    <span className="text-xs text-[#00C897] flex items-center">
                      <i className="ri-checkbox-circle-line mr-1"></i>
                      Connected
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-light">WebSocket Feed:</span>
                    <span className="text-xs text-[#00C897] flex items-center">
                      <i className="ri-checkbox-circle-line mr-1"></i>
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-light">Database:</span>
                    <span className="text-xs text-[#00C897] flex items-center">
                      <i className="ri-checkbox-circle-line mr-1"></i>
                      Connected
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4">
                <h4 className="text-sm font-medium mb-3">Performance Monitoring</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-light">CPU Usage:</span>
                    <span className="text-xs">42%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-light">Memory Usage:</span>
                    <span className="text-xs">1.2GB / 2GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-light">API Rate Limit:</span>
                    <span className="text-xs text-[#FFB800] flex items-center">
                      <i className="ri-alert-line mr-1"></i>
                      76%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-light">Scan Latency:</span>
                    <span className="text-xs">214ms</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4">
                <h4 className="text-sm font-medium mb-3">Activity Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-light">Last Scan:</span>
                    <span className="text-xs">{formatTimestamp(lastScanTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-light">Trades Today:</span>
                    <span className="text-xs">{performanceMetrics.totalTrades || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-light">Next Scan:</span>
                    <span className="text-xs">{new Date(lastScanTime.getTime() + scanInterval * 60 * 1000).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-light">Auto-Trading:</span>
                    <span className="text-xs text-[autoTradingEnabled ? '#00C897' : '#FF3B69']">
                      {autoTradingEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <LogViewer className="card-dashboard" maxEntries={1000} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Risk Management Bar */}
      <RiskManagementBar 
        riskMetrics={riskMetrics}
        isLoading={isLoadingRisk}
      />
    </Container>
  );
}

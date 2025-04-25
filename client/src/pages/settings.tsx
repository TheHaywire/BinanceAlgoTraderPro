import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Settings2Icon,
  WrenchIcon,
  RefreshCwIcon,
  SaveIcon,
  AlertTriangleIcon,
  KeyIcon,
  BellIcon,
  LineChartIcon,
  BarChart3Icon,
  DatabaseIcon,
  ServerIcon,
  ShieldAlertIcon,
  ZapIcon,
  GitBranchIcon,
  WalletIcon,
  PlugIcon,
} from "lucide-react";

export default function Settings() {
  // Trading settings
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(true);
  const [riskPerTrade, setRiskPerTrade] = useState(2.5);
  const [maxOpenPositions, setMaxOpenPositions] = useState(5);
  const [defaultLeverage, setDefaultLeverage] = useState(3);
  const [scanInterval, setScanInterval] = useState(5);
  
  // Risk management
  const [stopLossEnabled, setStopLossEnabled] = useState(true);
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(true);
  const [maxDrawdown, setMaxDrawdown] = useState(15);
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(true);
  const [portfolioStopEnabled, setPortfolioStopEnabled] = useState(true);
  
  // Interface settings
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(true);
  const [darkTheme, setDarkTheme] = useState("dark");
  
  // Strategy allocation
  const [strategyAllocations, setStrategyAllocations] = useState({
    momentumBreakout: 25,
    meanReversion: 20,
    trendFollowing: 30,
    volatilityExpansion: 15,
    liquidityCascade: 10
  });
  
  // API settings
  const [apiEndpoint, setApiEndpoint] = useState("https://testnet.binancefuture.com");
  const [testnet, setTestnet] = useState(true);
  
  // Misc settings
  const [logLevel, setLogLevel] = useState("info");
  const [useJwt, setUseJwt] = useState(true);
  
  const handleSaveSettings = () => {
    // Would typically save settings to backend
    alert("Settings saved successfully!");
  };
  
  const handleResetSettings = () => {
    // Would typically reset settings to default
    if (confirm("Are you sure you want to reset all settings to default values?")) {
      setRiskPerTrade(2.5);
      setMaxOpenPositions(5);
      setDefaultLeverage(3);
      setScanInterval(5);
      setStopLossEnabled(true);
      setTakeProfitEnabled(true);
      setMaxDrawdown(15);
      setTrailingStopEnabled(true);
      setPortfolioStopEnabled(true);
      setRefreshInterval(10);
      setNotificationsEnabled(true);
      setSoundAlertsEnabled(true);
      setDarkTheme("dark");
      setStrategyAllocations({
        momentumBreakout: 25,
        meanReversion: 20,
        trendFollowing: 30,
        volatilityExpansion: 15,
        liquidityCascade: 10
      });
      setApiEndpoint("https://testnet.binancefuture.com");
      setTestnet(true);
      setLogLevel("info");
      setUseJwt(true);
    }
  };
  
  const handleStrategyAllocationChange = (strategy: keyof typeof strategyAllocations, value: number) => {
    setStrategyAllocations(prev => ({
      ...prev,
      [strategy]: value
    }));
  };
  
  return (
    <Container className="py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-neutral-light">Configure your algorithmic trading system settings</p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleResetSettings}
              className="bg-[#1C2230] border-[#2A3441]"
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Reset
            </Button>
            
            <Button 
              onClick={handleSaveSettings}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <SaveIcon className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="trading" className="w-full">
          <TabsList className="bg-[#1C2230] border-b border-[#2A3441] w-full p-0 h-auto rounded-none">
            <div className="flex items-center p-0 bg-transparent w-full overflow-x-auto">
              <TabsTrigger 
                value="trading" 
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                <ZapIcon className="h-4 w-4 mr-2" />
                Trading
              </TabsTrigger>
              <TabsTrigger 
                value="risk" 
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                <ShieldAlertIcon className="h-4 w-4 mr-2" />
                Risk Management
              </TabsTrigger>
              <TabsTrigger 
                value="strategies" 
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                <GitBranchIcon className="h-4 w-4 mr-2" />
                Strategy Allocation
              </TabsTrigger>
              <TabsTrigger 
                value="interface" 
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                <Settings2Icon className="h-4 w-4 mr-2" />
                Interface
              </TabsTrigger>
              <TabsTrigger 
                value="api" 
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                <PlugIcon className="h-4 w-4 mr-2" />
                API Configuration
              </TabsTrigger>
            </div>
          </TabsList>
          
          <div className="pt-6">
            <TabsContent value="trading" className="mt-0 space-y-6">
              <Card className="bg-[#1C2230] border-[#2A3441]">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ZapIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Trading Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your trading parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-trading" className="font-medium">
                          Auto Trading
                        </Label>
                        <Switch 
                          id="auto-trading" 
                          checked={autoTradingEnabled}
                          onCheckedChange={setAutoTradingEnabled}
                        />
                      </div>
                      <p className="text-sm text-neutral-400">
                        When enabled, the system will automatically execute trades based on your strategies
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="risk-per-trade" className="font-medium">
                        Risk Per Trade (%)
                      </Label>
                      <div className="flex items-center space-x-3">
                        <Slider 
                          id="risk-per-trade"
                          min={0.1}
                          max={10}
                          step={0.1}
                          value={[riskPerTrade]}
                          onValueChange={(value) => setRiskPerTrade(value[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{riskPerTrade}%</span>
                      </div>
                      <p className="text-sm text-neutral-400">
                        Percentage of your account to risk on each trade
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="max-positions" className="font-medium">
                        Max Open Positions
                      </Label>
                      <div className="flex items-center space-x-3">
                        <Slider 
                          id="max-positions"
                          min={1}
                          max={20}
                          step={1}
                          value={[maxOpenPositions]}
                          onValueChange={(value) => setMaxOpenPositions(value[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{maxOpenPositions}</span>
                      </div>
                      <p className="text-sm text-neutral-400">
                        Maximum number of concurrent open positions
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="default-leverage" className="font-medium">
                        Default Leverage
                      </Label>
                      <div className="flex items-center space-x-3">
                        <Slider 
                          id="default-leverage"
                          min={1}
                          max={20}
                          step={1}
                          value={[defaultLeverage]}
                          onValueChange={(value) => setDefaultLeverage(value[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{defaultLeverage}x</span>
                      </div>
                      <p className="text-sm text-neutral-400">
                        Default leverage for new positions
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="scan-interval" className="font-medium">
                        Market Scan Interval (minutes)
                      </Label>
                      <Select value={scanInterval.toString()} onValueChange={(value) => setScanInterval(parseInt(value))}>
                        <SelectTrigger id="scan-interval" className="w-full bg-[#131825] border-[#2A3441]">
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 minute</SelectItem>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-neutral-400">
                        How often the system scans for new trading opportunities
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="risk" className="mt-0 space-y-6">
              <Card className="bg-[#1C2230] border-[#2A3441]">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShieldAlertIcon className="h-5 w-5 mr-2 text-red-500" />
                    Risk Management Settings
                  </CardTitle>
                  <CardDescription>
                    Configure parameters to protect your capital
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="stop-loss" className="font-medium">
                          Automatic Stop Loss
                        </Label>
                        <Switch 
                          id="stop-loss" 
                          checked={stopLossEnabled}
                          onCheckedChange={setStopLossEnabled}
                        />
                      </div>
                      <p className="text-sm text-neutral-400">
                        Automatically place stop loss orders for every position
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="take-profit" className="font-medium">
                          Automatic Take Profit
                        </Label>
                        <Switch 
                          id="take-profit" 
                          checked={takeProfitEnabled}
                          onCheckedChange={setTakeProfitEnabled}
                        />
                      </div>
                      <p className="text-sm text-neutral-400">
                        Automatically place take profit orders for every position
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="max-drawdown" className="font-medium">
                        Maximum Drawdown (%)
                      </Label>
                      <div className="flex items-center space-x-3">
                        <Slider 
                          id="max-drawdown"
                          min={5}
                          max={50}
                          step={1}
                          value={[maxDrawdown]}
                          onValueChange={(value) => setMaxDrawdown(value[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{maxDrawdown}%</span>
                      </div>
                      <p className="text-sm text-neutral-400">
                        Stop trading when account drawdown exceeds this percentage
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="trailing-stop" className="font-medium">
                          Trailing Stop Loss
                        </Label>
                        <Switch 
                          id="trailing-stop" 
                          checked={trailingStopEnabled}
                          onCheckedChange={setTrailingStopEnabled}
                        />
                      </div>
                      <p className="text-sm text-neutral-400">
                        Use trailing stop loss to lock in profits as price moves in your favor
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="portfolio-stop" className="font-medium">
                          Portfolio-wide Stop Loss
                        </Label>
                        <Switch 
                          id="portfolio-stop" 
                          checked={portfolioStopEnabled}
                          onCheckedChange={setPortfolioStopEnabled}
                        />
                      </div>
                      <p className="text-sm text-neutral-400">
                        Close all positions if portfolio loses more than the maximum drawdown
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="my-6 bg-[#2A3441]" />
                  
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start">
                    <AlertTriangleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-500">Risk Warning</h4>
                      <p className="text-sm text-neutral-300 mt-1">
                        Trading cryptocurrency futures involves substantial risk of loss. Past performance is not indicative of future results. 
                        Always start with small amounts and never trade with money you cannot afford to lose.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="strategies" className="mt-0 space-y-6">
              <Card className="bg-[#1C2230] border-[#2A3441]">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GitBranchIcon className="h-5 w-5 mr-2 text-green-500" />
                    Strategy Allocation
                  </CardTitle>
                  <CardDescription>
                    Allocate your capital across different trading strategies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium flex items-center">
                          <BarChart3Icon className="h-4 w-4 mr-2 text-green-500" />
                          Momentum Breakout
                        </Label>
                        <span className="text-sm font-medium">{strategyAllocations.momentumBreakout}%</span>
                      </div>
                      <Slider 
                        min={0}
                        max={100}
                        step={5}
                        value={[strategyAllocations.momentumBreakout]}
                        onValueChange={(value) => handleStrategyAllocationChange('momentumBreakout', value[0])}
                      />
                      <p className="text-sm text-neutral-400">
                        Trades strong momentum with volume confirmation on breakouts
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium flex items-center">
                          <BarChart3Icon className="h-4 w-4 mr-2 text-blue-500" />
                          Mean Reversion
                        </Label>
                        <span className="text-sm font-medium">{strategyAllocations.meanReversion}%</span>
                      </div>
                      <Slider 
                        min={0}
                        max={100}
                        step={5}
                        value={[strategyAllocations.meanReversion]}
                        onValueChange={(value) => handleStrategyAllocationChange('meanReversion', value[0])}
                      />
                      <p className="text-sm text-neutral-400">
                        Trades market extremes expecting price to return to average
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium flex items-center">
                          <LineChartIcon className="h-4 w-4 mr-2 text-purple-500" />
                          Trend Following
                        </Label>
                        <span className="text-sm font-medium">{strategyAllocations.trendFollowing}%</span>
                      </div>
                      <Slider 
                        min={0}
                        max={100}
                        step={5}
                        value={[strategyAllocations.trendFollowing]}
                        onValueChange={(value) => handleStrategyAllocationChange('trendFollowing', value[0])}
                      />
                      <p className="text-sm text-neutral-400">
                        Follows established market trends for longer-term positions
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium flex items-center">
                          <BarChart3Icon className="h-4 w-4 mr-2 text-orange-500" />
                          Volatility Expansion
                        </Label>
                        <span className="text-sm font-medium">{strategyAllocations.volatilityExpansion}%</span>
                      </div>
                      <Slider 
                        min={0}
                        max={100}
                        step={5}
                        value={[strategyAllocations.volatilityExpansion]}
                        onValueChange={(value) => handleStrategyAllocationChange('volatilityExpansion', value[0])}
                      />
                      <p className="text-sm text-neutral-400">
                        Targets periods of low volatility expecting significant moves
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium flex items-center">
                          <BarChart3Icon className="h-4 w-4 mr-2 text-red-500" />
                          Liquidity Cascade
                        </Label>
                        <span className="text-sm font-medium">{strategyAllocations.liquidityCascade}%</span>
                      </div>
                      <Slider 
                        min={0}
                        max={100}
                        step={5}
                        value={[strategyAllocations.liquidityCascade]}
                        onValueChange={(value) => handleStrategyAllocationChange('liquidityCascade', value[0])}
                      />
                      <p className="text-sm text-neutral-400">
                        Targets stop hunts and liquidation cascades for quick profits
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center px-2 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mt-4">
                      <div className="flex items-center">
                        <WalletIcon className="h-5 w-5 text-blue-500 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium">Total Allocation</h4>
                          <p className="text-xs text-neutral-400 mt-0.5">Sum of all strategy allocations</p>
                        </div>
                      </div>
                      <span className={`text-xl font-bold ${
                        Object.values(strategyAllocations).reduce((sum, val) => sum + val, 0) === 100 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {Object.values(strategyAllocations).reduce((sum, val) => sum + val, 0)}%
                      </span>
                    </div>
                    
                    {Object.values(strategyAllocations).reduce((sum, val) => sum + val, 0) !== 100 && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start">
                        <AlertTriangleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                        <p className="text-sm text-neutral-300">
                          Your total allocation must equal 100%. Please adjust your strategy allocations.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="interface" className="mt-0 space-y-6">
              <Card className="bg-[#1C2230] border-[#2A3441]">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings2Icon className="h-5 w-5 mr-2 text-yellow-500" />
                    Interface Settings
                  </CardTitle>
                  <CardDescription>
                    Customize your trading dashboard experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="refresh-interval" className="font-medium">
                        Data Refresh Interval (seconds)
                      </Label>
                      <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                        <SelectTrigger id="refresh-interval" className="w-full bg-[#131825] border-[#2A3441]">
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 seconds</SelectItem>
                          <SelectItem value="10">10 seconds</SelectItem>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">1 minute</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-neutral-400">
                        How often the dashboard updates market data
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="theme" className="font-medium">
                        Interface Theme
                      </Label>
                      <Select value={darkTheme} onValueChange={setDarkTheme}>
                        <SelectTrigger id="theme" className="w-full bg-[#131825] border-[#2A3441]">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dark">Dark (Default)</SelectItem>
                          <SelectItem value="darker">Midnight</SelectItem>
                          <SelectItem value="blue">Deep Blue</SelectItem>
                          <SelectItem value="purple">Nebula</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-neutral-400">
                        Visual theme for the trading interface
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="notifications" className="font-medium">
                          Browser Notifications
                        </Label>
                        <Switch 
                          id="notifications" 
                          checked={notificationsEnabled}
                          onCheckedChange={setNotificationsEnabled}
                        />
                      </div>
                      <p className="text-sm text-neutral-400">
                        Receive browser notifications for important events
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sound-alerts" className="font-medium">
                          Sound Alerts
                        </Label>
                        <Switch 
                          id="sound-alerts" 
                          checked={soundAlertsEnabled}
                          onCheckedChange={setSoundAlertsEnabled}
                        />
                      </div>
                      <p className="text-sm text-neutral-400">
                        Play sound when trades execute or opportunities arise
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="api" className="mt-0 space-y-6">
              <Card className="bg-[#1C2230] border-[#2A3441]">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PlugIcon className="h-5 w-5 mr-2 text-blue-500" />
                    API Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure API connection settings for Binance Futures
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="testnet" className="font-medium">
                          Use Testnet
                        </Label>
                        <Switch 
                          id="testnet" 
                          checked={testnet}
                          onCheckedChange={setTestnet}
                        />
                      </div>
                      <p className="text-sm text-neutral-400">
                        Use Binance Futures testnet instead of production environment
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="api-endpoint" className="font-medium">
                        API Endpoint
                      </Label>
                      <Input 
                        id="api-endpoint"
                        value={apiEndpoint}
                        onChange={(e) => setApiEndpoint(e.target.value)}
                        className="bg-[#131825] border-[#2A3441]"
                      />
                      <p className="text-sm text-neutral-400">
                        Binance Futures API endpoint URL
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="api-key" className="font-medium">
                        API Key
                      </Label>
                      <div className="relative">
                        <Input 
                          id="api-key"
                          type="password"
                          value="••••••••••••••••••••••••••••••••"
                          disabled
                          className="bg-[#131825] border-[#2A3441] pr-10"
                        />
                        <KeyIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                      </div>
                      <p className="text-sm text-neutral-400">
                        Your Binance Futures API key (stored securely)
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="api-secret" className="font-medium">
                        API Secret
                      </Label>
                      <div className="relative">
                        <Input 
                          id="api-secret"
                          type="password"
                          value="••••••••••••••••••••••••••••••••"
                          disabled
                          className="bg-[#131825] border-[#2A3441] pr-10"
                        />
                        <KeyIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                      </div>
                      <p className="text-sm text-neutral-400">
                        Your Binance Futures API secret (stored securely)
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="log-level" className="font-medium">
                        Log Level
                      </Label>
                      <Select value={logLevel} onValueChange={setLogLevel}>
                        <SelectTrigger id="log-level" className="w-full bg-[#131825] border-[#2A3441]">
                          <SelectValue placeholder="Select log level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="warn">Warning</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="debug">Debug</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-neutral-400">
                        Level of detail in application logs
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="use-jwt" className="font-medium">
                          Use JWT Authentication
                        </Label>
                        <Switch 
                          id="use-jwt" 
                          checked={useJwt}
                          onCheckedChange={setUseJwt}
                        />
                      </div>
                      <p className="text-sm text-neutral-400">
                        Use JWT tokens for API authentication (more secure)
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start mt-4">
                    <AlertTriangleIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-500">API Key Security Warning</h4>
                      <p className="text-sm text-neutral-300 mt-1">
                        For security reasons, your API keys are stored encrypted and cannot be viewed after being set. 
                        To change your API keys, use the Update API Keys button and enter your new credentials.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-3 bg-yellow-500/20 text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/30"
                      >
                        <KeyIcon className="h-4 w-4 mr-2" />
                        Update API Keys
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Container>
  );
}

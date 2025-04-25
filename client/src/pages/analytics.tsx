import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, AreaChart, Area
} from "recharts";
import {
  CalendarIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3Icon,
  PieChartIcon,
  DollarSignIcon,
  PercentIcon
} from "lucide-react";

// Mock performance data for visualization
const performanceData = [
  { date: "Jan 1", pnl: 350, winRate: 62, trades: 18 },
  { date: "Jan 8", pnl: -120, winRate: 46, trades: 22 },
  { date: "Jan 15", pnl: 540, winRate: 68, trades: 19 },
  { date: "Jan 22", pnl: 280, winRate: 58, trades: 24 },
  { date: "Jan 29", pnl: -210, winRate: 42, trades: 21 },
  { date: "Feb 5", pnl: 690, winRate: 72, trades: 25 },
  { date: "Feb 12", pnl: 320, winRate: 64, trades: 28 },
  { date: "Feb 19", pnl: -90, winRate: 48, trades: 23 },
  { date: "Feb 26", pnl: 420, winRate: 67, trades: 18 },
  { date: "Mar 4", pnl: 580, winRate: 70, trades: 20 },
  { date: "Mar 11", pnl: 210, winRate: 60, trades: 15 },
  { date: "Mar 18", pnl: -150, winRate: 45, trades: 20 },
  { date: "Mar 25", pnl: 320, winRate: 63, trades: 19 },
  { date: "Apr 1", pnl: 480, winRate: 68, trades: 22 },
  { date: "Apr 8", pnl: 380, winRate: 65, trades: 20 },
  { date: "Apr 15", pnl: -80, winRate: 47, trades: 17 },
  { date: "Apr 22", pnl: 620, winRate: 75, trades: 24 },
];

const strategyPerformance = [
  { name: "Momentum Breakout", pnl: 1280, trades: 42, winRate: 68, color: "#4CAF50" },
  { name: "Mean Reversion", pnl: 920, trades: 38, winRate: 63, color: "#2196F3" },
  { name: "Trend Following", pnl: 1540, trades: 45, winRate: 71, color: "#9C27B0" },
  { name: "Volatility Expansion", pnl: 860, trades: 36, winRate: 61, color: "#FF9800" },
  { name: "Liquidity Cascade", pnl: 680, trades: 28, winRate: 57, color: "#E91E63" },
];

const pairPerformance = [
  { name: "BTCUSDT", pnl: 980, trades: 25, color: "#F7931A" },
  { name: "ETHUSDT", pnl: 1200, trades: 32, color: "#627EEA" },
  { name: "BNBUSDT", pnl: 750, trades: 28, color: "#F3BA2F" },
  { name: "SOLUSDT", pnl: 520, trades: 18, color: "#00FFA3" },
  { name: "ADAUSDT", pnl: 380, trades: 15, color: "#0033AD" },
  { name: "DOGEUSDT", pnl: 190, trades: 12, color: "#C2A633" },
  { name: "XRPUSDT", pnl: 320, trades: 14, color: "#23292F" },
  { name: "DOTUSDT", pnl: 280, trades: 13, color: "#E6007A" },
];

const dailyPerformance = [
  { time: "00:00", pnl: 80 },
  { time: "02:00", pnl: -30 },
  { time: "04:00", pnl: 20 },
  { time: "06:00", pnl: 120 },
  { time: "08:00", pnl: 180 },
  { time: "10:00", pnl: 90 },
  { time: "12:00", pnl: -50 },
  { time: "14:00", pnl: 110 },
  { time: "16:00", pnl: 70 },
  { time: "18:00", pnl: 150 },
  { time: "20:00", pnl: 60 },
  { time: "22:00", pnl: 40 },
];

const riskMetrics = {
  maxDrawdown: 12.8,
  sharpeRatio: 1.92,
  sortino: 2.14,
  avgWinLoss: 1.68,
  profitFactor: 2.37,
  riskRewardRatio: 1.85,
  volatility: 8.45,
  exposurePercent: 42,
};

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("3m");
  const [view, setView] = useState("overview");
  
  // Query would normally fetch actual performance data
  const {
    data: performanceMetrics,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['/api/binance/performance'],
    refetchInterval: false,
  });
  
  const cumulativePnL = performanceData.reduce(
    (acc, day, index) => {
      const prevValue = index > 0 ? acc[index - 1].value : 0;
      return [...acc, { date: day.date, value: prevValue + day.pnl }];
    },
    []
  );

  const totalPnL = cumulativePnL.length > 0 ? cumulativePnL[cumulativePnL.length - 1].value : 0;
  const totalTrades = performanceData.reduce((acc, day) => acc + day.trades, 0);
  const avgWinRate = performanceData.reduce((acc, day) => acc + day.winRate, 0) / performanceData.length;
  
  return (
    <Container className="py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Performance Analytics</h1>
            <p className="text-neutral-light">Advanced insights into your trading performance</p>
          </div>
          
          <div className="flex space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] bg-[#1C2230] border-[#2A3441]">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={() => refetch()} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#1C2230] border-[#2A3441]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Total PnL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USDT
                  </span>
                  <span className="text-xs text-neutral-400">Last {timeRange}</span>
                </div>
                {totalPnL >= 0 ? (
                  <TrendingUpIcon className="h-8 w-8 text-green-500" />
                ) : (
                  <TrendingDownIcon className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1C2230] border-[#2A3441]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-blue-500">
                    {avgWinRate.toFixed(1)}%
                  </span>
                  <span className="text-xs text-neutral-400">Across {totalTrades} trades</span>
                </div>
                <PercentIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1C2230] border-[#2A3441]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Profit Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-purple-500">
                    {riskMetrics.profitFactor}
                  </span>
                  <span className="text-xs text-neutral-400">Gross profit / gross loss</span>
                </div>
                <DollarSignIcon className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1C2230] border-[#2A3441]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Max Drawdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-orange-500">
                    {riskMetrics.maxDrawdown}%
                  </span>
                  <span className="text-xs text-neutral-400">Peak to trough decline</span>
                </div>
                <TrendingDownIcon className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={view} onValueChange={setView} className="w-full">
          <TabsList className="bg-[#1C2230] border-b border-[#2A3441] w-full p-0 h-auto rounded-none">
            <div className="flex items-center p-0 bg-transparent w-full overflow-x-auto">
              <TabsTrigger 
                value="overview" 
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="strategy" 
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                Strategy Analysis
              </TabsTrigger>
              <TabsTrigger 
                value="pairs" 
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                Trading Pairs
              </TabsTrigger>
              <TabsTrigger 
                value="risk" 
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                Risk Metrics
              </TabsTrigger>
            </div>
          </TabsList>
          
          <div className="pt-6">
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-2 bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Cumulative PnL</CardTitle>
                    <CardDescription>Performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cumulativePnL}>
                          <defs>
                            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3366FF" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3366FF" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                          <XAxis dataKey="date" stroke="#8F9BB3" />
                          <YAxis stroke="#8F9BB3" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1C2230', 
                              borderColor: '#2A3441',
                              color: '#fff'
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3366FF" 
                            fillOpacity={1} 
                            fill="url(#pnlGradient)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Win Rate Trend</CardTitle>
                    <CardDescription>Performance consistency</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                          <XAxis dataKey="date" stroke="#8F9BB3" />
                          <YAxis domain={[0, 100]} stroke="#8F9BB3" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1C2230', 
                              borderColor: '#2A3441',
                              color: '#fff'
                            }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="winRate" 
                            stroke="#00E396" 
                            strokeWidth={2} 
                            dot={{ r: 4 }} 
                            activeDot={{ r: 6 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1 md:col-span-2 bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Daily PnL</CardTitle>
                    <CardDescription>Profit and loss by trading day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                          <XAxis dataKey="date" stroke="#8F9BB3" />
                          <YAxis stroke="#8F9BB3" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1C2230', 
                              borderColor: '#2A3441',
                              color: '#fff'
                            }} 
                          />
                          <Bar 
                            dataKey="pnl" 
                            fill="#3366FF"
                            radius={[4, 4, 0, 0]}
                          >
                            {performanceData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.pnl >= 0 ? '#00E396' : '#FF4560'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Trading Activity</CardTitle>
                    <CardDescription>Number of trades per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                          <XAxis dataKey="date" stroke="#8F9BB3" />
                          <YAxis stroke="#8F9BB3" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1C2230', 
                              borderColor: '#2A3441',
                              color: '#fff'
                            }} 
                          />
                          <Bar 
                            dataKey="trades" 
                            fill="#775DD0" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="strategy" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-2 bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Strategy Performance</CardTitle>
                    <CardDescription>PnL by trading strategy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={strategyPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                          <XAxis type="number" stroke="#8F9BB3" />
                          <YAxis dataKey="name" type="category" stroke="#8F9BB3" width={150} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1C2230', 
                              borderColor: '#2A3441',
                              color: '#fff'
                            }} 
                          />
                          <Bar 
                            dataKey="pnl" 
                            radius={[0, 4, 4, 0]}
                          >
                            {strategyPerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Strategy Win Rates</CardTitle>
                    <CardDescription>Success rate by strategy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={strategyPerformance}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            dataKey="winRate"
                          >
                            {strategyPerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1C2230', 
                              borderColor: '#2A3441',
                              color: '#fff'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1 md:col-span-3 bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Strategy Trades Distribution</CardTitle>
                    <CardDescription>Number of trades by strategy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={strategyPerformance}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                          <XAxis dataKey="name" stroke="#8F9BB3" />
                          <YAxis stroke="#8F9BB3" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1C2230', 
                              borderColor: '#2A3441',
                              color: '#fff'
                            }} 
                          />
                          <Bar 
                            dataKey="trades" 
                            radius={[4, 4, 0, 0]}
                          >
                            {strategyPerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="pairs" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Trading Pair Performance</CardTitle>
                    <CardDescription>PnL by trading pair</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pairPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                          <XAxis type="number" stroke="#8F9BB3" />
                          <YAxis dataKey="name" type="category" stroke="#8F9BB3" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1C2230', 
                              borderColor: '#2A3441',
                              color: '#fff'
                            }} 
                          />
                          <Bar 
                            dataKey="pnl" 
                            radius={[0, 4, 4, 0]}
                          >
                            {pairPerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Trading Pair Activity</CardTitle>
                    <CardDescription>Number of trades by pair</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pairPerformance}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            dataKey="trades"
                          >
                            {pairPerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1C2230', 
                              borderColor: '#2A3441',
                              color: '#fff'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1 md:col-span-2 bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Hourly Performance</CardTitle>
                    <CardDescription>PnL distribution by time of day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyPerformance}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                          <XAxis dataKey="time" stroke="#8F9BB3" />
                          <YAxis stroke="#8F9BB3" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1C2230', 
                              borderColor: '#2A3441',
                              color: '#fff'
                            }} 
                          />
                          <Bar 
                            dataKey="pnl" 
                            radius={[4, 4, 0, 0]}
                          >
                            {dailyPerformance.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.pnl >= 0 ? '#00E396' : '#FF4560'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="risk" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Sharpe Ratio</CardTitle>
                    <CardDescription>Risk-adjusted return</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <span className="text-5xl font-bold text-blue-500">{riskMetrics.sharpeRatio}</span>
                      <div className="mt-4 text-sm text-neutral-400">
                        <p>Higher is better (above 1 is good)</p>
                        <p className="mt-2">Measures return vs risk</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Sortino Ratio</CardTitle>
                    <CardDescription>Downside risk-adjusted return</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <span className="text-5xl font-bold text-green-500">{riskMetrics.sortino}</span>
                      <div className="mt-4 text-sm text-neutral-400">
                        <p>Higher is better (above 2 is excellent)</p>
                        <p className="mt-2">Focuses on downside risk</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Win/Loss Ratio</CardTitle>
                    <CardDescription>Average profit vs loss</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <span className="text-5xl font-bold text-purple-500">{riskMetrics.avgWinLoss}</span>
                      <div className="mt-4 text-sm text-neutral-400">
                        <p>Higher is better (above 1.5 is good)</p>
                        <p className="mt-2">Avg win / avg loss size</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Volatility</CardTitle>
                    <CardDescription>Daily return standard deviation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <span className="text-5xl font-bold text-amber-500">{riskMetrics.volatility}%</span>
                      <div className="mt-4 text-sm text-neutral-400">
                        <p>Lower indicates more stability</p>
                        <p className="mt-2">Measure of daily fluctuations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1 md:col-span-2 bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Risk Metrics Comparison</CardTitle>
                    <CardDescription>Key risk indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={[
                            { name: 'Sharpe', value: riskMetrics.sharpeRatio, fill: '#3366FF' },
                            { name: 'Sortino', value: riskMetrics.sortino, fill: '#00E396' },
                            { name: 'Win/Loss', value: riskMetrics.avgWinLoss, fill: '#775DD0' },
                            { name: 'Profit Factor', value: riskMetrics.profitFactor, fill: '#FEB019' },
                            { name: 'Risk/Reward', value: riskMetrics.riskRewardRatio, fill: '#FF4560' },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                          <XAxis dataKey="name" stroke="#8F9BB3" />
                          <YAxis stroke="#8F9BB3" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1C2230', 
                              borderColor: '#2A3441',
                              color: '#fff'
                            }} 
                          />
                          <Bar 
                            dataKey="value" 
                            radius={[4, 4, 0, 0]}
                          >
                            {[
                              { name: 'Sharpe', value: riskMetrics.sharpeRatio, fill: '#3366FF' },
                              { name: 'Sortino', value: riskMetrics.sortino, fill: '#00E396' },
                              { name: 'Win/Loss', value: riskMetrics.avgWinLoss, fill: '#775DD0' },
                              { name: 'Profit Factor', value: riskMetrics.profitFactor, fill: '#FEB019' },
                              { name: 'Risk/Reward', value: riskMetrics.riskRewardRatio, fill: '#FF4560' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1 md:col-span-2 bg-[#1C2230] border-[#2A3441]">
                  <CardHeader>
                    <CardTitle>Capital Exposure</CardTitle>
                    <CardDescription>Percentage of capital used in active trades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-40 h-40">
                          <circle
                            className="text-[#131825]"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r="70"
                            cx="80"
                            cy="80"
                          />
                          <circle
                            className="text-blue-600"
                            strokeWidth="8"
                            strokeDasharray={440}
                            strokeDashoffset={440 * (1 - riskMetrics.exposurePercent / 100)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="70"
                            cx="80"
                            cy="80"
                          />
                        </svg>
                        <span className="absolute text-4xl font-bold">
                          {riskMetrics.exposurePercent}%
                        </span>
                      </div>
                      <div className="mt-6 text-sm text-neutral-400">
                        <p>Current capital allocation</p>
                        <p className="mt-2 text-blue-400">58% Reserved Capital</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Container>
  );
}

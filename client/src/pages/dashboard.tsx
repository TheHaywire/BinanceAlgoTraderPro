import { useState } from "react";
import { Container } from "@/components/ui/container";
import MetricCard from "@/components/dashboard/MetricCard";
import TradingChart from "@/components/dashboard/TradingChart";
import ActivePositions from "@/components/dashboard/ActivePositions";
import TradingOpportunities from "@/components/dashboard/TradingOpportunities";
import PerformanceMetrics from "@/components/dashboard/PerformanceMetrics";
import RiskManagementBar from "@/components/dashboard/RiskManagementBar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketData } from "@/hooks/useMarketData";
import { usePositions } from "@/hooks/usePositions";
import { useOpportunities } from "@/hooks/useOpportunities";
import { usePerformanceMetrics, useRiskMetrics } from "@/hooks/usePerformance";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("4h");
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [timeRange, setTimeRange] = useState("24h");

  // Get market and trading data
  const { currentMarketData, marketData } = useMarketData(selectedSymbol);
  const { positions, isLoading: isLoadingPositions } = usePositions();
  const { opportunities, isLoading: isLoadingOpportunities } = useOpportunities();
  const { metrics: performanceMetrics, strategyPerformance, isLoading: isLoadingPerformance } = usePerformanceMetrics();
  const { metrics: riskMetrics, isLoading: isLoadingRisk } = useRiskMetrics();
  
  // Get account data
  const { data: accountInfo } = useQuery({
    queryKey: ['/api/binance/account'],
    staleTime: 60000, // 1 minute
  });

  const portfolioValue = accountInfo?.availableBalance || "0.00";
  const portfolioChange = performanceMetrics?.portfolioChangePercent || "0.00";
  const dailyPnL = performanceMetrics?.dailyPnL || "0.00";
  const dailyPnLPercent = performanceMetrics?.dailyPnLPercent || "0.00";
  const winRate = performanceMetrics?.winRate || 0;
  
  return (
    <Container className="py-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Trading Dashboard</h1>
            <p className="text-neutral-light">Real-time market analysis and automated trading</p>
          </div>
          
          <div className="flex mt-4 md:mt-0 space-x-3">
            <Button 
              className="bg-primary hover:bg-primary-light text-white flex items-center"
            >
              <i className="ri-add-line mr-1.5"></i>
              New Strategy
            </Button>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="bg-[#252D3D] hover:bg-[#1C2230] border-none text-white w-[160px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent className="bg-[#1C2230] border-gray-800">
                <SelectItem value="1h">Last 1 hour</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Portfolio Value"
            value={portfolioValue}
            subtitle="USDT"
            icon="ri-funds-line"
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
            trend={{
              value: `${parseFloat(dailyPnLPercent) >= 0 ? "+" : ""}${dailyPnLPercent}%`,
              direction: parseFloat(dailyPnLPercent) >= 0 ? "up" : "down",
              label: "of portfolio"
            }}
          />
          
          <MetricCard
            title="Win/Loss Ratio"
            value={`${winRate}%`}
            subtitle={`(${performanceMetrics.totalTrades} trades)`}
            icon="ri-percent-line"
            trend={{
              value: "+3%",
              direction: "up",
              label: "from last week"
            }}
          />
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart & Active Positions */}
        <div className="lg:col-span-2 space-y-6">
          <TradingChart 
            symbol={selectedSymbol} 
            marketData={currentMarketData}
            timeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
          />
          
          <ActivePositions 
            positions={positions}
            isLoading={isLoadingPositions}
          />
        </div>
        
        {/* Right Column - Opportunities & Performance */}
        <div className="space-y-6">
          <TradingOpportunities 
            opportunities={opportunities}
            isLoading={isLoadingOpportunities}
          />
          
          <PerformanceMetrics 
            metrics={performanceMetrics}
            strategyPerformance={strategyPerformance}
            isLoading={isLoadingPerformance}
          />
        </div>
      </div>
      
      {/* Risk Management Bar */}
      <RiskManagementBar 
        riskMetrics={riskMetrics}
        isLoading={isLoadingRisk}
      />
    </Container>
  );
}

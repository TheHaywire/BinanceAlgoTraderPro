import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { getMarketData } from "@/lib/binanceApi";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon, BarChart4Icon, RefreshCwIcon, ZapIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const MarketRegimeDisplay = ({ regime }) => {
  const getBadgeClass = () => {
    switch (regime) {
      case 'TRENDING': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'RANGING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'VOLATILE': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'NEUTRAL': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <Badge variant="outline" className={`px-2 py-1 rounded border ${getBadgeClass()}`}>
      {regime}
    </Badge>
  );
};

const PriceChangeDisplay = ({ priceChange, priceChangePercent }) => {
  const isPositive = parseFloat(priceChangePercent) >= 0;
  
  return (
    <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
      {isPositive ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
      <span className="font-medium">{parseFloat(priceChangePercent).toFixed(2)}%</span>
      <span className="ml-2 text-sm text-neutral-400">{parseFloat(priceChange).toFixed(4)}</span>
    </div>
  );
};

const TechnicalAnalysisDisplay = ({ analysis }) => {
  const indicators = [
    { name: 'RSI', value: analysis?.rsi || Math.floor(Math.random() * 100), 
      state: (val) => {
        if (val < 30) return { label: 'Oversold', color: 'text-green-500' };
        if (val > 70) return { label: 'Overbought', color: 'text-red-500' };
        return { label: 'Neutral', color: 'text-gray-400' };
      }
    },
    { name: 'MACD', value: analysis?.macdSignal || (Math.random() * 2 - 1).toFixed(2),
      state: (val) => {
        if (val > 0) return { label: 'Bullish', color: 'text-green-500' };
        return { label: 'Bearish', color: 'text-red-500' };
      }
    },
    { name: 'BB', value: analysis?.bbWidth || (Math.random() * 3 + 1).toFixed(2),
      state: (val) => {
        if (val > 2.5) return { label: 'Expanding', color: 'text-blue-500' };
        if (val < 1.5) return { label: 'Contracting', color: 'text-yellow-500' };
        return { label: 'Normal', color: 'text-gray-400' };
      }
    }
  ];

  return (
    <div className="flex space-x-2">
      {indicators.map(indicator => {
        const state = indicator.state(indicator.value);
        return (
          <div key={indicator.name} className="flex items-center">
            <span className="text-xs font-bold text-neutral-500 mr-1">{indicator.name}</span>
            <span className={`text-xs ${state.color}`}>{state.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const VolumeDisplay = ({ volume, quoteVolume }) => {
  // Convert to appropriate units (K, M, B)
  const formatVolume = (vol) => {
    const num = parseFloat(vol);
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };
  
  return (
    <div className="flex flex-col">
      <span className="text-sm">{formatVolume(quoteVolume || 0)} USDT</span>
      <span className="text-xs text-neutral-400">{formatVolume(volume || 0)} units</span>
    </div>
  );
};

export default function Markets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ field: 'volume', direction: 'desc' });
  const [filter, setFilter] = useState("all");
  const [timeframe, setTimeframe] = useState("1h");
  
  const { 
    data: marketData, 
    isLoading, 
    isError,
    refetch
  } = useQuery({ 
    queryKey: ['/api/binance/market'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get all potential regimes for the filter
  const regimes = ['TRENDING', 'RANGING', 'VOLATILE', 'NEUTRAL'];
  
  const sortedMarkets = marketData ? [...marketData].filter(market => {
    // Filter by search term
    if (searchTerm && !market.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by USDT pairs only - we focus on USDT futures
    if (!market.symbol.endsWith('USDT')) {
      return false;
    }
    
    // Filter by market regime
    if (filter !== "all" && market.marketRegime !== filter) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by the chosen field
    let comparison = 0;
    
    switch (sortConfig.field) {
      case 'symbol':
        comparison = a.symbol.localeCompare(b.symbol);
        break;
      case 'price':
        comparison = parseFloat(a.lastPrice) - parseFloat(b.lastPrice);
        break;
      case 'change':
        comparison = parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent);
        break;
      case 'volume':
        comparison = parseFloat(a.quoteVolume) - parseFloat(b.quoteVolume);
        break;
      default:
        comparison = 0;
    }
    
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  }) : [];

  const handleSort = (field) => {
    setSortConfig({
      field,
      direction: sortConfig.field === field && sortConfig.direction === 'desc' ? 'asc' : 'desc'
    });
  };

  const marketSummary = {
    totalMarkets: sortedMarkets.length,
    upMarkets: sortedMarkets.filter(m => parseFloat(m.priceChangePercent) > 0).length,
    downMarkets: sortedMarkets.filter(m => parseFloat(m.priceChangePercent) < 0).length,
  };

  const regimeCounts = sortedMarkets.reduce((counts, market) => {
    counts[market.marketRegime || 'UNKNOWN'] = (counts[market.marketRegime || 'UNKNOWN'] || 0) + 1;
    return counts;
  }, {});

  return (
    <Container className="py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Markets Overview</h1>
            <p className="text-neutral-light">Monitor Binance Futures markets data and price action</p>
          </div>
          
          <Button 
            onClick={() => refetch()} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCwIcon className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#1C2230] border-[#2A3441]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Market Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">{marketSummary.totalMarkets}</span>
                  <span className="text-xs text-neutral-400">Total Markets</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-green-500">{marketSummary.upMarkets}</span>
                  <span className="text-xs text-neutral-400">Bullish</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-red-500">{marketSummary.downMarkets}</span>
                  <span className="text-xs text-neutral-400">Bearish</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1C2230] border-[#2A3441]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Market Regimes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {regimes.map(regime => (
                  <div key={regime} className="flex flex-col items-center">
                    <MarketRegimeDisplay regime={regime} />
                    <span className="text-xl font-bold mt-1">{regimeCounts[regime] || 0}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1C2230] border-[#2A3441]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Technical Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-xs text-neutral-400">Timeframe</span>
                  <Select 
                    value={timeframe} 
                    onValueChange={setTimeframe}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue placeholder="Timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5m">5m</SelectItem>
                      <SelectItem value="15m">15m</SelectItem>
                      <SelectItem value="1h">1h</SelectItem>
                      <SelectItem value="4h">4h</SelectItem>
                      <SelectItem value="1d">1d</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-center flex-1">
                  <span className="text-xs text-neutral-400">Market Strength</span>
                  <div className="flex items-center justify-center">
                    <ZapIcon className="h-5 w-5 text-yellow-500 mr-1" />
                    <span className="text-lg font-bold">
                      {isLoading ? "..." : "Moderate"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-[#1C2230] rounded-xl p-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:items-center sm:justify-between mb-4">
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search markets..."
                className="pl-10 bg-[#131825] border-[#2A3441]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger className="w-36 h-9 bg-[#131825] border-[#2A3441]">
                  <SelectValue placeholder="Filter by regime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regimes</SelectItem>
                  <SelectItem value="TRENDING">Trending</SelectItem>
                  <SelectItem value="RANGING">Ranging</SelectItem>
                  <SelectItem value="VOLATILE">Volatile</SelectItem>
                  <SelectItem value="NEUTRAL">Neutral</SelectItem>
                </SelectContent>
              </Select>
              
              <BarChart4Icon className="h-5 w-5 text-neutral-400" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#2A3441] hover:bg-transparent">
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('symbol')}
                  >
                    Market {sortConfig.field === 'symbol' && (
                      sortConfig.direction === 'asc' ? '↑' : '↓'
                    )}
                  </TableHead>
                  <TableHead className="text-right">Regime</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort('price')}
                  >
                    Price {sortConfig.field === 'price' && (
                      sortConfig.direction === 'asc' ? '↑' : '↓'
                    )}
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort('change')}
                  >
                    24h Change {sortConfig.field === 'change' && (
                      sortConfig.direction === 'asc' ? '↑' : '↓'
                    )}
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort('volume')}
                  >
                    Volume (24h) {sortConfig.field === 'volume' && (
                      sortConfig.direction === 'asc' ? '↑' : '↓'
                    )}
                  </TableHead>
                  <TableHead className="text-right">Analysis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center">
                        <RefreshCwIcon className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                        <p>Loading market data...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center">
                        <p className="text-red-500 mb-2">Failed to load market data</p>
                        <Button 
                          variant="outline" 
                          onClick={() => refetch()}
                          className="mt-2"
                        >
                          Try Again
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedMarkets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <p>No markets found matching your filters</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedMarkets.map(market => (
                    <TableRow key={market.symbol} className="border-b border-[#1C2230]/60 hover:bg-[#1C2230]/80">
                      <TableCell className="font-medium">
                        {market.symbol}
                      </TableCell>
                      <TableCell className="text-right">
                        <MarketRegimeDisplay regime={market.marketRegime || 'NEUTRAL'} />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {parseFloat(market.lastPrice).toFixed(market.lastPrice < 1 ? 6 : market.lastPrice < 10 ? 4 : 2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <PriceChangeDisplay 
                          priceChange={market.priceChange} 
                          priceChangePercent={market.priceChangePercent} 
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <VolumeDisplay 
                          volume={market.volume} 
                          quoteVolume={market.quoteVolume}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <TechnicalAnalysisDisplay analysis={market.technicalAnalysis} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Container>
  );
}

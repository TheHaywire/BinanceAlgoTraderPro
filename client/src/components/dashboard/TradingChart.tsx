import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Candle, MarketData } from "@/lib/types";
import { getCandles } from "@/lib/binanceApi";
import { DEFAULT_CHART_COLORS, AVAILABLE_TIMEFRAMES } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";

interface TradingChartProps {
  symbol: string;
  marketData?: MarketData;
  timeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
}

export default function TradingChart({
  symbol,
  marketData,
  timeframe = "4h",
  onTimeframeChange = () => {}
}: TradingChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Get candle data for the chart
  const { data: candles = [] } = useQuery({
    queryKey: [`/api/binance/candles?symbol=${symbol}&timeframe=${timeframe}`],
    staleTime: 60000, // 1 minute
  });

  // Update dimensions when window resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Render chart when dimensions or data changes
  useEffect(() => {
    if (!svgRef.current || !candles.length || !containerWidth || !containerHeight) return;
    renderChart(candles);
  }, [candles, containerWidth, containerHeight]);

  const renderChart = (candleData: Candle[]) => {
    if (!svgRef.current) return;
    
    // Chart dimensions
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    
    // Clear previous chart
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }
    
    // Find min/max values for scaling
    const minPrice = Math.min(...candleData.map(d => parseFloat(d.low)));
    const maxPrice = Math.max(...candleData.map(d => parseFloat(d.high)));
    const maxVolume = Math.max(...candleData.map(d => parseFloat(d.volume)));
    
    // Calculate scales
    const xScale = width / candleData.length;
    const yScale = height / (maxPrice - minPrice);
    
    // Create grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height + margin.top;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', margin.left.toString());
      line.setAttribute('y1', y.toString());
      line.setAttribute('x2', (width + margin.left).toString());
      line.setAttribute('y2', y.toString());
      line.setAttribute('stroke', DEFAULT_CHART_COLORS.grid.line);
      line.setAttribute('stroke-width', '1');
      svgRef.current.appendChild(line);
    }
    
    // Render candles
    candleData.forEach((candle, i) => {
      const open = parseFloat(candle.open);
      const close = parseFloat(candle.close);
      const high = parseFloat(candle.high);
      const low = parseFloat(candle.low);
      const volume = parseFloat(candle.volume);
      
      const x = i * xScale + margin.left;
      const candleWidth = xScale * 0.8;
      
      const y1 = height - (high - minPrice) * yScale + margin.top;
      const y2 = height - (low - minPrice) * yScale + margin.top;
      const yOpen = height - (open - minPrice) * yScale + margin.top;
      const yClose = height - (close - minPrice) * yScale + margin.top;
      
      const isUp = close >= open;
      const fillColor = isUp ? DEFAULT_CHART_COLORS.candle.up : DEFAULT_CHART_COLORS.candle.down;
      
      // Draw wick (high-low line)
      const wick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      wick.setAttribute('x1', (x + candleWidth/2).toString());
      wick.setAttribute('y1', y1.toString());
      wick.setAttribute('x2', (x + candleWidth/2).toString());
      wick.setAttribute('y2', y2.toString());
      wick.setAttribute('stroke', fillColor);
      wick.setAttribute('stroke-width', '1');
      svgRef.current.appendChild(wick);
      
      // Draw candle body
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', (x + candleWidth * 0.1).toString());
      rect.setAttribute('y', (isUp ? yClose : yOpen).toString());
      rect.setAttribute('width', (candleWidth * 0.8).toString());
      rect.setAttribute('height', Math.abs(yClose - yOpen).toString());
      rect.setAttribute('fill', fillColor);
      rect.setAttribute('opacity', '0.9');
      svgRef.current.appendChild(rect);
      
      // Draw volume bar
      const volumeHeight = (volume / maxVolume) * (height * 0.2);
      const volumeBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      volumeBar.setAttribute('x', (x + candleWidth * 0.1).toString());
      volumeBar.setAttribute('y', (height + margin.top - volumeHeight).toString());
      volumeBar.setAttribute('width', (candleWidth * 0.8).toString());
      volumeBar.setAttribute('height', volumeHeight.toString());
      volumeBar.setAttribute('fill', isUp ? DEFAULT_CHART_COLORS.volume.up : DEFAULT_CHART_COLORS.volume.down);
      svgRef.current.appendChild(volumeBar);
    });
  };

  // Display price and change percentage
  const price = marketData?.price || '0';
  const priceChangePercent = marketData?.priceChangePercent || '0';
  const isPriceUp = parseFloat(priceChangePercent) >= 0;

  return (
    <Card className="premium-card overflow-hidden relative">
      {/* Add subtle gradient overlay in top-right corner */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-glow rounded-full opacity-30 blur-xl"></div>
      
      <CardContent className="p-5 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div className="flex items-center">
            <div className="flex flex-col">
              <h2 className="font-bold text-xl">{symbol}</h2>
              <div className="flex items-center mt-1">
                <span className={`text-lg font-medium ${isPriceUp ? 'text-gradient-profit' : 'text-[#FF3B69]'}`}>
                  ${price}
                </span>
                <span className={`ml-2 ${isPriceUp ? 'text-success' : 'text-danger'} text-xs flex items-center font-medium`}>
                  <i className={`${isPriceUp ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-1`}></i>
                  {isPriceUp ? '+' : ''}{priceChangePercent}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-1.5">
            {AVAILABLE_TIMEFRAMES.slice(2, 7).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'default' : 'outline'} 
                size="sm"
                className={`
                  px-3 py-1 text-xs font-medium
                  ${timeframe === tf 
                    ? 'bg-gradient-to-r from-[#0095FF] to-[#0066CC] text-white border-none shadow-lg shadow-primary/20' 
                    : 'bg-[rgba(28,34,48,0.5)] text-white hover:bg-[rgba(28,34,48,0.7)] border-none'}
                `}
                onClick={() => onTimeframeChange(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
        
        <div 
          ref={containerRef} 
          className="chart-area h-[350px] rounded-lg p-3 mb-4 relative"
        >
          <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-[rgba(19,23,34,0.7)] text-xs text-neutral-light">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <svg 
            ref={svgRef} 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${containerWidth} ${containerHeight}`}
          ></svg>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            className="bg-gradient-to-r from-[#00C897] to-[#00A57E] text-white hover:from-[#00A57E] hover:to-[#00C897] px-5 py-2 rounded-lg text-sm font-medium flex items-center shadow-lg shadow-success/20"
          >
            <i className="ri-arrow-right-up-line mr-1.5"></i>
            Long
          </Button>
          <Button 
            className="bg-gradient-to-r from-[#FF3B69] to-[#DB2A69] text-white hover:from-[#DB2A69] hover:to-[#FF3B69] px-5 py-2 rounded-lg text-sm font-medium flex items-center shadow-lg shadow-danger/20"
          >
            <i className="ri-arrow-right-down-line mr-1.5"></i>
            Short
          </Button>
          <Button 
            variant="outline"
            className="bg-[rgba(28,34,48,0.5)] text-white hover:bg-[rgba(28,34,48,0.7)] px-4 py-2 rounded-lg text-sm font-medium flex items-center border-none"
          >
            <i className="ri-line-chart-line mr-1.5"></i>
            Indicators
          </Button>
          <Button 
            variant="outline"
            className="bg-[rgba(28,34,48,0.5)] text-white hover:bg-[rgba(28,34,48,0.7)] px-4 py-2 rounded-lg text-sm font-medium flex items-center border-none"
          >
            <i className="ri-pencil-ruler-line mr-1.5"></i>
            Draw
          </Button>
          <Button 
            variant="outline"
            className="bg-[rgba(28,34,48,0.5)] text-white hover:bg-[rgba(28,34,48,0.7)] px-4 py-2 rounded-lg text-sm font-medium flex items-center border-none ml-auto"
          >
            <i className="ri-fullscreen-line mr-1.5"></i>
            Expand
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

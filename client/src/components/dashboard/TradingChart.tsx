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
    <div className="card-chart">
      {/* Subtle animated gradient overlay for visual depth */}
      <div className="absolute top-0 right-0 w-full h-80 bg-gradient-glow opacity-20 blur-2xl"></div>
      
      <div className="p-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Symbol and Price Information */}
            <div className="bg-[rgba(14,18,28,0.4)] p-3 rounded-xl border border-[rgba(73,86,118,0.15)] shadow-lg flex items-center">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#162253] to-[#0C1333] flex items-center justify-center mr-3 shadow-inner">
                <span className="font-bold text-gradient-blue">{symbol.replace('USDT', '')}</span>
              </div>
              <div>
                <div className="flex items-baseline mb-0.5">
                  <span className="font-mono text-lg font-bold tracking-tight">${parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium flex items-center ${
                    isPriceUp ? 'bg-[rgba(0,200,151,0.1)] text-[#00C897]' : 'bg-[rgba(255,59,105,0.1)] text-[#FF3B69]'
                  }`}>
                    <i className={`${isPriceUp ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-0.5`}></i>
                    {isPriceUp ? '+' : ''}{priceChangePercent}%
                  </span>
                </div>
                <div className="text-xs text-neutral-light">Binance Futures</div>
              </div>
            </div>
            
            {/* Market Stats Pills */}
            <div className="flex space-x-2 self-start sm:self-center">
              <div className="premium-tag premium-tag-primary flex items-center">
                <i className="ri-line-chart-line mr-1.5 text-[#4FBBFF]"></i>
                24h Vol: $143.2M
              </div>
              <div className="premium-tag flex items-center">
                <i className="ri-funds-box-line mr-1.5 text-neutral-light"></i>
                OI: $1.87B
              </div>
            </div>
          </div>
          
          {/* Timeframe Selector */}
          <div className="bg-[rgba(14,18,28,0.4)] p-1.5 rounded-xl border border-[rgba(73,86,118,0.15)] self-start flex">
            {AVAILABLE_TIMEFRAMES.slice(1, 7).map((tf) => (
              <button
                key={tf}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300
                  ${timeframe === tf 
                    ? 'bg-gradient-to-r from-[#0066CC] to-[#0095FF] text-white shadow-lg shadow-primary/15' 
                    : 'text-neutral-light hover:bg-[rgba(28,34,48,0.5)]'}
                `}
                onClick={() => onTimeframeChange(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tools Row */}
        <div className="flex items-center mb-4 flex-wrap gap-1.5 sm:gap-0">
          <div className="bg-[rgba(14,18,28,0.4)] p-1.5 rounded-xl border border-[rgba(73,86,118,0.15)] flex mr-auto">
            <button className="icon-button h-8 w-8 bg-[rgba(0,149,255,0.1)] border-[rgba(0,149,255,0.2)] text-[#4FBBFF]">
              <i className="ri-line-chart-line"></i>
            </button>
            <button className="icon-button h-8 w-8">
              <i className="ri-bar-chart-2-line"></i>
            </button>
            <button className="icon-button h-8 w-8">
              <i className="ri-bubble-chart-line"></i>
            </button>
            <button className="icon-button h-8 w-8">
              <i className="ri-ruler-line"></i>
            </button>
          </div>
          
          <div className="bg-[rgba(14,18,28,0.4)] p-1.5 rounded-xl border border-[rgba(73,86,118,0.15)] flex">
            <button className="icon-button h-8 w-8">
              <i className="ri-add-line"></i>
            </button>
            <button className="icon-button h-8 w-8">
              <i className="ri-subtract-line"></i>
            </button>
            <button className="icon-button h-8 w-8">
              <i className="ri-fullscreen-line"></i>
            </button>
            <button className="icon-button h-8 w-8">
              <i className="ri-settings-3-line"></i>
            </button>
          </div>
        </div>
        
        {/* Chart Container */}
        <div 
          ref={containerRef} 
          className="chart-area h-[380px] rounded-xl p-3 mb-5 relative"
        >
          {/* Date Display */}
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-[rgba(12,15,23,0.7)] text-xs text-neutral-light flex items-center border border-[rgba(73,86,118,0.15)]">
            <i className="ri-calendar-line mr-1.5"></i>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          
          {/* Chart Legend */}
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-[rgba(12,15,23,0.7)] text-xs flex items-center space-x-3 border border-[rgba(73,86,118,0.15)]">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-[#4FBBFF] rounded-full mr-1.5"></div>
              <span className="text-neutral-light">Price</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-[#00C897] rounded-full mr-1.5"></div>
              <span className="text-neutral-light">Volume</span>
            </div>
          </div>
          
          <svg 
            ref={svgRef} 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${containerWidth} ${containerHeight}`}
          ></svg>
        </div>
        
        {/* Trading Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Long Action Card */}
          <div className="bg-gradient-profit rounded-xl border border-[rgba(0,200,151,0.15)] p-4">
            <div className="flex justify-between mb-3">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-lg bg-[rgba(0,200,151,0.1)] flex items-center justify-center mr-2">
                  <i className="ri-arrow-up-line text-[#00C897]"></i>
                </div>
                <span className="font-medium">Long Position</span>
              </div>
              <div className="premium-tag premium-tag-success text-xs">
                Margin: $1,250
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-[rgba(12,15,23,0.3)] rounded-lg p-2">
                <div className="text-xs text-neutral-light mb-1">Entry Price</div>
                <div className="font-mono font-medium">${(parseFloat(price) * 0.999).toFixed(2)}</div>
              </div>
              <div className="bg-[rgba(12,15,23,0.3)] rounded-lg p-2">
                <div className="text-xs text-neutral-light mb-1">Leverage</div>
                <select className="w-full bg-transparent border-none text-white font-medium focus:ring-0 p-0 h-6">
                  <option>5x</option>
                  <option>10x</option>
                  <option>20x</option>
                </select>
              </div>
              <div className="bg-[rgba(12,15,23,0.3)] rounded-lg p-2">
                <div className="text-xs text-neutral-light mb-1">Size (USDT)</div>
                <input className="w-full bg-transparent border-none text-white font-medium focus:ring-0 p-0 h-6" 
                  defaultValue="250" />
              </div>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-[#00C897] to-[#00A57E] text-white hover:from-[#00A57E] hover:to-[#00C897] py-2.5 rounded-lg text-sm font-medium flex items-center justify-center shadow-lg shadow-success/20"
            >
              <i className="ri-arrow-right-up-line mr-1.5"></i>
              Open Long Position
            </Button>
          </div>
          
          {/* Short Action Card */}
          <div className="bg-gradient-loss rounded-xl border border-[rgba(255,59,105,0.15)] p-4">
            <div className="flex justify-between mb-3">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-lg bg-[rgba(255,59,105,0.1)] flex items-center justify-center mr-2">
                  <i className="ri-arrow-down-line text-[#FF3B69]"></i>
                </div>
                <span className="font-medium">Short Position</span>
              </div>
              <div className="premium-tag premium-tag-danger text-xs">
                Margin: $1,250
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-[rgba(12,15,23,0.3)] rounded-lg p-2">
                <div className="text-xs text-neutral-light mb-1">Entry Price</div>
                <div className="font-mono font-medium">${(parseFloat(price) * 1.001).toFixed(2)}</div>
              </div>
              <div className="bg-[rgba(12,15,23,0.3)] rounded-lg p-2">
                <div className="text-xs text-neutral-light mb-1">Leverage</div>
                <select className="w-full bg-transparent border-none text-white font-medium focus:ring-0 p-0 h-6">
                  <option>5x</option>
                  <option>10x</option>
                  <option>20x</option>
                </select>
              </div>
              <div className="bg-[rgba(12,15,23,0.3)] rounded-lg p-2">
                <div className="text-xs text-neutral-light mb-1">Size (USDT)</div>
                <input className="w-full bg-transparent border-none text-white font-medium focus:ring-0 p-0 h-6" 
                  defaultValue="250" />
              </div>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-[#FF3B69] to-[#DB2A69] text-white hover:from-[#DB2A69] hover:to-[#FF3B69] py-2.5 rounded-lg text-sm font-medium flex items-center justify-center shadow-lg shadow-danger/20"
            >
              <i className="ri-arrow-right-down-line mr-1.5"></i>
              Open Short Position
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

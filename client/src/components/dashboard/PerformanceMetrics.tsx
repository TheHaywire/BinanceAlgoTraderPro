import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PerformanceMetrics as PerformanceMetricsType, StrategyPerformance } from "@/lib/types";
import { STRATEGY_NAMES } from "@/lib/constants";

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsType;
  strategyPerformance: StrategyPerformance[];
  isLoading: boolean;
}

export default function PerformanceMetrics({ 
  metrics, 
  strategyPerformance,
  isLoading 
}: PerformanceMetricsProps) {
  const equityCurveRef = useRef<SVGSVGElement>(null);
  const winLossChartRef = useRef<SVGSVGElement>(null);
  const strategyChartRef = useRef<SVGSVGElement>(null);

  // Create equity curve chart
  useEffect(() => {
    if (!equityCurveRef.current || isLoading) return;
    
    // Placeholder for a real equity curve from performance data
    const svgElement = equityCurveRef.current;
    
    // Clear previous chart
    while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
    }
    
    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * 100;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', y.toString());
      line.setAttribute('x2', '400');
      line.setAttribute('y2', y.toString());
      line.setAttribute('stroke', '#252D3D');
      line.setAttribute('stroke-width', '1');
      svgElement.appendChild(line);
    }
    
    // Equity curve path - just a placeholder curve
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0,80 C20,75 40,70 60,65 S100,60 120,58 S160,50 180,45 S220,40 240,38 S280,35 300,32 S340,28 360,25 S380,20 400,18');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#00C897');
    path.setAttribute('stroke-width', '2');
    svgElement.appendChild(path);
    
    // Area under curve
    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('d', 'M0,80 C20,75 40,70 60,65 S100,60 120,58 S160,50 180,45 S220,40 240,38 S280,35 300,32 S340,28 360,25 S380,20 400,18 L400,100 L0,100 Z');
    areaPath.setAttribute('fill', 'url(#gradientSuccess)');
    areaPath.setAttribute('stroke', 'none');
    areaPath.setAttribute('opacity', '0.2');
    svgElement.appendChild(areaPath);
    
    // Add gradient definition
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'gradientSuccess');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#00C897');
    stop1.setAttribute('stop-opacity', '0.8');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#00C897');
    stop2.setAttribute('stop-opacity', '0');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svgElement.appendChild(defs);
  }, [isLoading, metrics]);

  // Create win/loss donut chart
  useEffect(() => {
    if (!winLossChartRef.current || isLoading) return;
    
    const svgElement = winLossChartRef.current;
    
    // Clear previous chart
    while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
    }
    
    const wins = metrics.winningTrades;
    const losses = metrics.losingTrades;
    const winRate = metrics.winRate;
    
    // Background circle
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', '50');
    bgCircle.setAttribute('cy', '50');
    bgCircle.setAttribute('r', '40');
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', '#FF3B69');
    bgCircle.setAttribute('stroke-width', '15');
    svgElement.appendChild(bgCircle);
    
    // Win rate arc
    const winCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    winCircle.setAttribute('cx', '50');
    winCircle.setAttribute('cy', '50');
    winCircle.setAttribute('r', '40');
    winCircle.setAttribute('fill', 'none');
    winCircle.setAttribute('stroke', '#00C897');
    winCircle.setAttribute('stroke-width', '15');
    winCircle.setAttribute('stroke-dasharray', `${2 * Math.PI * 40 * (winRate / 100)} ${2 * Math.PI * 40 * (1 - winRate / 100)}`);
    winCircle.setAttribute('stroke-dashoffset', '0');
    winCircle.setAttribute('transform', 'rotate(-90 50 50)');
    svgElement.appendChild(winCircle);
    
    // Center text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '50');
    text.setAttribute('y', '50');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#FFFFFF');
    text.setAttribute('font-size', '20');
    text.setAttribute('font-weight', 'bold');
    text.textContent = `${winRate}%`;
    svgElement.appendChild(text);
  }, [isLoading, metrics]);

  // Create strategy performance bar chart
  useEffect(() => {
    if (!strategyChartRef.current || isLoading) return;
    
    const svgElement = strategyChartRef.current;
    
    // Clear previous chart
    while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
    }
    
    // Create bars for each strategy
    strategyPerformance.slice(0, 4).forEach((strategy, index) => {
      const x = 40 * index + 10;
      // Scale the bar height based on strategy performance
      const barHeight = 60 * (strategy.winRate / 100);
      const y = 70 - barHeight;
      
      const barColor = index % 2 === 0 ? '#0095FF' : '#00C897';
      
      // Bar
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x.toString());
      rect.setAttribute('y', y.toString());
      rect.setAttribute('width', '30');
      rect.setAttribute('height', barHeight.toString());
      rect.setAttribute('fill', barColor);
      rect.setAttribute('opacity', '0.8');
      svgElement.appendChild(rect);
      
      // Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (x + 15).toString());
      text.setAttribute('y', '82');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#FFFFFF');
      text.setAttribute('font-size', '8');
      
      // Handle different types of strategies with abbreviations
      let label = "";
      switch(strategy.strategy) {
        case "MOMENTUM_BREAKOUT":
          label = "Momentum";
          break;
        case "MEAN_REVERSION":
          label = "Mean Rev";
          break;
        case "VOLATILITY_EXPANSION":
          label = "Vol Exp";
          break;
        case "FUNDING_ARBITRAGE":
          label = "Funding";
          break;
        case "LIQUIDATION_CASCADE":
          label = "Liquid";
          break;
        default:
          label = "Other";
      }
      
      text.textContent = label;
      svgElement.appendChild(text);
    });
  }, [isLoading, strategyPerformance]);

  return (
    <Card className="card-glass">
      <CardContent className="p-4">
        <h2 className="font-semibold text-lg mb-4 flex items-center">
          <i className="ri-line-chart-line text-primary mr-2"></i>
          Performance Metrics
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#1C2230] rounded-lg p-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm">Equity Curve (7 days)</span>
                <span className={`
                  ${parseFloat(metrics.weeklyPnLPercent) >= 0 
                    ? "text-success bg-success" 
                    : "text-danger bg-danger"
                  } bg-opacity-20 text-xs px-2 py-0.5 rounded
                `}>
                  {parseFloat(metrics.weeklyPnLPercent) >= 0 ? "+" : ""}
                  {metrics.weeklyPnLPercent}%
                </span>
              </div>
              
              <div className="chart-area h-32 rounded-md p-2 mb-2">
                <svg 
                  ref={equityCurveRef}
                  width="100%" 
                  height="100%" 
                  viewBox="0 0 400 100"
                ></svg>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1C2230] rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Win/Loss Ratio</span>
                </div>
                
                <div className="chart-area h-24 rounded-md flex items-center justify-center">
                  <svg 
                    ref={winLossChartRef}
                    width="80" 
                    height="80" 
                    viewBox="0 0 100 100"
                  ></svg>
                  
                  <div className="ml-4">
                    <div className="flex items-center text-xs mb-1">
                      <span className="w-3 h-3 bg-success rounded-full mr-2"></span>
                      <span>Wins: {metrics.winningTrades}</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className="w-3 h-3 bg-danger rounded-full mr-2"></span>
                      <span>Losses: {metrics.losingTrades}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#1C2230] rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Strategy Performance</span>
                </div>
                
                <div className="chart-area h-24 rounded-md flex items-center justify-center">
                  <svg 
                    ref={strategyChartRef}
                    width="100%" 
                    height="100%" 
                    viewBox="0 0 180 90"
                  ></svg>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1C2230] rounded-lg p-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm">Risk Metrics</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-neutral-light mb-1">Sharpe Ratio</div>
                  <div className={parseFloat(metrics.sharpeRatio) >= 1 ? "text-success" : "text-neutral-light"} font-medium>
                    {metrics.sharpeRatio}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-light mb-1">Max Drawdown</div>
                  <div className="text-danger font-medium">{metrics.maxDrawdown}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-light mb-1">Avg. Trade</div>
                  <div className={parseFloat(metrics.avgProfit) >= 0 ? "text-success" : "text-danger"} font-medium>
                    {parseFloat(metrics.avgProfit) >= 0 ? "+" : ""}{metrics.avgProfit}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

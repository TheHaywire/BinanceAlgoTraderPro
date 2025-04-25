import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PerformanceMetrics as PerformanceMetricsType } from "@/lib/types";
import { STRATEGY_NAMES } from "@/lib/constants";

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsType;
  strategyPerformance: any[];
  isLoading: boolean;
}

export default function PerformanceMetrics({ metrics, strategyPerformance, isLoading }: PerformanceMetricsProps) {
  if (isLoading || !metrics) {
    return (
      <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // Ensure metrics is an object with default values
  const safeMetrics = metrics || {};

  return (
    <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Performance Analytics</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="border-[rgba(73,86,118,0.3)] text-white">
            <i className="ri-download-line mr-1.5"></i>
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[rgba(10,15,28,0.3)] rounded-xl p-4">
          <div className="text-sm text-neutral-400 mb-2">Trade P&L</div>
          <div className="text-xl font-bold text-white">
            {parseFloat(safeMetrics.totalPnL || "0") >= 0 ? "+" : ""}
            {safeMetrics.totalPnL || "0.00"} USDT
          </div>
          <div className="text-sm text-neutral-400">
            Total return {parseFloat(safeMetrics.totalPnLPercent || "0") >= 0 ? "+" : ""}
            {safeMetrics.totalPnLPercent || "0.00"}%
          </div>
          <div className="mt-2 h-24 flex items-end">
            <div className="flex-1 h-3/4 bg-[rgba(0,149,255,0.1)] flex items-end justify-center rounded-t-md">
              <div className="w-3/4 h-2/3 bg-primary rounded-t-md"></div>
            </div>
            <div className="flex-1 h-1/2 bg-[rgba(0,149,255,0.1)] flex items-end justify-center rounded-t-md">
              <div className="w-3/4 h-2/3 bg-primary rounded-t-md"></div>
            </div>
            <div className="flex-1 h-full bg-[rgba(0,149,255,0.1)] flex items-end justify-center rounded-t-md">
              <div className="w-3/4 h-4/5 bg-primary rounded-t-md"></div>
            </div>
            <div className="flex-1 h-2/3 bg-[rgba(0,149,255,0.1)] flex items-end justify-center rounded-t-md">
              <div className="w-3/4 h-1/2 bg-primary rounded-t-md"></div>
            </div>
            <div className="flex-1 h-full bg-[rgba(0,149,255,0.1)] flex items-end justify-center rounded-t-md">
              <div className="w-3/4 h-5/6 bg-primary rounded-t-md"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-[rgba(10,15,28,0.3)] rounded-xl p-4">
          <div className="text-sm text-neutral-400 mb-2">Performance Metrics</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-300">Win/Loss Ratio</span>
              <span className="text-sm font-medium">{safeMetrics.winRate || "0.00"}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-300">Total Trades</span>
              <span className="text-sm font-medium">{safeMetrics.totalTrades || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-300">Sharpe Ratio</span>
              <span className="text-sm font-medium">{safeMetrics.sharpeRatio || "0.00"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-300">Max Drawdown</span>
              <span className="text-sm font-medium">{safeMetrics.maxDrawdown || "0.00"}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-300">Avg. Trade Duration</span>
              <span className="text-sm font-medium">{safeMetrics.avgTradeDuration || "0"} min</span>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-3">Strategy Performance</h4>
        <div className="overflow-hidden border border-[rgba(73,86,118,0.15)] rounded-xl">
          <Table className="premium-table">
            <TableHeader>
              <TableRow>
                <TableHead>Strategy</TableHead>
                <TableHead>Win Rate</TableHead>
                <TableHead>Profit/Loss</TableHead>
                <TableHead>Trades</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {strategyPerformance && strategyPerformance.length > 0 ? (
                strategyPerformance.map((strategy) => (
                  <TableRow key={strategy.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-[rgba(0,149,255,0.1)] text-primary border-none mr-2">
                          {STRATEGY_NAMES[strategy.type] || strategy.type}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-16 bg-[rgba(73,86,118,0.15)] h-1.5 rounded-full overflow-hidden mr-2">
                          <div 
                            className={`h-full ${strategy.winRate >= 50 ? 'bg-[#00C897]' : 'bg-[#FF3B69]'}`}
                            style={{ width: `${Math.min(100, strategy.winRate)}%` }}
                          ></div>
                        </div>
                        <span>{strategy.winRate}%</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className={parseFloat(strategy.pnl) >= 0 ? 'text-[#00C897]' : 'text-[#FF3B69]'}>
                        {parseFloat(strategy.pnl) >= 0 ? '+' : ''}{strategy.pnl} USDT
                      </span>
                    </TableCell>
                    
                    <TableCell>{strategy.trades}</TableCell>
                    
                    <TableCell className="text-right">
                      <Badge 
                        className={
                          strategy.active ? 
                            'bg-[rgba(0,200,151,0.1)] text-[#00C897] border-none' : 
                            'bg-[rgba(255,184,0,0.1)] text-[#FFB800] border-none'
                        }
                      >
                        {strategy.active ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-neutral-400">
                    No strategy performance data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMutation } from "@tanstack/react-query";
import { closePosition } from "@/lib/binanceApi";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Position } from "@/lib/types";
import { useState } from "react";

interface ActivePositionsProps {
  positions: Position[];
  isLoading: boolean;
}

export default function ActivePositions({ positions, isLoading }: ActivePositionsProps) {
  // Track which position is being closed
  const [closingSymbol, setClosingSymbol] = useState<string | null>(null);
  
  // Position close mutation
  const closePositionMutation = useMutation({
    mutationFn: ({ symbol, positionSide }: { symbol: string; positionSide: 'LONG' | 'SHORT' | 'BOTH' }) => {
      // Set the currently closing symbol
      setClosingSymbol(symbol);
      console.log(`Closing position for ${symbol} (${positionSide})`);
      
      // Execute the close via API
      return closePosition(symbol, positionSide);
    },
    onSuccess: (data) => {
      // Clear the closing symbol
      setClosingSymbol(null);
      
      // Show success toast
      toast({
        title: "Position Closed",
        description: data.simulated
          ? "Simulated position has been closed successfully"
          : "Position has been closed successfully on Binance",
        variant: "default",
      });
      
      // Refresh related data
      queryClient.invalidateQueries({ queryKey: ['/api/binance/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/binance/opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/binance/performance'] });
    },
    onError: (error: any) => {
      // Clear the closing symbol
      setClosingSymbol(null);
      
      // Show error toast
      toast({
        title: "Close Position Failed",
        description: error?.message || "Unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Format profit/loss amount
  const formatPnL = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const prefix = numValue >= 0 ? '+' : '';
    return `${prefix}${numValue.toFixed(2)}`;
  };
  
  // Calculate profit/loss percentage
  const calculatePnLPercent = (position: Position): string => {
    const entryPrice = parseFloat(position.entryPrice);
    const markPrice = parseFloat(position.markPrice);
    const positionAmt = parseFloat(position.positionAmt);
    
    if (entryPrice === 0 || positionAmt === 0) return '0.00%';
    
    const direction = positionAmt > 0 ? 1 : -1;
    const pnlPercent = direction * ((markPrice - entryPrice) / entryPrice) * 100;
    
    return `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`;
  };

  // Get position side from positionAmt
  const getPositionSide = (position: Position): 'LONG' | 'SHORT' | 'BOTH' => {
    const positionAmt = parseFloat(position.positionAmt);
    return positionAmt > 0 ? 'LONG' : positionAmt < 0 ? 'SHORT' : 'BOTH';
  };

  if (isLoading) {
    return (
      <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-48 bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Active Positions</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="border-[rgba(73,86,118,0.3)] text-white">
            <i className="ri-settings-4-line mr-1.5"></i>
            Settings
          </Button>
        </div>
      </div>
      
      {positions.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center rounded-full bg-[rgba(10,15,28,0.5)]">
            <i className="ri-exchange-funds-line text-2xl opacity-50"></i>
          </div>
          <p>No active positions</p>
          <p className="text-xs mt-1 text-neutral-300">Positions will appear here when trades are executed</p>
        </div>
      ) : (
        <div className="overflow-hidden border border-[rgba(73,86,118,0.15)] rounded-xl">
          <Table className="premium-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Symbol</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>Mark Price</TableHead>
                <TableHead>PnL</TableHead>
                <TableHead>Liquidation</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => {
                const pnl = parseFloat(position.unRealizedProfit);
                const pnlPercent = calculatePnLPercent(position);
                const isPnlPositive = pnl >= 0;
                const positionSide = getPositionSide(position);
                const positionSize = Math.abs(parseFloat(position.positionAmt));
                
                return (
                  <TableRow key={position.symbol}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-[#162253] to-[#0C1333] flex items-center justify-center mr-2">
                          <span className="font-bold text-xs">
                            {position.symbol.replace(/USDT$/, "")}
                          </span>
                        </div>
                        <div>
                          <span>{position.symbol}</span>
                          <div className="mt-0.5">
                            <Badge className={`text-xs ${
                              positionSide === 'LONG' 
                                ? 'bg-[rgba(0,200,151,0.1)] text-[#00C897] border-[rgba(0,200,151,0.2)]' 
                                : 'bg-[rgba(255,59,105,0.1)] text-[#FF3B69] border-[rgba(255,59,105,0.2)]'
                            }`}>
                              {positionSide}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium">{positionSize}</div>
                      <div className="text-xs text-neutral-400">{position.leverage}x</div>
                    </TableCell>
                    
                    <TableCell className="font-mono">
                      ${parseFloat(position.entryPrice).toFixed(2)}
                    </TableCell>
                    
                    <TableCell className="font-mono">
                      ${parseFloat(position.markPrice).toFixed(2)}
                    </TableCell>
                    
                    <TableCell>
                      <div className={isPnlPositive ? "text-[#00C897]" : "text-[#FF3B69]"}>
                        {formatPnL(pnl)}
                      </div>
                      <div className={`text-xs ${isPnlPositive ? "text-[#00C897]" : "text-[#FF3B69]"}`}>
                        {pnlPercent}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-mono">
                        ${parseFloat(position.liquidationPrice).toFixed(2)}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {Math.abs(
                          ((parseFloat(position.markPrice) - parseFloat(position.liquidationPrice)) / 
                          parseFloat(position.markPrice)) * 100
                        ).toFixed(1)}% away
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[rgba(255,59,105,0.3)] text-[#FF3B69] hover:text-[#FF3B69] hover:bg-[rgba(255,59,105,0.1)]"
                        onClick={() => closePositionMutation.mutate({ 
                          symbol: position.symbol, 
                          positionSide
                        })}
                        disabled={closePositionMutation.isPending || closingSymbol === position.symbol}
                      >
                        {(closePositionMutation.isPending && closingSymbol === position.symbol) ? (
                          <div className="flex items-center">
                            <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin mr-1"></div>
                            <span>Closing</span>
                          </div>
                        ) : 'Close'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
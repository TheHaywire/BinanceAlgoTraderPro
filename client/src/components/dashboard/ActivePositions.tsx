import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Position } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { closePosition, setTPSL } from "@/lib/binanceApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ActivePositionsProps {
  positions: Position[];
  isLoading: boolean;
}

export default function ActivePositions({ positions, isLoading }: ActivePositionsProps) {
  const { toast } = useToast();
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [tpslDialogOpen, setTpslDialogOpen] = useState(false);
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const closePositionMutation = useMutation({
    mutationFn: ({ symbol, positionSide }: { symbol: string, positionSide: 'LONG' | 'SHORT' | 'BOTH' }) => 
      closePosition(symbol, positionSide),
    onSuccess: () => {
      toast({
        title: "Position closed",
        description: "The position has been closed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/binance/positions'] });
    },
    onError: (error) => {
      toast({
        title: "Error closing position",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const setTpslMutation = useMutation({
    mutationFn: ({ 
      symbol, 
      positionSide, 
      stopPrice,
      profitPrice 
    }: { 
      symbol: string, 
      positionSide: 'LONG' | 'SHORT' | 'BOTH',
      stopPrice?: string,
      profitPrice?: string
    }) => setTPSL(symbol, positionSide, stopPrice, profitPrice),
    onSuccess: () => {
      setTpslDialogOpen(false);
      toast({
        title: "TP/SL set",
        description: "Take profit and stop loss have been set successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/binance/positions'] });
    },
    onError: (error) => {
      toast({
        title: "Error setting TP/SL",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleClosePosition = (position: Position) => {
    closePositionMutation.mutate({ 
      symbol: position.symbol, 
      positionSide: position.positionSide 
    });
  };

  const handleTpslClick = (position: Position) => {
    setSelectedPosition(position);
    setTakeProfit("");
    setStopLoss("");
    setTpslDialogOpen(true);
  };

  const handleSetTpsl = () => {
    if (!selectedPosition) return;
    
    setTpslMutation.mutate({
      symbol: selectedPosition.symbol,
      positionSide: selectedPosition.positionSide,
      stopPrice: stopLoss || undefined,
      profitPrice: takeProfit || undefined
    });
  };

  return (
    <>
      <Card className="premium-card overflow-hidden relative">
        {/* Add subtle gradient overlay in top-right corner */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-glow rounded-full opacity-20 blur-xl"></div>
        
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-md bg-[rgba(28,34,48,0.6)] flex items-center justify-center mr-3">
                <i className="ri-exchange-funds-line text-primary text-xl"></i>
              </div>
              <div>
                <h2 className="font-bold text-lg">Active Positions</h2>
                <p className="text-neutral-light text-xs mt-0.5">Currently trading on Binance Futures</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-primary font-medium">{positions.length}</span>
              <span className="text-neutral-light mx-1">/</span>
              <span className="text-neutral-light">10</span>
            </div>
          </div>
          
          <div className="overflow-x-auto -mx-5 px-5">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                <p className="text-neutral-light mt-4">Loading positions...</p>
              </div>
            ) : positions.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-14 text-center">
                <div className="w-16 h-16 rounded-full bg-[rgba(28,34,48,0.6)] flex items-center justify-center mb-4">
                  <i className="ri-bill-line text-3xl text-neutral-light opacity-50"></i>
                </div>
                <p className="text-neutral-light mb-2">No active positions</p>
                <p className="text-neutral-light text-sm opacity-60 max-w-md">
                  Open a position using the chart controls or execute a trading opportunity to get started.
                </p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-[rgba(73,86,118,0.1)]">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left bg-[rgba(28,34,48,0.5)]">
                      <th className="py-3 px-4 text-xs font-medium text-neutral-light">Asset</th>
                      <th className="py-3 px-4 text-xs font-medium text-neutral-light">Type</th>
                      <th className="py-3 px-4 text-xs font-medium text-neutral-light">Entry</th>
                      <th className="py-3 px-4 text-xs font-medium text-neutral-light">Current</th>
                      <th className="py-3 px-4 text-xs font-medium text-neutral-light">Size</th>
                      <th className="py-3 px-4 text-xs font-medium text-neutral-light">Leverage</th>
                      <th className="py-3 px-4 text-xs font-medium text-neutral-light">PnL</th>
                      <th className="py-3 px-4 text-xs font-medium text-neutral-light">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-[rgba(73,86,118,0.1)]">
                    {positions.map((position) => {
                      const symbol = position.symbol;
                      const tickerSymbol = symbol.replace(/USDT$/, "");
                      const positionType = parseFloat(position.positionAmt) > 0 ? "LONG" : "SHORT";
                      const entryPrice = parseFloat(position.entryPrice);
                      const currentPrice = parseFloat(position.markPrice);
                      const size = Math.abs(parseFloat(position.positionAmt));
                      const leverage = parseFloat(position.leverage);
                      
                      // Calculate PnL
                      const pnl = parseFloat(position.unRealizedProfit);
                      const pnlPercent = (pnl / (entryPrice * size / leverage)) * 100;
                      const isProfitable = pnl >= 0;

                      return (
                        <tr key={`${symbol}-${positionType}`} className="hover:bg-[rgba(28,34,48,0.3)] transition-colors duration-150">
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#2A3961] to-[#192041] flex items-center justify-center mr-3 shadow-lg">
                                <span className="font-bold text-xs">{tickerSymbol.substring(0, 3)}</span>
                              </div>
                              <span className="font-medium">{symbol}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                              positionType === "LONG" 
                                ? "bg-gradient-to-r from-[rgba(0,200,151,0.1)] to-[rgba(0,155,117,0.2)] text-[#00C897]" 
                                : "bg-gradient-to-r from-[rgba(255,59,105,0.1)] to-[rgba(219,42,105,0.2)] text-[#FF3B69]"
                            }`}>
                              <i className={`${
                                positionType === "LONG" ? "ri-arrow-up-line" : "ri-arrow-down-line"
                              } mr-1`}></i>
                              {positionType}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono">${parseFloat(entryPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-4 px-4 font-mono">${parseFloat(currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-4 px-4 font-mono">
                            <span className="bg-[rgba(28,34,48,0.4)] px-2 py-1 rounded">
                              {parseFloat(size).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="bg-gradient-to-r from-[rgba(0,149,255,0.1)] to-[rgba(0,102,204,0.2)] text-primary px-3 py-1 rounded-md font-medium">
                              {leverage}x
                            </span>
                          </td>
                          <td className={`py-4 px-4 font-mono ${isProfitable ? "text-[#00C897]" : "text-[#FF3B69]"}`}>
                            <div className="flex flex-col">
                              <span className="font-bold">
                                {isProfitable ? "+" : ""}{parseFloat(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-xs opacity-80">
                                ({isProfitable ? "+" : ""}{pnlPercent.toFixed(2)}%)
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-gradient-to-r from-[#0095FF] to-[#0066CC] text-white hover:from-[#0066CC] hover:to-[#0095FF] px-3 py-1.5 rounded-md text-xs shadow-lg shadow-primary/20 font-medium"
                                onClick={() => handleTpslClick(position)}
                              >
                                TP/SL
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="bg-gradient-to-r from-[#FF3B69] to-[#DB2A69] text-white hover:from-[#DB2A69] hover:to-[#FF3B69] px-3 py-1.5 rounded-md text-xs shadow-lg shadow-danger/20 font-medium"
                                onClick={() => handleClosePosition(position)}
                                disabled={closePositionMutation.isPending}
                              >
                                {closePositionMutation.isPending ? "Closing..." : "Close"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Take Profit / Stop Loss Dialog */}
      <Dialog open={tpslDialogOpen} onOpenChange={setTpslDialogOpen}>
        <DialogContent className="bg-gradient-premium border border-[rgba(73,86,118,0.2)] shadow-xl rounded-xl overflow-hidden max-w-md">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-glow rounded-full opacity-30 blur-xl"></div>
          
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gradient-blue">Set Take Profit / Stop Loss</DialogTitle>
            <DialogDescription className="text-neutral-light opacity-80">
              {selectedPosition && (
                <div className="flex items-center mt-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#2A3961] to-[#192041] flex items-center justify-center mr-2">
                    <span className="font-bold text-xs">{selectedPosition.symbol.replace(/USDT$/, "").substring(0, 3)}</span>
                  </div>
                  <span className="font-medium">
                    {selectedPosition.symbol} 
                    <span className={`${parseFloat(selectedPosition.positionAmt) > 0 ? 'text-[#00C897]' : 'text-[#FF3B69]'} ml-2`}>
                      {parseFloat(selectedPosition.positionAmt) > 0 ? "LONG" : "SHORT"}
                    </span>
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="takeProfit" className="text-sm font-medium flex items-center">
                <div className="w-6 h-6 rounded-md bg-[rgba(0,200,151,0.1)] flex items-center justify-center mr-2">
                  <i className="ri-arrow-up-line text-[#00C897]"></i>
                </div>
                Take Profit Price
              </Label>
              <div className="relative">
                <Input
                  id="takeProfit"
                  type="number"
                  step="0.01"
                  placeholder="Enter TP price"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="bg-[rgba(19,23,34,0.5)] border-[rgba(73,86,118,0.2)] rounded-md h-11 pl-4 pr-14"
                />
                <div className="absolute right-3 top-2.5 text-neutral-light opacity-60 text-sm font-mono">
                  USDT
                </div>
              </div>
              {selectedPosition && takeProfit && (
                <div className="text-xs text-[#00C897] flex items-center mt-1">
                  <i className="ri-information-line mr-1"></i>
                  {parseFloat(selectedPosition.positionAmt) > 0 ? 
                    `+${((parseFloat(takeProfit) - parseFloat(selectedPosition.entryPrice)) / parseFloat(selectedPosition.entryPrice) * 100).toFixed(2)}% profit` :
                    `+${((parseFloat(selectedPosition.entryPrice) - parseFloat(takeProfit)) / parseFloat(selectedPosition.entryPrice) * 100).toFixed(2)}% profit`
                  }
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stopLoss" className="text-sm font-medium flex items-center">
                <div className="w-6 h-6 rounded-md bg-[rgba(255,59,105,0.1)] flex items-center justify-center mr-2">
                  <i className="ri-arrow-down-line text-[#FF3B69]"></i>
                </div>
                Stop Loss Price
              </Label>
              <div className="relative">
                <Input
                  id="stopLoss"
                  type="number"
                  step="0.01"
                  placeholder="Enter SL price"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="bg-[rgba(19,23,34,0.5)] border-[rgba(73,86,118,0.2)] rounded-md h-11 pl-4 pr-14"
                />
                <div className="absolute right-3 top-2.5 text-neutral-light opacity-60 text-sm font-mono">
                  USDT
                </div>
              </div>
              {selectedPosition && stopLoss && (
                <div className="text-xs text-[#FF3B69] flex items-center mt-1">
                  <i className="ri-information-line mr-1"></i>
                  {parseFloat(selectedPosition.positionAmt) > 0 ? 
                    `-${((parseFloat(selectedPosition.entryPrice) - parseFloat(stopLoss)) / parseFloat(selectedPosition.entryPrice) * 100).toFixed(2)}% loss` :
                    `-${((parseFloat(stopLoss) - parseFloat(selectedPosition.entryPrice)) / parseFloat(selectedPosition.entryPrice) * 100).toFixed(2)}% loss`
                  }
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              className="bg-[rgba(28,34,48,0.5)] hover:bg-[rgba(28,34,48,0.7)] text-white border-none rounded-md h-10"
              onClick={() => setTpslDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-[#0095FF] to-[#0066CC] text-white hover:from-[#0066CC] hover:to-[#0095FF] rounded-md h-10 shadow-lg shadow-primary/20 border-none"
              onClick={handleSetTpsl}
              disabled={setTpslMutation.isPending}
            >
              {setTpslMutation.isPending ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Setting...
                </div>
              ) : "Confirm Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
      <Card className="card-glass">
        <CardContent className="p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center">
            <i className="ri-exchange-funds-line text-primary mr-2"></i>
            Active Positions
            <span className="ml-2 bg-[#252D3D] text-xs px-2 py-0.5 rounded-full">
              {positions.length}
            </span>
          </h2>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : positions.length === 0 ? (
              <div className="text-center py-8 text-neutral-light">
                No active positions. Open a position to get started.
              </div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-neutral-light text-sm border-b border-gray-800">
                    <th className="pb-3 pr-4">Pair</th>
                    <th className="pb-3 px-4">Type</th>
                    <th className="pb-3 px-4">Entry</th>
                    <th className="pb-3 px-4">Current</th>
                    <th className="pb-3 px-4">Size</th>
                    <th className="pb-3 px-4">Leverage</th>
                    <th className="pb-3 px-4">PnL</th>
                    <th className="pb-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
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
                      <tr key={`${symbol}-${positionType}`} className="border-b border-gray-800 hover:bg-[#252D3D]">
                        <td className="py-3 pr-4">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-dark flex items-center justify-center mr-2">
                              <span className="font-semibold text-xs">{tickerSymbol}</span>
                            </div>
                            <span className="font-medium">{symbol}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center ${
                            positionType === "LONG" ? "bg-success bg-opacity-20 text-success" : "bg-danger bg-opacity-20 text-danger"
                          } px-2 py-0.5 rounded`}>
                            <i className={`${
                              positionType === "LONG" ? "ri-arrow-right-up-line" : "ri-arrow-right-down-line"
                            } mr-1`}></i>
                            {positionType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">${entryPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 font-mono">${currentPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 font-mono">{size.toFixed(4)} {tickerSymbol}</td>
                        <td className="py-3 px-4 font-mono">
                          <span className="bg-primary bg-opacity-20 text-primary px-2 py-0.5 rounded">{leverage}x</span>
                        </td>
                        <td className={`py-3 px-4 font-mono ${isProfitable ? "text-success" : "text-danger"}`}>
                          {isProfitable ? "+" : ""}{pnl.toFixed(2)} ({isProfitable ? "+" : ""}{pnlPercent.toFixed(2)}%)
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-primary px-2 py-1 text-xs hover:bg-primary/90"
                              onClick={() => handleTpslClick(position)}
                            >
                              TP/SL
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="bg-danger px-2 py-1 text-xs hover:bg-danger/90"
                              onClick={() => handleClosePosition(position)}
                              disabled={closePositionMutation.isPending}
                            >
                              Close
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Take Profit / Stop Loss Dialog */}
      <Dialog open={tpslDialogOpen} onOpenChange={setTpslDialogOpen}>
        <DialogContent className="bg-[#1C2230] border border-gray-800">
          <DialogHeader>
            <DialogTitle>Set Take Profit / Stop Loss</DialogTitle>
            <DialogDescription>
              {selectedPosition && (
                <span>
                  Configure TP/SL for {selectedPosition.symbol} {parseFloat(selectedPosition.positionAmt) > 0 ? "LONG" : "SHORT"} position
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="takeProfit" className="text-right">Take Profit</Label>
              <Input
                id="takeProfit"
                type="number"
                step="0.01"
                placeholder="Price"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="col-span-3 bg-[#131722] border-gray-700"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stopLoss" className="text-right">Stop Loss</Label>
              <Input
                id="stopLoss"
                type="number"
                step="0.01"
                placeholder="Price"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="col-span-3 bg-[#131722] border-gray-700"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              className="bg-[#252D3D] hover:bg-[#1C2230] border-none"
              onClick={() => setTpslDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={handleSetTpsl}
              disabled={setTpslMutation.isPending}
            >
              {setTpslMutation.isPending ? "Setting..." : "Set TP/SL"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

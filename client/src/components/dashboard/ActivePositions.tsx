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
      <div className="multilayer-card">
        <div className="p-6">
          {/* Header section with title and stats */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-start">
              <div className="flex h-12 w-12 rounded-xl bg-gradient-to-br from-[#0F1333] to-[#1A2B60] items-center justify-center shadow-lg mr-4">
                <i className="ri-exchange-funds-fill text-[#4FBBFF] text-xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1 tracking-tight">Active Positions</h2>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-[#00C897] mr-1.5 animate-pulse"></div>
                  <span className="text-neutral-light text-sm">Live trading on Binance Futures</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="premium-tag premium-tag-primary flex items-center py-1.5">
                <i className="ri-funds-box-line mr-1.5"></i>
                <span>Active: <span className="font-bold">{positions.length}</span>/<span className="opacity-60">10</span></span>
              </div>
              
              <div className="icon-button">
                <i className="ri-more-2-fill"></i>
              </div>
            </div>
          </div>
          
          {/* Position Content */}
          <div className="relative">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-14">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary animate-spin"></div>
                  <div className="absolute inset-3 rounded-full border-t-2 border-r-2 border-primary/60 animate-spin animation-delay-150"></div>
                  <div className="absolute inset-6 rounded-full border-t-2 border-r-2 border-primary/30 animate-spin animation-delay-300"></div>
                </div>
                <p className="text-neutral-light mt-6 font-medium">Loading positions...</p>
                <p className="text-neutral-light/60 text-sm mt-1">Fetching data from Binance API</p>
              </div>
            ) : positions.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[rgba(20,26,43,0.5)] to-[rgba(12,15,23,0.5)] flex items-center justify-center mb-5 shadow-inner">
                  <i className="ri-funds-box-line text-4xl text-neutral-light/40"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">No Active Positions</h3>
                <p className="text-neutral-light/60 text-sm max-w-sm">
                  You don't have any active trading positions. Use the trading panel to open a position or execute a trading opportunity.
                </p>
                <button className="btn-premium-primary mt-6">
                  <i className="ri-add-line mr-1.5"></i>
                  Open New Position
                </button>
              </div>
            ) : (
              <>
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  <div className="bg-[rgba(14,18,28,0.4)] rounded-xl border border-[rgba(73,86,118,0.15)] p-3 flex items-center">
                    <div className="h-10 w-10 rounded-lg bg-[rgba(0,200,151,0.1)] flex items-center justify-center mr-3">
                      <i className="ri-money-dollar-circle-line text-[#00C897] text-xl"></i>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-light/80 mb-0.5">Total Position Value</div>
                      <div className="font-mono font-bold text-lg">
                        ${positions.reduce((total, pos) => total + Math.abs(parseFloat(pos.positionAmt) * parseFloat(pos.markPrice)), 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[rgba(14,18,28,0.4)] rounded-xl border border-[rgba(73,86,118,0.15)] p-3 flex items-center">
                    <div className="h-10 w-10 rounded-lg bg-[rgba(0,149,255,0.1)] flex items-center justify-center mr-3">
                      <i className="ri-scales-3-line text-[#4FBBFF] text-xl"></i>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-light/80 mb-0.5">Avg. Leverage</div>
                      <div className="font-mono font-bold text-lg">
                        {(positions.reduce((sum, pos) => sum + parseFloat(pos.leverage), 0) / positions.length).toFixed(1)}x
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[rgba(14,18,28,0.4)] rounded-xl border border-[rgba(73,86,118,0.15)] p-3 flex items-center">
                    <div className="h-10 w-10 rounded-lg bg-[rgba(255,59,105,0.1)] flex items-center justify-center mr-3">
                      <i className="ri-profit-fill text-[#FF3B69] text-xl"></i>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-light/80 mb-0.5">Unrealized P&L</div>
                      <div className="font-mono font-bold text-lg">
                        ${positions.reduce((total, pos) => total + parseFloat(pos.unRealizedProfit), 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>
                </div>
              
                {/* Advanced Position Table */}
                <div className="overflow-x-auto -mx-3 px-3">
                  <table className="premium-table">
                    <thead>
                      <tr className="text-left">
                        <th className="rounded-tl-lg">Asset</th>
                        <th>Direction</th>
                        <th>Entry Price</th>
                        <th>Current Price</th>
                        <th>Size</th>
                        <th>Liquidation</th>
                        <th>Profit/Loss</th>
                        <th className="rounded-tr-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((position) => {
                        const symbol = position.symbol;
                        const tickerSymbol = symbol.replace(/USDT$/, "");
                        const positionType = parseFloat(position.positionAmt) > 0 ? "LONG" : "SHORT";
                        const entryPrice = parseFloat(position.entryPrice);
                        const currentPrice = parseFloat(position.markPrice);
                        const size = Math.abs(parseFloat(position.positionAmt));
                        const leverage = parseFloat(position.leverage);
                        const liquidationPrice = parseFloat(position.liquidationPrice);
                        
                        // Calculate PnL
                        const pnl = parseFloat(position.unRealizedProfit);
                        const pnlPercent = (pnl / (entryPrice * size / leverage)) * 100;
                        const isProfitable = pnl >= 0;
                        
                        // Calculate distance to liquidation
                        let liquidationDistance = 0;
                        if (positionType === "LONG") {
                          liquidationDistance = ((currentPrice - liquidationPrice) / currentPrice) * 100;
                        } else {
                          liquidationDistance = ((liquidationPrice - currentPrice) / currentPrice) * 100;
                        }

                        return (
                          <tr key={`${symbol}-${positionType}`}>
                            <td>
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[#162253] to-[#0C1333] flex items-center justify-center mr-3 shadow-lg">
                                  <span className="font-bold text-xs">{tickerSymbol}</span>
                                </div>
                                <div>
                                  <div className="font-medium">{symbol}</div>
                                  <div className="text-xs text-neutral-light/70 mt-0.5">Perpetual</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className={`inline-flex items-center px-2.5 py-1 rounded-md ${
                                positionType === "LONG" 
                                  ? "premium-tag-success" 
                                  : "premium-tag-danger"
                              }`}>
                                <i className={`${
                                  positionType === "LONG" ? "ri-arrow-up-line" : "ri-arrow-down-line"
                                } mr-1`}></i>
                                {positionType}
                              </div>
                            </td>
                            <td>
                              <div className="font-mono font-medium">${entryPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              <div className="text-xs text-neutral-light/70 mt-0.5">Entry</div>
                            </td>
                            <td>
                              <div className="font-mono font-medium">${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              <div className="text-xs text-neutral-light/70 mt-0.5">Mark Price</div>
                            </td>
                            <td>
                              <div className="font-mono font-medium">{size.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})}</div>
                              <div className="flex items-center text-xs text-neutral-light/70 mt-0.5">
                                <span className="bg-[rgba(0,149,255,0.1)] text-[#4FBBFF] px-1 rounded mr-1">{leverage}x</span>
                                <span>Leverage</span>
                              </div>
                            </td>
                            <td>
                              <div className="font-mono font-medium">${liquidationPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              <div className="flex items-center mt-1 h-1 w-24 bg-[rgba(28,34,48,0.4)] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${liquidationDistance < 10 ? 'bg-red-500' : liquidationDistance < 25 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                  style={{ width: `${Math.min(100, liquidationDistance * 2)}%` }}
                                ></div>
                              </div>
                            </td>
                            <td>
                              <div className={`font-mono font-bold ${isProfitable ? "text-[#00C897]" : "text-[#FF3B69]"}`}>
                                {isProfitable ? "+" : ""}{pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </div>
                              <div className={`text-xs ${isProfitable ? "text-[#00C897]/70" : "text-[#FF3B69]/70"} mt-0.5`}>
                                {isProfitable ? "+" : ""}{pnlPercent.toFixed(2)}%
                              </div>
                            </td>
                            <td className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button 
                                  className="icon-button h-9 w-9"
                                  onClick={() => handleTpslClick(position)}
                                >
                                  <i className="ri-git-commit-line"></i>
                                </button>
                                
                                <button 
                                  className="flex items-center justify-center h-9 px-3 rounded-lg transition-all duration-300 bg-gradient-to-r from-[#FF3B69] to-[#DB2A69] text-white text-xs font-medium"
                                  onClick={() => handleClosePosition(position)}
                                  disabled={closePositionMutation.isPending}
                                >
                                  {closePositionMutation.isPending ? (
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin mr-1.5"></div>
                                      <span>Closing</span>
                                    </div>
                                  ) : (
                                    <>
                                      <i className="ri-close-line mr-1"></i>
                                      <span>Close</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Take Profit / Stop Loss Dialog */}
      <Dialog open={tpslDialogOpen} onOpenChange={setTpslDialogOpen}>
        <DialogContent className="bg-glass-panel max-w-lg p-0 overflow-hidden rounded-xl">
          {/* Subtle background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(12,19,51,0.8)] to-[rgba(10,13,23,0.9)] -z-10"></div>
          <div className="absolute top-0 right-0 w-full h-40 bg-gradient-glow opacity-20 blur-2xl -z-10"></div>
          
          {/* Header with visual distinction based on position type */}
          {selectedPosition && (
            <div className={`px-6 py-5 border-b border-[rgba(73,86,118,0.2)] ${
              parseFloat(selectedPosition.positionAmt) > 0 
                ? 'bg-gradient-to-r from-[rgba(0,200,151,0.05)] to-transparent' 
                : 'bg-gradient-to-r from-[rgba(255,59,105,0.05)] to-transparent'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold mb-1">Risk Management Settings</h2>
                  <p className="text-neutral-light/70 text-sm">Configure exit strategy for your position</p>
                </div>
                
                <div className={`px-3 py-1.5 rounded-lg ${
                  parseFloat(selectedPosition.positionAmt) > 0 
                    ? 'bg-[rgba(0,200,151,0.1)] text-[#00C897] border border-[rgba(0,200,151,0.2)]' 
                    : 'bg-[rgba(255,59,105,0.1)] text-[#FF3B69] border border-[rgba(255,59,105,0.2)]'
                } flex items-center`}>
                  <i className={`${parseFloat(selectedPosition.positionAmt) > 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-1.5`}></i>
                  <span className="font-medium">{parseFloat(selectedPosition.positionAmt) > 0 ? "LONG" : "SHORT"}</span>
                </div>
              </div>
              
              <div className="flex items-center mt-4">
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-gradient-to-br from-[#162253] to-[#0C1333] flex items-center justify-center mr-3 shadow-lg">
                  <span className="font-bold text-xs">{selectedPosition.symbol.replace(/USDT$/, "")}</span>
                </div>
                <div>
                  <div className="flex items-baseline">
                    <span className="font-medium">{selectedPosition.symbol}</span>
                    <span className="text-xs text-neutral-light/70 ml-1.5">Perpetual Futures</span>
                  </div>
                  <div className="flex items-center mt-1 text-sm">
                    <span className="text-neutral-light/70 mr-2">Entry:</span>
                    <span className="font-mono font-medium">${parseFloat(selectedPosition.entryPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span className="mx-2 text-neutral-light/40">|</span>
                    <span className="text-neutral-light/70 mr-2">Current:</span>
                    <span className="font-mono font-medium">${parseFloat(selectedPosition.markPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Main content */}
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-8">
              {/* Take Profit Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="takeProfit" className="text-base font-medium flex items-center">
                    <div className="w-7 h-7 rounded-md bg-[rgba(0,200,151,0.1)] flex items-center justify-center mr-2">
                      <i className="ri-arrow-up-line text-[#00C897]"></i>
                    </div>
                    Take Profit
                  </Label>
                  
                  {selectedPosition && takeProfit && (
                    <div className="text-sm text-[#00C897] flex items-center">
                      <i className="ri-line-chart-line mr-1.5"></i>
                      {parseFloat(selectedPosition.positionAmt) > 0 ? 
                        `+${((parseFloat(takeProfit) - parseFloat(selectedPosition.entryPrice)) / parseFloat(selectedPosition.entryPrice) * 100).toFixed(2)}% profit` :
                        `+${((parseFloat(selectedPosition.entryPrice) - parseFloat(takeProfit)) / parseFloat(selectedPosition.entryPrice) * 100).toFixed(2)}% profit`
                      }
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 flex items-center">
                    <span className="text-neutral-light/60">$</span>
                  </div>
                  <Input
                    id="takeProfit"
                    type="number"
                    step="0.01"
                    placeholder="Enter take profit price"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="bg-[rgba(10,13,23,0.5)] border-[rgba(73,86,118,0.15)] rounded-md h-12 pl-8 pr-16"
                  />
                  <div className="absolute right-3 top-0 bottom-0 flex items-center">
                    <span className="text-neutral-light/60 text-sm font-mono">USDT</span>
                  </div>
                </div>
                
                {/* Price range slider - visual only */}
                {selectedPosition && (
                  <div className="pt-3">
                    <div className="flex justify-between text-xs text-neutral-light/60 mb-1.5">
                      <span>Entry: ${parseFloat(selectedPosition.entryPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      <span>Current: ${parseFloat(selectedPosition.markPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    
                    <div className="h-2 bg-[rgba(14,18,28,0.5)] rounded-full relative">
                      {/* Entry price marker */}
                      <div className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 bg-neutral-light/40"
                        style={{ 
                          left: `${parseFloat(selectedPosition.positionAmt) > 0 ? "0%" : "100%"}`
                        }}></div>
                        
                      {/* Current price marker */}
                      <div className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 bg-white"
                        style={{ 
                          left: `${parseFloat(selectedPosition.positionAmt) > 0 ? 
                            ((parseFloat(selectedPosition.markPrice) - parseFloat(selectedPosition.entryPrice)) / parseFloat(selectedPosition.entryPrice) * 100) : 
                            (100 - ((parseFloat(selectedPosition.markPrice) - parseFloat(selectedPosition.entryPrice)) / parseFloat(selectedPosition.entryPrice) * 100))
                          }%`
                        }}></div>
                        
                      {/* Take profit marker */}
                      {takeProfit && (
                        <div className="absolute top-1/2 -translate-y-1/2 h-6 w-1 bg-[#00C897]"
                          style={{ 
                            left: `${parseFloat(selectedPosition.positionAmt) > 0 ?
                              ((parseFloat(takeProfit) - parseFloat(selectedPosition.entryPrice)) / parseFloat(selectedPosition.entryPrice) * 100) :
                              (100 - ((parseFloat(takeProfit) - parseFloat(selectedPosition.entryPrice)) / parseFloat(selectedPosition.entryPrice) * 100))
                            }%`
                          }}></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Stop Loss Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="stopLoss" className="text-base font-medium flex items-center">
                    <div className="w-7 h-7 rounded-md bg-[rgba(255,59,105,0.1)] flex items-center justify-center mr-2">
                      <i className="ri-arrow-down-line text-[#FF3B69]"></i>
                    </div>
                    Stop Loss
                  </Label>
                  
                  {selectedPosition && stopLoss && (
                    <div className="text-sm text-[#FF3B69] flex items-center">
                      <i className="ri-line-chart-line mr-1.5"></i>
                      {parseFloat(selectedPosition.positionAmt) > 0 ? 
                        `-${((parseFloat(selectedPosition.entryPrice) - parseFloat(stopLoss)) / parseFloat(selectedPosition.entryPrice) * 100).toFixed(2)}% loss` :
                        `-${((parseFloat(stopLoss) - parseFloat(selectedPosition.entryPrice)) / parseFloat(selectedPosition.entryPrice) * 100).toFixed(2)}% loss`
                      }
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 flex items-center">
                    <span className="text-neutral-light/60">$</span>
                  </div>
                  <Input
                    id="stopLoss"
                    type="number"
                    step="0.01"
                    placeholder="Enter stop loss price"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="bg-[rgba(10,13,23,0.5)] border-[rgba(73,86,118,0.15)] rounded-md h-12 pl-8 pr-16"
                  />
                  <div className="absolute right-3 top-0 bottom-0 flex items-center">
                    <span className="text-neutral-light/60 text-sm font-mono">USDT</span>
                  </div>
                </div>
                
                {/* Price range slider - visual only */}
                {selectedPosition && (
                  <div className="pt-3">
                    <div className="flex justify-between text-xs text-neutral-light/60 mb-1.5">
                      <span>Liquidation: ${parseFloat(selectedPosition.liquidationPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      <span>Entry: ${parseFloat(selectedPosition.entryPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    
                    <div className="h-2 bg-[rgba(14,18,28,0.5)] rounded-full relative">
                      {/* Liquidation price marker */}
                      <div className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 bg-[#FF3B69]/40"
                        style={{ 
                          left: `${parseFloat(selectedPosition.positionAmt) > 0 ? "0%" : "100%"}`
                        }}></div>
                        
                      {/* Entry price marker */}
                      <div className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 bg-white"
                        style={{ 
                          left: `${parseFloat(selectedPosition.positionAmt) > 0 ? 
                            ((parseFloat(selectedPosition.entryPrice) - parseFloat(selectedPosition.liquidationPrice)) / parseFloat(selectedPosition.entryPrice) * 100) : 
                            (100 - ((parseFloat(selectedPosition.entryPrice) - parseFloat(selectedPosition.liquidationPrice)) / parseFloat(selectedPosition.entryPrice) * 100))
                          }%`
                        }}></div>
                        
                      {/* Stop loss marker */}
                      {stopLoss && (
                        <div className="absolute top-1/2 -translate-y-1/2 h-6 w-1 bg-[#FF3B69]"
                          style={{ 
                            left: `${parseFloat(selectedPosition.positionAmt) > 0 ?
                              ((parseFloat(stopLoss) - parseFloat(selectedPosition.liquidationPrice)) / parseFloat(selectedPosition.entryPrice) * 100) :
                              (100 - ((parseFloat(stopLoss) - parseFloat(selectedPosition.liquidationPrice)) / parseFloat(selectedPosition.entryPrice) * 100))
                            }%`
                          }}></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Risk analysis section */}
            {selectedPosition && takeProfit && stopLoss && (
              <div className="mt-6 p-4 bg-[rgba(10,13,23,0.5)] rounded-xl border border-[rgba(73,86,118,0.15)]">
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <i className="ri-shield-check-line text-primary mr-1.5"></i>
                  Risk/Reward Analysis
                </h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-neutral-light/70 mb-1">Risk/Reward Ratio</div>
                    <div className="font-medium text-sm">
                      {parseFloat(selectedPosition.positionAmt) > 0
                        ? (Math.abs((parseFloat(takeProfit) - parseFloat(selectedPosition.entryPrice)) / (parseFloat(selectedPosition.entryPrice) - parseFloat(stopLoss)))).toFixed(2)
                        : (Math.abs((parseFloat(selectedPosition.entryPrice) - parseFloat(takeProfit)) / (parseFloat(stopLoss) - parseFloat(selectedPosition.entryPrice)))).toFixed(2)
                      } : 1
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-light/70 mb-1">Potential Profit</div>
                    <div className="font-medium text-sm text-[#00C897]">
                      ${parseFloat(selectedPosition.positionAmt) > 0
                        ? (Math.abs(parseFloat(selectedPosition.positionAmt)) * (parseFloat(takeProfit) - parseFloat(selectedPosition.entryPrice))).toFixed(2)
                        : (Math.abs(parseFloat(selectedPosition.positionAmt)) * (parseFloat(selectedPosition.entryPrice) - parseFloat(takeProfit))).toFixed(2)
                      }
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-light/70 mb-1">Potential Loss</div>
                    <div className="font-medium text-sm text-[#FF3B69]">
                      ${parseFloat(selectedPosition.positionAmt) > 0
                        ? (Math.abs(parseFloat(selectedPosition.positionAmt)) * (parseFloat(selectedPosition.entryPrice) - parseFloat(stopLoss))).toFixed(2)
                        : (Math.abs(parseFloat(selectedPosition.positionAmt)) * (parseFloat(stopLoss) - parseFloat(selectedPosition.entryPrice))).toFixed(2)
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer with button actions */}
          <div className="px-6 py-5 border-t border-[rgba(73,86,118,0.2)] flex flex-col sm:flex-row justify-end gap-3">
            <button 
              className="btn-premium-secondary"
              onClick={() => setTpslDialogOpen(false)}
            >
              Cancel
            </button>
            
            <button 
              className="btn-premium-primary min-w-[150px] flex items-center justify-center"
              onClick={handleSetTpsl}
              disabled={setTpslMutation.isPending}
            >
              {setTpslMutation.isPending ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                <>
                  <i className="ri-check-line mr-1.5"></i>
                  Apply Settings
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { executeTradingOpportunity } from "@/lib/binanceApi";
import { toast } from "@/hooks/use-toast";
import { STRATEGY_NAMES } from "@/lib/constants";
import { useState } from "react";
import { TradingOpportunity } from "@/lib/types";

interface TradingOpportunitiesProps {
  opportunities: TradingOpportunity[];
  isLoading: boolean;
}

export default function TradingOpportunities({ opportunities, isLoading }: TradingOpportunitiesProps) {
  // Track which opportunity is being executed
  const [executingId, setExecutingId] = useState<string | null>(null);
  
  // Execution mutation
  const executeTradeMutation = useMutation({
    mutationFn: (opportunityId: string) => {
      // Set the currently executing ID
      setExecutingId(opportunityId);
      console.log(`Executing trade for opportunity ${opportunityId}`);
      
      // Execute the opportunity through the API
      return executeTradingOpportunity(opportunityId);
    },
    onSuccess: (data) => {
      // Clear the executing ID
      setExecutingId(null);
      
      // Show success toast
      toast({
        title: "Trade Executed Successfully",
        description: data.real 
          ? `${data.order.symbol} ${data.order.side} order placed` 
          : `${data.order.symbol} simulated ${data.order.side} order processed`,
        variant: "default",
      });
      
      // Refresh related data
      queryClient.invalidateQueries({ queryKey: ['/api/binance/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/binance/opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/binance/performance'] });
    },
    onError: (error: any) => {
      // Clear the executing ID
      setExecutingId(null);
      
      // Show error toast
      toast({
        title: "Trade Execution Failed",
        description: error?.message || "Unknown error occurred",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="card-dashboard p-4 animate-pulse">
        <div className="h-6 bg-[rgba(73,86,118,0.2)] rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-[rgba(73,86,118,0.15)] rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-dashboard p-4 relative overflow-hidden">
      {/* Subtle glow effect in top-right corner */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-glow opacity-50"></div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-accent mr-2"></span>
          <h3 className="font-medium text-gradient-blue">High-Probability Setups</h3>
        </div>
        <Badge variant="outline" className="text-xs bg-[rgba(0,149,255,0.05)] border-[rgba(73,86,118,0.3)]">
          {opportunities.length} opportunities
        </Badge>
      </div>
      
      {opportunities.length === 0 ? (
        <div className="multilayer-card py-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-[rgba(0,149,255,0.05)] border border-[rgba(0,149,255,0.1)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary opacity-70">
              <circle cx="12" cy="12" r="8"></circle>
              <path d="M12 2v2"></path>
              <path d="M12 20v2"></path>
              <path d="m4.93 4.93 1.41 1.41"></path>
              <path d="m17.66 17.66 1.41 1.41"></path>
              <path d="M2 12h2"></path>
              <path d="M20 12h2"></path>
              <path d="m6.34 17.66-1.41 1.41"></path>
              <path d="m19.07 4.93-1.41 1.41"></path>
            </svg>
          </div>
          <p className="text-[rgba(255,255,255,0.7)]">No trading opportunities found</p>
          <p className="text-xs mt-1 text-[rgba(255,255,255,0.5)]">
            The system is continually scanning for optimal trade setups
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((opportunity) => (
              <div 
                key={`${opportunity.id}-${opportunity.timestamp || Date.now()}`} 
                className="multilayer-card p-4 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-[#162253] to-[#0C1333] flex items-center justify-center mr-3 shadow-md border border-[rgba(0,149,255,0.1)]">
                      <span className="font-bold text-sm text-gradient-blue">
                        {opportunity.symbol.replace(/USDT$/, "")}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{opportunity.symbol}</div>
                      <div className="flex space-x-2 mt-1">
                        <Badge variant="outline" className="premium-tag premium-tag-primary text-xs px-2 py-1">
                          {STRATEGY_NAMES[opportunity.strategy] || opportunity.strategy}
                        </Badge>
                        <Badge className={`premium-tag text-xs px-2 py-1 ${
                          opportunity.direction === 'LONG' 
                            ? 'premium-tag-success' 
                            : 'premium-tag-danger'
                        }`}>
                          {opportunity.direction}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced score indicator */}
                  <div className="relative flex items-center">
                    <div className="h-12 w-12 rounded-full relative">
                      <div className="absolute inset-1 rounded-full bg-[rgba(10,13,23,0.5)]"></div>
                      <svg width="100%" height="100%" viewBox="0 0 36 36">
                        <circle 
                          cx="18" cy="18" r="16" 
                          fill="none" 
                          stroke="rgba(73,86,118,0.2)" 
                          strokeWidth="2" 
                        />
                        <circle 
                          cx="18" cy="18" r="16" 
                          fill="none" 
                          stroke={
                            opportunity.score > 80 
                              ? 'rgba(0,200,151,0.9)' 
                              : opportunity.score > 60 
                                ? 'rgba(255,184,0,0.9)' 
                                : 'rgba(255,59,105,0.9)'
                          }
                          strokeWidth="3" 
                          strokeDasharray={`${(opportunity.score/100) * 100.5} 100.5`} 
                          strokeDashoffset="25.1"
                          transform="rotate(-90 18 18)"
                          strokeLinecap="round"
                          className="score-fill"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                        {opportunity.score}
                      </div>
                    </div>
                    
                    <div className="ml-2 text-xs text-neutral-400 font-medium flex flex-col items-end">
                      <div>Score</div>
                      <div className={opportunity.score > 80 ? 'text-[#00C897]' : opportunity.score > 60 ? 'text-[#FFB800]' : 'text-[#FF3B69]'}>
                        {opportunity.score > 80 ? 'Strong' : opportunity.score > 60 ? 'Medium' : 'Speculative'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Add trade details section */}
                <div className="grid grid-cols-3 gap-2 mb-3 bg-[rgba(10,13,23,0.3)] rounded-lg p-2">
                  <div className="text-center">
                    <div className="text-xs text-neutral-400">Entry</div>
                    <div className="text-sm font-mono">${parseFloat(opportunity.entryPrice).toFixed(2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-400">Take Profit</div>
                    <div className="text-sm font-mono text-[#00C897]">
                      ${parseFloat(opportunity.takeProfit || opportunity.targetPrice || "0").toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-400">Stop Loss</div>
                    <div className="text-sm font-mono text-[#FF3B69]">${parseFloat(opportunity.stopLoss).toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="text-xs text-neutral-400">Signal Time</div>
                    <div className="text-sm">
                      {opportunity.timestamp ? 
                        new Date(opportunity.timestamp).toLocaleTimeString() : 
                        opportunity.signalTime ? 
                          new Date(opportunity.signalTime).toLocaleTimeString() : 
                          'Just now'}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    className={`
                      ${opportunity.direction === 'LONG' 
                        ? 'btn-premium-primary bg-gradient-to-r from-[#00A57E] to-[#00C897]' 
                        : 'btn-premium-primary bg-gradient-to-r from-[#DB2A69] to-[#FF3B69]'
                      } text-white shadow-lg h-9 px-5
                    `}
                    onClick={() => executeTradeMutation.mutate(opportunity.id)}
                    disabled={executeTradeMutation.isPending || executingId === opportunity.id}
                  >
                    {(executeTradeMutation.isPending && executingId === opportunity.id) ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Executing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d={opportunity.direction === 'LONG' ? "M12 19V5 M5 12l7-7 7 7" : "M12 5v14 M5 12l7 7 7-7"}></path>
                        </svg>
                        {opportunity.direction === 'LONG' ? 'Execute Long' : 'Execute Short'}
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
      
      {opportunities.length > 3 && (
        <div className="mt-4 text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="btn-premium-secondary w-full bg-[rgba(0,149,255,0.05)] hover:bg-[rgba(0,149,255,0.1)] border-[rgba(73,86,118,0.2)]"
          >
            View all {opportunities.length} opportunities
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
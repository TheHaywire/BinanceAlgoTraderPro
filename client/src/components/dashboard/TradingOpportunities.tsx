import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { executeTradingOpportunity } from "@/lib/binanceApi";
import { toast } from "@/hooks/use-toast";
import { STRATEGY_NAMES } from "@/lib/constants";

interface TradingOpportunitiesProps {
  opportunities: any[];
  isLoading: boolean;
}

export default function TradingOpportunities({ opportunities, isLoading }: TradingOpportunitiesProps) {
  // Execution mutation
  const executeTradeMutation = useMutation({
    mutationFn: (opportunityId: string) => executeTradingOpportunity(opportunityId),
    onSuccess: (data) => {
      toast({
        title: "Trade Executed Successfully",
        description: `${data.order.symbol} ${data.order.side} order placed`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/binance/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/binance/opportunities'] });
    },
    onError: (error) => {
      toast({
        title: "Trade Execution Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">High-Probability Setups</h3>
        <span className="text-xs text-neutral-400">{opportunities.length} opportunities</span>
      </div>
      
      {opportunities.length === 0 ? (
        <div className="text-center py-8 text-neutral-400">
          <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center rounded-full bg-[rgba(10,15,28,0.5)]">
            <i className="ri-radar-line text-2xl opacity-50"></i>
          </div>
          <p>No trading opportunities found</p>
          <p className="text-xs mt-1 text-neutral-300">The system is continually scanning for setups</p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((opportunity) => (
              <div 
                key={opportunity.id} 
                className="bg-[rgba(10,15,28,0.3)] rounded-lg p-3 hover:bg-[rgba(20,29,44,0.6)] transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-[#162253] to-[#0C1333] flex items-center justify-center mr-2">
                      <span className="font-bold text-xs">
                        {opportunity.symbol.replace(/USDT$/, "")}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{opportunity.symbol}</div>
                      <div className="flex space-x-2 mt-0.5">
                        <Badge variant="outline" className="bg-[rgba(0,149,255,0.1)] text-primary border-none text-xs">
                          {STRATEGY_NAMES[opportunity.strategy]}
                        </Badge>
                        <Badge className={`text-xs ${
                          opportunity.direction === 'LONG' 
                            ? 'bg-[rgba(0,200,151,0.1)] text-[#00C897] border-[rgba(0,200,151,0.2)]' 
                            : 'bg-[rgba(255,59,105,0.1)] text-[#FF3B69] border-[rgba(255,59,105,0.2)]'
                        }`}>
                          {opportunity.direction}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-8 w-8 rounded-full overflow-hidden relative">
                    <div className="absolute inset-1 rounded-full bg-[rgba(28,34,48,0.5)]"></div>
                    <svg width="100%" height="100%" viewBox="0 0 32 32">
                      <circle 
                        cx="16" cy="16" r="14" 
                        fill="none" 
                        stroke="rgba(73,86,118,0.2)" 
                        strokeWidth="2" 
                      />
                      <circle 
                        cx="16" cy="16" r="14" 
                        fill="none" 
                        stroke={
                          opportunity.score > 80 
                            ? '#00C897' 
                            : opportunity.score > 50 
                              ? '#FFB800' 
                              : '#FF3B69'
                        }
                        strokeWidth="2" 
                        strokeDasharray={`${(opportunity.score/100) * 88} 88`} 
                        strokeDashoffset="22"
                        transform="rotate(-90 16 16)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                      {opportunity.score}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-neutral-400">
                    {opportunity.signalTime ? new Date(opportunity.signalTime).toLocaleTimeString() : 'Just now'}
                  </div>
                  
                  <Button
                    size="sm"
                    className={`
                      ${opportunity.direction === 'LONG' 
                        ? 'bg-gradient-to-r from-[#00C897] to-[#00A57E]' 
                        : 'bg-gradient-to-r from-[#FF3B69] to-[#DB2A69]'
                      } text-white shadow-lg h-8
                    `}
                    onClick={() => executeTradeMutation.mutate(opportunity.id)}
                    disabled={executeTradeMutation.isPending}
                  >
                    {executeTradeMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin mr-1"></div>
                        <span>Executing</span>
                      </div>
                    ) : 'Execute Trade'}
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
      
      {opportunities.length > 3 && (
        <div className="mt-3 text-center">
          <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white w-full">
            View all {opportunities.length} opportunities
          </Button>
        </div>
      )}
    </div>
  );
}
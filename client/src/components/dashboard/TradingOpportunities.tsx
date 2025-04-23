import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TradingOpportunity, StrategyType } from "@/lib/types";
import { STRATEGY_NAMES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { executeTradingOpportunity } from "@/lib/binanceApi";
import { queryClient } from "@/lib/queryClient";

interface TradingOpportunitiesProps {
  opportunities: TradingOpportunity[];
  isLoading: boolean;
}

export default function TradingOpportunities({ 
  opportunities, 
  isLoading 
}: TradingOpportunitiesProps) {
  const { toast } = useToast();

  const executeMutation = useMutation({
    mutationFn: (opportunityId: string) => executeTradingOpportunity(opportunityId),
    onSuccess: () => {
      toast({
        title: "Opportunity executed",
        description: "The trading opportunity has been executed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/binance/opportunities'] });
    },
    onError: (error) => {
      toast({
        title: "Error executing opportunity",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getTimeDiff = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 60000);
    if (diff < 1) return "Just now";
    if (diff === 1) return "1 min ago";
    return `${diff} mins ago`;
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-primary";
    return "text-neutral-light";
  };

  return (
    <Card className="card-glass">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center">
            <i className="ri-radar-line text-primary mr-2"></i>
            Trading Opportunities
          </h2>
          <Button 
            variant="link" 
            className="text-primary hover:text-primary/80 text-sm p-0 h-auto"
          >
            View All
            <i className="ri-arrow-right-line ml-1"></i>
          </Button>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-8 text-neutral-light">
              No trading opportunities detected at the moment.
            </div>
          ) : (
            opportunities.map((opportunity) => {
              const tickerSymbol = opportunity.symbol.replace(/USDT$/, "");
              return (
                <div 
                  key={opportunity.id} 
                  className="bg-[#1C2230] rounded-lg p-3 hover:bg-[#252D3D] transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-dark flex items-center justify-center mr-2">
                        <span className="font-semibold text-xs">{tickerSymbol}</span>
                      </div>
                      <div>
                        <div className="font-medium">{opportunity.symbol}</div>
                        <div className="text-neutral-light text-xs">
                          {STRATEGY_NAMES[opportunity.strategy as StrategyType]}
                        </div>
                      </div>
                    </div>
                    <span className={`
                      ${opportunity.direction === "LONG" 
                        ? "bg-success bg-opacity-20 text-success" 
                        : "bg-danger bg-opacity-20 text-danger"
                      } text-xs px-2 py-0.5 rounded
                    `}>
                      {opportunity.direction}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-neutral-light">
                      Entry Price: <span className="text-white font-mono">
                        ${opportunity.entryPriceMin} - ${opportunity.entryPriceMax}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-light">
                      Target: <span className="text-white font-mono">${opportunity.targetPrice}</span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Opportunity Score</span>
                      <span className={`font-medium ${getScoreColorClass(opportunity.score)}`}>
                        {opportunity.score}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#131722] rounded-full w-full">
                      <div 
                        className={`h-1.5 ${
                          opportunity.score >= 80 
                            ? "bg-success" 
                            : "bg-primary"
                        } rounded-full score-fill`} 
                        style={{ width: `${opportunity.score}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="text-xs text-neutral-light">
                      <i className="ri-time-line"></i>
                      <span> Detected {getTimeDiff(opportunity.detectedAt)}</span>
                    </div>
                    <Button
                      variant="default"
                      size="sm" 
                      className="bg-primary hover:bg-primary/90 text-white text-xs px-3 py-1 h-auto"
                      onClick={() => executeMutation.mutate(opportunity.id)}
                      disabled={executeMutation.isPending && executeMutation.variables === opportunity.id}
                    >
                      <i className="ri-play-circle-line mr-1"></i>
                      {executeMutation.isPending && executeMutation.variables === opportunity.id 
                        ? "Executing..." 
                        : "Execute"
                      }
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

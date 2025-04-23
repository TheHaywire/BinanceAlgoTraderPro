import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Container } from "@/components/Container";
import { useStrategies, useCreateStrategy, useTestStrategy } from "@/hooks/useStrategies";
import { STRATEGY_NAMES } from "@/lib/constants";
import { StrategyType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const strategySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.string().min(1, "Please select a strategy type"),
  lookback: z.coerce.number().int().min(1).max(50),
  threshold: z.coerce.number().min(0.1).max(5),
  isActive: z.boolean().default(false),
});

type StrategyFormValues = z.infer<typeof strategySchema>;

const BacktestForm = ({ strategyId }: { strategyId: number }) => {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("4h");
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const { mutateAsync, isPending } = useTestStrategy();
  const { toast } = useToast();

  const handleBacktest = async () => {
    try {
      const results = await mutateAsync({
        id: strategyId,
        params: { symbol, timeframe }
      });
      setBacktestResults(results);
      toast({
        title: "Backtest Complete",
        description: `Strategy successfully tested on ${symbol}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Backtest Failed",
        description: `Error running backtest: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Symbol</label>
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="bg-[#252D3D] border-none">
              <SelectValue placeholder="Select symbol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
              <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
              <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
              <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Timeframe</label>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="bg-[#252D3D] border-none">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 minute</SelectItem>
              <SelectItem value="5m">5 minutes</SelectItem>
              <SelectItem value="15m">15 minutes</SelectItem>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="4h">4 hours</SelectItem>
              <SelectItem value="1d">1 day</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button 
        onClick={handleBacktest} 
        className="w-full bg-primary hover:bg-primary-light"
        disabled={isPending}
      >
        {isPending ? "Running Backtest..." : "Run Backtest"}
      </Button>
      
      {backtestResults && (
        <div className="mt-4 p-3 rounded-md bg-[#1C2230]">
          <h3 className="text-sm font-medium mb-2">Backtest Results</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm">
              <span className="text-neutral-light">Signal:</span>{" "}
              <Badge className={backtestResults.results.signal === "BUY" ? "bg-success" : "bg-danger"}>
                {backtestResults.results.signal}
              </Badge>
            </div>
            <div className="text-sm">
              <span className="text-neutral-light">Confidence:</span>{" "}
              <span>{backtestResults.results.confidence}%</span>
            </div>
            <div className="text-sm">
              <span className="text-neutral-light">Entry Price:</span>{" "}
              <span>${parseFloat(backtestResults.results.entryPrice).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function StrategiesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);
  
  const { strategies, isLoading } = useStrategies();
  const { mutateAsync, isPending } = useCreateStrategy();
  const { toast } = useToast();
  
  const form = useForm<StrategyFormValues>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      name: "",
      type: "",
      lookback: 14,
      threshold: 1.5,
      isActive: false,
    },
  });
  
  const onSubmit = async (data: StrategyFormValues) => {
    try {
      const { lookback, threshold, ...rest } = data;
      
      // Create strategy with params
      await mutateAsync({
        ...rest,
        params: { lookback, threshold }
      });
      
      toast({
        title: "Strategy Created",
        description: `${data.name} strategy created successfully`,
      });
      
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Creating Strategy",
        description: `${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };
  
  return (
    <Container className="py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trading Strategies</h1>
          <p className="text-neutral-light">Manage and test your algorithmic trading strategies</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-light text-white">
              <i className="ri-add-line mr-1.5"></i>
              New Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1C2230] border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Create New Strategy</DialogTitle>
              <DialogDescription className="text-neutral-light">
                Configure parameters for your trading algorithm
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strategy Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="My Strategy"
                          className="bg-[#252D3D] border-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strategy Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#252D3D] border-none">
                            <SelectValue placeholder="Select strategy type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1C2230] border-gray-800">
                          <SelectItem value="MOMENTUM_BREAKOUT">Momentum Breakout</SelectItem>
                          <SelectItem value="MEAN_REVERSION">Mean Reversion</SelectItem>
                          <SelectItem value="VOLATILITY_EXPANSION">Volatility Expansion</SelectItem>
                          <SelectItem value="LIQUIDATION_CASCADE">Liquidation Cascade</SelectItem>
                          <SelectItem value="FUNDING_ARBITRAGE">Funding Rate Arbitrage</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lookback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lookback Period</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min={1} 
                            max={50}
                            className="bg-[#252D3D] border-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-neutral-light text-xs">
                          Number of periods
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Threshold</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step={0.1}
                            min={0.1}
                            max={5}
                            className="bg-[#252D3D] border-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-neutral-light text-xs">
                          Signal sensitivity
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription className="text-neutral-light text-xs">
                          Strategy will be used for live trading
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary-light text-white"
                    disabled={isPending}
                  >
                    {isPending ? "Creating..." : "Create Strategy"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <Card key={n} className="bg-[#1C2230] border-gray-800 text-white animate-pulse">
              <CardHeader className="h-24" />
              <CardContent className="h-48" />
            </Card>
          ))}
        </div>
      ) : strategies.length === 0 ? (
        <Card className="bg-[#1C2230] border-gray-800 text-white">
          <CardContent className="p-8 text-center">
            <div className="mb-3">
              <i className="ri-robot-line text-4xl text-neutral-light"></i>
            </div>
            <h3 className="text-xl font-medium mb-2">No Strategies Found</h3>
            <p className="text-neutral-light mb-6">
              Create your first trading strategy to get started
            </p>
            <Button 
              className="bg-primary hover:bg-primary-light text-white"
              onClick={() => setDialogOpen(true)}
            >
              <i className="ri-add-line mr-1.5"></i>
              New Strategy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="bg-[#1C2230] border-gray-800 text-white">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  <Badge className={strategy.isActive ? "bg-success" : "bg-neutral-light/30"}>
                    {strategy.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-light">
                  {STRATEGY_NAMES[strategy.type as StrategyType] || strategy.type}
                </p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Parameters</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {Object.entries(strategy.params).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-neutral-light capitalize">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator className="bg-gray-800 my-4" />
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-primary/20 hover:bg-primary/30 text-primary-light border border-primary/30"
                      onClick={() => setSelectedStrategy(strategy.id)}
                    >
                      Backtest Strategy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1C2230] border-gray-800 text-white">
                    <DialogHeader>
                      <DialogTitle>Backtest {strategy.name}</DialogTitle>
                      <DialogDescription className="text-neutral-light">
                        Test this strategy against historical market data
                      </DialogDescription>
                    </DialogHeader>
                    
                    <BacktestForm strategyId={strategy.id} />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
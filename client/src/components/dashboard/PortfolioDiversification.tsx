import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const PortfolioDiversification = () => {
  const [activeTab, setActiveTab] = useState("correlation");
  
  // Fetch correlation matrix data
  const { data: correlationData, isLoading: correlationLoading, refetch: refetchCorrelation } = useQuery({
    queryKey: ["/api/portfolio/correlation"],
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch volatility data
  const { data: volatilityData, isLoading: volatilityLoading, refetch: refetchVolatility } = useQuery({
    queryKey: ["/api/portfolio/volatility"],
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch recommendations
  const { data: recommendationsData, isLoading: recommendationsLoading, refetch: refetchRecommendations } = useQuery({
    queryKey: ["/api/portfolio/recommendations"],
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Handler for manual update
  const handleManualUpdate = async () => {
    try {
      await apiRequest("/api/portfolio/update", {
        method: "POST",
      });
      // Refetch all data
      refetchCorrelation();
      refetchVolatility();
      refetchRecommendations();
    } catch (error) {
      console.error("Error updating portfolio analysis data:", error);
    }
  };

  // Function to get color based on correlation value
  const getCorrelationColor = (value: number) => {
    if (value >= 0.7) return "text-red-500";
    if (value >= 0.5) return "text-amber-500";
    if (value >= 0.3) return "text-yellow-500";
    if (value >= 0) return "text-green-500";
    if (value >= -0.3) return "text-teal-500";
    if (value >= -0.5) return "text-sky-500";
    return "text-blue-500";
  };

  // Function to get color based on volatility value
  const getVolatilityColor = (value: number) => {
    if (value >= 0.05) return "text-red-500";
    if (value >= 0.03) return "text-amber-500";
    if (value >= 0.02) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Portfolio Diversification</CardTitle>
          <CardDescription>
            Correlation analysis and diversification recommendations
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualUpdate}
          disabled={correlationLoading || volatilityLoading || recommendationsLoading}
        >
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Update
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="correlation">Correlation Matrix</TabsTrigger>
            <TabsTrigger value="volatility">Asset Volatility</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Correlation Matrix Tab */}
          <TabsContent value="correlation" className="overflow-x-auto">
            {correlationLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : correlationData?.symbols?.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="font-bold">Asset</TableCell>
                      {correlationData.symbols.map((symbol: string) => (
                        <TableCell key={symbol} className="font-bold">
                          {symbol.replace("USDT", "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {correlationData.symbols.map((symbolRow: string, rowIndex: number) => (
                      <TableRow key={symbolRow}>
                        <TableCell className="font-bold">
                          {symbolRow.replace("USDT", "")}
                        </TableCell>
                        {correlationData.matrix[rowIndex].map((value: number, colIndex: number) => (
                          <TableCell
                            key={`${rowIndex}-${colIndex}`}
                            className={getCorrelationColor(value)}
                          >
                            {value.toFixed(2)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-neutral-500">
                No correlation data available. Need more assets to calculate correlations.
              </div>
            )}
          </TabsContent>

          {/* Volatility Tab */}
          <TabsContent value="volatility">
            {volatilityLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : volatilityData?.length > 0 ? (
              <div>
                <div className="mb-4">
                  <p className="text-sm text-neutral-500 mb-2">
                    Higher volatility assets generally require smaller position sizes and present higher risk.
                  </p>
                </div>
                <div className="space-y-4">
                  {volatilityData.map((item: { symbol: string; volatility: number }) => (
                    <div key={item.symbol} className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{item.symbol.replace("USDT", "")}</span>
                        <span className={getVolatilityColor(item.volatility)}>
                          {(item.volatility * 100).toFixed(2)}%
                        </span>
                      </div>
                      <Progress
                        value={item.volatility * 1000}
                        max={100}
                        className={
                          item.volatility >= 0.05
                            ? "bg-red-200"
                            : item.volatility >= 0.03
                            ? "bg-amber-200"
                            : item.volatility >= 0.02
                            ? "bg-yellow-200"
                            : "bg-green-200"
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-neutral-500">
                No volatility data available yet. Check back later.
              </div>
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            {recommendationsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : recommendationsData ? (
              <div className="space-y-6">
                {/* Over-exposed Sectors */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Sector Exposure</h3>
                  {recommendationsData.overexposedSectors?.length > 0 ? (
                    <div className="space-y-2">
                      {recommendationsData.overexposedSectors.map((sector: { sector: string; exposure: number }) => (
                        <div key={sector.sector} className="flex items-center space-x-2">
                          <AlertCircleIcon className="h-5 w-5 text-amber-500" />
                          <span>
                            Over-exposed to {sector.sector} ({sector.exposure.toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-green-500">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Sector exposure is well-balanced</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* High Correlation Pairs */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Correlation Warnings</h3>
                  {recommendationsData.highCorrelationPairs?.length > 0 ? (
                    <div className="space-y-2">
                      {recommendationsData.highCorrelationPairs.map((pair: { symbolA: string; symbolB: string; correlation: number }, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <AlertCircleIcon className="h-5 w-5 text-amber-500" />
                          <span>
                            {pair.symbolA.replace("USDT", "")} and {pair.symbolB.replace("USDT", "")} are highly correlated ({(pair.correlation * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-green-500">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>No high correlation pairs detected</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Recommended Allocations */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Recommended Allocations</h3>
                  {recommendationsData.recommendedAllocations?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell>Asset</TableCell>
                          <TableCell>Current</TableCell>
                          <TableCell>Recommended</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recommendationsData.recommendedAllocations.map((alloc: { symbol: string; currentAllocation: number; recommendedAllocation: number }) => {
                          const diff = alloc.recommendedAllocation - alloc.currentAllocation;
                          const action = Math.abs(diff) < 5 ? "Hold" : diff > 0 ? "Increase" : "Decrease";
                          
                          return (
                            <TableRow key={alloc.symbol}>
                              <TableCell>{alloc.symbol.replace("USDT", "")}</TableCell>
                              <TableCell>{alloc.currentAllocation.toFixed(1)}%</TableCell>
                              <TableCell>{alloc.recommendedAllocation.toFixed(1)}%</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={action === "Hold" ? "outline" : 
                                          action === "Increase" ? "default" : "destructive"}
                                >
                                  {action === "Increase" && <ChevronUpIcon className="h-3 w-3 mr-1" />}
                                  {action === "Decrease" && <ChevronDownIcon className="h-3 w-3 mr-1" />}
                                  {action}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex items-center justify-center h-12 text-neutral-500">
                      No allocation recommendations available yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-neutral-500">
                No recommendations available yet. Check back later.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PortfolioDiversification;
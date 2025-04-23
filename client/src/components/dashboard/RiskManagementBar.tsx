import { Card, CardContent } from "@/components/ui/card";
import { RiskMetrics } from "@/lib/types";

interface RiskManagementBarProps {
  riskMetrics: RiskMetrics;
  isLoading: boolean;
}

export default function RiskManagementBar({ riskMetrics, isLoading }: RiskManagementBarProps) {
  const riskPercentage = (riskMetrics.totalRiskExposure / riskMetrics.maxRiskLimit) * 100;
  const riskStatus = riskPercentage <= 50 
    ? "Healthy" 
    : riskPercentage <= 80 
    ? "Moderate" 
    : "High";
  
  const riskStatusColor = riskPercentage <= 50 
    ? "text-success" 
    : riskPercentage <= 80 
    ? "text-primary" 
    : "text-danger";
  
  const riskBarColor = riskPercentage <= 50 
    ? "bg-success" 
    : riskPercentage <= 80 
    ? "bg-primary" 
    : "bg-danger";
  
  return (
    <Card className="card-glass mt-6">
      <CardContent className="p-4">
        <h2 className="font-semibold text-lg mb-3 flex items-center">
          <i className="ri-shield-check-line text-primary mr-2"></i>
          Risk Management
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1C2230] rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Account Risk</span>
                <span className={riskStatusColor + " text-xs"}>{riskStatus}</span>
              </div>
              
              <div className="mb-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>Total Risk Exposure</span>
                  <span>{riskMetrics.totalRiskExposure}% / {riskMetrics.maxRiskLimit}%</span>
                </div>
                <div className="h-1.5 bg-[#131722] rounded-full w-full">
                  <div 
                    className={`h-1.5 ${riskBarColor} rounded-full`} 
                    style={{ width: `${riskPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-neutral-light">
                <span>Max Drawdown: {riskMetrics.currentDrawdown}</span>
                <span>Target Limit: {riskMetrics.maxDrawdownLimit}</span>
              </div>
            </div>
            
            <div className="bg-[#1C2230] rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Position Limits</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-neutral-light mb-1">Max Position Size</div>
                  <div className="flex items-baseline">
                    <span className="font-mono font-medium">{riskMetrics.maxPositionSize}</span>
                    <span className="text-xs text-neutral-light ml-1">USDT</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-light mb-1">Max Positions</div>
                  <div className="flex items-baseline">
                    <span className="font-mono font-medium">{riskMetrics.maxPositions}</span>
                    <span className="text-xs text-neutral-light ml-1">
                      ({riskMetrics.currentPositions} active)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1C2230] rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">System Health</span>
                <span className="inline-flex items-center bg-success bg-opacity-20 text-success px-2 py-0.5 rounded text-xs">
                  <i className="ri-checkbox-circle-line mr-1"></i>
                  {riskMetrics.systemStatus.api && 
                   riskMetrics.systemStatus.execution && 
                   riskMetrics.systemStatus.dataFeed
                    ? "All Systems Operational"
                    : "System Issue Detected"
                  }
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <div className="text-xs text-neutral-light mb-1">API</div>
                  <i className={`${
                    riskMetrics.systemStatus.api 
                      ? "ri-checkbox-circle-fill text-success" 
                      : "ri-close-circle-fill text-danger"
                  }`}></i>
                </div>
                <div>
                  <div className="text-xs text-neutral-light mb-1">Execution</div>
                  <i className={`${
                    riskMetrics.systemStatus.execution 
                      ? "ri-checkbox-circle-fill text-success" 
                      : "ri-close-circle-fill text-danger"
                  }`}></i>
                </div>
                <div>
                  <div className="text-xs text-neutral-light mb-1">Data Feed</div>
                  <i className={`${
                    riskMetrics.systemStatus.dataFeed 
                      ? "ri-checkbox-circle-fill text-success" 
                      : "ri-close-circle-fill text-danger"
                  }`}></i>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

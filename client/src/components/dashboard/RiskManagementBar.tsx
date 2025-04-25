import { Button } from "@/components/ui/button";
import { RiskMetrics } from "@/lib/types";

interface RiskManagementBarProps {
  riskMetrics: RiskMetrics;
  isLoading: boolean;
}

export default function RiskManagementBar({ riskMetrics, isLoading }: RiskManagementBarProps) {
  if (isLoading || !riskMetrics) {
    return (
      <div className="mt-8 p-4 bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)] animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-12 bg-gray-700 rounded"></div>
      </div>
    );
  }
  
  // Calculate risk status
  const totalRiskExposure = riskMetrics.totalRiskExposure || 0;
  const maxRiskLimit = riskMetrics.maxRiskLimit || 100;
  const riskPercentage = (totalRiskExposure / maxRiskLimit) * 100;
  const riskStatus = 
    riskPercentage >= 80 ? "high" : 
    riskPercentage >= 50 ? "medium" : 
    "low";
  
  // Calculate status colors
  const statusColors = {
    low: {
      bg: "bg-[rgba(0,200,151,0.1)]",
      text: "text-[#00C897]",
      progressBg: "bg-[#00C897]",
    },
    medium: {
      bg: "bg-[rgba(255,184,0,0.1)]",
      text: "text-[#FFB800]",
      progressBg: "bg-[#FFB800]",
    },
    high: {
      bg: "bg-[rgba(255,59,105,0.1)]",
      text: "text-[#FF3B69]",
      progressBg: "bg-[#FF3B69]",
    },
  };
  
  return (
    <div className="mt-8 p-4 bg-[rgba(16,22,34,0.6)] rounded-xl border border-[rgba(73,86,118,0.15)]">
      <div className="flex flex-col md:flex-row justify-between mb-3">
        <div>
          <h3 className="font-medium">System Risk Management</h3>
          <p className="text-sm text-neutral-400">Dynamic risk controls and exposure monitoring</p>
        </div>
        
        <div className="mt-2 md:mt-0 flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm ${statusColors[riskStatus].bg} ${statusColors[riskStatus].text}`}>
            {riskStatus === "low" ? "Low Risk" : riskStatus === "medium" ? "Medium Risk" : "High Risk"}
          </div>
          
          <Button size="sm" variant="outline" className="border-[rgba(73,86,118,0.3)] text-white">
            <i className="ri-settings-4-line mr-1.5"></i>
            Settings
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-[rgba(10,15,28,0.3)] rounded-lg p-3">
          <div className="text-sm text-neutral-400 mb-1">Total Risk Exposure</div>
          <div className="font-bold text-lg">{totalRiskExposure}%</div>
          <div className="text-xs text-neutral-400">of maximum {maxRiskLimit}%</div>
        </div>
        
        <div className="bg-[rgba(10,15,28,0.3)] rounded-lg p-3">
          <div className="text-sm text-neutral-400 mb-1">Active Positions</div>
          <div className="font-bold text-lg">{riskMetrics.activePositions || 0}</div>
          <div className="text-xs text-neutral-400">of maximum {riskMetrics.maxPositions || 10}</div>
        </div>
        
        <div className="bg-[rgba(10,15,28,0.3)] rounded-lg p-3">
          <div className="text-sm text-neutral-400 mb-1">Current Drawdown</div>
          <div className="font-bold text-lg">{riskMetrics.currentDrawdown || 0}%</div>
          <div className="text-xs text-neutral-400">limit {riskMetrics.maxDrawdownLimit || 20}%</div>
        </div>
        
        <div className="bg-[rgba(10,15,28,0.3)] rounded-lg p-3">
          <div className="text-sm text-neutral-400 mb-1">Max Leverage</div>
          <div className="font-bold text-lg">{riskMetrics.maxLeverage || 5}x</div>
          <div className="text-xs text-neutral-400">dynamic adjustment active</div>
        </div>
      </div>
      
      <div className="w-full bg-[rgba(10,15,28,0.3)] h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full ${statusColors[riskStatus].progressBg}`}
          style={{ width: `${Math.min(100, riskPercentage)}%` }}
        ></div>
      </div>
      
      <div className="mt-1 flex justify-between">
        <span className="text-xs text-neutral-400">Low Risk</span>
        <span className="text-xs text-neutral-400">Medium Risk</span>
        <span className="text-xs text-neutral-400">High Risk</span>
      </div>
    </div>
  );
}
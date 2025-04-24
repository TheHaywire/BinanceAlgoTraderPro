import { cn } from "@/lib/utils";

type TrendDirection = "up" | "down" | "neutral";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: string;
    direction: TrendDirection;
    label?: string;
  };
  progress?: {
    value: number;
    max: number;
  };
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  progress,
}: MetricCardProps) {
  return (
    <div className="bg-gradient-to-br from-[rgba(16,22,34,0.6)] to-[rgba(10,15,28,0.1)] rounded-xl border border-[rgba(73,86,118,0.15)] p-4 text-white backdrop-blur-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="font-medium text-sm text-neutral-200">{title}</div>
        {icon && (
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(0,149,255,0.1)]">
            <i className={cn(icon, "text-primary")}></i>
          </div>
        )}
      </div>
      
      <div className="flex flex-col">
        <div className="text-xl md:text-2xl font-bold mb-0.5">
          {value}
          {subtitle && <span className="text-sm font-normal text-neutral-400 ml-1">{subtitle}</span>}
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center text-xs",
            trend.direction === "up" ? "text-[#00C897]" : 
            trend.direction === "down" ? "text-[#FF3B69]" : 
            "text-neutral-400"
          )}>
            {trend.direction !== "neutral" && (
              <i className={cn(
                trend.direction === "up" ? "ri-arrow-up-line" : "ri-arrow-down-line",
                "mr-1"
              )}></i>
            )}
            <span>{trend.value}</span>
            {trend.label && <span className="text-neutral-400 ml-1">{trend.label}</span>}
          </div>
        )}
        
        {progress && (
          <div className="mt-2">
            <div className="w-full bg-[rgba(73,86,118,0.15)] h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(100, (progress.value / progress.max) * 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  progress?: {
    value: number;
    max: number;
  };
  className?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  progress,
  className
}: MetricCardProps) {
  const trendColor = trend
    ? trend.direction === 'up'
      ? 'text-success'
      : trend.direction === 'down'
      ? 'text-danger'
      : 'text-neutral-light'
    : '';

  const trendIcon = trend
    ? trend.direction === 'up'
      ? 'ri-arrow-up-line'
      : trend.direction === 'down'
      ? 'ri-arrow-down-line'
      : ''
    : '';

  return (
    <div className={cn("premium-card p-5", className)}>
      {/* Add subtle glow effect in top-right corner */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-glow rounded-full opacity-50"></div>
      
      <div className="flex justify-between items-start mb-3 relative">
        <span className="text-neutral-light text-sm font-medium">{title}</span>
        <div className="w-10 h-10 rounded-lg bg-[rgba(28,34,48,0.5)] flex items-center justify-center">
          <i className={`${icon} text-primary text-xl`}></i>
        </div>
      </div>
      
      <div className="flex items-baseline mt-2 relative">
        <span className="text-2xl font-mono font-bold text-gradient-blue">{value}</span>
        {subtitle && <span className="ml-1.5 text-neutral-light text-sm">{subtitle}</span>}
      </div>
      
      {trend && (
        <div className="flex items-center mt-2 relative">
          <span className={`${trendColor} text-sm font-medium flex items-center`}>
            {trendIcon && <i className={`${trendIcon} mr-1`}></i>}
            {trend.value}
          </span>
          {trend.label && <span className="text-neutral-light text-xs ml-2 opacity-75">{trend.label}</span>}
        </div>
      )}
      
      {progress && (
        <div className="flex items-center mt-3 relative">
          <div className="h-1.5 bg-[rgba(19,23,34,0.5)] rounded-full w-full overflow-hidden">
            <div 
              className="h-1.5 bg-gradient-to-r from-[#0095FF] to-[#0047AB] rounded-full" 
              style={{ width: `${(progress.value / progress.max) * 100}%` }}
            ></div>
          </div>
          <span className="text-xs text-neutral-light ml-2">{progress.value}/{progress.max}</span>
        </div>
      )}
    </div>
  );
}

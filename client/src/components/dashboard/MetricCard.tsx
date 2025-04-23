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
    <div className={cn("card-glass p-4", className)}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-neutral-light text-sm">{title}</span>
        <i className={`${icon} text-primary-light text-xl`}></i>
      </div>
      <div className="flex items-baseline">
        <span className="text-2xl font-mono font-semibold">{value}</span>
        {subtitle && <span className="ml-1 text-neutral-light">{subtitle}</span>}
      </div>
      {trend && (
        <div className="flex items-center mt-1">
          <span className={`${trendColor} text-sm font-medium`}>{trend.value}</span>
          {trendIcon && <i className={`${trendIcon} ${trendColor} ml-1`}></i>}
          {trend.label && <span className="text-neutral-light text-xs ml-2">{trend.label}</span>}
        </div>
      )}
      {progress && (
        <div className="flex items-center mt-1">
          <div className="h-1.5 bg-[#131722] rounded-full w-full">
            <div 
              className="h-1.5 bg-primary rounded-full" 
              style={{ width: `${(progress.value / progress.max) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

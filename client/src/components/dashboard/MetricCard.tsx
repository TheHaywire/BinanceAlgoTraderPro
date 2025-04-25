import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  isLive?: boolean;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  progress,
  isLive = false,
}: MetricCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevValue, setPrevValue] = useState<string | number | null>(null);
  
  // Enhanced animation effect when value changes
  useEffect(() => {
    if (prevValue !== null && prevValue !== value) {
      // Start animation
      setIsAnimating(true);
      
      // Reset animation after 800ms for a more noticeable effect
      const timer = setTimeout(() => setIsAnimating(false), 800);
      
      // Add visual feedback for live updates
      if (isLive) {
        // Flash the value for a nice visual effect
        const flashElement = document.getElementById(`metric-value-${title.replace(/\s+/g, '-').toLowerCase()}`);
        if (flashElement) {
          flashElement.classList.add('flash-update');
          setTimeout(() => {
            flashElement.classList.remove('flash-update');
          }, 1000);
        }
      }
      
      return () => clearTimeout(timer);
    }
    setPrevValue(value);
  }, [value, prevValue, isLive, title]);
  
  // Progressive formatting for large numbers
  const formattedValue = typeof value === 'number' && value > 1000 
    ? new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        notation: value > 100000 ? 'compact' : 'standard'
      }).format(value)
    : value;
  
  return (
    <div className="card-metric p-4 relative group overflow-hidden">
      {/* Premium top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Card content with enhanced styling */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="font-medium text-sm">{title}</div>
            {isLive && (
              <div className="ml-2 flex items-center" title="Real-time data">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse mr-1"></div>
                <span className="text-xs text-accent/80">LIVE</span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-[rgba(0,149,255,0.08)] 
                        border border-[rgba(0,149,255,0.12)] shadow-sm group-hover:shadow-primary/20 
                        transition-all duration-300 group-hover:scale-110 group-hover:bg-[rgba(0,149,255,0.12)]">
              <i className={cn(icon, "text-primary group-hover:text-primary-light transition-colors")}></i>
            </div>
          )}
        </div>
        
        <div className="flex flex-col">
          <div className={cn(
            "text-xl md:text-2xl font-bold mb-0.5 transition-all duration-300",
            isAnimating && "text-primary-light scale-105",
          )}>
            <span className="font-mono tracking-tight">{formattedValue}</span>
            {subtitle && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {subtitle}
              </span>
            )}
          </div>
          
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              trend.direction === "up" ? "text-success" : 
              trend.direction === "down" ? "text-destructive" : 
              "text-muted-foreground"
            )}>
              {trend.direction !== "neutral" && (
                <i className={cn(
                  "mr-1",
                  trend.direction === "up" 
                    ? "ri-arrow-up-line text-success" 
                    : "ri-arrow-down-line text-destructive"
                )}></i>
              )}
              <span>{trend.value}</span>
              {trend.label && (
                <span className="text-muted-foreground ml-1.5 opacity-80">
                  {trend.label}
                </span>
              )}
            </div>
          )}
          
          {progress && (
            <div className="mt-3 pt-1">
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="text-muted-foreground">{progress.value}/{progress.max}</span>
                <span className="text-muted-foreground">
                  {Math.round((progress.value / progress.max) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                  style={{ 
                    width: `${Math.min(100, (progress.value / progress.max) * 100)}%`,
                    boxShadow: '0 0 8px rgba(0, 149, 255, 0.5)'
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
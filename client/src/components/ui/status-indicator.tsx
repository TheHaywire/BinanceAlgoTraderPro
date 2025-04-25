import React from "react";
import { cn } from "@/lib/utils";

type StatusType = "healthy" | "warning" | "error" | "connecting";

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const statusConfig = {
  healthy: {
    color: "bg-green-500",
    pulse: false,
    text: "Connected"
  },
  warning: {
    color: "bg-amber-500",
    pulse: true,
    text: "Delayed"
  },
  error: {
    color: "bg-red-500", 
    pulse: true,
    text: "Disconnected"
  },
  connecting: {
    color: "bg-blue-500",
    pulse: true,
    text: "Connecting"
  }
};

const sizeConfig = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4"
};

export const StatusIndicator = ({
  status,
  size = "md",
  showText = false,
  className,
  ...props
}: StatusIndicatorProps) => {
  const { color, pulse, text } = statusConfig[status];
  const sizeClass = sizeConfig[size];
  
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className={cn("relative rounded-full", sizeClass, color)}>
        {pulse && (
          <span className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-75",
            color
          )} />
        )}
      </div>
      {showText && <span className="text-xs">{text}</span>}
    </div>
  );
};
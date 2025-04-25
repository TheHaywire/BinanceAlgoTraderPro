import React, { useState } from 'react';

interface GlowingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  glowIntensity?: 'low' | 'medium' | 'high';
}

const GlowingCard: React.FC<GlowingCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(0, 112, 243, 0.5)',
  glowIntensity = 'medium',
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Determine glow strength based on intensity
  const glowSize = {
    low: '20px',
    medium: '35px',
    high: '50px',
  }[glowIntensity];

  const glowOpacity = {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
  }[glowIntensity];

  // Handle mouse movement for dynamic glow effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPosition({ x, y });
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950/50 backdrop-blur-sm ${className}`}
      style={{
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.9))',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Dynamic glow effect that follows cursor */}
      {isHovering && (
        <div
          className="absolute pointer-events-none transition-opacity duration-300"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -50%)',
            width: glowSize,
            height: glowSize,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor} 0%, rgba(0,0,0,0) 70%)`,
            opacity: glowOpacity,
            zIndex: 1,
            filter: 'blur(8px)',
          }}
        />
      )}

      {/* Static border glow effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(145deg, rgba(0, 112, 243, 0.05), rgba(0, 200, 255, 0.1))`,
          borderRadius: 'inherit',
          pointerEvents: 'none',
        }}
      />

      {/* Main content */}
      <div className="relative z-10">{children}</div>
      
      {/* Subtle animated border glow */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none" 
        style={{
          borderRadius: 'inherit',
          boxShadow: `inset 0 0 5px ${glowColor.replace('0.5', '0.3')}`,
          animation: 'pulse 4s infinite',
        }}
      />
    </div>
  );
};

export default GlowingCard;
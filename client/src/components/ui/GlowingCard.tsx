import React, { useState } from 'react';

interface GlowingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  glowIntensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
}

/**
 * GlowingCard - A premium card component with customizable glow effects
 * that can respond to user interaction.
 */
export const GlowingCard: React.FC<GlowingCardProps> = ({
  children,
  className = '',
  glowColor = '#0095FF',
  glowIntensity = 'medium',
  interactive = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate the glow intensity based on the prop
  const getGlowStyle = () => {
    // Base shadow intensity values
    const intensityValues = {
      low: {
        default: '0 0 10px 1px',
        hover: '0 0 15px 2px'
      },
      medium: {
        default: '0 0 15px 2px',
        hover: '0 0 20px 4px'
      },
      high: {
        default: '0 0 20px 4px',
        hover: '0 0 30px 8px'
      }
    };
    
    // Convert hex to rgba for the glow
    const hexToRgba = (hex: string, alpha: number) => {
      // Remove # if present
      hex = hex.replace('#', '');
      
      // Convert 3-char hex to 6-char
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      
      // Parse the hex values
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    // Set opacity based on intensity
    const opacity = {
      low: { default: 0.2, hover: 0.3 },
      medium: { default: 0.3, hover: 0.4 },
      high: { default: 0.4, hover: 0.5 }
    };
    
    const selectedIntensity = intensityValues[glowIntensity];
    const selectedOpacity = opacity[glowIntensity];
    
    const glowValue = isHovered && interactive
      ? selectedIntensity.hover
      : selectedIntensity.default;
      
    const opacityValue = isHovered && interactive
      ? selectedOpacity.hover
      : selectedOpacity.default;
    
    return {
      boxShadow: `${glowValue} ${hexToRgba(glowColor, opacityValue)}`,
      transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
      transform: isHovered && interactive ? 'translateY(-4px)' : 'translateY(0)',
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      borderRadius: '0.75rem',
      border: `1px solid ${hexToRgba(glowColor, opacityValue / 2)}`,
    };
  };
  
  return (
    <div
      className={`card-dashboard overflow-hidden ${className}`}
      style={getGlowStyle()}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
    >
      {children}
    </div>
  );
};

export default GlowingCard;
import React, { useEffect, useRef } from 'react';

interface ParticleBackgroundProps {
  color?: string;
  particleCount?: number;
  particleSpeed?: number;
  className?: string;
}

/**
 * ParticleBackground - Renders an animated canvas with floating particles
 * for a premium visual effect. Designed to be placed as a background element.
 */
export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  color = '#0095FF',
  particleCount = 40,
  particleSpeed = 0.5,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize the canvas to fill parent
    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
      }
    };

    // Initialize with correct size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Set up particles
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      opacity: number;
      life: number;
      maxLife: number;
    }> = [];

    // Create initial particles
    for (let i = 0; i < particleCount; i++) {
      createParticle();
    }

    function createParticle() {
      const radius = Math.random() * 2 + 0.5;
      const maxLife = Math.random() * 100 + 100;
      
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius,
        vx: (Math.random() - 0.5) * particleSpeed,
        vy: (Math.random() - 0.5) * particleSpeed,
        opacity: Math.random() * 0.5 + 0.2,
        life: 0,
        maxLife
      });
    }

    // Animation loop
    function animate() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Calculate life percentage
        const lifePercent = p.life / p.maxLife;
        
        // Fade in and out based on life
        let alpha = p.opacity;
        if (lifePercent < 0.1) {
          alpha = p.opacity * (lifePercent / 0.1);
        } else if (lifePercent > 0.9) {
          alpha = p.opacity * (1 - (lifePercent - 0.9) / 0.1);
        }
        
        // Set color with opacity
        ctx.fillStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        
        // Update life
        p.life++;
        
        // Check if particle is dead or out of bounds
        if (p.life >= p.maxLife || 
            p.x < -p.radius || 
            p.x > canvas.width + p.radius || 
            p.y < -p.radius || 
            p.y > canvas.height + p.radius) {
          // Replace particle
          particles.splice(i, 1);
          createParticle();
          i--;
        }
      }
      
      // Draw connections between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.strokeStyle = `${color}${Math.floor((1 - distance / 100) * 40).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Clean up
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [color, particleCount, particleSpeed]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default ParticleBackground;
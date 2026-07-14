
import React from 'react';

interface LogoProps {
  className?: string;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
  const id = React.useId();

  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Deep Emerald Gradient for depth */}
        <linearGradient id={`${id}-primary`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />   {/* Light Emerald */}
          <stop offset="100%" stopColor="#064E3B" /> {/* Dark Emerald */}
        </linearGradient>

        {/* Accent Gradient for the 'shine' effect */}
        <linearGradient id={`${id}-accent`} x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Glow Filter for that 'Tech' feel */}
        <filter id={`${id}-soft-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 
         THE EMERALD KNOT / THE NEXUS
         An abstract impossible triangle shape with rounded, fluid corners.
         It represents: Continuity, Connection, and Strength.
      */}
      <g filter={`url(#${id}-soft-glow)`} opacity="0.4">
          <circle cx="50" cy="55" r="35" fill={`url(#${id}-primary)`} />
      </g>

      <g transform="translate(50, 50) scale(0.85) translate(-50, -50)">
        {/* The symbol is constructed of 3 interlocking 'V' shapes or boomerangs */}
        
        {/* Top Right Element */}
        <path 
          d="M50 20 C65 20, 80 35, 80 50 C80 60, 75 70, 65 75 L55 65 C62 60, 65 55, 65 50 C65 42, 58 35, 50 35 L50 20 Z" 
          fill={`url(#${id}-accent)`}
        />
        
        {/* Bottom Element */}
        <path 
          d="M65 75 C55 85, 45 85, 35 75 L45 65 C50 68, 50 68, 55 65 Z" 
          fill="#065F46" 
          opacity="0.8"
        />
        
        {/* Left Element */}
        <path 
          d="M35 75 C25 70, 20 60, 20 50 C20 35, 35 20, 50 20 L50 35 C42 35, 35 42, 35 50 C35 55, 38 60, 45 65 L35 75 Z" 
          fill={`url(#${id}-primary)`}
        />

        {/* Center Core Dot - The "Eye" of AI */}
        <circle cx="50" cy="50" r="6" fill="white" />
      </g>
    </svg>
  );
};

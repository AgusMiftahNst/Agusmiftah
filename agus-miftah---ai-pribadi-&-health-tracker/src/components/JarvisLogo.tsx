import React from 'react';

interface JarvisLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'cyan' | 'amber' | 'hybrid';
  animated?: boolean;
  className?: string;
}

export function JarvisLogo({
  size = 'md',
  variant = 'hybrid',
  animated = true,
  className = ''
}: JarvisLogoProps) {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const ringAnimation = animated ? 'animate-[spin_16s_linear_infinite]' : '';
  const reverseAnimation = animated ? 'animate-[spin_10s_linear_infinite_reverse]' : '';
  const pulseCore = animated ? 'animate-pulse' : '';

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-slate-950 p-0.5 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-500/40 shrink-0 ${sizeMap[size]} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="jarvisCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="jarvisAmber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>

        {/* Outer Glow Ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={variant === 'amber' ? 'url(#jarvisAmber)' : 'url(#jarvisCyan)'}
          strokeWidth="1.5"
          strokeOpacity="0.3"
        />

        {/* Rotating Outer Segmented Arc */}
        <g className={ringAnimation} style={{ transformOrigin: '50px 50px' }}>
          <circle
            cx="50"
            cy="50"
            r="41"
            stroke={variant === 'amber' ? '#f59e0b' : '#00f2fe'}
            strokeWidth="1.8"
            strokeDasharray="18 10 4 10"
            strokeOpacity="0.85"
          />
        </g>

        {/* Rotating Inner Counter-clockwise Arc */}
        <g className={reverseAnimation} style={{ transformOrigin: '50px 50px' }}>
          <circle
            cx="50"
            cy="50"
            r="33"
            stroke={variant === 'cyan' ? '#38bdf8' : '#f97316'}
            strokeWidth="1.8"
            strokeDasharray="22 14 6 14"
            strokeOpacity="0.9"
          />
        </g>

        {/* Static Inner Tech Border */}
        <circle
          cx="50"
          cy="50"
          r="25"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeDasharray="8 6"
          strokeOpacity="0.6"
        />

        {/* Arc Reactor Geometric Core */}
        <polygon
          points="50,34 64,58 36,58"
          stroke={variant === 'amber' ? '#fbbf24' : '#00f2fe'}
          strokeWidth="2.2"
          fill="none"
        />

        {/* Center Glowing AI Core */}
        <circle
          cx="50"
          cy="50"
          r="5"
          fill={variant === 'amber' ? '#fbbf24' : '#00f2fe'}
          className={pulseCore}
        />
        <circle cx="50" cy="50" r="2.5" fill="#ffffff" />

        {/* Tech crosshairs */}
        <line x1="50" y1="8" x2="50" y2="15" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.8" />
        <line x1="50" y1="85" x2="50" y2="92" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.8" />
        <line x1="8" y1="50" x2="15" y2="50" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.8" />
        <line x1="85" y1="50" x2="92" y2="50" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.8" />
      </svg>
    </div>
  );
}

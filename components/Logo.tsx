import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 64 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
        <defs>
          <linearGradient id="tealGradientLog" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" /> {/* teal-600 */}
            <stop offset="100%" stopColor="#115e59" /> {/* teal-800 */}
          </linearGradient>
           <linearGradient id="goldGradientLog" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" /> 
            <stop offset="100%" stopColor="#d97706" /> 
          </linearGradient>
        </defs>

        {/* Base Shape: Rub el Hizb (Two overlapping squares) */}
        <g transform="translate(50 50)">
           <rect x="-35" y="-35" width="70" height="70" rx="4" transform="rotate(0)" fill="white" stroke="url(#tealGradientLog)" strokeWidth="1.5" />
           <rect x="-35" y="-35" width="70" height="70" rx="4" transform="rotate(45)" fill="white" stroke="url(#tealGradientLog)" strokeWidth="1.5" />
        </g>
        
        {/* Inner Shape */}
        <path d="M50 20 L58 42 L80 50 L58 58 L50 80 L42 58 L20 50 L42 42 Z" fill="url(#tealGradientLog)" opacity="0.1" />
        <path d="M50 25 L56 44 L75 50 L56 56 L50 75 L44 56 L25 50 L44 44 Z" fill="url(#tealGradientLog)" />

        {/* Center Accent */}
        <circle cx="50" cy="50" r="6" fill="url(#goldGradientLog)" stroke="white" strokeWidth="2" />

        {/* Decorative Dots */}
        <circle cx="50" cy="10" r="2" fill="#d97706" />
        <circle cx="50" cy="90" r="2" fill="#d97706" />
        <circle cx="90" cy="50" r="2" fill="#d97706" />
        <circle cx="10" cy="50" r="2" fill="#d97706" />

      </svg>
    </div>
  );
};

export default Logo;
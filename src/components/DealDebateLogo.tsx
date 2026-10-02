import React from 'react';

interface DealDebateLogoProps {
  className?: string;
  size?: number;
}

export const DealDebateLogo: React.FC<DealDebateLogoProps> = ({ 
  className = "w-11 h-11", 
  size = 44 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Royal Blue Left/Top Bubble (Advocate / User) */}
      <path
        d="M10 13C10 8.58172 13.5817 5 18 5H28C32.4183 5 36 8.58172 36 13V21C36 25.4183 32.4183 29 28 29H18.5L12 34.5V29H18C16 29 10 27 10 21V13Z"
        fill="#2563eb"
      />

      {/* Refined Slate Grey Right/Bottom Bubble (Opponent / Counterpart) */}
      <path
        d="M38 35C38 39.4183 34.4183 43 30 43H20C15.5817 43 12 39.4183 12 35V27C12 22.5817 15.5817 19 20 19H29.5L36 13.5V19H30C32 19 38 21 38 27V35Z"
        fill="#64748b"
        fillOpacity="0.9"
      />

      {/* Handshake Clasp Interlock Geometry at the intersection */}
      <g filter="url(#subtle-depth)">
        {/* Blue arm clasp reaching right */}
        <path
          d="M17 22H23.5L27 25.5L24.5 28L21 24.5H17V22Z"
          fill="#1d4ed8"
        />
        {/* Grey arm clasp reaching left */}
        <path
          d="M31 26H24.5L21 22.5L23.5 20L27 23.5H31V26Z"
          fill="#475569"
        />
        {/* Interlocking knuckle junction */}
        <circle cx="24" cy="24" r="2.2" fill="#ffffff" fillOpacity="0.9" />
      </g>
    </svg>
  );
};

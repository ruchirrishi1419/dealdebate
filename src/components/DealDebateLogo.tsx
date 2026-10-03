import React from 'react';

interface DealDebateLogoProps {
  className?: string;
  size?: number;
}

export const DealDebateLogo: React.FC<DealDebateLogoProps> = ({ 
  className = "w-10 h-10", 
  size = 40 
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
      {/* Primary Left/Top Bubble (Deep Ink Black) */}
      <path
        d="M10 13C10 8.58172 13.5817 5 18 5H28C32.4183 5 36 8.58172 36 13V21C36 25.4183 32.4183 29 28 29H18.5L12 34.5V29H18C16 29 10 27 10 21V13Z"
        fill="#111111"
      />

      {/* Right/Bottom Bubble (Clean White with Hairline Black Border) */}
      <path
        d="M38 35C38 39.4183 34.4183 43 30 43H20C15.5817 43 12 39.4183 12 35V27C12 22.5817 15.5817 19 20 19H29.5L36 13.5V19H30C32 19 38 21 38 27V35Z"
        fill="#ffffff"
        stroke="#111111"
        strokeWidth="1.5"
      />

      {/* Interlocking Handshake Motif Geometry in Black & White */}
      <g>
        {/* Black arm clasp */}
        <path
          d="M17 22H23.5L27 25.5L24.5 28L21 24.5H17V22Z"
          fill="#111111"
        />
        {/* Grey arm clasp */}
        <path
          d="M31 26H24.5L21 22.5L23.5 20L27 23.5H31V26Z"
          fill="#737373"
        />
        {/* Center contact point */}
        <circle cx="24" cy="24" r="2" fill="#ffffff" stroke="#111111" strokeWidth="1" />
      </g>
    </svg>
  );
};

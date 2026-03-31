'use client';

import { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

export function AlpineBackground() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    const flakes: Snowflake[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 10 + Math.random() * 20,
      size: 2 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.5,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient sky */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            oklch(0.12 0.02 250) 0%,
            oklch(0.18 0.03 240) 30%,
            oklch(0.25 0.04 230) 60%,
            oklch(0.35 0.05 220) 100%
          )`
        }}
      />

      {/* Stars */}
      <div className="absolute inset-0">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              opacity: 0.3 + Math.random() * 0.7,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Northern lights effect */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(
            ellipse 150% 50% at 20% 10%,
            oklch(0.6 0.15 180 / 0.3) 0%,
            transparent 50%
          ), radial-gradient(
            ellipse 100% 40% at 80% 5%,
            oklch(0.5 0.12 220 / 0.2) 0%,
            transparent 40%
          )`,
          animation: 'aurora 15s ease-in-out infinite alternate',
        }}
      />

      {/* Mountain silhouettes */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[60vh]"
        viewBox="0 0 1440 600"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* Far mountains - darker, more muted */}
        <path
          d="M0,600 L0,350 L120,280 L240,320 L360,250 L480,300 L600,200 L720,260 L840,180 L960,240 L1080,190 L1200,250 L1320,200 L1440,280 L1440,600 Z"
          fill="oklch(0.2 0.03 250)"
          opacity="0.8"
        />
        
        {/* Mid mountains */}
        <path
          d="M0,600 L0,420 L100,350 L200,400 L320,300 L440,380 L560,280 L680,350 L800,250 L920,330 L1040,270 L1160,340 L1280,290 L1400,360 L1440,320 L1440,600 Z"
          fill="oklch(0.25 0.035 250)"
          opacity="0.9"
        />
        
        {/* Near mountains with snow caps */}
        <path
          d="M0,600 L0,480 L80,420 L180,470 L280,380 L380,450 L500,340 L620,430 L720,360 L840,420 L960,330 L1100,400 L1200,350 L1320,420 L1440,380 L1440,600 Z"
          fill="oklch(0.3 0.04 250)"
        />
        
        {/* Snow caps on near mountains */}
        <path
          d="M280,380 L320,410 L340,395 L360,420 L380,390 L340,340 Z"
          fill="oklch(0.9 0.01 250)"
          opacity="0.9"
        />
        <path
          d="M500,340 L540,380 L560,360 L590,400 L620,370 L560,290 Z"
          fill="oklch(0.92 0.01 250)"
          opacity="0.85"
        />
        <path
          d="M960,330 L1000,380 L1030,355 L1060,390 L1100,350 L1020,280 Z"
          fill="oklch(0.88 0.01 250)"
          opacity="0.9"
        />
        <path
          d="M1200,350 L1240,400 L1270,375 L1300,410 L1320,380 L1250,300 Z"
          fill="oklch(0.9 0.01 250)"
          opacity="0.85"
        />
      </svg>

      {/* Fog/mist at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: `linear-gradient(
            180deg,
            transparent 0%,
            oklch(0.14 0.015 250 / 0.5) 50%,
            oklch(0.14 0.015 250) 100%
          )`
        }}
      />

      {/* Snowfall */}
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${flake.x}%`,
            top: '-10px',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `snowfall ${flake.duration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10px) translateX(0);
          }
          100% {
            transform: translateY(110vh) translateX(20px);
          }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes aurora {
          0% { 
            transform: translateX(-5%) scale(1);
            opacity: 0.15;
          }
          100% { 
            transform: translateX(5%) scale(1.1);
            opacity: 0.25;
          }
        }
      `}</style>
    </div>
  );
}

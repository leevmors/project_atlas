'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

// Pre-generated petal configurations (deterministic - no hydration mismatch)
const PETAL_CONFIGS = [
  { id: 0, left: 5, delay: 0, duration: 14, size: 18, opacity: 0.7, swayDuration: 4, blur: 1, rotateStart: 45 },
  { id: 1, left: 15, delay: 2, duration: 16, size: 14, opacity: 0.6, swayDuration: 3.5, blur: 0.8, rotateStart: 120 },
  { id: 2, left: 25, delay: 5, duration: 12, size: 22, opacity: 0.8, swayDuration: 5, blur: 1.2, rotateStart: 200 },
  { id: 3, left: 35, delay: 1, duration: 18, size: 16, opacity: 0.65, swayDuration: 4.5, blur: 0.6, rotateStart: 80 },
  { id: 4, left: 45, delay: 8, duration: 15, size: 20, opacity: 0.75, swayDuration: 3, blur: 1.5, rotateStart: 300 },
  { id: 5, left: 55, delay: 3, duration: 13, size: 15, opacity: 0.55, swayDuration: 5.5, blur: 0.9, rotateStart: 150 },
  { id: 6, left: 65, delay: 6, duration: 17, size: 24, opacity: 0.85, swayDuration: 4.2, blur: 1.1, rotateStart: 270 },
  { id: 7, left: 75, delay: 4, duration: 14, size: 13, opacity: 0.6, swayDuration: 3.8, blur: 0.7, rotateStart: 30 },
  { id: 8, left: 85, delay: 7, duration: 19, size: 19, opacity: 0.7, swayDuration: 4.8, blur: 1.3, rotateStart: 180 },
  { id: 9, left: 95, delay: 2.5, duration: 15, size: 17, opacity: 0.65, swayDuration: 3.2, blur: 1, rotateStart: 240 },
  { id: 10, left: 10, delay: 9, duration: 16, size: 21, opacity: 0.8, swayDuration: 5.2, blur: 0.5, rotateStart: 60 },
  { id: 11, left: 20, delay: 4.5, duration: 13, size: 14, opacity: 0.55, swayDuration: 4.6, blur: 1.4, rotateStart: 330 },
  { id: 12, left: 30, delay: 6.5, duration: 18, size: 23, opacity: 0.75, swayDuration: 3.6, blur: 0.8, rotateStart: 100 },
  { id: 13, left: 40, delay: 1.5, duration: 14, size: 16, opacity: 0.6, swayDuration: 4.4, blur: 1.2, rotateStart: 220 },
  { id: 14, left: 50, delay: 10, duration: 20, size: 18, opacity: 0.7, swayDuration: 5, blur: 0.6, rotateStart: 290 },
  { id: 15, left: 60, delay: 3.5, duration: 12, size: 15, opacity: 0.5, swayDuration: 3.4, blur: 1.1, rotateStart: 15 },
  { id: 16, left: 70, delay: 8.5, duration: 17, size: 25, opacity: 0.85, swayDuration: 4.7, blur: 0.9, rotateStart: 170 },
  { id: 17, left: 80, delay: 5.5, duration: 15, size: 12, opacity: 0.55, swayDuration: 5.3, blur: 1.5, rotateStart: 310 },
  { id: 18, left: 90, delay: 0.5, duration: 16, size: 20, opacity: 0.75, swayDuration: 3.9, blur: 0.7, rotateStart: 70 },
  { id: 19, left: 8, delay: 7.5, duration: 14, size: 17, opacity: 0.65, swayDuration: 4.1, blur: 1, rotateStart: 250 },
  { id: 20, left: 28, delay: 11, duration: 19, size: 22, opacity: 0.8, swayDuration: 5.1, blur: 1.3, rotateStart: 130 },
  { id: 21, left: 48, delay: 2.8, duration: 13, size: 14, opacity: 0.58, swayDuration: 3.7, blur: 0.85, rotateStart: 195 },
  { id: 22, left: 68, delay: 6.2, duration: 17, size: 19, opacity: 0.72, swayDuration: 4.3, blur: 1.15, rotateStart: 345 },
  { id: 23, left: 88, delay: 4.2, duration: 15, size: 16, opacity: 0.62, swayDuration: 5.4, blur: 0.75, rotateStart: 55 },
];

function SakuraPetals() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {PETAL_CONFIGS.map((petal) => (
        <div
          key={petal.id}
          className="absolute animate-fall"
          style={{
            left: `${petal.left}%`,
            animationDelay: `${petal.delay}s`,
            animationDuration: `${petal.duration}s`,
            filter: `blur(${petal.blur}px)`,
          }}
        >
          <svg
            width={petal.size}
            height={petal.size}
            viewBox="0 0 24 24"
            className="animate-sway drop-shadow-sm"
            style={{
              opacity: petal.opacity,
              animationDuration: `${petal.swayDuration}s`,
              transform: `rotate(${petal.rotateStart}deg)`,
            }}
          >
            <defs>
              <radialGradient id={`petalGrad${petal.id}`} cx="30%" cy="30%">
                <stop offset="0%" stopColor="#fff0f3" />
                <stop offset="50%" stopColor="#ffc0cb" />
                <stop offset="100%" stopColor="#f8a5b8" />
              </radialGradient>
            </defs>
            <path
              d="M12 2 C8 2 4 6 4 10 C4 14 8 18 12 22 C16 18 20 14 20 10 C20 6 16 2 12 2 Z"
              fill={`url(#petalGrad${petal.id})`}
            />
            <path
              d="M12 4 C9 4 6 7 6 10 C6 13 9 16 12 19 C15 16 18 13 18 10 C18 7 15 4 12 4 Z"
              fill="#ffb6c1"
              opacity="0.3"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

export function SakuraBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Falling Sakura Petals */}
      <SakuraPetals />

      {/* Background Image with Parallax + Blur */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src="/images/background.png"
          alt="Serene anime-style meadow with pink cosmos flowers under a blue sky"
          fill
          priority
          className="object-cover scale-110 blur-[2px]"
          style={{ transform: `scale(1.1) translateY(${scrollY * 0.2}px)` }}
        />
        {/* Darkened overlay for better content readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-slate-900/10 to-slate-900/30" />
      </div>
    </>
  );
}

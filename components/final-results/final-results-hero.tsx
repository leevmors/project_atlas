'use client';

import { useInView } from '@/hooks/use-in-view';

export function FinalResultsHero() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 });

  return (
    <header
      ref={ref}
      className="relative flex flex-col items-center justify-center px-2 pt-12 sm:pt-16 pb-7 sm:pb-9 text-center"
    >
      <div
        className={`max-w-3xl transition-all duration-700 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <p className="text-sky-700 text-xs font-semibold tracking-[0.32em] uppercase mb-4">
          Lingua HQ Competition
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-950 leading-tight mb-3">
          Project <span className="font-cursive italic text-sky-700">Atlas</span>
        </h1>
        <p className="text-slate-500 text-sm sm:text-base tracking-[0.16em] uppercase">
          Final Results
        </p>
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent mx-auto my-6" />
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          &ldquo;What you create is what you leave behind.&rdquo;
        </p>
      </div>
    </header>
  );
}

'use client';

import { useInView } from '@/hooks/use-in-view';

export function FinalResultsHero() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 });

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-center justify-center min-h-[55vh] px-6 text-center pt-20 pb-8"
    >
      <div
        className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <p className="text-white/30 text-xs tracking-[0.5em] uppercase mb-6">
          Lingua HQ Competition — Final Results
        </p>
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold text-white leading-tight mb-4">
          Project{' '}
          <span className="font-cursive italic text-white/80">Atlas</span>
        </h1>
        <p className="text-white/40 text-sm sm:text-base tracking-[0.2em] uppercase mb-10">
          The competition has ended
        </p>
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-10" />
        <p className="text-white/30 italic font-cursive text-lg">
          &ldquo;What you create is what you leave behind.&rdquo;
        </p>
      </div>

      <div
        aria-hidden
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/20 animate-bounce"
      >
        <div className="w-px h-8 bg-white/20" />
        <span className="text-xs tracking-widest uppercase">scroll</span>
      </div>
    </div>
  );
}

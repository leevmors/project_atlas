'use client';

import { useInView } from '@/hooks/use-in-view';

const PARAGRAPHS = [
  `when we started in february, i honestly didn't know how it was going to go. competitions sound clean on paper - scores, a winner, done. in practice it's a few weeks of people figuring out their own version of "good", which is messier and more interesting.`,
  `i opened your decks, your reels, your submissions every week. some made me laugh. a few made me stop and re-read. the leaderboard has its order - it had to - but for me the point was watching you care about something nobody forced you to care about. and you did.`,
  `to the team that won - the table was yours and you didn't let go. to second and third - half a step, that's all it ever is. to everyone else - i saw it. all of it.`,
  `i won't pretend i'm good at endings. so i'll just say thank you. for the work, for the company, for the small moments in between.`,
  `it's been a good road. go make the next one.`,
];

export function AsylbiMessage() {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.1 });

  return (
    <section ref={ref} className="mx-auto w-full max-w-3xl py-5 sm:py-7">
      <div className="rounded-md border border-sky-100 bg-white/85 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-[0_18px_70px_-50px_rgba(14,116,144,0.55)]">
        <p
          className={`text-sky-700 text-sm font-semibold tracking-[0.14em] uppercase mb-6 transition-all duration-700 ${
            inView ? 'opacity-100' : 'opacity-0'
          }`}
        >
          a note from mr. asylbi
        </p>

        <div className="space-y-4">
          {PARAGRAPHS.map((para, i) => (
            <p
              key={i}
              className={`text-slate-600 leading-relaxed text-sm md:text-base transition-all duration-700 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${140 + i * 120}ms` }}
            >
              {para}
            </p>
          ))}
        </div>

        <p
          className={`text-right text-slate-400 text-sm font-medium mt-8 transition-all duration-700 ${
            inView ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDelay: '760ms' }}
        >
          - mr. asylbi
        </p>
      </div>
    </section>
  );
}

'use client';

import { useInView } from '@/hooks/use-in-view';

const PARAGRAPHS = [
  `when we started in february, i honestly didn't know how it was going to go. competitions sound clean on paper — scores, a winner, done. in practice it's a few weeks of people figuring out their own version of "good", which is messier and more interesting.`,
  `i opened your decks, your reels, your submissions every week. some made me laugh. a few made me stop and re-read. the leaderboard has its order — it had to — but for me the point was watching you care about something nobody forced you to care about. and you did.`,
  `to the team that won — the table was yours and you didn't let go. to second and third — half a step, that's all it ever is. to everyone else — i saw it. all of it.`,
  `i won't pretend i'm good at endings. so i'll just say thank you. for the work, for the company, for the small moments in between.`,
  `it's been a good road. go make the next one.`,
];

export function AsylbiMessage() {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.1 });

  return (
    <section ref={ref} className="px-6 py-16 max-w-2xl mx-auto w-full">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-8 md:p-12">
        <p
          className={`font-cursive italic text-white/30 text-sm tracking-[0.2em] mb-8 transition-all duration-700 ${
            inView ? 'opacity-100' : 'opacity-0'
          }`}
        >
          a note from mr. asylbi
        </p>

        <div className="space-y-5">
          {PARAGRAPHS.map((para, i) => (
            <p
              key={i}
              className={`text-white/60 leading-relaxed text-base md:text-lg font-cursive italic transition-all duration-700 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${200 + i * 200}ms` }}
            >
              {para}
            </p>
          ))}
        </div>

        <p
          className={`text-right text-white/25 text-sm mt-10 font-cursive italic transition-all duration-700 ${
            inView ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDelay: '1400ms' }}
        >
          — mr. asylbi
        </p>
      </div>
    </section>
  );
}

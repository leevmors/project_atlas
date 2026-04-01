'use client';

import { AppShell } from '@/components/app-shell';
import { Users, ClipboardList, Share2, Scale, GraduationCap, Trophy } from 'lucide-react';

interface RuleSection {
  icon: React.ReactNode;
  title: string;
  rules: string[];
}

const RULE_SECTIONS: RuleSection[] = [
  {
    icon: <Users className="w-5 h-5 text-slate-600" />,
    title: 'Teams',
    rules: [
      'Teams are 3 or 4 people from the same group.',
      'Everyone gets a role — CEO, Lead Translator, Editor/QA, Content Manager.',
      'Teams of 3: the CEO also handles Content Manager duties.',
      'Your team score is everyone\'s score. You rise and fall together.',
    ],
  },
  {
    icon: <ClipboardList className="w-5 h-5 text-slate-600" />,
    title: 'Tasks & Deadlines',
    rules: [
      'Lingua HQ sends tasks to your team email. Check it regularly.',
      'Every task has a deadline. Hit it.',
      'Late submissions lose points depending on how late — a few hours is a small hit, a full day is a big one.',
      "If you ignore a task and don't submit anything, that's a zero across all four translation categories.",
    ],
  },
  {
    icon: <Share2 className="w-5 h-5 text-slate-600" />,
    title: 'Social Media',
    rules: [
      'Your company needs real Instagram and Threads accounts.',
      'Post at least 4 times a week. 5–6 is the target. More is better if quality holds.',
      'Posts must include English. You can add Kazakh or Russian, but never post in only Kazakh or only Russian without English.',
      'Buying followers or likes is allowed, but only if it looks organic and proportional. Obviously fake metrics will be penalized.',
      'You can delete the accounts after the project ends.',
    ],
  },
  {
    icon: <Scale className="w-5 h-5 text-slate-600" />,
    title: 'Accountability',
    rules: [
      "If someone on your team isn't pulling their weight, email Lingua HQ to request their removal.",
      'Removed members get a zero for the entire project.',
      'Teams can recruit a replacement from unassigned students, or continue with fewer people.',
    ],
  },
  {
    icon: <GraduationCap className="w-5 h-5 text-slate-600" />,
    title: 'Academic Honesty',
    rules: [
      'Copy-pasting raw, unedited machine translation gets you a zero on Accuracy and Tools & Transparency.',
      'Stolen social media content from other accounts gets you a zero on Content Quality.',
      'All work must be your own. Adapt, translate, create — but do it yourself.',
    ],
  },
];

function RulesContent() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-32 md:pt-40 pb-16">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg mb-4">
            Competition Rules
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Read these carefully. They apply to everyone, no exceptions.
          </p>
        </div>

        {/* Rule Sections */}
        {RULE_SECTIONS.map((section) => (
          <div
            key={section.title}
            className="bg-white/85 backdrop-blur-sm rounded-2xl border border-white/50 shadow-md p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                {section.icon}
              </div>
              <h2 className="text-xl font-bold text-slate-800">{section.title}</h2>
            </div>
            <ul className="space-y-3">
              {section.rules.map((rule, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600">
                  <span className="text-slate-400 mt-0.5 shrink-0">&#x2022;</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* The Reward */}
        <div className="bg-gradient-to-r from-amber-50/90 to-amber-100/90 backdrop-blur-sm rounded-2xl border border-amber-200/50 shadow-md p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">The Reward</h2>
          </div>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm text-slate-600">
              <span className="text-amber-500 mt-0.5 shrink-0">&#x2022;</span>
              <span>The <strong>top 4 teams</strong> across all groups are exempt from the final exam.</span>
            </li>
            <li className="flex gap-3 text-sm text-slate-600">
              <span className="text-amber-500 mt-0.5 shrink-0">&#x2022;</span>
              <span>Everyone else takes the exam. Your project score still counts toward your final course grade.</span>
            </li>
            <li className="flex gap-3 text-sm text-slate-600">
              <span className="text-amber-500 mt-0.5 shrink-0">&#x2022;</span>
              <span>Final standings are locked at the end of Week 15.</span>
            </li>
          </ul>
        </div>

        {/* Closing */}
        <div className="text-center py-4">
          <p className="text-white/70 font-medium italic drop-shadow-md">
            Build something real. Compete hard. Show what you can do.
          </p>
          <p className="text-white/50 text-sm mt-1">— Lingua HQ</p>
        </div>
      </div>
    </div>
  );
}

export default function RulesPage() {
  return (
    <AppShell>
      <RulesContent />
    </AppShell>
  );
}

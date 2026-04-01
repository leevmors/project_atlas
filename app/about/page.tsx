'use client';

import { AppShell } from '@/components/app-shell';
import { WelcomeRules } from '@/components/welcome-rules';
import { BookOpen, Calendar, Users, Trophy } from 'lucide-react';

const TIMELINE = [
  { week: 'Week 9', description: 'Setup — form teams, pick a company name, design logo, open Instagram & Threads, send team email to Lingua HQ' },
  { week: 'Weeks 10–13', description: 'Active sprints — translation tasks arrive via email, social media posting begins, leaderboard updates weekly' },
  { week: 'Week 14', description: 'Final presentations — 7–10 minutes per team, in front of your own group' },
  { week: 'Week 15', description: 'Final scoring — all scores tallied, leaderboard locked, top 4 teams announced' },
];

const ROLES = [
  {
    title: 'CEO / Project Manager',
    description: "Runs the show. Deadlines, delegation, communication with Lingua HQ, final submissions. If something falls through the cracks, it's on you.",
  },
  {
    title: 'Lead Translator',
    description: 'Core translation work. Owns the terminology, builds and maintains glossaries, makes sure nothing gets lost in translation.',
  },
  {
    title: 'Editor / QA Specialist',
    description: "Catches mistakes. Proofreading, quality checks, running QA. If something reads wrong, it's on you to fix before it ships.",
  },
  {
    title: 'Content Manager',
    description: 'Handles social media. Strategy, posting schedule, brand visuals, captions, analytics. Makes the brand look real and professional.',
  },
];

function AboutContent() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-32 md:pt-40 pb-16">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg mb-4">
            About <span className="font-cursive italic text-white/90">Project Atlas</span>
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Where Translation Meets Ambition — Lingua HQ
          </p>
        </div>

        {/* What is Project Atlas */}
        <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-white/50 shadow-md p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">What is Project Atlas?</h2>
          </div>
          <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
            <p>
              Project Atlas is a translation agency simulation. For seven weeks, you and your team are
              running a real translation company — not pretending to, actually doing it. You'll build a brand,
              open social media accounts, receive translation tasks, deliver work, and compete against every
              other team across all groups on a single leaderboard.
            </p>
            <p>
              Lingua HQ is the agency headquarters — your director. Think of it as a client who sends you work.
              Starting Week 10, tasks arrive in your team inbox. These are real translation tasks — documents,
              marketing materials, subtitles, tourism texts, academic content, all kinds of things. Some will
              require SmartCAT, some won't. Every task has a deadline. You translate, you submit, you get scored.
            </p>
            <p>
              At the same time, you're posting content on social media. Behind-the-scenes, translation tips,
              portfolio showcases, team introductions, industry facts, memes — whatever builds your brand and
              grows your audience. You need at least 4 posts a week, ideally 5 or 6. Posts must include English.
              You can add Kazakh or Russian, but you can never post in only Kazakh or only Russian without English.
            </p>
            <p>
              This goes on for four weeks — Weeks 10 through 13. Every week, the leaderboard updates.
              You can see where you stand against every other team. Week 14 is presentation week.
              Week 15 is when all scores are tallied and the final leaderboard is locked.
            </p>
          </div>
        </div>

        {/* How It's Structured */}
        <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-white/50 shadow-md p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">How It's Structured</h2>
          </div>
          <div className="space-y-3">
            {TIMELINE.map((item) => (
              <div key={item.week} className="flex gap-4 p-3 rounded-xl bg-slate-50/80">
                <span className="font-bold text-slate-700 text-sm whitespace-nowrap min-w-[100px]">
                  {item.week}
                </span>
                <span className="text-slate-600 text-sm">{item.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Roles */}
        <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-white/50 shadow-md p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Team Roles</h2>
          </div>
          <p className="text-slate-500 text-sm mb-4">Every team member needs a role. No passengers.</p>
          <div className="space-y-3">
            {ROLES.map((role) => (
              <div key={role.title} className="p-4 rounded-xl bg-slate-50/80">
                <h3 className="font-bold text-slate-700 text-sm mb-1">{role.title}</h3>
                <p className="text-slate-500 text-sm">{role.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-sm text-slate-600">
            <strong>Teams of 3:</strong> The CEO also takes on the Content Manager role.
          </div>
        </div>

        {/* Scoring Overview */}
        <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-white/50 shadow-md p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Scoring Criteria</h2>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            You're scored on 11 categories, each rated 0 to 10. Scores accumulate on the leaderboard.
          </p>
          <WelcomeRules />
        </div>

        {/* The Reward */}
        <div className="bg-gradient-to-r from-amber-50/90 to-amber-100/90 backdrop-blur-sm rounded-2xl border border-amber-200/50 shadow-md p-6 sm:p-8 text-center">
          <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-3">The Reward</h2>
          <p className="text-slate-600 text-sm max-w-lg mx-auto mb-2">
            The <strong>top 4 teams</strong> across all groups are exempt from the final exam.
          </p>
          <p className="text-slate-500 text-sm max-w-lg mx-auto">
            Everyone else takes the exam. Your project score still counts toward your final course grade.
            Final standings are locked at the end of Week 15.
          </p>
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

export default function AboutPage() {
  return (
    <AppShell>
      <AboutContent />
    </AppShell>
  );
}

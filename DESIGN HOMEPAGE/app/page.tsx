"use client"

import Image from "next/image"
import { User, Trophy, Instagram, AtSign, ClipboardList, Share2, Award, Users, Mail, Search, Filter, Calendar, Crown } from "lucide-react"
import { useEffect, useState } from "react"

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
]

// Sakura Petal Component
function SakuraPetals() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

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
  )
}

const leaderboardData = [
  { 
    rank: 1, 
    company: "4lex",
    group: "301-3",
    instagram: "4lex_301_3",
    threads: "4lex_threads",
    email: "aisha.a06@mail.ru",
    students: ["Aisha", "Inkar", "Nuraina", "Karina"],
    total: 89,
    tasks: 42,
    social: 35,
    presentation: 12
  },
  { 
    rank: 2, 
    company: "TechVentures",
    group: "301-1",
    instagram: "techventures",
    threads: "techventures_inc",
    email: "tech@ventures.com",
    students: ["Alex", "Maria", "John"],
    total: 76,
    tasks: 28,
    social: 38,
    presentation: 10
  },
  { 
    rank: 3, 
    company: "Innovate Labs",
    group: "301-2",
    instagram: "innovatelabs",
    threads: "innovate_labs",
    email: "hello@innovate.io",
    students: ["Sarah", "Mike", "Emma", "David"],
    total: 68,
    tasks: 32,
    social: 30,
    presentation: 6
  },
  { 
    rank: 4, 
    company: "Creative Studio",
    group: "301-1",
    instagram: "creativestudio",
    threads: "creative.studio",
    email: "info@creative.co",
    students: ["Lisa", "Tom"],
    total: 47,
    tasks: 20,
    social: 27,
    presentation: 0
  },
  { 
    rank: 5, 
    company: "Digital Forge",
    group: "301-2",
    instagram: "digitalforge",
    threads: "digital_forge",
    email: "contact@dforge.net",
    students: ["Nina", "Chris", "Anna"],
    total: 41,
    tasks: 15,
    social: 22,
    presentation: 4
  },
]

export default function Home() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      {/* Cinematic Noise Texture */}
      <div className="noise-overlay" />

      {/* Falling Sakura Petals */}
      <SakuraPetals />

      {/* Background Image with Blur */}
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

      {/* Top Navigation Bar (fixed) */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-10 px-8 py-4 rounded-full backdrop-blur-2xl bg-white/25 border border-white/40 shadow-xl">
          {/* Logo */}
          <Image
            src="/images/logo.png"
            alt="Project Atlas Logo"
            width={42}
            height={42}
            loading="eager"
          />
          
          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <a href="#" className="px-4 py-2 rounded-full text-base text-white/70 hover:text-white hover:bg-white/10 transition-all font-medium">
              About
            </a>
            <a href="#" className="px-4 py-2 rounded-full text-base text-white font-semibold bg-white/20 backdrop-blur-sm">
              Leaderboard
            </a>
            <a href="#" className="px-4 py-2 rounded-full text-base text-white/70 hover:text-white hover:bg-white/10 transition-all font-medium">
              Rules
            </a>
            <a href="#" className="px-4 py-2 rounded-full text-base text-white/70 hover:text-white hover:bg-white/10 transition-all font-medium">
              Games
            </a>
          </div>

          {/* Profile Button */}
          <button 
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/25 border border-white/30 text-white hover:bg-white/35 transition-all duration-200"
            aria-label="Profile"
          >
            <User className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col px-6 lg:px-12 pt-40 pb-16">
        {/* Hero Section - Project Atlas Title */}
        <div className="flex flex-col items-center mb-32">
          <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-wide text-center">
            <span className="font-bold text-white drop-shadow-lg">Project</span>
            {" "}
            <span className="font-[family-name:var(--font-cursive)] italic text-white/90 drop-shadow-lg">Atlas</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-white/50 font-light text-center max-w-lg leading-relaxed tracking-wide">
            What you create is what you leave behind.
          </p>
        </div>

        {/* Leaderboard Section */}
        <div className="w-full max-w-[1400px] mx-auto">
          {/* Section Header with Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
              Leaderboards
            </h2>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search teams..."
                  className="pl-9 pr-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 text-sm text-slate-700 placeholder:text-slate-400 w-44 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              {/* Time Filter */}
              <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-white/50">
                <Calendar className="w-4 h-4 text-slate-500" />
                <select className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none cursor-pointer">
                  <option>All Time</option>
                  <option>This Month</option>
                  <option>This Week</option>
                  <option>Today</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-white/50">
                <Filter className="w-4 h-4 text-slate-500" />
                <select className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none cursor-pointer">
                  <option>Points</option>
                  <option>Tasks</option>
                  <option>Social</option>
                  <option>Present</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards Grid - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
            {leaderboardData.map((entry) => (
              <div
                key={entry.rank}
                className="bg-white/85 backdrop-blur-sm rounded-2xl overflow-visible shadow-md flex flex-col relative"
              >
                {/* Rank Stamp - Top Center, Clipping */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full shadow-lg z-10 ${
                  entry.rank === 1 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                  entry.rank === 2 ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
                  entry.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                  'bg-gradient-to-r from-sky-400 to-sky-500'
                }`}>
                  <Crown className="w-4 h-4 text-white" strokeWidth={2.5} />
                  <span className="text-white font-bold text-sm">
                    {entry.rank === 1 ? '1st' : entry.rank === 2 ? '2nd' : entry.rank === 3 ? '3rd' : `${entry.rank}th`}
                  </span>
                </div>

                {/* Main Card Content */}
                <div className="px-5 pt-5 pb-4 flex-1">
                  {/* Company Logo Placeholder + Info */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Company Logo */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Trophy className="w-7 h-7 text-slate-400" strokeWidth={1.5} />
                    </div>

                    {/* Company Name + Group */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-slate-800 font-bold text-lg truncate">{entry.company}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium flex-shrink-0">
                          {entry.group}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <span>{entry.students.length} members</span>
                      </div>
                    </div>

                    {/* Score Badge */}
                    <div className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl ${
                      entry.rank === 1 ? 'bg-amber-50' :
                      entry.rank === 2 ? 'bg-slate-50' :
                      entry.rank === 3 ? 'bg-orange-50' :
                      'bg-sky-50'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        entry.rank === 1 ? 'text-amber-600' :
                        entry.rank === 2 ? 'text-slate-600' :
                        entry.rank === 3 ? 'text-orange-600' :
                        'text-sky-600'
                      }`}>{entry.total}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Points</div>
                    </div>
                  </div>

                  {/* Identity Info */}
                  <div className="space-y-2 text-sm">
                    {/* Students */}
                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{entry.students.join(", ")}</span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <a 
                        href={`mailto:${entry.email}`}
                        className="truncate hover:text-blue-500 transition-colors"
                      >
                        {entry.email}
                      </a>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-3 text-slate-500">
                      <a 
                        href={`https://instagram.com/${entry.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-pink-500 transition-colors"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span className="text-xs">@{entry.instagram}</span>
                      </a>
                      <a 
                        href={`https://threads.net/@${entry.threads}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                      >
                        <AtSign className="w-3.5 h-3.5" />
                        <span className="text-xs">Threads</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="bg-slate-50/80 border-t border-slate-100">
                  <div className="grid grid-cols-3 divide-x divide-slate-100">
                    <div className="flex flex-col items-center py-3">
                      <div className="flex items-center gap-1 text-slate-500 text-[10px] uppercase tracking-wider mb-0.5 font-semibold">
                        <ClipboardList className="w-3.5 h-3.5" />
                        Tasks
                      </div>
                      <div className="text-xl font-bold text-slate-700">{entry.tasks}</div>
                    </div>
                    <div className="flex flex-col items-center py-3">
                      <div className="flex items-center gap-1 text-slate-500 text-[10px] uppercase tracking-wider mb-0.5 font-semibold">
                        <Share2 className="w-3.5 h-3.5" />
                        Social
                      </div>
                      <div className="text-xl font-bold text-slate-700">{entry.social}</div>
                    </div>
                    <div className="flex flex-col items-center py-3">
                      <div className="flex items-center gap-1 text-slate-500 text-[10px] uppercase tracking-wider mb-0.5 font-semibold">
                        <Award className="w-3.5 h-3.5" />
                        Present
                      </div>
                      <div className="text-xl font-bold text-slate-700">{entry.presentation}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

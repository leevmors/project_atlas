export interface ScoreRange {
  readonly range: string;
  readonly label: string;
  readonly description: string;
}

export interface Criterion {
  readonly number: number;
  readonly name: string;
  readonly frequency: string;
  readonly ranges: readonly ScoreRange[];
}

export interface GradingPart {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly criteria: readonly Criterion[];
}

export const GRADING_PARTS: readonly GradingPart[] = [
  {
    id: 'part-a',
    label: 'Part A',
    title: 'Translation Tasks',
    description: 'Scored per task — every time you submit a translation to Lingua HQ.',
    criteria: [
      {
        number: 1,
        name: 'Accuracy',
        frequency: 'per task',
        ranges: [
          { range: '9–10', label: 'Exceptional', description: 'Near-perfect to zero errors, perfect terminology, nothing omitted, publication-ready.' },
          { range: '7–8', label: 'Strong', description: 'Meaning fully preserved, only 1–2 small errors, good terminology, nothing missing.' },
          { range: '5–6', label: 'Satisfactory', description: 'Generally correct but some grammar mistakes, a few wrong word choices, minor omissions.' },
          { range: '3–4', label: 'Below Average', description: 'Multiple errors that change meaning in places, noticeable omissions, inconsistent terminology.' },
          { range: '0–2', label: 'Poor', description: 'Not submitted, or major meaning errors throughout, sentences mistranslated or missing.' },
        ],
      },
      {
        number: 2,
        name: 'Quality',
        frequency: 'per task',
        ranges: [
          { range: '9–10', label: 'Exceptional', description: 'Reads like a native speaker wrote it, publication-ready, couldn\'t tell it was translated.' },
          { range: '7–8', label: 'Strong', description: 'Flows naturally, appropriate register, reads well in target language, only minor stiffness.' },
          { range: '5–6', label: 'Satisfactory', description: 'Readable but stiff in places, some unnatural constructions, register mostly right.' },
          { range: '3–4', label: 'Below Average', description: 'Awkward phrasing throughout, clearly a translation, inconsistent tone.' },
          { range: '0–2', label: 'Poor', description: 'Not submitted, or reads like raw machine translation, completely unnatural, wrong register.' },
        ],
      },
      {
        number: 3,
        name: 'Speed / Deadline',
        frequency: 'per task',
        ranges: [
          { range: '9–10', label: 'Exceptional', description: 'Same-day turnaround, 3–12+ hours before deadline.' },
          { range: '7–8', label: 'Strong', description: 'On time to 3 hours early.' },
          { range: '5–6', label: 'Satisfactory', description: '1–6 hours late.' },
          { range: '3–4', label: 'Below Average', description: '6–24 hours late.' },
          { range: '0–2', label: 'Poor', description: 'Ignored, never submitted, or more than 24 hours late.' },
        ],
      },
      {
        number: 4,
        name: 'Tools & Transparency',
        frequency: 'per task',
        ranges: [
          { range: '9–10', label: 'Expert', description: 'Full workflow documented — which tool, why, TM consistency shown, glossary exported, QA log clean. Could be a case study.' },
          { range: '7–8', label: 'Strong', description: 'Every tool clearly stated with how it was used. TM applied, glossary created, AI output genuinely post-edited.' },
          { range: '5–6', label: 'Satisfactory', description: 'Listed tools used (SmartCAT, DeepL, ChatGPT, etc.) but basic usage — no TM, no glossary, minimal post-editing.' },
          { range: '3–4', label: 'Below Average', description: 'Mentioned a tool but didn\'t explain how, output still looks unedited.' },
          { range: '0–2', label: 'Poor', description: 'No tools mentioned, no workflow explanation, or clearly raw copy-paste from Google Translate / DeepL with zero editing.' },
        ],
      },
    ],
  },
  {
    id: 'part-b',
    label: 'Part B',
    title: 'Social Media',
    description: 'Scored once per week — based on that week\'s activity and growth. Likes, Views, and Comments scored by whichever is higher: average per post or total that week.',
    criteria: [
      {
        number: 5,
        name: 'Content Quality',
        frequency: 'weekly',
        ranges: [
          { range: '9–10', label: 'Outstanding', description: 'Professional-level to exceptional — innovative ideas, exceptional visuals, strong storytelling, every post has purpose.' },
          { range: '7–8', label: 'Strong', description: 'Well-designed, consistent branding, strong captions, good mix of content types, clear visual identity.' },
          { range: '5–6', label: 'Satisfactory', description: 'Decent and on-brand but generic, nothing memorable, average visuals.' },
          { range: '3–4', label: 'Below Average', description: 'Some effort but messy — bad image quality, weak captions, inconsistent look.' },
          { range: '0–2', label: 'Poor', description: 'No posts this week, or random/irrelevant posts with no brand consistency.' },
        ],
      },
      {
        number: 6,
        name: 'Posting Frequency',
        frequency: 'weekly',
        ranges: [
          { range: '9–10', label: 'Outstanding', description: '8–10+ posts across platforms, all high quality, consistent daily presence.' },
          { range: '7–8', label: 'Strong', description: '5–7 posts (target met to daily).' },
          { range: '4–6', label: 'Satisfactory', description: '2–4 posts (minimum met).' },
          { range: '2–3', label: 'Below Average', description: '2–3 posts.' },
          { range: '0–1', label: 'Poor', description: 'Zero to 1 post.' },
        ],
      },
      {
        number: 7,
        name: 'Likes',
        frequency: 'weekly',
        ranges: [
          { range: '9–10', label: 'Outstanding', description: '60–100+ average with genuine engagement, strong like-to-comment ratio, clearly organic.' },
          { range: '7–8', label: 'Strong', description: '31–60 average, looks organic and proportional to comments/views.' },
          { range: '5–6', label: 'Satisfactory', description: '16–30 average.' },
          { range: '3–4', label: 'Below Average', description: '6–15 average.' },
          { range: '0–2', label: 'Poor', description: '0–5 per post average.' },
        ],
      },
      {
        number: 8,
        name: 'Views',
        frequency: 'weekly',
        ranges: [
          { range: '9–10', label: 'Outstanding', description: '1,000–3,000+ views, viral-level reach for a student account.' },
          { range: '7–8', label: 'Strong', description: '400–1,000 average.' },
          { range: '5–6', label: 'Satisfactory', description: '150–400 average.' },
          { range: '3–4', label: 'Below Average', description: '50–150 average.' },
          { range: '0–2', label: 'Poor', description: '0–50 average views.' },
        ],
      },
      {
        number: 9,
        name: 'Followers',
        frequency: 'weekly',
        ranges: [
          { range: '9–10', label: 'Outstanding', description: '150–300+ real followers with active engagement — a real audience is forming.' },
          { range: '7–8', label: 'Strong', description: '71–150 with real engagement (not ghost followers).' },
          { range: '5–6', label: 'Satisfactory', description: '31–70 followers.' },
          { range: '3–4', label: 'Below Average', description: '11–30 followers.' },
          { range: '0–2', label: 'Poor', description: '0–10 followers.' },
        ],
      },
      {
        number: 10,
        name: 'Comments',
        frequency: 'weekly',
        ranges: [
          { range: '9–10', label: 'Outstanding', description: '25–40+ meaningful comments, genuine discussions, followers asking questions — the account feels alive.' },
          { range: '7–8', label: 'Strong', description: '15–25 comments, real back-and-forth, team is replying to commenters.' },
          { range: '5–6', label: 'Satisfactory', description: '8–15 comments, some genuine conversations.' },
          { range: '3–4', label: 'Below Average', description: '4–8 comments, mix of generic and real.' },
          { range: '0–2', label: 'Poor', description: '0–3 comments, mostly generic ("nice!" "cool!").' },
        ],
      },
    ],
  },
  {
    id: 'part-c',
    label: 'Part C',
    title: 'Presentation',
    description: 'Scored once — Week 14. One final presentation covering your entire journey.',
    criteria: [
      {
        number: 11,
        name: 'Presentation',
        frequency: 'one-time (Week 14)',
        ranges: [
          { range: '9–10', label: 'Exceptional', description: 'Strong narrative to exceptional — felt like a real agency pitch. Compelling story, sharp analytics, honest reflection, professional delivery.' },
          { range: '7–8', label: 'Strong', description: 'Well-structured, covers all six components (company story, portfolio, social analytics, tools demo, challenges, team reflection), confident delivery.' },
          { range: '5–6', label: 'Satisfactory', description: 'Covers the basics (company story, some portfolio, some numbers) but flat delivery, nothing memorable.' },
          { range: '3–4', label: 'Below Average', description: 'Disorganized, missing key sections, poor delivery, read off the screen.' },
          { range: '0–2', label: 'Poor', description: 'Didn\'t show up, or clearly unprepared with no/terrible slides, couldn\'t explain what they did.' },
        ],
      },
    ],
  },
] as const;

export const ENGAGEMENT_INTEGRITY_RULE = {
  title: 'Engagement Integrity Rule',
  description:
    'Across categories 7–10 (Likes, Views, Followers, Comments), metrics must look proportional and organic. If the numbers are clearly disproportionate (e.g., 500 likes but 0 comments and 10 views), the director reserves the right to reduce scores across all engagement categories for that week.',
} as const;

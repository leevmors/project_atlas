// Riddle rules, anomaly catalog, stage templates, and the builder that
// assembles a run's 18 stages from shuffled riddle pools.
//
// Rules are pure: `rule(anomaly, phoneCtx, ruleCtx) -> boolean`. Returning
// true means the correct action is RED; false means SKIP.

import { TOTAL_STAGES, CHANNELS } from "./constants.js";

function pad(value) {
  return String(value).padStart(2, "0");
}

// First 5 of 14 anomalies per channel. Each entry is { kind, description }.
// kinds prefixed with the channel index to keep the switch/case logic readable.
export const ANOMALY_CATALOG = [
  // 0 - Three Clocks
  [
    { kind: "reverse", description: "one clock runs backward" },
    { kind: "frozen", description: "one clock frozen" },
    { kind: "fast", description: "one clock spinning too fast" },
    { kind: "missing-hand", description: "one clock missing minute hand" },
    { kind: "label-wrong", description: "timezone label wrong" },
    { kind: "2x-speed", description: "one clock runs at 2x speed" },
    { kind: "hand-thickness", description: "hour and minute hand thickness swapped" },
    { kind: "jumpy-tick", description: "one clock ticks in jumps not smooth" },
    { kind: "off-one-hour", description: "timezone offset wrong by one hour" },
    { kind: "reverse-second", description: "second hand moves correct speed but wrong direction" },
    { kind: "header-clockss", description: 'header reads "THREE CLOCKSS" extra S' },
    { kind: "stage-stege", description: '"STAGE" becomes "STEGE"' },
    { kind: "live-lowercase-l", description: '"LIVE" becomes "LlVE"' },
    { kind: "oval-face", description: "one clock face slightly oval not circle" },
    { kind: "label-typo", description: '"UTC+9" becomes "UTC+4"' }
  ],
  // 1 - Money Counter
  [
    { kind: "wrong-total", description: "total number doesnt match bill count" },
    { kind: "upside-down", description: "one bill upside down" },
    { kind: "different-denom", description: "one bill is different denomination" },
    { kind: "extra", description: "extra bill appears" },
    { kind: "missing-same-total", description: "one bill missing but total unchanged" },
    { kind: "off-one-dollar", description: "total is off by exactly one dollar" },
    { kind: "bill-smaller", description: "one bill very slightly smaller than others" },
    { kind: "no-serial", description: "one bill has no serial number corners" },
    { kind: "bill-rotated", description: "one bill rotated slightly more than others" },
    { kind: "total-late", description: "total updates one bill late" },
    { kind: "total-lowercase-l", description: '"TOTAL $13" becomes "TOTAL $l3"' },
    { kind: "header-cunter", description: '"MONEY COUNTER" becomes "MONEY CUNTER"' },
    { kind: "ch-dot", description: '"CH 2" becomes "CH 2."' },
    { kind: "small-bill-circle", description: "one bill circle slightly smaller" },
    { kind: "trace-lowercase-l", description: '"TRACE ACTIVE" becomes "TRACE ACTlVE"' }
  ],
  // 2 - Radar
  [
    { kind: "sweep-stop", description: "sweep line stops spinning" },
    { kind: "ghost", description: "blip that never fades" },
    { kind: "reverse", description: "sweep goes opposite direction" },
    { kind: "double-sweep", description: "two sweep lines instead of one" },
    { kind: "shape-blips", description: "blips form a perfect shape" },
    { kind: "short-sweep", description: "sweep line slightly shorter than normal" },
    { kind: "slow-fade", description: "blips fade slower than they should" },
    { kind: "fast-sweep", description: "sweep speed slightly faster than normal" },
    { kind: "blip-behind", description: "one blip appears behind the center circle" },
    { kind: "off-center", description: "crosshair lines slightly off center" },
    { kind: "header-rarar", description: '"RADAR" becomes "RARAR"' },
    { kind: "ch-wrong-num", description: '"CH 3" becomes "CH 8"' },
    { kind: "stage-lowercase-l", description: '"STAGE 01" becomes "STAGE 0l"' },
    { kind: "thick-ring", description: "one radar ring slightly thicker than others" },
    { kind: "live-missing", description: '"LIVE" missing entirely' }
  ],
  // 3 - Equation Feed
  [
    { kind: "wrong", description: "one equation obviously wrong" },
    { kind: "divzero", description: "division by zero" },
    { kind: "double-equals", description: "equation has two equals signs" },
    { kind: "missing-op", description: "operator missing" },
    { kind: "sign-flip", description: "negative shown as positive" },
    { kind: "off-one", description: "one equation off by exactly one" },
    { kind: "fast-line", description: "scroll speed slightly faster for one line" },
    { kind: "extra-space", description: "one equation has extra space between numbers" },
    { kind: "font-weight", description: "one number slightly different font weight" },
    { kind: "repeat-twice", description: "one equation repeats twice in feed" },
    { kind: "header-fed", description: '"EQUATION FEED" becomes "EQUATION FED"' },
    { kind: "ch-dot", description: '"CH 4" becomes "CH 4."' },
    { kind: "trace-no-space", description: '"TRACE ACTIVE" becomes "TRACEACTIVE"' },
    { kind: "long-equals", description: "one equals sign slightly longer" },
    { kind: "live-lowercase-l", description: '"LIVE" becomes "LlVE"' }
  ],
  // 4 - Typewriter
  [
    { kind: "bad-word", description: "random word that doesnt belong" },
    { kind: "reverse-type", description: "typing goes backwards" },
    { kind: "repeat-line", description: "same line repeats" },
    { kind: "rev-time", description: "timestamp goes backwards" },
    { kind: "wrong-continue", description: "mid word stops then wrong word continues" },
    { kind: "time-out-of-order", description: "one timestamp out of order by one minute" },
    { kind: "typo", description: "one word spelled wrong subtle typo" },
    { kind: "cursor-stops", description: "cursor stops blinking for a few seconds" },
    { kind: "extra-space-start", description: "one line has extra space at start" },
    { kind: "wrong-format", description: "one log entry has wrong time format" },
    { kind: "facility-typo", description: '"FACILITY" becomes "FAClLITY"' },
    { kind: "header-typewrlter", description: '"TYPEWRITER" becomes "TYPEWRLTER"' },
    { kind: "trace-lowercase-l", description: '"TRACE ACTIVE" becomes "TRACE ACTlVE"' },
    { kind: "timestamp-typo", description: 'one timestamp reads "03:1l" instead of "03:11"' },
    { kind: "maintenance-typo", description: '"MAINTENANCE" becomes "MAINTENACE"' }
  ],
  // 5 - Countdown
  [
    { kind: "count-up", description: "counts up instead of down" },
    { kind: "skip", description: "skips a number" },
    { kind: "freeze", description: "freezes completely" },
    { kind: "digit-swap", description: "two digits swap positions" },
    { kind: "loses-2s", description: "loses exactly 2 seconds every minute" },
    { kind: "digit-flicker", description: "one digit flickers for a frame" },
    { kind: "colon-stops", description: "colon between digits stops blinking" },
    { kind: "fast-seconds", description: "seconds run slightly too fast" },
    { kind: "digit-camouflage", description: "one digit same color as background briefly" },
    { kind: "header-dwon", description: '"COUNTDOWN" becomes "COUNTDWON"' },
    { kind: "ch-letter", description: '"CH 6" becomes "CH b"' },
    { kind: "stage-capital-o", description: '"STAGE 01" becomes "STAGE Ol"' },
    { kind: "missing-corner", description: "box border has one corner missing" },
    { kind: "live-one", description: '"LIVE" becomes "L1VE"' }
  ],
  // 6 - Alphabet
  [
    { kind: "missing", description: "one letter missing" },
    { kind: "letter-number", description: "one letter replaced with number" },
    { kind: "swap", description: "two letters swapped" },
    { kind: "upside-letter", description: "one letter upside down" },
    { kind: "extra-symbol", description: "extra character that isnt a letter" },
    { kind: "letter-larger", description: "one letter very slightly larger than rest" },
    { kind: "letter-thinner", description: "one letter wrong font weight thinner" },
    { kind: "letter-low", description: "one letter slightly lower than its row" },
    { kind: "letter-close", description: "two adjacent letters slightly closer together" },
    { kind: "letter-dimmer", description: "one letter slightly dimmer than rest" },
    { kind: "header-alphab3t", description: '"ALPHABET" becomes "ALPHAB3T"' },
    { kind: "ch-dot", description: '"CH 7" becomes "CH 7."' },
    { kind: "stage-3", description: '"STAGE 01" becomes "STAG3 01"' },
    { kind: "trace-3", description: '"TRACE ACTIVE" becomes "TRACE ACTIV3"' },
    { kind: "letter-thick-border", description: "one letter box slightly thicker border" }
  ]
];

// Maps anomaly kinds to descriptive tags. Rules query via hasTag().
export const ANOMALY_TAGS = {
  // Three Clocks
  "reverse": ["direction", "backward", "moving"],
  "frozen": ["frozen"],
  "fast": ["speed", "moving"],
  "missing-hand": ["missing", "visual"],
  "label-wrong": ["label", "text"],
  "2x-speed": ["speed", "moving", "subtle"],
  "hand-thickness": ["visual", "subtle"],
  "jumpy-tick": ["speed", "visual", "subtle", "moving"],
  "off-one-hour": ["label", "number", "time", "subtle"],
  "reverse-second": ["direction", "backward", "subtle", "moving"],
  "header-clockss": ["header", "text", "extra"],
  "stage-stege": ["text", "footer"],
  "live-lowercase-l": ["text", "footer"],
  "oval-face": ["shape", "visual", "subtle", "symmetric"],
  "label-typo": ["label", "text", "number"],
  "extra": ["extra", "visual"],
  // Money Counter
  "wrong-total": ["number", "count"],
  "upside-down": ["visual"],
  "different-denom": ["number"],
  "missing-same-total": ["missing", "count"],
  "off-one-dollar": ["number", "count", "subtle"],
  "bill-smaller": ["visual", "subtle"],
  "no-serial": ["missing", "subtle"],
  "bill-rotated": ["visual", "subtle"],
  "total-late": ["number", "time", "subtle"],
  "total-lowercase-l": ["text", "number"],
  "header-cunter": ["header", "text", "missing"],
  "ch-dot": ["text", "footer", "extra"],
  "small-bill-circle": ["visual", "subtle"],
  "trace-lowercase-l": ["text", "footer"],
  "impossible": ["number", "count"],
  "spin": ["moving", "spinning", "visual"],
  // Radar
  "sweep-stop": ["frozen"],
  "ghost": ["extra", "visual"],
  "double-sweep": ["extra", "visual"],
  "shape-blips": ["shape", "symmetric"],
  "short-sweep": ["visual", "subtle"],
  "slow-fade": ["visual", "speed", "subtle"],
  "fast-sweep": ["speed", "moving", "spinning"],
  "blip-behind": ["visual", "position", "center"],
  "off-center": ["visual", "position", "subtle", "line"],
  "header-rarar": ["header", "text"],
  "ch-wrong-num": ["number", "text", "footer"],
  "stage-lowercase-l": ["text", "footer"],
  "thick-ring": ["visual", "border", "line"],
  "live-missing": ["missing", "text", "footer"],
  // Equation
  "wrong": ["number"],
  "divzero": ["number"],
  "double-equals": ["text", "extra"],
  "missing-op": ["missing", "text"],
  "sign-flip": ["number"],
  "off-one": ["number", "subtle"],
  "fast-line": ["speed", "subtle", "moving"],
  "extra-space": ["text", "subtle", "extra"],
  "font-weight": ["visual", "subtle"],
  "repeat-twice": ["repeating", "text"],
  "header-fed": ["header", "text", "missing"],
  "trace-no-space": ["text", "missing", "footer"],
  "long-equals": ["visual", "subtle", "line"],
  "duplicate": ["repeating", "letter"],
  // Typewriter
  "bad-word": ["text"],
  "reverse-type": ["direction", "backward", "text"],
  "repeat-line": ["repeating", "text"],
  "rev-time": ["number", "backward", "time"],
  "wrong-continue": ["text"],
  "time-out-of-order": ["time", "number"],
  "typo": ["text", "subtle", "letter"],
  "cursor-stops": ["frozen", "subtle"],
  "extra-space-start": ["text", "subtle", "extra"],
  "wrong-format": ["text", "time"],
  "facility-typo": ["text", "label", "header"],
  "header-typewrlter": ["header", "text"],
  "timestamp-typo": ["time", "number", "text"],
  "maintenance-typo": ["text", "missing", "label"],
  "redaction": ["visual", "text"],
  "alert": ["text"],
  // Countdown
  "count-up": ["direction", "backward", "time"],
  "skip": ["number", "missing", "time"],
  "freeze": ["frozen", "time"],
  "digit-swap": ["number", "position"],
  "loses-2s": ["time", "number", "subtle"],
  "digit-flicker": ["visual", "subtle"],
  "colon-stops": ["visual", "subtle", "frozen"],
  "fast-seconds": ["speed", "time"],
  "digit-camouflage": ["visual", "subtle", "color"],
  "header-dwon": ["header", "text"],
  "ch-letter": ["text", "letter", "footer"],
  "stage-capital-o": ["text", "letter", "footer"],
  "missing-corner": ["missing", "border"],
  "live-one": ["text", "number", "footer"],
  // Alphabet
  "missing": ["missing", "letter"],
  "letter-number": ["letter", "number"],
  "swap": ["letter", "position"],
  "upside-letter": ["letter", "visual"],
  "extra-symbol": ["extra", "letter"],
  "letter-larger": ["visual", "letter", "subtle"],
  "letter-thinner": ["visual", "letter", "subtle"],
  "letter-low": ["letter", "position", "subtle"],
  "letter-close": ["letter", "position", "subtle"],
  "letter-dimmer": ["visual", "letter", "subtle", "color"],
  "header-alphab3t": ["header", "text", "letter"],
  "stage-3": ["text", "footer", "letter"],
  "trace-3": ["text", "footer", "letter"],
  "letter-thick-border": ["visual", "subtle", "border"]
};

export function hasTag(anomaly, tag) {
  if (!anomaly) return false;
  const tags = ANOMALY_TAGS[anomaly.kind] || [];
  return tags.includes(tag);
}

export function isVowel(ch) {
  return !!ch && "AEIOUaeiou".includes(ch);
}

export function isPrime(n) {
  if (!Number.isFinite(n) || n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// Channel-based region estimate (top/bottom half of CRT).
export function anomalyInTopHalf(anomaly) {
  if (!anomaly) return false;
  return [0, 2, 6].includes(anomaly.channelIndex);
}

// "Missing letter" on alphabet feed = cell at index 12 → letter M.
export function anomalyMissingLetter(anomaly) {
  if (!anomaly) return null;
  if (anomaly.channelIndex === 6) return "M";
  return null;
}

export function anomalyNumber(anomaly) {
  if (!anomaly) return null;
  if (anomaly.kind === "off-one") return 13;
  if (anomaly.kind === "wrong") return 15;
  if (anomaly.kind === "different-denom") return 5;
  if (anomaly.kind === "wrong-total") return 15;
  if (anomaly.kind === "off-one-dollar") return 12;
  if (anomaly.kind === "missing-same-total") return 13;
  if (anomaly.kind === "extra" && anomaly.channelIndex === 1) return 14;
  if (anomaly.kind === "sign-flip") return 7;
  if (anomaly.kind === "divzero") return 0;
  if (anomaly.kind === "ch-wrong-num") return 8;
  if (anomaly.kind === "stage-3") return 3;
  return null;
}

export const STAGE_TEMPLATES = [
  {
    title: "Backward Tick",
    lines: {
      en: [
        "ONLY A CLOCK RUNNING BACKWARD DESERVES RED.",
        "Three clocks should all tick forward."
      ],
      ru: [
        "КРАСНАЯ — ТОЛЬКО ЗА ЧАСЫ, ИДУЩИЕ НАЗАД.",
        "Все три циферблата должны тикать вперёд."
      ]
    },
    anomaly: null,
    rule: (anomaly) => Boolean(anomaly && anomaly.kind === "reverse")
  },
  {
    title: "Count Mercy",
    lines: {
      en: [
        "IGNORE A BAD TOTAL TONIGHT.",
        "ONLY A BILL THAT FLUTTERS ON ITS OWN DESERVES RED."
      ],
      ru: [
        "СЕГОДНЯ ИГНОРИРУЙ НЕВЕРНУЮ СУММУ.",
        "КРАСНАЯ — ТОЛЬКО ЗА КУПЮРУ, ТРЕПЕЩУЩУЮ САМУ ПО СЕБЕ."
      ]
    },
    anomaly: null,
    rule: (anomaly) => Boolean(anomaly && anomaly.kind === "spin")
  },
  {
    title: "Inner Ring",
    lines: {
      en: [
        "ONLY THE FIRST THREE FEEDS MAY BE JUDGED.",
        "ANY TRUE FAULT INSIDE 1, 2, OR 3 MAY TAKE RED."
      ],
      ru: [
        "СУДИТЬ МОЖНО ТОЛЬКО ПЕРВЫЕ ТРИ КАНАЛА.",
        "ЛЮБАЯ НАСТОЯЩАЯ ОШИБКА НА 1, 2 ИЛИ 3 — КРАСНАЯ."
      ]
    },
    anomaly: null,
    rule: (anomaly) => Boolean(anomaly && anomaly.channelIndex <= 2)
  },
  {
    title: "False Sum",
    lines: {
      en: [
        "WRONG MATH IS ALWAYS A TRUE FAULT.",
        "BORING CORRECT EQUATIONS ARE CLEAN."
      ],
      ru: [
        "НЕВЕРНАЯ АРИФМЕТИКА — ВСЕГДА НАСТОЯЩАЯ ОШИБКА.",
        "СКУЧНЫЕ ПРАВИЛЬНЫЕ УРАВНЕНИЯ — ЧИСТЫЕ."
      ]
    },
    anomaly: { channelIndex: 3, kind: "wrong" },
    rule: (anomaly) => Boolean(anomaly && anomaly.kind === "wrong")
  },
  {
    title: "Black Bar",
    lines: {
      en: [
        "BLACK REDACTIONS AND ALERT LINES BOTH DESERVE RED.",
        "PLAIN MAINTENANCE TEXT IS SAFE."
      ],
      ru: [
        "ЧЁРНЫЕ ЗАЧЁРКИВАНИЯ И ТРЕВОЖНЫЕ СТРОКИ — КРАСНАЯ.",
        "ОБЫЧНЫЕ СЛУЖЕБНЫЕ ЗАПИСИ БЕЗОПАСНЫ."
      ]
    },
    anomaly: { channelIndex: 4, kind: "redaction" },
    rule: (anomaly) => Boolean(anomaly && ["redaction", "alert"].includes(anomaly.kind))
  },
  {
    title: "Countdown Mercy",
    lines: {
      en: [
        "NEVER PRESS RED FOR THE COUNTDOWN FEED TONIGHT.",
        "NO MATTER HOW IT STUTTERS, LET IT PASS."
      ],
      ru: [
        "СЕГОДНЯ НЕ ЖМИ КРАСНУЮ ИЗ-ЗА ТАЙМЕРА — НИКОГДА.",
        "КАК БЫ ОН НИ ЗАПИНАЛСЯ, ПРОПУСКАЙ."
      ]
    },
    anomaly: { channelIndex: 5, kind: "skip" },
    rule: (anomaly) => Boolean(anomaly && anomaly.channelIndex !== 5)
  },
  {
    title: "Lost Letter",
    lines: {
      en: [
        "ONLY A MISSING LETTER DESERVES RED.",
        "DUPLICATES AND REORDERING DO NOT, NOT YET."
      ],
      ru: [
        "КРАСНАЯ — ТОЛЬКО ЗА ПРОПАВШУЮ БУКВУ.",
        "ДУБЛИКАТЫ И ПЕРЕСТАНОВКИ — НЕТ. ПОКА НЕТ."
      ]
    },
    anomaly: { channelIndex: 6, kind: "missing" },
    rule: (anomaly) => Boolean(anomaly && anomaly.kind === "missing")
  },
  {
    title: "Thirteen Exact",
    lines: {
      en: [
        "THE MONEY COUNTER MUST SHOW THIRTEEN ONE-DOLLAR BILLS.",
        "ANY OTHER VALUE IS A TRUE FAULT."
      ],
      ru: [
        "СЧЁТЧИК ДЕНЕГ ДОЛЖЕН ПОКАЗЫВАТЬ ТРИНАДЦАТЬ ОДНОДОЛЛАРОВЫХ КУПЮР.",
        "ЛЮБОЕ ДРУГОЕ ЧИСЛО — НАСТОЯЩАЯ ОШИБКА."
      ]
    },
    anomaly: { channelIndex: 1, kind: "impossible" },
    rule: (anomaly) => Boolean(anomaly && anomaly.kind === "impossible")
  },
  {
    title: "Fourth Hand",
    lines: {
      en: [
        "STOPPED CLOCKS ARE NOISE.",
        "AN EXTRA HAND IS THE TRUE FAULT."
      ],
      ru: [
        "ОСТАНОВИВШИЕСЯ ЧАСЫ — ПРОСТО ШУМ.",
        "ЛИШНЯЯ СТРЕЛКА — НАСТОЯЩАЯ ОШИБКА."
      ]
    },
    anomaly: { channelIndex: 0, kind: "extra" },
    rule: (anomaly) => Boolean(anomaly && anomaly.kind === "extra")
  },
  {
    title: "Sweep Denial",
    lines: {
      en: [
        "GHOST BLIPS ON RADAR ARE BAIT.",
        "ONLY A SWEEP RUNNING BACKWARD DESERVES RED."
      ],
      ru: [
        "ПРИЗРАЧНЫЕ ОТМЕТКИ НА РАДАРЕ — ПРИМАНКА.",
        "КРАСНАЯ — ТОЛЬКО ЗА РАЗВЁРТКУ, ИДУЩУЮ НАЗАД."
      ]
    },
    anomaly: { channelIndex: 2, kind: "ghost" },
    rule: (anomaly) => Boolean(anomaly && anomaly.kind === "reverse")
  },
  {
    title: "Do Not Pick Up",
    lines: {
      en: [
        "DO NOT ANSWER THE PHONE THIS STAGE.",
        "PRESS RED IF YOU SEE AN ANOMALY ON THE FEED."
      ],
      ru: [
        "НЕ ОТВЕЧАЙ НА ТЕЛЕФОН НА ЭТОМ ЭТАПЕ.",
        "ЖМИ КРАСНУЮ, ЕСЛИ ВИДИШЬ АНОМАЛИЮ НА КАНАЛЕ."
      ]
    },
    anomaly: { channelIndex: 3, kind: "wrong" },
    phone: {
      ringsAt: 1.2,
      onAnswer: "trap",
      voiceLine: "Skip this one. Trust me."
    },
    rule: (anomaly, phone) => {
      if (phone && phone.answered) return false; // answering is always wrong here
      return Boolean(anomaly);
    }
  },
  {
    title: "Answer First",
    lines: {
      en: [
        "ANSWER THE PHONE FIRST.",
        "THE VOICE WILL SPEAK A NUMBER.",
        "PRESS RED IF THAT NUMBER IS EVEN."
      ],
      ru: [
        "СНАЧАЛА ОТВЕТЬ НА ТЕЛЕФОН.",
        "ГОЛОС НАЗОВЁТ ЧИСЛО.",
        "ЖМИ КРАСНУЮ, ЕСЛИ ЭТО ЧИСЛО ЧЁТНОЕ."
      ]
    },
    anomaly: { channelIndex: 4, kind: "alert" },
    phone: {
      ringsAt: 0.8,
      onAnswer: "clue",
      voiceLine: "The number is eight.",
      spokenNumber: 8
    },
    rule: (anomaly, phone) => {
      if (!phone || !phone.answered) return false;
      const stage = STAGES[state.stageIndex];
      const n = stage?.phone?.spokenNumber;
      return typeof n === "number" && n % 2 === 0;
    }
  },
  {
    title: "Call For Verification",
    lines: {
      en: [
        "CALL EXTENSION FOUR.",
        "IF THE LINE IS BUSY, SKIP.",
        "IF THE LINE IS CLEAR, PRESS RED."
      ],
      ru: [
        "ПОЗВОНИ НА ДОБАВОЧНЫЙ ЧЕТЫРЕ.",
        "ЕСЛИ ЛИНИЯ ЗАНЯТА — ПРОПУСКАЙ.",
        "ЕСЛИ ЛИНИЯ СВОБОДНА — ЖМИ КРАСНУЮ."
      ]
    },
    anomaly: { channelIndex: 5, kind: "freeze" },
    phone: {
      onOutgoing: "info",
      outgoingLine: "Line is clear. Proceed."
    },
    rule: (_anomaly, phone) => Boolean(phone && phone.answered && phone.callContent === "info")
  },
  {
    title: "Loose Tender",
    lines: {
      en: [
        "A FLUTTERING BILL DESERVES RED.",
        "THE COUNT DOES NOT MATTER IF THE STACK TWITCHES."
      ],
      ru: [
        "ТРЕПЕЩУЩАЯ КУПЮРА — КРАСНАЯ.",
        "ЕСЛИ ПАЧКА ДЁРГАЕТСЯ, СУММА УЖЕ НЕ ВАЖНА."
      ]
    },
    anomaly: { channelIndex: 1, kind: "spin" },
    rule: (anomaly) => Boolean(anomaly && anomaly.kind === "spin")
  },
  {
    title: "Repeat Sum",
    lines: {
      en: [
        "DUPLICATED EQUATIONS ARE HARMLESS.",
        "ONLY WRONG EQUATIONS DESERVE RED."
      ],
      ru: [
        "ПОВТОРЯЮЩИЕСЯ УРАВНЕНИЯ БЕЗВРЕДНЫ.",
        "КРАСНАЯ — ТОЛЬКО ЗА НЕВЕРНЫЕ УРАВНЕНИЯ."
      ]
    },
    anomaly: { channelIndex: 3, kind: "duplicate" },
    rule: (anomaly) => Boolean(anomaly && anomaly.kind === "wrong")
  },
  {
    title: "Twin Alphabet",
    lines: {
      en: [
        "DUPLICATE LETTERS DESERVE RED.",
        "MISSING LETTERS DO NOT, NOT THIS TIME."
      ],
      ru: [
        "ДУБЛИРОВАННЫЕ БУКВЫ — КРАСНАЯ.",
        "ПРОПАВШИЕ БУКВЫ — НЕТ. НЕ В ЭТОТ РАЗ."
      ]
    },
    anomaly: { channelIndex: 6, kind: "duplicate" },
    rule: (anomaly) => Boolean(anomaly && anomaly.kind === "duplicate")
  },
  {
    title: "Clean Room",
    lines: {
      en: [
        "IF THE FEEDS ARE CLEAN, PRESS NOTHING.",
        "SKIP AND KEEP WATCHING."
      ],
      ru: [
        "ЕСЛИ КАНАЛЫ ЧИСТЫЕ — НЕ ЖМИ НИЧЕГО.",
        "ПРОПУСКАЙ И ПРОДОЛЖАЙ НАБЛЮДАТЬ."
      ]
    },
    anomaly: null,
    rule: (anomaly) => Boolean(anomaly)
  },
  {
    title: "Final Sweep",
    lines: {
      en: [
        "THE LAST TRUE FAULT IS A RADAR SWEEP RUNNING BACKWARD.",
        "IT MUST BE ON FEED 3. NOTHING ELSE COUNTS."
      ],
      ru: [
        "ПОСЛЕДНЯЯ НАСТОЯЩАЯ ОШИБКА — РАЗВЁРТКА РАДАРА, ИДУЩАЯ НАЗАД.",
        "ТОЛЬКО НА КАНАЛЕ 3. ОСТАЛЬНОЕ НЕ СЧИТАЕТСЯ."
      ]
    },
    anomaly: { channelIndex: 2, kind: "reverse" },
    rule: (anomaly) => Boolean(anomaly && anomaly.channelIndex === 2 && anomaly.kind === "reverse")
  }
];

// =========================================================================
// RIDDLE POOLS — 120 total. buildStagesForRun() picks 6/6/2/4 at run start.
// Each rule receives (anomaly, phoneCtx, ctx) and returns true if the
// correct decision is RED. Otherwise the correct decision is SKIP.
// =========================================================================
export const EASY_RIDDLES = [
  { lines: { en: ["press if you found an anomaly.", "skip if everything looked normal."], ru: ["жми, если нашёл аномалию.", "пропусти, если всё выглядит нормально."] }, rule: (a) => !!a },
  { lines: { en: ["press if anomaly involves something missing.", "skip if nothing is missing."], ru: ["жми, если в аномалии что-то пропало.", "пропусти, если ничего не пропало."] }, rule: (a) => hasTag(a, "missing") },
  { lines: { en: ["press if anomaly is moving wrong.", "skip if it is frozen."], ru: ["жми, если аномалия двигается неправильно.", "пропусти, если она замерла."] }, rule: (a) => hasTag(a, "moving") || hasTag(a, "speed") || hasTag(a, "direction") },
  { lines: { en: ["press if anomaly involves a number.", "skip if it involves a shape."], ru: ["жми, если аномалия связана с числом.", "пропусти, если с формой."] }, rule: (a) => hasTag(a, "number") },
  { lines: { en: ["press if anomaly is on an odd-numbered channel.", "skip if even."], ru: ["жми, если аномалия на нечётном канале.", "пропусти, если на чётном."] }, rule: (a) => !!a && ((a.channelIndex + 1) % 2 === 1) },
  { lines: { en: ["press if anomaly involves something extra that shouldn't be there.", "skip if something is missing."], ru: ["жми, если появилось что-то лишнее.", "пропусти, если что-то пропало."] }, rule: (a) => hasTag(a, "extra") },
  { lines: { en: ["press if anomaly involves text.", "skip if anomaly is visual."], ru: ["жми, если аномалия в тексте.", "пропусти, если она визуальная."] }, rule: (a) => hasTag(a, "text") },
  { lines: { en: ["press if anomaly is obviously wrong.", "skip if you are not sure."], ru: ["жми, если ошибка очевидна.", "пропусти, если не уверен."] }, rule: (a) => !!a && !hasTag(a, "subtle") },
  { lines: { en: ["press if you found anomaly on first three channels.", "skip if last four."], ru: ["жми, если аномалия на первых трёх каналах.", "пропусти, если на последних четырёх."] }, rule: (a) => !!a && a.channelIndex <= 2 },
  { lines: { en: ["press if anomaly involves direction being wrong.", "skip if speed is wrong."], ru: ["жми, если ошибочно направление.", "пропусти, если ошибочна скорость."] }, rule: (a) => hasTag(a, "direction") },
  { lines: { en: ["press if anomaly involves a letter.", "skip if it involves a number."], ru: ["жми, если аномалия в букве.", "пропусти, если в числе."] }, rule: (a) => hasTag(a, "letter") && !hasTag(a, "number") },
  { lines: { en: ["press if something is frozen that shouldn't be.", "skip if something is moving that shouldn't be."], ru: ["жми, если что-то застыло, хотя не должно.", "пропусти, если что-то движется, хотя не должно."] }, rule: (a) => hasTag(a, "frozen") },
  { lines: { en: ["press if anomaly is in the top half of the screen.", "skip if bottom half."], ru: ["жми, если аномалия в верхней половине экрана.", "пропусти, если в нижней."] }, rule: (a) => anomalyInTopHalf(a) },
  { lines: { en: ["press if you visited more than 3 channels before finding anomaly.", "skip if less."], ru: ["жми, если обошёл больше 3 каналов, прежде чем нашёл аномалию.", "пропусти, если меньше."] }, rule: (a, _p, c) => !!a && c.channelsVisitedCount > 3 },
  { lines: { en: ["press if anomaly involves a count being wrong.", "skip if a position is wrong."], ru: ["жми, если ошибочно количество.", "пропусти, если ошибочно положение."] }, rule: (a) => hasTag(a, "count") && !hasTag(a, "position") },
  { lines: { en: ["press if anomaly involves time.", "skip if it does not."], ru: ["жми, если аномалия связана со временем.", "пропусти, если нет."] }, rule: (a) => hasTag(a, "time") },
  { lines: { en: ["press if anomaly is on channel higher than 4.", "skip if channel 4 or lower."], ru: ["жми, если аномалия на канале выше 4-го.", "пропусти, если на 4-м или ниже."] }, rule: (a) => !!a && (a.channelIndex + 1) > 4 },
  { lines: { en: ["press if you saw the anomaly immediately on the first channel.", "skip if you had to search."], ru: ["жми, если заметил аномалию сразу на первом канале.", "пропусти, если пришлось искать."] }, rule: (a, _p, c) => !!a && c.firstVisited === a.channelIndex },
  { lines: { en: ["press if anomaly involves something spinning wrong.", "skip if something is stationary."], ru: ["жми, если что-то крутится неправильно.", "пропусти, если что-то неподвижно."] }, rule: (a) => hasTag(a, "spinning") },
  { lines: { en: ["press if anomaly is in the center of the screen.", "skip if on the edges."], ru: ["жми, если аномалия в центре экрана.", "пропусти, если по краям."] }, rule: (a) => hasTag(a, "center") },
  { lines: { en: ["press if anomaly involves a color change.", "skip if shape change."], ru: ["жми, если изменился цвет.", "пропусти, если изменилась форма."] }, rule: (a) => hasTag(a, "color") && !hasTag(a, "shape") },
  { lines: { en: ["press if anomaly is subtle and hard to notice.", "skip if obvious."], ru: ["жми, если аномалия тонкая и малозаметная.", "пропусти, если очевидная."] }, rule: (a) => hasTag(a, "subtle") },
  { lines: { en: ["press if anomaly involves words or letters.", "skip if numbers only."], ru: ["жми, если аномалия в словах или буквах.", "пропусти, если только в числах."] }, rule: (a) => (hasTag(a, "text") || hasTag(a, "letter")) && !hasTag(a, "number") },
  { lines: { en: ["press if you found no anomaly on any channel.", "skip if you found one."], ru: ["жми, если не нашёл аномалии ни на одном канале.", "пропусти, если нашёл."] }, rule: (a) => !a, requireNoAnomaly: true },
  { lines: { en: ["press if anomaly involves something going backwards.", "skip if going forwards wrong."], ru: ["жми, если что-то идёт задом наперёд.", "пропусти, если идёт вперёд, но неверно."] }, rule: (a) => hasTag(a, "backward") },
  { lines: { en: ["press if anomaly involves a wrong label or name.", "skip if visual only."], ru: ["жми, если неверна метка или надпись.", "пропусти, если аномалия только визуальная."] }, rule: (a) => hasTag(a, "label") },
  { lines: { en: ["press if anomaly is on channel 1 2 or 3.", "skip if channel 4 5 6 or 7."], ru: ["жми, если аномалия на канале 1, 2 или 3.", "пропусти, если на канале 4, 5, 6 или 7."] }, rule: (a) => !!a && a.channelIndex <= 2 },
  { lines: { en: ["press if anomaly involves something repeating.", "skip if something missing."], ru: ["жми, если что-то повторяется.", "пропусти, если что-то пропало."] }, rule: (a) => hasTag(a, "repeating") },
  { lines: { en: ["press if everything on all channels looks completely normal.", "skip if you found something."], ru: ["жми, если на всех каналах всё абсолютно нормально.", "пропусти, если что-то нашёл."] }, rule: (a) => !a, requireNoAnomaly: true },
  { lines: { en: ["press if anomaly involves a border or outline.", "skip if content inside."], ru: ["жми, если аномалия в рамке или контуре.", "пропусти, если внутри."] }, rule: (a) => hasTag(a, "border") },
  { lines: { en: ["press if anomaly involves a letter being wrong.", "skip if letter is missing."], ru: ["жми, если буква неправильная.", "пропусти, если буква пропала."] }, rule: (a) => hasTag(a, "letter") && !hasTag(a, "missing") },
  { lines: { en: ["press if anomaly is related to counting.", "skip if related to direction."], ru: ["жми, если аномалия связана со счётом.", "пропусти, если с направлением."] }, rule: (a) => hasTag(a, "count") && !hasTag(a, "direction") },
  { lines: { en: ["press if anomaly involves the channel header text.", "skip if main display."], ru: ["жми, если аномалия в заголовке канала.", "пропусти, если на основном поле."] }, rule: (a) => hasTag(a, "header") },
  { lines: { en: ["press if anomaly involves something too fast.", "skip if too slow."], ru: ["жми, если что-то слишком быстрое.", "пропусти, если слишком медленное."] }, rule: (a) => hasTag(a, "speed") && !hasTag(a, "slow") },
  { lines: { en: ["press if anomaly is on an even channel.", "skip if odd."], ru: ["жми, если аномалия на чётном канале.", "пропусти, если на нечётном."] }, rule: (a) => !!a && ((a.channelIndex + 1) % 2 === 0) },
  { lines: { en: ["press if you had to visit every channel to find the anomaly.", "skip if found it early."], ru: ["жми, если пришлось обойти все каналы, чтобы найти аномалию.", "пропусти, если нашёл её рано."] }, rule: (a, _p, c) => !!a && c.channelsVisitedCount >= 7 },
  { lines: { en: ["press if anomaly involves a number being too high.", "skip if too low."], ru: ["жми, если число слишком большое.", "пропусти, если слишком маленькое."] }, rule: (a) => { const n = anomalyNumber(a); return n !== null && n > 10; } },
  { lines: { en: ["press if anomaly involves something that should be symmetric but isn't.", "skip otherwise."], ru: ["жми, если что-то должно быть симметричным, но не является.", "иначе пропусти."] }, rule: (a) => hasTag(a, "symmetric") },
  { lines: { en: ["press if anomaly involves a line or wire.", "skip if a shape or object."], ru: ["жми, если аномалия в линии или проводе.", "пропусти, если в форме или предмете."] }, rule: (a) => hasTag(a, "line") && !hasTag(a, "shape") },
  { lines: { en: ["press if you are completely confident anomaly exists.", "skip if even slightly unsure."], ru: ["жми, если полностью уверен, что аномалия есть.", "пропусти, если хоть немного сомневаешься."] }, rule: (a) => !!a && !hasTag(a, "subtle") }
];

export const MEDIUM_RIDDLES = [
  { lines: { en: ["press if anomaly involves missing element AND it is on odd channel.", "skip if either false."], ru: ["жми, если что-то пропало И это на нечётном канале.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => hasTag(a, "missing") && !!a && (a.channelIndex + 1) % 2 === 1 },
  { lines: { en: ["press if anomaly involves text AND channel number is above 4.", "skip if either false."], ru: ["жми, если аномалия в тексте И номер канала больше 4.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => hasTag(a, "text") && !!a && (a.channelIndex + 1) > 4 },
  { lines: { en: ["press if anomaly involves wrong direction AND you visited less than 4 channels.", "skip if either false."], ru: ["жми, если направление неверное И ты обошёл меньше 4 каналов.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "direction") && c.channelsVisitedCount < 4 },
  { lines: { en: ["press if anomaly is visual AND on even channel.", "skip if either false."], ru: ["жми, если аномалия визуальная И на чётном канале.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => hasTag(a, "visual") && !!a && (a.channelIndex + 1) % 2 === 0 },
  { lines: { en: ["press if anomaly involves a number AND that number is even.", "skip if either false."], ru: ["жми, если аномалия связана с числом И это число чётное.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => { const n = anomalyNumber(a); return n !== null && n % 2 === 0; } },
  { lines: { en: ["press if no anomaly exists AND timer shows even minutes.", "skip if either false."], ru: ["жми, если аномалии нет И таймер показывает чётные минуты.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => !a && (c.timerMinutes % 2 === 0), requireNoAnomaly: true },
  { lines: { en: ["press if anomaly involves something frozen AND channel is odd.", "skip if either false."], ru: ["жми, если что-то застыло И канал нечётный.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => hasTag(a, "frozen") && !!a && (a.channelIndex + 1) % 2 === 1 },
  { lines: { en: ["press if anomaly is in header text AND stage number is odd.", "skip if either false."], ru: ["жми, если аномалия в заголовке И номер этапа нечётный.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "header") && c.stageNumber % 2 === 1 },
  { lines: { en: ["press if anomaly involves wrong speed AND you found it within first 3 channels.", "skip if either false."], ru: ["жми, если скорость неверная И ты нашёл её среди первых 3 каналов.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "speed") && !!a && c.channelsVisitedCount <= 3 && c.visitOrder.includes(a.channelIndex) },
  { lines: { en: ["press if anomaly involves a letter AND that letter is a vowel.", "skip if either false."], ru: ["жми, если аномалия в букве И эта буква — гласная.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => hasTag(a, "letter") && isVowel(anomalyMissingLetter(a) || "") },
  { lines: { en: ["press if anomaly involves something extra AND channel number is prime.", "skip if either false."], ru: ["жми, если появилось что-то лишнее И номер канала — простое число.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => hasTag(a, "extra") && !!a && isPrime(a.channelIndex + 1) },
  { lines: { en: ["press if anomaly involves time AND timer currently shows odd seconds.", "skip if either false."], ru: ["жми, если аномалия связана со временем И таймер показывает нечётные секунды.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "time") && (c.timerSecondsDigit % 2 === 1) },
  { lines: { en: ["press if anomaly is subtle AND you visited more than 4 channels.", "skip if either false."], ru: ["жми, если аномалия тонкая И ты обошёл больше 4 каналов.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "subtle") && c.channelsVisitedCount > 4 },
  { lines: { en: ["press if anomaly involves a count AND that count is odd.", "skip if either false."], ru: ["жми, если аномалия в количестве И это количество нечётное.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => { const n = anomalyNumber(a); return hasTag(a, "count") && n !== null && n % 2 === 1; } },
  { lines: { en: ["press if no anomaly found AND you visited all 7 channels.", "skip if either false."], ru: ["жми, если не нашёл аномалию И обошёл все 7 каналов.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => !a && c.channelsVisitedCount >= 7, requireNoAnomaly: true },
  { lines: { en: ["press if anomaly involves wrong direction AND channel number is even.", "skip if either false."], ru: ["жми, если направление неверное И номер канала чётный.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => hasTag(a, "direction") && !!a && (a.channelIndex + 1) % 2 === 0 },
  { lines: { en: ["press if anomaly involves a missing letter AND that letter comes before M in alphabet.", "skip if either false."], ru: ["жми, если пропала буква И эта буква идёт до M в алфавите.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => { const L = anomalyMissingLetter(a); return !!L && L.charCodeAt(0) < "M".charCodeAt(0); } },
  { lines: { en: ["press if anomaly is in main display not header AND channel is above 3.", "skip if either false."], ru: ["жми, если аномалия на основном поле, а не в заголовке И канал выше 3.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => !!a && !hasTag(a, "header") && (a.channelIndex + 1) > 3 },
  { lines: { en: ["press if anomaly involves something repeating AND timer shows more than 5 minutes.", "skip if either false."], ru: ["жми, если что-то повторяется И таймер показывает больше 5 минут.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "repeating") && c.timerMinutes > 5 },
  { lines: { en: ["press if anomaly involves a number being wrong AND that number is above 10.", "skip if either false."], ru: ["жми, если число неверное И это число больше 10.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => { const n = anomalyNumber(a); return hasTag(a, "number") && n !== null && n > 10; } },
  { lines: { en: ["press if anomaly is on channel matching current stage divided by 3 rounded down.", "skip if not."], ru: ["жми, если аномалия на канале, равном номеру этапа, делённому на 3 и округлённому вниз.", "иначе пропусти."] }, rule: (a, _p, c) => !!a && a.channelIndex + 1 === Math.floor(c.stageNumber / 3) },
  { lines: { en: ["press if anomaly involves backward movement AND you have seen more than 2 anomalies this run.", "skip if either false."], ru: ["жми, если движение задом наперёд И ты видел больше 2 аномалий за эту смену.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "backward") && c.anomaliesSeenThisRun > 2 },
  { lines: { en: ["press if anomaly involves text AND phone has not rung this stage.", "skip if either false."], ru: ["жми, если аномалия в тексте И телефон не звонил на этом этапе.", "пропусти, если хотя бы одно неверно."] }, rule: (a, p) => hasTag(a, "text") && !(p && p.didRing) },
  { lines: { en: ["press if anomaly involves a shape AND channel number is divisible by 2.", "skip if either false."], ru: ["жми, если аномалия в форме И номер канала делится на 2.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => hasTag(a, "shape") && !!a && (a.channelIndex + 1) % 2 === 0 },
  { lines: { en: ["press if anomaly is visual AND timer shows less than 7 minutes.", "skip if either false."], ru: ["жми, если аномалия визуальная И таймер показывает меньше 7 минут.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "visual") && c.timerMinutes < 7 },
  { lines: { en: ["press if anomaly involves something missing AND you found it on last channel you visited.", "skip if either false."], ru: ["жми, если что-то пропало И ты нашёл это на последнем посещённом канале.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "missing") && !!a && c.lastVisited === a.channelIndex },
  { lines: { en: ["press if anomaly involves wrong label AND stage number is even.", "skip if either false."], ru: ["жми, если неверна надпись И номер этапа чётный.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "label") && c.stageNumber % 2 === 0 },
  { lines: { en: ["press if anomaly involves a count being too high AND channel is below 5.", "skip if either false."], ru: ["жми, если количество слишком большое И канал ниже 5.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => { const n = anomalyNumber(a); return hasTag(a, "count") && n !== null && n > 13 && !!a && (a.channelIndex + 1) < 5; } },
  { lines: { en: ["press if no anomaly exists AND this is an odd stage.", "skip if either false."], ru: ["жми, если аномалии нет И этап нечётный.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => !a && c.stageNumber % 2 === 1, requireNoAnomaly: true },
  { lines: { en: ["press if anomaly involves speed AND you have seen less than 3 anomalies this run.", "skip if either false."], ru: ["жми, если аномалия в скорости И ты видел меньше 3 аномалий за эту смену.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "speed") && c.anomaliesSeenThisRun < 3 },
  { lines: { en: ["press if anomaly involves a letter being replaced AND replacement is a number.", "skip if either false."], ru: ["жми, если букву заменили И замена — число.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => !!a && (a.kind === "letter-number" || a.kind === "stage-3" || a.kind === "trace-3" || a.kind === "header-alphab3t" || a.kind === "ch-letter" || a.kind === "live-one") && hasTag(a, "number") },
  { lines: { en: ["press if anomaly involves something frozen AND timer shows even seconds.", "skip if either false."], ru: ["жми, если что-то застыло И таймер показывает чётные секунды.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "frozen") && (c.timerSecondsDigit % 2 === 0) },
  { lines: { en: ["press if anomaly is on channel 1 or 7 AND involves something visual.", "skip if either false."], ru: ["жми, если аномалия на канале 1 или 7 И она визуальная.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => !!a && [0, 6].includes(a.channelIndex) && hasTag(a, "visual") },
  { lines: { en: ["press if anomaly involves wrong direction AND channel number is odd.", "skip if either false."], ru: ["жми, если направление неверное И номер канала нечётный.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => hasTag(a, "direction") && !!a && (a.channelIndex + 1) % 2 === 1 },
  { lines: { en: ["press if anomaly involves header text AND that text has more than 8 characters.", "skip if either false."], ru: ["жми, если аномалия в заголовке И в этом заголовке больше 8 символов.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => { const names = ["THREE CLOCKS", "MONEY COUNTER", "RADAR", "EQUATION FEED", "TYPEWRITER", "COUNTDOWN", "ALPHABET"]; return hasTag(a, "header") && !!a && (names[a.channelIndex] || "").length > 8; } },
  { lines: { en: ["press if no anomaly AND phone rings this stage.", "skip if either false."], ru: ["жми, если аномалии нет И телефон звонит на этом этапе.", "пропусти, если хотя бы одно неверно."] }, rule: (a, p) => !a && p && p.didRing, requireNoAnomaly: true, expectRing: true },
  { lines: { en: ["press if anomaly involves a missing element AND you are on stage divisible by 3.", "skip if either false."], ru: ["жми, если что-то пропало И номер этапа делится на 3.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "missing") && (c.stageNumber % 3 === 0) },
  { lines: { en: ["press if anomaly involves wrong speed AND timer shows more than 4 minutes.", "skip if either false."], ru: ["жми, если скорость неверная И таймер показывает больше 4 минут.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "speed") && c.timerMinutes > 4 },
  { lines: { en: ["press if anomaly is on even channel AND involves a number.", "skip if either false."], ru: ["жми, если аномалия на чётном канале И связана с числом.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => !!a && (a.channelIndex + 1) % 2 === 0 && hasTag(a, "number") },
  { lines: { en: ["press if anomaly involves something extra AND you visited all channels before deciding.", "skip if either false."], ru: ["жми, если появилось что-то лишнее И ты обошёл все каналы перед решением.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "extra") && c.channelsVisitedCount >= 7 }
];

export const HARD_RIDDLES = [
  { lines: { en: ["press if anomaly involves missing element AND channel is odd AND you found it after visiting 4 or more channels.", "skip if any false."], ru: ["жми, если что-то пропало И канал нечётный И ты нашёл это после посещения 4 или более каналов.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "missing") && !!a && (a.channelIndex + 1) % 2 === 1 && c.channelsVisitedCount >= 4 },
  { lines: { en: ["press if anomaly involves text AND stage number is prime AND timer shows odd minutes.", "skip if any false."], ru: ["жми, если аномалия в тексте И номер этапа — простое число И таймер показывает нечётные минуты.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "text") && isPrime(c.stageNumber) && (c.timerMinutes % 2 === 1) },
  { lines: { en: ["press if anomaly is visual AND channel number is even AND you have seen more than 3 anomalies this run.", "skip if any false."], ru: ["жми, если аномалия визуальная И номер канала чётный И ты видел больше 3 аномалий за эту смену.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "visual") && !!a && (a.channelIndex + 1) % 2 === 0 && c.anomaliesSeenThisRun > 3 },
  { lines: { en: ["press if no anomaly exists AND timer shows less than 4 minutes AND stage number is odd.", "skip if any false."], ru: ["жми, если аномалии нет И таймер показывает меньше 4 минут И номер этапа нечётный.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => !a && c.timerMinutes < 4 && c.stageNumber % 2 === 1, requireNoAnomaly: true },
  { lines: { en: ["press if anomaly involves wrong direction AND channel is above 4 AND phone has not rung.", "skip if any false."], ru: ["жми, если направление неверное И канал выше 4 И телефон не звонил.", "пропусти, если хотя бы одно неверно."] }, rule: (a, p) => hasTag(a, "direction") && !!a && (a.channelIndex + 1) > 4 && !(p && p.didRing) },
  { lines: { en: ["press if anomaly involves a number AND that number is prime AND channel number is also prime.", "skip if any false."], ru: ["жми, если аномалия связана с числом И это число простое И номер канала тоже простое.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => { const n = anomalyNumber(a); return n !== null && isPrime(n) && !!a && isPrime(a.channelIndex + 1); } },
  { lines: { en: ["press if anomaly involves header text AND more than one character is wrong AND stage is even.", "skip if any false."], ru: ["жми, если аномалия в заголовке И искажён больше одного символа И номер этапа чётный.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "header") && !!a && (a.kind === "header-typewrlter" || a.kind === "header-dwon" || a.kind === "header-rarar" || a.kind === "header-cunter") && c.stageNumber % 2 === 0 },
  { lines: { en: ["press if anomaly involves something frozen AND you visited every channel AND timer shows even seconds.", "skip if any false."], ru: ["жми, если что-то застыло И ты обошёл все каналы И таймер показывает чётные секунды.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "frozen") && c.channelsVisitedCount >= 7 && (c.timerSecondsDigit % 2 === 0) },
  { lines: { en: ["press if anomaly is on channel 2 or 6 AND involves visual change AND you have seen less than 2 anomalies this run.", "skip if any false."], ru: ["жми, если аномалия на канале 2 или 6 И она визуальная И ты видел меньше 2 аномалий за эту смену.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => !!a && [1, 5].includes(a.channelIndex) && hasTag(a, "visual") && c.anomaliesSeenThisRun < 2 },
  { lines: { en: ["press if anomaly involves something repeating AND channel is odd AND timer shows more than 6 minutes.", "skip if any false."], ru: ["жми, если что-то повторяется И канал нечётный И таймер показывает больше 6 минут.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "repeating") && !!a && (a.channelIndex + 1) % 2 === 1 && c.timerMinutes > 6 },
  { lines: { en: ["press if anomaly involves wrong speed AND you found it on first channel visited AND stage is divisible by 3.", "skip if any false."], ru: ["жми, если скорость неверная И ты нашёл это на первом посещённом канале И номер этапа делится на 3.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "speed") && !!a && c.firstVisited === a.channelIndex && c.stageNumber % 3 === 0 },
  { lines: { en: ["press if no anomaly exists AND you opened tablet before scanning channels AND stage number is above 10.", "skip if any false."], ru: ["жми, если аномалии нет И ты открыл планшет до просмотра каналов И номер этапа больше 10.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => !a && c.ipadOpenedBeforeScan && c.stageNumber > 10, requireNoAnomaly: true },
  { lines: { en: ["press if anomaly involves a missing letter AND that letter is a consonant AND channel number is below 4.", "skip if any false."], ru: ["жми, если пропала буква И это согласная И номер канала меньше 4.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => { const L = anomalyMissingLetter(a); return !!L && !isVowel(L) && !!a && (a.channelIndex + 1) < 4; } },
  { lines: { en: ["press if anomaly involves something extra AND phone rang this stage AND timer shows odd minutes.", "skip if any false."], ru: ["жми, если появилось что-то лишнее И телефон звонил на этом этапе И таймер показывает нечётные минуты.", "пропусти, если хотя бы одно неверно."] }, rule: (a, p, c) => hasTag(a, "extra") && p && p.didRing && c.timerMinutes % 2 === 1 },
  { lines: { en: ["press if anomaly is subtle AND you almost missed it AND channel is even.", "skip if any false."], ru: ["жми, если аномалия тонкая И ты почти её пропустил И канал чётный.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "subtle") && !!a && c.channelsVisitedCount >= 5 && (a.channelIndex + 1) % 2 === 0 },
  { lines: { en: ["press if anomaly involves wrong label AND stage number is prime AND you have seen more than 4 anomalies this run.", "skip if any false."], ru: ["жми, если неверна надпись И номер этапа — простое число И ты видел больше 4 аномалий за эту смену.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "label") && isPrime(c.stageNumber) && c.anomaliesSeenThisRun > 4 },
  { lines: { en: ["press if anomaly involves backward movement AND channel number is odd AND timer shows less than 5 minutes.", "skip if any false."], ru: ["жми, если движение задом наперёд И номер канала нечётный И таймер показывает меньше 5 минут.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "backward") && !!a && (a.channelIndex + 1) % 2 === 1 && c.timerMinutes < 5 },
  { lines: { en: ["press if no anomaly AND stage number is divisible by 4 AND you visited less than 3 channels.", "skip if any false."], ru: ["жми, если аномалии нет И номер этапа делится на 4 И ты обошёл меньше 3 каналов.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => !a && c.stageNumber % 4 === 0 && c.channelsVisitedCount < 3, requireNoAnomaly: true },
  { lines: { en: ["press if anomaly involves a count AND that count is prime AND channel number is also prime.", "skip if any false."], ru: ["жми, если аномалия в количестве И это количество — простое число И номер канала тоже простое.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => { const n = anomalyNumber(a); return hasTag(a, "count") && n !== null && isPrime(n) && !!a && isPrime(a.channelIndex + 1); } },
  { lines: { en: ["press if anomaly is in header AND involves single wrong character AND that character is a number.", "skip if any false."], ru: ["жми, если аномалия в заголовке И искажён один символ И этот символ — цифра.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => hasTag(a, "header") && !!a && ["header-alphab3t", "ch-letter", "stage-capital-o", "stage-3", "live-one"].includes(a.kind) && hasTag(a, "number") },
  { lines: { en: ["press if anomaly involves wrong direction AND you have seen exactly 2 anomalies this run AND channel is above 3.", "skip if any false."], ru: ["жми, если направление неверное И ты видел ровно 2 аномалии за эту смену И канал выше 3.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "direction") && c.anomaliesSeenThisRun === 2 && !!a && (a.channelIndex + 1) > 3 },
  { lines: { en: ["press if anomaly involves something missing AND timer shows even minutes AND stage is odd.", "skip if any false."], ru: ["жми, если что-то пропало И таймер показывает чётные минуты И номер этапа нечётный.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "missing") && c.timerMinutes % 2 === 0 && c.stageNumber % 2 === 1 },
  { lines: { en: ["press if anomaly involves visual distortion AND channel is below 4 AND phone has rung at least once this run.", "skip if any false."], ru: ["жми, если визуальное искажение И канал ниже 4 И телефон звонил хотя бы раз за эту смену.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "visual") && !!a && (a.channelIndex + 1) < 4 && c.phoneRangThisRun },
  { lines: { en: ["press if no anomaly AND all channels visited AND timer shows more than 3 minutes.", "skip if any false."], ru: ["жми, если аномалии нет И все каналы просмотрены И таймер показывает больше 3 минут.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => !a && c.channelsVisitedCount >= 7 && c.timerMinutes > 3, requireNoAnomaly: true },
  { lines: { en: ["press if anomaly involves text AND contains a number AND that number matches current stage.", "skip if any false."], ru: ["жми, если аномалия в тексте И содержит число И это число равно номеру текущего этапа.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => { const n = anomalyNumber(a); return hasTag(a, "text") && hasTag(a, "number") && n !== null && n === c.stageNumber; } },
  { lines: { en: ["press if anomaly is on odd channel AND involves movement AND you found it on your second channel visit.", "skip if any false."], ru: ["жми, если аномалия на нечётном канале И связана с движением И ты нашёл её на втором посещённом канале.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => !!a && (a.channelIndex + 1) % 2 === 1 && (hasTag(a, "moving") || hasTag(a, "speed") || hasTag(a, "direction")) && c.visitOrder[1] === a.channelIndex },
  { lines: { en: ["press if anomaly involves wrong speed AND channel number squared is above 20 AND timer shows odd seconds.", "skip if any false."], ru: ["жми, если скорость неверная И квадрат номера канала больше 20 И таймер показывает нечётные секунды.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "speed") && !!a && ((a.channelIndex + 1) ** 2) > 20 && (c.timerSecondsDigit % 2 === 1) },
  { lines: { en: ["press if anomaly involves something extra AND it appears in bottom half of screen AND stage is even.", "skip if any false."], ru: ["жми, если появилось что-то лишнее И это в нижней половине экрана И номер этапа чётный.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => hasTag(a, "extra") && !!a && !anomalyInTopHalf(a) && c.stageNumber % 2 === 0 },
  { lines: { en: ["press if no anomaly AND stage number plus channel number you checked last equals an even number.", "skip if any false."], ru: ["жми, если аномалии нет И сумма номера этапа и номера последнего проверенного канала — чётное число.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => !a && ((c.stageNumber + (c.lastVisited + 1)) % 2 === 0), requireNoAnomaly: true },
  { lines: { en: ["press if anomaly involves a letter replaced by wrong letter AND replacement comes later in alphabet AND channel is prime.", "skip if any false."], ru: ["жми, если букву заменили на другую букву И замена идёт позже в алфавите И номер канала — простое число.", "пропусти, если хотя бы одно неверно."] }, rule: (a) => !!a && (a.kind === "swap" || a.kind === "stage-capital-o") && isPrime(a.channelIndex + 1) }
];

export const BOSS_RIDDLES = [
  { lines: { en: ["do not press until timer shows 2:22.", "at that exact moment press if anomaly exists.", "skip if no anomaly."], ru: ["не жми, пока таймер не покажет 2:22.", "ровно в этот момент жми, если аномалия есть.", "пропусти, если аномалии нет."] }, rule: (a, _p, c) => !!a && c.timerMinutes === 2 && Math.floor(c.timerSeconds) % 60 === 22 },
  { lines: { en: ["press if digit 4 appears anywhere in countdown display AND more than 3 anomalies seen this run.", "skip if either false."], ru: ["жми, если цифра 4 появляется где-либо на таймере И ты видел больше 3 аномалий за эту смену.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => { const s = String(Math.ceil(c.timerRemaining)); return s.includes("4") && c.anomaliesSeenThisRun > 3; } },
  { lines: { en: ["answer the phone. voice will say a number.", "press if number is even. skip if odd.", "if no call comes, skip."], ru: ["ответь на телефон. голос назовёт число.", "жми, если число чётное. пропусти, если нечётное.", "если звонка не будет — пропусти."] }, rule: (_a, p) => !!p && p.answered && typeof p.spokenNumber === "number" && p.spokenNumber % 2 === 0, phone: { ringsAt: 1.0, onAnswer: "clue", voiceLine: "The number is six.", spokenNumber: 6 } },
  { lines: { en: ["wait until timer shows three identical digits. 1:11. 2:22. 3:33.", "if anomaly exists at that moment press.", "if not skip."], ru: ["жди, пока таймер не покажет три одинаковые цифры. 1:11. 2:22. 3:33.", "если в этот момент есть аномалия — жми.", "если нет — пропусти."] }, rule: (a, _p, c) => { const m = c.timerMinutes; const s = Math.floor(c.timerSeconds) % 60; return !!a && [1, 2, 3].includes(m) && s === m * 11; } },
  { lines: { en: ["call yourself. if you hear breathing press.", "if silence skip.", "if no answer press only if anomaly is on odd channel."], ru: ["позвони сам. если услышишь дыхание — жми.", "если тишина — пропусти.", "если никто не ответит — жми, только если аномалия на нечётном канале."] }, rule: (a, p) => { if (p && p.answered && p.callContent === "silence") return true; if (!p || !p.answered) return !!a && (a.channelIndex + 1) % 2 === 1; return false; }, phone: { ringsAt: 0.6, onAnswer: "silence", voiceLine: "" } },
  { lines: { en: ["press if stage number multiplied by 2 is greater than remaining timer minutes AND anomaly involves missing element.", "skip if either false."], ru: ["жми, если номер этапа, умноженный на 2, больше оставшихся минут на таймере И что-то пропало.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => (c.stageNumber * 2 > c.timerMinutes) && hasTag(a, "missing") },
  { lines: { en: ["do not answer phone this stage no matter what.", "press if anomaly exists AND channel number is prime.", "skip if either false."], ru: ["не отвечай на телефон на этом этапе, что бы ни было.", "жми, если аномалия есть И номер канала — простое число.", "пропусти, если хотя бы одно неверно."] }, rule: (a, p) => { if (p && p.answered) return false; return !!a && isPrime(a.channelIndex + 1); }, phone: { ringsAt: 1.4, onAnswer: "trap", voiceLine: "Press it. Don't think." } },
  { lines: { en: ["press only if phone rang at least once this stage AND anomaly involves text AND timer shows odd seconds.", "skip if any false."], ru: ["жми, только если телефон звонил хотя бы раз на этом этапе И аномалия в тексте И таймер показывает нечётные секунды.", "пропусти, если хотя бы одно неверно."] }, rule: (a, p, c) => p && p.didRing && hasTag(a, "text") && (c.timerSecondsDigit % 2 === 1), phone: { ringsAt: 0.8, onAnswer: "clue", voiceLine: "Read carefully." } },
  { lines: { en: ["press if sum of current stage number and current channel number is even AND anomaly involves something moving wrong AND you have seen more than 5 anomalies this run.", "skip if any false."], ru: ["жми, если сумма номера текущего этапа и номера текущего канала чётна И что-то движется неправильно И ты видел больше 5 аномалий за эту смену.", "пропусти, если хотя бы одно неверно."] }, rule: (a, _p, c) => !!a && ((c.stageNumber + (a.channelIndex + 1)) % 2 === 0) && (hasTag(a, "moving") || hasTag(a, "speed") || hasTag(a, "direction")) && c.anomaliesSeenThisRun > 5 },
  { lines: { en: ["wait. do nothing. read this three times.", "press if you are completely certain.", "skip if even one doubt exists."], ru: ["подожди. ничего не делай. прочитай это трижды.", "жми, если абсолютно уверен.", "пропусти, если есть хоть одно сомнение."] }, rule: (a) => !!a && !hasTag(a, "subtle") }
];

export function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pickRandomAnomaly() {
  // Pick a random channel, then a random kind from that channel's catalog.
  const channelIndex = Math.floor(Math.random() * CHANNELS.length);
  const pool = ANOMALY_CATALOG[channelIndex] || [];
  if (pool.length === 0) return null;
  const entry = pool[Math.floor(Math.random() * pool.length)];
  return { channelIndex, kind: entry.kind };
}

export function buildStageFromRiddle(riddle, index) {
  // Stage 1 (index 0) is always clean — a tutorial freebie.
  // From stage 2 onward, anomaly probability ramps from rare (~8%) at
  // stage 2 up to ~90% at stage 18.
  let anomaly = null;
  if (!riddle.requireNoAnomaly && index > 0) {
    const t = Math.min(1, Math.max(0, (index - 1) / (TOTAL_STAGES - 2)));
    const probability = 0.08 + (0.90 - 0.08) * t;
    if (Math.random() < probability) {
      anomaly = pickRandomAnomaly();
    }
  }
  const phone = riddle.phone
    ? { ...riddle.phone }
    : riddle.expectRing
      ? { ringsAt: 1.0 + Math.random() * 1.5, onAnswer: "silence", voiceLine: "" }
      : null;
  return {
    title: `Stage ${pad(index + 1)}`,
    // `lines` is the riddle's bilingual text map ({ en: [...], ru: [...] }).
    // Shared by reference is fine — consumers never mutate it.
    lines: riddle.lines,
    anomaly,
    phone,
    rule: riddle.rule,
    _meta: { riddle }
  };
}

export function buildStagesForRun() {
  const easy = shuffleInPlace(EASY_RIDDLES.slice()).slice(0, 6);
  const medium = shuffleInPlace(MEDIUM_RIDDLES.slice()).slice(0, 6);
  const hard = shuffleInPlace(HARD_RIDDLES.slice()).slice(0, 2);
  const boss = shuffleInPlace(BOSS_RIDDLES.slice()).slice(0, 4);
  const picked = [...easy, ...medium, ...hard, ...boss];
  return picked.map((r, i) => buildStageFromRiddle(r, i));
}

// Static data and pure helpers for the typewriter / equation / radar / clock
// channel feeds. These values drive both the canvas rendering and any
// gameplay checks against what the player "should" be seeing.

export const TYPEWRITER_SCRIPT = [
  { type: "text", value: "03:11 replace gasket on north hatch" },
  { type: "pause", duration: 1.2 },
  { type: "newline" },
  { type: "text", value: "03:14 calibrate pressure relay B" },
  { type: "pause", duration: 0.9 },
  { type: "newline" },
  { type: "text", value: "03:17 inspect coolant retun" },
  { type: "pause", duration: 0.6 },
  { type: "backspace", count: 5 },
  { type: "text", value: "return" },
  { type: "text", value: " manifold" },
  { type: "pause", duration: 1.0 },
  { type: "newline" },
  { type: "text", value: "03:19 tighten junction cage screw" },
  { type: "pause", duration: 0.45 },
  { type: "text", value: "s" },
  { type: "pause", duration: 0.9 },
  { type: "newline" },
  { type: "text", value: "03:21 wipe condensation from panel C" },
  { type: "pause", duration: 0.9 },
  { type: "newline" },
  { type: "text", value: "03:24 confirm service corridor seald" },
  { type: "pause", duration: 0.65 },
  { type: "backspace", count: 5 },
  { type: "text", value: "sealed" },
  { type: "pause", duration: 1.2 },
  { type: "newline" },
  { type: "text", value: "03:27 log seal integrity nominal" },
  { type: "pause", duration: 1.8 }
];
export const TYPEWRITER_SPEED = {
  char: 0.2,
  backspace: 0.11,
  newline: 0.28
};
export const EQUATION_FEED_ENTRIES = [
  { a: 3, b: 4, op: "+", result: 7 },
  { a: 9, b: 2, op: "-", result: 7 },
  { a: 5, b: 6, op: "+", result: 11 },
  { a: 8, b: 3, op: "-", result: 5 },
  { a: 7, b: 5, op: "+", result: 12 },
  { a: 6, b: 2, op: "-", result: 4 },
  { a: 4, b: 8, op: "+", result: 12 },
  { a: 9, b: 1, op: "-", result: 8 },
  { a: 2, b: 7, op: "+", result: 9 },
  { a: 8, b: 6, op: "-", result: 2 },
  { a: 1, b: 9, op: "+", result: 10 },
  { a: 7, b: 4, op: "-", result: 3 },
  { a: 6, b: 6, op: "+", result: 12 },
  { a: 5, b: 1, op: "-", result: 4 }
];
export const RADAR_ECHOES = [
  { angle: -2.35, distance: 58, size: 4 },
  { angle: -0.68, distance: 74, size: 4 },
  { angle: 0.84, distance: 49, size: 5 },
  { angle: 1.92, distance: 67, size: 4 },
  { angle: 2.72, distance: 36, size: 3.5 }
];
export const EQUATION_SCROLL_LINES = EQUATION_FEED_ENTRIES.map((entry) => `${entry.a} ${entry.op} ${entry.b} = ${entry.result}`);
export const TYPEWRITER_SCRIPT_DURATION = TYPEWRITER_SCRIPT.reduce((total, step) => {
  if (step.type === "text") return total + step.value.length * TYPEWRITER_SPEED.char;
  if (step.type === "backspace") return total + step.count * TYPEWRITER_SPEED.backspace;
  if (step.type === "newline") return total + TYPEWRITER_SPEED.newline;
  return total + step.duration;
}, 0);

export const CLOCK_REFERENCE_UTC = Date.UTC(2026, 3, 20, 3, 11, 0) / 1000;

export function getClockState(elapsedSeconds, utcOffsetHours, reverse = false) {
  const direction = reverse ? -1 : 1;
  const total = CLOCK_REFERENCE_UTC + elapsedSeconds * direction + utcOffsetHours * 3600;
  const day = ((total % 86400) + 86400) % 86400;
  const hours24 = Math.floor(day / 3600);
  const minutes = Math.floor((day % 3600) / 60);
  const seconds = Math.floor(day % 60);
  const hour12 = hours24 % 12;
  return {
    digital: `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    hourAngle: ((hour12 + minutes / 60 + seconds / 3600) / 12) * Math.PI * 2 - Math.PI / 2,
    minuteAngle: ((minutes + seconds / 60) / 60) * Math.PI * 2 - Math.PI / 2,
    secondAngle: (seconds / 60) * Math.PI * 2 - Math.PI / 2
  };
}

export function getEquationEntry(index) {
  const base = EQUATION_FEED_ENTRIES[((index % EQUATION_FEED_ENTRIES.length) + EQUATION_FEED_ENTRIES.length) % EQUATION_FEED_ENTRIES.length];
  const { a, b, op, result } = base;
  return {
    text: `${a} ${op} ${b} = ${result}`,
    a,
    b,
    op,
    result
  };
}

export function getRadarEcho(index) {
  return RADAR_ECHOES[index % RADAR_ECHOES.length];
}

export function getTypewriterState(now) {
  const loopTime = now % TYPEWRITER_SCRIPT_DURATION;
  let remaining = loopTime;
  let buffer = "";

  const applyFull = (step) => {
    if (step.type === "text") {
      buffer += step.value;
    } else if (step.type === "backspace") {
      buffer = buffer.slice(0, Math.max(0, buffer.length - step.count));
    } else if (step.type === "newline") {
      buffer += "\n";
    }
  };

  for (const step of TYPEWRITER_SCRIPT) {
    const duration = step.type === "text"
      ? step.value.length * TYPEWRITER_SPEED.char
      : step.type === "backspace"
        ? step.count * TYPEWRITER_SPEED.backspace
        : step.type === "newline"
          ? TYPEWRITER_SPEED.newline
          : step.duration;

    if (remaining >= duration) {
      applyFull(step);
      remaining -= duration;
      continue;
    }

    if (step.type === "text") {
      const chars = Math.floor(remaining / TYPEWRITER_SPEED.char);
      buffer += step.value.slice(0, chars);
    } else if (step.type === "backspace") {
      const count = Math.floor(remaining / TYPEWRITER_SPEED.backspace);
      buffer = buffer.slice(0, Math.max(0, buffer.length - count));
    }
    break;
  }

  const lines = buffer.split("\n");
  return {
    lines,
    cursorVisible: Math.floor(now * 2) % 2 === 0
  };
}


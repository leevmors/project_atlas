// Game-wide constants, timing, viewport profiles, and channel metadata.
// Pure data with no runtime state — safe to import anywhere.

export const TOTAL_STAGES = 18;
export const START_TIME = 600;
export const FEED_COUNTDOWN_START = 5400;
export const FRAME_STEP = 1 / 30;
export const SCREEN_REFRESH_DURATION = 5.0;
export const EXPLOSION_DURATION = 1.8;

export const CAMERA_PROFILES = {
  desktop: {
    internalScale: 0.82,
    fov: 54,
    baseCamera: { x: 0, y: 1.42, z: 2.62 },
    baseLook: { x: 0, y: 1.18, z: -0.2 },
    ipadZoomCam: { x: 0.88, y: 1.52, z: 1.32 },
    ipadZoomLook: { x: 0.88, y: 0.95, z: 0.05 }
  },
  tablet: {
    internalScale: 1.0,
    fov: 54,
    // Closer base camera so feeds are readable by default (was z: 3.68)
    baseCamera: { x: 0, y: 1.55, z: 2.9 },
    baseLook: { x: 0, y: 1.35, z: -0.2 },
    // Closer zoom so iPad text is legible (was z: 1.86)
    ipadZoomCam: { x: 0.92, y: 1.45, z: 1.15 },
    ipadZoomLook: { x: 0.92, y: 0.92, z: 0.02 }
  },
  phone: {
    internalScale: 1.0,
    fov: 56,
    // Closer base camera so feeds/buttons are reachable (was z: 4.18)
    baseCamera: { x: 0, y: 1.6, z: 3.05 },
    baseLook: { x: 0, y: 1.4, z: -0.18 },
    // Closer zoom + flatter angle so iPad text is legible (was z: 2.06)
    ipadZoomCam: { x: 0.95, y: 1.4, z: 1.0 },
    ipadZoomLook: { x: 0.95, y: 0.88, z: 0.0 }
  }
};

export const CHANNELS = [
  { name: "Three Clocks", accent: "#f4c684", glow: 0xf2b77a },
  { name: "Money Counter", accent: "#a8df8a", glow: 0x8ec46f },
  { name: "Radar", accent: "#8ee0b0", glow: 0x7ad19f },
  { name: "Equation Feed", accent: "#f2d78c", glow: 0xe5c871 },
  { name: "Typewriter", accent: "#e7c7a2", glow: 0xd9b88e },
  { name: "Countdown", accent: "#ff7a68", glow: 0xff6552 },
  { name: "Alphabet", accent: "#9fc2ff", glow: 0x8fb6f0 }
];

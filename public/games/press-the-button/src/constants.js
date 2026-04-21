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
    internalScale: 0.74,
    fov: 50,
    baseCamera: { x: 0, y: 1.74, z: 3.68 },
    baseLook: { x: 0, y: 1.48, z: -0.22 },
    ipadZoomCam: { x: 0.9, y: 1.63, z: 1.86 },
    ipadZoomLook: { x: 0.88, y: 1.04, z: 0.08 }
  },
  phone: {
    internalScale: 0.66,
    fov: 48,
    baseCamera: { x: 0, y: 1.88, z: 4.18 },
    baseLook: { x: 0, y: 1.58, z: -0.18 },
    ipadZoomCam: { x: 0.88, y: 1.7, z: 2.06 },
    ipadZoomLook: { x: 0.84, y: 1.06, z: 0.1 }
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

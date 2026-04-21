import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/postprocessing/ShaderPass.js";

import {
  TOTAL_STAGES,
  START_TIME,
  FEED_COUNTDOWN_START,
  FRAME_STEP,
  SCREEN_REFRESH_DURATION,
  EXPLOSION_DURATION,
  CAMERA_PROFILES,
  CHANNELS
} from "./constants.js";

import { I18N, currentLang, setCurrentLang } from "./i18n.js";

import {
  audio,
  ensureAudio,
  createNoiseBuffer,
  playSwitch,
  playButton,
  playSuccess,
  playExplosion,
  playFailure,
  playLightning,
  playTablet,
  playPhoneBellPulse,
  playPhonePickup,
  playPhoneHangup,
  playDialTone,
  stopDialTone,
  playPhoneStatic,
  speakPhoneVoice,
  stopPhoneVoice,
  playVictory
} from "./audio.js";


const responsiveState = {
  viewport: "desktop",
  inputMode: "keyboard",
  internalScale: CAMERA_PROFILES.desktop.internalScale
};

function t(key) {
  const dict = I18N[currentLang] || I18N.en;
  return dict[key] ?? I18N.en[key] ?? key;
}

function getInteractionModeSuffix() {
  return responsiveState.inputMode === "touch" ? "touch" : "keyboard";
}

function getInstructionCopy(baseKey) {
  return t(`${baseKey}.${getInteractionModeSuffix()}`);
}

function getTutorialHint(stageKey) {
  return getInstructionCopy(`${stageKey}.hint`);
}

function getPromptText(action = hoverAction) {
  if (action === "red") {
    return t("prompt.red");
  }
  if (action === "skip") {
    return t("prompt.skip");
  }
  if (action === "ipad") {
    return state.ipadZoom ? getInstructionCopy("prompt.ipad.close") : getInstructionCopy("prompt.ipad.open");
  }
  if (action === "phone") {
    if (phoneState.offHook) {
      return getInstructionCopy("prompt.phone.hangup");
    }
    return phoneState.ringing ? getInstructionCopy("prompt.phone.answer") : getInstructionCopy("prompt.phone.pickup");
  }
  return state.ipadZoom ? getInstructionCopy("prompt.ipad.decide") : getInstructionCopy("prompt.default");
}

function updatePromptText(action = hoverAction) {
  if (promptTextEl) {
    promptTextEl.textContent = getPromptText(action);
  }
}

function shouldShowOverlayHint() {
  return responsiveState.inputMode !== "touch" && window.innerHeight > 520;
}

function applyLanguage() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const val = t(key);
    if (val.includes("<")) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });
  document.documentElement.setAttribute("lang", currentLang);
  document.title = t("menu.title");
  document.querySelectorAll(".lang-chip").forEach((el) => {
    el.classList.toggle("active", el.dataset.lang === currentLang);
  });
  // Re-render the How-To-Play body (which contains HTML)
  const howtoBody = document.getElementById("howto-body");
  if (howtoBody) howtoBody.innerHTML = t("howto.body");
  updatePromptText();
  refreshTutorialOverlay();
  // Re-render mission text on language change so riddles reflect new language.
  if (typeof refreshStageText === "function") refreshStageText();
}

function setLang(lang) {
  if (!I18N[lang]) return;
  setCurrentLang(lang);
  try { localStorage.setItem("rss.lang", lang); } catch (e) { /* ignore */ }
  applyLanguage();
}

function hasCompletedTutorial() {
  try { return localStorage.getItem("rss.tutorialDone") === "1"; } catch (e) { return false; }
}

function markTutorialDone() {
  try { localStorage.setItem("rss.tutorialDone", "1"); } catch (e) { /* ignore */ }
  document.body.classList.remove("first-run");
}

import {
  ANOMALY_CATALOG,
  ANOMALY_TAGS,
  hasTag,
  isVowel,
  isPrime,
  anomalyInTopHalf,
  anomalyMissingLetter,
  anomalyNumber,
  STAGE_TEMPLATES,
  EASY_RIDDLES,
  MEDIUM_RIDDLES,
  HARD_RIDDLES,
  BOSS_RIDDLES,
  shuffleInPlace,
  pickRandomAnomaly,
  buildStageFromRiddle,
  buildStagesForRun
} from "./riddles.js";

import {
  TYPEWRITER_SCRIPT,
  TYPEWRITER_SPEED,
  EQUATION_FEED_ENTRIES,
  RADAR_ECHOES,
  EQUATION_SCROLL_LINES,
  TYPEWRITER_SCRIPT_DURATION,
  CLOCK_REFERENCE_UTC,
  getClockState,
  getEquationEntry,
  getRadarEcho,
  getTypewriterState
} from "./feedData.js";

// Placeholder set so page-load render helpers have data until resetRun()
// rebuilds STAGES from the shuffled riddle pools when a shift begins.
let STAGES = STAGE_TEMPLATES.slice();

const timerValueEl = document.getElementById("timer-value");
const channelValueEl = document.getElementById("channel-value");
const menuToggleButton = document.getElementById("menu-toggle");
const promptTextEl = document.getElementById("prompt-text");
const touchButtons = Array.from(document.querySelectorAll(".touch-button"));
const notePanelEl = document.getElementById("note-panel");
const noteStageEl = document.getElementById("note-stage");
const noteTitleEl = document.getElementById("note-title");
const noteBodyEl = document.getElementById("note-body");
const noteFooterEl = document.getElementById("note-footer");
const messageEl = document.getElementById("message");
const bootEl = document.getElementById("boot");
const pauseMenuEl = document.getElementById("pause-menu");
const endingEl = document.getElementById("ending");
const endingKickerEl = document.getElementById("ending-kicker");
const endingTitleEl = document.getElementById("ending-title");
const endingBodyEl = document.getElementById("ending-body");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const dismissButton = document.getElementById("dismiss-button");
const menuButton = document.getElementById("menu-button");
const pauseResumeButton = document.getElementById("pause-resume");
const pauseRestartButton = document.getElementById("pause-restart");
const pauseMainMenuButton = document.getElementById("pause-main-menu");
const pauseHowtoButton = document.getElementById("pause-howto");
const tutorialButton = document.getElementById("tutorial-button");
const howtoButton = document.getElementById("howto-button");
const howtoEl = document.getElementById("howto");
const howtoCloseButton = document.getElementById("howto-close");
const tutorialOverlayEl = document.getElementById("tutorial-overlay");
const tutorialTitleEl = document.getElementById("tutorial-title");
const tutorialBodyEl = document.getElementById("tutorial-body");
const tutorialHintEl = document.getElementById("tutorial-hint");
const tutorialProgressEl = document.getElementById("tutorial-progress");

const monitorCanvas = document.createElement("canvas");
monitorCanvas.width = 512;
monitorCanvas.height = 384;
const monitorCtx = monitorCanvas.getContext("2d");
monitorCtx.imageSmoothingEnabled = false;

const ipadCanvas = document.createElement("canvas");
ipadCanvas.width = 384;
ipadCanvas.height = 512;
const ipadCtx = ipadCanvas.getContext("2d");
ipadCtx.imageSmoothingEnabled = true;

const windowCanvas = document.createElement("canvas");
windowCanvas.width = 512;
windowCanvas.height = 256;
const windowCtx = windowCanvas.getContext("2d");
windowCtx.imageSmoothingEnabled = false;

const timerCanvas = document.createElement("canvas");
timerCanvas.width = 512;
timerCanvas.height = 160;
const timerCtx = timerCanvas.getContext("2d");
timerCtx.imageSmoothingEnabled = false;

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(1);
renderer.setClearColor(0x030405, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.7;
renderer.domElement.id = "game";
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x101922, 5.8, 18.4);

const camera = new THREE.PerspectiveCamera(CAMERA_PROFILES.desktop.fov, window.innerWidth / Math.max(window.innerHeight, 1), 0.1, 25);
const baseCamera = new THREE.Vector3();
const baseLook = new THREE.Vector3();
const currentLook = new THREE.Vector3();
const targetLook = new THREE.Vector3();
const pointerNdc = new THREE.Vector2();
const pointerDrift = new THREE.Vector2();
const ipadOffset = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
raycaster.far = 8;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const warmDustColor = new THREE.Color(0xffdead);
const coolDustColor = new THREE.Color(0xd7ebff);

const filmPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    flash: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float flash;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = vUv;
      vec2 curved = uv * 2.0 - 1.0;
      curved *= 1.0 + dot(curved, curved) * 0.035;
      curved = curved * 0.5 + 0.5;

      vec4 color = texture2D(tDiffuse, clamp(curved, 0.0, 1.0));
      float scan = sin((uv.y + time * 0.6) * 900.0) * 0.004;
      float vignette = smoothstep(1.12, 0.14, distance(uv, vec2(0.5)));

      color.rgb += scan;
      color.rgb += flash * vec3(0.04, 0.045, 0.06);
      color.rgb *= mix(0.98, 1.0, vignette);
      color.rgb *= 1.44;
      color.rgb = floor(color.rgb * 28.0) / 28.0;

      if (curved.x < 0.0 || curved.x > 1.0 || curved.y < 0.0 || curved.y > 1.0) {
        color.rgb *= 0.12;
      }

      gl_FragColor = color;
    }
  `
});
composer.addPass(filmPass);

const ambientLight = new THREE.HemisphereLight(0xa4becd, 0x243039, 1.06);
scene.add(ambientLight);

const roomLight = new THREE.AmbientLight(0x44525d, 1.14);
scene.add(roomLight);

const monitorLight = new THREE.PointLight(0xff9b70, 2.2, 10.8, 1.9);
monitorLight.position.set(0, 2.02, 0.42);
scene.add(monitorLight);

const buttonLight = new THREE.PointLight(0xc73f2c, 0.72, 2.8, 2.1);
buttonLight.position.set(-0.5, 1.1, 0.22);
scene.add(buttonLight);

const skipLight = new THREE.PointLight(0x4fa1c4, 0.72, 2.4, 2.2);
skipLight.position.set(0.12, 1.1, 0.22);
scene.add(skipLight);

const stormWindowLight = new THREE.PointLight(0xa9ddf0, 2.18, 13.2, 1.4);
stormWindowLight.position.set(0, 2.06, -1.55);
scene.add(stormWindowLight);

const stormRimLight = new THREE.PointLight(0x7497ad, 0.96, 10.2, 1.75);
stormRimLight.position.set(0, 2.5, 1.5);
scene.add(stormRimLight);

const lightningLight = new THREE.PointLight(0xb7e6ff, 0, 11, 2);
lightningLight.position.set(0, 2.15, -2.3);
scene.add(lightningLight);

const roomGroup = new THREE.Group();
scene.add(roomGroup);

const monitorTexture = new THREE.CanvasTexture(monitorCanvas);
monitorTexture.colorSpace = THREE.SRGBColorSpace;
monitorTexture.minFilter = THREE.NearestFilter;
monitorTexture.magFilter = THREE.NearestFilter;

const ipadTexture = new THREE.CanvasTexture(ipadCanvas);
ipadTexture.colorSpace = THREE.SRGBColorSpace;
ipadTexture.minFilter = THREE.LinearFilter;
ipadTexture.magFilter = THREE.LinearFilter;

const windowTexture = new THREE.CanvasTexture(windowCanvas);
windowTexture.colorSpace = THREE.SRGBColorSpace;
windowTexture.minFilter = THREE.LinearFilter;
windowTexture.magFilter = THREE.LinearFilter;

const timerTexture = new THREE.CanvasTexture(timerCanvas);
timerTexture.colorSpace = THREE.SRGBColorSpace;
timerTexture.minFilter = THREE.NearestFilter;
timerTexture.magFilter = THREE.NearestFilter;

const woodTexture = createWoodTexture();
const concreteTexture = createConcreteTexture();
const dustSprite = createDustSprite();
const labelTexture = createLabelTexture("SKIP", "#171d22", "#d9ccb0");
const redLabelTexture = createLabelTexture("RED", "#20100d", "#f2d6b1");

const materials = {
  desk: new THREE.MeshStandardMaterial({ map: woodTexture, color: 0x4d3528, roughness: 0.84, metalness: 0.06 }),
  wall: new THREE.MeshStandardMaterial({ map: concreteTexture, color: 0x2d3134, roughness: 0.92, metalness: 0.04 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x444b50, roughness: 0.42, metalness: 0.78 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x22272b, roughness: 0.6, metalness: 0.74 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x17191b, roughness: 0.95, metalness: 0.02 }),
  monitorScreen: new THREE.MeshBasicMaterial({
    map: monitorTexture,
    toneMapped: false
  }),
  window: new THREE.MeshBasicMaterial({ map: windowTexture, color: 0xbfe7ff, transparent: true }),
  timerScreen: new THREE.MeshBasicMaterial({
    map: timerTexture,
    toneMapped: false
  }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0x91b5c0,
    roughness: 0.12,
    metalness: 0,
    transparent: true,
    opacity: 0.035,
    transmission: 0.04
  }),
  ipadBody: new THREE.MeshStandardMaterial({ color: 0x14181b, roughness: 0.8, metalness: 0.3, emissive: new THREE.Color(0x121820) }),
  ipadScreen: new THREE.MeshBasicMaterial({
    map: ipadTexture,
    toneMapped: false,
    side: THREE.DoubleSide,
    color: 0xffffff,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  }),
  redButton: new THREE.MeshStandardMaterial({ color: 0xc73f2c, roughness: 0.18, metalness: 0.16, emissive: new THREE.Color(0x41110c) }),
  skipButton: new THREE.MeshStandardMaterial({ color: 0x587484, roughness: 0.28, metalness: 0.38, emissive: new THREE.Color(0x0c1a24) })
};

const interactiveMeshes = [];
const interactiveGroups = {
  red: [],
  skip: [],
  ipad: [],
  phone: []
};

let redButtonCap;
let redButtonLabel;
let skipButtonCap;
let ipadGroup;
let ipadAnchor = null;
let ipadFloat = 0;
let ipadLight;
let phoneGroup;
let phoneHandset;
let phoneHandsetAnchor = null;
let phoneDial;
let phoneLight;
let phoneCord;
const phoneState = {
  ringing: false,
  ringClock: 0,
  ringJitter: 0,
  ringBellTimer: 0,
  offHook: false,
  callType: null, // "incoming" | "outgoing" | null
  callContent: null, // "clue" | "trap" | "silence" | "info"
  voiceLine: "",
  answered: false,
  ignored: false,
  dialedDigit: null,
  callPlayed: false
};
let monitorGlass;
let timerScreen;
let timerGlowLight;
let dust;
let dustVelocities = [];
let windowRain = [];
let windowGlassDrops = [];
let windowSplashes = [];
let lightningCooldown = 2.5 + Math.random() * 4;
let lightningTimer = 0;
let lightningStrength = 0;
let lightningTriggered = false;
let messageTimer = 0;
let hoverAction = null;
let shakeStrength = 0;
let redPress = 0;
let skipPress = 0;
let lastTime = performance.now() / 1000;
let stepAccumulator = 0;
let updateFrameCounter = 0;

const state = {
  started: false,
  finished: false,
  won: false,
  endReason: "timer",
  refreshTimer: 0,
  stageIndex: 0,
  timer: START_TIME,
  currentChannel: 0,
  ipadOpen: false,
  exploding: false,
  explosionTimer: 0,
  renewalStageIndex: 1,
  sparks: [],
  ipadZoom: false,
  monitorZoom: false,
  // per-stage tracking
  channelsVisited: new Set(),
  channelVisitOrder: [],
  firstVisitedChannel: 0,
  lastVisitedChannel: 0,
  ipadOpenedThisStage: false,
  ipadOpenedBeforeScan: false,
  stageClock: 0,
  phoneRingAt: null,
  // per-run tracking
  anomaliesSeenThisRun: 0,
  phoneRangThisRun: false,
  // tutorial mode
  tutorial: false,
  tutorialStepIndex: 0,
  menuOpen: false
};

const ipadZoomCam = new THREE.Vector3();
const ipadZoomLook = new THREE.Vector3();
const monitorZoomCam = new THREE.Vector3();
const monitorZoomLook = new THREE.Vector3();
let cameraBlend = 0;
let monitorBlend = 0;

buildScene();
createRainState();
refreshStageText();
refreshHud();
drawIpadScreen(0);
drawWindow(0);
drawTimerScreen(0);
drawMonitor(0);
resizeRenderer();
requestAnimationFrame(loop);

// --- Menu / tutorial / language bootstrap ---
try {
  const savedLang = localStorage.getItem("rss.lang");
  if (savedLang && I18N[savedLang]) setCurrentLang(savedLang);
} catch (e) { /* ignore */ }
applyLanguage();
if (!hasCompletedTutorial()) {
  document.body.classList.add("first-run");
  startButton.classList.add("locked");
}

startButton.addEventListener("click", () => {
  if (!hasCompletedTutorial()) {
    showMessage(t("menu.firstRunNote"), "warn", 2.6);
    startTutorial();
    return;
  }
  startShift();
});
restartButton.addEventListener("click", restartShift);
dismissButton.addEventListener("click", () => {
  endingEl.classList.remove("visible");
});
if (menuButton) {
  menuButton.addEventListener("click", () => {
    endingEl.classList.remove("visible");
    returnToMenu();
  });
}
if (menuToggleButton) {
  menuToggleButton.addEventListener("click", () => {
    ensureAudio();
    togglePauseMenu();
  });
}
if (pauseResumeButton) {
  pauseResumeButton.addEventListener("click", () => {
    closePauseMenu();
  });
}
if (pauseRestartButton) {
  pauseRestartButton.addEventListener("click", () => {
    closePauseMenu();
    restartShift();
  });
}
if (pauseMainMenuButton) {
  pauseMainMenuButton.addEventListener("click", () => {
    closePauseMenu();
    returnToMenu();
  });
}
if (pauseHowtoButton) {
  pauseHowtoButton.addEventListener("click", () => {
    howtoEl.classList.add("visible");
  });
}
tutorialButton.addEventListener("click", () => {
  ensureAudio();
  startTutorial();
});
howtoButton.addEventListener("click", () => {
  howtoEl.classList.add("visible");
});
howtoCloseButton.addEventListener("click", () => {
  howtoEl.classList.remove("visible");
});
document.querySelectorAll(".lang-chip").forEach((el) => {
  el.addEventListener("click", (ev) => {
    ev.stopPropagation();
    setLang(el.dataset.lang);
  });
});

for (const button of touchButtons) {
  button.addEventListener("click", () => {
    if (!state.started) {
      startShift();
      return;
    }
    ensureAudio();
    const action = button.dataset.action;
    if (action === "prev") {
      cycleChannel(-1);
    } else if (action === "next") {
      cycleChannel(1);
    } else if (action === "ipad") {
      toggleIpad();
    } else if (action === "skip") {
      decide("skip");
    } else if (action === "red") {
      decide("red");
    }
  });
}

window.addEventListener("resize", resizeRenderer);
window.addEventListener("orientationchange", resizeRenderer);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerdown", onPointerDown);
window.addEventListener("keydown", onKeyDown);

function createWoodTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#2a1a13";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 4) {
    const shade = 32 + Math.sin(y * 0.08) * 8 + Math.random() * 8;
    ctx.fillStyle = `rgb(${shade + 26}, ${shade + 12}, ${shade})`;
    ctx.fillRect(0, y, canvas.width, 4);
  }

  for (let i = 0; i < 180; i += 1) {
    ctx.strokeStyle = `rgba(${90 + Math.random() * 40}, ${55 + Math.random() * 30}, ${30 + Math.random() * 20}, 0.18)`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    const startX = Math.random() * canvas.width;
    const startY = Math.random() * canvas.height;
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX + 40 + Math.random() * 120,
      startY + Math.random() * 30,
      startX + 80 + Math.random() * 120,
      startY - 20 + Math.random() * 50,
      startX + 150 + Math.random() * 160,
      startY + Math.random() * 18
    );
    ctx.stroke();
  }

  for (let i = 0; i < 55; i += 1) {
    ctx.strokeStyle = "rgba(225, 210, 182, 0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.moveTo(x, y);
    ctx.lineTo(x + 40 + Math.random() * 60, y + (Math.random() - 0.5) * 18);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createConcreteTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 38 + Math.floor(Math.random() * 30);
    image.data[i] = value;
    image.data[i + 1] = value + 4;
    image.data[i + 2] = value + 7;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  for (let i = 0; i < 70; i += 1) {
    ctx.strokeStyle = `rgba(${70 + Math.random() * 35}, ${76 + Math.random() * 35}, ${84 + Math.random() * 35}, 0.16)`;
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 120, y + 20 + Math.random() * 110);
    ctx.stroke();
  }

  for (let i = 0; i < 18; i += 1) {
    ctx.strokeStyle = "rgba(15, 18, 20, 0.38)";
    ctx.lineWidth = 2;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 18 + Math.random() * 55, y + 30 + Math.random() * 55);
    ctx.lineTo(x + 8 + Math.random() * 35, y + 50 + Math.random() * 100);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.5, 2.8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createDustSprite() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 244, 208, 0.75)");
  gradient.addColorStop(0.35, "rgba(255, 224, 173, 0.2)");
  gradient.addColorStop(1, "rgba(255, 224, 173, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLabelTexture(text, background, foreground) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, 0, canvas.width, 20);
  ctx.strokeStyle = "rgba(215,201,169,0.18)";
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  ctx.fillStyle = foreground;
  ctx.font = "bold 34px Cascadia Code, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 3);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildScene() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 8.5), materials.wall);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  roomGroup.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 8.5), materials.wall);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3.25;
  roomGroup.add(ceiling);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.3), materials.wall);
  backWall.position.set(0, 1.64, -2.56);
  roomGroup.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 3.3), materials.wall);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-3.65, 1.64, 0.2);
  roomGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 3.3), materials.wall);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(3.65, 1.64, 0.2);
  roomGroup.add(rightWall);

  const windowFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x1b2126, roughness: 0.7, metalness: 0.3 });
  const windowBack = new THREE.Mesh(new THREE.PlaneGeometry(4.35, 2.46), materials.window);
  windowBack.position.set(0, 1.92, -2.49);
  roomGroup.add(windowBack);

  const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(4.28, 2.38), new THREE.MeshPhysicalMaterial({
    color: 0xa3cfe0,
    roughness: 0.1,
    metalness: 0,
    transparent: true,
    opacity: 0.13,
    transmission: 0.1
  }));
  windowGlass.position.set(0, 1.92, -2.42);
  roomGroup.add(windowGlass);

  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(4.52, 0.1, 0.18), windowFrameMaterial);
  frameTop.position.set(0, 3.17, -2.38);
  roomGroup.add(frameTop);
  const frameBottom = frameTop.clone();
  frameBottom.position.set(0, 0.67, -2.38);
  roomGroup.add(frameBottom);
  const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.58, 0.18), windowFrameMaterial);
  frameLeft.position.set(-2.22, 1.92, -2.38);
  roomGroup.add(frameLeft);
  const frameRight = frameLeft.clone();
  frameRight.position.set(2.22, 1.92, -2.38);
  roomGroup.add(frameRight);
  const frameVertical = frameLeft.clone();
  frameVertical.scale.set(0.65, 1, 1);
  frameVertical.position.set(0, 1.92, -2.39);
  roomGroup.add(frameVertical);
  const frameVerticalLeft = frameVertical.clone();
  frameVerticalLeft.position.x = -1.08;
  roomGroup.add(frameVerticalLeft);
  const frameVerticalRight = frameVertical.clone();
  frameVerticalRight.position.x = 1.08;
  roomGroup.add(frameVerticalRight);

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.12, 1.55), materials.desk);
  deskTop.position.set(0, 0.88, 0.1);
  roomGroup.add(deskTop);

  const deskApron = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.18, 0.14), materials.desk);
  deskApron.position.set(0, 0.77, 0.82);
  roomGroup.add(deskApron);

  const legGeometry = new THREE.BoxGeometry(0.13, 0.76, 0.13);
  for (const [x, z] of [
    [-1.32, -0.48],
    [1.32, -0.48],
    [-1.32, 0.66],
    [1.32, 0.66]
  ]) {
    const leg = new THREE.Mesh(legGeometry, materials.desk);
    leg.position.set(x, 0.44, z);
    roomGroup.add(leg);
  }

  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.16, 0.8), materials.rubber);
  chairSeat.position.set(0, 0.67, 2.18);
  roomGroup.add(chairSeat);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.82, 0.12), materials.rubber);
  chairBack.position.set(0, 1.1, 2.48);
  roomGroup.add(chairBack);
  const chairArmGeometry = new THREE.BoxGeometry(0.12, 0.34, 0.68);
  const armLeft = new THREE.Mesh(chairArmGeometry, materials.darkMetal);
  armLeft.position.set(-0.56, 0.87, 2.12);
  roomGroup.add(armLeft);
  const armRight = armLeft.clone();
  armRight.position.x = 0.56;
  roomGroup.add(armRight);

  const monitorBase = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.25, 0.06, 22), materials.darkMetal);
  monitorBase.position.set(0, 0.97, -0.22);
  roomGroup.add(monitorBase);

  const monitorStem = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.12), materials.darkMetal);
  monitorStem.position.set(0, 1.2, -0.22);
  roomGroup.add(monitorStem);

  const monitorBody = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.32, 0.42), materials.darkMetal);
  monitorBody.position.set(0, 1.64, -0.38);
  roomGroup.add(monitorBody);

  const timerMount = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.08), materials.darkMetal);
  timerMount.position.set(0, 2.26, -0.3);
  roomGroup.add(timerMount);
  const timerArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.08), materials.darkMetal);
  timerArm.position.set(0, 2.36, -0.29);
  roomGroup.add(timerArm);
  const timerBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.34, 0.22), materials.darkMetal);
  timerBody.position.set(0, 2.5, -0.34);
  roomGroup.add(timerBody);
  const timerFrame = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.2, 0.04), new THREE.MeshStandardMaterial({
    color: 0x11090a,
    roughness: 0.55,
    metalness: 0.08
  }));
  timerFrame.position.set(0, 2.5, -0.21);
  roomGroup.add(timerFrame);
  timerScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.16), materials.timerScreen);
  timerScreen.position.set(0, 2.5, -0.18);
  roomGroup.add(timerScreen);
  timerGlowLight = new THREE.PointLight(0xff4638, 0.42, 2.6, 2.2);
  timerGlowLight.position.set(0, 2.5, 0.02);
  scene.add(timerGlowLight);
  timerGlowLight.visible = false;

  const monitorFrameInner = new THREE.Mesh(new THREE.BoxGeometry(1.57, 1.04, 0.08), new THREE.MeshStandardMaterial({
    color: 0x111417,
    roughness: 0.6,
    metalness: 0.12
  }));
  monitorFrameInner.position.set(0, 1.64, -0.15);
  roomGroup.add(monitorFrameInner);

  const monitorScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 0.92), materials.monitorScreen);
  monitorScreen.position.set(0, 1.64, -0.1);
  roomGroup.add(monitorScreen);

  monitorGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.53, 0.96), materials.glass);
  monitorGlass.position.set(0, 1.64, -0.06);
  roomGroup.add(monitorGlass);
  monitorGlass.visible = false;

  redButtonCap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.12, 32), materials.redButton);
  redButtonCap.position.set(-0.5, 1.0, 0.22);
  roomGroup.add(redButtonCap);

  const redButtonBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.14, 32), materials.darkMetal);
  redButtonBase.position.set(-0.5, 0.93, 0.22);
  roomGroup.add(redButtonBase);

  redButtonLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.17), new THREE.MeshBasicMaterial({ map: redLabelTexture, toneMapped: false }));
  redButtonLabel.position.set(-0.5, 1.001, 0.56);
  redButtonLabel.rotation.x = -Math.PI / 2;
  roomGroup.add(redButtonLabel);

  const skipHousing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.18), materials.darkMetal);
  skipHousing.position.set(0.12, 0.95, 0.22);
  roomGroup.add(skipHousing);

  skipButtonCap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.14), materials.skipButton);
  skipButtonCap.position.set(0.12, 1.0, 0.22);
  roomGroup.add(skipButtonCap);

  ipadGroup = new THREE.Group();
  ipadGroup.position.set(0.88, 0.968, 0.28);
  ipadGroup.rotation.set(0, 0, 0);
  roomGroup.add(ipadGroup);
  ipadAnchor = {
    position: ipadGroup.position.clone(),
    quaternion: ipadGroup.quaternion.clone()
  };

  const ipadBody = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.045, 0.98), materials.ipadBody);
  ipadGroup.add(ipadBody);
  const ipadBezel = new THREE.Mesh(new THREE.PlaneGeometry(0.67, 0.92), new THREE.MeshStandardMaterial({
    color: 0x070a0d,
    roughness: 0.52,
    metalness: 0.12,
    emissive: new THREE.Color(0x0c151d),
    emissiveIntensity: 0.42
  }));
  ipadBezel.position.set(0, 0.024, 0);
  ipadBezel.rotation.x = -Math.PI / 2;
  ipadGroup.add(ipadBezel);
  const ipadScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.87), materials.ipadScreen);
  ipadScreen.position.set(0, 0.036, 0);
  ipadScreen.rotation.x = -Math.PI / 2;
  ipadGroup.add(ipadScreen);
  ipadLight = new THREE.PointLight(0x91d4f0, 0.9, 2.4, 2.1);
  ipadLight.position.set(0.88, 1.12, 0.28);
  scene.add(ipadLight);

  const pipeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 12);
  const leftPipe = new THREE.Mesh(pipeGeometry, materials.metal);
  leftPipe.position.set(-2.58, 1.42, -0.92);
  roomGroup.add(leftPipe);
  const topPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 12), materials.metal);
  topPipe.rotation.z = Math.PI / 2;
  topPipe.position.set(-2.1, 2.34, -0.96);
  roomGroup.add(topPipe);
  const sidePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 12), materials.metal);
  sidePipe.rotation.x = Math.PI / 2;
  sidePipe.position.set(2.2, 1.86, -1.58);
  roomGroup.add(sidePipe);

  addWire([
    new THREE.Vector3(2.8, 2.65, -2.1),
    new THREE.Vector3(2.1, 2.3, -1.2),
    new THREE.Vector3(1.7, 2.05, -0.4),
    new THREE.Vector3(1.35, 1.16, -0.02)
  ]);
  addWire([
    new THREE.Vector3(-2.8, 2.38, -2.1),
    new THREE.Vector3(-2.0, 2.02, -1.3),
    new THREE.Vector3(-1.5, 1.86, -0.5),
    new THREE.Vector3(-0.8, 1.0, 0.12)
  ]);

  // === ROTARY TELEPHONE (left side of desk) ===
  phoneGroup = new THREE.Group();
  phoneGroup.position.set(-1.18, 0.94, 0.12);
  roomGroup.add(phoneGroup);

  const bakeliteMat = new THREE.MeshStandardMaterial({
    color: 0x1a1316,
    roughness: 0.38,
    metalness: 0.24,
    emissive: new THREE.Color(0x070408),
    emissiveIntensity: 0.4
  });
  const bakeliteDetailMat = new THREE.MeshStandardMaterial({
    color: 0x221a1d,
    roughness: 0.36,
    metalness: 0.3
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x8a6a3c,
    roughness: 0.38,
    metalness: 0.86,
    emissive: new THREE.Color(0x120a04)
  });
  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x0c0a0c,
    roughness: 0.86,
    metalness: 0.08
  });

  // Base body — sloped top front to back like a classic rotary
  const baseBody = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.3), bakeliteMat);
  baseBody.position.set(0, 0.05, 0);
  phoneGroup.add(baseBody);

  // Slight taper block on top front
  const baseFront = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.14), bakeliteMat);
  baseFront.position.set(0, 0.12, 0.06);
  baseFront.rotation.x = -0.18;
  phoneGroup.add(baseFront);

  // Back cradle hump
  const cradleHump = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.12), bakeliteMat);
  cradleHump.position.set(0, 0.14, -0.08);
  phoneGroup.add(cradleHump);

  // Two cradle pegs
  const pegGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.018, 16);
  const pegLeft = new THREE.Mesh(pegGeo, bakeliteDetailMat);
  pegLeft.position.set(-0.12, 0.19, -0.08);
  phoneGroup.add(pegLeft);
  const pegRight = new THREE.Mesh(pegGeo, bakeliteDetailMat);
  pegRight.position.set(0.12, 0.19, -0.08);
  phoneGroup.add(pegRight);

  // Rotary dial
  phoneDial = new THREE.Group();
  phoneDial.position.set(0, 0.11, 0.05);
  phoneDial.rotation.x = -0.18;
  phoneGroup.add(phoneDial);

  const dialPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.016, 40), bakeliteDetailMat);
  dialPlate.rotation.x = Math.PI / 2;
  phoneDial.add(dialPlate);

  // Brass ring under the dial
  const brassRing = new THREE.Mesh(new THREE.RingGeometry(0.092, 0.1, 48), brassMat);
  brassRing.rotation.x = -Math.PI / 2;
  brassRing.position.y = 0.009;
  phoneDial.add(brassRing);

  // 10 finger holes 1-0 around the dial
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x040406,
    roughness: 0.95,
    metalness: 0
  });
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2 + 0.35;
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.02, 16), holeMat);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(Math.cos(angle) * 0.066, 0, Math.sin(angle) * 0.066);
    phoneDial.add(hole);
  }

  // Dial center cap (brass hub)
  const dialHub = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.012, 28), brassMat);
  dialHub.rotation.x = Math.PI / 2;
  dialHub.position.y = 0.012;
  phoneDial.add(dialHub);

  // Finger stop (small brass post at lower-right)
  const fingerStop = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.02, 0.026), brassMat);
  fingerStop.position.set(0.098, 0.016, 0.048);
  phoneDial.add(fingerStop);

  // Handset — curved receiver
  phoneHandset = new THREE.Group();
  phoneHandset.position.set(0, 0.21, -0.08);
  phoneGroup.add(phoneHandset);
  phoneHandsetAnchor = {
    position: phoneHandset.position.clone(),
    rotation: phoneHandset.rotation.clone()
  };

  const earpiece = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), bakeliteMat);
  earpiece.position.set(-0.13, 0, 0);
  earpiece.scale.set(1, 0.78, 1);
  phoneHandset.add(earpiece);
  const earpieceCap = new THREE.Mesh(new THREE.CircleGeometry(0.028, 18), new THREE.MeshStandardMaterial({
    color: 0x050404,
    roughness: 0.92
  }));
  earpieceCap.position.set(-0.13, 0.026, 0);
  earpieceCap.rotation.x = -Math.PI / 2;
  phoneHandset.add(earpieceCap);

  const mouthpiece = earpiece.clone();
  mouthpiece.position.set(0.13, 0, 0);
  phoneHandset.add(mouthpiece);
  const mouthpieceCap = earpieceCap.clone();
  mouthpieceCap.position.set(0.13, 0.026, 0);
  phoneHandset.add(mouthpieceCap);

  // Handset shaft — slight arc
  const shaftGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.22, 18);
  const shaft = new THREE.Mesh(shaftGeo, bakeliteMat);
  shaft.rotation.z = Math.PI / 2;
  phoneHandset.add(shaft);

  // Curly cord between handset and base back
  const cordPoints = [];
  for (let i = 0; i < 28; i += 1) {
    const t = i / 27;
    const wiggle = Math.sin(t * Math.PI * 7) * 0.018;
    const x = 0.13 + t * -0.22;
    const y = 0.2 + wiggle * 0.6 - t * 0.08;
    const z = -0.08 + wiggle - t * 0.04;
    cordPoints.push(new THREE.Vector3(x, y, z));
  }
  const cordCurve = new THREE.CatmullRomCurve3(cordPoints);
  phoneCord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 48, 0.008, 8, false), cordMat);
  phoneGroup.add(phoneCord);

  // Ring light (glows when ringing)
  phoneLight = new THREE.PointLight(0xffa86a, 0, 2.2, 2.2);
  phoneLight.position.set(0, 0.22, 0);
  phoneGroup.add(phoneLight);

  // Tiny brass number card below the dial
  const numCard = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.035), new THREE.MeshStandardMaterial({
    color: 0xe8d5a8,
    roughness: 0.7,
    metalness: 0.1,
    emissive: new THREE.Color(0x1a120a),
    emissiveIntensity: 0.3
  }));
  numCard.position.set(0, 0.101, -0.06);
  numCard.rotation.x = -Math.PI / 2;
  phoneGroup.add(numCard);

  const dustGeometry = new THREE.BufferGeometry();
  const dustCount = 100;
  const positions = new Float32Array(dustCount * 3);
  dustVelocities = [];
  for (let i = 0; i < dustCount; i += 1) {
    const ix = i * 3;
    positions[ix] = (Math.random() - 0.5) * 4.4;
    positions[ix + 1] = 0.6 + Math.random() * 2.1;
    positions[ix + 2] = -1.9 + Math.random() * 4.6;
    dustVelocities.push({
      x: (Math.random() - 0.5) * 0.02,
      y: 0.008 + Math.random() * 0.015,
      z: (Math.random() - 0.5) * 0.018
    });
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({
      map: dustSprite,
      color: 0xf5d9a6,
      size: 0.06,
      transparent: true,
      opacity: 0.21,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })
  );
  roomGroup.add(dust);

  markInteractive(redButtonCap, "red", "Red button", [redButtonCap]);
  markInteractive(skipButtonCap, "skip", "Skip switch", [skipButtonCap]);
  markInteractive(ipadBody, "ipad", "Lift iPad", [ipadBody]);
  markInteractive(ipadScreen, "ipad", "Lift iPad", [ipadBody]);
  markInteractive(monitorScreen, "monitor", "Lean in", [monitorScreen]);
  markInteractive(monitorGlass, "monitor", "Lean in", [monitorScreen]);
  markInteractive(baseBody, "phone", "Telephone", [baseBody, cradleHump]);
  markInteractive(cradleHump, "phone", "Telephone", [baseBody, cradleHump]);
  markInteractive(earpiece, "phone", "Telephone", [baseBody, cradleHump]);
  markInteractive(mouthpiece, "phone", "Telephone", [baseBody, cradleHump]);
  markInteractive(shaft, "phone", "Telephone", [baseBody, cradleHump]);
}

function addWire(points) {
  const wireGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, 0.015, 6, false);
  const wire = new THREE.Mesh(
    wireGeometry,
    new THREE.MeshStandardMaterial({ color: 0x121416, roughness: 0.86, metalness: 0.1 })
  );
  roomGroup.add(wire);
}

function markInteractive(mesh, action, label, highlightTargets) {
  mesh.userData.action = action;
  mesh.userData.label = label;
  interactiveMeshes.push(mesh);
  interactiveGroups[action] = highlightTargets;
}

function createRainState() {
  windowRain = [];
  for (let i = 0; i < 120; i += 1) {
    windowRain.push({
      x: Math.random() * windowCanvas.width,
      y: Math.random() * windowCanvas.height,
      len: 28 + Math.random() * 78,
      speed: 220 + Math.random() * 360,
      alpha: 0.32 + Math.random() * 0.42
    });
  }

  windowGlassDrops = [];
  for (let i = 0; i < 28; i += 1) {
    windowGlassDrops.push({
      x: Math.random() * windowCanvas.width,
      y: Math.random() * windowCanvas.height,
      r: 1.8 + Math.random() * 3.4,
      speed: 6 + Math.random() * 26,
      trail: Math.random() * 40
    });
  }

  windowSplashes = [];
}

function spawnWindowSplash(x, y) {
  windowSplashes.push({
    x,
    y,
    life: 0.32 + Math.random() * 0.18,
    maxLife: 0.5,
    radius: 2 + Math.random() * 2
  });
}

function getViewportProfile(width, height, inputMode = detectInputMode()) {
  if (width <= 680 || height <= 520) {
    return "phone";
  }
  if (width <= 1100 || (inputMode === "touch" && width <= 1280)) {
    return "tablet";
  }
  return "desktop";
}

function detectInputMode() {
  const isTouch = window.matchMedia("(pointer: coarse)").matches
    || window.matchMedia("(any-pointer: coarse)").matches
    || navigator.maxTouchPoints > 0;
  return isTouch ? "touch" : "keyboard";
}

function applyCameraProfile(profileName) {
  const profile = CAMERA_PROFILES[profileName];
  responsiveState.viewport = profileName;
  responsiveState.internalScale = profile.internalScale;
  camera.fov = profile.fov;
  baseCamera.set(profile.baseCamera.x, profile.baseCamera.y, profile.baseCamera.z);
  baseLook.set(profile.baseLook.x, profile.baseLook.y, profile.baseLook.z);
  ipadZoomCam.set(profile.ipadZoomCam.x, profile.ipadZoomCam.y, profile.ipadZoomCam.z);
  ipadZoomLook.set(profile.ipadZoomLook.x, profile.ipadZoomLook.y, profile.ipadZoomLook.z);
  // Monitor "lean in": pull camera partway toward the CRT (z=-0.1, y=1.64)
  // without filling the frame. Just enough that feeds become legible.
  monitorZoomCam.set(
    profile.baseCamera.x * 0.4,
    THREE.MathUtils.lerp(profile.baseCamera.y, 1.58, 0.4),
    THREE.MathUtils.lerp(profile.baseCamera.z, -0.1, 0.55)
  );
  monitorZoomLook.set(0, 1.64, -0.1);
}

function resizeRenderer() {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  responsiveState.inputMode = detectInputMode();
  const profileName = getViewportProfile(width, height, responsiveState.inputMode);
  applyCameraProfile(profileName);
  document.body.dataset.viewport = responsiveState.viewport;
  document.body.dataset.input = responsiveState.inputMode;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100dvh";
  const renderWidth = Math.max(1, Math.round(width * responsiveState.internalScale));
  const renderHeight = Math.max(1, Math.round(height * responsiveState.internalScale));
  renderer.setSize(renderWidth, renderHeight, false);
  composer.setSize(renderWidth, renderHeight);
  updatePromptText();
  refreshTutorialOverlay();
}

function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  pointerNdc.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1));
}

function canTogglePauseMenu() {
  return state.started && !state.finished && !state.exploding;
}

function closePauseMenu() {
  state.menuOpen = false;
  pauseMenuEl.classList.remove("visible");
  updatePromptText();
}

function openPauseMenu() {
  if (!canTogglePauseMenu()) {
    return;
  }
  if (state.ipadZoom) {
    toggleIpad(false);
  }
  state.menuOpen = true;
  pauseMenuEl.classList.add("visible");
  updatePromptText();
}

function togglePauseMenu(force) {
  const next = typeof force === "boolean" ? force : !state.menuOpen;
  if (next) {
    openPauseMenu();
  } else {
    closePauseMenu();
  }
}

function onPointerDown(event) {
  if (event.button !== 0) {
    return;
  }

  // Do not hijack clicks inside any menu/modal overlay.
  if (event.target && event.target.closest && event.target.closest("#hud, #note-panel, #message, #boot, #pause-menu, #ending, #howto")) {
    return;
  }

  if (!state.started) {
    // Menu is visible and waiting for an explicit button — do nothing.
    return;
  }

  if (state.menuOpen || howtoEl.classList.contains("visible") || (state.finished && endingEl.classList.contains("visible"))) {
    return;
  }

  ensureAudio();
  updateHover();
  if (!hoverAction) {
    return;
  }

  if (hoverAction === "red") {
    decide("red");
  } else if (hoverAction === "skip") {
    decide("skip");
  } else if (hoverAction === "ipad") {
    toggleIpad();
  } else if (hoverAction === "phone") {
    togglePhone();
  } else if (hoverAction === "monitor") {
    toggleMonitorZoom();
  }
}

function onKeyDown(event) {
  if (!state.started) {
    if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault();
      if (howtoEl.classList.contains("visible")) {
        howtoEl.classList.remove("visible");
        return;
      }
      if (!hasCompletedTutorial()) {
        startTutorial();
      } else {
        startShift();
      }
    }
    if (event.key === "Escape" && howtoEl.classList.contains("visible")) {
      howtoEl.classList.remove("visible");
    }
    return;
  }

  if (event.repeat) {
    return;
  }

  const key = event.key.toLowerCase();

  if (key === "escape" && howtoEl.classList.contains("visible")) {
    howtoEl.classList.remove("visible");
    return;
  }

  if (key === "escape" && state.menuOpen) {
    closePauseMenu();
    return;
  }

  if (key === "escape" && state.ipadZoom) {
    toggleIpad(false);
    return;
  }

  if (key === "escape" && state.monitorZoom) {
    toggleMonitorZoom(false);
    return;
  }

  if (key === "escape" && canTogglePauseMenu()) {
    ensureAudio();
    openPauseMenu();
    return;
  }

  if (state.menuOpen || howtoEl.classList.contains("visible")) {
    return;
  }

  if (key === "q") {
    ensureAudio();
    cycleChannel(-1);
  } else if (key === "e") {
    ensureAudio();
    cycleChannel(1);
  } else if (key === "r") {
    ensureAudio();
    decide("red");
  } else if (key === "f") {
    ensureAudio();
    decide("skip");
  } else if (key === "i") {
    ensureAudio();
    toggleIpad();
  } else if (key === "escape" && state.ipadZoom) {
    toggleIpad(false);
  } else if (state.finished && key === "enter") {
    restartShift();
  }
}

function startShift() {
  if (state.started) {
    return;
  }
  ensureAudio();
  closePauseMenu();
  document.body.classList.add("started");
  bootEl.style.display = "none";
  howtoEl.classList.remove("visible");
  tutorialOverlayEl.classList.remove("visible");
  state.tutorial = false;
  resetRun();
  state.started = true;
  if (shouldShowOverlayHint()) {
    showMessage("Shift awake. Read the iPad and judge the feeds.", "warn", 3.4);
  }
}

function restartShift() {
  endingEl.classList.remove("visible");
  if (!state.started) {
    document.body.classList.add("started");
  }
  closePauseMenu();
  bootEl.style.display = "none";
  howtoEl.classList.remove("visible");
  tutorialOverlayEl.classList.remove("visible");
  state.tutorial = false;
  state.started = true;
  ensureAudio();
  resetRun();
  if (shouldShowOverlayHint()) {
    showMessage("Another shift begins.", "warn", 2.4);
  }
}

function returnToMenu() {
  closePauseMenu();
  state.started = false;
  state.finished = false;
  state.tutorial = false;
  state.exploding = false;
  state.explosionTimer = 0;
  state.refreshTimer = 0;
  state.ipadOpen = false;
  state.ipadZoom = false;
  state.monitorZoom = false;
  phoneState.ringing = false;
  phoneState.offHook = false;
  stopDialTone();
  stopPhoneVoice();
  tutorialOverlayEl.classList.remove("visible");
  howtoEl.classList.remove("visible");
  endingEl.classList.remove("visible");
  document.body.classList.remove("started");
  notePanelEl.classList.remove("visible");
  if (!hasCompletedTutorial()) {
    startButton.classList.add("locked");
    document.body.classList.add("first-run");
  } else {
    startButton.classList.remove("locked");
    document.body.classList.remove("first-run");
  }
  bootEl.style.display = "";
  refreshHud();
}

// --- Tutorial mode ---
function buildTutorialStages() {
  // Three scripted stages: clean / anomaly / iPad-driven anomaly.
  // All three use the same simple rule: "press RED if anomaly exists".
  const pressIfAnomaly = (a) => Boolean(a);
  const tutorialLines = {
    en: ["press if you found an anomaly.", "skip if everything looks normal."],
    ru: ["нажми, если нашёл аномалию.", "пропусти, если всё выглядит нормально."]
  };
  const stages = [];
  stages.push({
    title: "Tutorial 1",
    lines: tutorialLines,
    anomaly: null,
    phone: null,
    rule: pressIfAnomaly,
    _meta: { tutorialStep: 0 }
  });
  stages.push({
    title: "Tutorial 2",
    lines: tutorialLines,
    anomaly: pickRandomAnomaly(),
    phone: null,
    rule: pressIfAnomaly,
    _meta: { tutorialStep: 1 }
  });
  stages.push({
    title: "Tutorial 3",
    lines: tutorialLines,
    anomaly: pickRandomAnomaly(),
    phone: null,
    rule: pressIfAnomaly,
    _meta: { tutorialStep: 2 }
  });
  return stages;
}

function refreshTutorialOverlay() {
  if (!state.tutorial) {
    tutorialOverlayEl.classList.remove("visible");
    return;
  }
  const step = state.tutorialStepIndex + 1;
  const stageKey = `tutorial.stage${step}`;
  tutorialTitleEl.textContent = t(`${stageKey}.title`);
  tutorialBodyEl.textContent = t(`${stageKey}.body`);
  tutorialHintEl.textContent = getTutorialHint(stageKey);
  tutorialProgressEl.textContent = t("tutorial.progress")
    .replace("{n}", String(step))
    .replace("{total}", "3");
  tutorialOverlayEl.classList.add("visible");
}

function startTutorial() {
  ensureAudio();
  closePauseMenu();
  document.body.classList.add("started");
  bootEl.style.display = "none";
  howtoEl.classList.remove("visible");
  endingEl.classList.remove("visible");
  state.tutorial = true;
  state.tutorialStepIndex = 0;
  state.started = true;
  resetRunForTutorial();
  refreshTutorialOverlay();
  if (shouldShowOverlayHint()) {
    showMessage(getTutorialHint("tutorial.stage1"), "warn", 3.2);
  }
}

function resetRunForTutorial() {
  closePauseMenu();
  state.finished = false;
  state.won = false;
  state.endReason = "timer";
  state.refreshTimer = 0;
  state.stageIndex = 0;
  state.timer = START_TIME;
  state.currentChannel = 0;
  state.ipadOpen = false;
  state.exploding = false;
  state.explosionTimer = 0;
  state.renewalStageIndex = 1;
  state.sparks = [];
  state.ipadZoom = false;
  state.monitorZoom = false;
  cameraBlend = 0;
  state.stageClock = 0;
  state.phoneRingAt = null;
  state.anomaliesSeenThisRun = 0;
  state.phoneRangThisRun = false;
  STAGES = buildTutorialStages();
  resetPerStageTracking();
  resetPhoneForStage();
  lightningCooldown = 2.8 + Math.random() * 4.2;
  lightningTimer = 0;
  lightningStrength = 0;
  lightningTriggered = false;
  messageTimer = 0;
  shakeStrength = 0;
  redPress = 0;
  skipPress = 0;
  notePanelEl.classList.remove("visible");
  refreshStageText();
  refreshHud();
}

function finishTutorial() {
  closePauseMenu();
  state.tutorial = false;
  state.started = false;
  state.finished = true;
  markTutorialDone();
  tutorialOverlayEl.classList.remove("visible");
  endingKickerEl.textContent = t("tutorial.kicker");
  endingTitleEl.textContent = t("tutorial.complete.title");
  endingBodyEl.textContent = t("tutorial.complete.body");
  // Hide restart button on tutorial complete — use "Main Menu" instead.
  endingEl.classList.add("visible");
  startButton.classList.remove("locked");
  document.body.classList.remove("first-run");
  playVictory();
}

function resetRun() {
  closePauseMenu();
  state.finished = false;
  state.won = false;
  state.endReason = "timer";
  state.refreshTimer = 0;
  state.stageIndex = 0;
  state.timer = START_TIME;
  state.currentChannel = 0;
  state.ipadOpen = false;
  state.exploding = false;
  state.explosionTimer = 0;
  state.renewalStageIndex = 1;
  state.sparks = [];
  state.ipadZoom = false;
  state.monitorZoom = false;
  cameraBlend = 0;
  state.stageClock = 0;
  state.phoneRingAt = null;
  state.anomaliesSeenThisRun = 0;
  state.phoneRangThisRun = false;
  // Build this run's 18 stages from the shuffled riddle pools
  try {
    STAGES = buildStagesForRun();
  } catch (err) {
    console.warn("Falling back to stage templates:", err);
    STAGES = STAGE_TEMPLATES.slice();
  }
  resetPerStageTracking();
  resetPhoneForStage();
  lightningCooldown = 2.8 + Math.random() * 4.2;
  lightningTimer = 0;
  lightningStrength = 0;
  lightningTriggered = false;
  messageTimer = 0;
  shakeStrength = 0;
  redPress = 0;
  skipPress = 0;
  notePanelEl.classList.remove("visible");
  refreshStageText();
  refreshHud();
}

function cycleChannel(direction) {
  if (!isPlayable()) {
    return;
  }
  state.currentChannel = (state.currentChannel + direction + CHANNELS.length) % CHANNELS.length;
  if (!state.channelsVisited.has(state.currentChannel)) {
    state.channelsVisited.add(state.currentChannel);
    state.channelVisitOrder.push(state.currentChannel);
  }
  state.lastVisitedChannel = state.currentChannel;
  playSwitch(direction);
  refreshHud();
  shakeStrength = Math.min(0.2, shakeStrength + 0.03);
}

function toggleIpad(force) {
  if (!state.started || state.menuOpen) {
    return;
  }
  const next = typeof force === "boolean" ? force : !state.ipadZoom;
  if (next === state.ipadZoom) return;
  if (next && !state.ipadOpenedThisStage) {
    state.ipadOpenedThisStage = true;
    // "before scan" = opened while you've only ever looked at the one channel you loaded the stage with
    if (state.channelsVisited.size <= 1) {
      state.ipadOpenedBeforeScan = true;
    }
  }
  state.ipadZoom = next;
  // Mutually exclusive with monitor zoom
  if (next) state.monitorZoom = false;
  playTablet(next);
  if (shouldShowOverlayHint()) {
    showMessage(next ? getInstructionCopy("message.ipad.open") : t("message.ipad.close"), "warn", 1.4);
  }
}

function toggleMonitorZoom(force) {
  if (!state.started || state.menuOpen || state.exploding) {
    return;
  }
  const next = typeof force === "boolean" ? force : !state.monitorZoom;
  if (next === state.monitorZoom) return;
  state.monitorZoom = next;
  // Mutually exclusive with iPad zoom
  if (next) state.ipadZoom = false;
}

function togglePhone() {
  if (!state.started || state.finished || state.exploding || state.menuOpen) {
    return;
  }
  ensureAudio();

  if (!phoneState.offHook) {
    // Pick up the handset
    phoneState.offHook = true;
    playPhonePickup();

    if (phoneState.ringing) {
      // Answering an incoming call
      phoneState.ringing = false;
      phoneState.answered = true;
      phoneState.ignored = false;
      phoneState.callType = "incoming";
      phoneState.callPlayed = false;
      showMessage("You answer the call.", "warn", 1.4);
      // Deliver the scripted line after a tiny beat
      setTimeout(() => {
        if (phoneState.offHook) {
          deliverPhoneContent();
        }
      }, 420);
    } else {
      // Outgoing call — use the stage's outgoing voice line if provided
      phoneState.callType = "outgoing";
      phoneState.callPlayed = false;
      playDialTone();
      const stage = STAGES[state.stageIndex];
      if (stage && stage.phone && stage.phone.onOutgoing) {
        showMessage("You pick up and dial out.", "warn", 1.4);
        setTimeout(() => {
          if (phoneState.offHook) {
            phoneState.callContent = "info";
            phoneState.voiceLine = stage.phone.outgoingLine || "";
            stopDialTone();
            deliverPhoneContent();
          }
        }, 1200);
      } else {
        showMessage("Dial tone. Nobody to call.", "warn", 1.6);
      }
    }
  } else {
    // Hang up
    phoneState.offHook = false;
    phoneState.callType = null;
    phoneState.callPlayed = false;
    phoneState.voiceLine = "";
    stopDialTone();
    stopPhoneVoice();
    playPhoneHangup();
    showMessage("You hang up.", "warn", 1.2);
  }
}

function deliverPhoneContent() {
  const stage = STAGES[state.stageIndex];
  if (!stage) return;
  let line = "";
  let tone = "warn";
  let mode = "clue";
  if (phoneState.callType === "incoming" && stage.phone) {
    mode = stage.phone.onAnswer || "silence";
    line = stage.phone.voiceLine || "";
  } else if (phoneState.callType === "outgoing" && stage.phone) {
    mode = "info";
    line = stage.phone.outgoingLine || "";
  }
  phoneState.callContent = mode;
  phoneState.voiceLine = line;
  phoneState.callPlayed = true;

  if (mode === "silence" || !line) {
    playPhoneStatic();
    showMessage("Breathing on the line. Nothing said.", "warn", 2.6);
    return;
  }

  if (mode === "trap") {
    tone = "bad";
  } else if (mode === "clue" || mode === "info") {
    tone = "good";
  }
  showMessage(`Voice: "${line}"`, tone, 3.6);
  speakPhoneVoice(line);
}

function decide(choice) {
  if (!isPlayable()) {
    return;
  }

  const stage = STAGES[state.stageIndex];

  // If the phone is still ringing at decision time, mark it as ignored
  if (phoneState.ringing && !phoneState.offHook) {
    phoneState.ignored = true;
  }
  const phoneCtx = {
    ringing: phoneState.ringing,
    answered: phoneState.answered,
    ignored: phoneState.ignored,
    offHook: phoneState.offHook,
    callContent: phoneState.callContent,
    voiceLine: phoneState.voiceLine,
    didRing: phoneState.didRing
  };

  const ruleCtx = buildRuleContext();
  if (phoneState.voiceLine && stage.phone && typeof stage.phone.spokenNumber === "number") {
    phoneCtx.spokenNumber = stage.phone.spokenNumber;
  }
  let shouldPressRed = false;
  try {
    shouldPressRed = !!stage.rule(stage.anomaly, phoneCtx, ruleCtx);
  } catch (err) {
    console.warn("rule threw:", err);
    shouldPressRed = false;
  }
  const success = choice === (shouldPressRed ? "red" : "skip");

  if (choice === "red") {
    redPress = 1;
    playButton("red");
  } else {
    skipPress = 1;
    playButton("skip");
  }

  if (success) {
    if (stage.anomaly) state.anomaliesSeenThisRun += 1;
    if (phoneCtx.didRing) state.phoneRangThisRun = true;
    if (state.tutorial) {
      if (state.tutorialStepIndex >= STAGES.length - 1) {
        finishTutorial();
        return;
      }
      state.tutorialStepIndex += 1;
      state.stageIndex += 1;
      state.renewalStageIndex = state.stageIndex + 1;
      state.refreshTimer = SCREEN_REFRESH_DURATION;
      state.ipadOpen = false;
      state.ipadZoom = false;
  state.monitorZoom = false;
      resetPerStageTracking();
      resetPhoneForStage();
      refreshStageText();
      refreshHud();
      refreshTutorialOverlay();
      showMessage("Correct", "good", 1);
      playSuccess();
      return;
    }
    if (state.stageIndex >= TOTAL_STAGES - 1) {
      finishRun(true, "victory");
      return;
    }
    state.stageIndex += 1;
    state.renewalStageIndex = state.stageIndex + 1;
    state.refreshTimer = SCREEN_REFRESH_DURATION;
    state.ipadOpen = false;
    state.ipadZoom = false;
  state.monitorZoom = false;
    resetPerStageTracking();
    resetPhoneForStage();
    refreshStageText();
    refreshHud();
    showMessage("Correct", "good", 1);
    playSuccess();
  } else {
    if (state.tutorial) {
      // Tutorial is forgiving — no explosion, let the player try again.
      showMessage(t("tutorial.fail.retry"), "bad", 2.4);
      playFailure();
      return;
    }
    triggerMonitorExplosion();
  }
}

function resetPerStageTracking() {
  state.channelsVisited = new Set();
  state.channelsVisited.add(state.currentChannel);
  state.channelVisitOrder = [state.currentChannel];
  state.firstVisitedChannel = state.currentChannel;
  state.lastVisitedChannel = state.currentChannel;
  state.ipadOpenedThisStage = false;
  state.ipadOpenedBeforeScan = false;
}

function buildRuleContext() {
  const timerRemaining = Math.max(0, state.timer);
  const timerMinutes = Math.floor(timerRemaining / 60);
  const timerSeconds = timerRemaining % 60;
  const timerSecondsDigit = Math.floor(timerSeconds);
  return {
    stageNumber: state.stageIndex + 1,
    channelNumber: state.currentChannel + 1,
    channel: state.currentChannel,
    timerRemaining,
    timerMinutes,
    timerSeconds,
    timerSecondsDigit,
    channelsVisited: state.channelsVisited,
    channelsVisitedCount: state.channelsVisited.size,
    visitOrder: state.channelVisitOrder.slice(),
    firstVisited: state.firstVisitedChannel,
    lastVisited: state.lastVisitedChannel,
    ipadOpenedThisStage: state.ipadOpenedThisStage,
    ipadOpenedBeforeScan: state.ipadOpenedBeforeScan,
    anomaliesSeenThisRun: state.anomaliesSeenThisRun,
    phoneRangThisRun: state.phoneRangThisRun,
    stageClock: state.stageClock || 0
  };
}

function resetPhoneForStage() {
  // Hang up any active call and wipe per-stage phone state
  if (phoneState.offHook) {
    stopDialTone();
    stopPhoneVoice();
  }
  phoneState.ringing = false;
  phoneState.offHook = false;
  phoneState.ringClock = 0;
  phoneState.ringBellTimer = 0;
  phoneState.ringJitter = 0;
  phoneState.callType = null;
  phoneState.callContent = null;
  phoneState.callPlayed = false;
  phoneState.voiceLine = "";
  phoneState.answered = false;
  phoneState.ignored = false;
  phoneState.didRing = false;
  // Schedule an incoming ring if this stage calls for it
  state.phoneRingAt = null;
  state.stageClock = 0;
  const stage = STAGES[state.stageIndex];
  if (stage && stage.phone && typeof stage.phone.ringsAt === "number") {
    state.phoneRingAt = stage.phone.ringsAt;
  }
}

function triggerMonitorExplosion() {
  closePauseMenu();
  state.exploding = true;
  state.explosionTimer = EXPLOSION_DURATION;
  state.ipadOpen = false;
  state.ipadZoom = false;
  state.monitorZoom = false;
  shakeStrength = 1.1;
  notePanelEl.classList.remove("visible");
  state.sparks = [];
  for (let i = 0; i < 48; i += 1) {
    state.sparks.push({
      x: 256 + (Math.random() - 0.5) * 60,
      y: 192 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 520,
      vy: (Math.random() - 0.8) * 520,
      life: 0.4 + Math.random() * 1.2,
      maxLife: 1.4,
      size: 1.5 + Math.random() * 2.8
    });
  }
  showMessage("MONITOR BREACH", "bad", 1.4);
  playExplosion();
}

function finishRun(won, reason = won ? "victory" : "timer") {
  closePauseMenu();
  state.finished = true;
  state.won = won;
  state.endReason = reason;
  state.refreshTimer = 0;
  state.ipadOpen = false;
  state.ipadZoom = false;
  state.monitorZoom = false;
  state.tutorial = false;
  // Hang up any active call and silence the ringer
  phoneState.ringing = false;
  phoneState.offHook = false;
  stopDialTone();
  stopPhoneVoice();
  tutorialOverlayEl.classList.remove("visible");
  notePanelEl.classList.remove("visible");
  endingKickerEl.textContent = won ? "Shift Complete" : reason === "death" ? "Judgment Failed" : "Shift Lost";
  endingTitleEl.textContent = won ? "You Survived The Desk" : reason === "death" ? "You Died." : "The Timer Took The Room";
  if (won) {
    endingBodyEl.innerHTML =
      'Eighteen judgments held. The window still rattles, but the channels have gone quiet.' +
      '<br><br>Congratulations — the answer is: <strong style="color:#e0aa61;letter-spacing:0.08em;">"GETOFFMYLOWN50"</strong>';
  } else {
    endingBodyEl.textContent = reason === "death"
      ? "The desk rejected your choice. The screens went cold before the next stage could load."
      : "The monitor froze, the rain kept falling, and the desk went cold before the work was done.";
  }
  endingEl.classList.add("visible");
  refreshHud();
  if (won) {
    playVictory();
    showMessage("All 18 stages cleared.", "good", 3);
  } else {
    playFailure();
    showMessage(reason === "death" ? "You died." : "Time expired.", "bad", 3);
  }
}

function isPlayable() {
  return state.started && !state.finished && !state.exploding && !state.menuOpen && state.refreshTimer <= 0;
}

// Riddles store their text as { en: [...], ru: [...] }. This resolves the
// array for the active language, falling back to English if missing.
// Legacy array form is still accepted for safety.
function resolveStageLines(stage) {
  if (!stage || !stage.lines) return [];
  if (Array.isArray(stage.lines)) return stage.lines;
  return stage.lines[currentLang] || stage.lines.en || [];
}

function refreshStageText() {
  const stage = STAGES[state.stageIndex];
  const totalLabel = state.tutorial ? STAGES.length : TOTAL_STAGES;
  noteStageEl.textContent = `Stage ${pad(state.stageIndex + 1)} / ${totalLabel}`;
  if (stage) {
    noteTitleEl.textContent = stage.title || "";
    noteBodyEl.textContent = resolveStageLines(stage).join("\n\n");
  }
  drawIpadScreen(0);
}

function refreshHud() {
  timerValueEl.textContent = formatTime(state.started ? state.timer : START_TIME);
  channelValueEl.textContent = `CH ${state.currentChannel + 1} - ${CHANNELS[state.currentChannel].name}`;
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function formatFeedTime(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function showMessage(text, tone = "warn", duration = 2) {
  messageEl.textContent = text;
  messageEl.dataset.tone = tone;
  messageEl.classList.add("visible");
  messageTimer = duration;
}

function updateMessage(dt) {
  if (messageTimer <= 0) {
    messageEl.classList.remove("visible");
    return;
  }
  messageTimer -= dt;
  if (messageTimer <= 0) {
    messageEl.classList.remove("visible");
  }
}

function updateHover() {
  hoverAction = null;
  const overlayBlocking = state.menuOpen || howtoEl.classList.contains("visible");
  if (!overlayBlocking) {
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(interactiveMeshes, false);
    if (hits.length > 0) {
      const hit = hits[0].object;
      hoverAction = hit.userData.action || null;
    }
  }

  updatePromptText(hoverAction);

  const pulseTime = performance.now() / 1000;
  const pulseRed = 0.5 + Math.sin(pulseTime * 2.6) * 0.5;
  const pulseSkip = 0.5 + Math.sin(pulseTime * 2.1 + 1.3) * 0.5;
  const pulseIpad = 0.5 + Math.sin(pulseTime * 1.8 + 2.4) * 0.5;
  const interactable = isPlayable();

  for (const [key, meshes] of Object.entries(interactiveGroups)) {
    const active = key === hoverAction;
    for (const mesh of meshes) {
      if (!mesh.material || !("emissive" in mesh.material)) {
        continue;
      }
      if (key === "red") {
        if (active) {
          mesh.material.emissive.setHex(0xb23020);
          mesh.material.emissiveIntensity = 1.6;
        } else if (interactable) {
          const glow = 0.55 + pulseRed * 0.55;
          mesh.material.emissive.setRGB(0.78 * glow, 0.16 * glow, 0.1 * glow);
          mesh.material.emissiveIntensity = 1;
        } else {
          mesh.material.emissive.setHex(0x41110c);
          mesh.material.emissiveIntensity = 0.7;
        }
      } else if (key === "skip") {
        if (active) {
          mesh.material.emissive.setHex(0x2f6a84);
          mesh.material.emissiveIntensity = 1.5;
        } else if (interactable) {
          const glow = 0.45 + pulseSkip * 0.5;
          mesh.material.emissive.setRGB(0.1 * glow, 0.42 * glow, 0.58 * glow);
          mesh.material.emissiveIntensity = 1;
        } else {
          mesh.material.emissive.setHex(0x0c1a24);
          mesh.material.emissiveIntensity = 0.6;
        }
      } else if (key === "ipad") {
        if (active) {
          mesh.material.emissive.setHex(0x2a3a46);
          mesh.material.emissiveIntensity = 1.2;
        } else if (interactable) {
          const glow = 0.35 + pulseIpad * 0.4;
          mesh.material.emissive.setRGB(0.1 * glow, 0.22 * glow, 0.32 * glow);
          mesh.material.emissiveIntensity = 1;
        } else {
          mesh.material.emissive.setHex(0x121820);
          mesh.material.emissiveIntensity = 0.5;
        }
      } else if (key === "phone") {
        // The phone shares bakeliteMat across all of its meshes, so writing the
        // emissive on one mesh's material updates every mesh. Do it only once.
        if (mesh !== meshes[0]) continue;
        const ringBoost = phoneState.ringing && !phoneState.offHook ? 1 + Math.sin(pulseTime * 18) * 0.7 : 0;
        if (active) {
          mesh.material.emissive.setRGB(0.6, 0.3, 0.1);
          mesh.material.emissiveIntensity = 1.3 + ringBoost;
        } else if (interactable) {
          const glow = 0.28 + pulseIpad * 0.22 + ringBoost * 0.8;
          mesh.material.emissive.setRGB(0.38 * glow, 0.16 * glow, 0.06 * glow);
          mesh.material.emissiveIntensity = 1;
        } else {
          mesh.material.emissive.setHex(0x1a0d06);
          mesh.material.emissiveIntensity = 0.45;
        }
      }
    }
  }

  // drive the point lights with the same pulses so the glow radiates onto the desk
  if (interactable) {
    buttonLight.intensity = 0.6 + pulseRed * 0.9 + lightningStrength * 0.1;
    skipLight.intensity = 0.35 + pulseSkip * 0.6;
    ipadLight.intensity = Math.max(ipadLight.intensity, 0.4 + pulseIpad * 0.55);
  } else {
    skipLight.intensity = 0.12;
  }
}

function loop(nowMs) {
  requestAnimationFrame(loop);
  const now = nowMs / 1000;
  const dt = Math.min(0.1, now - lastTime);
  lastTime = now;
  stepAccumulator += dt;

  let stepped = false;
  // Cap iterations to avoid catch-up death spirals if the tab fell behind.
  let safety = 4;
  while (stepAccumulator >= FRAME_STEP && safety-- > 0) {
    try {
      update(FRAME_STEP, now);
    } catch (err) {
      console.error("update threw, continuing:", err);
    }
    stepAccumulator -= FRAME_STEP;
    stepped = true;
  }
  if (stepAccumulator > FRAME_STEP * 4) {
    stepAccumulator = 0;
  }

  if (stepped) {
    try {
      render(now);
    } catch (err) {
      console.error("render threw:", err);
    }
  }
}

function update(dt, now) {
  updateMessage(dt);

  if (state.started && !state.finished && !state.exploding && !state.menuOpen && state.refreshTimer <= 0) {
    state.timer -= dt;
    if (state.timer <= 0) {
      state.timer = 0;
      finishRun(false, "timer");
    }
    // Track time within the current stage and trigger scheduled phone rings
    state.stageClock = (state.stageClock || 0) + dt;
    if (state.phoneRingAt !== null && state.stageClock >= state.phoneRingAt && !phoneState.ringing && !phoneState.offHook) {
      phoneState.ringing = true;
      phoneState.didRing = true;
      phoneState.ringClock = 0;
      phoneState.ringBellTimer = 0;
      state.phoneRingAt = null;
      ensureAudio();
      showMessage("The phone is ringing.", "warn", 2);
    }
  }
  if (state.refreshTimer > 0 && !state.menuOpen) {
    state.refreshTimer = Math.max(0, state.refreshTimer - dt);
  }
  if (state.exploding) {
    state.explosionTimer -= dt;
    for (const spark of state.sparks) {
      spark.life -= dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vy += 760 * dt;
    }
    state.sparks = state.sparks.filter((s) => s.life > 0);
    shakeStrength = Math.max(shakeStrength, 0.55 * Math.max(0, state.explosionTimer / EXPLOSION_DURATION));
    if (state.explosionTimer <= 0) {
      state.exploding = false;
      finishRun(false, "death");
    }
  }

  pointerDrift.x = THREE.MathUtils.lerp(pointerDrift.x, pointerNdc.x, 0.08);
  pointerDrift.y = THREE.MathUtils.lerp(pointerDrift.y, pointerNdc.y, 0.08);

  updateLightning(dt);
  if (!state.menuOpen) {
    updatePhone(dt, now);
  }
  updateCamera(now);
  updateDeskProps(dt, now);
  updateDust(dt);
  updateWindow(dt, now);
  updateHover();
  refreshHud();

  // Throttle heavy canvas redraws to save CPU/GPU. The feeds still update smoothly.
  updateFrameCounter = (updateFrameCounter + 1) % 60;
  if (updateFrameCounter % 3 === 0) {
    drawIpadScreen(now);
  }
  if (updateFrameCounter % 2 === 0) {
    drawWindow(now);
  }
  drawTimerScreen(now);
  drawMonitor(now);
}

function updatePhone(dt, now) {
  // Ring bell pulses on a classic "ring-ring" pattern (2 short bursts, silence, repeat)
  if (phoneState.ringing && !phoneState.offHook) {
    phoneState.ringClock += dt;
    phoneState.ringBellTimer -= dt;
    // jitter envelope so the handset trembles with each burst
    const cyclePeriod = 4.0;
    const t = phoneState.ringClock % cyclePeriod;
    const inBurst = (t >= 0 && t < 0.45) || (t >= 0.7 && t < 1.15);
    phoneState.ringJitter = inBurst ? 1 : THREE.MathUtils.lerp(phoneState.ringJitter, 0, 0.22);
    if (inBurst && phoneState.ringBellTimer <= 0) {
      playPhoneBellPulse();
      phoneState.ringBellTimer = 0.09;
    }
  } else if (phoneState.ringJitter > 0) {
    phoneState.ringJitter = THREE.MathUtils.lerp(phoneState.ringJitter, 0, 0.25);
  }
}

function updateLightning(dt) {
  lightningCooldown -= dt;
  if (lightningCooldown <= 0 && lightningTimer <= 0) {
    lightningTimer = 0.62 + Math.random() * 0.45;
    lightningStrength = 1.5 + Math.random() * 0.9;
    lightningTriggered = false;
    lightningCooldown = 2.2 + Math.random() * 5.0;
  }

  if (lightningTimer > 0) {
    lightningTimer -= dt;
    const pulse = Math.sin((lightningTimer + 0.12) * 24) * 0.5 + 0.5;
    const flare = Math.max(0, pulse) * lightningStrength * Math.min(1, lightningTimer * 3.2);
    lightningLight.intensity = flare * 3.1;
    lightningLight.color.setHex(0xbde6ff);
    if (!lightningTriggered && flare > 0.85) {
      lightningTriggered = true;
      shakeStrength = Math.min(0.34, shakeStrength + 0.16);
      playLightning();
    }
    if (lightningTimer <= 0) {
      lightningStrength = 0;
      lightningLight.intensity = 0;
    }
  } else {
    lightningStrength = THREE.MathUtils.lerp(lightningStrength, 0, 0.12);
    lightningLight.intensity = 0;
  }
}

function updateCamera(now) {
  const sway = Math.sin(now * 0.34) * 0.01;
  const shakeX = (Math.random() - 0.5) * shakeStrength * 0.08;
  const shakeY = (Math.random() - 0.5) * shakeStrength * 0.05;
  shakeStrength = THREE.MathUtils.lerp(shakeStrength, 0, 0.08);

  cameraBlend = THREE.MathUtils.lerp(cameraBlend, state.ipadZoom ? 1 : 0, 0.09);
  monitorBlend = THREE.MathUtils.lerp(monitorBlend, state.monitorZoom ? 1 : 0, 0.09);

  const basePosX = baseCamera.x + pointerDrift.x * 0.11 + shakeX;
  const basePosY = baseCamera.y - pointerDrift.y * 0.05 + sway + shakeY;
  const basePosZ = baseCamera.z + Math.sin(now * 0.18) * 0.015;

  // Blend: base -> iPad zoom -> monitor zoom. iPad takes priority if both set.
  let posX = THREE.MathUtils.lerp(basePosX, monitorZoomCam.x, monitorBlend);
  let posY = THREE.MathUtils.lerp(basePosY, monitorZoomCam.y, monitorBlend);
  let posZ = THREE.MathUtils.lerp(basePosZ, monitorZoomCam.z, monitorBlend);
  posX = THREE.MathUtils.lerp(posX, ipadZoomCam.x, cameraBlend);
  posY = THREE.MathUtils.lerp(posY, ipadZoomCam.y, cameraBlend);
  posZ = THREE.MathUtils.lerp(posZ, ipadZoomCam.z, cameraBlend);
  camera.position.set(posX, posY, posZ);

  targetLook.copy(baseLook);
  targetLook.x += pointerDrift.x * 0.17;
  targetLook.y += -pointerDrift.y * 0.08;
  targetLook.lerp(monitorZoomLook, monitorBlend);
  targetLook.lerp(ipadZoomLook, cameraBlend);
  currentLook.lerp(targetLook, 0.1);
  camera.lookAt(currentLook);
}

function updateDeskProps(dt, now) {
  redPress = THREE.MathUtils.lerp(redPress, 0, 0.18);
  skipPress = THREE.MathUtils.lerp(skipPress, 0, 0.18);
  redButtonCap.position.y = 1.0 - redPress * 0.05;
  redButtonLabel.position.y = 1.001 - redPress * 0.02;
  skipButtonCap.position.y = 1.0 - skipPress * 0.028;
  buttonLight.intensity = 0.54 + (1 - redPress) * 0.1 + lightningStrength * 0.06;

  const refreshProgress = state.refreshTimer > 0 ? 1 - state.refreshTimer / SCREEN_REFRESH_DURATION : 1;
  let renewFactor = 1;
  if (state.refreshTimer > 0) {
    if (refreshProgress < 0.5) {
      // CORRECT displayed — full lights, slight green wash via monitorLight tinted elsewhere
      renewFactor = 1;
    } else if (refreshProgress < 0.58) {
      renewFactor = THREE.MathUtils.lerp(1, 0, (refreshProgress - 0.5) / 0.08);
    } else if (refreshProgress < 0.8) {
      renewFactor = 0;
    } else if (refreshProgress < 0.92) {
      const bootT = (refreshProgress - 0.8) / 0.12;
      renewFactor = 0.18 * bootT + Math.sin(now * 62) * 0.12 * bootT;
    } else {
      renewFactor = THREE.MathUtils.lerp(0.35, 1, (refreshProgress - 0.92) / 0.08);
    }
  }
  const explodeProgress = state.exploding ? 1 - Math.max(0, state.explosionTimer) / EXPLOSION_DURATION : 0;
  const explodeFactor = state.exploding
    ? explodeProgress < 0.14
      ? 1 + 3.2 * (explodeProgress / 0.14)
      : Math.max(0, 1.6 - (explodeProgress - 0.14) / 0.86 * 1.55)
    : 1;
  const roomDim = state.exploding
    ? Math.max(0.05, explodeFactor)
    : 0.16 + renewFactor * 0.9;

  // iPad stays flat on the desk at its anchor — no lift animation
  ipadGroup.position.copy(ipadAnchor.position);
  ipadGroup.quaternion.copy(ipadAnchor.quaternion);
  ipadGroup.scale.setScalar(1);
  ipadOffset.set(0, 0.1, 0).applyQuaternion(ipadGroup.quaternion);
  ipadLight.position.copy(ipadGroup.position).add(ipadOffset);
  ipadLight.intensity = 0.7 * roomDim;

  monitorGlass.material.opacity = 0.03 + lightningStrength * 0.015;
  const correctPhase = state.refreshTimer > 0 && refreshProgress < 0.5;
  if (correctPhase) {
    monitorLight.color.setHex(0x7fdba0);
  } else {
    monitorLight.color.setHex(CHANNELS[state.currentChannel].glow);
  }
  monitorLight.intensity = (2.48 + lightningStrength * 0.72 + Math.sin(now * 11 + state.currentChannel) * 0.08) * roomDim;
  stormWindowLight.intensity = (2.08 + lightningStrength * 3.1) * roomDim;
  stormRimLight.intensity = (0.96 + lightningStrength * 0.68) * roomDim;
  ambientLight.intensity = 1.58 * roomDim;
  roomLight.intensity = 1.72 * roomDim;
  lightningLight.intensity *= roomDim;
  buttonLight.intensity *= roomDim;
  skipLight.intensity *= roomDim;
  if (dust) {
    dust.material.opacity = (0.21 + lightningStrength * 0.012) * roomDim;
    dust.material.color.copy(warmDustColor).lerp(coolDustColor, Math.min(0.28, lightningStrength * 0.07));
  }

  // Phone handset animation and ring glow
  if (phoneHandset) {
    const anchor = phoneHandsetAnchor;
    let targetY = anchor.position.y;
    let targetZ = anchor.position.z;
    let targetRotZ = 0;
    let jitterY = 0;
    let jitterX = 0;

    if (phoneState.ringing && !phoneState.offHook) {
      // Bell jitter — handset trembles in the cradle
      jitterY = Math.sin(now * 90) * 0.006 * phoneState.ringJitter;
      jitterX = Math.cos(now * 120) * 0.004 * phoneState.ringJitter;
    }

    if (phoneState.offHook) {
      // Lift handset up and tilt
      targetY = anchor.position.y + 0.14;
      targetZ = anchor.position.z + 0.06;
      targetRotZ = 0.18;
    }

    phoneHandset.position.y = THREE.MathUtils.lerp(phoneHandset.position.y, targetY + jitterY, 0.18);
    phoneHandset.position.x = THREE.MathUtils.lerp(phoneHandset.position.x, jitterX, 0.3);
    phoneHandset.position.z = THREE.MathUtils.lerp(phoneHandset.position.z, targetZ, 0.18);
    phoneHandset.rotation.z = THREE.MathUtils.lerp(phoneHandset.rotation.z, targetRotZ, 0.18);

    // Ring light pulses orange when ringing, steady warm when off-hook
    let phoneLightTarget = 0;
    if (phoneState.ringing && !phoneState.offHook) {
      phoneLightTarget = 0.6 + Math.sin(now * 14) * 0.5;
    } else if (phoneState.offHook) {
      phoneLightTarget = 0.35 + Math.sin(now * 3) * 0.05;
    }
    phoneLight.intensity = THREE.MathUtils.lerp(phoneLight.intensity, phoneLightTarget * roomDim, 0.2);

    // Spin the dial slightly on outgoing calls
    if (phoneState.offHook && phoneState.callType === "outgoing" && !phoneState.callPlayed) {
      phoneDial.rotation.z = Math.sin(now * 6) * 0.5;
    } else {
      phoneDial.rotation.z = THREE.MathUtils.lerp(phoneDial.rotation.z, 0, 0.15);
    }
  }

  if (state.exploding) {
    const explodeGlow = Math.max(0, state.explosionTimer) / EXPLOSION_DURATION;
    monitorLight.color.setHex(0xff3a1e);
    monitorLight.intensity = 4.2 * (0.3 + explodeGlow * 1.5) + Math.random() * 1.2;
    buttonLight.intensity = 0.4 + Math.random() * 0.8;
    skipLight.intensity = 0.15;
  }
  if (timerGlowLight) {
    timerGlowLight.intensity = 0;
  }
}

function updateDust(dt) {
  const positions = dust.geometry.attributes.position.array;
  for (let i = 0; i < dustVelocities.length; i += 1) {
    const ix = i * 3;
    const velocity = dustVelocities[i];
    positions[ix] += velocity.x * dt * 30;
    positions[ix + 1] += velocity.y * dt * 30;
    positions[ix + 2] += velocity.z * dt * 30;

    if (positions[ix + 1] > 3) positions[ix + 1] = 0.45;
    if (positions[ix] < -2.7) positions[ix] = 2.7;
    if (positions[ix] > 2.7) positions[ix] = -2.7;
    if (positions[ix + 2] < -2.8) positions[ix + 2] = 2.5;
    if (positions[ix + 2] > 2.5) positions[ix + 2] = -2.8;
  }
  dust.geometry.attributes.position.needsUpdate = true;
  dust.rotation.y += dt * 0.03;
}

function updateWindow(dt, now) {
  for (const drop of windowRain) {
    drop.y += drop.speed * dt;
    drop.x -= drop.speed * dt * 0.12;
    if (drop.y > windowCanvas.height + 20 || drop.x < -20) {
      // drop just left the window — spawn a splash along the impact trail
      if (Math.random() < 0.35) {
        spawnWindowSplash(
          THREE.MathUtils.clamp(drop.x, 4, windowCanvas.width - 4),
          THREE.MathUtils.clamp(drop.y - 12, 8, windowCanvas.height - 8)
        );
      }
      drop.y = -20 - Math.random() * 120;
      drop.x = Math.random() * (windowCanvas.width + 80);
    }
  }

  // droplets clinging to the glass slide down and leave a trail
  for (const gd of windowGlassDrops) {
    gd.y += gd.speed * dt * 0.55;
    gd.trail = Math.min(72, gd.trail + gd.speed * dt * 0.9);
    if (gd.y > windowCanvas.height + 8) {
      gd.y = -6;
      gd.x = Math.random() * windowCanvas.width;
      gd.r = 1.8 + Math.random() * 3.4;
      gd.speed = 6 + Math.random() * 26;
      gd.trail = 0;
    }
  }

  // splash lifecycle
  for (const s of windowSplashes) {
    s.life -= dt;
  }
  windowSplashes = windowSplashes.filter((s) => s.life > 0);

  // ambient splashes (impacts from rain we don't draw individually)
  if (Math.random() < 0.35) {
    spawnWindowSplash(Math.random() * windowCanvas.width, Math.random() * windowCanvas.height);
  }
  if (lightningStrength > 0.3 && Math.random() < 0.2) {
    spawnWindowSplash(Math.random() * windowCanvas.width, Math.random() * windowCanvas.height);
  }
  // drawWindow() is now invoked from the main update on a throttled frame.
}

function drawWindow(now) {
  const ctx = windowCtx;
  const width = windowCanvas.width;
  const height = windowCanvas.height;
  ctx.clearRect(0, 0, width, height);

  const flash = Math.min(1, lightningStrength * 0.6);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, flash > 0 ? "rgba(144, 178, 210, 0.96)" : "rgba(30, 46, 61, 0.98)");
  gradient.addColorStop(0.58, flash > 0 ? "rgba(70, 103, 129, 0.96)" : "rgba(16, 28, 38, 0.98)");
  gradient.addColorStop(1, flash > 0 ? "rgba(21, 34, 46, 0.98)" : "rgba(5, 10, 14, 1)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const cloudGlow = ctx.createRadialGradient(width * 0.28, height * 0.18, 12, width * 0.28, height * 0.18, 180);
  cloudGlow.addColorStop(0, `rgba(136, 170, 194, ${0.25 + flash * 0.28})`);
  cloudGlow.addColorStop(1, "rgba(136, 170, 194, 0)");
  ctx.fillStyle = cloudGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(12, 18, 24, 0.68)";
  for (let i = 0; i < 9; i += 1) {
    const x = i * 64 + (Math.sin(now * 0.15 + i) * 6);
    const buildingHeight = 50 + (i % 3) * 25;
    ctx.fillRect(x, height - buildingHeight, 46, buildingHeight);
  }

  ctx.lineCap = "round";
  for (const drop of windowRain) {
    ctx.strokeStyle = `rgba(196, 228, 242, ${drop.alpha + flash * 0.32})`;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x - drop.len * 0.12, drop.y + drop.len);
    ctx.stroke();
  }

  // droplets clinging to the glass with wet trails behind them
  for (const gd of windowGlassDrops) {
    const trailAlpha = 0.18 + flash * 0.35;
    ctx.fillStyle = `rgba(200, 228, 244, ${trailAlpha})`;
    ctx.fillRect(gd.x - gd.r * 0.45, gd.y - gd.trail, gd.r * 0.9, gd.trail);
    const drop = ctx.createRadialGradient(gd.x, gd.y, 0, gd.x, gd.y, gd.r * 1.9);
    drop.addColorStop(0, `rgba(255, 255, 255, ${0.82 + flash * 0.18})`);
    drop.addColorStop(0.5, `rgba(210, 232, 246, ${0.54 + flash * 0.3})`);
    drop.addColorStop(1, "rgba(170, 198, 214, 0)");
    ctx.fillStyle = drop;
    ctx.beginPath();
    ctx.arc(gd.x, gd.y, gd.r * 1.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // splash rings from impacts — rapidly expanding rings that fade
  for (const s of windowSplashes) {
    const progress = 1 - s.life / s.maxLife;
    const radius = s.radius + progress * 14;
    const alpha = Math.max(0, s.life / s.maxLife) * (0.55 + flash * 0.35);
    ctx.strokeStyle = `rgba(220, 240, 252, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    // secondary ring for extra splash feel
    if (progress < 0.5) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 26; i += 1) {
    const x = (i * 33 + now * 18) % (width + 70) - 35;
    const y = (i * 19 + Math.sin(now * 0.4 + i) * 8) % height;
    ctx.strokeStyle = `rgba(210, 228, 236, ${0.09 + flash * 0.16})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 3, y + 18);
    ctx.stroke();
  }

  if (flash > 0.1) {
    ctx.strokeStyle = `rgba(255,255,255,${0.3 + flash * 0.35})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.66, 16);
    ctx.lineTo(width * 0.62, 64);
    ctx.lineTo(width * 0.7, 118);
    ctx.lineTo(width * 0.65, 186);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = `rgba(210, 230, 242, ${0.05 + flash * 0.28})`;
  ctx.fillRect(0, 0, width, height);
  windowTexture.needsUpdate = true;
}

function drawTimerScreen(now) {
  const ctx = timerCtx;
  const width = timerCanvas.width;
  const height = timerCanvas.height;
  ctx.clearRect(0, 0, width, height);

  if (state.exploding) {
    ctx.fillStyle = "#040102";
    ctx.fillRect(0, 0, width, height);
    const flicker = Math.random() < 0.4;
    if (flicker) {
      ctx.fillStyle = "rgba(255, 68, 52, 0.9)";
      ctx.font = "bold 22px Cascadia Code, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("-- ERR --", width / 2, height / 2 + 3);
    }
    timerTexture.needsUpdate = true;
    return;
  }

  if (state.started && !state.finished && state.refreshTimer > 0) {
    const progress = 1 - state.refreshTimer / SCREEN_REFRESH_DURATION;
    ctx.fillStyle = "#040102";
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (progress < 0.5) {
      const pulse = 0.85 + Math.sin(now * 6) * 0.15;
      ctx.fillStyle = `rgba(170, 240, 190, ${pulse})`;
      ctx.font = "bold 44px Cascadia Code, Consolas, monospace";
      ctx.fillText("CORRECT", width / 2, height / 2 + 3);
    } else if (progress < 0.58) {
      const collapse = (progress - 0.5) / 0.08;
      const thickness = Math.max(1, (1 - collapse) * 8);
      ctx.fillStyle = "rgba(255, 200, 180, 0.92)";
      ctx.fillRect(10, height / 2 - thickness / 2, width - 20, thickness);
    } else if (progress < 0.8) {
      // black
    } else if (progress < 0.92) {
      const boot = (progress - 0.8) / 0.12;
      ctx.fillStyle = `rgba(255, 86, 72, ${0.7 * boot})`;
      ctx.font = "bold 16px Cascadia Code, Consolas, monospace";
      ctx.fillText("BOOTING...", width / 2, height / 2);
    } else {
      const intro = (progress - 0.92) / 0.08;
      ctx.fillStyle = `rgba(255, 196, 176, ${0.88 * intro})`;
      ctx.font = "bold 20px Cascadia Code, Consolas, monospace";
      ctx.fillText(`STAGE ${pad(state.renewalStageIndex)} READY`, width / 2, height / 2 + 3);
    }
    for (let y = 0; y < height; y += 4) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
      ctx.fillRect(0, y, width, 2);
    }
    timerTexture.needsUpdate = true;
    return;
  }

  const backdrop = ctx.createLinearGradient(0, 0, 0, height);
  backdrop.addColorStop(0, "#120506");
  backdrop.addColorStop(1, "#050203");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(0, 0, width, 24);
  ctx.strokeStyle = "rgba(210, 80, 68, 0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  const pulse = state.started && !state.finished ? (Math.sin(now * 6) * 0.5 + 0.5) : 0.2;
  const alert = state.timer < 60 ? 0.4 + pulse * 0.6 : 0.18 + pulse * 0.2;
  ctx.fillStyle = `rgba(255, 58, 42, ${alert * 0.18})`;
  ctx.fillRect(14, 34, width - 28, height - 52);

  const timeText = !state.started ? formatTime(START_TIME) : formatTime(state.timer);
  const colonVisible = !state.started || state.finished || Math.floor(now * 2) % 2 === 0;
  const displayText = colonVisible ? timeText : timeText.replace(":", " ");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255, 173, 160, 0.88)";
  ctx.font = "bold 22px Cascadia Code, Consolas, monospace";
  ctx.fillText("COUNTDOWN", width / 2, 34);

  ctx.shadowColor = "rgba(255, 34, 23, 0.82)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = state.finished && state.won ? "#ffb4ad" : "#ff5a48";
  ctx.font = "bold 78px Cascadia Code, Consolas, monospace";
  ctx.fillText(displayText, width / 2, 92);
  ctx.shadowBlur = 0;

  for (let y = 0; y < height; y += 4) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(0, y, width, 2);
  }

  timerTexture.needsUpdate = true;
}

function drawIpadScreen(now) {
  const ctx = ipadCtx;
  const width = ipadCanvas.width;
  const height = ipadCanvas.height;
  ctx.clearRect(0, 0, width, height);

  // device shell
  const shell = ctx.createLinearGradient(0, 0, 0, height);
  shell.addColorStop(0, "#1a2632");
  shell.addColorStop(1, "#0d1217");
  ctx.fillStyle = shell;
  ctx.fillRect(0, 0, width, height);

  // status bar
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, 0, width, 36);
  ctx.strokeStyle = "rgba(155, 207, 229, 0.28)";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // paper note area
  const noteX = 22;
  const noteY = 56;
  const noteW = width - 44;
  const noteH = height - 88;
  const note = ctx.createLinearGradient(noteX, noteY, noteX, noteY + noteH);
  note.addColorStop(0, "#f5e8ba");
  note.addColorStop(1, "#d6c596");
  ctx.fillStyle = note;
  ctx.fillRect(noteX, noteY, noteW, noteH);
  ctx.strokeStyle = "rgba(95, 78, 52, 0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(noteX, noteY, noteW, noteH);

  // status-bar headers
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(208, 238, 248, 0.96)";
  ctx.font = "bold 18px Cascadia Code, Consolas, monospace";
  ctx.fillText("FIELD NOTE TABLET", 22, 11);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(136, 181, 199, 0.85)";
  ctx.font = "bold 15px Cascadia Code, Consolas, monospace";
  ctx.fillText(
    state.started && !state.finished ? `STAGE ${pad(state.stageIndex + 1)}/${TOTAL_STAGES}` : "STANDBY",
    width - 22,
    13
  );
  ctx.textAlign = "left";

  if (!state.started) {
    ctx.fillStyle = "#2f2416";
    ctx.font = "bold 34px Palatino Linotype, serif";
    ctx.fillText("Awaiting Shift", 36, noteY + 20);
    ctx.fillStyle = "rgba(70, 54, 34, 0.94)";
    ctx.font = "22px Palatino Linotype, serif";
    drawWrappedText(ctx, "The tablet stays sealed until the shift begins.", 36, noteY + 74, noteW - 28, 28);

    ctx.fillStyle = "rgba(22, 31, 37, 0.9)";
    ctx.fillRect(30, height - 62, width - 60, 40);
    ctx.strokeStyle = "rgba(131, 171, 191, 0.42)";
    ctx.strokeRect(30, height - 62, width - 60, 40);
    ctx.fillStyle = "rgba(227, 239, 244, 0.94)";
    ctx.font = "bold 15px Cascadia Code, Consolas, monospace";
    ctx.fillText("BEGIN SHIFT TO UNLOCK NOTE", 46, height - 48);
  } else if (state.finished) {
    ctx.fillStyle = state.won ? "#2f2516" : "#411e16";
    ctx.font = "bold 34px Palatino Linotype, serif";
    ctx.fillText(state.won ? "Shift Complete" : "Signal Failed", 36, noteY + 20);
    ctx.fillStyle = "rgba(72, 56, 36, 0.94)";
    ctx.font = "22px Palatino Linotype, serif";
    drawWrappedText(
      ctx,
      state.won
        ? "The room loosened its grip. The channels finally held still."
        : "The shift was lost. Reset to try again.",
      36,
      noteY + 74,
      noteW - 28,
      28
    );
    ctx.fillStyle = "rgba(22, 31, 37, 0.9)";
    ctx.fillRect(30, height - 62, width - 60, 40);
    ctx.strokeStyle = "rgba(131, 171, 191, 0.42)";
    ctx.strokeRect(30, height - 62, width - 60, 40);
    ctx.fillStyle = "rgba(227, 239, 244, 0.94)";
    ctx.font = "bold 15px Cascadia Code, Consolas, monospace";
    ctx.fillText(state.won ? "ALL 18 STAGES HELD" : "RESET TO TRY AGAIN", 46, height - 48);
  } else {
    const stage = STAGES[state.stageIndex];

    // Stage ribbon
    ctx.fillStyle = "rgba(95, 73, 44, 0.18)";
    ctx.fillRect(noteX + 8, noteY + 14, noteW - 16, 48);
    ctx.fillStyle = "rgba(110, 84, 48, 0.94)";
    ctx.font = "bold 15px Cascadia Code, Consolas, monospace";
    ctx.fillText("STAGE", noteX + 20, noteY + 25);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(52, 38, 21, 0.98)";
    ctx.font = "bold 26px Cascadia Code, Consolas, monospace";
    ctx.fillText(`${pad(state.stageIndex + 1)}/${TOTAL_STAGES}`, noteX + noteW - 20, noteY + 22);
    ctx.textAlign = "left";

    // MISSION heading
    ctx.fillStyle = "rgba(46, 34, 20, 0.98)";
    ctx.font = "bold 42px Palatino Linotype, serif";
    const headingY = noteY + 94;
    ctx.fillText("MISSION", noteX + 14, headingY);

    ctx.strokeStyle = "rgba(74, 58, 36, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(noteX + 14, headingY + 40);
    ctx.lineTo(noteX + noteW - 14, headingY + 40);
    ctx.stroke();

    // Body lines (the rule/mission text itself)
    ctx.fillStyle = "rgba(52, 38, 21, 0.98)";
    ctx.font = "24px Palatino Linotype, serif";
    let bodyY = headingY + 72;
    for (const line of resolveStageLines(stage)) {
      const used = drawWrappedText(ctx, line, noteX + 20, bodyY, noteW - 40, 30);
      bodyY += used + 20;
    }

    // Footer with controls
    ctx.fillStyle = "rgba(22, 31, 37, 0.92)";
    ctx.fillRect(30, height - 74, width - 60, 52);
    ctx.strokeStyle = "rgba(131, 171, 191, 0.42)";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, height - 74, width - 60, 52);
    ctx.fillStyle = "rgba(226, 238, 243, 0.96)";
    ctx.font = "bold 16px Cascadia Code, Consolas, monospace";
    ctx.fillText("R = RED BUTTON    F = SKIP", 46, height - 58);
    ctx.fillStyle = "rgba(214, 120, 104, 0.94)";
    ctx.font = "bold 14px Cascadia Code, Consolas, monospace";
    const cursor = Math.floor(now * 2) % 2 === 0 ? " _" : "";
    ctx.fillText(`READ MISSION, THEN DECIDE${cursor}`, 46, height - 36);
  }

  // faint CRT scanlines across the tablet
  for (let y = 0; y < height; y += 6) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
    ctx.fillRect(0, y, width, 1);
  }

  ipadTexture.needsUpdate = true;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let offsetY = 0;
  let linesDrawn = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + offsetY);
      line = word;
      offsetY += lineHeight;
      linesDrawn += 1;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y + offsetY);
    linesDrawn += 1;
  }
  return Math.max(lineHeight, linesDrawn * lineHeight);
}

function drawMonitor(now) {
  const ctx = monitorCtx;
  const width = monitorCanvas.width;
  const height = monitorCanvas.height;
  ctx.clearRect(0, 0, width, height);

  try {
    if (!state.started) {
      drawIntroFeed(ctx, width, height, now);
    } else if (state.exploding) {
      drawExplodingMonitor(ctx, width, height, now);
    } else if (state.finished) {
      drawEndFeed(ctx, width, height, now);
    } else if (state.refreshTimer > 0) {
      drawRefreshFeed(ctx, width, height, now);
    } else {
      const stage = STAGES[state.stageIndex];
      if (!stage) {
        drawIntroFeed(ctx, width, height, now);
      } else {
        const anomaly = stage.anomaly && stage.anomaly.channelIndex === state.currentChannel ? stage.anomaly : null;
        switch (state.currentChannel) {
          case 0:
            drawThermalFeed(ctx, width, height, now, anomaly);
            break;
          case 1:
            drawRibFeed(ctx, width, height, now, anomaly);
            break;
          case 2:
            drawPipeFeed(ctx, width, height, now, anomaly);
            break;
          case 3:
            drawWatcherFeed(ctx, width, height, now, anomaly);
            break;
          case 4:
            drawSigilFeed(ctx, width, height, now, anomaly);
            break;
          case 5:
            drawStormFeed(ctx, width, height, now, anomaly);
            break;
          case 6:
            drawClockFeed(ctx, width, height, now, anomaly);
            break;
          default:
            break;
        }
        drawFeedOverlay(ctx, width, height, now, anomaly);
      }
    }
  } catch (err) {
    console.error("drawMonitor threw — showing FEED ERROR:", err);
    const channel = CHANNELS[state.currentChannel] || { name: "UNKNOWN", accent: "#c73f2c" };
    ctx.fillStyle = "#120607";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = channel.accent || "#c73f2c";
    ctx.font = "bold 28px Cascadia Code, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`FEED ERROR — CH ${state.currentChannel + 1}`, width / 2, height / 2 - 12);
    ctx.font = "bold 16px Cascadia Code, Consolas, monospace";
    ctx.fillStyle = "rgba(232, 221, 194, 0.7)";
    ctx.fillText(channel.name.toUpperCase(), width / 2, height / 2 + 18);
    drawScanlines(ctx, width, height);
  }

  monitorTexture.needsUpdate = true;
}

function drawIntroFeed(ctx, width, height, now) {
  ctx.fillStyle = "#0c1014";
  ctx.fillRect(0, 0, width, height);
  drawMonitorNoise(ctx, width, height, 0.1, now);
  ctx.strokeStyle = "rgba(216, 174, 120, 0.34)";
  ctx.strokeRect(20, 20, width - 40, height - 40);
  ctx.fillStyle = "rgba(243, 216, 171, 0.88)";
  ctx.font = "bold 34px Palatino Linotype, serif";
  ctx.textAlign = "center";
  ctx.fillText("RED SIGNAL SHIFT", width / 2, height / 2 - 34);
  ctx.font = "18px Cascadia Code, Consolas, monospace";
  ctx.fillStyle = "rgba(124, 178, 202, 0.8)";
  ctx.fillText("CLICK TO WAKE THE ROOM", width / 2, height / 2 + 10);
  ctx.fillStyle = "rgba(214, 200, 171, 0.6)";
  ctx.fillText("Q/E feed swap   R/F decide   I note", width / 2, height / 2 + 48);
  drawScanlines(ctx, width, height);
}

function drawEndFeed(ctx, width, height, now) {
  const death = state.endReason === "death";
  ctx.fillStyle = state.won ? "#0a1110" : death ? "#140506" : "#12090a";
  ctx.fillRect(0, 0, width, height);
  drawMonitorNoise(ctx, width, height, state.won ? 0.05 : 0.12, now);
  ctx.textAlign = "center";
  ctx.fillStyle = state.won ? "rgba(210, 224, 206, 0.86)" : "rgba(239, 180, 167, 0.9)";
  ctx.font = "bold 32px Palatino Linotype, serif";
  ctx.fillText(state.won ? "SHIFT COMPLETE" : death ? "YOU DIED." : "SIGNAL LOST", width / 2, height / 2 - 16);
  ctx.font = "18px Cascadia Code, Consolas, monospace";
  ctx.fillText(state.won ? "THE ROOM IS QUIET" : death ? "THE DESK REMEMBERED" : "TIME HAS EATEN THE FEED", width / 2, height / 2 + 26);
  drawScanlines(ctx, width, height);
}

function drawRefreshFeed(ctx, width, height, now) {
  const progress = 1 - state.refreshTimer / SCREEN_REFRESH_DURATION;
  ctx.fillStyle = "#020304";
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (progress < 0.5) {
    // Big CORRECT banner for ~2.5 seconds
    const p = progress / 0.5;
    const alpha = p < 0.08 ? p / 0.08 : p > 0.92 ? Math.max(0, (1 - p) / 0.08) : 1;
    const scale = 0.92 + Math.sin(p * Math.PI) * 0.14;

    // soft green wash
    ctx.fillStyle = `rgba(34, 78, 52, ${0.28 * alpha})`;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2 - 8);
    ctx.scale(scale, scale);
    ctx.shadowColor = `rgba(147, 214, 168, ${0.85 * alpha})`;
    ctx.shadowBlur = 36;
    ctx.fillStyle = `rgba(216, 244, 214, ${alpha})`;
    ctx.font = "bold 118px Cascadia Code, Consolas, monospace";
    ctx.fillText("CORRECT", 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.fillStyle = `rgba(180, 220, 190, ${alpha * 0.78})`;
    ctx.font = "bold 20px Cascadia Code, Consolas, monospace";
    ctx.fillText("STAGE CLEARED", width / 2, height / 2 + 76);

    // subtle checkbox dashes
    ctx.strokeStyle = `rgba(170, 226, 186, ${alpha * 0.5})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, width - 72, height - 72);
  } else if (progress < 0.58) {
    // CRT power-off: bright horizontal line that collapses
    const collapse = (progress - 0.5) / 0.08;
    const lineY = height / 2;
    const thickness = Math.max(1, (1 - collapse) * 14);
    ctx.fillStyle = "rgba(255, 246, 220, 0.95)";
    ctx.fillRect(10, lineY - thickness / 2, width - 20, thickness);
    ctx.fillStyle = `rgba(255, 246, 220, ${0.22 * (1 - collapse)})`;
    ctx.fillRect(0, lineY - thickness * 2, width, thickness * 4);
  } else if (progress < 0.8) {
    // dead black phase - no noise
  } else if (progress < 0.92) {
    // boot-up: CRT warm-up with flicker
    const boot = (progress - 0.8) / 0.12;
    ctx.fillStyle = `rgba(18, 26, 34, ${0.2 + boot * 0.4})`;
    ctx.fillRect(0, 0, width, height);
    const flicker = 0.55 + Math.sin(now * 40) * 0.3;
    ctx.fillStyle = `rgba(126, 210, 180, ${0.18 * boot * flicker})`;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = `rgba(180, 230, 210, ${0.72 * boot})`;
    ctx.font = "bold 16px Cascadia Code, Consolas, monospace";
    ctx.fillText("SIGNAL RESTORING...", width / 2, height / 2);
  } else {
    // stage indicator: new stage number pops
    const intro = (progress - 0.92) / 0.08;
    ctx.strokeStyle = `rgba(210, 228, 236, ${0.4 * intro})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, width - 48, height - 48);
    const scale = 0.6 + intro * 0.4;
    ctx.save();
    ctx.translate(width / 2, height / 2 - 8);
    ctx.scale(scale, scale);
    ctx.fillStyle = `rgba(245, 232, 205, ${intro})`;
    ctx.font = "bold 24px Cascadia Code, Consolas, monospace";
    ctx.fillText("STAGE", 0, -58);
    ctx.shadowColor = "rgba(255, 198, 142, 0.8)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = `rgba(255, 216, 162, ${intro})`;
    ctx.font = "bold 96px Cascadia Code, Consolas, monospace";
    ctx.fillText(pad(state.renewalStageIndex), 0, 36);
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.fillStyle = `rgba(160, 200, 220, ${0.7 * intro})`;
    ctx.font = "bold 14px Cascadia Code, Consolas, monospace";
    ctx.fillText("FEED LIVE", width / 2, height - 42);
  }
  drawScanlines(ctx, width, height);
}

function drawExplodingMonitor(ctx, width, height, now) {
  const progress = 1 - Math.max(0, state.explosionTimer) / EXPLOSION_DURATION;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  if (progress < 0.14) {
    // bright white flash
    const flash = 1 - progress / 0.14;
    ctx.fillStyle = `rgba(255, 246, 224, ${flash})`;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255, 120, 80, 0.9)";
    ctx.font = "bold 56px Cascadia Code, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!!!", width / 2, height / 2);
  } else {
    // aftermath: heavy static, red glow, jittering error text
    const age = (progress - 0.14) / 0.86;
    ctx.fillStyle = `rgba(40, 6, 4, ${0.6 + Math.random() * 0.3})`;
    ctx.fillRect(0, 0, width, height);
    drawMonitorNoise(ctx, width, height, 0.55 - age * 0.3, now);

    // torn horizontal bars
    for (let i = 0; i < 14; i += 1) {
      const y = Math.random() * height;
      const h = 2 + Math.random() * 18;
      ctx.fillStyle = `rgba(255, ${60 + Math.random() * 80}, ${20 + Math.random() * 40}, ${0.4 + Math.random() * 0.3})`;
      ctx.fillRect(0, y, width, h);
    }

    // glass cracks radiating from center
    ctx.strokeStyle = `rgba(255, 220, 200, ${0.7 - age * 0.4})`;
    ctx.lineWidth = 2;
    const cx = width / 2;
    const cy = height / 2;
    const crackSeed = Math.floor(now * 4);
    for (let i = 0; i < 9; i += 1) {
      const angle = (i / 9) * Math.PI * 2 + Math.sin(crackSeed + i) * 0.3;
      const len = 80 + Math.random() * 140;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      let x = cx;
      let y = cy;
      const segments = 4;
      for (let s = 0; s < segments; s += 1) {
        const step = len / segments;
        x += Math.cos(angle) * step + (Math.random() - 0.5) * 14;
        y += Math.sin(angle) * step + (Math.random() - 0.5) * 14;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // burnt hole in center
    const holeR = 22 + age * 28;
    const holeGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, holeR);
    holeGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
    holeGrad.addColorStop(0.5, "rgba(40, 10, 6, 0.9)");
    holeGrad.addColorStop(1, "rgba(120, 40, 24, 0)");
    ctx.fillStyle = holeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, holeR, 0, Math.PI * 2);
    ctx.fill();

    if (Math.random() < 0.65) {
      ctx.fillStyle = "rgba(255, 120, 92, 0.92)";
      ctx.font = "bold 24px Cascadia Code, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const jitter = (Math.random() - 0.5) * 10;
      ctx.fillText("SIGNAL LOST", cx + jitter, 72 + (Math.random() - 0.5) * 4);
      ctx.fillText("YOU DIED.", cx + jitter * 0.7, height - 72 + (Math.random() - 0.5) * 4);
    }
  }

  // draw sparks on top (particles)
  for (const spark of state.sparks) {
    const alpha = Math.max(0, spark.life / spark.maxLife);
    ctx.fillStyle = `rgba(255, ${180 + Math.random() * 60}, ${120 + Math.random() * 80}, ${alpha})`;
    ctx.fillRect(spark.x - spark.size / 2, spark.y - spark.size / 2, spark.size, spark.size);
  }

  drawScanlines(ctx, width, height);
}

function drawFeedBase(ctx, width, height, background, accent) {
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const wash = ctx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, "rgba(255,255,255,0.15)");
  wash.addColorStop(0.5, "rgba(255,255,255,0.08)");
  wash.addColorStop(1, "rgba(255,255,255,0.05)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let x = 0; x < width; x += 16) {
    ctx.fillRect(x, 0, 1, height);
  }
  for (let y = 0; y < height; y += 16) {
    ctx.fillRect(0, y, width, 1);
  }
  // Removed the inner highlight bar and the accent frame outline —
  // content now sits flush on the feed background.
}

function drawAnalogClock(ctx, cx, cy, radius, label, t, options = {}) {
  const speed = options.speed || 1;
  const rawT = options.frozen ? 0 : t * speed;
  const effectiveT = options.jumpy ? Math.floor(rawT) : rawT;
  const clock = getClockState(effectiveT, options.utcOffset || 0, options.reverse);
  if (options.reverseSecond) {
    // recompute only the second hand to run in the opposite direction at normal speed
    const reversed = getClockState(-rawT, options.utcOffset || 0, false);
    clock.secondAngle = reversed.secondAngle;
  }

  ctx.fillStyle = "rgba(9, 12, 15, 0.92)";
  ctx.beginPath();
  if (options.oval) {
    ctx.ellipse(cx, cy, radius * 1.08, radius * 0.92, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.strokeStyle = options.ring || "rgba(248, 224, 187, 0.8)";
  ctx.lineWidth = 3;
  ctx.stroke();

  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + Math.cos(angle) * (radius - 10);
    const y1 = cy + Math.sin(angle) * (radius - 10);
    const x2 = cx + Math.cos(angle) * (radius - 4);
    const y2 = cy + Math.sin(angle) * (radius - 4);
    ctx.strokeStyle = "rgba(255, 236, 208, 0.62)";
    ctx.lineWidth = i % 3 === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  const hourWidth = options.swapHandThickness ? 3 : 5;
  const minuteWidth = options.swapHandThickness ? 5 : 3;

  ctx.strokeStyle = "rgba(245, 231, 208, 0.92)";
  ctx.lineWidth = hourWidth;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(clock.hourAngle) * (radius * 0.46), cy + Math.sin(clock.hourAngle) * (radius * 0.46));
  ctx.stroke();

  if (options.missingHand !== "minute") {
    ctx.lineWidth = minuteWidth;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(clock.minuteAngle) * (radius * 0.7), cy + Math.sin(clock.minuteAngle) * (radius * 0.7));
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255, 120, 86, 0.94)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(clock.secondAngle) * (radius * 0.78), cy + Math.sin(clock.secondAngle) * (radius * 0.78));
  ctx.stroke();

  if (options.extra) {
    const extraAngle = ((t * 1.85) % 60) / 60 * Math.PI * 2 - Math.PI / 2 + 0.45;
    ctx.strokeStyle = "rgba(255, 62, 62, 0.96)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(extraAngle) * (radius * 0.62), cy + Math.sin(extraAngle) * (radius * 0.62));
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(247, 236, 214, 0.88)";
  ctx.font = "bold 11px Cascadia Code, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.fillText(clock.digital, cx, cy + radius - 10);

  ctx.font = "bold 14px Cascadia Code, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(235, 224, 198, 0.86)";
  ctx.fillText(label, cx, cy + radius + 20);
}

function drawThermalFeed(ctx, width, height, now, anomaly) {
  drawFeedBase(ctx, width, height, "#241c16", "rgba(244,198,132,0.48)");
  ctx.fillStyle = "rgba(255, 241, 214, 0.9)";
  ctx.font = "bold 20px Cascadia Code, Consolas, monospace";
  ctx.textAlign = "center";
  const title = anomaly?.kind === "header-clockss" ? "THREE CLOCKSS" : "THREE CLOCKS";
  ctx.fillText(title, width / 2, 52);

  // Pick which of the three clocks is affected (default middle clock, index 1)
  const anomalyClockIndex = anomaly ? (anomaly.clockIndex ?? 1) : -1;

  const baseCards = [
    { x: 24, cx: 90, label: "UTC-5", utcOffset: -5 },
    { x: 190, cx: 256, label: "UTC+0", utcOffset: 0 },
    { x: 356, cx: 422, label: "UTC+9", utcOffset: 9 }
  ];

  for (let i = 0; i < baseCards.length; i += 1) {
    const card = baseCards[i];
    const opts = {
      utcOffset: card.utcOffset,
      reverse: false,
      extra: false,
      frozen: false,
      speed: 1,
      missingHand: null,
      ring: undefined
    };
    let label = card.label;

    if (anomaly && i === anomalyClockIndex) {
      switch (anomaly.kind) {
        case "reverse":
          opts.reverse = true;
          break;
        case "frozen":
          opts.frozen = true;
          break;
        case "fast":
          opts.speed = 9;
          break;
        case "missing-hand":
          opts.missingHand = "minute";
          break;
        case "label-wrong":
          label = i === 0 ? "UTC+9" : i === 1 ? "UTC-5" : "UTC+0";
          break;
        case "extra":
          opts.extra = true;
          break;
        case "2x-speed":
          opts.speed = 2;
          break;
        case "hand-thickness":
          opts.swapHandThickness = true;
          break;
        case "jumpy-tick":
          opts.jumpy = true;
          break;
        case "off-one-hour":
          opts.utcOffset = (card.utcOffset || 0) + 1;
          break;
        case "reverse-second":
          opts.reverseSecond = true;
          break;
        case "oval-face":
          opts.oval = true;
          break;
        case "label-typo":
          // Render the label text with a corrupt digit but keep the real time
          label = card.label.replace(/\d/g, (d) => (d === "9" ? "4" : d));
          break;
        default:
          break;
      }
    }

    // Clock cards render directly on the feed — no dark backdrop, no outline.
    drawAnalogClock(ctx, card.cx, 160, 52, label, now, opts);
  }
}

function drawDollarBill(ctx, x, y, rotation, denomination, options = {}) {
  const { upsideDown = false, scale = 1, noSerial = false, dimSerial = false, smallCircle = false } = options;
  ctx.save();
  ctx.translate(x + 36, y + 22);
  ctx.rotate(rotation + (upsideDown ? Math.PI : 0));
  ctx.scale(scale, scale);
  ctx.translate(-36, -22);

  ctx.fillStyle = "rgba(118, 164, 108, 0.96)";
  ctx.fillRect(0, 0, 72, 44);
  ctx.strokeStyle = "rgba(205, 232, 192, 0.84)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 72, 44);
  ctx.strokeRect(6, 5, 60, 34);
  ctx.beginPath();
  ctx.arc(36, 22, smallCircle ? 7.5 : 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(234, 248, 226, 0.96)";
  ctx.font = "bold 16px Cascadia Code, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.fillText(String(denomination), 36, 27);
  if (!noSerial) {
    ctx.font = "bold 12px Cascadia Code, Consolas, monospace";
    ctx.fillStyle = dimSerial ? "rgba(234, 248, 226, 0.35)" : "rgba(234, 248, 226, 0.96)";
    ctx.fillText(String(denomination), 12, 16);
    ctx.fillText(String(denomination), 60, 16);
  }
  ctx.restore();
}

function drawRibFeed(ctx, width, height, now, anomaly) {
  drawFeedBase(ctx, width, height, "#142116", "rgba(171,224,146,0.5)");
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(226, 247, 214, 0.92)";
  ctx.font = "bold 20px Cascadia Code, Consolas, monospace";
  const title = anomaly?.kind === "header-cunter" ? "MONEY CUNTER" : "MONEY COUNTER";
  ctx.fillText(title, width / 2, 52);

  const baseLayout = [
    { x: 28, y: 82 }, { x: 110, y: 82 }, { x: 192, y: 82 }, { x: 274, y: 82 }, { x: 356, y: 82 },
    { x: 48, y: 148 }, { x: 130, y: 148 }, { x: 212, y: 148 }, { x: 294, y: 148 },
    { x: 68, y: 214 }, { x: 150, y: 214 }, { x: 232, y: 214 }, { x: 314, y: 214 },
    { x: 396, y: 214 } // reserved for "extra" anomaly
  ];

  // "total-late" pulses a 14th bill in/out, the total lags behind
  const pulseVisible = Math.sin(now * 1.2) > 0;
  const latePulseVisible = Math.sin((now - 0.7) * 1.2) > 0;

  const visibleCount = (() => {
    if (anomaly?.kind === "extra") return 14;
    if (anomaly?.kind === "missing-same-total") return 12;
    if (anomaly?.kind === "total-late") return pulseVisible ? 14 : 13;
    return 13;
  })();
  const bills = baseLayout.slice(0, visibleCount);

  let total = 0;
  for (let i = 0; i < bills.length; i += 1) {
    let denomination = 1;
    let flutter = false;
    const opts = { upsideDown: false, scale: 1, noSerial: false };
    let extraRotation = 0;

    if (anomaly) {
      if (anomaly.kind === "different-denom" && i === 8) {
        denomination = 5;
      } else if (anomaly.kind === "spin" && i === 5) {
        flutter = true;
      } else if (anomaly.kind === "upside-down" && i === 4) {
        opts.upsideDown = true;
      } else if (anomaly.kind === "bill-smaller" && i === 7) {
        opts.scale = 0.92;
      } else if (anomaly.kind === "no-serial" && i === 6) {
        opts.noSerial = true;
      } else if (anomaly.kind === "bill-rotated" && i === 9) {
        extraRotation = 0.14;
      } else if (anomaly.kind === "small-bill-circle" && i === 10) {
        opts.smallCircle = true;
      }
    }

    total += denomination;

    const baseAngle = ((i % 5) - 2) * 0.02;
    const angle = baseAngle + extraRotation + (flutter ? Math.sin(now * 14) * 0.18 : 0);
    const y = bills[i].y + (flutter ? Math.sin(now * 14) * 5 : 0);
    drawDollarBill(ctx, bills[i].x, y, angle, denomination, opts);
  }

  // Displayed total can diverge from real bill total
  let displayedTotal = total;
  if (anomaly?.kind === "wrong-total") {
    displayedTotal = total + 2;
  } else if (anomaly?.kind === "missing-same-total") {
    displayedTotal = 13;
  } else if (anomaly?.kind === "off-one-dollar") {
    displayedTotal = total - 1;
  } else if (anomaly?.kind === "total-late") {
    displayedTotal = latePulseVisible ? 14 : 13;
  }

  // Total text sits on the feed itself — no dark backdrop or outline.
  ctx.fillStyle = "rgba(232, 246, 223, 0.94)";
  ctx.font = "bold 22px Cascadia Code, Consolas, monospace";
  const totalStr = anomaly?.kind === "total-lowercase-l"
    ? `TOTAL $${String(displayedTotal).replace(/1/g, "l")}`
    : `TOTAL $${displayedTotal}`;
  ctx.fillText(totalStr, width / 2, 329);
}

function drawPipeFeed(ctx, width, height, now, anomaly) {
  drawFeedBase(ctx, width, height, "#12281f", "rgba(126,219,166,0.48)");
  const cx = 256;
  const cy = 196;
  const radius = 104;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(208, 248, 223, 0.9)";
  ctx.font = "bold 20px Cascadia Code, Consolas, monospace";
  const radarTitle = anomaly?.kind === "header-rarar" ? "RARAR" : "RADAR";
  ctx.fillText(radarTitle, width / 2, 52);
  ctx.strokeStyle = "rgba(150, 234, 179, 0.72)";
  for (let ring = 1; ring <= 4; ring += 1) {
    ctx.lineWidth = anomaly?.kind === "thick-ring" && ring === 2 ? 4 : 2;
    ctx.beginPath();
    ctx.arc(cx, cy, ring * 24, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.lineWidth = 2;
  // crosshair (optionally off center)
  const crossOffsetX = anomaly?.kind === "off-center" ? 4 : 0;
  const crossOffsetY = anomaly?.kind === "off-center" ? -3 : 0;
  ctx.beginPath();
  ctx.moveTo(cx - radius + crossOffsetX, cy + crossOffsetY);
  ctx.lineTo(cx + radius + crossOffsetX, cy + crossOffsetY);
  ctx.moveTo(cx + crossOffsetX, cy - radius + crossOffsetY);
  ctx.lineTo(cx + crossOffsetX, cy + radius + crossOffsetY);
  ctx.stroke();

  const sweepSpeed = anomaly?.kind === "fast-sweep" ? 0.72 : 0.55;
  const isStopped = anomaly?.kind === "sweep-stop";
  const sweepBase = isStopped ? 0.8 : (anomaly?.kind === "reverse" ? -now * sweepSpeed : now * sweepSpeed);
  const sweep = sweepBase - Math.PI / 2;
  const sweepDirection = anomaly?.kind === "reverse" ? -1 : 1;
  const sweepRadius = anomaly?.kind === "short-sweep" ? radius * 0.78 : radius;

  const sweepsToDraw = anomaly?.kind === "double-sweep" ? [sweep, sweep + Math.PI] : [sweep];
  for (const s of sweepsToDraw) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "rgba(140, 255, 182, 0.24)";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, sweepRadius, s - 0.2, s + 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(140, 255, 182, 0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(s) * sweepRadius, cy + Math.sin(s) * sweepRadius);
    ctx.stroke();
  }

  // Normal echoes — fade tail width depends on "slow-fade"
  const fadeSpan = anomaly?.kind === "slow-fade" ? 1.25 : 0.48;
  for (let i = 0; i < 5; i += 1) {
    const echo = getRadarEcho(i);
    const x = cx + Math.cos(echo.angle) * echo.distance;
    const y = cy + Math.sin(echo.angle) * echo.distance;
    const trailDelta = Math.atan2(Math.sin((sweep - echo.angle) * sweepDirection), Math.cos((sweep - echo.angle) * sweepDirection));
    const alpha = trailDelta < 0 || trailDelta > fadeSpan ? 0 : 1 - trailDelta / fadeSpan;
    if (alpha <= 0 && !isStopped) continue;
    ctx.fillStyle = `rgba(188, 255, 210, ${Math.max(alpha, isStopped ? 0.4 : 0)})`;
    ctx.beginPath();
    ctx.arc(x, y, echo.size, 0, Math.PI * 2);
    ctx.fill();
  }

  if (anomaly?.kind === "ghost") {
    const pulse = 0.62 + Math.sin(now * 4.2) * 0.18;
    ctx.fillStyle = `rgba(188, 255, 210, ${pulse})`;
    ctx.beginPath();
    ctx.arc(cx + 54, cy - 24, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Blip behind the center circle (impossible position)
  if (anomaly?.kind === "blip-behind") {
    const pulse = 0.5 + Math.sin(now * 4) * 0.25;
    ctx.fillStyle = `rgba(188, 255, 210, ${pulse})`;
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 4, 4.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Blips arranged in a perfect square
  if (anomaly?.kind === "shape-blips") {
    const pulse = 0.75 + Math.sin(now * 5) * 0.2;
    ctx.fillStyle = `rgba(188, 255, 210, ${pulse})`;
    const corners = [
      [cx - 56, cy - 56], [cx + 56, cy - 56], [cx + 56, cy + 56], [cx - 56, cy + 56]
    ];
    for (const [bx, by] of corners) {
      ctx.beginPath();
      ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawWatcherFeed(ctx, width, height, now, anomaly) {
  drawFeedBase(ctx, width, height, "#1f1f15", "rgba(244,216,132,0.48)");
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(249, 236, 192, 0.88)";
  ctx.font = "bold 20px Cascadia Code, Consolas, monospace";
  const eqTitle = anomaly?.kind === "header-fed" ? "EQUATION FED" : "EQUATION FEED";
  ctx.fillText(eqTitle, 34, 48);
  const lineHeight = 34;
  const scrollSpeed = 16;
  const lines = EQUATION_SCROLL_LINES.slice();
  const anomalyLine = 4;
  if (anomaly?.kind === "wrong") {
    lines[anomalyLine] = "7 + 5 = 15";
  } else if (anomaly?.kind === "duplicate") {
    lines[5] = lines[4];
  } else if (anomaly?.kind === "divzero") {
    lines[anomalyLine] = "8 / 0 = 8";
  } else if (anomaly?.kind === "double-equals") {
    lines[anomalyLine] = "3 + 4 = 7 = 7";
  } else if (anomaly?.kind === "missing-op") {
    lines[anomalyLine] = "6   2 = 4";
  } else if (anomaly?.kind === "sign-flip") {
    lines[anomalyLine] = "2 - 9 = 7";
  } else if (anomaly?.kind === "off-one") {
    lines[anomalyLine] = "7 + 5 = 13";
  } else if (anomaly?.kind === "extra-space") {
    lines[anomalyLine] = "3 +  4 = 7";
  } else if (anomaly?.kind === "repeat-twice") {
    lines[5] = lines[4];
  } else if (anomaly?.kind === "long-equals") {
    lines[anomalyLine] = lines[anomalyLine].replace("=", "==");
  }
  const totalHeight = lines.length * lineHeight;
  const travel = (now * scrollSpeed) % totalHeight;
  ctx.save();
  ctx.beginPath();
  ctx.rect(34, 72, width - 68, height - 108);
  ctx.clip();
  for (let i = 0; i < lines.length; i += 1) {
    let baseOffset = i * lineHeight;
    if (anomaly?.kind === "fast-line" && i === anomalyLine) {
      baseOffset -= (now * 6) % lineHeight;
    }
    let y = 72 + baseOffset - travel;
    while (y < 56 - lineHeight) {
      y += totalHeight;
    }
    if (y > height - 18) {
      continue;
    }
    const text = lines[i];
    const tone = "rgba(247, 235, 196, 0.94)";
    ctx.font = anomaly?.kind === "font-weight" && i === anomalyLine
      ? "300 24px Cascadia Code, Consolas, monospace"
      : "bold 24px Cascadia Code, Consolas, monospace";
    // No dark row background; equations sit on the feed directly.
    ctx.fillStyle = tone;
    ctx.fillText(text, 52, y);
  }
  ctx.restore();
}

function drawSigilFeed(ctx, width, height, now, anomaly) {
  drawFeedBase(ctx, width, height, "#281d18", "rgba(231,199,162,0.46)");
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(244, 224, 196, 0.9)";
  ctx.font = "bold 20px Cascadia Code, Consolas, monospace";
  const twTitle = anomaly?.kind === "header-typewrlter" ? "TYPEWRLTER" : "TYPEWRITER";
  ctx.fillText(twTitle, width / 2, 20);
  const typing = anomaly?.kind === "reverse-type"
    ? getTypewriterState(Math.max(0, TYPEWRITER_SCRIPT_DURATION - (now % TYPEWRITER_SCRIPT_DURATION)))
    : getTypewriterState(now);
  const lines = typing.lines.slice(-6);
  const alertIdx = Math.min(2, Math.max(0, lines.length - 1));

  if (anomaly?.kind === "alert") {
    lines[alertIdx] = "03:17 ALERT: ACCESS HATCH OPEN";
  } else if (anomaly?.kind === "bad-word") {
    const target = lines[alertIdx] || "";
    lines[alertIdx] = target.length > 8
      ? target.replace(/(\s)(\S+)(\s|$)/, "$1bathtub$3")
      : "03:17 bathtub seal corridor";
  } else if (anomaly?.kind === "repeat-line") {
    const prev = lines[Math.max(0, lines.length - 2)];
    if (prev) lines[lines.length - 1] = prev;
  } else if (anomaly?.kind === "rev-time") {
    const target = lines[alertIdx] || "";
    lines[alertIdx] = target.replace(/^\d{2}:\d{2}/, "03:05");
  } else if (anomaly?.kind === "wrong-continue") {
    const target = lines[alertIdx] || "";
    lines[alertIdx] = target.replace(/(\s\S{3,})(\s|$)/, "$1 corridor sealed toast$2");
  } else if (anomaly?.kind === "reverse-type") {
    const target = lines[lines.length - 1] || "";
    lines[lines.length - 1] = target.split("").reverse().join("");
  } else if (anomaly?.kind === "time-out-of-order") {
    const target = lines[alertIdx] || "";
    lines[alertIdx] = target.replace(/^\d{2}:\d{2}/, "03:13");
  } else if (anomaly?.kind === "typo") {
    const target = lines[alertIdx] || "";
    lines[alertIdx] = target
      .replace(/relay/, "realy")
      .replace(/manifold/, "manifld")
      .replace(/corridor/, "corridoor")
      .replace(/pressure/, "presure");
  } else if (anomaly?.kind === "extra-space-start") {
    lines[alertIdx] = "  " + (lines[alertIdx] || "");
  } else if (anomaly?.kind === "wrong-format") {
    const target = lines[alertIdx] || "";
    lines[alertIdx] = target.replace(/^(\d{2}):(\d{2})/, (_, h, m) => `${Number(h)}:${m} AM`);
  } else if (anomaly?.kind === "timestamp-typo") {
    const target = lines[alertIdx] || "";
    lines[alertIdx] = target.replace(/^03:11\b/, "03:1l");
    if (lines[alertIdx] === target) {
      lines[alertIdx] = target.replace(/^(\d{2}):(\d)(\d)/, "$1:$2l");
    }
  }

  const cursorSuppressed = anomaly?.kind === "cursor-stops" && (Math.floor(now) % 6) < 3;

  ctx.fillStyle = "rgba(237, 221, 198, 0.88)";
  ctx.font = "bold 18px Cascadia Code, Consolas, monospace";
  ctx.textAlign = "left";
  let subtitle = "FACILITY MAINTENANCE LOG";
  if (anomaly?.kind === "facility-typo") subtitle = subtitle.replace("FACILITY", "FAClLITY");
  else if (anomaly?.kind === "maintenance-typo") subtitle = subtitle.replace("MAINTENANCE", "MAINTENACE");
  ctx.fillText(subtitle, 34, 44);

  ctx.save();
  ctx.beginPath();
  ctx.rect(28, 68, width - 56, height - 112);
  ctx.clip();
  for (let i = 0; i < lines.length; i += 1) {
    const y = 88 + i * 38;
    // No dark row background; log lines sit on the feed itself.
    ctx.fillStyle = "rgba(232, 224, 210, 0.92)";
    ctx.font = "17px Cascadia Code, Consolas, monospace";
    ctx.fillText(lines[i], 34, y);
  }

  if (typing.cursorVisible && !cursorSuppressed) {
    const cursorLine = Math.max(0, lines.length - 1);
    const cursorText = lines[cursorLine] || "";
    const cursorX = Math.min(width - 44, 34 + ctx.measureText(cursorText).width + 4);
    const cursorY = 88 + cursorLine * 38;
    ctx.fillStyle = "rgba(232, 224, 210, 0.92)";
    ctx.fillRect(cursorX, cursorY - 16, 8, 18);
  }
  ctx.restore();

  if (anomaly?.kind === "redaction") {
    ctx.fillStyle = "rgba(10, 10, 10, 0.92)";
    ctx.fillRect(34, 154, width - 90, 18);
    ctx.strokeStyle = "rgba(255, 118, 98, 0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 154, width - 90, 18);
  }
}

function drawStormFeed(ctx, width, height, now, anomaly) {
  drawFeedBase(ctx, width, height, "#29171a", "rgba(255,124,104,0.5)");
  const elapsed = state.started ? START_TIME - state.timer : 0;

  // apply subtle time warps before computing display value
  let effectiveElapsed = elapsed;
  if (anomaly?.kind === "loses-2s") {
    // lose 2 extra seconds every 60s
    effectiveElapsed = elapsed + Math.floor(elapsed / 60) * 2;
  } else if (anomaly?.kind === "fast-seconds") {
    effectiveElapsed = elapsed * 1.08;
  }

  const base = Math.max(0, FEED_COUNTDOWN_START - Math.floor(effectiveElapsed));
  let countdown = base;
  if (anomaly?.kind === "freeze") {
    countdown = 5491;
  } else if (anomaly?.kind === "skip") {
    countdown = base - (base % 2);
  } else if (anomaly?.kind === "count-up") {
    countdown = Math.floor(elapsed);
  }

  // colon visibility (default blinks at 2 Hz; `colon-stops` keeps colons solid)
  const colonBlinkOn = Math.floor(now * 2) % 2 === 0;
  const showColons = anomaly?.kind === "colon-stops" ? true : colonBlinkOn;

  let display = formatFeedTime(countdown);
  if (!showColons) {
    display = display.replace(/:/g, " ");
  }
  if (anomaly?.kind === "digit-swap") {
    const chars = display.split("");
    const tmp = chars[3];
    chars[3] = chars[6];
    chars[6] = tmp;
    display = chars.join("");
  }

  // The countdown sits on the feed directly — no backdrop, no border.
  // The missing-corner anomaly needs some visible frame to indicate the broken
  // corner, so we only draw the border when that anomaly is active.
  if (anomaly?.kind === "missing-corner") {
    ctx.strokeStyle = "rgba(255, 128, 108, 0.52)";
    ctx.lineWidth = 2;
    const bx = 42, by = 82, bw = 428, bh = 176;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + bw - 24, by);
    ctx.moveTo(bx + bw, by + 24);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 206, 194, 0.94)";
  ctx.font = "bold 62px Cascadia Code, Consolas, monospace";

  // special per-digit rendering for "digit-flicker" and "digit-camouflage"
  if (anomaly?.kind === "digit-flicker" || anomaly?.kind === "digit-camouflage") {
    const chars = display.split("");
    const flickerDigitIndex = 4; // the second minute digit
    const flicker = Math.sin(now * 6.2) > 0.88;
    const camouflage = Math.floor(now) % 7 === 0 && (now % 1) < 0.18;
    ctx.textAlign = "left";
    const metrics = ctx.measureText(display);
    const startX = width / 2 - metrics.width / 2;
    let cursorX = startX;
    for (let i = 0; i < chars.length; i += 1) {
      const ch = chars[i];
      const isTarget = i === flickerDigitIndex;
      if (isTarget && anomaly.kind === "digit-flicker" && flicker) {
        ctx.fillStyle = "rgba(255, 206, 194, 0.35)";
      } else if (isTarget && anomaly.kind === "digit-camouflage" && camouflage) {
        ctx.fillStyle = "rgba(41, 23, 26, 1)";
      } else {
        ctx.fillStyle = "rgba(255, 206, 194, 0.94)";
      }
      ctx.fillText(ch, cursorX, 180);
      cursorX += ctx.measureText(ch).width;
    }
    ctx.textAlign = "center";
  } else {
    ctx.fillText(display, width / 2, 180);
  }

  ctx.fillStyle = "rgba(255, 199, 185, 0.82)";
  ctx.font = "bold 20px Cascadia Code, Consolas, monospace";
  const cdTitle = anomaly?.kind === "header-dwon" ? "COUNTDWON" : "COUNTDOWN";
  ctx.fillText(cdTitle, width / 2, 52);

  if (anomaly?.kind === "freeze") {
    ctx.fillText("HOLD", width / 2, 256);
  } else if (anomaly?.kind === "skip") {
    ctx.fillText("SKIPPING SECONDS", width / 2, 256);
  } else if (anomaly?.kind === "count-up") {
    ctx.fillText("COUNTING UP", width / 2, 256);
  }
}

function drawClockFeed(ctx, width, height, now, anomaly) {
  drawFeedBase(ctx, width, height, "#172131", "rgba(160,194,255,0.48)");
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const upsideDownFlags = new Array(26).fill(false);

  if (anomaly?.kind === "missing") {
    letters[12] = "";
  } else if (anomaly?.kind === "duplicate") {
    letters[13] = "M";
  } else if (anomaly?.kind === "letter-number") {
    letters[12] = "3";
  } else if (anomaly?.kind === "swap") {
    [letters[12], letters[13]] = [letters[13], letters[12]];
  } else if (anomaly?.kind === "upside-letter") {
    upsideDownFlags[12] = true;
  } else if (anomaly?.kind === "extra-symbol") {
    letters[12] = "*";
  }

  ctx.font = "bold 34px Cascadia Code, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(229, 239, 255, 0.94)";
  const alphaTitle = anomaly?.kind === "header-alphab3t" ? "ALPHAB3T" : "ALPHABET";
  ctx.fillText(alphaTitle, width / 2, 52);

  const cols = 7;
  const startX = 46;
  const startY = 96;
  const cellW = 60;
  const cellH = 56;
  for (let i = 0; i < 26; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    let x = startX + col * cellW;
    let y = startY + row * cellH;

    // "letter-close" nudges cell 13 (N) left so M and N appear closer
    if (anomaly?.kind === "letter-close" && i === 13) {
      x -= 6;
    }

    ctx.strokeStyle = "rgba(170, 197, 240, 0.36)";
    ctx.lineWidth = anomaly?.kind === "letter-thick-border" && i === 12 ? 4 : 2;
    ctx.strokeRect(x, y, 42, 38);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(x, y, 42, 38);

    // per-letter subtle tweaks
    let fontSize = 34;
    let fontWeight = "bold";
    let letterAlpha = 0.94;
    let letterY = y + 29;
    if (anomaly && i === 12) {
      if (anomaly.kind === "letter-larger") fontSize = 39;
      else if (anomaly.kind === "letter-thinner") fontWeight = "300";
      else if (anomaly.kind === "letter-low") letterY = y + 36;
      else if (anomaly.kind === "letter-dimmer") letterAlpha = 0.48;
    }
    ctx.font = `${fontWeight} ${fontSize}px Cascadia Code, Consolas, monospace`;
    ctx.fillStyle = `rgba(235, 242, 255, ${letterAlpha})`;

    if (upsideDownFlags[i] && letters[i]) {
      ctx.save();
      ctx.translate(x + 21, y + 19);
      ctx.rotate(Math.PI);
      ctx.fillText(letters[i], 0, 10);
      ctx.restore();
    } else {
      ctx.fillText(letters[i], x + 21, letterY);
    }
  }
}

function drawFeedOverlay(ctx, width, height, now, anomaly) {
  const channel = CHANNELS[state.currentChannel];
  drawMonitorNoise(ctx, width, height, anomaly ? 0.016 : 0.008, now);

  // Build the overlay strings, applying per-anomaly text corruption
  let chText = `CH ${state.currentChannel + 1}`;
  let stageText = `STAGE ${pad(state.stageIndex + 1)}`;
  let liveText = "LIVE";
  let traceText = "TRACE ACTIVE";
  const kind = anomaly?.kind;

  if (kind === "ch-dot") chText += ".";
  else if (kind === "ch-wrong-num") chText = "CH 8";
  else if (kind === "ch-letter") chText = "CH b";

  if (kind === "stage-stege") stageText = stageText.replace("STAGE", "STEGE");
  else if (kind === "stage-lowercase-l") stageText = stageText.replace(/1/g, "l");
  else if (kind === "stage-capital-o") stageText = stageText.replace(/0/g, "O");
  else if (kind === "stage-3") stageText = stageText.replace(/E/g, "3");

  if (kind === "live-lowercase-l") liveText = "LlVE";
  else if (kind === "live-missing") liveText = "";
  else if (kind === "live-one") liveText = "L1VE";

  if (kind === "trace-lowercase-l") traceText = "TRACE ACTlVE";
  else if (kind === "trace-no-space") traceText = "TRACEACTIVE";
  else if (kind === "trace-3") traceText = "TRACE ACTIV3";

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(249, 240, 219, 0.92)";
  ctx.font = "bold 20px Cascadia Code, Consolas, monospace";
  ctx.fillText(chText, 20, 14);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(232, 221, 194, 0.86)";
  ctx.fillText(stageText, width - 18, 14);
  if (liveText) ctx.fillText(liveText, width - 18, 36);

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(233, 223, 195, 0.9)";
  ctx.fillText(traceText, 20, height - 46);

  for (let i = 0; i < CHANNELS.length; i += 1) {
    ctx.fillStyle = i === state.currentChannel ? channel.accent : "rgba(255,255,255,0.22)";
    ctx.fillRect(20 + i * 22, height - 18, 16, 6);
  }

  drawScanlines(ctx, width, height);
}

function drawMonitorNoise(ctx, width, height, amount, now) {
  ctx.save();
  ctx.globalAlpha = amount;
  for (let i = 0; i < 72; i += 1) {
    const x = (Math.sin(i * 12.43 + now * 18.2) * 0.5 + 0.5) * width;
    const y = (Math.cos(i * 7.13 + now * 20.7) * 0.5 + 0.5) * height;
    const size = 1 + (i % 3);
    ctx.fillStyle = i % 7 === 0 ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.2)";
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function drawScanlines(ctx, width, height) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.035)";
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 1);
  }
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  ctx.strokeRect(6.5, 6.5, width - 13, height - 13);
}

function render(now) {
  filmPass.uniforms.time.value = now;
  filmPass.uniforms.flash.value = lightningStrength * 0.12 + shakeStrength * 0.08;
  composer.render();
}

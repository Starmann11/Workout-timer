export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export const MAX_NUMBER = 999;

export const DEFAULTS = {
  startNum: 1,
  endNum: 100,
  countDirection: 'up',
  countInterval: 1.0,
  gapEvery: 10,
  gapDuration: 3.0,
  preCountdownLen: 3,
  announceRest: true,
  restCountdown: true,
  voiceEnabled: true,
  beepEnabled: true,
  showAllVoices: false,
  voiceURI: '',
  voiceRate: 1.0,
  voicePitch: 0.85,
  voiceVolume: 1.0,
};

export const PRESETS = [
  {
    key: 'standard',
    name: 'Standard',
    desc: '1→100 · 1.0s · 3s rest',
    values: { startNum: 1, endNum: 100, countInterval: 1.0, gapEvery: 10, gapDuration: 3.0 },
  },
  {
    key: 'fast',
    name: 'Fast burn',
    desc: '1→100 · 0.6s · 2s rest',
    values: { startNum: 1, endNum: 100, countInterval: 0.6, gapEvery: 10, gapDuration: 2.0 },
  },
  {
    key: 'slow',
    name: 'Slow build',
    desc: '1→50 · 2.0s · 5s rest',
    values: { startNum: 1, endNum: 50, countInterval: 2.0, gapEvery: 10, gapDuration: 5.0 },
  },
  {
    key: 'hiit',
    name: 'HIIT',
    desc: '1→40 · 10s rest per 20',
    values: { startNum: 1, endNum: 40, countInterval: 1.0, gapEvery: 20, gapDuration: 10.0 },
  },
  {
    key: 'tabata',
    name: 'Tabata',
    desc: '20 reps · 10s rest',
    values: { startNum: 1, endNum: 20, countInterval: 1.0, gapEvery: 20, gapDuration: 10.0 },
  },
  {
    key: 'continuous',
    name: 'Continuous',
    desc: 'No rest · 1→100',
    values: { startNum: 1, endNum: 100, countInterval: 1.0, gapEvery: 100, gapDuration: 0 },
  },
];

const NUMERIC_LIMITS = {
  countInterval: [0.3, 5],
  gapEvery: [1, 100],
  gapDuration: [0, 30],
  preCountdownLen: [0, 10],
  voiceRate: [0.5, 2],
  voicePitch: [0.5, 2],
  voiceVolume: [0, 1],
};

const BOOLEANS = ['announceRest', 'restCountdown', 'voiceEnabled', 'beepEnabled', 'showAllVoices'];

/** Merge arbitrary (possibly corrupt) input over DEFAULTS and enforce every invariant. */
export function normalizeSettings(input) {
  const s = { ...DEFAULTS };
  const src = input && typeof input === 'object' ? input : {};

  for (const [key, [lo, hi]] of Object.entries(NUMERIC_LIMITS)) {
    const n = Number(src[key]);
    if (src[key] !== undefined && Number.isFinite(n)) s[key] = clamp(n, lo, hi);
  }
  for (const key of BOOLEANS) {
    if (typeof src[key] === 'boolean') s[key] = src[key];
  }
  if (src.countDirection === 'up' || src.countDirection === 'down') s.countDirection = src.countDirection;
  if (typeof src.voiceURI === 'string') s.voiceURI = src.voiceURI;

  const start = Number(src.startNum);
  const end = Number(src.endNum);
  if (src.startNum !== undefined && Number.isFinite(start)) s.startNum = Math.round(start);
  if (src.endNum !== undefined && Number.isFinite(end)) s.endNum = Math.round(end);
  s.startNum = clamp(s.startNum, 0, MAX_NUMBER - 1);
  s.endNum = clamp(s.endNum, s.startNum + 1, MAX_NUMBER);
  s.gapEvery = Math.round(s.gapEvery);
  s.preCountdownLen = Math.round(s.preCountdownLen);
  return s;
}

export const totalReps = (s) => Math.abs(s.endNum - s.startNum) + 1;
export const firstNumber = (s) => (s.countDirection === 'up' ? s.startNum : s.endNum);
export const lastNumber = (s) => (s.countDirection === 'up' ? s.endNum : s.startNum);
export const nextNumber = (s, n) => (s.countDirection === 'up' ? n + 1 : n - 1);
export const isLast = (s, n) => n === lastNumber(s);

/** Reps counted so far, including the one currently on screen. */
export const repsCounted = (s, n) => Math.abs(n - firstNumber(s)) + 1;

/** True when a rest period follows rep `n`. */
export function restAfter(s, n) {
  if (s.gapDuration <= 0 || isLast(s, n)) return false;
  return repsCounted(s, n) % s.gapEvery === 0;
}

/** Fractions (0..1) along the progress bar where rests occur. */
export function restMarkers(s) {
  if (s.gapDuration <= 0) return [];
  const total = totalReps(s);
  const out = [];
  for (let k = s.gapEvery; k < total; k += s.gapEvery) out.push(k / total);
  return out;
}

/**
 * Approximate seconds left in the session.
 * `completed` = reps whose count interval has fully elapsed; `inGap` = currently resting after rep `completed`.
 */
export function estimateRemainingSeconds(s, completed, inGap = false) {
  const total = totalReps(s);
  const repsLeft = Math.max(0, total - completed);
  const restsTotal = s.gapDuration > 0 ? Math.floor((total - 1) / s.gapEvery) : 0;
  const restsFinished = inGap
    ? Math.floor((completed - 1) / s.gapEvery)
    : Math.floor(completed / s.gapEvery);
  const restsLeft = Math.max(0, restsTotal - Math.max(0, restsFinished));
  return repsLeft * s.countInterval + restsLeft * s.gapDuration;
}

export function formatDuration(totalSeconds) {
  const t = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(t / 60);
  const sec = String(t % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

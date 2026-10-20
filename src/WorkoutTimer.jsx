import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Gauge,
  Hash,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Timer,
} from 'lucide-react';
import SettingsDrawer from './components/SettingsDrawer.jsx';
import { useSettings } from './hooks/useSettings.js';
import { useSpeech } from './hooks/useSpeech.js';
import { useWakeLock } from './hooks/useWakeLock.js';
import {
  estimateRemainingSeconds,
  firstNumber,
  formatDuration,
  isLast,
  lastNumber,
  nextNumber,
  repsCounted,
  restAfter,
  restMarkers,
  totalReps,
} from './lib/workout.js';

const STATUS_LABEL = {
  idle: 'ready to begin',
  pre: 'starting in',
  counting: 'in motion',
  gap: 'recover',
  done: 'session complete',
};

export default function WorkoutTimer() {
  const [settings, update, restoreDefaults] = useSettings();
  const cfgRef = useRef(settings);
  cfgRef.current = settings;

  const speech = useSpeech(settings);
  const { speak, stop: stopSpeech, beep, unlock } = speech;

  const [mode, setMode] = useState('idle'); // idle | pre | counting | gap | done
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(() => firstNumber(settings));
  const [preValue, setPreValue] = useState(settings.preCountdownLen);
  const [gapSecs, setGapSecs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const gapLeftRef = useRef(0);
  const elapsedRef = useRef(0);
  const spokenRef = useRef(null);

  useWakeLock(running);

  // Speak each cue once, even if its effect re-runs (pause/resume, StrictMode, setting tweaks).
  const announce = useCallback(
    (key, text) => {
      if (spokenRef.current === key) return;
      spokenRef.current = key;
      speak(text);
    },
    [speak],
  );

  const closeSettings = useCallback(() => setShowSettings(false), []);

  const resetSession = useCallback(() => {
    const c = cfgRef.current;
    stopSpeech();
    spokenRef.current = null;
    gapLeftRef.current = 0;
    elapsedRef.current = 0;
    setElapsed(0);
    setRunning(false);
    setMode('idle');
    setGapSecs(0);
    setPreValue(c.preCountdownLen);
    setCurrent(firstNumber(c));
  }, [stopSpeech]);

  // A different range or direction is a different workout: start over.
  useEffect(() => {
    resetSession();
  }, [settings.startNum, settings.endNum, settings.countDirection, resetSession]);

  // Pre-start countdown
  useEffect(() => {
    if (!running || mode !== 'pre') return undefined;
    announce(`pre-${preValue}`, preValue);
    const id = setTimeout(() => {
      if (preValue > 1) {
        setPreValue(preValue - 1);
      } else {
        setCurrent(firstNumber(cfgRef.current));
        setMode('counting');
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [running, mode, preValue, announce]);

  // Counting
  useEffect(() => {
    if (!running || mode !== 'counting') return undefined;
    announce(`n-${current}`, current);
    const id = setTimeout(() => {
      const c = cfgRef.current;
      if (isLast(c, current)) {
        announce('done', 'Workout complete. Great job.');
        beep(660, 320);
        setMode('done');
        setRunning(false);
        return;
      }
      if (restAfter(c, current)) {
        if (c.announceRest) announce(`rest-${current}`, 'Rest');
        beep(440, 200);
        gapLeftRef.current = c.gapDuration;
        setGapSecs(Math.ceil(c.gapDuration));
        setMode('gap');
        return;
      }
      setCurrent(nextNumber(c, current));
    }, cfgRef.current.countInterval * 1000);
    return () => clearTimeout(id);
  }, [running, mode, current, announce, beep]);

  // Rest: interval (not requestAnimationFrame) so it keeps ticking in background tabs.
  useEffect(() => {
    if (!running || mode !== 'gap') return undefined;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      gapLeftRef.current = Math.max(0, gapLeftRef.current - (now - last) / 1000);
      last = now;
      const c = cfgRef.current;
      const secs = Math.ceil(gapLeftRef.current);
      setGapSecs(secs);
      if (c.restCountdown && c.gapDuration >= 5 && secs > 0 && secs <= 3) {
        announce(`gap-${current}-${secs}`, secs);
      }
      if (gapLeftRef.current <= 0) {
        beep(1040, 200);
        setCurrent(nextNumber(c, current));
        setMode('counting');
      }
    }, 100);
    return () => clearInterval(id);
  }, [running, mode, current, announce, beep]);

  // Active (unpaused) session time
  useEffect(() => {
    if (!running) return undefined;
    const t0 = performance.now();
    const base = elapsedRef.current;
    const id = setInterval(() => {
      elapsedRef.current = base + (performance.now() - t0);
      setElapsed(elapsedRef.current);
    }, 250);
    return () => {
      clearInterval(id);
      elapsedRef.current = base + (performance.now() - t0);
    };
  }, [running]);

  const handlePlay = useCallback(() => {
    unlock();
    const c = cfgRef.current;
    if (mode === 'idle' || mode === 'done') {
      spokenRef.current = null;
      elapsedRef.current = 0;
      setElapsed(0);
      setCurrent(firstNumber(c));
      if (c.preCountdownLen > 0) {
        setPreValue(c.preCountdownLen);
        setMode('pre');
      } else {
        setMode('counting');
      }
    }
    setRunning(true);
  }, [mode, unlock]);

  const handlePause = useCallback(() => {
    stopSpeech();
    setRunning(false);
  }, [stopSpeech]);

  const toggle = useCallback(() => (running ? handlePause() : handlePlay()), [running, handlePause, handlePlay]);

  // Keyboard: Space = play/pause, R = reset, S = settings
  useEffect(() => {
    const onKey = (e) => {
      if (showSettings || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.('input, select, textarea, button, [role="dialog"]')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'r' || e.key === 'R') {
        resetSession();
      } else if (e.key === 's' || e.key === 'S') {
        setShowSettings(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSettings, toggle, resetSession]);

  // Derived values
  const s = settings;
  const total = totalReps(s);
  const counted = mode === 'idle' || mode === 'pre' ? 0 : mode === 'done' ? total : repsCounted(s, current);
  const progress = Math.min(1, Math.max(0, counted / total));
  const markers = restMarkers(s);

  const completedReps = mode === 'done' ? total : mode === 'gap' ? counted : Math.max(0, counted - 1);
  const remaining = estimateRemainingSeconds(s, mode === 'idle' || mode === 'pre' ? 0 : completedReps, mode === 'gap');

  const displayNumber =
    mode === 'pre'
      ? preValue
      : mode === 'gap'
        ? gapSecs
        : mode === 'done'
          ? lastNumber(s)
          : mode === 'idle'
            ? firstNumber(s)
            : current;

  useEffect(() => {
    document.title = running ? `${displayNumber} · Workout Timer` : 'Workout Timer';
  }, [running, displayNumber]);

  const isGap = mode === 'gap';
  const subLabel = {
    idle: 'press play to begin',
    pre: 'take a breath',
    counting: `of ${lastNumber(s)}`,
    gap: 'seconds of rest',
    done: `great work. ${total} reps in ${formatDuration(elapsed / 1000)}`,
  }[mode];

  return (
    <div className="warm-bg grain-layer relative min-h-dvh font-sans text-ink">
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10 sm:py-7">
        <div className="fade-up flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-ink">
            <div className={`h-2 w-2 rounded-full bg-rust ${running ? 'breathe' : ''}`} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.35em] text-sand">Dens · 026</span>
            <span className="font-italic text-xl" style={{ letterSpacing: '-0.01em' }}>
              Workout Timer
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="fade-up fade-up-2 btn-lift flex items-center gap-2 rounded-full border border-ink/20 bg-cream/50 px-5 py-2.5 text-sm"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Fine tune</span>
          <span className="sr-only sm:hidden">Settings</span>
        </button>
      </header>

      <main className="relative z-10 flex min-h-[calc(100dvh-200px)] flex-col items-center justify-center px-5 pb-12 pt-4 sm:pt-10">
        <div className="fade-up fade-up-1 mb-4 flex items-center gap-3 sm:mb-6">
          <div className="h-px w-10 bg-ink/25" />
          <span
            role="status"
            aria-live="polite"
            className={`text-[10px] uppercase tracking-[0.42em] ${isGap ? 'text-rust' : 'text-umber'}`}
          >
            {STATUS_LABEL[mode]}
          </span>
          <div className="h-px w-10 bg-ink/25" />
        </div>

        <div
          key={`${displayNumber}-${mode}`}
          className="num-pop relative select-none leading-none"
          aria-hidden="true"
          style={{
            fontSize: 'clamp(7rem, min(32vw, 30vh), 22rem)',
            fontWeight: isGap ? 400 : 850,
            fontStyle: isGap ? 'italic' : 'normal',
            color: isGap ? '#D4321C' : '#1C1917',
            fontFamily: isGap ? "'Instrument Serif', serif" : "'Fraunces', serif",
            letterSpacing: '-0.055em',
            fontVariationSettings: isGap ? "'opsz' 144" : "'opsz' 144, 'SOFT' 30, 'WONK' 0",
          }}
        >
          {displayNumber}
        </div>
        <span className="sr-only">Current number {displayNumber}</span>

        <div className="fade-up fade-up-2 mt-1 flex min-h-10 items-center text-center sm:mt-3">
          <span className="font-italic text-xl text-umber sm:text-2xl">{subLabel}</span>
        </div>

        <div className="fade-up fade-up-3 mt-12 w-full max-w-2xl sm:mt-16">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-sand">
            <span>rep {String(s.startNum).padStart(2, '0')}</span>
            <span>{Math.round(progress * 100)}%</span>
            <span>rep {String(s.endNum).padStart(2, '0')}</span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label="Workout progress"
            className="relative h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.08]"
          >
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${isGap ? 'bg-rust' : 'bg-ink'}`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="relative mt-1.5 h-1.5 w-full">
            {markers.map((m) => (
              <div
                key={m}
                className={`absolute top-0 h-1.5 w-px ${progress >= m ? 'bg-rust/60' : 'bg-ink/20'}`}
                style={{ left: `${m * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-sand tabular-nums">
            <span>elapsed {formatDuration(elapsed / 1000)}</span>
            <span>{mode === 'done' ? 'finished' : `≈ ${formatDuration(remaining)} left`}</span>
          </div>
        </div>

        <div className="fade-up fade-up-4 mt-10 flex items-center gap-5 sm:mt-14 sm:gap-6">
          <button
            type="button"
            onClick={resetSession}
            aria-label="Reset"
            title="Reset (R)"
            className="btn-lift flex h-14 w-14 items-center justify-center rounded-full border border-ink/20 bg-cream/40"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={running ? 'Pause' : 'Play'}
            title={running ? 'Pause (Space)' : 'Play (Space)'}
            className="btn-lift relative flex h-[84px] w-[84px] items-center justify-center rounded-full bg-ink text-paper shadow-[0_10px_30px_rgba(28,25,23,0.25)]"
          >
            {running ? (
              <Pause className="h-7 w-7" fill="#EFE8DB" />
            ) : (
              <Play className="ml-1 h-7 w-7" fill="#EFE8DB" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            title="Settings (S)"
            className="btn-lift flex h-14 w-14 items-center justify-center rounded-full border border-ink/20 bg-cream/40"
          >
            <Settings2 className="h-5 w-5" />
          </button>
        </div>
      </main>

      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 pb-8 text-[10px] uppercase tracking-[0.28em] text-sand sm:gap-x-8">
        <div className="flex items-center gap-2">
          <Gauge className="h-3.5 w-3.5" />
          <span>{s.countInterval.toFixed(1)}s per count</span>
        </div>
        <div className="hidden h-3 w-px bg-ink/20 sm:block" />
        <div className="flex items-center gap-2">
          <Timer className="h-3.5 w-3.5" />
          <span>{s.gapDuration > 0 ? `${s.gapDuration.toFixed(1)}s rest` : 'no rest'}</span>
        </div>
        <div className="hidden h-3 w-px bg-ink/20 sm:block" />
        <div className="flex items-center gap-2">
          <Hash className="h-3.5 w-3.5" />
          <span>every {s.gapEvery}</span>
        </div>
        <div className="hidden h-3 w-px bg-ink/20 sm:block" />
        <div className="flex items-center gap-2">
          {s.countDirection === 'up' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          <span>
            {s.startNum} to {s.endNum}
          </span>
        </div>
      </footer>

      {showSettings && (
        <SettingsDrawer
          settings={settings}
          update={update}
          restoreDefaults={restoreDefaults}
          speech={speech}
          onClose={closeSettings}
        />
      )}
    </div>
  );
}

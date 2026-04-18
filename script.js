(function () {
  "use strict";

  const PHASE = {
    IDLE: "idle",
    PREP: "prep",
    WORK: "work",
    REST: "rest",
    DONE: "done",
  };

  const els = {
    phase: document.getElementById("phase"),
    time: document.getElementById("time"),
    currentRound: document.getElementById("currentRound"),
    totalRounds: document.getElementById("totalRounds"),
    display: document.querySelector(".display"),
    startBtn: document.getElementById("startBtn"),
    pauseBtn: document.getElementById("pauseBtn"),
    resetBtn: document.getElementById("resetBtn"),
    workInput: document.getElementById("workInput"),
    restInput: document.getElementById("restInput"),
    roundsInput: document.getElementById("roundsInput"),
    prepInput: document.getElementById("prepInput"),
    soundToggle: document.getElementById("soundToggle"),
  };

  const state = {
    phase: PHASE.IDLE,
    remaining: 0,
    round: 0,
    totalRounds: 0,
    work: 30,
    rest: 15,
    prep: 5,
    intervalId: null,
    isRunning: false,
  };

  let audioCtx = null;

  function getAudio() {
    if (!els.soundToggle.checked) return null;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    return audioCtx;
  }

  function beep(frequency, duration, volume) {
    const ctx = getAudio();
    if (!ctx) return;
    try {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = volume;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + duration
      );
      oscillator.stop(ctx.currentTime + duration);
    } catch (err) {
      console.warn("Audio error:", err);
    }
  }

  function cueTick() {
    beep(880, 0.1, 0.2);
  }

  function cuePhase() {
    beep(440, 0.15, 0.3);
    setTimeout(() => beep(660, 0.2, 0.3), 160);
  }

  function cueDone() {
    beep(523, 0.2, 0.3);
    setTimeout(() => beep(659, 0.2, 0.3), 220);
    setTimeout(() => beep(784, 0.35, 0.3), 440);
  }

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function render() {
    els.time.textContent = formatTime(state.remaining);
    els.currentRound.textContent = state.round;
    els.totalRounds.textContent = state.totalRounds;

    const phaseLabels = {
      [PHASE.IDLE]: "Ready",
      [PHASE.PREP]: "Get Ready",
      [PHASE.WORK]: "Work",
      [PHASE.REST]: "Rest",
      [PHASE.DONE]: "Complete!",
    };
    els.phase.textContent = phaseLabels[state.phase] || "";

    els.display.classList.remove(
      "display--prep",
      "display--work",
      "display--rest",
      "display--done"
    );
    if (state.phase !== PHASE.IDLE) {
      els.display.classList.add(`display--${state.phase}`);
    }

    els.startBtn.textContent = state.isRunning
      ? "Running"
      : state.phase === PHASE.IDLE || state.phase === PHASE.DONE
      ? "Start"
      : "Resume";
    els.startBtn.disabled = state.isRunning;
    els.pauseBtn.disabled = !state.isRunning;
  }

  function readSettings() {
    const work = Math.max(1, parseInt(els.workInput.value, 10) || 0);
    const rest = Math.max(0, parseInt(els.restInput.value, 10) || 0);
    const rounds = Math.max(1, parseInt(els.roundsInput.value, 10) || 0);
    const prep = Math.max(0, parseInt(els.prepInput.value, 10) || 0);
    return { work, rest, rounds, prep };
  }

  function transition(nextPhase) {
    state.phase = nextPhase;
    if (nextPhase === PHASE.WORK) {
      state.round += 1;
      state.remaining = state.work;
    } else if (nextPhase === PHASE.REST) {
      state.remaining = state.rest;
    } else if (nextPhase === PHASE.PREP) {
      state.remaining = state.prep;
    } else if (nextPhase === PHASE.DONE) {
      state.remaining = 0;
      stopInterval();
      state.isRunning = false;
      cueDone();
    }
    if (nextPhase !== PHASE.DONE) cuePhase();
  }

  function tick() {
    state.remaining -= 1;

    if (state.remaining <= 3 && state.remaining > 0) {
      cueTick();
    }

    if (state.remaining <= 0) {
      if (state.phase === PHASE.PREP) {
        transition(PHASE.WORK);
      } else if (state.phase === PHASE.WORK) {
        if (state.round >= state.totalRounds) {
          transition(PHASE.DONE);
        } else if (state.rest > 0) {
          transition(PHASE.REST);
        } else {
          transition(PHASE.WORK);
        }
      } else if (state.phase === PHASE.REST) {
        transition(PHASE.WORK);
      }
    }

    render();
  }

  function startInterval() {
    stopInterval();
    state.intervalId = setInterval(tick, 1000);
  }

  function stopInterval() {
    if (state.intervalId !== null) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
  }

  function start() {
    if (state.isRunning) return;

    if (state.phase === PHASE.IDLE || state.phase === PHASE.DONE) {
      const settings = readSettings();
      state.work = settings.work;
      state.rest = settings.rest;
      state.prep = settings.prep;
      state.totalRounds = settings.rounds;
      state.round = 0;

      if (state.prep > 0) {
        state.phase = PHASE.PREP;
        state.remaining = state.prep;
      } else {
        state.phase = PHASE.WORK;
        state.round = 1;
        state.remaining = state.work;
      }
      cuePhase();
    }

    state.isRunning = true;
    startInterval();
    render();
  }

  function pause() {
    if (!state.isRunning) return;
    stopInterval();
    state.isRunning = false;
    render();
  }

  function reset() {
    stopInterval();
    state.phase = PHASE.IDLE;
    state.remaining = 0;
    state.round = 0;
    state.totalRounds = parseInt(els.roundsInput.value, 10) || 0;
    state.isRunning = false;
    render();
  }

  els.startBtn.addEventListener("click", start);
  els.pauseBtn.addEventListener("click", pause);
  els.resetBtn.addEventListener("click", reset);

  [els.workInput, els.restInput, els.roundsInput, els.prepInput].forEach(
    (input) => {
      input.addEventListener("change", () => {
        if (state.phase === PHASE.IDLE) {
          state.totalRounds = parseInt(els.roundsInput.value, 10) || 0;
          render();
        }
      });
    }
  );

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    if (e.code === "Space") {
      e.preventDefault();
      state.isRunning ? pause() : start();
    } else if (e.key === "r" || e.key === "R") {
      reset();
    }
  });

  state.totalRounds = parseInt(els.roundsInput.value, 10) || 0;
  render();
})();

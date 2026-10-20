# Workout Timer

A voice-guided rep counter: it counts aloud from a start number to an end number, takes a rest every N reps, and remembers your settings. Built with React, Vite, Tailwind CSS and lucide-react.

## Run it

```bash
npm install
npm run dev        # http://localhost:8080
```

In GitHub Codespaces this happens automatically: dependencies install on create, the dev server starts on attach, and port 8080 opens in the preview.

| Command           | What it does                        |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Dev server with hot reload (8080)   |
| `npm run build`   | Production build into `dist/`       |
| `npm run preview` | Serve the production build          |
| `npm test`        | Unit tests for the workout logic    |

## Features

- Presets (Standard, Fast burn, Slow build, HIIT, Tabata, Continuous) plus full control of range, direction, count interval, rest frequency/length and pre-start countdown
- Spoken counts with voice, rate, pitch and volume controls; optional beep cues and a spoken 3-2-1 at the end of longer rests
- Elapsed time and estimated time left, rest markers on the progress bar
- Settings persist between visits (localStorage)
- Keeps the screen awake while running; timers keep going in background tabs
- Keyboard: `Space` play/pause, `R` reset, `S` settings, `Esc` closes settings
- Accessible dialog, switches and sliders; respects reduced-motion

## Project layout

```
src/
  WorkoutTimer.jsx        timer engine + main screen
  components/             settings drawer and form controls
  hooks/                  useSettings, useSpeech, useWakeLock
  lib/workout.js          pure workout logic (tested in workout.test.js)
```

Speech uses the browser's Web Speech API, so available voices depend on your device. Mobile browsers only allow audio after a tap, which is why pressing Play is what enables sound.

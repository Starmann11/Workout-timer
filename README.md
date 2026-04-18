# Workout Timer

A simple, responsive HIIT-style workout timer built with vanilla HTML, CSS, and JavaScript — no frameworks required.

## Features

- Configurable **work**, **rest**, **prep**, and **round count**
- Visual phase indicator (prep / work / rest / complete)
- Audible cues at phase transitions and during the final 3-second countdown
- Keyboard shortcuts: `Space` to start/pause, `R` to reset
- Mobile-friendly responsive layout
- Zero runtime dependencies (pure browser code)

## Getting Started

### Option 1 — Open the file directly

Just open `index.html` in any modern browser.

### Option 2 — Run via local dev server (recommended for Codespaces)

```bash
npm install
npm start
```

The app will be served at <http://localhost:8080> and the port is auto-forwarded in GitHub Codespaces.

### Option 3 — GitHub Codespaces

1. Click **Code → Create codespace on main**.
2. The devcontainer runs `npm install` automatically.
3. Run `npm start` and open the forwarded port preview.

## Project Structure

```
.
├── .devcontainer/devcontainer.json   # Codespaces config
├── .vscode/                          # Editor settings & recommended extensions
├── index.html                        # App markup
├── styles.css                        # Styling
├── script.js                         # Timer logic
├── package.json                      # Dev dependencies (http-server)
└── README.md
```

## Scripts

| Command       | Description                               |
| ------------- | ----------------------------------------- |
| `npm start`   | Serve on port 8080 and open in browser    |
| `npm run dev` | Serve on port 8080 without opening        |

## License

MIT

# Desklings — Implementation Reference

## Overview

Desklings is an Electron + React + TypeScript desktop app with two windows and a system tray:

| Window | Purpose |
|---|---|
| **Settings** (`src/renderer/`) | 3-tab GUI: General, Water Reminder, Task Reminder |
| **Overlay** (`src/overlay/`) | Transparent, always-on-top strip above taskbar; hosts animated pixel-art characters |

---

## Process Architecture

```
Main Process (Node.js)
├── windows.ts       — BrowserWindow factory for both windows
├── tray.ts          — System tray icon + context menu
├── store.ts         — electron-store (writes to %APPDATA%/desklings/config.json)
├── ipc-handlers.ts  — All ipcMain.handle() / ipcMain.on() registrations
├── app-detector.ts  — Windows app detection (registry + common paths + browse dialog)
└── reminder-scheduler.ts — setInterval timers for water + task reminders

Preload: Settings  (src/preload/index.ts)   → exposes window.api
Preload: Overlay   (src/preload/overlay.ts) → exposes window.overlayApi

Renderer: Settings (src/renderer/src/App.tsx)  — React UI
Renderer: Overlay  (src/overlay/src/OverlayApp.tsx) — rAF animation loop
```

---

## IPC Channels

### Settings → Main
| Channel | What it does |
|---|---|
| `store:get` | Returns full AppStore |
| `store:set-characters` | Saves character configs, pushes to overlay |
| `store:set-water-reminder` | Saves + restarts water timer |
| `store:set-task-reminder` | Saves + restarts task check timer |
| `store:set-tasks` | Saves tasks + restarts task checker |
| `app:detect-installed` | Registry scan + common path probe → `DetectedApp[]` |
| `app:browse-exe` | Opens file picker → `string \| null` |

### Overlay → Main
| Channel | What it does |
|---|---|
| `overlay:set-ignore-mouse` | Toggle click-through (`{ ignore: boolean }`) |
| `overlay:character-clicked` | Main handles app launch or shows "not installed" dialog |
| `overlay:get-resource-path` | Returns `file://` URL to sprite in resources/ |
| `overlay:ready` | Main pushes initial config to overlay |

### Main → Overlay (push)
| Channel | Payload |
|---|---|
| `overlay:config-update` | `{ characters, waterReminder, taskReminder }` |
| `overlay:fire-water-reminder` | `{ characterId }` |
| `overlay:fire-task-reminder` | `{ task, characterId }` |

---

## Data Schema (`AppStore`)

```ts
{
  characters: CharacterConfig[]      // 6 entries (ninja/samurai/robot/android/hero/astronaut)
  waterReminder: WaterReminderConfig // interval, active, alwaysVisible, characterId
  taskReminder: TaskReminderConfig   // active, alwaysVisible, characterId
  tasks: Task[]                      // id, title, dueAt (ms), completed
}
```

Stored at: `%APPDATA%\desklings\config.json`

---

## Overlay Animation Engine

**File:** `src/overlay/src/OverlayApp.tsx`

- A single `requestAnimationFrame` loop runs at ~60fps
- Character state (position, direction, frameIndex, speaking) is kept in a `useRef` Map — never in React state — to avoid re-renders in the hot path
- React `setState` is called every 2 rAF ticks (~30fps) to sync positions to the DOM
- Characters bounce at screen edges by flipping `direction` and applying `scaleX(-1)` CSS
- Frame advances every 10 rAF ticks (~6fps walk cycle)

**Hover / click-through:**
1. Overlay starts with `setIgnoreMouseEvents(true, { forward: true })` — desktop remains usable
2. `document.pointermove` fires even in click-through mode (Windows `forward: true` behavior)
3. On hover start → IPC `overlay:set-ignore-mouse { ignore: false }` → overlay receives real clicks
4. On mouse leave → IPC `overlay:set-ignore-mouse { ignore: true }` → click-through restored

**Popup-only reminder flow:**
- Character spawned off-screen right, `direction = -1` (walks left)
- Walks to ~65% screen width, stops, shows speech bubble for 8s
- Then `direction = 1`, walks off screen right, removed from active set

---

## Character Pixel Art

**File:** `src/overlay/src/characters.ts`

6 built-in characters, each defined as:
- `palette`: 6-color array (index 0 = transparent)
- `walk`: 2 frames (10×16 pixel grid as palette-index strings)
- `idle`, `talk`: single frames

Rendered to a `<canvas>` element via `CharacterSprite.tsx`. Pixel size = 4px → rendered at 40×64px.

To add a character:
1. Add its `CharacterId` to `src/shared/ipc-types.ts`
2. Add its `CharacterDef` to `src/overlay/src/characters.ts`
3. Add a default entry in `src/main/store.ts`

---

## App Detection (Windows)

**File:** `src/main/app-detector.ts`

Three-tier approach:
1. **Registry** — `reg query HKLM/HKCU ..\Uninstall` via `execSync`
2. **Path probe** — `fs.existsSync` on ~20 hard-coded common install paths
3. **Browse** — `dialog.showOpenDialog` for manual .exe selection

Results cached in memory for the app session.

---

## Tailwind CSS

Both renderers use `@tailwindcss/vite` plugin. Dark theme base styles in:
- `src/renderer/src/assets/main.css` — settings window
- `src/overlay/src/main.css` — overlay (transparent body)

---

## Adding a New Reminder Type

1. Add IPC channel in `src/main/ipc-handlers.ts`
2. Add timer logic to `src/main/reminder-scheduler.ts`
3. Add a push channel `overlay:fire-<type>` in overlay preload + `OverlayApp.tsx`
4. Add a tab component in `src/renderer/src/components/settings/`
5. Wire it into `App.tsx`

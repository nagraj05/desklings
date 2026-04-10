import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { dialog, BrowserWindow } from 'electron'
import type { DetectedApp } from '../shared/ipc-types'

const COMMON_APP_PATHS: DetectedApp[] = [
  { name: 'Google Chrome', path: 'C:/Program Files/Google/Chrome/Application/chrome.exe' },
  { name: 'Mozilla Firefox', path: 'C:/Program Files/Mozilla Firefox/firefox.exe' },
  { name: 'Microsoft Edge', path: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' },
  { name: 'VS Code', path: 'C:/Program Files/Microsoft VS Code/Code.exe' },
  { name: 'Spotify', path: 'C:/Users/' + process.env.USERNAME + '/AppData/Roaming/Spotify/Spotify.exe' },
  { name: 'Discord', path: 'C:/Users/' + process.env.USERNAME + '/AppData/Local/Discord/app-*/Discord.exe' },
  { name: 'Slack', path: 'C:/Users/' + process.env.USERNAME + '/AppData/Local/slack/slack.exe' },
  { name: 'Notepad++', path: 'C:/Program Files/Notepad++/notepad++.exe' },
  { name: 'VLC Media Player', path: 'C:/Program Files/VideoLAN/VLC/vlc.exe' },
  { name: 'Steam', path: 'C:/Program Files (x86)/Steam/steam.exe' },
  { name: 'Zoom', path: 'C:/Users/' + process.env.USERNAME + '/AppData/Roaming/Zoom/bin/Zoom.exe' },
  { name: 'Obsidian', path: 'C:/Users/' + process.env.USERNAME + '/AppData/Local/Obsidian/Obsidian.exe' },
  { name: 'Notion', path: 'C:/Users/' + process.env.USERNAME + '/AppData/Local/Programs/Notion/Notion.exe' },
  { name: 'Figma', path: 'C:/Users/' + process.env.USERNAME + '/AppData/Local/Figma/Figma.exe' },
  { name: 'WhatsApp', path: 'C:/Users/' + process.env.USERNAME + '/AppData/Local/WhatsApp/WhatsApp.exe' },
  { name: 'Telegram', path: 'C:/Users/' + process.env.USERNAME + '/AppData/Roaming/Telegram Desktop/Telegram.exe' },
  { name: 'ChatGPT', path: 'C:/Users/' + process.env.USERNAME + '/AppData/Local/Programs/chatgpt/ChatGPT.exe' },
  { name: 'Cursor', path: 'C:/Users/' + process.env.USERNAME + '/AppData/Local/Programs/cursor/Cursor.exe' },
  { name: 'Postman', path: 'C:/Users/' + process.env.USERNAME + '/AppData/Local/Postman/Postman.exe' },
  { name: 'Windows Terminal', path: 'C:/Program Files/WindowsApps/Microsoft.WindowsTerminal_*/wt.exe' },
]

let cachedApps: DetectedApp[] | null = null

function scanRegistry(): DetectedApp[] {
  const apps: DetectedApp[] = []
  const keys = [
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  ]

  for (const key of keys) {
    try {
      const output = execSync(`reg query "${key}" /s /v DisplayName 2>nul`, {
        encoding: 'utf-8',
        timeout: 5000,
        windowsHide: true,
      })

      const locationOutput = execSync(`reg query "${key}" /s /v InstallLocation 2>nul`, {
        encoding: 'utf-8',
        timeout: 5000,
        windowsHide: true,
      })

      const nameMatches = [...output.matchAll(/DisplayName\s+REG_SZ\s+(.+)/g)]
      const locationMatches = [...locationOutput.matchAll(/InstallLocation\s+REG_SZ\s+(.+)/g)]

      for (let i = 0; i < Math.min(nameMatches.length, locationMatches.length); i++) {
        const name = nameMatches[i][1].trim()
        const location = locationMatches[i][1].trim()
        if (name && location && location.length > 3) {
          apps.push({ name, path: location })
        }
      }
    } catch {
      // Registry key not accessible, skip
    }
  }

  return apps
}

function probeCommonPaths(): DetectedApp[] {
  return COMMON_APP_PATHS.filter((app) => {
    // Skip glob patterns (contains *)
    if (app.path.includes('*')) return false
    return existsSync(app.path)
  })
}

export async function detectInstalledApps(): Promise<DetectedApp[]> {
  if (cachedApps) return cachedApps

  const registry = scanRegistry()
  const common = probeCommonPaths()

  // Merge: prefer common (exact exe paths) over registry (install dirs)
  const seen = new Set<string>()
  const merged: DetectedApp[] = []

  for (const app of [...common, ...registry]) {
    const key = app.name.toLowerCase()
    if (!seen.has(key) && app.name) {
      seen.add(key)
      merged.push(app)
    }
  }

  merged.sort((a, b) => a.name.localeCompare(b.name))
  cachedApps = merged
  return merged
}

export async function browseForApp(parentWindow: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(parentWindow, {
    title: 'Select Application',
    filters: [{ name: 'Executables', extensions: ['exe'] }],
    properties: ['openFile'],
  })
  return result.canceled ? null : result.filePaths[0]
}

import { app, shell, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createSettingsWindow, createOverlayWindow } from './windows'
import { createTray } from './tray'
import { registerIpcHandlers } from './ipc-handlers'
import { ReminderScheduler } from './reminder-scheduler'

let settingsWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let isQuitting = false

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron.desklings')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  settingsWindow = createSettingsWindow()
  overlayWindow = createOverlayWindow()

  // Allow external links from settings window to open in browser
  settingsWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const scheduler = new ReminderScheduler()
  registerIpcHandlers(settingsWindow, overlayWindow, scheduler)

  createTray(settingsWindow)

  // Mark quitting so the close handler lets the window actually close
  app.on('before-quit', () => {
    isQuitting = true
    scheduler.stopAll()
  })

  // Override close to hide-to-tray (set in windows.ts, but guard with isQuitting)
  settingsWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      settingsWindow?.hide()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      settingsWindow = createSettingsWindow()
    }
  })
})

// Don't quit when all windows are closed — app lives in tray
app.on('window-all-closed', () => {
  if (process.platform === 'darwin') app.quit()
})

import { ipcMain, shell, dialog, BrowserWindow } from 'electron'
import { store } from './store'
import { detectInstalledApps, browseForApp } from './app-detector'
import { ReminderScheduler } from './reminder-scheduler'
import type { BuddyConfig, WaterReminderConfig, TaskReminderConfig, Task } from '../shared/ipc-types'

function pushConfigToOverlay(overlayWindow: BrowserWindow): void {
  overlayWindow.webContents.send('overlay:config-update', {
    buddies: store.get('buddies'),
    waterReminder: store.get('waterReminder'),
    taskReminder: store.get('taskReminder'),
  })
}

export function registerIpcHandlers(
  settingsWindow: BrowserWindow,
  overlayWindow: BrowserWindow,
  scheduler: ReminderScheduler,
): void {
  // ── Store reads ──────────────────────────────────────────────────────────────
  ipcMain.handle('store:get', () => ({
    buddies: store.get('buddies'),
    waterReminder: store.get('waterReminder'),
    taskReminder: store.get('taskReminder'),
    tasks: store.get('tasks'),
  }))

  // ── Store writes ─────────────────────────────────────────────────────────────
  ipcMain.handle('store:set-buddies', (_, buddies: BuddyConfig[]) => {
    store.set('buddies', buddies)
    pushConfigToOverlay(overlayWindow)
  })

  ipcMain.handle('store:set-water-reminder', (_, config: WaterReminderConfig) => {
    store.set('waterReminder', config)
    scheduler.startWater(config, overlayWindow)
    pushConfigToOverlay(overlayWindow)
  })

  ipcMain.handle('store:set-task-reminder', (_, config: TaskReminderConfig) => {
    store.set('taskReminder', config)
    scheduler.startTaskCheck(store.get('tasks'), config, overlayWindow)
    pushConfigToOverlay(overlayWindow)
  })

  ipcMain.handle('store:set-tasks', (_, tasks: Task[]) => {
    store.set('tasks', tasks)
    scheduler.startTaskCheck(tasks, store.get('taskReminder'), overlayWindow)
  })

  // ── Window controls ───────────────────────────────────────────────────────────
  ipcMain.on('window:minimize', () => settingsWindow.minimize())
  ipcMain.on('window:close', () => settingsWindow.hide())

  // ── App detection ─────────────────────────────────────────────────────────────
  ipcMain.handle('app:detect-installed', () => detectInstalledApps())
  ipcMain.handle('app:browse-exe', () => browseForApp(settingsWindow))

  // ── Overlay control ───────────────────────────────────────────────────────────
  ipcMain.handle('overlay:set-ignore-mouse', (_, { ignore }: { ignore: boolean }) => {
    if (ignore) {
      overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    } else {
      overlayWindow.setIgnoreMouseEvents(false)
    }
  })

  ipcMain.on('overlay:character-clicked', async (_, { buddyId, role }) => {
    if (role !== 'general') return

    const buddies = store.get('buddies')
    const buddy = buddies.find((b) => b.id === buddyId)
    if (!buddy?.exePath) return

    const error = await shell.openPath(buddy.exePath)
    if (error) {
      const response = await dialog.showMessageBox(settingsWindow, {
        type: 'question',
        title: 'App not found',
        message: `${buddy.name} doesn\u2019t appear to be installed.`,
        detail: `Path: ${buddy.exePath}`,
        buttons: ['Browse for app', 'Maybe Later'],
        defaultId: 0,
        cancelId: 1,
      })
      if (response.response === 0) {
        const newPath = await browseForApp(settingsWindow)
        if (newPath) {
          const updated = buddies.map((b) =>
            b.id === buddyId ? { ...b, exePath: newPath } : b,
          )
          store.set('buddies', updated)
          pushConfigToOverlay(overlayWindow)
          await shell.openPath(newPath)
        }
      }
    }
  })

  ipcMain.on('overlay:ready', () => {
    pushConfigToOverlay(overlayWindow)
    const waterConfig = store.get('waterReminder')
    const taskConfig = store.get('taskReminder')
    scheduler.startWater(waterConfig, overlayWindow)
    scheduler.startTaskCheck(store.get('tasks'), taskConfig, overlayWindow)
  })
}

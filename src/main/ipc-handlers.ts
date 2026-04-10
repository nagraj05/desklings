import { ipcMain, shell, dialog, BrowserWindow } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { store } from './store'
import { detectInstalledApps, browseForApp } from './app-detector'
import { ReminderScheduler } from './reminder-scheduler'
import type { CharacterConfig, WaterReminderConfig, TaskReminderConfig, Task } from '../shared/ipc-types'

export function registerIpcHandlers(
  settingsWindow: BrowserWindow,
  overlayWindow: BrowserWindow,
  scheduler: ReminderScheduler,
): void {
  // ── Store reads ──────────────────────────────────────────────────────────────
  ipcMain.handle('store:get', () => ({
    characters: store.get('characters'),
    waterReminder: store.get('waterReminder'),
    taskReminder: store.get('taskReminder'),
    tasks: store.get('tasks'),
  }))

  // ── Store writes ─────────────────────────────────────────────────────────────
  ipcMain.handle('store:set-characters', (_, characters: CharacterConfig[]) => {
    store.set('characters', characters)
    overlayWindow.webContents.send('overlay:config-update', {
      characters,
      waterReminder: store.get('waterReminder'),
      taskReminder: store.get('taskReminder'),
    })
  })

  ipcMain.handle('store:set-water-reminder', (_, config: WaterReminderConfig) => {
    store.set('waterReminder', config)
    scheduler.startWater(config, overlayWindow)
    overlayWindow.webContents.send('overlay:config-update', {
      characters: store.get('characters'),
      waterReminder: config,
      taskReminder: store.get('taskReminder'),
    })
  })

  ipcMain.handle('store:set-task-reminder', (_, config: TaskReminderConfig) => {
    store.set('taskReminder', config)
    scheduler.startTaskCheck(store.get('tasks'), config, overlayWindow)
    overlayWindow.webContents.send('overlay:config-update', {
      characters: store.get('characters'),
      waterReminder: store.get('waterReminder'),
      taskReminder: config,
    })
  })

  ipcMain.handle('store:set-tasks', (_, tasks: Task[]) => {
    store.set('tasks', tasks)
    scheduler.startTaskCheck(tasks, store.get('taskReminder'), overlayWindow)
  })

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

  ipcMain.handle('overlay:get-resource-path', (_, characterId: string) => {
    const absPath = join(__dirname, '../../resources/characters', characterId, 'sprite.png')
    return pathToFileURL(absPath).href
  })

  ipcMain.on('overlay:character-clicked', async (_, { characterId, role }) => {
    if (role !== 'general') return

    const characters = store.get('characters')
    const char = characters.find((c) => c.id === characterId)
    if (!char?.assignedAppPath) return

    const error = await shell.openPath(char.assignedAppPath)
    if (error) {
      // App not found — show dialog
      const appName = char.name
      const response = await dialog.showMessageBox(settingsWindow, {
        type: 'question',
        title: 'App not found',
        message: `${appName} doesn't appear to be installed.`,
        detail: `Path: ${char.assignedAppPath}`,
        buttons: ['Browse for app', 'Maybe Later'],
        defaultId: 0,
        cancelId: 1,
      })
      if (response.response === 0) {
        const newPath = await browseForApp(settingsWindow)
        if (newPath) {
          const updated = characters.map((c) =>
            c.id === characterId ? { ...c, assignedAppPath: newPath } : c,
          )
          store.set('characters', updated)
          settingsWindow.webContents.send('settings:characters-updated', updated)
          await shell.openPath(newPath)
        }
      }
    }
  })

  ipcMain.on('overlay:ready', () => {
    // Push initial config to overlay once it's ready
    overlayWindow.webContents.send('overlay:config-update', {
      characters: store.get('characters'),
      waterReminder: store.get('waterReminder'),
      taskReminder: store.get('taskReminder'),
    })

    // Start schedulers
    const waterConfig = store.get('waterReminder')
    const taskConfig = store.get('taskReminder')
    scheduler.startWater(waterConfig, overlayWindow)
    scheduler.startTaskCheck(store.get('tasks'), taskConfig, overlayWindow)
  })
}

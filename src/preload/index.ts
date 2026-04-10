import { contextBridge, ipcRenderer } from 'electron'
import type { CharacterConfig, WaterReminderConfig, TaskReminderConfig, Task } from '../shared/ipc-types'

const api = {
  getStore: () => ipcRenderer.invoke('store:get'),
  setCharacters: (chars: CharacterConfig[]) => ipcRenderer.invoke('store:set-characters', chars),
  setWaterReminder: (config: WaterReminderConfig) =>
    ipcRenderer.invoke('store:set-water-reminder', config),
  setTaskReminder: (config: TaskReminderConfig) =>
    ipcRenderer.invoke('store:set-task-reminder', config),
  setTasks: (tasks: Task[]) => ipcRenderer.invoke('store:set-tasks', tasks),

  detectApps: (): Promise<import('../shared/ipc-types').DetectedApp[]> =>
    ipcRenderer.invoke('app:detect-installed'),
  browseApp: (): Promise<string | null> => ipcRenderer.invoke('app:browse-exe'),

  onCharactersUpdated: (cb: (chars: CharacterConfig[]) => void) => {
    ipcRenderer.on('settings:characters-updated', (_, chars) => cb(chars))
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.api = api
}

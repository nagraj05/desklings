import { contextBridge, ipcRenderer } from 'electron'
import type { BuddyConfig, WaterReminderConfig, TaskReminderConfig, Task } from '../shared/ipc-types'

const api = {
  getStore: () => ipcRenderer.invoke('store:get'),
  setBuddies: (buddies: BuddyConfig[]) => ipcRenderer.invoke('store:set-buddies', buddies),
  setWaterReminder: (config: WaterReminderConfig) =>
    ipcRenderer.invoke('store:set-water-reminder', config),
  setTaskReminder: (config: TaskReminderConfig) =>
    ipcRenderer.invoke('store:set-task-reminder', config),
  setTasks: (tasks: Task[]) => ipcRenderer.invoke('store:set-tasks', tasks),

  detectApps: (): Promise<import('../shared/ipc-types').DetectedApp[]> =>
    ipcRenderer.invoke('app:detect-installed'),
  browseApp: (): Promise<string | null> => ipcRenderer.invoke('app:browse-exe'),

  minimize: () => ipcRenderer.send('window:minimize'),
  closeWindow: () => ipcRenderer.send('window:close'),
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

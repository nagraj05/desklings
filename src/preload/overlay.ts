import { contextBridge, ipcRenderer } from 'electron'
import type { BuddyConfig, WaterReminderConfig, TaskReminderConfig, Task } from '../shared/ipc-types'

interface ConfigUpdatePayload {
  buddies: BuddyConfig[]
  waterReminder: WaterReminderConfig
  taskReminder: TaskReminderConfig
}

const overlayApi = {
  setIgnoreMouseEvents: (ignore: boolean) =>
    ipcRenderer.invoke('overlay:set-ignore-mouse', { ignore }),

  characterClicked: (payload: { buddyId: string; role: 'general' | 'water' | 'task' }) =>
    ipcRenderer.send('overlay:character-clicked', payload),

  sendReady: () => ipcRenderer.send('overlay:ready'),

  onConfigUpdate: (cb: (config: ConfigUpdatePayload) => void) => {
    ipcRenderer.on('overlay:config-update', (_, config) => cb(config))
  },

  onFireWaterReminder: (cb: (payload: { buddyId: string }) => void) => {
    ipcRenderer.on('overlay:fire-water-reminder', (_, payload) => cb(payload))
  },

  onFireTaskReminder: (cb: (payload: { task: Task; buddyId: string }) => void) => {
    ipcRenderer.on('overlay:fire-task-reminder', (_, payload) => cb(payload))
  },
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('overlayApi', overlayApi)
} else {
  // @ts-ignore
  window.overlayApi = overlayApi
}

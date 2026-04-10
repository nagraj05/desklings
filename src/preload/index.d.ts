import type {
  BuddyConfig,
  WaterReminderConfig,
  TaskReminderConfig,
  Task,
  DetectedApp,
  AppStore,
} from '../shared/ipc-types'

interface SettingsApi {
  getStore: () => Promise<AppStore>
  setBuddies: (buddies: BuddyConfig[]) => Promise<void>
  setWaterReminder: (config: WaterReminderConfig) => Promise<void>
  setTaskReminder: (config: TaskReminderConfig) => Promise<void>
  setTasks: (tasks: Task[]) => Promise<void>
  detectApps: () => Promise<DetectedApp[]>
  browseApp: () => Promise<string | null>
  minimize: () => void
  closeWindow: () => void
}

declare global {
  interface Window {
    api: SettingsApi
  }
}
